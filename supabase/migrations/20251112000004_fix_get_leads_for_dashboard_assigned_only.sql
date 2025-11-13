-- ============================================================================
-- FIX: get_leads_for_dashboard() - Sales see ONLY assigned leads
-- ============================================================================
-- The function was returning ALL user leads to everyone (admin and sales).
-- This fix ensures:
-- - Admin users: See ALL leads
-- - Sales users: See ONLY leads where asesor_asignado_id = auth.uid()
-- ============================================================================

DROP FUNCTION IF EXISTS public.get_leads_for_dashboard();

CREATE OR REPLACE FUNCTION public.get_leads_for_dashboard()
RETURNS TABLE(
  id uuid,
  first_name text,
  last_name text,
  email text,
  phone text,
  source text,
  contactado boolean,
  asesor_asignado text,
  latest_app_status text,
  latest_app_car_info jsonb,
  asesor_asignado_id uuid,
  created_at timestamptz,
  updated_at timestamptz,
  last_sign_in_at timestamptz,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_term text,
  utm_content text,
  rfdm text,
  referrer text,
  landing_page text,
  first_visit_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    current_user_id uuid;
    current_user_role user_role;
BEGIN
    -- Get the current user's ID
    current_user_id := auth.uid();

    -- If auth.uid() is NULL, user is not authenticated
    IF current_user_id IS NULL THEN
        RAISE EXCEPTION 'User not authenticated';
    END IF;

    -- Get the user's role directly from profiles table
    SELECT role INTO current_user_role
    FROM profiles
    WHERE profiles.id = current_user_id;

    -- Check if user has permission (must be admin or sales)
    IF current_user_role NOT IN ('admin', 'sales') OR current_user_role IS NULL THEN
        RAISE EXCEPTION 'Permission denied to access leads dashboard. Your role is: %', COALESCE(current_user_role::text, 'NULL');
    END IF;

    -- Return the leads data with role-based filtering
    RETURN QUERY
    SELECT
        p.id,
        p.first_name,
        p.last_name,
        p.email,
        p.phone,
        p.source,
        p.contactado,
        (SELECT u.email FROM auth.users u WHERE u.id = p.asesor_asignado_id) as asesor_asignado,
        latest_app.status as latest_app_status,
        latest_app.car_info as latest_app_car_info,
        p.asesor_asignado_id,
        p.created_at,
        p.updated_at,
        p.last_sign_in_at,
        p.utm_source,
        p.utm_medium,
        p.utm_campaign,
        p.utm_term,
        p.utm_content,
        p.rfdm,
        p.referrer,
        p.landing_page,
        p.first_visit_at
    FROM
        public.profiles p
    LEFT JOIN LATERAL (
        SELECT fa.status, fa.car_info
        FROM public.financing_applications fa
        WHERE fa.user_id = p.id
        ORDER BY fa.created_at DESC
        LIMIT 1
    ) latest_app ON true
    WHERE p.role = 'user'  -- Only show actual user leads, not admin/sales accounts
      AND (
        -- Admin sees ALL leads
        current_user_role = 'admin'
        OR
        -- Sales sees ONLY ASSIGNED leads
        (current_user_role = 'sales' AND p.asesor_asignado_id = current_user_id)
      )
    ORDER BY p.updated_at DESC NULLS LAST;
END;
$$;

ALTER FUNCTION public.get_leads_for_dashboard() OWNER TO postgres;
GRANT EXECUTE ON FUNCTION public.get_leads_for_dashboard() TO authenticated;

COMMENT ON FUNCTION public.get_leads_for_dashboard() IS
'Returns leads for CRM dashboard. Admin users see ALL leads. Sales users see ONLY leads where asesor_asignado_id matches their auth.uid().';

-- ============================================================================
-- Also fix get_crm_dashboard_stats() if it exists
-- ============================================================================

DROP FUNCTION IF EXISTS public.get_crm_dashboard_stats();

CREATE OR REPLACE FUNCTION public.get_crm_dashboard_stats()
RETURNS TABLE(
  total_leads bigint,
  leads_with_active_app bigint,
  leads_with_unfinished_app bigint,
  leads_needing_follow_up bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    current_user_id uuid;
    current_user_role user_role;
BEGIN
    -- Get the current user's ID
    current_user_id := auth.uid();

    -- If auth.uid() is NULL, user is not authenticated
    IF current_user_id IS NULL THEN
        RAISE EXCEPTION 'User not authenticated';
    END IF;

    -- Get the user's role
    SELECT role INTO current_user_role
    FROM profiles
    WHERE profiles.id = current_user_id;

    -- Check permissions
    IF current_user_role NOT IN ('admin', 'sales') OR current_user_role IS NULL THEN
        RAISE EXCEPTION 'Permission denied';
    END IF;

    -- Calculate stats with role-based filtering
    RETURN QUERY
    SELECT
        COUNT(*)::bigint as total_leads,
        COUNT(CASE
            WHEN EXISTS (
                SELECT 1 FROM financing_applications fa
                WHERE fa.user_id = p.id
                AND fa.status NOT IN ('draft', 'rejected', 'cancelled')
            ) THEN 1
        END)::bigint as leads_with_active_app,
        COUNT(CASE
            WHEN EXISTS (
                SELECT 1 FROM financing_applications fa
                WHERE fa.user_id = p.id
                AND fa.status = 'draft'
            ) THEN 1
        END)::bigint as leads_with_unfinished_app,
        COUNT(CASE WHEN p.contactado = false OR p.contactado IS NULL THEN 1 END)::bigint as leads_needing_follow_up
    FROM profiles p
    WHERE p.role = 'user'
      AND (
        current_user_role = 'admin'
        OR
        (current_user_role = 'sales' AND p.asesor_asignado_id = current_user_id)
      );
END;
$$;

ALTER FUNCTION public.get_crm_dashboard_stats() OWNER TO postgres;
GRANT EXECUTE ON FUNCTION public.get_crm_dashboard_stats() TO authenticated;

COMMENT ON FUNCTION public.get_crm_dashboard_stats() IS
'Returns CRM dashboard statistics. Admin users see stats for ALL leads. Sales users see stats for ONLY their assigned leads.';

-- ============================================================================
-- VERIFY AND LOG RESULTS
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== FIX: get_leads_for_dashboard() - ASSIGNED LEADS ONLY ===';
    RAISE NOTICE '';
    RAISE NOTICE 'Functions Updated:';
    RAISE NOTICE '  ✓ get_leads_for_dashboard() - Now filters by assigned leads for sales';
    RAISE NOTICE '  ✓ get_crm_dashboard_stats() - Now calculates stats for assigned leads only';
    RAISE NOTICE '';
    RAISE NOTICE 'Behavior:';
    RAISE NOTICE '  - Admin users: See ALL leads';
    RAISE NOTICE '  - Sales users: See ONLY leads where asesor_asignado_id = auth.uid()';
    RAISE NOTICE '';
    RAISE NOTICE 'This complements the RLS policies applied in migration 20251112000003';
    RAISE NOTICE '';
END $$;
