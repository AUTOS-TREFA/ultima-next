/**
 * Script para ejecutar restauración en batches
 * Divide los UPDATEs y los ejecuta via Supabase API
 */

const fs = require('fs');
const https = require('https');

const SUPABASE_URL = 'https://mhlztgilrmgebkyqowxz.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_KEY) {
  console.error('❌ Error: SUPABASE_SERVICE_KEY no está definida');
  console.log('Ejecuta: export SUPABASE_SERVICE_KEY="tu_service_key"');
  process.exit(1);
}

function executeSQL(sql) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({ query: sql });

    const options = {
      hostname: 'mhlztgilrmgebkyqowxz.supabase.co',
      path: '/rest/v1/rpc/exec_sql',
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(data);
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function main() {
  console.log('📖 Leyendo archivo SQL...');
  const content = fs.readFileSync('/Users/marianomorales/Downloads/restore_comprados.sql', 'utf-8');

  // Split by UPDATE ... WHERE ... ; (accounting for multiline descriptions)
  const statements = [];
  let current = '';
  const lines = content.split('\n');

  for (const line of lines) {
    current += line + '\n';
    if (line.trim().endsWith(';')) {
      statements.push(current.trim());
      current = '';
    }
  }

  console.log(`📊 Total statements: ${statements.length}`);

  // Output statements to separate files for manual execution
  const batchSize = 5;
  for (let i = 0; i < statements.length; i += batchSize) {
    const batch = statements.slice(i, i + batchSize);
    const batchNum = Math.floor(i / batchSize) + 1;
    const filename = `/Users/marianomorales/Downloads/restore_batch_${batchNum}.sql`;
    fs.writeFileSync(filename, batch.join('\n\n'));
  }

  const numBatches = Math.ceil(statements.length / batchSize);
  console.log(`✅ Creados ${numBatches} archivos batch`);
  console.log(`📁 Archivos: /Users/marianomorales/Downloads/restore_batch_1.sql ... restore_batch_${numBatches}.sql`);
}

main().catch(console.error);
