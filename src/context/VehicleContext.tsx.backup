import React, { createContext, useContext, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import VehicleService from '../services/VehicleService';
import type { Vehicle } from '../types/types';
import { useFilters } from './FilterContext';
import { getVehicleImage } from '../utils/getVehicleImage';

interface VehicleContextType {
  vehicles: Vehicle[];
  totalCount: number;
  isLoading: boolean;
  error: Error | null;
}

const VehicleContext = createContext<VehicleContextType | undefined>(undefined);

export function VehicleProvider({ children }: { children: React.ReactNode }) {
  const { filters, currentPage } = useFilters();

  const { data, isLoading, error } = useQuery<{ vehicles: Vehicle[]; totalCount: number }, Error>({
    queryKey: ['vehicles', filters, currentPage],
    queryFn: () => VehicleService.getAllVehicles(filters, currentPage),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 1,
    enabled: !!filters, // Only run the query when filters are available
  });

  const contextValue = useMemo(() => {
    const vehicles = data?.vehicles || [];
    const totalCount = data?.totalCount || 0;

    const transformedVehicles = vehicles.map(vehicle => ({
      ...vehicle,
      feature_image: getVehicleImage(vehicle),
    }));

    return {
      vehicles: transformedVehicles,
      totalCount,
      isLoading,
      error: error || null,
    };
  }, [data, isLoading, error]);

  return <VehicleContext.Provider value={contextValue}>{children}</VehicleContext.Provider>;
}

export function useVehicles() {
  const context = useContext(VehicleContext);
  if (!context) {
    throw new Error('useVehicles must be used within a VehicleProvider');
  }
  return context;
}