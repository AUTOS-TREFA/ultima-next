/**
 * Extracción simple de datos JSON del backup
 */

const fs = require('fs');
const https = require('https');

const BACKUP_FILE = '/Users/marianomorales/Downloads/inventario_cache_rows.sql';
const SUPABASE_URL = 'mhlztgilrmgebkyqowxz.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

// IDs actuales con ordenstatus='Comprado' en la DB
const CURRENT_COMPRADOS = [
  'ID001573','ID001638','ID001876','ID001947','ID001953','ID002025','ID002054','ID002063',
  'ID002067','ID002071','ID002075','ID002077','ID002080','ID002081','ID002082','ID002083',
  'ID002100','ID002103','ID002109','ID002122','ID002124','ID002128','ID002130','ID002134',
  'ID002148','ID002166','ID002171','ID002175','ID002177','ID002180','ID002184','ID002187',
  'ID002188','ID002190','ID002192','ID002204','ID002211','ID002213','ID002214','ID002217',
  'ID002219','ID002223','ID002224','ID002226','ID002228','ID002229','ID002230','ID002231',
  'ID002232','ID002233','ID002234','ID002235','ID002236','ID002237','ID002238','ID002239',
  'ID002240','ID002241','ID002242','ID002243','ID002244','ID002245','ID002246','ID002247',
  'ID002248','ID002249','ID002250','ID002251','ID002252','ID002253','ID002254','ID002255',
  'ID002256','ID002257','ID002258','ID002259','ID002260','ID002261'
];

// Campos a restaurar
const RESTORE_FIELDS = {
  'Precio': 'precio',
  'description': 'description',
  'garantia': 'garantia',
  'title': 'title',
  'TituloMeta': 'titulometa',
  'carroceria': 'carroceria',
  'Marca': 'marca',
  'Modelo': 'modelo',
  'combustible': 'combustible',
  'AutoMotor': 'AutoMotor',
  'Ubicacion': 'ubicacion',
  'Oferta': 'oferta',
  'Factura': 'factura',
  'numero_duenos': 'numero_duenos',
  'enganche_recomendado': 'enganche_recomendado',
  'mensualidad_minima': 'mensualidad_minima',
  'slug': 'slug',
  'enganche_con_bono': 'enganche_con_bono',
  'record_id': 'record_id',
  'autotransmision': 'autotransmision',
  'Transmision': 'transmision',
  'descripcion': 'descripcion',
  'AutoCilindros': 'cilindros',
  'ClasificacionID': 'clasificacionid',
  'AutoAno': 'autoano',
  'enganche_minimo': 'enganchemin',
  'PlazoMax': 'plazomax',
  'PagoMensual': 'pagomensual',
  'FormulaFinanciamiento': 'formulafinanciamiento',
  'boton_web_con_whatsapp': 'liga_boton_con_whatsapp'
};

const NUMERIC_FIELDS = ['precio', 'enganchemin', 'plazomax', 'pagomensual', 'oferta',
  'numero_duenos', 'mensualidad_minima', 'enganche_con_bono', 'autoano', 'cilindros',
  'enganche_recomendado'];

