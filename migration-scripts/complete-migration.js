/**
 * MIGRACIÓN COMPLETA - TODOS LOS DATOS
 * Migra todos los profiles y datos relacionados, incluso sin auth.users
 */

const { createClient } = require('@supabase/supabase-js');

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

// Columnas para cada tabla
const TABLES = {
  profiles: [
    'id', 'updated_at', 'role', 'first_name', 'last_name', 'mother_last_name',
    'email', 'phone', 'birth_date', 'homoclave', 'fiscal_situation', 'civil_status',
    'gender', 'how_did_you_know', 'address', 'colony', 'city', 'state', 'zip_code',
    'rfc', 'contactado', 'asesor_asignado_id', 'source', 'tags',
    'asesor_autorizado_acceso', 'last_assigned_at', 'has_completed_onboarding',
    'metadata', 'ordencompra', 'picture_url', 'sucursal', 'website', 'created_at',
    'lead_source', 'last_sign_in_at', 'rfdm', 'utm_source', 'utm_medium',
    'utm_campaign', 'utm_term', 'utm_content', 'referrer', 'landing_page',
    'first_visit_at', 'spouse_name', 'kommo_data', 'kommo_last_synced',
    'cellphone_company', 'actualizado', 'fbclid', 'phone_verified'
  ],
  financing_applications: [
    'id', 'user_id', 'status', 'car_info', 'personal_info_snapshot',
    'application_data', 'selected_banks', 'created_at', 'updated_at',
    'is_complete', 'public_upload_token', 'token_expires_at'
  ],
  bank_profiles: [
    'user_id', 'respuestas', 'banco_recomendado', 'banco_segunda_opcion',
    'is_complete', 'created_at', 'updated_at'
  ],
  uploaded_documents: [
    'id', 'user_id', 'application_id', 'document_type', 'file_name',
    'file_path', 'file_size', 'content_type', 'status', 'created_at'
  ]
};

async function migrateTable(tableName, columns) {
  console.log(`\n${'━'.repeat(60)}`);
  console.log(`📦 ${tableName.toUpperCase()}`);
  console.log('━'.repeat(60));

  try {
    // Contar en producción
    const { count: prodCount, error: countError } = await prodClient
      .from(tableName)
      .select('*', { count: 'exact', head: true });

    if (countError) throw countError;
    console.log(`📊 Producción: ${prodCount} registros`);

    if (prodCount === 0) {
      console.log('⚠️  Tabla vacía');
      return { prodCount: 0, inserted: 0, skipped: 0 };
    }

    // Exportar TODOS los datos
    console.log(`📥 Exportando todos los registros...`);
    let allData = [];
    let page = 0;
    const pageSize = 1000;

    while (true) {
      const from = page * pageSize;
      const to = from + pageSize - 1;

      const { data, error } = await prodClient
        .from(tableName)
        .select(columns.join(', '))
        .range(from, to)
        .order('created_at', { ascending: true });

      if (error) {
        console.error(`   ❌ Error exportando: ${error.message}`);
        break;
      }

      if (!data || data.length === 0) break;

      allData = allData.concat(data);

      if (allData.length % 1000 === 0) {
        console.log(`   ${allData.length} registros exportados...`);
      }

      if (data.length < pageSize) break;
      page++;
    }

    console.log(`✅ Exportación completada: ${allData.length} registros`);

    // Importar datos
    console.log(`📤 Importando a desarrollo...`);
    let inserted = 0;
    let updated = 0;
    let skipped = 0;
    let errors = 0;
    const batchSize = 100;

    for (let i = 0; i < allData.length; i += batchSize) {
      const batch = allData.slice(i, i + batchSize);

      try {
        // Usar upsert para insertar o actualizar
        const { data: result, error } = await devClient
          .from(tableName)
          .upsert(batch, {
            onConflict: tableName === 'bank_profiles' ? 'user_id' : 'id',
            ignoreDuplicates: false
          })
          .select();

        if (error) {
          // Si hay error en el lote, intentar uno por uno
          for (const record of batch) {
            const { error: singleError } = await devClient
              .from(tableName)
              .upsert(record, {
                onConflict: tableName === 'bank_profiles' ? 'user_id' : 'id'
              });

            if (!singleError) {
              inserted++;
            } else if (singleError.code === '23505') {
              skipped++;
            } else if (singleError.code === '23503') {
              // Foreign key violation - omitir
              skipped++;
            } else {
              errors++;
            }
          }
        } else {
          inserted += batch.length;
        }

        if ((i + batchSize) % 1000 === 0) {
          console.log(`   ${Math.min(i + batchSize, allData.length)} procesados...`);
        }

      } catch (err) {
        console.error(`   ⚠️  Error en lote: ${err.message}`);
        errors += batch.length;
      }
    }

    // Verificar resultado
    const { count: devCount } = await devClient
      .from(tableName)
      .select('*', { count: 'exact', head: true });

    console.log(`\n✅ COMPLETADO`);
    console.log(`   📝 Insertados/Actualizados: ${inserted}`);
    console.log(`   ⏭️  Omitidos: ${skipped}`);
    console.log(`   ❌ Errores: ${errors}`);
    console.log(`   📊 Total en desarrollo: ${devCount}`);

    return { prodCount, devCount, inserted, skipped, errors };

  } catch (error) {
    console.error(`\n❌ Error fatal: ${error.message}`);
    return { error: error.message };
  }
}

