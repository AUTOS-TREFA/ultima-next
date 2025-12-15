# Guia de Configuracion de Acceso Administrativo

Esta guia te ayudara a configurar correctamente el acceso de administradores al sistema.

## Lista de Administradores

Los siguientes correos tienen acceso de administrador:

- mariano.morales@autostrefa.mx
- marianomorales@outlook.com
- marianomorales_@outlook.com
- alejandro.trevino@autostrefa.mx
- evelia.castillo@autostrefa.mx
- alejandro.gallardo@autostrefa.mx
- emmanuel.carranza@autostrefa.mx
- fernando.trevino@autostrefa.mx
- lizeth.juarez@autostrefa.mx

Ademas, cualquier correo con dominio `@autostrefa.mx` tiene acceso de administrador automaticamente.

## Paso 1: Ejecutar Migracion SQL en Supabase

1. Ve a tu proyecto en Supabase: https://supabase.com/dashboard
2. Navega a **SQL Editor**
3. Copia y pega el contenido completo del archivo `FIX_ADMIN_ACCESS_COMPLETE.sql`
4. Haz clic en **Run** para ejecutar

Esto configurara:
- Funcion helper `is_admin_email()` para verificar admins
- Trigger para asignar rol admin automaticamente a nuevos usuarios
- Politicas RLS para todas las tablas principales (profiles, financing_applications, uploaded_documents, bank_profiles)
- Funciones RPC con SECURITY DEFINER para bypass de RLS
- Politicas de Storage para documentos

## Paso 2: Configurar Google OAuth en Supabase

1. Ve a **Authentication > Providers** en Supabase
2. Habilita **Google** como proveedor
3. Configura los siguientes valores:
   - **Client ID**: Tu ID de cliente de Google Cloud
   - **Client Secret**: Tu secreto de cliente de Google Cloud
4. Agrega las siguientes URLs de redireccion en Google Cloud Console:
   - `https://tu-dominio.com/escritorio`
   - `https://pemgwyymodlwabaexxrb.supabase.co/auth/v1/callback`

### Configuracion en Google Cloud Console

1. Ve a https://console.cloud.google.com
2. Navega a **APIs & Services > Credentials**
3. Edita tu cliente OAuth 2.0
4. En **Authorized redirect URIs**, agrega:
   - `https://pemgwyymodlwabaexxrb.supabase.co/auth/v1/callback`
   - `https://tu-dominio-produccion.com/escritorio`
5. En **Authorized JavaScript origins**, agrega:
   - `https://tu-dominio-produccion.com`
   - `http://localhost:3000` (para desarrollo)

## Paso 3: Configurar URLs de Redireccion

En Supabase, ve a **Authentication > URL Configuration** y configura:

- **Site URL**: `https://tu-dominio-produccion.com`
- **Redirect URLs**: Agrega todas las URLs permitidas:
  ```
  https://tu-dominio-produccion.com/escritorio
  https://tu-dominio-produccion.com/escritorio/admin/dashboard
  http://localhost:3000/escritorio
  http://localhost:3000/escritorio/admin/dashboard
  ```

## Paso 4: Verificar Configuracion

### Verificar Perfiles Admin en la Base de Datos

Ejecuta esta consulta en el SQL Editor de Supabase:

```sql
SELECT
    email,
    role,
    created_at,
    updated_at
FROM profiles
WHERE role = 'admin'
ORDER BY email;
```

### Verificar Funcion is_admin_email

```sql
SELECT
    'mariano.morales@autostrefa.mx' as email,
    is_admin_email('mariano.morales@autostrefa.mx') as es_admin

UNION ALL

SELECT
    'test@autostrefa.mx',
    is_admin_email('test@autostrefa.mx')

UNION ALL

SELECT
    'usuario@gmail.com',
    is_admin_email('usuario@gmail.com');
```

### Verificar Politicas RLS

```sql
SELECT
    tablename,
    policyname,
    cmd
FROM pg_policies
WHERE tablename IN ('profiles', 'financing_applications', 'uploaded_documents', 'bank_profiles')
ORDER BY tablename, policyname;
```

## Flujo de Autenticacion para Admins

### Via Google OAuth (@autostrefa.mx)

1. Usuario va a `/admin/login` o `/acceder`
2. Hace clic en "Iniciar con cuenta @autostrefa.mx"
3. Se redirige a Google OAuth con restriccion `hd=autostrefa.mx`
4. Despues del login exitoso, se redirige a `/escritorio`
5. El middleware detecta que es admin por email y redirige a `/escritorio/admin/dashboard`

### Via Email/Password

1. Usuario va a `/admin/login`
2. Ingresa email y contrasena
3. El sistema verifica si el email esta en la lista de admins
4. Si es admin, redirige a `/escritorio/admin/dashboard`

### Via OTP (Codigo de Acceso)

1. Usuario va a `/acceder`
2. Ingresa su email
3. Recibe codigo OTP por correo
4. Ingresa el codigo
5. Si es admin, se redirige a `/escritorio/admin/dashboard`

## Archivos Modificados

Los siguientes archivos contienen la logica de verificacion de admin:

- `src/constants/adminEmails.ts` - Lista centralizada de correos admin
- `src/context/AuthContext.tsx` - Verifica admin por email y rol
- `src/components/AuthHandler.tsx` - Maneja redirecciones post-login
- `src/page-components/AuthPage.tsx` - Pagina de login principal
- `src/page-components/AdminLoginPage.tsx` - Pagina de login admin
- `middleware.ts` - Protege rutas y verifica permisos

## Solucion de Problemas

### El usuario admin no puede acceder al dashboard

1. Verifica que el email este en la lista de `ADMIN_EMAILS` en `src/constants/adminEmails.ts`
2. Verifica que el perfil tenga `role = 'admin'` en la base de datos
3. Ejecuta la migracion SQL para actualizar los roles

### Google OAuth no funciona

1. Verifica que las URLs de redireccion esten configuradas correctamente
2. Verifica que el dominio `autostrefa.mx` este permitido en Google Cloud Console
3. Revisa los logs de Supabase en **Authentication > Logs**

### El usuario se redirige al lugar incorrecto

1. Limpia el localStorage y sessionStorage del navegador
2. Cierra sesion completamente
3. Vuelve a iniciar sesion

### RLS bloquea acceso a datos

1. Verifica que la funcion `is_admin_email` devuelva `true` para el email del usuario
2. Verifica que las politicas RLS esten creadas correctamente
3. Ejecuta la migracion SQL nuevamente

## Agregar Nuevos Administradores

Para agregar un nuevo administrador:

1. Agrega el email a la lista en `src/constants/adminEmails.ts`
2. Agrega el email al array en el archivo SQL y ejecutalo nuevamente
3. O simplemente agrega un usuario con correo `@autostrefa.mx` (tiene acceso automatico)

```typescript
// src/constants/adminEmails.ts
export const ADMIN_EMAILS: string[] = [
    'mariano.morales@autostrefa.mx',
    // ... otros emails
    'nuevo.admin@autostrefa.mx', // Nuevo admin
];
```

Luego actualiza la base de datos:

```sql
UPDATE profiles
SET role = 'admin', updated_at = NOW()
WHERE email = 'nuevo.admin@autostrefa.mx';
```
