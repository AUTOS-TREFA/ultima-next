#!/bin/bash

echo "Probando conexión usando Supabase CLI..."
echo ""

# Desarrollo
echo "1. Testeando DESARROLLO (pemgwyymodlwabaexxrb)..."
if supabase db --project-ref pemgwyymodlwabaexxrb -- psql -c "SELECT COUNT(*) as profiles FROM profiles" 2>/dev/null; then
    echo "✅ Desarrollo OK"
else
    echo "⚠️  Necesitas linkear el proyecto primero:"
    echo "   supabase link --project-ref pemgwyymodlwabaexxrb"
fi

echo ""

# Producción
echo "2. Testeando PRODUCCIÓN (jjepfehmuybpctdzipnu)..."
if supabase db --project-ref jjepfehmuybpctdzipnu -- psql -c "SELECT COUNT(*) as profiles FROM profiles" 2>/dev/null; then
    echo "✅ Producción OK"
else
    echo "⚠️  Necesitas linkear el proyecto primero:"
    echo "   supabase link --project-ref jjepfehmuybpctdzipnu"
fi

echo ""
echo "Alternativamente, puedes usar connection string directo:"
echo "postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"
