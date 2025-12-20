/**
 * Script para importar backup SQL en chunks usando Supabase API
 * Lee el archivo SQL, extrae los datos y los inserta en batches
 */

const fs = require('fs');
const https = require('https');

const BACKUP_FILE = '/Users/marianomorales/Downloads/inventario_cache_rows.sql';
const SUPABASE_URL = 'https://mhlztgilrmgebkyqowxz.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY; // Necesitas la service key
const BATCH_SIZE = 10;

// Columnas del backup (en orden)
const COLUMNS = [
  'id', 'ordencompra', 'precio', 'additional_image_link', 'ordenstatus', 'description',
  'garantia', 'enganchemin', 'plazomax', 'pagomensual', 'title', 'titulometa',
  'carroceria', 'rezago', 'consigna', 'marca', 'modelo', 'promociones', 'combustible',
  'AutoMotor', 'formulafinanciamiento', 'separado', 'reel_url', 'ubicacion', 'vendido',
  'rfdm', 'vin', 'feature_image', 'ingreso_inventario', 'oferta', 'factura',
  'numero_duenos', 'con_oferta', 'last_synced_at', 'enganche_recomendado',
  'mensualidad_recomendada', 'mensualidad_minima', 'slug', 'enganche_con_bono',
  'liga_boton_con_whatsapp', 'record_id', 'fotos_interior_url', 'fotos_exterior_url',
  'feature_image_url', 'autotransmision', 'descripcion', 'data', 'updated_at',
  'cilindros', 'viewcount', 'clasificacionid', 'autoano', 'kilometraje', 'created_at',
  'autocombustible', 'view_count', 'transmision', 'car_studio_feature_image',
  'galeria_exterior', 'galeria_interior', 'use_car_studio_images', 'airtable_id',
  'fbclid', 'orden_id', 'orden_fecha', 'historico_fecha', 'fecha_separado',
  'fecha_vendido', 'usuario_comprador', 'auto_llaves', 'en_reparacion', 'utilitario',
  'liga_bot', 'liga_web', 'titulo'
];

// Campos que necesitamos para restaurar
const FIELDS_TO_RESTORE = [
  'ordencompra', 'fotos_exterior_url', 'fotos_interior_url', 'feature_image_url',
  'feature_image', 'descripcion', 'created_at', 'garantia', 'titulo'
];

function parseValue(val) {
  if (val === 'null' || val === 'NULL' || val === '') return null;
  if (val.startsWith("'") && val.endsWith("'")) {
    return val.slice(1, -1).replace(/''/g, "'");
  }
  return val;
}

function parseRecord(valuesStr, startIdx) {
  // Encontrar el inicio del record (después del paréntesis de apertura)
  let pos = startIdx;
  while (pos < valuesStr.length && valuesStr[pos] !== '(') pos++;
  if (pos >= valuesStr.length) return null;
  pos++; // Skip '('

  const values = [];
  let currentValue = '';
  let inString = false;
  let depth = 0;

  while (pos < valuesStr.length) {
    const char = valuesStr[pos];

    if (!inString && char === '(') {
      depth++;
      currentValue += char;
    } else if (!inString && char === ')') {
      if (depth === 0) {
        // Fin del record
        if (currentValue.trim()) values.push(parseValue(currentValue.trim()));
        return { values, endPos: pos + 1 };
      }
      depth--;
      currentValue += char;
    } else if (char === "'" && (pos === 0 || valuesStr[pos-1] !== '\\')) {
      if (!inString) {
        inString = true;
      } else if (pos + 1 < valuesStr.length && valuesStr[pos + 1] === "'") {
        // Escaped quote
        currentValue += "''";
        pos++;
      } else {
        inString = false;
      }
      currentValue += char;
    } else if (!inString && char === ',' && depth === 0) {
      values.push(parseValue(currentValue.trim()));
      currentValue = '';
    } else {
      currentValue += char;
    }
    pos++;
  }

  return null;
}

