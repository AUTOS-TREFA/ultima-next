/**
 * MIGRACIÓN INTELIGENTE DE PROFILES
 * Detecta columnas automáticamente y migra todos los profiles
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

async function migrateProfiles() {
  console.log('\n╔══════════════════════════════════════════════╗');
  console.log('║   🚀 MIGRACIÓN COMPLETA DE PROFILES         ║');
  console.log('╚══════════════════════════════════════════════╝\n');

  try {
    // 1. Obtener un registro de muestra de producción para detectar columnas
    console.log('🔍 Detectando esquema de producción...');
    const { data: sample, error: sampleError } = await prodClient
      .from('profiles')
      .select('*')
      .limit(1);

    if (sampleError || !sample || sample.length === 0) {
      throw new Error('No se pudo obtener muestra de profiles');
    }

    const prodColumns = Object.keys(sample[0]);
    console.log(`   ✅ ${prodColumns.length} columnas detectadas en producción`);

    // 2. Obtener columnas de desarrollo
    const { data: devSample } = await devClient
      .from('profiles')
      .select('*')
      .limit(1);

    const devColumns = devSample && devSample.length > 0 ? Object.keys(devSample[0]) : [];
    console.log(`   ✅ ${devColumns.length} columnas en desarrollo`);

    // 3. Encontrar columnas comunes
    const commonColumns = prodColumns.filter(col => devColumns.includes(col));
    const excludedCols = prodColumns.filter(col => !devColumns.includes(col));

    console.log(`   ✅ ${commonColumns.length} columnas comunes`);
    if (excludedCols.length > 0) {
      console.log(`   ⚠️  Columnas excluidas: ${excludedCols.join(', ')}`);
    }

    // 4. Contar registros
    const { count: prodCount } = await prodClient
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    console.log(`\n📊 Total en producción: ${prodCount} profiles`);

    // 5. Exportar TODOS los profiles usando solo columnas comunes
    console.log('\n📥 Exportando profiles de producción...');
    let allProfiles = [];
    let page = 0;
    const pageSize = 1000;

    while (true) {
      const { data, error } = await prodClient
        .from('profiles')
        .select(commonColumns.join(', '))
        .range(page * pageSize, (page + 1) * pageSize - 1)
        .order('created_at', { ascending: true });

      if (error || !data || data.length === 0) {
        if (error) console.error(`   ⚠️  Error: ${error.message}`);
        break;
      }

      allProfiles = allProfiles.concat(data);

      if (allProfiles.length % 1000 === 0) {
        console.log(`   ${allProfiles.length} exportados...`);
      }

      if (data.length < pageSize) break;
      page++;
    }

    console.log(`✅ Exportación completada: ${allProfiles.length} profiles`);

    // 6. Importar a desarrollo
    console.log(`\n📤 Importando a desarrollo...`);
    let inserted = 0;
    let updated = 0;
    let skipped = 0;
    const batchSize = 50;

    for (let i = 0; i < allProfiles.length; i += batchSize) {
      const batch = allProfiles.slice(i, i + batchSize);

      for (const profile of batch) {
        const { error } = await devClient
          .from('profiles')
          .upsert(profile, { onConflict: 'id' });

        if (!error) {
          inserted++;
        } else if (error.code === '23505') {
          updated++;
        } else {
          skipped++;
        }
      }

      if ((i + batchSize) % 500 === 0) {
        console.log(`   ${Math.min(i + batchSize, allProfiles.length)} procesados...`);
      }
    }

    // 7. Verificar resultado
    const { count: devCount } = await devClient
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    console.log(`\n✅ MIGRACIÓN COMPLETADA`);
    console.log(`   📊 Producción: ${prodCount} profiles`);
    console.log(`   📊 Desarrollo: ${devCount} profiles`);
    console.log(`   📝 Nuevos/Actualizados: ${inserted}`);
    console.log(`   🔄 Actualizados: ${updated}`);
    console.log(`   ⏭️  Omitidos: ${skipped}`);

    // 8. Verificar cuántos NO tienen auth
    console.log(`\n🔍 Verificando profiles sin auth.users...`);
    const { data: authCheck } = await devClient
      .from('profiles')
      .select('id')
      .limit(1000);

    let orphanCount = 0;
    if (authCheck) {
      for (const profile of authCheck) {
        const { data: authUser } = await devClient
          .from('auth.users')
          .select('id')
          .eq('id', profile.id)
          .single();

        if (!authUser) orphanCount++;
      }
    }

    if (orphanCount > 0) {
      console.log(`   ⚠️  ~${orphanCount} profiles sin auth.users (muestra de 1000)`);
      console.log(`   💡 Estos usuarios podrán reconectarse al registrarse nuevamente`);
    }

    console.log('\n🎉 ¡Migración de profiles exitosa!');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
  }
}

migrateProfiles()
  .then(() => {
    console.log('\n✅ Proceso completado\n');
    process.exit(0);
  })
  .catch(err => {
    console.error('\n❌ Fatal:', err);
    process.exit(1);
  });
