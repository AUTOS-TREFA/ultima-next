#!/bin/bash
################################################################################
# SCRIPT DE ROLLBACK DE EMERGENCIA
# Restaura el backup de desarrollo en caso de fallo en la migración
# Proyecto: Ultima NextJS - Autostrefa
# Fecha: 18 Diciembre 2024
################################################################################

set -e  # Exit on error

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuración
BACKUPS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../backups" && pwd)"
DB_URL="postgresql://postgres:Lifeintechnicolor2!@db.pemgwyymodlwabaexxrb.supabase.co:5432/postgres"
LOG_FILE="rollback_log_$(date +%Y%m%d_%H%M%S).txt"

echo -e "${RED}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${RED}║        🚨 ROLLBACK DE EMERGENCIA                          ║${NC}"
echo -e "${RED}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}⚠️  ADVERTENCIA: Este script restaurará el backup de desarrollo${NC}"
echo -e "${YELLOW}    y REVERTIRÁ todos los cambios de la migración.${NC}"
echo ""

# Verificar directorio de backups
if [ ! -d "$BACKUPS_DIR" ]; then
  echo -e "${RED}❌ Error: Directorio de backups no existe: $BACKUPS_DIR${NC}"
  exit 1
fi

# Listar backups disponibles
echo "📂 Backups disponibles en $BACKUPS_DIR:"
echo ""

backups=($(ls -t "$BACKUPS_DIR"/backup_desarrollo_*.sql 2>/dev/null))

