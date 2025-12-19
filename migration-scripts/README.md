# Scripts de Migración - Producción a Desarrollo

**Versión:** 1.0
**Fecha:** 18 Diciembre 2024
**Proyecto:** Ultima NextJS - Autostrefa

---

## 📋 Resumen

Este directorio contiene todos los scripts automatizados necesarios para migrar los 4,082 usuarios de producción a desarrollo y aplicar las 104 migraciones SQL del nuevo esquema NextJS.

## 📂 Archivos Incluidos

### Scripts Ejecutables

1. **`apply-migrations.sh`** - Aplica las 104 migraciones SQL en 3 fases
2. **`deploy-edge-functions.sh`** - Despliega las 29 Edge Functions por prioridad
3. **`rollback.sh`** - Rollback de emergencia si algo falla

### Scripts SQL

4. **`verificar-migracion.sql`** - Verifica que la migración fue exitosa

### Documentación

5. **`MIGRATION_REPORT.md`** - Template para documentar la ejecución

---

## ⚙️ Pre-requisitos

### Software Requerido

```bash
# PostgreSQL client (psql, pg_dump)
brew install postgresql@15

# Supabase CLI
npm install -g supabase

# Bash 4.0+
bash --version
```

### Variables de Entorno

Las credenciales se obtienen de:
- `.env.local` (raíz del proyecto)
- `.env` (raíz del proyecto)
- Variables de entorno del sistema

**Variables Críticas Requeridas:**

```bash
# Airtable
AIRTABLE_API_KEY=
AIRTABLE_BASE_ID=
AIRTABLE_TABLE_ID=
AIRTABLE_VALUATION_API_KEY=
AIRTABLE_VALUATION_BASE_ID=

# Twilio (SMS)
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_VERIFY_SERVICE_SID=

# Brevo (Email)
BREVO_API_KEY=

# Cloudflare R2
CLOUDFLARE_ACCOUNT_ID=
CLOUDFLARE_R2_ACCESS_KEY_ID=
CLOUDFLARE_R2_SECRET_ACCESS_KEY=

# Supabase
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_ANON_KEY=

# Otros
PUBLIC_SITE_URL=
SERVICE_ACCESS_TOKEN=
```

### Credenciales de Base de Datos

**Producción:**
- Project Ref: `jjepfehmuybpctdzipnu`
- Host: `db.jjepfehmuybpctdzipnu.supabase.co`
- Port: `5432` (Session Mode)
- User: `postgres`
- Password: `Lifeintechnicolor2!`
- Connection String: `postgresql://postgres:Lifeintechnicolor2!@db.jjepfehmuybpctdzipnu.supabase.co:5432/postgres`

**Desarrollo:**
- Project Ref: `pemgwyymodlwabaexxrb`
- Host: `db.pemgwyymodlwabaexxrb.supabase.co`
- Port: `5432` (Session Mode)
- User: `postgres`
- Password: `Lifeintechnicolor2!`
- Connection String: `postgresql://postgres:Lifeintechnicolor2!@db.pemgwyymodlwabaexxrb.supabase.co:5432/postgres`

---

## 🚀 Orden de Ejecución

### FASE 0: Preparación (ANTES de empezar)

#### 1. Crear Backup de Desarrollo

```bash
# Guardar estado actual de desarrollo (por seguridad)
pg_dump "postgresql://postgres:Lifeintechnicolor2!@db.pemgwyymodlwabaexxrb.supabase.co:5432/postgres" \
  --clean --if-exists --no-owner --no-acl \
  -f ../backups/backup_desarrollo_$(date +%Y%m%d_%H%M%S).sql

# Verificar que el backup se creó
ls -lh ../backups/backup_desarrollo_*.sql
```

#### 2. Crear Backup de Producción

```bash
# Este es el backup que se restaurará en desarrollo
pg_dump "postgresql://postgres:Lifeintechnicolor2!@db.jjepfehmuybpctdzipnu.supabase.co:5432/postgres" \
  --clean --if-exists --no-owner --no-acl \
  -f ../backups/produccion_backup_$(date +%Y%m%d_%H%M%S).sql

# Verificar que el backup se creó (debe ser >100 MB)
ls -lh ../backups/produccion_backup_*.sql
```

#### 3. Restaurar Producción en Desarrollo

