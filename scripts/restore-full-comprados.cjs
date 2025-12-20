/**
 * Restauración COMPLETA de todos los campos para registros con ordenstatus = 'Comprado'
 */

const fs = require('fs');
const https = require('https');

const BACKUP_FILE = '/Users/marianomorales/Downloads/inventario_cache_bk.sql';
const SUPABASE_URL = 'mhlztgilrmgebkyqowxz.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

// Columnas del backup SQL (en orden exacto del INSERT de inventario_cache_bk.sql)
const BACKUP_COLUMNS = [
  'id', 'ordencompra', 'precio', 'ordenstatus', 'description',
  'garantia', 'enganchemin', 'plazomax', 'pagomensual', 'title', 'titulometa',
  'carroceria', 'rezago', 'consigna', 'marca', 'modelo', 'promociones', 'combustible',
  'AutoMotor', 'separado', 'reel_url', 'ubicacion', 'vendido',
  'rfdm', 'vin', 'feature_image', 'ingreso_inventario', 'oferta', 'factura',
  'numero_duenos', 'con_oferta', 'last_synced_at', 'enganche_recomendado',
  'mensualidad_recomendada', 'mensualidad_minima', 'slug', 'enganche_con_bono',
  'liga_boton_con_whatsapp', 'record_id', 'fotos_interior_url', 'fotos_exterior_url',
  'feature_image_url', 'autotransmision', 'descripcion', 'data', 'updated_at',
  'cilindros', 'viewcount', 'clasificacionid', 'autoano', 'kilometraje', 'created_at',
  'autocombustible', 'view_count', 'transmision', 'car_studio_feature_image',
  'galeria_exterior', 'galeria_interior', 'airtable_id',
  'fbclid', 'orden_id', 'orden_fecha', 'historico_fecha', 'fecha_separado',
  'fecha_vendido', 'usuario_comprador', 'auto_llaves', 'en_reparacion', 'utilitario',
  'liga_bot', 'liga_web', 'titulo', 'r2_feature_image', 'r2_gallery'
];

// Columnas que EXISTEN en la tabla actual (de information_schema)
const VALID_COLUMNS = [
  'ordencompra', 'precio', 'additional_image_link', 'ordenstatus', 'description',
  'garantia', 'enganchemin', 'plazomax', 'pagomensual', 'title', 'titulometa',
  'carroceria', 'rezago', 'consigna', 'marca', 'modelo', 'promociones', 'combustible',
  'AutoMotor', 'formulafinanciamiento', 'separado', 'reel_url', 'ubicacion', 'vendido',
  'rfdm', 'vin', 'feature_image', 'ingreso_inventario', 'oferta', 'factura',
  'numero_duenos', 'con_oferta', 'enganche_recomendado', 'mensualidad_recomendada',
  'mensualidad_minima', 'slug', 'enganche_con_bono', 'liga_boton_con_whatsapp',
  'record_id', 'fotos_interior_url', 'fotos_exterior_url', 'feature_image_url',
  'autotransmision', 'descripcion', 'data', 'cilindros', 'viewcount', 'clasificacionid',
  'autoano', 'kilometraje', 'autocombustible', 'view_count', 'transmision',
  'car_studio_feature_image', 'galeria_exterior', 'galeria_interior',
  'use_car_studio_images', 'airtable_id', 'en_reparacion', 'utilitario',
  'liga_bot', 'liga_web', 'auto_llaves', 'fecha_separado', 'fecha_vendido',
  'historico_fecha', 'orden_fecha', 'orden_id', 'titulo', 'fbclid'
];

// Tipos de datos para conversión correcta
const NUMERIC_FIELDS = ['precio', 'enganchemin', 'plazomax', 'pagomensual', 'oferta',
  'numero_duenos', 'mensualidad_recomendada', 'mensualidad_minima', 'enganche_con_bono',
  'viewcount', 'autoano', 'view_count', 'auto_llaves'];
const BOOLEAN_FIELDS = ['rezago', 'consigna', 'separado', 'vendido', 'con_oferta',
  'use_car_studio_images', 'en_reparacion', 'utilitario'];
