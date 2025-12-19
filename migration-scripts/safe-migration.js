/**
 * MIGRACIÓN SEGURA CON SCHEMA MATCHING
 * Solo migra columnas que existen en ambas bases de datos
 */

const { createClient } = require('@supabase/supabase-js');

// Configuración
const PRODUCTION = {
  url: 'https://jjepfehmuybpctdzipnu.supabase.co',
  key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpqZXBmZWhtdXlicGN0ZHppcG51Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NDE5OTYwMywiZXhwIjoyMDU5Nzc1NjAzfQ.KwSFEXOrtgwgIjMVG-czB73VWQIVDahgDvTdyL5qSQo'
};

const DEVELOPMENT = {
  url: 'https://pemgwyymodlwabaexxrb.supabase.co',
  key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBlbWd3eXltb2Rsd2FiYWV4eHJiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Mjk5MTUxNiwiZXhwIjoyMDc4NTY3NTE2fQ.bHklvHfGuV00RNFO_KN4cpf1BhfhMfSrKR3TtMvaCNU'
};

const prodClient = createClient(PRODUCTION.url, PRODUCTION.key);
const devClient = createClient(DEVELOPMENT.url, DEVELOPMENT.key);

// Tablas a migrar
const TABLES = [
  'profiles',
  'financing_applications',
  'bank_profiles',
  'uploaded_documents'
];

/**
 * Obtiene las columnas de una tabla usando RPC
 */
async function getTableColumns(client, tableName) {
  const { data, error } = await client.rpc('run_sql', {
    sql: `
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = '${tableName}'
      ORDER BY ordinal_position;
    `
  });

  if (error) {
    // Si run_sql no existe, intentar con la API directa
    console.log(`   ℹ️  Usando método alternativo para obtener columnas de ${tableName}...`);

    // Obtener un registro de muestra
    const { data: sample } = await client
      .from(tableName)
      .select('*')
      .limit(1);

    if (sample && sample.length > 0) {
      return Object.keys(sample[0]);
    }

    return [];
  }

  return data.map(row => row.column_name);
}

/**
 * Encuentra columnas comunes entre dos listas
 */
function findCommonColumns(prodCols, devCols) {
  return prodCols.filter(col => devCols.includes(col));
}

/**
 * Filtra un objeto para que solo contenga las columnas especificadas
 */
function filterColumns(obj, columns) {
  const filtered = {};
  columns.forEach(col => {
    if (obj.hasOwnProperty(col)) {
      filtered[col] = obj[col];
    }
  });
  return filtered;
}

/**
 * Migra una tabla usando solo columnas comunes
 */
