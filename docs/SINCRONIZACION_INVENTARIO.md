# Sistema de Sincronización de Inventario TREFA

> Guía simplificada del flujo de datos entre Google Sheets, Airtable y Supabase

---

## Resumen Ejecutivo

TREFA usa un sistema **circular** para mantener el inventario sincronizado:

| Paso | Fuente | Destino | Método | Datos |
|------|--------|---------|--------|-------|
| 1 | Google Sheets | Supabase | Apps Script | Parciales (operativos) |
| 2 | Supabase | Airtable | Cron `batch-sync-airtable` | Crea/actualiza registro |
| 3 | Airtable | Supabase | Webhook `airtable-sync` | Completos (todo) |

**No se requieren webhooks en Supabase.** Todo funciona con:
- Google Apps Script (trigger onChange en Sheets)
- pg_cron en Supabase (cron job cada 5 min)
- Automatizaciones de Airtable (webhook saliente)

---

## Diagrama General - Flujo Circular

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                                                                 │
│   PASO 1                    PASO 2                      PASO 3                  │
│   ───────                   ───────                     ───────                 │
│                                                                                 │
│   ┌──────────────┐         ┌─────────────────┐         ┌──────────────┐        │
│   │ GOOGLE SHEETS│         │    SUPABASE     │         │   AIRTABLE   │        │
│   │ (operativo)  │         │ inventario_cache│         │ (inventario) │        │
│   └──────┬───────┘         └────────┬────────┘         └──────┬───────┘        │
│          │                          │                         │                 │
│          │  Apps Script             │                         │                 │
│          │  (onChange)              │                         │                 │
│          │                          │                         │                 │
│          └─────────────────────────►│                         │                 │
│             DATOS PARCIALES:        │                         │                 │
│             - ordencompra           │  batch-sync-airtable    │                 │
│             - ordenstatus           │  (cron cada 5 min)      │                 │
│             - precio                │                         │                 │
│             - separado/vendido      └────────────────────────►│                 │
│             - ubicacion                CREA o ACTUALIZA       │                 │
│             - fechas                   en Airtable            │                 │
│                                                               │                 │
│                                                               │                 │
│                                     ┌─────────────────────────┘                 │
│                                     │                                           │
│                                     │  PASO 4: Webhook de Airtable              │
│                                     │  (airtable-sync)                          │
│                                     │                                           │
│                                     │  DATOS COMPLETOS:                         │
│                                     │  - Todo lo de Google Sheets               │
│                                     │  + titulo, descripcion                    │
│                                     │  + fotos (feature, exterior, interior)    │
│                                     │  + promociones, garantia                  │
│                                     │  + enganche, mensualidad                  │
│                                     │  + características del auto               │
│                                     │                                           │
│                                     ▼                                           │
│                            ┌─────────────────┐                                  │
│                            │    SUPABASE     │                                  │
│                            │ inventario_cache│                                  │
│                            │   (COMPLETO)    │                                  │
│                            └────────┬────────┘                                  │
│                                     │                                           │
│                                     ▼                                           │
│                            ┌─────────────────┐                                  │
│                            │ rapid-processor │                                  │
│                            │   (API caché)   │                                  │
│                            └────────┬────────┘                                  │
│                                     │                                           │
│                                     ▼                                           │
│                            ┌─────────────────┐                                  │
│                            │    FRONTEND     │                                  │
│                            └─────────────────┘                                  │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Flujo en palabras simples:

1. **Google Sheets → Supabase** (Apps Script)
   - Envía datos operativos/ventas (parciales)
   - Solo campos como: estado, precio, separado, vendido, ubicación

2. **Supabase → Airtable** (Cron `batch-sync-airtable`)
   - Cada 5 minutos busca cambios recientes
   - Si el registro NO existe en Airtable → lo CREA
   - Si el registro SÍ existe → lo ACTUALIZA

3. **Airtable detecta el cambio**
   - Su automatización interna se dispara
   - Envía webhook a Supabase

4. **Airtable → Supabase** (Webhook `airtable-sync`)
   - Envía el registro COMPLETO con todos los campos
   - Incluye fotos, descripción, promociones, etc.
   - `inventario_cache` queda con datos completos

