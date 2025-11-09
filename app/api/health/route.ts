import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Health Check Endpoint
 *
 * Used by Cloud Run and monitoring services to check if the app is running.
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'trefa-auto-inventory',
  });
}
