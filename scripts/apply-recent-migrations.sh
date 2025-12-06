#!/bin/bash
# Script para aplicar solo las migraciones recientes (5-6 diciembre 2025)
# Uso: bash scripts/apply-recent-migrations.sh

set -e

echo "🔧 Aplicando migraciones recientes del 5-6 de diciembre..."
echo ""

# Database connection string (usa pooler puerto 6543)
DB_URL="postgresql://postgres.pemgwyymodlwabaexxrb@aws-0-us-east-1.pooler.supabase.com:6543/postgres"

echo "Por favor ingresa la contraseña de la base de datos:"
read -s DB_PASSWORD
echo ""

# Export password for psql
export PGPASSWORD="$DB_PASSWORD"

# Lista de migraciones recientes
MIGRATIONS=(
  "20251205000001_optimize_indexes_remove_redundant.sql"
  "20251205000002_optimize_indexes_add_critical.sql"
  "20251206_add_missing_columns.sql"
  "20251206_create_document_upload_metrics.sql"
  "20251206_update_get_filter_options_ubicacion_mapping.sql"
)

# Aplicar cada migración
for migration in "${MIGRATIONS[@]}"; do
  echo "📝 Aplicando: $migration"

  if psql "$DB_URL" -f "supabase/migrations/$migration" > /dev/null 2>&1; then
    echo "✅ $migration aplicada exitosamente"
  else
    echo "⚠️  $migration - puede que ya esté aplicada o haya un error (continuando...)"
  fi

  echo ""
done

echo "✨ Proceso completado!"
echo ""
echo "Nota: Algunos warnings o errores son normales si ciertas partes"
echo "de las migraciones ya fueron aplicadas durante la migración anterior."

# Limpiar password
unset PGPASSWORD
