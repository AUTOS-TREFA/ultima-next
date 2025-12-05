#!/bin/bash
# Script para restaurar base de datos desde backup
# Fecha: 2025-12-05
# Ejecutar: bash scripts/restore-database-from-backup.sh

set -e

echo "🔄 Iniciando restauración de base de datos desde backup..."
echo ""

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Buscar archivo de backup
BACKUP_FILE=$(ls -t backup*.sql 2>/dev/null | head -1)

if [ -z "$BACKUP_FILE" ]; then
    echo -e "${RED}❌ Error: No se encontró ningún archivo de backup (backup*.sql)${NC}"
    exit 1
fi

BACKUP_SIZE=$(ls -lh "$BACKUP_FILE" | awk '{print $5}')
echo -e "${GREEN}✅ Backup encontrado: ${BACKUP_FILE} (${BACKUP_SIZE})${NC}"
echo ""

# Confirmación
echo -e "${YELLOW}⚠️  ADVERTENCIA: Esta acción restaurará la base de datos desde el backup${NC}"
echo -e "${YELLOW}   Esto SOBRESCRIBIRÁ todos los datos actuales en la base de datos${NC}"
echo ""
read -p "¿Estás seguro de que deseas continuar? (escribe 'SI' para confirmar): " CONFIRM

if [ "$CONFIRM" != "SI" ]; then
    echo -e "${RED}❌ Operación cancelada${NC}"
    exit 1
fi
echo ""

# Verificar autenticación
echo "🔗 Verificando autenticación en Supabase..."
if ! npx supabase projects list 2>&1 | grep -q "pemgwyymodlwabaexxrb"; then
    echo -e "${YELLOW}⚠️  Ejecutando login de Supabase...${NC}"
    npx supabase login
fi
echo ""

# Restaurar usando pg_restore o psql dependiendo del formato
echo "📥 Restaurando base de datos..."
echo -e "${YELLOW}   Esto puede tardar varios minutos dependiendo del tamaño...${NC}"
echo ""

# Obtener connection string
echo "Obteniendo connection string..."
DB_URL=$(npx supabase db show-connection-string --linked 2>/dev/null | grep "postgresql://")

if [ -z "$DB_URL" ]; then
    echo -e "${RED}❌ Error: No se pudo obtener la connection string${NC}"
    echo "   Ejecuta manualmente: npx supabase link --project-ref pemgwyymodlwabaexxrb"
    exit 1
fi

# Restaurar usando psql
echo "Aplicando backup..."
psql "$DB_URL" < "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ Base de datos restaurada exitosamente desde ${BACKUP_FILE}${NC}"
else
    echo ""
    echo -e "${RED}❌ Error al restaurar la base de datos${NC}"
    exit 1
fi
echo ""

# Aplicar optimizaciones después de la restauración
echo "📊 ¿Deseas aplicar las optimizaciones de índices ahora? (recomendado)"
read -p "Aplicar optimizaciones? (s/n): " APPLY_OPT

if [ "$APPLY_OPT" = "s" ] || [ "$APPLY_OPT" = "S" ]; then
    echo ""
    echo "Aplicando optimizaciones..."
    bash scripts/apply-db-optimizations.sh
fi

echo ""
echo -e "${GREEN}🎉 Proceso completado!${NC}"
echo ""
echo "📋 Próximos pasos:"
echo "   1. Verifica que la aplicación funcione correctamente"
echo "   2. Revisa los logs en Supabase Dashboard"
echo "   3. Ejecuta el script de verificación si aplicaste optimizaciones"
