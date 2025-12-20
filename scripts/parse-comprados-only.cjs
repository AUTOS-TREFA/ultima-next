/**
 * Parsear backup SQL solo filtrando por Comprado (sin filtros de utilitario/vendido)
 */

const fs = require('fs');

const BACKUP_FILE = '/Users/marianomorales/Downloads/inventario_cache_rows.sql';

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
    console.error('❌ No se encontró VALUES');
    process.exit(1);
  }

  const valuesStr = content.substring(valuesIdx + 7);
  console.log('📊 Parseando...');

  const allRecords = [];
  let pos = 0;

  while (pos < valuesStr.length) {
    const result = parseRecord(valuesStr, pos);
    if (!result) break;

    const { values, endPos } = result;
    const statusIdx = COLUMNS.indexOf('ordenstatus');
    const ocIdx = COLUMNS.indexOf('ordencompra');

    if (statusIdx < values.length) {
      allRecords.push({
        ordencompra: values[ocIdx],
        ordenstatus: values[statusIdx]
      });
    }

    pos = endPos;
    while (pos < valuesStr.length && valuesStr[pos] !== '(') pos++;
  }

  console.log(`\n✅ Total registros: ${allRecords.length}`);

  // Contar por status
  const byStatus = {};
  allRecords.forEach(r => {
    const status = r.ordenstatus || 'null';
    byStatus[status] = (byStatus[status] || 0) + 1;
  });

  console.log('\n📊 Distribución por ordenstatus:');
  Object.entries(byStatus).sort((a, b) => b[1] - a[1]).forEach(([status, count]) => {
    console.log(`  ${status}: ${count}`);
  });

  // Solo Comprados
  const comprados = allRecords.filter(r => r.ordenstatus === 'Comprado');
  console.log(`\n📋 IDs con ordenstatus='Comprado': ${comprados.length}`);
  comprados.forEach(r => console.log(`  ${r.ordencompra}`));
}

main().catch(console.error);
