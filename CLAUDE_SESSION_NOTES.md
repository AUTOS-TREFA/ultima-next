# Notas de Sesión Claude - TREFA Auto Inventory

## Resumen del Proyecto
TREFA es una plataforma de venta de autos seminuevos con financiamiento en línea. El proyecto está construido con:
- **Framework**: Next.js 14.2 (App Router)
- **UI**: Tailwind CSS + shadcn/ui + shadcn-studio blocks
- **Base de datos**: Supabase (PostgreSQL)
- **Autenticación**: Supabase Auth
- **Hosting**: Google Cloud Run
- **CDN de imágenes**: Cloudflare R2

---

## Tablas de Base de Datos Principales

### Tablas que debes leer ANTES de hacer cambios:

```sql
-- Perfiles de usuario
profiles (id, email, full_name, phone, role, created_at, ...)

-- Solicitudes de financiamiento
financing_applications (id, user_id, vehicle_id, status, bank_responses, ...)

-- Documentos subidos
upload_documents (id, application_id, document_type, file_url, ...)

-- Perfiles bancarios (pre-aprobación)
bank_profiles (id, user_id, monthly_income, credit_score, ...)

-- Vehículos (sincronizados desde Intelimotor)
vehicles (id, slug, titulo, precio, marca, modelo, autoano, kilometraje, ...)

-- Eventos de tracking
tracking_events (id, event_name, user_id, session_id, metadata, ...)
```

### Notas importantes:
- **tracking_events**: Tabla muy grande, excluida del backup por timeout SSL
- **vehicles**: Se sincroniza desde API externa (Intelimotor), no modificar directamente
- **profiles**: Tiene trigger `handle_new_user` - revisar antes de cambiar estructura

---

## Cambios Completados en Esta Sesión