const JSONB_FIELDS = ['promociones', 'rfdm', 'data', 'kilometraje', 'galeria_exterior', 'galeria_interior'];
const TIMESTAMP_FIELDS = ['ingreso_inventario', 'fecha_separado', 'fecha_vendido', 'historico_fecha', 'orden_fecha'];

// SOLO restaurar estas columnas simples (ANTES de 'data' en posición 46)
// Campos después de 'data' se corrompen por el JSON complejo
// REMOVIDAS: additional_image_link, formulafinanciamiento, use_car_studio_images (ya no existen en tabla)
const SAFE_COLUMNS = [
  'precio', 'ordenstatus', 'description',
  'garantia', 'enganchemin', 'plazomax', 'pagomensual', 'title', 'titulometa',
  'carroceria', 'marca', 'modelo', 'combustible',
  'AutoMotor', 'ubicacion',
  'vin', 'feature_image', 'oferta', 'factura',
  'numero_duenos', 'enganche_recomendado',
  'mensualidad_recomendada', 'mensualidad_minima', 'slug', 'enganche_con_bono',
  'liga_boton_con_whatsapp', 'record_id', 'fotos_interior_url', 'fotos_exterior_url',
  'feature_image_url', 'autotransmision', 'descripcion'
  // REMOVIDOS por corrupción (después de 'data'):
  // 'cilindros', 'clasificacionid', 'autoano', 'autocombustible', 'transmision', 'titulo'
];

// Campos que NO restauramos
const SKIP_FIELDS = ['id', 'updated_at', 'last_synced_at', 'created_at',
  'ingreso_inventario', 'fecha_separado', 'fecha_vendido', 'historico_fecha', 'orden_fecha',
  'kilometraje', 'rfdm', 'promociones', 'galeria_exterior', 'galeria_interior', 'data',
  'car_studio_feature_image', 'use_car_studio_images', 'airtable_id', 'fbclid',
  'orden_id', 'usuario_comprador', 'auto_llaves', 'en_reparacion', 'utilitario',
  'liga_bot', 'liga_web', 'viewcount', 'view_count', 'rezago', 'consigna', 'separado',
  'vendido', 'con_oferta', 'reel_url'];

function parseValue(val) {
  if (val === 'null' || val === 'NULL' || val === '') return null;
  if (val.startsWith("'") && val.endsWith("'")) {
    return val.slice(1, -1).replace(/''/g, "'");
  }
  // Números
  if (/^-?\d+(\.\d+)?$/.test(val)) {
    return val.includes('.') ? parseFloat(val) : parseInt(val, 10);
  }
  return val;
}

function parseRecord(valuesStr, startIdx) {
  let pos = startIdx;
  while (pos < valuesStr.length && valuesStr[pos] !== '(') pos++;
  if (pos >= valuesStr.length) return null;
  pos++;

  const values = [];
  let currentValue = '';
  let inString = false;
  let parenDepth = 0;
  let braceDepth = 0;
  let bracketDepth = 0;

  while (pos < valuesStr.length) {
    const char = valuesStr[pos];

    if (inString) {
      // Dentro de string, solo buscar fin de string
      if (char === "'" && pos + 1 < valuesStr.length && valuesStr[pos + 1] === "'") {
        // Escaped quote ''
        currentValue += "''";
        pos++;
      } else if (char === "'") {
        // Fin de string
        inString = false;
        currentValue += char;
      } else {
        currentValue += char;
      }
    } else {
      // Fuera de string
      if (char === "'") {
        inString = true;
        currentValue += char;
      } else if (char === '(') {
        parenDepth++;
        currentValue += char;
      } else if (char === ')') {
        if (parenDepth === 0 && braceDepth === 0 && bracketDepth === 0) {
          // Fin del record
          if (currentValue.trim()) values.push(parseValue(currentValue.trim()));
          return { values, endPos: pos + 1 };
        }
        parenDepth--;
        currentValue += char;
      } else if (char === '{') {
        braceDepth++;
        currentValue += char;
      } else if (char === '}') {
        braceDepth--;
        currentValue += char;
      } else if (char === '[') {
        bracketDepth++;
        currentValue += char;
      } else if (char === ']') {
        bracketDepth--;
        currentValue += char;
      } else if (char === ',' && parenDepth === 0 && braceDepth === 0 && bracketDepth === 0) {
        // Separador de valores
        values.push(parseValue(currentValue.trim()));
        currentValue = '';
      } else {
        currentValue += char;
      }
    }
    pos++;
  }

  return null;
}

