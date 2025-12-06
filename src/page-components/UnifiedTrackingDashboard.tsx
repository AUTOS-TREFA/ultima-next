'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  FunnelChart,
  Funnel,
  LabelList
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Users,
  Target,
  DollarSign,
  AlertCircle,
  CheckCircle,
  ArrowRight,
  Calendar,
  RefreshCw,
  Download,
  Lightbulb,
  Activity,
  Zap,
  FileText
} from 'lucide-react';
import { useTrackingDashboardMetrics } from '@/hooks/useTrackingData';
import { format, subDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { saveAs } from 'file-saver';
import type { Recommendation } from '@/types/tracking';

const UnifiedTrackingDashboard: React.FC = () => {
  const [dateRange, setDateRange] = useState({
    start: subDays(new Date(), 30),
    end: new Date()
  });

  const { data: metrics, isLoading, error, refetch } = useTrackingDashboardMetrics(
    dateRange.start,
    dateRange.end
  );

  const [selectedTab, setSelectedTab] = useState<'overview' | 'funnel' | 'campaigns' | 'sources' | 'forecast' | 'recommendations'>('overview');

  // Chart colors
  const COLORS = {
    primary: '#3b82f6',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    purple: '#8b5cf6',
    pink: '#ec4899',
    teal: '#14b8a6'
  };

  const FUNNEL_COLORS = ['#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe', '#dbeafe'];

  // Export function
  const handleExport = () => {
    if (!metrics) return;

    const exportData = {
      generatedAt: new Date().toISOString(),
      dateRange: {
        start: dateRange.start.toISOString(),
        end: dateRange.end.toISOString()
      },
      metrics: {
        conversion: metrics.conversionMetrics,
        campaigns: metrics.campaignMetrics,
        sources: metrics.sourcePerformance,
        timeSeries: metrics.timeSeriesMetrics,
        recommendations: metrics.recommendations
      }
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    saveAs(blob, `tracking-analytics-${format(new Date(), 'yyyy-MM-dd')}.json`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-600"></div>
          <p className="text-slate-600">Cargando datos de tracking...</p>
        </div>
      </div>
    );
  }

  if (error || !metrics) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <Card className="w-96">
          <CardHeader>
            <CardTitle className="text-red-600 flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Error
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-600 mb-4">
              No se pudieron cargar los datos: {error?.message || 'Error desconocido'}
            </p>
            <Button onClick={() => refetch()} className="w-full">
              <RefreshCw className="h-4 w-4 mr-2" />
              Reintentar
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { conversionMetrics, funnelData: rawFunnelData, campaignMetrics, timeSeriesMetrics, sourcePerformance, forecast, recommendations } = metrics;

  // Process funnel data to cap any step that exceeds its previous step
  // This handles cases where test users create multiple entries
  const funnelData = rawFunnelData.reduce((acc, stage, index) => {
    if (index === 0) {
      acc.push(stage);
      return acc;
    }

    const previousStage = acc[index - 1]; // Use already-capped previous stage
    const initialCount = rawFunnelData[0]?.count || 1;

    // If this stage count exceeds previous, cap it
    if (stage.count > previousStage.count) {
      const cappedCount = previousStage.count;
      const cappedPercentage = initialCount > 0
        ? Math.round((cappedCount / initialCount) * 1000) / 10
        : 0;

      acc.push({
        ...stage,
        count: cappedCount,
        percentage: cappedPercentage,
        conversionRate: 99.9, // Cap at 99.9%
        dropOffRate: 0.1
      });
    } else {
      acc.push(stage);
    }

    return acc;
  }, [] as typeof rawFunnelData);

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-[1800px] mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
              <Activity className="h-8 w-8 text-blue-600" />
              Dashboard de Tracking y Conversiones
            </h1>
            <p className="text-slate-600 mt-2">
              Análisis en tiempo real del rendimiento de campañas y funnel de conversión
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => refetch()} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualizar
            </Button>
            <Button onClick={handleExport} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
          </div>
        </div>

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Visitas Totales
              </CardDescription>
              <CardTitle className="text-3xl">{conversionMetrics.totalVisits.toLocaleString()}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-slate-600">
                Landing Page
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <Target className="h-4 w-4" />
                Registros
              </CardDescription>
              <CardTitle className="text-3xl">{conversionMetrics.totalRegistrations.toLocaleString()}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm flex items-center gap-1">
                <TrendingUp className="h-3 w-3 text-green-600" />
                <span className="text-green-600 font-semibold">
                  {Math.min(conversionMetrics.visitToRegistrationRate, 99.9)}%
                </span>
                <span className="text-slate-600">conversión</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Perfiles Completados
              </CardDescription>
              <CardTitle className="text-3xl">{conversionMetrics.totalProfileCompletes.toLocaleString()}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm flex items-center gap-1">
                <TrendingUp className="h-3 w-3 text-green-600" />
                <span className="text-green-600 font-semibold">
                  {Math.min(conversionMetrics.registrationToProfileRate, 99.9)}%
                </span>
                <span className="text-slate-600">de registros</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Solicitudes Enviadas
              </CardDescription>
              <CardTitle className="text-3xl">{conversionMetrics.totalApplications.toLocaleString()}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm flex items-center gap-1">
                <TrendingUp className="h-3 w-3 text-green-600" />
                <span className="text-green-600 font-semibold">
                  {Math.min(conversionMetrics.overallConversionRate, 99.9)}%
                </span>
                <span className="text-slate-600">conversión total</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2 text-blue-700">
                <DollarSign className="h-4 w-4" />
                Tasa de Conversión
              </CardDescription>
              <CardTitle className="text-4xl text-blue-900">
                {Math.min(conversionMetrics.overallConversionRate, 99.9)}%
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-blue-700">
                Visita → Solicitud
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Tabs */}
        <Tabs value={selectedTab} onValueChange={(v: any) => setSelectedTab(v)} className="space-y-4">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Resumen</TabsTrigger>
            <TabsTrigger value="funnel">Funnel</TabsTrigger>
            <TabsTrigger value="campaigns">Campañas</TabsTrigger>
            <TabsTrigger value="sources">Fuentes</TabsTrigger>
            <TabsTrigger value="forecast">Pronóstico</TabsTrigger>
            <TabsTrigger value="recommendations">
              <div className="flex items-center gap-1">
                <Lightbulb className="h-4 w-4" />
                Recomendaciones
                {recommendations.length > 0 && (
                  <Badge variant="destructive" className="ml-1 px-1 py-0 text-xs">
                    {recommendations.length}
                  </Badge>
                )}
              </div>
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Time Series Chart */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Tendencia de Conversiones (Últimos 30 días)</CardTitle>
                </CardHeader>
                <CardContent>
                  {timeSeriesMetrics && timeSeriesMetrics.length > 0 ? (
                    <div style={{ width: '100%', height: 350, minHeight: 350 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={timeSeriesMetrics}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Line
                            type="monotone"
                            dataKey="visits"
                            stroke={COLORS.primary}
                            name="Visitas"
                            strokeWidth={2}
                          />
                          <Line
                            type="monotone"
                            dataKey="registrations"
                            stroke={COLORS.success}
                            name="Registros"
                            strokeWidth={2}
                          />
                          <Line
                            type="monotone"
                            dataKey="applications"
                            stroke={COLORS.purple}
                            name="Solicitudes"
                            strokeWidth={2}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-[350px] text-slate-400">
                      <p>No hay datos disponibles para este período</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Conversion Rate Trend */}
              <Card>
                <CardHeader>
                  <CardTitle>Tasa de Conversión Diaria</CardTitle>
                </CardHeader>
                <CardContent>
                  {timeSeriesMetrics && timeSeriesMetrics.length > 0 ? (
                    <div style={{ width: '100%', height: 300, minHeight: 300 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={timeSeriesMetrics}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <Tooltip formatter={(value: number) => `${value}%`} />
                          <Area
                            type="monotone"
                            dataKey="conversionRate"
                            stroke={COLORS.success}
                            fill={COLORS.success}
                            fillOpacity={0.3}
                            name="Conversión %"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-[300px] text-slate-400">
                      <p>No hay datos disponibles</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Top Sources */}
              <Card>
                <CardHeader>
                  <CardTitle>Mejores Fuentes de Tráfico</CardTitle>
                  <CardDescription>Por tasa de conversión</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {sourcePerformance.slice(0, 5).map((source, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                        <div>
                          <div className="font-semibold text-slate-900">{source.source}</div>
                          <div className="text-sm text-slate-600">{source.medium}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-green-600">{source.conversionRate}%</div>
                          <div className="text-xs text-slate-500">{source.conversions}/{source.visits}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Funnel Tab */}
          <TabsContent value="funnel" className="space-y-6">
            {/* Visual Funnel Chart - Clean Design */}
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="text-2xl">Embudo de Conversión Completo</CardTitle>
                <CardDescription>
                  Flujo de usuarios desde visita en landing page hasta solicitud enviada
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                {/* Funnel Visual - Full Width Bars */}
                <div className="flex flex-col gap-3 mb-8">
                  {funnelData.map((stage, index) => {
                    const gradients = [
                      'from-blue-700 to-blue-600',
                      'from-indigo-700 to-indigo-600',
                      'from-violet-700 to-violet-600',
                      'from-fuchsia-700 to-fuchsia-600',
                      'from-emerald-700 to-emerald-600'
                    ];

                    return (
                      <div key={stage.stage} className="w-full">
                        {/* Funnel Bar - Full Width */}
                        <div
                          className={`w-full bg-gradient-to-r ${gradients[index]} rounded-xl py-5 px-6 flex items-center justify-between shadow-lg hover:shadow-xl transition-all duration-300`}
                        >
                          {/* Left: Step number and name */}
                          <div className="flex items-center gap-4">
                            <span className="bg-white text-slate-800 rounded-full w-10 h-10 flex items-center justify-center text-lg font-bold shadow">
                              {index + 1}
                            </span>
                            <div>
                              <div className="font-bold text-white text-lg">{stage.stageName}</div>
                              <div className="text-white text-sm font-medium">{stage.percentage}% del total inicial</div>
                            </div>
                          </div>

                          {/* Right: Numbers */}
                          <div className="flex items-center gap-8">
                            {/* Conversion rate from previous */}
                            {index > 0 && (
                              <div className="text-right">
                                <div className={`text-2xl font-bold ${stage.conversionRate > 50 ? 'text-green-300' : 'text-yellow-300'}`}>
                                  {stage.conversionRate}%
                                </div>
                                <div className="text-white text-sm font-medium">conversión</div>
                              </div>
                            )}
                            {/* Count */}
                            <div className="text-right min-w-[120px]">
                              <div className="text-3xl font-bold text-white">{stage.count.toLocaleString()}</div>
                              <div className="text-white text-sm font-medium">usuarios</div>
                            </div>
                          </div>
                        </div>

                        {/* Drop-off Indicator */}
                        {index < funnelData.length - 1 && (
                          <div className="flex items-center justify-center py-2">
                            <div className="flex items-center gap-2 px-4 py-1 bg-red-50 rounded-full border border-red-200">
                              <TrendingDown className="h-4 w-4 text-red-500" />
                              <span className="text-sm font-semibold text-red-600">
                                -{stage.dropOffRate}% · {(funnelData[index].count - funnelData[index + 1].count).toLocaleString()} perdidos
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Summary Stats Row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t">
                  <div className="text-center p-4 bg-slate-50 rounded-lg">
                    <div className="text-3xl font-bold text-slate-900">{Math.min(conversionMetrics.overallConversionRate, 99.9)}%</div>
                    <div className="text-sm text-slate-600 mt-1">Conversión Total</div>
                    <div className="text-xs text-slate-400">Visita → Solicitud</div>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-3xl font-bold text-blue-700">{Math.min(conversionMetrics.visitToRegistrationRate, 99.9)}%</div>
                    <div className="text-sm text-slate-600 mt-1">Tasa de Registro</div>
                    <div className="text-xs text-slate-400">De visitas</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-3xl font-bold text-purple-700">{Math.min(conversionMetrics.registrationToProfileRate, 99.9)}%</div>
                    <div className="text-sm text-slate-600 mt-1">Completan Perfil</div>
                    <div className="text-xs text-slate-400">De registros</div>
                  </div>
                  <div className="text-center p-4 bg-emerald-50 rounded-lg">
                    <div className="text-3xl font-bold text-emerald-700">{Math.min(conversionMetrics.bankProfilingToApplicationRate, 99.9)}%</div>
                    <div className="text-sm text-slate-600 mt-1">Envían Solicitud</div>
                    <div className="text-xs text-slate-400">De perfiles completos</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Detailed Stage Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              {funnelData.map((stage, index) => {
                const stageIcons = [
                  { icon: Users, color: 'text-blue-600', bg: 'bg-blue-100' },
                  { icon: CheckCircle, color: 'text-indigo-600', bg: 'bg-indigo-100' },
                  { icon: Target, color: 'text-purple-600', bg: 'bg-purple-100' },
                  { icon: FileText, color: 'text-pink-600', bg: 'bg-pink-100' },
                  { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100' }
                ];
                const IconComponent = stageIcons[index].icon;

                return (
                  <Card key={stage.stage} className="hover:shadow-lg transition-shadow border-2">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className={`p-2 rounded-lg ${stageIcons[index].bg}`}>
                          <IconComponent className={`h-5 w-5 ${stageIcons[index].color}`} />
                        </div>
                        {index > 0 && (
                          <Badge variant={stage.conversionRate > 50 ? 'default' : 'destructive'} className="text-xs">
                            {stage.conversionRate}%
                          </Badge>
                        )}
                      </div>
                      <CardTitle className="text-sm font-medium text-slate-600 mt-2">
                        {stage.stageName}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div>
                          <div className="text-3xl font-bold text-slate-900">
                            {stage.count.toLocaleString()}
                          </div>
                          <div className="text-xs text-slate-500 mt-1">
                            {stage.percentage}% del total inicial
                          </div>
                        </div>

                        {index > 0 && (
                          <div className="pt-3 border-t space-y-1">
                            <div className="flex justify-between items-center text-xs">
                              <span className="text-slate-600">Conversión:</span>
                              <span className={`font-semibold ${stage.conversionRate > 50 ? 'text-green-600' : 'text-amber-600'}`}>
                                {stage.conversionRate}%
                              </span>
                            </div>
                            <div className="flex justify-between items-center text-xs">
                              <span className="text-slate-600">Pérdida:</span>
                              <span className="text-red-600 font-semibold">
                                {stage.dropOffRate}%
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Conversion Rate Summary */}
            <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-blue-600" />
                  Resumen de Conversión
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-sm text-slate-600 mb-1">Tasa Global</div>
                    <div className="text-2xl font-bold text-blue-600">
                      {Math.min(conversionMetrics.overallConversionRate, 99.9)}%
                    </div>
                    <div className="text-xs text-slate-500">Visita → Solicitud</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-slate-600 mb-1">Registro</div>
                    <div className="text-2xl font-bold text-indigo-600">
                      {Math.min(conversionMetrics.visitToRegistrationRate, 99.9)}%
                    </div>
                    <div className="text-xs text-slate-500">De visitas</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-slate-600 mb-1">Perfil</div>
                    <div className="text-2xl font-bold text-purple-600">
                      {Math.min(conversionMetrics.registrationToProfileRate, 99.9)}%
                    </div>
                    <div className="text-xs text-slate-500">De registros</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-slate-600 mb-1">Finalización</div>
                    <div className="text-2xl font-bold text-green-600">
                      {Math.min(conversionMetrics.bankProfilingToApplicationRate, 99.9)}%
                    </div>
                    <div className="text-xs text-slate-500">Completan solicitud</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Campaigns Tab */}
          <TabsContent value="campaigns" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Rendimiento por Campaña</CardTitle>
                <CardDescription>Todas las campañas ordenadas por conversiones</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="text-left p-3 font-semibold">Campaña</th>
                        <th className="text-left p-3 font-semibold">Fuente / Medio</th>
                        <th className="text-right p-3 font-semibold">Visitas</th>
                        <th className="text-right p-3 font-semibold">Registros</th>
                        <th className="text-right p-3 font-semibold">Solicitudes</th>
                        <th className="text-right p-3 font-semibold">Conversión</th>
                      </tr>
                    </thead>
                    <tbody>
                      {campaignMetrics.map((campaign, idx) => (
                        <tr key={idx} className="border-b hover:bg-slate-50">
                          <td className="p-3 font-medium">{campaign.campaign}</td>
                          <td className="p-3 text-slate-600">
                            {campaign.source} / {campaign.medium}
                          </td>
                          <td className="p-3 text-right">{campaign.visits.toLocaleString()}</td>
                          <td className="p-3 text-right">{campaign.registrations.toLocaleString()}</td>
                          <td className="p-3 text-right font-semibold">{campaign.applications.toLocaleString()}</td>
                          <td className="p-3 text-right">
                            <Badge variant={campaign.conversionRate > 3 ? 'default' : campaign.conversionRate > 1 ? 'secondary' : 'destructive'}>
                              {campaign.conversionRate}%
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Sources Tab */}
          <TabsContent value="sources" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Rendimiento por Fuente</CardTitle>
                </CardHeader>
                <CardContent>
                  {sourcePerformance && sourcePerformance.length > 0 ? (
                    <div style={{ width: '100%', height: 300, minHeight: 300 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={sourcePerformance.slice(0, 10)}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="source" angle={-45} textAnchor="end" height={80} />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="conversionRate" fill={COLORS.primary} name="Conversión %" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-[300px] text-slate-400">
                      <p>No hay datos de fuentes disponibles</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Tiempo Promedio de Conversión</CardTitle>
                  <CardDescription>En días desde primera visita</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {sourcePerformance
                      .filter(s => s.averageTimeToConvert !== undefined)
                      .slice(0, 8)
                      .map((source, idx) => (
                        <div key={idx} className="flex items-center justify-between">
                          <span className="text-sm font-medium">{source.source}</span>
                          <span className="text-sm text-slate-600">
                            {source.averageTimeToConvert?.toFixed(1)} días
                          </span>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Forecast Tab */}
          <TabsContent value="forecast" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Pronóstico de Conversiones (Próximos 7 días)</CardTitle>
                <CardDescription>Basado en tendencias históricas</CardDescription>
              </CardHeader>
              <CardContent>
                {(timeSeriesMetrics?.length > 0 || forecast?.length > 0) ? (
                  <div style={{ width: '100%', height: 400, minHeight: 400 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={[...timeSeriesMetrics.slice(-7), ...forecast]}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="visits"
                          stroke={COLORS.primary}
                          name="Visitas (Real)"
                          strokeDasharray="5 5"
                        />
                        <Line
                          type="monotone"
                          dataKey="predictedVisits"
                          stroke={COLORS.primary}
                          name="Visitas (Pronóstico)"
                          strokeWidth={2}
                        />
                        <Line
                          type="monotone"
                          dataKey="applications"
                          stroke={COLORS.success}
                          name="Conversiones (Real)"
                          strokeDasharray="5 5"
                        />
                        <Line
                          type="monotone"
                          dataKey="predictedConversions"
                          stroke={COLORS.success}
                          name="Conversiones (Pronóstico)"
                          strokeWidth={2}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-[400px] text-slate-400">
                    <p>No hay datos disponibles para el pronóstico</p>
                  </div>
                )}
                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-900">
                    <strong>Proyección:</strong> Basado en las tendencias actuales, se esperan aproximadamente{' '}
                    <strong>{forecast.reduce((sum, f) => sum + f.predictedConversions, 0)} conversiones</strong> en los próximos 7 días.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Recommendations Tab */}
          <TabsContent value="recommendations" className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              {recommendations.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-slate-900 mb-2">
                      ¡Todo se ve bien!
                    </h3>
                    <p className="text-slate-600">
                      No hay recomendaciones urgentes en este momento.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                recommendations.map((rec) => (
                  <Card
                    key={rec.id}
                    className={`border-l-4 ${
                      rec.priority === 'high'
                        ? 'border-l-red-500 bg-red-50'
                        : rec.priority === 'medium'
                        ? 'border-l-yellow-500 bg-yellow-50'
                        : 'border-l-blue-500 bg-blue-50'
                    }`}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-lg ${
                            rec.priority === 'high'
                              ? 'bg-red-100'
                              : rec.priority === 'medium'
                              ? 'bg-yellow-100'
                              : 'bg-blue-100'
                          }`}>
                            {rec.type === 'campaign' && <Target className="h-5 w-5" />}
                            {rec.type === 'budget' && <DollarSign className="h-5 w-5" />}
                            {rec.type === 'optimization' && <Zap className="h-5 w-5" />}
                            {rec.type === 'alert' && <AlertCircle className="h-5 w-5" />}
                          </div>
                          <div>
                            <CardTitle className="text-lg">{rec.title}</CardTitle>
                            <CardDescription className="mt-1">{rec.description}</CardDescription>
                          </div>
                        </div>
                        <Badge
                          variant={
                            rec.priority === 'high'
                              ? 'destructive'
                              : rec.priority === 'medium'
                              ? 'default'
                              : 'secondary'
                          }
                        >
                          {rec.priority === 'high' ? 'Alta Prioridad' : rec.priority === 'medium' ? 'Media' : 'Baja'}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center gap-2 text-sm">
                        <TrendingUp className="h-4 w-4 text-green-600" />
                        <span className="font-semibold">Impacto:</span>
                        <span>{rec.impact}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <ArrowRight className="h-4 w-4 text-blue-600" />
                        <span className="font-semibold">Acción:</span>
                        <span>{rec.action}</span>
                      </div>
                      {rec.currentValue !== undefined && rec.potentialValue !== undefined && (
                        <div className="mt-3 p-3 bg-white rounded-lg">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm text-slate-600">Actual:</span>
                            <span className="font-semibold">{rec.currentValue}{rec.metric?.includes('Rate') ? '%' : ''}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-slate-600">Potencial:</span>
                            <span className="font-semibold text-green-600">{rec.potentialValue}{rec.metric?.includes('Rate') ? '%' : ''}</span>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default UnifiedTrackingDashboard;
