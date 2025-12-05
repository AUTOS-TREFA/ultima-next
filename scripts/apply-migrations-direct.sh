#!/bin/bash
# Script simplificado para aplicar migraciones directamente
# Asume que ya estás autenticado en Supabase

set -e

echo "🚀 Aplicando migraciones de optimización..."
echo ""

# Verificar que estamos en el directorio correcto
if [ ! -d "supabase/migrations" ]; then
    echo "❌ Error: Directorio supabase/migrations no encontrado"
    exit 1
fi

# Contar migraciones
MIGRATION_COUNT=$(find supabase/migrations -name "*.sql" -type f | wc -l | tr -d ' ')
echo "📊 Migraciones locales: ${MIGRATION_COUNT}"
echo ""

# Intentar aplicar migraciones
echo "📤 Aplicando migraciones..."
npx supabase db push --linked --include-all

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Migraciones aplicadas exitosamente"
    echo ""
    echo "📊 Mejoras esperadas:"
    echo "   - Dashboard de ventas: 40-60% más rápido"
    echo "   - Queries con RLS (sales): 50-70% más rápidas"
else
    echo ""
    echo "❌ Error al aplicar migraciones"
    echo "Verifica que estés autenticado: npx supabase login"
    exit 1
fi
