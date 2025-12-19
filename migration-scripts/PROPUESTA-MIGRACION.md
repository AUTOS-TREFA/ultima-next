# Propuesta de Migración de Base de Datos - Producción a Desarrollo

**Fecha:** 18 de Diciembre, 2024
**Preparado por:** Mariano Morales
**Proyecto:** Migración NextJS - Ultima

---

## Contexto

Hace aproximadamente un mes creamos una copia de la base de datos de producción para trabajar en la migración a NextJS. Durante este tiempo:

- La base de datos de producción siguió activa con usuarios reales
- Se agregaron ~2,950 nuevos usuarios en producción
- En desarrollo modificamos el esquema (agregamos columnas, tablas, funciones RPC)
- Terminamos el desarrollo y ahora necesitamos hacer el deploy

**El problema:** Necesitamos que todos los usuarios de producción (4,082 en total) puedan usar el nuevo sitio, pero la base de datos de desarrollo solo tiene 1,133 usuarios (los que existían hace un mes).

---

## Situación Actual

### Base de Datos de Producción
- 4,082 perfiles de usuario
- 2,092 solicitudes de financiamiento
- 1,376 perfiles bancarios
- 1,004 documentos subidos
- **Schema:** Estado original (sin las columnas/tablas nuevas)

### Base de Datos de Desarrollo
- 1,133 perfiles de usuario (todos con auth válido)
- 883 solicitudes de financiamiento
- 442 perfiles bancarios
- 548 documentos subidos
- **Schema:** Actualizado con nuevas columnas, tablas y funciones RPC

### Gap
- **~2,950 usuarios** que se registraron en el último mes NO están en desarrollo
- Nuevas funcionalidades solo existen en desarrollo

---

## Opciones Disponibles

### Opción 1: Backup/Restore Completo + Migración de Schema

**Descripción:**
Restaurar el backup completo de producción en desarrollo, luego aplicar los cambios de schema manualmente.

**Procedimiento:**
1. Exportar cambios de schema de desarrollo (columnas nuevas, funciones RPC, etc.)
2. Hacer backup de desarrollo (por seguridad)
3. Restaurar backup de producción en desarrollo
4. Aplicar los cambios de schema exportados sobre la base restaurada
5. Re-deployar Edge Functions

**Resultado:**
- Tendremos los 4,082 usuarios de producción
- Con todas las nuevas funcionalidades de desarrollo

---

### Opción 2: Continuar con Base Actual

**Descripción:**
Lanzar con los 1,133 usuarios actuales y que los demás se registren de nuevo.

**Procedimiento:**
1. Desplegar el sitio nuevo tal como está
2. Los ~2,950 usuarios faltantes tendrán que crear cuenta nuevamente
3. Sus datos históricos (solicitudes, documentos) no estarán disponibles

**Resultado:**
- Lanzamiento inmediato sin riesgo técnico
- Pérdida de datos históricos de ~2,950 usuarios

---

### Opción 3: Migración Selectiva de Datos

**Descripción:**
Intentar migrar solo los datos sin tocar auth.users (lo que ya intentamos).

**Resultado alcanzado:**
- Solo pudimos migrar 1,761 registros de usuarios que YA existían
- No es posible migrar perfiles sin sus usuarios de auth correspondientes
- Supabase tiene protecciones que lo impiden

**Conclusión:** Esta opción NO es viable técnicamente.

---

## Análisis de Riesgos

| Riesgo | Opción 1 | Opción 2 | Severidad | Mitigación |
|--------|----------|----------|-----------|------------|
| **Pérdida de datos de desarrollo** | ✓ Cualquier dato de prueba del último mes se pierde | - No aplica | Media | Documentar datos de prueba necesarios para recrear |
| **Downtime durante migración** | ✓ 20-30 minutos sin servicio | - No aplica | Media | Programar en horario de bajo tráfico (madrugada) |
| **Conflictos de schema** | ✓ Si producción cambió algo que conflictúe con desarrollo | - No aplica | Baja | Revisar diff antes de aplicar cambios |
| **Pérdida de usuarios** | - No aplica | ✓ ~2,950 usuarios perderán acceso | Alta | Ninguna - es el trade-off de esta opción |
| **Pérdida de datos históricos** | - No aplica | ✓ Solicitudes y documentos de ~2,950 usuarios se pierden | Alta | Ninguna - datos quedan huérfanos |
| **Funciones RPC desactualizadas** | ✓ Si se modificaron en producción | - No aplica | Baja | Merge manual de funciones |
| **Storage/Archivos** | ✓ No se migran automáticamente | - No aplica | Media | Migración separada de storage |
| **Rollback complicado** | ✓ Si algo falla, rollback requiere tiempo | - Rollback inmediato | Media | Tener backup previo listo |

