/**
 * Restauración SIMPLE de Comprados - Extrae datos directamente por regex
 */

const fs = require('fs');
const https = require('https');

const BACKUP_FILE = '/Users/marianomorales/Downloads/inventario_cache_bk.sql';
const SUPABASE_URL = 'mhlztgilrmgebkyqowxz.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

// Campos que queremos restaurar (índice en el INSERT)
const COLUMN_MAP = {
  1: 'ordencompra',
  2: 'precio',
  3: 'ordenstatus',
  4: 'description',
  5: 'garantia',
  6: 'enganchemin',
  7: 'plazomax',
  8: 'pagomensual',
  9: 'title',
  10: 'titulometa',
  11: 'carroceria',
  14: 'marca',
  15: 'modelo',
  17: 'combustible',
  18: 'AutoMotor',
  21: 'ubicacion',
  24: 'vin',
  25: 'feature_image',
  27: 'oferta',
  28: 'factura',
  29: 'numero_duenos',
  32: 'enganche_recomendado',
  33: 'mensualidad_recomendada',
  34: 'mensualidad_minima',
  35: 'slug',
  36: 'enganche_con_bono',
  37: 'liga_boton_con_whatsapp',
  38: 'record_id',
  39: 'fotos_interior_url',
  40: 'fotos_exterior_url',
  41: 'feature_image_url',
  42: 'autotransmision',
  43: 'descripcion'
};

const NUMERIC_FIELDS = ['precio', 'enganchemin', 'plazomax', 'pagomensual', 'oferta',
  'numero_duenos', 'mensualidad_recomendada', 'mensualidad_minima', 'enganche_con_bono'];

// Lista de IDs a restaurar
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

function extractValue(str, startPos) {
  let pos = startPos;
  let value = '';
  let inString = false;
  let depth = 0;

  // Skip whitespace
  while (pos < str.length && (str[pos] === ' ' || str[pos] === '\n' || str[pos] === '\t')) pos++;

  if (str[pos] === "'") {
    // String value
    inString = true;
    pos++;
    while (pos < str.length) {
      if (str[pos] === "'" && str[pos + 1] === "'") {
        // Escaped quote
        value += "'";
        pos += 2;
      } else if (str[pos] === "'") {
        // End of string
        pos++;
        break;
      } else {
        value += str[pos];
        pos++;
      }
    }
    return { value, endPos: pos };
  } else if (str.substring(pos, pos + 4) === 'null') {
    return { value: null, endPos: pos + 4 };
  } else if (str.substring(pos, pos + 4) === 'NULL') {
    return { value: null, endPos: pos + 4 };
  } else {
    // Number or other value
    while (pos < str.length && str[pos] !== ',' && str[pos] !== ')') {
      value += str[pos];
      pos++;
    }
    return { value: value.trim() || null, endPos: pos };
  }
}

function parseRecordByOrdencompra(content, ordencompra) {
  // Find the ordencompra in the content - search from END to START
  const searchPattern = `'${ordencompra}'`;
  let searchStart = content.length;

  while (true) {
    const idx = content.lastIndexOf(searchPattern, searchStart);
    if (idx === -1) return null;

    // Look backward to find the start of this record (the opening parenthesis)
    let recordStart = idx;
    let parenCount = 0;
    let inStr = false;

    for (let i = idx; i >= 0 && i > idx - 500; i--) {
      const c = content[i];
      if (c === "'" && content[i-1] !== "'") {
        inStr = !inStr;
      }
      if (!inStr) {
        if (c === ')') parenCount++;
        else if (c === '(') {
          if (parenCount === 0) {
            recordStart = i;
            break;
          }
          parenCount--;
        }
      }
    }

    // Now parse values from recordStart
    let pos = recordStart + 1;
    const values = [];
    let valueIdx = 0;

    while (pos < content.length && valueIdx < 50) {
      // Skip whitespace
      while (pos < content.length && (content[pos] === ' ' || content[pos] === '\n')) pos++;

      const result = extractValue(content, pos);
      values.push(result.value);
      pos = result.endPos;
      valueIdx++;

      // Skip comma or end
      while (pos < content.length && (content[pos] === ' ' || content[pos] === '\n')) pos++;
      if (content[pos] === ',') {
        pos++;
      } else if (content[pos] === ')') {
        break;
      }
    }

    // Check if this is the right record (ordencompra should be at index 1)
    if (values[1] === ordencompra) {
      // Build object from values
      const obj = { ordencompra };

      for (const [idxStr, fieldName] of Object.entries(COLUMN_MAP)) {
        const idx = parseInt(idxStr);
        if (idx === 1) continue; // Skip ordencompra, already set

        let val = values[idx];
        if (val === null || val === undefined || val === '' || val === 'null') continue;

        if (NUMERIC_FIELDS.includes(fieldName)) {
          const num = parseFloat(val);
          if (!isNaN(num)) obj[fieldName] = num;
        } else {
          obj[fieldName] = val;
        }
      }

      return obj;
    }

    // Not the right record, continue searching backwards
    searchStart = idx - 1;
  }
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
          resolve({ success: false, error: `HTTP ${res.statusCode}: ${responseData.substring(0, 100)}` });
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

  console.log(`\n📊 Extrayendo datos para ${CURRENT_COMPRADOS.length} IDs...`);

  const records = [];
  let found = 0;
  let notFound = 0;
  const missingIds = [];

  for (const id of CURRENT_COMPRADOS) {
    const data = parseRecordByOrdencompra(content, id);
    if (data && Object.keys(data).length > 1) {
      records.push(data);
      found++;
    } else {
      notFound++;
      missingIds.push(id);
    }
  }

  console.log(`\n✅ Encontrados: ${found}`);
  console.log(`❌ No encontrados: ${notFound}`);
  if (missingIds.length > 0 && missingIds.length <= 20) {
    console.log(`   IDs no encontrados: ${missingIds.join(', ')}`);
  }

  // Guardar preview
  fs.writeFileSync('/Users/marianomorales/Downloads/restore_comprados_v3.json',
    JSON.stringify(records, null, 2));
  console.log(`\n💾 Datos guardados en: /Users/marianomorales/Downloads/restore_comprados_v3.json`);

  if (records.length > 0) {
    const sample = records[0];
    console.log(`\n🔍 Ejemplo - ${sample.ordencompra}:`);
    const fields = Object.keys(sample).filter(k => k !== 'ordencompra');
    console.log(`   Campos: ${fields.length}`);
    console.log(`   precio: ${sample.precio || '(vacío)'}`);
    console.log(`   marca: ${sample.marca || '(vacío)'}`);
    console.log(`   slug: ${sample.slug || '(vacío)'}`);
  }

  if (!process.argv.includes('--execute')) {
    console.log('\n⚠️  Modo preview. Agrega --execute para aplicar cambios.');
    process.exit(0);
  }

  console.log('\n🚀 Iniciando restauración...\n');

  let updated = 0;
  let errors = 0;

  for (const record of records) {
    const ordencompra = record.ordencompra;
    const updateData = { ...record };
    delete updateData.ordencompra;

    const result = await updateViaRest(ordencompra, updateData);

    if (result.success) {
      updated++;
      process.stdout.write(`\r✅ ${updated}/${records.length} restaurados`);
    } else {
      errors++;
      console.log(`\n❌ ${ordencompra}: ${result.error}`);
    }

    await new Promise(r => setTimeout(r, 100));
  }

  console.log(`\n\n✅ COMPLETADO: ${updated} restaurados, ${errors} errores`);
}

main().catch(console.error);
