'use client';

/**
 * Hook para gestionar el Service Worker
 *
 * Proporciona:
 * - Registro automático del SW
 * - Detección de actualizaciones
 * - Control de cache desde la app
 */

import { useEffect, useState, useCallback } from 'react';

interface ServiceWorkerState {
  isSupported: boolean;
  isRegistered: boolean;
  isUpdating: boolean;
  registration: ServiceWorkerRegistration | null;
}

export type CacheStats = Record<string, number>;

export function useServiceWorker() {
  const [state, setState] = useState<ServiceWorkerState>({
    isSupported: false,
    isRegistered: false,
    isUpdating: false,
    registration: null,
  });

  // Registrar Service Worker
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const isSupported = 'serviceWorker' in navigator;
    setState((prev) => ({ ...prev, isSupported }));

    if (!isSupported) return;

    // Solo registrar en producción o si está habilitado explícitamente
    const shouldRegister = process.env.NODE_ENV === 'production' ||
                           process.env.NEXT_PUBLIC_ENABLE_SW === 'true';

    if (!shouldRegister) {
      console.log('[SW Hook] Service Worker disabled in development');
      return;
    }

    registerServiceWorker();
  }, []);

  const registerServiceWorker = async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      });

      console.log('[SW Hook] Service Worker registered:', registration.scope);

      setState((prev) => ({
        ...prev,
        isRegistered: true,
        registration,
      }));

      // Manejar actualizaciones
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (!newWorker) return;

        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            console.log('[SW Hook] New version available');
            setState((prev) => ({ ...prev, isUpdating: true }));
          }
        });
      });

      // Verificar actualizaciones periódicamente
      setInterval(() => {
        registration.update();
      }, 60 * 60 * 1000); // Cada hora

    } catch (error) {
      console.error('[SW Hook] Registration failed:', error);
    }
  };

  /**
   * Forzar actualización del Service Worker
   */
  const update = useCallback(async () => {
    if (!state.registration) return;

    try {
      await state.registration.update();
      console.log('[SW Hook] Update check triggered');
    } catch (error) {
      console.error('[SW Hook] Update failed:', error);
    }
  }, [state.registration]);

  /**
   * Activar nueva versión del SW
   */
  const skipWaiting = useCallback(() => {
    if (!state.registration?.waiting) return;

    state.registration.waiting.postMessage({ type: 'SKIP_WAITING' });

    // Recargar la página cuando el nuevo SW tome control
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      window.location.reload();
    });
  }, [state.registration]);

  /**
   * Limpiar todo el cache del SW
   */
  const clearCache = useCallback(async (): Promise<boolean> => {
    const controller = navigator.serviceWorker.controller;
    if (!controller) return false;

    return new Promise((resolve) => {
      const messageChannel = new MessageChannel();
      messageChannel.port1.onmessage = (event) => {
        resolve(event.data?.success || false);
      };

      controller.postMessage(
        { type: 'CLEAR_CACHE' },
        [messageChannel.port2]
      );
    });
  }, []);

  /**
   * Limpiar solo cache de API
   */
  const clearApiCache = useCallback(async (): Promise<boolean> => {
    const controller = navigator.serviceWorker.controller;
    if (!controller) return false;

    return new Promise((resolve) => {
      const messageChannel = new MessageChannel();
      messageChannel.port1.onmessage = (event) => {
        resolve(event.data?.success || false);
      };

      controller.postMessage(
        { type: 'CLEAR_API_CACHE' },
        [messageChannel.port2]
      );
    });
  }, []);

  /**
   * Obtener estadísticas del cache
   */
  const getCacheStats = useCallback(async (): Promise<CacheStats | null> => {
    const controller = navigator.serviceWorker.controller;
    if (!controller) return null;

    return new Promise((resolve) => {
      const messageChannel = new MessageChannel();
      messageChannel.port1.onmessage = (event) => {
        resolve(event.data);
      };

      controller.postMessage(
        { type: 'GET_CACHE_STATS' },
        [messageChannel.port2]
      );

      // Timeout después de 5 segundos
      setTimeout(() => resolve(null), 5000);
    });
  }, []);

  return {
    ...state,
    update,
    skipWaiting,
    clearCache,
    clearApiCache,
    getCacheStats,
  };
}

export default useServiceWorker;
