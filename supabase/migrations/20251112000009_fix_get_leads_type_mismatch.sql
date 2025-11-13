-- Fix type mismatch in get_leads_for_dashboard function
-- Error: "Returned type character varying(255) does not match expected type text in column 8"
-- Column 8 is asesor_asignado which comes from auth.users.email (varchar)

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
  asesor_asignado text,  -- Column 8 - needs explicit cast
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
    current_user_role text;
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
        RAISE EXCEPTION 'Permission denied to access leads dashboard. Your role is: %', COALESCE(current_user_role, 'NULL');
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
        (SELECT u.email::text FROM auth.users u WHERE u.id = p.asesor_asignado_id) as asesor_asignado,  -- Explicit cast to text
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
          -- Admin sees all leads
          current_user_role = 'admin'
          OR
          -- Sales sees ONLY assigned leads
          (current_user_role = 'sales' AND p.asesor_asignado_id = current_user_id)
      )
    ORDER BY p.created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_leads_for_dashboard() TO authenticated;

COMMENT ON FUNCTION public.get_leads_for_dashboard() IS
'[PERMANENT] Returns leads for CRM dashboard. Admin sees all leads, Sales sees only assigned leads. Uses SECURITY DEFINER to bypass RLS. Fixed type casting for asesor_asignado column.';

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== get_leads_for_dashboard() TYPE MISMATCH FIXED ===';
    RAISE NOTICE '';
    RAISE NOTICE 'Fixed: Explicit cast of auth.users.email (varchar) to text';
    RAISE NOTICE 'Column 8 (asesor_asignado) now properly casts to text type';
    RAISE NOTICE '';
END $$;
