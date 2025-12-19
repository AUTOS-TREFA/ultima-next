/**
 * MIGRACIÓN FINAL - Con columnas específicas
 * Migra solo las columnas que sabemos que existen en desarrollo
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

// Columnas específicas para cada tabla (solo las que existen en desarrollo)
const TABLE_COLUMNS = {
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
  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`📦 ${tableName}`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

  try {
    const { count: prodCount } = await prodClient
      .from(tableName)
      .select('*', { count: 'exact', head: true });

    console.log(`📊 Producción: ${prodCount} registros`);
    console.log(`🔧 Migrando ${columns.length} columnas`);

    if (prodCount === 0) {
      console.log('⚠️  Tabla vacía');
      return { prodCount: 0, devCount: 0, inserted: 0 };
    }

    // Exportar
    console.log(`📥 Exportando...`);
    let allData = [];
    let page = 0;
    const pageSize = 1000;

    while (true) {
      const { data, error } = await prodClient
        .from(tableName)
        .select(columns.join(', '))
        .range(page * pageSize, (page + 1) * pageSize - 1)
        .order('created_at', { ascending: true });

      if (error || !data || data.length === 0) break;

      allData = allData.concat(data);
      page++;

      if (data.length < pageSize) break;
    }

    console.log(`   ${allData.length} registros exportados`);

    // Importar
    console.log(`📤 Importando...`);
    let inserted = 0;
    let skipped = 0;
    const batchSize = 100;

    for (let i = 0; i < allData.length; i += batchSize) {
      const batch = allData.slice(i, i + batchSize);

      for (const record of batch) {
        const { error } = await devClient
          .from(tableName)
          .upsert(record, { onConflict: tableName === 'bank_profiles' ? 'user_id' : 'id' });

        if (!error) {
          inserted++;
        } else if (error.code === '23505' || error.code === '23503') {
          skipped++;
        }
      }

      if ((i + batchSize) % 500 === 0) {
        console.log(`   ${Math.min(i + batchSize, allData.length)} procesados...`);
      }
    }

    const { count: devCount } = await devClient
      .from(tableName)
      .select('*', { count: 'exact', head: true });

    console.log(`✅ Completado`);
    console.log(`   Insertados: ${inserted}`);
    console.log(`   Omitidos: ${skipped}`);
    console.log(`   Total en desarrollo: ${devCount}`);

    return { prodCount, devCount, inserted, skipped };

  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    return { error: error.message };
  }
}

async function run() {
  console.log('\n╔════════════════════════════════════════════╗');
  console.log('║        🚀 MIGRACIÓN FINAL                 ║');
  console.log('╚════════════════════════════════════════════╝\n');

  const startTime = Date.now();
  const results = {};

  // Migrar en orden correcto
  for (const [table, columns] of Object.entries(TABLE_COLUMNS)) {
    results[table] = await migrateTable(table, columns);
    await new Promise(r => setTimeout(r, 1000));
  }

  const duration = ((Date.now() - startTime) / 1000 / 60).toFixed(2);

  console.log('\n╔════════════════════════════════════════════╗');
  console.log('║          📊 RESULTADO FINAL               ║');
  console.log('╚════════════════════════════════════════════╝\n');

  let totalInserted = 0;
  for (const [table, result] of Object.entries(results)) {
    if (!result.error) {
      console.log(`✅ ${table}: ${result.prodCount} → ${result.devCount} (+${result.inserted})`);
      totalInserted += result.inserted;
    } else {
      console.log(`❌ ${table}: ${result.error}`);
    }
  }

  console.log(`\n🎉 Migración completada en ${duration} minutos`);
  console.log(`📝 Total registros nuevos: ${totalInserted}\n`);
}

run().then(() => process.exit(0)).catch(err => {
  console.error('❌ Fatal:', err);
  process.exit(1);
});
