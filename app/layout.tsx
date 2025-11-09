'use client';

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
import '../index.css';
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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Initialize conversion tracking on mount
  useEffect(() => {
    conversionTracking.initialize();
  }, []);

  return (
    <html lang="es">
      <head>
        <title>TREFA - Financiamiento Automotriz</title>
        <meta name="description" content="Compra el auto de tus sueños con el mejor financiamiento en México" />
      </head>
      <body>
        <ErrorBoundary>
          <QueryClientProvider client={queryClient}>
            <AuthProvider>
              <FilterProvider>
                <ConfigProvider>
                  <Toaster position="top-right" richColors closeButton />
                  <AuthHandler />
                  <RedirectManager />
                  <LeadSourceHandler />
                  {children}
                </ConfigProvider>
              </FilterProvider>
            </AuthProvider>
          </QueryClientProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
