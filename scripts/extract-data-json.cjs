/**
 * Script para extraer datos de la columna JSON 'data' a columnas individuales
 *
 * Uso:
 *   node scripts/extract-data-json.cjs           # Preview (sin cambios)
 *   node scripts/extract-data-json.cjs --execute # Aplicar cambios
 *
 * Requiere: SUPABASE_SERVICE_KEY en variables de entorno
 */

const https = require('https');

const SUPABASE_URL = 'mhlztgilrmgebkyqowxz.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

// Mapeo de campos JSON -> columnas de la tabla
const FIELD_MAPPINGS = {
  // Campos de texto
  text: {
    'VIN': 'vin',
    'Auto': ['title', 'titulo'],
    'title': ['title', 'titulo'],
    'AutoMarca': 'marca',
    'Marca': 'marca',
    'AutoSubmarcaVersion': 'modelo',
    'Modelo': 'modelo',
    'autotransmision': ['autotransmision', 'transmision'],
    'transmision': ['autotransmision', 'transmision'],
    'autocombustible': ['autocombustible', 'combustible'],
    'combustible': ['autocombustible', 'combustible'],
    'AutoMotor': ['AutoMotor', 'automotor'],
    'garantia': 'garantia',
    'descripcion': ['descripcion', 'description'],
    'description': ['descripcion', 'description'],
    'slug': 'slug',
    'Ubicacion': 'ubicacion',
    'Sucursal Compra': 'ubicacion',
    'carroceria': 'carroceria',
    'ClasificacionID': 'clasificacionid',
    'Factura': 'factura',
    'reel_url': 'reel_url',
    'Reel': 'reel_url',
    'LigaBot': 'liga_bot',
    'TituloMeta': 'titulometa',
    'metadesc': 'titulometa',
    'feature_image': ['feature_image', 'feature_image_url'],
    'feature_image_url': 'feature_image_url',
    'image_link': ['feature_image', 'feature_image_url'],
    'boton_web_con_whatsapp': 'liga_boton_con_whatsapp',
    'OrdenStatus': 'ordenstatus',
  },

  // Campos numéricos
  numeric: {
    'Precio': 'precio',
    'price': 'precio',
    'AutoAno': 'autoano',
    'Año': 'autoano',
    'AutoAño': 'autoano',
    'Kilometraje Compra': 'kilometraje',
    'kilometraje': 'kilometraje',
    'kilometraje_sucursal': 'kilometraje',
    'AutoCilindros': 'cilindros',
    'enganche_minimo': 'enganchemin',
    'Enganche': 'enganchemin',
    'enganche_recomendado': 'enganche_recomendado',
    'mensualidad_minima': 'mensualidad_minima',
    'mensualidad_recomendada': 'mensualidad_recomendada',
    'PlazoMax': 'plazomax',
    'numero_duenos': 'numero_duenos',
    'Oferta': 'oferta',
  },

  // Campos booleanos
  boolean: {
    'Rezago': 'rezago',
    'Es rezago': 'rezago',
    'Separado': 'separado',
    'Consigna': 'consigna',
    'En Reparación': 'en_reparacion',
    'Con Oferta': 'con_oferta',
  }
};

function httpRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: SUPABASE_URL,
      port: 443,
      path: path,
      method: method,
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(body ? JSON.parse(body) : {});
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${body.substring(0, 200)}`));
        }
      });
    });

    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

function parseJsonData(data) {
  if (!data) return null;

  // Si data es string, intentar parsear
  if (typeof data === 'string') {
    try {
      return JSON.parse(data);
    } catch {
      return null;
    }
  }

  return data;
}

function extractFieldsFromJson(jsonData, currentRecord) {
  const updates = {};
  const parsed = parseJsonData(jsonData);

  if (!parsed || typeof parsed !== 'object') return null;

  // Extraer campos de texto
  for (const [jsonKey, colName] of Object.entries(FIELD_MAPPINGS.text)) {
    const jsonValue = parsed[jsonKey];
    if (!jsonValue) continue;

    const columns = Array.isArray(colName) ? colName : [colName];
    for (const col of columns) {
      const currentValue = currentRecord[col];
      if (!currentValue || currentValue === '') {
        updates[col] = String(jsonValue).trim();
      }
    }
  }

  // Extraer campos numéricos
  for (const [jsonKey, colName] of Object.entries(FIELD_MAPPINGS.numeric)) {
    const jsonValue = parsed[jsonKey];
    if (jsonValue === null || jsonValue === undefined) continue;

    const currentValue = currentRecord[colName];
    if (currentValue === null || currentValue === 0 || currentValue === '') {
      const num = parseFloat(String(jsonValue).replace(/[^0-9.-]/g, ''));
      if (!isNaN(num) && num > 0) {
        updates[colName] = num;
      }
    }
  }

  // Extraer campos booleanos
  for (const [jsonKey, colName] of Object.entries(FIELD_MAPPINGS.boolean)) {
    const jsonValue = parsed[jsonKey];
    if (jsonValue === null || jsonValue === undefined) continue;

    const currentValue = currentRecord[colName];
    if (currentValue === null) {
      updates[colName] = Boolean(jsonValue);
    }
  }

  return Object.keys(updates).length > 0 ? updates : null;
}

async function fetchRecordsWithData() {
  const path = '/rest/v1/inventario_cache?select=id,ordencompra,data,title,titulo,marca,modelo,precio,autoano,kilometraje,vin,slug,ordenstatus,garantia,descripcion,description,ubicacion,carroceria,clasificacionid,autotransmision,transmision,combustible,autocombustible,AutoMotor,automotor,cilindros,enganchemin,enganche_recomendado,mensualidad_minima,mensualidad_recomendada,plazomax,numero_duenos,oferta,rezago,separado,consigna,en_reparacion,con_oferta,factura,reel_url,liga_bot,titulometa,feature_image,feature_image_url,liga_boton_con_whatsapp&data=not.is.null&limit=500';

  return httpRequest('GET', path);
}

async function updateRecord(ordencompra, updates) {
  const path = `/rest/v1/inventario_cache?ordencompra=eq.${encodeURIComponent(ordencompra)}`;
  return httpRequest('PATCH', path, updates);
}

async function main() {
  if (!SUPABASE_KEY) {
    console.error('❌ SUPABASE_SERVICE_KEY no definida');
    console.log('Ejecuta: export SUPABASE_SERVICE_KEY="tu_key"');
    process.exit(1);
  }

  const executeMode = process.argv.includes('--execute');

  console.log('📖 Obteniendo registros con datos JSON...');

  try {
    const records = await fetchRecordsWithData();
    console.log(`📊 Encontrados ${records.length} registros con data JSON\n`);

    if (records.length === 0) {
      console.log('✅ No hay registros que procesar');
      return;
    }

    let needsUpdate = 0;
    let updated = 0;
    let errors = 0;
    const examples = [];

    for (const record of records) {
      const updates = extractFieldsFromJson(record.data, record);

      if (updates) {
        needsUpdate++;

        if (examples.length < 3) {
          examples.push({
            ordencompra: record.ordencompra,
            fields: Object.keys(updates),
            sample: Object.fromEntries(
              Object.entries(updates).slice(0, 5).map(([k, v]) => [k, String(v).substring(0, 50)])
            )
          });
        }

        if (executeMode) {
          try {
            await updateRecord(record.ordencompra, updates);
            updated++;
            process.stdout.write(`\r✅ ${updated}/${needsUpdate} actualizados`);
          } catch (err) {
            errors++;
            console.error(`\n❌ Error en ${record.ordencompra}: ${err.message}`);
          }

          // Rate limiting
          await new Promise(r => setTimeout(r, 50));
        }
      }
    }

    console.log('\n');
    console.log('═'.repeat(60));
    console.log('📊 RESUMEN');
    console.log('═'.repeat(60));
    console.log(`   Total registros con data JSON: ${records.length}`);
    console.log(`   Registros que necesitan actualización: ${needsUpdate}`);

    if (executeMode) {
      console.log(`   ✅ Actualizados exitosamente: ${updated}`);
      console.log(`   ❌ Errores: ${errors}`);
    }

    if (examples.length > 0 && !executeMode) {
      console.log('\n📝 Ejemplos de actualizaciones pendientes:\n');
      for (const ex of examples) {
        console.log(`   ${ex.ordencompra}:`);
        console.log(`     Campos a actualizar: ${ex.fields.join(', ')}`);
        for (const [k, v] of Object.entries(ex.sample)) {
          console.log(`       ${k}: "${v}${v.length >= 50 ? '...' : ''}"`);
        }
        console.log('');
      }
    }

    if (!executeMode) {
      console.log('\n⚠️  Modo preview. Ejecuta con --execute para aplicar cambios.');
    }

  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

main();
