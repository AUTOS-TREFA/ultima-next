# Guía Rápida de Migración 🚀

## Opción Más Rápida (Recomendada)

### Usando el Script Inteligente

Este es el método más confiable y automatizado:

```bash
cd migration-scripts
./migrate-smart.sh
```

Cuando te solicite el password, ingresa tu password de Supabase.

**¡Eso es todo!** El script hará:
- ✅ Exportar datos de producción
- ✅ Importar a desarrollo
- ✅ Manejar conflictos automáticamente
- ✅ Verificar integridad
- ✅ Generar reporte completo

---

## Verificar la Migración

Después de migrar, verifica que todo esté correcto:

```bash
psql -h db.pemgwyymodlwabaexxrb.supabase.co -U postgres -d postgres -f verify-migration.sql
```

O si prefieres usar Node.js, ejecuta el script de verificación desde tu aplicación.

---

## Si el Script de Bash No Funciona

### Alternativa: Script de Node.js

1. Instalar dependencias:
```bash
cd migration-scripts
npm install
```

2. Configurar tu Service Role Key:

   a. Ve a [https://pemgwyymodlwabaexxrb.supabase.co](https://pemgwyymodlwabaexxrb.supabase.co)

   b. Settings → API → Copia el "service_role" secret key

   c. Configura la variable de entorno:
   ```bash
   export SUPABASE_SERVICE_ROLE_KEY="tu-service-role-key"
   ```

3. Ejecutar migración:
```bash
npm run migrate
```

---

## Troubleshooting Rápido

### "psql: command not found"
```bash
# Mac
brew install postgresql

# Linux
sudo apt-get install postgresql-client
```

### "permission denied"
```bash
chmod +x migrate-smart.sh
```

### Verificar conexión a bases de datos
```bash
# Producción
psql -h db.jjepfehmuybpctdzipnu.supabase.co -U postgres -d postgres -c "SELECT 1;"

# Desarrollo
psql -h db.pemgwyymodlwabaexxrb.supabase.co -U postgres -d postgres -c "SELECT 1;"
```

---

## Después de Migrar

1. **Verifica los datos**: Ejecuta `verify-migration.sql`
2. **Prueba tu app**: Apunta a la nueva base de datos
3. **Actualiza env vars**: Cambia `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. **Monitorea**: Observa los logs en las primeras horas

---

## Migración de Storage (Archivos)

Si tienes archivos en Supabase Storage, necesitarás migrarlos también:

```bash
# Instalar Supabase CLI
npm install -g supabase

# Migrar archivos
supabase storage download bucket-name --project-ref jjepfehmuybpctdzipnu
supabase storage upload bucket-name ./downloaded-files --project-ref pemgwyymodlwabaexxrb
```

---

## ¿Necesitas ayuda?

Consulta el [README.md](./README.md) completo para más detalles y opciones avanzadas.

---

**Pro Tip**: Haz un backup antes de migrar (aunque estás migrando DE producción A desarrollo, siempre es buena práctica)

```bash
# Backup de desarrollo (por si acaso)
pg_dump -h db.pemgwyymodlwabaexxrb.supabase.co -U postgres -d postgres -f backup-dev-$(date +%Y%m%d).sql
```
