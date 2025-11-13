# Manual Database Migration Guide
## When Direct Connections Don't Work

Since direct `psql` connections are blocked on your network, follow this manual method instead.

---

## ✅ Step-by-Step Migration Process

### Step 1: Export from Source Database (jjepfehmuybpctdzipnu)

1. **Go to Database Backups Page**:
   https://supabase.com/dashboard/project/jjepfehmuybpctdzipnu/database/backups

2. **Create a New Backup**:
   - Click "Create backup" or "Manual backup"
   - Wait for it to complete (usually 1-5 minutes)

3. **Download the Backup**:
   - Once complete, click "Download"
   - Save the file to: `database-backups/source_backup.sql`

**Note**: If your plan doesn't have backups, use the alternative SQL export method below.

---

### Alternative: SQL Export Method

If you can't create backups, export via SQL Editor:

1. **Go to SQL Editor**:
   https://supabase.com/dashboard/project/jjepfehmuybpctdzipnu/editor

2. **Run this query to get all table names**:
   ```sql
   SELECT table_name
   FROM information_schema.tables
   WHERE table_schema = 'public'
   ORDER BY table_name;
   ```

3. **For EACH table**, run this to export data:
   ```sql
   COPY (SELECT * FROM table_name) TO STDOUT WITH (FORMAT CSV, HEADER);
   ```
   Save each result to a CSV file.

**Note**: This method is tedious for 47 tables. The backup method is much better.

---

### Step 2: Backup Target Database (wmtlzfodmrchgqdbxjln)

**IMPORTANT**: Create a backup BEFORE importing!

1. **Go to Target Database Backups**:
   https://supabase.com/dashboard/project/wmtlzfodmrchgqdbxjln/database/backups

2. **Create Backup**:
   - Click "Create backup"
   - Wait for completion
   - Keep this in case you need to rollback

---

### Step 3: Import to Target Database

#### Method A: Via Supabase Dashboard (Recommended if available)

1. **Go to Target Database Backups**:
   https://supabase.com/dashboard/project/wmtlzfodmrchgqdbxjln/database/backups

2. **Look for "Restore" or "Upload" option**:
   - Some plans allow restoring from uploaded SQL files
   - Upload your `source_backup.sql`
   - Follow the restore process

#### Method B: Via SQL Editor (If Method A not available)

1. **Go to SQL Editor**:
   https://supabase.com/dashboard/project/wmtlzfodmrchgqdbxjln/editor

2. **Execute the SQL file**:
   - Open your downloaded backup file
   - Copy the SQL content
   - Paste into SQL Editor
   - Click "Run"

**Warning**: Large files may timeout. If so, split into smaller chunks.

#### Method C: Via Connection String (If psql works with connection pooler)

Try using the connection pooler instead:

```bash
PGPASSWORD="your_target_password" psql \
  "postgresql://postgres.wmtlzfodmrchgqdbxjln:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require" \
  -f database-backups/source_backup.sql
```

---

### Step 4: Verify Migration

1. **Check Table Count in Target**:
   ```sql
   SELECT COUNT(*)
   FROM information_schema.tables
   WHERE table_schema = 'public';
   ```
   Should return: **47** (same as source)

2. **Check Sample Data**:
   ```sql
   SELECT COUNT(*) FROM profiles;
   SELECT COUNT(*) FROM financing_applications;
   -- Check a few more tables
   ```

3. **Test Application**:
   - Run: `npm run dev`
   - Test login, data display, etc.

---

## 🔧 Troubleshooting

### Issue: Backup Download is Too Large

**Solution**: Use pg_dump through Supabase's connection pooler:

```bash
PGPASSWORD="source_password" pg_dump \
  "postgresql://postgres.jjepfehmuybpctdzipnu:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require" \
  > database-backups/source_backup.sql
```

### Issue: SQL Editor Timeouts

**Solution**: Split the backup file into smaller parts:

```bash
# Split into 10MB chunks
split -b 10m database-backups/source_backup.sql database-backups/part_

# Then import each part:
# part_aa, part_ab, part_ac, etc.
```

### Issue: Foreign Key Constraint Errors

**Solution**: Temporarily disable constraints:

```sql
-- Before import
SET session_replication_role = replica;

-- Run your import SQL

-- After import
SET session_replication_role = DEFAULT;
```

---

## 📊 Expected Results

After successful migration:

✅ **47 tables** in target database
✅ All data copied from source
✅ Foreign keys intact
✅ Indexes preserved
✅ RLS policies copied
✅ Functions and triggers working

---

## 🆘 If You Get Stuck

Try these in order:

1. **Connection Pooler Method**:
   - Find "Connection pooling" settings in Supabase
   - Use the pooler hostname instead of direct hostname
   - Format: `aws-0-region.pooler.supabase.com`

2. **Supabase Support**:
   - Contact Supabase support for migration help
   - They can assist with database transfers

3. **Alternative Tool - pgAdmin**:
   - Download pgAdmin
   - Connect to both databases through Supabase's web interface
   - Use pgAdmin's backup/restore GUI

---

## ⏱️ Estimated Time

- Creating backup: 2-5 minutes
- Downloading: 1-10 minutes (depends on size)
- Uploading/Importing: 5-15 minutes
- Verification: 5 minutes

**Total**: ~15-35 minutes

---

## 🎯 Simplest Path Forward

Since you confirmed the source database works in SQL Editor:

1. **Create backup** in source dashboard
2. **Download** backup file
3. **Upload/Restore** to target dashboard

This is the most reliable method when network issues prevent direct connections.

Let me know which method you'd like to try!
