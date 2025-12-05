# Estructura del Proyecto Next.js

Esta es la estructura organizacional del proyecto migrado de React/Vite a Next.js.

## Fecha de Migración
Diciembre 2025

## Estructura de Carpetas Principales

### `/app/` - Aplicación Next.js (App Router)
Contiene todas las rutas y páginas de la aplicación usando el App Router de Next.js.

**Subcarpetas:**
- `(public)/` - Rutas públicas
- `(auth)/` - Rutas de autenticación
- `(bank)/` - Rutas específicas de bancos
- `(standalone)/` - Rutas standalone
- `escritorio/` - Dashboard principal
- `api/` - API routes de Next.js
- `healthz/` - Health check endpoint

### `/src/` - Código Fuente Compartido
Componentes, hooks, utilidades y lógica compartida.

**Estructura típica:**
- `components/` - Componentes React reutilizables
- `hooks/` - Custom hooks
- `lib/` - Utilidades y helpers
- `types/` - Definiciones de TypeScript
- `utils/` - Funciones auxiliares

### `/lib/` - Bibliotecas y Configuraciones
Configuraciones de bibliotecas externas, clientes de API, etc.

### `/server/` - Lógica de Servidor
Código que se ejecuta únicamente en el servidor (Express.js adicional si es necesario).

### `/docs/` - Documentación del Proyecto

#### `/docs/current/`
Documentación activa y actual del proyecto.

#### `/docs/guides/`
Guías y tutoriales del proyecto.
- `spanish/` - Guías en español para el equipo

#### `/docs/prompts/`
Prompts de IA, plantillas de código y recursos reutilizables.

#### `/docs/deployment/`
Documentación de deployment y configuración de infraestructura.

#### `/docs/scripts/`
Documentación de scripts de automatización.

#### `/docs/sql/`
Scripts SQL de Supabase y queries importantes.

#### `/docs/sql-scripts/`
Scripts SQL ad-hoc para operaciones específicas y análisis.

#### `/docs/archive/`
Documentación histórica y archivada.
- `gtm-templates/` - Templates antiguos de Google Tag Manager
- `old-fixes/` - Documentación de fixes históricos
- `old-scripts/` - Scripts deprecados

### `/supabase/` - Base de Datos y Backend
Configuración de Supabase y migraciones de base de datos.

**Estructura:**
- `migrations/` - Migraciones de base de datos
- `functions/` - Edge Functions de Supabase
- `old_migrations/` - Migraciones históricas

### `/constructor/` - Page Builder
Sistema de construcción de páginas dinámicas.

**Estructura:**
- `context/` - Context providers para el constructor
- `builders/` - Lógica de construcción
- `components/` - Componentes del constructor
  - `block-templates/` - Plantillas de bloques
    - `carousels/` - Bloques de carrusel
    - `features/` - Bloques de características
    - `comparison/` - Bloques de comparación
    - `hero/` - Bloques hero
- `services/` - Servicios del constructor

### `/airtable/` - Integración con Airtable
Scripts y configuraciones para integración con Airtable.

### `/cloudflare-workers/` - Cloudflare Workers
Workers de Cloudflare para edge computing.

### `/scripts/` - Scripts de Automatización
Scripts de build, deployment, testing y mantenimiento.

### `/public/` - Archivos Estáticos Públicos
Assets estáticos servidos directamente (Next.js public directory).

### `/images/` - Imágenes del Proyecto
Imágenes organizadas del proyecto.
- `tabs/` - Imágenes para tabs y navegación

### `/logs/` - Logs Locales
Logs de desarrollo, deployment y debugging (NO comitear a git).

**Archivos típicos:**
- `deploy-staging-output.log`
- `deploy-production-output.log`
- Logs de debugging locales

### `/backups/` - Backups Locales
Backups de configuraciones y otros recursos (NO comitear a git).

### `/database-backups/` - Backups de Base de Datos
Backups específicos de la base de datos Supabase (NO comitear a git).

### `/.claude/` - Configuración de Claude Code
Configuración y scripts para Claude Code.

**Estructura:**
- `agents/` - Agentes de IA
- `scripts/` - Scripts de Claude
- `commands/` - Comandos personalizados
- `skills/` - Skills de Claude

### `/.github/` - GitHub Configuration
Workflows de GitHub Actions y configuración del repositorio.

## Archivos de Configuración Raíz

- `package.json` - Dependencias y scripts npm
- `tsconfig.json` - Configuración de TypeScript
- `next.config.js` - Configuración de Next.js
- `.env.local` - Variables de entorno locales (NO comitear)
- `.gitignore` - Archivos ignorados por Git
- `tailwind.config.js` - Configuración de Tailwind CSS
- `postcss.config.js` - Configuración de PostCSS

## Convenciones

### Nomenclatura
- Archivos de componentes: `PascalCase.tsx`
- Utilidades y helpers: `camelCase.ts`
- Constantes: `UPPER_SNAKE_CASE.ts`
- Carpetas: `kebab-case/`

### Organización de Código
- Componentes React en `/src/components/` o dentro de route folders en `/app/`
- Hooks personalizados en `/src/hooks/`
- Utilidades en `/src/utils/` o `/lib/`
- Types compartidos en `/src/types/`

### Git
- **NO comitear**: `.env*`, `logs/`, `backups/`, `*.sql`, `node_modules/`
- **SÍ comitear**: Código fuente, documentación, configuraciones públicas

## Diferencias con el Proyecto Original (React/Vite)

### Migrado de React/Vite a Next.js
1. **`/src/pages/` → `/app/`** - App Router de Next.js
2. **`/src/main.tsx` → `/app/layout.tsx`** - Root layout
3. **Vite config → Next.js config** - Sistema de build diferente
4. **Client-side routing → Next.js routing** - File-based routing

### Nuevas Carpetas en Next.js
- `/app/` - App Router (reemplaza `/src/pages/`)
- `/lib/` - Bibliotecas (antes parte de `/src/`)

### Carpetas Mantenidas
- `/docs/` - Estructura mejorada y ampliada
- `/constructor/` - Sistema mantenido
- `/supabase/` - Backend mantenido
- `/server/` - Servidor mantenido
- `/airtable/` - Integración mantenida
- `/cloudflare-workers/` - Workers mantenidos

## Próximos Pasos

1. Completar migración de componentes de `/src/pages/` a `/app/`
2. Actualizar imports y referencias
3. Migrar documentación del proyecto original a las nuevas carpetas
4. Configurar scripts de deployment para Next.js
5. Actualizar guías en `/docs/guides/spanish/`

## Mantenimiento

- Revisa y limpia `/logs/` mensualmente
- Revisa y limpia `/backups/` mensualmente
- Mueve documentación obsoleta de `/docs/current/` a `/docs/archive/`
- Mantén `/docs/guides/spanish/` actualizado con cambios importantes

---

**Última actualización**: Diciembre 5, 2025
**Versión**: Next.js 14+ (App Router)
