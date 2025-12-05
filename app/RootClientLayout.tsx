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

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 30000),
      refetchOnWindowFocus: true,
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
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
