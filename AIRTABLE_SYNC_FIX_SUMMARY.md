# Corrección de Sincronización de Airtable

## Problema Identificado

El sistema de sincronización entre Airtable y Supabase estaba configurado incorrectamente:
- Los scripts apuntaban al proyecto Supabase VIEJO (`jjepfehmuybpctdzipnu`)
- El proyecto NUEVO es `pemgwyymodlwabaexxrb`
- Esto causaba que la tabla `inventario_cache` mostrara 87 vehículos en lugar de los 61 correctos

## Cambios Realizados

### 1. Archivos Actualizados con URLs del Proyecto Correcto

He actualizado los siguientes archivos para que apunten a `https://pemgwyymodlwabaexxrb.supabase.co`:

✅ `sync-all-airtable.cjs` - Script principal de sincronización
✅ `test-supabase-admin.cjs` - Script de prueba de admin
✅ `test-webhook-sync.cjs` - Script de prueba de webhook
✅ `generate-sitemap.cjs` - Generador de sitemap
✅ `docs/scripts/test-supabase-admin.cjs` - Docs test admin
✅ `docs/scripts/generate-sitemap.cjs` - Docs sitemap generator

### 2. Claves de Supabase Actualizadas

También actualicé las claves de Supabase anon key en los archivos correspondientes al nuevo proyecto.

## Scripts Creados

### 1. `check-inventory.cjs`
Script para verificar el estado actual de la tabla `inventario_cache`:
```bash
node check-inventory.cjs
```

Muestra:
- Total de registros
- Registros con estado "Comprado"
- Registros con estado "Historico"
- Registros marcados como vendidos
- Otros estados

### 2. `check-comprado-vendido.cjs`
Script para verificar la relación entre vehículos "Comprado" y "vendido":
```bash
node check-comprado-vendido.cjs
```

### 3. `clean-and-resync-inventory.cjs` ⭐
Script principal para limpiar y re-sincronizar el inventario:
```bash
AIRTABLE_API_KEY=tu_clave_airtable node clean-and-resync-inventory.cjs
```

Este script:
1. Limpia completamente la tabla `inventario_cache`
2. Obtiene todos los registros con `OrdenStatus = "Comprado"` desde Airtable
3. Sincroniza cada registro llamando al edge function `airtable-sync`
4. Muestra el progreso y resultado final

## Pasos para Completar la Configuración

### Paso 1: Actualizar Webhook en Airtable

**IMPORTANTE**: Debes actualizar el webhook/automation en Airtable para que apunte al proyecto correcto.

En tu script de Airtable (`airtable-sync-webhook.js`), actualiza la URL:

```javascript
// ANTES (proyecto viejo):
const SUPABASE_FUNCTION_URL = 'https://jjepfehmuybpctdzipnu.supabase.co/functions/v1/airtable-sync';

// DESPUÉS (proyecto nuevo):
const SUPABASE_FUNCTION_URL = 'https://pemgwyymodlwabaexxrb.supabase.co/functions/v1/airtable-sync';
```

La clave anon ya está correcta en `airtable-sync-webhook.js`:
```javascript
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBlbWd3eXltb2Rsd2FiYWV4eHJiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI5OTE1MTYsImV4cCI6MjA3ODU2NzUxNn0.wfwBKfCuDYmBX_Hi5KvqtNmLLpbgQllPnUaPfoDrYok';
```

### Paso 2: Ejecutar Limpieza y Re-sincronización

Ejecuta el script de limpieza y re-sync:

```bash
AIRTABLE_API_KEY=tu_clave_airtable node clean-and-resync-inventory.cjs
```

Este proceso:
- ⏱️ Tomará varios minutos dependiendo del número de vehículos
- 📊 Mostrará el progreso de cada vehículo sincronizado
- ✅ Al final mostrará el conteo total de vehículos sincronizados

### Paso 3: Verificar el Resultado

Después de la sincronización, verifica:

```bash
node check-inventory.cjs
```

