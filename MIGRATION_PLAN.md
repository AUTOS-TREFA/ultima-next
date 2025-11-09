# React + Express to Next.js Migration Plan

## Project Overview
- **Current Stack**: React 18.2 + Vite + Express + React Router v6
- **Target Stack**: Next.js 14+ App Router
- **Scope**: 68 pages, 50,000+ lines of code
- **Approach**: Automated scripts + manual intervention for critical files only

## Migration Architecture

### Phase 1: Infrastructure Setup
1. Install Next.js and dependencies
2. Create app directory structure
3. Set up TypeScript configuration
4. Configure Tailwind CSS for Next.js
5. Update environment variables

### Phase 2: Routing Migration
Convert React Router structure to Next.js App Router:

```
React Router (src/App.tsx)          →  Next.js App Router (app/)
─────────────────────────────────────────────────────────────────
/                                   →  app/page.tsx
/autos                              →  app/autos/page.tsx
/autos/:slug                        →  app/autos/[slug]/page.tsx
/explorar                           →  app/explorar/page.tsx
/financiamientos                    →  app/financiamientos/page.tsx
/acceder                            →  app/acceder/page.tsx
/escritorio                         →  app/escritorio/page.tsx
/escritorio/admin/*                 →  app/escritorio/admin/*/page.tsx
/marcas/:marca                      →  app/marcas/[marca]/page.tsx
/:slug                              →  app/[slug]/page.tsx (catch-all)
```

### Phase 3: Layout Structure

```typescript
app/
├── layout.tsx                      // Root layout (providers, metadata)
│   ├── (public)/                   // Public pages group
│   │   ├── layout.tsx              // MainLayout (Header + Footer)
│   │   ├── page.tsx                // HomePage
│   │   ├── autos/
│   │   │   ├── page.tsx            // VehicleListPage
│   │   │   └── [slug]/page.tsx     // VehicleDetailPage
│   │   └── ...
│   ├── (standalone)/               // Pages without header/footer
│   │   ├── explorar/page.tsx
│   │   └── financiamientos/page.tsx
│   ├── (auth)/                     // Auth pages
│   │   └── acceder/page.tsx
│   └── escritorio/                 // Protected dashboard
│       ├── layout.tsx              // DashboardLayout
│       ├── page.tsx                // DashboardPage
│       ├── admin/                  // Admin routes
│       │   ├── layout.tsx          // Admin check wrapper
│       │   └── .../page.tsx
│       └── ventas/                 // Sales routes
│           ├── layout.tsx          // Sales check wrapper
│           └── .../page.tsx
```

### Phase 4: Server Components vs Client Components

**Server Components (default):**
- All page.tsx files by default
- Static content pages
- SEO-critical pages (HomePage, VehicleListPage, etc.)

**Client Components ('use client'):**
- Pages with forms (Application, ProfilePage)
- Pages with interactive state (ExplorarPage, CarStudioPage)
- Components using hooks, context, or events
- All existing components in src/components/

### Phase 5: API Routes Migration

Express server.js → Next.js API Routes:

```
server/server.js                    →  app/api/
─────────────────────────────────────────────────────────────────
POST /intelimotor-api/              →  app/api/intelimotor/route.ts
GET /healthz                        →  app/api/health/route.ts
GET /api/health                     →  app/api/health/route.ts
Static file serving                 →  public/ (automatic)
SPA fallback                        →  Not needed (Next.js handles)
```

### Phase 6: State Management
- Keep Context API providers (compatible with Next.js)
- Wrap root layout with providers
- React Query client setup in root layout
- Supabase client (no changes needed)

### Phase 7: Environment Variables

```
VITE_SUPABASE_URL                   →  NEXT_PUBLIC_SUPABASE_URL
VITE_SUPABASE_ANON_KEY              →  NEXT_PUBLIC_SUPABASE_ANON_KEY
VITE_AIRTABLE_API_KEY               →  AIRTABLE_API_KEY (server-only)
VITE_AIRTABLE_BASE_ID               →  AIRTABLE_BASE_ID (server-only)
```

