/**
 * Server-Side Caching Utilities
 *
 * Implementa caching multi-capa para Next.js:
 * - unstable_cache de Next.js para datos de servidor
 * - Cache headers HTTP para CDN/edge
 * - Helpers para invalidación de cache
 */

import { unstable_cache } from 'next/cache';

// =============================================================================
// CACHE TAGS - Usados para invalidación selectiva
// =============================================================================

export const CACHE_TAGS = {
  VEHICLES: 'vehicles',
  VEHICLE_LIST: 'vehicle-list',
  VEHICLE_DETAIL: 'vehicle-detail',
  FILTERS: 'filters',
  FILTER_OPTIONS: 'filter-options',
  SEARCH: 'search',
  SLUGS: 'slugs',
  POPULAR: 'popular',
} as const;

// =============================================================================
// TTL CONFIGURATIONS - Tiempos de vida del cache
// =============================================================================

export const CACHE_TTL = {
  // Datos que cambian raramente (1-24 horas)
  FILTER_OPTIONS: 24 * 60 * 60, // 24 horas - opciones de filtros (marcas, años, etc.)
  ALL_SLUGS: 12 * 60 * 60, // 12 horas - lista de slugs para SSG

  // Datos que cambian moderadamente (15 min - 1 hora)
  VEHICLE_LIST: 15 * 60, // 15 minutos - lista de vehículos
  VEHICLE_DETAIL: 60 * 60, // 1 hora - detalle de vehículo individual
  SEARCH_RESULTS: 30 * 60, // 30 minutos - resultados de búsqueda

  // Datos dinámicos (1-5 minutos)
  POPULAR_VEHICLES: 5 * 60, // 5 minutos - vehículos populares
  REAL_TIME: 60, // 1 minuto - datos casi en tiempo real
} as const;

// =============================================================================
// CACHE HEADERS - Para respuestas HTTP
// =============================================================================

export const CACHE_HEADERS = {
  /**
   * Cache inmutable para assets estáticos
   * 1 año, inmutable (no revalidar nunca)
   */
  IMMUTABLE: {
    'Cache-Control': 'public, max-age=31536000, immutable',
  },

  /**
   * Cache para datos de larga duración
   * Público, 1 día, stale-while-revalidate de 1 semana
   */
  LONG: {
    'Cache-Control': 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800',
  },

  /**
   * Cache para datos moderadamente dinámicos
   * Público, 15 minutos, stale-while-revalidate de 1 hora
   */
  MEDIUM: {
    'Cache-Control': 'public, max-age=900, s-maxage=900, stale-while-revalidate=3600',
  },

  /**
   * Cache para datos dinámicos
   * Público, 1 minuto, stale-while-revalidate de 5 minutos
   */
  SHORT: {
    'Cache-Control': 'public, max-age=60, s-maxage=60, stale-while-revalidate=300',
  },

  /**
   * Sin cache - para datos privados o en tiempo real
   */
  NO_CACHE: {
    'Cache-Control': 'no-store, no-cache, must-revalidate',
  },

  /**
   * Cache privado (solo en navegador, no CDN)
   * 5 minutos
   */
  PRIVATE: {
    'Cache-Control': 'private, max-age=300',
  },
} as const;

// =============================================================================
// CACHE KEY GENERATORS - Generadores de llaves de cache consistentes
// =============================================================================

/**
 * Genera una llave de cache para lista de vehículos basada en filtros
 */
export function getVehicleListCacheKey(filters: object, page: number): string {
  const sortedFilters = Object.keys(filters)
    .sort()
    .reduce((acc, key) => {
      const value = (filters as Record<string, unknown>)[key];
      // Solo incluir filtros con valores
      if (value !== undefined && value !== null && value !== '') {
        acc[key] = value;
      }
      return acc;
    }, {} as Record<string, unknown>);

  return `vehicles:list:${JSON.stringify(sortedFilters)}:page${page}`;
}

/**
 * Genera una llave de cache para detalle de vehículo
 */
export function getVehicleDetailCacheKey(slug: string): string {
  return `vehicles:detail:${slug}`;
}

/**
 * Genera una llave de cache para búsqueda
 */
