'use client';

/**
 * CacheMonitor Component
 *
 * Componente de desarrollo para monitorear el estado del cache.
 * Solo se muestra en desarrollo o con query param ?debug=cache
 */

import { useState, useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { vehicleKeys, useVehicleCacheStats } from '@/hooks/useVehicles';
import { useServiceWorker } from '@/hooks/useServiceWorker';

interface CacheEntry {
  key: string;
  dataUpdatedAt: number;
  state: string;
  stale: boolean;
}

export function CacheMonitor() {
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [reactQueryCache, setReactQueryCache] = useState<CacheEntry[]>([]);
  const [swStats, setSwStats] = useState<Record<string, number> | null>(null);

  const queryClient = useQueryClient();
  const cacheStats = useVehicleCacheStats();
  const sw = useServiceWorker();

  // Verificar si debe mostrarse
  useEffect(() => {
    const showMonitor =
      process.env.NODE_ENV === 'development' ||
      new URLSearchParams(window.location.search).get('debug') === 'cache';

    setIsVisible(showMonitor);
  }, []);

  // Actualizar estadísticas de React Query
  const refreshReactQueryStats = useCallback(() => {
    const cache = queryClient.getQueryCache();
    const queries = cache.getAll();

    const entries: CacheEntry[] = queries.map((query) => ({
      key: JSON.stringify(query.queryKey),
      dataUpdatedAt: query.state.dataUpdatedAt,
      state: query.state.status,
      stale: query.isStale(),
    }));

    setReactQueryCache(entries);
  }, [queryClient]);

  // Actualizar estadísticas de Service Worker
  const refreshSwStats = useCallback(async () => {
    const stats = await sw.getCacheStats();
    if (stats) {
      setSwStats(stats);
    }
  }, [sw]);

  // Actualizar todo
  const refreshAll = useCallback(() => {
    refreshReactQueryStats();
    refreshSwStats();
  }, [refreshReactQueryStats, refreshSwStats]);

  // Actualizar al abrir
  useEffect(() => {
    if (isOpen) {
      refreshAll();
      const interval = setInterval(refreshAll, 5000);
      return () => clearInterval(interval);
    }
  }, [isOpen, refreshAll]);

  // Limpiar caches
  const clearAllCaches = async () => {
    // React Query
    queryClient.clear();

    // Service Worker
    await sw.clearCache();

    // localStorage cache
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith('vehicles_') || key.startsWith('trefa_')) {
        localStorage.removeItem(key);
      }
    });

    // Actualizar stats
    refreshAll();
  };

  const clearReactQueryCache = () => {
    queryClient.clear();
    refreshReactQueryStats();
  };

  const clearSwCache = async () => {
    await sw.clearCache();
    refreshSwStats();
  };

  if (!isVisible) return null;

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 z-50 p-3 bg-gray-800 text-white rounded-full shadow-lg hover:bg-gray-700 transition-colors"
        title="Cache Monitor"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"
          />
        </svg>
      </button>

      {/* Panel */}
      {isOpen && (
        <div className="fixed bottom-20 right-4 z-50 w-96 max-h-[70vh] bg-white dark:bg-gray-900 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-3 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
              Cache Monitor
            </h3>
            <div className="flex gap-2">
              <button
                onClick={refreshAll}
                className="p-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                title="Refresh"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                title="Close"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="overflow-y-auto max-h-[50vh] p-3 space-y-4 text-sm">
            {/* React Query Stats */}
            <section>
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-gray-700 dark:text-gray-300">
                  React Query Cache
                </h4>
                <button
                  onClick={clearReactQueryCache}
                  className="text-xs text-red-600 hover:text-red-800"
                >
                  Clear
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded">
                  <div className="text-blue-600 dark:text-blue-400 font-medium">
                    {cacheStats.getListCacheSize()}
                  </div>
                  <div className="text-gray-500 dark:text-gray-400">Lists</div>
                </div>
                <div className="p-2 bg-green-50 dark:bg-green-900/30 rounded">
                  <div className="text-green-600 dark:text-green-400 font-medium">
                    {cacheStats.getDetailCacheSize()}
                  </div>
                  <div className="text-gray-500 dark:text-gray-400">Details</div>
                </div>
              </div>

              {/* Query List */}
              <div className="mt-2 max-h-32 overflow-y-auto">
                {reactQueryCache.slice(0, 10).map((entry, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between py-1 border-b border-gray-100 dark:border-gray-800"
                  >
                    <span className="truncate text-xs text-gray-600 dark:text-gray-400 max-w-[200px]">
                      {entry.key}
                    </span>
                    <span
                      className={`text-xs px-1.5 py-0.5 rounded ${
                        entry.stale
                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                          : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                      }`}
                    >
                      {entry.stale ? 'stale' : 'fresh'}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            {/* Service Worker Stats */}
            <section>
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-gray-700 dark:text-gray-300">
                  Service Worker Cache
                </h4>
                <button
                  onClick={clearSwCache}
                  className="text-xs text-red-600 hover:text-red-800"
                >
                  Clear
                </button>
              </div>

              <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                Status: {sw.isRegistered ? 'Registered' : 'Not registered'}
                {sw.isUpdating && ' (Update available)'}
              </div>

              {swStats && (
                <div className="grid grid-cols-4 gap-2 text-xs">
                  {Object.entries(swStats).map(([key, count]) => (
                    <div key={key} className="p-2 bg-gray-50 dark:bg-gray-800 rounded text-center">
                      <div className="font-medium text-gray-700 dark:text-gray-300">
                        {count}
                      </div>
                      <div className="text-gray-500 dark:text-gray-400 capitalize">
                        {key}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* LocalStorage Stats */}
            <section>
              <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">
                LocalStorage Cache
              </h4>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {Object.keys(localStorage).filter(
                  (k) => k.startsWith('vehicles_') || k.startsWith('trefa_')
                ).length}{' '}
                entries
              </div>
            </section>
          </div>

          {/* Footer */}
          <div className="p-3 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={clearAllCaches}
              className="w-full py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded transition-colors"
            >
              Clear All Caches
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default CacheMonitor;
