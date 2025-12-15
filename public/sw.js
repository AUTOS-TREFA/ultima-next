/**
 * Service Worker - TREFA Auto Inventory
 *
 * Estrategia de caching para PWA:
 * - Cache First: assets estáticos, imágenes
 * - Network First: API calls, páginas dinámicas
 * - Stale While Revalidate: datos semi-estáticos
 */

const CACHE_VERSION = 'trefa-v1.0.0';

// Caches específicos por tipo de contenido
const CACHE_NAMES = {
  static: `${CACHE_VERSION}-static`,
  images: `${CACHE_VERSION}-images`,
  api: `${CACHE_VERSION}-api`,
  pages: `${CACHE_VERSION}-pages`,
};

// Assets a pre-cachear en install
const PRECACHE_ASSETS = [
  '/',
  '/autos',
  '/offline',
  '/manifest.json',
];

// TTL por tipo de cache (en segundos)
const CACHE_TTL = {
  api: 15 * 60, // 15 minutos
  images: 24 * 60 * 60, // 24 horas
  pages: 30 * 60, // 30 minutos
};

// =============================================================================
// INSTALL EVENT
// =============================================================================

self.addEventListener('install', (event) => {
  console.log('[SW] Installing Service Worker...');

  event.waitUntil(
    caches.open(CACHE_NAMES.static)
      .then((cache) => {
        console.log('[SW] Pre-caching static assets');
        return cache.addAll(PRECACHE_ASSETS.filter(url => url !== '/offline'));
      })
      .then(() => {
        console.log('[SW] Pre-caching complete');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[SW] Pre-caching failed:', error);
      })
  );
});

// =============================================================================
// ACTIVATE EVENT
// =============================================================================

self.addEventListener('activate', (event) => {
  console.log('[SW] Activating Service Worker...');

  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => {
              // Eliminar caches de versiones anteriores
              return name.startsWith('trefa-') && !Object.values(CACHE_NAMES).includes(name);
            })
            .map((name) => {
              console.log('[SW] Deleting old cache:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => {
        console.log('[SW] Claiming clients');
        return self.clients.claim();
      })
  );
});

// =============================================================================
// FETCH EVENT
// =============================================================================

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Solo manejar requests HTTP/HTTPS
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // Ignorar requests de Chrome extensions
  if (url.protocol === 'chrome-extension:') {
    return;
  }

  // Determinar estrategia basada en el tipo de request
  if (isApiRequest(url)) {
    event.respondWith(networkFirstWithCache(request, CACHE_NAMES.api, CACHE_TTL.api));
  } else if (isImageRequest(url, request)) {
    event.respondWith(cacheFirstWithNetwork(request, CACHE_NAMES.images));
  } else if (isStaticAsset(url)) {
    event.respondWith(cacheFirstWithNetwork(request, CACHE_NAMES.static));
  } else if (isPageRequest(request)) {
    event.respondWith(networkFirstWithCache(request, CACHE_NAMES.pages, CACHE_TTL.pages));
  }
});

// =============================================================================
// HELPERS - Identificación de tipos de request
// =============================================================================

function isApiRequest(url) {
  return url.pathname.startsWith('/api/') ||
         url.hostname.includes('supabase.co');
}

function isImageRequest(url, request) {
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif', '.svg', '.ico'];
  const acceptHeader = request.headers.get('Accept') || '';

  return imageExtensions.some(ext => url.pathname.toLowerCase().endsWith(ext)) ||
         acceptHeader.includes('image/') ||
         url.pathname.includes('/_next/image');
}

function isStaticAsset(url) {
  const staticExtensions = ['.js', '.css', '.woff', '.woff2', '.ttf', '.otf', '.eot'];
  return staticExtensions.some(ext => url.pathname.toLowerCase().endsWith(ext)) ||
         url.pathname.startsWith('/_next/static/');
}

function isPageRequest(request) {
  return request.mode === 'navigate' ||
         (request.method === 'GET' && request.headers.get('Accept')?.includes('text/html'));
}

