/**
 * SCRIPT DE MIGRACIÓN DE DATOS
 * ============================
 * Migra datos de la base de datos de producción a la nueva base de datos
 *
 * REQUISITOS:
 * - npm install @supabase/supabase-js
 *
 * USO:
 * node migrate-data.js
 */

const { createClient } = require('@supabase/supabase-js');

// Configuración de bases de datos
const PRODUCTION = {
  url: 'https://jjepfehmuybpctdzipnu.supabase.co',
  key: process.env.SUPABASE_SERVICE_ROLE_KEY || 'TU_SERVICE_ROLE_KEY_AQUI'
};

const DEVELOPMENT = {
  url: 'https://pemgwyymodlwabaexxrb.supabase.co',
  key: process.env.SUPABASE_SERVICE_ROLE_KEY || 'TU_SERVICE_ROLE_KEY_AQUI'
};

// Crear clientes de Supabase
const prodClient = createClient(PRODUCTION.url, PRODUCTION.key);
const devClient = createClient(DEVELOPMENT.url, DEVELOPMENT.key);

// Orden de migración (respetando dependencias de foreign keys)
const MIGRATION_ORDER = [
  'profiles',
  'financing_applications',
  'bank_profiles',
  'uploaded_documents',
  'application_status_history',
  'bank_assignments',
  'bank_feedback',
  'document_upload_analytics',
  'lead_bank_assignments',
  'lead_reminders',
  'lead_tag_associations',
  'user_email_notifications',
  'consignment_listings',
  'consignment_listing_views',
  'user_vehicles_for_sale',
  'messages',
  'tracking_events',
  'user_favorites',
  'user_search_history',
  'vehicle_price_watches'
];

// Configuración de migración por tabla
const TABLE_CONFIG = {
  profiles: {
    batchSize: 100,
    conflictResolution: 'skip' // 'skip' o 'update'
  },
  financing_applications: {
    batchSize: 100,
    conflictResolution: 'skip'
  },
  bank_profiles: {
    batchSize: 200,
    conflictResolution: 'update'
  },
  uploaded_documents: {
    batchSize: 100,
    conflictResolution: 'skip'
  },
  // Configuración por defecto para otras tablas
  default: {
    batchSize: 200,
    conflictResolution: 'skip'
  }
};

/**
 * Exporta datos de una tabla desde producción
 */
async function exportTableData(tableName) {
  console.log(`\n📥 Exportando datos de: ${tableName}`);

  let allData = [];
  let page = 0;
  const pageSize = 1000;
  let hasMore = true;

  while (hasMore) {
    const from = page * pageSize;
    const to = from + pageSize - 1;

    const { data, error, count } = await prodClient
      .from(tableName)
      .select('*', { count: 'exact' })
      .range(from, to)
      .order('created_at', { ascending: true });

    if (error) {
      console.error(`❌ Error exportando ${tableName}:`, error.message);
      throw error;
    }

    if (data && data.length > 0) {
      allData = allData.concat(data);
      console.log(`   Exportados ${allData.length} de ${count} registros...`);
    }

    hasMore = data && data.length === pageSize;
    page++;
  }

  console.log(`✅ Exportación completada: ${allData.length} registros`);
  return allData;
}

/**
 * Importa datos a la nueva base de datos
 */
