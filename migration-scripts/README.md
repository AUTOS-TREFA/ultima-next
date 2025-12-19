# Guía de Migración de Datos de Supabase

Esta guía te ayudará a migrar todos los datos de tu base de datos de producción a tu nueva base de datos de desarrollo.

## 📋 Contexto

- **Base de datos de producción**: `jjepfehmuybpctdzipnu.supabase.co` (activa con usuarios)
- **Base de datos de desarrollo**: `pemgwyymodlwabaexxrb.supabase.co` (nueva con columnas adicionales)

## 🎯 Objetivo

Transferir todos los datos de usuarios, solicitudes, documentos y datos relacionados de producción a la nueva base de datos, preservando la integridad referencial.

## 📊 Tablas a Migrar

### Tablas Principales
1. `profiles` - Perfiles de usuarios
2. `financing_applications` - Solicitudes de financiamiento
3. `bank_profiles` - Perfiles bancarios
4. `uploaded_documents` - Documentos subidos

### Tablas Relacionadas
5. `application_status_history` - Historial de estados
6. `bank_assignments` - Asignaciones bancarias
7. `bank_feedback` - Retroalimentación
8. `document_upload_analytics` - Analytics de documentos
9. `lead_bank_assignments` - Asignaciones de leads
10. `lead_reminders` - Recordatorios
11. `lead_tag_associations` - Etiquetas
12. `user_email_notifications` - Notificaciones
13. `consignment_listings` - Listados de consignación
14. `consignment_listing_views` - Vistas de listados
15. `user_vehicles_for_sale` - Vehículos en venta
16. `messages` - Mensajes
17. `tracking_events` - Eventos de tracking
18. `user_favorites` - Favoritos
19. `user_search_history` - Historial de búsqueda
20. `vehicle_price_watches` - Alertas de precios

## 🛠️ Métodos de Migración

### Opción 1: Usando pg_dump (Recomendado) ⭐

Este método es el más confiable y usa herramientas nativas de PostgreSQL.

**Requisitos:**
- Tener instalado PostgreSQL (para usar `pg_dump` y `psql`)
- Acceso a terminal/bash

**Pasos:**

1. Hacer el script ejecutable:
```bash
chmod +x migration-scripts/migrate-with-pg-dump.sh
```

2. Ejecutar el script:
```bash
./migration-scripts/migrate-with-pg-dump.sh
```

3. Ingresar el password cuando se solicite

**Ventajas:**
- ✅ Maneja automáticamente conflictos
- ✅ Más rápido para grandes volúmenes
- ✅ Genera backups locales
- ✅ Verificación automática de datos

---

### Opción 2: Usando Node.js

Este método te da más control sobre el proceso de migración.

**Requisitos:**
- Node.js instalado
- Service Role Key de Supabase

**Pasos:**

1. Instalar dependencias:
```bash
npm install @supabase/supabase-js
```

2. Obtener tu Service Role Key:
   - Ve a tu proyecto en Supabase Dashboard
   - Settings → API
   - Copia el "service_role" key (¡NO el anon key!)

3. Configurar el Service Role Key:
```bash
export SUPABASE_SERVICE_ROLE_KEY="tu-service-role-key-aqui"
```

O edita el archivo `migrate-data.js` y reemplaza `TU_SERVICE_ROLE_KEY_AQUI` con tu key.

4. Ejecutar migración:
```bash
node migration-scripts/migrate-data.js
```

**Ventajas:**
- ✅ Control granular del proceso
- ✅ Logs detallados
- ✅ Puede modificarse fácilmente

---

### Opción 3: Migración Manual con SQL

Si prefieres más control manual, puedes usar los archivos SQL generados.

**Pasos:**

1. Conectarte a producción:
```bash
psql -h db.jjepfehmuybpctdzipnu.supabase.co -U postgres -d postgres
```

2. Ejecutar el script de exportación:
```sql
\i migration-scripts/export-production-data.sql
```

3. Conectarte a desarrollo:
```bash
psql -h db.pemgwyymodlwabaexxrb.supabase.co -U postgres -d postgres
```

4. Importar cada archivo JSON manualmente

---

## 🔍 Verificación Post-Migración

Después de la migración, verifica que todo esté correcto:

### 1. Verificar conteos de registros

```sql
-- En producción
SELECT
  'profiles' as tabla, COUNT(*) as total FROM profiles
UNION ALL
SELECT 'financing_applications', COUNT(*) FROM financing_applications
UNION ALL
SELECT 'bank_profiles', COUNT(*) FROM bank_profiles
UNION ALL
SELECT 'uploaded_documents', COUNT(*) FROM uploaded_documents;
```

Ejecuta la misma query en desarrollo y compara los números.

