'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { UpdateBanner } from '@/components/UpdateBanner';

interface UpdateContextType {
  showUpdateBanner: boolean;
  triggerUpdate: () => void;
  dismissUpdate: () => void;
}

const UpdateContext = createContext<UpdateContextType | undefined>(undefined);

export const useUpdate = () => {
  const context = useContext(UpdateContext);
  if (!context) {
    throw new Error('useUpdate debe usarse dentro de UpdateProvider');
  }
  return context;
};

interface UpdateProviderProps {
  children: React.ReactNode;
}

export const UpdateProvider: React.FC<UpdateProviderProps> = ({ children }) => {
  const [showUpdateBanner, setShowUpdateBanner] = useState(false);
  const [serviceWorkerRegistration, setServiceWorkerRegistration] = useState<ServiceWorkerRegistration | null>(null);

  // Función para limpiar todos los cachés del Service Worker
  const clearAllCaches = async () => {
    try {
      // Limpiar todos los cachés del navegador
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
        if (process.env.NODE_ENV === 'development') {
          console.log('✅ Todos los cachés limpiados:', cacheNames);
        }
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error al limpiar cachés:', error);
      }
    }
  };

  // Función para actualizar la aplicación
  const triggerUpdate = useCallback(async () => {
    try {
      // Limpiar todos los cachés
      await clearAllCaches();

      // Si hay un Service Worker esperando, activarlo
      if (serviceWorkerRegistration?.waiting) {
        serviceWorkerRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });

        // Esperar un momento para que el SW se active
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // Actualizar la versión en localStorage
      const currentVersion = process.env.NEXT_PUBLIC_APP_VERSION || '';
      if (currentVersion) {
        localStorage.setItem('lastSeenVersion', currentVersion);
      }

      // Recargar la página para obtener la nueva versión
      window.location.reload();
    } catch (error) {
      // Si algo falla, intentar recargar de todas formas
      window.location.reload();
    }
  }, [serviceWorkerRegistration]);

  // Función para descartar la actualización
  const dismissUpdate = useCallback(() => {
    setShowUpdateBanner(false);
    // Guardar que el usuario vio esta versión
    const currentVersion = process.env.NEXT_PUBLIC_APP_VERSION || '';
    if (currentVersion) {
      localStorage.setItem('lastSeenVersion', currentVersion);
    }
  }, []);

  // Detectar actualizaciones del Service Worker
  useEffect(() => {
    // Función que se llama cuando se detecta una actualización
    const handleUpdate = (registration: ServiceWorkerRegistration) => {
      setServiceWorkerRegistration(registration);
      setShowUpdateBanner(true);
    };

    // Verificar cambio de versión basado en hash de build
    const checkVersion = () => {
      const currentVersion = process.env.NEXT_PUBLIC_APP_VERSION || '';
      const lastSeenVersion = localStorage.getItem('lastSeenVersion');

      // Solo mostrar banner si hay versión Y es diferente Y no hemos mostrado el banner en esta sesión
      const shownThisSession = sessionStorage.getItem('updateBannerShown');
      if (currentVersion && lastSeenVersion && lastSeenVersion !== currentVersion && !shownThisSession) {
        setShowUpdateBanner(true);
        sessionStorage.setItem('updateBannerShown', 'true');
      } else if (!lastSeenVersion && currentVersion) {
        // Primera vez que se carga la app, guardar versión actual
        localStorage.setItem('lastSeenVersion', currentVersion);
      }
    };

    // Event handler for SW messages
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'NEW_VERSION_AVAILABLE') {
        setShowUpdateBanner(true);
      }
    };

    // Event handler for controller change
    const handleControllerChange = () => {
      window.location.reload();
    };

    // Exponer la función globalmente para que serviceWorkerRegistration.ts pueda llamarla
    (window as any).__UPDATE_AVAILABLE__ = handleUpdate;

    checkVersion();

    // Escuchar mensajes y cambios del Service Worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', handleMessage);
      navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);

      // Verificar si hay un Service Worker en estado waiting
      navigator.serviceWorker.ready.then((registration) => {
        if (registration.waiting) {
          setServiceWorkerRegistration(registration);
          setShowUpdateBanner(true);
        }
      });
    }

    // Verificar versión cada 5 minutos
    const interval = setInterval(checkVersion, 5 * 60 * 1000);

    return () => {
      clearInterval(interval);
      delete (window as any).__UPDATE_AVAILABLE__;
      // Remove ALL event listeners on cleanup
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('message', handleMessage);
        navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
      }
    };
  }, []);

  return (
    <UpdateContext.Provider value={{ showUpdateBanner, triggerUpdate, dismissUpdate }}>
      {children}
      {showUpdateBanner && (
        <UpdateBanner onUpdate={triggerUpdate} onDismiss={dismissUpdate} />
      )}
    </UpdateContext.Provider>
  );
};
