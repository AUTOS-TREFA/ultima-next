# Actualizaciones de los Últimos 5 Días (Repositorio Original)

## Fecha: 6 de diciembre de 2025

Este documento resume las actualizaciones importadas del repositorio original (`/Users/marianomorales/Downloads/ultima copy`) de los últimos 5 días.

## Commits Analizados

Total de commits en los últimos 5 días: **29 commits**

## Actualizaciones Aplicadas

### 1. Componentes de Vehículos

#### VehicleCarousel.tsx (Commit 290bcc0)
**Cambios:**
- ✅ Tarjetas más grandes: viewport-based → tamaños fijos responsive (300-400px)
- ✅ Mejor espaciado: `gap-6` → `gap-4 sm:gap-5 lg:gap-7`
- ✅ Diseño shadcn con gradientes: `bg-gray-50` → `bg-gradient-to-br from-muted/20 to-muted/40`
- ✅ Botones de navegación más grandes con animaciones
- ✅ Iconos más grandes: `h-5 w-5` (antes sin tamaño definido)
- ✅ Animación hover en tarjetas: `hover:scale-[1.02]`
- ✅ Mejor soporte táctil para móviles: `touch-pan-x`, `WebkitOverflowScrolling`
- ✅ JSX style para ocultar scrollbar

#### VehicleGridCard.tsx (Commits ad6662c y 0de487e)
**Cambios:**
- ✅ Función `handleCardClick` para navegación al hacer clic en toda la tarjeta
- ✅ **OPTIMIZACIÓN CRÍTICA**: Límite de 3 imágenes en carousel (performance)
- ✅ Elimina `galeria_interior` del carousel (solo exterior + feature image)
- ✅ Bordes más redondeados: `rounded-2xl` → `rounded-3xl`
- ✅ Clases adicionales: `isolate`, `cursor-pointer`
- ✅ Z-index optimizado: `z-20` → `z-[2]` para botón favorito, `z-10` → `z-[1]` para Link
- ✅ Texto más pequeño en ordencompra: `text-xs` → `text-[11px]`
- ✅ Padding reducido en promociones: `px-2` → `px-1.5`
- ✅ Pasa prop `isPopular` a ImageCarousel
- ✅ `pointer-events-none` en Link para evitar conflictos

#### VehicleCardHeader.tsx
**Estado:** ✅ Ya está actualizado (idéntico en ambos repositorios)

### 2. Migración de Base de Datos

#### 20251206_update_get_filter_options_ubicacion_mapping.sql
**Propósito:** Mapear códigos de ubicación a nombres completos

**Cambios:**
- ✅ Mapea `MTY` → `Monterrey`
- ✅ Mapea `GPE` → `Guadalupe`
- ✅ Mapea `TMPS` → `Reynosa`
- ✅ Mapea `COAH` → `Saltillo`
- ✅ Maneja múltiples ubicaciones separadas por comas
- ✅ Usa `unnest(string_to_array())` para procesar arrays de ubicaciones

**Nota:** Esta migración está en `.gitignore` pero se creó localmente para aplicarla a la base de datos.

### 3. Servicios y Utilidades (No Aplicados - No Relevantes para /autos)

Los siguientes archivos se modificaron en el repositorio original pero **NO** se aplicaron al proyecto Next.js porque no son relevantes para las páginas `/autos` y `/autos/[slug]`:

- `src/lib/surveyAnalytics.ts` - Relacionado con encuestas
- `src/lib/surveyQuestions.ts` - Relacionado con encuestas
- `src/services/ApplicationService.ts` - Relacionado con solicitudes de financiamiento
- `src/services/profileService.ts` - Relacionado con perfiles de usuario
- `src/services/SalesService.ts` - Relacionado con ventas y asesores
- `src/utils/formatters.ts` - Mapeos de promociones (no afecta visualización de vehículos)
- `src/utils/queryClientConfig.ts` - Configuración de React Query (ya migrado anteriormente)

### 4. Commits Relevantes Importados

| Commit | Descripción | Estado |
|--------|-------------|--------|
| `290bcc0` | Rediseña componentes Mi Asesor y Vistos Recientemente más grandes y responsive | ✅ Aplicado |
| `ad6662c` | Mantener ordencompra y promociones en misma línea con mejor tamaño | ✅ Aplicado |
| `0de487e` | Corrige filtro de sucursal y mejora diseño de promociones | ✅ Aplicado |

