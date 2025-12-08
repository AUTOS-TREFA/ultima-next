# Migración de Imágenes Externas a Cloudflare R2

## Estado de la Migración

### ✅ Imágenes Descargadas Correctamente (4)

Las siguientes imágenes de sucursales se descargaron exitosamente:

1. **TREFA-San-JEronimo.jpg** (298KB) - Imagen de sucursal Monterrey
2. **Reynosa.jpg** (208KB) - Imagen de sucursal Reynosa
3. **Guadalupe-2023-02-03.jpg** (224KB) - Imagen de sucursal Guadalupe
4. **Saltillo-Autos-TREFA.jpeg** (113KB) - Imagen de sucursal Saltillo

Ubicación: `temp-images-migration/branches/`

### ❌ Imágenes NO Encontradas (2)

Las siguientes imágenes NO existen en el servidor externo:

1. **trefa-no-encontrado.png** - No existe en http://5.183.8.48/wp-content/uploads/2024/09/
2. **circulos-naranjas-trefa-fondo.png** - No existe en http://5.183.8.48/wp-content/uploads/2024/09/

**Archivos que las usan:**
- `src/page-components/NotFoundPage.tsx` (línea 14)
- `src/page-components/VehicleListPage.tsx` (línea 603)
- `src/page-components/DashboardPage.tsx` (línea 584)

## Pasos para Completar la Migración

### Paso 1: Verificar Instalación de Wrangler

```bash
# Instalar Wrangler si no lo tienes
npm install -g wrangler

# Autenticarte con Cloudflare
wrangler login
```

### Paso 2: Subir Imágenes de Sucursales a R2

Ejecuta los siguientes comandos para subir las 4 imágenes válidas a tu bucket de Cloudflare R2:

```bash
# Sucursales
wrangler r2 object put trefa-images/branches/TREFA-San-JEronimo.jpg --file=temp-images-migration/branches/TREFA-San-JEronimo.jpg

wrangler r2 object put trefa-images/branches/Reynosa.jpg --file=temp-images-migration/branches/Reynosa.jpg

wrangler r2 object put trefa-images/branches/Guadalupe-2023-02-03.jpg --file=temp-images-migration/branches/Guadalupe-2023-02-03.jpg

wrangler r2 object put trefa-images/branches/Saltillo-Autos-TREFA.jpeg --file=temp-images-migration/branches/Saltillo-Autos-TREFA.jpeg
```

O puedes ejecutar todos a la vez:

```bash
bash scripts/upload-to-r2.sh
```

### Paso 3: Verificar que se Subieron Correctamente

```bash
wrangler r2 object list trefa-images/branches
```

### Paso 4: Actualizar URLs en el Código

Una vez subidas las imágenes, ejecuta el script para actualizar las URLs en el código:

```bash
node scripts/update-image-urls.js
```

Este script actualizará automáticamente los archivos:
- `src/utils/constants.ts` (branchData - 4 URLs)

### Paso 5: Resolver Imágenes Faltantes

Para las 2 imágenes PNG que no existen, tienes las siguientes opciones:

**Opción A:** Crear o encontrar imágenes de reemplazo
- Sube imágenes similares a R2 con los mismos nombres
- Asegúrate de que tengan contenido apropiado (página no encontrada, fondo decorativo)

**Opción B:** Usar imágenes locales existentes
- Mover imágenes del proyecto a R2 si existen
- Actualizar las referencias en el código

**Opción C:** Eliminar las referencias
- Comentar o eliminar los elementos `<img>` que las usan
- Usar CSS o componentes SVG para los placeholders

## Archivos que Necesitan Atención

### Actualizados Automáticamente (después del Paso 4)
- ✅ `src/utils/constants.ts` - URLs de sucursales

### Requieren Revisión Manual
- ⚠️ `src/page-components/NotFoundPage.tsx` - Imagen trefa-no-encontrado.png
- ⚠️ `src/page-components/VehicleListPage.tsx` - Imagen trefa-no-encontrado.png
- ⚠️ `src/page-components/DashboardPage.tsx` - Imagen circulos-naranjas-trefa-fondo.png

## URLs Antiguas vs Nuevas

### Sucursales (✅ Listas para Migrar)

| Antigua | Nueva |
|---------|-------|
| `http://5.183.8.48/wp-content/uploads/2025/02/TREFA-San-JEronimo.jpg` | `https://r2.trefa.mx/branches/TREFA-San-JEronimo.jpg` |
| `http://5.183.8.48/wp-content/uploads/2025/02/Reynosa.jpg` | `https://r2.trefa.mx/branches/Reynosa.jpg` |
| `http://5.183.8.48/wp-content/uploads/2025/02/2023-02-03.jpg` | `https://r2.trefa.mx/branches/Guadalupe-2023-02-03.jpg` |
| `http://5.183.8.48/wp-content/uploads/2025/02/Saltillo-Autos-TREFA.jpeg` | `https://r2.trefa.mx/branches/Saltillo-Autos-TREFA.jpeg` |

### App (❌ No Disponibles - Requieren Solución)

| Antigua (NO EXISTE) | Nueva (Pendiente) |
|---------------------|-------------------|
| `http://5.183.8.48/wp-content/uploads/2024/09/trefa-no-encontrado.png` | `https://r2.trefa.mx/app/trefa-no-encontrado.png` ⚠️ |
| `http://5.183.8.48/wp-content/uploads/2024/09/circulos-naranjas-trefa-fondo.png` | `https://r2.trefa.mx/app/circulos-naranjas-trefa-fondo.png` ⚠️ |

## Limpieza Post-Migración

Después de completar la migración y verificar que todo funciona:

```bash
# Eliminar directorio temporal
rm -rf temp-images-migration

# Opcional: Eliminar scripts de migración si ya no los necesitas
# rm scripts/download-external-images.sh
# rm scripts/update-image-urls.js
# rm scripts/upload-to-r2.sh
```

## Verificación Final

1. Visita tu sitio web y verifica que las imágenes de sucursales se vean correctamente
2. Revisa las páginas que usan las imágenes PNG faltantes
3. Comprueba que no haya errores 404 en la consola del navegador
4. Haz commit de los cambios cuando todo esté funcionando

```bash
git add .
git commit -m "feat: Migrar imágenes de sucursales a Cloudflare R2"
git push
```
