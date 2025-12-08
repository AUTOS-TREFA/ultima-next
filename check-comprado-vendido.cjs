#!/usr/bin/env node
/**
 * Check Comprado vehicles that are also marked as vendido
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://pemgwyymodlwabaexxrb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBlbWd3eXltb2Rsd2FiYWV4eHJiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI5OTE1MTYsImV4cCI6MjA3ODU2NzUxNn0.wfwBKfCuDYmBX_Hi5KvqtNmLLpbgQllPnUaPfoDrYok';

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    console.log('🔍 Checking Comprado vehicles...\n');

    // Count Comprado vehicles
    const { count: totalComprado } = await supabase
        .from('inventario_cache')
        .select('*', { count: 'exact', head: true })
        .eq('ordenstatus', 'Comprado');

    console.log(`Total Comprado: ${totalComprado}`);

    // Count Comprado AND vendido = true
    const { count: compradoVendido } = await supabase
        .from('inventario_cache')
        .select('*', { count: 'exact', head: true })
        .eq('ordenstatus', 'Comprado')
        .eq('vendido', true);

    console.log(`Comprado + vendido=true: ${compradoVendido}`);

    // Count Comprado AND vendido = false or null
    const { count: compradoNoVendido } = await supabase
        .from('inventario_cache')
        .select('*', { count: 'exact', head: true })
        .eq('ordenstatus', 'Comprado')
        .or('vendido.eq.false,vendido.is.null');

    console.log(`Comprado + vendido=false/null: ${compradoNoVendido}`);

    console.log('\n💡 Expected visible count (Comprado AND NOT vendido): ' + compradoNoVendido);

    // Get sample data
    const { data: samples } = await supabase
        .from('inventario_cache')
        .select('ordencompra, title, ordenstatus, vendido, separado')
        .eq('ordenstatus', 'Comprado')
        .limit(10);

    console.log('\n📋 Sample records (first 10):');
    samples?.forEach(s => {
        console.log(`  - ${s.ordencompra}: ${s.title}`);
        console.log(`    Status: ${s.ordenstatus}, Vendido: ${s.vendido}, Separado: ${s.separado}`);
    });
}

check().catch(console.error);
