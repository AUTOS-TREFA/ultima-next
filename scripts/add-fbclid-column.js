/**
 * Script para agregar la columna fbclid a la tabla profiles
 * Este script aplica la migración directamente usando el Supabase service role key
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Leer las variables de entorno del .env.local
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY no están configuradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function addFbclidColumn() {
  console.log('🔧 Agregando columna fbclid a la tabla profiles...\n');

  // Leer el archivo de migración
  const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '20251209000001_add_fbclid_to_profiles.sql');
  const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

  console.log('📝 SQL a ejecutar:');
  console.log(migrationSQL);
  console.log('\n');

  try {
    // Ejecutar la migración
    const { data, error } = await supabase.rpc('exec_sql', {
      sql_query: migrationSQL
    });

    if (error) {
      // Si la función exec_sql no existe, intentar ejecutar directamente
      if (error.code === '42883') {
        console.log('⚠️  La función exec_sql no existe, intentando método alternativo...\n');

        // Ejecutar cada comando SQL por separado
        const statements = migrationSQL
          .split(';')
          .map(s => s.trim())
          .filter(s => s.length > 0 && !s.startsWith('--'));

        for (const statement of statements) {
          console.log(`Ejecutando: ${statement.substring(0, 80)}...`);
          const { error: stmtError } = await supabase.rpc('exec_sql', {
            sql: statement
          });

          if (stmtError) {
            // Si falla, probablemente ya existe la columna
            console.log(`⚠️  ${stmtError.message}`);
          } else {
            console.log('✅ Ejecutado exitosamente');
          }
        }
      } else {
        throw error;
      }
    } else {
      console.log('✅ Migración aplicada exitosamente');
      console.log('Resultado:', data);
    }

    // Verificar que la columna se agregó correctamente
    console.log('\n🔍 Verificando que la columna fbclid existe...');
    const { data: columns, error: checkError } = await supabase
      .from('profiles')
      .select('fbclid')
      .limit(1);

    if (checkError) {
      console.error('❌ Error al verificar la columna:', checkError);
      process.exit(1);
    }

    console.log('✅ Columna fbclid verificada correctamente');
    console.log('\n✨ Migración completada exitosamente!');
    console.log('\n📋 Próximos pasos:');
    console.log('   1. Probar el registro de usuario');
    console.log('   2. Verificar que el fbclid se guarda correctamente');

  } catch (error) {
    console.error('❌ Error al aplicar la migración:', error);
    process.exit(1);
  }
}

addFbclidColumn();
