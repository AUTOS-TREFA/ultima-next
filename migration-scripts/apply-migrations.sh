#!/bin/bash
################################################################################
# SCRIPT DE APLICACIÓN DE MIGRACIONES SQL
# Aplica 104 migraciones en orden correcto en 3 fases
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
MIGRATIONS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../supabase/migrations" && pwd)"
LOG_FILE="migration_log_$(date +%Y%m%d_%H%M%S).txt"
PROGRESS_FILE="migration_progress.txt"

# Connection string (Session Mode - Puerto 5432)
DB_URL="postgresql://postgres:Lifeintechnicolor2!@db.pemgwyymodlwabaexxrb.supabase.co:5432/postgres"

echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║        🚀 APLICACIÓN DE MIGRACIONES SQL                   ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo "📂 Directorio de migraciones: $MIGRATIONS_DIR"
echo "📝 Log de ejecución: $LOG_FILE"
echo ""

# Verificar directorio de migraciones
if [ ! -d "$MIGRATIONS_DIR" ]; then
  echo -e "${RED}❌ Error: Directorio de migraciones no existe${NC}"
  exit 1
fi

# Función para aplicar una migración
apply_migration() {
  local migration_file=$1
  local phase=$2

  echo -e "\n${YELLOW}⏳ Aplicando: $migration_file${NC}" | tee -a "$LOG_FILE"

  if psql "$DB_URL" -f "$MIGRATIONS_DIR/$migration_file" >> "$LOG_FILE" 2>&1; then
    echo -e "${GREEN}✅ OK: $migration_file${NC}" | tee -a "$LOG_FILE"
    echo "$phase|$migration_file|SUCCESS|$(date)" >> "$PROGRESS_FILE"
    return 0
  else
    local exit_code=$?
    echo -e "${RED}⚠️  ERROR en $migration_file (código: $exit_code)${NC}" | tee -a "$LOG_FILE"
    echo "$phase|$migration_file|ERROR|$(date)" >> "$PROGRESS_FILE"

    # Verificar si es un error esperado
    if grep -q -E "(already exists|does not exist|duplicate)" "$LOG_FILE"; then
      echo -e "${YELLOW}   (Error esperado - continuando...)${NC}"
      return 0
    fi

    return 1
  fi
}

################################################################################
# FASE A: ESTRUCTURA (Tablas, Columnas, Extensiones)
################################################################################

echo -e "\n${GREEN}═══════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  FASE A: ESTRUCTURA (Tablas, Columnas, Extensiones)${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}\n"

PHASE_A_MIGRATIONS=(
  # Extensiones
  "20251021120000_enable_pg_trgm.sql"

  # Tablas nuevas
  "20250128_create_landing_pages.sql"
  "20251026000000_create_marketing_tools_tables.sql"
  "20251024000001_create_sync_logs_table.sql"
  "20251105000000_create_roadmap_items_table.sql"
  "20250128000001_create_user_email_notifications.sql"
  "20251206000001_create_document_upload_metrics.sql"
  "20251216120000_create_vehiculos_completos.sql"

  # Columnas nuevas en profiles
  "20250110000001_add_cellphone_company_to_profiles.sql"
  "20251026120000_add_last_sign_in_to_profiles.sql"
  "20251104000006_add_source_tracking.sql"
  "20251105000002_add_advisor_name_to_profile.sql"
  "20251107000003_add_kommo_data_to_leads.sql"
  "20251209000001_add_fbclid_to_profiles.sql"
  "20251212000001_add_phone_verified_column.sql"

  # Columnas en otras tablas
  "20251021200000_add_transmision_combustible_columns.sql"
  "20251104150000_add_car_studio_columns.sql"
  "20251206_add_missing_columns.sql"
  "20251104000012_add_columns_then_fix_function.sql"
  "20251104000013_fix_column_types.sql"
  "20251104000014_fix_column_types_corrected.sql"
)

for migration in "${PHASE_A_MIGRATIONS[@]}"; do
  apply_migration "$migration" "A" || {
    echo -e "${RED}❌ Fallo crítico en FASE A${NC}"
    echo "Revisar log: $LOG_FILE"
    exit 1
  }
