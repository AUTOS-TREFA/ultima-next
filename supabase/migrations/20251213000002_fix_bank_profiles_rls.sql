-- Migration: Fix Bank Profiles RLS Policies
-- Date: 2025-12-13
-- Description: Allow users to insert, read, and update their own bank profiles

-- First, fix the trigger function that references the wrong column name
-- This was causing "record 'new' has no field 'uid'" error
CREATE OR REPLACE FUNCTION "public"."set_user_id_from_auth"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$BEGIN
  -- Changed from NEW.uid to NEW.user_id to match actual column names
  IF NEW.user_id IS NULL THEN
    NEW.user_id := auth.uid();
  END IF;
  RETURN NEW;
END;$$;

-- Drop existing policies if any
DROP POLICY IF EXISTS "bank_profiles_user_select_own" ON public.bank_profiles;
DROP POLICY IF EXISTS "bank_profiles_user_insert_own" ON public.bank_profiles;
DROP POLICY IF EXISTS "bank_profiles_user_update_own" ON public.bank_profiles;
DROP POLICY IF EXISTS "Users can view own bank profile" ON public.bank_profiles;
DROP POLICY IF EXISTS "Users can insert own bank profile" ON public.bank_profiles;
DROP POLICY IF EXISTS "Users can update own bank profile" ON public.bank_profiles;

-- Enable RLS on bank_profiles if not already enabled
ALTER TABLE public.bank_profiles ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to read their own bank profile
CREATE POLICY "bank_profiles_user_select_own" ON public.bank_profiles
    FOR SELECT
    USING (auth.uid() = user_id);

-- Create policy to allow users to insert their own bank profile
CREATE POLICY "bank_profiles_user_insert_own" ON public.bank_profiles
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Create policy to allow users to update their own bank profile
CREATE POLICY "bank_profiles_user_update_own" ON public.bank_profiles
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Verify policies exist (for debugging)
DO $$
DECLARE
    policy_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies
    WHERE tablename = 'bank_profiles';

    IF policy_count >= 3 THEN
        RAISE NOTICE 'SUCCESS: Bank profiles RLS policies created successfully (% policies)', policy_count;
    ELSE
        RAISE WARNING 'WARNING: Only % policies were created for bank_profiles (expected at least 3)', policy_count;
    END IF;
END $$;

COMMENT ON FUNCTION public.set_user_id_from_auth IS 'Sets user_id from authenticated user if not provided - fixed to use user_id instead of uid';
