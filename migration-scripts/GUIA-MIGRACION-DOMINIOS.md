# Guía de Migración de Dominios

**Fecha:** 18 Diciembre 2024
**Proyecto:** Ultima NextJS - Autostrefa
**Objetivo:** Migrar de autostrefa.mx → trefa.mx

---

## 📋 Situación Actual

### Dominios Actuales
- **Producción (antigua)**: `trefa.mx` → Cloud Run service "producción"
- **Desarrollo (nueva app NextJS)**: `autostrefa.mx` → Cloud Run service "desarrollo"

### Objetivo de Migración
1. Mantener `trefa.mx` como dominio principal
2. Redireccionar `autostrefa.mx` → `trefa.mx`
3. Servir la aplicación NextJS (actualmente en autostrefa.mx) desde `trefa.mx`

---

## 🎯 Estrategia Recomendada

### Opción A: Swap de Cloud Run Services (RECOMENDADO) ⭐

**Por qué es mejor:**
- ✅ Evita re-deployment completo
- ✅ Rollback instantáneo si algo falla
- ✅ Mantiene configuraciones existentes
- ✅ Downtime mínimo (~5 min)

**Proceso:**
1. Agregar `trefa.mx` como dominio custom al servicio "desarrollo"
2. Esperar propagación DNS (~5-10 min)
3. Probar que funcione en `trefa.mx`
4. Remover `trefa.mx` del servicio "producción"
5. Configurar redirect `autostrefa.mx` → `trefa.mx`

### Opción B: Re-deployment en Servicio Existente

**Proceso:**
1. Pushear código NextJS al servicio "producción" (trefa.mx)
2. Configurar todas las variables de entorno
3. Re-build y deploy

**Desventajas:**
- ❌ Downtime más largo (~20-30 min)
- ❌ Rollback más complejo
- ❌ Necesitas re-configurar todo

---

## 🔧 Cambios CRÍTICOS Requeridos

### 1. Variables de Entorno (.env.local)

**ANTES (desarrollo):**
```bash
NEXT_PUBLIC_SITE_URL=https://autostrefa.mx
```

**DESPUÉS (producción):**
```bash
NEXT_PUBLIC_SITE_URL=https://trefa.mx
```

**⚠️ IMPORTANTE:**
- Las variables `NEXT_PUBLIC_*` se **bake-in al build**
- Necesitas hacer **nuevo build** después de cambiar esta variable
- Si usas Cloud Run, configúralas en "Environment Variables"

**Comando para rebuild:**
```bash
npm run build
# O si usas Docker:
docker build -t trefa-nextjs .
```

---

### 2. Supabase Auth - Redirect URLs

**Dashboard de Supabase:** Settings → Authentication → URL Configuration

**Agregar estos URLs:**
```
https://trefa.mx/auth/callback
https://trefa.mx/auth/callback?redirect=/escritorio
https://trefa.mx
```

**Mantener temporalmente (para rollback):**
```
https://autostrefa.mx/auth/callback
https://autostrefa.mx/auth/callback?redirect=/escritorio
https://autostrefa.mx
```

**Site URL principal:**
```
https://trefa.mx
```

**Verificar en:** Supabase Dashboard → Authentication → URL Configuration
- Site URL: `https://trefa.mx`
- Redirect URLs: Incluir ambos dominios durante transición

---

### 3. Supabase Edge Functions - CORS

Las Edge Functions necesitan permitir el nuevo dominio para CORS.

**Verificar en cada función crítica:**

```typescript
// Ejemplo: supabase/functions/rapid-processor/index.ts
const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // ✅ Ya permite todo
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
```

**✅ BUENA NOTICIA:** Tus Edge Functions ya usan `*` para CORS, no necesitas cambios.

---

### 4. Edge Functions - PUBLIC_SITE_URL

