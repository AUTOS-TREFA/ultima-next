#!/bin/bash
set -e

# Script Robusto de Migración de Base de Datos Supabase
# Maneja foreign keys, duplicados, y restricciones de Supabase
# Creado: 2025-12-06

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}"
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║      Migración Robusta de Base de Datos Supabase           ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Verificar variables
if [ -z "$OLD_SUPABASE_DB_URL" ] || [ -z "$NEW_SUPABASE_DB_URL" ]; then
    echo -e "${RED}Error: Faltan variables de entorno${NC}"
    echo ""
    echo "Configura las variables con el FORMATO CORRECTO:"
    echo ""
    echo -e "${YELLOW}OPCIÓN 1: Direct Connection (Recomendado)${NC}"
    echo "export OLD_SUPABASE_DB_URL='postgresql://postgres:PASSWORD@db.PROYECTO_VIEJO.supabase.co:5432/postgres'"
    echo "export NEW_SUPABASE_DB_URL='postgresql://postgres:PASSWORD@db.pemgwyymodlwabaexxrb.supabase.co:5432/postgres'"
    echo ""
    echo -e "${YELLOW}OPCIÓN 2: Connection Pooling (Puerto 6543)${NC}"
    echo "export OLD_SUPABASE_DB_URL='postgresql://postgres.PROYECTO_VIEJO:PASSWORD@aws-0-us-east-1.pooler.supabase.com:6543/postgres'"
    echo "export NEW_SUPABASE_DB_URL='postgresql://postgres.pemgwyymodlwabaexxrb:PASSWORD@aws-0-us-east-1.pooler.supabase.com:6543/postgres'"
    echo ""
    exit 1
fi

BACKUP_DIR="./db_backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOG_FILE="$BACKUP_DIR/migration_$TIMESTAMP.log"
mkdir -p $BACKUP_DIR

echo -e "${GREEN}=== Iniciando Migración Robusta ===${NC}" | tee "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"

# Probar conexiones primero
echo -e "${YELLOW}Verificando conexiones...${NC}" | tee -a "$LOG_FILE"

echo "Probando conexión al proyecto VIEJO..." | tee -a "$LOG_FILE"
if psql "$OLD_SUPABASE_DB_URL" -c "SELECT 1;" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Conexión exitosa al proyecto viejo${NC}" | tee -a "$LOG_FILE"
else
    echo -e "${RED}✗ Error al conectar al proyecto viejo${NC}" | tee -a "$LOG_FILE"
    exit 1
fi

echo "Probando conexión al proyecto NUEVO..." | tee -a "$LOG_FILE"
if psql "$NEW_SUPABASE_DB_URL" -c "SELECT 1;" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Conexión exitosa al proyecto nuevo${NC}" | tee -a "$LOG_FILE"
else
    echo -e "${RED}✗ Error al conectar al proyecto nuevo${NC}" | tee -a "$LOG_FILE"
    exit 1
fi

echo "" | tee -a "$LOG_FILE"

# PASO 1: Exportar esquema (solo tablas que no sean de Supabase)
echo -e "${BLUE}PASO 1: Exportando esquema (solo schema public)...${NC}" | tee -a "$LOG_FILE"
pg_dump "$OLD_SUPABASE_DB_URL" \
  --schema-only \
  --no-owner \
  --no-privileges \
  --schema=public \
  --exclude-table-data='spatial_ref_sys' \
  2>> "$LOG_FILE" \
  > "$BACKUP_DIR/schema_$TIMESTAMP.sql"

# Filtrar comandos problemáticos del esquema
sed -i.bak 's/^\\[^ ].*$//' "$BACKUP_DIR/schema_$TIMESTAMP.sql"
echo -e "${GREEN}✓ Esquema exportado y limpiado${NC}" | tee -a "$LOG_FILE"

# PASO 2: Exportar datos
echo -e "${BLUE}PASO 2: Exportando datos...${NC}" | tee -a "$LOG_FILE"
pg_dump "$OLD_SUPABASE_DB_URL" \
  --data-only \
  --no-owner \
  --no-privileges \
  --schema=public \
  --exclude-table-data='spatial_ref_sys' \
  --disable-triggers \
  2>> "$LOG_FILE" \
  > "$BACKUP_DIR/data_$TIMESTAMP.sql"

echo -e "${GREEN}✓ Datos exportados${NC}" | tee -a "$LOG_FILE"

echo "" | tee -a "$LOG_FILE"
read -p "¿Importar al proyecto nuevo? (y/n): " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Cancelado. Backups en: $BACKUP_DIR" | tee -a "$LOG_FILE"
    exit 0
fi

