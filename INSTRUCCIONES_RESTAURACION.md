# Instrucciones para Restaurar y Optimizar Base de Datos

**Fecha:** 2025-12-05
**Backup Disponible:** `backup_20251204_175148.sql` (166 MB)
**Proyecto:** pemgwyymodlwabaexxrb

---

## 🎯 Objetivo

Restaurar la base de datos desde el backup más reciente y aplicar las optimizaciones críticas de performance.

---

## 📋 Opción 1: Script Automático (Recomendado)

Este script restaurará el backup Y aplicará las optimizaciones automáticamente.

```bash
# Ejecutar desde la raíz del proyecto
bash scripts/restore-database-from-backup.sh
```

El script hará:
1. ✅ Localizar el backup más reciente
2. ✅ Solicitar confirmación (debes escribir "SI")
3. ✅ Autenticar con Supabase (si es necesario)
4. ✅ Restaurar la base de datos completa
5. ✅ Preguntar si deseas aplicar optimizaciones (recomendado: SÍ)

---

## 📋 Opción 2: Manual Paso a Paso

### Paso 1: Autenticación

```bash
# Login en Supabase
npx supabase login

# Link al proyecto
npx supabase link --project-ref pemgwyymodlwabaexxrb
```

### Paso 2: Restaurar el Backup

**Opción 2A: Via CLI de Supabase**
```bash
# Obtener connection string
npx supabase db show-connection-string --linked

# Restaurar usando psql (requiere psql instalado)
psql "postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres" < backup_20251204_175148.sql
```

**Opción 2B: Via Dashboard de Supabase**
1. Ve a https://supabase.com/dashboard/project/pemgwyymodlwabaexxrb/settings/database
2. Busca la sección "Database restore"
3. Sube el archivo `backup_20251204_175148.sql`
4. Confirma la restauración

### Paso 3: Aplicar Optimizaciones

```bash
# Aplicar migraciones de optimización
bash scripts/apply-db-optimizations.sh
```

---

## 📋 Opción 3: Solo Aplicar Optimizaciones (Sin Restaurar)

Si la base de datos ya tiene los datos correctos y solo quieres optimizar:

```bash
# 1. Asegúrate de estar autenticado
npx supabase login

# 2. Aplicar optimizaciones
bash scripts/apply-db-optimizations.sh
```

---

## 🔍 Verificación Post-Restauración

### 1. Verificar que los datos se restauraron

```sql
-- Conectar a la base de datos
npx supabase db connect --linked

-- Contar registros en tablas principales
SELECT 'profiles' as tabla, COUNT(*) as registros FROM profiles
UNION ALL
SELECT 'financing_applications', COUNT(*) FROM financing_applications
UNION ALL
SELECT 'uploaded_documents', COUNT(*) FROM uploaded_documents
UNION ALL
SELECT 'bank_profiles', COUNT(*) FROM bank_profiles;
```

### 2. Verificar que las optimizaciones se aplicaron

```bash
# Ejecutar script de verificación
npx supabase db connect --linked

# En psql:
\i scripts/verificar-optimizaciones.sql
```

### 3. Verificar que la aplicación funciona

```bash
# Iniciar el servidor de desarrollo
npm run dev

# Visita http://localhost:3000 y verifica:
# - Login funciona
# - Dashboard carga correctamente
# - Solicitudes de financiamiento se muestran
# - Documentos se pueden subir
```

---

## 📊 Contenido del Backup

El backup `backup_20251204_175148.sql` contiene:
- ✅ Esquema completo de la base de datos
- ✅ Todos los datos de producción
- ✅ Funciones almacenadas
- ✅ Triggers
- ✅ Políticas RLS
- ✅ Índices existentes

**Tamaño:** 166 MB
**Fecha:** 2025-12-04 17:51:48

---

## ⚠️ Precauciones Importantes

### Antes de Restaurar:
1. ⚠️ **BACKUP ACTUAL**: Supabase hace backups automáticos, pero si quieres estar seguro:
   ```bash
   # Crear backup del estado actual (opcional)
   npx supabase db dump --linked -f backup_pre_restore_$(date +%Y%m%d_%H%M%S).sql
   ```

2. ⚠️ **VENTANA DE MANTENIMIENTO**: Restaurar en horario de baja actividad

3. ⚠️ **USUARIOS ACTIVOS**: Los usuarios conectados serán desconectados durante la restauración

### Durante la Restauración:
- ⏱️ Tiempo estimado: 5-10 minutos para 166 MB
- 🚫 La aplicación no estará disponible durante este tiempo
- 📊 Monitorea el progreso en la terminal

### Después de Restaurar:
1. ✅ Verificar conteo de registros
2. ✅ Probar funcionalidad crítica de la app
3. ✅ Revisar logs en Supabase Dashboard
4. ✅ Aplicar las migraciones de optimización

---

## 🐛 Troubleshooting

### Error: "permission denied"
**Solución:**
```bash
chmod +x scripts/restore-database-from-backup.sh
chmod +x scripts/apply-db-optimizations.sh
```

### Error: "psql: command not found"
**Solución para macOS:**
```bash
brew install postgresql
```

**Solución alternativa:** Usa la Opción 2B (Dashboard de Supabase)

### Error: "Could not connect to database"
**Solución:**
1. Verifica que estás autenticado: `npx supabase projects list`
2. Verifica el link: `npx supabase link --project-ref pemgwyymodlwabaexxrb`
3. Verifica la connection string: `npx supabase db show-connection-string --linked`

### La restauración se cuelga
**Posibles causas:**
1. Archivo muy grande - Espera un poco más
2. Conexión lenta - Usa Dashboard en su lugar
3. Formato incorrecto - Verifica que sea un archivo SQL válido

### Los datos no aparecen después de restaurar
**Verificar:**
1. Que la restauración terminó sin errores
2. Que estás conectado al proyecto correcto
3. Que las políticas RLS no están bloqueando el acceso

---

## 📞 Siguiente Paso

Una vez restaurada la base de datos y aplicadas las optimizaciones, ejecuta:

```bash
# Verificar que todo funciona
npm run dev

# Revisar la guía de optimización
cat GUIA_OPTIMIZACION_BD.md
```

---

## 📁 Archivos Relacionados

- `/backup_20251204_175148.sql` - Backup de la base de datos
- `/scripts/restore-database-from-backup.sh` - Script de restauración
- `/scripts/apply-db-optimizations.sh` - Script de optimizaciones
- `/scripts/verificar-optimizaciones.sql` - Script de verificación
- `/GUIA_OPTIMIZACION_BD.md` - Guía detallada de optimizaciones
- `/supabase/migrations/20251205000001_optimize_indexes_remove_redundant.sql`
- `/supabase/migrations/20251205000002_optimize_indexes_add_critical.sql`