### 2. Verificar integridad referencial

```sql
-- Verificar que todas las aplicaciones tienen un usuario válido
SELECT COUNT(*)
FROM financing_applications fa
LEFT JOIN profiles p ON fa.user_id = p.id
WHERE p.id IS NULL;
-- Debería retornar 0

-- Verificar que todos los documentos tienen una aplicación válida
SELECT COUNT(*)
FROM uploaded_documents ud
LEFT JOIN financing_applications fa ON ud.application_id = fa.id
WHERE fa.id IS NULL;
-- Debería retornar 0
```

### 3. Verificar datos de muestra

```sql
-- Revisar algunos perfiles específicos
SELECT id, email, first_name, last_name, created_at
FROM profiles
ORDER BY created_at DESC
LIMIT 10;
```

---

## ⚠️ Consideraciones Importantes

### Antes de Migrar

1. **Backup**: Aunque estás migrando DE producción A desarrollo, es buena práctica tener un backup
2. **Tiempo**: La migración puede tomar varios minutos dependiendo del volumen de datos
3. **Duplicados**: Los scripts manejan automáticamente registros duplicados (los omite)
4. **Service Role Key**: Nunca compartas o commits la service role key

### Durante la Migración

1. **No interrumpir**: Deja que el proceso termine completamente
2. **Monitorear**: Observa los logs para detectar errores
3. **Red**: Asegúrate de tener conexión estable a internet

### Después de Migrar

1. **Verificar**: Usa las queries de verificación arriba
2. **Probar**: Haz pruebas de funcionalidad en desarrollo
3. **Storage**: Si tienes archivos en Supabase Storage, también necesitarás migrarlos

---

## 🗄️ Migración de Storage (Archivos)

Los archivos almacenados en Supabase Storage NO se migran con estos scripts. Para migrar archivos:

### Opción 1: Usar Supabase CLI

```bash
# Instalar Supabase CLI
npm install -g supabase

# Descargar archivos de producción
supabase storage download bucket-name --project-ref jjepfehmuybpctdzipnu

# Subir a desarrollo
supabase storage upload bucket-name ./downloaded-files --project-ref pemgwyymodlwabaexxrb
```

### Opción 2: Script personalizado

Si necesitas migrar storage, puedo crear un script específico para eso.

---

## 🔐 Seguridad

- ✅ Usa variables de entorno para passwords y keys
- ✅ No hagas commit de credenciales al repositorio
- ✅ Después de migrar, regenera las API keys si las compartiste
- ✅ Los backups locales contienen datos sensibles - elimínalos cuando no los necesites

---

## 🆘 Troubleshooting

### Error: "psql: command not found"

Necesitas instalar PostgreSQL:
- **Mac**: `brew install postgresql`
- **Linux**: `sudo apt-get install postgresql-client`
- **Windows**: Descargar de [postgresql.org](https://www.postgresql.org/download/)

### Error: "permission denied"

El script necesita permisos de ejecución:
```bash
chmod +x migration-scripts/migrate-with-pg-dump.sh
```

### Error: "FATAL: password authentication failed"

Verifica que estás usando el password correcto de Supabase.

### Error: "duplicate key value violates unique constraint"

Esto es normal si ya existen algunos registros en desarrollo. Los scripts continúan con el siguiente registro.

### Migración muy lenta

Para grandes volúmenes de datos, considera:
1. Hacer la migración en horarios de bajo tráfico
2. Aumentar el `batchSize` en `migrate-data.js`
3. Migrar tabla por tabla manualmente

---

## 📞 Soporte

Si encuentras problemas durante la migración:

1. Revisa los logs detalladamente
2. Verifica la conectividad a las bases de datos
3. Asegúrate de que tienes los permisos necesarios
4. Consulta la documentación de Supabase

---

## ✅ Checklist de Migración

- [ ] He hecho backup de ambas bases de datos
- [ ] He probado la conexión a ambas bases de datos
- [ ] He elegido mi método de migración
- [ ] He ejecutado el script de migración
- [ ] He verificado los conteos de registros
- [ ] He verificado la integridad referencial
- [ ] He probado la funcionalidad en desarrollo
- [ ] He migrado archivos de storage (si aplica)
- [ ] He actualizado las variables de entorno de mi app
- [ ] He comunicado el cambio a mi equipo

---

## 🎉 Post-Migración

Una vez completada la migración exitosamente:

1. **Actualiza tu app** para apuntar a la nueva base de datos
2. **Monitorea** la aplicación en las primeras horas
3. **Mantén** la base de datos antigua por un tiempo como backup
4. **Documenta** cualquier cambio específico de tu migración

---

**Última actualización**: 2025-12-18
