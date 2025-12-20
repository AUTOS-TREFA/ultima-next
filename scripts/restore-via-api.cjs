/**
 * Restauración via Supabase REST API
 * Lee los datos del JSON parseado y actualiza via upsert
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

async function fetchSupabase(endpoint, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${SUPABASE_URL}/rest/v1/${endpoint}`);

    const options = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method: method,
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
          resolve(data ? JSON.parse(data) : {});
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function updateRecord(ordencompra, updates) {
  const url = `inventario_cache?ordencompra=eq.${encodeURIComponent(ordencompra)}`;
  return fetchSupabase(url, 'PATCH', updates);
}

async function getExistingRecord(ordencompra) {
  const url = `inventario_cache?ordencompra=eq.${encodeURIComponent(ordencompra)}&select=fotos_exterior_url,fotos_interior_url,feature_image_url,descripcion,garantia`;
  const data = await fetchSupabase(url);
  return data[0] || null;
}

function isEmptyOrNull(val) {
  return !val || val === '' || val === 'null' || val === 'NULL';
}

async function main() {
  console.log('📖 Leyendo datos del backup...');
  const backupData = JSON.parse(fs.readFileSync('/Users/marianomorales/Downloads/backup_restore_data.json', 'utf-8'));

  console.log(`📊 Total registros en backup: ${backupData.length}`);

  let updated = 0;
  let skipped = 0;
  let errors = 0;

  for (let i = 0; i < backupData.length; i++) {
    const record = backupData[i];
    if (!record.ordencompra) {
      skipped++;
      continue;
    }

    try {
      // Get current record
      const existing = await getExistingRecord(record.ordencompra);

      if (!existing) {
        skipped++;
        continue;
      }

      // Build update object only for empty fields
      const updates = {};

      if (isEmptyOrNull(existing.fotos_exterior_url) && !isEmptyOrNull(record.fotos_exterior_url)) {
        updates.fotos_exterior_url = record.fotos_exterior_url;
      }
      if (isEmptyOrNull(existing.fotos_interior_url) && !isEmptyOrNull(record.fotos_interior_url)) {
        updates.fotos_interior_url = record.fotos_interior_url;
      }
      if (isEmptyOrNull(existing.feature_image_url) && !isEmptyOrNull(record.feature_image_url)) {
        updates.feature_image_url = record.feature_image_url;
      }
      if (isEmptyOrNull(existing.descripcion) && !isEmptyOrNull(record.descripcion)) {
        updates.descripcion = record.descripcion;
      }
      if (isEmptyOrNull(existing.garantia) && !isEmptyOrNull(record.garantia)) {
        updates.garantia = record.garantia;
      }

      if (Object.keys(updates).length > 0) {
        await updateRecord(record.ordencompra, updates);
        updated++;
        process.stdout.write(`\r✅ Actualizados: ${updated} | Saltados: ${skipped} | Errores: ${errors} | Progreso: ${i+1}/${backupData.length}`);
      } else {
        skipped++;
      }

      // Rate limiting
      if (i % 10 === 0) {
        await new Promise(r => setTimeout(r, 100));
      }

    } catch (err) {
      errors++;
      console.error(`\n❌ Error en ${record.ordencompra}: ${err.message}`);
    }
  }

  console.log(`\n\n✅ Restauración completada`);
  console.log(`   - Actualizados: ${updated}`);
  console.log(`   - Saltados (sin cambios): ${skipped}`);
  console.log(`   - Errores: ${errors}`);
}

main().catch(console.error);
