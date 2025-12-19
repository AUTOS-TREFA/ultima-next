#!/bin/bash

echo "╔════════════════════════════════════════════════════════════╗"
echo "║  Verificación de Pre-requisitos para Migración            ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Colores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

ERRORS=0

# 1. PostgreSQL
echo "1. Verificando PostgreSQL..."
if command -v psql &> /dev/null; then
    VERSION=$(psql --version)
    echo -e "${GREEN}✅ PostgreSQL instalado: $VERSION${NC}"
else
    echo -e "${RED}❌ PostgreSQL NO instalado${NC}"
    echo "   Instalar con: brew install postgresql@15"
    ERRORS=$((ERRORS+1))
fi
echo ""

# 2. pg_dump
echo "2. Verificando pg_dump..."
if command -v pg_dump &> /dev/null; then
    VERSION=$(pg_dump --version)
    echo -e "${GREEN}✅ pg_dump disponible: $VERSION${NC}"
else
    echo -e "${RED}❌ pg_dump NO disponible${NC}"
    ERRORS=$((ERRORS+1))
fi
echo ""

# 3. Supabase CLI
echo "3. Verificando Supabase CLI..."
if command -v supabase &> /dev/null; then
    VERSION=$(supabase --version)
    echo -e "${GREEN}✅ Supabase CLI instalado: $VERSION${NC}"
else
    echo -e "${YELLOW}⚠️  Supabase CLI NO instalado (opcional pero recomendado)${NC}"
    echo "   Instalar con: npm install -g supabase"
fi
echo ""

# 4. Directorio de backups
echo "4. Verificando directorio de backups..."
if [ -d "../backups" ]; then
    COUNT=$(ls -1 ../backups/*.sql 2>/dev/null | wc -l | xargs)
    SIZE=$(du -sh ../backups 2>/dev/null | cut -f1)
    echo -e "${GREEN}✅ Directorio de backups existe${NC}"
    echo "   Backups existentes: $COUNT archivos ($SIZE)"
else
    echo -e "${YELLOW}⚠️  Directorio de backups no existe, creando...${NC}"
    mkdir -p ../backups
    echo -e "${GREEN}✅ Directorio creado${NC}"
fi
echo ""

# 5. Scripts de migración
echo "5. Verificando scripts de migración..."
SCRIPTS=("apply-migrations.sh" "deploy-edge-functions.sh" "rollback.sh" "verificar-migracion.sql")
for script in "${SCRIPTS[@]}"; do
    if [ -f "$script" ]; then
        if [ -x "$script" ] || [[ "$script" == *.sql ]]; then
            echo -e "${GREEN}✅ $script${NC}"
        else
            echo -e "${YELLOW}⚠️  $script existe pero no es ejecutable${NC}"
            chmod +x "$script" 2>/dev/null && echo "   Permisos corregidos"
        fi
    else
        echo -e "${RED}❌ $script NO encontrado${NC}"
        ERRORS=$((ERRORS+1))
    fi
done
echo ""

# 6. Directorio de migraciones
echo "6. Verificando migraciones SQL..."
if [ -d "../supabase/migrations" ]; then
    COUNT=$(ls -1 ../supabase/migrations/*.sql 2>/dev/null | wc -l | xargs)
    echo -e "${GREEN}✅ Directorio de migraciones existe${NC}"
    echo "   Migraciones encontradas: $COUNT archivos"
    
    if [ "$COUNT" -lt 100 ]; then
        echo -e "${YELLOW}⚠️  Se esperaban ~104 migraciones${NC}"
    fi
else
    echo -e "${RED}❌ Directorio de migraciones NO existe${NC}"
    ERRORS=$((ERRORS+1))
fi
echo ""

# 7. Conectividad a Producción
echo "7. Probando conexión a Producción..."
if psql "postgresql://postgres:Lifeintechnicolor2!@db.jjepfehmuybpctdzipnu.supabase.co:5432/postgres" -c "SELECT 1" &>/dev/null; then
    COUNT=$(psql "postgresql://postgres:Lifeintechnicolor2!@db.jjepfehmuybpctdzipnu.supabase.co:5432/postgres" -t -c "SELECT COUNT(*) FROM profiles" 2>/dev/null | xargs)
    echo -e "${GREEN}✅ Conexión a Producción exitosa${NC}"
    echo "   Profiles en producción: $COUNT"
else
    echo -e "${RED}❌ No se puede conectar a Producción${NC}"
    echo "   Verificar contraseña y conectividad"
    ERRORS=$((ERRORS+1))
fi
echo ""

# 8. Conectividad a Desarrollo
echo "8. Probando conexión a Desarrollo..."
if psql "postgresql://postgres:Lifeintechnicolor2!@db.pemgwyymodlwabaexxrb.supabase.co:5432/postgres" -c "SELECT 1" &>/dev/null; then
    COUNT=$(psql "postgresql://postgres:Lifeintechnicolor2!@db.pemgwyymodlwabaexxrb.supabase.co:5432/postgres" -t -c "SELECT COUNT(*) FROM profiles" 2>/dev/null | xargs)
    echo -e "${GREEN}✅ Conexión a Desarrollo exitosa${NC}"
    echo "   Profiles en desarrollo: $COUNT"
else
    echo -e "${RED}❌ No se puede conectar a Desarrollo${NC}"
    echo "   Verificar contraseña y conectividad"
    ERRORS=$((ERRORS+1))
fi
echo ""

# 9. Espacio en disco
echo "9. Verificando espacio en disco..."
AVAILABLE=$(df -h . | awk 'NR==2 {print $4}')
echo -e "${GREEN}✅ Espacio disponible: $AVAILABLE${NC}"
echo "   (Necesitas al menos 1GB para backups)"
echo ""

# Resumen
echo "════════════════════════════════════════════════════════════"
if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✅ TODOS LOS PRE-REQUISITOS CUMPLIDOS${NC}"
    echo ""
    echo "Estás listo para ejecutar la migración."
else
    echo -e "${RED}❌ HAY $ERRORS ERRORES QUE CORREGIR${NC}"
    echo ""
    echo "Por favor corrige los errores antes de continuar."
fi
echo "════════════════════════════════════════════════════════════"
echo ""
