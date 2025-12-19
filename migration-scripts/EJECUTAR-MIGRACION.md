# Guía de Ejecución - Migración de Base de Datos

**Fecha:** 18 Diciembre 2024
**Estado Actual:** ✅ Todos los pre-requisitos cumplidos
**Tiempo estimado:** 2-3 horas
**Downtime:** 30-45 minutos

---

## 📋 Resumen de lo que vas a hacer

1. **Backup de desarrollo** (por seguridad) - 5 min
2. **Backup de producción** - 10-15 min
3. **Restaurar producción en desarrollo** - 15-20 min
4. **Aplicar 104 migraciones SQL** - 30-45 min
5. **Desplegar 29 Edge Functions** - 15-20 min
6. **Verificar que todo funcione** - 10-15 min

**Total:** ~2-3 horas

---

## ⚡ Ejecución Rápida (para expertos)

Si ya sabes lo que haces, ejecuta estos comandos en orden:

```bash
cd /Users/marianomorales/Downloads/ultima-next/ultima-next/migration-scripts

# 1. Backup de desarrollo
pg_dump "postgresql://postgres:Lifeintechnicolor2!@db.pemgwyymodlwabaexxrb.supabase.co:5432/postgres" \
  --clean --if-exists --no-owner --no-acl \
  -f ../backups/backup_desarrollo_$(date +%Y%m%d_%H%M%S).sql

# 2. Backup de producción
pg_dump "postgresql://postgres:Lifeintechnicolor2!@db.jjepfehmuybpctdzipnu.supabase.co:5432/postgres" \
  --clean --if-exists --no-owner --no-acl \
  -f ../backups/produccion_backup_$(date +%Y%m%d_%H%M%S).sql

# 3. Restaurar producción en desarrollo
psql "postgresql://postgres:Lifeintechnicolor2!@db.pemgwyymodlwabaexxrb.supabase.co:5432/postgres" \
  -f ../backups/produccion_backup_YYYYMMDD_HHMMSS.sql

# 4. Aplicar migraciones
./apply-migrations.sh

# 5. Desplegar Edge Functions
./deploy-edge-functions.sh

# 6. Verificar
psql "postgresql://postgres:Lifeintechnicolor2!@db.pemgwyymodlwabaexxrb.supabase.co:5432/postgres" \
  -f verificar-migracion.sql
```

---

## 📝 Ejecución Paso a Paso (Detallada)

### PASO 0: Preparación (5 min)

#### ¿Cuándo ejecutar?
- **Recomendado:** Viernes noche o Sábado temprano
- **Horario de bajo tráfico:** 11 PM - 6 AM

#### Notificaciones
1. Avisar a stakeholders con 24h de anticipación
2. NO activar modo mantenimiento aún (mantenemos autostrefa.mx funcionando)

---

### PASO 1: Backup de Desarrollo (5 min)

**Por qué:** Guardar el estado actual de desarrollo por si necesitamos hacer rollback.

```bash
cd /Users/marianomorales/Downloads/ultima-next/ultima-next/migration-scripts

# Crear backup de desarrollo
pg_dump "postgresql://postgres:Lifeintechnicolor2!@db.pemgwyymodlwabaexxrb.supabase.co:5432/postgres" \
  --clean --if-exists --no-owner --no-acl \
  -f ../backups/backup_desarrollo_$(date +%Y%m%d_%H%M%S).sql
```

**Verificar que se creó:**
```bash
ls -lh ../backups/backup_desarrollo_*.sql | tail -1
```

**Deberías ver:** Un archivo de ~80-90 MB creado justo ahora

**⏱️ Tiempo:** ~3-5 minutos

---

### PASO 2: Backup de Producción (10-15 min)

**Por qué:** Este es el backup que vamos a restaurar en desarrollo.

```bash
# Crear backup de producción
pg_dump "postgresql://postgres:Lifeintechnicolor2!@db.jjepfehmuybpctdzipnu.supabase.co:5432/postgres" \
  --clean --if-exists --no-owner --no-acl \
  -f ../backups/produccion_backup_$(date +%Y%m%d_%H%M%S).sql
```

**Verificar que se creó:**
```bash
ls -lh ../backups/produccion_backup_*.sql | tail -1
```

**Deberías ver:** Un archivo de ~100-120 MB (más grande que desarrollo)

**Verificar integridad:**
```bash
grep "CREATE TABLE auth.users" ../backups/produccion_backup_*.sql
```

**Deberías ver:** Una línea que dice `CREATE TABLE auth.users`

**⏱️ Tiempo:** ~10-15 minutos

**⚠️ IMPORTANTE:** Toma nota del nombre exacto del archivo (ej: `produccion_backup_20241218_203045.sql`)

