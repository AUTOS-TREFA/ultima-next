'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../supabaseClient';
import {
    FileText,
    CheckCircle2,
    XCircle,
    Clock,
    Filter,
    ExternalLink,
    User,
    FileCheck,
    Loader2,
    AlertTriangle
} from 'lucide-react';
import Link from 'next/link';

interface DetailedApplication {
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
    sales_agent_id: string | null;
    sales_agent_name: string | null;
    sales_agent_email: string | null;
}

interface ApplicationsByAgent {
    sales_agent_id: string;
    sales_agent_name: string;
    sales_agent_email: string;
    total_applications: number;
    submitted_applications: number;
    complete_applications: number;
    incomplete_applications: number;
    draft_applications: number;
    approved_applications: number;
    rejected_applications: number;
}

interface OverallAnalytics {
    total_applications: number;
    submitted_applications: number;
    complete_applications: number;
    incomplete_applications: number;
    applications_with_documents: number;
    applications_by_status: Record<string, number>;
}

const ApplicationAnalyticsPanel: React.FC = () => {
    const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
    const [completionFilter, setCompletionFilter] = useState<'all' | 'complete' | 'incomplete'>('all');
    const [statusFilter, setStatusFilter] = useState<string | null>(null);

    // Fetch overall analytics
    const { data: overallAnalytics, isLoading: loadingOverall } = useQuery<OverallAnalytics[]>({
        queryKey: ['overallApplicationAnalytics'],
        queryFn: async () => {
            const { data, error } = await supabase.rpc('get_detailed_application_analytics');
            if (error) throw error;
            return data || [];
        }
    });

    // Fetch applications by sales agent
    const { data: agentApplications, isLoading: loadingAgents } = useQuery<ApplicationsByAgent[]>({
        queryKey: ['applicationsBySalesAgent'],
        queryFn: async () => {
            const { data, error } = await supabase.rpc('get_applications_by_sales_agent');
            if (error) throw error;
            return data || [];
        }
    });

    // Fetch detailed applications list
    const { data: detailedApplications, isLoading: loadingDetails } = useQuery<DetailedApplication[]>({
        queryKey: ['detailedApplicationsList', statusFilter, selectedAgent, completionFilter],
        queryFn: async () => {
            const { data, error } = await supabase.rpc('get_detailed_applications_list', {
                status_filter: statusFilter,
                sales_agent_filter: selectedAgent,
                completion_filter: completionFilter
            });
            if (error) throw error;
            return data || [];
        }
    });

    const analytics = overallAnalytics?.[0];

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

    if (loadingOverall || loadingAgents) {
        return (
            <div className="flex justify-center items-center p-8">
                <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-bold text-gray-900">Análisis de Solicitudes</h2>
                <p className="text-gray-600 mt-1">
                    Análisis detallado de solicitudes de financiamiento por estado y asesor
                </p>
            </div>

            {/* Overall Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="bg-white p-4 rounded-xl shadow-sm border">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <FileText className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Total Solicitudes</p>
                            <p className="text-2xl font-bold text-gray-900">{analytics?.total_applications || 0}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-4 rounded-xl shadow-sm border">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 rounded-lg">
                            <CheckCircle2 className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Enviadas</p>
                            <p className="text-2xl font-bold text-gray-900">{analytics?.submitted_applications || 0}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-4 rounded-xl shadow-sm border">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-100 rounded-lg">
                            <FileCheck className="w-6 h-6 text-purple-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Completas</p>
                            <p className="text-2xl font-bold text-gray-900">{analytics?.complete_applications || 0}</p>
                            <p className="text-xs text-gray-500">Con documentos</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-4 rounded-xl shadow-sm border">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-orange-100 rounded-lg">
                            <Clock className="w-6 h-6 text-orange-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Incompletas</p>
                            <p className="text-2xl font-bold text-gray-900">{analytics?.incomplete_applications || 0}</p>
                            <p className="text-xs text-gray-500">Sin documentos</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-4 rounded-xl shadow-sm border">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-100 rounded-lg">
                            <FileText className="w-6 h-6 text-indigo-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Con Documentos</p>
                            <p className="text-2xl font-bold text-gray-900">{analytics?.applications_with_documents || 0}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Applications by Sales Agent */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Solicitudes por Asesor</h3>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Asesor</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Enviadas</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Completas</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Incompletas</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aprobadas</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {agentApplications?.map((agent) => (
                                <tr key={agent.sales_agent_id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3">
                                        <div>
                                            <p className="font-medium text-gray-900">{agent.sales_agent_name}</p>
                                            <p className="text-sm text-gray-500">{agent.sales_agent_email}</p>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 font-semibold text-gray-900">{agent.total_applications}</td>
                                    <td className="px-4 py-3 text-blue-600 font-medium">{agent.submitted_applications}</td>
                                    <td className="px-4 py-3 text-green-600 font-medium">{agent.complete_applications}</td>
                                    <td className="px-4 py-3 text-orange-600 font-medium">{agent.incomplete_applications}</td>
                                    <td className="px-4 py-3 text-purple-600 font-medium">{agent.approved_applications}</td>
                                    <td className="px-4 py-3">
                                        <button
                                            onClick={() => setSelectedAgent(agent.sales_agent_id)}
                                            className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                                        >
                                            Ver Detalles
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
                <div className="flex items-center gap-2 mb-4">
                    <Filter className="w-5 h-5 text-gray-500" />
                    <h3 className="text-lg font-semibold text-gray-900">Filtrar Solicitudes</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Asesor</label>
                        <select
                            value={selectedAgent || ''}
                            onChange={(e) => setSelectedAgent(e.target.value || null)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        >
                            <option value="">Todos los asesores</option>
                            {agentApplications?.map((agent) => (
                                <option key={agent.sales_agent_id} value={agent.sales_agent_id}>
                                    {agent.sales_agent_name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Completitud</label>
                        <select
                            value={completionFilter}
                            onChange={(e) => setCompletionFilter(e.target.value as any)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        >
                            <option value="all">Todas</option>
                            <option value="complete">Completas (con documentos)</option>
                            <option value="incomplete">Incompletas (sin documentos)</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Estado</label>
                        <select
                            value={statusFilter || ''}
                            onChange={(e) => setStatusFilter(e.target.value || null)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        >
                            <option value="">Todos los estados</option>
                            <option value="submitted">Enviada</option>
                            <option value="reviewing">En Revisión</option>
                            <option value="pending_docs">Documentos Pendientes</option>
                            <option value="approved">Aprobada</option>
                            <option value="rejected">Rechazada</option>
                            <option value="draft">Borrador</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Detailed Applications List */}
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <div className="p-6 border-b">
                    <h3 className="text-lg font-semibold text-gray-900">
                        Solicitudes Detalladas ({detailedApplications?.length || 0})
                    </h3>
                </div>
                <div className="overflow-x-auto">
                    {loadingDetails ? (
                        <div className="flex justify-center items-center p-8">
                            <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
                        </div>
                    ) : detailedApplications && detailedApplications.length > 0 ? (
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Lead</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Asesor</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Completa</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Documentos</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vehículo</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {detailedApplications.map((app) => (
                                    <tr key={app.application_id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3">
                                            <div>
                                                <p className="font-medium text-gray-900">{app.lead_name}</p>
                                                <p className="text-sm text-gray-500">{app.lead_email}</p>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-900">
                                            {app.sales_agent_name || 'Sin asignar'}
                                        </td>
                                        <td className="px-4 py-3">{getStatusBadge(app.application_status)}</td>
                                        <td className="px-4 py-3">
                                            {app.is_complete ? (
                                                <CheckCircle2 className="w-5 h-5 text-green-600" />
                                            ) : (
                                                <XCircle className="w-5 h-5 text-orange-600" />
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700">
                                                {app.document_count} docs
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-900">
                                            {app.car_info?._vehicleTitle || 'N/A'}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-500">
                                            {new Date(app.application_created_at).toLocaleDateString('es-MX')}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <Link
                                                    href={`/escritorio/admin/cliente/${app.lead_id}`}
                                                    className="inline-flex items-center text-primary-600 hover:text-primary-700 text-sm"
                                                >
                                                    <User className="w-4 h-4 mr-1" />
                                                    Perfil
                                                </Link>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="flex flex-col items-center justify-center p-8 text-gray-500">
                            <AlertTriangle className="w-12 h-12 mb-2" />
                            <p>No se encontraron solicitudes con los filtros aplicados</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ApplicationAnalyticsPanel;
