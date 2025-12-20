/**
 * Script para extraer datos del backup SQL y generar JSON
 * Usa regex más robusto para parsear los VALUES
 */

const fs = require('fs');

const BACKUP_FILE = '/Users/marianomorales/Downloads/inventario_cache_rows.sql';
const OUTPUT_FILE = '/tmp/backup_records.json';

// Índices de columnas (0-based) del backup
const COLUMN_INDICES = {
  ordencompra: 1,
  ordenstatus: 4,
  plazomax: 8,
  carroceria: 12,
  combustible: 18,
  ubicacion: 23,
  mensualidad_recomendada: 35,
  mensualidad_minima: 36,
  slug: 37,
  autotransmision: 44,
  kilometraje: 52,
  transmision: 56
};

function parseBackup() {
  console.log('📖 Leyendo archivo backup...');
  const content = fs.readFileSync(BACKUP_FILE, 'utf8');

  // Encontrar donde empiezan los VALUES
  const valuesStart = content.indexOf('VALUES');
  if (valuesStart === -1) {
    throw new Error('No se encontró VALUES en el archivo');
  }

  const valuesContent = content.substring(valuesStart + 6).trim();
  console.log(`📊 Contenido de VALUES: ${valuesContent.length} caracteres`);

  const records = [];
  let currentRecord = [];
  let currentValue = '';
  let inString = false;
  let depth = 0;
  let recordStart = false;

  for (let i = 0; i < valuesContent.length; i++) {
    const char = valuesContent[i];
    const nextChar = valuesContent[i + 1];

    // Manejar inicio de registro
    if (char === '(' && !inString && depth === 0) {
      depth = 1;
      recordStart = true;
      currentRecord = [];
      currentValue = '';
      continue;
    }

    // Manejar fin de registro
    if (char === ')' && !inString && depth === 1) {
      // Guardar último valor
      if (currentValue.trim() || currentRecord.length > 0) {
        currentRecord.push(cleanValue(currentValue));
      }

      // Procesar el registro si tiene ordencompra
      if (currentRecord.length > COLUMN_INDICES.ordencompra) {
        const ordencompra = currentRecord[COLUMN_INDICES.ordencompra];
        const ordenstatus = currentRecord[COLUMN_INDICES.ordenstatus];

        // Solo registros con ID format y ordenstatus = Comprado
        if (ordencompra && ordencompra.startsWith('ID') && ordenstatus === 'Comprado') {
          const record = {
            ordencompra: ordencompra,
            orderstatus: ordenstatus,
            plazomax: parseNumber(currentRecord[COLUMN_INDICES.plazomax]),
            carroceria: currentRecord[COLUMN_INDICES.carroceria] || null,
            combustible: currentRecord[COLUMN_INDICES.combustible] || null,
            ubicacion: currentRecord[COLUMN_INDICES.ubicacion] || null,
            mensualidad_recomendada: parseNumber(currentRecord[COLUMN_INDICES.mensualidad_recomendada]),
            mensualidad_minima: parseNumber(currentRecord[COLUMN_INDICES.mensualidad_minima]),
            slug: currentRecord[COLUMN_INDICES.slug] || null,
            autotransmision: currentRecord[COLUMN_INDICES.autotransmision] || currentRecord[COLUMN_INDICES.transmision] || null,
            kilometraje: parseNumber(currentRecord[COLUMN_INDICES.kilometraje])
          };

          // Solo incluir si tiene al menos un campo útil
          if (record.slug || record.kilometraje || record.autotransmision ||
              record.ubicacion || record.carroceria || record.combustible ||
              record.plazomax || record.mensualidad_minima || record.mensualidad_recomendada) {
            records.push(record);
          }
        }
      }

      depth = 0;
      currentRecord = [];
      currentValue = '';
      continue;
    }

    // Dentro de un registro
    if (depth === 1) {
      // Manejar strings
      if (char === "'" && !inString) {
        inString = true;
        continue;
      }

      if (char === "'" && inString) {
        // Comilla escapada ''
        if (nextChar === "'") {
          currentValue += "'";
          i++;
          continue;
        }
        inString = false;
        continue;
      }

      // Manejar paréntesis anidados (JSON, arrays)
      if ((char === '(' || char === '{' || char === '[') && !inString) {
        depth++;
        currentValue += char;
        continue;
      }

      if ((char === ')' || char === '}' || char === ']') && !inString) {
        depth--;
        if (depth < 1) depth = 1; // Mantener al menos nivel 1
        currentValue += char;
        continue;
      }

      // Separador de campo
      if (char === ',' && !inString && depth === 1) {
        currentRecord.push(cleanValue(currentValue));
        currentValue = '';
        continue;
      }

      currentValue += char;
    }
  }

  console.log(`✅ Registros extraídos: ${records.length}`);
  return records;
}

function cleanValue(val) {
  if (!val) return null;
  val = val.trim();
  if (val === 'null' || val === 'NULL' || val === '') return null;
  return val;
}

function parseNumber(val) {
  if (!val || val === 'null') return null;
  const num = parseFloat(String(val).replace(/[^0-9.-]/g, ''));
  return isNaN(num) || num === 0 ? null : num;
}

function main() {
  try {
    const records = parseBackup();

    // Escribir a archivo JSON
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(records, null, 2));
    console.log(`\n📁 Archivo guardado: ${OUTPUT_FILE}`);

    // Mostrar resumen
    console.log('\n📊 Resumen:');
    console.log(`   Total registros: ${records.length}`);

    const withSlug = records.filter(r => r.slug).length;
    const withKm = records.filter(r => r.kilometraje).length;
    const withTrans = records.filter(r => r.autotransmision).length;
    const withUbi = records.filter(r => r.ubicacion).length;

    console.log(`   Con slug: ${withSlug}`);
    console.log(`   Con kilometraje: ${withKm}`);
    console.log(`   Con transmision: ${withTrans}`);
    console.log(`   Con ubicacion: ${withUbi}`);

    // Mostrar ejemplos
    console.log('\n📝 Ejemplos:');
    records.slice(0, 3).forEach(r => {
      console.log(`   ${r.ordencompra}: slug=${r.slug}, km=${r.kilometraje}, trans=${r.autotransmision}`);
    });

  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

main();
