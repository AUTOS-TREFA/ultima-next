# Fresh Supabase Project Migration Guide

## Overview
Since the current target database (wmtlzfodmrchgqdbxjln) is experiencing issues, we'll:
1. Create a brand new Supabase project
2. Import the source database dump to the fresh project
3. Update your Next.js app to use the new project

---

## Step 1: Create New Supabase Project

1. **Go to Supabase Dashboard**:
   https://supabase.com/dashboard/projects

2. **Click "New Project"**:
   - Organization: Choose your organization
   - Name: `TREFA Next.js` (or your preferred name)
   - Database Password: Generate a strong password and **SAVE IT**
   - Region: **us-east-2** (Ohio) - same as your current project
   - Pricing Plan: Choose your plan

3. **Wait for Project Creation**:
   - This takes 2-3 minutes
   - Wait until status shows "ACTIVE HEALTHY"

4. **Note Your New Project Details**:
   - Project Ref: `[NEW_PROJECT_REF]` (looks like: abcdefghijklmnop)
   - Database Password: `[YOUR_PASSWORD]`
   - API URL: `https://[NEW_PROJECT_REF].supabase.co`

---

## Step 2: Import Data to New Project

### Option A: Using the Import Script (Recommended)

Run the import script with your new project ref:

```bash
./scripts/import-to-new-project.sh
```

Follow the prompts:
- Enter your new project ref
- Enter your database password
- Confirm the import

### Option B: Manual Import via psql

```bash
# Replace [NEW_REF] and [PASSWORD] with your actual values
PGPASSWORD='[PASSWORD]' psql \
  "postgresql://postgres:[PASSWORD]@db.[NEW_REF].supabase.co:5432/postgres?sslmode=require" \
  -f database-backups/source_dump_.sql
```

### Option C: SQL Editor (If psql fails)

1. Go to SQL Editor:
   https://supabase.com/dashboard/project/[NEW_REF]/editor

2. Run the chunk script:
   ```bash
   ./scripts/test-sql-editor-method.sh
   ```

3. Import chunks one by one (detailed instructions in script output)

---

## Step 3: Update Next.js Configuration

Once import succeeds, update your app configuration:

### 3.1 Update .env.local

```bash
# Run this script to update all environment variables
./scripts/update-env-with-new-project.sh
```

Or manually update `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://[NEW_PROJECT_REF].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[NEW_ANON_KEY]
SUPABASE_SERVICE_ROLE_KEY=[NEW_SERVICE_ROLE_KEY]
SUPABASE_DB_PASSWORD=[NEW_DB_PASSWORD]
```

Find your API keys at:
https://supabase.com/dashboard/project/[NEW_REF]/settings/api

### 3.2 Update .env (if exists)

Copy the same values to `.env` if you have that file.

### 3.3 Update Any Hardcoded References

Check these files for hardcoded project references:
- `src/lib/supabase/*.ts`
- Any config files

The update script will search and report these.

---

## Step 4: Verify Migration

### 4.1 Check Table Count

Go to SQL Editor and run:
```sql
SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';
-- Should return: 47
```

### 4.2 Check Sample Data

```sql
SELECT COUNT(*) FROM profiles;
SELECT COUNT(*) FROM financing_applications;
-- Should have data
```

### 4.3 Test Application

```bash
npm run dev
```

Test these features:
- Login/authentication
- Data loading
- Any database-dependent features

---

## Step 5: Update Deployment Configuration

### 5.1 Update Cloud Run Environment Variables

```bash
# Update Cloud Run service with new environment variables
gcloud run services update next-js-trefa \
  --region us-central1 \
  --update-env-vars \
NEXT_PUBLIC_SUPABASE_URL=https://[NEW_PROJECT_REF].supabase.co,\
NEXT_PUBLIC_SUPABASE_ANON_KEY=[NEW_ANON_KEY],\
SUPABASE_SERVICE_ROLE_KEY=[NEW_SERVICE_ROLE_KEY]
```

### 5.2 Update deploy.sh (if needed)

The `scripts/update-env-with-new-project.sh` script will handle this.

---

## Step 6: Decommission Old Project (Optional)

**ONLY after verifying everything works:**

1. Go to old project settings:
   https://supabase.com/dashboard/project/wmtlzfodmrchgqdbxjln/settings/general

2. Scroll to "Danger Zone"

3. Click "Pause project" (to save costs but keep data)
   - Or "Delete project" if you're certain you don't need it

**Warning**: Don't delete until you've verified the new project works perfectly for at least 24-48 hours.

---

## Troubleshooting

### Issue: Import Fails with Connection Error

**Solution**: The new project might still be initializing. Wait 2-3 minutes and try again.

### Issue: Authentication Fails After Migration

**Solution**: Make sure you updated BOTH:
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

These are different between projects!

### Issue: RLS Policies Not Working

**Solution**: The dump should include RLS policies. Verify with:
```sql
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE schemaname = 'public';
```

If empty, you'll need to recreate RLS policies from the old project.

---

## Benefits of Fresh Project

✅ Clean, healthy database state
✅ No stuck restoration processes
✅ Latest Supabase infrastructure
✅ Clean connection pools
✅ No legacy issues

---

## Timeline

- Create project: 3-5 minutes
- Import data: 2-5 minutes
- Update configuration: 5-10 minutes
- Verify and test: 10-15 minutes

**Total**: ~25-35 minutes

---

## Files You'll Need

All prepared for you:
- `database-backups/source_dump_.sql` (269KB, 47 tables)
- `scripts/import-to-new-project.sh` (import automation)
- `scripts/update-env-with-new-project.sh` (config updates)
- `scripts/test-sql-editor-method.sh` (fallback method)

---

## Support

If you encounter issues:
1. Check the import log file: `database-backups/import_log_*.log`
2. Verify project is "ACTIVE HEALTHY" in dashboard
3. Confirm database password is correct
4. Try the SQL Editor method as fallback

The source data is safe in `source_dump_.sql` - you can retry as many times as needed!
