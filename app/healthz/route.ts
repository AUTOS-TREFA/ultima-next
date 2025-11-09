import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Health Check Endpoint (Legacy)
 *
 * Compatibility endpoint for existing monitoring setups.
 */
export async function GET() {
  return new NextResponse('ok', {
    status: 200,
    headers: {
      'Content-Type': 'text/plain',
    },
  });
}