async function importTableData(tableName, data) {
  if (!data || data.length === 0) {
    console.log(`⚠️  No hay datos para importar en: ${tableName}`);
    return { inserted: 0, skipped: 0, errors: 0 };
  }

  console.log(`\n📤 Importando datos a: ${tableName}`);

  const config = TABLE_CONFIG[tableName] || TABLE_CONFIG.default;
  const batchSize = config.batchSize;

  let inserted = 0;
  let skipped = 0;
  let errors = 0;

  // Procesar en lotes
  for (let i = 0; i < data.length; i += batchSize) {
    const batch = data.slice(i, i + batchSize);

    try {
      if (config.conflictResolution === 'update') {
        // Insertar con upsert
        const { error } = await devClient
          .from(tableName)
          .upsert(batch, { onConflict: 'id' });

        if (error) throw error;
        inserted += batch.length;
      } else {
        // Insertar e ignorar conflictos
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
                .insert(record)
                .select();

              if (singleError) {
                if (singleError.code === '23505') {
                  skipped++;
                } else {
                  console.error(`   ❌ Error en registro:`, singleError.message);
                  errors++;
                }
              } else {
                inserted++;
              }
            }
          } else {
            throw error;
          }
        } else {
          inserted += insertedData ? insertedData.length : batch.length;
        }
      }

      const progress = Math.min(i + batchSize, data.length);
      console.log(`   Procesados ${progress} de ${data.length} registros...`);

    } catch (error) {
      console.error(`   ❌ Error en lote ${i}-${i + batchSize}:`, error.message);
      errors += batch.length;
    }
  }

  console.log(`✅ Importación completada: ${inserted} insertados, ${skipped} omitidos, ${errors} errores`);
  return { inserted, skipped, errors };
}

/**
 * Verifica la integridad de los datos migrados
 */
async function verifyMigration(tableName) {
  const { count: prodCount } = await prodClient
    .from(tableName)
    .select('*', { count: 'exact', head: true });

  const { count: devCount } = await devClient
    .from(tableName)
    .select('*', { count: 'exact', head: true });

  const percentage = prodCount > 0 ? ((devCount / prodCount) * 100).toFixed(2) : 0;

  console.log(`\n📊 Verificación ${tableName}:`);
  console.log(`   Producción: ${prodCount} registros`);
  console.log(`   Desarrollo: ${devCount} registros`);
  console.log(`   Cobertura: ${percentage}%`);

  return { prodCount, devCount, percentage };
}

/**
 * Ejecuta la migración completa
 */
async function runMigration() {
  console.log('🚀 INICIANDO MIGRACIÓN DE DATOS');
  console.log('================================\n');
  console.log(`📍 Origen: ${PRODUCTION.url}`);
  console.log(`📍 Destino: ${DEVELOPMENT.url}\n`);

  const results = {};
  const startTime = Date.now();

  for (const tableName of MIGRATION_ORDER) {
    try {
      // Exportar datos
      const data = await exportTableData(tableName);

      // Importar datos
      const importResult = await importTableData(tableName, data);

      // Verificar migración
      const verification = await verifyMigration(tableName);

      results[tableName] = {
        exported: data.length,
        ...importResult,
        ...verification
      };

    } catch (error) {
      console.error(`\n❌ Error migrando ${tableName}:`, error.message);
      results[tableName] = {
        error: error.message
      };
    }
  }

  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000 / 60).toFixed(2);

  // Reporte final
  console.log('\n\n================================');
  console.log('📋 REPORTE DE MIGRACIÓN');
  console.log('================================\n');

  let totalExported = 0;
  let totalInserted = 0;
  let totalSkipped = 0;
  let totalErrors = 0;

  for (const [table, result] of Object.entries(results)) {
    if (result.error) {
      console.log(`❌ ${table}: ERROR - ${result.error}`);
    } else {
      console.log(`✅ ${table}:`);
      console.log(`   Exportados: ${result.exported}`);
      console.log(`   Insertados: ${result.inserted}`);
      console.log(`   Omitidos: ${result.skipped}`);
      console.log(`   Errores: ${result.errors}`);
      console.log(`   Cobertura: ${result.percentage}%\n`);

      totalExported += result.exported;
      totalInserted += result.inserted;
      totalSkipped += result.skipped;
      totalErrors += result.errors;
    }
  }

  console.log('\n================================');
  console.log('📊 TOTALES');
  console.log('================================');
  console.log(`Total exportado: ${totalExported} registros`);
  console.log(`Total insertado: ${totalInserted} registros`);
  console.log(`Total omitido: ${totalSkipped} registros`);
  console.log(`Total errores: ${totalErrors} registros`);
  console.log(`Duración: ${duration} minutos\n`);
}

// Ejecutar migración
if (require.main === module) {
  runMigration()
    .then(() => {
      console.log('✅ Migración completada exitosamente!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error en migración:', error);
      process.exit(1);
    });
}

module.exports = { runMigration, exportTableData, importTableData };
