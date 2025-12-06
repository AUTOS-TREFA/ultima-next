#!/bin/bash

# Script para probar conexión a Supabase

echo "=== Test de Conexión a Supabase ==="
echo ""

# Extraer información del .env.local
SUPABASE_URL=$(grep NEXT_PUBLIC_SUPABASE_URL .env.local | cut -d '=' -f2 | tr -d '"' | tr -d "'")
PROJECT_REF=$(echo $SUPABASE_URL | sed 's/https:\/\///' | cut -d '.' -f1)

echo "URL del proyecto: $SUPABASE_URL"
echo "Project Reference: $PROJECT_REF"
echo ""

# Formato correcto de connection string
echo "Formato correcto de Connection String para Supabase:"
echo ""
echo "1. Connection Pooling (Recomendado para scripts):"
echo "   postgresql://postgres.${PROJECT_REF}:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres"
echo ""
echo "2. Direct Connection:"
echo "   postgresql://postgres.[YOUR-PASSWORD]@db.${PROJECT_REF}.supabase.co:5432/postgres"
echo ""
echo "Nota: Reemplaza [YOUR-PASSWORD] con tu contraseña real de Supabase"
echo ""
echo "Para obtener la contraseña:"
echo "1. Ve a: https://supabase.com/dashboard/project/${PROJECT_REF}/settings/database"
echo "2. Busca 'Connection string' o 'Database password'"
echo "3. Si no la tienes, haz click en 'Reset database password'"

