/**
 * Google Apps Script - Sync Google Sheets to Supabase v2
 *
 * CAMBIO: Usa SELECT + PATCH/POST en lugar de on_conflict upsert
 * Esto evita el problema de caché de PostgREST con constraints
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
  'AutoLlaves': 'auto_llaves',
  'AutoDuenos': 'numero_duenos',
  'UnidadEnReparacion': 'en_reparacion',
  'SucursalFisica': 'ubicacion',
  'Utilitario': 'utilitario'
};

const CAMPOS_BOOLEANOS = ['Consigna', 'Separado', 'Vendido', 'UnidadEnReparacion', 'Utilitario'];
const CAMPOS_NUMERICOS = ['AutoPrecioVenta', 'AutoAño', 'AutoKilometraje', 'AutoDuenos'];
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

  const headerIndex = {};
  headers.forEach((h, i) => headerIndex[h] = i);

  const scriptProps = PropertiesService.getScriptProperties();
  const lastSyncStr = scriptProps.getProperty('LAST_SYNC_TIME');
  const lastSyncTime = lastSyncStr ? new Date(lastSyncStr) : new Date(0);

  const allSupabaseColumns = Object.values(CAMPO_MAPPING);
  const registros = [];
  const lastUpdatedIdx = headerIndex['LastUpdated'];

  rows.forEach((row, rowIndex) => {
    const ordenCompra = row[headerIndex['OrdenCompra']];
    if (!ordenCompra) return;

    if (lastUpdatedIdx !== undefined) {
      const rowLastUpdated = row[lastUpdatedIdx];
      if (rowLastUpdated instanceof Date && rowLastUpdated <= lastSyncTime) {
        return;
      }
    }

    const registro = {};
    allSupabaseColumns.forEach(col => registro[col] = null);

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

      if (typeof valor === 'string') {
        valor = valor.replace(/^["']+|["']+$/g, '').trim();
        if (valor === '') continue;
      }

      registro[supabaseCol] = valor;
    }

    if (registro.ordencompra) {
      delete registro.updated_at;
      registros.push(registro);
    }
  });

  if (registros.length === 0) {
    Logger.log('No hay cambios desde última sincronización');
    return;
  }

  // Process each record with SELECT + PATCH/POST
  let updated = 0, inserted = 0, errors = 0;

  for (const registro of registros) {
    try {
      const result = upsertRecord(registro);
      if (result === 'updated') updated++;
      else if (result === 'inserted') inserted++;
    } catch (e) {
      Logger.log('Error: ' + e.message);
      errors++;
    }

    // Rate limiting - wait 100ms between requests
    Utilities.sleep(100);
  }

  scriptProps.setProperty('LAST_SYNC_TIME', new Date().toISOString());
  Logger.log(`Sincronización completa: ${updated} actualizados, ${inserted} insertados, ${errors} errores`);
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
 * Upsert a single record using SELECT + PATCH/POST
 */
function upsertRecord(registro) {
  const ordencompra = registro.ordencompra;

  // Step 1: Check if record exists
  const checkUrl = `${CONFIG.SUPABASE_URL}/rest/v1/${CONFIG.TABLE}?ordencompra=eq.${encodeURIComponent(ordencompra)}&select=id`;

  const checkOptions = {
    method: 'GET',
    headers: {
      'apikey': CONFIG.SUPABASE_KEY,
      'Authorization': `Bearer ${CONFIG.SUPABASE_KEY}`
    },
    muteHttpExceptions: true
  };

  const checkResponse = UrlFetchApp.fetch(checkUrl, checkOptions);
  const checkCode = checkResponse.getResponseCode();

  if (checkCode !== 200) {
    throw new Error(`Check failed: ${checkCode} - ${checkResponse.getContentText()}`);
  }

  const existing = JSON.parse(checkResponse.getContentText());

  if (existing && existing.length > 0) {
    // Step 2a: Record exists - UPDATE with PATCH
    const updateUrl = `${CONFIG.SUPABASE_URL}/rest/v1/${CONFIG.TABLE}?ordencompra=eq.${encodeURIComponent(ordencompra)}`;

    const updateOptions = {
      method: 'PATCH',
      headers: {
        'apikey': CONFIG.SUPABASE_KEY,
        'Authorization': `Bearer ${CONFIG.SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      payload: JSON.stringify(registro),
      muteHttpExceptions: true
    };

    const updateResponse = UrlFetchApp.fetch(updateUrl, updateOptions);
    const updateCode = updateResponse.getResponseCode();

    if (updateCode !== 200 && updateCode !== 204) {
      throw new Error(`Update failed: ${updateCode} - ${updateResponse.getContentText()}`);
    }

    return 'updated';

  } else {
    // Step 2b: Record doesn't exist - INSERT with POST
    const insertUrl = `${CONFIG.SUPABASE_URL}/rest/v1/${CONFIG.TABLE}`;

    const insertOptions = {
      method: 'POST',
      headers: {
        'apikey': CONFIG.SUPABASE_KEY,
        'Authorization': `Bearer ${CONFIG.SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      payload: JSON.stringify(registro),
      muteHttpExceptions: true
    };

    const insertResponse = UrlFetchApp.fetch(insertUrl, insertOptions);
    const insertCode = insertResponse.getResponseCode();

    if (insertCode !== 200 && insertCode !== 201) {
      throw new Error(`Insert failed: ${insertCode} - ${insertResponse.getContentText()}`);
    }

    return 'inserted';
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

    if (typeof valor === 'string') {
      valor = valor.replace(/^["']+|["']+$/g, '').trim();
      if (valor === '') continue;
    }

    registro[supabaseCol] = valor;
  }

  delete registro.updated_at;

  const result = upsertRecord(registro);
  Logger.log(`Synced: ${ordenCompra} (${result})`);
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

/**
 * Test upsert with a single record
 */
function testUpsert() {
  const testRecord = {
    ordencompra: 'TEST_APPS_SCRIPT',
    ordenstatus: 'Comprado',
    marca: 'Test',
    modelo: 'Apps Script Test'
  };

  try {
    const result = upsertRecord(testRecord);
    Logger.log(`Test upsert: ${result}`);

    // Clean up test record
    const deleteUrl = `${CONFIG.SUPABASE_URL}/rest/v1/${CONFIG.TABLE}?ordencompra=eq.TEST_APPS_SCRIPT`;
    UrlFetchApp.fetch(deleteUrl, {
      method: 'DELETE',
      headers: {
        'apikey': CONFIG.SUPABASE_KEY,
        'Authorization': `Bearer ${CONFIG.SUPABASE_KEY}`
      }
    });
    Logger.log('Test record cleaned up');
  } catch (e) {
    Logger.log('Test failed: ' + e.message);
  }
}
