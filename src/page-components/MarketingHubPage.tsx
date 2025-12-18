'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users, TrendingUp, BarChart3, FileText, LayoutDashboard,
  Eye, ArrowUp, ArrowDown, Minus, Camera, Settings, LineChart,
  ClipboardList, Car, UserCircle, ChevronRight
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

  // Admin menu items with icons - TREFA themed
  const adminMenuItems = [
    {
      title: 'Resumen del Sitio',
      description: 'Vista general del dashboard',
      link: '/escritorio/dashboard',
      icon: LayoutDashboard
    },
    {
      title: 'Leads',
      description: 'Gestión de leads y contactos',
      link: '/escritorio/admin/crm',
      icon: Users
    },
    {
      title: 'Usuarios',
      description: 'Administrar asesores y usuarios',
      link: '/escritorio/admin/usuarios',
      icon: UserCircle
    },
    {
      title: 'Reporte de Solicitudes',
      description: 'Ver todas las solicitudes',
      link: '/escritorio/admin/solicitudes',
      icon: ClipboardList
    },
    {
      title: 'Tráfico y Conversión',
      description: 'Análisis de marketing',
      link: '/escritorio/admin/marketing-analytics',
      icon: LineChart
    },
    {
      title: 'Estadísticas de Autos',
      description: 'Análisis del inventario',
      link: '/escritorio/admin/business-analytics',
      icon: Car
    },
    {
      title: 'Cargar Fotos',
      description: 'Subir fotos a vehículos',
      link: '/escritorio/admin/cargar-fotos',
      icon: Camera
    },
    {
      title: 'Configuración Tracking',
      description: 'Configurar eventos y píxeles',
      link: '/escritorio/admin/marketing-config',
      icon: Settings
    },
  ];

  return (
    <div className="flex-1 w-full max-w-[1400px] mx-auto space-y-2 sm:space-y-3 p-2 sm:p-3 md:p-4 overflow-x-hidden">
      {/* Header */}
      <div className="pb-2">
        <h2 className="text-lg sm:text-xl md:text-2xl font-bold tracking-tight text-foreground">Panel de Administración</h2>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Centro de control y análisis del sitio
        </p>
      </div>

      {/* Summary Metrics Row */}
      <div className="grid gap-2 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {/* 1. Total Leads */}
        <Card className="bg-blue-50/70 border-blue-100/80">
          <CardContent className="p-2.5 sm:p-3">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Total Leads</p>
                <p className="text-lg sm:text-xl font-bold mt-0.5 truncate">{summaryMetrics.totalLeads.toLocaleString()}</p>
              </div>
              <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 2. Registros últimas 24 horas */}
        <Card className={`${
          summaryMetrics.registros24h.direction === 'up' ? 'bg-cyan-50/70 border-cyan-100/80' :
          summaryMetrics.registros24h.direction === 'down' ? 'bg-orange-50/50 border-orange-100' : 'bg-slate-50/50 border-slate-100'
        }`}>
          <CardContent className="p-2.5 sm:p-3">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wide truncate">Registros 24h</p>
                <p className="text-xl sm:text-2xl font-bold mt-0.5 sm:mt-1">{summaryMetrics.registros24h.count}</p>
                <p className="text-[9px] sm:text-[10px] text-muted-foreground mt-0.5 truncate">
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
              <div className={`h-8 w-8 sm:h-10 sm:w-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                summaryMetrics.registros24h.direction === 'up' ? 'bg-cyan-100' :
                summaryMetrics.registros24h.direction === 'down' ? 'bg-orange-100' : 'bg-slate-100'
              }`}>
                {summaryMetrics.registros24h.direction === 'up' && <ArrowUp className="h-4 w-4 sm:h-5 sm:w-5 text-cyan-600" />}
                {summaryMetrics.registros24h.direction === 'down' && <ArrowDown className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600" />}
                {summaryMetrics.registros24h.direction === 'stable' && <Minus className="h-4 w-4 sm:h-5 sm:w-5 text-slate-500" />}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 3. Solicitudes Enviadas */}
        <Card className="bg-green-50/70 border-green-100/80">
          <CardContent className="p-2.5 sm:p-3">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wide truncate">Solicitudes Enviadas</p>
                <p className="text-xl sm:text-2xl font-bold mt-0.5 sm:mt-1 truncate">{summaryMetrics.totalSolicitudes.toLocaleString()}</p>
              </div>
              <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 4. Total Tráfico */}
        <Card className="bg-purple-50/70 border-purple-100/80">
          <CardContent className="p-2.5 sm:p-3">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wide truncate">Total Tráfico</p>
                <p className="text-xl sm:text-2xl font-bold mt-0.5 sm:mt-1 truncate">{summaryMetrics.totalTraffic.toLocaleString()}</p>
              </div>
              <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                <Eye className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 5. Tendencia 24h */}
        <Card className={`${
          summaryMetrics.trend24h.direction === 'up' ? 'bg-green-50/70 border-green-100/80' :
          summaryMetrics.trend24h.direction === 'down' ? 'bg-red-50/50 border-red-100' : 'bg-gray-50/50 border-gray-100'
        }`}>
          <CardContent className="p-2.5 sm:p-3">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wide truncate">Tendencia 24h</p>
                <div className="flex items-center gap-1 mt-0.5 sm:mt-1">
                  {summaryMetrics.trend24h.direction === 'up' && (
                    <>
                      <ArrowUp className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 flex-shrink-0" />
                      <span className="text-xl sm:text-2xl font-bold text-green-600 truncate">+{summaryMetrics.trend24h.percentage}%</span>
                    </>
                  )}
                  {summaryMetrics.trend24h.direction === 'down' && (
                    <>
                      <ArrowDown className="h-4 w-4 sm:h-5 sm:w-5 text-red-600 flex-shrink-0" />
                      <span className="text-xl sm:text-2xl font-bold text-red-600 truncate">-{summaryMetrics.trend24h.percentage}%</span>
                    </>
                  )}
                  {summaryMetrics.trend24h.direction === 'stable' && (
                    <>
                      <Minus className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600 flex-shrink-0" />
                      <span className="text-xl sm:text-2xl font-bold text-gray-600 truncate">~{summaryMetrics.trend24h.percentage}%</span>
                    </>
                  )}
                </div>
              </div>
              <div className={`h-8 w-8 sm:h-10 sm:w-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                summaryMetrics.trend24h.direction === 'up' ? 'bg-green-100' :
                summaryMetrics.trend24h.direction === 'down' ? 'bg-red-100' : 'bg-gray-100'
              }`}>
                {summaryMetrics.trend24h.direction === 'up' && <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />}
                {summaryMetrics.trend24h.direction === 'down' && <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-red-600 rotate-180" />}
                {summaryMetrics.trend24h.direction === 'stable' && <Minus className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600" />}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Admin Menu Grid - TREFA Themed */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {adminMenuItems.map((item) => {
          const IconComponent = item.icon;
          return (
            <Link key={item.title} href={item.link}>
              <div className="group relative bg-card hover:bg-accent border border-border rounded-xl p-4 cursor-pointer transition-all duration-200 hover:shadow-md hover:border-primary/30">
                <div className="flex items-start gap-3">
                  {/* Icon container */}
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-accent flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                    <IconComponent className="w-5 h-5 text-primary" />
                  </div>
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-semibold text-card-foreground text-sm truncate">
                        {item.title}
                      </h3>
                      <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                      {item.description}
                    </p>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Events Section */}
      <Card>
        <CardHeader className="p-3 sm:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <CardTitle className="text-base sm:text-lg">Eventos de Tracking (Últimos 90 días)</CardTitle>
              <CardDescription className="text-xs sm:text-sm mt-1">
                Todos los eventos registrados incluyendo PageView, ConversionLandingPage y más
              </CardDescription>
            </div>
            <Button
              variant="outline"
              onClick={loadEventStats}
              disabled={loading}
              className="w-full sm:w-auto text-xs sm:text-sm"
            >
              {loading ? 'Cargando...' : 'Actualizar'}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-3 sm:p-6">
          {eventStats.length === 0 ? (
            <div className="text-center py-6 sm:py-8">
              <p className="text-xs sm:text-sm text-muted-foreground">No hay eventos registrados en los últimos 7 días</p>
            </div>
          ) : (
            <div className="space-y-2">
              {eventStats.map((stat) => (
                <div
                  key={stat.type}
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-2 sm:p-3 border rounded-lg hover:bg-accent transition-colors gap-2"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm sm:text-base truncate">{stat.type}</p>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      {stat.unique_users} usuario{stat.unique_users !== 1 ? 's' : ''} único{stat.unique_users !== 1 ? 's' : ''}
                      {' • '}
                      {stat.percentage.toFixed(1)}% del total
                    </p>
                  </div>
                  <Badge variant="secondary" className="text-xs whitespace-nowrap">{stat.count} eventos</Badge>
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
