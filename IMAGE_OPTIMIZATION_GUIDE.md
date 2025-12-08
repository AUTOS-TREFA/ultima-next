# Guía de Optimización de Imágenes con Next.js Image

**Fecha:** 2025-12-08
**Sistema:** Next.js 14 App Router + next/image

---

## 📊 Configuración Actual

### next.config.js

La configuración de imágenes ya está optimizada en `next.config.js`:

```javascript
images: {
  remotePatterns: [
    { protocol: 'https', hostname: 'pemgwyymodlwabaexxrb.supabase.co' },
    { protocol: 'https', hostname: 'r2.trefa.mx' },
    { protocol: 'https', hostname: 'cufm.mx' },
    { protocol: 'https', hostname: 'autostrefa.mx' },
    // ... más dominios permitidos
  ],
  formats: ['image/avif', 'image/webp'],
  deviceSizes: [640, 750, 828, 1080, 1200, 1920],
  imageSizes: [16, 32, 48, 64, 96, 128, 256],
}
```

**Beneficios:**
- ✅ Formatos modernos (AVIF, WebP) para 30-50% menos peso
- ✅ Optimización automática de imágenes
- ✅ Lazy loading por defecto
- ✅ Responsive images automáticas
- ✅ Cache de 1 año para imágenes estáticas

---

## 🎯 Componentes Disponibles

### 1. OptimizedImage (Genérico)

**Ubicación:** `src/components/OptimizedImage.tsx`

**Uso básico:**
```tsx
import OptimizedImage from '@/components/OptimizedImage';

<OptimizedImage
  src="/images/vehicle.jpg"
  alt="Honda Civic 2020"
  width={800}
  height={600}
/>
```

**Uso con fill (responsive):**
```tsx
<div className="relative w-full h-64">
  <OptimizedImage
    src={imageUrl}
    alt="Descripción"
    fill
    sizes="(max-width: 768px) 100vw, 50vw"
    className="object-cover"
  />
</div>
```

### 2. VehicleImage (Optimizado para vehículos)

**Características:**
- Aspect ratio 4:3 (estándar para fotos de autos)
- Sizes responsivos pre-configurados
- Fallback automático a placeholder

**Uso:**
```tsx
import { VehicleImage } from '@/components/OptimizedImage';

<div className="relative w-full aspect-[4/3]">
  <VehicleImage
    src={vehicle.feature_image[0]}
    alt={vehicle.title}
    priority={false}
  />
</div>
```

### 3. AvatarImage (Para perfiles)

**Uso:**
```tsx
import { AvatarImage } from '@/components/OptimizedImage';

<AvatarImage
  src={user.avatar}
  alt={user.name}
  size={128}
/>
```

---

## 🔄 Migración Gradual

### Componentes Priorizados para Migración

#### Alta Prioridad (Impacto SEO y Performance)

1. **VehicleDetailPage**
   - **Archivo:** `src/page-components/VehicleDetailPage.tsx`
   - **Líneas:** ~200+ usos de `<img>`
   - **Impacto:** Crítico (páginas de mayor tráfico)
   - **Beneficio:** Optimización de Core Web Vitals (LCP, CLS)

2. **VehicleGridCard**
   - **Archivo:** `src/components/VehicleGridCard.tsx`
   - **Líneas:** ~50
   - **Impacto:** Alto (listado de inventario)
   - **Beneficio:** Lazy loading automático, ahorro de ancho de banda

3. **HomePage**
   - **Archivo:** `src/page-components/HomePage.tsx`
   - **Líneas:** Variable
   - **Impacto:** Alto (landing page principal)
   - **Beneficio:** Mejor tiempo de carga inicial

#### Media Prioridad

4. **SimpleVehicleCard**
5. **VehicleCarousel**
6. **LazyImage** (reemplazar completamente)

#### Baja Prioridad

7. Componentes de administración
8. Imágenes de UI estáticas (logos, iconos)

---

## 📋 Checklist de Migración

### Antes de migrar un componente

- [ ] Leer el componente completo
- [ ] Identificar todos los usos de `<img>`
- [ ] Verificar si las imágenes son estáticas o dinámicas
- [ ] Revisar si hay lazy loading manual (remover si existe)
- [ ] Verificar si hay manejo de errores de imágenes

### Durante la migración