// =============================================================================
// ESTRATEGIAS DE CACHE
// =============================================================================

/**
 * Cache First con fallback a Network
 * Ideal para assets estáticos e imágenes
 */
async function cacheFirstWithNetwork(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);

  if (cachedResponse) {
    // Actualizar cache en background
    updateCacheInBackground(request, cache);
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      // Clonar respuesta para guardar en cache
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.error('[SW] Network error:', error);
    // Retornar respuesta de cache aunque esté expirada
    const staleResponse = await cache.match(request);
    if (staleResponse) {
      return staleResponse;
    }
    throw error;
  }
}

/**
 * Network First con fallback a Cache
 * Ideal para API calls y páginas dinámicas
 */
async function networkFirstWithCache(request, cacheName, ttlSeconds) {
  const cache = await caches.open(cacheName);

  try {
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      // Guardar con timestamp
      const responseToCache = networkResponse.clone();
      const headers = new Headers(responseToCache.headers);
      headers.set('sw-cached-at', Date.now().toString());

      const modifiedResponse = new Response(await responseToCache.blob(), {
        status: responseToCache.status,
        statusText: responseToCache.statusText,
        headers,
      });

      cache.put(request, modifiedResponse);
    }

    return networkResponse;
  } catch (error) {
    console.log('[SW] Network failed, trying cache');

    const cachedResponse = await cache.match(request);

    if (cachedResponse) {
      // Verificar si el cache está dentro del TTL
      const cachedAt = parseInt(cachedResponse.headers.get('sw-cached-at') || '0', 10);
      const age = (Date.now() - cachedAt) / 1000;

      if (age < ttlSeconds) {
        return cachedResponse;
      }

      console.log('[SW] Cache expired but returning anyway (offline)');
      return cachedResponse;
    }

    // Si es una página, mostrar página offline
    if (isPageRequest(request)) {
      const offlineResponse = await caches.match('/offline');
      if (offlineResponse) {
        return offlineResponse;
      }
    }

    throw error;
  }
}

/**
 * Stale While Revalidate
 * Responde con cache y actualiza en background
 */
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);

  // Actualizar cache en background
  const fetchPromise = fetch(request).then((networkResponse) => {
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  }).catch(() => null);

  // Retornar cache inmediatamente si existe
  return cachedResponse || fetchPromise;
}

/**
 * Actualiza cache en background sin bloquear
 */
function updateCacheInBackground(request, cache) {
  fetch(request)
    .then((response) => {
      if (response.ok) {
        cache.put(request, response);
      }
    })
    .catch(() => {
      // Ignorar errores de red en background
    });
}

// =============================================================================
// MESSAGE EVENT - Comunicación con la app
// =============================================================================

self.addEventListener('message', (event) => {
  const { type, payload } = event.data || {};

  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;

    case 'CLEAR_CACHE':
      clearAllCaches().then(() => {
        event.ports[0]?.postMessage({ success: true });
      });
      break;

    case 'CLEAR_API_CACHE':
      clearCache(CACHE_NAMES.api).then(() => {
        event.ports[0]?.postMessage({ success: true });
      });
      break;

    case 'GET_CACHE_STATS':
      getCacheStats().then((stats) => {
        event.ports[0]?.postMessage(stats);
      });
      break;

    default:
      break;
  }
});

/**
 * Limpia todos los caches
 */
async function clearAllCaches() {
  const cacheNames = await caches.keys();
  await Promise.all(cacheNames.map((name) => caches.delete(name)));
  console.log('[SW] All caches cleared');
}

/**
 * Limpia un cache específico
 */
async function clearCache(cacheName) {
  await caches.delete(cacheName);
  console.log(`[SW] Cache ${cacheName} cleared`);
}

/**
 * Obtiene estadísticas del cache
 */
async function getCacheStats() {
  const stats = {};

  for (const [key, cacheName] of Object.entries(CACHE_NAMES)) {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    stats[key] = keys.length;
  }

  return stats;
}
