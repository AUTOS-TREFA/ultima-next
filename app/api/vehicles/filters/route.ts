/**
 * API Route: /api/vehicles/filters
 *
 * Endpoint con cache agresivo para opciones de filtros.
 * Estas opciones cambian raramente (cuando se agregan nuevas marcas, años, etc.)
 * por lo que se cachean por 24 horas.
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

// Revalidación ISR - 24 horas
export const revalidate = 86400;

const FILTER_OPTIONS_CACHE_KEY = 'vehicles:filter-options';

/**
 * Obtiene las opciones de filtros disponibles
 */
async function fetchFilterOptions() {
  const { data, error } = await supabase.rpc('get_filter_options');

  if (error) {
    throw error;
  }

  return data || {};
}

/**
 * Función cacheada para opciones de filtros
 * Cache más largo porque estos datos cambian muy poco
 */
const getCachedFilterOptions = unstable_cache(
  fetchFilterOptions,
  ['filter-options'],
  {
    revalidate: CACHE_TTL.FILTER_OPTIONS,
    tags: [CACHE_TAGS.FILTERS, CACHE_TAGS.FILTER_OPTIONS],
  }
);

export async function GET(request: NextRequest) {
  try {
    // 1. Verificar cache en memoria (más rápido)
    const memoryCached = serverCache.get<any>(FILTER_OPTIONS_CACHE_KEY);
    if (memoryCached) {
      const etag = generateETag(memoryCached);

      // Si el cliente ya tiene los datos, retornar 304
      if (isClientCacheValid(request.headers, etag)) {
        return new NextResponse(null, {
          status: 304,
          headers: createCacheHeaders('LONG', etag),
        });
      }

      return NextResponse.json(memoryCached, {
        headers: createCacheHeaders('LONG', etag, {
          'X-Cache-Status': 'HIT',
        }),
      });
    }

    // 2. Obtener de cache de Next.js o DB
    const filterOptions = await getCachedFilterOptions();

    // 3. Guardar en cache de memoria
    serverCache.set(FILTER_OPTIONS_CACHE_KEY, filterOptions, CACHE_TTL.FILTER_OPTIONS);

    // 4. Generar ETag
    const etag = generateETag(filterOptions);

    // Verificar si cliente ya tiene los datos
    if (isClientCacheValid(request.headers, etag)) {
      return new NextResponse(null, {
        status: 304,
        headers: createCacheHeaders('LONG', etag),
      });
    }

    return NextResponse.json(filterOptions, {
      headers: createCacheHeaders('LONG', etag, {
        'X-Cache-Status': 'MISS',
      }),
    });
  } catch (error) {
    console.error('[API/vehicles/filters] Error:', error);
    return NextResponse.json(
      { error: 'Error al obtener opciones de filtros' },
      { status: 500, headers: { 'Cache-Control': 'no-store' } }
    );
  }
}
