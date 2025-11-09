import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Api-Key, X-Api-Secret',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

/**
 * Intelimotor API Proxy
 *
 * This endpoint proxies requests to Intelimotor API, hiding credentials from frontend.
 * Used for vehicle valuations in the "Vende tu Auto" feature.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url, method, headers, body: requestBody } = body;

    if (!url) {
      return NextResponse.json(
        { error: "Missing 'url' in request body" },
        { status: 400 }
      );
    }

    // Extract API credentials from request headers
    const apiKey = request.headers.get('x-api-key');
    const apiSecret = request.headers.get('x-api-secret');

    if (!apiKey || !apiSecret) {
      console.error('Missing Intelimotor credentials in headers');
      return NextResponse.json(
        { error: 'Missing API Key or API Secret in request headers' },
        { status: 401 }
      );
    }

    // Add apiKey and apiSecret as query parameters to the URL
    const targetUrl = new URL(url);
    targetUrl.searchParams.set('apiKey', apiKey);
    targetUrl.searchParams.set('apiSecret', apiSecret);

    // Add lite=true for GET requests or if in POST body
    if (method === 'GET' || (requestBody && requestBody.lite === true)) {
      targetUrl.searchParams.set('lite', 'true');
      console.log('✓ Added lite=true to query params');
    }

    console.log('Intelimotor proxy request:', {
      url: targetUrl.toString(),
      method,
      hasApiKey: !!apiKey,
      hasApiSecret: !!apiSecret,
      hasLite: targetUrl.searchParams.has('lite')
    });

    // Make request to Intelimotor API with credentials as query params
    const fetchOptions: RequestInit = {
      method: method || 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    };

    // Only add body for non-GET requests
    if (method !== 'GET' && requestBody) {
      fetchOptions.body = JSON.stringify(requestBody);
    }

    const response = await fetch(targetUrl.toString(), fetchOptions);
    const data = await response.json();

    if (!response.ok) {
      console.error('Intelimotor API error:', {
        status: response.status,
        url: targetUrl.toString(),
        data
      });
      return NextResponse.json(data, { status: response.status });
    }

    console.log('Intelimotor API success:', {
      status: response.status,
      url: targetUrl.toString()
    });

    return NextResponse.json(data, { headers: corsHeaders });
  } catch (error) {
    console.error('Intelimotor proxy error:', error);
    return NextResponse.json(
      {
        error: 'Proxy request failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500, headers: corsHeaders }
    );
  }
}
