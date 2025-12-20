# Instrucciones de Restauración Manual

## Paso 1: Crear tabla temporal para el backup

Ve a **Supabase Dashboard → SQL Editor** y ejecuta:

```sql
-- Crear tabla temporal con la misma estructura que inventario_cache
CREATE TABLE IF NOT EXISTS inventario_cache_backup (LIKE inventario_cache INCLUDING ALL);

-- Vaciar la tabla por si ya existía
TRUNCATE inventario_cache_backup;
```

## Paso 2: Importar el backup

1. Abre el archivo `/Users/marianomorales/Downloads/inventario_cache_rows.sql` en un editor de texto
2. Busca y reemplaza:
   - **Buscar**: `INSERT INTO "public"."inventario_cache"`
   - **Reemplazar por**: `INSERT INTO "public"."inventario_cache_backup"`
3. Copia el contenido modificado y pégalo en el SQL Editor de Supabase
4. Ejecuta el INSERT (puede tomar unos segundos)

## Paso 3: Verificar que el backup se importó

```sql
SELECT COUNT(*) as total_backup FROM inventario_cache_backup;
-- Debería mostrar ~800+ registros
```

## Paso 4: Restaurar campos vacíos

Ejecuta este UPDATE para restaurar solo los campos que están vacíos:

```sql
-- Actualizar campos vacíos desde el backup
UPDATE inventario_cache ic
SET
  -- Fotos exteriores
  fotos_exterior_url = CASE
    WHEN (ic.fotos_exterior_url IS NULL OR ic.fotos_exterior_url = '')
         AND b.fotos_exterior_url IS NOT NULL AND b.fotos_exterior_url != ''
    THEN b.fotos_exterior_url
    ELSE ic.fotos_exterior_url
  END,

  -- Fotos interiores
  fotos_interior_url = CASE
    WHEN (ic.fotos_interior_url IS NULL OR ic.fotos_interior_url = '')
         AND b.fotos_interior_url IS NOT NULL AND b.fotos_interior_url != ''
    THEN b.fotos_interior_url
    ELSE ic.fotos_interior_url
  END,

  -- Feature image URL
  feature_image_url = CASE
    WHEN (ic.feature_image_url IS NULL OR ic.feature_image_url = '')
         AND b.feature_image_url IS NOT NULL AND b.feature_image_url != ''
    THEN b.feature_image_url
    ELSE ic.feature_image_url
  END,

  -- Feature image (legacy)
  feature_image = CASE
    WHEN (ic.feature_image IS NULL OR ic.feature_image = '' OR ic.feature_image = '{"error": "#ERROR!"}')
         AND b.feature_image IS NOT NULL AND b.feature_image != '' AND b.feature_image != '{"error": "#ERROR!"}'
    THEN b.feature_image
    ELSE ic.feature_image
  END,

  -- Descripcion
  descripcion = CASE
    WHEN (ic.descripcion IS NULL OR ic.descripcion = '')
         AND b.descripcion IS NOT NULL AND b.descripcion != ''
    THEN b.descripcion
    ELSE ic.descripcion
  END,

  -- Created at
  created_at = COALESCE(ic.created_at, b.created_at),

  -- Titulo
  titulo = CASE
    WHEN (ic.titulo IS NULL OR ic.titulo = '')
         AND b.titulo IS NOT NULL AND b.titulo != ''
    THEN b.titulo
    ELSE ic.titulo
  END,

  -- Garantia
  garantia = CASE
    WHEN (ic.garantia IS NULL OR ic.garantia = '')
         AND b.garantia IS NOT NULL AND b.garantia != ''
    THEN b.garantia
    ELSE ic.garantia
  END

FROM inventario_cache_backup b
WHERE ic.ordencompra = b.ordencompra;
```

## Paso 5: Verificar restauración

```sql
SELECT
  COUNT(*) as total,
  COUNT(CASE WHEN fotos_exterior_url IS NOT NULL AND fotos_exterior_url != '' THEN 1 END) as con_fotos_ext,
  COUNT(CASE WHEN fotos_interior_url IS NOT NULL AND fotos_interior_url != '' THEN 1 END) as con_fotos_int,
  COUNT(CASE WHEN descripcion IS NOT NULL AND descripcion != '' THEN 1 END) as con_descripcion,
  COUNT(CASE WHEN created_at IS NOT NULL THEN 1 END) as con_created_at,
  COUNT(CASE WHEN titulo IS NOT NULL AND titulo != '' THEN 1 END) as con_titulo
FROM inventario_cache
WHERE vendido = false;
```

Los números deberían ser mucho más altos que antes de la restauración.

## Paso 6: Limpiar

Una vez verificado que todo está bien:

```sql
DROP TABLE IF EXISTS inventario_cache_backup;
```

---

## Resumen de Estado Esperado

| Campo | Antes | Después (esperado) |
|-------|-------|-------------------|
| fotos_exterior_url | 4 | ~100+ |
| fotos_interior_url | ~4 | ~100+ |
| descripcion | 4 | ~50+ |
| created_at | 3 | ~140+ |