async function main() {
  console.log('📖 Leyendo archivo de backup...');
  const content = fs.readFileSync(BACKUP_FILE, 'utf-8');

  // Encontrar el inicio de VALUES
  const valuesIdx = content.indexOf('VALUES ');
  if (valuesIdx === -1) {
    console.error('❌ No se encontró VALUES en el archivo');
    process.exit(1);
  }

  const valuesStr = content.substring(valuesIdx + 7);
  console.log(`📊 Parseando registros...`);

  const records = [];
  let pos = 0;

  while (pos < valuesStr.length) {
    const result = parseRecord(valuesStr, pos);
    if (!result) break;

    const { values, endPos } = result;

    // Crear objeto con los campos que necesitamos
    const record = {};
    FIELDS_TO_RESTORE.forEach(field => {
      const idx = COLUMNS.indexOf(field);
      if (idx !== -1 && idx < values.length) {
        record[field] = values[idx];
      }
    });

    // Solo agregar si tiene ordencompra y algún dato útil
    if (record.ordencompra) {
      const hasUsefulData = FIELDS_TO_RESTORE.some(f =>
        f !== 'ordencompra' && record[f] && record[f] !== '' && record[f] !== 'null'
      );
      if (hasUsefulData) {
        records.push(record);
      }
    }

    pos = endPos;

    // Buscar siguiente record
    while (pos < valuesStr.length && valuesStr[pos] !== '(') pos++;

    if (records.length % 50 === 0) {
      process.stdout.write(`\r⏳ ${records.length} registros con datos útiles...`);
    }
  }

  console.log(`\n✅ Total: ${records.length} registros para restaurar`);

  // Guardar a JSON para procesamiento posterior
  const outputFile = '/Users/marianomorales/Downloads/backup_restore_data.json';
  fs.writeFileSync(outputFile, JSON.stringify(records, null, 2));
  console.log(`💾 Datos guardados en: ${outputFile}`);

  // Mostrar estadísticas
  const stats = {
    total: records.length,
    con_fotos_ext: records.filter(r => r.fotos_exterior_url).length,
    con_fotos_int: records.filter(r => r.fotos_interior_url).length,
    con_feature_url: records.filter(r => r.feature_image_url).length,
    con_descripcion: records.filter(r => r.descripcion).length,
    con_titulo: records.filter(r => r.titulo).length,
    con_garantia: records.filter(r => r.garantia).length,
  };

  console.log('\n📊 Estadísticas del backup:');
  console.table(stats);

  // Generar archivo SQL con UPDATEs
  console.log('\n📝 Generando archivo de UPDATEs...');
  const sqlFile = '/Users/marianomorales/Downloads/restore_updates.sql';
  const sqlStatements = [];

  records.forEach(r => {
    const sets = [];
    const oc = r.ordencompra.replace(/'/g, "''");

    if (r.fotos_exterior_url && r.fotos_exterior_url !== 'null') {
      const val = r.fotos_exterior_url.replace(/'/g, "''");
      sets.push(`fotos_exterior_url = CASE WHEN fotos_exterior_url IS NULL OR fotos_exterior_url = '' THEN '${val}' ELSE fotos_exterior_url END`);
    }
    if (r.fotos_interior_url && r.fotos_interior_url !== 'null') {
      const val = r.fotos_interior_url.replace(/'/g, "''");
      sets.push(`fotos_interior_url = CASE WHEN fotos_interior_url IS NULL OR fotos_interior_url = '' THEN '${val}' ELSE fotos_interior_url END`);
    }
    if (r.feature_image_url && r.feature_image_url !== 'null') {
      const val = r.feature_image_url.replace(/'/g, "''");
      sets.push(`feature_image_url = CASE WHEN feature_image_url IS NULL OR feature_image_url = '' THEN '${val}' ELSE feature_image_url END`);
    }
    if (r.descripcion && r.descripcion !== 'null') {
      const val = r.descripcion.replace(/'/g, "''");
      sets.push(`descripcion = CASE WHEN descripcion IS NULL OR descripcion = '' THEN '${val}' ELSE descripcion END`);
    }
    if (r.garantia && r.garantia !== 'null') {
      const val = r.garantia.replace(/'/g, "''");
      sets.push(`garantia = CASE WHEN garantia IS NULL OR garantia = '' THEN '${val}' ELSE garantia END`);
    }

    if (sets.length > 0) {
      sqlStatements.push(`UPDATE inventario_cache SET ${sets.join(', ')} WHERE ordencompra = '${oc}';`);
    }
  });

  fs.writeFileSync(sqlFile, sqlStatements.join('\n'));
  console.log(`💾 ${sqlStatements.length} UPDATEs guardados en: ${sqlFile}`);
}

main().catch(console.error);
