import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AnalyticsService, DashboardMetrics, TrendComparisons, DashboardFilters } from '../services/AnalyticsService';
import { BrevoEmailService } from '../services/BrevoEmailService';
import TrendLineChart from '../components/dashboard/TrendLineChart';
import SourcePieChart from '../components/dashboard/SourcePieChart';
import ConversionFunnel from '../components/dashboard/ConversionFunnel';
import FilterPanel from '../components/dashboard/FilterPanel';
import { subDays, startOfDay, endOfDay } from 'date-fns';
import {
    BarChart3,
    Users,
    FileText,
    CheckCircle,
    Clock,
    TrendingUp,
    TrendingDown,
    MessageSquare,
    Calendar,
    ExternalLink,
    RefreshCw,
    Facebook,
    Globe,
    Bot,
    MousePointerClick,
    Mail,
    Zap,
    FileCheck,
    FileX
} from 'lucide-react';

export default function AdminSalesDashboard() {
    const { user, profile } = useAuth();
    const navigate = useNavigate();
    const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
    const [timeSeriesData, setTimeSeriesData] = useState<any[]>([]);
    const [trends, setTrends] = useState<TrendComparisons | null>(null);
    const [loading, setLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
    const [refreshing, setRefreshing] = useState(false);
    const [emailHistory, setEmailHistory] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState<'charts' | 'activity' | 'emails'>('charts');

    // Filter state with default values (all time - no date restrictions)
    const [filters, setFilters] = useState<DashboardFilters>({
        dateRange: 'all',
        startDate: undefined,
        endDate: undefined,
        source: 'all',
        status: 'all'
    });

    const isAdmin = profile?.role === 'admin';
    const userName = profile?.first_name || user?.email?.split('@')[0] || 'Usuario';

    useEffect(() => {
        loadDashboardData();
        // Auto-refresh every 2 minutes
        const interval = setInterval(() => {
            loadDashboardData(true);
        }, 120000);

        return () => clearInterval(interval);
    }, [user?.id, profile?.role, filters]);

    const loadDashboardData = async (silent = false) => {
        try {
            if (!silent) setLoading(true);
            else setRefreshing(true);

            // Fetch all data in parallel for performance
            const [metricsData, chartData, trendData, emailData] = await Promise.all([
                AnalyticsService.getDashboardMetrics(user?.id, profile?.role, filters),
                AnalyticsService.getTimeSeriesData(user?.id, profile?.role),
                AnalyticsService.getTrendComparisons(user?.id, profile?.role, 7),
                BrevoEmailService.getRecentEmailHistory(15)
            ]);

            // Update state with fetched data
            setMetrics(metricsData);
            setEmailHistory(emailData);

            // Transform time series data for charts
            if (chartData.labels && chartData.labels.length > 0) {
                const transformedData = chartData.labels.map((label, i) => ({
                    label,
                    leads: chartData.leadsData[i] || 0,
                    applications: chartData.applicationsData[i] || 0
                }));
                setTimeSeriesData(transformedData);
            }

            setTrends(trendData);
            setLastUpdated(new Date());
        } catch (error) {
            console.error('[Dashboard] Error loading metrics:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleFilterChange = (newFilters: any) => {
        setFilters(newFilters);
    };

    const handleResetFilters = () => {
        setFilters({
            dateRange: 'all',
            startDate: undefined,
            endDate: undefined,
            source: 'all',
            status: 'all'
        });
        // Trigger a manual refresh
        loadDashboardData(true);
    };

    const handleManualRefresh = () => {
        loadDashboardData(false);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="text-center">
                    <RefreshCw className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
                    <p className="text-gray-600">Cargando dashboard...</p>
                </div>
            </div>
        );
    }

    if (!metrics) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="text-center">
                    <p className="text-gray-600">No se pudieron cargar los datos del dashboard</p>
                    <button
                        onClick={handleManualRefresh}
                        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        Reintentar
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-12">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">
                                Dashboard {isAdmin ? 'Administrativo' : 'de Ventas'}
                            </h1>
                            <p className="text-sm text-gray-500 mt-1">
                                Bienvenido, {userName}
                            </p>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="text-right">
                                <p className="text-xs text-gray-500">Última actualización</p>
                                <p className="text-sm font-medium text-gray-700">
                                    {lastUpdated.toLocaleTimeString('es-MX')}
                                </p>
                            </div>
                            <button
                                onClick={handleManualRefresh}
                                disabled={refreshing}
                                className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 disabled:opacity-50"
                                title="Actualizar datos"
                            >
                                <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                {/* Filter Panel */}
                <FilterPanel
                    filters={filters}
                    onFilterChange={handleFilterChange}
                    onReset={handleResetFilters}
                />

                {/* 24-Hour Metric - PROMINENT AT TOP */}
                <div className="mb-8">
                    <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl shadow-xl p-8 border-2 border-green-400 hover:shadow-2xl transition-all">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-5">
                                <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-sm">
                                    <Zap className="w-10 h-10 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-white text-sm font-semibold uppercase tracking-wider mb-2">
                                        Últimas 24 Horas
                                    </h3>
                                    <p className="text-white text-5xl font-bold mb-2">
                                        {metrics.completedLast24Hours}
                                    </p>
                                    <p className="text-green-50 text-base font-medium">
                                        Solicitudes completadas (Aprobadas + Completadas)
                                    </p>
                                </div>
                            </div>
                            <div className="text-right bg-white/10 rounded-xl px-4 py-3 backdrop-blur-sm">
                                <div className="text-white/90 text-xs font-medium uppercase tracking-wide">Tiempo real</div>
                                <div className="text-white text-base font-bold mt-1">
                                    {lastUpdated.toLocaleTimeString('es-MX')}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Key Metrics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    {/* Total Applications */}
                    <MetricCard
                        title="Solicitudes Totales"
                        value={metrics.totalApplications}
                        icon={<FileText className="w-6 h-6" />}
                        color="blue"
                        trendPercent={trends?.applicationsChangePercent}
                        onClick={() => navigate('/escritorio/mis-aplicaciones')}
                    />

                    {/* Pending Applications */}
                    <MetricCard
                        title="En Cola/Pendientes"
                        value={metrics.pendingApplications}
                        icon={<Clock className="w-6 h-6" />}
                        color="yellow"
                        subtitle={`${((metrics.pendingApplications / (metrics.totalApplications || 1)) * 100).toFixed(0)}% del total`}
                    />

                    {/* Processed Applications */}
                    <MetricCard
                        title="Procesadas"
                        value={metrics.processedApplications}
                        icon={<BarChart3 className="w-6 h-6" />}
                        color="purple"
                    />

                    {/* Approved Applications */}
                    <MetricCard
                        title="Aprobadas"
                        value={metrics.approvedApplications}
                        icon={<CheckCircle className="w-6 h-6" />}
                        color="green"
                        subtitle={`${metrics.approvalRate}% tasa de aprobación`}
                    />

                    {/* Submitted With Documents */}
                    <MetricCard
                        title="Enviadas con Documentos"
                        value={metrics.submittedWithDocuments}
                        icon={<FileCheck className="w-6 h-6" />}
                        color="green"
                        subtitle="Solicitudes completas"
                    />

                    {/* Submitted Without Documents */}
                    <MetricCard
                        title="Enviadas sin Documentos"
                        value={metrics.submittedWithoutDocuments}
                        icon={<FileX className="w-6 h-6" />}
                        color="red"
                        subtitle="Requieren documentos"
                        urgent={metrics.submittedWithoutDocuments > 5}
                    />
                </div>

                {/* Website Lead Metrics */}
                <div className="mb-8">
                    <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Globe className="w-6 h-6 text-blue-600" />
                        Leads del Sitio Web
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <MetricCard
                            title="Total de Leads Web"
                            value={metrics.websiteLeads.total}
                            icon={<Users className="w-6 h-6" />}
                            color="indigo"
                            trendPercent={trends?.leadsChangePercent}
                            onClick={() => navigate(isAdmin ? '/escritorio/admin/crm' : '/escritorio/ventas/crm')}
                        />

                        <MetricCard
                            title="Leads Contactados"
                            value={metrics.websiteLeads.contacted}
                            icon={<MessageSquare className="w-6 h-6" />}
                            color="green"
                            subtitle={`${((metrics.websiteLeads.contacted / (metrics.websiteLeads.total || 1)) * 100).toFixed(0)}% contactados`}
                        />

                        <MetricCard
                            title="Sin Contactar"
                            value={metrics.websiteLeads.uncontacted}
                            icon={<Clock className="w-6 h-6" />}
                            color="red"
                            urgent={metrics.websiteLeads.uncontacted > 10}
                        />
                    </div>
                </div>

                {/* Kommo CRM Lead Metrics */}
                <div className="mb-8">
                    <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Bot className="w-6 h-6 text-purple-600" />
                        Leads de Kommo CRM
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <MetricCard
                            title="Total de Leads Kommo"
                            value={metrics.kommoLeads.total}
                            icon={<Users className="w-6 h-6" />}
                            color="purple"
                        />

                        <MetricCard
                            title="Leads Activos"
                            value={metrics.kommoLeads.active}
                            icon={<CheckCircle className="w-6 h-6" />}
                            color="green"
                            subtitle={`${((metrics.kommoLeads.active / (metrics.kommoLeads.total || 1)) * 100).toFixed(0)}% activos`}
                        />

                        <MetricCard
                            title="Leads Eliminados"
                            value={metrics.kommoLeads.deleted}
                            icon={<Clock className="w-6 h-6" />}
                            color="red"
                        />
                    </div>
                </div>

                {/* Performance Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                    <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl shadow-md p-8 border-2 border-orange-200 hover:border-orange-300 hover:shadow-lg transition-all">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold text-gray-900">Tasa de Conversión</h3>
                            <div className="p-3 bg-orange-100 rounded-xl">
                                <TrendingUp className="w-6 h-6 text-orange-600" />
                            </div>
                        </div>
                        <div className="mb-4">
                            <div className="flex items-baseline gap-3 mb-2">
                                <span className="text-5xl font-black text-orange-600">
                                    {metrics.conversionRate}%
                                </span>
                            </div>
                            <span className="text-sm font-medium text-gray-600">Leads a Solicitudes</span>
                        </div>
                        {trends?.conversionChangePercent !== undefined && trends.conversionChangePercent !== 0 && (
                            <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg mb-4 ${
                                trends.conversionChangePercent > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                            }`}>
                                {trends.conversionChangePercent > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                                <span className="text-sm font-bold">
                                    {trends.conversionChangePercent > 0 ? '+' : ''}{trends.conversionChangePercent.toFixed(1)}%
                                </span>
                                <span className="text-xs font-medium opacity-80">vs anterior</span>
                            </div>
                        )}
                        <div className="w-full bg-gray-300 rounded-full h-3 shadow-inner">
                            <div
                                className="bg-gradient-to-r from-orange-500 to-orange-600 h-3 rounded-full transition-all duration-700 shadow-sm"
                                style={{ width: `${Math.min(metrics.conversionRate, 100)}%` }}
                            />
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl shadow-md p-8 border-2 border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold text-gray-900">Tasa de Aprobación</h3>
                            <div className="p-3 bg-gray-200 rounded-xl">
                                <CheckCircle className="w-6 h-6 text-gray-600" />
                            </div>
                        </div>
                        <div className="mb-4">
                            <div className="flex items-baseline gap-3 mb-2">
                                <span className="text-5xl font-black text-gray-700">
                                    {metrics.approvalRate}%
                                </span>
                            </div>
                            <span className="text-sm font-medium text-gray-600">Solicitudes Aprobadas</span>
                        </div>
                        {trends?.approvalChangePercent !== undefined && trends.approvalChangePercent !== 0 && (
                            <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg mb-4 ${
                                trends.approvalChangePercent > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                            }`}>
                                {trends.approvalChangePercent > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                                <span className="text-sm font-bold">
                                    {trends.approvalChangePercent > 0 ? '+' : ''}{trends.approvalChangePercent.toFixed(1)}%
                                </span>
                                <span className="text-xs font-medium opacity-80">vs anterior</span>
                            </div>
                        )}
                        <div className="w-full bg-gray-300 rounded-full h-3 shadow-inner">
                            <div
                                className="bg-gradient-to-r from-gray-500 to-gray-600 h-3 rounded-full transition-all duration-700 shadow-sm"
                                style={{ width: `${Math.min(metrics.approvalRate, 100)}%` }}
                            />
                        </div>
                    </div>
                </div>

                {/* Source Attribution */}
                <div className="bg-white rounded-2xl shadow-md p-8 border-2 border-gray-200 mb-10 hover:border-gray-300 hover:shadow-lg transition-all">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-xl font-bold text-gray-900">Atribución por Fuente</h3>
                        <div className="px-3 py-1 bg-gray-100 rounded-lg">
                            <span className="text-sm font-semibold text-gray-600">{metrics.totalLeads} Total</span>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        <SourceCard
                            name="Facebook"
                            count={metrics.sourceBreakdown.facebook}
                            total={metrics.totalLeads}
                            icon={<Facebook className="w-6 h-6" />}
                            color="blue"
                        />
                        <SourceCard
                            name="Google"
                            count={metrics.sourceBreakdown.google}
                            total={metrics.totalLeads}
                            icon={<Globe className="w-6 h-6" />}
                            color="red"
                        />
                        <SourceCard
                            name="Bot/WhatsApp"
                            count={metrics.sourceBreakdown.bot}
                            total={metrics.totalLeads}
                            icon={<Bot className="w-6 h-6" />}
                            color="green"
                        />
                        <SourceCard
                            name="Directo"
                            count={metrics.sourceBreakdown.direct}
                            total={metrics.totalLeads}
                            icon={<MousePointerClick className="w-6 h-6" />}
                            color="purple"
                        />
                        <SourceCard
                            name="Otros"
                            count={metrics.sourceBreakdown.other}
                            total={metrics.totalLeads}
                            icon={<Globe className="w-6 h-6" />}
                            color="gray"
                        />
                    </div>
                </div>

                {/* Tabs for Charts, Recent Activity, and Email History */}
                <div className="bg-white rounded-2xl shadow-md border-2 border-gray-200 mb-8">
                    {/* Tab Headers */}
                    <div className="flex border-b-2 border-gray-100 px-2 pt-2">
                        <button
                            onClick={() => setActiveTab('charts')}
                            className={`px-6 py-3 text-sm font-semibold transition-all rounded-t-xl ${
                                activeTab === 'charts'
                                    ? 'bg-orange-50 border-b-4 border-orange-600 text-orange-700'
                                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                            }`}
                        >
                            📈 Gráficas y Análisis
                        </button>
                        <button
                            onClick={() => setActiveTab('activity')}
                            className={`px-6 py-3 text-sm font-semibold transition-all rounded-t-xl ${
                                activeTab === 'activity'
                                    ? 'bg-orange-50 border-b-4 border-orange-600 text-orange-700'
                                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                            }`}
                        >
                            🔄 Actividad Reciente
                        </button>
                        <button
                            onClick={() => setActiveTab('emails')}
                            className={`px-6 py-3 text-sm font-semibold transition-all rounded-t-xl ${
                                activeTab === 'emails'
                                    ? 'bg-orange-50 border-b-4 border-orange-600 text-orange-700'
                                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                            }`}
                        >
                            📧 Historial de Emails
                        </button>
                    </div>

                    {/* Tab Content */}
                    <div className="p-8">
                        {/* Charts Tab */}
                        {activeTab === 'charts' && (
                            <div className="space-y-8">
                                {/* 30-Day Trends Chart */}
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900 mb-4">Tendencia de 30 Días</h3>
                                    {timeSeriesData.length > 0 ? (
                                        <div style={{ height: '280px' }}>
                                            <TrendLineChart data={timeSeriesData} />
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-center h-64 text-gray-400">
                                            <p>Cargando datos de tendencias...</p>
                                        </div>
                                    )}
                                </div>

                                {/* Enhanced Source Attribution with Pie Chart */}
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900 mb-4">Distribución de Fuentes</h3>
                                    <SourcePieChart data={metrics.sourceBreakdown} height={280} />
                                </div>

                                {/* Conversion Funnel */}
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900 mb-4">Pipeline de Conversión</h3>
                                    <ConversionFunnel metrics={{
                                        totalLeads: metrics.totalLeads,
                                        contactedLeads: metrics.contactedLeads,
                                        totalApplications: metrics.totalApplications,
                                        processedApplications: metrics.processedApplications,
                                        approvedApplications: metrics.approvedApplications
                                    }} />
                                </div>
                            </div>
                        )}

                        {/* Activity Tab */}
                        {activeTab === 'activity' && (
                            <div className="space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Recent Website Leads */}
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                                            <Globe className="w-5 h-5 text-blue-600" />
                                            Leads Web Recientes
                                        </h3>
                                        <div className="space-y-2 max-h-96 overflow-y-auto">
                                            {metrics.recentLeads.length === 0 ? (
                                                <p className="text-sm text-gray-500 text-center py-4">No hay leads web recientes</p>
                                            ) : (
                                                metrics.recentLeads.map((lead) => (
                                                    <div
                                                        key={lead.id}
                                                        onClick={() => navigate(isAdmin ? `/escritorio/admin/cliente/${lead.id}` : `/escritorio/ventas/cliente/${lead.id}`)}
                                                        className="flex items-center justify-between p-2 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                                                    >
                                                        <div className="flex-1">
                                                            <p className="font-medium text-gray-900 text-sm">
                                                                {lead.first_name} {lead.last_name}
                                                            </p>
                                                            <p className="text-xs text-gray-500">{lead.email}</p>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            {lead.contactado ? (
                                                                <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded">
                                                                    Contactado
                                                                </span>
                                                            ) : (
                                                                <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-700 rounded">
                                                                    Pendiente
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>

                                    {/* Recent Applications */}
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-900 mb-4">Solicitudes Recientes</h3>
                                        <div className="space-y-2 max-h-96 overflow-y-auto">
                                            {metrics.recentApplications.length === 0 ? (
                                                <p className="text-sm text-gray-500 text-center py-4">No hay solicitudes recientes</p>
                                            ) : (
                                                metrics.recentApplications.map((app) => (
                                                    <div
                                                        key={app.id}
                                                        onClick={() => navigate(`/escritorio/aplicacion/${app.id}`)}
                                                        className="flex items-center justify-between p-2 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                                                    >
                                                        <div className="flex-1">
                                                            <p className="font-medium text-gray-900 text-sm">
                                                                Solicitud #{app.id.slice(0, 8)}
                                                            </p>
                                                            <p className="text-xs text-gray-500">
                                                                {new Date(app.created_at).toLocaleDateString('es-MX')}
                                                            </p>
                                                        </div>
                                                        <StatusBadge status={app.status} />
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Recent Kommo Leads */}
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                                        <Bot className="w-5 h-5 text-purple-600" />
                                        Leads Kommo CRM Recientes
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {metrics.recentKommoLeads.length === 0 ? (
                                            <p className="text-sm text-gray-500 text-center py-4 col-span-full">No hay leads de Kommo recientes</p>
                                        ) : (
                                            metrics.recentKommoLeads.map((lead) => (
                                                <div
                                                    key={lead.id}
                                                    className="p-3 bg-purple-50 rounded-lg border border-purple-200 hover:border-purple-300 transition-colors"
                                                >
                                                    <div className="flex items-start justify-between mb-2">
                                                        <p className="font-medium text-gray-900 text-sm flex-1">
                                                            {lead.name || `Lead #${lead.kommo_id}`}
                                                        </p>
                                                        {!lead.is_deleted && (
                                                            <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded ml-2">
                                                                Activo
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-gray-600 mb-1">
                                                        ID: {lead.kommo_id}
                                                    </p>
                                                    {lead.price > 0 && (
                                                        <p className="text-xs font-semibold text-purple-700">
                                                            ${lead.price.toLocaleString('es-MX')} MXN
                                                        </p>
                                                    )}
                                                    <p className="text-xs text-gray-500 mt-2">
                                                        {new Date(lead.created_at).toLocaleDateString('es-MX')}
                                                    </p>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Email History Tab */}
                        {activeTab === 'emails' && (
                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-xl font-bold text-gray-900">Últimos Emails Enviados (Brevo)</h3>
                                    <Mail className="w-5 h-5 text-gray-400" />
                                </div>
                                {emailHistory.length === 0 ? (
                                    <div className="text-center py-8 text-gray-500">
                                        <Mail className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                                        <p className="text-sm">No hay historial de emails disponible</p>
                                        <p className="text-xs text-gray-400 mt-1">
                                            Los emails se registrarán automáticamente cuando se envíen
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-2 max-h-96 overflow-y-auto">
                                        {emailHistory.map((email, index) => (
                                            <div
                                                key={email.id || index}
                                                className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                                            >
                                                <div className="p-2 bg-blue-100 rounded-lg">
                                                    <Mail className="w-4 h-4 text-blue-600" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <p className="font-medium text-gray-900 text-sm truncate">
                                                            {email.recipient_email || email.to || 'Sin destinatario'}
                                                        </p>
                                                        <span className={`text-xs px-2 py-1 rounded ${
                                                            email.status === 'sent' || email.status === 'delivered'
                                                                ? 'bg-green-100 text-green-700'
                                                                : email.status === 'failed'
                                                                ? 'bg-red-100 text-red-700'
                                                                : 'bg-gray-100 text-gray-700'
                                                        }`}>
                                                            {email.status || 'unknown'}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-gray-600 mb-1">
                                                        {email.template_type || email.subject || 'Sin asunto'}
                                                    </p>
                                                    <p className="text-xs text-gray-400">
                                                        {new Date(email.created_at || email.sent_at).toLocaleString('es-MX')}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Tasks and Actions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div className="bg-white rounded-xl shadow-sm p-6 border-2 border-gray-200">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-bold text-gray-900">Tareas y Recordatorios</h3>
                            <Calendar className="w-6 h-6 text-gray-400" />
                        </div>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between py-3 border-b border-gray-100">
                                <span className="text-gray-600">Recordatorios pendientes</span>
                                <span className="text-2xl font-bold text-orange-600">{metrics.pendingReminders}</span>
                            </div>
                            <div className="flex items-center justify-between py-3">
                                <span className="text-gray-600">Tareas para hoy</span>
                                <span className="text-2xl font-bold text-gray-700">{metrics.tasksToday}</span>
                            </div>
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="bg-white rounded-xl shadow-sm p-6 border-2 border-gray-200">
                        <h3 className="text-xl font-bold text-gray-900 mb-4">Acciones Rápidas</h3>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => navigate(isAdmin ? '/escritorio/admin/crm' : '/escritorio/ventas/crm')}
                                className="flex items-center justify-center gap-2 py-3 px-4 bg-orange-50 text-orange-700 rounded-lg hover:bg-orange-100 transition-colors"
                            >
                                <Users className="w-4 h-4" />
                                <span className="text-sm font-medium">Ver Leads</span>
                            </button>
                            <button
                                onClick={() => navigate('/escritorio/mis-aplicaciones')}
                                className="flex items-center justify-center gap-2 py-3 px-4 bg-orange-50 text-orange-700 rounded-lg hover:bg-orange-100 transition-colors"
                            >
                                <FileText className="w-4 h-4" />
                                <span className="text-sm font-medium">Solicitudes</span>
                            </button>
                            <button
                                onClick={() => navigate('/escritorio/seguimiento')}
                                className="flex items-center justify-center gap-2 py-3 px-4 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                            >
                                <BarChart3 className="w-4 h-4" />
                                <span className="text-sm font-medium">Tracking</span>
                            </button>
                            <button
                                onClick={() => navigate('/escritorio/autos')}
                                className="flex items-center justify-center gap-2 py-3 px-4 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                            >
                                <FileText className="w-4 h-4" />
                                <span className="text-sm font-medium">Inventario</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Marketing Links */}
                <div className="bg-gradient-to-r from-gray-700 to-gray-800 rounded-xl shadow-md p-6 text-white mb-8">
                    <h3 className="text-xl font-bold mb-4">Enlaces de Marketing</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <a
                            href="https://trefa.mx"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 py-2 px-4 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
                        >
                            <ExternalLink className="w-4 h-4" />
                            <span className="text-sm font-medium">Portal Principal</span>
                        </a>
                        <a
                            href="https://trefa.mx/solicitud"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 py-2 px-4 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
                        >
                            <ExternalLink className="w-4 h-4" />
                            <span className="text-sm font-medium">Formulario de Solicitud</span>
                        </a>
                        <a
                            href="https://trefa.mx/inventario"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 py-2 px-4 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
                        >
                            <ExternalLink className="w-4 h-4" />
                            <span className="text-sm font-medium">Inventario Público</span>
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Helper Components

interface MetricCardProps {
    title: string;
    value: number;
    icon: React.ReactNode;
    color: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'indigo';
    subtitle?: string;
    urgent?: boolean;
    onClick?: () => void;
    trendPercent?: number;
}

function MetricCard({ title, value, icon, color, subtitle, urgent, onClick, trendPercent }: MetricCardProps) {
    const textColorClasses = {
        blue: 'text-orange-600',
        green: 'text-orange-600',
        yellow: 'text-orange-600',
        red: 'text-orange-600',
        purple: 'text-gray-700',
        indigo: 'text-gray-700'
    };

    const bgColorClasses = {
        blue: 'bg-orange-50',
        green: 'bg-orange-50',
        yellow: 'bg-orange-100',
        red: 'bg-orange-100',
        purple: 'bg-gray-50',
        indigo: 'bg-gray-100'
    };

    return (
        <div
            onClick={onClick}
            className={`${bgColorClasses[color]} rounded-xl shadow-sm p-8 border-2 ${
                urgent ? 'border-orange-400 ring-2 ring-orange-200' : 'border-gray-200'
            } ${onClick ? 'cursor-pointer hover:shadow-md transition-all duration-200' : ''} hover:border-orange-300`}
        >
            <div className="flex items-start justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-900">{title}</h3>
                {trendPercent !== undefined && trendPercent !== 0 && (
                    <div className={`flex items-center gap-1 px-3 py-1.5 rounded-lg ${trendPercent > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {trendPercent > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                        <span className="text-sm font-bold">
                            {trendPercent > 0 ? '+' : ''}{trendPercent.toFixed(1)}%
                        </span>
                    </div>
                )}
            </div>
            <p className={`text-5xl font-black ${textColorClasses[color]} mb-3`}>{value}</p>
            {subtitle && <p className="text-base font-medium text-gray-600">{subtitle}</p>}
        </div>
    );
}

interface SourceCardProps {
    name: string;
    count: number;
    total: number;
    icon: React.ReactNode;
    color: 'blue' | 'red' | 'green' | 'purple' | 'gray';
}

function SourceCard({ name, count, total, icon, color }: SourceCardProps) {
    const percentage = total > 0 ? ((count / total) * 100).toFixed(0) : 0;

    const colorClasses = {
        blue: 'bg-orange-100 text-orange-600 border-orange-200',
        red: 'bg-orange-200 text-orange-700 border-orange-300',
        green: 'bg-orange-100 text-orange-600 border-orange-200',
        purple: 'bg-gray-100 text-gray-600 border-gray-200',
        gray: 'bg-gray-100 text-gray-600 border-gray-200'
    };

    const bgClasses = {
        blue: 'bg-orange-50',
        red: 'bg-orange-100',
        green: 'bg-orange-50',
        purple: 'bg-gray-50',
        gray: 'bg-gray-100'
    };

    return (
        <div className={`text-center p-5 rounded-xl ${bgClasses[color]} border-2 ${colorClasses[color].split(' ')[2]} hover:shadow-md transition-all`}>
            <div className={`inline-flex p-4 rounded-xl ${colorClasses[color].split(' ').slice(0, 2).join(' ')} mb-4 shadow-sm`}>
                {icon}
            </div>
            <p className="text-3xl font-black text-gray-900 mb-2">{count}</p>
            <p className="text-sm font-semibold text-gray-600 mb-3">{name}</p>
            <div className="inline-block px-3 py-1.5 bg-white rounded-full shadow-sm border border-gray-200">
                <p className="text-xs font-bold text-gray-700">{percentage}%</p>
            </div>
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    const statusConfig: Record<string, { label: string; className: string }> = {
        pending: { label: 'Pendiente', className: 'bg-yellow-100 text-yellow-700' },
        submitted: { label: 'Enviada', className: 'bg-blue-100 text-blue-700' },
        processing: { label: 'Procesando', className: 'bg-purple-100 text-purple-700' },
        processed: { label: 'Procesada', className: 'bg-indigo-100 text-indigo-700' },
        approved: { label: 'Aprobada', className: 'bg-green-100 text-green-700' },
        rejected: { label: 'Rechazada', className: 'bg-red-100 text-red-700' }
    };

    const config = statusConfig[status] || { label: status, className: 'bg-gray-100 text-gray-700' };

    return (
        <span className={`text-xs px-2 py-1 rounded ${config.className}`}>
            {config.label}
        </span>
    );
}
