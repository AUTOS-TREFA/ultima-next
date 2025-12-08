#!/usr/bin/env node
/**
 * Check inventory_cache table status
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://pemgwyymodlwabaexxrb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBlbWd3eXltb2Rsd2FiYWV4eHJiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI5OTE1MTYsImV4cCI6MjA3ODU2NzUxNn0.wfwBKfCuDYmBX_Hi5KvqtNmLLpbgQllPnUaPfoDrYok';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkInventory() {
    console.log('🔍 Checking inventario_cache table...\n');

    // Get total count
    const { count: total, error: totalError } = await supabase
        .from('inventario_cache')
        .select('*', { count: 'exact', head: true });

    if (totalError) {
        console.error('❌ Error getting total count:', totalError);
        return;
    }

    // Get Comprado count
    const { count: comprado, error: compradoError } = await supabase
        .from('inventario_cache')
        .select('*', { count: 'exact', head: true })
        .eq('ordenstatus', 'Comprado');

    if (compradoError) {
        console.error('❌ Error getting Comprado count:', compradoError);
        return;
    }

    // Get Historico count
    const { count: historico, error: historicoError } = await supabase
        .from('inventario_cache')
        .select('*', { count: 'exact', head: true })
        .eq('ordenstatus', 'Historico');

    if (historicoError) {
        console.error('❌ Error getting Historico count:', historicoError);
        return;
    }

    // Get vendido count
    const { count: vendido, error: vendidoError } = await supabase
        .from('inventario_cache')
        .select('*', { count: 'exact', head: true })
        .eq('vendido', true);

    if (vendidoError) {
        console.error('❌ Error getting vendido count:', vendidoError);
        return;
    }

    // Get records with other status
    const { data: otherStatus, error: otherError } = await supabase
        .from('inventario_cache')
        .select('ordenstatus')
        .neq('ordenstatus', 'Comprado')
        .neq('ordenstatus', 'Historico');

    if (otherError) {
        console.error('❌ Error getting other status:', otherError);
        return;
    }

    console.log('📊 Inventory Status:');
    console.log('='.repeat(50));
    console.log(`Total records:           ${total}`);
    console.log(`Status "Comprado":       ${comprado}`);
    console.log(`Status "Historico":      ${historico}`);
    console.log(`Marked as vendido:       ${vendido}`);
    console.log(`Other statuses:          ${otherStatus.length}`);
    console.log('='.repeat(50));

    if (otherStatus.length > 0) {
        console.log('\n⚠️  Records with other statuses:');
        const statusCounts = {};
        otherStatus.forEach(r => {
            const status = r.ordenstatus || 'NULL';
            statusCounts[status] = (statusCounts[status] || 0) + 1;
        });
        Object.entries(statusCounts).forEach(([status, count]) => {
            console.log(`  - ${status}: ${count}`);
        });
    }

    console.log('\n✅ Expected: Only "Comprado" status vehicles should be visible');
    console.log(`   Actual visible count: ${comprado}`);

    if (total !== comprado) {
        console.log(`\n⚠️  WARNING: ${total - comprado} vehicles with non-Comprado status found!`);
        console.log('   These should be filtered out or marked as Historico.');
    }
}

checkInventory().catch(console.error);
