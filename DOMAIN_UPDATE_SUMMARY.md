# Domain Update Summary - autostrefa.mx

## Overview
Updated all configuration files to use the new domain `autostrefa.mx` and new Supabase project `pemgwyymodlwabaexxrb`.

**Date**: November 12, 2025
**Old Domain**: trefa.mx
**New Domain**: autostrefa.mx
**Old Project**: wmtlzfodmrchgqdbxjln (NOT MODIFIED - original project remains untouched)
**New Project**: pemgwyymodlwabaexxrb (all updates applied here)

---

## Files Updated

### 1. Deploy Script (`deploy.sh`)
**Purpose**: Main deployment script for Google Cloud Run

**Changes Made**:
- Line 23: `FRONTEND_URL_OVERRIDE="https://autostrefa.mx"` (production)
- Line 262: `FRONTEND_URL_OVERRIDE="https://autostrefa.mx"` (override)
- Lines 382-391: Updated all verification URLs:
  - Health check: `https://autostrefa.mx/healthz`
  - Main site: `https://autostrefa.mx`
  - Explorar page: `https://autostrefa.mx/explorar`
  - Application form: `https://autostrefa.mx/escritorio/aplicacion`

### 2. Next.js Configuration (`next.config.js`)
**Purpose**: Next.js image optimization and remote patterns

**Changes Made**:
- Line 9: Updated hostname from `wmtlzfodmrchgqdbxjln.supabase.co` to `pemgwyymodlwabaexxrb.supabase.co`
- Lines 20-29: Updated domain patterns:
  - `trefa.mx` → `autostrefa.mx`
  - `www.trefa.mx` → `www.autostrefa.mx`
  - `autos.trefa.mx` → `autos.autostrefa.mx`

### 3. Environment Variables (`.env.local`)
**Already Updated Previously** - Using new project credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=https://pemgwyymodlwabaexxrb.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBlbWd3eXltb2Rsd2FiYWV4eHJiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI5OTE1MTYsImV4cCI6MjA3ODU2NzUxNn0.wfwBKfCuDYmBX_Hi5KvqtNmLLpbgQllPnUaPfoDrYok
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBlbWd3eXltb2Rsd2FiYWV4eHJiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Mjk5MTUxNiwiZXhwIjoyMDc4NTY3NTE2fQ.bHklvHfGuV00RNFO_KN4cpf1BhfhMfSrKR3TtMvaCNU
```

### 4. Config Index (`src/config/index.ts`)
**Already Updated Previously** - Line 17-18 with new project URLs

### 5. Image URL Utilities (`src/utils/imageUrl.ts`)
**Already Updated Previously** - Line 10 with new storage URL

### 6. Constants (`src/utils/constants.ts`)
**Already Updated Previously** - Line 5 with new placeholder image URLs

### 7. HomePage Component (`src/page-components/HomePage.tsx`)
**Already Updated Previously** - Lines 557, 606 with new image URLs

---

## What Was NOT Changed

### Original Project Remains Untouched
- **Project ID**: `wmtlzfodmrchgqdbxjln`
- **Domain**: `trefa.mx` (still references old domain in staging setup script)
- **Status**: Original project remains completely untouched and operational

### Files Still Referencing Old Project (Documentation Only)
These files are **documentation/backup files** and don't affect the running application:
- `MIGRATION_STATUS_AND_NEXT_STEPS.md`
- `FRESH_PROJECT_MIGRATION.md`
- `DATABASE_MIGRATION_GUIDE.md`
- `RESOLVE_STUCK_DATABASE.md`
- `MANUAL_MIGRATION_STEPS.md`
- `CONFIGURATION_UPDATE_SUMMARY.md`
- `.env.local.backup.20251112_222918`
- Migration scripts in `scripts/` directory

### Files Intentionally Not Changed
- `setup-staging-domain.sh` - Still references `staging.trefa.mx` (unchanged unless you want staging on new domain)
- `supabaseClient.ts` - Has fallback URL that will be overridden by env vars

---

## Database Migration Status

### Completed
✅ Schema imported (43 tables)
✅ Edge Functions deployed (23 functions)
✅ Configuration files updated

### In Progress
🔄 Data import running via Supabase CLI
- Source: 32MB SQL dump from `jjepfehmuybpctdzipnu`
- Target: `pemgwyymodlwabaexxrb`
- Method: `supabase db push --project-ref pemgwyymodlwabaexxrb`

---

## Deployment Checklist

### Before Deploying to Production

- [ ] **Wait for data import to complete**
  - Check: `tail -f database-backups/data_import_via_cli.log`
  - Verify: Run test queries on new database

- [ ] **Test locally with new database**
  ```bash
  rm -rf .next
  npm run dev
  ```
  - Verify homepage loads
  - Check vehicle inventory displays
  - Test image loading
  - Verify authentication works

- [ ] **Update DNS for autostrefa.mx**
  - Point A record to Cloud Run IP
  - Or set up CNAME to `ghs.googlehosted.com`
  - Wait for DNS propagation (5-30 minutes)

- [ ] **Update Supabase Dashboard Settings**
  - Go to: https://supabase.com/dashboard/project/pemgwyymodlwabaexxrb/settings/api
  - Update Site URL: `https://autostrefa.mx`
  - Update Redirect URLs:
    - `https://autostrefa.mx/**`
    - `https://www.autostrefa.mx/**`

