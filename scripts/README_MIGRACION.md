# Migración de Base de Datos Supabase

## 📋 Guía Rápida

Para migrar la base de datos completa del proyecto original al proyecto Next.js, sigue estos pasos:

### Opción 1: Script Automatizado (Recomendado)

#### Paso 1: Obtener Connection Strings

1. **Proyecto Original:**
   - Ve a: https://supabase.com/dashboard/project/[proyecto-original]/settings/database
   - Copia el "Connection string" (formato: postgres://...)
   - Cambia `[YOUR-PASSWORD]` por la contraseña real

2. **Proyecto Nuevo (Next.js):**
   - Ve a: https://supabase.com/dashboard/project/pemgwyymodlwabaexxrb/settings/database
   - Copia el "Connection string"
   - Cambia `[YOUR-PASSWORD]` por la contraseña real

#### Paso 2: Configurar Variables de Entorno

```bash
# En tu terminal, configura las variables:
export OLD_SUPABASE_DB_URL='postgresql://postgres.abc:TU_PASSWORD@aws-0-us-east-1.pooler.supabase.com:5432/postgres'
export NEW_SUPABASE_DB_URL='postgresql://postgres.pemgwyymodlwabaexxrb:TU_PASSWORD@aws-0-us-east-1.pooler.supabase.com:5432/postgres'
```

#### Paso 3: Ejecutar el Script

```bash
cd /Users/marianomorales/Downloads/ultima-next/ultima-next
./scripts/migrate-database.sh
```

El script hará:
1. ✅ Exportar esquema (tablas, índices, constraints)
2. ✅ Exportar datos de todas las tablas
3. ✅ Pedir confirmación antes de importar
4. ✅ Importar esquema al proyecto nuevo
5. ✅ Importar datos al proyecto nuevo
6. ✅ Crear backups en `./db_backups/`

---

### Opción 2: Supabase CLI

#### Paso 1: Instalar Supabase CLI

```bash
brew install supabase/tap/supabase
```

#### Paso 2: Login

```bash
supabase login
```

#### Paso 3: Desde el Proyecto Original

```bash
cd /path/to/proyecto-original

# Link al proyecto
supabase link --project-ref [id-proyecto-original]

# Generar dump completo
supabase db dump -f dump_complete.sql

# O separar esquema y datos
supabase db dump --schema public -f schema.sql
supabase db dump --data-only -f data.sql
```

#### Paso 4: Al Proyecto Nuevo

```bash
cd /Users/marianomorales/Downloads/ultima-next/ultima-next

# Link al proyecto nuevo
supabase link --project-ref pemgwyymodlwabaexxrb

# Aplicar dump
supabase db push
psql $DATABASE_URL -f dump_complete.sql
```

---

### Opción 3: pg_dump Manual

#### Exportar del Original

```bash
pg_dump "postgresql://postgres:PASS@HOST:5432/postgres" \
  --clean \
  --if-exists \
  --no-owner \
  --no-privileges \
  --exclude-schema=auth \
  --exclude-schema=storage \
  --exclude-schema=realtime \
  > backup_complete.sql
```

#### Importar al Nuevo

```bash
psql "postgresql://postgres:PASS@HOST:5432/postgres" \
  < backup_complete.sql
```

---

## ⚠️ Importante

### Antes de Migrar

1. **Hacer backup del proyecto nuevo** por si acaso
2. **Verificar que tienes la contraseña** de ambos proyectos
3. **Agregar tu IP a la whitelist** en Supabase:
   - Dashboard > Settings > Database > Connection pooling
   - Habilita "Temporarily disable SSL enforcement" si es necesario

### Después de Migrar

1. **Regenerar tipos TypeScript:**
   ```bash
   supabase gen types typescript --project-id pemgwyymodlwabaexxrb > src/types/supabase.ts
   ```

2. **Verificar políticas RLS:**
   ```sql
   SELECT * FROM pg_policies WHERE schemaname = 'public';
   ```

3. **Verificar funciones RPC:**
   ```sql
   SELECT routine_name FROM information_schema.routines WHERE routine_schema = 'public';
   ```

4. **Probar la aplicación:**
   ```bash
   npm run dev
   ```

---

## 🔍 Verificación Post-Migración

### Contar Tablas

```sql
SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';
```

### Contar Registros

```sql
SELECT
  tablename,
  n_tup_ins - n_tup_del as row_count
FROM pg_stat_user_tables
ORDER BY row_count DESC;
```

### Verificar Datos de Usuario

```sql
SELECT COUNT(*) FROM profiles;
SELECT COUNT(*) FROM financing_applications;
SELECT COUNT(*) FROM tracking_events;
```

---

## 🐛 Troubleshooting

### Error: "could not connect to server"

- Verifica que tu IP esté en la whitelist
- Usa el "Connection pooling" string en vez del directo
- Habilita temporalmente "Disable SSL enforcement"

### Error: "relation already exists"

```bash
# Limpiar base de datos primero
psql "$NEW_DB_URL" -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
```

### Error: "permission denied"

- Asegúrate de usar el service_role_key
- Verifica que el usuario tenga permisos de superusuario

### Datos no se importan

```bash
# Deshabilitar triggers temporalmente
psql "$DB_URL" -c "SET session_replication_role = replica;"
# Importar
psql "$DB_URL" -f data.sql
# Re-habilitar
psql "$DB_URL" -c "SET session_replication_role = DEFAULT;"
```

---

## 📁 Estructura de Backups

Después de ejecutar el script, encontrarás:

```
db_backups/
├── schema_20241206_220000.sql   # Estructura de tablas
├── data_20241206_220000.sql     # Datos
└── migration_20241206_220000.log # Log completo
```

---

## 📞 Soporte

Si tienes problemas:
1. Revisa el log en `db_backups/migration_*.log`
2. Verifica las connection strings
3. Consulta la guía completa en `GUIA_MIGRACION_DATABASE.md`

---

## ✅ Checklist

- [ ] Obtener connection strings de ambos proyectos
- [ ] Configurar variables de entorno
- [ ] Ejecutar script de migración
- [ ] Verificar que se importaron todas las tablas
- [ ] Regenerar tipos TypeScript
- [ ] Verificar políticas RLS
- [ ] Probar la aplicación
- [ ] Hacer commit de tipos actualizados

