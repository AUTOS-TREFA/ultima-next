import { NextResponse } from 'next/server';

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
    throw new Error(`Missing required fields: ${missing.join(', ')}`);
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