---

## Parte 1: Google Sheets → Supabase (Apps Script)

### ¿Dónde está configurado?
En Google Sheets: `Extensions → Apps Script`

### ¿Cuándo se activa?
Automáticamente cuando hay **cualquier cambio** en la hoja (trigger `onChange`).

### ¿Cómo funciona?

1. Usuario edita una celda en la hoja "OrdenCompra"
2. El trigger `onChange` dispara la función `onSheetChange()`
3. El script:
   - Lee todas las filas
   - Filtra solo las modificadas desde la última sincronización (usando `LastUpdated`)
   - Transforma los datos al formato de Supabase
   - Hace upsert directo a `inventario_cache` via REST API

### Campos sincronizados (Google Sheets → Supabase)

| Campo Google Sheets | Campo Supabase | Tipo |
|---------------------|----------------|------|
| `OrdenCompra` | `ordencompra` | texto (PK) |
| `OrdenStatus` | `ordenstatus` | texto |
| `AutoFactura` | `factura` | texto |
| `AutoPrecioVenta` | `precio` | número |
| `AutoKilometraje` | `kilometraje` | número |
| `Consigna` | `consigna` | boolean |
| `OrdenID` | `orden_id` | texto |
| `OrdenFecha` | `orden_fecha` | fecha |
| `HistoricoFecha` | `historico_fecha` | fecha |
| `Separado` | `separado` | boolean |
| `FechaSeparado` | `fecha_separado` | fecha |
| `Vendido` | `vendido` | boolean |
| `FechaVendido` | `fecha_vendido` | fecha |
| `AutoMarca` | `marca` | texto |
| `AutoSubMarcaVersion` | `modelo` | texto |
| `AutoAño` | `autoano` | número |
| `LastUpdated` | `updated_at` | fecha |
| `AutoTransmision` | `autotransmision` | texto |
| `UsuarioComprador` | `usuario_comprador` | texto |
| `AutoLlaves` | `auto_llaves` | texto |
| `AutoDuenos` | `numero_duenos` | número |
| `UnidadEnReparacion` | `en_reparacion` | boolean |
| `SucursalFisica` | `ubicacion` | texto |
| `Utilitario` | `utilitario` | boolean |

### Características del script

- **Upsert inteligente**: Usa `resolution=merge-duplicates` para no sobrescribir campos vacíos
- **Procesamiento incremental**: Solo sincroniza filas modificadas desde la última ejecución
- **Batches de 50**: Procesa en lotes para evitar timeouts
- **Limpieza de datos**: Elimina comillas extras, convierte tipos correctamente

### Funciones disponibles

| Función | Descripción |
|---------|-------------|
| `setupTrigger()` | Configura el trigger onChange (ejecutar 1 vez) |
| `syncAllRows()` | Sincroniza filas modificadas |
| `forceFullSync()` | Sincroniza TODAS las filas (ignora timestamp) |
| `syncSingleRow(ordenCompra)` | Sincroniza una fila específica |
| `testConnection()` | Prueba la conexión a Supabase |

### Configuración inicial

```javascript
// En Apps Script, ejecutar una vez:
setupTrigger()
```

Esto crea el trigger automático que dispara la sincronización.

---

## Parte 2: Airtable → Supabase (Webhook)

### ¿Cuándo se activa?
Cuando en Airtable:
- Se crea un nuevo registro
- Se modifica un registro existente
- Cambia el campo `OrdenStatus`

### ¿Cómo funciona?

1. **Automatización en Airtable** detecta el cambio
2. Envía un **webhook** a:
   ```
   https://pemgwyymodlwabaexxrb.supabase.co/functions/v1/airtable-sync
   ```
3. El payload contiene solo el `recordId`:
   ```json
   {
     "recordId": "recXXXXXXXXXXXXXX"
   }
   ```

4. La función `airtable-sync`:
   - Consulta Airtable para obtener todos los datos del registro
   - Transforma los campos al formato de Supabase
   - Hace upsert en `inventario_cache`
   - Invalida el caché de `rapid-processor`

### Campos sincronizados (Airtable → Supabase)

