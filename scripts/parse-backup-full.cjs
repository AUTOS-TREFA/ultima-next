/**
 * Script para parsear el backup SQL completo incluyendo ordenstatus
 */

const fs = require('fs');

const BACKUP_FILE = '/Users/marianomorales/Downloads/inventario_cache_rows.sql';

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

// Campos que necesitamos
const FIELDS_TO_EXTRACT = [
  'ordencompra', 'ordenstatus', 'vendido', 'utilitario',
  'fotos_exterior_url', 'fotos_interior_url', 'feature_image_url',
  'feature_image', 'descripcion', 'created_at', 'garantia', 'titulo',
  'marca', 'modelo', 'autoano'
];

function parseValue(val) {
  if (val === 'null' || val === 'NULL' || val === '') return null;
  if (val.startsWith("'") && val.endsWith("'")) {
    return val.slice(1, -1).replace(/''/g, "'");
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
  let depth = 0;

  while (pos < valuesStr.length) {
    const char = valuesStr[pos];

    if (!inString && char === '(') {
      depth++;
      currentValue += char;
    } else if (!inString && char === ')') {
      if (depth === 0) {
        if (currentValue.trim()) values.push(parseValue(currentValue.trim()));
        return { values, endPos: pos + 1 };
      }
      depth--;
      currentValue += char;
    } else if (char === "'" && (pos === 0 || valuesStr[pos-1] !== '\\')) {
      if (!inString) {
        inString = true;
      } else if (pos + 1 < valuesStr.length && valuesStr[pos + 1] === "'") {
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

  const valuesIdx = content.indexOf('VALUES ');
  if (valuesIdx === -1) {
    console.error('❌ No se encontró VALUES en el archivo');
    process.exit(1);
  }

  const valuesStr = content.substring(valuesIdx + 7);
  console.log('📊 Parseando registros...');

  const records = [];
  let pos = 0;

  while (pos < valuesStr.length) {
    const result = parseRecord(valuesStr, pos);
    if (!result) break;

    const { values, endPos } = result;

    // Crear objeto con todos los campos necesarios
    const record = {};
    FIELDS_TO_EXTRACT.forEach(field => {
      const idx = COLUMNS.indexOf(field);
      if (idx !== -1 && idx < values.length) {
        record[field] = values[idx];
      }
    });

    if (record.ordencompra) {
      records.push(record);
    }

    pos = endPos;
    while (pos < valuesStr.length && valuesStr[pos] !== '(') pos++;

    if (records.length % 100 === 0) {
      process.stdout.write(`\r⏳ ${records.length} registros parseados...`);
    }
  }

  console.log(`\n✅ Total: ${records.length} registros`);

  // Filtrar solo Comprados y no utilitarios
  const comprados = records.filter(r =>
    r.ordenstatus === 'Comprado' &&
    r.utilitario !== 'true' &&
    r.utilitario !== true &&
    r.vendido !== 'true' &&
    r.vendido !== true
  );

  console.log(`\n📊 Registros con ordenstatus='Comprado' y no utilitario: ${comprados.length}`);

  // Estadísticas
  const stats = {
    total: comprados.length,
    con_fotos_ext: comprados.filter(r => r.fotos_exterior_url && r.fotos_exterior_url !== 'null').length,
    con_fotos_int: comprados.filter(r => r.fotos_interior_url && r.fotos_interior_url !== 'null').length,
    con_feature_url: comprados.filter(r => r.feature_image_url && r.feature_image_url !== 'null').length,
    con_descripcion: comprados.filter(r => r.descripcion && r.descripcion !== 'null').length,
  };

  console.log('\n📊 Estadísticas de Comprados:');
  console.table(stats);

  // Guardar
  const outputFile = '/Users/marianomorales/Downloads/backup_comprados.json';
  fs.writeFileSync(outputFile, JSON.stringify(comprados, null, 2));
  console.log(`💾 Datos guardados en: ${outputFile}`);

  // Mostrar primeros registros
  console.log('\n📋 Primeros 10 Comprados:');
  comprados.slice(0, 10).forEach(r => {
    console.log(`  ${r.ordencompra}: ${r.marca} ${r.modelo} ${r.autoano}`);
  });
}

main().catch(console.error);
