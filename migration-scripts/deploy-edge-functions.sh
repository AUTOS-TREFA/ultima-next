#!/bin/bash
################################################################################
# SCRIPT DE DEPLOY DE EDGE FUNCTIONS
# Despliega las 29 Edge Functions en orden de prioridad
# Proyecto: Ultima NextJS - Autostrefa
# Fecha: 18 Diciembre 2024
################################################################################

set -e  # Exit on error

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuración
PROJECT_REF="pemgwyymodlwabaexxrb"
FUNCTIONS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../supabase/functions" && pwd)"
LOG_FILE="deploy_log_$(date +%Y%m%d_%H%M%S).txt"
PROGRESS_FILE="deploy_progress.txt"

echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║        🚀 DEPLOY DE EDGE FUNCTIONS                        ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo "📂 Directorio de funciones: $FUNCTIONS_DIR"
echo "🎯 Proyecto: $PROJECT_REF"
echo "📝 Log de ejecución: $LOG_FILE"
echo ""

# Verificar que supabase CLI está instalado
if ! command -v supabase &> /dev/null; then
  echo -e "${RED}❌ Error: Supabase CLI no está instalado${NC}"
  echo "Instalar con: npm install -g supabase"
  exit 1
fi

# Verificar directorio de funciones
if [ ! -d "$FUNCTIONS_DIR" ]; then
  echo -e "${RED}❌ Error: Directorio de funciones no existe${NC}"
  exit 1
fi

# Función para deployar una Edge Function
deploy_function() {
  local func_name=$1
  local priority=$2

  echo -e "\n${BLUE}⏳ Deploying [$priority]: $func_name${NC}" | tee -a "$LOG_FILE"

  if supabase functions deploy "$func_name" --project-ref "$PROJECT_REF" >> "$LOG_FILE" 2>&1; then
    echo -e "${GREEN}✅ OK: $func_name${NC}" | tee -a "$LOG_FILE"
    echo "$priority|$func_name|SUCCESS|$(date)" >> "$PROGRESS_FILE"
    return 0
  else
    echo -e "${RED}❌ ERROR: $func_name${NC}" | tee -a "$LOG_FILE"
    echo "$priority|$func_name|ERROR|$(date)" >> "$PROGRESS_FILE"
    return 1
  fi
}

################################################################################
# 🔴 FUNCIONES CRÍTICAS (Deploy primero)
################################################################################

echo -e "\n${RED}═══════════════════════════════════════════════════════════${NC}"
echo -e "${RED}  🔴 FUNCIONES CRÍTICAS (Sistema no funciona sin ellas)${NC}"
echo -e "${RED}═══════════════════════════════════════════════════════════${NC}\n"

CRITICAL_FUNCTIONS=(
  "custom-access-token"
  "send-sms-otp"
  "verify-sms-otp"
  "auth-send-email"
  "rapid-processor"
  "airtable-sync"
)

for func in "${CRITICAL_FUNCTIONS[@]}"; do
  deploy_function "$func" "CRÍTICA" || {
    echo -e "${RED}❌ Fallo CRÍTICO en $func${NC}"
    echo "El sistema NO funcionará sin esta función."
    read -p "¿Continuar de todos modos? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
      echo "Abortando deploy."
      exit 1
    fi
  }
done

echo -e "\n${GREEN}✅ FUNCIONES CRÍTICAS DEPLOYED${NC}"

################################################################################
# 🟡 FUNCIONES IMPORTANTES (Funcionalidad degradada sin ellas)
################################################################################

echo -e "\n${YELLOW}═══════════════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}  🟡 FUNCIONES IMPORTANTES${NC}"
echo -e "${YELLOW}═══════════════════════════════════════════════════════════${NC}\n"

IMPORTANT_FUNCTIONS=(
  "automated-email-notifications"
  "send-brevo-email"
  "r2-upload"
  "get-thumbnails"
  "catalogo-facebook"
  "sitemap-generator"
  "mark-vehicle-sold"
  "rapid-vehicles-sync-ts"
  "smart-api"
  "smooth-handler"
  "swift-responder"
)

for func in "${IMPORTANT_FUNCTIONS[@]}"; do
  deploy_function "$func" "IMPORTANTE" || {
    echo -e "${YELLOW}⚠️  Error no crítico - continuando...${NC}"
  }
done

echo -e "\n${GREEN}✅ FUNCIONES IMPORTANTES DEPLOYED${NC}"

################################################################################
# 🟢 FUNCIONES AUXILIARES (No críticas)
################################################################################

echo -e "\n${GREEN}═══════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  🟢 FUNCIONES AUXILIARES${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}\n"

AUXILIARY_FUNCTIONS=(
  "kommo-webhook"
  "kommo-oauth"
  "autometrica-proxy"
  "intelimotor-proxy"
  "valuation-proxy"
  "carstudio-proxy"
  "r2-list"
  "realtime-visitors"
  "facebook-inventory-feed"
  "api-facebook-catalogue-csv"
  "fix-rls-policy"
)