Deberías ver que el número de vehículos con estado "Comprado" coincide con Airtable (aproximadamente 61).

## Funcionamiento del Sistema de Sincronización

### Sincronización Automática (Webhooks)

Cuando se actualiza un registro en Airtable:

1. **Automation en Airtable** dispara y envía el `recordId` al edge function
2. **Edge Function `airtable-sync`** (`supabase/functions/airtable-sync/index.ts`):
   - Obtiene el registro completo desde Airtable
   - Si `OrdenStatus != "Comprado"`, marca el registro como "Historico" en Supabase
   - Si `OrdenStatus == "Comprado"`, sincroniza todos los datos del vehículo
   - Invalida el cache de `rapid-processor`

### Sincronización Manual

Para sincronizar todos los vehículos manualmente:

```bash
# Sincronizar todos los registros "Comprado" desde Airtable
AIRTABLE_API_KEY=tu_clave node sync-all-airtable.cjs

# Limpiar y re-sincronizar desde cero (recomendado)
AIRTABLE_API_KEY=tu_clave node clean-and-resync-inventory.cjs
```

## Filtros de Visualización

El `VehicleService` filtra los vehículos de la siguiente manera:

```typescript
// Filtro base (línea 254 de VehicleService.ts)
query = query.eq('ordenstatus', 'Comprado');

// Opcional: ocultar vehículos separados
if (filters.hideSeparado) {
    query = query.or('separado.eq.false,separado.is.null');
}
```

Esto significa que solo se muestran vehículos con:
- `ordenstatus = "Comprado"`
- Opcionalmente, `separado = false` o `null` (si el filtro está activo)

## Verificación de Claves de Supabase

Si necesitas obtener las claves de Supabase para otros scripts:

### Anon Key (Pública):
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBlbWd3eXltb2Rsd2FiYWV4eHJiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI5OTE1MTYsImV4cCI6MjA3ODU2NzUxNn0.wfwBKfCuDYmBX_Hi5KvqtNmLLpbgQllPnUaPfoDrYok
```

### Service Role Key (Privada):
⚠️ Debe configurarse en variables de entorno del edge function en Supabase Dashboard:
- Variable: `SUPABASE_SERVICE_ROLE_KEY`
- Ubicación: Supabase Dashboard → Edge Functions → Settings → Secrets

## Troubleshooting

### Si sigues viendo 87 vehículos:

1. Verifica que el webhook en Airtable esté actualizado (Paso 1)
2. Ejecuta la limpieza y re-sync (Paso 2)
3. Verifica que Airtable realmente tenga 61 vehículos con `OrdenStatus = "Comprado"`

### Si algunos vehículos no se sincronizan:

1. Revisa los logs del edge function en Supabase Dashboard
2. Verifica que los registros tengan `OrdenStatus = "Comprado"` en Airtable
3. Ejecuta el test de webhook para un registro específico:
   ```bash
   AIRTABLE_API_KEY=tu_clave node test-webhook-sync.cjs
   ```

### Si el cache no se actualiza:

El edge function `rapid-processor` cachea los vehículos por 5 minutos. Para invalidar manualmente:

```bash
curl -X POST https://pemgwyymodlwabaexxrb.supabase.co/functions/v1/rapid-processor/invalidate-cache \
  -H "Authorization: Bearer TU_ANON_KEY"
```

## Resumen de Archivos Modificados

```
✅ sync-all-airtable.cjs
✅ test-supabase-admin.cjs
✅ test-webhook-sync.cjs
✅ generate-sitemap.cjs
✅ docs/scripts/test-supabase-admin.cjs
✅ docs/scripts/generate-sitemap.cjs
✅ airtable/airtable-sync-webhook.js (necesita actualización manual en Airtable)
```

## Archivos Nuevos Creados

```
✅ check-inventory.cjs
✅ check-comprado-vendido.cjs
✅ clean-and-resync-inventory.cjs
✅ AIRTABLE_SYNC_FIX_SUMMARY.md (este archivo)
```

---

**Última actualización**: 8 de diciembre, 2025
