/**
 * MIGRACIÓN DE DATOS SUPABASE
 * Migra datos de producción a desarrollo
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

// Crear clientes
const prodClient = createClient(PRODUCTION.url, PRODUCTION.key);
const devClient = createClient(DEVELOPMENT.url, DEVELOPMENT.key);

// Tablas a migrar en orden
const TABLES = [
  'profiles',
  'financing_applications',
  'bank_profiles',
  'uploaded_documents'
];

async function migrateTable(tableName) {
  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`📦 Migrando: ${tableName}`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

  try {
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

    // Exportar todos los datos
    console.log(`📥 Exportando datos...`);
    let allData = [];
    let page = 0;
    const pageSize = 1000;

    while (true) {
      const from = page * pageSize;
      const to = from + pageSize - 1;

      const { data, error } = await prodClient
        .from(tableName)
        .select('*')
        .range(from, to)
        .order('created_at', { ascending: true });

      if (error) throw error;
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
    const batchSize = 100;

    for (let i = 0; i < allData.length; i += batchSize) {
      const batch = allData.slice(i, i + batchSize);

      try {
        // Intentar insertar el lote
        const { data: insertedData, error } = await devClient
          .from(tableName)
          .insert(batch)
          .select();

        if (error) {
          // Si hay conflicto, intentar uno por uno
          if (error.code === '23505') {
            for (const record of batch) {
              const { error: singleError } = await devClient
                .from(tableName)
                .insert(record);

              if (singleError) {
                if (singleError.code === '23505') {
                  skipped++;
                } else {
                  console.error(`   ❌ Error: ${singleError.message}`);
                  errors++;
                }
              } else {
                inserted++;
              }
            }
          } else {
            console.error(`   ❌ Error en lote: ${error.message}`);
            errors += batch.length;
          }
        } else {
          inserted += insertedData ? insertedData.length : batch.length;
        }

        const progress = Math.min(i + batchSize, allData.length);
        console.log(`   Procesados ${progress} de ${allData.length} registros...`);

      } catch (err) {
        console.error(`   ❌ Error en lote ${i}-${i + batchSize}:`, err.message);
        errors += batch.length;
      }
    }

    console.log(`✅ Importación completada`);
    console.log(`   📝 Insertados: ${inserted}`);
    console.log(`   ⏭️  Omitidos: ${skipped}`);
    console.log(`   ❌ Errores: ${errors}`);

    // Verificar
    const { count: devCount } = await devClient
      .from(tableName)
      .select('*', { count: 'exact', head: true });

    console.log(`   📊 Total en desarrollo: ${devCount}`);

    return {
      exported: allData.length,
      inserted,
      skipped,
      errors,
      prodCount,
      devCount
    };

  } catch (error) {
    console.error(`❌ Error migrando ${tableName}:`, error.message);
    return { error: error.message };
  }
}

async function runMigration() {
  console.log('\n');
  console.log('╔════════════════════════════════════════════╗');
  console.log('║     🚀 MIGRACIÓN DE DATOS SUPABASE        ║');
  console.log('╚════════════════════════════════════════════╝');
  console.log('');
  console.log(`📍 Origen:  ${PRODUCTION.url}`);
  console.log(`📍 Destino: ${DEVELOPMENT.url}`);
  console.log('');

  const startTime = Date.now();
  const results = {};

  for (const table of TABLES) {
    const result = await migrateTable(table);
    results[table] = result;

    // Pequeña pausa entre tablas
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000 / 60).toFixed(2);

  // Reporte final
  console.log('\n');
  console.log('╔════════════════════════════════════════════╗');
  console.log('║        📊 REPORTE DE MIGRACIÓN            ║');
  console.log('╚════════════════════════════════════════════╝');
  console.log('');

  let totalExported = 0;
  let totalInserted = 0;
  let totalSkipped = 0;
  let totalErrors = 0;

  for (const [table, result] of Object.entries(results)) {
    if (result.error) {
      console.log(`❌ ${table}: ERROR`);
    } else {
      console.log(`✅ ${table}:`);
      console.log(`   Producción: ${result.prodCount} → Desarrollo: ${result.devCount}`);
      console.log(`   Insertados: ${result.inserted} | Omitidos: ${result.skipped} | Errores: ${result.errors}`);

      totalExported += result.exported || 0;
      totalInserted += result.inserted || 0;
      totalSkipped += result.skipped || 0;
      totalErrors += result.errors || 0;
    }
  }

  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📈 TOTALES');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`Total exportado: ${totalExported} registros`);
  console.log(`Total insertado: ${totalInserted} registros`);
  console.log(`Total omitido:   ${totalSkipped} registros`);
  console.log(`Total errores:   ${totalErrors} registros`);
  console.log(`Duración:        ${duration} minutos`);
  console.log('');
}

// Ejecutar
runMigration()
  .then(() => {
    console.log('✅ ¡Migración completada exitosamente!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error en migración:', error);
    process.exit(1);
  });