for func in "${AUXILIARY_FUNCTIONS[@]}"; do
  deploy_function "$func" "AUXILIAR" || {
    echo -e "${YELLOW}⚠️  Error en función auxiliar - continuando...${NC}"
  }
done

echo -e "\n${GREEN}✅ FUNCIONES AUXILIARES DEPLOYED${NC}"

################################################################################
# VERIFICAR SECRETS
################################################################################

echo -e "\n${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  🔐 VERIFICANDO SECRETS${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}\n"

echo "Listando secrets configurados..."
supabase secrets list --project-ref "$PROJECT_REF" | tee -a "$LOG_FILE"

echo ""
echo -e "${YELLOW}⚠️  VERIFICAR que los siguientes secrets están configurados:${NC}"
echo ""
echo "Airtable:"
echo "  - AIRTABLE_API_KEY"
echo "  - AIRTABLE_BASE_ID"
echo "  - AIRTABLE_TABLE_ID"
echo "  - AIRTABLE_VALUATION_API_KEY"
echo "  - AIRTABLE_VALUATION_BASE_ID"
echo ""
echo "Twilio (SMS):"
echo "  - TWILIO_ACCOUNT_SID"
echo "  - TWILIO_AUTH_TOKEN"
echo "  - TWILIO_VERIFY_SERVICE_SID"
echo ""
echo "Brevo (Email):"
echo "  - BREVO_API_KEY"
echo ""
echo "Cloudflare R2:"
echo "  - CLOUDFLARE_ACCOUNT_ID"
echo "  - CLOUDFLARE_R2_ACCESS_KEY_ID"
echo "  - CLOUDFLARE_R2_SECRET_ACCESS_KEY"
echo ""
echo "Supabase:"
echo "  - SUPABASE_URL"
echo "  - SUPABASE_SERVICE_ROLE_KEY"
echo "  - SUPABASE_ANON_KEY"
echo ""
echo "Otros:"
echo "  - PUBLIC_SITE_URL"
echo "  - SERVICE_ACCESS_TOKEN"
echo ""

read -p "¿Los secrets están configurados correctamente? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo ""
  echo "Para configurar secrets:"
  echo "  supabase secrets set NOMBRE=\"valor\" --project-ref $PROJECT_REF"
  echo ""
  exit 1
fi

################################################################################
# RESUMEN FINAL
################################################################################

echo -e "\n${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║              📊 RESUMEN DE DEPLOY                         ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}\n"

# Contar resultados
TOTAL=$(wc -l < "$PROGRESS_FILE" 2>/dev/null || echo "0")
SUCCESS=$(grep -c "SUCCESS" "$PROGRESS_FILE" 2>/dev/null || echo "0")
ERRORS=$(grep -c "ERROR" "$PROGRESS_FILE" 2>/dev/null || echo "0")
CRITICAL_SUCCESS=$(grep "CRÍTICA.*SUCCESS" "$PROGRESS_FILE" 2>/dev/null | wc -l)
CRITICAL_ERRORS=$(grep "CRÍTICA.*ERROR" "$PROGRESS_FILE" 2>/dev/null | wc -l)

echo "Total de funciones: $TOTAL"
echo -e "${GREEN}✅ Deployed: $SUCCESS${NC}"
echo -e "${RED}❌ Con errores: $ERRORS${NC}"
echo ""
echo "Funciones críticas:"
echo -e "  ${GREEN}✅ OK: $CRITICAL_SUCCESS / 6${NC}"
echo -e "  ${RED}❌ Errores: $CRITICAL_ERRORS / 6${NC}"
echo ""
echo "📝 Log completo: $LOG_FILE"
echo "📊 Progreso: $PROGRESS_FILE"
echo ""

if [ "$CRITICAL_ERRORS" -gt 0 ]; then
  echo -e "${RED}⚠️  ADVERTENCIA: Hay funciones CRÍTICAS con errores.${NC}"
  echo -e "${RED}El sistema NO funcionará correctamente.${NC}"
  echo ""
  echo "Funciones críticas con error:"
  grep "CRÍTICA.*ERROR" "$PROGRESS_FILE" | cut -d'|' -f2
  echo ""
  exit 1
fi

if [ "$ERRORS" -gt 0 ]; then
  echo -e "${YELLOW}⚠️  Algunas funciones tuvieron errores (no críticas).${NC}"
  echo ""
  echo "Funciones con error:"
  grep "ERROR" "$PROGRESS_FILE" | cut -d'|' -f2
  echo ""
fi

echo -e "${GREEN}🎉 Deploy completado exitosamente.${NC}"
echo ""
echo "📋 Próximos pasos:"
echo "  1. Verificar que las funciones respondan correctamente"
echo "  2. Probar login con SMS OTP"
echo "  3. Verificar búsqueda de vehículos (rapid-processor)"
echo "  4. Probar sincronización Airtable"
echo ""