---

### PASO 3: Restaurar Producción en Desarrollo (15-20 min)

**⚠️ ADVERTENCIA:** Esto ELIMINARÁ todos los datos actuales de desarrollo (1,133 profiles)
y los reemplazará con los de producción (4,084 profiles).

**Por qué:** Queremos que desarrollo tenga exactamente los mismos datos que producción antes de aplicar las migraciones.

```bash
# Reemplazar YYYYMMDD_HHMMSS con el timestamp del backup que acabas de crear
psql "postgresql://postgres:Lifeintechnicolor2!@db.pemgwyymodlwabaexxrb.supabase.co:5432/postgres" \
  -f ../backups/produccion_backup_YYYYMMDD_HHMMSS.sql
```

**Ejemplo real:**
```bash
# Si tu archivo se llama produccion_backup_20241218_203045.sql
psql "postgresql://postgres:Lifeintechnicolor2!@db.pemgwyymodlwabaexxrb.supabase.co:5432/postgres" \
  -f ../backups/produccion_backup_20241218_203045.sql
```

**Qué verás:**
- Muchas líneas de `DROP TABLE`, `CREATE TABLE`, `COPY`, etc.
- Algunos warnings son normales (ej: "supautils")
- Errores de "already exists" son normales

**Verificar restauración:**
```bash
psql "postgresql://postgres:Lifeintechnicolor2!@db.pemgwyymodlwabaexxrb.supabase.co:5432/postgres" \
  -c "SELECT COUNT(*) FROM profiles;"
```

**Deberías ver:** `4084` (o el número que viste en producción)

**Si ves un número diferente:** DETENTE y revisa el backup

**⏱️ Tiempo:** ~15-20 minutos

---

### PASO 4: Aplicar Migraciones SQL (30-45 min)

**Por qué:** Ahora que tenemos los datos de producción en desarrollo, aplicamos las 104 migraciones que agregan:
- 7 tablas nuevas
- 9 columnas nuevas en profiles
- 30+ funciones RPC
- 60+ índices
- Políticas RLS actualizadas

```bash
# Ejecutar script de migraciones
./apply-migrations.sh
```

**Qué verás:**
```
╔════════════════════════════════════════════════════════════╗
║        🚀 APLICACIÓN DE MIGRACIONES SQL                   ║
╚════════════════════════════════════════════════════════════╝

📂 Directorio de migraciones: /Users/.../supabase/migrations
📝 Log de ejecución: migration_log_20241218_204530.txt

═══════════════════════════════════════════════════════════
  FASE A: ESTRUCTURA (Tablas, Columnas, Extensiones)
═══════════════════════════════════════════════════════════

⏳ Aplicando: 20251021120000_enable_pg_trgm.sql
✅ OK: 20251021120000_enable_pg_trgm.sql

⏳ Aplicando: 20250128_create_landing_pages.sql
✅ OK: 20250128_create_landing_pages.sql
...
```

**Errores esperados (NORMALES):**
- `column already exists`
- `relation already exists`
- `function already exists`
- `index already exists`

Estos NO son errores reales, el script continuará.

**Errores CRÍTICOS (MALOS):**
- `syntax error`
- `permission denied`
- `out of memory`

Si ves estos, el script se detendrá.

**Verificar progreso:**
```bash
# En otra terminal, mientras corre el script
tail -f migration_log_*.txt
```

**⏱️ Tiempo:** ~30-45 minutos

**Al finalizar verás:**
```
╔════════════════════════════════════════════════════════════╗
║              📊 RESUMEN DE MIGRACIÓN                      ║
╚════════════════════════════════════════════════════════════╝

Total de migraciones: 104
✅ Exitosas: 102
❌ Con errores: 2

📝 Log completo: migration_log_20241218_204530.txt
📊 Progreso: migration_progress.txt

🎉 Migración completada. Verificar con verificar-migracion.sql
```

**Si hay errores:** Revisar `migration_log_*.txt` para ver qué falló

---

### PASO 5: Desplegar Edge Functions (15-20 min)

**Por qué:** Las Edge Functions necesitan estar actualizadas para funcionar con el nuevo esquema.

```bash
# Ejecutar script de deploy
./deploy-edge-functions.sh
```

**Qué verás:**
```
╔════════════════════════════════════════════════════════════╗
║        🚀 DEPLOY DE EDGE FUNCTIONS                        ║
╚════════════════════════════════════════════════════════════╝

═══════════════════════════════════════════════════════════
  🔴 FUNCIONES CRÍTICAS (Sistema no funciona sin ellas)
═══════════════════════════════════════════════════════════

⏳ Deploying [CRÍTICA]: custom-access-token
✅ OK: custom-access-token

⏳ Deploying [CRÍTICA]: send-sms-otp
✅ OK: send-sms-otp
...
```

