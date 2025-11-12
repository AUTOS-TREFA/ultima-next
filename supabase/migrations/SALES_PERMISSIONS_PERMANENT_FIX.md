# Sales Role Permissions - Permanent Fix

## Problem
Sales users were experiencing permission issues when accessing CRM and leads data after certain migrations were run. This was a recurring issue that required manual fixes after each migration.

## Root Cause
The RLS (Row Level Security) policies for sales users were inconsistent across tables:
- Some policies allowed sales to see ALL user profiles
- Other policies only allowed sales to see ASSIGNED leads
- This mismatch caused permission errors in the CRM interface

## Permanent Solution (CORRECTED)
Migration `20251112000003_correct_sales_permissions_assigned_only.sql` implements the correct, permanent configuration:

**IMPORTANT:** Migration 20251112000002 was INCORRECT and has been superseded by 20251112000003.

### Sales Role Permissions (CORRECT)
Sales users can now:
- ✓ View **ONLY ASSIGNED** user profiles (leads) in CRM where `asesor_asignado_id = auth.uid()`
- ✓ Update `contactado` field and notes on **ASSIGNED** leads only
- ✓ View financing applications from **ASSIGNED** leads only
- ✓ Update applications from **ASSIGNED** leads only
- ✓ View documents from **ASSIGNED** leads only
- ✓ Update documents from **ASSIGNED** leads only
- ✓ Manage lead tags for **ASSIGNED** leads only
- ✓ Manage lead reminders for **ASSIGNED** leads only

### Admin Role Permissions
Admin users can:
- ✓ View **ALL** user profiles (leads) in CRM
- ✓ Full access to all financing applications
- ✓ Full access to all documents
- ✓ Full access to all lead tags and associations
- ✓ Full access to all lead reminders

### Key Principles
1. **Sales sees ONLY ASSIGNED leads**: Sales users can only access leads where `asesor_asignado_id = auth.uid()`
2. **Admin sees ALL leads**: Admin users have unrestricted access to all data
3. **Consistency**: All tables use the same access pattern
4. **No Recursion**: Uses `public.get_my_role()` SECURITY DEFINER function
5. **Role Filtering**: Sales only sees user role='user', not other sales/admin users

### Technical Implementation
All policies use this pattern:

```sql
CREATE POLICY "table_select" ON public.table_name
FOR SELECT TO authenticated
USING (
  -- Users see own data
  user_id = auth.uid()
  OR
  -- Admin sees all
  public.get_my_role() = 'admin'
  OR
  -- Sales sees ONLY ASSIGNED leads (asesor_asignado_id must match)
  (
    public.get_my_role() = 'sales'
    AND EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = table_name.user_id
        AND p.role = 'user'
        AND p.asesor_asignado_id = auth.uid()  -- ONLY ASSIGNED!
    )
  )
);
```

### Tables Covered
1. `profiles` - User profiles (leads)
2. `financing_applications` - Loan applications
3. `uploaded_documents` - Document uploads
4. `lead_tag_associations` - Lead tagging
5. `lead_reminders` - Follow-up reminders

## Migration Protection
All policies are marked with `[PERMANENT]` in their comments to indicate this is the correct, stable configuration that should NOT be overwritten by future migrations.

## Future Migrations
When creating new migrations that touch these tables:
1. Read this document first
2. Do NOT change the sales access pattern
3. Use the same pattern for any new CRM-related tables
4. Always test with a sales role user before deploying

## Verification
After applying this migration, verify sales access with:
1. Log in as a sales user
2. Navigate to `/escritorio/ventas/crm`
3. Verify ONLY ASSIGNED leads are visible (where `asesor_asignado_id` matches your user ID)
4. Verify you can update `contactado` field on assigned leads
5. Verify you can view financing applications from assigned leads
6. Verify no infinite recursion errors occur
7. Log in as an admin user and verify you can see ALL leads

## Related Functions
- `public.get_my_role()` - Returns current user's role using SECURITY DEFINER to bypass RLS
- Migration: `20251111000006_fix_recursion_drop_function_first.sql`

## Contact
If sales permissions break again, check:
1. Was a new migration applied that drops/recreates these policies?
2. Is `get_my_role()` function still working correctly?
3. Do the policies match the patterns in this document?
4. Are policies checking for `asesor_asignado_id = auth.uid()` for sales role?

Apply `20251112000003_correct_sales_permissions_assigned_only.sql` again to restore correct permissions.

## Migration History
- `20251112000002_permanent_sales_access_fix.sql` - **INCORRECT** - Gave sales access to ALL leads (superseded)
- `20251112000003_correct_sales_permissions_assigned_only.sql` - **CORRECT** - Sales see ONLY assigned leads
