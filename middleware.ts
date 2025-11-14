import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();

  // Explicitly provide Supabase credentials to avoid environment variable issues
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://pemgwyymodlwabaexxrb.supabase.co';
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBlbWd3eXltb2Rsd2FiYWV4eHJiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI5OTE1MTYsImV4cCI6MjA3ODU2NzUxNn0.wfwBKfCuDYmBX_Hi5KvqtNmLLpbgQllPnUaPfoDrYok';

  const supabase = createMiddlewareClient({ req, res }, { supabaseUrl, supabaseKey });

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
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', session.user.id)
      .maybeSingle();

    // If profile doesn't exist, default to 'user' role
    // Profile will be created by a database trigger or the AuthContext
    if (profileError) {
      console.error('Error fetching user profile:', profileError);
    }

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
    '/((?!_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
