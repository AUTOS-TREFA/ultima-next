/**
 * Restauración de Comprados usando extracción por línea
 */

const fs = require('fs');
const https = require('https');

const BACKUP_FILE = '/Users/marianomorales/Downloads/inventario_cache_bk.sql';
const SUPABASE_URL = 'mhlztgilrmgebkyqowxz.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

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

// Índices de columnas en el INSERT (basado en 0)
// 0=id, 1=ordencompra, 2=precio, 3=ordenstatus, 4=description, 5=garantia,
// 6=enganchemin, 7=plazomax, 8=pagomensual, 9=title, 10=titulometa,
// 11=carroceria, 12=rezago, 13=consigna, 14=marca, 15=modelo, 16=promociones,
// 17=combustible, 18=AutoMotor, 19=separado, 20=reel_url, 21=ubicacion, 22=vendido,
// 23=rfdm, 24=vin, 25=feature_image, 26=ingreso_inventario, 27=oferta, 28=factura,
// 29=numero_duenos, 30=con_oferta, 31=last_synced_at, 32=enganche_recomendado,
// 33=mensualidad_recomendada, 34=mensualidad_minima, 35=slug, 36=enganche_con_bono,
// 37=liga_boton_con_whatsapp, 38=record_id, 39=fotos_interior_url, 40=fotos_exterior_url,
// 41=feature_image_url, 42=autotransmision, 43=descripcion

const FIELD_MAP = {
  2: 'precio',
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

function splitSqlValues(str) {
  const values = [];
  let current = '';
  let inString = false;
  let depth = 0;

  for (let i = 0; i < str.length; i++) {
    const c = str[i];

    if (inString) {
      if (c === "'" && str[i + 1] === "'") {
        current += "'";
        i++;
      } else if (c === "'") {
        inString = false;
        current += c;
      } else {
        current += c;
      }
    } else {
      if (c === "'") {
        inString = true;
        current += c;
      } else if (c === ',' && depth === 0) {
        values.push(current.trim());
        current = '';
      } else if (c === '(' || c === '{' || c === '[') {
        depth++;
        current += c;
      } else if (c === ')' || c === '}' || c === ']') {
        depth--;
        current += c;
      } else {
        current += c;
      }
    }
  }

  if (current.trim()) {
    values.push(current.trim());
  }

  return values;
}

function parseValue(val) {
  if (!val || val === 'null' || val === 'NULL') return null;
  if (val.startsWith("'") && val.endsWith("'")) {
    return val.slice(1, -1).replace(/''/g, "'");
  }
  return val;
}

function extractRecordForId(content, ordencompra) {
  // Find the pattern: ('numeric_id', 'ordencompra', ...
  const pattern = new RegExp(`\\('\\d+'\\s*,\\s*'${ordencompra}'\\s*,`);
  const match = content.match(pattern);

  if (!match) return null;

  const startIdx = match.index + 1; // Skip the opening (

  // Find the end of this record
  let endIdx = startIdx;
  let depth = 1;
  let inString = false;

  for (let i = startIdx; i < content.length && i < startIdx + 500000; i++) {
    const c = content[i];

    if (inString) {
      if (c === "'" && content[i + 1] === "'") {
        i++;
      } else if (c === "'") {
        inString = false;
      }
    } else {
      if (c === "'") {
        inString = true;
      } else if (c === '(') {
        depth++;
      } else if (c === ')') {
        depth--;
        if (depth === 0) {
          endIdx = i;
          break;
        }
      }
    }
  }

  const recordStr = content.substring(startIdx, endIdx);
  const values = splitSqlValues(recordStr);

  if (values.length < 44) {
    console.log(`   ⚠️ ${ordencompra}: solo ${values.length} valores (esperados 44+)`);
    return null;
  }

  const obj = { ordencompra };

  for (const [idxStr, fieldName] of Object.entries(FIELD_MAP)) {
    const idx = parseInt(idxStr);
    const rawVal = values[idx];
    const val = parseValue(rawVal);

    if (val === null || val === '') continue;

    if (NUMERIC_FIELDS.includes(fieldName)) {
      const num = parseFloat(val);
      if (!isNaN(num)) obj[fieldName] = num;
    } else {
      obj[fieldName] = val;
    }
  }

  return obj;
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
    const data = extractRecordForId(content, id);
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
  if (missingIds.length > 0) {
    console.log(`   IDs no encontrados: ${missingIds.join(', ')}`);
  }

  fs.writeFileSync('/Users/marianomorales/Downloads/restore_comprados_v4.json',
    JSON.stringify(records, null, 2));
  console.log(`\n💾 Datos guardados en: /Users/marianomorales/Downloads/restore_comprados_v4.json`);

  if (records.length > 0) {
    const sample = records[0];
    console.log(`\n🔍 Ejemplo - ${sample.ordencompra}:`);
    console.log(`   precio: ${sample.precio || '(vacío)'}`);
    console.log(`   marca: ${sample.marca || '(vacío)'}`);
    console.log(`   slug: ${sample.slug || '(vacío)'}`);
    console.log(`   Total campos: ${Object.keys(sample).length}`);
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
