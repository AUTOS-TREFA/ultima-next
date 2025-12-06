# Guía Completa: Migración de Base de Datos Supabase

Esta guía te ayudará a copiar la base de datos completa del proyecto original de Supabase al proyecto actual de Next.js.

## Tabla de Contenidos
1. [Preparación](#preparación)
2. [Opción 1: Migración con Supabase CLI (Recomendada)](#opción-1-migración-con-supabase-cli-recomendada)
3. [Opción 2: Usando MCP Supabase Tools](#opción-2-usando-mcp-supabase-tools)
4. [Opción 3: pg_dump y restore (Manual)](#opción-3-pg_dump-y-restore-manual)
5. [Verificación Post-Migración](#verificación-post-migración)
6. [Troubleshooting](#troubleshooting)

---

## Preparación

### 1. Instalar Supabase CLI
```bash
# macOS
brew install supabase/tap/supabase

# Verificar instalación
supabase --version
```

### 2. Configurar credenciales
Necesitas tener acceso a:
- **Proyecto Original**: URL y claves de API
- **Proyecto Nuevo (Next.js)**: URL y claves de API

Puedes obtenerlas en: https://supabase.com/dashboard/project/[tu-proyecto]/settings/api

### 3. Variables de entorno
Verifica que tienes las siguientes variables en tu `.env.local`:

```env
# Proyecto Nuevo (Next.js)
NEXT_PUBLIC_SUPABASE_URL=https://pemgwyymodlwabaexxrb.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key_aqui
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key_aqui

# Proyecto Original (para migración temporal)
OLD_SUPABASE_URL=https://tu-proyecto-original.supabase.co
OLD_SUPABASE_SERVICE_ROLE_KEY=tu_old_service_role_key
```

---

## Opción 1: Migración con Supabase CLI (Recomendada)

Esta es la opción más segura y recomendada por Supabase.

### Paso 1: Login en Supabase CLI
```bash
supabase login
```

### Paso 2: Conectar al proyecto original
```bash
# Navega al proyecto original
cd /Users/marianomorales/Downloads/ultima\ copy/

# Link al proyecto original
supabase link --project-ref [tu-project-ref-original]
```

### Paso 3: Generar migraciones del esquema actual
```bash
# Esto creará migraciones basadas en el esquema actual
supabase db diff --schema public > migration_from_old.sql

# O generar todo el esquema completo
supabase db dump --schema public > complete_schema.sql
```

### Paso 4: Exportar datos (solo datos, sin esquema)
```bash
# Exportar solo los datos de todas las tablas
supabase db dump --data-only > data_only.sql

# O por tabla específica
supabase db dump --data-only --table profiles > profiles_data.sql
supabase db dump --data-only --table financing_applications > applications_data.sql
```

### Paso 5: Aplicar en el proyecto nuevo
```bash
# Navega al proyecto nuevo
cd /Users/marianomorales/Downloads/ultima-next/ultima-next/

# Link al proyecto nuevo
supabase link --project-ref pemgwyymodlwabaexxrb

# Aplicar el esquema
supabase db push

# Aplicar los datos
psql $DATABASE_URL < data_only.sql
```

### Alternativa: Migración completa de una vez
```bash
# Desde el proyecto original
pg_dump "postgresql://[usuario]:[password]@[host]:[port]/[database]" \
  --clean --if-exists --no-owner --no-privileges \
  > full_backup.sql

# Al proyecto nuevo
psql "postgresql://[usuario-nuevo]:[password-nuevo]@[host-nuevo]:[port]/[database-nuevo]" \
  < full_backup.sql
```

---

## Opción 2: Usando MCP Supabase Tools

Tenemos acceso a las herramientas MCP de Supabase que facilitan la migración.

### Paso 1: Listar tablas del proyecto actual
```bash
# Esto lo puedes hacer mediante el MCP tool
# list_tables para ver todas las tablas
```

### Paso 2: Crear script de migración usando MCP
Podemos usar el MCP tool `apply_migration` para crear migraciones que copien la estructura.

### Ejemplo de migración con MCP:
```typescript
// Usar el MCP tool para aplicar migración
await mcp.apply_migration({
  name: "copy_from_old_project",
  query: `
    -- Tu SQL aquí
    CREATE TABLE IF NOT EXISTS nueva_tabla (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      -- campos...
    );
  `
});
```

### Paso 3: Copiar datos manualmente
Para copiar datos, puedes usar el MCP tool `execute_sql`:

```typescript
// Ejemplo: Copiar datos de una tabla
await mcp.execute_sql({
  query: `
    COPY profiles FROM '/path/to/profiles.csv'
    WITH (FORMAT csv, HEADER true);
  `
});
```

---

## Opción 3: pg_dump y restore (Manual)

### Paso 1: Obtener Connection String del proyecto original
```bash
# La puedes encontrar en:
# Supabase Dashboard > Settings > Database > Connection String
# Formato: postgresql://postgres:[PASSWORD]@[HOST]:[PORT]/postgres
```

### Paso 2: Dump completo del proyecto original
```bash
# Backup completo (esquema + datos)
pg_dump "postgresql://postgres.abc:password@aws-0-us-east-1.pooler.supabase.com:5432/postgres" \
  --clean \
  --if-exists \
  --quote-all-identifiers \
  --no-owner \
  --no-privileges \
  --exclude-schema=_analytics \
  --exclude-schema=auth \
  --exclude-schema=extensions \
  --exclude-schema=graphql \
  --exclude-schema=graphql_public \
  --exclude-schema=net \
  --exclude-schema=pgsodium \
  --exclude-schema=pgsodium_masks \
  --exclude-schema=pgtle \
  --exclude-schema=realtime \
  --exclude-schema=storage \
  --exclude-schema=supabase_functions \
  --exclude-schema=supabase_migrations \
  --exclude-schema=vault \
  > supabase_backup_$(date +%Y%m%d_%H%M%S).sql
```

### Paso 3: Restore en el proyecto nuevo
```bash
# Restore en el proyecto nuevo
psql "postgresql://postgres.xyz:newpassword@aws-0-us-east-1.pooler.supabase.com:5432/postgres" \
  < supabase_backup_20241206_220000.sql
```

### Paso 4: Solo esquema (sin datos)
```bash
# Si solo quieres el esquema
pg_dump "conexion_original" --schema-only > schema_only.sql
psql "conexion_nueva" < schema_only.sql
```

### Paso 5: Solo datos (sin esquema)
```bash
# Si solo quieres los datos
pg_dump "conexion_original" --data-only > data_only.sql
psql "conexion_nueva" < data_only.sql
```

---

## Opción 4: Usando Supabase Studio UI (Más simple)

### Paso 1: Exportar desde proyecto original
1. Ve a **Supabase Dashboard** del proyecto original
2. Click en **Table Editor**
3. Selecciona cada tabla
4. Click en los tres puntos (...) > **Export as CSV**
5. Descarga todos los CSVs

### Paso 2: Importar al proyecto nuevo
1. Ve a **Supabase Dashboard** del proyecto nuevo
2. Click en **SQL Editor**
3. Crea las tablas primero (copia el esquema desde el proyecto original)
4. Usa el **Table Editor** para importar los CSVs
5. O usa SQL para importar:

```sql
COPY tabla_nombre FROM '/path/to/file.csv'
DELIMITER ','
CSV HEADER;
```

---

## Script Automatizado de Migración

Te voy a crear un script que automatiza todo el proceso:

```bash
#!/bin/bash
# migration_script.sh

set -e  # Exit on error

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Iniciando Migración de Base de Datos ===${NC}"

# 1. Variables de configuración
OLD_DB="postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres"
NEW_DB="postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres"
BACKUP_DIR="./db_backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# 2. Crear directorio de backups
mkdir -p $BACKUP_DIR

echo -e "${YELLOW}Paso 1: Exportando esquema del proyecto original...${NC}"
pg_dump "$OLD_DB" \
  --schema-only \
  --no-owner \
  --no-privileges \
  --exclude-schema=auth \
  --exclude-schema=storage \
  > "$BACKUP_DIR/schema_$TIMESTAMP.sql"

echo -e "${GREEN}✓ Esquema exportado${NC}"

echo -e "${YELLOW}Paso 2: Exportando datos del proyecto original...${NC}"
pg_dump "$OLD_DB" \
  --data-only \
  --no-owner \
  --no-privileges \
  --exclude-schema=auth \
  --exclude-schema=storage \
  > "$BACKUP_DIR/data_$TIMESTAMP.sql"

echo -e "${GREEN}✓ Datos exportados${NC}"

echo -e "${YELLOW}Paso 3: Importando esquema al proyecto nuevo...${NC}"
psql "$NEW_DB" < "$BACKUP_DIR/schema_$TIMESTAMP.sql"

echo -e "${GREEN}✓ Esquema importado${NC}"

echo -e "${YELLOW}Paso 4: Importando datos al proyecto nuevo...${NC}"
psql "$NEW_DB" < "$BACKUP_DIR/data_$TIMESTAMP.sql"

echo -e "${GREEN}✓ Datos importados${NC}"

echo -e "${GREEN}=== Migración Completada ===${NC}"
echo -e "Backups guardados en: $BACKUP_DIR"
```

Para usar el script:
```bash
chmod +x migration_script.sh
./migration_script.sh
```

---

## Verificación Post-Migración

### 1. Verificar tablas
```sql
-- Contar tablas
SELECT COUNT(*) FROM information_schema.tables
WHERE table_schema = 'public';

-- Listar todas las tablas
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

### 2. Verificar datos
```sql
-- Contar registros por tabla
SELECT
  schemaname,
  tablename,
  n_tup_ins - n_tup_del as row_count
FROM pg_stat_user_tables
ORDER BY row_count DESC;
```

### 3. Verificar funciones RPC
```sql
-- Listar funciones
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public';
```

### 4. Verificar políticas RLS
```sql
-- Verificar RLS habilitado
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';

-- Listar políticas
SELECT * FROM pg_policies WHERE schemaname = 'public';
```

---

## Troubleshooting

### Error: "relation already exists"
```bash
# Limpiar base de datos antes de importar
psql "$NEW_DB" -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
```

### Error: "permission denied"
```bash
# Asegúrate de usar el service_role_key, no el anon_key
# Y que el usuario tenga permisos de superusuario
```

### Error: "could not connect to server"
```bash
# Verifica que tu IP esté en la whitelist
# Supabase Dashboard > Settings > Database > Connection pooling
# Habilita "Connection pooling" y usa el pooler connection string
```

### Datos no se importan correctamente
```bash
# Verifica el orden de las tablas (foreign keys)
# Deshabilita triggers temporalmente:
psql "$NEW_DB" -c "SET session_replication_role = replica;"
# Importa datos
# Re-habilita triggers:
psql "$NEW_DB" -c "SET session_replication_role = DEFAULT;"
```

---

## Recomendaciones Finales

1. **Siempre haz backup** antes de cualquier operación
2. **Prueba primero en un proyecto de desarrollo** antes de producción
3. **Usa transacciones** para poder hacer rollback si algo falla
4. **Verifica las políticas RLS** después de importar
5. **Regenera los tipos TypeScript** después de la migración:
   ```bash
   supabase gen types typescript --project-id pemgwyymodlwabaexxrb > src/types/supabase.ts
   ```

---

## ¿Cuál opción usar?

- **Opción 1 (Supabase CLI)**: Para migración completa y profesional
- **Opción 2 (MCP Tools)**: Para migraciones programáticas y automatizadas
- **Opción 3 (pg_dump)**: Para control total y backups completos
- **Opción 4 (UI)**: Para proyectos pequeños o tablas individuales

**Recomendación**: Usa **Opción 1 (Supabase CLI)** para una migración segura y completa.
