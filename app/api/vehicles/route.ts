/**
 * API Route: /api/vehicles
 *
 * Endpoint cacheado para obtener lista de vehículos con filtros.
 * Implementa caching multi-capa:
 * - Cache en memoria del servidor
 * - Headers HTTP para CDN/edge caching
 * - ETag para validación condicional
 */

import { NextRequest, NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';
import { supabase } from '@/../supabaseClient';
import {
  CACHE_TTL,
  CACHE_TAGS,
  serverCache,
  getVehicleListCacheKey,
  generateETag,
  createCacheHeaders,
  isClientCacheValid,
  deduplicatedFetch,
} from '@/lib/cache';

export const runtime = 'nodejs';

// Revalidación ISR - 15 minutos
export const revalidate = 900;

interface VehicleFilters {
  marca?: string[];
  autoano?: number[];
  transmision?: string[];
  combustible?: string[];
  garantia?: string[];
  carroceria?: string[];
  ubicacion?: string[];
  promociones?: string[];
  minPrice?: number;
  maxPrice?: number;
  enganchemin?: number;
  maxEnganche?: number;
  hideSeparado?: boolean;
  search?: string;
  orderby?: string;
}

const VEHICLES_PER_PAGE = 21;

/**
 * Parsea los filtros de la URL
 */
function parseFilters(searchParams: URLSearchParams): VehicleFilters {
  const filters: VehicleFilters = {};

  // Array filters
  const marca = searchParams.getAll('marca');
  if (marca.length) filters.marca = marca;

  const autoano = searchParams.getAll('autoano');
  if (autoano.length) filters.autoano = autoano.map(y => parseInt(y, 10)).filter(y => !isNaN(y));

  const transmision = searchParams.getAll('transmision');
  if (transmision.length) filters.transmision = transmision;

  const combustible = searchParams.getAll('combustible');
  if (combustible.length) filters.combustible = combustible;

  const garantia = searchParams.getAll('garantia');
  if (garantia.length) filters.garantia = garantia;

  const carroceria = searchParams.getAll('carroceria');
  if (carroceria.length) filters.carroceria = carroceria;

  const ubicacion = searchParams.getAll('ubicacion');
  if (ubicacion.length) filters.ubicacion = ubicacion;

  const promociones = searchParams.getAll('promociones');
  if (promociones.length) filters.promociones = promociones;

  // Range filters
  const minPrice = searchParams.get('minPrice');
  if (minPrice) filters.minPrice = parseInt(minPrice, 10);

  const maxPrice = searchParams.get('maxPrice');
  if (maxPrice) filters.maxPrice = parseInt(maxPrice, 10);

  const enganchemin = searchParams.get('enganchemin');
  if (enganchemin) filters.enganchemin = parseInt(enganchemin, 10);

  const maxEnganche = searchParams.get('maxEnganche');
  if (maxEnganche) filters.maxEnganche = parseInt(maxEnganche, 10);

  // Boolean filters
  if (searchParams.get('hideSeparado') === 'true') {
    filters.hideSeparado = true;
  }

  // Search
  const search = searchParams.get('search');
  if (search) filters.search = search;

  // Ordering
  const orderby = searchParams.get('orderby');
  if (orderby) filters.orderby = orderby;

  return filters;
}

/**
 * Construye y ejecuta la query de Supabase
 */
async function fetchVehiclesFromDB(
  filters: VehicleFilters,
  page: number
): Promise<{ vehicles: any[]; totalCount: number }> {
  const reverseSucursalMapping: Record<string, string> = {
    'Monterrey': 'MTY',
    'Guadalupe': 'GPE',
    'Reynosa': 'TMPS',
    'Saltillo': 'COAH'
  };

  let query = supabase
    .from('inventario_cache')
    .select('*', { count: 'exact' });

  // Base filters - only show vehicles approved for public exhibition
  query = query.eq('exhibicion_inventario', true);

  if (filters.hideSeparado) {
    query = query.or('separado.eq.false,separado.is.null');
  }

  // Direct equality filters
  if (filters.marca?.length) {
    query = query.in('marca', filters.marca);
  }
  if (filters.autoano?.length) {
    query = query.in('autoano', filters.autoano);
  }
  if (filters.transmision?.length) {
    query = query.in('transmision', filters.transmision);
  }
  if (filters.combustible?.length) {
    query = query.in('combustible', filters.combustible);
  }
  if (filters.garantia?.length) {
    query = query.in('garantia', filters.garantia);
  }

  // Range filters
  if (filters.minPrice) {
    query = query.gte('precio', filters.minPrice);
  }
  if (filters.maxPrice) {
    query = query.lte('precio', filters.maxPrice);
  }
  if (filters.enganchemin) {
    query = query.gte('enganchemin', filters.enganchemin);
  }
  if (filters.maxEnganche) {
    query = query.lte('enganchemin', filters.maxEnganche);
  }

  // Carroceria filter
  if (filters.carroceria?.length) {
    const carroceriaConditions = filters.carroceria
      .map(c => {
        const lowerVal = c.toLowerCase();
        return `carroceria.ilike.%${lowerVal}%,clasificacionid.ilike.%${lowerVal}%`;
      })
      .join(',');
    query = query.or(carroceriaConditions);
  }

  // Ubicacion filter
  if (filters.ubicacion?.length) {
    const rawSucursales = filters.ubicacion.map(s => reverseSucursalMapping[s] || s);
    query = query.in('ubicacion', rawSucursales);
  }

  // Promociones filter
  if (filters.promociones?.length) {
    query = query.overlaps('promociones', filters.promociones);
  }

  // Search filter - use RPC for full-text search
  if (filters.search) {
    const { data: searchData, error: searchError } = await supabase.rpc('search_vehicles', {
      search_term: filters.search
    });

    if (!searchError && Array.isArray(searchData)) {
      const vehicleIds = searchData.map((v: any) => v.id);
      if (vehicleIds.length === 0) {
        return { vehicles: [], totalCount: 0 };
      }
      query = query.in('id', vehicleIds);
    }
  }

  // Pagination
  const from = (page - 1) * VEHICLES_PER_PAGE;
  const to = from + VEHICLES_PER_PAGE - 1;
  query = query.range(from, to);

  // Ordering
  if (filters.orderby) {
    if (filters.orderby === 'relevance') {
      query = query.order('view_count', { ascending: false, nullsFirst: false });
    } else {
      const [field, direction] = filters.orderby.split('-');
      const fieldMap: Record<string, string> = {
        price: 'precio',
        year: 'autoano',
        mileage: 'kilometraje'
      };
      const mappedField = fieldMap[field] || field;
      query = query.order(mappedField, { ascending: direction === 'asc' });
    }
  } else if (!filters.search) {
    query = query.order('updated_at', { ascending: false });
  }

  const { data, error, count } = await query;

  if (error) {
    throw error;
  }

  return {
    vehicles: data || [],
    totalCount: count || 0,
  };
}

/**
 * Función cacheada para obtener vehículos
 */
const getCachedVehicles = unstable_cache(
  async (filters: VehicleFilters, page: number) => {
    return fetchVehiclesFromDB(filters, page);
  },
  ['vehicles-list'],
  {
    revalidate: CACHE_TTL.VEHICLE_LIST,
    tags: [CACHE_TAGS.VEHICLES, CACHE_TAGS.VEHICLE_LIST],
  }
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const filters = parseFilters(searchParams);

    // Generar cache key para deduplicación y cache en memoria
    const cacheKey = getVehicleListCacheKey(filters, page);

    // 1. Verificar cache en memoria del servidor (más rápido)
    const memoryCached = serverCache.get<{ vehicles: any[]; totalCount: number }>(cacheKey);
    if (memoryCached) {
      const etag = generateETag(memoryCached);

      // Verificar ETag del cliente
      if (isClientCacheValid(request.headers, etag)) {
        return new NextResponse(null, {
          status: 304,
          headers: createCacheHeaders('MEDIUM', etag),
        });
      }

      return NextResponse.json(memoryCached, {
        headers: createCacheHeaders('MEDIUM', etag),
      });
    }

    // 2. Obtener datos con deduplicación
    const result = await deduplicatedFetch(cacheKey, async () => {
      return getCachedVehicles(filters, page);
    });

    // 3. Guardar en cache de memoria del servidor
    serverCache.set(cacheKey, result, CACHE_TTL.VEHICLE_LIST);

    // 4. Generar ETag y responder
    const etag = generateETag(result);

    // Verificar si el cliente ya tiene los datos
    if (isClientCacheValid(request.headers, etag)) {
      return new NextResponse(null, {
        status: 304,
        headers: createCacheHeaders('MEDIUM', etag),
      });
    }

    return NextResponse.json(result, {
      headers: createCacheHeaders('MEDIUM', etag, {
        'X-Cache-Status': 'MISS',
      }),
    });
  } catch (error) {
    console.error('[API/vehicles] Error:', error);
    return NextResponse.json(
      { error: 'Error al obtener vehículos' },
      { status: 500, headers: { 'Cache-Control': 'no-store' } }
    );
  }
}
