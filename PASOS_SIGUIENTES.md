# Pasos Siguientes - Migración Next.js

## 🎯 Objetivo

Completar la migración de React + Express a Next.js y lograr una compilación exitosa.

---

## 📋 Lista de Tareas Inmediatas

### ✅ YA COMPLETADO

- [x] Migración automatizada de 67 rutas
- [x] Instalación de dependencias Next.js
- [x] Creación de middleware de autenticación
- [x] Optimización de Dockerfile
- [x] Correcciones iniciales de compilación

### 🔨 POR HACER (Orden de Prioridad)

#### 1. Corregir Imports de Páginas Generadas (ALTA PRIORIDAD)

**Problema**: Los archivos `app/**/page.tsx` importan componentes con nombres que no coinciden con los archivos reales.

**Solución Manual**:

```bash
# 1. Listar todas las páginas generadas
find app -name "page.tsx" | sort

# 2. Para cada página, verificar que el import coincida con el archivo real
# Ejemplo de corrección:

# ❌ Incorrecto:
import FaqPage from '@/pages/FaqPage';

# ✅ Correcto:
import FaqPage from '@/pages/faqs';
```

**Script Automatizado** (crear este archivo):

```javascript
// scripts/fix-page-imports.js
import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

const pageFiles = glob.sync('app/**/page.tsx');
const fixes = new Map([
  ['FaqPage', 'faqs'],
  // Agregar más correcciones según sea necesario
]);

pageFiles.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let modified = false;

  fixes.forEach((correctName, wrongName) => {
    if (content.includes(`@/pages/${wrongName}`)) {
      content = content.replace(
        `@/pages/${wrongName}`,
        `@/pages/${correctName}`
      );
      modified = true;
    }
  });

  if (modified) {
    fs.writeFileSync(file, content);
    console.log(`✓ Fixed: ${file}`);
  }
});
```

#### 2. Migrar de React Router a Next.js Navigation (ALTA PRIORIDAD)

**Archivos afectados**: ~100+

**Cambios necesarios**:

```typescript
// ❌ ANTES (React Router)
import { useNavigate, useLocation, useParams, Link } from 'react-router-dom';

const navigate = useNavigate();
const location = useLocation();
const params = useParams();

navigate('/dashboard');
const path = location.pathname;

// ✅ DESPUÉS (Next.js)
import { useRouter, usePathname, useParams } from 'next/navigation';
import Link from 'next/link';

const router = useRouter();
const pathname = usePathname();
const params = useParams();

router.push('/dashboard');
const path = pathname;
```

**Script de Reemplazo**:

```bash
# Buscar archivos con react-router-dom
grep -r "react-router-dom" src/ --include="*.tsx" --include="*.ts" -l

# Crear script de reemplazo masivo
# scripts/replace-react-router.sh
```

#### 3. Actualizar Helpers de Supabase (MEDIA PRIORIDAD)

**Problema**: `@supabase/auth-helpers-nextjs` está deprecated.

**Solución**:

```bash
# 1. Instalar nuevo paquete
npm install @supabase/ssr

# 2. Actualizar middleware.ts
```

**Nuevo código para middleware**:

```typescript
// middleware.ts
import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );

  const { data: { session } } = await supabase.auth.getSession();

  // ... resto de la lógica

  return response;
}
```

#### 4. Decidir sobre LandingPageOriginal.tsx (BAJA PRIORIDAD)

**Opciones**:

A. **Eliminar el archivo** (si no se usa):
```bash
rm src/pages/LandingPageOriginal.tsx.disabled
```

B. **Instalar dependencias faltantes** (si se necesita):
```bash
npm install @iconify/react
# Instalar shadcn/ui components
npx shadcn-ui@latest init
npx shadcn-ui@latest add button badge card
```

C. **Migrar a framer-motion** (recomendado):
```typescript
// Cambiar
import { motion } from "motion/react";
// Por
import { motion } from "framer-motion";
```

---

## 🔧 Proceso de Compilación Iterativa

### Paso 1: Intentar Compilar

```bash
npm run build 2>&1 | tee build-output.txt
```

### Paso 2: Analizar Errores

```bash
# Ver solo errores
cat build-output.txt | grep "Error:" | sort | uniq

# Ver módulos no encontrados
cat build-output.txt | grep "Module not found"

# Ver errores de TypeScript
cat build-output.txt | grep "Type error"
```

### Paso 3: Corregir Por Categoría

**Errores comunes y soluciones**:

| Error | Solución |
|-------|----------|
| `Module not found: '@/pages/XXX'` | Verificar nombre real del archivo |
| `'use client' missing` | Agregar al inicio del archivo |
| `useNavigate is not a function` | Migrar a `useRouter` de Next.js |
| `Cannot find module 'react-router-dom'` | Cambiar a `next/navigation` |

### Paso 4: Volver a Compilar

```bash
npm run build
```

### Paso 5: Repetir hasta éxito

---

## 📝 Checklist de Verificación

### Antes de Compilar
- [ ] Todos los imports de páginas corregidos
- [ ] React Router imports migrados a Next.js
- [ ] Componentes con hooks tienen 'use client'
- [ ] Variables de entorno configuradas en `.env.local`

