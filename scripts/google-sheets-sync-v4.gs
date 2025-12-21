/**
 * Google Apps Script - Sync Google Sheets to Supabase
 * Version: 4.0 - NEW ID SYSTEM (TRF as ordencompra, ID as legacy_id)
 *
 * CAMBIOS v4.0:
 * - OrdenCompra ahora contiene formato TRF (ej: TRF001452)
 * - Campo ID guardado como legacy_id para referencia histórica
 * - Mantiene seguridad: nunca sobrescribe con valores vacíos
 *
 * SETUP:
 * 1. Open Google Sheet > Extensions > Apps Script
 * 2. Paste this code
 * 3. Update CONFIG.SHEET_NAME to match your tab name
 * 4. Run setupTrigger() once to create the onChange trigger
 */

const CONFIG = {
  SUPABASE_URL: 'https://mhlztgilrmgebkyqowxz.supabase.co',
  SUPABASE_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1obHp0Z2lscm1nZWJreXFvd3h6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjEyMjkyMCwiZXhwIjoyMDgxNjk4OTIwfQ.E4GbZ4KR9NfyPnbNS1Ic6bi3xzW1-9sBNC15BTRpDzg',
  TABLE: 'inventario_cache',
  SHEET_NAME: 'OrdenCompra',
  PRIMARY_KEY: 'ordencompra'
};

// Mapping: Google Sheets column name → Supabase column name
// NOTA v4.0: OrdenCompra ahora contiene TRF######, ID contiene el legacy ID######
const CAMPO_MAPPING = {
  'OrdenCompra': 'ordencompra',      // TRF format (primary key)
  'ID': 'legacy_id',                 // Legacy ID format for reference
  'OrdenStatus': 'ordenstatus',
  'AutoFactura': 'factura',
  'AutoPrecioVenta': 'precio',
  'AutoKilometraje': 'kilometraje',  // Now NUMERIC in database
  'Consigna': 'consigna',
  'OrdenID': 'orden_id',
  'OrdenFecha': 'orden_fecha',
  'HistoricoFecha': 'historico_fecha',
  'Separado': 'separado',
  'FechaSeparado': 'fecha_separado',
  'Vendido': 'vendido',
  'FechaVendido': 'fecha_vendido',
  'AutoMarca': 'marca',
  'AutoSubmarcaVersion': 'modelo',
  'AutoAño': 'autoano',
  'AutoTransmision': 'autotransmision',
  'AutoLlaves': 'auto_llaves',
  'AutoDuenos': 'numero_duenos',
  'UnidadEnReparacion': 'en_reparacion',
  'SucursalFisica': 'ubicacion',
  'Utilitario': 'utilitario'
  // NOTE: 'updated_at' removed - let database set it automatically
};

// Boolean fields (convert "TRUE"/"FALSE" strings to actual booleans)
const CAMPOS_BOOLEANOS = ['Consigna', 'Separado', 'Vendido', 'UnidadEnReparacion', 'Utilitario'];

// Boolean fields that should default to FALSE when empty (instead of being skipped)
const CAMPOS_BOOLEANOS_DEFAULT_FALSE = ['Utilitario', 'Consigna', 'Separado', 'UnidadEnReparacion'];

// Numeric fields (includes kilometraje - now NUMERIC in database)
const CAMPOS_NUMERICOS = ['AutoPrecioVenta', 'AutoAño', 'AutoKilometraje', 'AutoDuenos', 'AutoLlaves'];

// Date fields
const CAMPOS_FECHA = ['OrdenFecha', 'HistoricoFecha', 'FechaSeparado', 'FechaVendido'];

/**
 * Run once to setup the trigger
 */
function setupTrigger() {
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => ScriptApp.deleteTrigger(trigger));

  ScriptApp.newTrigger('onSheetChange')
    .forSpreadsheet(SpreadsheetApp.getActiveSpreadsheet())
    .onChange()
    .create();

  Logger.log('✅ Trigger configurado correctamente');
}

