# Data Import Guide

## Current Status

✅ **Completed:**
- Schema migrated (43 tables)
- Edge Functions deployed (23 functions)
- Configuration updated
- Data exported (32MB, 68 COPY statements)

⚠️ **Remaining:**
- Data import to new project

---

## Option 1: Import via Supabase SQL Editor (RECOMMENDED)

This is the simplest method as it doesn't require connection credentials.

### Steps:

1. **Open SQL Editor**:
   - Go to: https://supabase.com/dashboard/project/pemgwyymodlwabaexxrb/editor

2. **Load the SQL file**:
   - Click "New Query"
   - Open `database-backups/source_data_only.sql` in a text editor
   - Copy ALL contents (32MB)
   - Paste into SQL Editor

3. **Execute the import**:
   - Click "Run" or press Cmd+Enter
   - Wait for completion (may take 5-10 minutes)

4. **Verify import**:
   ```sql
   SELECT schemaname, tablename, n_live_tup as row_count
   FROM pg_stat_user_tables
   WHERE schemaname = 'public'
   ORDER BY n_live_tup DESC;
   ```

---

## Option 2: Import via Command Line (Requires DB Password)

### Step 1: Get Database Password

1. Go to Supabase Dashboard:
   - https://supabase.com/dashboard/project/pemgwyymodlwabaexxrb/settings/database

2. Find "Database Password" section

3. Either:
   - **Use existing password** (if you have it)
   - **Reset password** (if you don't)
     - Click "Reset database password"
     - Copy the new password immediately
     - Save it securely

### Step 2: Run Import Script

Once you have the password, run:

```bash
./scripts/import-data-simple.sh
```

Enter the password when prompted.

---

## Option 3: Import Using Supabase CLI Reset

This method recreates the database from migrations + seed data:

### Steps:

1. **Link to new project**:
   ```bash
   supabase link --project-ref pemgwyymodlwabaexxrb
   ```

2. **Create seed file**:
   ```bash
   cp database-backups/source_data_only.sql supabase/seed.sql
   ```

3. **Reset database with seed**:
   ```bash
   supabase db reset --linked
   ```

**Warning**: This will drop all existing data and recreate from migrations + seed.

---

## Troubleshooting

### Password Authentication Failed

**Symptom**: `FATAL: password authentication failed for user "postgres"`

**Solutions**:
1. Reset password in Supabase Dashboard
2. Use SQL Editor instead (no password needed)
3. Check if you copied password correctly (no extra spaces)

### Connection Timeout

**Symptom**: `timeout: context deadline exceeded`

**Solutions**:
1. Check your internet connection
2. Disable VPN if using one
3. Try SQL Editor instead

### File Too Large for SQL Editor

**Symptom**: Browser becomes unresponsive when pasting

**Solutions**:
1. Split the file into smaller chunks
2. Use command-line import instead
3. Import table by table

---

## Verification After Import

### Check Table Counts

```sql
-- Count rows in all tables
SELECT
    schemaname,
    tablename,
    n_live_tup as row_count,
    n_dead_tup as dead_rows
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY n_live_tup DESC;
```

### Check Specific Tables

```sql
-- Check vehicles table
SELECT COUNT(*) FROM vehicles;

-- Check users table
SELECT COUNT(*) FROM auth.users;

-- Check profiles table
SELECT COUNT(*) FROM profiles;
```

### Compare with Source

Run the same queries on the source project to verify counts match:
- Source: https://supabase.com/dashboard/project/jjepfehmuybpctdzipnu/editor

---

## After Successful Import

1. **Test locally**:
   ```bash
   rm -rf .next
   npm run dev
   ```

2. **Verify in browser**:
   - Open http://localhost:3000
   - Check homepage loads
   - Check vehicle inventory displays
   - Check images load correctly
   - Test authentication

3. **Commit data import confirmation**:
   ```bash
   git add DATA_IMPORT_GUIDE.md
   git commit -m "docs: Add data import guide

   Provides three methods for importing data to new Supabase project:
   1. SQL Editor (recommended - no credentials needed)
   2. Command line with password
   3. Database reset with seed file

   🤖 Generated with [Claude Code](https://claude.com/claude-code)

   Co-Authored-By: Claude <noreply@anthropic.com>"
   git push
   ```

4. **Deploy to production**:
   ```bash
   ./deploy.sh production
   ```

---

## Need Help?

- Supabase Dashboard: https://supabase.com/dashboard/project/pemgwyymodlwabaexxrb
- SQL Editor: https://supabase.com/dashboard/project/pemgwyymodlwabaexxrb/editor
- Database Settings: https://supabase.com/dashboard/project/pemgwyymodlwabaexxrb/settings/database

---

**Last Updated**: November 12, 2025
**Project**: pemgwyymodlwabaexxrb
**Data File**: database-backups/source_data_only.sql (32MB, 68 COPY statements)