done

echo -e "\n${GREEN}✅ FASE A COMPLETADA${NC}"

################################################################################
# FASE B: FUNCIONES Y TRIGGERS
################################################################################

echo -e "\n${GREEN}═══════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  FASE B: FUNCIONES RPC Y TRIGGERS${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}\n"

PHASE_B_MIGRATIONS=(
  # Funciones de dashboard y CRM
  "20251020140000_update_leads_dashboard_function.sql"
  "20251022000000_fix_leads_dashboard_filter.sql"
  "20251022000001_fix_crm_dashboard_stats.sql"
  "20251104000005_add_timestamps_to_leads_function.sql"
  "20251112000008_recreate_get_leads_for_dashboard.sql"
  "20251112000009_fix_get_leads_type_mismatch.sql"
  "20251024214000_fix_get_leads_for_dashboard_type.sql"
  "20251112000004_fix_get_leads_for_dashboard_assigned_only.sql"

  # Funciones de compras
  "20251024000000_create_compras_functions.sql"

  # Funciones de gestión de usuarios
  "20251104120000_create_user_management_functions.sql"
  "20251112000001_create_sales_performance_metrics_function.sql"
  "sales_dashboard_functions.sql"

  # Funciones de perfil
  "20251024000002_fix_get_my_role_function.sql"
  "20251112000005_fix_get_my_role_cascade.sql"
  "20251214000002_add_get_my_profile_rpc.sql"
  "20251212000002_fix_safe_upsert_profile_auth.sql"
  "20251214000001_fix_safe_upsert_profile_role.sql"
  "20251024212000_fix_get_secure_client_profile_rpc.sql"
  "20251024213000_fix_get_secure_client_profile_order_by.sql"
  "20251024216000_fix_get_secure_client_profile_correct_schema.sql"
  "20251112000007_recreate_sales_functions.sql"

  # Funciones de vehículos
  "20251020160000_create_increment_view_count_function.sql"
  "20251022100000_fix_increment_views_security.sql"
  "20251021130000_make_search_case_insensitive.sql"
  "20251026150000_fix_vacancies_function.sql"
  "20251026160000_fix_get_filter_options_field_names.sql"
  "20251206000002_update_get_filter_options_ubicacion_mapping.sql"

  # Triggers
  "20251021200001_sync_transmision_combustible_trigger.sql"
  "20251024120000_create_profile_trigger.sql"
  "20251024220000_add_email_notification_triggers.sql"
  "20251024221000_fix_email_triggers_hardcoded_config.sql"

  # Cron jobs
  "20250127_setup_email_notifications_cron.sql"

  # Otras funciones
  "20251104130000_add_leads_actualizados_counter.sql"
)

for migration in "${PHASE_B_MIGRATIONS[@]}"; do
  apply_migration "$migration" "B" || {
    echo -e "${YELLOW}⚠️  Error no crítico en FASE B - continuando...${NC}"
  }
done

echo -e "\n${GREEN}✅ FASE B COMPLETADA${NC}"

################################################################################
# FASE C: POLÍTICAS RLS E ÍNDICES
################################################################################

echo -e "\n${GREEN}═══════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  FASE C: POLÍTICAS RLS E ÍNDICES${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}\n"

