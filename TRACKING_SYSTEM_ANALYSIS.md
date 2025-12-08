# Análisis del Sistema de Tracking

**Fecha:** 2025-12-08
**Sistema:** Next.js 14 + Supabase + Facebook Pixel + GTM + Google Analytics

---

## 📊 Arquitectura del Sistema de Tracking

### 1. Componentes Principales

```
RootClientLayout (Client Component)
├── ConversionTrackingService.initialize()
│   ├── MarketingConfigService (Supabase marketing_config)
│   ├── GTM DataLayer
│   └── Facebook Pixel
├── LeadSourceHandler (Captura UTM params)
└── MarketingEventsService (Guardado en Supabase)
```

### 2. Servicios de Tracking

#### ConversionTrackingService
**Ubicación:** `src/services/ConversionTrackingService.ts`

**Responsabilidades:**
- Inicializa GTM y Facebook Pixel en montaje
- Gestiona eventos de conversión unificados
- Extrae y transmite UTM parameters
- Guarda eventos en tabla `tracking_events`

**Eventos Principales:**
```typescript
// Eventos de Autenticación
- InitialRegistration (OTP verified o Google Sign-in)
  → Página: /acceder

// Eventos de Perfil
- PersonalInformationComplete (Profile updated)
  → Página: /escritorio/profile

- PerfilacionBancariaComplete (Bank profiling done)
  → Página: /escritorio/perfilacion-bancaria

// Eventos de Aplicación
- ComienzaSolicitud (Application started)
  → Página: /escritorio/aplicacion

- LeadComplete (Application submitted)
  → Página: /escritorio/aplicacion

// Eventos de Landing
- ConversionLandingPage (Landing page registration)
  → Página: /financiamientos

// Eventos Generales
- PageView (Todas las páginas)
- ViewContent (Vehicle details)
- Lead (Form submissions)
```

#### MarketingConfigService
**Ubicación:** `src/services/MarketingConfigService.ts`

**Configuración:**
```typescript
{
  gtm_container_id: 'GTM-KDVDMB4X',
  facebook_pixel_id: '846689825695126',
  google_analytics_id: 'G-E580PSBCHH',
  conversion_events: ConversionEvent[],
  active: true
}
```

**Funciones:**
- `initializeGTM()` - Carga GTM script
- `initializeFacebookPixel()` - Carga FB Pixel script
- `getConfig()` - Lee config desde Supabase o localStorage

#### LeadSourceHandler
**Ubicación:** `src/components/LeadSourceHandler.tsx`

**Captura:**
```typescript
{
  // UTM Parameters
  utm_source, utm_medium, utm_campaign, utm_term, utm_content,

  // Custom Tracking
  rfdm, ordencompra, fbclid, source,

  // Metadata
  referrer, landing_page, first_visit_at
}
```

**Almacenamiento:** `sessionStorage.leadSourceData`

### 3. Flujo de Tracking

```
1. Usuario llega al sitio
   ↓
2. LeadSourceHandler captura UTM params → sessionStorage
   ↓
3. RootClientLayout inicializa tracking
   ↓
4. Usuario navega/interactúa
   ↓
5. Eventos se disparan desde page-components
   ↓
6. ConversionTrackingService envía a:
   - GTM DataLayer (window.dataLayer.push)
   - Facebook Pixel (window.fbq)
   - Supabase tracking_events table
   - MarketingEventsService
```

### 4. Transmisión de Parámetros

#### En URLs
```
https://trefa.mx/autos?utm_source=facebook&utm_medium=cpc&utm_campaign=seminuevos&ordencompra=OC123
```

#### En SessionStorage
```json
{
  "utm_source": "facebook",
  "utm_medium": "cpc",
  "utm_campaign": "seminuevos",
  "ordencompra": "OC123",
  "referrer": "https://facebook.com",
  "landing_page": "https://trefa.mx/autos",
  "first_visit_at": "2025-12-08T10:00:00.000Z"
}
```

#### En Eventos de Tracking
```javascript
window.dataLayer.push({
  event: 'lead_complete',
  eventName: 'Lead Complete',
  eventType: 'LeadComplete',
  vehicleId: 'OC123',
  vehiclePrice: 350000,
  // UTM params automáticamente incluidos
  utm_source: 'facebook',
  utm_medium: 'cpc',
  utm_campaign: 'seminuevos',
  timestamp: '2025-12-08T10:00:00.000Z'
});
```

### 5. Tablas de Supabase

#### `tracking_events`
```sql
CREATE TABLE tracking_events (
  id uuid PRIMARY KEY,
  event_name text,
  event_type text,
  user_id uuid REFERENCES auth.users,
  session_id text,
  metadata jsonb,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  created_at timestamptz
);
```

#### `marketing_config`
```sql
CREATE TABLE marketing_config (
  id uuid PRIMARY KEY,
  gtm_container_id text,
  facebook_pixel_id text,
  google_analytics_id text,
  conversion_events jsonb,
  active boolean,
  created_at timestamptz,
  updated_at timestamptz
);
```

---

## 🎯 Eventos de Conversión por Página

### Páginas Públicas

