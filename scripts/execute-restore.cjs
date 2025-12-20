/**
 * Script para ejecutar la restauración en batches
 * Ejecuta los UPDATE statements del backup en grupos pequeños
 */

const fs = require('fs');
const https = require('https');

const SUPABASE_URL = 'https://mhlztgilrmgebkyqowxz.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;
const BATCH_SIZE = 5; // Ejecutar 5 statements a la vez

if (!SUPABASE_KEY) {
  console.error('❌ Error: SUPABASE_SERVICE_KEY no está definida');
  console.log('Ejecuta: export SUPABASE_SERVICE_KEY="tu_service_key"');
  process.exit(1);
}

async function executeSQL(sql) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${SUPABASE_URL}/rest/v1/rpc/execute_sql`);

    // Using direct SQL via REST API
    const postData = JSON.stringify({ query: sql });

    const options = {
      hostname: url.hostname,
      path: '/rest/v1/',
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      }
    };

    // Use pg directly instead
    const { Client } = require('pg');
    const client = new Client({
      connectionString: `postgresql://postgres.mhlztgilrmgebkyqowxz:${SUPABASE_KEY}@aws-0-us-west-1.pooler.supabase.com:6543/postgres`
    });

    client.connect()
      .then(() => client.query(sql))
      .then(result => {
        client.end();
        resolve(result);
      })
      .catch(err => {
        client.end();
        reject(err);
      });
  });
}

async function main() {
  console.log('📖 Leyendo archivo de UPDATEs...');
  const content = fs.readFileSync('/Users/marianomorales/Downloads/restore_updates.sql', 'utf-8');

  // Split by UPDATE statements (each ends with ;)
  const statements = content.split(/;\s*\n/).filter(s => s.trim().startsWith('UPDATE'));

  console.log(`📊 Total de statements: ${statements.length}`);

  let completed = 0;
  let errors = 0;

  // Execute in batches
  for (let i = 0; i < statements.length; i += BATCH_SIZE) {
    const batch = statements.slice(i, i + BATCH_SIZE);
    const batchSQL = batch.join(';\n') + ';';

    try {
      await executeSQL(batchSQL);
      completed += batch.length;
      process.stdout.write(`\r✅ Completados: ${completed}/${statements.length} (${Math.round(completed/statements.length*100)}%)`);
    } catch (err) {
      console.error(`\n❌ Error en batch ${i}: ${err.message}`);
      errors += batch.length;

      // Try individual statements
      for (const stmt of batch) {
        try {
          await executeSQL(stmt + ';');
          completed++;
        } catch (e) {
          console.error(`  - Error en statement: ${stmt.substring(0, 100)}...`);
          errors++;
        }
      }
    }

    // Small delay between batches
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log(`\n\n✅ Restauración completada`);
  console.log(`   - Exitosos: ${completed}`);
  console.log(`   - Errores: ${errors}`);
}

main().catch(console.error);
