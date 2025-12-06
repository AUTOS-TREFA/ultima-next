# Solución a Problemas Post-Migración

## Problema 1: Home Page muestra "0 vehículos"

### Causa
El código consulta la tabla `inventario_cache` (ver `src/services/VehicleService.ts:251`), que probablemente:
1. Está vacía en la base de datos migrada
2. Tiene políticas RLS bloqueando el acceso anónimo
3. Es una tabla de caché que necesita ser poblada desde `autos_inventario` o `autos_publicados`

### Verificación
```sql
-- Verificar si la tabla existe y tiene datos
SELECT COUNT(*) FROM inventario_cache WHERE ordenstatus = 'Comprado';

-- Verificar tablas alternativas
SELECT COUNT(*) FROM autos_publicados WHERE disponible = true;
SELECT COUNT(*) FROM autos_inventario;
```

### Solución 1: Poblar inventario_cache
Si la tabla existe pero está vacía, necesitas ejecutar el proceso de sincronización:

```bash
# Ejecutar script de sincronización (si existe)
npm run sync-inventory
```

O crear un trigger/función que mantenga `inventario_cache` sincronizada.

### Solución 2: Verificar/Crear políticas RLS

```sql
-- Ver políticas actuales en inventario_cache
SELECT * FROM pg_policies WHERE tablename = 'inventario_cache';

-- Crear política para acceso público de lectura
CREATE POLICY "Allow public read access to inventario_cache"
ON inventario_cache
FOR SELECT
TO anon, authenticated
USING (true);

-- Habilitar RLS si no está habilitado
ALTER TABLE inventario_cache ENABLE ROW LEVEL SECURITY;
```

### Solución 3: Cambiar temporalmente la fuente de datos

Si necesitas una solución rápida mientras se pobla inventario_cache, puedes modificar temporalmente el VehicleService para consultar directamente `autos_publicados`:

**NO HAGAS ESTO** - mejor espera a que se sincronice el cache, pero si es urgente:

1. Abre: `src/services/VehicleService.ts`
2. Línea 251: Cambia temporalmente:
   ```typescript
   // TEMPORAL - mientras se sincroniza el cache
   let query = supabase.from('autos_publicados').select('*', { count: 'exact' });
   query = query.eq('disponible', true);
   ```

---

## Problema 2: OTP no se envía desde /acceder

### Causa
A pesar de configurar las URLs de redirección en Supabase, falta configuración en:
1. Email templates en Supabase
2. SMTP settings (si no estás usando el SMTP de Supabase)
3. Site URL y redirect URLs mal configuradas

### Solución Paso a Paso

#### 1. Verificar Site URL
1. Ve a: **Supabase Dashboard** → **Authentication** → **URL Configuration**
2. Asegúrate de tener:
   ```
   Site URL: https://www.trefa.mx
   Redirect URLs:
     - https://www.trefa.mx/**
     - http://localhost:3000/**
   ```

#### 2. Verificar Email Templates
1. Ve a: **Supabase Dashboard** → **Authentication** → **Email Templates**
2. Encuentra el template **"Magic Link"**
3. Asegúrate que el **Redirect URL** sea correcto:
   ```
   {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=magiclink
   ```

#### 3. Verificar SMTP Settings
1. Ve a: **Supabase Dashboard** → **Project Settings** → **Auth**
2. Scroll hasta **SMTP Settings**
3. Opciones:

   **Opción A - Usar SMTP de Supabase (más fácil):**
   - Deja "Enable Custom SMTP" = **OFF**
   - Supabase enviará emails desde su servidor

   **Opción B - Usar tu propio SMTP:**
   - Enable Custom SMTP = **ON**
   - Configura:
     ```
     Host: smtp.gmail.com (o tu servidor)
     Port: 587
     User: tu-email@gmail.com
     Password: [App Password de Gmail]
     Sender name: TREFA
     Sender email: noreply@trefa.mx
     ```

#### 4. Verificar Rate Limits
1. Ve a: **Authentication** → **Rate Limits**
2. Asegúrate que no estés excediendo los límites:
   ```
   Email OTP: 4 requests per hour per email
   ```

#### 5. Revisar Logs de Supabase
1. Ve a: **Logs** → **Auth Logs**
2. Busca errores relacionados con OTP:
   ```
   Filter: level = error, service = auth
   ```

### Verificación del código

El código en `src/page-components/AuthPage.tsx:167` está correcto:

```typescript
const { data, error } = await supabase.auth.signInWithOtp({
    email,
    options
});
```

### Debugging en Consola del Browser

Abre la consola del navegador en `/acceder` y busca estos logs:

```javascript
// Deberías ver:
Sending OTP to: user@email.com
With options: { ...options }
OTP sent successfully: { ...data }

// Si hay error, verás:
OTP Send Error: { message: "..." }
```

---

## Problema 3: Migración de Datos del Inventario

Si `inventario_cache`, `autos_publicados`, o `autos_inventario` están vacíos después de la migración, verifica:

### Verificar migración de datos
```sql
-- Contar registros en cada tabla
SELECT 'inventario_cache' as tabla, COUNT(*) as registros FROM inventario_cache
UNION ALL
SELECT 'autos_publicados', COUNT(*) FROM autos_publicados
UNION ALL
SELECT 'autos_inventario', COUNT(*) FROM autos_inventario
UNION ALL
SELECT 'vehicles', COUNT(*) FROM vehicles;
```

### Re-migrar tablas específicas si es necesario

Si alguna tabla está vacía, puedes re-migrar específicamente esas tablas:

```bash
# Desde el proyecto original, exportar solo esas tablas
pg_dump "$OLD_DB_URL" \
  --data-only \
  --table=inventario_cache \
  --table=autos_publicados \
  --table=autos_inventario \
  > autos_only.sql

# Importar al proyecto nuevo
psql "$NEW_DB_URL" < autos_only.sql
```

---

## Checklist de Verificación

### Para Vehículos:
- [ ] Verificar que `inventario_cache` tiene datos
- [ ] Verificar políticas RLS en `inventario_cache`
- [ ] Verificar que `ordenstatus = 'Comprado'` existe en los registros
- [ ] Verificar que `feature_image_url` y `fotos_exterior_url` no son null
- [ ] Probar consulta directa en SQL Editor de Supabase

### Para OTP:
- [ ] Site URL configurada correctamente
- [ ] Redirect URLs incluyen localhost:3000 y dominio de producción
- [ ] Email template "Magic Link" configurado
- [ ] SMTP configurado (propio o de Supabase)
- [ ] Rate limits no excedidos
- [ ] Revisar Auth Logs en Supabase Dashboard
- [ ] Probar con email de prueba en la consola del browser

---

## Comandos Útiles

```bash
# Ver logs de Supabase Auth
supabase logs -t auth

# Verificar configuración de Supabase
supabase projects list
supabase status

# Reiniciar dev server
npm run dev
```

---

## Próximos Pasos

1. **Primero**: Verificar en SQL Editor de Supabase que las tablas tienen datos
2. **Segundo**: Crear/verificar políticas RLS para acceso público
3. **Tercero**: Configurar Auth settings en Supabase Dashboard
4. **Cuarto**: Probar OTP con email real y revisar logs

Si después de estos pasos aún hay problemas, revisar los logs específicos de Supabase para obtener más detalles del error.
