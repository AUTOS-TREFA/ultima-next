#!/bin/bash
#
# Script de Migración de Base de Datos Supabase
# Creado por: Claude Code
# Fecha: 2025-12-06
#

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
    echo "Configura:"
    echo "export OLD_SUPABASE_DB_URL='postgresql://postgres:pass@host:5432/postgres'"
    echo "export NEW_SUPABASE_DB_URL='postgresql://postgres:pass@host:5432/postgres'"
    exit 1
fi

BACKUP_DIR="./db_backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

echo -e "${GREEN}=== Iniciando Migración ===${NC}"
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
psql "$NEW_SUPABASE_DB_URL" < "$BACKUP_DIR/schema_$TIMESTAMP.sql"
echo -e "${GREEN}✓ Esquema importado${NC}"

echo -e "${BLUE}PASO 4: Importando datos...${NC}"
psql "$NEW_SUPABASE_DB_URL" < "$BACKUP_DIR/data_$TIMESTAMP.sql"
echo -e "${GREEN}✓ Datos importados${NC}"

echo ""
echo -e "${GREEN}✓ Migración completada${NC}"
echo "Backups: $BACKUP_DIR"
