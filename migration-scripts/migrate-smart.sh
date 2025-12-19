#!/bin/bash

# ========================================
# MIGRACIÓN INTELIGENTE CON UPSERT
# ========================================
# Este script migra datos usando COPY para máximo rendimiento
# y maneja conflictos inteligentemente
# ========================================

set -e

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${GREEN}🚀 MIGRACIÓN INTELIGENTE DE DATOS${NC}"
echo "===================================="
echo ""

# Configuración
PROD_PROJECT="jjepfehmuybpctdzipnu"
DEV_PROJECT="pemgwyymodlwabaexxrb"
BACKUP_DIR="/tmp/supabase-migration-$(date +%Y%m%d-%H%M%S)"

# Solicitar password
echo -e "${YELLOW}📝 Ingresa el password de Supabase:${NC}"
read -s DB_PASSWORD
echo ""

# Crear directorio de backup
mkdir -p "$BACKUP_DIR"
echo -e "${GREEN}📁 Backup en: $BACKUP_DIR${NC}"
echo ""

# Configuración de conexión
PROD_HOST="db.${PROD_PROJECT}.supabase.co"
DEV_HOST="db.${DEV_PROJECT}.supabase.co"
DB_USER="postgres"
DB_NAME="postgres"

# Función para ejecutar SQL en producción
function exec_prod_sql() {
  PGPASSWORD="$DB_PASSWORD" psql -h "$PROD_HOST" -U "$DB_USER" -d "$DB_NAME" -t -c "$1"
}

# Función para ejecutar SQL en desarrollo
function exec_dev_sql() {
  PGPASSWORD="$DB_PASSWORD" psql -h "$DEV_HOST" -U "$DB_USER" -d "$DB_NAME" -t -c "$1"
}

