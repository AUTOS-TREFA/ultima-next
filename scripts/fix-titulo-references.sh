#!/bin/bash

# Script para corregir referencias a 'titulo' por 'title' en archivos TypeScript/JavaScript
# Fecha: 2025-12-08
# Problema: La tabla inventario_cache tiene columna 'title' no 'titulo'

set -e

# Colores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}╔═══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   Corrección de Referencias 'titulo' → 'title'              ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Función para hacer backup de un archivo
backup_file() {
    local file=$1
    local backup="${file}.pre-titulo-fix.bak"

    if [ ! -f "$backup" ]; then
        cp "$file" "$backup"
        echo -e "${GREEN}  ✓ Backup creado: ${backup}${NC}"
    fi
}

# Función para corregir un archivo
fix_file() {
    local file=$1

    echo -e "${YELLOW}Procesando: ${file}${NC}"

    # Hacer backup
    backup_file "$file"

    # Contar ocurrencias antes
    local before_count=$(grep -o "titulo" "$file" | wc -l | tr -d ' ')

    if [ "$before_count" -eq 0 ]; then
        echo -e "${GREEN}  ✓ Sin cambios necesarios${NC}"
        return 0
    fi

    # Hacer los reemplazos con sed (compatible con macOS)
    # 1. En select queries: .select('...titulo...')
    sed -i '' "s/\.select(['\"][^'\"]*titulo/&/g; s/titulo/title/g" "$file" 2>/dev/null || true

    # 2. En interfaces/types TypeScript: titulo: string
    sed -i '' 's/\btitulo:/title:/g' "$file"

    # 3. En acceso a propiedades: .titulo o ['titulo']
    sed -i '' "s/\.titulo\b/.title/g" "$file"
    sed -i '' "s/\['titulo'\]/['title']/g" "$file"
    sed -i '' 's/"titulo"/"title"/g' "$file"

    # Contar ocurrencias después
    local after_count=$(grep -o "titulo" "$file" | wc -l | tr -d ' ')

    # Calcular cambios
    local changes=$((before_count - after_count))

    if [ "$changes" -gt 0 ]; then
        echo -e "${GREEN}  ✓ Corregidas ${changes} referencias${NC}"
        return 0
    else
        echo -e "${YELLOW}  ⚠ No se pudieron hacer cambios automáticos${NC}"
        return 1
    fi
}

# Contador de resultados
success_count=0
fail_count=0
skip_count=0

# Lista de archivos a procesar (excluyendo backups)
files=(
    "src/components/shadcn-studio/blocks/portfolio-04/portfolio-04.tsx"
    "src/page-components/AuthPage.tsx"
    "src/components/VehicleGridCard.tsx"
    "src/components/FavoritesQuickAccess.tsx"
    "src/page-components/VehicleDetailPage.tsx"
    "src/page-components/DashboardSidebarPage.tsx"
    "src/page-components/Application.tsx"
    "src/page-components/HomePage.tsx"
    "src/page-components/FinanciamientosPage.tsx"
    "src/services/AirtableDirectService.ts"
    "src/utils/formatters.ts"
    "src/services/VehicleService.ts"
    "src/services/BusinessAnalyticsService.ts"
    "src/page-components/ResponsiveInventoryPage.tsx"
    "src/page-components/RapidInventoryPage.tsx"
    "src/page-components/R2ImageManagerPage.tsx"
    "src/page-components/LandingPage.tsx"
    "src/page-components/KitTrefaPage.tsx"
    "src/page-components/ExplorarPage.tsx"
    "src/page-components/CarStudioPage.tsx"
    "src/page-components/AdminInspectionsListPage.tsx"
    "src/page-components/AdminBusinessAnalyticsDashboard.tsx"
    "src/components/application/steps/VehicleSelectionStep.tsx"
    "src/components/application/steps/VehicleFinancingStep.tsx"
    "src/components/application/EnhancedApplication.tsx"
    "src/components/VehicleSelector.tsx"
    "src/components/VehicleListCardB.tsx"
    "src/components/VehicleCard.tsx"
    "src/components/SimpleVehicleCard.tsx"
    "src/components/MobileHeader.tsx"
    "src/components/InventorySliderCard.tsx"
    "src/components/HeroVehicleSlider.tsx"
    "src/components/HeroVehicleScroller.tsx"
    "src/components/HeroVehicleCard.tsx"
    "src/components/HeaderSearchBar.tsx"
    "src/components/EdgeVehicleCard.tsx"
    "src/components/DashboardVehicleCard.tsx"
    "src/components/CarSwiper.tsx"
    "src/components/AnimatedVehicleGrid.tsx"
)

echo -e "${YELLOW}Procesando ${#files[@]} archivos principales...${NC}"
echo ""

for file in "${files[@]}"; do
    if [ ! -f "$file" ]; then
        echo -e "${YELLOW}  ⊘ Archivo no existe: $file${NC}"
        ((skip_count++))
        continue
    fi

    if fix_file "$file"; then
        ((success_count++))
    else
        ((fail_count++))
    fi
    echo ""
done

echo ""
echo -e "${GREEN}╔═══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                    Resumen de Corrección                     ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "✅ Archivos corregidos exitosamente: ${GREEN}$success_count${NC}"
if [ $fail_count -gt 0 ]; then
    echo -e "⚠️  Archivos con advertencias: ${YELLOW}$fail_count${NC}"
fi
if [ $skip_count -gt 0 ]; then
    echo -e "⊘  Archivos omitidos (no existen): ${YELLOW}$skip_count${NC}"
fi
echo ""

if [ $success_count -gt 0 ]; then
    echo -e "${YELLOW}📋 Próximos pasos:${NC}"
    echo ""
    echo "1. Verifica los cambios:"
    echo "   git diff src/"
    echo ""
    echo "2. Prueba la aplicación:"
    echo "   npm run dev"
    echo ""
    echo "3. Si todo funciona correctamente, elimina los backups:"
    echo "   find src -name '*.pre-titulo-fix.bak' -delete"
    echo ""
    echo "4. Haz commit de los cambios:"
    echo "   git add ."
    echo "   git commit -m \"fix: Corregir referencias 'titulo' a 'title' en inventario_cache\""
    echo ""
fi

echo -e "${GREEN}¡Corrección completada!${NC}"
