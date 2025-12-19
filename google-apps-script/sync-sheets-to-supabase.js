/**
 * Google Apps Script - Sync Google Sheets to Supabase
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
  SHEET_NAME: 'OrdenCompra', // ← UPDATE THIS to match your tab name
  PRIMARY_KEY: 'ordencompra'
};

// Mapping: Google Sheets column name → Supabase column name
// NOTE: updated_at is NOT included - let database use default value (now())
const CAMPO_MAPPING = {
  'OrdenCompra': 'ordencompra',
  'OrdenStatus': 'ordenstatus',
  'AutoFactura': 'factura',
  'AutoPrecioVenta': 'precio',
  'AutoKilometraje': 'kilometraje',
  'Consigna': 'consigna',
  'OrdenID': 'orden_id',
  'OrdenFecha': 'orden_fecha',
  'HistoricoFecha': 'historico_fecha',
  'Separado': 'separado',
  'FechaSeparado': 'fecha_separado',
  'Vendido': 'vendido',
  'FechaVendido': 'fecha_vendido',
  'AutoMarca': 'marca',
  'AutoSubMarcaVersion': 'modelo',
  'AutoAño': 'autoano',
  'AutoTransmision': 'autotransmision',
  'UsuarioComprador': 'usuario_comprador',
  'AutoLlaves': 'auto_llaves',
  'AutoDuenos': 'numero_duenos',
  'UnidadEnReparacion': 'en_reparacion',
  'SucursalFisica': 'ubicacion',
  'Utilitario' : 'utilitario'
};

// Boolean fields (convert "TRUE"/"FALSE" strings to actual booleans)
const CAMPOS_BOOLEANOS = ['Consigna', 'Separado', 'Vendido', 'UnidadEnReparacion', 'Utilitario'];

// Numeric fields
const CAMPOS_NUMERICOS = ['AutoPrecioVenta', 'AutoAño', 'AutoKilometraje', 'AutoDuenos'];

// Date fields
const CAMPOS_FECHA = ['OrdenFecha', 'HistoricoFecha', 'FechaSeparado', 'FechaVendido'];

/**
 * Run once to setup the trigger
 */
function setupTrigger() {
  // Remove existing triggers
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => ScriptApp.deleteTrigger(trigger));

  // Create new onChange trigger
  ScriptApp.newTrigger('onSheetChange')
    .forSpreadsheet(SpreadsheetApp.getActiveSpreadsheet())
    .onChange()
    .create();

  Logger.log('Trigger configurado correctamente');
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
    Logger.log('Sheet not found: ' + CONFIG.SHEET_NAME);
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

  // Get all Supabase column names for consistent keys
  const allSupabaseColumns = Object.values(CAMPO_MAPPING);

  // Process each row - only those modified since last sync
  const registros = [];
  const lastUpdatedIdx = headerIndex['LastUpdated'];

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

    // Initialize with all keys set to null
    const registro = {};
    allSupabaseColumns.forEach(col => registro[col] = null);

    for (const [sheetCol, supabaseCol] of Object.entries(CAMPO_MAPPING)) {
      if (headerIndex[sheetCol] === undefined) continue;

      let valor = row[headerIndex[sheetCol]];

      // Skip empty values (keep as null)
      if (valor === '' || valor === null || valor === undefined) continue;

      // Handle booleans
      if (CAMPOS_BOOLEANOS.includes(sheetCol)) {
        valor = valor === true || valor === 'TRUE' || valor === 'true' || valor === 1;
      }

      // Handle numerics
      if (CAMPOS_NUMERICOS.includes(sheetCol)) {
        valor = Number(valor);
        if (isNaN(valor)) continue;
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
            continue;
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

    if (registro.ordencompra) {
      // Remove updated_at to let database use default value (now())
      delete registro.updated_at;
      registros.push(registro);
    }
  });

  if (registros.length === 0) {
    Logger.log('No hay cambios desde última sincronización');
    return;
  }

  // Upsert to Supabase in batches
  const BATCH_SIZE = 50;
  for (let i = 0; i < registros.length; i += BATCH_SIZE) {
    const batch = registros.slice(i, i + BATCH_SIZE);
    upsertToSupabase(batch);
  }

  // Update last sync time
  scriptProps.setProperty('LAST_SYNC_TIME', new Date().toISOString());

  Logger.log(`Sincronizados ${registros.length} registros`);
}

/**
 * Force full sync (ignores last sync time)
 */
function forceFullSync() {
  const scriptProps = PropertiesService.getScriptProperties();
  scriptProps.deleteProperty('LAST_SYNC_TIME');
  syncAllRows();
}

/**
 * Upsert records to Supabase (insert or update, never overwrite with empty)
 */
function upsertToSupabase(registros) {
  const url = `${CONFIG.SUPABASE_URL}/rest/v1/${CONFIG.TABLE}?on_conflict=${CONFIG.PRIMARY_KEY}`;

  const options = {
    method: 'POST',
    headers: {
      'apikey': CONFIG.SUPABASE_KEY,
      'Authorization': `Bearer ${CONFIG.SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'resolution=merge-duplicates'
    },
    payload: JSON.stringify(registros),
    muteHttpExceptions: true
  };

  const response = UrlFetchApp.fetch(url, options);
  const code = response.getResponseCode();

  if (code !== 200 && code !== 201) {
    Logger.log(`Error Supabase: ${code} - ${response.getContentText()}`);
  } else {
    Logger.log(`Batch upserted: ${registros.length} records`);
  }
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
    Logger.log('OrdenCompra not found: ' + ordenCompra);
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
      valor = Number(valor);
      if (isNaN(valor)) continue;
    }

    if (CAMPOS_FECHA.includes(sheetCol) && valor instanceof Date) {
      valor = valor.toISOString();
    }

    // Clean string values
    if (typeof valor === 'string') {
      valor = valor.replace(/^["']+|["']+$/g, '').trim();
      if (valor === '') continue;
    }

    registro[supabaseCol] = valor;
  }

  // Remove updated_at to let database use default value (now())
  delete registro.updated_at;

  upsertToSupabase([registro]);
  Logger.log('Synced: ' + ordenCompra);
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

  const response = UrlFetchApp.fetch(url, options);
  Logger.log(`Status: ${response.getResponseCode()}`);
  Logger.log(`Response: ${response.getContentText().substring(0, 500)}`);
}