**Funciones que dependen de PUBLIC_SITE_URL:**
1. `sitemap-generator` - Genera sitemap.xml con URLs del sitio
2. `catalogo-facebook` - Feed de Facebook con URLs de productos
3. `facebook-inventory-feed` - Inventario para Facebook

**Actualizar en Supabase:**
```bash
# Configurar el nuevo dominio
supabase secrets set PUBLIC_SITE_URL="https://trefa.mx" --project-ref pemgwyymodlwabaexxrb
```

**Verificar:**
```bash
supabase secrets list --project-ref pemgwyymodlwabaexxrb
```

**Re-deploy funciones afectadas:**
```bash
supabase functions deploy sitemap-generator --project-ref pemgwyymodlwabaexxrb
supabase functions deploy catalogo-facebook --project-ref pemgwyymodlwabaexxrb
supabase functions deploy facebook-inventory-feed --project-ref pemgwyymodlwabaexxrb
```

---

### 5. next.config.js - Image Hostnames

**Ya configurado correctamente ✅**

Tu `next.config.js` ya permite imágenes de ambos dominios:

```javascript
images: {
  remotePatterns: [
    { protocol: 'https', hostname: 'autostrefa.mx' },
    { protocol: 'https', hostname: 'www.autostrefa.mx' },
    { protocol: 'https', hostname: 'r2.trefa.mx' }, // ✅ Ya usa trefa.mx
    { protocol: 'https', hostname: 'images.trefa.mx' }, // ✅ Ya usa trefa.mx
  ]
}
```

**ACCIÓN OPCIONAL:** Agregar `trefa.mx` si hay referencias directas:

```javascript
{
  protocol: 'https',
  hostname: 'trefa.mx',
},
{
  protocol: 'https',
  hostname: 'www.trefa.mx',
},
```

---

### 6. Cloudflare R2 - URLs de Imágenes

**Ya configurado correctamente ✅**

Tu `.env.local` ya usa dominios de `trefa.mx`:

```bash
NEXT_PUBLIC_IMAGE_CDN_URL=https://images.trefa.mx
NEXT_PUBLIC_CLOUDFLARE_R2_PUBLIC_URL=https://r2.trefa.mx
```

**No requiere cambios.**

---

### 7. OAuth Providers (Google, etc.)

**Si usas Google OAuth:**

