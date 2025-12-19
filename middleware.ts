import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Lista de correos de administradores (debe coincidir con src/constants/adminEmails.ts)
const ADMIN_EMAILS = [
    'mariano.morales@autostrefa.mx',
    'marianomorales@outlook.com',
    'marianomorales_@outlook.com',
    'alejandro.trevino@autostrefa.mx',
    'evelia.castillo@autostrefa.mx',
    'alejandro.gallardo@autostrefa.mx',
    'emmanuel.carranza@autostrefa.mx',
    'fernando.trevino@autostrefa.mx',
    'lizeth.juarez@autostrefa.mx',
];

const ADMIN_DOMAIN = 'autostrefa.mx';

const isAdminEmail = (email: string | undefined | null): boolean => {
    if (!email) return false;
    const normalizedEmail = email.toLowerCase().trim();
    return ADMIN_EMAILS.includes(normalizedEmail) || normalizedEmail.endsWith(`@${ADMIN_DOMAIN}`);
};

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();

  // Explicitly provide Supabase credentials to avoid environment variable issues
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mhlztgilrmgebkyqowxz.supabase.co';
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1obHp0Z2lscm1nZWJreXFvd3h6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYxMjI5MjAsImV4cCI6MjA4MTY5ODkyMH0.jdLFYjqoEnFQBAVd8zuZI0oq5NAo9uIy73fiRjgmSwI';

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
    '/proteccion-de-datos',
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
    '/registro',  // Registration page
    '/auth',      // Auth callback page
    '/admin/login',
    '/bank-login',
    '/api',
    '/_next',
    '/favicon.ico',
  ];

  // Check if current path is public
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));

  // Auth-only routes (redirect to dashboard if logged in)
  const authOnlyRoutes = ['/acceder', '/registro', '/admin/login', '/bank-login'];
  const isAuthOnlyRoute = authOnlyRoutes.some(route => pathname.startsWith(route));

  if (isAuthOnlyRoute && session) {
    // Special handling for bank login - check if user is bank rep
    if (pathname.startsWith('/bank-login')) {
      const { data: bankRep } = await supabase
        .from('bank_representative_profiles')
        .select('id')
        .eq('id', session.user.id)
        .maybeSingle();

      if (bankRep) {
        const url = req.nextUrl.clone();
        url.pathname = '/bank-dashboard';
        return NextResponse.redirect(url);
      }
    }

    // Check for redirect parameter in URL
    const redirectParam = req.nextUrl.searchParams.get('redirect');

    // Determine default redirect based on user email/role
    let defaultRedirect = '/escritorio';

    // Check if user is admin by email
    if (isAdminEmail(session.user.email)) {
      defaultRedirect = '/escritorio/admin/dashboard';
    } else {
      // Check profile role
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .maybeSingle();

      if (profile?.role === 'admin') {
        defaultRedirect = '/escritorio/admin/dashboard';
      } else if (profile?.role === 'sales') {
        defaultRedirect = '/escritorio/dashboard';
      }
    }

    // Redirect to dashboard if already logged in
    const url = req.nextUrl.clone();
    url.pathname = redirectParam || defaultRedirect;
    url.searchParams.delete('redirect'); // Remove redirect param to avoid loops
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

    // Check if user is admin by email first (bypass profile check)
    const userIsAdminByEmail = isAdminEmail(session.user.email);

    // Get user profile for role checking (only if not admin by email)
    let userRole = userIsAdminByEmail ? 'admin' : 'user';

    if (!userIsAdminByEmail) {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .maybeSingle();

      // If profile doesn't exist, default to 'user' role
      // Profile will be created by a database trigger or the AuthContext
      if (profileError) {
        console.error('Error fetching user profile:', profileError);
      }

      userRole = profile?.role || 'user';
    }

    // Admin-only routes
    if (pathname.startsWith('/escritorio/admin')) {
      if (userRole !== 'admin' && !userIsAdminByEmail) {
        const url = req.nextUrl.clone();
        url.pathname = '/escritorio';
        url.searchParams.set('error', 'unauthorized');
        return NextResponse.redirect(url);
      }
    }

    // Sales routes (admin and sales roles)
    if (pathname.startsWith('/escritorio/ventas') || pathname === '/escritorio/dashboard') {
      if (!['admin', 'sales'].includes(userRole) && !userIsAdminByEmail) {
        const url = req.nextUrl.clone();
        url.pathname = '/escritorio';
        url.searchParams.set('error', 'unauthorized');
        return NextResponse.redirect(url);
      }
    }
  }

  // Bank Portal routes - require bank representative authentication
  if (pathname.startsWith('/bank-dashboard')) {
    if (!session) {
      // Redirect to bank login
      const url = req.nextUrl.clone();
      url.pathname = '/bank-login';
      url.searchParams.set('redirect', pathname);
      return NextResponse.redirect(url);
    }

    // Check if user is an approved bank representative
    const { data: bankRep, error: bankRepError } = await supabase
      .from('bank_representative_profiles')
      .select('is_approved, is_active')
      .eq('id', session.user.id)
      .maybeSingle();

    if (bankRepError || !bankRep) {
      // Not a bank representative
      const url = req.nextUrl.clone();
      url.pathname = '/bank-login';
      url.searchParams.set('error', 'not_bank_rep');
      return NextResponse.redirect(url);
    }

    if (!bankRep.is_approved) {
      // Bank representative not yet approved - allow access but show pending message
      // The page components will handle showing the approval pending state
      return res;
    }

    if (!bankRep.is_active) {
      // Bank representative account is inactive
      const url = req.nextUrl.clone();
      url.pathname = '/bank-login';
      url.searchParams.set('error', 'account_inactive');
      return NextResponse.redirect(url);
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