/**
 * Triggered on any change to the spreadsheet
 */
function onSheetChange(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.SHEET_NAME);
  if (!sheet) return;
  syncAllRows();
}

/**
 * Manual function to sync all rows
 */
function syncAllRows() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.SHEET_NAME);
  if (!sheet) {
    Logger.log('❌ Sheet not found: ' + CONFIG.SHEET_NAME);
    return;
  }

  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const rows = data.slice(1);

  // Build header index map
  const headerIndex = {};
  headers.forEach((h, i) => headerIndex[h] = i);

  // Get last sync time from script properties
  const scriptProps = PropertiesService.getScriptProperties();
  const lastSyncStr = scriptProps.getProperty('LAST_SYNC_TIME');
  const lastSyncTime = lastSyncStr ? new Date(lastSyncStr) : new Date(0);

  const lastUpdatedIdx = headerIndex['LastUpdated'];

  // Process each row - only those modified since last sync
  const registros = [];

  rows.forEach((row, rowIndex) => {
    const ordenCompra = row[headerIndex['OrdenCompra']];
    if (!ordenCompra) return; // Skip empty rows

    // Check if row was modified since last sync
    if (lastUpdatedIdx !== undefined) {
      const rowLastUpdated = row[lastUpdatedIdx];
      if (rowLastUpdated instanceof Date && rowLastUpdated <= lastSyncTime) {
        return; // Skip unchanged rows
      }
    }

    // ══════════════════════════════════════════════════════════════════
    // SAFE: Only include fields that have actual values
    // DO NOT initialize with nulls - this would overwrite existing data
    // ══════════════════════════════════════════════════════════════════
    const registro = {};

    for (const [sheetCol, supabaseCol] of Object.entries(CAMPO_MAPPING)) {
      if (headerIndex[sheetCol] === undefined) continue;

      let valor = row[headerIndex[sheetCol]];

      // Handle booleans FIRST (before skip logic) - some should default to FALSE
      if (CAMPOS_BOOLEANOS.includes(sheetCol)) {
        if (valor === '' || valor === null || valor === undefined || valor === 'FALSE' || valor === 'false' || valor === false || valor === 0) {
          // If this field should default to FALSE, set it; otherwise skip
          if (CAMPOS_BOOLEANOS_DEFAULT_FALSE.includes(sheetCol)) {
            valor = false;
          } else {
            continue; // Skip empty boolean that doesn't have default
          }
        } else {
          valor = valor === true || valor === 'TRUE' || valor === 'true' || valor === 1;
        }
      }
      // Skip empty values for non-boolean fields - DO NOT send null/empty to Supabase
      else if (valor === '' || valor === null || valor === undefined) continue;

      // Handle numerics (including kilometraje which is now NUMERIC)
      if (CAMPOS_NUMERICOS.includes(sheetCol)) {
        // Clean string values first
        if (typeof valor === 'string') {
          valor = valor.replace(/[^0-9.-]/g, '');
        }
        valor = Number(valor);
        if (isNaN(valor) || valor === 0) continue; // Skip invalid or zero values
      }

      // Handle dates
      if (CAMPOS_FECHA.includes(sheetCol)) {
        if (valor instanceof Date) {
          valor = valor.toISOString();
        } else if (typeof valor === 'string' && valor.trim() !== '') {
          const parsed = new Date(valor);
          if (!isNaN(parsed.getTime())) {
            valor = parsed.toISOString();
          } else {
            continue; // Skip invalid dates
          }
        } else {
          continue;
        }
      }

      // Clean string values (remove extra quotes)
      if (typeof valor === 'string') {
        valor = valor.replace(/^["']+|["']+$/g, '').trim();
        if (valor === '') continue;
      }

      registro[supabaseCol] = valor;
    }

    // Only add if we have ordencompra (required for upsert)
    if (registro.ordencompra) {
      registros.push(registro);
    }
  });

  if (registros.length === 0) {
    Logger.log('ℹ️ No hay cambios desde última sincronización');
    return;
  }

  Logger.log(`📤 Sincronizando ${registros.length} registros...`);

  // Upsert to Supabase in batches
  const BATCH_SIZE = 50;
  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < registros.length; i += BATCH_SIZE) {
    const batch = registros.slice(i, i + BATCH_SIZE);
    const result = upsertToSupabase(batch);
    if (result) {
      successCount += batch.length;
    } else {
      errorCount += batch.length;
    }
  }

  // Update last sync time
  scriptProps.setProperty('LAST_SYNC_TIME', new Date().toISOString());

  Logger.log(`✅ Sincronización completada: ${successCount} éxitos, ${errorCount} errores`);

  // Trigger sync to Airtable for new records
  if (successCount > 0) {
    Logger.log('🔄 Sincronizando nuevos registros a Airtable...');
    triggerAirtableSync();
  }
}