- [ ] **Deploy to Google Cloud Run**
  ```bash
  ./deploy.sh production
  ```
  - This will use the new `autostrefa.mx` domain
  - Build will use new Supabase credentials from `.env.local`

- [ ] **Update Cloud Run environment variables**
  ```bash
  gcloud run services update next-js-trefa \
    --region us-central1 \
    --update-env-vars \
  NEXT_PUBLIC_SUPABASE_URL=https://pemgwyymodlwabaexxrb.supabase.co,\
  NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBlbWd3eXltb2Rsd2FiYWV4eHJiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI5OTE1MTYsImV4cCI6MjA3ODU2NzUxNn0.wfwBKfCuDYmBX_Hi5KvqtNmLLpbgQllPnUaPfoDrYok,\
  SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBlbWd3eXltb2Rsd2FiYWV4eHJiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Mjk5MTUxNiwiZXhwIjoyMDc4NTY3NTE2fQ.bHklvHfGuV00RNFO_KN4cpf1BhfhMfSrKR3TtMvaCNU,\
  FRONTEND_URL=https://autostrefa.mx
  ```

### After Deployment

- [ ] **Verify production deployment**
  - Test: `curl https://autostrefa.mx/healthz`
  - Visit: https://autostrefa.mx
  - Check: Browser console for errors
  - Verify: All images load correctly

- [ ] **Monitor Cloud Run logs**
  ```bash
  gcloud run logs tail next-js-trefa --region=us-central1
  ```

- [ ] **Test all critical paths**
  - Homepage
  - Vehicle inventory (/explorar)
  - Vehicle detail pages
  - Authentication flow
  - User profiles (/escritorio)
  - Application forms
  - Contact forms

- [ ] **Migrate storage files (if needed)**
  - Check if images are loading from new project
  - If not, copy from old project storage:
    - Old: https://supabase.com/dashboard/project/wmtlzfodmrchgqdbxjln/storage/buckets
    - New: https://supabase.com/dashboard/project/pemgwyymodlwabaexxrb/storage/buckets

---

## Rollback Plan

If something goes wrong, you can rollback by:

### 1. Revert Git Changes
```bash
git checkout deploy.sh
git checkout next.config.js
```

### 2. Restore Environment Variables
```bash
cp .env.local.backup.20251112_222918 .env.local
```

### 3. Clear Cache and Restart
```bash
rm -rf .next
npm run dev
```

### 4. Revert Cloud Run Deployment
```bash
# Find previous revision
gcloud run revisions list --service=next-js-trefa --region=us-central1

# Rollback to previous revision
gcloud run services update-traffic next-js-trefa \
  --region=us-central1 \
  --to-revisions=REVISION_NAME=100
```

---

## Important Notes

1. **Original Project Safety**: The original project `wmtlzfodmrchgqdbxjln` was never modified during this process
2. **Domain Transition**: Old domain `trefa.mx` can remain operational until new domain is fully tested
3. **Storage Migration**: Images may need to be manually copied from old to new project storage
4. **Auth Users**: Users may need to re-authenticate if auth data wasn't fully migrated
5. **Keep Old Project Active**: Maintain old project for at least 48 hours as backup

---

## Support Links

### New Project (pemgwyymodlwabaexxrb)
- Dashboard: https://supabase.com/dashboard/project/pemgwyymodlwabaexxrb
- SQL Editor: https://supabase.com/dashboard/project/pemgwyymodlwabaexxrb/editor
- Functions: https://supabase.com/dashboard/project/pemgwyymodlwabaexxrb/functions
- Storage: https://supabase.com/dashboard/project/pemgwyymodlwabaexxrb/storage/buckets
- API Settings: https://supabase.com/dashboard/project/pemgwyymodlwabaexxrb/settings/api

### Original Project (wmtlzfodmrchgqdbxjln) - Untouched Backup
- Dashboard: https://supabase.com/dashboard/project/wmtlzfodmrchgqdbxjln

---

**Status**: Configuration updated, data import in progress
**Next Step**: Wait for data import completion, then test locally before production deployment
