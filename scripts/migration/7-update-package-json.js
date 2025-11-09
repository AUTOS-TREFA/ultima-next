#!/usr/bin/env node
/**
 * Migration Script 7: Update package.json
 *
 * This script:
 * 1. Updates scripts for Next.js
 * 2. Adds Next.js dependencies
 * 3. Removes Vite-specific packages
 * 4. Creates backup of original package.json
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../..');

console.log('🚀 Starting Next.js Migration - Phase 7: Update package.json');
console.log('═'.repeat(60));

const packageJsonPath = path.join(rootDir, 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

// Create backup
const backupPath = packageJsonPath + '.backup';
fs.copyFileSync(packageJsonPath, backupPath);
console.log(`\n💾 Created backup: package.json.backup`);

// Step 1: Update scripts
console.log('\n📝 Updating scripts...');
packageJson.scripts = {
  dev: 'next dev',
  build: 'next build',
  start: 'next start',
  lint: 'next lint',
  'type-check': 'tsc --noEmit',
  sitemap: 'node generate-sitemap.js',
};

console.log('  ✓ Updated scripts to use Next.js commands');

// Step 2: Add Next.js dependencies
console.log('\n📦 Adding Next.js dependencies...');

const nextDependencies = {
  'next': '^14.2.0',
  '@supabase/auth-helpers-nextjs': '^0.10.0',
  '@supabase/ssr': '^0.5.1',
};

// Merge with existing dependencies
packageJson.dependencies = {
  ...packageJson.dependencies,
  ...nextDependencies,
};

console.log('  ✓ Added Next.js dependencies');

// Step 3: Update React to ensure compatibility
console.log('\n⚛️  Updating React versions...');
packageJson.dependencies.react = '^18.3.0';
packageJson.dependencies['react-dom'] = '^18.3.0';
console.log('  ✓ Updated React to latest compatible version');

// Step 4: Remove Vite-specific dependencies
console.log('\n🗑️  Removing Vite-specific dependencies...');

const toRemove = [
  'vite',
  '@vitejs/plugin-react',
  'vite-tsconfig-paths',
];

const devToRemove = toRemove.filter(pkg => packageJson.devDependencies?.[pkg]);
devToRemove.forEach(pkg => {
  delete packageJson.devDependencies[pkg];
  console.log(`  ✓ Removed ${pkg}`);
});

// Step 5: Add Next.js dev dependencies
console.log('\n🛠️  Adding Next.js dev dependencies...');

const nextDevDependencies = {
  '@types/node': '^20.14.0',
  'eslint-config-next': '^14.2.0',
};

packageJson.devDependencies = {
  ...packageJson.devDependencies,
  ...nextDevDependencies,
};

console.log('  ✓ Added Next.js dev dependencies');

// Step 6: Update package name and version if needed
console.log('\n📛 Updating package metadata...');
packageJson.name = packageJson.name || 'trefa-auto-inventory-next';
packageJson.version = packageJson.version || '2.0.0';
packageJson.type = 'module'; // Keep ES modules
console.log(`  ✓ Package: ${packageJson.name}@${packageJson.version}`);

// Step 7: Add engines field
packageJson.engines = {
  node: '>=18.0.0',
  npm: '>=9.0.0',
};
console.log('  ✓ Added engines field');

// Step 8: Write updated package.json
fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
console.log('\n✅ package.json updated successfully');

// Step 9: Create migration report
console.log('\n📊 Creating migration report...');

const report = {
  timestamp: new Date().toISOString(),
  changes: {
    scriptsUpdated: Object.keys(packageJson.scripts),
    dependenciesAdded: Object.keys(nextDependencies),
    dependenciesRemoved: devToRemove,
    devDependenciesAdded: Object.keys(nextDevDependencies),
    reactVersionUpdated: packageJson.dependencies.react,
  },
  nextSteps: [
    'Run: rm -rf node_modules package-lock.json',
    'Run: npm install',
    'Verify all dependencies are compatible',
  ],
};

const reportPath = path.join(__dirname, 'package-migration-report.json');
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
console.log(`  ✓ Report saved to: package-migration-report.json`);

console.log('\n✅ Phase 7 Complete: package.json updated');
console.log('\n  📊 Dependencies:');
console.log(`     Added: ${Object.keys(nextDependencies).length} new packages`);
console.log(`     Removed: ${devToRemove.length} Vite packages`);
console.log(`     Dev dependencies: ${Object.keys(nextDevDependencies).length} added`);
console.log('\n  ⚠️  Next steps:');
console.log('     1. Delete node_modules and package-lock.json');
console.log('     2. Run: npm install');
console.log('     3. Verify dependencies install correctly');
console.log('\n' + '═'.repeat(60));
