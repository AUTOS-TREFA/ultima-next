#!/bin/bash
# Script para aplicar optimizaciones críticas a la base de datos
# Fecha: 2025-12-05
# Ejecutar: bash scripts/apply-db-optimizations.sh

set -e

echo "🚀 Iniciando aplicación de optimizaciones críticas a la base de datos..."
echo ""

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Verificar que estamos en el directorio correcto
if [ ! -d "supabase/migrations" ]; then
    echo -e "${RED}❌ Error: Directorio supabase/migrations no encontrado${NC}"
    echo "   Ejecuta este script desde la raíz del proyecto"
    exit 1
fi

# Contar migraciones
MIGRATION_COUNT=$(ls -1 supabase/migrations/*.sql 2>/dev/null | wc -l | tr -d ' ')
echo -e "${YELLOW}📊 Migraciones locales encontradas: ${MIGRATION_COUNT}${NC}"
echo ""

# Verificar link de Supabase
echo "🔗 Verificando conexión a Supabase..."
if npx supabase projects list 2>&1 | grep -q "pemgwyymodlwabaexxrb"; then
    echo -e "${GREEN}✅ Proyecto pemgwyymodlwabaexxrb encontrado${NC}"
else
    echo -e "${YELLOW}⚠️  Ejecutando login de Supabase...${NC}"
    npx supabase login
fi
echo ""

# Link al proyecto si no está linkeado
if [ ! -f ".temp/project-ref" ]; then
    echo "🔗 Linkeando al proyecto..."
    npx supabase link --project-ref pemgwyymodlwabaexxrb
fi
echo ""

# Aplicar todas las migraciones pendientes
echo "📤 Aplicando migraciones pendientes..."
echo -e "${YELLOW}   Esto puede tardar varios minutos...${NC}"
npx supabase db push --linked

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Migraciones aplicadas exitosamente${NC}"
else
    echo -e "${RED}❌ Error al aplicar migraciones${NC}"
    exit 1
fi
echo ""

# Verificar estado de migraciones
echo "📋 Verificando estado de migraciones..."
npx supabase migration list --linked
echo ""

echo -e "${GREEN}🎉 Optimizaciones aplicadas correctamente!${NC}"
echo ""
echo "📊 Mejoras esperadas:"
echo "   - Dashboard de ventas: 40-60% más rápido"
echo "   - Queries con RLS (sales): 50-70% más rápidas"
echo "   - Espacio en disco: 10-15% reducción"
echo "   - INSERT/UPDATE: 5-10% más rápido"
echo ""
echo "⚠️  IMPORTANTE: Monitorea la aplicación durante las próximas 24 horas"