| Campo Airtable | Campo Supabase |
|----------------|----------------|
| `Auto` | `title` |
| `Precio` | `precio` |
| `AutoMarca` | `marca` |
| `AutoSubmarcaVersion` | `modelo` |
| `AutoAno` | `autoano` |
| `OrdenStatus` | `ordenstatus` |
| `Separado` | `separado` |
| `feature_image` | `feature_image` |
| `fotos_exterior_url` | `fotos_exterior_url` |
| `fotos_interior_url` | `fotos_interior_url` |
| ... y más | ... |

### Manejo de imágenes

Las URLs de imágenes vienen de campos de texto en Airtable (no attachments):
- `feature_image` - Imagen principal
- `fotos_exterior_url` - URLs separadas por coma
- `fotos_interior_url` - URLs separadas por coma

Estas URLs apuntan a Cloudflare R2 (CDN) para mejor rendimiento.

---

## Parte 3: Supabase → Airtable (Cron)

### ¿Cuándo se activa?
Un **cron job** ejecuta la función cada 5 minutos automáticamente.

### ¿Cómo funciona?

1. La función `batch-sync-airtable` busca registros en `inventario_cache` que:
   - Se actualizaron en los últimos 10 minutos, O
   - No tienen `airtable_id` (son nuevos)

2. Para cada registro (máx 50 por ejecución):
   - Busca en Airtable por `OrdenCompra`
   - Si existe → actualiza (PATCH)
   - Si no existe → crea (POST)
   - Guarda el `airtable_id` en Supabase

3. Respeta el rate limit de Airtable (5 req/seg) con delays de 250ms

### Campos sincronizados (Supabase → Airtable)

| Campo Supabase | Campo Airtable |
|----------------|----------------|
| `ordencompra` | `OrdenCompra` |
| `ordenstatus` | `OrdenStatus` |
| `precio` | `Precio` |
| `marca` | `AutoMarca` |
| `modelo` | `AutoSubmarcaVersion` |
| `autoano` | `AutoAno` |
| `separado` | `Separado` |
| `kilometraje` | `Kilometraje Compra` |
| `ubicacion` | `Ubicacion` |
| `en_reparacion` | `En Reparación` |

---

## Parte 4: API para el Frontend

### `rapid-processor`

Esta función es la **API pública** que el frontend consulta:

```
GET https://pemgwyymodlwabaexxrb.supabase.co/functions/v1/rapid-processor
```

**Características:**
- Caché en memoria de 1 hora
- Transforma URLs a formato CDN
- Agrega placeholders para autos sin imagen
- Soporta filtros y paginación

**Endpoints:**
| Método | URL | Descripción |
|--------|-----|-------------|
| GET | `/rapid-processor` | Lista de vehículos con filtros |
| GET | `/rapid-processor/{slug}` | Vehículo individual |
| POST | `/rapid-processor/invalidate-cache` | Limpiar caché |

---

## Configuración del Cron Job

Para activar la sincronización automática Supabase → Airtable, ejecuta en SQL:

```sql
-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Programar sincronización cada 5 minutos
SELECT cron.schedule(
  'sync-to-airtable',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://pemgwyymodlwabaexxrb.supabase.co/functions/v1/batch-sync-airtable',
    headers := '{"Authorization": "Bearer TU_SERVICE_ROLE_KEY"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);
```

Para ver los jobs programados:
```sql
SELECT * FROM cron.job;
```

Para eliminar un job:
```sql
SELECT cron.unschedule('sync-to-airtable');
```

---

## Tabla de Referencia: Funciones de Supabase

| Función | Propósito | Disparador |
|---------|-----------|------------|
| `airtable-sync` | Airtable → Supabase (individual) | Webhook de Airtable |
| `batch-sync-airtable` | Supabase → Airtable (batch) | Cron cada 5 min |
| `rapid-processor` | API pública + caché | Requests del frontend |
| `swift-responder` | Sync completo + imágenes R2 | Manual/Cron |
| `smooth-handler` | API alternativa de inventario | Requests |

---

## Preguntas Frecuentes

### ¿Necesito configurar webhooks en Supabase?
**No.** Los webhooks van de Airtable hacia Supabase, no al revés.

