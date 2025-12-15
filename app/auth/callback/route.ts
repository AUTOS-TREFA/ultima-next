import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Auth Callback Route Handler
 *
 * Handles the server-side code exchange for Supabase auth.
 * Used when Supabase redirects back after email verification.
 *
 * URL pattern: /auth/callback?code=xxx&redirect=/vender-mi-auto
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const redirectTo = requestUrl.searchParams.get('redirect') || '/escritorio';
  const error = requestUrl.searchParams.get('error');
  const errorDescription = requestUrl.searchParams.get('error_description');

  // Handle errors from Supabase
  if (error) {
    const errorUrl = new URL('/auth', requestUrl.origin);
    errorUrl.searchParams.set('error', error);
    if (errorDescription) {
      errorUrl.searchParams.set('error_description', errorDescription);
    }
    return NextResponse.redirect(errorUrl);
  }

  // If we have a code, redirect to the auth page to handle client-side exchange
  // This ensures the session is properly set in the browser
  if (code) {
    const authUrl = new URL('/auth', requestUrl.origin);
    authUrl.searchParams.set('code', code);
    authUrl.searchParams.set('redirect', redirectTo);
    return NextResponse.redirect(authUrl);
  }

  // No code, redirect to login
  return NextResponse.redirect(new URL('/acceder', requestUrl.origin));
}
