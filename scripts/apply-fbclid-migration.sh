#!/bin/bash

# Script para aplicar la migración de fbclid a la base de datos de Supabase
# Este script intenta varias formas de aplicar la migración

set -e

echo "🔧 Aplicando migración: agregar columna fbclid a profiles"
echo ""

# Verificar que el archivo de migración existe
MIGRATION_FILE="supabase/migrations/20251209000001_add_fbclid_to_profiles.sql"
if [ ! -f "$MIGRATION_FILE" ]; then
    echo "❌ Error: No se encontró el archivo de migración $MIGRATION_FILE"
    exit 1
fi

echo "📝 Contenido de la migración:"
cat "$MIGRATION_FILE"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Obtener la conexión a Supabase desde .env.local
if [ -f ".env.local" ]; then
    source .env.local
fi

# Verificar que tenemos las credenciales necesarias
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo "❌ Error: No se encontraron NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local"
    echo ""
    echo "Por favor, aplica esta migración manualmente en el Supabase SQL Editor:"
    echo "  1. Ve a https://supabase.com/dashboard/project/pemgwyymodlwabaexxrb/sql/new"
    echo "  2. Copia y pega el contenido de $MIGRATION_FILE"
    echo "  3. Haz clic en 'Run'"
    exit 1
fi

# Extraer el project ID de la URL
PROJECT_REF=$(echo "$NEXT_PUBLIC_SUPABASE_URL" | sed -n 's/.*\/\/\([^.]*\).*/\1/p')

echo "📊 Información del proyecto:"
echo "   Project Ref: $PROJECT_REF"
echo "   URL: $NEXT_PUBLIC_SUPABASE_URL"
echo ""

# Intentar aplicar usando Supabase CLI
echo "🚀 Intentando aplicar migración..."
echo ""

# Método 1: Usar supabase db push con solo esta migración
echo "Método 1: Usando supabase db push..."
if npx supabase db push 2>&1 | grep -q "Applied"; then
    echo "✅ Migración aplicada exitosamente con supabase db push"
else
    echo "⚠️  supabase db push falló, intentando método alternativo..."
    echo ""

    # Método 2: Mostrar instrucciones para aplicar manualmente
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "📋 Por favor aplica la migración manualmente:"
    echo ""
    echo "1. Ve al SQL Editor de Supabase:"
    echo "   https://supabase.com/dashboard/project/$PROJECT_REF/sql/new"
    echo ""
    echo "2. Ejecuta este SQL:"
    echo ""
    cat "$MIGRATION_FILE"
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
fi

echo ""
echo "✨ Una vez aplicada la migración, podrás registrar usuarios sin error de fbclid"