### ¿Qué pasa si Airtable está caído?
- La sincronización Airtable → Supabase falla silenciosamente
- El frontend sigue funcionando con datos cacheados
- Cuando Airtable vuelva, el siguiente webhook sincronizará

### ¿Qué pasa si cambio algo en el CRM web?
- El cambio se guarda en `inventario_cache`
- En máximo 5 minutos, `batch-sync-airtable` lo envía a Airtable
- El equipo de ventas ve el cambio en Airtable

### ¿Cómo fuerzo una sincronización manual?
```bash
# Airtable → Supabase (un registro)
curl -X POST "https://pemgwyymodlwabaexxrb.supabase.co/functions/v1/airtable-sync" \
  -H "Content-Type: application/json" \
  -d '{"recordId": "recXXXXXXXXXX"}'

# Supabase → Airtable (batch)
curl -X POST "https://pemgwyymodlwabaexxrb.supabase.co/functions/v1/batch-sync-airtable" \
  -H "Authorization: Bearer TU_SERVICE_ROLE_KEY"

# Limpiar caché de rapid-processor
curl -X POST "https://pemgwyymodlwabaexxrb.supabase.co/functions/v1/rapid-processor/invalidate-cache"
```

### ¿Dónde veo los logs de sincronización?
1. **Dashboard de Supabase** → Edge Functions → Logs
2. **Tabla `sync_logs`** en la base de datos (si está habilitada)

---

## Variables de Entorno Requeridas

En Supabase Dashboard → Edge Functions → Secrets:

| Variable | Descripción |
|----------|-------------|
| `AIRTABLE_API_KEY` | Token de API de Airtable |
| `AIRTABLE_BASE_ID` | ID de la base de Airtable |
| `AIRTABLE_TABLE_ID` | ID de la tabla de inventario |
| `SUPABASE_URL` | URL del proyecto Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Clave de servicio (admin) |

---

---

## Resumen: ¿Qué datos vienen de dónde?

### Google Sheets (Paso 1 - Datos operativos/ventas)
Campos que SOLO vienen de Google Sheets:
- `ordencompra` (llave primaria)
- `ordenstatus` (Comprado, Vendido, Histórico)
- `precio` (precio de venta)
- `separado`, `vendido` (flags de estado)
- `fecha_separado`, `fecha_vendido`
- `ubicacion` (sucursal física)
- `en_reparacion`, `utilitario`
- `usuario_comprador`

### Airtable (Paso 4 - Datos completos del vehículo)
Campos que vienen de Airtable (después del webhook):
- `titulo`, `descripcion`
- `marca`, `modelo`, `autoano`
- `feature_image`, `fotos_exterior_url`, `fotos_interior_url`
- `promociones`, `garantia`
- `enganchemin`, `mensualidad_minima`
- `transmision`, `combustible`, `cilindros`
- Y todos los demás campos del vehículo

### Flujo de datos resumido

```
   GOOGLE SHEETS                SUPABASE                    AIRTABLE
   ─────────────                ────────                    ────────
        │                           │                           │
        │  (1) Datos parciales      │                           │
        └──────────────────────────►│                           │
                                    │                           │
                                    │  (2) Cron cada 5 min      │
                                    │  batch-sync-airtable      │
                                    └──────────────────────────►│
                                                                │
                                    │  (3) Webhook automático   │
                                    │◄──────────────────────────┘
                                    │
                                    │  inventario_cache
                                    │  ahora tiene TODO:
                                    │  - Datos de Sheets
                                    │  - Datos de Airtable
                                    │
                                    ▼
                              rapid-processor
                                    │
                                    ▼
                                FRONTEND
```

### ¿Por qué este flujo circular?

1. **Google Sheets** es donde el equipo operativo trabaja (ventas, status, ubicaciones)
2. **Airtable** es donde está toda la información del vehículo (fotos, descripción, specs)
3. **Supabase** necesita AMBOS conjuntos de datos para el frontend

El flujo circular garantiza que:
- Los cambios operativos de Sheets lleguen a Airtable
- Airtable siempre tenga la información más reciente
- El webhook de Airtable traiga TODO de vuelta a Supabase

---

*Documento generado el 16 de diciembre de 2024*
*Versión 1.1 - Incluye integración con Google Sheets*
