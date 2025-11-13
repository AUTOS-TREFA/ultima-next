-- ============================================================================
-- PERMANENT FIX: Sales Role Complete Access to CRM Data
-- ============================================================================
-- This migration ensures sales users have proper access to view and manage
-- all user profiles (leads) and their related data (applications, documents, etc.)
--
-- Key principle: Sales role needs to see ALL leads, not just assigned ones,
-- to properly manage the CRM system.
-- ============================================================================

-- ============================================================================
-- 1. PROFILES TABLE - Sales can see ALL user profiles (leads)
-- ============================================================================

DROP POLICY IF EXISTS "profiles_select" ON public.profiles;

CREATE POLICY "profiles_select" ON public.profiles
FOR SELECT TO authenticated
USING (
  -- Users can see their own profile
  id = auth.uid()
  OR
  -- Admin can see all profiles
  public.get_my_role() = 'admin'
  OR
  -- Sales can see all USER profiles (all leads in CRM)
  (
    public.get_my_role() = 'sales'
    AND role = 'user'  -- Sales only sees actual leads, not other sales/admin users
  )
);

COMMENT ON POLICY "profiles_select" ON public.profiles IS
'[PERMANENT] Users see own profile. Admin sees all profiles. Sales sees all user profiles (leads).';

-- Allow sales to update contactado field and notes on user profiles
DROP POLICY IF EXISTS "profiles_update" ON public.profiles;

CREATE POLICY "profiles_update" ON public.profiles
FOR UPDATE TO authenticated
USING (
  id = auth.uid()
  OR
  public.get_my_role() = 'admin'
  OR
  (
    public.get_my_role() = 'sales'
    AND role = 'user'  -- Sales can only update actual user profiles (leads)
  )
)
WITH CHECK (
  id = auth.uid()
  OR
  public.get_my_role() = 'admin'
  OR
  (
    public.get_my_role() = 'sales'
    AND role = 'user'
  )
);

COMMENT ON POLICY "profiles_update" ON public.profiles IS
'[PERMANENT] Users update own profile. Admin updates all. Sales updates user profiles (leads).';

-- ============================================================================
-- 2. FINANCING_APPLICATIONS - Sales can see ALL applications from user leads
-- ============================================================================

DROP POLICY IF EXISTS "financing_apps_select" ON public.financing_applications;

CREATE POLICY "financing_apps_select"
ON public.financing_applications
FOR SELECT TO authenticated
USING (
  -- Users can see their own applications
  user_id = auth.uid()
  OR
  -- Admin can see all applications
  public.get_my_role() = 'admin'
  OR
  -- Sales can see ALL applications from user leads
  (
    public.get_my_role() = 'sales'
    AND EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = financing_applications.user_id
        AND p.role = 'user'  -- Application must belong to a user (lead)
    )
  )
);

COMMENT ON POLICY "financing_apps_select" ON public.financing_applications IS
'[PERMANENT] Users see own applications. Admin sees all. Sales sees all applications from user leads.';

DROP POLICY IF EXISTS "financing_apps_update" ON public.financing_applications;

CREATE POLICY "financing_apps_update"
ON public.financing_applications
FOR UPDATE TO authenticated
USING (
  user_id = auth.uid()
  OR
  public.get_my_role() = 'admin'
  OR
  (
    public.get_my_role() = 'sales'
    AND EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = financing_applications.user_id
        AND p.role = 'user'
    )
  )
)
WITH CHECK (
  user_id = auth.uid()
  OR
  public.get_my_role() = 'admin'
  OR
  (
    public.get_my_role() = 'sales'
    AND EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = financing_applications.user_id
        AND p.role = 'user'
    )
  )
);

COMMENT ON POLICY "financing_apps_update" ON public.financing_applications IS
'[PERMANENT] Users update own applications. Admin updates all. Sales updates applications from user leads.';

-- ============================================================================
-- 3. UPLOADED_DOCUMENTS - Sales can see ALL documents from user leads
-- ============================================================================

DROP POLICY IF EXISTS "uploaded_documents_select" ON public.uploaded_documents;

CREATE POLICY "uploaded_documents_select" ON public.uploaded_documents
FOR SELECT TO authenticated
USING (
  -- Users can see their own documents
  user_id = auth.uid()
  OR
  -- Admin can see all documents
  public.get_my_role() = 'admin'
  OR
  -- Sales can see ALL documents from user leads
  (
    public.get_my_role() = 'sales'
    AND EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = uploaded_documents.user_id
        AND p.role = 'user'
    )
  )
);

COMMENT ON POLICY "uploaded_documents_select" ON public.uploaded_documents IS
'[PERMANENT] Users see own documents. Admin sees all. Sales sees all documents from user leads.';

DROP POLICY IF EXISTS "uploaded_documents_update" ON public.uploaded_documents;

CREATE POLICY "uploaded_documents_update" ON public.uploaded_documents
FOR UPDATE TO authenticated
USING (
  user_id = auth.uid()
  OR
  public.get_my_role() = 'admin'
  OR
  (
    public.get_my_role() = 'sales'
    AND EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = uploaded_documents.user_id
        AND p.role = 'user'
    )
  )
)
WITH CHECK (
  user_id = auth.uid()
  OR
  public.get_my_role() = 'admin'
  OR
  (
    public.get_my_role() = 'sales'
    AND EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = uploaded_documents.user_id
        AND p.role = 'user'
    )
  )
);

