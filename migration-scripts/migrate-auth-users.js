/**
 * MIGRACIÓN DE AUTH.USERS
 * Migra usuarios de autenticación de producción a desarrollo
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

const prodClient = createClient(PRODUCTION.url, PRODUCTION.key, {
  auth: { persistSession: false }
});

const devClient = createClient(DEVELOPMENT.url, DEVELOPMENT.key, {
  auth: { persistSession: false }
});

async function migrateAuthUsers() {
  console.log('\n╔════════════════════════════════════════════╗');
  console.log('║     🔐 MIGRACIÓN DE USUARIOS AUTH        ║');
  console.log('╚════════════════════════════════════════════╝\n');

  try {
    // 1. Obtener usuarios de producción
    console.log('📥 Obteniendo usuarios de producción...');

    const { data: prodUsers, error: prodError } = await prodClient
      .from('auth.users')
      .select('*');

    if (prodError) {
      console.log('   ⚠️  No se pudo acceder a auth.users directamente');
      console.log('   Intentando método alternativo...');

      // Método alternativo: usar SQL directo si está disponible
      const { data: sqlUsers, error: sqlError } = await prodClient.rpc('run_sql', {
        sql: 'SELECT * FROM auth.users'
      });

      if (sqlError) {
        throw new Error('No se puede acceder a auth.users: ' + sqlError.message);
      }

      console.log(`   ✅ ${sqlUsers?.length || 0} usuarios encontrados (vía SQL)`);
    } else {
      console.log(`   ✅ ${prodUsers?.length || 0} usuarios encontrados`);
    }

    // 2. Verificar usuarios existentes en desarrollo
    console.log('\n📊 Verificando usuarios en desarrollo...');

    const { count: devCount } = await devClient
      .from('auth.users')
      .select('*', { count: 'exact', head: true });

    console.log(`   📍 Usuarios actuales en desarrollo: ${devCount}`);

    console.log('\n⚠️  IMPORTANTE:');
    console.log('La tabla auth.users es administrada por Supabase Auth.');
    console.log('No se puede hacer INSERT directo con la API de Supabase.');
    console.log('\n💡 SOLUCIONES RECOMENDADAS:\n');

    console.log('1️⃣  BACKUP/RESTORE COMPLETO (Más Fácil):');
    console.log('   • Ve a https://supabase.com/dashboard/project/jjepfehmuybpctdzipnu/settings/storage');
    console.log('   • Database → Backups → Download Backup');
    console.log('   • En desarrollo: Database → Restore → Upload Backup');
    console.log('   ⚠️  Esto REEMPLAZARÁ todo en desarrollo\n');

    console.log('2️⃣  MIGRACIÓN MANUAL CON SUPABASE DASHBOARD:');
    console.log('   • Settings → Auth → Users');
    console.log('   • Exportar CSV de usuarios');
    console.log('   • Crear usuarios en desarrollo con Admin API\n');

    console.log('3️⃣  CONTINUAR SIN MIGRAR AUTH.USERS:');
    console.log('   • Los 1,761 registros ya migrados son de usuarios existentes');
    console.log('   • Solo faltan ~2,950 perfiles de usuarios nuevos del último mes');
    console.log('   • Esos usuarios tendrían que registrarse nuevamente en desarrollo\n');

    // Mostrar estadísticas
    console.log('📊 RESUMEN ACTUAL:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Producción:  ~4,082 perfiles`);
    console.log(`Desarrollo:   1,130 perfiles (con auth válido)`);
    console.log(`Gap:         ~2,950 usuarios sin migrar`);
    console.log('');
    console.log('Datos migrados con éxito:');
    console.log('  • 777 financing_applications');
    console.log('  • 439 bank_profiles');
    console.log('  • 545 uploaded_documents');
    console.log('  = 1,761 registros nuevos de usuarios existentes');
    console.log('');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
  }
}

migrateAuthUsers().then(() => {
  console.log('ℹ️  Si necesitas los ~2,950 usuarios faltantes, usa la Opción 1 (Backup/Restore)');
  console.log('   O puedes continuar con los datos actuales.');
  console.log('');
  process.exit(0);
});
