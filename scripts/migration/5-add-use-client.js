#!/usr/bin/env node
/**
 * Migration Script 5: Add 'use client' Directives
 *
 * This script:
 * 1. Scans components and pages for client-side features
 * 2. Adds 'use client' directive where needed
 * 3. Identifies Server Component candidates
 * 4. Creates a report of changes
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { glob } from 'glob';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../..');

console.log('🚀 Starting Next.js Migration - Phase 5: Add "use client" Directives');
console.log('═'.repeat(60));

// Patterns that indicate a file needs 'use client'
const CLIENT_INDICATORS = [
  /\buseState\b/,
  /\buseEffect\b/,
  /\buseContext\b/,
  /\buseReducer\b/,
  /\buseCallback\b/,
  /\buseMemo\b/,
  /\buseRef\b/,
  /\buseLayoutEffect\b/,
  /\buseImperativeHandle\b/,
  /\buseDebugValue\b/,
  /\buseTransition\b/,
  /\buseDeferredValue\b/,
  /\buseId\b/,
  /\buseQuery\b/,
  /\buseMutation\b/,
  /\buseForm\b/,
  /\buseFieldArray\b/,
  /\buseWatch\b/,
  /\buseFormContext\b/,
  /\buseController\b/,
  /from ['"]react-hook-form['"]/,
  /from ['"]@tanstack\/react-query['"]/,
  /onClick\s*=/,
  /onChange\s*=/,
  /onSubmit\s*=/,
  /onFocus\s*=/,
  /onBlur\s*=/,
  /addEventListener/,
  /createContext/,
  /\bwindow\./,
  /\blocalstorage\./i,
  /\bsessionstorage\./i,
  /\bnavigator\./,
  /\bdocument\./,
];

// Files that should always be client components
const ALWAYS_CLIENT = [
  /\/context\//i,
  /Context\.tsx?$/,
  /Provider\.tsx?$/,
  /AuthHandler/,
  /RedirectManager/,
  /LeadSourceHandler/,
  /ErrorBoundary/,
  /ProtectedRoute/,
  /PublicRoute/,
  /AdminRoute/,
  /SalesRoute/,
];

// Helper: Check if file needs 'use client'
function needsUseClient(filePath, content) {
  // Skip if already has 'use client' or 'use server'
  if (content.match(/^['"]use (client|server)['"]/m)) {
    return false;
  }

  // Check for always-client patterns
  for (const pattern of ALWAYS_CLIENT) {
    if (pattern.test(filePath)) {
      return true;
    }
  }

  // Check for client-side code patterns
  for (const pattern of CLIENT_INDICATORS) {
    if (pattern.test(content)) {
      return true;
    }
  }

  return false;
}

// Helper: Add 'use client' to file
function addUseClient(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // Skip if already has directive
  if (content.match(/^['"]use (client|server)['"]/m)) {
    return { modified: false, reason: 'Already has directive' };
  }

  // Find first import or code line
  const lines = content.split('\n');
  let insertIndex = 0;

  // Skip comments at the top
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line && !line.startsWith('//') && !line.startsWith('/*') && !line.startsWith('*')) {
      insertIndex = i;
      break;
    }
  }

  // Insert 'use client' directive
  lines.splice(insertIndex, 0, "'use client';", '');
  content = lines.join('\n');

  // Create backup
  fs.writeFileSync(filePath + '.backup', fs.readFileSync(filePath));

  // Write updated content
  fs.writeFileSync(filePath, content);

  return { modified: true, reason: 'Added use client directive' };
}

// Step 1: Scan components
console.log('\n🔍 Scanning components and pages...');

const patterns = [
  'src/components/**/*.tsx',
  'src/components/**/*.ts',
  'src/pages/**/*.tsx',
  'src/pages/**/*.ts',
  'src/context/**/*.tsx',
  'src/context/**/*.ts',
  'src/hooks/**/*.tsx',
  'src/hooks/**/*.ts',
];

let totalFiles = 0;
let clientFiles = 0;
let serverFiles = 0;
let skippedFiles = 0;
const results = [];

for (const pattern of patterns) {
  const files = glob.sync(pattern, { cwd: rootDir, absolute: true });

  for (const file of files) {
    totalFiles++;
    const content = fs.readFileSync(file, 'utf8');
    const relativePath = path.relative(rootDir, file);

    if (needsUseClient(file, content)) {
      const result = addUseClient(file);
      if (result.modified) {
        clientFiles++;
        console.log(`  ✓ ${relativePath} → Client Component`);
        results.push({
          file: relativePath,
          type: 'client',
          modified: true,
          reason: result.reason,
        });
      } else {
        skippedFiles++;
        console.log(`  - ${relativePath} (${result.reason})`);
        results.push({
          file: relativePath,
          type: 'client',
          modified: false,
          reason: result.reason,
        });
      }
    } else {
      serverFiles++;
      console.log(`  • ${relativePath} → Server Component candidate`);
      results.push({
        file: relativePath,
        type: 'server',
        modified: false,
        reason: 'No client-side features detected',
      });
    }
  }
}

// Step 2: Create migration report
console.log('\n📊 Creating migration report...');
const report = {
  timestamp: new Date().toISOString(),
  summary: {
    totalFiles,
    clientComponents: clientFiles,
    serverComponents: serverFiles,
    skippedFiles,
    modificationRate: ((clientFiles / totalFiles) * 100).toFixed(1) + '%',
  },
  clientIndicators: CLIENT_INDICATORS.map(r => r.toString()),
  alwaysClientPatterns: ALWAYS_CLIENT.map(r => r.toString()),
  results,
  recommendations: [
    'Review server component candidates for potential server-side rendering',
    'Consider using Server Components for static content',
    'Client Components with minimal interactivity could be split',
    'Use Suspense boundaries for client components with data fetching',
  ],
};

const reportPath = path.join(__dirname, 'use-client-migration-report.json');
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
console.log(`  ✓ Report saved to: use-client-migration-report.json`);

console.log('\n✅ Phase 5 Complete: "use client" directives added');
console.log('\n  📊 Summary:');
console.log(`     Total files scanned: ${totalFiles}`);
console.log(`     Client Components: ${clientFiles}`);
console.log(`     Server Components: ${serverFiles}`);
console.log(`     Skipped: ${skippedFiles}`);
console.log(`     Modification rate: ${((clientFiles / totalFiles) * 100).toFixed(1)}%`);
console.log('\n  💡 Tips:');
console.log('     - Server Components can fetch data directly');
console.log('     - Use "use client" only when necessary');
console.log('     - Consider splitting components for better performance');
console.log('\n' + '═'.repeat(60));
