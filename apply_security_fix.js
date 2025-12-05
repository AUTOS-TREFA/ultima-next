import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const SUPABASE_URL = 'https://pemgwyymodlwabaexxrb.supabase.co';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBlbWd3eXltb2Rsd2FiYWV4eHJiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Mjk5MTUxNiwiZXhwIjoyMDc4NTY3NTE2fQ.bHklvHfGuV00RNFO_KN4cpf1BhfhMfSrKR3TtMvaCNU';

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