### Compilación Exitosa
- [ ] `npm run build` completa sin errores
- [ ] Tamaño del bundle < 1MB first load
- [ ] No hay warnings críticos

### Pruebas Funcionales
- [ ] `npm run dev` inicia sin errores
- [ ] Página de inicio carga (localhost:3000)
- [ ] Navegación entre páginas funciona
- [ ] Login con Supabase funciona
- [ ] Dashboard protegido por autenticación
- [ ] API routes responden correctamente

---

## 🚀 Desarrollo Local

### Iniciar Servidor

```bash
npm run dev
```

### Probar Rutas Críticas

1. **Página de inicio**: http://localhost:3000
2. **Lista de autos**: http://localhost:3000/autos
3. **Login**: http://localhost:3000/acceder
4. **Dashboard**: http://localhost:3000/escritorio
5. **Admin**: http://localhost:3000/escritorio/admin/dashboard

### Ver Logs en Tiempo Real

```bash
# En otra terminal
tail -f .next/trace
```

---

## 🐛 Debugging

### Error: Página no renderiza

```bash
# Verificar que el archivo existe
ls -la app/ruta/page.tsx

# Verificar imports
cat app/ruta/page.tsx

# Verificar que el componente exporta default
grep "export default" src/pages/Componente.tsx
```

### Error: 'use client' necesario

```bash
# Buscar todos los archivos sin 'use client' que usan hooks
grep -L "'use client'" $(grep -l "useState\|useEffect" src/**/*.tsx)

# Agregar a todos
for file in $(grep -L "'use client'" $(grep -l "useState" src/**/*.tsx)); do
  echo "'use client';" | cat - $file > temp && mv temp $file
done
```

### Error: Module not found

```bash
# Verificar que el path alias está configurado
cat tsconfig.json | grep -A 5 "paths"

# Verificar que el archivo existe
find src -name "ArchivoFaltante.*"
```

---

## 📊 Métricas de Progreso

Mantén un registro de tu progreso:

```markdown
## Estado Actual

- Archivos corregidos: X / ~100
- Imports de páginas: X / 67
- Migraciones React Router: X / ~100
- Compilación: ❌ / ✅
- Tests funcionales: X / 5

## Última Actualización
Fecha: [Agregar fecha]
Próximo paso: [Agregar siguiente tarea]
```

---

## 🎯 Hitos

### Hito 1: Compilación Exitosa ⏳
- [ ] Todos los imports corregidos
- [ ] Todas las migraciones de React Router completadas
- [ ] `npm run build` sin errores

### Hito 2: Servidor de Desarrollo Funcional ⏳
- [ ] `npm run dev` inicia sin errores
- [ ] Navegación funciona
- [ ] No hay errores en consola

### Hito 3: Funcionalidad Completa ⏳
- [ ] Autenticación funciona
- [ ] Dashboard accesible
- [ ] API routes operativos
- [ ] Imágenes se cargan correctamente

### Hito 4: Optimización ⏳
- [ ] Imágenes migradas a `next/image`
- [ ] ISR configurado para páginas públicas
- [ ] Lighthouse score > 90

### Hito 5: Despliegue ⏳
- [ ] Build de producción exitoso
- [ ] Docker build funcional
- [ ] Desplegado en Cloud Run o Vercel

---

## 💡 Tips y Trucos

### Compilación Rápida

```bash
# Solo verificar errores sin generar build completo
npm run build -- --no-lint

# Compilar solo una ruta específica (experimental)
NEXT_PUBLIC_ANALYZE=true npm run build
```

### Búsqueda Masiva y Reemplazo

```bash
# Reemplazar en todos los archivos
find src -type f -name "*.tsx" -exec sed -i 's/useNavigate/useRouter/g' {} +

# Verificar cambios antes de aplicar
find src -type f -name "*.tsx" -exec grep -l "useNavigate" {} +
```

### Lint Automático

```bash
# Fix automático de problemas de ESLint
npm run lint -- --fix
```

---

## 📞 Ayuda y Soporte

### Recursos

- **Documentación Next.js**: https://nextjs.org/docs
- **Supabase + Next.js**: https://supabase.com/docs/guides/getting-started/quickstarts/nextjs
- **Migración App Router**: https://nextjs.org/docs/app/building-your-application/upgrading/app-router-migration

### Logs de Migración

```bash
# Ver logs completos
cat scripts/migration/logs/migration-*.log

# Ver reportes
ls -la scripts/migration/*-report.json
```

---

## ✅ Cuando Todo Funcione

### 1. Limpiar Archivos Temporales

```bash
# Eliminar backups
find . -name "*.backup" -delete

# Eliminar archivos .disabled
find . -name "*.disabled" -delete
```

### 2. Ejecutar Tests

```bash
npm run test  # Si tienes tests
```

### 3. Desplegar

```bash
# Opción 1: Vercel
vercel --prod

# Opción 2: Docker + Cloud Run
docker build -t trefa .
gcloud run deploy trefa --image trefa
```

---

**¡Éxito en la migración!** 🚀

Si encuentras problemas, revisa:
1. `ESTADO_MIGRACION.md` - Estado actual
2. `MIGRATION_PLAN.md` - Plan original
3. `scripts/migration/README.md` - Documentación de scripts
