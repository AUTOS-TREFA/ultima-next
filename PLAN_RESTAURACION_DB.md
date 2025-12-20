# Plan de Restauración de Base de Datos - inventario_cache

## Diagnóstico del Problema

### Estado Actual (19 de diciembre 2025)

De **145 vehículos activos** en producción:
- ✅ 142 tienen `feature_image`
- ❌ Solo 4 tienen `fotos_exterior_url`
- ❌ Solo 4 tienen `descripcion`
- ❌ Solo 3 tienen `created_at`
- ❌ 0 tienen `titulo`

### Causa Raíz Identificada

**PROBLEMA PRINCIPAL: `batch-sync-airtable` SIEMPRE actualiza registros existentes en Airtable**

1. **Línea 58-60 de batch-sync-airtable**: Cuando encuentra un registro existente, **SIEMPRE lo actualiza** con `actualizarEnAirtable()`. Esto envía SOLO campos básicos a Airtable:
   - ordencompra, ordenstatus, precio, marca, modelo, autoano
   - kilometraje, autotransmision, ubicacion, etc.
   - **NO envía**: descripción, fotos, garantía, etc.

2. **Ciclo vicioso de pérdida de datos**:
   ```
   Google Sheets → batch-sync-airtable (envía campos básicos a Airtable)
                   ↓
   Airtable recibe PATCH con campos básicos (puede perder datos completos)
                   ↓
   Airtable automation dispara webhook → airtable-sync
                   ↓
   airtable-sync actualiza Supabase con datos incompletos de Airtable
   ```

3. **Duplicados en Airtable**: Si `buscarEnAirtable()` falla o no encuentra el registro (por diferencias en mayúsculas, espacios, o errores de API), se crea un duplicado

### Comparación Backup vs Producción

| Campo | Backup (18/12) | Producción (19/12) |
|-------|----------------|-------------------|
| fotos_exterior_url | ~141 registros con URLs | 4 registros |
| fotos_interior_url | ~141 registros con URLs | ~4 registros |
| descripcion | ~47+ registros | 4 registros |
| created_at | Presente | Mayormente NULL |

---

## Plan de Restauración

### Fase 1: Detener la pérdida de datos (URGENTE)

**1.1 Deshabilitar temporalmente las sincronizaciones**
- [ ] Pausar la automatización de Airtable que envía webhooks
- [ ] O deshabilitar el cron/scheduler que ejecuta `batch-sync-airtable`

**1.2 Modificar `airtable-sync` para NO sobrescribir campos de imágenes**
El webhook ya tiene lógica para preservar R2 images, pero necesita extenderse:

```typescript
// En airtable-sync/index.ts, línea ~247
// Agregar más campos a preservar del registro existente
if (existingRecord) {
  // Preservar campos que NO deben sobrescribirse
  if (existingRecord.fotos_exterior_url && !exteriorImages) {
    exteriorImages = existingRecord.fotos_exterior_url;
  }
  if (existingRecord.fotos_interior_url && !interiorImages) {
    interiorImages = existingRecord.fotos_interior_url;
  }
  if (existingRecord.descripcion && !fields.descripcion) {
    // Preservar descripción existente
  }
}
```

### Fase 2: Restaurar datos desde backup

**2.1 Crear script de restauración selectiva**

```sql
-- Script para restaurar campos específicos desde backup
-- SIN sobrescribir campos que ya tienen datos válidos

-- Opción A: Restauración completa desde backup
-- CUIDADO: Esto reemplazará TODO el contenido de la tabla

-- Opción B: Actualizar solo campos vacíos (RECOMENDADO)
-- Ver script restore_from_backup.sql
```

**2.2 Campos a restaurar (prioridad)**
1. `fotos_exterior_url` - URLs de imágenes exteriores
2. `fotos_interior_url` - URLs de imágenes interiores
3. `feature_image_url` - Imagen principal
4. `descripcion` - Descripción del vehículo
5. `created_at` - Fecha de creación

### Fase 3: Corregir el flujo de sincronización

**3.1 FIX CRÍTICO: Modificar `batch-sync-airtable` (líneas 54-72)**

```typescript
// ANTES (PROBLEMÁTICO):
if (existing) {
  await actualizarEnAirtable(existing.id, record);  // ❌ SOBRESCRIBE DATOS!
  updated++;
}

// DESPUÉS (CORREGIDO):
if (existing) {
  // ✅ NO actualizar - preservar datos existentes en Airtable
  console.log(`Record ${record.ordencompra} already exists in Airtable (${existing.id}), skipping update`);

  // Solo guardar el airtable_id en Supabase si no lo tiene
  if (!record.airtable_id) {
    await supabase
      .from("inventario_cache")
      .update({ airtable_id: existing.id })
      .eq("ordencompra", record.ordencompra);
  }
  skipped++;
}
```

**3.2 FIX: Modificar `airtable-sync` (webhook) - Preservar campos existentes**

En líneas ~247-287, agregar lógica para NO sobrescribir campos con valores vacíos:

```typescript
// Después de obtener existingRecord (línea 247)
if (existingRecord) {
  // PRESERVAR campos de imágenes si el webhook no trae nuevos
  if (!exteriorImages && existingRecord.fotos_exterior_url) {
    exteriorImages = existingRecord.fotos_exterior_url;
  }
  if (!interiorImages && existingRecord.fotos_interior_url) {
    interiorImages = existingRecord.fotos_interior_url;
  }
  if (!featureImage && existingRecord.feature_image) {
    featureImage = existingRecord.feature_image;
  }

  // PRESERVAR descripción si webhook no trae nueva
  // (agregar en supabaseData)
}
```

**3.3 Agregar validación anti-duplicados en Airtable**

