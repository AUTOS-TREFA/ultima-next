# Estrategia de Caching - TREFA Auto Inventory

Esta documentacion describe la estrategia de caching multi-capa implementada para optimizar el rendimiento de la aplicacion.

## Arquitectura de Caching

```
┌─────────────────────────────────────────────────────────────────┐
│                     CLIENTE (Navegador)                         │
├─────────────────────────────────────────────────────────────────┤
│  Service Worker Cache ─── IndexedDB ─── React Query ─── Memory  │
└────────────────────────────────┬────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                        CDN / Edge                                │
├─────────────────────────────────────────────────────────────────┤
│  Cache-Control headers ─── stale-while-revalidate               │
└────────────────────────────────┬────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Next.js Server                                │
├─────────────────────────────────────────────────────────────────┤
│  unstable_cache ─── Server Memory Cache ─── ISR                 │
└────────────────────────────────┬────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Base de Datos                                │
├─────────────────────────────────────────────────────────────────┤
│  Supabase (inventario_cache) ─── Edge Functions                 │
└─────────────────────────────────────────────────────────────────┘
```

## Capas de Cache

### 1. Cache del Cliente

#### React Query
Ubicacion: `src/hooks/useVehicles.ts`

| Tipo de Datos | staleTime | gcTime | Notas |
|---------------|-----------|--------|-------|
| Lista de vehiculos | 10 min | 30 min | Transiciones suaves con placeholderData |
| Detalle de vehiculo | 15 min | 60 min | Cache largo por baja frecuencia de cambio |
| Opciones de filtros | 30 min | 60 min | Sin refetch en focus/reconnect |
| Slugs | 60 min | 120 min | Usado principalmente para SSG |

#### Service Worker
Ubicacion: `public/sw.js`

| Tipo de Request | Estrategia | TTL |
|-----------------|------------|-----|
| Assets estaticos | Cache First | Inmutable |
| Imagenes | Cache First + Background Update | 24 horas |
| API calls | Network First + Cache Fallback | 15 min |
| Paginas HTML | Network First + Cache Fallback | 30 min |

#### IndexedDB + Memory (CacheService)
Ubicacion: `src/services/CacheService.ts`

- Memory Cache: 5 minutos (sesion)
- IndexedDB: 1 hora (persistente)

### 2. Cache del Servidor

#### HTTP Headers
Configuracion: `next.config.js`

```javascript
// Lista de vehiculos
Cache-Control: public, max-age=900, s-maxage=900, stale-while-revalidate=3600

// Detalle de vehiculo
Cache-Control: public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400

// Opciones de filtros
Cache-Control: public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800

// Assets estaticos
Cache-Control: public, max-age=31536000, immutable
```

#### unstable_cache (Next.js)
Ubicacion: `app/api/vehicles/*`

| Endpoint | revalidate | Tags |
|----------|------------|------|
| /api/vehicles | 15 min | vehicles, vehicle-list |
| /api/vehicles/[slug] | 1 hora | vehicles, vehicle-detail |
| /api/vehicles/filters | 24 horas | filters, filter-options |
| /api/vehicles/slugs | 12 horas | vehicles, slugs |

#### Server Memory Cache
Ubicacion: `src/lib/cache.ts`

Cache en memoria del servidor para respuestas rapidas. Maximo 1000 entradas con limpieza automatica de expirados.

### 3. ISR (Incremental Static Regeneration)

| Pagina | revalidate |
|--------|------------|
| / (Home) | 30 min |
| /autos | 15 min |
| /autos/[slug] | 1 hora |
| /financiamientos | 1 hora |

## API de Invalidacion

### Endpoint: POST /api/cache/revalidate

Permite invalidar cache manualmente o desde webhooks.

**Headers requeridos:**
```
x-api-key: {CACHE_REVALIDATE_KEY}
```

**Body:**
```json
{
  "tags": ["vehicles", "filters"],
  "paths": ["/autos"],
  "clearMemory": true
}
```

**Tags disponibles:**
- `vehicles` - Todos los datos de vehiculos
- `vehicle-list` - Solo listas
- `vehicle-detail` - Solo detalles
- `filters` - Filtros
- `filter-options` - Opciones de filtros
- `search` - Busquedas
- `slugs` - Lista de slugs
- `popular` - Vehiculos populares

### Hook: useInvalidateVehicles
```typescript
const { invalidateAll, invalidateLists, invalidateDetail, invalidateFilters } = useInvalidateVehicles();

// Invalidar todo
invalidateAll();

// Invalidar solo listas
invalidateLists();

// Invalidar un vehiculo especifico
invalidateDetail('mazda-3-2024');
```

## Archivos Principales

| Archivo | Descripcion |
|---------|-------------|
| `src/lib/cache.ts` | Utilidades de cache del servidor |
| `src/hooks/useVehicles.ts` | Hooks con React Query optimizado |
| `src/hooks/useServiceWorker.ts` | Gestion del Service Worker |
| `src/services/CacheService.ts` | Cache de cliente (IndexedDB + Memory) |
| `src/components/CacheMonitor.tsx` | Monitor de cache (dev) |
| `public/sw.js` | Service Worker |
| `app/api/vehicles/route.ts` | API de vehiculos con cache |
| `app/api/vehicles/filters/route.ts` | API de filtros con cache |
| `app/api/cache/revalidate/route.ts` | API de invalidacion |

## Monitoreo

### CacheMonitor Component
Para habilitar el monitor de cache:
- En desarrollo: se muestra automaticamente
- En produccion: agregar `?debug=cache` a la URL

Muestra:
- Estadisticas de React Query
- Estado del Service Worker
- Conteo de entradas en localStorage

### Metricas Recomendadas
- Hit rate del cache
- Tiempo de respuesta con/sin cache
- Tamano del cache en memoria
- Frecuencia de invalidaciones

## Buenas Practicas

### Cuando Invalidar Cache

1. **Cambios de inventario**: Invalidar `vehicle-list` y `slugs`
2. **Edicion de vehiculo**: Invalidar `vehicle-detail:slug`
3. **Nuevas marcas/modelos**: Invalidar `filter-options`
4. **Despliegue**: Considerar `clearMemory: true`

### Prefetching

```typescript
const prefetchVehicles = usePrefetchVehicles();
const prefetchDetail = usePrefetchVehicleDetail();

// Prefetch siguiente pagina
prefetchVehicles(filters, currentPage + 1);

// Prefetch en hover
<VehicleCard onMouseEnter={() => prefetchDetail(vehicle.slug)} />
```

### ETag y Conditional Requests

Las APIs usan ETag para validacion condicional:
1. Primera solicitud: respuesta con `ETag: "abc123"`
2. Siguiente solicitud: `If-None-Match: "abc123"`
3. Si datos no cambiaron: respuesta `304 Not Modified`

## Troubleshooting

### Cache no se actualiza
1. Verificar TTL configurado
2. Usar `/api/cache/revalidate` para forzar
3. Limpiar Service Worker desde DevTools

### Datos obsoletos
1. Reducir staleTime en React Query
2. Verificar revalidate en ISR
3. Confirmar que invalidacion funciona

### Alto uso de memoria
1. Reducir gcTime en React Query
2. Verificar maxSize del serverCache
3. Limpiar queries stale con `clearStaleQueries()`