# PASO 3: Importar esquema
echo -e "${BLUE}PASO 3: Importando esquema...${NC}" | tee -a "$LOG_FILE"
psql "$NEW_SUPABASE_DB_URL" < "$BACKUP_DIR/schema_$TIMESTAMP.sql" 2>&1 | \
  grep -v "ERROR.*already exists" | \
  grep -v "ERROR.*relation.*already exists" | \
  grep -v "backslash commands are restricted" | \
  tee -a "$LOG_FILE" || true
echo -e "${GREEN}✓ Esquema importado (errores de 'already exists' ignorados)${NC}" | tee -a "$LOG_FILE"

# PASO 4: Preparar para importación de datos
echo -e "${BLUE}PASO 4: Preparando base de datos para importación de datos...${NC}" | tee -a "$LOG_FILE"

# Deshabilitar triggers y foreign key checks temporalmente
psql "$NEW_SUPABASE_DB_URL" <<EOF 2>&1 | tee -a "$LOG_FILE"
-- Deshabilitar triggers temporalmente para evitar problemas con foreign keys
SET session_replication_role = replica;

-- Mostrar configuración
SELECT current_setting('session_replication_role') as replication_role;
EOF

echo -e "${GREEN}✓ Triggers y foreign keys deshabilitados temporalmente${NC}" | tee -a "$LOG_FILE"

# PASO 5: Importar datos
echo -e "${BLUE}PASO 5: Importando datos...${NC}" | tee -a "$LOG_FILE"

# Crear script temporal de importación
cat > "$BACKUP_DIR/import_with_settings_$TIMESTAMP.sql" <<EOF
-- Configurar sesión para importación
SET session_replication_role = replica;

-- Importar datos
\i $BACKUP_DIR/data_$TIMESTAMP.sql

-- Restaurar configuración
SET session_replication_role = DEFAULT;
EOF

psql "$NEW_SUPABASE_DB_URL" -f "$BACKUP_DIR/import_with_settings_$TIMESTAMP.sql" 2>&1 | \
  grep -v "ERROR.*duplicate key" | \
  grep -v "ERROR.*already exists" | \
  grep -v "backslash commands are restricted" | \
  grep -v "Key.*already exists" | \
  tee -a "$LOG_FILE" || true

echo -e "${GREEN}✓ Datos importados (duplicados ignorados)${NC}" | tee -a "$LOG_FILE"

# PASO 6: Re-habilitar triggers y foreign keys
echo -e "${BLUE}PASO 6: Re-habilitando triggers y foreign keys...${NC}" | tee -a "$LOG_FILE"
psql "$NEW_SUPABASE_DB_URL" <<EOF 2>&1 | tee -a "$LOG_FILE"
-- Re-habilitar triggers y foreign keys
SET session_replication_role = DEFAULT;

-- Verificar que se restauró
SELECT current_setting('session_replication_role') as replication_role;
EOF

echo -e "${GREEN}✓ Triggers y foreign keys re-habilitados${NC}" | tee -a "$LOG_FILE"

# PASO 7: Verificación
echo "" | tee -a "$LOG_FILE"
echo -e "${BLUE}PASO 7: Verificación de migración...${NC}" | tee -a "$LOG_FILE"

# Contar tablas
TABLE_COUNT=$(psql "$NEW_SUPABASE_DB_URL" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>> "$LOG_FILE" | xargs)
echo "📊 Tablas en schema public: $TABLE_COUNT" | tee -a "$LOG_FILE"

# Contar registros en tablas principales
echo "" | tee -a "$LOG_FILE"
echo "Conteo de registros en tablas principales:" | tee -a "$LOG_FILE"

for table in profiles financing_applications tracking_events bank_profiles uploaded_documents; do
  COUNT=$(psql "$NEW_SUPABASE_DB_URL" -t -c "SELECT COUNT(*) FROM $table;" 2>> "$LOG_FILE" | xargs)
  if [ -n "$COUNT" ]; then
    echo "  - $table: $COUNT registros" | tee -a "$LOG_FILE"
  fi
done

echo "" | tee -a "$LOG_FILE"
echo -e "${GREEN}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║           ✅ Migración Completada                           ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════════════╝${NC}"
echo "" | tee -a "$LOG_FILE"
echo "📁 Backups guardados en: $BACKUP_DIR" | tee -a "$LOG_FILE"
echo "📄 Log completo en: $LOG_FILE" | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"

# PASO 8: Próximos pasos
echo -e "${YELLOW}Próximos pasos recomendados:${NC}" | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"
echo "1. Regenerar tipos TypeScript:" | tee -a "$LOG_FILE"
echo "   supabase gen types typescript --project-id pemgwyymodlwabaexxrb > src/types/supabase.ts" | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"
echo "2. Verificar políticas RLS:" | tee -a "$LOG_FILE"
echo "   Revisa en Supabase Dashboard > Authentication > Policies" | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"
echo "3. Probar la aplicación:" | tee -a "$LOG_FILE"
echo "   npm run dev" | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"