### 1. Hero Section con Vehículos (`/src/components/HeroWithVehicles.tsx`)
- ✅ Título rotativo con 6 frases (cada 3 segundos)
- ✅ Cards de vehículos con overlay on hover
- ✅ Marquee vertical con fade superior/inferior
- ✅ CTAs en naranja (#FF6801)
- ✅ Estrellas color dorado (amber-400)
- ✅ Separación vertical aumentada entre cards
- ✅ Animación `text-rotate-in` agregada a globals.css

### 2. Página de Detalle de Auto V2 (`/src/components/shadcn-studio/blocks/vehicle-product-overview/`)
- ✅ Galería de imágenes con flechas de navegación
- ✅ Slider de thumbnails debajo de imagen principal
- ✅ Sección de garantía (condicional si `vehicle.garantia`)
- ✅ Precio en naranja, más pequeño y bold
- ✅ Removidos alertas de financiamiento e interés

### 3. Correcciones de Infraestructura
- ✅ Backup script excluye `tracking_events` (SSL timeout)
- ✅ Docker build con `--no-cache` para resolver SWC binary mismatch
- ✅ Desplegado exitosamente a producción

---

## Cambios Pendientes / TODO

### Alta Prioridad

#### SEO y Metadata
- [ ] Implementar `generateMetadata` dinámico en `/autos/[slug]/page.tsx`
- [ ] Agregar structured data (JSON-LD) para vehículos
- [ ] Optimizar Open Graph images dinámicas
- [ ] Revisar y mejorar `sitemap.xml` generado
- [ ] Implementar canonical URLs

#### Performance
- [ ] Implementar Image optimization con `next/image` en todas las páginas
- [ ] Agregar `loading="lazy"` y `priority` según viewport
- [ ] Implementar ISR (Incremental Static Regeneration) en páginas de vehículos
- [ ] Reducir bundle size - revisar imports innecesarios
- [ ] Implementar prefetching estratégico

#### Estado y Cache
- [ ] Implementar React Query o SWR para cache de datos
- [ ] Revisar y optimizar re-renders innecesarios
- [ ] Implementar optimistic updates en formularios

### Media Prioridad

#### Routing y Páginas
- [ ] Migrar `/autos/[slug]` a usar el nuevo diseño de `/autos-v2/[slug]`
- [ ] Unificar layouts entre páginas públicas
- [ ] Implementar breadcrumbs dinámicos
- [ ] Agregar página 404 personalizada con sugerencias
- [ ] Implementar página de error personalizada

#### Testing
- [ ] Configurar Jest + React Testing Library
- [ ] Tests unitarios para componentes críticos
- [ ] Tests E2E con Playwright para flujos principales:
  - Flujo de solicitud de financiamiento
  - Búsqueda y filtrado de vehículos
  - Autenticación
- [ ] Tests de accesibilidad (a11y)

#### Tracking y Analytics
- [ ] Revisar implementación de tracking_events
- [ ] Implementar eventos de conversión
- [ ] Agregar tracking de scroll depth
- [ ] Implementar heatmaps (considerar Hotjar/Clarity)
- [ ] UTM parameter handling mejorado

### Baja Prioridad

#### Diseño y Consistencia
- [ ] Crear design tokens centralizados
- [ ] Documentar componentes en Storybook
- [ ] Unificar espaciados y tipografía
- [ ] Revisar responsive design en tablets
- [ ] Implementar dark mode (si se requiere)

#### Optimizaciones Adicionales
- [ ] Implementar Service Worker para offline support
- [ ] Agregar Web Vitals monitoring
- [ ] Optimizar fonts (subset, preload)
- [ ] Implementar API rate limiting
- [ ] Revisar y optimizar queries de Supabase

---

## Estructura de Archivos Clave

```
/app
├── (public)/           # Rutas públicas con layout compartido
│   ├── autos/          # Listado y detalle de vehículos
│   ├── autos-v2/       # Nueva versión de detalle (shadcn-studio)
│   └── financiamientos/
├── (standalone)/       # Páginas sin layout (explorar, landing)
├── escritorio/         # Dashboard interno (admin/ventas)
└── globals.css         # Estilos globales + animaciones

/src
├── components/
│   ├── ui/             # Componentes shadcn/ui
│   ├── shadcn-studio/  # Blocks de shadcn-studio
│   └── HeroWithVehicles.tsx
├── lib/
│   └── supabase/       # Cliente y helpers de Supabase
├── types/
│   └── types.ts        # Tipos TypeScript (Vehicle, etc.)
└── utils/
    └── getVehicleImage.ts

/scripts
├── backup-database.sh  # Backup de Supabase (excluye tracking_events)
└── deploy.sh           # Deploy a Cloud Run
```

---

## Comandos Útiles

```bash
# Desarrollo
npm run dev

# Build local
npm run build

# Deploy a producción
echo "yes" | ./deploy.sh production

# Ver logs de Cloud Run
gcloud run logs tail next-js-trefa --region=us-central1

# Backup de base de datos
./scripts/backup-database.sh
```

---

## Variables de Entorno Requeridas

Ver `cloud-build-vars.yaml` para la lista completa. Las principales:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_IMAGE_CDN_URL` (https://r2.trefa.mx)
- `NEXT_PUBLIC_INTELIMOTOR_BUSINESS_UNIT_ID`

---

## Problemas Conocidos

1. **SSL Timeout en backup**: La tabla `tracking_events` causa timeout durante pg_dump. Solución: excluida del backup.

2. **SWC Binary Mismatch**: Docker build puede fallar con cache stale. Solución: `--no-cache` agregado al deploy.

3. **Warnings de Tailwind**: Clases `ease-[cubic-bezier(...)]` generan warnings pero funcionan.

4. **useSearchParams warnings**: Páginas `/explorar` y `/financiamientos` hacen deopting a client-side rendering.

---

## URLs de Producción

- **Sitio principal**: https://autostrefa.mx
- **Health check**: https://autostrefa.mx/healthz
- **Cloud Run URL**: https://next-js-trefa-1052659336338.us-central1.run.app

---

## Contacto y Recursos

- **Repositorio**: https://github.com/AUTOS-TREFA/ultima-next
- **Supabase Dashboard**: https://supabase.com/dashboard/project/pemgwyymodlwabaexxrb
- **Cloud Run Console**: Google Cloud Console > Cloud Run > next-js-trefa

---

*Última actualización: 2025-12-13*
*Commit más reciente: ab82b5c (fix: Agregar --no-cache a docker build para SWC)*
