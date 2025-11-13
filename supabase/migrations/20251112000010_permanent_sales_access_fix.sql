-- PERMANENT FIX: Sales agents must be able to view assigned leads' profiles and applications
-- This fixes the permission errors when sales agents try to access /ventas/cliente/:id
-- Problem: financing_apps_select and uploaded_documents_select policies don't include sales role
-- Solution: Add sales role with asesor_asignado_id check for proper access control

-- ============================================================================
-- 1. FIX profiles_select - Sales can only see assigned leads
-- ============================================================================
DROP POLICY IF EXISTS "profiles_select" ON profiles;
CREATE POLICY "profiles_select"
ON profiles
FOR SELECT
TO authenticated
USING (
  id = auth.uid()
  OR public.get_my_role() = 'admin'
  OR public.get_my_role() = 'comprador'
  OR (
    public.get_my_role() = 'sales'
    AND (
      -- Sales can see their assigned leads
      asesor_asignado_id = auth.uid()
      OR id = auth.uid()  -- Sales can see their own profile
    )
  )
);

-- ============================================================================
-- 2. FIX financing_applications_select - Sales can view assigned leads' apps
-- ============================================================================
DROP POLICY IF EXISTS "financing_apps_select" ON financing_applications;
CREATE POLICY "financing_apps_select"
ON financing_applications
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  OR public.get_my_role() = 'admin'
  OR public.get_my_role() = 'comprador'
  OR (
    public.get_my_role() = 'sales'
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = financing_applications.user_id
        AND profiles.asesor_asignado_id = auth.uid()
    )
  )
);

-- ============================================================================
-- 3. FIX uploaded_documents_select - Sales can view assigned leads' documents
-- ============================================================================
DROP POLICY IF EXISTS "uploaded_documents_select" ON uploaded_documents;
CREATE POLICY "uploaded_documents_select"
ON uploaded_documents
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  OR public.get_my_role() = 'admin'
  OR public.get_my_role() = 'comprador'
  OR (
    public.get_my_role() = 'sales'
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = uploaded_documents.user_id
        AND profiles.asesor_asignado_id = auth.uid()
    )
  )
);

-- ============================================================================
-- 4. FIX uploaded_documents_update - Sales can update assigned leads' documents
-- ============================================================================
DROP POLICY IF EXISTS "uploaded_documents_update" ON uploaded_documents;
CREATE POLICY "uploaded_documents_update"
ON uploaded_documents
FOR UPDATE
TO authenticated
USING (
  user_id = auth.uid()
  OR public.get_my_role() = 'admin'
  OR public.get_my_role() = 'comprador'
  OR (
    public.get_my_role() = 'sales'
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = uploaded_documents.user_id
        AND profiles.asesor_asignado_id = auth.uid()
    )
  )
);

-- ============================================================================
-- 5. FIX uploaded_documents_delete - Sales can delete assigned leads' documents
-- ============================================================================
DROP POLICY IF EXISTS "uploaded_documents_delete" ON uploaded_documents;
CREATE POLICY "uploaded_documents_delete"
ON uploaded_documents
FOR DELETE
TO authenticated
USING (
  user_id = auth.uid()
  OR public.get_my_role() = 'admin'
  OR public.get_my_role() = 'comprador'
  OR (
    public.get_my_role() = 'sales'
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = uploaded_documents.user_id
        AND profiles.asesor_asignado_id = auth.uid()
    )
  )
);

-- ============================================================================
-- 6. FIX lead_tags_select - Sales can view all tags (needed for tagging)
-- ============================================================================
DROP POLICY IF EXISTS "lead_tags_select" ON lead_tags;
CREATE POLICY "lead_tags_select"
ON lead_tags
FOR SELECT
TO authenticated
USING (public.get_my_role() IN ('admin', 'sales'));

-- ============================================================================
-- 7. FIX lead_tag_associations_select - Sales can view tags on assigned leads
-- ============================================================================
DROP POLICY IF EXISTS "lead_tag_associations_select" ON lead_tag_associations;
CREATE POLICY "lead_tag_associations_select"
ON lead_tag_associations
FOR SELECT
TO authenticated
USING (
  public.get_my_role() = 'admin'
  OR (
    public.get_my_role() = 'sales'
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = lead_tag_associations.lead_id
        AND profiles.asesor_asignado_id = auth.uid()
    )
  )
);

-- ============================================================================
-- 8. FIX lead_tag_associations_insert - Sales can tag assigned leads
-- ============================================================================
DROP POLICY IF EXISTS "lead_tag_associations_insert" ON lead_tag_associations;
CREATE POLICY "lead_tag_associations_insert"
ON lead_tag_associations
FOR INSERT
TO authenticated
WITH CHECK (
  public.get_my_role() = 'admin'
  OR (
    public.get_my_role() = 'sales'
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = lead_tag_associations.lead_id
        AND profiles.asesor_asignado_id = auth.uid()
    )
  )
);