---

## Comparación de Opciones

| Criterio | Opción 1: Backup/Restore | Opción 2: Base Actual |
|----------|-------------------------|----------------------|
| **Usuarios migrados** | 4,082 (100%) | 1,133 (28%) |
| **Tiempo de implementación** | 2-3 horas | Inmediato |
| **Downtime** | 20-30 minutos | 0 minutos |
| **Riesgo técnico** | Medio | Bajo |
| **Experiencia del usuario** | Óptima - todos pueden entrar | Mala - muchos no podrán entrar |
| **Datos históricos** | Todos preservados | ~72% se pierden |
| **Complejidad** | Alta | Baja |
| **Costo de soporte** | Bajo - pocos tickets | Alto - muchos usuarios reportando problemas |

---

## Recomendación

**Opción 1: Backup/Restore + Migración de Schema**

### Justificación

1. **Experiencia del usuario:** Es inaceptable que 2,950 usuarios (72% de la base) no puedan acceder al nuevo sitio
2. **Pérdida de datos:** Las solicitudes y documentos de esos usuarios representan valor de negocio
3. **Costo de soporte:** Atender tickets de 2,950 usuarios preguntando por qué no pueden entrar será más costoso que el downtime
4. **Profesionalismo:** Un lanzamiento donde la mayoría de usuarios pierden acceso genera mala reputación

### Contra-argumentos a considerar

- **Argumento:** "El downtime afectará a usuarios"
  **Respuesta:** 30 minutos programados en madrugada vs. días/semanas de usuarios sin acceso

- **Argumento:** "Es riesgoso técnicamente"
  **Respuesta:** Tenemos backup de seguridad y plan de rollback. El riesgo es manejable.

- **Argumento:** "Toma mucho tiempo"
  **Respuesta:** 2-3 horas de trabajo técnico vs. potencialmente semanas explicando a usuarios por qué perdieron sus datos

---

## Plan de Ejecución (Opción 1)

### Pre-Migración
**Duración estimada:** 2-3 horas
**Cuándo:** Esta semana

1. Generar migración de schema con cambios de desarrollo
2. Documentar todas las funciones RPC nuevas/modificadas
3. Hacer inventario de Edge Functions
4. Probar la migración en ambiente local
5. Preparar scripts de rollback

### Migración
**Duración estimada:** 2-3 horas
**Cuándo:** Fin de semana próximo (madrugada)

1. Activar modo mantenimiento (5 min)
2. Backup completo de desarrollo actual (10 min)
3. Restore de producción en desarrollo (20-30 min)
4. Aplicar migración de schema (10-15 min)
5. Re-deploy de Edge Functions (5 min)
6. Verificación y pruebas (30 min)
7. Desactivar modo mantenimiento

### Post-Migración
**Duración estimada:** 1-2 horas

1. Monitoreo de logs por 24 horas
2. Verificación de funcionalidades críticas
3. Soporte activo para primeros usuarios

---

## Recursos Necesarios

- **Técnicos:** 1 desarrollador durante la migración (yo)
- **Infraestructura:** Ningún costo adicional (recursos existentes de Supabase)
- **Comunicación:** Aviso a usuarios sobre ventana de mantenimiento
- **Tiempo total:** ~4-6 horas (incluyendo preparación y ejecución)

---

## Métricas de Éxito

- ✓ 100% de usuarios de producción pueden hacer login en el nuevo sitio
- ✓ 0 pérdida de datos (solicitudes, documentos, perfiles)
- ✓ Todas las funcionalidades nuevas operativas
- ✓ Downtime menor a 45 minutos
- ✓ Menos de 5 tickets de soporte relacionados con la migración

---

## Plan de Contingencia

Si algo falla durante la migración:

1. **Rollback inmediato:** Restaurar backup de desarrollo (15 min)
2. **Comunicación:** Notificar a stakeholders del retraso
3. **Análisis:** Identificar causa del fallo
4. **Re-planificación:** Agendar nueva ventana de migración

**Tiempo máximo de downtime en caso de rollback:** 60 minutos

---

## Siguiente Paso

Necesito aprobación para proceder con Opción 1 y programar la ventana de mantenimiento para el próximo fin de semana.

**¿Preguntas o consideraciones adicionales?**
