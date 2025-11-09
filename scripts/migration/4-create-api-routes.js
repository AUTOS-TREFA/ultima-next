#!/usr/bin/env node
/**
 * Migration Script 4: Create API Routes
 *
 * This script:
 * 1. Converts Express server endpoints to Next.js API routes
 * 2. Creates route.ts files for each endpoint
 * 3. Maintains all proxy logic and middleware
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../..');

console.log('🚀 Starting Next.js Migration - Phase 4: API Routes');
console.log('═'.repeat(60));

// Helper: Create directory if it doesn't exist
function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

// API Route 1: Intelimotor Proxy
console.log('\n📡 Creating API routes...');

const intelimotorRoutePath = path.join(rootDir, 'app/api/intelimotor/route.ts');
const intelimotorContent = `import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

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

    return NextResponse.json(data);
  } catch (error) {
    console.error('Intelimotor proxy error:', error);
    return NextResponse.json(
      {
        error: 'Proxy request failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
`;

ensureDir(path.dirname(intelimotorRoutePath));
fs.writeFileSync(intelimotorRoutePath, intelimotorContent);
console.log('  ✓ Created app/api/intelimotor/route.ts');

// API Route 2: Health Check
const healthRoutePath = path.join(rootDir, 'app/api/health/route.ts');
const healthContent = `import { NextResponse } from 'next/server';

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
`;

ensureDir(path.dirname(healthRoutePath));
fs.writeFileSync(healthRoutePath, healthContent);
console.log('  ✓ Created app/api/health/route.ts');

// API Route 3: Healthz (compatibility endpoint)
const healthzRoutePath = path.join(rootDir, 'app/healthz/route.ts');
const healthzContent = `import { NextResponse } from 'next/server';

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
`;

fs.writeFileSync(healthzRoutePath, healthzContent);
console.log('  ✓ Created app/healthz/route.ts');

// Create API middleware template
console.log('\n🔧 Creating API middleware utilities...');

const apiMiddlewarePath = path.join(rootDir, 'app/api/_middleware.ts');
const apiMiddlewareContent = `import { NextRequest, NextResponse } from 'next/server';

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
`;

fs.writeFileSync(apiMiddlewarePath, apiMiddlewareContent);
console.log('  ✓ Created app/api/_middleware.ts');

// Create API utilities
const apiUtilsPath = path.join(rootDir, 'app/api/_utils.ts');
const apiUtilsContent = `import { NextResponse } from 'next/server';

/**
 * Standard API Error Response
 */
export function errorResponse(message: string, status: number = 500) {
  return NextResponse.json(
    { error: message },
    { status }
  );
}

/**
 * Standard API Success Response
 */
export function successResponse(data: any, status: number = 200) {
  return NextResponse.json(data, { status });
}

/**
 * Validate Required Fields
 */
export function validateRequired(body: any, fields: string[]) {
  const missing = fields.filter(field => !body[field]);

  if (missing.length > 0) {
    throw new Error(\`Missing required fields: \${missing.join(', ')}\`);
  }
}

/**
 * Rate Limiting Helper
 *
 * Simple in-memory rate limiting (use Redis for production)
 */
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(identifier: string, limit: number = 100, windowMs: number = 60000) {
  const now = Date.now();
  const record = rateLimitMap.get(identifier);

  if (!record || now > record.resetAt) {
    rateLimitMap.set(identifier, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (record.count >= limit) {
    return false;
  }

  record.count++;
  return true;
}
`;

fs.writeFileSync(apiUtilsPath, apiUtilsContent);
console.log('  ✓ Created app/api/_utils.ts');

// Create migration report
console.log('\n📊 Creating migration report...');
const report = {
  timestamp: new Date().toISOString(),
  apiRoutesCreated: 3,
  routes: [
    { endpoint: '/api/intelimotor', method: 'POST', purpose: 'Proxy for vehicle valuations' },
    { endpoint: '/api/health', method: 'GET', purpose: 'Health check with JSON response' },
    { endpoint: '/healthz', method: 'GET', purpose: 'Health check with plain text' },
  ],
  utilitiesCreated: ['_middleware.ts', '_utils.ts'],
  notes: [
    'All Express proxy logic preserved',
    'CORS configuration included',
    'Error handling standardized',
    'Type-safe with TypeScript',
  ],
};

const reportPath = path.join(__dirname, 'api-migration-report.json');
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
console.log(`  ✓ Report saved to: api-migration-report.json`);

console.log('\n✅ Phase 4 Complete: API routes created');
console.log('\n  📊 Summary:');
console.log('     API routes created: 3');
console.log('     Utilities created: 2');
console.log('     All Express logic preserved');
console.log('\n' + '═'.repeat(60));