COMMENT ON POLICY "uploaded_documents_update" ON public.uploaded_documents IS
'[PERMANENT] Users update own documents. Admin updates all. Sales updates documents from user leads.';

-- ============================================================================
-- 4. LEAD_TAG_ASSOCIATIONS - Sales can see/manage tags for ALL user leads
-- ============================================================================

DROP POLICY IF EXISTS "lead_tag_associations_select" ON public.lead_tag_associations;

CREATE POLICY "lead_tag_associations_select" ON public.lead_tag_associations
FOR SELECT TO authenticated
USING (
  public.get_my_role() IN ('admin', 'sales')
);

COMMENT ON POLICY "lead_tag_associations_select" ON public.lead_tag_associations IS
'[PERMANENT] Admin and Sales can view all tag associations.';

DROP POLICY IF EXISTS "lead_tag_associations_insert" ON public.lead_tag_associations;

CREATE POLICY "lead_tag_associations_insert" ON public.lead_tag_associations
FOR INSERT TO authenticated
WITH CHECK (
  public.get_my_role() IN ('admin', 'sales')
);

COMMENT ON POLICY "lead_tag_associations_insert" ON public.lead_tag_associations IS
'[PERMANENT] Admin and Sales can create tag associations.';

DROP POLICY IF EXISTS "lead_tag_associations_update" ON public.lead_tag_associations;

CREATE POLICY "lead_tag_associations_update" ON public.lead_tag_associations
FOR UPDATE TO authenticated
USING (public.get_my_role() IN ('admin', 'sales'))
WITH CHECK (public.get_my_role() IN ('admin', 'sales'));

COMMENT ON POLICY "lead_tag_associations_update" ON public.lead_tag_associations IS
'[PERMANENT] Admin and Sales can update tag associations.';

DROP POLICY IF EXISTS "lead_tag_associations_delete" ON public.lead_tag_associations;

CREATE POLICY "lead_tag_associations_delete" ON public.lead_tag_associations
FOR DELETE TO authenticated
USING (public.get_my_role() IN ('admin', 'sales'));

COMMENT ON POLICY "lead_tag_associations_delete" ON public.lead_tag_associations IS
'[PERMANENT] Admin and Sales can delete tag associations.';

-- ============================================================================
-- 5. LEAD_REMINDERS - Sales can see/manage reminders for ALL user leads
-- ============================================================================

DROP POLICY IF EXISTS "lead_reminders_select" ON public.lead_reminders;

CREATE POLICY "lead_reminders_select" ON public.lead_reminders
FOR SELECT TO authenticated
USING (
  public.get_my_role() IN ('admin', 'sales')
);

COMMENT ON POLICY "lead_reminders_select" ON public.lead_reminders IS
'[PERMANENT] Admin and Sales can view all reminders.';

DROP POLICY IF EXISTS "lead_reminders_insert" ON public.lead_reminders;

CREATE POLICY "lead_reminders_insert" ON public.lead_reminders
FOR INSERT TO authenticated
WITH CHECK (
  public.get_my_role() IN ('admin', 'sales')
);

COMMENT ON POLICY "lead_reminders_insert" ON public.lead_reminders IS
'[PERMANENT] Admin and Sales can create reminders.';

DROP POLICY IF EXISTS "lead_reminders_update" ON public.lead_reminders;

CREATE POLICY "lead_reminders_update" ON public.lead_reminders
FOR UPDATE TO authenticated
USING (public.get_my_role() IN ('admin', 'sales'))
WITH CHECK (public.get_my_role() IN ('admin', 'sales'));

COMMENT ON POLICY "lead_reminders_update" ON public.lead_reminders IS
'[PERMANENT] Admin and Sales can update reminders.';

DROP POLICY IF EXISTS "lead_reminders_delete" ON public.lead_reminders;

CREATE POLICY "lead_reminders_delete" ON public.lead_reminders
FOR DELETE TO authenticated
USING (public.get_my_role() IN ('admin', 'sales'));

COMMENT ON POLICY "lead_reminders_delete" ON public.lead_reminders IS
'[PERMANENT] Admin and Sales can delete reminders.';

-- ============================================================================
-- 6. VERIFY AND LOG RESULTS
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== PERMANENT SALES ACCESS FIX APPLIED ===';
    RAISE NOTICE '';
    RAISE NOTICE 'Sales Role Permissions:';
    RAISE NOTICE '  ✓ View all USER profiles (leads) in CRM';
    RAISE NOTICE '  ✓ Update contactado field and notes on leads';
    RAISE NOTICE '  ✓ View all financing applications from user leads';
    RAISE NOTICE '  ✓ Update applications from user leads';
    RAISE NOTICE '  ✓ View all documents from user leads';
    RAISE NOTICE '  ✓ Update documents from user leads';
    RAISE NOTICE '  ✓ Full access to lead tags and associations';
    RAISE NOTICE '  ✓ Full access to lead reminders';
    RAISE NOTICE '';
    RAISE NOTICE 'All policies marked with [PERMANENT] to indicate';
    RAISE NOTICE 'this is the correct, stable configuration.';
    RAISE NOTICE '';
    RAISE NOTICE 'Sales can now access /ventas/crm and see all leads!';
    RAISE NOTICE '';
END $$;
