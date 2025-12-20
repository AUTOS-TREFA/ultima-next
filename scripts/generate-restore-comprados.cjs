/**
 * Generar UPDATEs para restaurar descripciones de los 35 Comprados
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

function getColValue(values, colName) {
  const idx = COLUMNS.indexOf(colName);
  return idx !== -1 && idx < values.length ? values[idx] : null;
}

async function main() {
  console.log('📖 Leyendo backup...');
  const content = fs.readFileSync(BACKUP_FILE, 'utf-8');

  const valuesIdx = content.indexOf('VALUES ');
  const valuesStr = content.substring(valuesIdx + 7);

  console.log('📊 Parseando...');
  const comprados = [];
  let pos = 0;

  while (pos < valuesStr.length) {
    const result = parseRecord(valuesStr, pos);
    if (!result) break;

    const { values, endPos } = result;

    if (getColValue(values, 'ordenstatus') === 'Comprado') {
      comprados.push({
        ordencompra: getColValue(values, 'ordencompra'),
        descripcion: getColValue(values, 'descripcion'),
        feature_image_url: getColValue(values, 'feature_image_url'),
        fotos_exterior_url: getColValue(values, 'fotos_exterior_url'),
        fotos_interior_url: getColValue(values, 'fotos_interior_url'),
      });
    }

    pos = endPos;
    while (pos < valuesStr.length && valuesStr[pos] !== '(') pos++;
  }

  console.log(`✅ Encontrados ${comprados.length} Comprados`);

  // Generar UPDATEs individuales
  const updates = [];

  comprados.forEach((r, i) => {
    if (!r.ordencompra) return;

    const oc = r.ordencompra.replace(/'/g, "''");
    const sets = [];

    if (r.descripcion) {
      const desc = r.descripcion.replace(/'/g, "''");
      sets.push(`descripcion = COALESCE(NULLIF(descripcion, ''), '${desc}')`);
    }

    if (r.feature_image_url) {
      const url = r.feature_image_url.replace(/'/g, "''");
      sets.push(`feature_image_url = COALESCE(NULLIF(feature_image_url, ''), '${url}')`);
    }

    if (sets.length > 0) {
      updates.push({
        ordencompra: r.ordencompra,
        sql: `UPDATE inventario_cache SET ${sets.join(', ')} WHERE ordencompra = '${oc}';`
      });
    }
  });

  console.log(`📝 Generados ${updates.length} UPDATEs`);

  // Guardar cada UPDATE en un archivo JSON para fácil procesamiento
  fs.writeFileSync('/Users/marianomorales/Downloads/restore_updates.json', JSON.stringify(updates, null, 2));
  console.log('💾 Guardado en: /Users/marianomorales/Downloads/restore_updates.json');

  // Mostrar estadísticas
  const conDesc = comprados.filter(r => r.descripcion).length;
  const conFeature = comprados.filter(r => r.feature_image_url).length;
  console.log(`\n📊 Estadísticas:`);
  console.log(`   Con descripcion: ${conDesc}`);
  console.log(`   Con feature_image_url: ${conFeature}`);
}

main().catch(console.error);
