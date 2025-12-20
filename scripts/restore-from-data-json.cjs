/**
 * Restauración de Comprados usando el campo 'data' JSON como fuente
 * El campo data contiene todos los valores correctos
 */

const fs = require('fs');
const https = require('https');

const BACKUP_FILE = '/Users/marianomorales/Downloads/inventario_cache_rows.sql';
const SUPABASE_URL = 'mhlztgilrmgebkyqowxz.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

// Campos que queremos restaurar (excluyendo IDs, timestamps, etc)
const RESTORE_FIELDS = [
  'precio', 'description', 'garantia', 'title', 'titulometa',
  'carroceria', 'marca', 'modelo', 'combustible', 'AutoMotor',
  'ubicacion', 'vin', 'oferta', 'factura', 'numero_duenos',
  'enganche_recomendado', 'mensualidad_recomendada', 'mensualidad_minima',
  'slug', 'enganche_con_bono', 'record_id', 'autotransmision',
  'descripcion', 'cilindros', 'clasificacionid', 'autoano',
  'autocombustible', 'transmision', 'titulo', 'feature_image_url',
  'fotos_interior_url', 'fotos_exterior_url', 'enganchemin', 'plazomax',
  'pagomensual', 'formulafinanciamiento', 'liga_boton_con_whatsapp'
];

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

// Mapeo de campos JSON a campos de la tabla
const FIELD_MAPPING = {
  'OrdenCompra': 'ordencompra',
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
  'vin': 'vin',
  'Oferta': 'oferta',
  'Factura': 'factura',
  'numero_duenos': 'numero_duenos',
  'enganche_recomendado': 'enganche_recomendado',
  'mensualidad_recomendada': 'mensualidad_recomendada',
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
  'autocombustible': 'autocombustible',
  'titulo': 'titulo',
  'enganche_minimo': 'enganchemin',
  'PlazoMax': 'plazomax',
  'PagoMensual': 'pagomensual',
  'FormulaFinanciamiento': 'formulafinanciamiento',
  'boton_web_con_whatsapp': 'liga_boton_con_whatsapp'
};

// Campos que deben ser numéricos
const NUMERIC_FIELDS = ['precio', 'enganchemin', 'plazomax', 'pagomensual', 'oferta',
  'numero_duenos', 'mensualidad_recomendada', 'mensualidad_minima', 'enganche_con_bono',
  'autoano', 'cilindros', 'enganche_recomendado'];

