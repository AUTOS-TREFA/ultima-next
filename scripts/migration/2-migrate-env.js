#!/usr/bin/env node
/**
 * Migration Script 2: Migrate Environment Variables
 *
 * This script:
 * 1. Reads all .env files
 * 2. Converts VITE_* variables to NEXT_PUBLIC_*
 * 3. Updates all references in the codebase
 * 4. Creates backup of original files
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { glob } from 'glob';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../..');

console.log('🚀 Starting Next.js Migration - Phase 2: Environment Variables');
console.log('═'.repeat(60));

const envMappings = {
  'VITE_SUPABASE_URL': 'NEXT_PUBLIC_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY': 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'VITE_AIRTABLE_API_KEY': 'AIRTABLE_API_KEY',
  'VITE_AIRTABLE_BASE_ID': 'AIRTABLE_BASE_ID',
  'VITE_INTELIMOTOR_API_KEY': 'INTELIMOTOR_API_KEY',
  'VITE_INTELIMOTOR_API_SECRET': 'INTELIMOTOR_API_SECRET',
  'VITE_APP_URL': 'NEXT_PUBLIC_APP_URL',
  'VITE_': 'NEXT_PUBLIC_',
};

// Step 1: Migrate .env files
console.log('\n📝 Migrating .env files...');
const envFiles = ['.env', '.env.local', '.env.development', '.env.production', '.env.example'];

envFiles.forEach(file => {
  const filePath = path.join(rootDir, file);
  if (fs.existsSync(filePath)) {
    console.log(`\n  Processing ${file}...`);

    // Create backup
    const backupPath = filePath + '.backup';
    fs.copyFileSync(filePath, backupPath);
    console.log(`    ✓ Created backup: ${file}.backup`);

    let content = fs.readFileSync(filePath, 'utf8');
    let changed = false;

    // Replace environment variable names
    Object.entries(envMappings).forEach(([oldVar, newVar]) => {
      const regex = new RegExp(`\\b${oldVar}\\b`, 'g');
      if (content.match(regex)) {
        content = content.replace(regex, newVar);
        changed = true;
        console.log(`    ✓ ${oldVar} → ${newVar}`);
      }
    });

    if (changed) {
      fs.writeFileSync(filePath, content);
      console.log(`    ✓ Updated ${file}`);
    } else {
      console.log(`    - No VITE_ variables found in ${file}`);
    }
  }
});

// Step 2: Update references in codebase
console.log('\n🔍 Updating environment variable references in code...');

const patterns = [
  'src/**/*.ts',
  'src/**/*.tsx',
  'src/**/*.js',
  'src/**/*.jsx',
  'supabaseClient.ts',
  'app/**/*.ts',
  'app/**/*.tsx',
];

let totalFiles = 0;
let totalReplacements = 0;

for (const pattern of patterns) {
  const files = glob.sync(pattern, { cwd: rootDir, absolute: true });

  files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let fileChanged = false;
    let fileReplacements = 0;

    // Replace import.meta.env.VITE_* with process.env.NEXT_PUBLIC_*
    Object.entries(envMappings).forEach(([oldVar, newVar]) => {
      // Pattern 1: import.meta.env.VITE_XXX
      const pattern1 = new RegExp(`import\\.meta\\.env\\.${oldVar}`, 'g');
      const matches1 = content.match(pattern1);
      if (matches1) {
        content = content.replace(pattern1, `process.env.${newVar}`);
        fileChanged = true;
        fileReplacements += matches1.length;
      }

      // Pattern 2: Just VITE_XXX references
      const pattern2 = new RegExp(`\\bprocess\\.env\\.${oldVar}\\b`, 'g');
      const matches2 = content.match(pattern2);
      if (matches2) {
        content = content.replace(pattern2, `process.env.${newVar}`);
        fileChanged = true;
        fileReplacements += matches2.length;
      }
    });

    if (fileChanged) {
      // Create backup
      fs.writeFileSync(file + '.backup', fs.readFileSync(file));

      // Write updated content
      fs.writeFileSync(file, content);
      totalFiles++;
      totalReplacements += fileReplacements;
      console.log(`  ✓ ${path.relative(rootDir, file)} (${fileReplacements} replacements)`);
    }
  });
}

console.log(`\n✅ Updated ${totalFiles} files with ${totalReplacements} replacements`);

// Step 3: Create migration report
console.log('\n📊 Creating migration report...');
const report = {
  timestamp: new Date().toISOString(),
  envFiles: envFiles.filter(f => fs.existsSync(path.join(rootDir, f))),
  mappings: envMappings,
  filesUpdated: totalFiles,
  totalReplacements: totalReplacements,
  backupsCreated: true,
};

const reportPath = path.join(rootDir, 'scripts/migration/env-migration-report.json');
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
console.log(`  ✓ Report saved to: env-migration-report.json`);

console.log('\n✅ Phase 2 Complete: Environment variables migrated');
console.log('\n⚠️  Important:');
console.log('  1. Review the changes before committing');
console.log('  2. Update your deployment environment variables');
console.log('  3. Backup files created with .backup extension');
console.log('  4. To rollback, run: node scripts/migration/rollback-env.js');
console.log('\n' + '═'.repeat(60));
