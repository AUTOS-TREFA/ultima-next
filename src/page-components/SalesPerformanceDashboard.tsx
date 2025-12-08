'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../../supabaseClient';
import { SalesService } from '../services/SalesService';
import {
    Loader2,
    AlertTriangle,
    Users,
    FileText,
    Clock,
    CheckCircle2,
    TrendingUp,
    TrendingDown,
    Target,
    Award,
    Activity,
    BarChart3,
    MessageSquare,
    AlertCircle,
    BookOpen,
    Lightbulb,
    CheckSquare,
    XCircle,
    User,
    Mail,
    Phone,
    Calendar,
    ExternalLink
} from 'lucide-react';
import Link from 'next/link';
import StatsCard from '../components/StatsCard';
import { Bar, BarChart as RechartsBarChart, Pie, PieChart as RechartsPieChart, Cell, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid, Line, LineChart } from 'recharts';

const COLORS = ['#f97316', '#ea580c', '#c2410c', '#9a3412', '#7c2d12', '#431407'];
const STATUS_COLORS = {
    submitted: '#3b82f6',
    reviewing: '#eab308',
    pending_docs: '#f97316',
    approved: '#22c55e',
    rejected: '#ef4444',
    draft: '#6b7280'
};

interface SalesPerformanceMetrics {
    // Lead metrics
    total_leads: number;
    leads_contacted: number;
    leads_not_contacted: number;
    leads_with_active_app: number;
    leads_needing_follow_up: number;
    leads_actualizados: number;

    // Application metrics
    total_applications: number;
    submitted_applications: number;
    complete_applications: number;
    incomplete_applications: number;
    draft_applications: number;
    approved_applications: number;
    rejected_applications: number;

    // Performance metrics
    contact_rate: number;
    conversion_rate: number;
    completion_rate: number;
    approval_rate: number;
}

interface ApplicationDetail {
    application_id: string;
    application_status: string;
    application_created_at: string;
    application_updated_at: string;
    is_complete: boolean;
    document_count: number;
    car_info: any;
    lead_id: string;
    lead_name: string;
    lead_email: string;
    lead_phone: string;
}