if [ ${#backups[@]} -eq 0 ]; then
  echo -e "${RED}❌ No se encontraron backups de desarrollo.${NC}"
  echo ""
  echo "Los backups deben tener el formato: backup_desarrollo_YYYYMMDD_HHMMSS.sql"
  exit 1
fi

# Mostrar backups con índice
for i in "${!backups[@]}"; do
  backup="${backups[$i]}"
  filename=$(basename "$backup")
  size=$(ls -lh "$backup" | awk '{print $5}')
  date=$(stat -f "%Sm" -t "%Y-%m-%d %H:%M:%S" "$backup" 2>/dev/null || stat -c "%y" "$backup" 2>/dev/null | cut -d'.' -f1)

  echo "  $((i+1)). $filename"
  echo "     Tamaño: $size | Fecha: $date"
  echo ""
done

# Seleccionar backup
echo -e "${YELLOW}Selecciona el número del backup a restaurar (1-${#backups[@]}):${NC}"
read -r backup_num

# Validar selección
if ! [[ "$backup_num" =~ ^[0-9]+$ ]] || [ "$backup_num" -lt 1 ] || [ "$backup_num" -gt "${#backups[@]}" ]; then
  echo -e "${RED}❌ Selección inválida.${NC}"
  exit 1
fi

BACKUP_FILE="${backups[$((backup_num-1))]}"
BACKUP_NAME=$(basename "$BACKUP_FILE")

echo ""
echo -e "${YELLOW}Backup seleccionado: $BACKUP_NAME${NC}"
echo ""

# Verificar que el archivo existe
if [ ! -f "$BACKUP_FILE" ]; then
  echo -e "${RED}❌ Error: El archivo de backup no existe.${NC}"
  exit 1
fi

# Confirmación de seguridad
echo -e "${RED}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${RED}║                 ⚠️  CONFIRMACIÓN FINAL                    ║${NC}"
echo -e "${RED}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}Esta operación:${NC}"
echo "  • Eliminará TODOS los datos actuales de desarrollo"
echo "  • Restaurará el estado del backup: $BACKUP_NAME"
echo "  • Revertirá todas las migraciones aplicadas"
echo "  • Los Edge Functions NO se revertirán automáticamente"
echo ""
echo -e "${RED}⚠️  ESTA ACCIÓN NO SE PUEDE DESHACER ⚠️${NC}"
echo ""
read -p "¿Estás SEGURO de continuar? Escribe 'SI ESTOY SEGURO' para confirmar: " confirmation

if [ "$confirmation" != "SI ESTOY SEGURO" ]; then
  echo ""
  echo -e "${GREEN}Rollback cancelado. No se realizaron cambios.${NC}"
  exit 0
fi

echo ""
echo -e "${YELLOW}Iniciando rollback...${NC}"
echo ""

# Crear log de rollback
{
  echo "╔════════════════════════════════════════════════════════════╗"
  echo "║  ROLLBACK DE EMERGENCIA - $(date)  ║"
  echo "╚════════════════════════════════════════════════════════════╝"
  echo ""
  echo "Backup: $BACKUP_NAME"
  echo "Directorio: $BACKUPS_DIR"
  echo ""
} | tee -a "$LOG_FILE"

# Paso 1: Hacer backup del estado actual (por si acaso)
echo -e "${YELLOW}Paso 1/4: Creando backup de emergencia del estado actual...${NC}" | tee -a "$LOG_FILE"

EMERGENCY_BACKUP="$BACKUPS_DIR/emergency_before_rollback_$(date +%Y%m%d_%H%M%S).sql"

if pg_dump "$DB_URL" --clean --if-exists --no-owner --no-acl -f "$EMERGENCY_BACKUP" >> "$LOG_FILE" 2>&1; then
  echo -e "${GREEN}✅ Backup de emergencia creado: $(basename "$EMERGENCY_BACKUP")${NC}" | tee -a "$LOG_FILE"
else
  echo -e "${RED}⚠️  No se pudo crear backup de emergencia (continuando de todos modos)${NC}" | tee -a "$LOG_FILE"
fi

echo ""

# Paso 2: Detener conexiones activas
echo -e "${YELLOW}Paso 2/4: Cerrando conexiones activas...${NC}" | tee -a "$LOG_FILE"

psql "$DB_URL" -c "
  SELECT pg_terminate_backend(pid)
  FROM pg_stat_activity
  WHERE datname = 'postgres'
    AND pid <> pg_backend_pid();
" >> "$LOG_FILE" 2>&1 || echo "  (Algunas conexiones no se pudieron cerrar)"

echo -e "${GREEN}✅ Conexiones cerradas${NC}" | tee -a "$LOG_FILE"
echo ""

# Paso 3: Restaurar el backup
echo -e "${YELLOW}Paso 3/4: Restaurando backup de desarrollo...${NC}" | tee -a "$LOG_FILE"
echo -e "${YELLOW}   (Esto puede tardar 15-20 minutos)${NC}"
echo ""

START_TIME=$(date +%s)

if psql "$DB_URL" -f "$BACKUP_FILE" >> "$LOG_FILE" 2>&1; then
  END_TIME=$(date +%s)
  DURATION=$((END_TIME - START_TIME))
  MINUTES=$((DURATION / 60))
  SECONDS=$((DURATION % 60))

  echo -e "${GREEN}✅ Backup restaurado exitosamente${NC}" | tee -a "$LOG_FILE"
  echo -e "${GREEN}   Duración: ${MINUTES}m ${SECONDS}s${NC}" | tee -a "$LOG_FILE"
else
  echo -e "${RED}❌ Error restaurando el backup${NC}" | tee -a "$LOG_FILE"
  echo ""
  echo "Revisar log: $LOG_FILE"
  exit 1
fi

echo ""

# Paso 4: Verificar restauración
echo -e "${YELLOW}Paso 4/4: Verificando restauración...${NC}" | tee -a "$LOG_FILE"

PROFILE_COUNT=$(psql "$DB_URL" -t -c "SELECT COUNT(*) FROM profiles;" 2>/dev/null | xargs)
AUTH_COUNT=$(psql "$DB_URL" -t -c "SELECT COUNT(*) FROM auth.users;" 2>/dev/null | xargs)
APP_COUNT=$(psql "$DB_URL" -t -c "SELECT COUNT(*) FROM financing_applications;" 2>/dev/null | xargs)

echo ""
echo "Conteos post-rollback:"
echo "  • Profiles: $PROFILE_COUNT"
echo "  • Auth users: $AUTH_COUNT"
echo "  • Applications: $APP_COUNT"
echo ""

if [ "$PROFILE_COUNT" -gt 0 ] && [ "$AUTH_COUNT" -gt 0 ]; then
  echo -e "${GREEN}✅ Verificación exitosa${NC}" | tee -a "$LOG_FILE"
else
  echo -e "${RED}⚠️  Advertencia: Conteos sospechosamente bajos${NC}" | tee -a "$LOG_FILE"
fi

echo ""

# Resumen final
echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║              ✅ ROLLBACK COMPLETADO                       ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo "📊 Resumen:"
echo "  • Backup restaurado: $BACKUP_NAME"
echo "  • Backup de emergencia: $(basename "$EMERGENCY_BACKUP")"
echo "  • Perfiles: $PROFILE_COUNT"
echo "  • Auth users: $AUTH_COUNT"
echo "  • Aplicaciones: $APP_COUNT"
echo ""
echo "📝 Log completo: $LOG_FILE"
echo ""

# Recordatorios
echo -e "${YELLOW}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${YELLOW}║              📋 TAREAS POST-ROLLBACK                      ║${NC}"
echo -e "${YELLOW}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo "⚠️  IMPORTANTE: Completar estas tareas manualmente:"
echo ""
echo "1. 🔴 DESACTIVAR MODO MANTENIMIENTO en el frontend"
echo ""
echo "2. 🟡 Comunicar a stakeholders:"
echo "   • La migración se revirtió"
echo "   • La base de datos está en el estado anterior"
echo "   • Se programará nueva ventana de mantenimiento"
echo ""
echo "3. 🟢 Revisar logs para identificar causa del fallo:"
echo "   • migration_log_*.txt"
echo "   • $LOG_FILE"
echo ""
echo "4. 🔵 Edge Functions permanecen desplegadas:"
echo "   • Las funciones NO se revierten automáticamente"
echo "   • Si es necesario, re-deployar versiones anteriores"
echo ""
echo "5. 📊 Análisis post-mortem:"
echo "   • ¿Qué migración causó el fallo?"
echo "   • ¿Cómo prevenir el error en el próximo intento?"
echo "   • Actualizar plan de migración"
echo ""

echo -e "${GREEN}🔄 Sistema restaurado al estado anterior.${NC}"
echo ""
