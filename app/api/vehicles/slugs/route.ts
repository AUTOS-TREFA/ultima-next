/**
 * API Route: /api/vehicles/slugs
 *
 * Endpoint para obtener todos los slugs de vehículos.
 * Usado principalmente para SSG (generateStaticParams).
 * Cache de 12 horas ya que los slugs cambian poco.
 */

import { NextRequest, NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';
import { supabase } from '@/../supabaseClient';
import {
  CACHE_TTL,
  CACHE_TAGS,
  serverCache,
  generateETag,
  createCacheHeaders,
  isClientCacheValid,
} from '@/lib/cache';

export const runtime = 'nodejs';

// Revalidación ISR - 12 horas
export const revalidate = 43200;

const SLUGS_CACHE_KEY = 'vehicles:all-slugs';

/**
 * Obtiene todos los slugs de vehículos disponibles
 */
async function fetchAllSlugs() {
  const { data, error } = await supabase
    .from('inventario_cache')
    .select('slug')
    .eq('exhibicion_inventario', true)
    .order('updated_at', { ascending: false });

  if (error) {
    throw error;
  }

  return data || [];
}

/**
 * Función cacheada para slugs
 */
const getCachedSlugs = unstable_cache(
  fetchAllSlugs,
  ['all-slugs'],
  {
    revalidate: CACHE_TTL.ALL_SLUGS,
    tags: [CACHE_TAGS.VEHICLES, CACHE_TAGS.SLUGS],
  }
);

export async function GET(request: NextRequest) {
  try {
    // 1. Verificar cache en memoria
    const memoryCached = serverCache.get<{ slug: string }[]>(SLUGS_CACHE_KEY);
    if (memoryCached) {
      const etag = generateETag(memoryCached);

      if (isClientCacheValid(request.headers, etag)) {
        return new NextResponse(null, {
          status: 304,
          headers: createCacheHeaders('LONG', etag),
        });
      }

      return NextResponse.json(memoryCached, {
        headers: createCacheHeaders('LONG', etag, {
          'X-Cache-Status': 'HIT',
          'X-Slug-Count': memoryCached.length.toString(),
        }),
      });
    }

    // 2. Obtener de cache o DB
    const slugs = await getCachedSlugs();

    // 3. Guardar en cache de memoria
    serverCache.set(SLUGS_CACHE_KEY, slugs, CACHE_TTL.ALL_SLUGS);

    // 4. Responder
    const etag = generateETag(slugs);

    if (isClientCacheValid(request.headers, etag)) {
      return new NextResponse(null, {
        status: 304,
        headers: createCacheHeaders('LONG', etag),
      });
    }

    return NextResponse.json(slugs, {
      headers: createCacheHeaders('LONG', etag, {
        'X-Cache-Status': 'MISS',
        'X-Slug-Count': slugs.length.toString(),
      }),
    });
  } catch (error) {
    console.error('[API/vehicles/slugs] Error:', error);
    return NextResponse.json(
      { error: 'Error al obtener slugs' },
      { status: 500, headers: { 'Cache-Control': 'no-store' } }
    );
  }
}
