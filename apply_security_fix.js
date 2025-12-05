import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const SUPABASE_URL = 'https://pemgwyymodlwabaexxrb.supabase.co';
// TODO: Update with service_role key from Supabase Dashboard > Settings > API for project pemgwyymodlwabaexxrb
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'YOUR_SERVICE_ROLE_KEY_HERE';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const sql = readFileSync('./supabase/migrations/20251022100000_fix_increment_views_security.sql', 'utf8');

console.log('Applying security fix for increment_vehicle_views function...');

// Execute the SQL
const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

if (error) {
  console.error('Error applying fix:', error);
  console.log('\nPlease run this SQL manually in the Supabase SQL Editor:');
  console.log(sql);
  process.exit(1);
}

console.log('✅ Security fix applied successfully!');
console.log('The increment_vehicle_views function now uses SECURITY DEFINER.');