PHASE_C_MIGRATIONS=(
  # RLS Profiles
  "20251020130000_fix_profile_rls_policies.sql"
  "20251024200000_fix_profiles_rls_for_admin.sql"
  "20251024210000_fix_profiles_rls_no_recursion.sql"
  "20251024211000_fix_profiles_rls_use_jwt.sql"
  "20251213000001_fix_profile_upsert_rls.sql"
  "20251213000003_comprehensive_profiles_rls_fix.sql"
  "20251211000001_optimize_rls_auth_uid_performance.sql"
  "20250203_add_admin_emails_to_rls.sql"
  "20250203000001_fix_email_notifications_rls.sql"
  "20251216000001_fix_admin_email_recognition.sql"

  # RLS Sales Access
  "20251104000000_fix_sales_access_to_leads.sql"
  "20251104000001_fix_sales_documents_access.sql"
  "20251104000002_fix_sales_documents_access_v2.sql"
  "20251104000007_fix_sales_access_complete.sql"
  "20251104000008_debug_and_fix_sales_access.sql"
  "20251104000011_final_sales_access_fix.sql"
  "20251110000002_fix_sales_crm_role_filtering.sql"
  "20251112000002_permanent_sales_access_fix.sql"
  "20251112000010_permanent_sales_access_fix.sql"

  # RLS Otras tablas
  "20251020150000_fix_document_upload_rls_policy.sql"
  "20251020180000_fix_document_upload_rls_policy_again.sql"
  "20251020170000_fix_financing_applications_rls_policy.sql"
  "20251020190000_fix_financing_applications_rls_policy_again.sql"
  "20251023200000_fix_application_insert_and_advisor_assignment.sql"
  "20251023210000_fix_financing_apps_insert_policy.sql"
  "20251023220000_fix_all_financing_apps_policies.sql"
  "20251023230000_fix_both_application_tables_rls.sql"
  "20251024130000_fix_financing_apps_rls_and_trigger.sql"
  "20251025000000_fix_financing_apps_update_rls.sql"
  "20251024140000_create_rls_policies_for_remaining_tables.sql"
  "20251024215000_fix_crm_tables_rls_use_jwt.sql"
  "20251024217000_fix_crm_tables_rls_correct_tables.sql"
  "20251105000001_fix_roadmap_items_rls.sql"
  "20251213000002_fix_bank_profiles_rls.sql"
  "20251112000006_restore_missing_policies.sql"

  # RLS Otros fixes
  "20251023000000_allow_users_view_assigned_advisor.sql"
  "20251023100000_fix_bank_profile_trigger_uid_column.sql"
  "20251023240000_fix_trigger_security_context.sql"
  "20250201_update_email_notifications_for_airtable.sql"

  # Índices
  "20251205000001_optimize_indexes_remove_redundant.sql"
  "20251205000002_optimize_indexes_add_critical.sql"
  "20251211000002_add_missing_foreign_key_indexes.sql"

  # Asignaciones y datos
  "20251104000003_reassign_orphaned_leads.sql"
  "20251104000004_revert_and_fix_assignments.sql"
  "20251104000009_check_and_assign_sales_roles.sql"
  "20251104000010_show_all_users.sql"
  "assign_existing_users_to_sales.sql"

  # Otros fixes
  "20251023000001_fix_signup_role_enum_cast.sql"
)

for migration in "${PHASE_C_MIGRATIONS[@]}"; do
  apply_migration "$migration" "C" || {
    echo -e "${YELLOW}⚠️  Error no crítico en FASE C - continuando...${NC}"
  }
done

echo -e "\n${GREEN}✅ FASE C COMPLETADA${NC}"

################################################################################
# RESUMEN FINAL
################################################################################

echo -e "\n${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║              📊 RESUMEN DE MIGRACIÓN                      ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}\n"

# Contar resultados
TOTAL=$(wc -l < "$PROGRESS_FILE" 2>/dev/null || echo "0")
SUCCESS=$(grep -c "SUCCESS" "$PROGRESS_FILE" 2>/dev/null || echo "0")
ERRORS=$(grep -c "ERROR" "$PROGRESS_FILE" 2>/dev/null || echo "0")

echo "Total de migraciones: $TOTAL"
echo -e "${GREEN}✅ Exitosas: $SUCCESS${NC}"
echo -e "${RED}❌ Con errores: $ERRORS${NC}"
echo ""
echo "📝 Log completo: $LOG_FILE"
echo "📊 Progreso: $PROGRESS_FILE"
echo ""

if [ "$ERRORS" -gt 0 ]; then
  echo -e "${YELLOW}⚠️  Algunas migraciones tuvieron errores. Revisar log.${NC}"
  echo ""
  echo "Errores encontrados:"
  grep "ERROR" "$PROGRESS_FILE" | cut -d'|' -f2
  echo ""
fi

echo -e "${GREEN}🎉 Migración completada. Verificar con verificar-migracion.sql${NC}"
echo ""