| Página | Evento Principal | Tipo | Cuándo se Dispara |
|--------|-----------------|------|-------------------|
| `/` | PageView | PageView | Al cargar |
| `/autos` | PageView | PageView | Al cargar |
| `/autos/[slug]` | ViewContent | ViewContent | Al cargar detalles |
| `/acceder` | InitialRegistration | InitialRegistration | OTP verificado / Google Sign-in |
| `/registro` | InitialRegistration | InitialRegistration | Registro completado |
| `/financiamientos` | ConversionLandingPage | ConversionLandingPage | Formulario enviado |

### Páginas de Dashboard

| Página | Evento Principal | Tipo | Cuándo se Dispara |
|--------|-----------------|------|-------------------|
| `/escritorio/profile` | PersonalInformationComplete | PersonalInformationComplete | Info guardada |
| `/escritorio/perfilacion-bancaria` | PerfilacionBancariaComplete | PerfilacionBancariaComplete | Cuestionario completado |
| `/escritorio/aplicacion` | ComienzaSolicitud | Custom | Página cargada |
| `/escritorio/aplicacion` | LeadComplete | LeadComplete | Solicitud enviada |

---

## 🔧 Integración con Next.js

### Layout Actual (Root)
```tsx
// app/layout.tsx
export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://pemgwyymodlwabaexxrb.supabase.co" />
      </head>
      <body>
        <RootClientLayout>
          {children}
        </RootClientLayout>
      </body>
    </html>
  );
}
```

### Client Layout (Tracking)
```tsx
// app/RootClientLayout.tsx
'use client';

export default function RootClientLayout({ children }) {
  useEffect(() => {
    conversionTracking.initialize(); // ✅ Inicializa GTM y Pixel
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider>
        <AuthProvider>
          <LeadSourceHandler /> {/* ✅ Captura UTM params */}
          {children}
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
```

---

## ✅ Sistema Preservado en Wrappers

Los wrappers de Next.js **NO deben interferir** con:

1. ✅ **Captura de UTM parameters** - LeadSourceHandler se ejecuta globalmente
2. ✅ **Inicialización de tracking** - RootClientLayout maneja GTM/Pixel
3. ✅ **Eventos desde page-components** - Se mantienen intactos en componentes
4. ✅ **SessionStorage de leadSourceData** - Persiste en la sesión
5. ✅ **Guardado en tracking_events** - Automático por ConversionTrackingService

---

## 📝 Recomendaciones para Wrappers

### 1. Server Components para Metadata
```tsx
// app/autos/[slug]/page.tsx
import { Metadata } from 'next';
import VehicleDetailPage from '@/page-components/VehicleDetailPage';

// ✅ Server component - genera metadata
export async function generateMetadata({ params }): Promise<Metadata> {
  const vehicle = await getVehicle(params.slug);
  return {
    title: `${vehicle.title} | TREFA`,
    // ... metadata completa
  };
}

// ✅ Wrapper delgado - solo renderiza
export default function VehicleDetailRoute({ params }) {
  return <VehicleDetailPage slug={params.slug} />;
}
```

### 2. Client Components mantienen Tracking
```tsx
// src/page-components/VehicleDetailPage.tsx
'use client';

export default function VehicleDetailPage({ slug }) {
  useEffect(() => {
    // ✅ Tracking específico se mantiene aquí
    if (vehicle) {
      conversionTracking.trackViewContent(
        vehicle.title,
        'vehicle',
        {
          vehicleId: vehicle.id,
          vehiclePrice: vehicle.precio
        }
      );
    }
  }, [vehicle]);

  return (
    <>
      <VehicleStructuredData vehicle={vehicle} />
      {/* ... contenido */}
    </>
  );
}
```

### 3. UTM Parameters se Preservan Automáticamente
```typescript
// El tracking service extrae automáticamente de sessionStorage
const leadSourceData = sessionStorage.getItem('leadSourceData');
// Y los incluye en todos los eventos
```

---

## 📈 Dashboard de Analytics

**Ubicación:** `/escritorio/admin/marketing`

**Consume:**
- `tracking_events` table
- `financing_applications` table
- `profiles` table

**Funciones de Análisis:**
- `calculateFunnelData()` - Embudo de conversión
- `calculateCampaignMetrics()` - Métricas por campaña
- `calculateTimeSeriesMetrics()` - Series temporales
- `calculateSourcePerformance()` - Rendimiento por fuente
- `generateForecast()` - Predicciones
- `generateRecommendations()` - Recomendaciones automáticas

---

## ✅ Conclusión

El sistema de tracking está **completamente funcional** y **no requiere modificaciones**. Los wrappers de Next.js solo deben:

1. ✅ Añadir metadata para SEO
2. ✅ Generar datos estructurados (JSON-LD)
3. ✅ Renderizar el page-component existente
4. ❌ **NO tocar** la lógica de tracking
5. ❌ **NO modificar** la captura de UTM params
6. ❌ **NO alterar** el flujo de eventos

**El tracking ya está preservado en:**
- RootClientLayout (inicialización global)
- LeadSourceHandler (captura de params)
- Page-components (eventos específicos)
- ConversionTrackingService (transmisión unificada)