**IMPORTANTE:** Si alguna función **CRÍTICA** falla, el script te preguntará si quieres continuar.

**Funciones críticas (6):**
1. `custom-access-token` - JWT con roles
2. `send-sms-otp` - SMS de autenticación
3. `verify-sms-otp` - Verificación SMS
4. `auth-send-email` - Emails de auth
5. `rapid-processor` - API principal
6. `airtable-sync` - Sincronización de inventario

**Si una crítica falla:**
1. NO continuar
2. Revisar logs: `deploy_log_*.txt`
3. Verificar secrets en Supabase Dashboard

**Verificación de Secrets:**

El script te preguntará si los secrets están configurados. Verifica estos:

```
Airtable:
  - AIRTABLE_API_KEY
  - AIRTABLE_BASE_ID
  - AIRTABLE_TABLE_ID

Twilio (SMS):
  - TWILIO_ACCOUNT_SID
  - TWILIO_AUTH_TOKEN
  - TWILIO_VERIFY_SERVICE_SID

Brevo (Email):
  - BREVO_API_KEY

Cloudflare R2:
  - CLOUDFLARE_ACCOUNT_ID
  - CLOUDFLARE_R2_ACCESS_KEY_ID
  - CLOUDFLARE_R2_SECRET_ACCESS_KEY

Supabase:
  - SUPABASE_URL
  - SUPABASE_SERVICE_ROLE_KEY
  - SUPABASE_ANON_KEY

Otros:
  - PUBLIC_SITE_URL
```

**⏱️ Tiempo:** ~15-20 minutos

**Al finalizar verás:**
```
╔════════════════════════════════════════════════════════════╗
║              📊 RESUMEN DE DEPLOY                         ║
╚════════════════════════════════════════════════════════════╝

Total de funciones: 29
✅ Deployed: 28
❌ Con errores: 1

Funciones críticas:
  ✅ OK: 6 / 6
  ❌ Errores: 0 / 6

🎉 Deploy completado exitosamente.
```

---

### PASO 6: Verificación (10-15 min)

**Por qué:** Asegurarnos de que todo se migró correctamente.

```bash
# Ejecutar script de verificación
psql "postgresql://postgres:Lifeintechnicolor2!@db.pemgwyymodlwabaexxrb.supabase.co:5432/postgres" \
  -f verificar-migracion.sql
```

**Qué verás:**
```
VERIFICACIÓN DE MIGRACIÓN
========================

1. USUARIOS:
 total_profiles | usuarios | sales | admins
----------------+----------+-------+--------
           4084 |     4062 |    18 |      4

2. AUTH.USERS:
 total_auth_users
------------------
             4084

3. FINANCING APPLICATIONS:
 total_applications
--------------------
               2092

4. TABLAS NUEVAS:
         tabla          | registros
------------------------+-----------
 landing_pages          |         0
 marketing_events       |         0
 r2_images              |         5
 sync_logs              |        12
 roadmap_items          |         0
 user_email_notifications |       0
 vehiculos_completos    |       850

5. FUNCIONES RPC:
     routine_name      | routine_type
-----------------------+--------------
 get_my_profile        | FUNCTION
 safe_upsert_profile   | FUNCTION
 get_leads_for_dashboard | FUNCTION
 search_vehicles       | FUNCTION
 buscar_vehiculos_ai   | FUNCTION
 submit_application    | FUNCTION

6. TRIGGERS:
      trigger_name           | event_object_table
-----------------------------+--------------------
 on_auth_user_sign_in        | profiles
 trg_update_search_vector    | vehiculos_completos
 trg_sync_vehiculo_completo  | vehiculos

7. ÍNDICES CRÍTICOS:
 idx_profiles_asesor_asignado
 idx_vc_search_vector
 idx_profiles_utm_source

✅ VERIFICACIÓN COMPLETADA
```

**Criterios de éxito:**

- ✅ `total_profiles` = 4084 (o similar a producción)
- ✅ `total_auth_users` = 4084
- ✅ `total_applications` ≥ 2092
- ✅ Todas las tablas nuevas existen (pueden tener 0 registros)
- ✅ Todas las funciones RPC críticas existen
- ✅ Todos los triggers existen
- ✅ Todos los índices existen

**Si falta algo:** Revisar `migration_log_*.txt` para ver qué migración falló

---

### PASO 7: Pruebas Funcionales (15 min)

**Probar en:** https://autostrefa.mx

#### Prueba 1: Login con SMS ✅
1. Ir a https://autostrefa.mx
2. Intentar login con número de teléfono
3. Verificar que llega SMS
4. Ingresar código
5. **Debe funcionar:** Login exitoso

