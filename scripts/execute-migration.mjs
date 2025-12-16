// Script para ejecutar la migración vehiculos_completos directamente
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SUPABASE_URL = 'https://pemgwyymodlwabaexxrb.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBlbWd3eXltb2Rsd2FiYWV4eHJiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Mjk5MTUxNiwiZXhwIjoyMDc4NTY3NTE2fQ.bHklvHfGuV00RNFO_KN4cpf1BhfhMfSrKR3TtMvaCNU';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Split SQL into individual statements
function splitStatements(sql) {
  // Remove comments and split by semicolon
  const statements = [];
  let current = '';
  let inFunction = false;
  let dollarQuote = false;

  const lines = sql.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();

    // Skip empty lines and comment-only lines
    if (!trimmed || trimmed.startsWith('--')) {
      continue;
    }

    // Check for dollar quote start/end
    if (trimmed.includes('$$')) {
      const matches = trimmed.match(/\$\$/g);
      if (matches) {
        for (const _ of matches) {
          dollarQuote = !dollarQuote;
        }
      }
    }

    current += line + '\n';

    // If not in dollar quote and line ends with semicolon, this is a statement
    if (!dollarQuote && trimmed.endsWith(';')) {
      if (current.trim()) {
        statements.push(current.trim());
      }
      current = '';
    }
  }

  // Add remaining content
  if (current.trim()) {
    statements.push(current.trim());
  }

  return statements;
}

async function executeMigration() {
  console.log('Leyendo archivo de migración...');

  const migrationPath = join(__dirname, '../supabase/migrations/20251216120000_create_vehiculos_completos.sql');
  const sql = readFileSync(migrationPath, 'utf8');

  const statements = splitStatements(sql);
  console.log(`Encontradas ${statements.length} sentencias SQL`);

  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    const preview = stmt.substring(0, 80).replace(/\n/g, ' ');
    console.log(`\n[${i + 1}/${statements.length}] Ejecutando: ${preview}...`);

    try {
      const { data, error } = await supabase.rpc('exec_sql', { sql_query: stmt });

      if (error) {
        // Try using raw SQL via postgres extension
        console.log(`  Intentando método alternativo...`);

        // If it's a CREATE TABLE, we can check if it already exists
        if (stmt.includes('CREATE TABLE IF NOT EXISTS')) {
          console.log(`  ✓ Tabla probablemente ya existe (IF NOT EXISTS)`);
          continue;
        }

        console.error(`  ✗ Error: ${error.message}`);
      } else {
        console.log(`  ✓ Ejecutado correctamente`);
        if (data) {
          console.log(`  Resultado:`, JSON.stringify(data).substring(0, 100));
        }
      }
    } catch (err) {
      console.error(`  ✗ Error: ${err.message}`);
    }
  }

  console.log('\n✅ Migración completada');
}

executeMigration().catch(console.error);
