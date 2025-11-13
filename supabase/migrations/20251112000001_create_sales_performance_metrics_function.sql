-- Create function to get sales performance metrics for a sales user
-- This function calculates comprehensive metrics for the sales performance dashboard

CREATE OR REPLACE FUNCTION public.get_sales_performance_metrics(sales_user_id uuid)
RETURNS TABLE(
  total_leads bigint,
  leads_contacted bigint,
  leads_not_contacted bigint,
  leads_with_active_app bigint,
  leads_needing_follow_up bigint,
  leads_actualizados bigint,
  total_applications bigint,
  submitted_applications bigint,
  complete_applications bigint,
  incomplete_applications bigint,
  draft_applications bigint,
  approved_applications bigint,
  rejected_applications bigint,
  contact_rate numeric,
  conversion_rate numeric,
  completion_rate numeric,
  approval_rate numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_total_leads bigint;
    v_leads_contacted bigint;
    v_leads_not_contacted bigint;
    v_leads_with_active_app bigint;
    v_leads_needing_follow_up bigint;
    v_leads_actualizados bigint;
    v_total_applications bigint;
    v_submitted_applications bigint;
    v_complete_applications bigint;
    v_incomplete_applications bigint;
    v_draft_applications bigint;
    v_approved_applications bigint;
    v_rejected_applications bigint;
    v_contact_rate numeric;
    v_conversion_rate numeric;
    v_completion_rate numeric;
    v_approval_rate numeric;
BEGIN
    -- Get total leads assigned to this sales user
    SELECT COUNT(*)
    INTO v_total_leads
    FROM public.profiles
    WHERE asesor_asignado_id = sales_user_id
      AND role = 'user';

    -- Get leads contacted
    SELECT COUNT(*)
    INTO v_leads_contacted
    FROM public.profiles
    WHERE asesor_asignado_id = sales_user_id
      AND role = 'user'
      AND contactado = true;

    -- Get leads not contacted
    SELECT COUNT(*)
    INTO v_leads_not_contacted
    FROM public.profiles
    WHERE asesor_asignado_id = sales_user_id
      AND role = 'user'
      AND (contactado = false OR contactado IS NULL);

    -- Get leads with active application (not draft, rejected, or cancelled)
    SELECT COUNT(DISTINCT p.id)
    INTO v_leads_with_active_app
    FROM public.profiles p
    INNER JOIN public.financing_applications fa ON fa.user_id = p.id
    WHERE p.asesor_asignado_id = sales_user_id
      AND p.role = 'user'
      AND fa.status NOT IN ('draft', 'rejected', 'cancelled');

    -- Get leads needing follow up (not contacted and no active app)
    SELECT COUNT(*)
    INTO v_leads_needing_follow_up
    FROM public.profiles p
    WHERE p.asesor_asignado_id = sales_user_id
      AND p.role = 'user'
      AND (p.contactado = false OR p.contactado IS NULL)
      AND NOT EXISTS (
        SELECT 1
        FROM public.financing_applications fa
        WHERE fa.user_id = p.id
          AND fa.status NOT IN ('draft', 'rejected', 'cancelled')
      );

    -- Get leads actualizados (contacted AND has application)
    SELECT COUNT(DISTINCT p.id)
    INTO v_leads_actualizados
    FROM public.profiles p
    INNER JOIN public.financing_applications fa ON fa.user_id = p.id
    WHERE p.asesor_asignado_id = sales_user_id
      AND p.role = 'user'
      AND p.contactado = true;

    -- Get total applications for this sales user's leads
    SELECT COUNT(*)
    INTO v_total_applications
    FROM public.financing_applications fa
    INNER JOIN public.profiles p ON p.id = fa.user_id
    WHERE p.asesor_asignado_id = sales_user_id
      AND p.role = 'user';

    -- Get submitted applications (not draft)
    SELECT COUNT(*)
    INTO v_submitted_applications
    FROM public.financing_applications fa
    INNER JOIN public.profiles p ON p.id = fa.user_id
    WHERE p.asesor_asignado_id = sales_user_id
      AND p.role = 'user'
      AND fa.status != 'draft';

    -- Get draft applications
    SELECT COUNT(*)
    INTO v_draft_applications
    FROM public.financing_applications fa
    INNER JOIN public.profiles p ON p.id = fa.user_id
    WHERE p.asesor_asignado_id = sales_user_id
      AND p.role = 'user'
      AND fa.status = 'draft';

    -- Get approved applications
    SELECT COUNT(*)
    INTO v_approved_applications
    FROM public.financing_applications fa
    INNER JOIN public.profiles p ON p.id = fa.user_id
    WHERE p.asesor_asignado_id = sales_user_id
      AND p.role = 'user'
      AND fa.status = 'approved';

    -- Get rejected applications
    SELECT COUNT(*)
    INTO v_rejected_applications
    FROM public.financing_applications fa
    INNER JOIN public.profiles p ON p.id = fa.user_id
    WHERE p.asesor_asignado_id = sales_user_id
      AND p.role = 'user'
      AND fa.status = 'rejected';

    -- Calculate complete vs incomplete applications
    -- For now, we'll use a simple heuristic: applications with status != 'draft' are considered complete
    v_complete_applications := v_submitted_applications;
    v_incomplete_applications := v_draft_applications;

    -- Calculate rates
    v_contact_rate := CASE
        WHEN v_total_leads > 0 THEN (v_leads_contacted::numeric / v_total_leads::numeric) * 100
        ELSE 0
    END;

    v_conversion_rate := CASE
        WHEN v_total_leads > 0 THEN (v_leads_with_active_app::numeric / v_total_leads::numeric) * 100
        ELSE 0
    END;

    v_completion_rate := CASE
        WHEN v_total_applications > 0 THEN (v_complete_applications::numeric / v_total_applications::numeric) * 100
        ELSE 0
    END;

    v_approval_rate := CASE
        WHEN v_submitted_applications > 0 THEN (v_approved_applications::numeric / v_submitted_applications::numeric) * 100
        ELSE 0
    END;

    -- Return the metrics
    RETURN QUERY SELECT
        v_total_leads,
        v_leads_contacted,
        v_leads_not_contacted,
        v_leads_with_active_app,
        v_leads_needing_follow_up,
        v_leads_actualizados,
        v_total_applications,
        v_submitted_applications,
        v_complete_applications,
        v_incomplete_applications,
        v_draft_applications,
        v_approved_applications,
        v_rejected_applications,
        v_contact_rate,
        v_conversion_rate,
        v_completion_rate,
        v_approval_rate;
END;
$$;

ALTER FUNCTION public.get_sales_performance_metrics(uuid) OWNER TO postgres;

COMMENT ON FUNCTION public.get_sales_performance_metrics(uuid) IS 'Returns comprehensive performance metrics for a sales user including lead stats, application stats, and conversion rates. Used by the Sales Performance Dashboard.';
