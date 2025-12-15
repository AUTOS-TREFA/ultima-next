/**
 * API Route: /api/cache/revalidate
 *
 * Endpoint para invalidar cache manualmente o desde webhooks.
 * Protegido con API key.
 *
 * Uso:
 * POST /api/cache/revalidate
 * Headers: { "x-api-key": "..." }
 * Body: { "tags": ["vehicles", "filters"], "paths": ["/autos"] }
 */

import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag, revalidatePath } from 'next/cache';
import { serverCache, CACHE_TAGS } from '@/lib/cache';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Validar API key
function validateApiKey(request: NextRequest): boolean {
  const apiKey = request.headers.get('x-api-key');
  const validKey = process.env.CACHE_REVALIDATE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // En desarrollo permitir sin key
  if (process.env.NODE_ENV === 'development') {
    return true;
  }

  return apiKey === validKey;
}

export async function POST(request: NextRequest) {
  // Validar autenticación
  if (!validateApiKey(request)) {
    return NextResponse.json(
      { error: 'No autorizado' },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const { tags, paths, clearMemory } = body as {
      tags?: string[];
      paths?: string[];
      clearMemory?: boolean;
    };

    const results: {
      tags: string[];
      paths: string[];
      memoryCacheCleared: boolean;
    } = {
      tags: [],
      paths: [],
      memoryCacheCleared: false,
    };

    // Revalidar por tags
    if (tags && tags.length > 0) {
      for (const tag of tags) {
        // Validar que el tag existe en nuestros tags conocidos
        const validTags = Object.values(CACHE_TAGS);
        if (validTags.includes(tag as any)) {
          revalidateTag(tag);
          results.tags.push(tag);
        }
      }
    }

    // Revalidar por paths
    if (paths && paths.length > 0) {
      for (const path of paths) {
        revalidatePath(path);
        results.paths.push(path);
      }
    }

    // Limpiar cache en memoria
    if (clearMemory) {
      serverCache.clear();
      results.memoryCacheCleared = true;
    }

    return NextResponse.json({
      success: true,
      message: 'Cache invalidado exitosamente',
      results,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[API/cache/revalidate] Error:', error);
    return NextResponse.json(
      { error: 'Error al invalidar cache' },
      { status: 500 }
    );
  }
}

/**
 * GET para verificar estado del cache
 */
export async function GET(request: NextRequest) {
  if (!validateApiKey(request)) {
    return NextResponse.json(
      { error: 'No autorizado' },
      { status: 401 }
    );
  }

  const stats = serverCache.getStats();

  return NextResponse.json({
    status: 'ok',
    memoryCache: stats,
    availableTags: Object.values(CACHE_TAGS),
    timestamp: new Date().toISOString(),
  });
}