/**
 * Force full sync (ignores last sync time)
 */
function forceFullSync() {
  const scriptProps = PropertiesService.getScriptProperties();
  scriptProps.deleteProperty('LAST_SYNC_TIME');
  Logger.log('🔄 Forzando sincronización completa...');
  syncAllRows();
}

/**
 * Upsert records to Supabase
 * Uses merge-duplicates to only update fields that are sent, preserving others
 *
 * FIX: PostgREST requires all objects in a batch to have the same keys (PGRST102)
 * So we group records by their key signature and upsert each group separately
 */
function upsertToSupabase(registros) {
  if (!registros || registros.length === 0) return true;

  // Group records by their key signature (set of keys)
  const groups = {};
  registros.forEach(registro => {
    const keySignature = Object.keys(registro).sort().join(',');
    if (!groups[keySignature]) {
      groups[keySignature] = [];
    }
    groups[keySignature].push(registro);
  });

  const url = `${CONFIG.SUPABASE_URL}/rest/v1/${CONFIG.TABLE}?on_conflict=${CONFIG.PRIMARY_KEY}`;
  let allSuccess = true;

  // Upsert each group separately (same keys within each group)
  for (const [signature, group] of Object.entries(groups)) {
    const options = {
      method: 'POST',
      headers: {
        'apikey': CONFIG.SUPABASE_KEY,
        'Authorization': `Bearer ${CONFIG.SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates'  // CRITICAL: merge, don't replace
      },
      payload: JSON.stringify(group),
      muteHttpExceptions: true
    };

    try {
      const response = UrlFetchApp.fetch(url, options);
      const code = response.getResponseCode();

      if (code !== 200 && code !== 201) {
        Logger.log(`❌ Error Supabase: ${code} - ${response.getContentText().substring(0, 300)}`);
        Logger.log(`   Keys in failed group: ${signature}`);
        allSuccess = false;
      } else {
        Logger.log(`✅ Upserted group: ${group.length} records (keys: ${signature.split(',').length})`);
      }
    } catch (error) {
      Logger.log(`❌ Error de red: ${error.message}`);
      allSuccess = false;
    }

    // Small delay between groups to avoid rate limiting
    Utilities.sleep(100);
  }

  if (allSuccess) {
    Logger.log(`✅ All ${registros.length} records upserted successfully`);
  }
  return allSuccess;
}

/**
 * Sync a single row by OrdenCompra (useful for testing)
 */
function syncSingleRow(ordenCompra) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.SHEET_NAME);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const headerIndex = {};
  headers.forEach((h, i) => headerIndex[h] = i);

  const row = data.find(r => r[headerIndex['OrdenCompra']] == ordenCompra);
  if (!row) {
    Logger.log('❌ OrdenCompra not found: ' + ordenCompra);
    return;
  }

  const registro = {};

  for (const [sheetCol, supabaseCol] of Object.entries(CAMPO_MAPPING)) {
    if (headerIndex[sheetCol] === undefined) continue;

    let valor = row[headerIndex[sheetCol]];
    if (valor === '' || valor === null || valor === undefined) continue;

    if (CAMPOS_BOOLEANOS.includes(sheetCol)) {
      valor = valor === true || valor === 'TRUE' || valor === 'true' || valor === 1;
    }

    if (CAMPOS_NUMERICOS.includes(sheetCol)) {
      if (typeof valor === 'string') {
        valor = valor.replace(/[^0-9.-]/g, '');
      }
      valor = Number(valor);
      if (isNaN(valor) || valor === 0) continue;
    }

    if (CAMPOS_FECHA.includes(sheetCol) && valor instanceof Date) {
      valor = valor.toISOString();
    }

    if (typeof valor === 'string') {
      valor = valor.replace(/^["']+|["']+$/g, '').trim();
      if (valor === '') continue;
    }

    registro[supabaseCol] = valor;
  }

  if (!registro.ordencompra) {
    Logger.log('❌ No ordencompra found in row');
    return;
  }

  upsertToSupabase([registro]);
  Logger.log('✅ Synced: ' + ordenCompra);
}

/**
 * Test connection to Supabase
 */
function testConnection() {
  const url = `${CONFIG.SUPABASE_URL}/rest/v1/${CONFIG.TABLE}?limit=1`;

  const options = {
    method: 'GET',
    headers: {
      'apikey': CONFIG.SUPABASE_KEY,
      'Authorization': `Bearer ${CONFIG.SUPABASE_KEY}`
    },
    muteHttpExceptions: true
  };

  try {
    const response = UrlFetchApp.fetch(url, options);
    const code = response.getResponseCode();

    if (code === 200) {
      Logger.log('✅ Conexión exitosa a Supabase');
      Logger.log(`Response: ${response.getContentText().substring(0, 200)}`);
    } else {
      Logger.log(`❌ Error: ${code} - ${response.getContentText()}`);
    }
  } catch (error) {
    Logger.log(`❌ Error de conexión: ${error.message}`);
  }
}

/**
 * View current sync status
 */
function viewSyncStatus() {
  const scriptProps = PropertiesService.getScriptProperties();
  const lastSync = scriptProps.getProperty('LAST_SYNC_TIME');

  Logger.log('═══════════════════════════════════════');
  Logger.log('📊 ESTADO DE SINCRONIZACIÓN');
  Logger.log('═══════════════════════════════════════');
  Logger.log(`Última sincronización: ${lastSync || 'Nunca'}`);
  Logger.log(`Tabla destino: ${CONFIG.TABLE}`);
  Logger.log(`Hoja origen: ${CONFIG.SHEET_NAME}`);
  Logger.log(`Campos mapeados: ${Object.keys(CAMPO_MAPPING).length}`);
  Logger.log('═══════════════════════════════════════');
}

/**
 * Trigger Supabase Edge Function to sync new records to Airtable
 * This creates records in Airtable that don't have an airtable_id yet
 */
function triggerAirtableSync() {
  const url = `${CONFIG.SUPABASE_URL}/functions/v1/batch-sync-airtable`;

  const options = {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${CONFIG.SUPABASE_KEY}`,
      'Content-Type': 'application/json'
    },
    payload: JSON.stringify({}),
    muteHttpExceptions: true
  };

  try {
    const response = UrlFetchApp.fetch(url, options);
    const code = response.getResponseCode();
    const result = response.getContentText();

    if (code === 200 || code === 201) {
      const data = JSON.parse(result);
      Logger.log(`✅ Airtable sync: ${data.created || 0} creados, ${data.skipped || 0} omitidos`);
    } else {
      Logger.log(`⚠️ Airtable sync warning: ${code} - ${result.substring(0, 200)}`);
    }
  } catch (error) {
    Logger.log(`⚠️ Airtable sync error: ${error.message}`);
  }
}

/**
 * Manual function to trigger Airtable sync
 */
function manualAirtableSync() {
  Logger.log('🔄 Iniciando sincronización manual a Airtable...');
  triggerAirtableSync();
}
