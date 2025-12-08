'use client';

import React from 'react';
import { BookOpen, Rocket } from 'lucide-react';
import AdminRoadmapManager from '../components/AdminRoadmapManager';
import DynamicRoadmapDisplay from '../components/DynamicRoadmapDisplay';
import AdminChangelogManager from '../components/AdminChangelogManager';
import DynamicChangelogDisplay from '../components/DynamicChangelogDisplay';

const ChangelogPage: React.FC = () => {
    // SEO metadata is handled in the page.tsx file in Next.js

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-900 to-primary-700 py-8 px-4">
      {/* Two Column Layout */}
      <div className="max-w-[1800px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* LEFT COLUMN: CHANGELOG (Orange) */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col">
          {/* Header */}
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-8 py-12 text-center flex-shrink-0">
            <BookOpen className="w-16 h-16 mx-auto mb-4" />
            <h1 className="text-4xl font-bold mb-3">📝 Registro de Cambios</h1>
            <p className="text-lg opacity-95">Autos TREFA - Historial de Actualizaciones</p>
            <p className="text-sm mt-2 opacity-90">trefa.mx</p>
            <div className="mt-6 inline-block bg-white/20 backdrop-blur-sm px-6 py-3 rounded-lg">
              <p className="text-lg font-semibold">
                ⏱️ Total de Horas de Desarrollo: <span className="text-2xl">568+</span> horas
              </p>
            </div>
          </div>

          {/* Content - Scrollable */}
          <div className="px-8 py-10 space-y-12 overflow-y-auto flex-1">

            {/* Admin Changelog Manager */}
            <AdminChangelogManager />

            {/* Dynamic Changelog Content */}
            <DynamicChangelogDisplay />

          {/* Version 1.9.0 */}
          <div className="border-l-4 border-purple-500 pl-8">
            <div className="flex flex-wrap items-center gap-3 mb-6">
              <h2 className="text-3xl font-bold text-gray-900">v1.9.0</h2>
              <span className="bg-purple-100 text-purple-700 px-4 py-1 rounded-full text-sm font-bold">
                🔗 Integración Kommo CRM
              </span>
              <span className="bg-gray-100 px-4 py-1 rounded-full text-sm text-gray-600">
                7 de Noviembre, 2025
              </span>
            </div>

            <div className="space-y-8">
              {/* Kommo CRM Integration */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-lg text-xs font-bold uppercase">
                    🔗 Kommo CRM
                  </span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Sistema Completo de Sincronización con Kommo CRM</h3>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start">
                    <span className="mr-2">✅</span>
                    <span><strong>KommoService.ts:</strong> Servicio completo de integración con OAuth 2.0, búsqueda de leads por email/teléfono/RFC y sincronización bidireccional</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">✅</span>
                    <span><strong>AdminClientProfilePage:</strong> Interfaz de sincronización manual con visualización de datos de Kommo (Lead ID, Pipeline, Stage, Usuario asignado)</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">✅</span>
                    <span><strong>SalesClientProfilePage:</strong> Interfaz de sincronización disponible para equipo de ventas</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">✅</span>
                    <span>Búsqueda inteligente de leads existentes antes de crear duplicados</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">✅</span>
                    <span>Manejo seguro de tokens con renovación automática</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">✅</span>
                    <span>Modo seguro read-only para prevenir modificaciones accidentales</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">📁</span>
                    <span><strong>Archivos:</strong> KommoService.ts, AdminClientProfilePage.tsx, SalesClientProfilePage.tsx, config.ts</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">📄</span>
                    <span><strong>Documentación:</strong> KOMMO_INTEGRATION.md con guía completa de implementación</span>
                  </li>
                </ul>
              </div>

              {/* Development Time */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">
                  <strong>Tiempo de desarrollo:</strong> 4 horas
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Archivos modificados:</strong> 5 archivos (2 servicios, 2 páginas, 1 configuración)
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Funcionalidades agregadas:</strong> OAuth 2.0, búsqueda de leads, sincronización bidireccional, UI de visualización
                </p>
              </div>
            </div>
          </div>

          {/* Version 1.8.3 */}
          <div className="border-l-4 border-blue-500 pl-8">
            <div className="flex flex-wrap items-center gap-3 mb-6">
              <h2 className="text-3xl font-bold text-gray-900">v1.8.3</h2>
              <span className="bg-blue-100 text-blue-700 px-4 py-1 rounded-full text-sm font-bold">
                🌐 CDN & Correcciones CRM
              </span>
              <span className="bg-gray-100 px-4 py-1 rounded-full text-sm text-gray-600">
                6 de Noviembre, 2025
              </span>
            </div>

            <div className="space-y-8">
              {/* SimpleCRM setLeads Fix */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <span className="bg-red-100 text-red-800 px-3 py-1 rounded-lg text-xs font-bold uppercase">
                    🐛 Corrección Crítica CRM
                  </span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Fix: Error "Can't find variable: setLeads" en SimpleCRMPage</h3>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start">
                    <span className="mr-2">🐛</span>
                    <span><strong>PROBLEMA:</strong> Error en edición de fuente y checkbox contactado en SimpleCRMPage desde esta mañana</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">⚠️</span>
                    <span><strong>CAUSA:</strong> Código llamaba <code>setLeads</code> pero el state variable se llamaba <code>setClients</code></span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">✅</span>
                    <span>Corregido en 3 funciones: updateAsesorAsignado (línea 241), toggleContactado (línea 268), saveSource (línea 292)</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">✅</span>
                    <span>Ahora los administradores pueden editar fuente de lead y marcar como contactado sin errores</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">📁</span>
                    <span><strong>Archivo modificado:</strong> SimpleCRMPage.tsx</span>
                  </li>
                </ul>
              </div>

              {/* Cloudflare CDN */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-lg text-xs font-bold uppercase">
                    🌐 Optimización CDN
                  </span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Integración Cloudflare CDN para Imágenes de Facebook Catalogue</h3>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start">
                    <span className="mr-2">📉</span>
                    <span><strong>OBJETIVO:</strong> Reducir costos de egress de Supabase Storage redirigiendo imágenes del catálogo de Facebook a través de Cloudflare CDN</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">✅</span>
                    <span>Feed de Facebook ahora usa URLs de Cloudflare en lugar de URLs directas de Supabase</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">✅</span>
                    <span>Configuración de caché inteligente para máxima eficiencia</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">💰</span>
                    <span>Reducción estimada de 80% en costos de bandwidth de imágenes</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">📁</span>
                    <span><strong>Archivo modificado:</strong> facebook-catalogue-feed edge function</span>
                  </li>
                </ul>
              </div>

              {/* Development Time */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">
                  <strong>Tiempo de desarrollo:</strong> 1.5 horas
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Bugs corregidos:</strong> 1 crítico (setLeads en SimpleCRMPage)
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Optimizaciones:</strong> Cloudflare CDN para Facebook catalogue (-80% egress costs)
                </p>
              </div>
            </div>
          </div>

          {/* Version 1.8.2 */}
          <div className="border-l-4 border-orange-500 pl-8">
            <div className="flex flex-wrap items-center gap-3 mb-6">
              <h2 className="text-3xl font-bold text-gray-900">v1.8.2</h2>
              <span className="bg-orange-100 text-orange-700 px-4 py-1 rounded-full text-sm font-bold">
                📊 Marketing Tracking Reorganizado
              </span>
              <span className="bg-gray-100 px-4 py-1 rounded-full text-sm text-gray-600">
                6 de Noviembre, 2025
              </span>
            </div>

            <div className="space-y-8">
              {/* Tracking Events Reorganization */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <span className="bg-orange-100 text-orange-800 px-3 py-1 rounded-lg text-xs font-bold uppercase">
                    📊 Sistema de Eventos
                  </span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Reorganización Completa de Eventos de Tracking con Nombres Claros</h3>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start">
                    <span className="mr-2">✅</span>
                    <span><strong>4 Eventos Principales:</strong> InitialRegistration, PersonalInformationComplete, PerfilacionBancariaComplete, LeadComplete</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">✅</span>
                    <span>Cada evento ahora indica claramente QUÉ pasó y DÓNDE ocurrió</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">✅</span>
                    <span><strong>InitialRegistration:</strong> Dispara en /acceder cuando usuario verifica OTP (AuthPage.tsx:185)</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">✅</span>
                    <span><strong>PersonalInformationComplete:</strong> Dispara en /escritorio/profile al guardar información personal (ProfilePage.tsx:164)</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">✅</span>
                    <span><strong>PerfilacionBancariaComplete:</strong> Dispara en /escritorio/perfilacion-bancaria al completar cuestionario</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">✅</span>
                    <span><strong>LeadComplete:</strong> Dispara en /escritorio/aplicacion al enviar solicitud (Application.tsx:415)</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">📱</span>
                    <span>Eventos se envían a Facebook Pixel, GTM dataLayer, y tabla tracking_events de Supabase</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">✅</span>
                    <span>Parámetros UTM incluidos automáticamente en todos los eventos</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">📄</span>
                    <span><strong>Documentación:</strong> EVENTOS_TRACKING_REORGANIZADOS_ES.md con guía completa de GTM y Facebook Ads</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">📁</span>
                    <span><strong>Archivo modificado:</strong> ConversionTrackingService.ts</span>
                  </li>
                </ul>
              </div>

              {/* Development Time */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">
                  <strong>Tiempo de desarrollo:</strong> 2.5 horas
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Eventos reorganizados:</strong> 4 eventos de conversión principales
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Documentación creada:</strong> Guía completa en español con configuración de GTM y Facebook Ads
                </p>
              </div>
            </div>
          </div>

          {/* Version 1.8.1 */}
          <div className="border-l-4 border-red-500 pl-8">
            <div className="flex flex-wrap items-center gap-3 mb-6">
              <h2 className="text-3xl font-bold text-gray-900">v1.8.1</h2>
              <span className="bg-red-100 text-red-700 px-4 py-1 rounded-full text-sm font-bold">
                🚨 Correcciones Críticas de CRM
              </span>
              <span className="bg-gray-100 px-4 py-1 rounded-full text-sm text-gray-600">
                5 de Noviembre, 2025
              </span>
            </div>

            <div className="space-y-8">
              {/* Admin Access Fix */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <span className="bg-red-100 text-red-800 px-3 py-1 rounded-lg text-xs font-bold uppercase">
                    🔧 Acceso Administrativo Restaurado
                  </span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Fix: Función get_secure_client_profile con Autenticación Basada en Roles</h3>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start">
                    <span className="mr-2">🐛</span>
                    <span><strong>PROBLEMA:</strong> Función usaba lista hardcodeada de emails, faltaban 3 administradores y causó pérdida total de acceso al CRM</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">✅</span>
                    <span><strong>SOLUCIÓN:</strong> Cambiado a autenticación dinámica basada en <code>profiles.role = 'admin'</code></span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">✅</span>
                    <span>Removida columna inexistente <code>date_of_birth</code> que causaba error de SQL</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">✅</span>
                    <span>Implementado <code>to_jsonb(p.*)</code> para inclusión automática de todas las columnas del perfil</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">✅</span>
                    <span>5 usuarios admin ahora tienen acceso completo al CRM</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">📄</span>
                    <span><strong>Migración:</strong> 20251105000004_fix_function_role_based_auth.sql</span>
                  </li>
                </ul>
              </div>

              {/* Sales Access Fix */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <span className="bg-orange-100 text-orange-800 px-3 py-1 rounded-lg text-xs font-bold uppercase">
                    🔧 Acceso de Ventas Reparado
                  </span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Fix: Funciones de Sales Dashboard con Nombres de Tablas Correctos</h3>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start">
                    <span className="mr-2">🐛</span>
                    <span><strong>PROBLEMA:</strong> Usuarios de ventas sin acceso funcional desde Oct 22 (~2 semanas). Funciones consultaban tabla vacía <code>applications</code> en lugar de <code>financing_applications</code></span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">⚠️</span>
                    <span><strong>CAUSA RAÍZ:</strong> Migración creada el 22 de octubre usó nombres de tabla obsoletos después de renombrado</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">✅</span>
                    <span>Corregido <code>get_sales_client_profile</code>: <code>applications</code> → <code>financing_applications</code>, <code>documents</code> → <code>uploaded_documents</code></span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">✅</span>
                    <span>Corregido <code>get_sales_assigned_leads</code>: Ahora consulta tabla correcta con datos reales</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">✅</span>
                    <span>Corregido <code>verify_sales_access_to_lead</code>: Validación de acceso ahora funcional</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">✅</span>
                    <span>Cambiado <code>autorizar_asesor_acceso</code> → <code>asesor_autorizado_acceso</code> (nombre de columna correcto)</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">✅</span>
                    <span>4+ usuarios de ventas ahora pueden ver sus leads asignados</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">📄</span>
                    <span><strong>Migraciones:</strong> 20251105000005_fix_sales_functions_table_names.sql + sales_dashboard_functions.sql actualizado</span>
                  </li>
                </ul>
              </div>

              {/* Infinite Recursion Fix */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-lg text-xs font-bold uppercase">
                    🔧 Recursión Infinita Resuelta
                  </span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Fix: Política RLS Causaba Loop Infinito en Consultas de Perfil</h3>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start">
                    <span className="mr-2">🐛</span>
                    <span><strong>ERROR:</strong> "infinite recursion detected in policy for relation profiles" - Bloqueaba carga de asesores</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">⚠️</span>
                    <span><strong>CAUSA:</strong> Política "Admin users can view all profiles" consultaba tabla <code>profiles</code> para verificar rol, disparando la misma política recursivamente</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">✅</span>
                    <span>Removida política problemática - Acceso admin manejado por funciones SECURITY DEFINER</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">✅</span>
                    <span>Políticas restantes suficientes: "Users can view own profile", "Authenticated users can view profiles"</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">✅</span>
                    <span>Función <code>get_my_role()</code> con SECURITY DEFINER bypass RLS correctamente</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">📄</span>
                    <span><strong>Migración:</strong> 20251105000006_fix_infinite_recursion_in_profiles_rls.sql</span>
                  </li>
                </ul>
              </div>

              {/* Scripts Created */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-lg text-xs font-bold uppercase">
                    🛠️ Herramientas de Diagnóstico
                  </span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Scripts de Verificación y Aplicación de Migraciones</h3>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start">
                    <span className="mr-2">🔧</span>
                    <span><strong>apply-sales-fix.sh:</strong> Script para aplicar correcciones de funciones de ventas</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">🔧</span>
                    <span><strong>apply-recursion-fix.sh:</strong> Script para remover política RLS problemática</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">🔍</span>
                    <span><strong>verify-sales-access.sql:</strong> Diagnóstico completo de acceso de ventas</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">🔍</span>
                    <span><strong>check-policies.sh:</strong> Verificación de políticas RLS en tiempo real</span>
                  </li>
                </ul>
              </div>

              {/* Impact Summary */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <span className="bg-green-100 text-green-800 px-3 py-1 rounded-lg text-xs font-bold uppercase">
                    ✅ Impacto y Resultados
                  </span>
                </div>
                <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded">
                  <ul className="space-y-2 text-gray-700">
                    <li className="flex items-start">
                      <span className="mr-2">✅</span>
                      <span><strong>5 usuarios admin</strong> recuperaron acceso completo a SimpleCRMPage</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2">✅</span>
                      <span><strong>4+ usuarios de ventas</strong> ahora pueden ver sus leads asignados (primera vez en 2 semanas)</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2">✅</span>
                      <span><strong>Tabla applications vacía</strong> identificada como causa de acceso roto</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2">✅</span>
                      <span><strong>3 migraciones aplicadas</strong> exitosamente a producción</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2">✅</span>
                      <span><strong>Zero downtime</strong> durante las correcciones</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2">🔒</span>
                      <span><strong>Sistema de respaldos</strong> permitió trabajo seguro sin riesgo de pérdida de datos</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Development Time */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">
                  <strong>Tiempo de desarrollo:</strong> 3 horas
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Migraciones aplicadas:</strong> 3 archivos SQL
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Funciones corregidas:</strong> 4 (get_secure_client_profile, get_sales_client_profile, get_sales_assigned_leads, verify_sales_access_to_lead)
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Políticas RLS optimizadas:</strong> 5 → 4 (removida política con recursión infinita)
                </p>
              </div>
            </div>
          </div>

          {/* Version 1.8.0 */}
          <div className="border-l-4 border-green-500 pl-8">
            <div className="flex flex-wrap items-center gap-3 mb-6">
              <h2 className="text-3xl font-bold text-gray-900">v1.8.0</h2>
              <span className="bg-green-100 text-green-700 px-4 py-1 rounded-full text-sm font-bold">
                🛡️ Seguridad y Respaldos
              </span>
              <span className="bg-gray-100 px-4 py-1 rounded-full text-sm text-gray-600">
                5 de Noviembre, 2025
              </span>
            </div>

            <div className="space-y-8">
              {/* Git Safety System */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <span className="bg-green-100 text-green-800 px-3 py-1 rounded-lg text-xs font-bold uppercase">
                    🛡️ Sistema de Seguridad Git
                  </span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Protección Total Contra Pérdida de Código</h3>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start">
                    <span className="mr-2">✅</span>
                    <span><strong>git-safety-check.sh:</strong> Sistema de verificación con 8 puntos de control antes de cualquier operación</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">✅</span>
                    <span><strong>Detecta cambios sin commit:</strong> Previene pérdida de trabajo no guardado</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">✅</span>
                    <span><strong>Verifica sincronización remota:</strong> Alerta si estás atrás del repositorio remoto</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">✅</span>
                    <span><strong>Identifica ramas divergentes:</strong> Detecta conflictos potenciales antes de que ocurran</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">✅</span>
                    <span><strong>safe-commit-push.sh:</strong> Proceso interactivo guiado para commit y push seguro con pull automático</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">✅</span>
                    <span><strong>Integrado en deployment:</strong> Paso 0 de deploy.sh ahora verifica Git automáticamente</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">🚫</span>
                    <span><strong>Imposible deployar código desactualizado:</strong> El sistema bloquea deployment si hay problemas de Git</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">📁</span>
                    <span><strong>Archivos:</strong> scripts/git-safety-check.sh (7.1K), scripts/safe-commit-push.sh (6.3K)</span>
                  </li>
                </ul>
              </div>

              {/* Database Backup System */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-lg text-xs font-bold uppercase">
                    📦 Sistema de Respaldos de BD
                  </span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Respaldos Automáticos de Base de Datos</h3>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start">
                    <span className="mr-2">✅</span>
                    <span><strong>backup-database.sh:</strong> Respaldo completo de base de datos (~17MB) en segundos</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">✅</span>
                    <span><strong>restore-database.sh:</strong> Restauración segura con confirmación y respaldo automático previo</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">✅</span>
                    <span><strong>pre-migration-backup.sh:</strong> Respaldo especializado antes de aplicar migraciones</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">✅</span>
                    <span><strong>cleanup-old-backups.sh:</strong> Limpieza inteligente con retención estratégica (7 días: todos, 30 días: semanales, +30: mensuales)</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">✅</span>
                    <span><strong>Integrado en deployment:</strong> Respaldo automático antes de cada deployment a producción</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">✅</span>
                    <span><strong>Conexión IPv4 segura:</strong> Usa pooler de Supabase (aws-0-us-east-2.pooler.supabase.com)</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">🔒</span>
                    <span><strong>Protegidos en .gitignore:</strong> Los respaldos no se suben a GitHub (datos sensibles)</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">📁</span>
                    <span><strong>Archivos:</strong> scripts/backup-database.sh (2.2K), scripts/restore-database.sh (2.5K), scripts/pre-migration-backup.sh (1.1K), scripts/cleanup-old-backups.sh (5.6K)</span>
                  </li>
                </ul>
              </div>

              {/* Documentation */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-lg text-xs font-bold uppercase">
                    📚 Documentación Completa
                  </span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Guías en Español y Referencias Rápidas</h3>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start">
                    <span className="mr-2">📖</span>
                    <span><strong>docs/GIT_SAFETY_WORKFLOW.md:</strong> Guía completa de flujo de trabajo seguro con Git (casos de uso, troubleshooting, buenas prácticas)</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">📖</span>
                    <span><strong>docs/GUIA_RESPALDOS_BD.md:</strong> Guía completa de respaldos de base de datos en español</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">📖</span>
                    <span><strong>docs/ESTRATEGIA_RESPALDOS.md:</strong> Estrategia de retención, análisis de almacenamiento, y mejores prácticas</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">📖</span>
                    <span><strong>scripts/README.md:</strong> Referencia rápida de todos los scripts disponibles</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">📖</span>
                    <span><strong>backups/README.md:</strong> Información sobre la carpeta de respaldos</span>
                  </li>
                </ul>
              </div>

              {/* Protection Summary */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-lg text-xs font-bold uppercase">
                    🎯 Protección Implementada
                  </span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Sistema de Múltiples Capas de Seguridad</h3>
                <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded">
                  <ul className="space-y-2 text-gray-700">
                    <li className="flex items-start">
                      <span className="mr-2">🛡️</span>
                      <span><strong>Imposible deployar código desactualizado:</strong> Verificación automática en Step 0</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2">🛡️</span>
                      <span><strong>Imposible sobrescribir cambios remotos:</strong> Pull automático antes de push</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2">🛡️</span>
                      <span><strong>Respaldo automático en producción:</strong> Siempre hay punto de restauración</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2">🛡️</span>
                      <span><strong>Commit y push verificado:</strong> Proceso interactivo con seguridad integrada</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2">🛡️</span>
                      <span><strong>Documentación completa:</strong> Guías detalladas para cada escenario</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Development Time */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">
                  <strong>Tiempo de desarrollo:</strong> 8 horas
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Archivos creados:</strong> 10 scripts + 5 documentos
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Líneas de código:</strong> +2,120 líneas
                </p>
              </div>
            </div>
          </div>

          {/* Version 1.7.0 */}
          <div className="border-l-4 border-blue-500 pl-8">
            <div className="flex flex-wrap items-center gap-3 mb-6">
              <h2 className="text-3xl font-bold text-gray-900">v1.7.0</h2>
              <span className="bg-blue-100 text-blue-700 px-4 py-1 rounded-full text-sm font-bold">
                Mejoras Críticas y SEO
              </span>
              <span className="bg-gray-100 px-4 py-1 rounded-full text-sm text-gray-600">
                2 de Noviembre, 2025
              </span>
            </div>

            <div className="space-y-8">
              {/* Valuation Form Critical Fix */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <span className="bg-red-100 text-red-800 px-3 py-1 rounded-lg text-xs font-bold uppercase">
                    🚨 Corrección Crítica
                  </span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Formulario de Valuación - Seguridad de Ofertas</h3>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start">
                    <span className="mr-2">⚠️</span>
                    <span><strong>PROBLEMA CRÍTICO RESUELTO:</strong> Se detectó que el sistema generaba ofertas arbitrarias cuando Intelimotor no retornaba valores, poniendo en riesgo dinero real de la empresa.</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">✅</span>
                    <span>Eliminados +50 líneas de cálculos de respaldo que generaban ofertas sin autorización de Intelimotor</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">✅</span>
                    <span>Ahora SOLO se usa <code className="bg-gray-100 px-2 py-0.5 rounded">suggestedOffer</code> de la respuesta oficial de Intelimotor API</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">✅</span>
                    <span>Agregado parámetro obligatorio <code className="bg-gray-100 px-2 py-0.5 rounded">lite=true</code> en todas las llamadas a la API</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">✅</span>
                    <span>Corregido bug crítico: solicitudes GET enviaban body (inválido en HTTP), causando fallos de red</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">✅</span>
                    <span>Actualizada ruta de extracción: <code className="bg-gray-100 px-2 py-0.5 rounded">data.regions[0].stats.suggestedOffer</code></span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">✅</span>
                    <span>Logging mejorado en todo el flujo de valuación para debugging</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">📁</span>
                    <span><strong>Archivos modificados:</strong> src/Valuation/services/valuationService.ts (líneas 356, 394-447), server/server.js, supabase/functions/valuation-proxy/index.ts</span>
                  </li>
                </ul>
              </div>

              {/* SEO Improvements */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <span className="bg-green-100 text-green-800 px-3 py-1 rounded-lg text-xs font-bold uppercase">
                    🚀 SEO y Marketing
                  </span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Sitemap XML - Optimización Total para Google</h3>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start">
                    <span className="mr-2">🗺️</span>
                    <span>Agregados tags <code className="bg-gray-100 px-2 py-0.5 rounded">&lt;lastmod&gt;</code> con timestamps reales de actualización de cada auto</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">🗺️</span>
                    <span>Agregados tags <code className="bg-gray-100 px-2 py-0.5 rounded">&lt;changefreq&gt;</code> estratégicos (daily, weekly, monthly, yearly) según tipo de página</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">🗺️</span>
                    <span>Prioridades dinámicas basadas en estado: Disponible (0.85), Vendido (0.6)</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">🖼️</span>
                    <span><strong>Image Sitemap implementado:</strong> Cada auto incluye hasta 6 imágenes con títulos y captions optimizados para Google Images</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">🖼️</span>
                    <span>Agregados namespaces XML: <code className="bg-gray-100 px-2 py-0.5 rounded">xmlns:image</code> y <code className="bg-gray-100 px-2 py-0.5 rounded">xmlns:xhtml</code></span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">✅</span>
                    <span>Función <code className="bg-gray-100 px-2 py-0.5 rounded">escapeXml()</code> para prevenir errores de parsing en títulos con caracteres especiales</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">✅</span>
                    <span>Actualizada toda terminología: "Auto" en lugar de "Vehículo" + branding TREFA consistente</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">📁</span>
                    <span><strong>Archivo modificado:</strong> generate-sitemap.js</span>
                  </li>
                </ul>
                <div className="mt-3 p-3 bg-green-50 border-l-4 border-green-500 rounded">
                  <p className="text-sm text-green-800">
                    <strong>Impacto esperado:</strong> Mayor visibilidad en Google Images, mejores rankings orgánicos,
                    crawling más eficiente. Ventaja competitiva ya que la mayoría de agencias no optimizan image sitemaps.
                  </p>
                </div>
              </div>

              {/* Email Notifications */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-lg text-xs font-bold uppercase">
                    📧 Comunicación
                  </span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Sistema de Emails Automatizados</h3>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start">
                    <span className="mr-2">✅</span>
                    <span>Edge Function <code className="bg-gray-100 px-2 py-0.5 rounded">automated-email-notifications</code> desplegada y funcionando</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">📧</span>
                    <span>Emails diarios automatizados: 93 recordatorios de perfil incompleto, 68 seguimientos de valuación, 5 resúmenes para asesores</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">📧</span>
                    <span>Confirmación inmediata al enviar solicitud de financiamiento</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">📊</span>
                    <span>Historial de emails ahora consulta directamente Brevo API (sin dependencias de base de datos)</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">⏰</span>
                    <span>Cron job programado: Ejecución diaria a las 4:00 AM CST (10:00 AM UTC)</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">📁</span>
                    <span><strong>Archivos modificados:</strong> supabase/functions/automated-email-notifications/index.ts, src/components/EmailNotificationsHistory.tsx</span>
                  </li>
                </ul>
              </div>

              {/* UI/UX Improvements */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-lg text-xs font-bold uppercase">
                    🎨 Interfaz
                  </span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Homepage - Uniformidad de Tipografía</h3>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start">
                    <span className="mr-2">✅</span>
                    <span>Heading principal mantiene <code className="bg-gray-100 px-2 py-0.5 rounded">font-black</code> (más destacado)</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">✅</span>
                    <span>Todos los headings secundarios estandarizados a <code className="bg-gray-100 px-2 py-0.5 rounded">font-bold</code> para consistencia visual</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">✅</span>
                    <span>Afecta secciones: "¿Cómo funciona?", "Conoce nuestro inventario", "¿Quieres vender tu auto?", "Hablar con un asesor", "Tramita tu crédito"</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">📁</span>
                    <span><strong>Archivo modificado:</strong> src/pages/HomePage.tsx (líneas 213, 516, 542, 564, 590)</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Version 1.6.0 */}
          <div className="border-l-4 border-green-500 pl-8">
            <div className="flex flex-wrap items-center gap-3 mb-6">
              <h2 className="text-3xl font-bold text-gray-900">v1.6.0</h2>
              <span className="bg-green-100 text-green-700 px-4 py-1 rounded-full text-sm font-bold">
                Dashboard de Compras
              </span>
              <span className="bg-gray-100 px-4 py-1 rounded-full text-sm text-gray-600">
                1 de Noviembre, 2025
              </span>
            </div>

            <div className="space-y-8">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <span className="bg-green-100 text-green-800 px-3 py-1 rounded-lg text-xs font-bold uppercase">
                    Nueva Funcionalidad Principal
                  </span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Dashboard de Compras de Autos</h3>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start">
                    <span className="mr-2">✅</span>
                    <span>Sistema completo de gestión de autos que usuarios desean vender a la empresa</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">✅</span>
                    <span>Lista de leads con filtrado, búsqueda y asignación de asesores</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">✅</span>
                    <span>Página de detalles con información completa del auto y propietario</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">✅</span>
                    <span>Extracción y visualización de metadatos EXIF de fotos (fecha, cámara, ubicación GPS)</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">✅</span>
                    <span>Seguimiento de ofertas sugeridas y finales con estados de aceptación</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">✅</span>
                    <span>Botones de acción para contactar vendedores por email o teléfono</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">✅</span>
                    <span>Íconos descriptivos para todos los campos de información del auto</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">✅</span>
                    <span>Formulario de venta mejorado con campos de nombre completo del vendedor</span>
                  </li>
                </ul>
              </div>

              <div>
                <div className="flex items-center gap-3 mb-4">
                  <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-lg text-xs font-bold uppercase">
                    Base de Datos
                  </span>
                </div>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start">
                    <span className="mr-2">🗄️</span>
                    <span>Funciones RPC de Supabase con seguridad SECURITY DEFINER para control de roles</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">🗄️</span>
                    <span>Campos adicionales: contacted, asesor_asignado_id, tags en tabla user_vehicles_for_sale</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Version 1.5.0 */}
          <div className="border-l-4 border-orange-500 pl-8">
            <div className="flex flex-wrap items-center gap-3 mb-6">
              <h2 className="text-3xl font-bold text-gray-900">v1.5.0</h2>
              <span className="bg-purple-100 text-purple-700 px-4 py-1 rounded-full text-sm font-bold">
                Constructor de Landing Pages
              </span>
              <span className="bg-gray-100 px-4 py-1 rounded-full text-sm text-gray-600">
                28 de Octubre, 2025
              </span>
            </div>

            <div className="space-y-8">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-lg text-xs font-bold uppercase">
                    Nueva Funcionalidad
                  </span>
                  <h3 className="text-xl font-semibold">Generador de Landing Pages con IA</h3>
                </div>
                <ul className="space-y-3">
                  <li className="flex gap-3">
                    <span className="text-orange-500 text-xl">🎨</span>
                    <div className="flex-1">
                      <strong>Constructor Visual de Componentes</strong>
                      <p className="text-gray-600 text-sm mt-1">
                        Sistema completo de construcción de landing pages con 5 tipos de componentes reutilizables:
                        Heroes, Secciones, Features, Carruseles y Comparaciones. Cada tipo ofrece múltiples layouts
                        (16 variaciones en total) para crear páginas únicas y profesionales.
                      </p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-orange-500 text-xl">🤖</span>
                    <div className="flex-1">
                      <strong>Generación de Contenido con Google Gemini AI</strong>
                      <p className="text-gray-600 text-sm mt-1">
                        Integración con Google Generative AI (Gemini) para generar automáticamente textos e imágenes.
                        Los usuarios pueden describir su campaña y el sistema genera headlines, párrafos, CTAs e imágenes
                        optimizadas con IA. También incluye generación de videos con Veo 3.1.
                      </p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-orange-500 text-xl">📱</span>
                    <div className="flex-1">
                      <strong>Diseño 100% Responsivo</strong>
                      <p className="text-gray-600 text-sm mt-1">
                        Todos los 16 templates optimizados para móviles, tablets y desktop. Tipografía escalable,
                        layouts adaptables que se apilan verticalmente en móvil, y espaciado progresivo según el
                        tamaño de pantalla. Las páginas se ven perfectas en cualquier dispositivo.
                      </p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-orange-500 text-xl">🔗</span>
                    <div className="flex-1">
                      <strong>Publicación con Slugs Personalizados</strong>
                      <p className="text-gray-600 text-sm mt-1">
                        Publica landing pages en URLs personalizadas (ej: /promo-especial, /oferta-navidad).
                        Sistema de validación de slugs, meta tags para SEO, y seguimiento de vistas. Las páginas
                        se renderizan con el MainLayout completo de TREFA (navbar y footer).
                      </p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-orange-500 text-xl">💾</span>
                    <div className="flex-1">
                      <strong>Persistencia en Supabase</strong>
                      <p className="text-gray-600 text-sm mt-1">
                        Sistema de base de datos completo con tablas landing_pages y landing_page_components.
                        RLS policies para control de acceso admin-only, funciones PostgreSQL para operaciones optimizadas,
                        y gestión completa de CRUD (crear, leer, actualizar, duplicar, archivar, eliminar).
                      </p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-orange-500 text-xl">🎯</span>
                    <div className="flex-1">
                      <strong>Imágenes Orientadas a Familias</strong>
                      <p className="text-gray-600 text-sm mt-1">
                        Todas las imágenes placeholder reemplazadas con autos familiares (SUVs y sedanes)
                        de Unsplash, alineadas con los valores de marca de TREFA: familia, seguridad y accesibilidad.
                        Sin asociación con autos de lujo, deportivos o carreras.
                      </p>
                    </div>
                  </li>
                </ul>
              </div>

              <div>
                <div className="flex items-center gap-3 mb-4">
                  <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-lg text-xs font-bold uppercase">
                    Acceso
                  </span>
                  <h3 className="text-xl font-semibold">Integración con Marketing Hub</h3>
                </div>
                <ul className="space-y-3">
                  <li className="flex gap-3">
                    <span className="text-orange-500 text-xl">🚀</span>
                    <div className="flex-1">
                      <strong>Acceso desde el Hub de Marketing</strong>
                      <p className="text-gray-600 text-sm mt-1">
                        Nueva sección "Generador de Landing Pages" en el Marketing Hub (/escritorio/marketing)
                        reemplazando el bloque de Analytics. Constructor accesible en /escritorio/marketing/constructor
                        con permisos de admin únicamente.
                      </p>
                    </div>
                  </li>
                </ul>
              </div>

              <div>
                <div className="flex items-center gap-3 mb-4">
                  <span className="bg-green-100 text-green-800 px-3 py-1 rounded-lg text-xs font-bold uppercase">
                    Mejoras y Correcciones
                  </span>
                  <h3 className="text-xl font-semibold">Constructor Mejorado</h3>
                </div>
                <ul className="space-y-3">
                  <li className="flex gap-3">
                    <span className="text-orange-500 text-xl">✅</span>
                    <div className="flex-1">
                      <strong>Campo de Título Añadido</strong>
                      <p className="text-gray-600 text-sm mt-1">
                        Corregido error de base de datos "null value of title violates not-null constraint". Ahora se requiere
                        un título al publicar landing pages, eliminando el error de validación de la base de datos.
                      </p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-orange-500 text-xl">📱</span>
                    <div className="flex-1">
                      <strong>Vista Previa Móvil con Container Queries</strong>
                      <p className="text-gray-600 text-sm mt-1">
                        Implementados CSS Container Queries en los 16 templates para que respondan correctamente a la vista
                        previa móvil de 375px. Ya no es necesario usar la emulación de dispositivo del navegador - la vista
                        previa ahora funciona perfectamente desde escritorio.
                      </p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-orange-500 text-xl">🔍</span>
                    <div className="flex-1">
                      <strong>Generación Automática de SEO</strong>
                      <p className="text-gray-600 text-sm mt-1">
                        Sistema de generación automática de meta tags SEO a partir del contenido de la página. Extrae el título
                        del primer headline, la descripción del primer párrafo (truncado a 160 caracteres), e incluye tags
                        Open Graph (og:title, og:description, og:type, og:url) para compartir en redes sociales.
                      </p>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Version 1.5.1 */}
          <div className="border-l-4 border-orange-500 pl-8">
            <div className="flex flex-wrap items-center gap-3 mb-6">
              <h2 className="text-3xl font-bold text-gray-900">v1.5.1</h2>
              <span className="bg-blue-100 text-blue-700 px-4 py-1 rounded-full text-sm font-bold">
                Mejoras de UX Móvil
              </span>
              <span className="bg-gray-100 px-4 py-1 rounded-full text-sm text-gray-600">
                30 de Octubre, 2025
              </span>
            </div>

            <div className="space-y-8">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <span className="bg-green-100 text-green-800 px-3 py-1 rounded-lg text-xs font-bold uppercase">
                    Mejoras Móviles
                  </span>
                  <h3 className="text-xl font-semibold">Optimización de Experiencia Móvil</h3>
                </div>
                <ul className="space-y-3">
                  <li className="flex gap-3">
                    <span className="text-orange-500 text-xl">📱</span>
                    <div className="flex-1">
                      <strong>Navegación Inferior Inteligente</strong>
                      <p className="text-gray-600 text-sm mt-1">
                        Implementado auto-ocultamiento del bottom navigation cuando aparece el teclado móvil.
                        El sistema detecta focus en inputs/textarea/select y oculta automáticamente la barra inferior
                        para evitar que bloquee los campos del formulario. Incluye scroll automático al elemento enfocado.
                      </p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-orange-500 text-xl">🔍</span>
                    <div className="flex-1">
                      <strong>Barra de Búsqueda Ampliada</strong>
                      <p className="text-gray-600 text-sm mt-1">
                        Optimizado el header móvil con logo más pequeño (h-3.5 vs h-5) para dar más espacio a la barra
                        de búsqueda. Input ampliado con padding py-3 y texto text-base, resultados con thumbnails más
                        grandes (w-20 h-16), texto más legible, y mejor feedback visual con estados active.
                      </p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-orange-500 text-xl">⚡</span>
                    <div className="flex-1">
                      <strong>Scroll Instantáneo en Detalle de Auto</strong>
                      <p className="text-gray-600 text-sm mt-1">
                        Corregido el comportamiento de scroll to top en VehicleDetailPage. Cambiado de smooth scroll
                        a instant scroll (window.scrollTo(0, 0)) para mejor rendimiento móvil. Elimina el problema de
                        scroll lento e incompleto en dispositivos móviles.
                      </p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-orange-500 text-xl">🖼️</span>
                    <div className="flex-1">
                      <strong>Botón de Cerrar Lightbox Visible</strong>
                      <p className="text-gray-600 text-sm mt-1">
                        Mejorado el botón de cerrar en el visor de imágenes (Lightbox) con fondo más oscuro
                        (bg-black/60), borde, sombra y backdrop-blur para mejor contraste. Tamaño responsivo
                        (w-8 h-8 móvil, w-10 h-10 desktop) y posicionamiento optimizado (top-4 right-4 móvil).
                      </p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-orange-500 text-xl">📐</span>
                    <div className="flex-1">
                      <strong>Títulos de Sección Responsivos</strong>
                      <p className="text-gray-600 text-sm mt-1">
                        Ajustados todos los títulos de sección en VehicleDetailPage a tamaños responsivos apropiados.
                        "Características" y "Descripción" ahora usan text-xl sm:text-2xl, "También te puede interesar"
                        usa text-2xl lg:text-3xl, y carruseles tienen text-xl sm:text-2xl lg:text-3xl.
                      </p>
                    </div>
                  </li>
                </ul>
              </div>

              <div>
                <div className="flex items-center gap-3 mb-4">
                  <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-lg text-xs font-bold uppercase">
                    Nueva Funcionalidad
                  </span>
                  <h3 className="text-xl font-semibold">Landing Page y CRM</h3>
                </div>
                <ul className="space-y-3">
                  <li className="flex gap-3">
                    <span className="text-orange-500 text-xl">🎨</span>
                    <div className="flex-1">
                      <strong>Nueva Landing Page Disponible en /landing</strong>
                      <p className="text-gray-600 text-sm mt-1">
                        Nueva landing page adaptable disponible en /landing para personalización y campañas.
                        Landing page original preservada como LandingPageOriginal.tsx.
                      </p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-orange-500 text-xl">👥</span>
                    <div className="flex-1">
                      <strong>Página de CRM Actualizada con Estatus de Aplicaciones</strong>
                      <p className="text-gray-600 text-sm mt-1">
                        SimpleCRMPage mejorada con visualización clara del estatus de aplicaciones.
                        Navegación actualizada para mejor acceso a funciones de gestión de leads.
                      </p>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Version 1.4.2 */}
          <div className="border-l-4 border-orange-500 pl-8">
            <div className="flex flex-wrap items-center gap-3 mb-6">
              <h2 className="text-3xl font-bold text-gray-900">v1.4.2</h2>
              <span className="bg-green-100 text-green-700 px-4 py-1 rounded-full text-sm font-bold">
                Seguimiento & Acceso
              </span>
              <span className="bg-gray-100 px-4 py-1 rounded-full text-sm text-gray-600">
                28 de Octubre, 2025
              </span>
            </div>

            <div className="space-y-8">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-lg text-xs font-bold uppercase">
                    Marketing
                  </span>
                  <h3 className="text-xl font-semibold">Seguimiento Comprensivo de Referencias</h3>
                </div>
                <ul className="space-y-3">
                  <li className="flex gap-3">
                    <span className="text-orange-500 text-xl">🎯</span>
                    <div className="flex-1">
                      <strong>Captura Completa de Parámetros UTM</strong>
                      <p className="text-gray-600 text-sm mt-1">
                        El sistema ahora captura todos los parámetros de seguimiento al momento del registro: utm_source, utm_medium,
                        utm_campaign, utm_term, utm_content, fbclid (Facebook Click ID), rfdm, source, y ordencompra. Los datos se
                        almacenan en el campo metadata del perfil en formato JSONB.
                      </p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-orange-500 text-xl">📊</span>
                    <div className="flex-1">
                      <strong>Atribución de Fuente con Prioridad</strong>
                      <p className="text-gray-600 text-sm mt-1">
                        Implementación de lógica de prioridad para determinar la fuente principal: fbclid &gt; utm_source &gt; rfdm &gt;
                        source &gt; ordencompra. La fuente principal se guarda en el campo 'source' del perfil para análisis rápido.
                      </p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-orange-500 text-xl">💾</span>
                    <div className="flex-1">
                      <strong>Persistencia en Múltiples Puntos</strong>
                      <p className="text-gray-600 text-sm mt-1">
                        Los datos de seguimiento se capturan en tres puntos: LeadSourceHandler (parámetros URL), AuthPage
                        (página de registro), y AuthContext (creación de perfil). Se usa sessionStorage para persistir
                        temporalmente antes de guardar permanentemente en la base de datos.
                      </p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-orange-500 text-xl">📈</span>
                    <div className="flex-1">
                      <strong>Visualización en CRM</strong>
                      <p className="text-gray-600 text-sm mt-1">
                        El CRM ahora muestra la fuente de cada lead y permite ordenar/filtrar por fuente. Los datos completos
                        de seguimiento están disponibles en el campo metadata para análisis detallado de campañas.
                      </p>
                    </div>
                  </li>
                </ul>
              </div>

              <div>
                <div className="flex items-center gap-3 mb-4">
                  <span className="bg-red-100 text-red-800 px-3 py-1 rounded-lg text-xs font-bold uppercase">
                    Corrección Crítica
                  </span>
                  <h3 className="text-xl font-semibold">Corrección de Acceso a Solicitudes</h3>
                </div>
                <ul className="space-y-3">
                  <li className="flex gap-3">
                    <span className="text-orange-500 text-xl">🚪</span>
                    <div className="flex-1">
                      <strong>Eliminación de Requisitos de Dirección</strong>
                      <p className="text-gray-600 text-sm mt-1">
                        CRÍTICO: Los usuarios no podían acceder a la página de solicitud después de que los campos de dirección
                        (address, city, state, zip_code) se movieron del perfil al formulario de aplicación. La validación de
                        completitud del perfil aún requería estos campos.
                      </p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-orange-500 text-xl">✅</span>
                    <div className="flex-1">
                      <strong>Validación Actualizada</strong>
                      <p className="text-gray-600 text-sm mt-1">
                        Se actualizó checkApplicationProfileCompleteness() en AuthHandler.tsx para solo requerir campos
                        de identidad: first_name, last_name, mother_last_name, phone, birth_date, homoclave, fiscal_situation,
                        civil_status, y rfc. Los campos de dirección ahora se completan dentro del formulario de aplicación.
                      </p>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Version 1.4.1 */}
          <div className="border-l-4 border-orange-500 pl-8">
            <div className="flex flex-wrap items-center gap-3 mb-6">
              <h2 className="text-3xl font-bold text-gray-900">v1.4.1</h2>
              <span className="bg-green-100 text-green-700 px-4 py-1 rounded-full text-sm font-bold">
                Mejoras CRM & Solicitudes
              </span>
              <span className="bg-gray-100 px-4 py-1 rounded-full text-sm text-gray-600">
                28 de Octubre, 2025
              </span>
            </div>

            <div className="space-y-8">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-lg text-xs font-bold uppercase">
                    Mejoras CRM
                  </span>
                  <h3 className="text-xl font-semibold">Página de Perfil de Cliente Mejorada</h3>
                </div>
                <ul className="space-y-3">
                  <li className="flex gap-3">
                    <span className="text-orange-500 text-xl">💳</span>
                    <div className="flex-1">
                      <strong>Perfilación Bancaria</strong>
                      <p className="text-gray-600 text-sm mt-1">
                        Nuevo resumen de perfilación bancaria debajo de la tarjeta de contacto, mostrando el banco recomendado en negrita,
                        banco principal, cuentas de ahorro, tarjetas de crédito e institución de crédito.
                      </p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-orange-500 text-xl">📧</span>
                    <div className="flex-1">
                      <strong>Historial de Notificaciones</strong>
                      <p className="text-gray-600 text-sm mt-1">
                        Nuevo componente que muestra todas las notificaciones por email enviadas al lead históricamente,
                        incluyendo tipo de notificación, asunto, fecha y estado (enviado/fallido).
                      </p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-orange-500 text-xl">🎯</span>
                    <div className="flex-1">
                      <strong>Fuente del Lead Mejorada</strong>
                      <p className="text-gray-600 text-sm mt-1">
                        La sección "Fuente del Lead" ahora muestra información detallada: origen del registro, referencia (rfdm),
                        auto de interés (ordencompra), Facebook Click ID (fbclid), y todos los parámetros UTM (source, medium, campaign, etc).
                      </p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-orange-500 text-xl">📋</span>
                    <div className="flex-1">
                      <strong>Solicitud Imprimible Mejorada</strong>
                      <p className="text-gray-600 text-sm mt-1">
                        Correcciones en campos que no se poblaban: Número de Dependientes, Nivel de Estudios, Ingreso Neto (ya no muestra NaN).
                        Se removieron campos: CURP, Lugar de Nacimiento, Nacionalidad, Renta Mensual, Extensión, Otros Ingresos Mensuales.
                        Se agregaron: Nombre del Cónyugue, Perfilación Bancaria completa, Asesor Asignado en el header.
                        La dirección actual ahora se obtiene correctamente del perfil. Nombres y estado civil normalizados.
                      </p>
                    </div>
                  </li>
                </ul>
              </div>

              <div>
                <div className="flex items-center gap-3 mb-4">
                  <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-lg text-xs font-bold uppercase">
                    Mejoras de Flujo de Usuario
                  </span>
                  <h3 className="text-xl font-semibold">Optimización del Proceso de Solicitud</h3>
                </div>
                <ul className="space-y-3">
                  <li className="flex gap-3">
                    <span className="text-orange-500 text-xl">📍</span>
                    <div className="flex-1">
                      <strong>Campos de Dirección Movidos a Solicitud</strong>
                      <p className="text-gray-600 text-sm mt-1">
                        Los campos de dirección (Calle y Número, Colonia, Ciudad, Estado, Código Postal) fueron removidos del
                        formulario "Mi Perfil" y ahora se encuentran únicamente en el formulario de Solicitud. Los datos de dirección
                        se guardan automáticamente en el perfil al enviar la solicitud, permitiendo su reutilización en futuras solicitudes
                        con la opción "Utilizar una dirección distinta".
                      </p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-orange-500 text-xl">📄</span>
                    <div className="flex-1">
                      <strong>Carga de Documentos Ahora es Opcional</strong>
                      <p className="text-gray-600 text-sm mt-1">
                        La sección de "Subir Documentos" en la solicitud ya no es obligatoria. Los usuarios pueden enviar su solicitud
                        sin documentos y cargarlos posteriormente desde el dashboard a través del widget "Upload Documents". Se agregó
                        un mensaje informativo azul explicando que los documentos son opcionales y pueden subirse después.
                      </p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-orange-500 text-xl">🏦</span>
                    <div className="flex-1">
                      <strong>Corrección en Validación de Perfilación Bancaria</strong>
                      <p className="text-gray-600 text-sm mt-1">
                        Se corrigió el error que impedía acceder a la perfilación bancaria después de completar el perfil personal.
                        La validación ahora solo verifica los campos esenciales del perfil (nombre, apellidos, teléfono, fecha de nacimiento,
                        RFC, situación fiscal, estado civil) sin requerir los campos de dirección que fueron movidos al formulario de solicitud.
                      </p>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Version 1.4.0 */}
          <div className="border-l-4 border-orange-500 pl-8">
            <div className="flex flex-wrap items-center gap-3 mb-6">
              <h2 className="text-3xl font-bold text-gray-900">v1.4.0</h2>
              <span className="bg-gray-100 px-4 py-1 rounded-full text-sm text-gray-600">
                26 de Octubre, 2025
              </span>
            </div>

            <div className="space-y-8">
              {/* New Features */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-lg text-xs font-bold uppercase">
                    Nueva Funcionalidad
                  </span>
                  <h3 className="text-xl font-semibold">Sistema de Visualización Completa de Solicitudes</h3>
                </div>
                <ul className="space-y-3">
                  <li className="flex gap-3">
                    <span className="text-orange-500 text-xl">📋</span>
                    <div className="flex-1">
                      <strong>Vista previa completa de solicitudes en perfil de leads</strong>
                      <p className="text-gray-600 text-sm mt-1">
                        La página de perfil de clientes (/escritorio/admin/cliente/:id) ahora muestra toda la información
                        de la solicitud directamente en la página sin necesidad de abrir un modal. Incluye información
                        personal completa (CURP, lugar de nacimiento, nacionalidad), direcciones actual y anterior,
                        detalles laborales con formato de moneda, referencias personales, banco recomendado, y notas
                        adicionales. Todo en un diseño profesional compacto que cabe en una sola página.
                      </p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-orange-500 text-xl">📥</span>
                    <div className="flex-1">
                      <strong>Botones prominentes de descarga e impresión</strong>
                      <p className="text-gray-600 text-sm mt-1">
                        Se agregaron botones destacados con estilos de gradiente para "Descargar Solicitud (PDF)" y
                        "Imprimir". El botón de descarga utiliza html2canvas y jspdf para generar PDFs de alta calidad
                        de forma dinámica. Ambos botones son totalmente responsivos y cuentan con efectos hover
                        atractivos.
                      </p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-orange-500 text-xl">🔄</span>
                    <div className="flex-1">
                      <strong>Soporte para múltiples solicitudes</strong>
                      <p className="text-gray-600 text-sm mt-1">
                        Si un usuario tiene múltiples solicitudes, se puede seleccionar cuál ver mediante un dropdown
                        selector. El estado de la solicitud también es editable directamente desde la vista previa.
                      </p>
                    </div>
                  </li>
                </ul>
              </div>

              {/* Bug Fixes */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <span className="bg-red-100 text-red-800 px-3 py-1 rounded-lg text-xs font-bold uppercase">
                    Correcciones
                  </span>
                  <h3 className="text-xl font-semibold">Correcciones Críticas de Bugs</h3>
                </div>
                <ul className="space-y-3">
                  <li className="flex gap-3">
                    <span className="text-orange-500 text-xl">🖼️</span>
                    <div className="flex-1">
                      <strong>Visualización de imágenes de Car Studio en tarjetas de autos</strong>
                      <p className="text-gray-600 text-sm mt-1">
                        Se corrigió el problema donde las imágenes procesadas por Car Studio AI no se mostraban en las
                        tarjetas de autos. El getVehicleImage utility ahora prioriza car_studio_feature_image y
                        car_studio_gallery cuando la bandera use_car_studio_images está activada, afectando tanto la
                        vista de lista como la vista de cuadrícula.
                      </p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-orange-500 text-xl">🎨</span>
                    <div className="flex-1">
                      <strong>Mejora visual del borde de tarjetas populares</strong>
                      <p className="text-gray-600 text-sm mt-1">
                        Se mejoró el efecto de borde gradiente animado para autos con 1000+ visitas. Ahora utiliza
                        colores más pronunciados (naranja, ámbar oscuro, rojo-naranja) con animación de pulso y brillo
                        para mayor visibilidad, similar al efecto de la barra de búsqueda.
                      </p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-orange-500 text-xl">🔐</span>
                    <div className="flex-1">
                      <strong>Autenticación requerida para vender autos en línea</strong>
                      <p className="text-gray-600 text-sm mt-1">
                        Se implementó validación de autenticación antes de continuar con el proceso de venta en línea.
                        Los datos de valuación se preservan durante el flujo de inicio de sesión usando localStorage,
                        con redirección automática después de autenticación exitosa.
                      </p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-orange-500 text-xl">✅</span>
                    <div className="flex-1">
                      <strong>Validación amigable de kilometraje en formulario de valuación</strong>
                      <p className="text-gray-600 text-sm mt-1">
                        Se agregó límite de 99,999 km en el formulario de valuación con mensaje informativo cuando se
                        excede. El mensaje incluye explicación sobre el límite de 90,000 km para compra, alternativas
                        como Kavak.com, y descarga del Manual de Venta TREFA 2025.
                      </p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-orange-500 text-xl">💾</span>
                    <div className="flex-1">
                      <strong>Manejo de IDs de Airtable en Car Studio</strong>
                      <p className="text-gray-600 text-sm mt-1">
                        Se solucionó el error de casting bigint al guardar imágenes de Car Studio. ImageService ahora
                        detecta si vehicleId es un ID de Airtable (string que inicia con "rec") y usa la columna
                        airtable_id en lugar de id (bigint) para evitar errores de tipo.
                      </p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-orange-500 text-xl">🔧</span>
                    <div className="flex-1">
                      <strong>Corrección de error en página de Vacantes</strong>
                      <p className="text-gray-600 text-sm mt-1">
                        Se corrigió el error "column reference 'id' is ambiguous" que impedía cargar la lista de vacantes.
                        El problema se debía a una referencia incorrecta a la tabla vacancy_applications en lugar de
                        job_applications en la función de base de datos get_vacancies_with_application_count.
                      </p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-orange-500 text-xl">📋</span>
                    <div className="flex-1">
                      <strong>Corrección de Reportes de Inspección</strong>
                      <p className="text-gray-600 text-sm mt-1">
                        Se solucionó el error "ID de auto no válido" que aparecía al intentar acceder a reportes de
                        inspección. El problema era una discrepancia entre el parámetro de ruta definido como :id y el
                        código que intentaba extraerlo como vehicleId.
                      </p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-orange-500 text-xl">🖼️</span>
                    <div className="flex-1">
                      <strong>Corrección de recorte de imágenes en CarStudio</strong>
                      <p className="text-gray-600 text-sm mt-1">
                        Se cambió la visualización de imágenes en el selector de CarStudio de object-cover a object-contain
                        para evitar el recorte vertical de las fotos de autos y permitir ver la imagen completa antes
                        de procesar con IA.
                      </p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-orange-500 text-xl">🤖</span>
                    <div className="flex-1">
                      <strong>Mejor manejo de errores de CarStudio AI</strong>
                      <p className="text-gray-600 text-sm mt-1">
                        Se agregó manejo robusto de errores para cuando la API de CarStudio devuelve estructuras de
                        respuesta inesperadas. Ahora se muestra información detallada del error incluyendo las claves
                        de respuesta recibidas para facilitar el debugging. Se corrigió el error "NO RESPONSE: AI response
                        parsing failed" con mensajes informativos.
                      </p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-orange-500 text-xl">🎯</span>
                    <div className="flex-1">
                      <strong>Asignación manual de posiciones de imágenes en CarStudio</strong>
                      <p className="text-gray-600 text-sm mt-1">
                        Se implementó un sistema de asignación manual de posiciones (FRONT, BACK, LEFT, RIGHT, FRONT_LEFT,
                        FRONT_RIGHT, BACK_LEFT, BACK_RIGHT) para cada imagen seleccionada. Ahora los usuarios pueden elegir
                        explícitamente qué posición corresponde a cada imagen mediante dropdowns, en lugar de depender del
                        orden de selección automático.
                      </p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-orange-500 text-xl">📥</span>
                    <div className="flex-1">
                      <strong>Corrección de enlace de descarga del Manual 2025</strong>
                      <p className="text-gray-600 text-sm mt-1">
                        Se actualizó el enlace de descarga del Manual de Venta TREFA 2025 en el Dashboard para apuntar
                        correctamente a /Manual-Venta-TREFA-2025.pdf en lugar de la ruta incorrecta /public/manual-venta-TREFA.pdf.
                      </p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-orange-500 text-xl">🔄</span>
                    <div className="flex-1">
                      <strong>Corrección de sincronización de campo "Separado" desde Airtable</strong>
                      <p className="text-gray-600 text-sm mt-1">
                        Se mejoró la función de sincronización airtable-sync para manejar correctamente cualquier valor truthy
                        del campo "Separado" (no solo booleanos estrictos). Esto resuelve el problema donde autos marcados
                        como separados en Airtable no se reflejaban correctamente en la base de datos.
                      </p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-orange-500 text-xl">🎨</span>
                    <div className="flex-1">
                      <strong>Corrección de visibilidad de bordes animados en autos populares</strong>
                      <p className="text-gray-600 text-sm mt-1">
                        Se corrigió el problema de z-index que impedía ver los bordes gradientes animados en autos con
                        1000+ visitas. La solución utiliza negative z-index con isolation context para garantizar que el borde
                        se muestre detrás del contenido pero por encima del fondo.
                      </p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-orange-500 text-xl">💾</span>
                    <div className="flex-1">
                      <strong>Corrección de error al guardar imágenes en Car Studio</strong>
                      <p className="text-gray-600 text-sm mt-1">
                        Se solucionó el error "No se pudo guardar las nuevas imágenes en el registro del auto" convirtiendo
                        el array de URLs a formato comma-separated string para el campo fotos_exterior_url (tipo TEXT), mientras
                        se mantiene el formato JSONB array para galeria_exterior.
                      </p>
                    </div>
                  </li>
                </ul>
              </div>

              {/* CRM Enhancements */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-lg text-xs font-bold uppercase">
                    Mejora
                  </span>
                  <h3 className="text-xl font-semibold">Mejoras al CRM de Leads</h3>
                </div>
                <ul className="space-y-3">
                  <li className="flex gap-3">
                    <span className="text-orange-500 text-xl">✓</span>
                    <div className="flex-1">
                      <strong>Ordenamiento multi-columna con indicadores visuales</strong>
                      <p className="text-gray-600 text-sm mt-1">
                        Se agregó funcionalidad de ordenamiento por nombre, email, fecha de creación, última actualización,
                        último inicio de sesión, estatus y fuente. Los usuarios pueden hacer clic en los encabezados de las
                        columnas para ordenar de forma ascendente o descendente, con indicadores de flechas visibles.
                      </p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-orange-500 text-xl">📅</span>
                    <div className="flex-1">
                      <strong>Nuevas columnas de fechas con formato relativo</strong>
                      <p className="text-gray-600 text-sm mt-1">
                        Se añadieron tres columnas temporales: fecha de creación, última actualización y último inicio de sesión.
                        Las fechas se muestran en formato relativo (ej: "Hace 5 min", "Hace 2h", "Hace 3d") para mejor
                        comprensión de la actividad reciente de los leads.
                      </p>
                    </div>
                  </li>
                </ul>
              </div>

              {/* New Pages and SEO */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <span className="bg-green-100 text-green-800 px-3 py-1 rounded-lg text-xs font-bold uppercase">
                    Nueva Página
                  </span>
                  <h3 className="text-xl font-semibold">Nuevas Páginas Institucionales y Mejoras SEO</h3>
                </div>
                <ul className="space-y-3">
                  <li className="flex gap-3">
                    <span className="text-orange-500 text-xl">🏢</span>
                    <div className="flex-1">
                      <strong>Página "Conócenos" (/conocenos)</strong>
                      <p className="text-gray-600 text-sm mt-1">
                        Se creó una página institucional completa con la misión, valores (Transparencia, Calidad Certificada,
                        Servicio Personalizado, Financiamiento Ágil), historia de la empresa (2020-2023) con timeline visual,
                        y sección de equipo. Incluye CTAs a inventario y venta de autos. Diseño responsive con gradientes
                        naranja-ámbar característicos de TREFA y optimización SEO completa.
                      </p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-orange-500 text-xl">📞</span>
                    <div className="flex-1">
                      <strong>Página "Contacto" (/contacto)</strong>
                      <p className="text-gray-600 text-sm mt-1">
                        Se desarrolló una página de contacto con múltiples métodos de comunicación (WhatsApp, teléfono, email)
                        con botones de acción directa. Incluye información de ubicación, horarios de atención (Lun-Dom),
                        sección de FAQ con preguntas frecuentes, e imagen del equipo de atención. Totalmente responsive con
                        optimización SEO y meta tags Open Graph para compartir en redes sociales.
                      </p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-orange-500 text-xl">🔗</span>
                    <div className="flex-1">
                      <strong>Redirects SEO para URLs heredadas</strong>
                      <p className="text-gray-600 text-sm mt-1">
                        Se agregaron cuatro redirects 301 en RedirectService: /vende-tu-auto → /vender-mi-auto,
                        /inventario-trefa → /autos, /trefa-inventario → /autos, /inventario → /autos. Estos redirects
                        preservan el SEO de URLs antiguas y mejoran la experiencia del usuario.
                      </p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-orange-500 text-xl">🎯</span>
                    <div className="flex-1">
                      <strong>SEO mejorado para página /vender-mi-auto</strong>
                      <p className="text-gray-600 text-sm mt-1">
                        Se optimizó completamente el SEO de GetAQuotePage con título localizado ("Vende tu Auto Usado en
                        Monterrey | Recibe una Oferta en 24 Horas"), descripción extendida de 200+ caracteres con keywords
                        locales, canonical URL, y meta tags Open Graph. Incluye keywords optimizados para búsquedas locales
                        en Monterrey.
                      </p>
                    </div>
                  </li>
                </ul>
              </div>

              {/* Email Notification System */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-lg text-xs font-bold uppercase">
                    Nueva Característica
                  </span>
                  <h3 className="text-xl font-semibold">Sistema de Notificaciones por Email con Brevo</h3>
                </div>
                <ul className="space-y-3">
                  <li className="flex gap-3">
                    <span className="text-orange-500 text-xl">📧</span>
                    <div className="flex-1">
                      <strong>Notificaciones automáticas al enviar solicitud de financiamiento</strong>
                      <p className="text-gray-600 text-sm mt-1">
                        Cuando un cliente envía una solicitud de financiamiento, el sistema ahora envía automáticamente
                        tres tipos de notificaciones: (1) confirmación al cliente con enlace de seguimiento, (2) alerta
                        a todos los administradores con detalles del cliente y enlace al perfil, y (3) notificación al
                        asesor de ventas asignado con acceso directo al perfil del cliente.
                      </p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-orange-500 text-xl">🔧</span>
                    <div className="flex-1">
                      <strong>Servicio centralizado BrevoEmailService</strong>
                      <p className="text-gray-600 text-sm mt-1">
                        Se creó un servicio wrapper (BrevoEmailService.ts) que centraliza toda la lógica de envío de
                        emails vía Brevo. Incluye métodos especializados para diferentes tipos de notificaciones y
                        manejo de errores robusto. Lista de administradores incluye: marianomorales@outlook.com,
                        mariano.morales@autostrefa.mx, genauservices@gmail.com, alejandro.trevino@autostrefa.mx,
                        evelia.castillo@autostrefa.mx, fernando.trevino@autostrefa.mx.
                      </p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-orange-500 text-xl">📬</span>
                    <div className="flex-1">
                      <strong>Template HTML para notificaciones administrativas</strong>
                      <p className="text-gray-600 text-sm mt-1">
                        Se añadió un nuevo template "admin_notification" en la Edge Function send-brevo-email con diseño
                        responsive y branded de TREFA. El template incluye información del cliente, auto de interés,
                        asesor asignado, próximas acciones recomendadas, y botón de acceso directo al perfil.
                      </p>
                    </div>
                  </li>
                </ul>
              </div>

              {/* Liquid Glass UI & Animated Blobs */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-lg text-xs font-bold uppercase">
                    Nueva Característica
                  </span>
                  <h3 className="text-xl font-semibold">Interfaz Liquid Glass con Blobs Animados</h3>
                </div>
                <ul className="space-y-3">
                  <li className="flex gap-3">
                    <span className="text-orange-500 text-xl">✨</span>
                    <div className="flex-1">
                      <strong>Efecto de vidrio líquido en tarjetas de autos</strong>
                      <p className="text-gray-600 text-sm mt-1">
                        Las tarjetas de autos ahora tienen un elegante efecto glassmorphism con fondo semi-transparente
                        (85% opacidad), backdrop-filter blur de 20px, y bordes sutiles. El efecto mantiene excelente
                        legibilidad del texto mientras añade profundidad visual y modernidad al diseño.
                      </p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-orange-500 text-xl">🎨</span>
                    <div className="flex-1">
                      <strong>Blobs de gradiente animados en el fondo</strong>
                      <p className="text-gray-600 text-sm mt-1">
                        Se añadieron tres blobs de gradiente de colores (naranja-rojo, azul-púrpura, verde-azul) que se
                        mueven muy lentamente en el fondo (70-90 segundos por ciclo). Los blobs están estirados
                        diagonalmente y usan transformaciones complejas (translate, rotate, scale) para crear movimiento
                        orgánico y elegante que no distrae de los autos.
                      </p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-orange-500 text-xl">🌟</span>
                    <div className="flex-1">
                      <strong>Badges para autos populares y recién llegados</strong>
                      <p className="text-gray-600 text-sm mt-1">
                        Los autos con 1000+ visitas ahora muestran un borde gradiente animado (popular-card class) que
                        usa isolation context y negative z-index para visibilidad correcta. Los autos agregados en los
                        últimos 3 días muestran un badge "¡Recién llegado!" en gradiente naranja-rojo con icono de estrella.
                      </p>
                    </div>
                  </li>
                </ul>
              </div>

              {/* Car Studio Improvements */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-lg text-xs font-bold uppercase">
                    Mejora
                  </span>
                  <h3 className="text-xl font-semibold">Mejoras a Car Studio API</h3>
                </div>
                <ul className="space-y-3">
                  <li className="flex gap-3">
                    <span className="text-orange-500 text-xl">📸</span>
                    <div className="flex-1">
                      <strong>JPG como formato de imagen predeterminado</strong>
                      <p className="text-gray-600 text-sm mt-1">
                        Se cambió el formato predeterminado de PNG a JPG en CarStudioPage para mejor rendimiento. Los
                        archivos JPG son significativamente más pequeños y rápidos de procesar, mejorando los tiempos de
                        carga y procesamiento sin sacrificar calidad visual apreciable.
                      </p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-orange-500 text-xl">🔍</span>
                    <div className="flex-1">
                      <strong>Visor de comparación más grande</strong>
                      <p className="text-gray-600 text-sm mt-1">
                        Se aumentó significativamente el tamaño del visor de comparación: las imágenes individuales pasaron
                        de 128px (h-32) a 384px (h-96) de altura, y el contenedor principal de 320px (max-h-80) a 800px
                        (max-h-[800px]). Esto permite una revisión de calidad mucho más detallada antes de guardar.
                      </p>
                    </div>
                  </li>
                </ul>
              </div>

              {/* Sitemap Generation System */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-lg text-xs font-bold uppercase">
                    Nueva Característica
                  </span>
                  <h3 className="text-xl font-semibold">Sistema de Generación Automática de Sitemap</h3>
                </div>
                <ul className="space-y-3">
                  <li className="flex gap-3">
                    <span className="text-orange-500 text-xl">🗺️</span>
                    <div className="flex-1">
                      <strong>Actualización diaria automática del sitemap</strong>
                      <p className="text-gray-600 text-sm mt-1">
                        El sistema genera automáticamente un sitemap.xml actualizado cada día consultando la Edge Function
                        rapid-processor. El sitemap incluye todas las páginas estáticas de la plataforma y URLs dinámicas
                        para cada auto activo en inventario, con prioridades y frecuencias de cambio optimizadas.
                      </p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-orange-500 text-xl">🚀</span>
                    <div className="flex-1">
                      <strong>Beneficios SEO y de rendimiento</strong>
                      <p className="text-gray-600 text-sm mt-1">
                        La generación automática de sitemap mejora significativamente el SEO al facilitar que los motores
                        de búsqueda descubran e indexen todas las páginas de autos. El proceso usa datos cacheados de
                        rapid-processor (inventario_cache) para generación rápida sin impactar la base de datos principal.
                        Los autos nuevos aparecen en el sitemap automáticamente al día siguiente de ser agregados.
                      </p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-orange-500 text-xl">📋</span>
                    <div className="flex-1">
                      <strong>Integración con rapid-processor</strong>
                      <p className="text-gray-600 text-sm mt-1">
                        El sistema consulta rapid-processor/sitemap-data que retorna slugs y fechas de última modificación
                        de todos los autos activos. Esto garantiza que el sitemap siempre refleje el estado actual del
                        inventario, con URLs válidas y metadata precisa para mejorar la tasa de indexación.
                      </p>
                    </div>
                  </li>
                </ul>
              </div>

              {/* Edge Function Cleanup */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-lg text-xs font-bold uppercase">
                    Optimización
                  </span>
                  <h3 className="text-xl font-semibold">Limpieza de Edge Functions Redundantes</h3>
                </div>
                <ul className="space-y-3">
                  <li className="flex gap-3">
                    <span className="text-orange-500 text-xl">🗑️</span>
                    <div className="flex-1">
                      <strong>Eliminadas 7 funciones no utilizadas o redundantes</strong>
                      <p className="text-gray-600 text-sm mt-1">
                        Se identificaron y eliminaron las siguientes Edge Functions que no están en uso o tienen
                        funcionalidad redundante: swift-responder (usaba Supabase Storage en lugar de R2),
                        rapid-vehicles-sync-ts (duplicada), cron-swift-responder-trigger (trigger de función eliminada),
                        smooth-handler (redundante con rapid-processor), get-thumbnails (usaba tabla deprecada
                        autos_normalizados_cache), facebook-catalogue-csv y api-facebook-catalogue-csv (tabla vacía sin uso).
                      </p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-orange-500 text-xl">⚡</span>
                    <div className="flex-1">
                      <strong>Flujo simplificado: airtable-sync → rapid-processor → frontend</strong>
                      <p className="text-gray-600 text-sm mt-1">
                        El sistema ahora opera con un pipeline claro y optimizado: Airtable envía webhooks a airtable-sync,
                        que sincroniza datos con inventario_cache, rapid-processor sirve la API pública de autos,
                        y el frontend consume directamente esta API. Esto reduce complejidad y mejora mantenibilidad.
                      </p>
                    </div>
                  </li>
                </ul>
              </div>

              {/* Cloudflare R2 Migration */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-lg text-xs font-bold uppercase">
                    Mejora
                  </span>
                  <h3 className="text-xl font-semibold">Migración de Imágenes a Cloudflare R2</h3>
                </div>
                <ul className="space-y-3">
                  <li className="flex gap-3">
                    <span className="text-orange-500 text-xl">☁️</span>
                    <div className="flex-1">
                      <strong>Implementación de AWS Signature V4 para autenticación con R2</strong>
                      <p className="text-gray-600 text-sm mt-1">
                        Se creó el helper r2-helper.ts que implementa el proceso completo de firma AWS Signature V4
                        para uploads a Cloudflare R2. Incluye funciones de hashing SHA256, HMAC-SHA256, generación
                        de llaves de firma, construcción de solicitudes canónicas, y cálculo de la firma de autorización.
                        Todo implementado directamente en Deno sin dependencias externas de SDK.
                      </p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-orange-500 text-xl">📤</span>
                    <div className="flex-1">
                      <strong>Upload concurrente con rate limiting (max 3 simultáneos)</strong>
                      <p className="text-gray-600 text-sm mt-1">
                        La función uploadImagesToR2 procesa imágenes en batches de 3 uploads concurrentes para evitar
                        sobrecargar la API de R2 mientras mantiene buen rendimiento. Las imágenes se organizan por
                        categoría (feature, exterior, interior) en rutas como vehicles/ORDEN/categoria/archivo.jpg.
                        Nombres de archivo se limpian automáticamente de caracteres especiales.
                      </p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-orange-500 text-xl">🔄</span>
                    <div className="flex-1">
                      <strong>Integración en airtable-sync con descarga desde Airtable</strong>
                      <p className="text-gray-600 text-sm mt-1">
                        La Edge Function airtable-sync ahora descarga todas las imágenes de autos directamente
                        desde Airtable y las sube a Cloudflare R2 en tiempo real durante la sincronización. Si alguna
                        imagen falla al subirse, el proceso continúa sin interrumpir la sincronización completa. Los
                        URLs de R2 se almacenan en la base de datos (feature_image, fotos_exterior, fotos_interior).
                      </p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-orange-500 text-xl">🔙</span>
                    <div className="flex-1">
                      <strong>Retrocompatibilidad total con URLs existentes</strong>
                      <p className="text-gray-600 text-sm mt-1">
                        La función buildPublicUrl en rapid-processor ahora detecta si el path es una URL completa
                        (inicia con http:// o https://) y la retorna tal cual. Esto garantiza que las imágenes antiguas
                        de Airtable y Supabase Storage sigan funcionando mientras se migran gradualmente a R2. No hay
                        breaking changes para autos existentes.
                      </p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-orange-500 text-xl">🌍</span>
                    <div className="flex-1">
                      <strong>CDN público configurado en r2.trefa.mx</strong>
                      <p className="text-gray-600 text-sm mt-1">
                        Las imágenes subidas a R2 se sirven vía el dominio público r2.trefa.mx configurado en Cloudflare.
                        El bucket trefa-images está configurado para acceso público con caché de 1 año (max-age=31536000).
                        Esto mejora significativamente la velocidad de carga y reduce costos de egreso comparado con
                        Supabase Storage.
                      </p>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Version 1.3.1 - CRITICAL FIX */}
          <div className="border-l-4 border-red-500 pl-8">
            <div className="flex flex-wrap items-center gap-3 mb-6">
              <h2 className="text-3xl font-bold text-gray-900">v1.3.1</h2>
              <span className="bg-red-100 text-red-700 px-4 py-1 rounded-full text-sm font-bold">
                🚨 CORRECCIÓN CRÍTICA
              </span>
              <span className="bg-gray-100 px-4 py-1 rounded-full text-sm text-gray-600">
                2 de Noviembre, 2025
              </span>
            </div>

            <div className="space-y-8">
              {/* Critical Fix */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <span className="bg-red-100 text-red-800 px-3 py-1 rounded-lg text-xs font-bold uppercase">
                    Corrección Crítica
                  </span>
                  <h3 className="text-xl font-semibold">Sistema de Valuación con Intelimotor</h3>
                </div>
                <ul className="space-y-3">
                  <li className="flex gap-3">
                    <span className="text-red-500 text-xl">💰</span>
                    <div className="flex-1">
                      <strong>CRÍTICO: Corregidas ofertas incorrectas en valuaciones de autos</strong>
                      <p className="text-gray-700 text-sm mt-2 font-semibold">
                        ⚠️ PROBLEMA IDENTIFICADO:
                      </p>
                      <p className="text-gray-600 text-sm mt-1">
                        El sistema estaba generando ofertas INCORRECTAS que no provenían de la API de Intelimotor,
                        causando pérdidas económicas reales a la empresa. Se detectaron los siguientes problemas críticos:
                      </p>

                      <div className="mt-3 space-y-2">
                        <p className="text-gray-700 text-sm font-semibold">1. Faltaba el parámetro lite=true (REQUERIDO):</p>
                        <ul className="ml-4 space-y-1 text-sm text-gray-600">
                          <li>• La API de Intelimotor requiere el parámetro lite=true en todas las solicitudes</li>
                          <li>• Este parámetro NO estaba siendo enviado en ninguna llamada a la API</li>
                          <li>• Sin lite=true, la API puede devolver datos incompletos o incorrectos</li>
                        </ul>

                        <p className="text-gray-700 text-sm font-semibold mt-3">2. Cálculos arbitrarios generaban ofertas falsas:</p>
                        <ul className="ml-4 space-y-1 text-sm text-gray-600">
                          <li>• Si no se recibía suggestedOffer, el sistema calculaba ofertas con fórmulas arbitrarias:</li>
                          <li className="ml-4">- avgMarketValue - $5,000</li>
                          <li className="ml-4">- (lowMarketValue + highMarketValue) / 2 - $5,000</li>
                          <li className="ml-4">- lowMarketValue - $7,500</li>
                          <li className="ml-4">- highMarketValue - $15,000</li>
                          <li>• Estas ofertas NO venían de Intelimotor y eran INVENTADAS por el código</li>
                          <li>• Esto causaba ofertas incorrectas que afectaban el negocio directamente</li>
                        </ul>

                        <p className="text-gray-700 text-sm font-semibold mt-3">3. Se usaba ofertaAutomatica como respaldo:</p>
                        <ul className="ml-4 space-y-1 text-sm text-gray-600">
                          <li>• El sistema intentaba usar ofertaAutomatica cuando no había suggestedOffer</li>
                          <li>• Según instrucciones, SOLO debemos usar suggestedOffer</li>
                        </ul>
                      </div>

                      <p className="text-gray-700 text-sm mt-4 font-semibold">
                        ✅ SOLUCIONES IMPLEMENTADAS:
                      </p>

                      <div className="mt-3 space-y-3">
                        <div>
                          <p className="text-gray-700 text-sm font-semibold">A. Agregado lite=true a todas las llamadas API:</p>
                          <ul className="ml-4 space-y-1 text-sm text-gray-600">
                            <li>• Se agregó el parámetro "lite: true" al request body del POST a /valuations</li>
                            <li>• Esto asegura que Intelimotor procese la solicitud correctamente</li>
                            <li>• Archivo: src/Valuation/services/valuationService.ts línea 324</li>
                          </ul>
                        </div>

                        <div>
                          <p className="text-gray-700 text-sm font-semibold">B. Eliminados TODOS los cálculos arbitrarios:</p>
                          <ul className="ml-4 space-y-1 text-sm text-gray-600">
                            <li>• Se removieron completamente las 50+ líneas de código que calculaban ofertas falsas</li>
                            <li>• Ahora el sistema SOLO acepta suggestedOffer directamente de Intelimotor</li>
                            <li>• Si no hay suggestedOffer, se falla la valuación en lugar de inventar una oferta</li>
                            <li>• Archivo: src/Valuation/services/valuationService.ts líneas 394-412</li>
                          </ul>
                        </div>

                        <div>
                          <p className="text-gray-700 text-sm font-semibold">C. Proceso de valuación simplificado y correcto:</p>
                          <ul className="ml-4 space-y-1 text-sm text-gray-600">
                            <li>• Paso 1: POST a /valuations con lite=true</li>
                            <li>• Paso 2: Si suggestedOffer está en la respuesta → usar ese valor ✓</li>
                            <li>• Paso 3: Si no, hacer polling con GET /valuations/:id</li>
                            <li>• Paso 4: Cuando suggestedOffer {'>'} 0 → usar ese valor ✓</li>
                            <li>• Paso 5: Si después de 6 intentos no hay suggestedOffer → ERROR (no inventar oferta)</li>
                          </ul>
                        </div>

                        <div>
                          <p className="text-gray-700 text-sm font-semibold">D. Validaciones mejoradas:</p>
                          <ul className="ml-4 space-y-1 text-sm text-gray-600">
                            <li>• El código ahora verifica explícitamente que suggestedOffer {'>'} 0</li>
                            <li>• Si no se recibe suggestedOffer válido, se muestra mensaje sugiriendo versiones alternativas</li>
                            <li>• Se loguea toda la respuesta de la API para debugging si hay problemas</li>
                          </ul>
                        </div>
                      </div>

                      <p className="text-gray-700 text-sm mt-4 font-semibold">
                        📊 IMPACTO:
                      </p>
                      <ul className="ml-4 space-y-1 text-sm text-gray-600 mt-2">
                        <li>✅ Todas las ofertas ahora provienen EXCLUSIVAMENTE de Intelimotor</li>
                        <li>✅ Se eliminó el riesgo de hacer ofertas incorrectas que cuestan dinero real</li>
                        <li>✅ Mayor precisión en valuaciones (datos de mercado reales)</li>
                        <li>✅ Cumplimiento total con especificaciones de API de Intelimotor</li>
                        <li>✅ Transparencia: El usuario sabe si su auto no puede ser valuado</li>
                      </ul>

                      <div className="mt-4 p-3 bg-red-50 rounded-lg border border-red-200">
                        <p className="text-red-800 text-sm font-semibold">
                          ⚠️ ACCIÓN REQUERIDA:
                        </p>
                        <p className="text-red-700 text-sm mt-1">
                          Este fix debe desplegarse INMEDIATAMENTE a producción dado que afecta ofertas reales con dinero real.
                          Después del despliegue, se recomienda revisar valuaciones recientes en Airtable para validar que las ofertas sean consistentes con el mercado.
                        </p>
                      </div>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Version 1.3.0 */}
          <div className="border-l-4 border-orange-500 pl-8">
            <div className="flex flex-wrap items-center gap-3 mb-6">
              <h2 className="text-3xl font-bold text-gray-900">v1.3.0</h2>
              <span className="bg-gray-100 px-4 py-1 rounded-full text-sm text-gray-600">
                25 de Octubre, 2025
              </span>
            </div>

            <div className="space-y-8">
              {/* Fixes */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <span className="bg-green-100 text-green-800 px-3 py-1 rounded-lg text-xs font-bold uppercase">
                    Corrección
                  </span>
                  <h3 className="text-xl font-semibold">Filtros de Autos</h3>
                </div>
                <ul className="space-y-3">
                  <li className="flex gap-3">
                    <span className="text-orange-500 text-xl">✓</span>
                    <div className="flex-1">
                      <strong>Corregidos nombres de propiedades en filtros</strong>
                      <span className="ml-2 font-mono text-xs bg-gray-100 px-2 py-1 rounded text-gray-600">9ed95d1</span>
                      <p className="text-gray-600 text-sm mt-1">
                        Se solucionó el error que causaba que los filtros de marcas, carrocería y otros aparecieran vacíos.
                        Los nombres de propiedades `marcas` y `enganchemin` ahora coinciden correctamente entre el backend y el frontend.
                      </p>
                    </div>
                  </li>
                </ul>
              </div>

              {/* Images CDN */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-lg text-xs font-bold uppercase">
                    Mejora
                  </span>
                  <h3 className="text-xl font-semibold">Cloudflare CDN para Imágenes</h3>
                </div>
                <ul className="space-y-3">
                  <li className="flex gap-3">
                    <span className="text-orange-500 text-xl">✓</span>
                    <div className="flex-1">
                      <strong>Imágenes optimizadas vía Cloudflare CDN</strong>
                      <span className="ml-2 font-mono text-xs bg-gray-100 px-2 py-1 rounded text-gray-600">9ed95d1</span>
                      <p className="text-gray-600 text-sm mt-1">
                        Todas las imágenes de autos ahora se cargan desde Cloudflare CDN (images.trefa.mx) en lugar de Supabase,
                        mejorando significativamente la velocidad de carga y reduciendo costos.
                      </p>
                    </div>
                  </li>
                </ul>
              </div>

              {/* Sidebar */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <span className="bg-green-100 text-green-800 px-3 py-1 rounded-lg text-xs font-bold uppercase">
                    Corrección
                  </span>
                  <h3 className="text-xl font-semibold">Sidebar de Filtros en Desktop</h3>
                </div>
                <ul className="space-y-3">
                  <li className="flex gap-3">
                    <span className="text-orange-500 text-xl">✓</span>
                    <div className="flex-1">
                      <strong>Sidebar ahora visible en escritorio</strong>
                      <span className="ml-2 font-mono text-xs bg-gray-100 px-2 py-1 rounded text-gray-600">c0f83c1</span>
                      <p className="text-gray-600 text-sm mt-1">
                        Se eliminó la renderización condicional que ocultaba el sidebar de filtros en la página de listado de autos.
                      </p>
                    </div>
                  </li>
                </ul>
              </div>

              {/* Valuation Redirect */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <span className="bg-green-100 text-green-800 px-3 py-1 rounded-lg text-xs font-bold uppercase">
                    Corrección
                  </span>
                  <h3 className="text-xl font-semibold">Flujo de Valuación en Visitas</h3>
                </div>
                <ul className="space-y-3">
                  <li className="flex gap-3">
                    <span className="text-orange-500 text-xl">✓</span>
                    <div className="flex-1">
                      <strong>Redirección automática después de valuación</strong>
                      <span className="ml-2 font-mono text-xs bg-gray-100 px-2 py-1 rounded text-gray-600">d1439fb</span>
                      <p className="text-gray-600 text-sm mt-1">
                        El formulario de valuación ahora redirige automáticamente a la agenda de Calendly después de recibir una oferta.
                        Se reemplazó el widget placeholder con el componente de valuación completo integrado.
                      </p>
                    </div>
                  </li>
                </ul>
              </div>

              {/* Intelimotor Auth */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <span className="bg-green-100 text-green-800 px-3 py-1 rounded-lg text-xs font-bold uppercase">
                    Corrección
                  </span>
                  <h3 className="text-xl font-semibold">Autenticación con Intelimotor</h3>
                </div>
                <ul className="space-y-3">
                  <li className="flex gap-3">
                    <span className="text-orange-500 text-xl">🔐</span>
                    <div className="flex-1">
                      <strong>Corregido error 401 al obtener valuaciones de autos</strong>
                      <span className="ml-2 font-mono text-xs bg-gray-100 px-2 py-1 rounded text-gray-600">1b6bfbd</span>
                      <p className="text-gray-600 text-sm mt-1">
                        Se solucionó el error "Error de autenticación con Intelimotor (401)" que impedía obtener valuaciones de autos.
                        La API de Intelimotor requiere que las credenciales (API Key y API Secret) se envíen como parámetros en la URL,
                        no como headers. El proxy ahora extrae las credenciales de los headers y las agrega correctamente a la URL.
                      </p>
                    </div>
                  </li>
                </ul>
              </div>

              {/* Marketing Category Page Fix */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <span className="bg-green-100 text-green-800 px-3 py-1 rounded-lg text-xs font-bold uppercase">
                    Corrección
                  </span>
                  <h3 className="text-xl font-semibold">Página de Categorías de Marketing</h3>
                </div>
                <ul className="space-y-3">
                  <li className="flex gap-3">
                    <span className="text-orange-500 text-xl">✓</span>
                    <div className="flex-1">
                      <strong>Corregida indentación del hook useSEO</strong>
                      <p className="text-gray-600 text-sm mt-1">
                        Se solucionó un error que impedía renderizar la página de categorías de marketing debido a una
                        indentación incorrecta del hook useSEO, que aparecía fuera del cuerpo del componente.
                      </p>
                    </div>
                  </li>
                </ul>
              </div>

              {/* Airtable Config Page Fix */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <span className="bg-green-100 text-green-800 px-3 py-1 rounded-lg text-xs font-bold uppercase">
                    Corrección
                  </span>
                  <h3 className="text-xl font-semibold">Página de Configuración de Airtable</h3>
                </div>
                <ul className="space-y-3">
                  <li className="flex gap-3">
                    <span className="text-orange-500 text-xl">✓</span>
                    <div className="flex-1">
                      <strong>Corregido error de sintaxis en imports</strong>
                      <p className="text-gray-600 text-sm mt-1">
                        Se movió el import de AirtableImageUploader al inicio del archivo según las reglas de sintaxis ES6.
                        El import estaba ubicado después de las definiciones de componentes, causando un error de parsing.
                      </p>
                    </div>
                  </li>
                </ul>
              </div>

              {/* Changelog Route */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-lg text-xs font-bold uppercase">
                    Nueva Funcionalidad
                  </span>
                  <h3 className="text-xl font-semibold">Registro de Cambios como Componente React</h3>
                </div>
                <ul className="space-y-3">
                  <li className="flex gap-3">
                    <span className="text-orange-500 text-xl">✓</span>
                    <div className="flex-1">
                      <strong>Convertido changelog.html a componente TSX</strong>
                      <p className="text-gray-600 text-sm mt-1">
                        El registro de cambios ahora es un componente React completo (ChangelogPage.tsx) con ruta /changelog,
                        integrado completamente con el layout principal de la aplicación. Incluye SEO optimizado y estilos Tailwind.
                      </p>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Version 1.2.0 - Major Features */}
          <div className="border-l-4 border-blue-500 pl-8">
            <div className="flex flex-wrap items-center gap-3 mb-6">
              <h2 className="text-3xl font-bold text-gray-900">v1.2.0</h2>
              <span className="bg-gray-100 px-4 py-1 rounded-full text-sm text-gray-600">
                Octubre, 2025
              </span>
            </div>

            <div className="space-y-8">
              {/* CRM System */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-lg text-xs font-bold uppercase">
                    Nueva Funcionalidad
                  </span>
                  <h3 className="text-xl font-semibold">Sistema CRM Completo</h3>
                </div>
                <ul className="space-y-3">
                  <li className="flex gap-3">
                    <span className="text-blue-500 text-xl">✓</span>
                    <div className="flex-1">
                      <strong>Dashboard de leads y gestión de clientes</strong>
                      <span className="ml-2 font-mono text-xs bg-gray-100 px-2 py-1 rounded text-gray-600">d2f9f54</span>
                      <p className="text-gray-600 text-sm mt-1">
                        Implementación completa de CRM con dashboard de leads, perfiles de clientes, seguimiento de aplicaciones,
                        y sistema de notificaciones por email. Incluye acceso basado en roles (admin/sales) y permisos de asesor.
                      </p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-blue-500 text-xl">🔒</span>
                    <div className="flex-1">
                      <strong>Control de acceso seguro para agentes de ventas</strong>
                      <span className="ml-2 font-mono text-xs bg-gray-100 px-2 py-1 rounded text-gray-600">301631a</span>
                      <p className="text-gray-600 text-sm mt-1">
                        Los agentes solo pueden ver perfiles de clientes que les han otorgado permiso explícito mediante
                        el flag asesor_autorizado_acceso. Implementado con función RPC segura get_secure_client_profile.
                      </p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-blue-500 text-xl">📊</span>
                    <div className="flex-1">
                      <strong>Tracking de fuentes de leads (UTM, RFDM)</strong>
                      <p className="text-gray-600 text-sm mt-1">
                        Captura automática de parámetros UTM, RFDM y OrdenCompra desde la URL, almacenados en metadatos
                        del perfil de usuario para análisis de efectividad de campañas.
                      </p>
                    </div>
                  </li>
                </ul>
              </div>

              {/* Application System */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-lg text-xs font-bold uppercase">
                    Nueva Funcionalidad
                  </span>
                  <h3 className="text-xl font-semibold">Sistema de Solicitudes de Financiamiento</h3>
                </div>
                <ul className="space-y-3">
                  <li className="flex gap-3">
                    <span className="text-blue-500 text-xl">📝</span>
                    <div className="flex-1">
                      <strong>Formulario flexible de solicitud</strong>
                      <span className="ml-2 font-mono text-xs bg-gray-100 px-2 py-1 rounded text-gray-600">0ccd25e</span>
                      <p className="text-gray-600 text-sm mt-1">
                        Los usuarios pueden enviar solicitudes sin tener todos los documentos listos. El campo documents_pending
                        permite tracking de documentos faltantes. Dirección ahora es opcional para mejor UX.
                      </p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-blue-500 text-xl">👤</span>
                    <div className="flex-1">
                      <strong>Flujo de perfilación bancaria</strong>
                      <p className="text-gray-600 text-sm mt-1">
                        Sistema de dos pasos: primero completar perfil personal, luego perfilación bancaria antes de aplicar.
                        Redirecciones automáticas para guiar al usuario por el flujo correcto.
                      </p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-blue-500 text-xl">💾</span>
                    <div className="flex-1">
                      <strong>Guardado de borradores</strong>
                      <span className="ml-2 font-mono text-xs bg-gray-100 px-2 py-1 rounded text-gray-600">4f609b4</span>
                      <p className="text-gray-600 text-sm mt-1">
                        Las solicitudes se guardan automáticamente como borradores. Los usuarios pueden continuar
                        desde donde lo dejaron en /escritorio/seguimiento.
                      </p>
                    </div>
                  </li>
                </ul>
              </div>

              {/* Valuation System */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-lg text-xs font-bold uppercase">
                    Nueva Funcionalidad
                  </span>
                  <h3 className="text-xl font-semibold">Sistema de Valuación de Autos</h3>
                </div>
                <ul className="space-y-3">
                  <li className="flex gap-3">
                    <span className="text-blue-500 text-xl">💰</span>
                    <div className="flex-1">
                      <strong>Integración con Intelimotor API</strong>
                      <span className="ml-2 font-mono text-xs bg-gray-100 px-2 py-1 rounded text-gray-600">1eaaf7b</span>
                      <p className="text-gray-600 text-sm mt-1">
                        Sistema completo de valuación conectado a Intelimotor para obtener precios de mercado en tiempo real.
                        Incluye búsqueda por marca/modelo/año y VIN lookup.
                      </p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-blue-500 text-xl">🔄</span>
                    <div className="flex-1">
                      <strong>Flujo público y protegido</strong>
                      <p className="text-gray-600 text-sm mt-1">
                        Ruta pública /vender-mi-auto para obtener valuación inicial. Ruta protegida /escritorio/vende-tu-auto
                        para subir fotos y completar detalles post-valuación.
                      </p>
                    </div>
                  </li>
                </ul>
              </div>

              {/* CarStudio AI */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-lg text-xs font-bold uppercase">
                    Nueva Funcionalidad
                  </span>
                  <h3 className="text-xl font-semibold">CarStudio AI - Procesamiento de Imágenes</h3>
                </div>
                <ul className="space-y-3">
                  <li className="flex gap-3">
                    <span className="text-blue-500 text-xl">🤖</span>
                    <div className="flex-1">
                      <strong>Extracción automática de datos de autos</strong>
                      <span className="ml-2 font-mono text-xs bg-gray-100 px-2 py-1 rounded text-gray-600">ce04ae5</span>
                      <p className="text-gray-600 text-sm mt-1">
                        AI que analiza fotos de autos para extraer marca, modelo, año, color y más.
                        Incluye manejo robusto de errores para imágenes de baja calidad o fondos complejos.
                      </p>
                    </div>
                  </li>
                </ul>
              </div>

              {/* Airtable Integration */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-lg text-xs font-bold uppercase">
                    Nueva Funcionalidad
                  </span>
                  <h3 className="text-xl font-semibold">Integración con Airtable</h3>
                </div>
                <ul className="space-y-3">
                  <li className="flex gap-3">
                    <span className="text-blue-500 text-xl">🔗</span>
                    <div className="flex-1">
                      <strong>Sincronización bidireccional de datos</strong>
                      <span className="ml-2 font-mono text-xs bg-gray-100 px-2 py-1 rounded text-gray-600">ffa319f</span>
                      <p className="text-gray-600 text-sm mt-1">
                        Sistema de sincronización con Airtable para inventario, leads y compras. Incluye configuración
                        de API keys con fallbacks y página de administración para gestionar la integración.
                      </p>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Version 1.1.0 - Core Infrastructure */}
          <div className="border-l-4 border-green-500 pl-8">
            <div className="flex flex-wrap items-center gap-3 mb-6">
              <h2 className="text-3xl font-bold text-gray-900">v1.1.0</h2>
              <span className="bg-gray-100 px-4 py-1 rounded-full text-sm text-gray-600">
                Octubre, 2025
              </span>
            </div>

            <div className="space-y-8">
              {/* Authentication */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-lg text-xs font-bold uppercase">
                    Nueva Funcionalidad
                  </span>
                  <h3 className="text-xl font-semibold">Sistema de Autenticación</h3>
                </div>
                <ul className="space-y-3">
                  <li className="flex gap-3">
                    <span className="text-green-500 text-xl">🔐</span>
                    <div className="flex-1">
                      <strong>Login con OTP y Google OAuth</strong>
                      <span className="ml-2 font-mono text-xs bg-gray-100 px-2 py-1 rounded text-gray-600">781ab4b</span>
                      <p className="text-gray-600 text-sm mt-1">
                        Sistema de autenticación dual: login sin contraseña vía código OTP enviado por email,
                        o login con cuenta de Google. Redirección automática a /escritorio después de login exitoso.
                      </p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-green-500 text-xl">👥</span>
                    <div className="flex-1">
                      <strong>Sistema de roles (Admin/Sales/User)</strong>
                      <p className="text-gray-600 text-sm mt-1">
                        Asignación automática de roles basada en email. Protección de rutas con AdminRoute y SalesRoute.
                        Agente de ventas asignado automáticamente en round-robin con función get_next_sales_agent.
                      </p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-green-500 text-xl">🛡️</span>
                    <div className="flex-1">
                      <strong>Row Level Security (RLS) completo</strong>
                      <span className="ml-2 font-mono text-xs bg-gray-100 px-2 py-1 rounded text-gray-600">54d0e1c</span>
                      <p className="text-gray-600 text-sm mt-1">
                        Políticas RLS implementadas en todas las tablas: profiles, financing_applications, bank_profiling,
                        documents, vacancies, applications, y más. Garantiza que usuarios solo accedan a sus propios datos.
                      </p>
                    </div>
                  </li>
                </ul>
              </div>

              {/* Vehicle Display */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-lg text-xs font-bold uppercase">
                    Mejora
                  </span>
                  <h3 className="text-xl font-semibold">Sistema de Autos</h3>
                </div>
                <ul className="space-y-3">
                  <li className="flex gap-3">
                    <span className="text-green-500 text-xl">🚗</span>
                    <div className="flex-1">
                      <strong>Fetching centralizado con VehicleContext</strong>
                      <p className="text-gray-600 text-sm mt-1">
                        Todos los autos se obtienen vía VehicleContext usando TanStack Query.
                        Fallback automático de inventario_cache a smooth-handler Edge Function.
                        Caché de 1 hora en IndexedDB para rendimiento óptimo.
                      </p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-green-500 text-xl">🔍</span>
                    <div className="flex-1">
                      <strong>Sistema de filtros avanzado</strong>
                      <span className="ml-2 font-mono text-xs bg-gray-100 px-2 py-1 rounded text-gray-600">38ed671</span>
                      <p className="text-gray-600 text-sm mt-1">
                        FilterSidebar con cálculo dinámico de counts por marca, año, sucursal, clasificación, transmisión y combustible.
                        FilterSheet móvil con UI optimizada para pantallas pequeñas.
                      </p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-green-500 text-xl">🔗</span>
                    <div className="flex-1">
                      <strong>Generación de slugs con fallbacks</strong>
                      <p className="text-gray-600 text-sm mt-1">
                        Slugs generados con cadena de prioridad: slug/ligawp → ordencompra → record_id → id.
                        Garantiza URLs únicas y amigables para SEO.
                      </p>
                    </div>
                  </li>
                </ul>
              </div>

              {/* Vacancies System */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-lg text-xs font-bold uppercase">
                    Nueva Funcionalidad
                  </span>
                  <h3 className="text-xl font-semibold">Sistema de Reclutamiento</h3>
                </div>
                <ul className="space-y-3">
                  <li className="flex gap-3">
                    <span className="text-green-500 text-xl">💼</span>
                    <div className="flex-1">
                      <strong>Portal de vacantes y aplicaciones</strong>
                      <p className="text-gray-600 text-sm mt-1">
                        Listado público de vacantes en /vacantes. Formulario de aplicación con upload de CV.
                        Dashboard admin para gestionar vacantes y revisar candidatos en /escritorio/admin/vacantes.
                      </p>
                    </div>
                  </li>
                </ul>
              </div>

              {/* Infrastructure */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-lg text-xs font-bold uppercase">
                    Mejora
                  </span>
                  <h3 className="text-xl font-semibold">Infraestructura y Deployment</h3>
                </div>
                <ul className="space-y-3">
                  <li className="flex gap-3">
                    <span className="text-green-500 text-xl">🐳</span>
                    <div className="flex-1">
                      <strong>Docker multi-stage build optimizado</strong>
                      <p className="text-gray-600 text-sm mt-1">
                        Dockerfile con build de dos etapas para imágenes ligeras. Deploy automatizado a Google Cloud Run
                        con variables de entorno desde cloud-build-vars.yaml.
                      </p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-green-500 text-xl">☁️</span>
                    <div className="flex-1">
                      <strong>Cloudflare R2 para almacenamiento</strong>
                      <span className="ml-2 font-mono text-xs bg-gray-100 px-2 py-1 rounded text-gray-600">37c9b65</span>
                      <p className="text-gray-600 text-sm mt-1">
                        Imágenes y documentos almacenados en Cloudflare R2 con URLs firmadas para seguridad.
                        Recursos de Cloud Run aumentados (2GB RAM, 2 CPUs) para mejor rendimiento.
                      </p>
                    </div>
                  </li>
                </ul>
              </div>

              {/* Email System */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-lg text-xs font-bold uppercase">
                    Nueva Funcionalidad
                  </span>
                  <h3 className="text-xl font-semibold">Sistema de Notificaciones</h3>
                </div>
                <ul className="space-y-3">
                  <li className="flex gap-3">
                    <span className="text-green-500 text-xl">📧</span>
                    <div className="flex-1">
                      <strong>Emails automáticos vía Supabase Edge Functions</strong>
                      <span className="ml-2 font-mono text-xs bg-gray-100 px-2 py-1 rounded text-gray-600">94c526b</span>
                      <p className="text-gray-600 text-sm mt-1">
                        Sistema de notificaciones por email con Resend API. Emails de bienvenida, confirmación de solicitudes,
                        asignación de asesor y más. Sender configurado como hola@trefa.mx.
                      </p>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Version 1.0.0 - Platform Launch */}
          <div className="border-l-4 border-purple-500 pl-8">
            <div className="flex flex-wrap items-center gap-3 mb-6">
              <h2 className="text-3xl font-bold text-gray-900">v1.0.0</h2>
              <span className="bg-gray-100 px-4 py-1 rounded-full text-sm text-gray-600">
                15 de Octubre, 2025
              </span>
            </div>

            <div className="space-y-8">
              {/* Platform Launch */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-lg text-xs font-bold uppercase">
                    Nueva Funcionalidad
                  </span>
                  <h3 className="text-xl font-semibold">Lanzamiento Beta del Portal Digital TREFA</h3>
                </div>
                <ul className="space-y-3">
                  <li className="flex gap-3">
                    <span className="text-purple-500 text-xl">🚀</span>
                    <div className="flex-1">
                      <strong>Plataforma completa de compra-venta y financiamiento de autos</strong>
                      <p className="text-gray-600 text-sm mt-1">
                        Se lanzó la versión beta del Portal Digital TREFA, una plataforma revolucionaria que permite a los clientes
                        comprar, vender y financiar autos seminuevos 100% en línea. Características principales:<br/><br/>
                        • <strong>Catálogo interactivo:</strong> Más de 70 autos con filtros avanzados<br/>
                        • <strong>Solicitud de crédito digital:</strong> Formulario multi-paso con validación en tiempo real<br/>
                        • <strong>Valuación con IA:</strong> "Vende tu Auto" usando API de Intelimotor<br/>
                        • <strong>Portal de usuario:</strong> Dashboard personalizado con favoritos y seguimiento<br/>
                        • <strong>Sistema de documentos:</strong> Upload de INE, comprobantes, referencias<br/>
                        • <strong>Perfilamiento bancario:</strong> Recomendaciones personalizadas de instituciones<br/>
                        • <strong>Autenticación segura:</strong> OTP por email, Google y Facebook login<br/><br/>
                        <strong>Horas invertidas:</strong> ~50 horas en desarrollo del MVP
                      </p>
                    </div>
                  </li>
                </ul>
              </div>

              {/* Microsoft Clarity */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-lg text-xs font-bold uppercase">
                    Nueva Funcionalidad
                  </span>
                  <h3 className="text-xl font-semibold">Implementación de Microsoft Clarity</h3>
                </div>
                <ul className="space-y-3">
                  <li className="flex gap-3">
                    <span className="text-purple-500 text-xl">📊</span>
                    <div className="flex-1">
                      <strong>Herramienta de análisis de comportamiento de usuarios</strong>
                      <p className="text-gray-600 text-sm mt-1">
                        Se integró Microsoft Clarity para monitorear cómo los usuarios realmente utilizan la plataforma.
                        Incluye grabación de sesiones, heatmaps, detección de rage clicks, dead clicks y JavaScript errors.
                        Configurado respetando privacidad (enmascara datos sensibles, cumple GDPR).<br/><br/>
                        <strong>Horas invertidas:</strong> ~8 horas en setup e integración
                      </p>
                    </div>
                  </li>
                </ul>
              </div>

              {/* Lead Management */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-lg text-xs font-bold uppercase">
                    Nueva Funcionalidad
                  </span>
                  <h3 className="text-xl font-semibold">Sistema de Gestión de Leads</h3>
                </div>
                <ul className="space-y-3">
                  <li className="flex gap-3">
                    <span className="text-purple-500 text-xl">👥</span>
                    <div className="flex-1">
                      <strong>CRM completo para captura y seguimiento de leads</strong>
                      <p className="text-gray-600 text-sm mt-1">
                        Captura desde múltiples fuentes (landing pages, valuaciones, formularios de financiamiento).
                        Sistema de tags, recordatorios, historial de interacciones y sincronización con Kommo CRM.<br/><br/>
                        <strong>Horas invertidas:</strong> ~120 horas en CRM completo
                      </p>
                    </div>
                  </li>
                </ul>
              </div>

              {/* Initial Fixes */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <span className="bg-green-100 text-green-800 px-3 py-1 rounded-lg text-xs font-bold uppercase">
                    Corrección
                  </span>
                  <h3 className="text-xl font-semibold">Correcciones Iniciales del Lanzamiento Beta</h3>
                </div>
                <ul className="space-y-3">
                  <li className="flex gap-3">
                    <span className="text-purple-500 text-xl">🐛</span>
                    <div className="flex-1">
                      <strong>Página de listado en blanco (FilterSidebar crash)</strong>
                      <p className="text-gray-600 text-sm mt-1">
                        FilterSidebar tenía variables indefinidas causando crash. Se agregaron hooks useMemo para calcular
                        todos los conteos de filtros.
                      </p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-purple-500 text-xl">🖼️</span>
                    <div className="flex-1">
                      <strong>Normalización de imágenes de autos</strong>
                      <p className="text-gray-600 text-sm mt-1">
                        Las fotos no se mostraban correctamente. Se arregló el procesamiento para manejar diferentes
                        formatos de datos (Airtable, smooth-handler, inventario_cache).
                      </p>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Version 0.9.5 - Infrastructure */}
          <div className="border-l-4 border-indigo-500 pl-8">
            <div className="flex flex-wrap items-center gap-3 mb-6">
              <h2 className="text-3xl font-bold text-gray-900">v0.9.5</h2>
              <span className="bg-gray-100 px-4 py-1 rounded-full text-sm text-gray-600">
                30 de Septiembre, 2024
              </span>
            </div>

            <div className="space-y-8">
              {/* Airtable Sync */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <span className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-lg text-xs font-bold uppercase">
                    Infraestructura
                  </span>
                  <h3 className="text-xl font-semibold">Sincronización Automática Airtable → Supabase</h3>
                </div>
                <ul className="space-y-3">
                  <li className="flex gap-3">
                    <span className="text-indigo-500 text-xl">🔄</span>
                    <div className="flex-1">
                      <strong>Sistema de caché inteligente con sincronización en tiempo real</strong>
                      <p className="text-gray-600 text-sm mt-1">
                        Webhooks de Airtable + Edge Function sync-inventory. Consultas ultra rápidas (~300ms vs ~3s).
                        Cron job horario como respaldo. Resiliente si Airtable está caído.<br/><br/>
                        <strong>Horas invertidas:</strong> ~80 horas
                      </p>
                    </div>
                  </li>
                </ul>
              </div>

              {/* Cloudflare R2 */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <span className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-lg text-xs font-bold uppercase">
                    Infraestructura
                  </span>
                  <h3 className="text-xl font-semibold">Almacenamiento en Cloudflare R2</h3>
                </div>
                <ul className="space-y-3">
                  <li className="flex gap-3">
                    <span className="text-indigo-500 text-xl">☁️</span>
                    <div className="flex-1">
                      <strong>CDN global con cero costos de egreso</strong>
                      <p className="text-gray-600 text-sm mt-1">
                        Distribución global vía CDN (latencias menor50ms). URLs firmadas temporales para documentos privados.
                        Buckets organizados (imágenes públicas, documentos privados). Reducción de costos ~60% vs Supabase Storage.<br/><br/>
                        <strong>Horas invertidas:</strong> ~70 horas
                      </p>
                    </div>
                  </li>
                </ul>
              </div>

              {/* Email Automation */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <span className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-lg text-xs font-bold uppercase">
                    Automatización
                  </span>
                  <h3 className="text-xl font-semibold">Sistema de Emails Automatizados (Brevo)</h3>
                </div>
                <ul className="space-y-3">
                  <li className="flex gap-3">
                    <span className="text-indigo-500 text-xl">📧</span>
                    <div className="flex-1">
                      <strong>Flujos de comunicación automatizados</strong>
                      <p className="text-gray-600 text-sm mt-1">
                        Emails transaccionales (confirmación, actualizaciones de estatus, OTP). Campañas de marketing
                        (bienvenida, abandono de solicitud, promociones). Templates HTML responsive con tracking.<br/><br/>
                        <strong>Horas invertidas:</strong> ~80 horas
                      </p>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Version 0.9.0 - DevOps */}
          <div className="border-l-4 border-pink-500 pl-8">
            <div className="flex flex-wrap items-center gap-3 mb-6">
              <h2 className="text-3xl font-bold text-gray-900">v0.9.0</h2>
              <span className="bg-gray-100 px-4 py-1 rounded-full text-sm text-gray-600">
                18 de Septiembre, 2024
              </span>
            </div>

            <div className="space-y-8">
              {/* GitHub */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <span className="bg-pink-100 text-pink-800 px-3 py-1 rounded-lg text-xs font-bold uppercase">
                    DevOps
                  </span>
                  <h3 className="text-xl font-semibold">Control de Versiones con GitHub</h3>
                </div>
                <ul className="space-y-3">
                  <li className="flex gap-3">
                    <span className="text-pink-500 text-xl">🔧</span>
                    <div className="flex-1">
                      <strong>Sistema profesional de gestión del código fuente</strong>
                      <p className="text-gray-600 text-sm mt-1">
                        Repositorio privado en GitHub con branches (main, develop, feature/*). Commits semánticos y
                        protección de main branch. Code review via pull requests.<br/><br/>
                        <strong>Horas invertidas:</strong> ~30 horas en setup y documentación
                      </p>
                    </div>
                  </li>
                </ul>
              </div>

              {/* Cloud Run */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <span className="bg-pink-100 text-pink-800 px-3 py-1 rounded-lg text-xs font-bold uppercase">
                    DevOps
                  </span>
                  <h3 className="text-xl font-semibold">Deploy a Google Cloud Run</h3>
                </div>
                <ul className="space-y-3">
                  <li className="flex gap-3">
                    <span className="text-pink-500 text-xl">🚀</span>
                    <div className="flex-1">
                      <strong>Infraestructura serverless con auto-scaling</strong>
                      <p className="text-gray-600 text-sm mt-1">
                        Dockerfile multi-stage optimizado. Deploy script automatizado. Variables de entorno desde YAML.
                        Auto-scaling de 0 a 100 instancias. SSL/HTTPS automático via Cloud Load Balancer.<br/><br/>
                        <strong>Horas invertidas:</strong> ~112 horas en setup y optimización
                      </p>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-8 py-6 text-center flex-shrink-0">
            <p className="text-gray-600 text-sm">
              Desarrollado con ❤️ por el equipo de TREFA
            </p>
            <p className="text-gray-500 text-xs mt-2">
              © 2025 Autos TREFA. Todos los derechos reservados.
            </p>
          </div>
        </div>

        {/* RIGHT COLUMN: ROADMAP (Blue) */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-8 py-12 text-center flex-shrink-0">
            <Rocket className="w-16 h-16 mx-auto mb-4" />
            <h1 className="text-4xl font-bold mb-3">🚀 Roadmap</h1>
            <p className="text-lg opacity-95">Plan de Desarrollo y Próximas Funcionalidades</p>
            <p className="text-sm mt-2 opacity-90">Innovación Continua</p>
            <div className="mt-6 inline-block bg-white/20 backdrop-blur-sm px-6 py-3 rounded-lg">
              <p className="text-lg font-semibold">
                📊 Proyectos en Desarrollo: <span className="text-2xl">8+</span>
              </p>
            </div>
          </div>

          {/* Content - Scrollable */}
          <div className="px-8 py-10 space-y-12 overflow-y-auto flex-1">

            {/* Admin Roadmap Manager */}
            <AdminRoadmapManager />

            {/* Dynamic Roadmap Content */}
            <DynamicRoadmapDisplay />
          </div>

          {/* Footer */}
          <div className="bg-blue-50 px-8 py-6 text-center flex-shrink-0">
            <p className="text-blue-600 text-sm font-semibold">
              ¿Tienes una idea o sugerencia?
            </p>
            <p className="text-gray-600 text-xs mt-2">
              Contáctanos en hola@trefa.mx
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ChangelogPage;