1. Ve a [Google Cloud Console](https://console.cloud.google.com)
2. APIs & Services → Credentials
3. OAuth 2.0 Client IDs → Editar
4. **Authorized redirect URIs** → Agregar:
   ```
   https://trefa.mx/auth/callback
   https://pemgwyymodlwabaexxrb.supabase.co/auth/v1/callback
   ```

**Mantener temporalmente:**
```
https://autostrefa.mx/auth/callback
```

---

### 8. Webhooks Externos

**Verificar y actualizar URLs en:**

```bash
# .env.local - Estos son webhooks SALIENTES (no requieren cambio)
NEXT_PUBLIC_LEAD_CONNECTOR_WEBHOOK_URL=...
NEXT_PUBLIC_LANDING_WEBHOOK_URL=...
NEXT_PUBLIC_APPLICATION_WEBHOOK_URL=...
```

**⚠️ Webhooks ENTRANTES (si existen):**
- Airtable → Si tienes webhooks que apuntan a tu app
- Kommo → Si envían webhooks a tu app
- Actualizar en sus dashboards: `autostrefa.mx` → `trefa.mx`

---

### 9. Sitemap y SEO

**Archivos a actualizar post-migración:**

1. **public/robots.txt** (si existe)
   ```
   Sitemap: https://trefa.mx/sitemap.xml
   ```

2. **Sitemap dinámico** - Ya usa `NEXT_PUBLIC_SITE_URL` ✅
   - Se actualizará automáticamente al cambiar la variable de entorno

3. **Canonical URLs** - Verificar en:
   - `app/(public)/autos/[slug]/page.tsx:10` - Ya usa `NEXT_PUBLIC_SITE_URL` ✅

---

### 10. Google Analytics / Facebook Pixel

**Verificar configuración:**

```bash
# .env.local
NEXT_PUBLIC_FB_PIXEL_ID=your-facebook-pixel-id
NEXT_PUBLIC_GTM_ID=your-gtm-id
```

**Acciones:**
1. **Google Analytics:** Agregar `trefa.mx` como propiedad permitida
2. **Facebook Pixel:** Agregar `trefa.mx` en Business Manager → Pixels → Settings
3. **Google Tag Manager:** Actualizar triggers si tienen filtros de dominio

---

### 11. Cloud Run - Configuración de Dominio

#### Opción A: Agregar dominio custom al servicio "desarrollo"

```bash
# 1. Agregar mapping
gcloud run services add-iam-policy-binding desarrollo \
  --member="allUsers" \
  --role="roles/run.invoker" \
  --region=us-central1

# 2. Crear domain mapping
gcloud run domain-mappings create --service=desarrollo --domain=trefa.mx --region=us-central1

# 3. Verificar DNS records (te dará records para configurar en tu DNS)
gcloud run domain-mappings describe --domain=trefa.mx --region=us-central1
```

**Configurar en tu DNS (Cloudflare, etc.):**
```
Tipo: A
Host: @
Value: [IP proporcionada por Cloud Run]

Tipo: AAAA
Host: @
Value: [IPv6 proporcionada por Cloud Run]
```

#### Opción B: Re-deploy en servicio existente

```bash
# Configurar variables de entorno en Cloud Run
gcloud run services update produccion \
  --set-env-vars NEXT_PUBLIC_SITE_URL=https://trefa.mx \
  --region=us-central1

# Deploy nueva imagen
gcloud run deploy produccion \
  --image gcr.io/[PROJECT-ID]/trefa-nextjs:latest \
  --region=us-central1
```

---

### 12. Cookies y Sesiones

**Supabase Auth Cookies:**
- Se configuran automáticamente por dominio
- Al cambiar a `trefa.mx`, los usuarios existentes perderán sesión
- **Solución:** Comunicar a usuarios que necesitarán re-login

**⚠️ IMPORTANTE:**
- Las sesiones activas en `autostrefa.mx` NO se transferirán a `trefa.mx`
- Usuarios deberán hacer login nuevamente
- Considerar comunicación previa a usuarios

---

## 🚀 Plan de Ejecución Paso a Paso

### Fase 1: Pre-Migración (1-2 horas)

#### 1.1 Backup Completo
```bash
# Backup de base de datos (ya cubierto en migración principal)
# Backup de servicio Cloud Run actual
gcloud run services describe produccion --region=us-central1 > backup-produccion-config.yaml
gcloud run services describe desarrollo --region=us-central1 > backup-desarrollo-config.yaml
```

#### 1.2 Actualizar Variables de Entorno Localmente
```bash
# Editar .env.local
NEXT_PUBLIC_SITE_URL=https://trefa.mx

# Rebuild local para verificar
npm run build
npm run start

# Probar que todo funciona en localhost
```

#### 1.3 Configurar Supabase Secrets
```bash
# Actualizar PUBLIC_SITE_URL en Edge Functions
supabase secrets set PUBLIC_SITE_URL="https://trefa.mx" --project-ref pemgwyymodlwabaexxrb

# Re-deploy funciones críticas
supabase functions deploy sitemap-generator --project-ref pemgwyymodlwabaexxrb
supabase functions deploy catalogo-facebook --project-ref pemgwyymodlwabaexxrb
supabase functions deploy facebook-inventory-feed --project-ref pemgwyymodlwabaexxrb
```

#### 1.4 Actualizar Redirect URLs en Supabase
1. Ir a Supabase Dashboard → Authentication → URL Configuration
2. Agregar:
   - Site URL: `https://trefa.mx`
   - Redirect URLs:
     - `https://trefa.mx/**`
     - `https://trefa.mx/auth/callback`
3. Mantener `autostrefa.mx` temporalmente

#### 1.5 Actualizar OAuth Providers
- Google Cloud Console → Agregar redirect URI
- Cualquier otro OAuth provider que uses

---

### Fase 2: Migración de Dominio (30-45 min)

#### Opción A: Swap de Services (RECOMENDADO)

```bash
# 1. Actualizar variables de entorno en servicio "desarrollo"
gcloud run services update desarrollo \
  --set-env-vars NEXT_PUBLIC_SITE_URL=https://trefa.mx \
  --region=us-central1

# 2. Re-build y deploy con nueva variable
# (Si las variables NEXT_PUBLIC_ están en el código, necesitas rebuild)
npm run build
docker build -t gcr.io/[PROJECT-ID]/trefa-nextjs:latest .
docker push gcr.io/[PROJECT-ID]/trefa-nextjs:latest

gcloud run deploy desarrollo \
  --image gcr.io/[PROJECT-ID]/trefa-nextjs:latest \
  --region=us-central1

# 3. Agregar trefa.mx como custom domain al servicio "desarrollo"
gcloud run domain-mappings create \
  --service=desarrollo \
  --domain=trefa.mx \
  --region=us-central1

# 4. Obtener DNS records
gcloud run domain-mappings describe \
  --domain=trefa.mx \
  --region=us-central1

# 5. Configurar DNS en Cloudflare/tu proveedor
# (Agregar A/AAAA records proporcionados)

# 6. Esperar propagación DNS (5-10 min)
# Verificar con: dig trefa.mx

# 7. Probar que funcione
curl https://trefa.mx

# 8. Si todo funciona, remover trefa.mx del servicio "producción"
gcloud run domain-mappings delete --domain=trefa.mx --region=us-central1

# 9. Configurar redirect autostrefa.mx → trefa.mx
# (Ver sección de Redirects abajo)
```

---

### Fase 3: Redirects (15 min)

#### Opción 1: Redirect en Cloud Run

Crear servicio pequeño de redirect:

```javascript
// redirect-service/index.js
const express = require('express');
const app = express();

app.get('*', (req, res) => {
  const newUrl = `https://trefa.mx${req.path}${req.url.includes('?') ? req.url.substring(req.url.indexOf('?')) : ''}`;
  res.redirect(301, newUrl);
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Redirect service listening on port ${PORT}`);
});
```

Deploy:
```bash
gcloud run deploy autostrefa-redirect \
  --source redirect-service \
  --region=us-central1 \
  --allow-unauthenticated

# Mapear autostrefa.mx a este servicio
gcloud run domain-mappings create \
  --service=autostrefa-redirect \
  --domain=autostrefa.mx \
  --region=us-central1
```

#### Opción 2: Redirect en Cloudflare (MÁS FÁCIL)

Si usas Cloudflare para DNS:

1. Cloudflare Dashboard → Rules → Page Rules
2. Crear regla:
   - URL: `autostrefa.mx/*`
   - Setting: Forwarding URL (301 Permanent Redirect)
   - Destination: `https://trefa.mx/$1`

---

### Fase 4: Post-Migración (30 min)

#### 4.1 Verificación Completa
```bash
# Verificar que trefa.mx funciona
curl -I https://trefa.mx
# Debe retornar 200 OK

# Verificar redirect
curl -I https://autostrefa.mx
# Debe retornar 301 y Location: https://trefa.mx

# Verificar auth
# Hacer login en https://trefa.mx
# Verificar que redirecciona correctamente

# Verificar sitemap
curl https://trefa.mx/sitemap.xml
# Debe mostrar URLs con trefa.mx

# Verificar imágenes R2
# Abrir https://trefa.mx/catalogo
# Verificar que imágenes cargan desde r2.trefa.mx
```

#### 4.2 Notificación a Usuarios
```
Subject: Actualización de Dominio - Trefa

Estimado cliente,

Hemos migrado nuestra plataforma a nuestro dominio principal:
https://trefa.mx

Por seguridad, necesitarás volver a iniciar sesión.

Gracias por tu comprensión.
```

#### 4.3 Actualizar Documentación
- README.md
- Documentación interna
- Links en materiales de marketing

---

## 📊 Checklist de Verificación

### Pre-Migración
- [ ] Backup de base de datos completado
- [ ] Backup de configuración Cloud Run
- [ ] `.env.local` actualizado con `NEXT_PUBLIC_SITE_URL=https://trefa.mx`
- [ ] Build local exitoso con nueva variable
- [ ] Supabase Redirect URLs actualizados
- [ ] Supabase `PUBLIC_SITE_URL` secret actualizado
- [ ] Edge Functions críticas re-deployed
- [ ] OAuth providers actualizados (Google, etc.)

### Durante Migración
- [ ] Variables de entorno actualizadas en Cloud Run
- [ ] Nuevo build deployed con `NEXT_PUBLIC_SITE_URL=https://trefa.mx`
- [ ] Custom domain `trefa.mx` agregado al servicio correcto
- [ ] DNS records actualizados
- [ ] DNS propagado (verificar con `dig trefa.mx`)
- [ ] `https://trefa.mx` responde correctamente
- [ ] Redirect `autostrefa.mx` → `trefa.mx` configurado

### Post-Migración
- [ ] Login funciona en `https://trefa.mx`
- [ ] Callbacks de auth funcionan
- [ ] Imágenes R2 cargan correctamente
- [ ] Sitemap muestra URLs con `trefa.mx`
- [ ] Facebook catalog usa `trefa.mx`
- [ ] Webhooks entrantes actualizados
- [ ] Google Analytics recibe datos de `trefa.mx`
- [ ] Usuarios notificados sobre cambio
- [ ] Documentación actualizada

---

## 🆘 Rollback Plan

**Si algo sale mal:**

### Rollback Rápido (5 min)
```bash
# 1. Remover custom domain del servicio nuevo
gcloud run domain-mappings delete --domain=trefa.mx --region=us-central1

# 2. Re-agregar al servicio antiguo
gcloud run domain-mappings create \
  --service=produccion \
  --domain=trefa.mx \
  --region=us-central1

# 3. Actualizar DNS de vuelta (si cambiaste)
```

### Rollback de Variables
```bash
# Revertir PUBLIC_SITE_URL en Supabase
supabase secrets set PUBLIC_SITE_URL="https://autostrefa.mx" --project-ref pemgwyymodlwabaexxrb

# Re-deploy Edge Functions
supabase functions deploy sitemap-generator --project-ref pemgwyymodlwabaexxrb
supabase functions deploy catalogo-facebook --project-ref pemgwyymodlwabaexxrb
```

---

## 💡 Recomendaciones Finales

### 1. Timing
- Ejecutar migración de dominio en **horario de bajo tráfico** (madrugada)
- Tener **equipo disponible** para monitoreo
- Ventana de mantenimiento: 1 hora

### 2. Comunicación
- **Pre-anuncio** (24h antes): "Mañana habrá mantenimiento programado"
- **Durante**: Página de mantenimiento si es posible
- **Post**: Email a usuarios activos sobre re-login

### 3. Monitoreo
```bash
# Logs de Cloud Run
gcloud run services logs read desarrollo --region=us-central1 --limit=50

# Métricas
gcloud run services describe desarrollo --region=us-central1 --format="get(status.url)"
```

### 4. SEO
- Mantener redirect 301 `autostrefa.mx` → `trefa.mx` **permanente**
- Actualizar Google Search Console con nuevo dominio
- Sitemap se regenerará automáticamente con nuevas URLs

### 5. Performance
- Primera carga puede ser lenta (cold start)
- Considerar "warm-up" requests antes de anunciar
- Monitorear tiempos de respuesta primeras horas

---

**Última actualización:** 2025-12-18