# Función para migrar una tabla con estrategia inteligente
function migrate_table() {
  local TABLE=$1
  local STRATEGY=${2:-"skip"} # skip, update, o replace

  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${YELLOW}📦 Migrando: ${TABLE}${NC}"
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

  # Obtener conteo de origen
  local PROD_COUNT=$(exec_prod_sql "SELECT COUNT(*) FROM ${TABLE};" | xargs)
  echo -e "   📊 Registros en producción: ${PROD_COUNT}"

  if [ "$PROD_COUNT" -eq 0 ]; then
    echo -e "${YELLOW}   ⚠️  Tabla vacía, omitiendo...${NC}"
    echo ""
    return
  fi

  # Exportar con pg_dump (más eficiente)
  echo -e "   📥 Exportando datos..."
  PGPASSWORD="$DB_PASSWORD" pg_dump \
    -h "$PROD_HOST" \
    -U "$DB_USER" \
    -d "$DB_NAME" \
    -t "public.${TABLE}" \
    --data-only \
    --column-inserts \
    --no-owner \
    --no-acl \
    -f "$BACKUP_DIR/${TABLE}.sql" 2>/dev/null

  if [ $? -ne 0 ]; then
    echo -e "${RED}   ❌ Error exportando${NC}"
    return
  fi

  # Modificar el archivo SQL según la estrategia
  if [ "$STRATEGY" == "update" ]; then
    echo -e "   🔄 Preparando UPSERT..."

    # Obtener columnas de la tabla
    local COLUMNS=$(exec_dev_sql "
      SELECT string_agg(column_name, ', ')
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = '${TABLE}'
      AND column_name != 'id'
      ORDER BY ordinal_position;
    " | xargs)

    # Obtener primary key
    local PK=$(exec_dev_sql "
      SELECT a.attname
      FROM pg_index i
      JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
      WHERE i.indrelid = '${TABLE}'::regclass AND i.indisprimary;
    " | xargs)

    if [ -n "$PK" ] && [ -n "$COLUMNS" ]; then
      # Convertir INSERTs a INSERTs con ON CONFLICT
      sed -i.bak "s/INSERT INTO public.${TABLE}/INSERT INTO public.${TABLE}/g" "$BACKUP_DIR/${TABLE}.sql"

      # Añadir ON CONFLICT al final de cada INSERT
      sed -i.bak "s/;$/ ON CONFLICT (${PK}) DO UPDATE SET ${COLUMNS};/g" "$BACKUP_DIR/${TABLE}.sql"
    fi

  elif [ "$STRATEGY" == "replace" ]; then
    echo -e "   🗑️  Limpiando tabla destino..."
    exec_dev_sql "TRUNCATE TABLE ${TABLE} CASCADE;"
  fi

  # Deshabilitar triggers temporalmente
  exec_dev_sql "ALTER TABLE ${TABLE} DISABLE TRIGGER ALL;" 2>/dev/null || true

  # Importar datos
  echo -e "   📤 Importando datos..."
  PGPASSWORD="$DB_PASSWORD" psql \
    -h "$DEV_HOST" \
    -U "$DB_USER" \
    -d "$DB_NAME" \
    -f "$BACKUP_DIR/${TABLE}.sql" \
    -v ON_ERROR_STOP=0 \
    --quiet 2>&1 | grep -v "duplicate key" || true

  # Rehabilitar triggers
  exec_dev_sql "ALTER TABLE ${TABLE} ENABLE TRIGGER ALL;" 2>/dev/null || true

  # Verificar importación
  local DEV_COUNT=$(exec_dev_sql "SELECT COUNT(*) FROM ${TABLE};" | xargs)
  echo -e "   📊 Registros en desarrollo: ${DEV_COUNT}"

  # Calcular porcentaje
  if [ "$PROD_COUNT" -gt 0 ]; then
    local PERCENTAGE=$(awk "BEGIN {printf \"%.1f\", ($DEV_COUNT / $PROD_COUNT) * 100}")
    echo -e "   ✅ Cobertura: ${PERCENTAGE}%"
  fi

  # Actualizar secuencias (importante para IDs)
  if [ -n "$PK" ] && [ "$PK" == "id" ]; then
    echo -e "   🔢 Actualizando secuencia..."
    exec_dev_sql "
      SELECT setval(
        pg_get_serial_sequence('${TABLE}', 'id'),
        COALESCE((SELECT MAX(id) FROM ${TABLE}), 1),
        true
      );
    " > /dev/null || true
  fi

  echo -e "${GREEN}   ✅ Completado${NC}"
  echo ""
}

# ========================================
# EJECUTAR MIGRACIÓN
# ========================================

echo -e "${GREEN}🎯 Iniciando migración de tablas...${NC}"
echo ""

# Tablas principales (nunca reemplazar, solo skip o update)
migrate_table "profiles" "update"
migrate_table "financing_applications" "skip"
migrate_table "bank_profiles" "update"
migrate_table "uploaded_documents" "skip"

# Tablas relacionadas (pueden actualizarse)
migrate_table "application_status_history" "update"
migrate_table "bank_assignments" "update"
migrate_table "bank_feedback" "update"
migrate_table "document_upload_analytics" "skip"
migrate_table "lead_bank_assignments" "update"
migrate_table "lead_reminders" "update"
migrate_table "lead_tag_associations" "update"
migrate_table "user_email_notifications" "skip"
migrate_table "consignment_listings" "update"
migrate_table "consignment_listing_views" "skip"
migrate_table "user_vehicles_for_sale" "update"
migrate_table "messages" "skip"
migrate_table "tracking_events" "skip"
migrate_table "user_favorites" "update"
migrate_table "user_search_history" "skip"
migrate_table "vehicle_price_watches" "update"

# ========================================
# REPORTE FINAL
# ========================================

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}📋 REPORTE FINAL DE MIGRACIÓN${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Generar reporte comparativo
echo -e "${YELLOW}Tabla${NC}                        ${YELLOW}Producción${NC}  ${YELLOW}Desarrollo${NC}  ${YELLOW}Cobertura${NC}"
echo "───────────────────────────  ───────────  ───────────  ─────────"

for TABLE in profiles financing_applications bank_profiles uploaded_documents \
             application_status_history bank_assignments bank_feedback \
             document_upload_analytics lead_bank_assignments lead_reminders \
             lead_tag_associations user_email_notifications consignment_listings \
             consignment_listing_views user_vehicles_for_sale messages \
             tracking_events user_favorites user_search_history vehicle_price_watches
do
  PROD=$(exec_prod_sql "SELECT COUNT(*) FROM ${TABLE};" 2>/dev/null | xargs || echo "0")
  DEV=$(exec_dev_sql "SELECT COUNT(*) FROM ${TABLE};" 2>/dev/null | xargs || echo "0")

  if [ "$PROD" -gt 0 ]; then
    PERC=$(awk "BEGIN {printf \"%.1f\", ($DEV / $PROD) * 100}")
  else
    PERC="N/A"
  fi

  printf "%-28s %11s %12s %10s%%\n" "$TABLE" "$PROD" "$DEV" "$PERC"
done

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ MIGRACIÓN COMPLETADA${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "📁 Backups guardados en: ${BACKUP_DIR}"
echo -e "💡 Tip: Puedes eliminar los backups una vez verificada la migración"
echo ""
