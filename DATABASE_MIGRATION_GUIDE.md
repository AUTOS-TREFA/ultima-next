# Database Migration Guide

## Overview

This guide explains how to safely migrate your Supabase database from the source project to the target project.

**Source Database**: `jjepfehmuybpctdzipnu` (READ ONLY)
**Target Database**: `wmtlzfodmrchgqdbxjln` (WILL BE OVERWRITTEN)

---

## ⚠️ Important Safety Information

### What This Script Does

✅ **Safe Operations on Source Database**:
- Reads schema structure
- Exports data
- NO modifications to source database
- 100% READ-ONLY access

✅ **Backup and Safety**:
- Creates full backup of target database BEFORE any changes
- All exports saved to `./database-backups/` directory
- Detailed migration log created
- Rollback capability via backup file

⚠️ **Warning - Target Database**:
- **ALL EXISTING DATA in target database will be REPLACED**
- Existing tables will be dropped
- All data will be imported fresh from source
- Make sure target database can be overwritten

---

## Prerequisites

### 1. Install PostgreSQL Client Tools

The migration script requires `pg_dump`, `pg_restore`, and `psql`.

**macOS** (using Homebrew):
```bash
brew install postgresql
```

**Ubuntu/Debian**:
```bash
sudo apt-get install postgresql-client
```

**Windows**:
Download and install from: https://www.postgresql.org/download/windows/

### 2. Get Database Passwords

You will need the database passwords for BOTH databases:

**Source Database Password** (`jjepfehmuybpctdzipnu`):
- Go to: https://supabase.com/dashboard/project/jjepfehmuybpctdzipnu/settings/database
- Look for "Database password" section
- Copy the password

**Target Database Password** (`wmtlzfodmrchgqdbxjln`):
- Go to: https://supabase.com/dashboard/project/wmtlzfodmrchgqdbxjln/settings/database
- Look for "Database password" section
- Copy the password

### 3. Verify Disk Space

Check you have enough free disk space:
- Source database will be exported (schema + data)
- Target database backup will be created
- Typically need 2-3x the source database size

---

## Migration Steps

### Step 1: Review the Plan

The migration script will:

1. **Analyze** source database (read-only)
2. **Backup** target database completely
3. **Export** source schema (DDL)
4. **Export** source data (INSERT statements)
5. **Clean** target database (drop all tables)
6. **Import** schema to target
7. **Import** data to target
8. **Verify** migration success
9. **Update** sequences for auto-increment fields

### Step 2: Run the Migration Script

```bash
cd /Users/marianomorales/Downloads/next-ultima/ultima-next
./scripts/migrate-database.sh
```

### Step 3: Follow the Prompts

The script will ask you for:

1. **Source database password** (jjepfehmuybpctdzipnu)
2. **Target database password** (wmtlzfodmrchgqdbxjln)
3. **Confirmation** - Type `MIGRATE` to proceed

### Step 4: Wait for Completion

The script will show progress for each step:
- ✓ Green checkmarks = success
- ⚠ Yellow warnings = review needed
- ✗ Red errors = critical failure (migration stops)

**Estimated Time**:
- Small DB (<100MB): 5-15 minutes
- Medium DB (100MB-1GB): 15-30 minutes
- Large DB (>1GB): 30-60+ minutes

---

## What Gets Migrated

### ✅ Included in Migration

- **All Tables**: Every table in the `public` schema
- **All Data**: Every row in every table
- **Schema Objects**:
  - Indexes
  - Sequences
  - Views
  - Functions
  - Triggers
  - RLS Policies
  - Extensions
- **Relationships**: Foreign keys and constraints
- **Permissions**: Table and column permissions

### ❌ NOT Migrated (Supabase Managed)

These are project-specific and managed by Supabase:
- Auth users (in `auth.users` schema) - **IMPORTANT NOTE** below
- Storage buckets and files
- Edge Functions
- Realtime subscriptions
- Project settings
- API keys

> **IMPORTANT**: User authentication data in the `auth` schema is NOT migrated by this script. This is for safety, as auth data includes sensitive password hashes and should be handled separately. If you need to migrate users, use Supabase's auth export/import features or contact Supabase support.

---

## Post-Migration Steps

### 1. Verify Data Integrity

After migration completes, check:

```sql
-- Compare table counts
SELECT COUNT(*) FROM your_table_name;

-- Check sample records
SELECT * FROM users LIMIT 10;
SELECT * FROM financing_applications LIMIT 10;

-- Verify relationships work
SELECT u.*, fa.*
FROM users u
LEFT JOIN financing_applications fa ON fa.user_id = u.id
LIMIT 10;
```

### 2. Test Application

1. Update your `.env.local` to use target database (already done ✓)
2. Restart development server: `npm run dev`
3. Test critical functionality:
   - User login (if auth was migrated separately)
   - Data display
   - Create new records
   - Update existing records
   - File uploads
   - CRM features

### 3. Check for Errors

Monitor application logs and browser console for:
- Database connection errors
- Missing table errors
- RLS policy violations
- Foreign key constraint errors