async function run() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║          🚀 MIGRACIÓN COMPLETA DE DATOS                   ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log('');
  console.log('📍 Origen:  Producción (jjepfehmuybpctdzipnu)');
  console.log('📍 Destino: Desarrollo (pemgwyymodlwabaexxrb)');
  console.log('');
  console.log('✅ Se migrarán TODOS los profiles y datos relacionados');
  console.log('✅ Los perfiles sin auth.users se podrán reconectar al registrarse');
  console.log('');

  const startTime = Date.now();
  const results = {};

  // Migrar en orden: primero profiles, luego datos dependientes
  for (const [table, columns] of Object.entries(TABLES)) {
    results[table] = await migrateTable(table, columns);
    await new Promise(r => setTimeout(r, 2000)); // Pausa entre tablas
  }

  const duration = ((Date.now() - startTime) / 1000 / 60).toFixed(2);

  // Reporte final
  console.log('\n\n╔════════════════════════════════════════════════════════════╗');
  console.log('║              📊 REPORTE FINAL                             ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  let totalInserted = 0;
  let totalSkipped = 0;
  let totalErrors = 0;

  for (const [table, result] of Object.entries(results)) {
    if (result.error) {
      console.log(`❌ ${table}: ERROR - ${result.error}`);
    } else {
      console.log(`✅ ${table}:`);
      console.log(`   Producción → Desarrollo: ${result.prodCount} → ${result.devCount}`);
      console.log(`   Nuevos: ${result.inserted} | Omitidos: ${result.skipped} | Errores: ${result.errors}`);
      console.log('');

      totalInserted += result.inserted || 0;
      totalSkipped += result.skipped || 0;
      totalErrors += result.errors || 0;
    }
  }

  console.log('━'.repeat(60));
  console.log('📈 TOTALES');
  console.log('━'.repeat(60));
  console.log(`Total insertado:  ${totalInserted} registros`);
  console.log(`Total omitido:    ${totalSkipped} registros`);
  console.log(`Total errores:    ${totalErrors} registros`);
  console.log(`Duración:         ${duration} minutos`);
  console.log('');

  // Verificar perfiles sin auth
  console.log('🔍 Verificando perfiles sin auth.users...');
  const { data: orphans } = await devClient.rpc('run_sql', {
    sql: `
      SELECT COUNT(*) as count
      FROM profiles p
      LEFT JOIN auth.users a ON p.id = a.id
      WHERE a.id IS NULL;
    `
  }).catch(() => ({ data: null }));

  if (orphans && orphans.length > 0) {
    const orphanCount = orphans[0].count;
    console.log(`   ⚠️  ${orphanCount} perfiles sin auth.users (se reconectarán al registrarse)`);
  }

  console.log('\n🎉 ¡Migración completa exitosa!');
  console.log('');
  console.log('📝 PRÓXIMOS PASOS:');
  console.log('1. Verificar que los datos se ven correctos en el dashboard');
  console.log('2. Los usuarios sin auth tendrán que registrarse nuevamente');
  console.log('3. Al registrarse con el mismo email, se vinculará su perfil existente');
  console.log('');
}

run()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('\n❌ Error fatal:', err);
    process.exit(1);
  });
