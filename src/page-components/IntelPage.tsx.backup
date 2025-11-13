import React, { useState } from 'react';
import { BookOpen, Users, AlertCircle, Wrench, Search, X, Maximize2, List, Lock } from 'lucide-react';
import useSEO from '../hooks/useSEO';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

type CategoryType = 'usuario' | 'colaborador' | 'admin';

interface DocItem {
  title: string;
  content: string;
}

interface DocSectionData {
  title: string;
  items: DocItem[];
}

const IntelPage: React.FC = () => {
  useSEO({
    title: 'Centro de Documentación - Autos TREFA',
    description: 'Guías completas para usuarios, colaboradores y administradores de la plataforma TREFA',
  });

  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CategoryType | null>(null);
  const [showIndex, setShowIndex] = useState(false);

  // Documentation data structure
  const usuarioSections: DocSectionData[] = [
    {
      title: '🚀 Primeros Pasos',
      items: [
        {
          title: '¿Cómo crear una cuenta?',
          content: 'Ve a "Acceder" → Ingresa tu email → Recibirás un código de verificación → Completa tu perfil con nombre, teléfono y RFC.',
        },
        {
          title: '¿Cómo buscar un auto?',
          content: 'Usa el buscador en la página principal o ve a "Explorar" para ver todo el inventario. Puedes filtrar por marca, modelo, precio, año, tipo de combustible y más.',
        },
        {
          title: '¿Cómo agendar una cita?',
          content: 'Desde la página del auto que te interesa, haz clic en "Agendar Visita" → Selecciona fecha y hora → Confirma tu cita. Recibirás confirmación por email.',
        },
      ],
    },
    {
      title: '💰 Solicitud de Financiamiento',
      items: [
        {
          title: '¿Cómo solicitar financiamiento?',
          content: 'Ve a "Escritorio" → "Aplicación" → Completa el formulario con tus datos personales, laborales e ingresos → Selecciona el auto de tu interés → Envía tu solicitud.',
        },
        {
          title: '¿Qué documentos necesito?',
          content: 'INE o pasaporte, Comprobante de domicilio (no mayor a 3 meses), Comprobante de ingresos (últimos 3 recibos de nómina o estados de cuenta), RFC, CURP.',
        },
        {
          title: '¿Cómo subir mis documentos?',
          content: 'Ve a "Escritorio" → "Aplicación" → Sección "Documentos" → Haz clic en "Subir documento" → Selecciona el tipo de documento → Arrastra o selecciona el archivo.',
        },
        {
          title: '¿Cuánto tiempo tarda la aprobación?',
          content: 'Una vez que completes tu solicitud y subas todos los documentos, el proceso de revisión toma entre 24-48 horas hábiles. Recibirás notificaciones por email sobre el estado.',
        },
      ],
    },
    {
      title: '📊 Seguimiento de Solicitud',
      items: [
        {
          title: '¿Cómo ver el estado de mi solicitud?',
          content: 'Ve a "Escritorio" → "Seguimiento" → Verás todas tus solicitudes con su estado actual (Borrador, Enviada, En Revisión, Aprobada, Rechazada).',
        },
        {
          title: 'Estados de la solicitud',
          content: 'BORRADOR: Solicitud incompleta. EN_REVISION: Siendo revisada por el equipo. APROBADA: Financiamiento aprobado. RECHAZADA: No cumple requisitos. COMPLETADA: Proceso finalizado.',
        },
      ],
    },
    {
      title: '❤️ Favoritos',
      items: [
        {
          title: '¿Cómo guardar autos favoritos?',
          content: 'En cualquier auto, haz clic en el ícono de corazón ❤️. Podrás ver todos tus favoritos en "Escritorio" → "Favoritos".',
        },
      ],
    },
    {
      title: '⚠️ Problemas Comunes',
      items: [
        {
          title: 'No recibí el código de verificación',
          content: 'Revisa tu carpeta de spam. Si no aparece, espera 2 minutos y solicita un nuevo código. Verifica que el email esté escrito correctamente.',
        },
        {
          title: 'No puedo subir un documento',
          content: 'Verifica que el archivo sea PDF, JPG o PNG y no exceda 10MB. Prueba comprimiendo la imagen o usando un formato diferente.',
        },
        {
          title: 'Mi solicitud aparece como "Borrador"',
          content: 'Significa que falta información. Ve a "Aplicación" y completa todos los campos marcados como requeridos, luego haz clic en "Enviar Solicitud".',
        },
      ],
    },
  ];

  const colaboradorSections: DocSectionData[] = [
    {
      title: '🔐 Acceso al Sistema',
      items: [
        {
          title: '¿Cómo accedo al dashboard de ventas?',
          content: 'Inicia sesión con tu cuenta de colaborador → Ve a "Escritorio" → "Ventas" → "Leads". Solo verás los leads que te han sido asignados.',
        },
        {
          title: '¿Qué es un "Lead Asignado"?',
          content: 'Es un cliente potencial que el administrador te ha asignado para dar seguimiento. Solo podrás ver leads donde tu ID esté en el campo "asesor_asignado_id".',
        },
      ],
    },
    {
      title: '📊 Dashboard de Leads',
      items: [
        {
          title: 'Estadísticas principales',
          content: 'TOTAL DE LEADS: Todos los leads asignados. CON SOLICITUD ACTIVA: Leads que tienen aplicación de financiamiento. SIN CONTACTAR: Leads que aún no has marcado como contactados. NECESITAN SEGUIMIENTO: Leads con recordatorios pendientes.',
        },
        {
          title: '¿Cómo buscar un lead?',
          content: 'Usa el buscador en la parte superior para filtrar por nombre, email o teléfono. También puedes filtrar por estado de contacto o estado de solicitud.',
        },
        {
          title: 'Indicador "Acceso Autorizado"',
          content: 'Verde ✓: Puedes ver el perfil completo del cliente. Rojo ✗: Acceso restringido, solo puedes ver información básica. El cliente debe autorizar el acceso.',
        },
      ],
    },
    {
      title: '👤 Perfil de Cliente',
      items: [
        {
          title: '¿Qué información puedo ver?',
          content: 'Si el acceso está autorizado: Datos personales completos, Historial de aplicaciones, Documentos cargados, Tags/etiquetas, Recordatorios, Sincronización con Kommo CRM.',
        },
        {
          title: '¿Cómo agregar tags a un lead?',
          content: 'En el perfil del cliente → Sección "Tags" → Selecciona tags existentes o crea nuevos → Los tags ayudan a categorizar y filtrar leads.',
        },
        {
          title: '¿Cómo crear un recordatorio?',
          content: 'En el perfil del cliente → Sección "Recordatorios" → Click en "Agregar Recordatorio" → Ingresa el título, descripción y fecha → Guarda.',
        },
        {
          title: '¿Cómo actualizar el estado de una solicitud?',
          content: 'En el perfil del cliente → Historial de Aplicaciones → Haz clic en el estado actual → Selecciona el nuevo estado (En Revisión, Aprobada, Rechazada, etc.).',
        },
      ],
    },
    {
      title: '🔄 Integración con Kommo CRM',
      items: [
        {
          title: '¿Qué es Kommo?',
          content: 'Kommo es el CRM externo donde se gestionan contactos, deals y comunicaciones. La plataforma TREFA se sincroniza automáticamente con Kommo.',
        },
        {
          title: '¿Cómo sincronizar un lead?',
          content: 'En el perfil del cliente → Botón "Sincronizar con Kommo" → Se creará o actualizará el contacto en Kommo con toda la información del lead.',
        },
      ],
    },
    {
      title: '✨ Mejores Prácticas',
      items: [
        {
          title: 'Seguimiento efectivo',
          content: '1. Contacta a los leads nuevos dentro de las primeras 24 horas. 2. Usa tags para categorizar (Caliente, Tibio, Frío). 3. Crea recordatorios para todos los seguimientos. 4. Actualiza el estado de las aplicaciones inmediatamente.',
        },
        {
          title: 'Manejo de objeciones',
          content: 'Si un cliente no autoriza acceso, explica que necesitas ver su información para poder ayudarle mejor con el financiamiento y encontrar el auto ideal.',
        },
      ],
    },
    {
      title: '⚠️ Problemas Comunes',
      items: [
        {
          title: 'No veo ningún lead',
          content: 'Verifica que tu rol sea "sales". Si es correcto, contacta al administrador para que te asigne leads. Solo verás leads donde tu user_id esté en asesor_asignado_id.',
        },
        {
          title: '"Acceso No Autorizado" al ver perfil',
          content: 'El cliente debe autorizar el acceso. El campo "autorizar_asesor_acceso" debe estar en TRUE. Contacta al administrador si necesitas acceso urgente.',
        },
        {
          title: 'Error al sincronizar con Kommo',
          content: 'Verifica tu conexión a internet. Si el error persiste, contacta al administrador para revisar la configuración de la API de Kommo.',
        },
      ],
    },
  ];

  const adminSections: DocSectionData[] = [
    {
      title: '🚀 Guía de Inicio Rápido',
      items: [
        {
          title: '¿Qué es TREFA?',
          content: 'TREFA es una plataforma de comercio electrónico de vehículos seminuevos que integra:\n• Frontend React + TypeScript (Vite)\n• Backend Supabase (PostgreSQL + Edge Functions)\n• Sincronización con Airtable para inventario\n• Integración CRM con Kommo\n• Storage de imágenes en Cloudflare R2\n• Deployment en Google Cloud Run',
        },
        {
          title: 'Stack Tecnológico',
          content: 'FRONTEND:\n• React 18 con TypeScript\n• Vite como build tool\n• TailwindCSS para estilos\n• React Router v6 para rutas\n• Zustand para state management\n\nBACKEND:\n• Supabase (PostgreSQL + Auth + Storage)\n• Edge Functions (Deno runtime)\n• Row Level Security (RLS) para permisos\n\nINFRAESTRUCTURA:\n• Google Cloud Run (containers)\n• Cloudflare R2 (almacenamiento de imágenes)\n• Airtable (gestión de inventario)\n• Kommo CRM (gestión de leads)',
        },
        {
          title: 'Arquitectura del Sistema',
          content: 'FLUJO DE DATOS:\n1. Usuario accede a trefa.mx (Cloud Run)\n2. Frontend se autentica con Supabase Auth\n3. Consultas a BD protegidas por RLS\n4. Edge Functions procesan lógica de negocio\n5. Sincronización automática con Airtable cada hora\n6. Imágenes servidas desde Cloudflare R2\n\nCOMPONENTES CLAVE:\n• /src/pages: Páginas de la aplicación\n• /src/components: Componentes reutilizables\n• /src/context: Context API (Auth, Vehicles, etc.)\n• /supabase/migrations: Migraciones de BD\n• /supabase/functions: Edge Functions',
        },
      ],
    },
    {
      title: '⚙️ Configuración del Entorno de Desarrollo',
      items: [
        {
          title: 'Requisitos Previos',
          content: 'HERRAMIENTAS NECESARIAS:\n• Node.js v18+ y npm/yarn\n• Docker Desktop (para builds locales)\n• Git (control de versiones)\n• Supabase CLI\n• Google Cloud SDK (gcloud)\n• Editor de código (VS Code recomendado)\n\nINSTALACIÓN:\n# Node.js\nbrew install node\n\n# Supabase CLI\nbrew install supabase/tap/supabase\n\n# Google Cloud SDK\nbrew install --cask google-cloud-sdk\n\n# Docker Desktop\nbrew install --cask docker',
        },
        {
          title: 'Clonar y Configurar el Proyecto',
          content: 'PASO 1 - CLONAR REPOSITORIO:\ngit clone <repository-url>\ncd ultima\n\nPASO 2 - INSTALAR DEPENDENCIAS:\nnpm install\n\nPASO 3 - CONFIGURAR VARIABLES DE ENTORNO:\nCopiar .env.example a .env y llenar:\n\n# Supabase\nVITE_SUPABASE_URL=https://jjepfehmuybpctdzipnu.supabase.co\nVITE_SUPABASE_ANON_KEY=<tu-anon-key>\n\n# Airtable\nVITE_AIRTABLE_VALUATION_API_KEY=<key>\nVITE_AIRTABLE_VALUATION_BASE_ID=<base-id>\n\n# Cloudflare R2\nVITE_CLOUDFLARE_R2_PUBLIC_URL=<url>\n\nPASO 4 - INICIAR DESARROLLO:\nnpm run dev\n\nEl servidor estará disponible en http://localhost:5173',
        },
        {
          title: 'Conectar con Supabase Local',
          content: 'OPCIÓN 1 - USAR SUPABASE EN LA NUBE (Recomendado):\nYa está configurado si tienes las credenciales en .env\n\nOPCIÓN 2 - SUPABASE LOCAL:\n# Iniciar Supabase local\nsupabase start\n\n# Ver credenciales\nsupabase status\n\n# Aplicar migraciones\nsupabase db push\n\n# Detener\nsupabase stop\n\nNOTA: Local usa Docker y requiere ~2GB de RAM',
        },
        {
          title: 'Estructura de Carpetas del Proyecto',
          content: 'ROOT:\n├── src/\n│   ├── components/      # Componentes React\n│   ├── pages/           # Páginas de rutas\n│   ├── context/         # Context providers\n│   ├── hooks/           # Custom hooks\n│   ├── services/        # Lógica de negocio\n│   ├── types/           # TypeScript types\n│   └── utils/           # Utilidades\n├── supabase/\n│   ├── functions/       # Edge Functions\n│   └── migrations/      # Migraciones SQL\n├── scripts/             # Scripts de automatización\n├── deploy.sh            # Script de deployment\n├── Dockerfile           # Configuración Docker\n└── package.json         # Dependencias npm',
        },
      ],
    },
    {
      title: '📋 CRM Simplificado',
      items: [
        {
          title: 'Acceso al CRM',
          content: 'Solo usuarios con role = "admin" tienen acceso. Ruta: /escritorio/admin/crm',
        },
        {
          title: 'Funciones principales',
          content: 'Ver todos los clientes y sus solicitudes. Asignar leads a asesores de ventas. Autorizar/denegar acceso de asesores a perfiles. Gestionar estados de aplicaciones. Exportar reportes.',
        },
        {
          title: '¿Cómo asignar un lead a un asesor?',
          content: 'En el CRM → Selecciona el cliente → Campo "Asesor Asignado" → Elige el asesor → Guarda. Luego activa "Autorizar Acceso de Asesor" si quieres que vea el perfil completo.',
        },
      ],
    },
    {
      title: '👥 Gestión de Usuarios y Permisos',
      items: [
        {
          title: 'Roles disponibles',
          content: 'USER: Cliente normal (acceso solo a su dashboard). SALES: Asesor de ventas (acceso a leads asignados). ADMIN: Administrador (acceso total a todas las funcionalidades).',
        },
        {
          title: '¿Cómo agregar un nuevo usuario administrador?',
          content: 'OPCIÓN 1 - DESDE LA UI (Recomendado):\n1. Ir a /escritorio/admin/usuarios\n2. Buscar el usuario por email\n3. Cambiar role a "admin"\n4. Guardar cambios\n\nOPCIÓN 2 - DESDE SUPABASE DASHBOARD:\n1. Ir a Dashboard → Authentication → Users\n2. Buscar el usuario\n3. Editar el campo "role" en la tabla profiles\n4. Actualizar: UPDATE profiles SET role = \'admin\' WHERE email = \'usuario@email.com\';',
        },
        {
          title: '¿Cómo agregar un asesor de ventas?',
          content: 'PASO 1 - CREAR CUENTA:\nEl usuario debe registrarse normalmente en /acceder\n\nPASO 2 - ASIGNAR ROL SALES:\n1. Admin → Usuarios\n2. Buscar el usuario\n3. Cambiar role a "sales"\n4. Opcional: Agregar "advisor_name" para identificación\n\nPASO 3 - ASIGNAR LEADS:\n1. Ir a Admin → CRM\n2. Seleccionar cliente\n3. Campo "Asesor Asignado" → Elegir el sales\n4. Activar "Autorizar Acceso" para que vea información completa',
        },
        {
          title: 'Seguridad de roles y RLS',
          content: 'Row Level Security (RLS) protege todos los datos:\n\nPOLÍTICAS CLAVE:\n• profiles: Users ven solo su perfil, Admin/Sales ven todos\n• financing_applications: Users ven sus solicitudes, Sales ven asignadas, Admin ve todas\n• uploaded_documents: Solo propietario y Admin tienen acceso\n\nFUNCIONES DE SEGURIDAD:\n• get_my_role(): Obtiene rol del usuario autenticado\n• get_secure_client_profile(user_id): Verifica permisos antes de retornar perfil\n• verify_sales_access_to_lead(lead_id): Verifica si Sales tiene acceso al lead\n\nVERIFICAR POLÍTICAS RLS:\n# Ver políticas activas\nSELECT schemaname, tablename, policyname, permissive, roles, cmd, qual \nFROM pg_policies \nWHERE schemaname = \'public\';',
        },
        {
          title: 'Permisos especiales para Admin',
          content: 'Los administradores están hardcodeados en algunas políticas por email:\n\nEMAILS ADMIN (en código):\n• moralesm04@gmail.com\n• autostrefa@gmail.com\n\nPARA AGREGAR NUEVO ADMIN EMAIL:\n1. Editar migración: 20251105000012_add_new_admin_emails.sql\n2. Agregar email a la política RLS\n3. Aplicar migración: supabase db push\n\nNOTA: Esto se usa como fallback. El role="admin" en profiles es el método principal.',
        },
      ],
    },
    {
      title: '🗄️ Base de Datos y Migraciones',
      items: [
        {
          title: 'Tablas principales del esquema',
          content: 'USUARIOS Y AUTENTICACIÓN:\n• profiles: Datos de usuario (role, phone, rfc, etc.)\n• auth.users: Tabla de Supabase Auth (email, password hash)\n\nAPLICACIONES Y LEADS:\n• financing_applications: Solicitudes de crédito\n• uploaded_documents: Documentos PDF/imágenes de clientes\n• lead_tags: Etiquetas para clasificar leads\n• lead_reminders: Recordatorios de seguimiento\n• banking_profiles: Perfilación bancaria\n\nINVENTARIO:\n• inventario_cache: Vehículos sincronizados desde Airtable\n• vehicle_visits: Registro de citas agendadas\n\nMARKETING:\n• landing_pages: Páginas de aterrizaje dinámicas\n• marketing_utm_tracking: Seguimiento de campañas\n• page_analytics: Analytics de páginas\n\nOTRAS:\n• sync_logs: Logs de sincronización Airtable\n• oauth_tokens: Tokens de OAuth (Kommo)\n• roadmap_items: Roadmap público de producto',
        },
        {
          title: 'Cómo crear y aplicar migraciones',
          content: 'CREAR NUEVA MIGRACIÓN:\n# Generar archivo de migración\nsupabase migration new nombre_descriptivo\n\n# Se creará: supabase/migrations/YYYYMMDDHHMMSS_nombre_descriptivo.sql\n\nEDITAR MIGRACIÓN:\n1. Abrir el archivo .sql creado\n2. Escribir SQL DDL (CREATE, ALTER, DROP, etc.)\n3. Ejemplo:\nCREATE TABLE IF NOT EXISTS nueva_tabla (\n  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),\n  nombre TEXT NOT NULL,\n  created_at TIMESTAMPTZ DEFAULT NOW()\n);\n\nAPLICAR MIGRACIÓN:\n# Aplicar todas las migraciones pendientes\nsupabase db push\n\n# O aplicar manualmente desde script\n./scripts/apply-migration.sh supabase/migrations/archivo.sql',
        },
        {
          title: 'Migraciones críticas del sistema',
          content: 'HISTORIAL DE MIGRACIONES IMPORTANTES:\n\n20251105000004_fix_function_role_based_auth.sql\n→ Corrige autenticación basada en roles para Admin\n\n20251105000005_fix_sales_functions_table_names.sql\n→ Corrige nombres de tablas en funciones de Sales\n\n20251105000006_fix_infinite_recursion_in_profiles_rls.sql\n→ Elimina recursión infinita en políticas RLS\n\n20251105000013_allow_sales_update_contactado.sql\n→ Permite a Sales actualizar campo contactado\n\n20251107000002_create_kommo_webhook_tables.sql\n→ Crea tablas para webhooks de Kommo CRM\n\n20251110000003_create_detailed_application_analytics.sql\n→ Crea vistas de analytics de aplicaciones',
        },
        {
          title: 'Funciones RPC (Remote Procedure Calls)',
          content: 'FUNCIONES DE AUTENTICACIÓN:\n• get_my_role(): Retorna role del usuario actual\n• get_secure_client_profile(user_id): Perfil con verificación de permisos\n\nFUNCIONES DE SALES:\n• get_sales_assigned_leads(sales_user_id): Leads asignados a asesor\n• verify_sales_access_to_lead(lead_id): Verifica acceso de Sales a lead\n\nFUNCIONES DE ADMIN:\n• get_leads_for_dashboard(filters): Obtiene leads con filtros para CRM\n• get_user_management_stats(): Estadísticas de usuarios\n\nFUNCIONES DE INVENTARIO:\n• get_filter_options(): Opciones de filtros para búsqueda\n• increment_view_count(vehicle_id): Incrementa contador de vistas\n\nUSO DESDE FRONTEND:\nconst { data, error } = await supabase\n  .rpc(\'get_my_role\')\n\nconst { data: leads } = await supabase\n  .rpc(\'get_sales_assigned_leads\', { sales_user_id: userId })',
        },
        {
          title: 'Cómo hacer query directo a la BD',
          content: 'DESDE SUPABASE DASHBOARD:\n1. Ir a Dashboard → SQL Editor\n2. Escribir query SQL\n3. Ejecutar con Run\n\nDESDE CLI (PSQL):\n# Obtener connection string\nsupabase db remote commit\n\n# Conectar con psql\nPGPASSWORD="tu-password" psql -h db.jjepfehmuybpctdzipnu.supabase.co -U postgres -d postgres\n\n# Ejecutar queries\nSELECT * FROM profiles WHERE role = \'admin\';\n\nDESDE CÓDIGO (TypeScript):\nconst { data, error } = await supabase\n  .from(\'profiles\')\n  .select(\'*\')\n  .eq(\'role\', \'admin\')',
        },
        {
          title: 'Respaldos y restauración',
          content: 'RESPALDOS AUTOMÁTICOS:\nSupabase hace respaldos automáticos diarios.\n• Plan gratuito: 7 días de retención\n• Plan Pro: 30 días de retención\n\nRESTAURAR DESDE DASHBOARD:\n1. Dashboard → Database → Backups\n2. Seleccionar respaldo\n3. Click en "Restore"\n⚠️ ADVERTENCIA: Sobrescribe la BD actual\n\nRESPALDO MANUAL:\n# Exportar BD completa\nsupabase db dump -f backup_$(date +%Y%m%d).sql\n\n# Exportar solo estructura\nsupabase db dump --schema-only -f schema.sql\n\n# Exportar solo datos\nsupabase db dump --data-only -f data.sql\n\nRESTAURAR RESPALDO MANUAL:\nsupabase db reset --db-url "postgres://user:pass@host/db" < backup.sql',
        },
      ],
    },
    {
      title: '🔄 Sincronización con Airtable',
      items: [
        {
          title: '¿Cómo funciona la sincronización?',
          content: 'El inventario de vehículos se gestiona en Airtable y se sincroniza automáticamente:\n\n1. AIRTABLE (Source of Truth)\n   → Base: "TREFA - Autos"\n   → Tabla: "Inventario"\n   → Campos: Marca, Modelo, Año, Precio, Status, etc.\n\n2. EDGE FUNCTION (airtable-sync)\n   → Se ejecuta cada hora vía pg_cron\n   → Descarga registros de Airtable\n   → Transforma y valida datos\n   → Inserta/actualiza en inventario_cache\n\n3. SUPABASE (BD Local)\n   → Tabla: inventario_cache\n   → Usada por frontend para búsquedas\n   → Indexada para performance',
        },
        {
          title: 'Configurar API Key de Airtable',
          content: 'PASO 1 - OBTENER API KEY:\n1. Ir a https://airtable.com/account\n2. Generate API Key\n3. Copiar el token\n\nPASO 2 - CONFIGURAR EN SUPABASE:\n# Opción A: Desde Dashboard\n1. Dashboard → Edge Functions → Secrets\n2. Agregar: AIRTABLE_API_KEY = <tu-key>\n\n# Opción B: Desde CLI\nsupabase secrets set AIRTABLE_API_KEY=<tu-key>\n\nPASO 3 - VERIFICAR EN UI:\n1. Ir a /escritorio/admin/airtable\n2. Ver último sync exitoso\n3. Forzar sync manual si es necesario',
        },
        {
          title: 'Ejecutar sincronización manual',
          content: 'DESDE LA UI:\n1. Admin → Airtable Config\n2. Click en "Forzar Sincronización"\n3. Esperar confirmación\n\nDESDE CLI:\n# Invocar Edge Function directamente\nsupabase functions invoke airtable-sync\n\n# O con curl\ncurl -X POST https://jjepfehmuybpctdzipnu.supabase.co/functions/v1/airtable-sync \\\n  -H "Authorization: Bearer <anon-key>"\n\nVERIFICAR RESULTADO:\n# Ver logs\nsupabase functions logs airtable-sync --tail\n\n# Contar registros sincronizados\nSELECT COUNT(*) FROM inventario_cache;',
        },
        {
          title: 'Monitorear sincronizaciones',
          content: 'TABLA DE LOGS:\n• sync_logs: Registra cada sync (success/error, timestamp, detalles)\n\nQUERY DE MONITOREO:\nSELECT \n  sync_type,\n  status,\n  records_synced,\n  error_message,\n  created_at\nFROM sync_logs\nORDER BY created_at DESC\nLIMIT 10;\n\nALERTAS:\n• Si no hay sync en 2+ horas → Revisar pg_cron\n• Si sync falla 3+ veces → Revisar API key\n• Si records_synced = 0 → Verificar Airtable',
        },
        {
          title: 'Troubleshooting de sincronización',
          content: 'ERROR: "Invalid API Key"\n→ Verificar AIRTABLE_API_KEY en secrets\n→ Regenerar key en Airtable si es necesario\n\nERROR: "Rate limit exceeded"\n→ Airtable limita 5 requests/segundo\n→ Esperar y reintentar\n\nERROR: "Table not found"\n→ Verificar AIRTABLE_BASE_ID y TABLE_ID\n→ Revisar permisos de la base\n\nSYNC EXITOSO PERO DATOS NO APARECEN:\n→ Limpiar cache del navegador\n→ Verificar filtros de búsqueda\n→ Query directo: SELECT * FROM inventario_cache LIMIT 10;\n\nREINICIAR SINCRONIZACIÓN:\n# Limpiar tabla\nTRUNCATE inventario_cache;\n\n# Forzar sync completo\nsupabase functions invoke airtable-sync',
        },
      ],
    },
    {
      title: '🚀 Deployment a Producción y Staging',
      items: [
        {
          title: 'Flujo de deployment recomendado',
          content: 'PASO 1 - DESARROLLO LOCAL:\n• Desarrollar feature en rama local\n• Probar localmente: npm run dev\n• Commit changes: git add . && git commit -m "feat: descripción"\n\nPASO 2 - STAGING:\n• Merge a rama staging (si existe) o main\n• Deploy a staging: ./deploy.sh staging\n• Probar en staging URL\n• Verificar funcionalidad completa\n\nPASO 3 - PRODUCCIÓN:\n• Merge a main (si es necesario)\n• Deploy a producción: ./deploy.sh production\n• Verificar en https://trefa.mx\n• Monitorear logs por 5-10 minutos\n\n⚠️ NUNCA saltar staging en cambios importantes',
        },
        {
          title: 'Deploy a Staging',
          content: 'COMANDO:\n./deploy.sh staging\n\nLO QUE HACE:\n1. Verifica seguridad de Git (uncommitted changes, sync, etc.)\n2. Lee variables de cloud-build-vars.yaml\n3. Construye imagen Docker con tag "staging"\n4. Push a Artifact Registry\n5. Deploys a Cloud Run service "app-staging"\n6. Configura env vars específicas de staging\n\nVERIFICAR DEPLOYMENT:\n# Health check\ncurl <staging-url>/healthz\n\n# Ver logs\ngcloud run logs tail app-staging --region=us-central1\n\n# Ver service info\ngcloud run services describe app-staging --region=us-central1',
        },
        {
          title: 'Deploy a Producción',
          content: 'COMANDO:\n./deploy.sh production\n\nPRECAUCIONES:\n⚠️ SIEMPRE hacer backup antes de deploy a producción\n⚠️ Script pide confirmación explícita\n⚠️ Ejecuta backup automático de BD si existe script\n\nLO QUE HACE:\n1. Git safety check\n2. Backup de base de datos (si ./scripts/backup-database.sh existe)\n3. Pide confirmación manual\n4. Build Docker image con tag "production"\n5. Push a Artifact Registry\n6. Deploy a Cloud Run service "app"\n7. Configura FRONTEND_URL=https://trefa.mx\n\nPOST-DEPLOYMENT:\n• Limpiar cache del navegador (Cmd+Shift+Delete)\n• Probar en modo incógnito\n• Hard refresh (Cmd+Shift+R) si necesario\n• Monitorear logs: gcloud run logs tail app --region=us-central1',
        },
        {
          title: 'Configuración de variables de entorno',
          content: 'ARCHIVO: cloud-build-vars.yaml\n\nVARIABLES PRINCIPALES:\n• VITE_SUPABASE_URL: URL de Supabase\n• VITE_SUPABASE_ANON_KEY: Public anon key\n• VITE_IMAGE_CDN_URL: Cloudflare R2 URL\n• VITE_AIRTABLE_*: Credenciales Airtable\n• VITE_INTELIMOTOR_*: API Intelimotor\n• FRONTEND_URL: URL del frontend (auto-configurado)\n\nEDITAR VARIABLES:\n1. Editar cloud-build-vars.yaml\n2. Format: KEY: "value"\n3. Re-deploy para aplicar cambios\n\nVARIABLES EN RUNTIME:\nAlgunas variables se configuran en Cloud Run, no en build time.\nPara actualizar:\ngcloud run services update app \\\n  --region=us-central1 \\\n  --update-env-vars="KEY=value"',
        },
        {
          title: 'Rollback de deployment',
          content: 'OPCIÓN 1 - ROLLBACK A VERSIÓN ANTERIOR:\n# Listar revisiones\ngcloud run revisions list --service=app --region=us-central1\n\n# Rollback a revisión específica\ngcloud run services update-traffic app \\\n  --region=us-central1 \\\n  --to-revisions=app-00042-abc=100\n\nOPCIÓN 2 - RE-DEPLOY DESDE COMMIT ANTERIOR:\n# Checkout a commit anterior\ngit checkout <commit-hash>\n\n# Deploy\n./deploy.sh production\n\n# Volver a HEAD\ngit checkout main\n\nOPCIÓN 3 - RESTAURAR BD:\n# Si el deploy causó problemas de BD\n1. Dashboard → Database → Backups\n2. Restore al backup pre-deployment',
        },
        {
          title: 'Monitoreo post-deployment',
          content: 'LOGS EN TIEMPO REAL:\n# Ver logs streaming\ngcloud run logs tail app --region=us-central1\n\n# Filtrar por errores\ngcloud run logs read app --region=us-central1 --filter="severity>=ERROR"\n\nMÉTRICAS:\n1. Cloud Console → Cloud Run → app\n2. Ver métricas de:\n   • Request count\n   • Request latency\n   • Error rate\n   • Container CPU/Memory\n\nALERTAS A MONITOREAR:\n• Error rate > 5%\n• P99 latency > 3s\n• Memory usage > 80%\n• 5xx errors',
        },
      ],
    },
    {
      title: '⚡ Edge Functions (Supabase)',
      items: [
        {
          title: '¿Qué son las Edge Functions?',
          content: 'Funciones serverless que corren en Deno runtime, distribuidas globalmente.\n\nUSOS COMUNES:\n• airtable-sync: Sincronización de inventario\n• r2-upload: Upload de imágenes a Cloudflare R2\n• kommo-webhook: Webhooks de Kommo CRM\n• automated-email-notifications: Emails automáticos\n• rapid-processor: Procesamiento rápido de datos\n\nVENTAJAS:\n• Execución cercana al usuario (edge)\n• Escala automáticamente\n• TypeScript/JavaScript nativo\n• Acceso directo a Supabase',
        },
        {
          title: 'Crear nueva Edge Function',
          content: 'PASO 1 - CREAR FUNCIÓN:\n# Crear estructura\nsupabase functions new mi-funcion\n\n# Se crea: supabase/functions/mi-funcion/index.ts\n\nPASO 2 - ESCRIBIR CÓDIGO:\n// supabase/functions/mi-funcion/index.ts\nimport { serve } from "https://deno.land/std@0.168.0/http/server.ts"\n\nserve(async (req) => {\n  const { name } = await req.json()\n  \n  return new Response(\n    JSON.stringify({ message: `Hello ${name}!` }),\n    { headers: { "Content-Type": "application/json" } },\n  )\n})\n\nPASO 3 - PROBAR LOCALMENTE:\nsupabase functions serve mi-funcion\n\n# Invocar\ncurl -X POST http://localhost:54321/functions/v1/mi-funcion \\\n  -H "Content-Type: application/json" \\\n  -d \'{"name":"TREFA"}\'',
        },
        {
          title: 'Deploy de Edge Function',
          content: 'DEPLOY INDIVIDUAL:\nsupabase functions deploy mi-funcion\n\nDEPLOY TODAS LAS FUNCIONES:\nsupabase functions deploy\n\nDEPLOY CON SECRETS:\n# Configurar secrets primero\nsupabase secrets set API_KEY=valor\n\n# Luego deploy\nsupabase functions deploy mi-funcion\n\nVERIFICAR DEPLOYMENT:\n# Listar funciones\nsupabase functions list\n\n# Ver detalles\nsupabase functions describe mi-funcion\n\n# Invocar en producción\nsupabase functions invoke mi-funcion --body \'{"test":true}\'',
        },
        {
          title: 'Configurar Secrets',
          content: 'AGREGAR SECRET:\n# Desde CLI\nsupabase secrets set SECRET_NAME=value\n\n# Múltiples secrets\nsupabase secrets set \\\n  API_KEY=key123 \\\n  DATABASE_URL=postgres://...\n\nVER SECRETS:\nsupabase secrets list\n\nELIMINAR SECRET:\nsupabase secrets unset SECRET_NAME\n\nUSAR EN CÓDIGO:\nconst apiKey = Deno.env.get("API_KEY")\nif (!apiKey) {\n  return new Response("Missing API_KEY", { status: 500 })\n}',
        },
        {
          title: 'Debugging y Logs',
          content: 'VER LOGS EN TIEMPO REAL:\nsupabase functions logs mi-funcion --tail\n\n# Filtrar por errores\nsupabase functions logs mi-funcion | grep "ERROR"\n\nVER LOGS RECIENTES:\nsupabase functions logs mi-funcion --limit 100\n\nDEBUG LOCAL:\n1. Agregar console.log() en código\n2. Run: supabase functions serve mi-funcion\n3. Invocar función\n4. Ver output en terminal\n\nDEBUG EN PRODUCCIÓN:\n1. Deploy con console.log()\n2. Invocar función\n3. Ver logs: supabase functions logs mi-funcion',
        },
        {
          title: 'Edge Functions críticas de TREFA',
          content: 'airtable-sync\n→ Sincroniza inventario cada hora\n→ Secrets: AIRTABLE_API_KEY, AIRTABLE_BASE_ID\n→ Invoca: pg_cron job\n\nr2-upload\n→ Sube imágenes a Cloudflare R2\n→ Secrets: R2_ACCOUNT_ID, R2_ACCESS_KEY, R2_SECRET_KEY\n→ Invoca: Frontend desde /escritorio/admin/r2-images\n\nkommo-webhook\n→ Recibe webhooks de Kommo CRM\n→ Secrets: KOMMO_WEBHOOK_SECRET\n→ Invoca: Kommo automáticamente\n\nautomated-email-notifications\n→ Envía emails automáticos (bienvenida, recordatorios)\n→ Secrets: BREVO_API_KEY\n→ Invoca: Database triggers\n\nrapid-processor\n→ Procesamiento rápido de datos de vehículos\n→ Invoca: Frontend y otros services',
        },
      ],
    },
    {
      title: '🌿 Git Workflow y Control de Versiones',
      items: [
        {
          title: 'Estructura de Branches',
          content: 'BRANCH PRINCIPAL:\n• main: Branch de producción, siempre deployable\n\nBRANCHES DE DESARROLLO:\n• feature/nombre-feature: Nuevas funcionalidades\n• fix/nombre-bug: Correcciones de bugs\n• hotfix/nombre-urgente: Fixes urgentes para producción\n\nFLUJO:\n1. Crear branch desde main: git checkout -b feature/mi-feature\n2. Desarrollar y commit: git add . && git commit -m "feat: descripción"\n3. Push: git push origin feature/mi-feature\n4. Merge a main cuando esté listo\n5. Deploy a staging primero, luego producción',
        },
        {
          title: 'Convenciones de Commits',
          content: 'FORMATO:\n<tipo>: <descripción corta>\n\n<cuerpo opcional con más detalles>\n\nTIPOS:\n• feat: Nueva funcionalidad\n• fix: Corrección de bug\n• refactor: Refactorización de código\n• docs: Cambios en documentación\n• style: Cambios de formato (no afectan lógica)\n• test: Agregar o modificar tests\n• chore: Tareas de mantenimiento\n\nEJEMPLOS:\ngit commit -m "feat: Add user role management UI"\ngit commit -m "fix: Resolve infinite recursion in RLS policies"\ngit commit -m "refactor: Simplify authentication context"',
        },
        {
          title: 'Comandos Git esenciales',
          content: 'VER ESTADO:\ngit status              # Ver cambios\ngit log --oneline -10   # Ver últimos 10 commits\ngit diff                # Ver cambios sin commit\n\nRAMAS:\ngit branch              # Listar branches\ngit checkout -b nueva   # Crear y cambiar a branch\ngit branch -d vieja     # Eliminar branch local\n\nSINCRONIZAR:\ngit pull origin main    # Traer cambios de main\ngit push origin feature # Push de branch\n\nCORRECCIONES:\ngit reset --soft HEAD~1 # Deshacer último commit (mantiene cambios)\ngit reset --hard HEAD~1 # Deshacer último commit (elimina cambios)\ngit stash              # Guardar cambios temporalmente\ngit stash pop          # Recuperar cambios guardados',
        },
        {
          title: 'Resolver conflictos de merge',
          content: 'CUANDO OCURRE:\n• Al hacer git pull con cambios locales\n• Al hacer merge de branches\n\nPASOS:\n1. Git marca archivos con conflictos\n2. Abrir archivos y buscar:\n   <<<<<<< HEAD\n   tu código\n   =======\n   código entrante\n   >>>>>>> branch-name\n\n3. Editar para resolver conflicto\n4. Eliminar marcadores (<<<<, ====, >>>>)\n5. git add archivo-resuelto\n6. git commit -m "Resolve merge conflicts"\n\nABORTAR MERGE:\ngit merge --abort       # Cancelar merge en progreso',
        },
        {
          title: 'Trabajar con remoto',
          content: 'VER REMOTES:\ngit remote -v\n\nAGREGAR REMOTE:\ngit remote add origin <url>\n\nCAMBIAR URL:\ngit remote set-url origin <nueva-url>\n\nFETCH VS PULL:\ngit fetch origin        # Descarga cambios sin merge\ngit pull origin main    # Fetch + merge automático\n\nPUSH FORCE (CUIDADO):\ngit push --force-with-lease origin feature\n⚠️ Solo usar en branches personales, NUNCA en main',
        },
        {
          title: 'Tags y Releases',
          content: 'CREAR TAG:\n# Tag ligero\ngit tag v1.2.0\n\n# Tag anotado (recomendado)\ngit tag -a v1.2.0 -m "Release 1.2.0: Nueva funcionalidad X"\n\nPUSH TAGS:\ngit push origin v1.2.0      # Push tag específico\ngit push origin --tags      # Push todos los tags\n\nLISTAR TAGS:\ngit tag -l\n\nCHECKOUT A TAG:\ngit checkout v1.2.0\n\nELIMINAR TAG:\ngit tag -d v1.2.0              # Local\ngit push origin :refs/tags/v1.2.0  # Remoto',
        },
      ],
    },
    {
      title: '🆘 Troubleshooting y Solución de Problemas',
      items: [
        {
          title: 'Admin sin acceso al CRM',
          content: 'SÍNTOMA:\nUsuario con role="admin" no puede acceder a /escritorio/admin/crm\n\nCAUSA:\n• Función get_secure_client_profile verifica role incorrectamente\n• Política RLS bloqueando acceso\n• JWT token no actualizado\n\nSOLUCIÓN:\n1. Verificar role en BD:\n   SELECT id, email, role FROM profiles WHERE email = \'tu@email.com\';\n\n2. Verificar función:\n   SELECT get_my_role();\n\n3. Aplicar migración:\n   ./scripts/apply-migration.sh supabase/migrations/20251105000004_fix_function_role_based_auth.sql\n\n4. Cerrar sesión y volver a entrar (refresh JWT)\n\n5. Verificar que email esté en lista de admins hardcodeados',
        },
        {
          title: 'Sales no ve sus leads asignados',
          content: 'SÍNTOMA:\nAsesor de ventas con role="sales" ve dashboard vacío\n\nCAUSA:\n• asesor_asignado_id no configurado en profiles\n• Función get_sales_assigned_leads consultando tabla incorrecta\n• Lead no tiene autorizar_asesor_acceso=true\n\nSOLUCIÓN:\n1. Verificar asignación:\n   SELECT id, email, asesor_asignado_id \n   FROM profiles \n   WHERE id = \'<sales-user-id>\';\n\n2. Verificar leads asignados:\n   SELECT id, email, asesor_asignado_id, autorizar_asesor_acceso\n   FROM profiles\n   WHERE asesor_asignado_id = \'<sales-user-id>\';\n\n3. Aplicar migración:\n   ./scripts/apply-migration.sh supabase/migrations/20251105000005_fix_sales_functions_table_names.sql\n\n4. Asignar lead desde Admin → CRM\n\n5. Activar "Autorizar Acceso de Asesor"',
        },
        {
          title: 'Error "infinite recursion in policy"',
          content: 'SÍNTOMA:\nError al consultar tabla profiles o financing_applications\n\nCAUSA:\nPolítica RLS consulta la misma tabla que está protegiendo, causando loop infinito\n\nSOLUCIÓN:\n1. Identificar política problemática:\n   SELECT * FROM pg_policies WHERE tablename = \'profiles\';\n\n2. Aplicar migración que usa funciones SECURITY DEFINER:\n   ./scripts/apply-migration.sh supabase/migrations/20251105000006_fix_infinite_recursion_in_profiles_rls.sql\n\n3. Verificar que funciones usan SECURITY DEFINER:\n   SELECT proname, prosecdef \n   FROM pg_proc \n   WHERE proname LIKE \'get_%\';\n\n4. Reintentar operación',
        },
        {
          title: 'Sincronización Airtable falla',
          content: 'SÍNTOMA:\nInventario no se actualiza, sync_logs muestra errores\n\nDIAGNÓSTICO:\n1. Verificar API key:\n   supabase secrets list | grep AIRTABLE\n\n2. Ver logs:\n   supabase functions logs airtable-sync --limit 50\n\n3. Ver última sincronización:\n   SELECT * FROM sync_logs ORDER BY created_at DESC LIMIT 5;\n\nSOLUCIONES COMUNES:\n\nERROR: "Invalid API Key"\n→ supabase secrets set AIRTABLE_API_KEY=<nueva-key>\n→ supabase functions deploy airtable-sync\n\nERROR: "Rate limit exceeded"\n→ Esperar 60 segundos\n→ Reintentar sync\n\nERROR: "Network timeout"\n→ Verificar conectividad de Supabase\n→ Revisar status.airtable.com\n\nERROR: "Table not found"\n→ Verificar AIRTABLE_BASE_ID\n→ Verificar permisos de base en Airtable\n\nFORZAR SYNC COMPLETO:\nTRUNCATE inventario_cache;\nsupabase functions invoke airtable-sync;',
        },
        {
          title: 'Deploy falla en build de Docker',
          content: 'SÍNTOMA:\n./deploy.sh production falla en paso de build\n\nCAUSAS COMUNES:\n\n1. VARIABLES DE ENTORNO FALTANTES:\n→ Verificar cloud-build-vars.yaml\n→ Asegurar que todas las VITE_* están definidas\n\n2. DEPENDENCIAS NPM ROTAS:\n→ Eliminar node_modules/\n→ rm package-lock.json\n→ npm install\n→ npm run build (probar local)\n\n3. ERRORES DE TYPESCRIPT:\n→ npm run build (ver errores)\n→ Corregir errores de tipos\n→ Commit y reintentar\n\n4. MEMORIA INSUFICIENTE:\n→ Aumentar memoria de Docker Desktop\n→ Preferences → Resources → Memory: 4GB+\n\n5. DOCKER DAEMON NO CORRIENDO:\n→ Abrir Docker Desktop\n→ Esperar a que inicie\n→ Reintentar deploy',
        },
        {
          title: 'Sitio en producción muestra página en blanco',
          content: 'SÍNTOMA:\nhttps://trefa.mx carga pero muestra pantalla blanca\n\nDIAGNÓSTICO:\n1. Abrir DevTools Console (F12)\n2. Ver errores en rojo\n\nSOLUCIONES:\n\nERROR: "Failed to fetch"\n→ Problema de CORS o API\n→ Verificar VITE_SUPABASE_URL\n→ Verificar conectividad a Supabase\n\nERROR: "Unexpected token <"\n→ Build incorrecto, sirviendo HTML en lugar de JS\n→ Re-build y re-deploy\n→ Limpiar cache: Cmd+Shift+Delete\n\nERROR: "Cannot read property of undefined"\n→ Problema en código JavaScript\n→ Ver stack trace\n→ Fix y re-deploy\n\nERROR: Ningún error en consola\n→ Problema de routing\n→ Verificar que todas las rutas están correctas\n→ Hard refresh: Cmd+Shift+R\n\nSi persiste:\n1. Rollback a versión anterior\n2. Investigar cambios recientes\n3. Probar en staging primero',
        },
        {
          title: 'Edge Function timeout',
          content: 'SÍNTOMA:\nEdge Function tarda >60s y retorna timeout\n\nCAUSA:\nSupabase Edge Functions tienen timeout de 60 segundos\n\nSOLUCIONES:\n\n1. OPTIMIZAR QUERIES:\n→ Agregar índices a tablas\n→ Limitar resultados con LIMIT\n→ Usar paginación\n\n2. PROCESAR EN BACKGROUND:\n→ Retornar respuesta inmediata\n→ Procesar en pg_cron job\n→ Notificar al usuario después\n\n3. BATCH PROCESSING:\n→ Dividir operación en chunks\n→ Procesar de a 100-500 registros\n→ Usar cursor para grandes datasets\n\n4. CACHING:\n→ Cachear resultados frecuentes\n→ Usar tabla cache intermedia\n→ Refresh cache periódicamente\n\n5. MOVER A CLOUD RUN:\n→ Para operaciones largas (>60s)\n→ Cloud Run permite hasta 3600s',
        },
      ],
    },
    {
      title: '🛠️ Scripts y Herramientas Útiles',
      items: [
        {
          title: 'Scripts de diagnóstico',
          content: 'UBICACIÓN: ./scripts/\n\napply-migration.sh\n→ Aplica migración SQL a la BD\n→ Uso: ./scripts/apply-migration.sh archivo.sql\n\ngit-safety-check.sh\n→ Verifica estado de Git antes de deploy\n→ Ejecutado automáticamente por deploy.sh\n→ Checks: uncommitted changes, sync con remoto, conflictos\n\nbackup-database.sh (si existe)\n→ Crea backup manual de BD\n→ Ejecutado antes de deploy a producción\n→ Guarda en ./backups/\n\ncheck-policies.sh\n→ Verifica políticas RLS activas\n→ Lista todas las policies por tabla\n\ncheck-get-my-role.sh\n→ Prueba función get_my_role()\n→ Verifica autenticación de roles',
        },
        {
          title: 'Comandos de verificación rápida',
          content: 'VERIFICAR ROL DE USUARIO:\nSELECT get_my_role();\n\nVER LEADS ASIGNADOS A SALES:\nSELECT * FROM get_sales_assigned_leads(\'<user-id>\');\n\nVER PERFIL SEGURO DE CLIENTE:\nSELECT * FROM get_secure_client_profile(\'<client-id>\');\n\nVER OPCIONES DE FILTROS:\nSELECT * FROM get_filter_options();\n\nVER ESTADÍSTICAS DE LEADS:\nSELECT * FROM get_leads_for_dashboard(\'{}\'::jsonb);\n\nCONTAR VEHÍCULOS EN INVENTARIO:\nSELECT COUNT(*) FROM inventario_cache;\n\nVER ÚLTIMAS SINCRONIZACIONES:\nSELECT * FROM sync_logs ORDER BY created_at DESC LIMIT 10;',
        },
        {
          title: 'Herramientas de monitoreo',
          content: 'SUPABASE DASHBOARD:\n→ https://app.supabase.com\n→ Ver: Database, Auth, Storage, Edge Functions, Logs\n\nGOOGLE CLOUD CONSOLE:\n→ https://console.cloud.google.com\n→ Ver: Cloud Run, Logs Explorer, Monitoring\n\nAIRTABLE:\n→ https://airtable.com/\n→ Gestionar inventario de vehículos\n\nCLOUDFLARE R2:\n→ https://dash.cloudflare.com\n→ Gestionar imágenes y assets\n\nKOMMO CRM:\n→ https://kommo.com\n→ Gestionar contactos y deals',
        },
      ],
    },
  ];

  const categoryData = {
    usuario: {
      title: '👤 Guía de Usuario',
      subtitle: 'Para clientes de TREFA',
      icon: Users,
      gradient: 'from-green-500 to-green-600',
      sections: usuarioSections,
    },
    colaborador: {
      title: '💼 Guía de Colaborador',
      subtitle: 'Para asesores de ventas',
      icon: Wrench,
      gradient: 'from-orange-500 to-orange-600',
      sections: colaboradorSections,
    },
    admin: {
      title: '🔧 Guía de Administrador',
      subtitle: 'Para equipo técnico',
      icon: AlertCircle,
      gradient: 'from-purple-500 to-purple-600',
      sections: adminSections,
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-900 to-primary-700 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden mb-6">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-8 py-12 text-center">
            <BookOpen className="w-16 h-16 mx-auto mb-4" />
            <h1 className="text-4xl font-bold mb-3">📚 Centro de Documentación</h1>
            <p className="text-lg opacity-95">Guías Completas para Autos TREFA</p>
            <p className="text-sm mt-2 opacity-90">trefa.mx</p>
          </div>

          {/* Search */}
          <div className="px-8 py-6 border-b">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Buscar en la documentación..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Category Selection Cards */}
        {!selectedCategory && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {(Object.keys(categoryData) as CategoryType[])
              .filter((category) => category !== 'admin' || isAdmin) // Solo mostrar admin si es admin
              .map((category) => {
              const data = categoryData[category];
              const Icon = data.icon;
              const isLocked = category === 'admin' && !isAdmin;

              return (
                <button
                  key={category}
                  onClick={() => {
                    if (isLocked) {
                      return; // No hacer nada si está bloqueado
                    }
                    setSelectedCategory(category);
                  }}
                  disabled={isLocked}
                  className={`bg-white rounded-2xl shadow-2xl overflow-hidden transition-all ${
                    isLocked
                      ? 'opacity-50 cursor-not-allowed'
                      : 'hover:shadow-3xl transform hover:scale-105'
                  }`}
                >
                  <div className={`bg-gradient-to-r ${data.gradient} text-white px-6 py-12 text-center relative`}>
                    {isLocked && (
                      <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                        <Lock className="w-12 h-12" />
                      </div>
                    )}
                    <Icon className="w-16 h-16 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold mb-2">{data.title}</h2>
                    <p className="text-sm opacity-90">{data.subtitle}</p>
                    {isLocked && (
                      <p className="text-xs mt-2 opacity-90">Solo para administradores</p>
                    )}
                  </div>
                  <div className="p-6">
                    <div className="flex items-center justify-between text-gray-700 mb-4">
                      <span className="font-semibold">Contenido:</span>
                      <span className="text-sm bg-gray-100 px-3 py-1 rounded-full">
                        {data.sections.length} secciones
                      </span>
                    </div>
                    <ul className="space-y-2 text-sm text-gray-600">
                      {data.sections.slice(0, 3).map((section, idx) => (
                        <li key={idx} className="flex items-start">
                          <span className="mr-2">•</span>
                          <span>{section.title}</span>
                        </li>
                      ))}
                      {data.sections.length > 3 && (
                        <li className="text-gray-500 italic">Y {data.sections.length - 3} más...</li>
                      )}
                    </ul>
                    <div className="mt-6 flex items-center justify-center gap-2 text-blue-600 font-semibold">
                      {isLocked ? (
                        <>
                          <Lock className="w-5 h-5" />
                          <span>Acceso Restringido</span>
                        </>
                      ) : (
                        <>
                          <Maximize2 className="w-5 h-5" />
                          <span>Ver Guía Completa</span>
                        </>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Full Screen Documentation View */}
        {selectedCategory && (
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
            {/* Header with close and index buttons */}
            <div className={`bg-gradient-to-r ${categoryData[selectedCategory].gradient} text-white px-8 py-8`}>
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={() => setSelectedCategory(null)}
                  className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                  <span>Volver</span>
                </button>
                <button
                  onClick={() => setShowIndex(!showIndex)}
                  className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors"
                >
                  <List className="w-5 h-5" />
                  <span>{showIndex ? 'Ocultar' : 'Mostrar'} Índice</span>
                </button>
              </div>
              <div className="text-center">
                {React.createElement(categoryData[selectedCategory].icon, { className: 'w-12 h-12 mx-auto mb-3' })}
                <h2 className="text-3xl font-bold mb-2">{categoryData[selectedCategory].title}</h2>
                <p className="text-sm opacity-90">{categoryData[selectedCategory].subtitle}</p>
              </div>
            </div>

            {/* Index Sidebar */}
            {showIndex && (
              <div className="bg-blue-50 border-b border-blue-200 px-8 py-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <List className="w-5 h-5" />
                  Índice de Contenidos
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {categoryData[selectedCategory].sections.map((section, idx) => (
                    <a
                      key={idx}
                      href={`#section-${idx}`}
                      className="block bg-white rounded-lg p-3 hover:bg-blue-100 transition-colors"
                      onClick={() => setShowIndex(false)}
                    >
                      <div className="font-semibold text-gray-800 text-sm mb-1">{section.title}</div>
                      <div className="text-xs text-gray-600">{section.items.length} preguntas</div>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Content */}
            <div className="px-8 py-10 space-y-12 max-h-[70vh] overflow-y-auto">
              {categoryData[selectedCategory].sections.map((section, idx) => (
                <DocSection
                  key={idx}
                  id={`section-${idx}`}
                  title={section.title}
                  items={section.items}
                  searchTerm={searchTerm}
                />
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-6 bg-white rounded-2xl shadow-2xl p-6">
          <div className="text-center text-gray-600">
            <p className="text-sm">
              ¿Necesitas ayuda adicional? Contacta al equipo de soporte en{' '}
              <a href="mailto:soporte@trefa.mx" className="text-blue-600 hover:underline">
                soporte@trefa.mx
              </a>
            </p>
            <p className="text-xs mt-2 text-gray-500">
              Última actualización: 5 de Noviembre, 2025
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Reusable DocSection Component
interface DocSectionProps {
  id: string;
  title: string;
  items: Array<{
    title: string;
    content: string;
  }>;
  searchTerm: string;
}

const DocSection: React.FC<DocSectionProps> = ({ id, title, items, searchTerm }) => {
  const filteredItems = items.filter(
    (item) =>
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (searchTerm && filteredItems.length === 0) {
    return null;
  }

  return (
    <div id={id} className="scroll-mt-6">
      <h3 className="text-2xl font-bold text-gray-900 mb-6 pb-2 border-b-2 border-gray-200">
        {title}
      </h3>
      <div className="space-y-4">
        {(searchTerm ? filteredItems : items).map((item, index) => (
          <div key={index} className="bg-gray-50 rounded-lg p-5 hover:bg-gray-100 transition-colors">
            <h4 className="font-semibold text-gray-800 mb-3 text-lg">{item.title}</h4>
            <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
              {item.content}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default IntelPage;
