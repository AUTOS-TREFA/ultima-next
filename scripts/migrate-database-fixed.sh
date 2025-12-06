#!/bin/bash
set -e

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}"
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║         Migración de Base de Datos Supabase                 ║"
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
    echo "Obtén las connection strings en:"
    echo "https://supabase.com/dashboard/project/[tu-proyecto]/settings/database"
    exit 1
fi

BACKUP_DIR="./db_backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

echo -e "${GREEN}=== Iniciando Migración ===${NC}"
echo ""

# Probar conexiones primero
echo -e "${YELLOW}Verificando conexiones...${NC}"

echo "Probando conexión al proyecto VIEJO..."
if psql "$OLD_SUPABASE_DB_URL" -c "SELECT 1;" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Conexión exitosa al proyecto viejo${NC}"
else
    echo -e "${RED}✗ Error al conectar al proyecto viejo${NC}"
    echo "Verifica tu connection string en: OLD_SUPABASE_DB_URL"
    exit 1
fi

echo "Probando conexión al proyecto NUEVO..."
if psql "$NEW_SUPABASE_DB_URL" -c "SELECT 1;" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Conexión exitosa al proyecto nuevo${NC}"
else
    echo -e "${RED}✗ Error al conectar al proyecto nuevo${NC}"
    echo "Verifica tu connection string en: NEW_SUPABASE_DB_URL"
    echo ""
    echo "Formato correcto para proyecto nuevo:"
    echo "postgresql://postgres:TU_PASSWORD@db.pemgwyymodlwabaexxrb.supabase.co:5432/postgres"
    exit 1
fi

echo ""
echo -e "${BLUE}PASO 1: Exportando esquema...${NC}"
pg_dump "$OLD_SUPABASE_DB_URL" \
  --schema-only \
  --no-owner \
  --no-privileges \
  --schema=public \
  > "$BACKUP_DIR/schema_$TIMESTAMP.sql"
echo -e "${GREEN}✓ Esquema exportado${NC}"

echo -e "${BLUE}PASO 2: Exportando datos...${NC}"
pg_dump "$OLD_SUPABASE_DB_URL" \
  --data-only \
  --no-owner \
  --no-privileges \
  --schema=public \
  > "$BACKUP_DIR/data_$TIMESTAMP.sql"
echo -e "${GREEN}✓ Datos exportados${NC}"

echo ""
read -p "¿Importar al proyecto nuevo? (y/n): " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Cancelado. Backups en: $BACKUP_DIR"
    exit 0
fi

echo -e "${BLUE}PASO 3: Importando esquema...${NC}"
psql "$NEW_SUPABASE_DB_URL" < "$BACKUP_DIR/schema_$TIMESTAMP.sql" 2>&1 | grep -v "ERROR.*already exists" || true
echo -e "${GREEN}✓ Esquema importado${NC}"

echo -e "${BLUE}PASO 4: Importando datos...${NC}"
psql "$NEW_SUPABASE_DB_URL" < "$BACKUP_DIR/data_$TIMESTAMP.sql" 2>&1 | grep -v "ERROR.*duplicate" || true
echo -e "${GREEN}✓ Datos importados${NC}"

echo ""
echo -e "${GREEN}✓ Migración completada${NC}"
echo "Backups: $BACKUP_DIR"

# Verificar
echo ""
echo -e "${BLUE}Verificación:${NC}"
TABLE_COUNT=$(psql "$NEW_SUPABASE_DB_URL" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" | xargs)
echo "Tablas importadas: $TABLE_COUNT"

