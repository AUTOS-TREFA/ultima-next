const { createClient } = require('@supabase/supabase-js');

// Use the SERVICE_ROLE key which bypasses RLS
const supabaseUrl = 'https://pemgwyymodlwabaexxrb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpqZXBmZWhtdXlicGN0ZHppcG51Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NDE5OTYwMywiZXhwIjoyMDU5Nzc1NjAzfQ.KwSFEXOrtgwgIjMVG-czB73VWQIVDahgDvTdyL5qSQo';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkVehicleCount() {
    try {
        console.log('Connecting with SERVICE_ROLE to check vehicle count...');
        const { count, error } = await supabase
            .from('inventario_cache')
            .select('*', { count: 'exact', head: true })
            .eq('ordenstatus', 'Comprado');

        if (error) {
            console.error('Error fetching vehicle count:', error);
        } else {
            console.log(`
=================================
RESULT: Found ${count} vehicles with status 'Comprado'.
=================================
`);
        }
    } catch (err) {
        console.error('An unexpected error occurred:', err);
    }
}

checkVehicleCount();

