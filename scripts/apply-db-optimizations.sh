#!/bin/bash
# =============================================================================
# Script para aplicar optimizaciones de base de datos
# Proyecto TREFA - Supabase
# =============================================================================

set -e

PROJECT_REF="pemgwyymodlwabaexxrb"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SQL_FILE="$SCRIPT_DIR/apply-db-optimizations.sql"

echo "=============================================="
echo "  Aplicando Optimizaciones de Base de Datos"
echo "  Proyecto: $PROJECT_REF"
echo "=============================================="
echo ""

# Verificar que existe el archivo SQL
if [ ! -f "$SQL_FILE" ]; then
    echo "ERROR: No se encontro el archivo SQL: $SQL_FILE"
    exit 1
fi

echo "El archivo SQL contiene las siguientes optimizaciones:"
echo ""
echo "1. INDICES PARA FOREIGN KEYS"
echo "   - idx_financing_calculations_application_id"
echo "   - idx_financing_calculations_bank_id"
echo "   - idx_form_submissions_user_id"
echo "   - idx_funnel_events_lead_id"
echo "   - idx_funnel_events_vehicle_id"
echo "   - idx_inventory_sync_logs_vehicle_id"
echo "   - idx_kommo_contacts_profile_id"
echo "   - idx_kommo_leads_profile_id"
echo "   - idx_lead_assignments_lead_id"
echo "   - idx_upload_documents_application_id"
echo "   - idx_upload_documents_user_id"
echo ""
echo "2. POLITICAS RLS (comentadas por defecto)"
echo "   - Revisa y descomenta las que necesites en el archivo SQL"
echo ""

echo "=============================================="
echo "  INSTRUCCIONES"
echo "=============================================="
echo ""
echo "Para aplicar estas optimizaciones:"
echo ""
echo "1. Abre el SQL Editor de Supabase:"
echo "   https://supabase.com/dashboard/project/$PROJECT_REF/editor"
echo ""
echo "2. Copia el contenido de:"
echo "   $SQL_FILE"
echo ""
echo "3. Pega y ejecuta en el SQL Editor"
echo ""
echo "4. Revisa los resultados de las consultas de verificacion"
echo ""
echo "=============================================="