async function migrateTableSafe(tableName) {
  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`📦 Migrando: ${tableName}`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

  try {
    // Obtener columnas de ambas bases de datos
    console.log(`🔍 Analizando esquemas...`);
    const prodColumns = await getTableColumns(prodClient, tableName);
    const devColumns = await getTableColumns(devClient, tableName);

    const commonColumns = findCommonColumns(prodColumns, devColumns);
    const excludedColumns = prodColumns.filter(col => !devColumns.includes(col));

    console.log(`   ✅ Columnas en producción: ${prodColumns.length}`);
    console.log(`   ✅ Columnas en desarrollo: ${devColumns.length}`);
    console.log(`   ✅ Columnas comunes: ${commonColumns.length}`);

    if (excludedColumns.length > 0) {
      console.log(`   ⚠️  Columnas excluidas (no existen en desarrollo): ${excludedColumns.join(', ')}`);
    }

    // Obtener conteo de producción
    const { count: prodCount, error: prodError } = await prodClient
      .from(tableName)
      .select('*', { count: 'exact', head: true });

    if (prodError) throw prodError;
    console.log(`📊 Producción: ${prodCount} registros`);

    if (prodCount === 0) {
      console.log('⚠️  Tabla vacía, omitiendo...');
      return { exported: 0, inserted: 0, skipped: 0, errors: 0 };
    }

    // Exportar datos
    console.log(`📥 Exportando datos con columnas comunes...`);
    let allData = [];
    let page = 0;
    const pageSize = 1000;

    while (true) {
      const from = page * pageSize;
      const to = from + pageSize - 1;

      // Seleccionar solo las columnas comunes
      const { data, error } = await prodClient
        .from(tableName)
        .select(commonColumns.join(', '))
        .range(from, to)
        .order('created_at', { ascending: true });

      if (error) {
        console.error(`   ❌ Error exportando: ${error.message}`);
        break;
      }

      if (!data || data.length === 0) break;

      allData = allData.concat(data);
      console.log(`   Exportados ${allData.length} registros...`);

      if (data.length < pageSize) break;
      page++;
    }

    console.log(`✅ Exportación completada: ${allData.length} registros`);

    // Importar datos
    console.log(`📤 Importando a desarrollo...`);
    let inserted = 0;
    let skipped = 0;
    let errors = 0;
    const batchSize = 50; // Reducido para mejor manejo de errores

    for (let i = 0; i < allData.length; i += batchSize) {
      const batch = allData.slice(i, i + batchSize);

      try {
        const { data: insertedData, error } = await devClient
          .from(tableName)
          .upsert(batch, {
            onConflict: 'id',
            ignoreDuplicates: false
          })
          .select();

        if (error) {
          // Si hay error, intentar uno por uno
          for (const record of batch) {
            const { error: singleError } = await devClient
              .from(tableName)
              .upsert(record, { onConflict: 'id' });

            if (singleError) {
              if (singleError.code === '23505') {
                skipped++;
              } else if (singleError.code === '23503') {
                // Foreign key violation - omitir silenciosamente
                skipped++;
              } else {
                errors++;
              }
            } else {
              inserted++;
            }
          }
        } else {
          inserted += insertedData ? insertedData.length : batch.length;
        }

        const progress = Math.min(i + batchSize, allData.length);
        if (progress % 500 === 0 || progress === allData.length) {
          console.log(`   Procesados ${progress} de ${allData.length} registros...`);
        }

      } catch (err) {
        console.error(`   ⚠️  Error en lote ${i}:`, err.message);
        // Continuar con el siguiente lote
        errors += batch.length;
      }
    }

    console.log(`✅ Importación completada`);
    console.log(`   📝 Insertados/Actualizados: ${inserted}`);
    console.log(`   ⏭️  Omitidos (duplicados/FK): ${skipped}`);
    console.log(`   ❌ Errores: ${errors}`);

    // Verificar resultado final
    const { count: devCount } = await devClient
      .from(tableName)
      .select('*', { count: 'exact', head: true });

    console.log(`   📊 Total en desarrollo: ${devCount} registros`);

    return {
      exported: allData.length,
      inserted,
      skipped,
      errors,
      prodCount,
      devCount,
      commonColumns: commonColumns.length,
      excludedColumns: excludedColumns.length
    };

  } catch (error) {
    console.error(`❌ Error migrando ${tableName}:`, error.message);
    return { error: error.message };
  }
}

async function runSafeMigration() {
  console.log('\n');
  console.log('╔════════════════════════════════════════════╗');
  console.log('║   🛡️  MIGRACIÓN SEGURA CON SCHEMA MATCH   ║');
  console.log('╚════════════════════════════════════════════╝');
  console.log('');
  console.log(`📍 Origen:  ${PRODUCTION.url}`);
  console.log(`📍 Destino: ${DEVELOPMENT.url}`);
  console.log('');
  console.log('✅ Solo se migrarán columnas que existen en ambas BDs');
  console.log('✅ Los duplicados se omitirán automáticamente');
  console.log('✅ Las violaciones de FK se manejarán sin fallar');
  console.log('');

  const startTime = Date.now();
  const results = {};

  for (const table of TABLES) {
    const result = await migrateTableSafe(table);
    results[table] = result;

    // Pausa entre tablas
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000 / 60).toFixed(2);

  // Reporte final
  console.log('\n');
  console.log('╔════════════════════════════════════════════╗');
  console.log('║        📊 REPORTE FINAL                   ║');
  console.log('╚════════════════════════════════════════════╝');
  console.log('');

  let totalExported = 0;
  let totalInserted = 0;
  let totalSkipped = 0;
  let totalErrors = 0;

  for (const [table, result] of Object.entries(results)) {
    if (result.error) {
      console.log(`❌ ${table}: ERROR - ${result.error}`);
    } else {
      console.log(`✅ ${table}:`);
      console.log(`   Producción → Desarrollo: ${result.prodCount} → ${result.devCount}`);
      console.log(`   Insertados: ${result.inserted} | Omitidos: ${result.skipped} | Errores: ${result.errors}`);
      console.log(`   Columnas migradas: ${result.commonColumns} | Excluidas: ${result.excludedColumns}`);
      console.log('');

      totalExported += result.exported || 0;
      totalInserted += result.inserted || 0;
      totalSkipped += result.skipped || 0;
      totalErrors += result.errors || 0;
    }
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📈 TOTALES');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`Total exportado:      ${totalExported} registros`);
  console.log(`Total insertado:      ${totalInserted} registros`);
  console.log(`Total omitido:        ${totalSkipped} registros`);
  console.log(`Total errores:        ${totalErrors} registros`);
  console.log(`Duración:             ${duration} minutos`);
  console.log('');
  console.log('✅ Migración segura completada!');
  console.log('');
}

// Ejecutar
runSafeMigration()
  .then(() => {
    console.log('🎉 ¡Proceso completado exitosamente!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error en migración:', error);
    process.exit(1);
  });
