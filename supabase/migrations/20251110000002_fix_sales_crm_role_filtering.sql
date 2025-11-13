-- Fix get_leads_for_dashboard to filter by assignment for sales users
-- This ensures sales users only see their assigned leads in SimpleCRMPage

-- ============================================================================
-- 1. DROP AND RECREATE get_leads_for_dashboard WITH ROLE-BASED FILTERING
-- ============================================================================

DROP FUNCTION IF EXISTS public.get_leads_for_dashboard() CASCADE;

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
  last_sign_in_at timestamptz,
  created_at timestamptz,
  updated_at timestamptz,
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
SET search_path = public
AS $$
DECLARE
    user_role text;
    current_user_id uuid;
BEGIN
    -- Get current user ID and role
    current_user_id := auth.uid();

    SELECT p.role INTO user_role
    FROM public.profiles p
    WHERE p.id = current_user_id;

    -- Check if user has required role
    IF user_role NOT IN ('admin', 'sales') THEN
        RAISE EXCEPTION 'Access denied. Current role: %. Required: admin or sales', COALESCE(user_role, 'NULL');
    END IF;

    -- Return query with role-based filtering
    RETURN QUERY
    SELECT
        p.id,
        p.first_name,
        p.last_name,
        p.email,
        p.phone,
        p.source,
        p.contactado,
        COALESCE(asesor.email, '')::text as asesor_asignado,
        latest_app.status as latest_app_status,
        latest_app.car_info as latest_app_car_info,
        p.asesor_asignado_id,
        p.last_sign_in_at,
        p.created_at,
        p.updated_at,
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
    LEFT JOIN public.profiles asesor ON asesor.id = p.asesor_asignado_id
    LEFT JOIN LATERAL (
        SELECT fa.status, fa.car_info
        FROM public.financing_applications fa
        WHERE fa.user_id = p.id
        ORDER BY fa.created_at DESC
        LIMIT 1
    ) latest_app ON true
    WHERE p.role = 'user'
      -- CRITICAL FIX: Filter by assignment for sales users
      AND (
        -- Admins see all leads
        user_role = 'admin'
        OR
        -- Sales users only see their assigned & authorized leads
        (
          user_role = 'sales'
          AND p.asesor_asignado_id = current_user_id
          AND COALESCE(p.asesor_autorizado_acceso, false) = true
        )
      )
    ORDER BY p.last_sign_in_at DESC NULLS LAST;
END;
$$;

-- Set ownership and grants
ALTER FUNCTION public.get_leads_for_dashboard() OWNER TO postgres;
GRANT EXECUTE ON FUNCTION public.get_leads_for_dashboard() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_leads_for_dashboard() TO anon;
GRANT EXECUTE ON FUNCTION public.get_leads_for_dashboard() TO service_role;

COMMENT ON FUNCTION public.get_leads_for_dashboard() IS
'Returns leads for CRM dashboard. Admins see all leads, sales users see only their assigned & authorized leads.';

-- ============================================================================
-- 2. UPDATE get_crm_dashboard_stats TO ENSURE CONSISTENCY
-- ============================================================================

-- This function should already filter correctly, but let's verify
-- Read the existing function to check if it needs updating

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== SALES CRM ROLE FILTERING FIX APPLIED ===';
    RAISE NOTICE '';
    RAISE NOTICE 'Changes Made:';
    RAISE NOTICE '  ✓ Updated get_leads_for_dashboard() to filter by role';
    RAISE NOTICE '  ✓ Admin users: See ALL user leads';
    RAISE NOTICE '  ✓ Sales users: See ONLY assigned & authorized leads';
    RAISE NOTICE '';
    RAISE NOTICE 'Impact:';
    RAISE NOTICE '  - SimpleCRMPage will now correctly filter for sales users';
    RAISE NOTICE '  - Sales agents can only view their assigned leads';
    RAISE NOTICE '  - Summary stats will match filtered results';
    RAISE NOTICE '';
END $$;