---

## Rollback Procedure

If something goes wrong, you can restore the target database from backup:

### Find Your Backup File

```bash
ls -lh database-backups/
```

Look for: `target_backup_YYYYMMDD_HHMMSS.sql`

### Restore from Backup

```bash
# Replace TIMESTAMP with your actual backup timestamp
BACKUP_FILE="./database-backups/target_backup_YYYYMMDD_HHMMSS.sql"

# Restore target database
PGPASSWORD="your_target_password" psql \
  -h db.wmtlzfodmrchgqdbxjln.supabase.co \
  -p 5432 \
  -U postgres \
  -d postgres \
  -f "$BACKUP_FILE"
```

---

## Troubleshooting

### Error: "pg_dump: command not found"

**Problem**: PostgreSQL client tools not installed

**Solution**: Install PostgreSQL client tools (see Prerequisites)

---

### Error: "FATAL: password authentication failed"

**Problem**: Incorrect database password

**Solution**:
1. Go to Supabase dashboard
2. Navigate to Project Settings → Database
3. Copy the correct database password
4. Try again with correct password

---

### Error: "connection timed out"

**Problem**: Network connectivity or firewall issues

**Solution**:
1. Check your internet connection
2. Verify Supabase project is not paused
3. Try from a different network
4. Check if your IP is blocked by Supabase

---

### Error: "disk full" or "no space left"

**Problem**: Insufficient disk space

**Solution**:
1. Check available disk space: `df -h`
2. Free up space by removing old files
3. Consider migrating to a machine with more storage

---

### Warning: "Table count mismatch"

**Problem**: Number of tables in source vs target don't match

**Solution**:
1. Review migration log file
2. Check if certain tables failed to migrate
3. Look for error messages during import
4. May need to manually fix specific tables

---

### Error: Foreign key constraint violations

**Problem**: Data import fails due to missing related records

**Solution**:
1. Check migration log for specific errors
2. May need to temporarily disable constraints
3. Ensure data import order respects dependencies

---

## Migration Log and Files

After migration, you'll find these files in `./database-backups/`:

| File | Purpose | Keep? |
|------|---------|-------|
| `migration_TIMESTAMP.log` | Detailed log of entire process | ✓ Yes - for audit trail |
| `target_backup_TIMESTAMP.sql` | Backup of target BEFORE migration | ✓ Yes - for rollback |
| `source_schema_TIMESTAMP.sql` | Exported source schema (DDL) | Optional - for reference |
| `source_data_TIMESTAMP.sql` | Exported source data | Optional - for reference |

**Recommendation**: Keep all files for at least 30 days after successful migration.

---

## Security Considerations

### Passwords

- Script NEVER stores passwords to disk
- Passwords are only in memory during execution
- Environment variables are cleared after completion

### Data in Transit

- All connections use SSL/TLS encryption
- Direct connection to Supabase (no intermediaries)

### Backup Files

- Backup files contain ALL your data in plain SQL
- Store securely
- Delete old backups after confirmed successful migration
- Consider encrypting backup files if they contain sensitive data

---

## Advanced Options

### Migrate Specific Tables Only

To migrate only specific tables, modify the script:

```bash
# In the export data section, add --table flag:
pg_dump --data-only --table=users --table=applications \
  -h "$SOURCE_DB_HOST" ... > data.sql
```

### Exclude Certain Tables

```bash
# Add --exclude-table flag:
pg_dump --data-only --exclude-table=logs --exclude-table=analytics \
  -h "$SOURCE_DB_HOST" ... > data.sql
```

### Dry Run (Schema Only)

To test without importing data:
1. Run migration script
2. Let it complete through schema import
3. Press Ctrl+C before data import
4. Inspect target database schema
5. Restore from backup if needed

---

## Support

If you encounter issues:

1. **Check migration log**: `./database-backups/migration_TIMESTAMP.log`
2. **Review this guide**: Especially the Troubleshooting section
3. **Supabase Dashboard**: Check project health and logs
4. **Supabase Support**: For Supabase-specific issues
5. **PostgreSQL Docs**: For pg_dump/restore issues

---

## Checklist

Before running migration:

- [ ] PostgreSQL client tools installed and working
- [ ] Source database password obtained
- [ ] Target database password obtained
- [ ] Sufficient disk space available (2-3x source DB size)
- [ ] Confirmed target database can be overwritten
- [ ] No production traffic to target database
- [ ] Backup storage location identified
- [ ] Reviewed this entire guide

During migration:

- [ ] Script completed without errors
- [ ] Table counts match between source and target
- [ ] Database sizes are comparable
- [ ] Sequences updated successfully

After migration:

- [ ] Data integrity verified with sample queries
- [ ] Application tested and working
- [ ] Critical user flows tested
- [ ] No console errors or warnings
- [ ] Backup files stored securely

---

**Last Updated**: November 12, 2024
**Script Version**: 1.0
**Script Location**: `./scripts/migrate-database.sh`