export function getSearchCacheKey(term: string, page: number): string {
  return `vehicles:search:${term.toLowerCase().trim()}:page${page}`;
}

// =============================================================================
// CACHED FUNCTION WRAPPERS - Wrappers para funciones con cache
// =============================================================================

/**
 * Wrapper genérico para funciones con cache
 * Usa unstable_cache de Next.js para caching en servidor
 */
export function createCachedFn<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  keyParts: string[],
  options: {
    revalidate?: number;
    tags?: string[];
  } = {}
): T {
  const { revalidate = CACHE_TTL.VEHICLE_LIST, tags = [] } = options;

  return unstable_cache(
    fn,
    keyParts,
    {
      revalidate,
      tags,
    }
  ) as T;
}

// =============================================================================
// IN-MEMORY CACHE - Cache en memoria del servidor
// =============================================================================

interface MemoryCacheEntry<T> {
  data: T;
  expiresAt: number;
}

class ServerMemoryCache {
  private cache = new Map<string, MemoryCacheEntry<any>>();
  private maxSize = 1000; // Máximo número de entradas

  /**
   * Obtiene un valor del cache
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Verificar si expiró
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Almacena un valor en el cache
   */
  set<T>(key: string, data: T, ttlSeconds: number): void {
    // Limpiar cache si excede el tamaño máximo
    if (this.cache.size >= this.maxSize) {
      this.evictExpired();

      // Si todavía está lleno, eliminar las más antiguas
      if (this.cache.size >= this.maxSize) {
        const keysToDelete = Array.from(this.cache.keys()).slice(0, 100);
        keysToDelete.forEach(k => this.cache.delete(k));
      }
    }

    this.cache.set(key, {
      data,
      expiresAt: Date.now() + (ttlSeconds * 1000),
    });
  }

  /**
   * Elimina una entrada del cache
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Elimina entradas por patrón (prefix)
   */
  deleteByPrefix(prefix: string): number {
    let count = 0;
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
        count++;
      }
    }
    return count;
  }

  /**
   * Elimina todas las entradas expiradas
   */
  evictExpired(): number {
    const now = Date.now();
    let count = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
        count++;
      }
    }

    return count;
  }

  /**
   * Limpia todo el cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Obtiene estadísticas del cache
   */
  getStats(): { size: number; maxSize: number } {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
    };
  }
}

// Singleton del cache en memoria del servidor
export const serverCache = new ServerMemoryCache();

// =============================================================================
// CACHE UTILITIES
// =============================================================================

/**
 * Genera ETag basado en datos
 */
export function generateETag(data: unknown): string {
  const str = JSON.stringify(data);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return `"${Math.abs(hash).toString(36)}"`;
}

/**
 * Verifica si el cliente tiene cache válido basado en ETag
 */
export function isClientCacheValid(
  requestHeaders: Headers,
  etag: string
): boolean {
  const ifNoneMatch = requestHeaders.get('if-none-match');
  return ifNoneMatch === etag;
}

/**
 * Crea headers de respuesta con ETag y Cache-Control
 */
export function createCacheHeaders(
  cacheType: keyof typeof CACHE_HEADERS,
  etag?: string,
  additionalHeaders?: Record<string, string>
): Record<string, string> {
  const headers: Record<string, string> = {
    ...CACHE_HEADERS[cacheType],
    ...additionalHeaders,
  };

  if (etag) {
    headers['ETag'] = etag;
  }

  return headers;
}

// =============================================================================
// DEDUPLICATION - Previene requests duplicados
// =============================================================================

const pendingRequests = new Map<string, Promise<any>>();

/**
 * Deduplica requests concurrentes al mismo recurso
 * Si ya hay un request en progreso, retorna la misma promesa
 */
export async function deduplicatedFetch<T>(
  key: string,
  fetchFn: () => Promise<T>,
  ttlMs: number = 5000
): Promise<T> {
  // Verificar si ya hay un request en progreso
  const pending = pendingRequests.get(key);
  if (pending) {
    return pending;
  }

  // Crear nueva promesa y almacenarla
  const promise = fetchFn().finally(() => {
    // Limpiar después del TTL
    setTimeout(() => {
      pendingRequests.delete(key);
    }, ttlMs);
  });

  pendingRequests.set(key, promise);
  return promise;
}
