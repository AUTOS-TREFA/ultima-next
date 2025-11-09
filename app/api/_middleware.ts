import { NextRequest, NextResponse } from 'next/server';

/**
 * CORS Configuration
 *
 * Allows requests from specific domains for API endpoints.
 */
const ALLOWED_ORIGINS = [
  process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  'https://trefa.mx',
  'https://www.trefa.mx',
  'https://staging.trefa.mx',
].filter(Boolean);

export function corsHeaders(origin: string | null) {
  const isAllowed = origin && ALLOWED_ORIGINS.includes(origin);

  return {
    'Access-Control-Allow-Origin': isAllowed ? origin : ALLOWED_ORIGINS[0],
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, PATCH',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, Accept, Origin, X-Api-Key, X-Api-Secret',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400',
  };
}

/**
 * Handle CORS Preflight Requests
 */
export function handleCORS(request: NextRequest) {
  const origin = request.headers.get('origin');

  if (request.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 200,
      headers: corsHeaders(origin),
    });
  }

  return null;
}

/**
 * Add CORS Headers to Response
 */
export function withCORS(response: NextResponse, origin: string | null) {
  const headers = corsHeaders(origin);
  Object.entries(headers).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  return response;
}
