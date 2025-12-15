/**
 * API Route: /api/vehicles/[slug]
 *
 * Endpoint cacheado para obtener detalle de un vehículo.
 * Implementa caching agresivo ya que los detalles cambian poco.
 */

import { NextRequest, NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';
import { supabase } from '@/../supabaseClient';
import {
  CACHE_TTL,
  CACHE_TAGS,
  serverCache,
  getVehicleDetailCacheKey,
  generateETag,
  createCacheHeaders,
  isClientCacheValid,
} from '@/lib/cache';

export const runtime = 'nodejs';

// Revalidación ISR - 1 hora
export const revalidate = 3600;

/**
 * Obtiene un vehículo por slug
 */
async function fetchVehicleBySlug(slug: string) {
  const { data, error } = await supabase
    .from('inventario_cache')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // No encontrado
    }
    throw error;
  }

  return data;
}

/**
 * Función cacheada para obtener vehículo
 */
const getCachedVehicle = unstable_cache(
  async (slug: string) => {
    return fetchVehicleBySlug(slug);
  },
  ['vehicle-detail'],
  {
    revalidate: CACHE_TTL.VEHICLE_DETAIL,
    tags: [CACHE_TAGS.VEHICLES, CACHE_TAGS.VEHICLE_DETAIL],
  }
);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    if (!slug) {
      return NextResponse.json(
        { error: 'Slug es requerido' },
        { status: 400 }
      );
    }

    const cacheKey = getVehicleDetailCacheKey(slug);

    // 1. Verificar cache en memoria
    const memoryCached = serverCache.get<any>(cacheKey);
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
        }),
      });
    }

    // 2. Obtener de cache o DB
    const vehicle = await getCachedVehicle(slug);

    if (!vehicle) {
      return NextResponse.json(
        { error: 'Vehículo no encontrado' },
        { status: 404, headers: { 'Cache-Control': 'no-store' } }
      );
    }

    // 3. Guardar en cache de memoria
    serverCache.set(cacheKey, vehicle, CACHE_TTL.VEHICLE_DETAIL);

    // 4. Responder con headers de cache
    const etag = generateETag(vehicle);

    if (isClientCacheValid(request.headers, etag)) {
      return new NextResponse(null, {
        status: 304,
        headers: createCacheHeaders('LONG', etag),
      });
    }

    return NextResponse.json(vehicle, {
      headers: createCacheHeaders('LONG', etag, {
        'X-Cache-Status': 'MISS',
      }),
    });
  } catch (error) {
    console.error('[API/vehicles/slug] Error:', error);
    return NextResponse.json(
      { error: 'Error al obtener vehículo' },
      { status: 500, headers: { 'Cache-Control': 'no-store' } }
    );
  }
}