- [ ] Reemplazar `<img>` con `<OptimizedImage>` o componentes específicos
- [ ] Asegurar que cada imagen tiene `alt` text descriptivo
- [ ] Usar `fill` para imágenes responsive con contenedores
- [ ] Especificar `sizes` para optimización de bandwidth
- [ ] Usar `priority={true}` SOLO para imágenes above-the-fold

### Después de migrar

- [ ] Probar en development (npm run dev)
- [ ] Verificar que las imágenes se cargan correctamente
- [ ] Revisar Network tab (Chrome DevTools) - deben verse formatos WebP/AVIF
- [ ] Verificar Lighthouse score (debería mejorar LCP y Performance)
- [ ] Probar en mobile y desktop

---

## 🚀 Ejemplo de Migración

### Antes (con <img>)

```tsx
<img
  src={getVehicleImage(vehicle)}
  alt={vehicle.title}
  className="w-full h-full object-cover"
  loading="lazy"
  onError={(e) => {
    e.currentTarget.src = DEFAULT_PLACEHOLDER_IMAGE;
  }}
/>
```

### Después (con OptimizedImage)

```tsx
<div className="relative w-full h-full">
  <VehicleImage
    src={getVehicleImage(vehicle)}
    alt={vehicle.title}
    className="object-cover"
  />
</div>
```

---

## ⚠️ Consideraciones Importantes

### 1. Contenedores para imágenes con `fill`

Cuando usas `fill={true}`, la imagen DEBE estar dentro de un contenedor con `position: relative`:

```tsx
✅ CORRECTO:
<div className="relative w-full h-64">
  <OptimizedImage src={...} alt={...} fill />
</div>

❌ INCORRECTO:
<OptimizedImage src={...} alt={...} fill />
```

### 2. Priority vs Lazy Loading

- **`priority={true}`**: Solo para imágenes above-the-fold (primera pantalla visible)
- **Default (lazy)**: Para todas las demás imágenes

```tsx
// Hero image en homepage
<VehicleImage src={heroImage} alt="..." priority={true} />

// Imágenes en listado (abajo del fold)
<VehicleImage src={vehicleImage} alt="..." /> // lazy por defecto
```

### 3. Sizes para Responsive Images

El atributo `sizes` le dice al navegador qué tamaño de imagen cargar según el viewport:

```tsx
// Ejemplo: imagen que ocupa full width en móvil, 50% en tablet, 33% en desktop
sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
```

### 4. Tracking y Analytics

**IMPORTANTE:** La optimización de imágenes NO afecta el tracking.

- ✅ next/image es un componente cliente ('use client')
- ✅ Los eventos de tracking (Pixel, GTM) funcionan normalmente
- ✅ El lazy loading mejora el rendimiento sin afectar conversiones

---

## 📈 Beneficios Esperados

### Performance
- **LCP (Largest Contentful Paint):** Mejora de 30-50%
- **CLS (Cumulative Layout Shift):** Reducción significativa
- **Bandwidth:** Ahorro de 40-60% en peso de imágenes
- **Cache:** Revalidación automática con ISR

### SEO
- **Core Web Vitals:** Mejora en métricas de Google
- **Mobile Performance:** Carga más rápida en dispositivos móviles
- **Image Search:** Alt text optimizado para búsqueda de imágenes

### UX
- **Perceived Performance:** Placeholders durante carga
- **Smooth Loading:** Transiciones sin saltos (CLS)
- **Bandwidth Savings:** Menos datos consumidos en mobile

---

## 🔍 Debugging

### Ver qué formato se está sirviendo

1. Abrir Chrome DevTools
2. Ir a Network tab
3. Filtrar por "Img"
4. Cargar la página
5. Ver columna "Type" - debería mostrar `webp` o `avif`

### Verificar optimización

```bash
# Build de producción
npm run build

# Verificar en modo producción
npm start

# Revisar tamaño de imágenes optimizadas en .next/cache/images/
```

---

## ✅ Estado Actual

- ✅ Configuración de next.config.js optimizada
- ✅ Componentes OptimizedImage, VehicleImage, AvatarImage creados
- ✅ Documentación completa
- ⏳ Migración gradual pendiente (empezar por VehicleDetailPage)

---

## 📝 Próximos Pasos

1. **Migrar VehicleDetailPage** (mayor impacto)
2. **Migrar VehicleGridCard** (listado de inventario)
3. **Migrar HomePage** (landing principal)
4. **Medir mejoras** con Lighthouse antes/después
5. **Documentar resultados** en este archivo

---

**Última actualización:** 2025-12-08
**Mantenido por:** Claude Code
