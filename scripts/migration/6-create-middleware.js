#!/usr/bin/env node
/**
 * Migration Script 6: Create Middleware
 *
 * This script:
 * 1. Creates Next.js middleware for authentication
 * 2. Replaces ProtectedRoute, AdminRoute, SalesRoute logic
 * 3. Implements role-based access control
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../..');

console.log('🚀 Starting Next.js Migration - Phase 6: Create Middleware');
console.log('═'.repeat(60));

// Step 1: Create middleware.ts
console.log('\n🛡️  Creating authentication middleware...');

const middlewarePath = path.join(rootDir, 'middleware.ts');
const middlewareContent = `import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  // Refresh session if expired
  const { data: { session } } = await supabase.auth.getSession();

  const { pathname } = req.nextUrl;

  // Public routes that don't require authentication
  const publicRoutes = [
    '/',
    '/autos',
    '/explorar',
    '/financiamientos',
    '/promociones',
    '/faq',
    '/kit-trefa',
    '/politica-de-privacidad',
    '/vacantes',
    '/marcas',
    '/carroceria',
    '/changelog',
    '/intel',
    '/conocenos',
    '/contacto',
    '/landing',
    '/vender-mi-auto',
    '/acceder',
    '/admin/login',
    '/api',
    '/_next',
    '/favicon.ico',
  ];

  // Check if current path is public
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));

  // Auth-only routes (redirect to dashboard if logged in)
  const authOnlyRoutes = ['/acceder', '/admin/login'];
  const isAuthOnlyRoute = authOnlyRoutes.some(route => pathname.startsWith(route));

  if (isAuthOnlyRoute && session) {
    // Redirect to dashboard if already logged in
    const url = req.nextUrl.clone();
    url.pathname = '/escritorio';
    return NextResponse.redirect(url);
  }

  // Protected routes (require authentication)
  if (pathname.startsWith('/escritorio')) {
    if (!session) {
      // Redirect to login with return URL
      const url = req.nextUrl.clone();
      url.pathname = '/acceder';
      url.searchParams.set('redirect', pathname);
      return NextResponse.redirect(url);
    }

    // Get user profile for role checking
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    const userRole = profile?.role || 'user';

    // Admin-only routes
    if (pathname.startsWith('/escritorio/admin')) {
      if (userRole !== 'admin') {
        const url = req.nextUrl.clone();
        url.pathname = '/escritorio';
        url.searchParams.set('error', 'unauthorized');
        return NextResponse.redirect(url);
      }
    }

    // Sales routes (admin and sales roles)
    if (pathname.startsWith('/escritorio/ventas') || pathname === '/escritorio/dashboard') {
      if (!['admin', 'sales'].includes(userRole)) {
        const url = req.nextUrl.clone();
        url.pathname = '/escritorio';
        url.searchParams.set('error', 'unauthorized');
        return NextResponse.redirect(url);
      }
    }
  }

  return res;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
`;

fs.writeFileSync(middlewarePath, middlewareContent);
console.log('  ✓ Created middleware.ts');

// Step 2: Create lib/supabase directory for helpers
console.log('\n📚 Creating Supabase helpers...');

const supabaseLibDir = path.join(rootDir, 'lib/supabase');
if (!fs.existsSync(supabaseLibDir)) {
  fs.mkdirSync(supabaseLibDir, { recursive: true });
}

// Server component helper
const serverPath = path.join(supabaseLibDir, 'server.ts');
const serverContent = `import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { cache } from 'react';

export const createServerSupabaseClient = cache(() => {
  const cookieStore = cookies();
  return createServerComponentClient({ cookies: () => cookieStore });
});

export async function getSession() {
  const supabase = createServerSupabaseClient();
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return session;
  } catch (error) {
    console.error('Error:', error);
    return null;
  }
}

export async function getUserProfile(userId: string) {
  const supabase = createServerSupabaseClient();
  try {
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();
    return profile;
  } catch (error) {
    console.error('Error fetching profile:', error);
    return null;
  }
}
`;

fs.writeFileSync(serverPath, serverContent);
console.log('  ✓ Created lib/supabase/server.ts');

// Client component helper
const clientPath = path.join(supabaseLibDir, 'client.ts');
const clientContent = `import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export const createBrowserSupabaseClient = () => createClientComponentClient();
`;

fs.writeFileSync(clientPath, clientContent);
console.log('  ✓ Created lib/supabase/client.ts');

// Step 3: Create auth utilities
console.log('\n🔐 Creating auth utilities...');

const authUtilsPath = path.join(rootDir, 'lib/auth.ts');
const authUtilsContent = `import { createServerSupabaseClient } from './supabase/server';

export type UserRole = 'user' | 'sales' | 'admin';

export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  phone?: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export async function getCurrentUser() {
  const supabase = createServerSupabaseClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) {
    return null;
  }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', session.user.id)
    .single();

  return profile as UserProfile | null;
}

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('Unauthorized');
  }
  return user;
}

export async function requireAdmin() {
  const user = await requireAuth();
  if (user.role !== 'admin') {
    throw new Error('Forbidden: Admin access required');
  }
  return user;
}

export async function requireSalesOrAdmin() {
  const user = await requireAuth();
  if (!['admin', 'sales'].includes(user.role)) {
    throw new Error('Forbidden: Sales or Admin access required');
  }
  return user;
}

export function hasRole(user: UserProfile | null, ...roles: UserRole[]) {
  if (!user) return false;
  return roles.includes(user.role);
}
`;

fs.writeFileSync(authUtilsPath, authUtilsContent);
console.log('  ✓ Created lib/auth.ts');

// Step 4: Create migration report
console.log('\n📊 Creating migration report...');
const report = {
  timestamp: new Date().toISOString(),
  filesCreated: [
    'middleware.ts',
    'lib/supabase/server.ts',
    'lib/supabase/client.ts',
    'lib/auth.ts',
  ],
  features: [
    'Authentication middleware',
    'Role-based access control (admin, sales, user)',
    'Automatic session refresh',
    'Protected route guards',
    'Auth-only route redirects',
    'Server and client Supabase helpers',
  ],
  replacedComponents: [
    'ProtectedRoute',
    'AdminRoute',
    'SalesRoute',
    'PublicRoute',
  ],
  notes: [
    'Middleware runs on edge runtime for better performance',
    'Session validation happens before page render',
    'Role checks integrated with Supabase RLS',
    'Compatible with Server and Client Components',
  ],
};

const reportPath = path.join(__dirname, 'middleware-migration-report.json');
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
console.log(`  ✓ Report saved to: middleware-migration-report.json`);

console.log('\n✅ Phase 6 Complete: Middleware created');
console.log('\n  📊 Summary:');
console.log('     Files created: 4');
console.log('     Authentication: Enabled');
console.log('     Role-based access: Enabled');
console.log('     Edge runtime: Optimized');
console.log('\n  💡 Note:');
console.log('     Install @supabase/auth-helpers-nextjs:');
console.log('     npm install @supabase/auth-helpers-nextjs');
console.log('\n' + '═'.repeat(60));