## Automated Migration Scripts

### 1. `scripts/migration/setup-nextjs.sh`
- Install Next.js dependencies
- Create app directory structure
- Copy public assets
- Generate initial configuration files

### 2. `scripts/migration/migrate-routes.js`
- Parse src/App.tsx route definitions
- Generate app directory structure
- Create page.tsx files with imports
- Create layout.tsx files for nested routes

### 3. `scripts/migration/add-use-client.js`
- Scan all components for React hooks usage
- Add 'use client' directive to interactive components
- Skip Server Component compatible files

### 4. `scripts/migration/migrate-env.js`
- Convert .env files (VITE_* → NEXT_PUBLIC_*)
- Update all references in codebase
- Generate .env.example with Next.js variables

### 5. `scripts/migration/create-api-routes.js`
- Convert Express endpoints to Next.js API routes
- Generate route.ts files with proper types
- Migrate middleware logic

### 6. `scripts/migration/create-middleware.ts`
- Generate Next.js middleware for auth
- Replace ProtectedRoute with middleware logic
- Add role-based access control

### 7. `scripts/migration/update-imports.js`
- Update relative imports to use Next.js conventions
- Replace React Router imports with next/navigation
- Update dynamic imports to use next/dynamic

## Manual Intervention Required

### Critical Files (Manual Review)
1. **app/layout.tsx** - Root providers setup
2. **app/middleware.ts** - Authentication logic
3. **app/api/intelimotor/route.ts** - API proxy logic
4. **next.config.js** - Production configuration
5. **supabaseClient.ts** - Ensure compatibility

### Custom Configurations
1. Image optimization (next/image)
2. Metadata and SEO
3. Static generation strategies
4. Caching strategies

## Next.js Configuration

```javascript
// next.config.js
module.exports = {
  reactStrictMode: true,
  images: {
    domains: [
      'jjepfehmuybpctdzipnu.supabase.co',
      'randomuser.me',
      // ... other image domains
    ],
  },
  async rewrites() {
    return [
      // Add any URL rewrites if needed
    ];
  },
  async redirects() {
    return [
      // Add any redirects if needed
    ];
  },
  experimental: {
    // Enable any experimental features
  },
};
```

## Deployment Changes

### Dockerfile Updates
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
CMD ["npm", "start"]
```

### Build Scripts
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  }
}
```

## Testing Strategy
1. Run build after each phase
2. Test critical user flows
3. Verify API endpoints
4. Check authentication flows
5. Test protected routes
6. Validate image optimization
7. SEO metadata verification

## Rollback Plan
- Keep original code in separate branch
- Tag current state before migration
- Document all breaking changes
- Maintain compatibility layer if needed

## Performance Optimizations
1. **Server Components**: Use for static content
2. **Image Optimization**: Convert to next/image
3. **ISR**: Implement for vehicle listings
4. **SSG**: Static pages (privacy policy, FAQ)
5. **Streaming**: Use Suspense boundaries

## Timeline Estimates
- Phase 1: Infrastructure Setup - 30 minutes
- Phase 2: Route Migration - 1-2 hours (automated)
- Phase 3: Layout Creation - 30 minutes
- Phase 4: Component Migration - 2 hours (automated)
- Phase 5: API Routes - 1 hour
- Phase 6: State Management - 30 minutes
- Phase 7: Environment Variables - 15 minutes
- Testing & Fixes - 2-3 hours
- **Total**: 8-10 hours

## Success Criteria
✅ All 68 pages migrated successfully
✅ Build completes without errors
✅ All API endpoints functional
✅ Authentication working correctly
✅ Protected routes enforced
✅ Image optimization active
✅ SEO metadata preserved
✅ Performance improved (Core Web Vitals)
✅ No regression in functionality

## Next Steps
1. Create migration scripts
2. Initialize Next.js structure
3. Run automated migrations
4. Manual review of critical files
5. Testing and fixes
6. Deploy to staging
7. Production deployment
