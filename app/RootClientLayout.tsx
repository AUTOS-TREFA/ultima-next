'use client';

import { Suspense } from 'react';
import { Toaster } from 'sonner';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/context/AuthContext';
import { FilterProvider } from '@/context/FilterContext';
import { ConfigProvider } from '@/context/ConfigContext';
import ErrorBoundary from '@/components/ErrorBoundary';
import AuthHandler from '@/components/AuthHandler';
import RedirectManager from '@/components/RedirectManager';
import LeadSourceHandler from '@/components/LeadSourceHandler';
import { conversionTracking } from '@/services/ConversionTrackingService';
import { useEffect } from 'react';

/**
 * Configuración optimizada de React Query
 *
 * Estrategia de caching:
 * - staleTime: 10 min (datos se consideran frescos)
 * - gcTime: 30 min (datos se mantienen en cache)
 * - refetchOnWindowFocus: false (reducir requests innecesarios)
 * - placeholderData para transiciones suaves
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Retry con backoff exponencial
      retry: 2,
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 30000),

      // Caching optimizado
      staleTime: 10 * 60 * 1000, // 10 minutos - datos frescos
      gcTime: 30 * 60 * 1000, // 30 minutos - en memoria

      // Reducir refetches innecesarios para mejor UX
      refetchOnWindowFocus: false,
      refetchOnReconnect: 'always',
      refetchOnMount: true,

      // Modo de red
      networkMode: 'online',

      // Estructural sharing para evitar re-renders
      structuralSharing: true,
    },
    mutations: {
      retry: 1,
      networkMode: 'online',
    },
  },
});

export default function RootClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Initialize conversion tracking on mount
  useEffect(() => {
    conversionTracking.initialize();
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <FilterProvider>
            <ConfigProvider>
              <Toaster position="top-right" richColors closeButton />
              <AuthHandler />
              <RedirectManager />
              {/* Wrap LeadSourceHandler in Suspense to prevent SSG bailout */}
              <Suspense fallback={null}>
                <LeadSourceHandler />
              </Suspense>
              {children}
            </ConfigProvider>
          </FilterProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
