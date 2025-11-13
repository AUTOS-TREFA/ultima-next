# How to Find Your Supabase Database Host

## Source Database (jjepfehmuybpctdzipnu)

### Step 1: Go to Project Settings
1. Visit: https://supabase.com/dashboard/project/jjepfehmuybpctdzipnu/settings/database
2. If this URL doesn't work, the project may not exist or you don't have access

### Step 2: Find Connection Info

Look for one of these sections:

#### Option A: Connection String (Most Common)
Under "Connection String" you'll see something like:
```
postgresql://postgres:[YOUR-PASSWORD]@db.jjepfehmuybpctdzipnu.supabase.co:5432/postgres
```

The host is: `db.jjepfehmuybpctdzipnu.supabase.co`

#### Option B: Connection Pooling
There might be a different host for connection pooling:
```
Host: db.jjepfehmuybpctdzipnu.pooler.supabase.com
```

#### Option C: Direct Connection
```
Host: db.jjepfehmuybpctdzipnu.supabase.co
Port: 5432
Database: postgres
User: postgres
```

### Step 3: Possible Hostname Formats

Supabase uses these formats:
- **New projects**: `db.PROJECT_ID.supabase.co`
- **With pooler**: `db.PROJECT_ID.pooler.supabase.com`
- **AWS region specific**: `db.PROJECT_ID.region.supabase.co`
- **Legacy**: `db.PROJECT_ID.supabase.io` (older projects)

---

## Common Issues

### Issue 1: Project Doesn't Exist
**Symptoms**: URL returns 404, hostname doesn't resolve
**Solutions**:
- Verify project ID is correct
- Check if you have access to this organization
- Confirm project wasn't deleted

### Issue 2: Project is Paused
**Symptoms**: Can access dashboard but can't connect to database
**Solutions**:
- Click "Restore" on project dashboard
- Wait 1-2 minutes for database to wake up
- Try connection again

### Issue 3: Wrong Project ID
**Symptoms**: Hostname doesn't resolve
**Solutions**:
- Double-check the project ID from URL
- Look in your Supabase dashboard for correct project
- Confirm this is the SOURCE project you want to migrate FROM

---

## What to Do Next

Once you find the correct hostname:

1. **Test the connection** with the test script:
   ```bash
   ./scripts/test-db-connection.sh
   ```

2. **Update the migration script** with correct hostname:
   ```bash
   # Edit scripts/migrate-database.sh
   # Line ~10-15, update:
   SOURCE_PROJECT_REF="correct-project-id"
   SOURCE_DB_HOST="db.correct-project-id.supabase.co"
   ```

3. **Run migration again**:
   ```bash
   ./scripts/migrate-database.sh
   ```

---

## Need Help?

If you can't find the source project:

1. **List all your Supabase projects**:
   - Go to: https://supabase.com/dashboard
   - Look for the source project in your list

2. **Verify the project ID**:
   - Click on the project
   - Check the URL: `dashboard/project/PROJECT_ID`
   - This is your actual project ID

3. **Alternative: Use Supabase CLI**:
   ```bash
   supabase projects list
   ```

---

## Current Status

**❌ Cannot connect to**: `db.jjepfehmuybpctdzipnu.supabase.co`
**Error**: `could not translate host name to address`

This means the hostname doesn't exist or is incorrect.

**✅ Can connect to**: `db.wmtlzfodmrchgqdbxjln.supabase.co` (target - already configured)

---

## Quick Fix

If you find the correct source database hostname is different, you can either:

### Option A: Edit the script directly
```bash
nano scripts/migrate-database.sh
# Update line 10: SOURCE_PROJECT_REF="actual-project-id"
# Update line 11: SOURCE_DB_HOST="db.actual-project-id.supabase.co"
```

### Option B: Tell me the correct hostname
Provide me with:
- Correct project ID
- Correct database host
- I'll update the script for you
