/**
 * Script para restaurar valores faltantes desde el backup
 * Mapea ID → TRF y actualiza solo campos NULL/vacíos
 *
 * Uso:
 *   node scripts/restore-from-backup.cjs           # Preview
 *   node scripts/restore-from-backup.cjs --execute # Aplicar
 */

const fs = require('fs');
const https = require('https');

const SUPABASE_URL = 'mhlztgilrmgebkyqowxz.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

const BACKUP_FILE = '/Users/marianomorales/Downloads/inventario_cache_rows.sql';

// Campos a restaurar del backup
const CAMPOS_A_RESTAURAR = [
  'kilometraje',
  'autotransmision',
  'ubicacion',
  'mensualidad_minima',
  'mensualidad_recomendada',
  'plazomax',
  'combustible',
  'carroceria',
  'slug'
];

function httpRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: SUPABASE_URL,
      port: 443,
      path: path,
      method: method,
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(body ? JSON.parse(body) : {});
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${body.substring(0, 300)}`));
        }
      });
    });

    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

function parseBackupFile() {
  console.log('📖 Leyendo archivo backup...');
  const content = fs.readFileSync(BACKUP_FILE, 'utf8');

  // Extraer columnas del INSERT
  const columnsMatch = content.match(/INSERT INTO [^(]+\(([^)]+)\)/);
  if (!columnsMatch) throw new Error('No se encontró estructura INSERT');

  const columns = columnsMatch[1]
    .split(',')
    .map(c => c.trim().replace(/"/g, ''));

  console.log(`📊 Columnas encontradas: ${columns.length}`);

  // Encontrar índices de las columnas que nos interesan
  const indices = {
    ordencompra: columns.indexOf('ordencompra'),
    ordenstatus: columns.indexOf('ordenstatus'),
    kilometraje: columns.indexOf('kilometraje'),
    autotransmision: columns.indexOf('autotransmision'),
    ubicacion: columns.indexOf('ubicacion'),
    mensualidad_minima: columns.indexOf('mensualidad_minima'),
    mensualidad_recomendada: columns.indexOf('mensualidad_recomendada'),
    plazomax: columns.indexOf('plazomax'),
    combustible: columns.indexOf('combustible') !== -1 ? columns.indexOf('combustible') : columns.indexOf('autocombustible'),
    carroceria: columns.indexOf('carroceria'),
    slug: columns.indexOf('slug'),
    transmision: columns.indexOf('transmision') // backup también
  };

  console.log('📍 Índices de columnas:', indices);

  // Extraer VALUES - formato: VALUES (row1), (row2), ...
  const valuesMatch = content.match(/VALUES\s*(.+)$/s);
  if (!valuesMatch) throw new Error('No se encontraron VALUES');

  const valuesStr = valuesMatch[1];

  // Parsear cada fila de valores
  const records = [];
  let depth = 0;
  let currentRow = '';
  let inString = false;
  let escapeNext = false;

  for (let i = 0; i < valuesStr.length; i++) {
    const char = valuesStr[i];

    if (escapeNext) {
      currentRow += char;
      escapeNext = false;
      continue;
    }

    if (char === '\\') {
      currentRow += char;
      escapeNext = true;
      continue;
    }

    if (char === "'" && !inString) {
      inString = true;
      currentRow += char;
    } else if (char === "'" && inString) {
      // Check for escaped quote ''
      if (valuesStr[i + 1] === "'") {
        currentRow += "''";
        i++;
      } else {
        inString = false;
        currentRow += char;
      }
    } else if (char === '(' && !inString) {
      depth++;
      if (depth === 1) {
        currentRow = '';
      } else {
        currentRow += char;
      }
    } else if (char === ')' && !inString) {
      depth--;
      if (depth === 0 && currentRow.trim()) {
        // Parsear la fila
        const rowData = parseRow(currentRow, indices);
        if (rowData && rowData.ordencompra) {
          records.push(rowData);
        }
        currentRow = '';
      } else {
        currentRow += char;
      }
    } else {
      currentRow += char;
    }
  }

  console.log(`✅ Registros parseados: ${records.length}`);
  return records;
}

function parseRow(rowStr, indices) {
  const values = [];
  let current = '';
  let inString = false;
  let depth = 0;

  for (let i = 0; i < rowStr.length; i++) {
    const char = rowStr[i];

    if (char === "'" && !inString) {
      inString = true;
    } else if (char === "'" && inString) {
      if (rowStr[i + 1] === "'") {
        current += "'";
        i++;
        continue;
      }
      inString = false;
    } else if ((char === '{' || char === '[') && !inString) {
      depth++;
      current += char;
      continue;
    } else if ((char === '}' || char === ']') && !inString) {
      depth--;
      current += char;
      continue;
    } else if (char === ',' && !inString && depth === 0) {
      values.push(cleanValue(current.trim()));
      current = '';
      continue;
    }

    current += char;
  }

  if (current.trim()) {
    values.push(cleanValue(current.trim()));
  }

  // Extraer los campos que nos interesan
  const record = {};

  if (indices.ordencompra >= 0 && values[indices.ordencompra]) {
    record.ordencompra = values[indices.ordencompra];
  }

  // Filtrar solo por ordenstatus = Comprado
  if (indices.ordenstatus >= 0 && values[indices.ordenstatus]) {
    record.ordenstatus = values[indices.ordenstatus];
  }

  // Kilometraje (puede tener formato raro como "3153'" debido al SQL)
  if (indices.kilometraje >= 0 && values[indices.kilometraje]) {
    const km = values[indices.kilometraje];
    if (km && km !== 'null') {
      const parsed = parseInt(km.toString().replace(/[^0-9]/g, ''));
      if (!isNaN(parsed) && parsed > 0) {
        record.kilometraje = parsed;
      }
    }
  }

  // Transmision (preferir autotransmision sobre transmision)
  const transIdx = indices.autotransmision >= 0 ? indices.autotransmision : indices.transmision;
  if (transIdx >= 0 && values[transIdx]) {
    const trans = values[transIdx];
    if (trans && trans !== 'null') {
      record.autotransmision = trans;
    }
  }

  // Ubicacion
  if (indices.ubicacion >= 0 && values[indices.ubicacion]) {
    const ubi = values[indices.ubicacion];
    if (ubi && ubi !== 'null') {
      record.ubicacion = ubi;
    }
  }

  // Mensualidades
  if (indices.mensualidad_minima >= 0 && values[indices.mensualidad_minima]) {
    const val = values[indices.mensualidad_minima];
    if (val && val !== 'null') {
      const parsed = parseFloat(val);
      if (!isNaN(parsed) && parsed > 0) {
        record.mensualidad_minima = parsed;
      }
    }
  }

  if (indices.mensualidad_recomendada >= 0 && values[indices.mensualidad_recomendada]) {
    const val = values[indices.mensualidad_recomendada];
    if (val && val !== 'null') {
      const parsed = parseFloat(val);
      if (!isNaN(parsed) && parsed > 0) {
        record.mensualidad_recomendada = parsed;
      }
    }
  }

  // Plazo max
  if (indices.plazomax >= 0 && values[indices.plazomax]) {
    const val = values[indices.plazomax];
    if (val && val !== 'null') {
      const parsed = parseInt(val);
      if (!isNaN(parsed) && parsed > 0) {
        record.plazomax = parsed;
      }
    }
  }

  // Combustible
  if (indices.combustible >= 0 && values[indices.combustible]) {
    const val = values[indices.combustible];
    if (val && val !== 'null') {
      record.combustible = val;
    }
  }

  // Carroceria
  if (indices.carroceria >= 0 && values[indices.carroceria]) {
    const val = values[indices.carroceria];
    if (val && val !== 'null') {
      record.carroceria = val;
    }
  }

  // Slug (importante: debe ser único)
  if (indices.slug >= 0 && values[indices.slug]) {
    const val = values[indices.slug];
    if (val && val !== 'null') {
      record.slug = val;
    }
  }

  return record;
}

function cleanValue(val) {
  if (!val || val === 'null' || val === 'NULL') return null;
  // Remover comillas simples que envuelven el valor
  if (val.startsWith("'") && val.endsWith("'")) {
    return val.slice(1, -1);
  }
  return val;
}

function convertIdToTrf(id) {
  if (!id) return null;
  if (id.startsWith('TRF')) return id;
  if (id.startsWith('ID')) {
    return 'TRF' + id.substring(2);
  }
  if (id.startsWith('OC')) {
    return 'TRF' + id.substring(2);
  }
  return id;
}

async function getCurrentRecords() {
  console.log('📡 Obteniendo registros actuales de Supabase (solo Comprado)...');
  const fields = ['ordencompra', 'ordenstatus', ...CAMPOS_A_RESTAURAR].join(',');
  const path = `/rest/v1/inventario_cache?select=${fields}&ordencompra=like.TRF*&ordenstatus=eq.Comprado&limit=5000`;

  const records = await httpRequest('GET', path);
  console.log(`📊 Registros TRF con ordenstatus=Comprado: ${records.length}`);
  return records;
}

async function updateRecord(ordencompra, updates) {
  const path = `/rest/v1/inventario_cache?ordencompra=eq.${encodeURIComponent(ordencompra)}`;
  return httpRequest('PATCH', path, updates);
}

async function checkSlugConflicts(slug, currentOrdencompra) {
  const path = `/rest/v1/inventario_cache?slug=eq.${encodeURIComponent(slug)}&ordencompra=neq.${encodeURIComponent(currentOrdencompra)}&select=ordencompra,slug`;
  const existing = await httpRequest('GET', path);
  return existing.length > 0;
}

async function main() {
  if (!SUPABASE_KEY) {
    console.error('❌ SUPABASE_SERVICE_KEY no definida');
    process.exit(1);
  }

  const executeMode = process.argv.includes('--execute');

  console.log('═'.repeat(60));
  console.log('🔄 RESTAURACIÓN DE DATOS DESDE BACKUP');
  console.log('═'.repeat(60));
  console.log(`Modo: ${executeMode ? 'EJECUCIÓN' : 'PREVIEW'}\n`);

  try {
    // 1. Parsear backup
    const backupRecords = parseBackupFile();

    // 2. Obtener registros actuales
    const currentRecords = await getCurrentRecords();
    const currentMap = new Map(currentRecords.map(r => [r.ordencompra, r]));

    // 3. Preparar actualizaciones
    const updates = [];
    const slugsToUpdate = new Map(); // Para verificar duplicados de slug

    for (const backup of backupRecords) {
      // Solo procesar registros con ordenstatus = Comprado en el backup
      if (backup.ordenstatus && backup.ordenstatus !== 'Comprado') {
        continue;
      }

      // Convertir ID → TRF
      const trfId = convertIdToTrf(backup.ordencompra);
      if (!trfId) continue;

      const current = currentMap.get(trfId);
      if (!current) {
        // No existe el TRF correspondiente
        continue;
      }

      // Determinar qué campos actualizar (solo los NULL/vacíos)
      const fieldsToUpdate = {};

      if (backup.kilometraje && (!current.kilometraje || current.kilometraje === 0)) {
        fieldsToUpdate.kilometraje = backup.kilometraje;
      }

      if (backup.autotransmision && !current.autotransmision) {
        fieldsToUpdate.autotransmision = backup.autotransmision;
      }

      if (backup.ubicacion && !current.ubicacion) {
        fieldsToUpdate.ubicacion = backup.ubicacion;
      }

      if (backup.mensualidad_minima && (!current.mensualidad_minima || current.mensualidad_minima === 0)) {
        fieldsToUpdate.mensualidad_minima = backup.mensualidad_minima;
      }

      if (backup.mensualidad_recomendada && (!current.mensualidad_recomendada || current.mensualidad_recomendada === 0)) {
        fieldsToUpdate.mensualidad_recomendada = backup.mensualidad_recomendada;
      }

      if (backup.plazomax && (!current.plazomax || current.plazomax === 0)) {
        fieldsToUpdate.plazomax = backup.plazomax;
      }

      if (backup.combustible && !current.combustible) {
        fieldsToUpdate.combustible = backup.combustible;
      }

      if (backup.carroceria && !current.carroceria) {
        fieldsToUpdate.carroceria = backup.carroceria;
      }

      // Slug requiere verificación especial
      if (backup.slug && !current.slug) {
        // Verificar que no haya conflicto con el slug
        if (slugsToUpdate.has(backup.slug)) {
          console.log(`⚠️  Slug duplicado en backup: ${backup.slug}`);
        } else {
          fieldsToUpdate.slug = backup.slug;
          slugsToUpdate.set(backup.slug, trfId);
        }
      }

      if (Object.keys(fieldsToUpdate).length > 0) {
        updates.push({
          ordencompra: trfId,
          originalId: backup.ordencompra,
          updates: fieldsToUpdate
        });
      }
    }

    console.log(`\n📋 Actualizaciones preparadas: ${updates.length}`);

    if (updates.length === 0) {
      console.log('✅ No hay campos para actualizar');
      return;
    }

    // Mostrar ejemplos
    console.log('\n📝 Ejemplos de actualizaciones:');
    for (const u of updates.slice(0, 5)) {
      console.log(`   ${u.originalId} → ${u.ordencompra}:`);
      for (const [k, v] of Object.entries(u.updates)) {
        console.log(`      ${k}: ${String(v).substring(0, 40)}`);
      }
    }

    // Resumen por campo
    console.log('\n📊 Resumen por campo:');
    const fieldCounts = {};
    for (const u of updates) {
      for (const k of Object.keys(u.updates)) {
        fieldCounts[k] = (fieldCounts[k] || 0) + 1;
      }
    }
    for (const [k, v] of Object.entries(fieldCounts)) {
      console.log(`   ${k}: ${v} registros`);
    }

    if (executeMode) {
      console.log('\n🚀 Aplicando actualizaciones...\n');
      let success = 0, errors = 0;

      for (const u of updates) {
        try {
          // Verificar conflicto de slug si es necesario
          if (u.updates.slug) {
            const hasConflict = await checkSlugConflicts(u.updates.slug, u.ordencompra);
            if (hasConflict) {
              console.log(`⚠️  Slug conflict: ${u.updates.slug} - skipping slug for ${u.ordencompra}`);
              delete u.updates.slug;
              if (Object.keys(u.updates).length === 0) continue;
            }
          }

          await updateRecord(u.ordencompra, u.updates);
          success++;
          process.stdout.write(`\r✅ ${success}/${updates.length} actualizados`);
        } catch (err) {
          errors++;
          console.error(`\n❌ Error en ${u.ordencompra}: ${err.message}`);
        }

        // Rate limiting
        await new Promise(r => setTimeout(r, 50));
      }

      console.log(`\n\n✅ Completado: ${success} éxitos, ${errors} errores`);
    } else {
      console.log('\n⚠️  Modo preview. Ejecuta con --execute para aplicar.');
    }

  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

main();
