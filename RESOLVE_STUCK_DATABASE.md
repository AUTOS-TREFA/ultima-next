# Resolving Stuck RESTORING Database

## Problem
Target database `wmtlzfodmrchgqdbxjln` has been stuck in RESTORING state for 5+ hours.

**Error**: `connection not available and request was dropped from queue after 10000ms`

This indicates the database is hung and needs manual intervention.

---

## Solution Steps (In Order)

### Step 1: Try Pausing/Resuming the Database

1. **Go to Project Settings**:
   https://supabase.com/dashboard/project/wmtlzfodmrchgqdbxjln/settings/general

2. **Look for Database Controls**:
   - Scroll down to find "Pause project" or "Restart database"
   - If you see "Pause project", click it
   - Wait 1-2 minutes for pause to complete
   - Then click "Resume project"

3. **Check Status**:
   - After resuming, check if project shows "ACTIVE HEALTHY"
   - Try connecting again with the import script

**Success criteria**: Project status changes from RESTORING to ACTIVE HEALTHY

---

### Step 2: Check for Ongoing Operations

1. **Go to Database Backups**:
   https://supabase.com/dashboard/project/wmtlzfodmrchgqdbxjln/database/backups

2. **Look for any in-progress operations**:
   - Restoring backups
   - Creating backups
   - Any pending operations

3. **If you see any**:
   - There may be a "Cancel" button
   - Click it to abort the stuck operation

---

### Step 3: Contact Supabase Support (If above doesn't work)

If Steps 1 & 2 don't resolve it, you'll need Supabase support:

1. **Open Support Ticket**:
   https://supabase.com/dashboard/support/new

2. **Provide these details**:
   ```
   Subject: Database stuck in RESTORING state for 5+ hours

   Project ref: wmtlzfodmrchgqdbxjln
   Region: us-east-2

   Issue: Database has been stuck in RESTORING state for 5+ hours.
   Connection attempts fail with connection pool timeout errors.

   Error: "connection not available and request was dropped from
   queue after 10000ms"

   Request: Please restart or force-reset the database to clear
   the stuck restoration state.

   Urgency: High - blocking database migration
   ```

3. **Expected Response Time**:
   - Free plan: 24-48 hours
   - Pro plan: 12-24 hours
   - Team/Enterprise: 1-4 hours

---

### Step 4: Alternative - Use SQL Editor (Workaround)

While waiting for the database to recover, you can try importing via SQL Editor:

1. **Go to SQL Editor**:
   https://supabase.com/dashboard/project/wmtlzfodmrchgqdbxjln/editor

2. **Check if SQL Editor works**:
   ```sql
   SELECT current_database();
   ```

3. **If it works**, you can import in chunks:
   - Open `database-backups/source_dump_.sql` in a text editor
   - Split it into smaller sections (schema first, then data)
   - Copy/paste each section into SQL Editor
   - Run each section one at a time

**Warning**: This is tedious and error-prone, but may work if SQL Editor responds while direct connections don't.

---

## Diagnostic Commands

Check if database is actually responding:

```bash
# Test basic connection
supabase projects list | grep wmtlzfodmrchgqdbxjln

# Try linking (will fail if database is stuck)
supabase link --project-ref wmtlzfodmrchgqdbxjln
```

---

## Expected Timeline

- **Option 1 (Pause/Resume)**: 5-10 minutes
- **Option 2 (Cancel operation)**: 2-5 minutes
- **Option 3 (Support)**: 1-48 hours depending on plan
- **Option 4 (SQL Editor)**: 30-60 minutes manual work

---

## Why This Happened

Possible causes:
1. A previous backup/restore operation got stuck
2. Database connection pool exhausted during a long operation
3. Database process crashed during restoration
4. Network interruption during a backup operation

These are Supabase platform issues, not issues with your migration approach.

---

## After Database is Healthy

Once the database shows "ACTIVE HEALTHY" status:

1. **Run the import**:
   ```bash
   ./scripts/migrate-via-cli.sh
   ```

2. **Or manually import**:
   ```bash
   supabase link --project-ref wmtlzfodmrchgqdbxjln
   supabase db push --db-url "postgresql://postgres:[PASSWORD]@aws-1-us-east-2.pooler.supabase.com:6543/postgres"
   ```

3. **Verify**:
   ```sql
   -- Should return 47
   SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';
   ```

---

## Prevention for Next Time

To avoid this in the future:
1. Always check project health before starting migrations
2. Don't trigger multiple backup/restore operations simultaneously
3. Use smaller batch imports if importing large datasets
4. Monitor the dashboard during long-running operations

---

## Need More Help?

The source database dump is ready at:
- `database-backups/source_dump_.sql` (269KB)
- Contains all 47 tables from source project

Once the target database is healthy, the import should take less than 5 minutes.
