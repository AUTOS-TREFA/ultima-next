#!/usr/bin/env node
/**
 * Test script for Airtable → Supabase webhook sync
 *
 * This script tests the airtable-sync edge function by:
 * 1. Fetching a real record ID from Airtable
 * 2. Sending it to the edge function
 * 3. Verifying it was synced to Supabase
 *
 * Usage:
 *   AIRTABLE_API_KEY=your_key node test-webhook-sync.cjs [recordId]
 *
 * If recordId is not provided, it will fetch the first "Comprado" vehicle
 */

const AIRTABLE_API_BASE = 'https://api.airtable.com/v0';
const AIRTABLE_BASE_ID = 'appbOPKYqQRW2HgyB';
const AIRTABLE_TABLE_ID = 'tblOjECDJDZlNv8At';
const SUPABASE_FUNCTION_URL = 'https://pemgwyymodlwabaexxrb.supabase.co/functions/v1/airtable-sync';
const SUPABASE_URL = 'https://pemgwyymodlwabaexxrb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBlbWd3eXltb2Rsd2FiYWV4eHJiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI5OTE1MTYsImV4cCI6MjA3ODU2NzUxNn0.wfwBKfCuDYmBX_Hi5KvqtNmLLpbgQllPnUaPfoDrYok';

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;

async function getTestRecordId() {
    console.log('📡 Fetching a test record from Airtable...');

    if (!AIRTABLE_API_KEY) {
        throw new Error('❌ AIRTABLE_API_KEY environment variable is required');
    }

    const url = new URL(`${AIRTABLE_API_BASE}/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_ID}`);
    url.searchParams.append('filterByFormula', '{OrdenStatus} = "Comprado"');
    url.searchParams.append('maxRecords', '1');

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

    if (!data.records || data.records.length === 0) {
        throw new Error('❌ No "Comprado" records found in Airtable');
    }

    const record = data.records[0];
    console.log(`✅ Found test record: ${record.id}`);
    console.log(`   OrdenCompra: ${record.fields.OrdenCompra}`);
    console.log(`   Auto: ${record.fields.Auto || (record.fields.AutoMarca + ' ' + record.fields.AutoSubmarcaVersion)}`);

    return record.id;
}

async function testWebhookSync(recordId) {
    console.log(`\n🔄 Testing webhook sync for record: ${recordId}`);

    const response = await fetch(SUPABASE_FUNCTION_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ recordId })
    });

    const result = await response.json();

    if (!response.ok) {
        console.error('❌ Webhook failed:', result.error);
        throw new Error(result.error);
    }

    console.log('✅ Webhook succeeded!');
    console.log('   Message:', result.message);
    console.log('   Data:', JSON.stringify(result.data, null, 2));

    return result;
}

async function verifySupabaseSync(recordId) {
    console.log(`\n🔍 Verifying sync in Supabase...`);

    const url = `${SUPABASE_URL}/rest/v1/inventario_cache?record_id=eq.${recordId}&select=record_id,title,ordencompra,precio,last_synced_at`;

    const response = await fetch(url, {
        headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        }
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Supabase API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    if (!data || data.length === 0) {
        console.error('❌ Record not found in Supabase!');
        return false;
    }

    const record = data[0];
    const syncedAt = new Date(record.last_synced_at);
    const now = new Date();
    const secondsAgo = Math.floor((now - syncedAt) / 1000);

    console.log('✅ Record found in Supabase!');
    console.log('   record_id:', record.record_id);
    console.log('   title:', record.title);
    console.log('   ordencompra:', record.ordencompra);
    console.log('   precio:', record.precio);
    console.log('   last_synced_at:', record.last_synced_at);
    console.log(`   Synced ${secondsAgo} seconds ago`);

    if (secondsAgo > 60) {
        console.warn('⚠️  Warning: Record was synced more than 60 seconds ago. May not be from this test.');
    }

    return true;
}

async function main() {
    try {
        console.log('🧪 Airtable → Supabase Webhook Sync Test\n');
        console.log('=' .repeat(50));

        // Get record ID (from args or fetch from Airtable)
        let recordId = process.argv[2];

        if (!recordId) {
            recordId = await getTestRecordId();
        } else {
            console.log(`Using provided record ID: ${recordId}`);
        }

        // Test the webhook
        await testWebhookSync(recordId);

        // Wait a moment for the sync to complete
        console.log('\n⏳ Waiting 2 seconds for sync to complete...');
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Verify in Supabase
        const synced = await verifySupabaseSync(recordId);

        console.log('\n' + '='.repeat(50));
        if (synced) {
            console.log('✅ TEST PASSED: Webhook sync is working correctly!');
        } else {
            console.log('❌ TEST FAILED: Record not found in Supabase');
            process.exit(1);
        }

    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
        process.exit(1);
    }
}

main();