## Mejoras Aplicadas

### Diseño y UX
1. **Componentes más grandes y visibles** - Mejor jerarquía visual en mobile y desktop
2. **Animaciones suaves** - `hover:scale-105`, `hover:scale-[1.02]`
3. **Sistema de diseño Shadcn** - Uso de `muted`, `foreground`, `accent` para consistencia
4. **Mejor accesibilidad táctil** - Touch-optimizado para móviles

### Performance
1. **Límite de 3 imágenes** - Reduce carga en VehicleGridCard carousel
2. **Eliminación de galeria_interior** - Solo usa imágenes exteriores relevantes
3. **Z-index optimizado** - Usa valores arbitrarios más eficientes (`z-[1]`, `z-[2]`)

### Funcionalidad
1. **Click en toda la tarjeta** - Mejor UX con `handleCardClick`
2. **Filtro de sucursales correcto** - Mapeo de códigos a nombres completos
3. **Navegación mejorada** - Separa concerns entre Link y click handler

## Archivos Modificados

```
src/components/VehicleCarousel.tsx                                         (+35, -18)
src/components/VehicleGridCard.tsx                                         (+23, -10)
supabase/migrations/20251206_update_get_filter_options_ubicacion_mapping.sql (nuevo)
images/sucursales/QUICK_REFERENCE.jpg                                      (nuevo)
images/sucursales/Reynosa.jpg                                              (nuevo)
images/sucursales/guadalupe.jpg                                            (nuevo)
images/sucursales/saltillo.jpeg                                            (nuevo)
```

## Próximos Pasos

### Aplicar Migraciones de Base de Datos

**IMPORTANTE:** Usa el script personalizado para aplicar solo las migraciones recientes:

```bash
bash scripts/apply-recent-migrations.sh
```

Este script aplica **solo las 5 migraciones del 5-6 de diciembre**:
1. `20251205000001_optimize_indexes_remove_redundant.sql` - Optimización de índices
2. `20251205000002_optimize_indexes_add_critical.sql` - Índices críticos
3. `20251206_add_missing_columns.sql` - Columnas faltantes (tokens de carga)
4. `20251206_create_document_upload_metrics.sql` - Vista de métricas de documentos
5. `20251206_update_get_filter_options_ubicacion_mapping.sql` - Mapeo de ubicaciones

**¿Por qué no usar `npx supabase db push`?**
- La base de datos ya fue migrada con `pg_dump` el 6 de diciembre
- `supabase db push` intentaría aplicar 89+ migraciones que ya existen
- Esto causaría conflictos y errores

### Pendientes de Verificación
1. ⏳ Aplicar migraciones con `bash scripts/apply-recent-migrations.sh`
2. ⏳ Verificar que el filtro de sucursales funcione correctamente en `/autos`
3. ⏳ Probar el diseño responsive en mobile y desktop
4. ⏳ Verificar que el límite de 3 imágenes no afecte la experiencia

### No Requieren Acción
- ✅ Auto.tsx y Autos.tsx no cambiaron en últimos 10 días
- ✅ VehicleService.ts no cambió (problema de "0 vehículos" es de datos, no código)
- ✅ Servicios de encuestas, aplicaciones y ventas no son relevantes para /autos

## Notas Técnicas

### Diferencias entre Repositorios
- **Original (React/Vite):** Usa `react-router-dom` (Link to=, useNavigate)
- **Next.js:** Usa `next/link` (Link href=, useRouter) - ✅ Ya adaptado

### Compatibilidad
- Todos los cambios son compatibles con Next.js 14.2.33
- Los componentes mantienen `'use client'` directive
- Las animaciones usan Tailwind CSS classes estándar
- Los cambios no requieren nuevas dependencias

## Resumen

**Total de actualizaciones aplicadas:** 3 commits principales
**Archivos modificados:** 2 componentes + 1 migración
**Mejoras clave:** Performance (límite de imágenes), Diseño (Shadcn), UX (click handling)
**Commits en GitHub:** 397ed30

---

**Fecha de actualización:** 6 de diciembre de 2025
**Estado:** ✅ Completado
**Próximo paso:** Aplicar migración de base de datos y probar funcionalidad
