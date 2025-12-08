#!/usr/bin/env node

/**
 * Script para actualizar URLs de imágenes externas a Cloudflare R2
 * Reemplaza las URLs de http://5.183.8.48/... con https://r2.trefa.mx/...
 */

const fs = require('fs');
const path = require('path');

const R2_BASE_URL = 'https://r2.trefa.mx';

// Mapa de reemplazos: URL antigua -> nueva ruta en R2
// SOLO imágenes de sucursales que se descargaron exitosamente
const imageReplacements = {
  // ✅ Imágenes de Sucursales (Descargadas Correctamente)
  'http://5.183.8.48/wp-content/uploads/2025/02/TREFA-San-JEronimo.jpg': `${R2_BASE_URL}/branches/TREFA-San-JEronimo.jpg`,
  'http://5.183.8.48/wp-content/uploads/2025/02/Reynosa.jpg': `${R2_BASE_URL}/branches/Reynosa.jpg`,
  'http://5.183.8.48/wp-content/uploads/2025/02/2023-02-03.jpg': `${R2_BASE_URL}/branches/Guadalupe-2023-02-03.jpg`,
  'http://5.183.8.48/wp-content/uploads/2025/02/Saltillo-Autos-TREFA.jpeg': `${R2_BASE_URL}/branches/Saltillo-Autos-TREFA.jpeg`,

  // ⚠️ Imágenes de App (NO EXISTEN - Comentadas hasta que se resuelvan)
  // 'http://5.183.8.48/wp-content/uploads/2024/09/trefa-no-encontrado.png': `${R2_BASE_URL}/app/trefa-no-encontrado.png`,
  // 'http://5.183.8.48/wp-content/uploads/2024/09/circulos-naranjas-trefa-fondo.png': `${R2_BASE_URL}/app/circulos-naranjas-trefa-fondo.png`,
};

// Archivos a actualizar
const filesToUpdate = [
  'src/utils/constants.ts',
  // Los siguientes archivos usan las imágenes PNG que NO existen
  // Comentados hasta que se resuelvan las imágenes faltantes
  // 'src/components/LocationGrid.tsx',
  // 'src/page-components/NotFoundPage.tsx',
  // 'src/page-components/VehicleListPage.tsx',
  // 'src/page-components/DashboardPage.tsx',
];

console.log('🔄 Actualizando URLs de imágenes externas a Cloudflare R2...\n');

let totalReplacements = 0;

filesToUpdate.forEach(filePath => {
  const fullPath = path.join(process.cwd(), filePath);

  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  Archivo no encontrado: ${filePath}`);
    return;
  }

  let content = fs.readFileSync(fullPath, 'utf8');
  let fileReplacements = 0;

  Object.entries(imageReplacements).forEach(([oldUrl, newUrl]) => {
    // Buscar tanto la URL directa como dentro de proxyImage()
    const patterns = [
      oldUrl,
      `proxyImage('${oldUrl}')`,
      `proxyImage("${oldUrl}")`,
    ];

    patterns.forEach(pattern => {
      if (content.includes(pattern)) {
        // Si está dentro de proxyImage(), reemplazar solo la URL
        if (pattern.includes('proxyImage')) {
          content = content.replace(pattern, `'${newUrl}'`);
        } else {
          content = content.replace(pattern, newUrl);
        }
        fileReplacements++;
        totalReplacements++;
      }
    });
  });

  if (fileReplacements > 0) {
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`✓ ${filePath}: ${fileReplacements} reemplazo(s)`);
  } else {
    console.log(`  ${filePath}: Sin cambios`);
  }
});

console.log(`\n✅ Actualización completada: ${totalReplacements} reemplazo(s) total(es)\n`);

if (totalReplacements > 0) {
  console.log('📋 Próximos pasos:');
  console.log('1. Verifica que las imágenes de sucursales se vean correctamente');
  console.log('2. Haz commit de los cambios:');
  console.log('   git add .');
  console.log('   git commit -m "feat: Migrar imágenes de sucursales a Cloudflare R2"');
  console.log('');
}

console.log('⚠️  NOTA IMPORTANTE:');
console.log('Las siguientes imágenes NO se pudieron descargar porque no existen en el servidor:');
console.log('');
console.log('  ❌ trefa-no-encontrado.png');
console.log('  ❌ circulos-naranjas-trefa-fondo.png');
console.log('');
console.log('Archivos afectados que requieren atención manual:');
console.log('  • src/page-components/NotFoundPage.tsx');
console.log('  • src/page-components/VehicleListPage.tsx');
console.log('  • src/page-components/DashboardPage.tsx');
console.log('');
console.log('Opciones:');
console.log('  1. Crear nuevas imágenes con esos nombres y subirlas a R2');
console.log('  2. Usar imágenes locales alternativas');
console.log('  3. Eliminar las referencias y usar placeholders CSS/SVG');
console.log('');
console.log('Consulta scripts/MIGRACION-IMAGENES-README.md para más detalles');
console.log('');
