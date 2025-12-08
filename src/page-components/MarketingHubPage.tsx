'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users, TrendingUp, BookOpen, Settings, Briefcase,
  BarChart3, FileText, Database, LayoutDashboard, Activity
} from 'lucide-react';
import { supabase } from '../../supabaseClient';

interface EventStat {
  event_name: string;
  event_count: number;
  unique_users: number;
}

interface MarketingTool {
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  link: string;
  color: string;
  disabled?: boolean;
}

const MarketingHubPage: React.FC = () => {
  const [eventStats, setEventStats] = useState<EventStat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEventStats();
  }, []);

  const loadEventStats = async () => {
    try {
      const { data, error } = await supabase
        .from('marketing_events')
        .select('event_name, session_id, created_at')
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Aggregate event data
      const eventMap = new Map<string, { count: number; sessions: Set<string> }>();

      data?.forEach(event => {
        if (!eventMap.has(event.event_name)) {
          eventMap.set(event.event_name, { count: 0, sessions: new Set() });
        }
        const stat = eventMap.get(event.event_name)!;
        stat.count++;
        if (event.session_id) stat.sessions.add(event.session_id);
      });

      const stats: EventStat[] = Array.from(eventMap.entries()).map(([name, data]) => ({
        event_name: name,
        event_count: data.count,
        unique_users: data.sessions.size,
      }));

      stats.sort((a, b) => b.event_count - a.event_count);
      setEventStats(stats);
    } catch (error) {
      console.error('Error loading event stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const mainTools = [
    {
      title: 'CRM',
      description: 'Gestión de clientes potenciales y seguimiento',
      icon: Users,
      link: '/escritorio/admin/crm',
      color: 'bg-blue-500',
    },
    {
      title: 'Asesores',
      description: 'Gestión de usuarios y asesores de ventas',
      icon: TrendingUp,
      link: '/escritorio/admin/usuarios',
      color: 'bg-green-500',
    },
    {
      title: 'Documentación de Procesos (Intel)',
      description: 'Documentación técnica y guías de operación',
      icon: BookOpen,
      link: '/intel',
      color: 'bg-purple-500',
    },
    {
      title: 'Indicadores',
      description: 'Dashboard de análisis de negocio',
      icon: BarChart3,
      link: '/escritorio/admin/business-analytics',
      color: 'bg-indigo-500',
    },
    {
      title: 'Configuración de Marketing (APIs)',
      description: 'GTM, Facebook Pixel, APIs y eventos de conversión',
      icon: Settings,
      link: '/escritorio/admin/marketing-config',
      color: 'bg-orange-500',
    },
    {
      title: 'Recursos Humanos',
      description: 'Vacantes y solicitudes de empleo',
      icon: Briefcase,
      link: '/escritorio/admin/vacantes',
      color: 'bg-pink-500',
    },
    {
      title: 'Análisis de Solicitudes',
      description: 'Análisis y métricas de aplicaciones de financiamiento',
      icon: FileText,
      link: '/escritorio/admin/solicitudes',
      color: 'bg-teal-500',
    },
    {
      title: 'Registro de Cambios',
      description: 'Historial de actualizaciones y mejoras',
      icon: Activity,
      link: '/changelog',
      color: 'bg-cyan-500',
    },
    {
      title: 'Datos',
      description: 'Analytics de marketing y eventos',
      icon: Database,
      link: '/escritorio/admin/marketing-analytics',
      color: 'bg-violet-500',
    },
    {
      title: 'Dashboard Administrativo',
      description: 'Panel de control principal para administradores',
      icon: LayoutDashboard,
      link: '/escritorio/dashboard',
      color: 'bg-rose-500',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Panel Administrativo</h1>
        <p className="mt-2 text-gray-600">
          Centro de herramientas de marketing, ventas y análisis
        </p>
      </div>

      {/* Main Tools Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mainTools.map((tool) => {
          const Icon = tool.icon;
          return (
            <Link
              key={tool.title}
              href={tool.link}
              className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md hover:border-primary-300 transition-all duration-200 transform hover:-translate-y-1"
            >
              <div className={`${tool.color} p-4 rounded-lg inline-flex mb-4`}>
                <Icon className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {tool.title}
              </h3>
              <p className="text-gray-600 text-sm">
                {tool.description}
              </p>
              <div className="mt-4 text-primary-600 font-medium flex items-center">
                Abrir
                <svg
                  className="w-4 h-4 ml-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Events Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Eventos GTM (Últimos 7 días)</h2>
            <p className="mt-1 text-sm text-gray-600">
              Eventos enviados a Google Tag Manager incluyendo ViewContent y ViewPage
            </p>
          </div>
          <button
            onClick={loadEventStats}
            disabled={loading}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm font-medium disabled:opacity-50"
          >
            {loading ? 'Cargando...' : 'Actualizar'}
          </button>
        </div>

        {loading ? (
          <div className="text-center py-8 text-gray-500">Cargando estadísticas de eventos...</div>
        ) : eventStats.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No hay eventos registrados en los últimos 7 días</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                <tr>
                  <th className="px-6 py-3">Evento</th>
                  <th className="px-6 py-3 text-right">Total de Eventos</th>
                  <th className="px-6 py-3 text-right">Sesiones Únicas</th>
                  <th className="px-6 py-3 text-right">Promedio por Sesión</th>
                </tr>
              </thead>
              <tbody>
                {eventStats.map((stat, index) => (
                  <tr key={index} className="bg-white border-b hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {stat.event_name}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {stat.event_count.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {stat.unique_users.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {stat.unique_users > 0
                        ? (stat.event_count / stat.unique_users).toFixed(2)
                        : '0.00'
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-6 pt-6 border-t border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-3">Eventos Implementados</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-1.5"></div>
              <div>
                <span className="font-medium text-gray-900">ViewPage:</span>
                <span className="text-gray-600 ml-1">Registra cada visita a una página</span>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-1.5"></div>
              <div>
                <span className="font-medium text-gray-900">ViewContent:</span>
                <span className="text-gray-600 ml-1">Registra vistas de autos</span>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5"></div>
              <div>
                <span className="font-medium text-gray-900">ButtonClick:</span>
                <span className="text-gray-600 ml-1">Clics en botones importantes</span>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5"></div>
              <div>
                <span className="font-medium text-gray-900">FormSubmit:</span>
                <span className="text-gray-600 ml-1">Envíos de formularios</span>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full mt-1.5"></div>
              <div>
                <span className="font-medium text-gray-900">LeadCapture:</span>
                <span className="text-gray-600 ml-1">Registro de nuevos leads</span>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full mt-1.5"></div>
              <div>
                <span className="font-medium text-gray-900">ApplicationStart:</span>
                <span className="text-gray-600 ml-1">Inicio de solicitud de financiamiento</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-900">
            <span className="font-semibold">Nota:</span> Los eventos ViewPage y ViewContent se envían automáticamente en todas las páginas del sitio y se pueden visualizar en Google Tag Manager y Google Analytics.
          </p>
        </div>
      </div>
    </div>
  );
};

export default MarketingHubPage;
