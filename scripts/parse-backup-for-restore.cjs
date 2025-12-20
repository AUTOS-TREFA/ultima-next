/**
 * Script para parsear el backup SQL y extraer datos para restauración
 * Genera un archivo JSON con los datos a restaurar
 */

const fs = require('fs');
const path = require('path');

const BACKUP_FILE = '/Users/marianomorales/Downloads/inventario_cache_rows.sql';
const OUTPUT_FILE = '/Users/marianomorales/Downloads/backup_data_to_restore.json';

// Campos que queremos extraer del backup para restaurar
const FIELDS_TO_EXTRACT = [
  'ordencompra',
  'fotos_exterior_url',
  'fotos_interior_url',
  'feature_image_url',
  'feature_image',
  'descripcion',
  'created_at',
  'titulo',
  'garantia'
];

function parseBackupSQL() {
  console.log('📖 Leyendo archivo de backup...');
  const content = fs.readFileSync(BACKUP_FILE, 'utf-8');

  console.log('🔍 Parseando registros...');

  // El formato es: INSERT INTO "public"."inventario_cache" (...columns...) VALUES (...), (...), ...
  // Necesitamos extraer los nombres de columnas y los valores

  // Encontrar la lista de columnas
  const columnsMatch = content.match(/INSERT INTO "public"\."inventario_cache" \(([^)]+)\)/);
  if (!columnsMatch) {
    throw new Error('No se encontró la estructura de columnas en el backup');
  }

  const columnsStr = columnsMatch[1];
  const columns = columnsStr.split(',').map(c => c.trim().replace(/"/g, ''));

  console.log(`📋 Columnas encontradas: ${columns.length}`);

  // Encontrar los índices de las columnas que nos interesan
  const fieldIndices = {};
  FIELDS_TO_EXTRACT.forEach(field => {
    const idx = columns.indexOf(field);
    if (idx !== -1) {
      fieldIndices[field] = idx;
    }
  });

  console.log('📍 Índices de campos a extraer:', fieldIndices);

  // Extraer los VALUES
  // Buscar después de "VALUES " y parsear cada tupla
  const valuesStart = content.indexOf('VALUES ');
  if (valuesStart === -1) {
    throw new Error('No se encontró VALUES en el backup');
  }

  const valuesContent = content.substring(valuesStart + 7);

  // Parsear cada registro (cada tupla entre paréntesis)
  const records = [];
  let currentPos = 0;
  let recordCount = 0;

  while (currentPos < valuesContent.length) {
    // Buscar inicio de tupla
    const tupleStart = valuesContent.indexOf('(', currentPos);
    if (tupleStart === -1) break;

    // Encontrar el final de la tupla (considerando strings con paréntesis)
    let tupleEnd = tupleStart + 1;
    let depth = 1;
    let inString = false;
    let stringChar = null;
    let escaped = false;

    while (tupleEnd < valuesContent.length && depth > 0) {
      const char = valuesContent[tupleEnd];

      if (escaped) {
        escaped = false;
        tupleEnd++;
        continue;
      }

      if (char === '\\') {
        escaped = true;
        tupleEnd++;
        continue;
      }

      if (!inString && (char === "'" || char === '"')) {
        inString = true;
        stringChar = char;
      } else if (inString && char === stringChar) {
        // Check for escaped quote
        if (tupleEnd + 1 < valuesContent.length && valuesContent[tupleEnd + 1] === stringChar) {
          tupleEnd++; // Skip escaped quote
        } else {
          inString = false;
          stringChar = null;
        }
      } else if (!inString) {
        if (char === '(') depth++;
        else if (char === ')') depth--;
      }

      tupleEnd++;
    }

    if (depth !== 0) {
      console.warn(`⚠️ Tupla mal formada en posición ${tupleStart}`);
      currentPos = tupleEnd;
      continue;
    }

    const tupleContent = valuesContent.substring(tupleStart + 1, tupleEnd - 1);

    // Parsear los valores de la tupla
    const values = parseCSVValues(tupleContent);

    if (values.length >= columns.length - 5) { // Permitir algunas columnas faltantes
      const record = {};
      let hasData = false;

      FIELDS_TO_EXTRACT.forEach(field => {
        const idx = fieldIndices[field];
        if (idx !== undefined && idx < values.length) {
          let value = values[idx];

          // Limpiar valor
          if (value === 'null' || value === 'NULL') {
            value = null;
          } else if (value && value.startsWith("'") && value.endsWith("'")) {
            value = value.slice(1, -1).replace(/''/g, "'");
          }

          record[field] = value;

          // Verificar si tiene datos útiles para restaurar
          if (field !== 'ordencompra' && value && value !== '' && value !== 'null') {
            hasData = true;
          }
        }
      });

      if (record.ordencompra && hasData) {
        records.push(record);
      }
    }

    recordCount++;
    if (recordCount % 100 === 0) {
      process.stdout.write(`\r⏳ Procesados ${recordCount} registros...`);
    }

    currentPos = tupleEnd + 1;
  }

  console.log(`\n✅ Total registros parseados: ${recordCount}`);
  console.log(`✅ Registros con datos para restaurar: ${records.length}`);

  return records;
}

function parseCSVValues(str) {
  const values = [];
  let current = '';
  let inString = false;
  let stringChar = null;
  let depth = 0;

  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    const nextChar = str[i + 1];

    if (!inString && (char === "'" || char === '"')) {
      inString = true;
      stringChar = char;
      current += char;
    } else if (inString && char === stringChar) {
      if (nextChar === stringChar) {
        // Escaped quote
        current += char + nextChar;
        i++;
      } else {
        inString = false;
        stringChar = null;
        current += char;
      }
    } else if (!inString && char === '{') {
      depth++;
      current += char;
    } else if (!inString && char === '}') {
      depth--;
      current += char;
    } else if (!inString && depth === 0 && char === ',') {
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  if (current.trim()) {
    values.push(current.trim());
  }

  return values;
}

// Ejecutar
try {
  const records = parseBackupSQL();

  // Guardar a JSON
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(records, null, 2));
  console.log(`💾 Datos guardados en: ${OUTPUT_FILE}`);

  // Mostrar estadísticas
  const stats = {
    total: records.length,
    con_fotos_ext: records.filter(r => r.fotos_exterior_url && r.fotos_exterior_url !== 'null').length,
    con_fotos_int: records.filter(r => r.fotos_interior_url && r.fotos_interior_url !== 'null').length,
    con_descripcion: records.filter(r => r.descripcion && r.descripcion !== 'null').length,
    con_feature_url: records.filter(r => r.feature_image_url && r.feature_image_url !== 'null').length,
    con_titulo: records.filter(r => r.titulo && r.titulo !== 'null').length,
  };

  console.log('\n📊 Estadísticas del backup:');
  console.table(stats);

} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}