```bash
# ADVERTENCIA: Esto ELIMINARÁ todos los datos actuales de desarrollo
# Asegúrate de tener el backup de desarrollo guardado

psql "postgresql://postgres:Lifeintechnicolor2!@db.pemgwyymodlwabaexxrb.supabase.co:5432/postgres" \
  -f ../backups/produccion_backup_YYYYMMDD_HHMMSS.sql

# Verificar restauración
psql "postgresql://postgres:Lifeintechnicolor2!@db.pemgwyymodlwabaexxrb.supabase.co:5432/postgres" \
  -c "SELECT COUNT(*) FROM profiles;"  # Debe mostrar 4082
```

### FASE 1: Aplicar Migraciones SQL

```bash
# Ejecutar script de migraciones
cd /Users/marianomorales/Downloads/ultima-next/ultima-next/migration-scripts
chmod +x apply-migrations.sh
./apply-migrations.sh

# El script generará:
# - migration_log_YYYYMMDD_HHMMSS.txt  (log completo)
# - migration_progress.txt              (progreso por migración)
```

**Duración estimada:** 30-45 minutos

**Errores esperados (se pueden ignorar):**
- `column already exists` - La columna ya existía
- `relation already exists` - La tabla ya existía
- `function already exists` - Las funciones usan CREATE OR REPLACE
- `index already exists` - Los índices usan IF NOT EXISTS

### FASE 2: Desplegar Edge Functions

```bash
# Ejecutar script de deploy
cd /Users/marianomorales/Downloads/ultima-next/ultima-next/migration-scripts
chmod +x deploy-edge-functions.sh
./deploy-edge-functions.sh

# El script generará:
# - deploy_log_YYYYMMDD_HHMMSS.txt  (log completo)
# - deploy_progress.txt              (progreso por función)
```

**Duración estimada:** 15-20 minutos

**Notas:**
- Las funciones CRÍTICAS detendrán el deploy si fallan
- Las funciones IMPORTANTES y AUXILIARES continuarán aunque fallen
- El script verificará que todos los secrets estén configurados

### FASE 3: Verificar Migración

```bash
# Ejecutar script de verificación
psql "postgresql://postgres:Lifeintechnicolor2!@db.pemgwyymodlwabaexxrb.supabase.co:5432/postgres" \
  -f verificar-migracion.sql

# Deberías ver:
# ✅ Profiles: 4,082
# ✅ Auth users: 4,082
# ✅ Applications: 2,092
# ✅ Todas las tablas nuevas
# ✅ Todas las funciones RPC
# ✅ Todos los triggers
# ✅ Todos los índices
```

### FASE 4: Pruebas Funcionales

**Checklist de pruebas:**

- [ ] Login con SMS OTP funciona
- [ ] Dashboard admin muestra leads (`/dashboard/admin`)
- [ ] Búsqueda de vehículos funciona (`/catalogo`)
- [ ] Envío de solicitud funciona (`/apply`)
- [ ] Portal bancario funciona (`/dashboard/bank`)
- [ ] Edge Function `rapid-processor` responde
- [ ] Webhook `airtable-sync` funciona

---

## 🔄 Rollback de Emergencia

**Si algo sale MAL durante la migración:**

```bash
# Ejecutar script de rollback
cd /Users/marianomorales/Downloads/ultima-next/ultima-next/migration-scripts
chmod +x rollback.sh
./rollback.sh

# El script:
# 1. Te mostrará todos los backups disponibles
# 2. Te pedirá seleccionar uno
# 3. Creará backup de emergencia del estado actual
# 4. Restaurará el backup seleccionado
# 5. Verificará la restauración
```

**Duración estimada:** 15-20 minutos

**IMPORTANTE:** Los Edge Functions NO se revierten automáticamente

---

## 📝 Logs y Troubleshooting

### Archivos de Log Generados

```
migration-scripts/
├── migration_log_YYYYMMDD_HHMMSS.txt   # Log de migraciones SQL
├── migration_progress.txt               # Progreso de migraciones
├── deploy_log_YYYYMMDD_HHMMSS.txt      # Log de deploy de Edge Functions
├── deploy_progress.txt                  # Progreso de deploy
└── rollback_log_YYYYMMDD_HHMMSS.txt    # Log de rollback (si se ejecuta)
```

### Problemas Comunes

#### 1. Error: "psql: command not found"