const SalesPerformanceDashboard: React.FC = () => {
    const { user, profile } = useAuth();
    const [statusFilter, setStatusFilter] = useState<string | null>(null);

    // Fetch comprehensive performance metrics
    const { data: performanceMetrics, isLoading: loadingMetrics, isError: isErrorMetrics, error: errorMetrics } = useQuery<SalesPerformanceMetrics, Error>({
        queryKey: ['salesPerformanceMetrics', user?.id],
        queryFn: async () => {
            const { data, error } = await supabase.rpc('get_sales_performance_metrics', {
                sales_user_id: user?.id
            });
            if (error) throw error;
            return data?.[0] || {};
        },
        enabled: !!user?.id,
    });

    // Fetch applications by status for the sales user
    const { data: applicationsByStatus, isLoading: loadingAppsByStatus } = useQuery<any[], Error>({
        queryKey: ['salesApplicationsByStatus', user?.id],
        queryFn: async () => {
            const { data, error } = await supabase.rpc('get_sales_applications_by_status', {
                sales_user_id: user?.id
            });
            if (error) throw error;
            return data || [];
        },
        enabled: !!user?.id,
    });

    // Fetch detailed applications list
    const { data: detailedApplications, isLoading: loadingDetails } = useQuery<ApplicationDetail[], Error>({
        queryKey: ['salesDetailedApplications', user?.id, statusFilter],
        queryFn: async () => {
            const { data, error } = await supabase.rpc('get_sales_detailed_applications', {
                sales_user_id: user?.id,
                status_filter: statusFilter
            });
            if (error) throw error;
            return data || [];
        },
        enabled: !!user?.id,
    });

    // Fetch my assigned leads
    const { data: myLeads = [], isLoading: loadingLeads } = useQuery<any[], Error>({
        queryKey: ['salesAssignedLeads', user?.id],
        queryFn: () => SalesService.getMyAssignedLeads(user?.id || ''),
        enabled: !!user?.id,
    });

    const getStatusBadge = (status: string) => {
        const statusConfig: Record<string, { color: string; label: string }> = {
            submitted: { color: 'bg-blue-100 text-blue-800', label: 'Enviada' },
            reviewing: { color: 'bg-yellow-100 text-yellow-800', label: 'En Revisión' },
            pending_docs: { color: 'bg-orange-100 text-orange-800', label: 'Documentos Pendientes' },
            approved: { color: 'bg-green-100 text-green-800', label: 'Aprobada' },
            rejected: { color: 'bg-red-100 text-red-800', label: 'Rechazada' },
            draft: { color: 'bg-gray-100 text-gray-800', label: 'Borrador' }
        };

        const config = statusConfig[status] || { color: 'bg-gray-100 text-gray-800', label: status };

        return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
                {config.label}
            </span>
        );
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('es-MX', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const isLoading = loadingMetrics || loadingAppsByStatus || loadingDetails || loadingLeads;
    const isError = isErrorMetrics;
    const error = errorMetrics;

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-full">
                <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
            </div>
        );
    }

    if (isError) {
        return (
            <div className="p-4 bg-red-100 text-red-800 rounded-md">
                <AlertTriangle className="inline w-5 h-5 mr-2"/>
                {error?.message}
            </div>
        );
    }

    const metrics = performanceMetrics || {} as SalesPerformanceMetrics;

    // Prepare chart data
    const statusChartData = applicationsByStatus?.map(item => ({
        name: getStatusBadge(item.status).props.children,
        value: item.count,
        status: item.status
    })) || [];

    const performanceData = [
        { name: 'Tasa de Contacto', value: metrics.contact_rate || 0, target: 80 },
        { name: 'Tasa de Conversión', value: metrics.conversion_rate || 0, target: 30 },
        { name: 'Tasa de Completado', value: metrics.completion_rate || 0, target: 70 },
        { name: 'Tasa de Aprobación', value: metrics.approval_rate || 0, target: 60 }
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Mi Panel de Desempeño</h1>
                <p className="text-gray-600 mt-1">
                    Análisis completo de tu desempeño y métricas de ventas
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content - 2 columns */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Lead Metrics */}
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 mb-4">Métricas de Leads</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <StatsCard
                                title="Total de Leads"
                                value={metrics.total_leads || 0}
                                change=""
                                changeType="neutral"
                                icon={Users}
                                color="blue"
                            />
                            <StatsCard
                                title="Leads Contactados"
                                value={metrics.leads_contacted || 0}
                                change={`${metrics.contact_rate?.toFixed(1) || 0}%`}
                                changeType={metrics.contact_rate >= 80 ? "positive" : "negative"}
                                icon={CheckCircle2}
                                color="green"
                            />
                            <StatsCard
                                title="Sin Contactar"
                                value={metrics.leads_not_contacted || 0}
                                change=""
                                changeType="neutral"
                                icon={AlertCircle}
                                color="red"
                            />
                        </div>
                    </div>

                    {/* Application Metrics */}
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 mb-4">Métricas de Solicitudes</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <StatsCard
                                title="Total Solicitudes"
                                value={metrics.total_applications || 0}
                                change=""
                                changeType="neutral"
                                icon={FileText}
                                color="blue"
                            />
                            <StatsCard
                                title="Solicitudes Enviadas"
                                value={metrics.submitted_applications || 0}
                                change=""
                                changeType="neutral"
                                icon={CheckSquare}
                                color="purple"
                            />
                            <StatsCard
                                title="Aprobadas"
                                value={metrics.approved_applications || 0}
                                change={`${metrics.approval_rate?.toFixed(1) || 0}%`}
                                changeType={metrics.approval_rate >= 60 ? "positive" : "negative"}
                                icon={Award}
                                color="green"
                            />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                            <StatsCard
                                title="Completas"
                                value={metrics.complete_applications || 0}
                                change={`${metrics.completion_rate?.toFixed(1) || 0}%`}
                                changeType={metrics.completion_rate >= 70 ? "positive" : "negative"}
                                icon={CheckCircle2}
                                color="green"
                            />
                            <StatsCard
                                title="Incompletas"
                                value={metrics.incomplete_applications || 0}
                                change=""
                                changeType="neutral"
                                icon={Clock}
                                color="yellow"
                            />
                            <StatsCard
                                title="Rechazadas"
                                value={metrics.rejected_applications || 0}
                                change=""
                                changeType="neutral"
                                icon={XCircle}
                                color="red"
                            />
                        </div>
                    </div>

                    {/* Performance Charts */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Status Distribution */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                Distribución por Estado
                            </h3>
                            {statusChartData.length > 0 ? (
                                <ResponsiveContainer width="100%" height={250}>
                                    <RechartsPieChart>
                                        <Pie
                                            data={statusChartData}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            label={({ name, value }) => `${name}: ${value}`}
                                            outerRadius={80}
                                            fill="#8884d8"
                                            dataKey="value"
                                        >
                                            {statusChartData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.status as keyof typeof STATUS_COLORS] || COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </RechartsPieChart>
                                </ResponsiveContainer>
                            ) : (
                                <p className="text-gray-500 text-center py-8">No hay datos disponibles</p>
                            )}
                        </div>

                        {/* Performance vs Target */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                Desempeño vs Objetivo
                            </h3>
                            <ResponsiveContainer width="100%" height={250}>
                                <RechartsBarChart data={performanceData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} fontSize={11} />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Bar dataKey="value" fill="#f97316" name="Actual %" />
                                    <Bar dataKey="target" fill="#22c55e" name="Objetivo %" />
                                </RechartsBarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Recent Applications */}
                    <div className="bg-white rounded-xl shadow-sm border">
                        <div className="p-6 border-b">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-gray-900">Mis Solicitudes Recientes</h3>
                                <div className="flex gap-2">
                                    <select
                                        value={statusFilter || 'all'}
                                        onChange={(e) => setStatusFilter(e.target.value === 'all' ? null : e.target.value)}
                                        className="text-sm border-gray-300 rounded-md"
                                    >
                                        <option value="all">Todos los estados</option>
                                        <option value="draft">Borrador</option>
                                        <option value="submitted">Enviada</option>
                                        <option value="reviewing">En Revisión</option>
                                        <option value="pending_docs">Documentos Pendientes</option>
                                        <option value="approved">Aprobada</option>
                                        <option value="rejected">Rechazada</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vehículo</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Completa</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Documentos</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acción</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {detailedApplications?.length > 0 ? (
                                        detailedApplications.slice(0, 10).map((app) => (
                                            <tr key={app.application_id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <User className="w-4 h-4 text-gray-400 mr-2" />
                                                        <div>
                                                            <div className="text-sm font-medium text-gray-900">{app.lead_name}</div>
                                                            <div className="text-xs text-gray-500">{app.lead_email}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-sm text-gray-900">
                                                        {app.car_info?._vehicleTitle || 'Sin auto'}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {getStatusBadge(app.application_status)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {app.is_complete ? (
                                                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                                                    ) : (
                                                        <XCircle className="w-5 h-5 text-red-600" />
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {app.document_count || 0}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {formatDate(app.application_created_at)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                    <Link
                                                        to={`/escritorio/ventas/cliente/${app.lead_id}`}
                                                        className="text-primary-600 hover:text-primary-800 inline-flex items-center gap-1"
                                                    >
                                                        Ver <ExternalLink className="w-3 h-3" />
                                                    </Link>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                                                No hay solicitudes para mostrar
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Sidebar - Instructions & Best Practices */}
                <div className="lg:col-span-1 space-y-6">
                    {/* Instructions Panel */}
                    <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl shadow-sm border border-orange-200 p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-orange-600 rounded-lg">
                                <BookOpen className="w-6 h-6 text-white" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900">Guía del Asesor</h3>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <h4 className="font-semibold text-gray-900 flex items-center gap-2 mb-2">
                                    <Target className="w-4 h-4 text-orange-600" />
                                    Objetivos de Desempeño
                                </h4>
                                <ul className="text-sm text-gray-700 space-y-1.5 ml-6">
                                    <li>• <strong>Tasa de Contacto:</strong> 80%+</li>
                                    <li>• <strong>Tasa de Conversión:</strong> 30%+</li>
                                    <li>• <strong>Tasa de Completado:</strong> 70%+</li>
                                    <li>• <strong>Tasa de Aprobación:</strong> 60%+</li>
                                </ul>
                            </div>

                            <div className="border-t border-orange-200 pt-4">
                                <h4 className="font-semibold text-gray-900 flex items-center gap-2 mb-2">
                                    <Lightbulb className="w-4 h-4 text-orange-600" />
                                    Mejores Prácticas
                                </h4>
                                <ul className="text-sm text-gray-700 space-y-2">
                                    <li className="flex items-start gap-2">
                                        <CheckSquare className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                                        <span>Contacta a todos los leads en las primeras 24 horas</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <CheckSquare className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                                        <span>Marca como "contactado" después de cada interacción</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <CheckSquare className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                                        <span>Ayuda a completar solicitudes al 100%</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <CheckSquare className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                                        <span>Asegúrate que los clientes suban todos los documentos</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <CheckSquare className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                                        <span>Da seguimiento constante a solicitudes en proceso</span>
                                    </li>
                                </ul>
                            </div>

                            <div className="border-t border-orange-200 pt-4">
                                <h4 className="font-semibold text-gray-900 flex items-center gap-2 mb-2">
                                    <MessageSquare className="w-4 h-4 text-orange-600" />
                                    Responsabilidades
                                </h4>
                                <ul className="text-sm text-gray-700 space-y-2">
                                    <li className="flex items-start gap-2">
                                        <Activity className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                                        <span>Actualizar el estado de contacto de cada lead</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <Activity className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                                        <span>Mantener las solicitudes completas y actualizadas</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <Activity className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                                        <span>Responder consultas en menos de 2 horas</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <Activity className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                                        <span>Usar etiquetas para organizar tus leads</span>
                                    </li>
                                </ul>
                            </div>

                            <div className="border-t border-orange-200 pt-4">
                                <h4 className="font-semibold text-gray-900 flex items-center gap-2 mb-2">
                                    <AlertCircle className="w-4 h-4 text-orange-600" />
                                    Recordatorios Importantes
                                </h4>
                                <ul className="text-sm text-gray-700 space-y-2">
                                    <li className="flex items-start gap-2">
                                        <span className="text-orange-600 font-bold">!</span>
                                        <span>Leads sin contactar reducen tu tasa de conversión</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-orange-600 font-bold">!</span>
                                        <span>Solicitudes incompletas rara vez se aprueban</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-orange-600 font-bold">!</span>
                                        <span>Tu desempeño impacta las comisiones y bonos</span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="bg-white rounded-xl shadow-sm border p-6">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Acciones Rápidas</h3>
                        <div className="space-y-3">
                            <Link
                                to="/escritorio/ventas/crm"
                                className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700 transition-all shadow-sm"
                            >
                                <Users className="w-5 h-5" />
                                <span className="font-medium">Ver Mis Leads</span>
                            </Link>
                            <Link
                                to="/escritorio/seguimiento"
                                className="flex items-center gap-3 p-3 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all"
                            >
                                <FileText className="w-5 h-5" />
                                <span className="font-medium">Mis Solicitudes</span>
                            </Link>
                        </div>
                    </div>

                    {/* Performance Summary */}
                    <div className="bg-white rounded-xl shadow-sm border p-6">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Resumen Rápido</h3>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">Leads Asignados</span>
                                <span className="text-lg font-bold text-gray-900">{metrics.total_leads || 0}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">Necesitan Seguimiento</span>
                                <span className="text-lg font-bold text-red-600">{metrics.leads_needing_follow_up || 0}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">Sin Contactar</span>
                                <span className="text-lg font-bold text-yellow-600">{metrics.leads_not_contacted || 0}</span>
                            </div>
                            <div className="flex items-center justify-between pt-3 border-t">
                                <span className="text-sm text-gray-600">Solicitudes Activas</span>
                                <span className="text-lg font-bold text-blue-600">{metrics.leads_with_active_app || 0}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SalesPerformanceDashboard;
