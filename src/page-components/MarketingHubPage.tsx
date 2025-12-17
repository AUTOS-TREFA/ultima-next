'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users, TrendingUp, BookOpen, Settings, Briefcase,
  BarChart3, FileText, Database, LayoutDashboard, Activity, Home, Camera, ClipboardCheck,
  Eye, ArrowUp, ArrowDown, Minus
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MetricsService, type EventTypeMetrics } from '@/services/MetricsService';
import { supabase } from '@/lib/supabase/client';

interface SummaryMetrics {
  totalLeads: number;
  totalSolicitudes: number;
  totalTraffic: number;
  trend24h: {
    percentage: number;
    direction: 'up' | 'down' | 'stable';
  };
  registros24h: {
    count: number;
    previousCount: number;
    changePercentage: number;
    direction: 'up' | 'down' | 'stable';
  };
}

const MarketingHubPage: React.FC = () => {
  const [eventStats, setEventStats] = useState<EventTypeMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const [summaryMetrics, setSummaryMetrics] = useState<SummaryMetrics>({
    totalLeads: 0,
    totalSolicitudes: 0,
    totalTraffic: 0,
    trend24h: { percentage: 0, direction: 'stable' },
    registros24h: {
      count: 0,
      previousCount: 0,
      changePercentage: 0,
      direction: 'stable'
    }
  });

  useEffect(() => {
    loadSummaryMetrics();
    loadEventStats();
  }, []);

  const loadSummaryMetrics = async () => {
    try {
      // Total leads (all profiles)
      const { count: leadsCount, error: leadsError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Total solicitudes enviadas (non-draft applications)
      const { count: solicitudesCount, error: solicitudesError } = await supabase
        .from('financing_applications')
        .select('*', { count: 'exact', head: true })
        .neq('status', 'draft');

      // Total traffic (all PageView events)
      const { count: trafficCount, error: trafficError } = await supabase
        .from('tracking_events')
        .select('*', { count: 'exact', head: true })
        .eq('event_type', 'PageView');

      // 24h trend - compare last 24h vs previous 24h
      const now = new Date();
      const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const previous24h = new Date(now.getTime() - 48 * 60 * 60 * 1000);

      const { count: recentCount } = await supabase
        .from('tracking_events')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', last24h.toISOString());

      const { count: previousCount } = await supabase
        .from('tracking_events')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', previous24h.toISOString())
        .lt('created_at', last24h.toISOString());

      // Calculate trend
      let direction: 'up' | 'down' | 'stable' = 'stable';
      let percentage = 0;

      if (previousCount && previousCount > 0) {
        percentage = ((recentCount || 0) - previousCount) / previousCount * 100;
        if (percentage > 5) direction = 'up';
        else if (percentage < -5) direction = 'down';
        else direction = 'stable';
      } else if (recentCount && recentCount > 0) {
        direction = 'up';
        percentage = 100;
      }

      // Calculate registros últimas 24 horas (new profile registrations)
      let registros24hCount = 0;
      let registrosPrevCount = 0;
      let registrosChangePercentage = 0;
      let registrosDirection: 'up' | 'down' | 'stable' = 'stable';

      try {
        // Get profiles registered in last 24h
        const { count: recentRegistros } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', last24h.toISOString());

        // Get profiles registered in previous 24h
        const { count: prevRegistros } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', previous24h.toISOString())
          .lt('created_at', last24h.toISOString());

        registros24hCount = recentRegistros || 0;
        registrosPrevCount = prevRegistros || 0;

        // Calculate change percentage
        if (registrosPrevCount > 0) {
          registrosChangePercentage = ((registros24hCount - registrosPrevCount) / registrosPrevCount) * 100;
          if (registrosChangePercentage > 5) registrosDirection = 'up';
          else if (registrosChangePercentage < -5) registrosDirection = 'down';
        } else if (registros24hCount > 0) {
          registrosDirection = 'up';
          registrosChangePercentage = 100;
        }
      } catch (registrosError) {
        console.error('Error calculating registros 24h:', registrosError);
      }

      setSummaryMetrics({
        totalLeads: leadsCount || 0,
        totalSolicitudes: solicitudesCount || 0,
        totalTraffic: trafficCount || 0,
        trend24h: {
          percentage: Math.abs(Math.round(percentage)),
          direction
        },
        registros24h: {
          count: registros24hCount,
          previousCount: registrosPrevCount,
          changePercentage: Math.round(registrosChangePercentage),
          direction: registrosDirection
        }
      });
    } catch (error) {
      console.error('Error loading summary metrics:', error);
    }
  };

  const loadEventStats = async () => {
    setLoading(true);
    try {
      // Calcular fecha de hace 90 días (3 meses) para mostrar todos los eventos recientes
      const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const today = new Date().toISOString().split('T')[0];

      // Usar MetricsService para obtener eventos confiables
      const stats = await MetricsService.getEventTypeMetrics(ninetyDaysAgo, today);
      setEventStats(stats);
    } catch (error) {
      console.error('Error loading event stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const mainTools = [
    {
      title: 'CRM - Gestión de Leads',
      description: 'Seguimiento de clientes potenciales y pipeline de ventas',
      icon: Users,
      link: '/escritorio/admin/crm',
    },
    {
      title: 'Gestión de Asesores',
      description: 'Administración de usuarios y equipo de ventas',
      icon: TrendingUp,
      link: '/escritorio/admin/usuarios',
    },
    {
      title: 'Intel - Base de Conocimiento',
      description: 'Documentación de procesos, guías y procedimientos operativos',
      icon: BookOpen,
      link: '/intel',
    },
    {
      title: 'Dashboard Administrativo',
      description: 'Dashboard unificado con métricas de marketing y negocio',
      icon: LayoutDashboard,
      link: '/escritorio/dashboard',
    },
    {
      title: 'Configuración de Tracking',
      description: 'Google Tag Manager, Meta Pixel y eventos de conversión',
      icon: Settings,
      link: '/escritorio/admin/marketing-config',
    },
    {
      title: 'Reclutamiento y Vacantes',
      description: 'Gestión de ofertas de empleo y candidatos',
      icon: Briefcase,
      link: '/escritorio/admin/vacantes',
    },
    {
      title: 'Analytics de Solicitudes',
      description: 'Análisis de aplicaciones de financiamiento y conversiones',
      icon: FileText,
      link: '/escritorio/admin/solicitudes',
    },
    {
      title: 'Changelog y Roadmap',
      description: 'Historial de cambios y plan de desarrollo de la plataforma',
      icon: Activity,
      link: '/changelog',
    },
    {
      title: 'Marketing Analytics',
      description: 'Eventos de marketing, embudos y métricas de campañas',
      icon: Database,
      link: '/escritorio/admin/marketing-analytics',
    },
    {
      title: 'Editor de Página de Inicio',
      description: 'Edita imágenes y contenido de la homepage sin redeployar',
      icon: Home,
      link: '/escritorio/marketing/homepage-editor',
    },
    {
      title: 'Car Studio - Procesamiento de Imágenes',
      description: 'API de Car Studio para procesar y generar imágenes de vehículos',
      icon: Camera,
      link: '/escritorio/car-studio',
    },
    {
      title: 'Inspecciones de Vehículos',
      description: 'Gestión de reportes de inspección de 150 puntos',
      icon: ClipboardCheck,
      link: '/escritorio/admin/inspecciones',
    },
  ];

  return (
    <div className="flex-1 w-full max-w-[1400px] mx-auto space-y-4 p-4 md:p-6 pt-6 overflow-x-hidden">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard General</h2>
        <p className="text-sm text-muted-foreground">
          Centro de herramientas de marketing, ventas y análisis
        </p>
      </div>

      {/* Summary Metrics Row */}
      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {/* 1. Total Leads */}
        <Card className="bg-blue-50/50 border-blue-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total Leads</p>
                <p className="text-2xl font-bold mt-1">{summaryMetrics.totalLeads.toLocaleString()}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 2. Registros últimas 24 horas */}
        <Card className={`${
          summaryMetrics.registros24h.direction === 'up' ? 'bg-cyan-50/50 border-cyan-100' :
          summaryMetrics.registros24h.direction === 'down' ? 'bg-orange-50/50 border-orange-100' : 'bg-slate-50/50 border-slate-100'
        }`}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Registros 24h</p>
                <p className="text-2xl font-bold mt-1">{summaryMetrics.registros24h.count}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {summaryMetrics.registros24h.direction === 'up' && (
                    <span className="text-cyan-600">+{summaryMetrics.registros24h.changePercentage}% vs ayer</span>
                  )}
                  {summaryMetrics.registros24h.direction === 'down' && (
                    <span className="text-orange-600">{summaryMetrics.registros24h.changePercentage}% vs ayer</span>
                  )}
                  {summaryMetrics.registros24h.direction === 'stable' && (
                    <span className="text-slate-500">~{summaryMetrics.registros24h.changePercentage}% vs ayer</span>
                  )}
                </p>
              </div>
              <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                summaryMetrics.registros24h.direction === 'up' ? 'bg-cyan-100' :
                summaryMetrics.registros24h.direction === 'down' ? 'bg-orange-100' : 'bg-slate-100'
              }`}>
                {summaryMetrics.registros24h.direction === 'up' && <ArrowUp className="h-5 w-5 text-cyan-600" />}
                {summaryMetrics.registros24h.direction === 'down' && <ArrowDown className="h-5 w-5 text-orange-600" />}
                {summaryMetrics.registros24h.direction === 'stable' && <Minus className="h-5 w-5 text-slate-500" />}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 3. Solicitudes Enviadas */}
        <Card className="bg-green-50/50 border-green-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Solicitudes Enviadas</p>
                <p className="text-2xl font-bold mt-1">{summaryMetrics.totalSolicitudes.toLocaleString()}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                <FileText className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 4. Total Tráfico */}
        <Card className="bg-purple-50/50 border-purple-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total Tráfico</p>
                <p className="text-2xl font-bold mt-1">{summaryMetrics.totalTraffic.toLocaleString()}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                <Eye className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 5. Tendencia 24h */}
        <Card className={`${
          summaryMetrics.trend24h.direction === 'up' ? 'bg-green-50/50 border-green-100' :
          summaryMetrics.trend24h.direction === 'down' ? 'bg-red-50/50 border-red-100' : 'bg-gray-50/50 border-gray-100'
        }`}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Tendencia 24h</p>
                <div className="flex items-center gap-1 mt-1">
                  {summaryMetrics.trend24h.direction === 'up' && (
                    <>
                      <ArrowUp className="h-5 w-5 text-green-600" />
                      <span className="text-2xl font-bold text-green-600">+{summaryMetrics.trend24h.percentage}%</span>
                    </>
                  )}
                  {summaryMetrics.trend24h.direction === 'down' && (
                    <>
                      <ArrowDown className="h-5 w-5 text-red-600" />
                      <span className="text-2xl font-bold text-red-600">-{summaryMetrics.trend24h.percentage}%</span>
                    </>
                  )}
                  {summaryMetrics.trend24h.direction === 'stable' && (
                    <>
                      <Minus className="h-5 w-5 text-gray-600" />
                      <span className="text-2xl font-bold text-gray-600">~{summaryMetrics.trend24h.percentage}%</span>
                    </>
                  )}
                </div>
              </div>
              <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                summaryMetrics.trend24h.direction === 'up' ? 'bg-green-100' :
                summaryMetrics.trend24h.direction === 'down' ? 'bg-red-100' : 'bg-gray-100'
              }`}>
                {summaryMetrics.trend24h.direction === 'up' && <TrendingUp className="h-5 w-5 text-green-600" />}
                {summaryMetrics.trend24h.direction === 'down' && <TrendingUp className="h-5 w-5 text-red-600 rotate-180" />}
                {summaryMetrics.trend24h.direction === 'stable' && <Minus className="h-5 w-5 text-gray-600" />}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tools Grid */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {mainTools.map((tool) => {
          const Icon = tool.icon;
          return (
            <Link key={tool.title} to={tool.link}>
              <Card className="cursor-pointer hover:bg-accent transition-colors">
                <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                  <div className="p-2 rounded-lg bg-muted mr-4">
                    <Icon className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-base">{tool.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{tool.description}</p>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Events Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Eventos de Tracking (Últimos 90 días)</CardTitle>
              <CardDescription>
                Todos los eventos registrados incluyendo PageView, ConversionLandingPage y más
              </CardDescription>
            </div>
            <Button
              variant="outline"
              onClick={loadEventStats}
              disabled={loading}
            >
              {loading ? 'Cargando...' : 'Actualizar'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {eventStats.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground">No hay eventos registrados en los últimos 7 días</p>
            </div>
          ) : (
            <div className="space-y-2">
              {eventStats.map((stat) => (
                <div
                  key={stat.type}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent transition-colors"
                >
                  <div>
                    <p className="font-medium">{stat.type}</p>
                    <p className="text-sm text-muted-foreground">
                      {stat.unique_users} usuario{stat.unique_users !== 1 ? 's' : ''} único{stat.unique_users !== 1 ? 's' : ''}
                      {' • '}
                      {stat.percentage.toFixed(1)}% del total
                    </p>
                  </div>
                  <Badge variant="secondary">{stat.count} eventos</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MarketingHubPage;
