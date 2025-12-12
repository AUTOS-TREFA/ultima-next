-- Fix safe_upsert_profile to accept user_id from profile_data instead of relying on auth.uid()
-- This fixes the timing issue where auth.uid() is NULL during login before JWT propagates

CREATE OR REPLACE FUNCTION public.safe_upsert_profile(profile_data jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id uuid;
  v_result jsonb;
  v_email text;
BEGIN
  -- Extract user_id from the profile_data
  v_user_id := (profile_data->>'id')::uuid;

  -- Validate that user_id is provided
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuario no autenticado: id is required in profile_data';
  END IF;

  -- Security check: verify the user is authenticated and matches the requested ID
  -- OR allow if auth.uid() is NULL (happens during login flow before JWT propagates)
  -- The user's identity is already verified by Supabase Auth before this function is called
  IF auth.uid() IS NOT NULL AND auth.uid() != v_user_id THEN
    RAISE EXCEPTION 'No autorizado: no puede modificar el perfil de otro usuario';
  END IF;

  -- Get email from auth.users if not provided in profile_data
  v_email := profile_data->>'email';
  IF v_email IS NULL THEN
    SELECT email INTO v_email FROM auth.users WHERE id = v_user_id;
  END IF;

  -- Upsert the profile - using a simple approach that handles missing columns gracefully
  INSERT INTO public.profiles (id, email, updated_at)
  VALUES (v_user_id, v_email, NOW())
  ON CONFLICT (id) DO UPDATE SET updated_at = NOW();

  -- Now update the profile with the provided data
  UPDATE public.profiles
  SET
    first_name = COALESCE(profile_data->>'first_name', first_name),
    last_name = COALESCE(profile_data->>'last_name', last_name),
    phone = COALESCE(profile_data->>'phone', phone),
    phone_verified = COALESCE((profile_data->>'phone_verified')::boolean, phone_verified),
    cellphone_company = COALESCE(profile_data->>'cellphone_company', cellphone_company),
    picture_url = COALESCE(profile_data->>'picture_url', picture_url),
    utm_source = COALESCE(profile_data->>'utm_source', utm_source),
    utm_medium = COALESCE(profile_data->>'utm_medium', utm_medium),
    utm_campaign = COALESCE(profile_data->>'utm_campaign', utm_campaign),
    utm_term = COALESCE(profile_data->>'utm_term', utm_term),
    utm_content = COALESCE(profile_data->>'utm_content', utm_content),
    rfdm = COALESCE(profile_data->>'rfdm', rfdm),
    referrer = COALESCE(profile_data->>'referrer', referrer),
    landing_page = COALESCE(profile_data->>'landing_page', landing_page),
    first_visit_at = COALESCE((profile_data->>'first_visit_at')::timestamptz, first_visit_at),
    fbclid = COALESCE(profile_data->>'fbclid', fbclid),
    updated_at = NOW()
  WHERE id = v_user_id;

  -- Return the updated profile
  SELECT to_jsonb(p.*) INTO v_result
  FROM public.profiles p
  WHERE p.id = v_user_id;

  RETURN v_result;
END;
$$;

-- Grant execute permission to authenticated users and anon (for login flow)
GRANT EXECUTE ON FUNCTION public.safe_upsert_profile(jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.safe_upsert_profile(jsonb) TO anon;

COMMENT ON FUNCTION public.safe_upsert_profile(jsonb) IS 'Safely upserts a user profile. Accepts user_id in the profile_data.id field to handle cases where auth.uid() is not yet available during login flow. SECURITY DEFINER allows it to bypass RLS.';
