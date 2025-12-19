import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

// HARDCODED BASE URL - prevents issues with localhost redirects
const BASE_URL = 'https://autostrefa.mx';

/**
 * Auth Callback Route Handler
 *
 * Handles the server-side code exchange for Supabase auth.
 * Used when Supabase redirects back after OAuth or email magic link.
 *
 * URL pattern: /auth/callback?code=xxx&redirect=/vender-mi-auto
 *
 * IMPORTANT: This route uses @supabase/auth-helpers-nextjs to properly
 * set session cookies, which are required for the middleware to work.
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const redirectTo = requestUrl.searchParams.get('redirect') || '/escritorio';
  const error = requestUrl.searchParams.get('error');
  const errorDescription = requestUrl.searchParams.get('error_description');

  // Handle errors from Supabase
  if (error) {
    const errorUrl = new URL('/auth', BASE_URL);
    errorUrl.searchParams.set('error', error);
    if (errorDescription) {
      errorUrl.searchParams.set('error_description', errorDescription);
    }
    return NextResponse.redirect(errorUrl);
  }

  // If we have a code, exchange it for a session using auth-helpers
  // This properly sets the session cookies needed by the middleware
  if (code) {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    try {
      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

      if (exchangeError) {
        console.error('[Auth Callback] Error exchanging code:', exchangeError);
        const errorUrl = new URL('/auth', BASE_URL);
        errorUrl.searchParams.set('error', 'exchange_failed');
        errorUrl.searchParams.set('error_description', exchangeError.message);
        return NextResponse.redirect(errorUrl);
      }

      // Successfully exchanged code - redirect to the intended destination
      console.log('[Auth Callback] Code exchanged successfully, redirecting to:', redirectTo);
      return NextResponse.redirect(new URL(redirectTo, BASE_URL));
    } catch (e: any) {
      console.error('[Auth Callback] Unexpected error:', e);
      const errorUrl = new URL('/auth', BASE_URL);
      errorUrl.searchParams.set('error', 'unexpected_error');
      errorUrl.searchParams.set('error_description', e.message || 'Error inesperado');
      return NextResponse.redirect(errorUrl);
    }
  }

  // No code, redirect to login
  return NextResponse.redirect(new URL('/acceder', BASE_URL));
}
