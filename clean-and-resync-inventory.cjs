#!/usr/bin/env node
/**
 * Clean inventario_cache and re-sync from Airtable
 * This script will:
 * 1. Clear all records from inventario_cache
 * 2. Sync all "Comprado" vehicles from Airtable
 */

const { createClient } = require('@supabase/supabase-js');

const AIRTABLE_API_BASE = 'https://api.airtable.com/v0';
const AIRTABLE_BASE_ID = 'appbOPKYqQRW2HgyB';
const AIRTABLE_TABLE_ID = 'tblOjECDJDZlNv8At';
const SUPABASE_FUNCTION_URL = 'https://pemgwyymodlwabaexxrb.supabase.co/functions/v1/airtable-sync';
const supabaseUrl = 'https://pemgwyymodlwabaexxrb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBlbWd3eXltb2Rsd2FiYWV4eHJiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI5OTE1MTYsImV4cCI6MjA3ODU2NzUxNn0.wfwBKfCuDYmBX_Hi5KvqtNmLLpbgQllPnUaPfoDrYok';

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;

if (!AIRTABLE_API_KEY) {
    console.error('❌ AIRTABLE_API_KEY environment variable is required');
    console.error('   Usage: AIRTABLE_API_KEY=your_key node clean-and-resync-inventory.cjs');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanInventoryCache() {
    console.log('🗑️  Cleaning inventario_cache table...\n');

    const { error } = await supabase
        .from('inventario_cache')
        .delete()
        .neq('record_id', 'DOES_NOT_EXIST'); // Delete all records

    if (error) {
        console.error('❌ Error cleaning table:', error);
        throw error;
    }

    console.log('✅ inventario_cache table cleaned\n');
}

async function getAllAirtableRecords() {
    console.log('📡 Fetching all "Comprado" records from Airtable...\n');

    const allRecords = [];
    let offset = null;

    do {
        const url = new URL(`${AIRTABLE_API_BASE}/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_ID}`);
        url.searchParams.append('filterByFormula', '{OrdenStatus} = "Comprado"');
        url.searchParams.append('pageSize', '100');
        if (offset) {
            url.searchParams.append('offset', offset);
        }

        const response = await fetch(url.toString(), {
            headers: {
                'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Airtable API error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        allRecords.push(...data.records);
        offset = data.offset;

        console.log(`  Fetched ${data.records.length} records (total so far: ${allRecords.length})`);

    } while (offset);

    console.log(`✅ Found ${allRecords.length} "Comprado" records in Airtable\n`);
    return allRecords;
}

async function syncRecord(record, index, total) {
    const recordId = record.id;
    const ordenCompra = record.fields.OrdenCompra || 'N/A';
    const auto = record.fields.Auto || (record.fields.AutoMarca + ' ' + record.fields.AutoSubmarcaVersion);

    console.log(`[${index + 1}/${total}] Syncing ${recordId} (${ordenCompra}): ${auto}`);

    try {
        const response = await fetch(SUPABASE_FUNCTION_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ recordId })
        });

        const result = await response.json();

        if (!response.ok) {
            console.error(`  ❌ Failed: ${result.error}`);
            return { success: false, error: result.error };
        }

        console.log(`  ✅ Synced successfully`);
        return { success: true };

    } catch (error) {
        console.error(`  ❌ Error: ${error.message}`);
        return { success: false, error: error.message };
    }
}

async function main() {
    console.log('🔄 Clean and Re-sync Inventory from Airtable\n');
    console.log('=' .repeat(60));

    const startTime = Date.now();

    try {
        // Step 1: Clean the table
        await cleanInventoryCache();

        // Step 2: Get all records from Airtable
        const records = await getAllAirtableRecords();

        if (records.length === 0) {
            console.log('No records to sync.');
            return;
        }

        // Step 3: Sync each record
        console.log(`Starting sync of ${records.length} records...\n`);

        const results = {
            success: 0,
            failed: 0,
            errors: []
        };

        for (let i = 0; i < records.length; i++) {
            const result = await syncRecord(records[i], i, records.length);

            if (result.success) {
                results.success++;
            } else {
                results.failed++;
                results.errors.push({
                    recordId: records[i].id,
                    error: result.error
                });
            }

            // Small delay to avoid rate limiting
            if (i < records.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        }

        const duration = ((Date.now() - startTime) / 1000).toFixed(2);

        console.log('\n' + '='.repeat(60));
        console.log('📊 Sync Complete!\n');
        console.log(`✅ Successful: ${results.success}`);
        console.log(`❌ Failed: ${results.failed}`);
        console.log(`⏱️  Duration: ${duration}s`);

        // Verify final count
        const { count: finalCount } = await supabase
            .from('inventario_cache')
            .select('*', { count: 'exact', head: true })
            .eq('ordenstatus', 'Comprado');

        console.log(`\n📊 Final count in inventario_cache: ${finalCount}`);

        if (results.errors.length > 0) {
            console.log('\n❌ Failed Records:');
            results.errors.forEach(err => {
                console.log(`  - ${err.recordId}: ${err.error}`);
            });
            process.exit(1);
        }

    } catch (error) {
        console.error('\n❌ Sync failed:', error.message);
        console.error(error);
        process.exit(1);
    }
}

main();
