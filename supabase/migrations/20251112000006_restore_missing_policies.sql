-- Restore missing policies that were dropped by CASCADE but not recreated

-- profiles_update policy
DROP POLICY IF EXISTS "profiles_update" ON profiles;
CREATE POLICY "profiles_update"
ON profiles
FOR UPDATE
TO authenticated
USING (
  id = auth.uid()
  OR public.get_my_role() IN ('admin', 'comprador')
);

-- financing_apps_update policy
DROP POLICY IF EXISTS "financing_apps_update" ON financing_applications;
CREATE POLICY "financing_apps_update"
ON financing_applications
FOR UPDATE
TO authenticated
USING (
  user_id = auth.uid()
  OR public.get_my_role() IN ('admin', 'comprador')
);

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== MISSING POLICIES RESTORED ===';
    RAISE NOTICE '';
    RAISE NOTICE 'Restored policies:';
    RAISE NOTICE '  - profiles_update';
    RAISE NOTICE '  - financing_apps_update';
    RAISE NOTICE '';
END $$;
