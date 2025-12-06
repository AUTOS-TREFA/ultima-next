#!/bin/bash

# Script para verificar conexiones a Supabase antes de migrar
# Creado: 2025-12-06

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}"
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║         Verificación de Conexiones Supabase                ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"
echo ""

# Verificar que las variables estén configuradas
if [ -z "$OLD_SUPABASE_DB_URL" ]; then
    echo -e "${RED}❌ Falta OLD_SUPABASE_DB_URL${NC}"
    echo ""
    echo "Configura la variable con UNO de estos formatos:"
    echo ""
    echo -e "${YELLOW}OPCIÓN 1: Direct Connection (Puerto 5432)${NC}"
    echo "export OLD_SUPABASE_DB_URL='postgresql://postgres:TU_PASSWORD@db.PROYECTO_VIEJO.supabase.co:5432/postgres'"
    echo ""
    echo -e "${YELLOW}OPCIÓN 2: Connection Pooling (Puerto 6543)${NC}"
    echo "export OLD_SUPABASE_DB_URL='postgresql://postgres.PROYECTO_VIEJO:TU_PASSWORD@aws-0-us-east-1.pooler.supabase.com:6543/postgres'"
    echo ""
    exit 1
fi

if [ -z "$NEW_SUPABASE_DB_URL" ]; then
    echo -e "${RED}❌ Falta NEW_SUPABASE_DB_URL${NC}"
    echo ""
    echo "Configura la variable con UNO de estos formatos:"
    echo ""
    echo -e "${YELLOW}OPCIÓN 1: Direct Connection (Puerto 5432)${NC}"
    echo "export NEW_SUPABASE_DB_URL='postgresql://postgres:TU_PASSWORD@db.pemgwyymodlwabaexxrb.supabase.co:5432/postgres'"
    echo ""
    echo -e "${YELLOW}OPCIÓN 2: Connection Pooling (Puerto 6543)${NC}"
    echo "export NEW_SUPABASE_DB_URL='postgresql://postgres.pemgwyymodlwabaexxrb:TU_PASSWORD@aws-0-us-east-1.pooler.supabase.com:6543/postgres'"
    echo ""
    exit 1
fi

echo -e "${BLUE}=== Probando Conexiones ===${NC}"
echo ""

# Test 1: Conexión al proyecto VIEJO
echo -e "${YELLOW}Test 1: Conectando al proyecto VIEJO...${NC}"
if psql "$OLD_SUPABASE_DB_URL" -c "SELECT version();" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Conexión exitosa al proyecto viejo${NC}"

    # Mostrar información del proyecto
    TABLE_COUNT=$(psql "$OLD_SUPABASE_DB_URL" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null | xargs)
    echo -e "   📊 Tablas en public: ${GREEN}$TABLE_COUNT${NC}"
else
    echo -e "${RED}❌ Error al conectar al proyecto viejo${NC}"
    echo ""
    echo "Verifica:"
    echo "1. Que la contraseña sea correcta"
    echo "2. Que el formato de la connection string sea correcto"
    echo "3. Para Connection Pooling, usa puerto 6543 (NO 5432)"
    echo "4. Para Direct Connection, usa puerto 5432"
    echo ""
    echo "Connection string actual:"
    echo "${OLD_SUPABASE_DB_URL}" | sed 's/:[^@]*@/:****@/'
    exit 1
fi

echo ""

# Test 2: Conexión al proyecto NUEVO
echo -e "${YELLOW}Test 2: Conectando al proyecto NUEVO (pemgwyymodlwabaexxrb)...${NC}"
if psql "$NEW_SUPABASE_DB_URL" -c "SELECT version();" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Conexión exitosa al proyecto nuevo${NC}"

    # Mostrar información del proyecto
    TABLE_COUNT=$(psql "$NEW_SUPABASE_DB_URL" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null | xargs)
    echo -e "   📊 Tablas en public: ${GREEN}$TABLE_COUNT${NC}"
else
    echo -e "${RED}❌ Error al conectar al proyecto nuevo${NC}"
    echo ""
    echo "Verifica:"
    echo "1. Que la contraseña sea correcta"
    echo "2. Que el formato de la connection string sea correcto"
    echo "3. Para Connection Pooling, usa puerto 6543 (NO 5432)"
    echo "4. Para Direct Connection, usa puerto 5432"
    echo ""
    echo "Formato correcto para proyecto nuevo (pemgwyymodlwabaexxrb):"
    echo ""
    echo "Direct:"
    echo "postgresql://postgres:PASSWORD@db.pemgwyymodlwabaexxrb.supabase.co:5432/postgres"
    echo ""
    echo "Pooling:"
    echo "postgresql://postgres.pemgwyymodlwabaexxrb:PASSWORD@aws-0-us-east-1.pooler.supabase.com:6543/postgres"
    exit 1
fi

echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  ✅ Todas las conexiones funcionan correctamente            ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}Puedes proceder con la migración ejecutando:${NC}"
echo -e "${YELLOW}./scripts/migrate-database-fixed.sh${NC}"
echo ""