-- ============================================================================
-- 9. FIX lead_tag_associations_update - Sales can update tags on assigned leads
-- ============================================================================
DROP POLICY IF EXISTS "lead_tag_associations_update" ON lead_tag_associations;
CREATE POLICY "lead_tag_associations_update"
ON lead_tag_associations
FOR UPDATE
TO authenticated
USING (
  public.get_my_role() = 'admin'
  OR (
    public.get_my_role() = 'sales'
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = lead_tag_associations.lead_id
        AND profiles.asesor_asignado_id = auth.uid()
    )
  )
);

-- ============================================================================
-- 10. FIX lead_tag_associations_delete - Sales can remove tags from assigned leads
-- ============================================================================
DROP POLICY IF EXISTS "lead_tag_associations_delete" ON lead_tag_associations;
CREATE POLICY "lead_tag_associations_delete"
ON lead_tag_associations
FOR DELETE
TO authenticated
USING (
  public.get_my_role() = 'admin'
  OR (
    public.get_my_role() = 'sales'
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = lead_tag_associations.lead_id
        AND profiles.asesor_asignado_id = auth.uid()
    )
  )
);

-- ============================================================================
-- 11. FIX lead_reminders_select - Sales can view reminders for assigned leads
-- ============================================================================
DROP POLICY IF EXISTS "lead_reminders_select" ON lead_reminders;
CREATE POLICY "lead_reminders_select"
ON lead_reminders
FOR SELECT
TO authenticated
USING (
  public.get_my_role() = 'admin'
  OR (
    public.get_my_role() = 'sales'
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = lead_reminders.lead_id
        AND profiles.asesor_asignado_id = auth.uid()
    )
  )
);

-- ============================================================================
-- 12. FIX lead_reminders_insert - Sales can create reminders for assigned leads
-- ============================================================================
DROP POLICY IF EXISTS "lead_reminders_insert" ON lead_reminders;
CREATE POLICY "lead_reminders_insert"
ON lead_reminders
FOR INSERT
TO authenticated
WITH CHECK (
  public.get_my_role() = 'admin'
  OR (
    public.get_my_role() = 'sales'
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = lead_reminders.lead_id
        AND profiles.asesor_asignado_id = auth.uid()
    )
  )
);

-- ============================================================================
-- 13. FIX lead_reminders_update - Sales can update reminders for assigned leads
-- ============================================================================
DROP POLICY IF EXISTS "lead_reminders_update" ON lead_reminders;
CREATE POLICY "lead_reminders_update"
ON lead_reminders
FOR UPDATE
TO authenticated
USING (
  public.get_my_role() = 'admin'
  OR (
    public.get_my_role() = 'sales'
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = lead_reminders.lead_id
        AND profiles.asesor_asignado_id = auth.uid()
    )
  )
);

-- ============================================================================
-- 14. FIX lead_reminders_delete - Sales can delete reminders for assigned leads
-- ============================================================================
DROP POLICY IF EXISTS "lead_reminders_delete" ON lead_reminders;
CREATE POLICY "lead_reminders_delete"
ON lead_reminders
FOR DELETE
TO authenticated
USING (
  public.get_my_role() = 'admin'
  OR (
    public.get_my_role() = 'sales'
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = lead_reminders.lead_id
        AND profiles.asesor_asignado_id = auth.uid()
    )
  )
);

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=================================================================';
    RAISE NOTICE '=== PERMANENT SALES ACCESS FIX - ALL POLICIES UPDATED ===';
    RAISE NOTICE '=================================================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Fixed RLS policies for sales role access:';
    RAISE NOTICE '  ✓ profiles_select - Sales can view assigned leads';
    RAISE NOTICE '  ✓ financing_applications_select - Sales can view assigned leads apps';
    RAISE NOTICE '  ✓ uploaded_documents_select - Sales can view assigned leads documents';
    RAISE NOTICE '  ✓ uploaded_documents_update - Sales can update assigned leads documents';
    RAISE NOTICE '  ✓ uploaded_documents_delete - Sales can delete assigned leads documents';
    RAISE NOTICE '  ✓ lead_tags_select - Sales can view all tags';
    RAISE NOTICE '  ✓ lead_tag_associations (all ops) - Sales can manage tags on assigned leads';
    RAISE NOTICE '  ✓ lead_reminders (all ops) - Sales can manage reminders for assigned leads';
    RAISE NOTICE '';
    RAISE NOTICE 'Access control: Sales can only access leads where asesor_asignado_id = auth.uid()';
    RAISE NOTICE '';
    RAISE NOTICE 'Routes now working:';
    RAISE NOTICE '  • /ventas/cliente/:id - Sales lead profile page';
    RAISE NOTICE '  • /admin/cliente/:id - Sales lead application page';
    RAISE NOTICE '';
    RAISE NOTICE '=================================================================';
    RAISE NOTICE '';
END $$;

COMMENT ON POLICY "profiles_select" ON profiles IS
'[PERMANENT] Admin/comprador see all. Sales see only assigned leads (asesor_asignado_id check).';

COMMENT ON POLICY "financing_apps_select" ON financing_applications IS
'[PERMANENT] Admin/comprador see all. Sales see apps only for assigned leads.';

COMMENT ON POLICY "uploaded_documents_select" ON uploaded_documents IS
'[PERMANENT] Admin/comprador see all. Sales see documents only for assigned leads.';