function extractJsonForId(content, ordencompra) {
  // Buscar el patrón "OrdenCompra":"IDxxxxx" en el contenido
  const searchPattern = `"OrdenCompra":"${ordencompra}"`;
  const idx = content.indexOf(searchPattern);

  if (idx === -1) return null;

  // Retroceder para encontrar el inicio del JSON {"id":
  let startIdx = idx;
  while (startIdx > 0 && content.substring(startIdx - 10, startIdx + 1).indexOf('{"id":"') === -1) {
    startIdx--;
    if (idx - startIdx > 50000) break; // Límite de búsqueda
  }

  // Ajustar al inicio del JSON
  const jsonStart = content.lastIndexOf('{"id":"', idx);
  if (jsonStart === -1 || idx - jsonStart > 50000) return null;

  // Encontrar el final del JSON balanceando llaves
  let braceCount = 0;
  let inString = false;
  let endIdx = jsonStart;

  for (let i = jsonStart; i < content.length && i < jsonStart + 100000; i++) {
    const char = content[i];
    const prevChar = i > 0 ? content[i-1] : '';

    if (char === '"' && prevChar !== '\\') {
      inString = !inString;
    } else if (!inString) {
      if (char === '{') braceCount++;
      else if (char === '}') {
        braceCount--;
        if (braceCount === 0) {
          endIdx = i + 1;
          break;
        }
      }
    }
  }

  const jsonStr = content.substring(jsonStart, endIdx);

  try {
    return JSON.parse(jsonStr);
  } catch (e) {
    // Intentar limpiar el JSON
    try {
      const cleaned = jsonStr.replace(/\\'/g, "'").replace(/\\\\/g, '\\');
      return JSON.parse(cleaned);
    } catch (e2) {
      return null;
    }
  }
}

function convertToDbFields(jsonData) {
  const dbData = {};

  for (const [jsonKey, dbKey] of Object.entries(RESTORE_FIELDS)) {
    if (jsonData[jsonKey] !== undefined && jsonData[jsonKey] !== null) {
      let value = jsonData[jsonKey];

      // Saltar valores especiales
      if (typeof value === 'object' && value.specialValue) continue;
      if (typeof value === 'object' && !Array.isArray(value)) continue;

      // Arrays a strings
      if (Array.isArray(value)) {
        value = value.filter(v => typeof v === 'string').join(', ');
        if (!value) continue;
      }

      // Conversión numérica
      if (NUMERIC_FIELDS.includes(dbKey)) {
        const num = parseFloat(value);
        if (!isNaN(num)) {
          dbData[dbKey] = num;
        }
      } else if (typeof value === 'string' && value.trim()) {
        dbData[dbKey] = value;
      }
    }
  }

  // Imágenes desde el JSON
  if (jsonData.feature_image && Array.isArray(jsonData.feature_image)) {
    dbData.feature_image_url = jsonData.feature_image[0];
  }
  if (jsonData.fotos_exterior && Array.isArray(jsonData.fotos_exterior)) {
    dbData.fotos_exterior_url = jsonData.fotos_exterior.join(', ');
  }
  if (jsonData.fotos_interior && Array.isArray(jsonData.fotos_interior)) {
    dbData.fotos_interior_url = jsonData.fotos_interior.join(', ');
  }

  return dbData;
}

async function updateViaRest(ordencompra, data) {
  return new Promise((resolve) => {
    const postData = JSON.stringify(data);
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
      let responseData = '';
      res.on('data', chunk => responseData += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ success: true });
        } else {
          resolve({ success: false, error: `HTTP ${res.statusCode}: ${responseData.substring(0, 150)}` });
        }
      });
    });

    req.on('error', err => resolve({ success: false, error: err.message }));
    req.write(postData);
    req.end();
  });
}

async function main() {
  if (!SUPABASE_KEY) {
    console.error('❌ SUPABASE_SERVICE_KEY no definida');
    process.exit(1);
  }

  console.log('📖 Leyendo backup...');
  const content = fs.readFileSync(BACKUP_FILE, 'utf-8');
  console.log(`   Tamaño: ${(content.length / 1024 / 1024).toFixed(2)} MB`);

  console.log(`\n📊 Extrayendo datos JSON para ${CURRENT_COMPRADOS.length} IDs...`);

  const records = [];
  let found = 0;
  let notFound = 0;

  for (const id of CURRENT_COMPRADOS) {
    const jsonData = extractJsonForId(content, id);
    if (jsonData) {
      const dbData = convertToDbFields(jsonData);
      if (Object.keys(dbData).length > 0) {
        records.push({ ordencompra: id, data: dbData });
        found++;
      } else {
        notFound++;
        console.log(`   ⚠️ ${id}: JSON encontrado pero sin campos útiles`);
      }
    } else {
      notFound++;
      console.log(`   ❌ ${id}: no encontrado en backup`);
    }
  }

  console.log(`\n✅ Encontrados: ${found}`);
  console.log(`❌ No encontrados: ${notFound}`);

  // Guardar preview
  fs.writeFileSync('/Users/marianomorales/Downloads/restore_data.json', JSON.stringify(records, null, 2));
  console.log(`\n💾 Datos guardados en: /Users/marianomorales/Downloads/restore_data.json`);

  if (records.length > 0) {
    const sample = records[0];
    console.log(`\n🔍 Ejemplo - ${sample.ordencompra}:`);
    Object.entries(sample.data).slice(0, 8).forEach(([k, v]) => {
      const val = typeof v === 'string' ? v.substring(0, 60) : v;
      console.log(`   ${k}: ${val}${typeof v === 'string' && v.length > 60 ? '...' : ''}`);
    });
  }

  if (!process.argv.includes('--execute')) {
    console.log('\n⚠️  Modo preview. Agrega --execute para aplicar cambios.');
    process.exit(0);
  }

  console.log('\n🚀 Iniciando restauración...\n');

  let updated = 0;
  let errors = 0;

  for (const record of records) {
    const result = await updateViaRest(record.ordencompra, record.data);

    if (result.success) {
      updated++;
      process.stdout.write(`\r✅ ${updated}/${records.length} restaurados`);
    } else {
      errors++;
      console.log(`\n❌ ${record.ordencompra}: ${result.error}`);
    }

    await new Promise(r => setTimeout(r, 100));
  }

  console.log(`\n\n✅ COMPLETADO: ${updated} restaurados, ${errors} errores`);
}

main().catch(console.error);
