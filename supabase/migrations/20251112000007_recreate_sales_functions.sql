-- Recreate sales functions that may have been dropped by CASCADE
-- when get_my_role() was dropped and recreated

-- 1. Recreate get_sales_assigned_leads function
DROP FUNCTION IF EXISTS get_sales_assigned_leads(uuid);

CREATE OR REPLACE FUNCTION get_sales_assigned_leads(sales_user_id uuid)
RETURNS TABLE(
    id uuid,
    email text,
    first_name text,
    last_name text,
    mother_last_name text,
    phone text,
    source text,
    contactado boolean,
    asesor_asignado_id uuid,
    asesor_asignado text,
    asesor_autorizado_acceso boolean,
    created_at timestamptz,
    metadata jsonb,
    latest_app_status text,
    latest_app_car_info jsonb,
    rfc text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.id,
        p.email,
        p.first_name,
        p.last_name,
        p.mother_last_name,
        p.phone,
        p.source,
        p.contactado,
        p.asesor_asignado_id,
        COALESCE(asesor.first_name || ' ' || asesor.last_name, 'No asignado') as asesor_asignado,
        COALESCE(p.asesor_autorizado_acceso, false) as asesor_autorizado_acceso,
        p.created_at,
        p.metadata,
        latest_app.status as latest_app_status,
        latest_app.car_info as latest_app_car_info,
        p.rfc
    FROM profiles p
    LEFT JOIN profiles asesor ON p.asesor_asignado_id = asesor.id
    LEFT JOIN LATERAL (
        SELECT status, car_info
        FROM financing_applications
        WHERE user_id = p.id
        ORDER BY created_at DESC
        LIMIT 1
    ) latest_app ON true
    WHERE p.asesor_asignado_id = sales_user_id
      AND p.role = 'user'
      AND COALESCE(p.asesor_autorizado_acceso, false) = true
    ORDER BY p.created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION get_sales_assigned_leads(uuid) TO authenticated;

COMMENT ON FUNCTION get_sales_assigned_leads(uuid) IS
'Returns all leads assigned to a sales user where asesor_autorizado_acceso is true';

-- 2. Recreate get_sales_dashboard_stats function
DROP FUNCTION IF EXISTS get_sales_dashboard_stats(uuid);

CREATE OR REPLACE FUNCTION get_sales_dashboard_stats(sales_user_id UUID)
RETURNS TABLE(
    total_leads BIGINT,
    leads_contacted BIGINT,
    leads_not_contacted BIGINT,
    leads_with_active_app BIGINT,
    leads_needing_follow_up BIGINT,
    total_applications BIGINT,
    active_applications BIGINT,
    draft_applications BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(DISTINCT p.id) AS total_leads,
        COUNT(DISTINCT p.id) FILTER (WHERE p.contactado = true) AS leads_contacted,
        COUNT(DISTINCT p.id) FILTER (WHERE p.contactado = false OR p.contactado IS NULL) AS leads_not_contacted,
        COUNT(DISTINCT CASE WHEN fa.status NOT IN ('draft', 'rejected', 'cancelled') THEN p.id END) AS leads_with_active_app,
        COUNT(DISTINCT CASE WHEN (p.contactado = false OR p.contactado IS NULL) AND fa.id IS NULL THEN p.id END) AS leads_needing_follow_up,
        COUNT(fa.id) AS total_applications,
        COUNT(fa.id) FILTER (WHERE fa.status NOT IN ('draft', 'rejected', 'cancelled')) AS active_applications,
        COUNT(fa.id) FILTER (WHERE fa.status = 'draft') AS draft_applications
    FROM profiles p
    LEFT JOIN financing_applications fa ON fa.user_id = p.id
    WHERE p.asesor_asignado_id = sales_user_id
      AND p.role = 'user'
      AND COALESCE(p.asesor_autorizado_acceso, false) = true;
END;
$$;

GRANT EXECUTE ON FUNCTION get_sales_dashboard_stats(UUID) TO authenticated;

COMMENT ON FUNCTION get_sales_dashboard_stats IS 'Returns statistics for a sales users assigned leads';

-- 3. Recreate get_sales_client_profile function
DROP FUNCTION IF EXISTS get_sales_client_profile(uuid, uuid);

CREATE OR REPLACE FUNCTION get_sales_client_profile(client_id uuid, sales_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result jsonb;
    has_access boolean;
BEGIN
    -- Check if sales user has access to this client
    SELECT
        (p.asesor_asignado_id = sales_user_id AND p.asesor_autorizado_acceso = true)
    INTO has_access
    FROM profiles p
    WHERE p.id = client_id;

    -- If no access, return null
    IF NOT has_access THEN
        RETURN NULL;
    END IF;

    -- Build result with profile and related data
    SELECT jsonb_build_object(
        'profile', to_jsonb(p.*) || jsonb_build_object(
            'asesor_asignado_name', COALESCE(
                asesor.first_name || ' ' || asesor.last_name,
                'Sin asignar'
            )
        ),
        'applications', COALESCE(
            (SELECT jsonb_agg(to_jsonb(fa.*) ORDER BY fa.created_at DESC)
             FROM financing_applications fa
             WHERE fa.user_id = client_id),
            '[]'::jsonb
        ),
        'tags', COALESCE(
            (SELECT jsonb_agg(jsonb_build_object(
                'id', lta.tag_id,
                'tag_name', lt.tag_name,
                'color', lt.color
            ))
             FROM lead_tag_associations lta
             JOIN lead_tags lt ON lt.id = lta.tag_id
             WHERE lta.lead_id = client_id),
            '[]'::jsonb
        ),
        'reminders', COALESCE(
            (SELECT jsonb_agg(to_jsonb(r.*) ORDER BY r.reminder_date ASC)
             FROM lead_reminders r
             WHERE r.lead_id = client_id),
            '[]'::jsonb
        ),
        'documents', COALESCE(
            (SELECT jsonb_agg(to_jsonb(d.*) ORDER BY d.created_at DESC)
             FROM uploaded_documents d
             WHERE d.user_id = client_id),
            '[]'::jsonb
        )
    ) INTO result
    FROM profiles p
    LEFT JOIN profiles asesor ON p.asesor_asignado_id = asesor.id
    WHERE p.id = client_id;

    RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION get_sales_client_profile(uuid, uuid) TO authenticated;

COMMENT ON FUNCTION get_sales_client_profile(uuid, uuid) IS
'Returns complete client profile if sales user has authorized access (asesor_asignado_id matches and asesor_autorizado_acceso is true)';

-- 4. Recreate verify_sales_access_to_lead function
DROP FUNCTION IF EXISTS verify_sales_access_to_lead(uuid, uuid);

CREATE OR REPLACE FUNCTION verify_sales_access_to_lead(lead_id uuid, sales_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    has_access boolean;
BEGIN
    SELECT
        (p.asesor_asignado_id = sales_user_id AND COALESCE(p.asesor_autorizado_acceso, false) = true)
    INTO has_access
    FROM profiles p
    WHERE p.id = lead_id;

    RETURN COALESCE(has_access, false);
END;
$$;

GRANT EXECUTE ON FUNCTION verify_sales_access_to_lead(uuid, uuid) TO authenticated;

COMMENT ON FUNCTION verify_sales_access_to_lead(uuid, uuid) IS
'Verifies if a sales user has authorized access to a specific lead';

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== SALES FUNCTIONS RECREATED ===';
    RAISE NOTICE '';
    RAISE NOTICE 'Recreated functions:';
    RAISE NOTICE '  - get_sales_assigned_leads(uuid)';
    RAISE NOTICE '  - get_sales_dashboard_stats(uuid)';
    RAISE NOTICE '  - get_sales_client_profile(uuid, uuid)';
    RAISE NOTICE '  - verify_sales_access_to_lead(uuid, uuid)';
    RAISE NOTICE '';
    RAISE NOTICE 'All functions use SECURITY DEFINER to bypass RLS';
    RAISE NOTICE '';
END $$;
