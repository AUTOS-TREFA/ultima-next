'use client';

import React, { useState } from 'react';
import { BookOpen, Users, AlertCircle, Wrench, Search, X, Maximize2, List } from 'lucide-react';

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
    // SEO metadata is handled in the page.tsx file in Next.js

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
      title: '👥 Gestión de Usuarios',
      items: [
        {
          title: 'Roles disponibles',
          content: 'USER: Cliente normal (acceso solo a su dashboard). SALES: Asesor de ventas (acceso a leads asignados). ADMIN: Administrador (acceso total a todas las funcionalidades).',
        },
        {
          title: '¿Cómo cambiar el rol de un usuario?',
          content: 'Ve a Admin → Usuarios → Busca el usuario → Edita el campo "role" → Guarda. IMPORTANTE: Solo cambia roles de usuarios autorizados.',
        },
        {
          title: 'Seguridad de roles',
          content: 'Los roles están protegidos por RLS (Row Level Security) en Supabase. Las funciones SECURITY DEFINER verifican permisos antes de cada operación.',
        },
      ],
    },
    {
      title: '🗄️ Base de Datos',
      items: [
        {
          title: 'Tablas principales',
          content: 'profiles: Usuarios y clientes. financing_applications: Solicitudes de financiamiento. uploaded_documents: Documentos de clientes. lead_tags: Etiquetas para clasificar leads. lead_reminders: Recordatorios de seguimiento.',
        },
        {
          title: 'Migraciones',
          content: 'Las migraciones están en /supabase/migrations/. Para aplicar: supabase db push. Para crear nueva: supabase migration new nombre_migracion.',
        },
        {
          title: 'Funciones RPC críticas',
          content: 'get_secure_client_profile: Obtiene perfil con verificación de roles. get_sales_assigned_leads: Leads asignados a un asesor. verify_sales_access_to_lead: Verifica si asesor tiene acceso.',
        },
      ],
    },
    {
      title: '🔄 Sincronización Airtable',
      items: [
        {
          title: '¿Cómo funciona el sync?',
          content: 'El inventario de autos se almacena en Airtable y se sincroniza automáticamente a Supabase cada hora usando Edge Functions + pg_cron.',
        },
        {
          title: 'Configuración',
          content: 'Ve a Admin → Airtable Config → Verifica que AIRTABLE_API_KEY esté configurado → Revisa el último sync exitoso → Puedes forzar un sync manual si es necesario.',
        },
        {
          title: 'Solución de problemas',
          content: 'Si el sync falla: 1. Verifica la API key en Supabase Secrets. 2. Revisa logs en Dashboard → Edge Functions. 3. Verifica que Airtable tenga datos válidos. 4. Ejecuta: supabase functions logs sync-airtable',
        },
      ],
    },
    {
      title: '🚀 Deploy y Staging',
      items: [
        {
          title: 'Deploy a producción',
          content: 'Desde la raíz del proyecto: ./docs/deployment/deploy.sh production. IMPORTANTE: Siempre prueba en staging primero.',
        },
        {
          title: 'Deploy a staging',
          content: './docs/deployment/deploy.sh staging. Staging está en staging.trefa.mx y usa una base de datos separada.',
        },
        {
          title: 'Verificación pre-deploy',
          content: 'El script deploy.sh ejecuta automáticamente git-safety-check.sh que verifica: Cambios sin commit, Estado de sincronización con remoto, Conflictos potenciales, Estado de la rama.',
        },
      ],
    },
    {
      title: '💾 Sistema de Respaldos',
      items: [
        {
          title: 'Respaldos automáticos',
          content: 'Supabase hace respaldos automáticos diarios. Los respaldos se retienen por 7 días en el plan gratuito, 30 días en plan Pro.',
        },
        {
          title: '¿Cómo restaurar un respaldo?',
          content: 'Dashboard de Supabase → Database → Backups → Selecciona el respaldo → Restore. ADVERTENCIA: Esto sobrescribirá la base de datos actual.',
        },
        {
          title: 'Respaldo manual',
          content: 'Para hacer un respaldo manual: supabase db dump -f backup.sql. Para restaurar: supabase db reset --db-url "postgres://..."',
        },
      ],
    },
    {
      title: '🆘 Troubleshooting Crítico',
      items: [
        {
          title: 'Admin sin acceso al CRM',
          content: 'CAUSA: Función get_secure_client_profile verifica role = admin. SOLUCIÓN: Verificar en Supabase que profiles.role = "admin". Aplicar migración: 20251105000004_fix_function_role_based_auth.sql',
        },
        {
          title: 'Sales no ve sus leads',
          content: 'CAUSA: Funciones consultando tablas incorrectas. SOLUCIÓN: Aplicar migración 20251105000005_fix_sales_functions_table_names.sql. Verificar que asesor_asignado_id esté configurado.',
        },
        {
          title: 'Error "infinite recursion in policy"',
          content: 'CAUSA: Política RLS consulta la misma tabla que protege. SOLUCIÓN: Aplicar migración 20251105000006_fix_infinite_recursion_in_profiles_rls.sql. Usar funciones SECURITY DEFINER en lugar de políticas RLS recursivas.',
        },
        {
          title: 'Sincronización Airtable falla',
          content: 'VERIFICAR: 1. AIRTABLE_API_KEY configurado. 2. Edge Function desplegada. 3. pg_cron job activo. 4. Logs en Supabase. COMANDO: supabase functions logs sync-airtable',
        },
      ],
    },
    {
      title: '🛠️ Scripts Útiles',
      items: [
        {
          title: 'Diagnóstico de base de datos',
          content: 'scripts/check-policies.sh: Verifica políticas RLS. scripts/check-get-my-role.sh: Prueba función de roles. scripts/apply-migration.sh: Aplica migración SQL.',
        },
        {
          title: 'Verificación de acceso',
          content: 'Para verificar acceso de ventas: SELECT * FROM get_sales_assigned_leads("user-uuid"). Para verificar admin: SELECT get_my_role().',
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
            {(Object.keys(categoryData) as CategoryType[]).map((category) => {
              const data = categoryData[category];
              const Icon = data.icon;
              return (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className="bg-white rounded-2xl shadow-2xl overflow-hidden hover:shadow-3xl transition-all transform hover:scale-105"
                >
                  <div className={`bg-gradient-to-r ${data.gradient} text-white px-6 py-12 text-center`}>
                    <Icon className="w-16 h-16 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold mb-2">{data.title}</h2>
                    <p className="text-sm opacity-90">{data.subtitle}</p>
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
                      <Maximize2 className="w-5 h-5" />
                      <span>Ver Guía Completa</span>
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