```typescript
async function buscarEnAirtable(ordenCompra: string): Promise<any> {
  // Normalizar ordenCompra para evitar problemas de mayúsculas/espacios
  const normalizedOC = ordenCompra.trim().toUpperCase();
  const formula = encodeURIComponent(`UPPER(TRIM({OrdenCompra}))="${normalizedOC}"`);
  // ... resto del código
}
```

---

## Pasos de Implementación (En Orden)

### Paso 1: 🛑 PAUSAR automatizaciones (URGENTE)
- [ ] Ir a Airtable → Automations → Pausar webhook que envía a `airtable-sync`
- [ ] Esto previene más pérdida de datos mientras trabajamos

### Paso 2: Corregir Edge Functions ANTES de restaurar

**2.1 Corregir `batch-sync-airtable/index.ts`:**
```typescript
// Líneas 54-72: Cambiar para NO actualizar registros existentes
for (const record of records) {
  try {
    const existing = await buscarEnAirtable(record.ordencompra);

    if (existing) {
      // ✅ NO ACTUALIZAR - Solo registrar airtable_id si falta
      console.log(`Record ${record.ordencompra} exists in Airtable, skipping`);
      if (!record.airtable_id) {
        await supabase
          .from("inventario_cache")
          .update({ airtable_id: existing.id })
          .eq("ordencompra", record.ordencompra);
      }
      skipped++;
    } else {
      // Crear nuevo solo si no existe
      const newRecord = await crearEnAirtable(record);
      // ... resto igual
    }
  }
}
```

**2.2 Corregir `airtable-sync/index.ts`:**
Agregar después de línea 261 (después de `if (existingRecord?.use_r2_images)`):
```typescript
// PRESERVAR campos existentes si webhook no trae datos
if (existingRecord) {
  if (!exteriorImages && existingRecord.fotos_exterior_url) {
    exteriorImages = existingRecord.fotos_exterior_url;
    console.log('📷 Preservando fotos_exterior_url existentes');
  }
  if (!interiorImages && existingRecord.fotos_interior_url) {
    interiorImages = existingRecord.fotos_interior_url;
    console.log('📷 Preservando fotos_interior_url existentes');
  }
}
```

### Paso 3: Desplegar Edge Functions corregidas
```bash
cd /Users/marianomorales/Downloads/ultima-next/ultima-next
supabase functions deploy batch-sync-airtable
supabase functions deploy airtable-sync
```

### Paso 4: Restaurar datos desde backup

**4.1 Ejecutar restauración selectiva (solo campos vacíos):**
```sql
-- Crear tabla temporal desde backup (ejecutar el INSERT del archivo SQL)
-- Luego actualizar solo campos vacíos:

UPDATE inventario_cache ic
SET
  fotos_exterior_url = CASE
    WHEN ic.fotos_exterior_url IS NULL OR ic.fotos_exterior_url = ''
    THEN b.fotos_exterior_url
    ELSE ic.fotos_exterior_url
  END,
  fotos_interior_url = CASE
    WHEN ic.fotos_interior_url IS NULL OR ic.fotos_interior_url = ''
    THEN b.fotos_interior_url
    ELSE ic.fotos_interior_url
  END,
  feature_image_url = CASE
    WHEN ic.feature_image_url IS NULL OR ic.feature_image_url = ''
    THEN b.feature_image_url
    ELSE ic.feature_image_url
  END,
  descripcion = CASE
    WHEN ic.descripcion IS NULL OR ic.descripcion = ''
    THEN b.descripcion
    ELSE ic.descripcion
  END,
  created_at = COALESCE(ic.created_at, b.created_at),
  titulo = CASE
    WHEN ic.titulo IS NULL OR ic.titulo = ''
    THEN b.titulo
    ELSE ic.titulo
  END
FROM inventario_cache_backup b
WHERE ic.ordencompra = b.ordencompra;
```

### Paso 5: Verificar restauración
```sql
SELECT
  COUNT(*) as total,
  COUNT(CASE WHEN fotos_exterior_url IS NOT NULL AND fotos_exterior_url != '' THEN 1 END) as con_fotos_ext,
  COUNT(CASE WHEN fotos_interior_url IS NOT NULL AND fotos_interior_url != '' THEN 1 END) as con_fotos_int,
  COUNT(CASE WHEN descripcion IS NOT NULL AND descripcion != '' THEN 1 END) as con_descripcion,
  COUNT(CASE WHEN created_at IS NOT NULL THEN 1 END) as con_created_at
FROM inventario_cache
WHERE vendido = false;
```

### Paso 6: Reactivar automatizaciones
- [ ] Solo después de verificar que todo está correcto
- [ ] Reactivar webhook de Airtable

---

## Archivos a Modificar

| Archivo | Cambio | Prioridad |
|---------|--------|-----------|
| `supabase/functions/batch-sync-airtable/index.ts` | NO actualizar registros existentes | 🔴 CRÍTICO |
| `supabase/functions/airtable-sync/index.ts` | Preservar campos existentes | 🔴 CRÍTICO |

## Riesgos

- ⚠️ La restauración desde backup puede traer datos del 18/12 (1 día atrás)
- ⚠️ Algunos campos en el backup ya tienen errores (ej: `feature_image: {"error": "#ERROR!"}`)
- ⚠️ **CRÍTICO**: Si no pausamos automatizaciones, los datos se volverán a sobrescribir

## Decisión Requerida

¿Cómo deseas proceder?

1. **Opción A**: Aplicar fixes a Edge Functions primero, luego restaurar
2. **Opción B**: Restaurar primero desde backup, luego aplicar fixes
3. **Opción C**: Solo aplicar fixes (sin restaurar desde backup) y esperar que Airtable re-sincronice datos completos

**Recomendación**: Opción A - Fixes primero para evitar que la restauración se pierda de nuevo
