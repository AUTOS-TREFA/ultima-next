# Scripts SQL

Este directorio contiene scripts SQL para mantenimiento, migraciones manuales y operaciones de base de datos.

## Propósito

- Scripts SQL ad-hoc para operaciones específicas
- Queries de análisis y reportes
- Scripts de limpieza y mantenimiento
- Migraciones manuales que no están en `/supabase/migrations/`

## Organización

- Usa nombres descriptivos: `fix_duplicate_applications_20251205.sql`
- Incluye comentarios explicando el propósito del script
- Documenta los efectos esperados
- Indica si el script es idempotente

## Diferencia con `/supabase/migrations/`

- **`/supabase/migrations/`**: Migraciones automáticas gestionadas por Supabase CLI
- **`/docs/sql-scripts/`**: Scripts manuales para casos específicos, análisis o debugging

## Precaución

Siempre prueba los scripts en un ambiente de desarrollo antes de ejecutarlos en producción.
