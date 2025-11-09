#!/usr/bin/env node
/**
 * Script para corregir imports incorrectos en páginas generadas
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { glob } from 'glob';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('🔧 Corrigiendo imports de páginas...\n');

// Primero, obtener todos los archivos reales en src/pages/
const realPageFiles = glob.sync('src/pages/*.tsx', { cwd: rootDir });
const pageNameMap = new Map();

// Crear mapa de nombres reales (sin extensión)
realPageFiles.forEach(file => {
  const fullPath = path.join(rootDir, file);
  const fileName = path.basename(file, '.tsx');
  pageNameMap.set(fileName.toLowerCase(), fileName);
});

console.log(`📁 Encontrados ${pageNameMap.size} archivos en src/pages/\n`);

// Ahora buscar todos los page.tsx en app/
const appPages = glob.sync('app/**/page.tsx', { cwd: rootDir });

let fixedCount = 0;
let errorCount = 0;

appPages.forEach(pageFile => {
  const fullPath = path.join(rootDir, pageFile);
  let content = fs.readFileSync(fullPath, 'utf8');

  // Buscar el import actual
  const importMatch = content.match(/import\s+(\w+)\s+from\s+['"]@\/pages\/(\w+)['"]/);

  if (importMatch) {
    const importedName = importMatch[1];
    const importPath = importMatch[2];

    // Buscar el nombre correcto (case-insensitive)
    const correctName = pageNameMap.get(importPath.toLowerCase());

    if (correctName && correctName !== importPath) {
      // Corregir el import
      const newImport = `import ${importedName} from '@/pages/${correctName}'`;
      const oldImport = importMatch[0];

      content = content.replace(oldImport, newImport);
      fs.writeFileSync(fullPath, content);

      console.log(`✓ ${pageFile}`);
      console.log(`  ${importPath} → ${correctName}`);
      fixedCount++;
    } else if (!correctName) {
      console.log(`✗ ${pageFile}`);
      console.log(`  ⚠️  No se encontró archivo para: ${importPath}`);
      errorCount++;
    }
  }
});

console.log(`\n📊 Resumen:`);
console.log(`   ✓ Corregidos: ${fixedCount}`);
console.log(`   ⚠️  Errores: ${errorCount}`);
console.log(`   ━ Total páginas: ${appPages.length}\n`);

if (errorCount > 0) {
  console.log('⚠️  Revisa los archivos con errores manualmente\n');
}