#### Prueba 2: Dashboard Admin ✅
1. Login como admin: mariano.morales@autostrefa.mx
2. Ir a `/dashboard/admin`
3. **Debe mostrar:** Lista de leads
4. **Debe funcionar:** Filtros y búsqueda

#### Prueba 3: Búsqueda de Vehículos ✅
1. Ir a https://autostrefa.mx/catalogo
2. Buscar "Toyota"
3. **Debe mostrar:** Resultados de búsqueda
4. **Debe funcionar:** Filtros

#### Prueba 4: Ver Detalle de Vehículo ✅
1. Click en cualquier vehículo
2. **Debe mostrar:** Página de detalle
3. **Debe cargar:** Imágenes desde `r2.trefa.mx`

#### Prueba 5: Portal Bancario ✅
1. Login como banco (si tienes credenciales)
2. Ir a `/dashboard/bank`
3. **Debe mostrar:** Solicitudes asignadas

**Si algo falla:**
- Revisar console del browser (F12)
- Revisar logs de Edge Functions
- Revisar `migration_log_*.txt`

---

## 🆘 Si Algo Sale Mal - Rollback

**Síntomas de que algo salió mal:**
- Login no funciona
- Dashboard muestra errores
- Búsqueda no devuelve resultados
- Aplicaciones no se pueden crear

**Ejecutar rollback inmediato:**

```bash
cd /Users/marianomorales/Downloads/ultima-next/ultima-next/migration-scripts

# Ejecutar script de rollback
./rollback.sh
```

**El script te pedirá:**
1. Seleccionar el backup de desarrollo (el que creaste en PASO 1)
2. Confirmar escribiendo "SI ESTOY SEGURO"
3. Esperar 15-20 minutos mientras restaura

**Después del rollback:**
- Desarrollo volverá a tener 1,133 profiles
- autostrefa.mx funcionará normalmente
- NO habrás perdido nada de producción

---

## 📊 Checklist Final

Antes de dar por terminada la migración:

- [ ] ✅ Profiles en desarrollo = 4,084
- [ ] ✅ Auth users = 4,084
- [ ] ✅ Applications ≥ 2,092
- [ ] ✅ 7 tablas nuevas existen
- [ ] ✅ 30+ funciones RPC existen
- [ ] ✅ 6 Edge Functions críticas deployed
- [ ] ✅ Login funciona
- [ ] ✅ Dashboard admin muestra datos
- [ ] ✅ Búsqueda de vehículos funciona
- [ ] ✅ Imágenes cargan desde r2.trefa.mx
- [ ] ✅ Portal bancario funciona
- [ ] ✅ Todos los logs revisados sin errores críticos

---

## 📝 Post-Migración

### Documentar Ejecución

Completar el `MIGRATION_REPORT.md` con:
- Fecha y hora de inicio/fin de cada fase
- Errores encontrados y cómo se resolvieron
- Tiempo real vs. estimado
- Lecciones aprendidas

### Monitoreo (Primeras 24h)

**Métricas a vigilar:**
- Usuarios activos
- Tasa de error en login
- Tiempo de respuesta de `rapid-processor`
- Errores en Edge Functions
- Tickets de soporte

**Comandos útiles:**
```bash
# Ver logs de Edge Functions
supabase functions logs rapid-processor --project-ref pemgwyymodlwabaexxrb

# Contar usuarios activos hoy
psql "postgresql://postgres:Lifeintechnicolor2!@db.pemgwyymodlwabaexxrb.supabase.co:5432/postgres" \
  -c "SELECT COUNT(DISTINCT user_id) FROM auth.sessions WHERE created_at > NOW() - INTERVAL '24 hours';"
```

### Comunicación

**Email a usuarios (si es necesario):**
```
Subject: Actualización del Sistema Completada

Estimado cliente,

Hemos completado exitosamente la actualización de nuestra plataforma.

Ahora tienes acceso a:
- Búsqueda mejorada de vehículos
- Dashboard renovado
- Mejor rendimiento general

Gracias por tu paciencia.

El equipo de Autostrefa
```

---

## 🎉 Siguiente Fase: Migración de Dominio

Una vez que hayas confirmado que todo funciona perfectamente en `autostrefa.mx` durante al menos 1 semana:

1. Leer `GUIA-MIGRACION-DOMINIOS.md`
2. Programar ventana de mantenimiento para cambio de dominio
3. Ejecutar migración de `autostrefa.mx` → `trefa.mx`

**Estimado para fase 2:** 1 hora (downtime: 15 min)

---

**¡Éxito en tu migración! 🚀**

**Última actualización:** 2025-12-18