function valuesToObject(values) {
  const obj = {};
  BACKUP_COLUMNS.forEach((col, idx) => {
    // SOLO incluir si está en SAFE_COLUMNS
    if (idx < values.length && SAFE_COLUMNS.includes(col)) {
      let val = values[idx];
      if (val === null || val === undefined || val === '' || val === 'null') return;

      // Conversión de tipos para numéricos
      if (NUMERIC_FIELDS.includes(col)) {
        const num = parseFloat(val);
        if (!isNaN(num)) obj[col] = num;
      } else {
        // Todo lo demás es texto
        obj[col] = String(val);
      }
    }
  });
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

// IDs actuales con ordenstatus='Comprado' en la DB (78 registros)
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

async function main() {
  if (!SUPABASE_KEY) {
    console.error('❌ SUPABASE_SERVICE_KEY no definida');
    console.log('Ejecuta: export SUPABASE_SERVICE_KEY="tu_key"');
    process.exit(1);
  }

  console.log('📖 Leyendo backup...');
  const content = fs.readFileSync(BACKUP_FILE, 'utf-8');

  const valuesIdx = content.indexOf('VALUES ');
  if (valuesIdx === -1) {
    console.error('❌ No se encontró VALUES');
    process.exit(1);
  }

  const valuesStr = content.substring(valuesIdx + 7);
  console.log('📊 Parseando registros...');

  const allRecords = {};
  let pos = 0;
  let total = 0;

  while (pos < valuesStr.length) {
    const result = parseRecord(valuesStr, pos);
    if (!result) break;

    const { values, endPos } = result;
    total++;

    // Index 1 = ordencompra
    const ordencompra = values[1];

    // Guardar TODOS los registros que están en la lista de Comprados actuales
    if (ordencompra && CURRENT_COMPRADOS.includes(ordencompra)) {
      const obj = valuesToObject(values);
      obj.ordencompra = ordencompra; // Agregar ordencompra explícitamente
      allRecords[ordencompra] = obj;
    }

    pos = endPos;
    while (pos < valuesStr.length && valuesStr[pos] !== '(') pos++;
  }

  const comprados = Object.values(allRecords);

  console.log(`✅ Total parseados del backup: ${total}`);
  console.log(`✅ Encontrados en backup (de ${CURRENT_COMPRADOS.length} buscados): ${comprados.length}`);

  // Guardar JSON completo
  const outputFile = '/Users/marianomorales/Downloads/comprados_full_restore.json';
  fs.writeFileSync(outputFile, JSON.stringify(comprados, null, 2));
  console.log(`💾 Datos completos guardados en: ${outputFile}`);

  // Mostrar campos disponibles del primer registro
  if (comprados.length > 0) {
    const sample = comprados[0];
    const fields = Object.keys(sample).filter(k => sample[k] !== null);
    console.log(`\n📋 Campos disponibles (${fields.length}): ${fields.join(', ')}`);
  }

  // Ejecutar actualizaciones
  console.log('\n🚀 Iniciando restauración completa...\n');

  let updated = 0;
  let errors = 0;

  for (let i = 0; i < comprados.length; i++) {
    const record = comprados[i];
    const ordencompra = record.ordencompra;

    // Remover ordencompra del objeto de actualización (es la key)
    const updateData = { ...record };
    delete updateData.ordencompra;

    const result = await updateViaRest(ordencompra, updateData);

    if (result.success) {
      updated++;
      process.stdout.write(`\r✅ ${updated}/${comprados.length} restaurados`);
    } else {
      errors++;
      console.log(`\n❌ ${ordencompra}: ${result.error}`);
    }

    // Rate limiting
    await new Promise(r => setTimeout(r, 100));
  }

  console.log(`\n\n✅ COMPLETADO: ${updated} restaurados, ${errors} errores`);
}

main().catch(console.error);
