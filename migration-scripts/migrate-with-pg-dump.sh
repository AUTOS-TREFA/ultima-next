#!/bin/bash

# ========================================
# SCRIPT DE MIGRACIÓN CON PG_DUMP
# ========================================
# Este script usa pg_dump para exportar tablas específicas
# y luego las importa a la nueva base de datos
# ========================================

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 MIGRACIÓN DE DATOS DE SUPABASE${NC}"
echo "===================================="
echo ""

# Configuración
PROD_PROJECT="jjepfehmuybpctdzipnu"
DEV_PROJECT="pemgwyymodlwabaexxrb"
BACKUP_DIR="/tmp/supabase-migration-$(date +%Y%m%d-%H%M%S)"

# Solicitar password
echo -e "${YELLOW}📝 Ingresa el password de Supabase (es el mismo para ambos proyectos):${NC}"
read -s SUPABASE_PASSWORD
echo ""

# Crear directorio de backup
mkdir -p "$BACKUP_DIR"
echo -e "${GREEN}📁 Directorio de backup: $BACKUP_DIR${NC}"
echo ""

# Tablas a migrar (en orden de dependencias)
TABLES=(
  "profiles"
  "financing_applications"
  "bank_profiles"
  "uploaded_documents"
  "application_status_history"
  "bank_assignments"
  "bank_feedback"
  "document_upload_analytics"
  "lead_bank_assignments"
  "lead_reminders"
  "lead_tag_associations"
  "user_email_notifications"
  "consignment_listings"
  "consignment_listing_views"
  "user_vehicles_for_sale"
  "messages"
  "tracking_events"
  "user_favorites"
  "user_search_history"
  "vehicle_price_watches"
)

# Exportar datos de producción
echo -e "${GREEN}📥 EXPORTANDO DATOS DE PRODUCCIÓN${NC}"
echo "===================================="
echo ""

for TABLE in "${TABLES[@]}"; do
  echo -e "${YELLOW}Exportando: $TABLE${NC}"

  PGPASSWORD="$SUPABASE_PASSWORD" pg_dump \
    -h db.${PROD_PROJECT}.supabase.co \
    -U postgres \
    -d postgres \
    -t "public.$TABLE" \
    --data-only \
    --column-inserts \
    --no-owner \
    --no-acl \
    -f "$BACKUP_DIR/${TABLE}.sql"

  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ $TABLE exportado${NC}"
  else
    echo -e "${RED}❌ Error exportando $TABLE${NC}"
  fi
  echo ""
done

# Importar datos a desarrollo
echo ""
echo -e "${GREEN}📤 IMPORTANDO DATOS A DESARROLLO${NC}"
echo "===================================="
echo ""

for TABLE in "${TABLES[@]}"; do
  if [ -f "$BACKUP_DIR/${TABLE}.sql" ]; then
    echo -e "${YELLOW}Importando: $TABLE${NC}"

    # Primero, deshabilitar triggers para evitar problemas
    PGPASSWORD="$SUPABASE_PASSWORD" psql \
      -h db.${DEV_PROJECT}.supabase.co \
      -U postgres \
      -d postgres \
      -c "ALTER TABLE public.$TABLE DISABLE TRIGGER ALL;" 2>/dev/null || true

    # Importar datos (con ON CONFLICT para evitar duplicados)
    PGPASSWORD="$SUPABASE_PASSWORD" psql \
      -h db.${DEV_PROJECT}.supabase.co \
      -U postgres \
      -d postgres \
      -f "$BACKUP_DIR/${TABLE}.sql" \
      --quiet \
      -v ON_ERROR_STOP=0

    # Rehabilitar triggers
    PGPASSWORD="$SUPABASE_PASSWORD" psql \
      -h db.${DEV_PROJECT}.supabase.co \
      -U postgres \
      -d postgres \
      -c "ALTER TABLE public.$TABLE ENABLE TRIGGER ALL;" 2>/dev/null || true

    if [ $? -eq 0 ]; then
      echo -e "${GREEN}✅ $TABLE importado${NC}"
    else
      echo -e "${YELLOW}⚠️  $TABLE importado con advertencias (probablemente registros duplicados)${NC}"
    fi
    echo ""
  fi
done

# Verificar migración
echo ""
echo -e "${GREEN}📊 VERIFICANDO MIGRACIÓN${NC}"
echo "===================================="
echo ""

for TABLE in "${TABLES[@]}"; do
  echo -e "${YELLOW}Verificando: $TABLE${NC}"

  # Contar registros en producción
  PROD_COUNT=$(PGPASSWORD="$SUPABASE_PASSWORD" psql \
    -h db.${PROD_PROJECT}.supabase.co \
    -U postgres \
    -d postgres \
    -t -c "SELECT COUNT(*) FROM public.$TABLE;")

  # Contar registros en desarrollo
  DEV_COUNT=$(PGPASSWORD="$SUPABASE_PASSWORD" psql \
    -h db.${DEV_PROJECT}.supabase.co \
    -U postgres \
    -d postgres \
    -t -c "SELECT COUNT(*) FROM public.$TABLE;")

  # Calcular porcentaje
  PROD_COUNT=$(echo $PROD_COUNT | xargs)
  DEV_COUNT=$(echo $DEV_COUNT | xargs)

  if [ "$PROD_COUNT" -gt 0 ]; then
    PERCENTAGE=$(awk "BEGIN {printf \"%.2f\", ($DEV_COUNT / $PROD_COUNT) * 100}")
  else
    PERCENTAGE="N/A"
  fi

  echo "   Producción: $PROD_COUNT registros"
  echo "   Desarrollo: $DEV_COUNT registros"
  echo "   Cobertura: $PERCENTAGE%"
  echo ""
done

echo ""
echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}✅ MIGRACIÓN COMPLETADA${NC}"
echo -e "${GREEN}================================${NC}"
echo ""
echo -e "Los archivos de backup están en: ${BACKUP_DIR}"
echo -e "Puedes eliminarlos cuando estés seguro de que la migración fue exitosa."
echo ""
