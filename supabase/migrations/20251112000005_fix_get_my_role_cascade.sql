-- Fix: Drop and recreate get_my_role function with CASCADE to handle dependencies
-- This will drop the function and all dependent policies, then recreate them

-- Drop the function with CASCADE to remove all dependent policies
DROP FUNCTION IF EXISTS public.get_my_role() CASCADE;

-- Recreate the function with correct signature
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$;

GRANT EXECUTE ON FUNCTION public.get_my_role() TO authenticated;

COMMENT ON FUNCTION public.get_my_role() IS
'Returns the role of the current user. Uses SECURITY DEFINER to bypass RLS and avoid recursion.';

-- Recreate the policies that were dropped by CASCADE
-- Note: These policies may have been dropped, so we need to recreate them

-- Admin users can manage all roadmap items
DROP POLICY IF EXISTS "Admin users can manage all roadmap items" ON roadmap_items;
CREATE POLICY "Admin users can manage all roadmap items"
ON roadmap_items
FOR ALL
TO authenticated
USING (public.get_my_role() = 'admin');

-- profiles_select
DROP POLICY IF EXISTS "profiles_select" ON profiles;
CREATE POLICY "profiles_select"
ON profiles
FOR SELECT
TO authenticated
USING (
  id = auth.uid()
  OR public.get_my_role() IN ('admin', 'comprador', 'sales')
);

-- financing_apps_select
DROP POLICY IF EXISTS "financing_apps_select" ON financing_applications;
CREATE POLICY "financing_apps_select"
ON financing_applications
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  OR public.get_my_role() IN ('admin', 'comprador')
);

-- uploaded_documents policies
DROP POLICY IF EXISTS "uploaded_documents_select" ON uploaded_documents;
CREATE POLICY "uploaded_documents_select"
ON uploaded_documents
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  OR public.get_my_role() IN ('admin', 'comprador')
);

DROP POLICY IF EXISTS "uploaded_documents_update" ON uploaded_documents;
CREATE POLICY "uploaded_documents_update"
ON uploaded_documents
FOR UPDATE
TO authenticated
USING (
  user_id = auth.uid()
  OR public.get_my_role() IN ('admin', 'comprador')
);

DROP POLICY IF EXISTS "uploaded_documents_delete" ON uploaded_documents;
CREATE POLICY "uploaded_documents_delete"
ON uploaded_documents
FOR DELETE
TO authenticated
USING (
  user_id = auth.uid()
  OR public.get_my_role() IN ('admin', 'comprador')
);

-- lead_tags policies
DROP POLICY IF EXISTS "lead_tags_select" ON lead_tags;
CREATE POLICY "lead_tags_select"
ON lead_tags
FOR SELECT
TO authenticated
USING (public.get_my_role() IN ('admin', 'sales'));

DROP POLICY IF EXISTS "lead_tags_insert" ON lead_tags;
CREATE POLICY "lead_tags_insert"
ON lead_tags
FOR INSERT
TO authenticated
WITH CHECK (public.get_my_role() IN ('admin', 'sales'));

DROP POLICY IF EXISTS "lead_tags_update" ON lead_tags;
CREATE POLICY "lead_tags_update"
ON lead_tags
FOR UPDATE
TO authenticated
USING (public.get_my_role() IN ('admin', 'sales'));

DROP POLICY IF EXISTS "lead_tags_delete" ON lead_tags;
CREATE POLICY "lead_tags_delete"
ON lead_tags
FOR DELETE
TO authenticated
USING (public.get_my_role() = 'admin');

-- lead_tag_associations policies
DROP POLICY IF EXISTS "lead_tag_associations_select" ON lead_tag_associations;
CREATE POLICY "lead_tag_associations_select"
ON lead_tag_associations
FOR SELECT
TO authenticated
USING (public.get_my_role() IN ('admin', 'sales'));

DROP POLICY IF EXISTS "lead_tag_associations_insert" ON lead_tag_associations;
CREATE POLICY "lead_tag_associations_insert"
ON lead_tag_associations
FOR INSERT
TO authenticated
WITH CHECK (public.get_my_role() IN ('admin', 'sales'));

DROP POLICY IF EXISTS "lead_tag_associations_update" ON lead_tag_associations;
CREATE POLICY "lead_tag_associations_update"
ON lead_tag_associations
FOR UPDATE
TO authenticated
USING (public.get_my_role() IN ('admin', 'sales'));

DROP POLICY IF EXISTS "lead_tag_associations_delete" ON lead_tag_associations;
CREATE POLICY "lead_tag_associations_delete"
ON lead_tag_associations
FOR DELETE
TO authenticated
USING (public.get_my_role() IN ('admin', 'sales'));

-- lead_reminders policies
DROP POLICY IF EXISTS "lead_reminders_select" ON lead_reminders;
CREATE POLICY "lead_reminders_select"
ON lead_reminders
FOR SELECT
TO authenticated
USING (public.get_my_role() IN ('admin', 'sales'));

DROP POLICY IF EXISTS "lead_reminders_insert" ON lead_reminders;
CREATE POLICY "lead_reminders_insert"
ON lead_reminders
FOR INSERT
TO authenticated
WITH CHECK (public.get_my_role() IN ('admin', 'sales'));

DROP POLICY IF EXISTS "lead_reminders_update" ON lead_reminders;
CREATE POLICY "lead_reminders_update"
ON lead_reminders
FOR UPDATE
TO authenticated
USING (public.get_my_role() IN ('admin', 'sales'));

DROP POLICY IF EXISTS "lead_reminders_delete" ON lead_reminders;
CREATE POLICY "lead_reminders_delete"
ON lead_reminders
FOR DELETE
TO authenticated
USING (public.get_my_role() IN ('admin', 'sales'));

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== get_my_role() FUNCTION AND POLICIES RECREATED ===';
    RAISE NOTICE '';
    RAISE NOTICE 'Function signature: get_my_role() RETURNS text';
    RAISE NOTICE 'Security: SECURITY DEFINER (bypasses RLS)';
    RAISE NOTICE 'All dependent policies have been recreated';
    RAISE NOTICE '';
END $$;
