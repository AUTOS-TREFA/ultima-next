'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { usePathname } from 'next/navigation';
import {
  TrendingUp, Users, DollarSign, BarChart3, Package, Car,
  AlertTriangle, RefreshCw, ArrowUpRight, ArrowDownRight,
  ExternalLink, FileText, Activity
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MetricsService, type FunnelMetrics, type MetaFunnelMetrics, type SourceMetrics } from '@/services/MetricsService';
import { BusinessAnalyticsService, type BusinessMetrics } from '@/services/BusinessAnalyticsService';
import { supabase } from '@/lib/supabase/client';
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend
} from 'recharts';

const COLORS = ['#e2673d', '#2a9d8f', '#264653', '#e9c46a', '#f4a261'];

interface DashboardData {
  marketing: {
    funnel: FunnelMetrics;
    metaFunnel: MetaFunnelMetrics;
    sources: SourceMetrics[];
    totalVisits: number;
    uniqueVisitors: number;
    last24hRegistrations: number;
    last24hVisits: number;
    last7dSubmissions: number;
    previous7dSubmissions: number;
  };
  business: BusinessMetrics;
}

export default function UnifiedAdminDashboard() {
  const router = useRouter();
  const pathname = usePathname();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [activeTab, setActiveTab] = useState('overview');

  // Pagination states
  const [sourcesPage, setSourcesPage] = useState(1);
  const [vehiclesPage, setVehiclesPage] = useState(1);
  const [unavailablePage, setUnavailablePage] = useState(1);
  const sourcesPerPage = 10;
  const vehiclesPerPage = 10;
  const unavailablePerPage = 10;

  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    loadAllData();
  }, [dateRange]);

  const loadAllData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Calculate date ranges for 24h and 7d metrics
      const now = new Date();
      const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
      const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const previous7d = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString();

      // Use optimized RPC functions for better performance
      const [funnelMetrics, metaFunnelMetrics, sourceMetrics, totalVisits, uniqueVisitors, businessMetrics] = await Promise.all([
        MetricsService.getFunnelMetricsOptimized(dateRange.startDate, dateRange.endDate),
        MetricsService.getMetaFunnelMetrics(dateRange.startDate, dateRange.endDate),
        MetricsService.getSourceMetrics(dateRange.startDate, dateRange.endDate),
        MetricsService.getTotalSiteVisits(dateRange.startDate, dateRange.endDate),
        MetricsService.getUniqueSiteVisitors(dateRange.startDate, dateRange.endDate),
        BusinessAnalyticsService.getBusinessMetrics()
      ]);

      // Get 24h registrations (ConversionLandingPage events)
      const { count: last24hRegs } = await supabase
        .from('tracking_events')
        .select('*', { count: 'exact', head: true })
        .eq('event_type', 'ConversionLandingPage')
        .gte('created_at', last24h);

      // Get 24h visits (PageView events)
      const { count: last24hPageViews } = await supabase
        .from('tracking_events')
        .select('*', { count: 'exact', head: true })
        .eq('event_type', 'PageView')
        .gte('created_at', last24h);

      // Get 7d submissions (ApplicationSubmission events)
      const { count: last7dSubs } = await supabase
        .from('tracking_events')
        .select('*', { count: 'exact', head: true })
        .eq('event_type', 'ApplicationSubmission')
        .gte('created_at', last7d);

      // Get previous 7d submissions for comparison
      const { count: previous7dSubs } = await supabase
        .from('tracking_events')
        .select('*', { count: 'exact', head: true })
        .eq('event_type', 'ApplicationSubmission')
        .gte('created_at', previous7d)
        .lt('created_at', last7d);

      setData({
        marketing: {
          funnel: funnelMetrics,
          metaFunnel: metaFunnelMetrics,
          sources: sourceMetrics.slice(0, 10),
          totalVisits,
          uniqueVisitors,
          last24hRegistrations: last24hRegs || 0,
          last24hVisits: last24hPageViews || 0,
          last7dSubmissions: last7dSubs || 0,
          previous7dSubmissions: previous7dSubs || 0
        },
        business: businessMetrics
      });

      setLastUpdated(new Date());
    } catch (err) {
      console.error('[UnifiedDashboard] Error loading data:', err);
      setError(err instanceof Error ? err.message : 'Error cargando datos');
    } finally {
      setLoading(false);
    }
  };

  const calculateConversionRate = (converted: number, total: number) => {
    return total > 0 ? ((converted / total) * 100).toFixed(1) : '0.0';
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('es-MX').format(num);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <RefreshCw className="w-12 h-12 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <AlertTriangle className="w-12 h-12 text-destructive mx-auto" />
              <h2 className="text-xl font-semibold">Error al cargar datos</h2>
              <p className="text-sm text-muted-foreground">{error || 'Ocurrió un error desconocido'}</p>
              <Button onClick={() => loadAllData()}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Reintentar
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { marketing, business } = data;

  // Preparar datos para gráficas
  const funnelData = [
    { name: 'Landing Views', value: marketing.funnel.landing_page_views, fill: COLORS[0] },
    { name: 'Registros', value: marketing.funnel.registrations, fill: COLORS[1] },
    { name: 'Perfil Completo', value: marketing.funnel.profile_completes, fill: COLORS[2] },
    { name: 'Perfilación Bancaria', value: marketing.funnel.bank_profiling_completes, fill: COLORS[3] },
    { name: 'Solicitudes Iniciadas', value: marketing.funnel.application_starts, fill: COLORS[4] },
    { name: 'Leads Completos', value: marketing.funnel.lead_completes, fill: COLORS[0] }
  ];

  const topSources = marketing.sources.map(s => ({
    name: s.source,
    eventos: s.count,
    conversiones: s.conversions,
    tasa: parseFloat(s.conversionRate.toFixed(1))
  }));

  const conversionOverall = calculateConversionRate(marketing.funnel.lead_completes, marketing.funnel.landing_page_views);
  const landingToRegistration = calculateConversionRate(marketing.funnel.registrations, marketing.funnel.landing_page_views);

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard Administrativo</h1>
          <p className="text-muted-foreground">Vista unificada de métricas de marketing y negocio</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right text-sm">
            <p className="text-muted-foreground">Última actualización</p>
            <p className="font-medium">{lastUpdated.toLocaleTimeString('es-MX')}</p>
          </div>
          <Button variant="outline" size="icon" onClick={loadAllData}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Date Range Selector */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Fecha Inicio</label>
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Fecha Fin</label>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Resumen</TabsTrigger>
          <TabsTrigger value="marketing">Marketing</TabsTrigger>
          <TabsTrigger value="business">Negocio</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* KPI Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* Box 1: Total Leads Registrados (últimas 24h) */}
            <Card className="bg-blue-50/50 border-blue-100">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Leads Registrados (24h)</CardTitle>
                <Users className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{formatNumber(marketing.last24hRegistrations)}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Últimas 24 horas
                </p>
              </CardContent>
            </Card>

            {/* Box 2: Tasa de Registro vs Visitas (últimas 24h) */}
            <Card className="bg-green-50/50 border-green-100">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Tasa Registro vs Visitas (24h)</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {calculateConversionRate(marketing.last24hRegistrations, marketing.last24hVisits)}%
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatNumber(marketing.last24hRegistrations)} registros de {formatNumber(marketing.last24hVisits)} visitas
                </p>
              </CardContent>
            </Card>

            {/* Box 3: Solicitudes Activas (mantener como está) */}
            <Card className="bg-purple-50/50 border-purple-100">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Solicitudes Activas</CardTitle>
                <FileText className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">{business.totalActiveApplications}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {marketing.funnel.application_submissions} totales enviadas
                </p>
              </CardContent>
            </Card>

            {/* Box 4: Tendencia de Solicitudes Concluidas (últimos 7 días) */}
            <Card className={`${
              marketing.last7dSubmissions > marketing.previous7dSubmissions
                ? 'bg-green-50/50 border-green-100'
                : marketing.last7dSubmissions < marketing.previous7dSubmissions
                ? 'bg-red-50/50 border-red-100'
                : 'bg-gray-50/50 border-gray-100'
            }`}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Solicitudes Concluidas (7d)</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <div className={`text-2xl font-bold ${
                    marketing.last7dSubmissions > marketing.previous7dSubmissions
                      ? 'text-green-600'
                      : marketing.last7dSubmissions < marketing.previous7dSubmissions
                      ? 'text-red-600'
                      : 'text-gray-600'
                  }`}>
                    {formatNumber(marketing.last7dSubmissions)}
                  </div>
                  {marketing.previous7dSubmissions > 0 && (
                    <span className={`text-sm ${
                      marketing.last7dSubmissions > marketing.previous7dSubmissions
                        ? 'text-green-600'
                        : marketing.last7dSubmissions < marketing.previous7dSubmissions
                        ? 'text-red-600'
                        : 'text-gray-600'
                    }`}>
                      {marketing.last7dSubmissions > marketing.previous7dSubmissions ? '+' : ''}
                      {marketing.previous7dSubmissions > 0
                        ? Math.round(((marketing.last7dSubmissions - marketing.previous7dSubmissions) / marketing.previous7dSubmissions) * 100)
                        : 0}%
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  vs {formatNumber(marketing.previous7dSubmissions)} la semana anterior
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Funnel Visualization */}
          <Card>
            <CardHeader>
              <CardTitle>Embudo de Conversión</CardTitle>
              <CardDescription>De visita a lead completo</CardDescription>
            </CardHeader>
            <CardContent>
              {funnelData && funnelData.length > 0 ? (
                <div style={{ width: '100%', height: 300, minHeight: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsBarChart data={funnelData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value" fill={COLORS[0]} />
                    </RechartsBarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                  <p>No hay datos disponibles</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Leads Registered vs Applications Submitted */}
          <Card>
            <CardHeader>
              <CardTitle>Leads Registrados vs Aplicaciones Enviadas</CardTitle>
              <CardDescription>Comparación de registros vs conversiones</CardDescription>
            </CardHeader>
            <CardContent>
              <div style={{ width: '100%', height: 300, minHeight: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsBarChart
                    data={[
                      {
                        name: 'Leads',
                        registrados: marketing.funnel.registrations,
                        aplicaciones: marketing.funnel.application_submissions,
                      },
                    ]}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="registrados" fill={COLORS[1]} name="Leads Registrados" />
                    <Bar dataKey="aplicaciones" fill={COLORS[2]} name="Aplicaciones Enviadas" />
                  </RechartsBarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-sm text-muted-foreground">Registrados</p>
                  <p className="text-2xl font-bold">{formatNumber(marketing.funnel.registrations)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Aplicaciones</p>
                  <p className="text-2xl font-bold">{formatNumber(marketing.funnel.application_submissions)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Tasa de Conversión</p>
                  <p className="text-2xl font-bold">
                    {calculateConversionRate(
                      marketing.funnel.application_submissions,
                      marketing.funnel.registrations
                    )}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Acciones Rápidas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link href="/escritorio/admin/marketing-analytics">
                  <Button variant="outline" className="w-full justify-between">
                    Marketing Analytics Detallado
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/escritorio/admin/crm">
                  <Button variant="outline" className="w-full justify-between">
                    CRM y Gestión de Leads
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/escritorio/admin/solicitudes">
                  <Button variant="outline" className="w-full justify-between">
                    Analytics de Solicitudes
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Top 5 Fuentes de Tráfico</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {topSources.slice(0, 5).map((source, idx) => (
                    <div key={source.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{idx + 1}</Badge>
                        <span className="text-sm font-medium">{source.name}</span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {source.conversiones} conv. ({source.tasa}%)
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Marketing Tab */}
        <TabsContent value="marketing" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Landing → Registro</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{landingToRegistration}%</div>
                <p className="text-xs text-muted-foreground">
                  {marketing.funnel.registrations} de {marketing.funnel.landing_page_views}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Meta (Facebook/Instagram)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{marketing.metaFunnel.meta_registrations}</div>
                <p className="text-xs text-muted-foreground">
                  {marketing.metaFunnel.meta_lead_completes} leads completos
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Tasa Meta</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {calculateConversionRate(
                    marketing.metaFunnel.meta_lead_completes,
                    marketing.metaFunnel.meta_landing_views
                  )}%
                </div>
                <p className="text-xs text-muted-foreground">Conversión desde Meta</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Métricas por Fuente</CardTitle>
                  <CardDescription>Eventos, conversiones y tasas por fuente de tráfico</CardDescription>
                </div>
                <Badge variant="secondary">{marketing.sources.length} fuentes</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {marketing.sources
                  .slice((sourcesPage - 1) * sourcesPerPage, sourcesPage * sourcesPerPage)
                  .map((source) => (
                    <div key={source.source} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{source.source}</p>
                        <p className="text-sm text-muted-foreground">
                          {source.users} usuarios • {source.sessions} sesiones
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{source.count} eventos</p>
                        <p className="text-sm text-green-600">
                          {source.conversions} conv. ({source.conversionRate.toFixed(1)}%)
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
              {marketing.sources.length > sourcesPerPage && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSourcesPage((p) => Math.max(1, p - 1))}
                    disabled={sourcesPage === 1}
                  >
                    Anterior
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Página {sourcesPage} de {Math.ceil(marketing.sources.length / sourcesPerPage)}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSourcesPage((p) => Math.min(Math.ceil(marketing.sources.length / sourcesPerPage), p + 1))}
                    disabled={sourcesPage >= Math.ceil(marketing.sources.length / sourcesPerPage)}
                  >
                    Siguiente
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Detalles del Embudo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { label: 'Vistas Landing Page', value: marketing.funnel.landing_page_views },
                  { label: 'Registros', value: marketing.funnel.registrations },
                  { label: 'Perfil Completo', value: marketing.funnel.profile_completes },
                  { label: 'Perfilación Bancaria', value: marketing.funnel.bank_profiling_completes },
                  { label: 'Solicitudes Iniciadas', value: marketing.funnel.application_starts },
                  { label: 'Leads Completos', value: marketing.funnel.lead_completes }
                ].map((step, idx, arr) => {
                  const prevValue = idx > 0 ? arr[idx - 1].value : step.value;
                  const rate = prevValue > 0 ? ((step.value / prevValue) * 100).toFixed(1) : '0.0';
                  return (
                    <div key={step.label} className="flex items-center justify-between">
                      <span className="text-sm font-medium">{step.label}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-muted-foreground">{rate}%</span>
                        <span className="font-semibold">{formatNumber(step.value)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Business Tab */}
        <TabsContent value="business" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Solicitudes Activas</CardTitle>
                <CardDescription>Aplicaciones en proceso</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold mb-2">{business.totalActiveApplications}</div>
                <p className="text-sm text-muted-foreground">
                  Requieren seguimiento y gestión
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Inventario con Demanda</CardTitle>
                <CardDescription>Vehículos con solicitudes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold mb-2">
                  {business.inventoryVehiclesWithApplications.filter(v => v.ongoingApplications > 0).length}
                </div>
                <p className="text-sm text-muted-foreground">
                  De {business.inventoryVehiclesWithApplications.length} vehículos totales
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Unavailable Vehicles Alert */}
          {business.unavailableVehicleApplications.length > 0 && (
            <Card className="border-destructive">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Solicitudes con Vehículos No Disponibles
                </CardTitle>
                <CardDescription>
                  {business.unavailableVehicleApplications.length} solicitudes requieren atención
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {business.unavailableVehicleApplications
                    .slice((unavailablePage - 1) * unavailablePerPage, unavailablePage * unavailablePerPage)
                    .map((app) => (
                      <div key={app.applicationId} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium">{app.vehicleTitle}</p>
                          <p className="text-sm text-muted-foreground">
                            {app.applicantName} • {app.applicantEmail}
                          </p>
                        </div>
                        <Badge variant="destructive">No disponible</Badge>
                      </div>
                    ))}
                </div>
                {business.unavailableVehicleApplications.length > unavailablePerPage && (
                  <div className="flex items-center justify-between mt-4 pt-4 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setUnavailablePage((p) => Math.max(1, p - 1))}
                      disabled={unavailablePage === 1}
                    >
                      Anterior
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      Página {unavailablePage} de {Math.ceil(business.unavailableVehicleApplications.length / unavailablePerPage)}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setUnavailablePage((p) => Math.min(Math.ceil(business.unavailableVehicleApplications.length / unavailablePerPage), p + 1))}
                      disabled={unavailablePage >= Math.ceil(business.unavailableVehicleApplications.length / unavailablePerPage)}
                    >
                      Siguiente
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Top Vehicles */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Vehículos con Más Solicitudes</CardTitle>
                  <CardDescription>Vehículos más solicitados</CardDescription>
                </div>
                <Badge variant="secondary">
                  {business.inventoryVehiclesWithApplications.filter(v => v.ongoingApplications > 0).length} vehículos
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {business.inventoryVehiclesWithApplications
                  .filter(v => v.ongoingApplications > 0)
                  .sort((a, b) => b.ongoingApplications - a.ongoingApplications)
                  .slice((vehiclesPage - 1) * vehiclesPerPage, vehiclesPage * vehiclesPerPage)
                  .map((vehicle, idx) => (
                    <div key={vehicle.vehicleId} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline">{(vehiclesPage - 1) * vehiclesPerPage + idx + 1}</Badge>
                        <div>
                          <p className="font-medium">{vehicle.vehicleTitle}</p>
                          <p className="text-xs text-muted-foreground">
                            Orden de compra: {vehicle.ordenCompra}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{vehicle.ongoingApplications}</p>
                        <p className="text-xs text-muted-foreground">solicitudes</p>
                      </div>
                    </div>
                  ))}
              </div>
              {business.inventoryVehiclesWithApplications.filter(v => v.ongoingApplications > 0).length > vehiclesPerPage && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setVehiclesPage((p) => Math.max(1, p - 1))}
                    disabled={vehiclesPage === 1}
                  >
                    Anterior
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Página {vehiclesPage} de {Math.ceil(business.inventoryVehiclesWithApplications.filter(v => v.ongoingApplications > 0).length / vehiclesPerPage)}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setVehiclesPage((p) => Math.min(Math.ceil(business.inventoryVehiclesWithApplications.filter(v => v.ongoingApplications > 0).length / vehiclesPerPage), p + 1))}
                    disabled={vehiclesPage >= Math.ceil(business.inventoryVehiclesWithApplications.filter(v => v.ongoingApplications > 0).length / vehiclesPerPage)}
                  >
                    Siguiente
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