function extractDataJsonFromRecord(recordStr) {
  // Buscar el campo 'data' que contiene JSON
  // El formato es: ..., 'descripcion', '{JSON}', ...

  // Buscar patrón de JSON que empieza con {"id":
  const jsonMatch = recordStr.match(/'\{"id":"[^"]+","Auto":/);
  if (!jsonMatch) return null;

  const startIdx = recordStr.indexOf(jsonMatch[0]) + 1; // +1 para saltar la comilla inicial

  // Encontrar el final del JSON (balanceando llaves)
  let braceCount = 0;
  let inString = false;
  let endIdx = startIdx;

  for (let i = startIdx; i < recordStr.length; i++) {
    const char = recordStr[i];
    const prevChar = i > 0 ? recordStr[i-1] : '';

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

  const jsonStr = recordStr.substring(startIdx, endIdx);

  try {
    return JSON.parse(jsonStr);
  } catch (e) {
    return null;
  }
}

function extractOrdenCompra(recordStr) {
  // Buscar OrdenCompra en el JSON o en los valores SQL
  const match = recordStr.match(/'(ID\d{6})'/);
  return match ? match[1] : null;
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

function convertJsonToDbFields(jsonData) {
  const dbData = {};

  for (const [jsonKey, dbKey] of Object.entries(FIELD_MAPPING)) {
    if (jsonData[jsonKey] !== undefined && jsonData[jsonKey] !== null) {
      let value = jsonData[jsonKey];

      // Saltar valores especiales de Airtable
      if (typeof value === 'object' && value.specialValue) continue;
      if (typeof value === 'object' && !Array.isArray(value)) continue;

      // Convertir arrays a strings separados por coma
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

  // También extraer URLs de imágenes si están en campos especiales
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

async function main() {
  if (!SUPABASE_KEY) {
    console.error('❌ SUPABASE_SERVICE_KEY no definida');
    console.log('Ejecuta: export SUPABASE_SERVICE_KEY="tu_key"');
    process.exit(1);
  }

  console.log('📖 Leyendo backup de:', BACKUP_FILE);
  const content = fs.readFileSync(BACKUP_FILE, 'utf-8');

  console.log('📊 Buscando registros con campo data JSON...');

  // Dividir por registros (cada registro empieza con ( y termina con ))
  const records = [];
  let depth = 0;
  let currentRecord = '';
  let inString = false;

  for (let i = 0; i < content.length; i++) {
    const char = content[i];
    const prevChar = i > 0 ? content[i-1] : '';

    if (char === "'" && prevChar !== "'") {
      inString = !inString;
    }

    if (!inString) {
      if (char === '(') {
        if (depth === 0) currentRecord = '';
        depth++;
      } else if (char === ')') {
        depth--;
        if (depth === 0) {
          currentRecord += char;

          // Verificar si es un registro de Comprado que buscamos
          const ordencompra = extractOrdenCompra(currentRecord);
          if (ordencompra && CURRENT_COMPRADOS.includes(ordencompra)) {
            const jsonData = extractDataJsonFromRecord(currentRecord);
            if (jsonData && jsonData.OrdenCompra) {
              records.push({
                ordencompra: jsonData.OrdenCompra,
                data: convertJsonToDbFields(jsonData)
              });
            }
          }
          continue;
        }
      }
    }

    if (depth > 0) {
      currentRecord += char;
    }
  }

  console.log(`✅ Encontrados ${records.length} registros con datos JSON válidos`);

  // Guardar preview
  const previewFile = '/Users/marianomorales/Downloads/restore_preview.json';
  fs.writeFileSync(previewFile, JSON.stringify(records.slice(0, 5), null, 2));
  console.log(`💾 Preview guardado en: ${previewFile}`);

  if (records.length === 0) {
    console.log('❌ No se encontraron registros. Verifica el archivo.');
    process.exit(1);
  }

  // Mostrar campos del primer registro
  if (records.length > 0) {
    const sample = records[0];
    const fields = Object.keys(sample.data);
    console.log(`\n📋 Campos a restaurar (${fields.length}): ${fields.join(', ')}`);
    console.log(`\n🔍 Ejemplo - ${sample.ordencompra}:`);
    console.log(`   titulo: ${sample.data.titulo || '(vacío)'}`);
    console.log(`   precio: ${sample.data.precio || '(vacío)'}`);
    console.log(`   descripcion: ${(sample.data.descripcion || '').substring(0, 50)}...`);
  }

  // Preguntar antes de continuar
  console.log(`\n🚀 ¿Continuar con la restauración de ${records.length} registros?`);
  console.log('   Ejecuta con --execute para aplicar los cambios');

  if (!process.argv.includes('--execute')) {
    console.log('\n⚠️  Modo preview. Agrega --execute para aplicar cambios.');
    process.exit(0);
  }

  console.log('\n🚀 Iniciando restauración...\n');

  let updated = 0;
  let errors = 0;

  for (let i = 0; i < records.length; i++) {
    const record = records[i];

    if (Object.keys(record.data).length === 0) {
      console.log(`⚠️  ${record.ordencompra}: sin datos para restaurar`);
      continue;
    }

    const result = await updateViaRest(record.ordencompra, record.data);

    if (result.success) {
      updated++;
      process.stdout.write(`\r✅ ${updated}/${records.length} restaurados`);
    } else {
      errors++;
      console.log(`\n❌ ${record.ordencompra}: ${result.error}`);
    }

    // Rate limiting
    await new Promise(r => setTimeout(r, 100));
  }

  console.log(`\n\n✅ COMPLETADO: ${updated} restaurados, ${errors} errores`);
}

main().catch(console.error);
