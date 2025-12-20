/**
 * Ejecutar todos los UPDATEs de restauración via Supabase REST API
 */

const fs = require('fs');
const https = require('https');

const SUPABASE_URL = 'mhlztgilrmgebkyqowxz.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_KEY) {
  console.error('❌ SUPABASE_SERVICE_KEY no definida');
  console.log('Ejecuta: export SUPABASE_SERVICE_KEY="tu_key"');
  process.exit(1);
}

function executeSQL(sql) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({ query: sql });

    const options = {
      hostname: SUPABASE_URL,
      path: '/rest/v1/rpc/execute_raw_sql',
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ success: true });
        } else if (res.statusCode === 404) {
          // RPC no existe, intentar con pg_query
          resolve({ success: false, error: 'RPC not found' });
        } else {
          resolve({ success: false, error: `HTTP ${res.statusCode}: ${data.substring(0, 200)}` });
        }
      });
    });

    req.on('error', err => resolve({ success: false, error: err.message }));
    req.write(postData);
    req.end();
  });
}

async function updateViaRest(ordencompra, updates) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(updates);
    const path = `/rest/v1/inventario_cache?ordencompra=eq.${encodeURIComponent(ordencompra)}`;

    const options = {
      hostname: SUPABASE_URL,
      path: path,
      method: 'PATCH',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ success: true });
        } else {
          resolve({ success: false, error: `HTTP ${res.statusCode}: ${data.substring(0, 100)}` });
        }
      });
    });

    req.on('error', err => resolve({ success: false, error: err.message }));
    req.write(postData);
    req.end();
  });
}

async function main() {
  console.log('📖 Leyendo UPDATEs...');

  // Leer el backup de comprados
  const backup = JSON.parse(fs.readFileSync('/Users/marianomorales/Downloads/backup_comprados.json', 'utf-8'));

  console.log(`📊 Total registros: ${backup.length}`);

  let updated = 0;
  let skipped = 0;
  let errors = 0;

  for (let i = 0; i < backup.length; i++) {
    const record = backup[i];
    if (!record.ordencompra) {
      skipped++;
      continue;
    }

    // Solo actualizar si hay descripcion o feature_image_url
    const updates = {};
    if (record.descripcion && record.descripcion !== 'null') {
      updates.descripcion = record.descripcion;
    }
    if (record.feature_image_url && record.feature_image_url !== 'null') {
      updates.feature_image_url = record.feature_image_url;
    }

    if (Object.keys(updates).length === 0) {
      skipped++;
      continue;
    }

    const result = await updateViaRest(record.ordencompra, updates);

    if (result.success) {
      updated++;
      process.stdout.write(`\r✅ ${updated}/${backup.length} actualizados`);
    } else {
      errors++;
      console.log(`\n❌ ${record.ordencompra}: ${result.error}`);
    }

    // Pequeño delay
    await new Promise(r => setTimeout(r, 50));
  }

  console.log(`\n\n✅ Completado: ${updated} actualizados, ${skipped} saltados, ${errors} errores`);
}

main().catch(console.error);
