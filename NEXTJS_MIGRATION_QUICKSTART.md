# Next.js Migration - Quick Start Guide

## TL;DR

Run this **single command** to migrate your entire 68-page React app to Next.js:

```bash
./scripts/migration/migrate-to-nextjs.sh
```

**Time:** 5-10 minutes
**Token usage:** Minimal (scripts do all the work)
**Manual intervention:** Only for critical reviews

---

## What This Migration Does

### Automated Transformations

| Component | Before | After |
|-----------|--------|-------|
| **Framework** | React 18 + Vite | Next.js 14 App Router |
| **Server** | Express.js | Next.js API Routes |
| **Routing** | React Router v6 | App Router |
| **Build** | Vite | Next.js |
| **Deployment** | Custom Docker | Optimized Docker |
| **Pages** | 68 routes | 68 `page.tsx` files |
| **Auth** | ProtectedRoute HOC | Middleware |
| **Env Vars** | VITE_* | NEXT_PUBLIC_* |

### Preserved Features

✅ All 68 pages
✅ Authentication (Supabase)
✅ Protected routes
✅ Admin/Sales access control
✅ API integrations (Airtable, Intelimotor, etc.)
✅ File uploads
✅ Image handling
✅ Form validation
✅ State management (Context API, React Query)
✅ TypeScript types
✅ Tailwind CSS styling
✅ All third-party services

---

## Pre-Migration Checklist

- [ ] Node.js 18+ installed (`node -v`)
- [ ] Git repository is clean (`git status`)
- [ ] All changes committed
- [ ] Backup created (optional but recommended)
- [ ] Read MIGRATION_PLAN.md (optional)

---

## Migration Steps

### Step 1: Run Migration Script

```bash
# Navigate to project root
cd /home/user/ultima-next

# Run migration
./scripts/migration/migrate-to-nextjs.sh
```

**What happens:**
1. Creates Next.js directory structure
2. Migrates environment variables
3. Converts all 68 routes
4. Creates API routes
5. Adds 'use client' directives
6. Generates authentication middleware
7. Updates package.json
8. Optimizes Dockerfile
9. Installs dependencies

### Step 2: Update Environment Variables

Edit `.env.local`:

```env
# Client-side (publicly accessible)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Server-side only (private)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
AIRTABLE_API_KEY=your-airtable-key
```

### Step 3: Test Development Server

```bash
npm run dev
```

Open: http://localhost:3000

### Step 4: Check for Issues

```bash
npm run type-check
npm run build
```

---

## File Changes Summary

### Created Directories

```
app/               # Next.js App Router
lib/               # Utilities
scripts/migration/ # Migration scripts (already created)
```

### Key Created Files

```
app/layout.tsx                    # Root layout
middleware.ts                     # Auth middleware
next.config.js                    # Next.js config
Dockerfile                        # Optimized build
DEPLOYMENT.md                     # Deploy guide
```

---

## Troubleshooting

### Build Fails

```bash
rm -rf .next node_modules package-lock.json
npm install
npm run build
```

### Environment Variables Not Working

- Client-side: Must start with `NEXT_PUBLIC_`
- Server-side: No prefix needed
- Restart dev server after changes

### Authentication Errors

```bash
npm install @supabase/auth-helpers-nextjs @supabase/ssr
```

---

## Success Criteria

- ✅ `npm run dev` starts without errors
- ✅ All pages load correctly
- ✅ Authentication works
- ✅ `npm run build` completes

---

**Ready to migrate?**

```bash
./scripts/migration/migrate-to-nextjs.sh
```

🚀 Let's do this!