```bash
# Instalar PostgreSQL client
brew install postgresql@15

# Agregar a PATH
echo 'export PATH="/opt/homebrew/opt/postgresql@15/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

#### 2. Error: "password authentication failed"

Verificar que la contraseña sea correcta:
- Producción: `Lifeintechnicolor2!`
- Desarrollo: `Lifeintechnicolor2!`

#### 3. Error: "connection timed out"

Verificar que tu IP esté en la whitelist de Supabase:
- Dashboard → Settings → Database → Connection Pooling
- Agregar tu IP a "Allowed IP Addresses"

#### 4. Error: "function already exists"

Este error es NORMAL y se puede ignorar. Las funciones usan `CREATE OR REPLACE FUNCTION`.

#### 5. Migraciones fallan con errores de RLS

Ejecutar como superusuario:
```bash
# Usar connection string con privilegios de superusuario
psql "postgresql://postgres:Lifeintechnicolor2!@db.pemgwyymodlwabaexxrb.supabase.co:5432/postgres"
```

#### 6. Edge Functions fallan al deployar

Verificar secrets:
```bash
supabase secrets list --project-ref pemgwyymodlwabaexxrb

# Si falta alguno:
supabase secrets set NOMBRE_SECRET="valor" --project-ref pemgwyymodlwabaexxrb
```

---

## 🔧 Comandos Útiles

### Verificar Conteos

```bash
# Profiles
psql "postgresql://postgres:Lifeintechnicolor2!@db.pemgwyymodlwabaexxrb.supabase.co:5432/postgres" \
  -c "SELECT COUNT(*) FROM profiles;"

# Auth users
psql "postgresql://postgres:Lifeintechnicolor2!@db.pemgwyymodlwabaexxrb.supabase.co:5432/postgres" \
  -c "SELECT COUNT(*) FROM auth.users;"

# Applications
psql "postgresql://postgres:Lifeintechnicolor2!@db.pemgwyymodlwabaexxrb.supabase.co:5432/postgres" \
  -c "SELECT COUNT(*) FROM financing_applications;"
```

### Ver Migraciones Aplicadas

```bash
supabase migration list --project-ref pemgwyymodlwabaexxrb
```

### Ver Edge Functions Desplegadas

```bash
supabase functions list --project-ref pemgwyymodlwabaexxrb
```

### Ver Logs de Edge Functions

```bash
# Logs en tiempo real
supabase functions serve

# Logs específicos de una función
supabase functions logs rapid-processor --project-ref pemgwyymodlwabaexxrb
```

---

## 📞 Contacto y Soporte

**Ejecutado por:** Mariano Morales
**Proyecto:** Ultima NextJS - Autostrefa
**Fecha del plan:** 18 Diciembre 2024

**En caso de problemas:**
1. Revisar logs en `/migration-scripts/`
2. Ejecutar `verificar-migracion.sql` para diagnóstico
3. Si es crítico, ejecutar `rollback.sh` inmediatamente
4. Documentar el error en `MIGRATION_REPORT.md`

---

## ✅ Checklist Pre-Ejecución

Antes de iniciar la migración, verifica:

- [ ] Backups creados (desarrollo y producción)
- [ ] Scripts tienen permisos de ejecución (`chmod +x`)
- [ ] PostgreSQL client instalado (`psql --version`)
- [ ] Supabase CLI instalado (`supabase --version`)
- [ ] Contraseñas verificadas
- [ ] Variables de entorno configuradas
- [ ] Modo mantenimiento activado en frontend
- [ ] Stakeholders notificados
- [ ] Plan de rollback entendido
- [ ] Ventana de mantenimiento confirmada

---

## 🎯 Criterios de Éxito

La migración es exitosa si:

- ✅ Profiles = 4,082
- ✅ Auth.users = 4,082
- ✅ Financing applications ≥ 2,092
- ✅ Todas las tablas nuevas existen (7 tablas)
- ✅ Todas las funciones RPC críticas existen (30+)
- ✅ Todas las Edge Functions críticas desplegadas (6)
- ✅ Login funciona (SMS OTP)
- ✅ Búsqueda de vehículos funciona
- ✅ Dashboard admin muestra datos
- ✅ Downtime < 45 minutos
- ✅ Tickets de soporte < 5 en primeras 24h

**Si algún criterio falla → ejecutar rollback inmediatamente**

---

**¡Buena suerte con la migración! 🚀**
