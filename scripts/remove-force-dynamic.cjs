#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// List of files to clean up (from grep results)
const filesToCheck = [
  'app/(standalone)/explorar/page.tsx',
  'app/(public)/[slug]/page.tsx',
  'app/(public)/asesor/[id]/page.tsx',
  'app/(public)/vacantes/page.tsx',
  'app/(public)/vacantes/[id]/page.tsx',
  'app/(public)/carroceria/[carroceria]/page.tsx',
  'app/(public)/kit-trefa/page.tsx',
  'app/(public)/promociones/page.tsx',
  'app/(public)/marcas/[marca]/page.tsx',
  'app/(public)/changelog/page.tsx',
  'app/(public)/landing/page.tsx',
  'app/(public)/vender-mi-auto/page.tsx',
  'app/(public)/intel/page.tsx',
  'app/escritorio/ventas/leads/page.tsx',
  'app/escritorio/ventas/dashboard/page.tsx',
  'app/escritorio/ventas/crm/page.tsx',
  'app/escritorio/ventas/cliente/[id]/page.tsx',
  'app/escritorio/vende-tu-auto/page.tsx',
  'app/escritorio/solicitudes/page.tsx',
  'app/escritorio/seguimiento/page.tsx',
  'app/escritorio/seguimiento/[id]/page.tsx',
  'app/escritorio/profile/page.tsx',
  'app/escritorio/perfilacion-bancaria/page.tsx',
  'app/escritorio/mis-aplicaciones/page.tsx',
  'app/escritorio/marketing/page.tsx',
  'app/escritorio/marketing/constructor/page.tsx',
  'app/escritorio/favoritos/page.tsx',
  'app/escritorio/encuesta/page.tsx',
  'app/escritorio/dashboard/page.tsx',
  'app/escritorio/citas/page.tsx',
  'app/escritorio/car-studio/page.tsx',
  'app/escritorio/beta-v.0.1/page.tsx',
  'app/escritorio/aplicacion/page.tsx',
  'app/escritorio/aplicacion/[id]/page.tsx',
  'app/escritorio/admin/valuation/page.tsx',
  'app/escritorio/admin/vacantes/page.tsx',
  'app/escritorio/admin/vacantes/[id]/candidatos/page.tsx',
  'app/escritorio/admin/usuarios/page.tsx',
  'app/escritorio/admin/r2-images/page.tsx',
  'app/escritorio/admin/marketing/page.tsx',
  'app/escritorio/admin/marketing-config/page.tsx',
  'app/escritorio/admin/marketing-analytics/page.tsx',
  'app/escritorio/admin/leads/page.tsx',
  'app/escritorio/admin/inspections/page.tsx',
  'app/escritorio/admin/inspections/[id]/page.tsx',
  'app/escritorio/admin/dashboard/page.tsx',
  'app/escritorio/admin/crm/page.tsx',
  'app/escritorio/admin/config/page.tsx',
  'app/escritorio/admin/compras/page.tsx',
  'app/escritorio/admin/compras/[listingId]/page.tsx',
  'app/escritorio/admin/cliente/[id]/page.tsx',
  'app/escritorio/admin/client/[id]/page.tsx',
  'app/escritorio/admin/airtable/page.tsx',
  'app/(bank)/bank-login/page.tsx',
  'app/(bank)/bank-dashboard/page.tsx',
  'app/(bank)/bank-dashboard/leads/[id]/page.tsx',
  'app/(auth)/admin/login/page.tsx',
  'app/(auth)/acceder/page.tsx',
];

let filesModified = 0;
let filesChecked = 0;

console.log('🧹 Limpiando force-dynamic de client components...\n');

filesToCheck.forEach(relativePath => {
  const filePath = path.join(process.cwd(), relativePath);

  if (!fs.existsSync(filePath)) {
    console.log(`⏭️  Saltando ${relativePath} (no existe)`);
    return;
  }

  filesChecked++;
  const content = fs.readFileSync(filePath, 'utf8');

  // Check if file has both 'use client' and force-dynamic
  if (content.includes("'use client'") && content.includes("export const dynamic = 'force-dynamic'")) {
    // Remove the force-dynamic line and the empty line after it if exists
    let newContent = content
      .replace(/export const dynamic = 'force-dynamic';\n\n/g, '')
      .replace(/export const dynamic = 'force-dynamic';\n/g, '');

    fs.writeFileSync(filePath, newContent, 'utf8');
    filesModified++;
    console.log(`✅ ${relativePath}`);
  } else if (content.includes("export const dynamic = 'force-dynamic'")) {
    console.log(`⚠️  ${relativePath} tiene force-dynamic pero no es client component`);
  }
});

console.log(`\n📊 Resumen:`);
console.log(`   Archivos revisados: ${filesChecked}`);
console.log(`   Archivos modificados: ${filesModified}`);
console.log(`\n✨ Limpieza completada!`);
