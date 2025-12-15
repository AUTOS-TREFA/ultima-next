'use client';

/**
 * Custom Hooks para Vehículos con Caching Optimizado
 *
 * Implementa React Query con configuración optimizada para cada tipo de datos:
 * - Filtros: cache largo (30 min), refetch bajo
 * - Lista: cache medio (10 min), refetch moderado
 * - Detalle: cache largo (15 min), refetch bajo
 */

import { useQuery, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import VehicleService from '../services/VehicleService';
import type { Vehicle, VehicleFilters } from '../types/types';

// =============================================================================
// QUERY KEYS - Claves consistentes para el cache
// =============================================================================

export const vehicleKeys = {
  all: ['vehicles'] as const,
  lists: () => [...vehicleKeys.all, 'list'] as const,
  list: (filters: VehicleFilters, page: number) =>
    [...vehicleKeys.lists(), { filters, page }] as const,
  details: () => [...vehicleKeys.all, 'detail'] as const,
  detail: (slug: string) => [...vehicleKeys.details(), slug] as const,
  filters: () => [...vehicleKeys.all, 'filters'] as const,
  slugs: () => [...vehicleKeys.all, 'slugs'] as const,
  search: (term: string, page: number) =>
    [...vehicleKeys.all, 'search', { term, page }] as const,
  popular: () => [...vehicleKeys.all, 'popular'] as const,
};

// =============================================================================
// STALE TIMES - Configuración de tiempos de cache
// =============================================================================

export const STALE_TIMES = {
  // Datos que cambian muy poco (30-60 min)
  FILTER_OPTIONS: 30 * 60 * 1000, // 30 minutos
  SLUGS: 60 * 60 * 1000, // 1 hora

  // Datos que cambian moderadamente (5-15 min)
  VEHICLE_LIST: 10 * 60 * 1000, // 10 minutos
  VEHICLE_DETAIL: 15 * 60 * 1000, // 15 minutos
  SEARCH_RESULTS: 5 * 60 * 1000, // 5 minutos

  // Datos más dinámicos (1-5 min)
  POPULAR: 5 * 60 * 1000, // 5 minutos
};

export const GC_TIMES = {
  // Tiempo que se mantiene en cache después de no usarse
  FILTER_OPTIONS: 60 * 60 * 1000, // 1 hora
  SLUGS: 2 * 60 * 60 * 1000, // 2 horas
  VEHICLE_LIST: 30 * 60 * 1000, // 30 minutos
  VEHICLE_DETAIL: 60 * 60 * 1000, // 1 hora
  SEARCH_RESULTS: 15 * 60 * 1000, // 15 minutos
};

// =============================================================================
// HOOKS
// =============================================================================

/**
 * Hook básico para obtener vehículos (mantiene compatibilidad)
 */
export const useVehicles = () => {
  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery<{ vehicles: Vehicle[], totalCount: number }, Error>({
    queryKey: ['autos'],
    queryFn: () => VehicleService.getAllVehicles(),
    staleTime: STALE_TIMES.VEHICLE_LIST,
    gcTime: GC_TIMES.VEHICLE_LIST,
  });

  return {
    vehicles: data?.vehicles || [],
    totalCount: data?.totalCount || 0,
    isLoading,
    error,
    refetch,
  };
};

/**
 * Hook avanzado para obtener lista de vehículos con filtros
 */
export function useVehiclesWithFilters(
  filters: VehicleFilters = {},
  page: number = 1,
  options?: Partial<UseQueryOptions<{ vehicles: Vehicle[]; totalCount: number }>>
) {
  return useQuery({
    queryKey: vehicleKeys.list(filters, page),
    queryFn: () => VehicleService.getAllVehicles(filters, page),
    staleTime: STALE_TIMES.VEHICLE_LIST,
    gcTime: GC_TIMES.VEHICLE_LIST,
    // Placeholder data para transiciones suaves
    placeholderData: (previousData) => previousData,
    ...options,
  });
}

/**
 * Hook para obtener detalle de vehículo
 */
export function useVehicleDetail(
  slug: string | undefined,
  options?: Partial<UseQueryOptions<Vehicle | null>>
) {
  return useQuery({
    queryKey: vehicleKeys.detail(slug || ''),
    queryFn: () => (slug ? VehicleService.getVehicleBySlug(slug) : null),
    enabled: !!slug,
    staleTime: STALE_TIMES.VEHICLE_DETAIL,
    gcTime: GC_TIMES.VEHICLE_DETAIL,
    ...options,
  });
}

/**
 * Hook para obtener opciones de filtros
 * Cache muy largo ya que raramente cambian
 */
export function useFilterOptions(
  options?: Partial<UseQueryOptions<any>>
) {
  return useQuery({
    queryKey: vehicleKeys.filters(),
    queryFn: () => VehicleService.getFilterOptions(),
    staleTime: STALE_TIMES.FILTER_OPTIONS,
    gcTime: GC_TIMES.FILTER_OPTIONS,
    // No refetch en focus/reconnect ya que estos datos cambian muy poco
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    ...options,
  });
}

/**
 * Hook para obtener todos los slugs (para SSG/prefetch)
 */
export function useAllSlugs(
  options?: Partial<UseQueryOptions<{ slug: string }[]>>
) {
  return useQuery({
    queryKey: vehicleKeys.slugs(),
    queryFn: () => VehicleService.getAllVehicleSlugs(),
    staleTime: STALE_TIMES.SLUGS,
    gcTime: GC_TIMES.SLUGS,
    refetchOnWindowFocus: false,
    ...options,
  });
}

/**
 * Hook para prefetch de vehículos
 * Útil para pre-cargar la siguiente página
 */
export function usePrefetchVehicles() {
  const queryClient = useQueryClient();

  return async (filters: VehicleFilters, page: number) => {
    await queryClient.prefetchQuery({
      queryKey: vehicleKeys.list(filters, page),
      queryFn: () => VehicleService.getAllVehicles(filters, page),
      staleTime: STALE_TIMES.VEHICLE_LIST,
    });
  };
}

/**
 * Hook para prefetch de detalle de vehículo
 * Útil para hover sobre cards
 */
export function usePrefetchVehicleDetail() {
  const queryClient = useQueryClient();

  return async (slug: string) => {
    await queryClient.prefetchQuery({
      queryKey: vehicleKeys.detail(slug),
      queryFn: () => VehicleService.getVehicleBySlug(slug),
      staleTime: STALE_TIMES.VEHICLE_DETAIL,
    });
  };
}

/**
 * Hook para invalidar cache de vehículos
 */
export function useInvalidateVehicles() {
  const queryClient = useQueryClient();

  return {
    // Invalidar todo
    invalidateAll: () => queryClient.invalidateQueries({ queryKey: vehicleKeys.all }),

    // Invalidar solo listas
    invalidateLists: () => queryClient.invalidateQueries({ queryKey: vehicleKeys.lists() }),

    // Invalidar un vehículo específico
    invalidateDetail: (slug: string) =>
      queryClient.invalidateQueries({ queryKey: vehicleKeys.detail(slug) }),

    // Invalidar filtros
    invalidateFilters: () => queryClient.invalidateQueries({ queryKey: vehicleKeys.filters() }),

    // Remover todo del cache (más agresivo)
    removeAll: () => queryClient.removeQueries({ queryKey: vehicleKeys.all }),
  };
}

/**
 * Hook para obtener el estado del cache
 */
export function useVehicleCacheStats() {
  const queryClient = useQueryClient();

  return {
    getListCacheSize: () => {
      const queries = queryClient.getQueryCache().findAll({ queryKey: vehicleKeys.lists() });
      return queries.length;
    },
    getDetailCacheSize: () => {
      const queries = queryClient.getQueryCache().findAll({ queryKey: vehicleKeys.details() });
      return queries.length;
    },
    clearStaleQueries: () => {
      queryClient.removeQueries({ stale: true });
    },
  };
}
