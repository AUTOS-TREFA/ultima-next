'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { AdminService } from '../services/AdminService';
import {
    X,
    Loader2,
    AlertTriangle,
    TrendingUp,
    Users,
    CheckCircle,
    FileText,
    Calendar,
    Mail,
    Phone,
    Clock
} from 'lucide-react';
import Link from 'next/link';

interface UserAnalyticsModalProps {
    userId: string;
    onClose: () => void;
}

interface UserAnalytics {
    user_info: {
        id: string;
        email: string;
        first_name: string;
        last_name: string;
        phone: string;
        role: string;
        created_at: string;
        last_sign_in_at: string;
        last_assigned_at: string;
    };
    leads_stats: {
        total_assigned: number;
        contacted: number;
        pending_contact: number;
        with_applications: number;
        approved_applications: number;
    };
    recent_leads: Array<{
        id: string;
        name: string;
        email: string;
        phone: string;
        contactado: boolean;
        created_at: string;
    }>;
}

const UserAnalyticsModal: React.FC<UserAnalyticsModalProps> = ({ userId, onClose }) => {
    const { data: analytics, isLoading, isError, error } = useQuery<UserAnalytics, Error>({
        queryKey: ['userAnalytics', userId],
        queryFn: () => AdminService.getUserAnalyticsDetails(userId)
    });

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-MX', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getContactRate = () => {
        if (!analytics?.leads_stats.total_assigned) return 0;
        return Math.round((analytics.leads_stats.contacted / analytics.leads_stats.total_assigned) * 100);
    };

    const getApplicationRate = () => {
        if (!analytics?.leads_stats.total_assigned) return 0;
        return Math.round((analytics.leads_stats.with_applications / analytics.leads_stats.total_assigned) * 100);
    };

    const getApprovalRate = () => {
        if (!analytics?.leads_stats.with_applications) return 0;
        return Math.round((analytics.leads_stats.approved_applications / analytics.leads_stats.with_applications) * 100);
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-screen items-center justify-center p-4">
                {/* Backdrop */}
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                    onClick={onClose}
                ></div>

                {/* Modal */}
                <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden transform transition-all">
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-primary-50 to-primary-100">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary-600 rounded-lg">
                                <TrendingUp className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900">
                                    Analíticas Detalladas
                                </h2>
                                {analytics && (
                                    <p className="text-sm text-gray-600">
                                        {analytics.user_info.first_name} {analytics.user_info.last_name}
                                    </p>
                                )}
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white/50 rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5 text-gray-500" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                        {isLoading && (
                            <div className="flex justify-center items-center py-12">
                                <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
                            </div>
                        )}

                        {isError && (
                            <div className="p-4 bg-red-100 text-red-800 rounded-md">
                                <AlertTriangle className="inline w-5 h-5 mr-2" />
                                {error?.message}
                            </div>
                        )}

                        {analytics && (
                            <div className="space-y-6">
                                {/* User Info */}
                                <div className="bg-gray-50 rounded-xl p-4">
                                    <h3 className="font-semibold text-gray-900 mb-3">Información del Usuario</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="flex items-center gap-2 text-sm">
                                            <Mail className="w-4 h-4 text-gray-400" />
                                            <span className="text-gray-600">Email:</span>
                                            <span className="font-medium text-gray-900">{analytics.user_info.email}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm">
                                            <Phone className="w-4 h-4 text-gray-400" />
                                            <span className="text-gray-600">Teléfono:</span>
                                            <span className="font-medium text-gray-900">{analytics.user_info.phone || 'N/A'}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm">
                                            <Calendar className="w-4 h-4 text-gray-400" />
                                            <span className="text-gray-600">Creado:</span>
                                            <span className="font-medium text-gray-900">{formatDate(analytics.user_info.created_at)}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm">
                                            <Clock className="w-4 h-4 text-gray-400" />
                                            <span className="text-gray-600">Último acceso:</span>
                                            <span className="font-medium text-gray-900">
                                                {analytics.user_info.last_sign_in_at ? formatDate(analytics.user_info.last_sign_in_at) : 'Nunca'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Performance Stats */}
                                <div>
                                    <h3 className="font-semibold text-gray-900 mb-3">Métricas de Desempeño</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        {/* Contact Rate */}
                                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-sm font-medium text-blue-900">Tasa de Contacto</span>
                                                <Users className="w-5 h-5 text-blue-600" />
                                            </div>
                                            <div className="text-3xl font-bold text-blue-900 mb-1">{getContactRate()}%</div>
                                            <div className="text-sm text-blue-700">
                                                {analytics.leads_stats.contacted} de {analytics.leads_stats.total_assigned} contactados
                                            </div>
                                            <div className="mt-3 w-full bg-blue-200 rounded-full h-2">
                                                <div
                                                    className="bg-blue-600 h-2 rounded-full transition-all"
                                                    style={{ width: `${getContactRate()}%` }}
                                                ></div>
                                            </div>
                                        </div>

                                        {/* Application Rate */}
                                        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-sm font-medium text-green-900">Tasa de Aplicaciones</span>
                                                <FileText className="w-5 h-5 text-green-600" />
                                            </div>
                                            <div className="text-3xl font-bold text-green-900 mb-1">{getApplicationRate()}%</div>
                                            <div className="text-sm text-green-700">
                                                {analytics.leads_stats.with_applications} de {analytics.leads_stats.total_assigned} con solicitud
                                            </div>
                                            <div className="mt-3 w-full bg-green-200 rounded-full h-2">
                                                <div
                                                    className="bg-green-600 h-2 rounded-full transition-all"
                                                    style={{ width: `${getApplicationRate()}%` }}
                                                ></div>
                                            </div>
                                        </div>

                                        {/* Approval Rate */}
                                        <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-sm font-medium text-purple-900">Tasa de Aprobación</span>
                                                <CheckCircle className="w-5 h-5 text-purple-600" />
                                            </div>
                                            <div className="text-3xl font-bold text-purple-900 mb-1">{getApprovalRate()}%</div>
                                            <div className="text-sm text-purple-700">
                                                {analytics.leads_stats.approved_applications} de {analytics.leads_stats.with_applications} aprobadas
                                            </div>
                                            <div className="mt-3 w-full bg-purple-200 rounded-full h-2">
                                                <div
                                                    className="bg-purple-600 h-2 rounded-full transition-all"
                                                    style={{ width: `${getApprovalRate()}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Detailed Stats */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="bg-white border rounded-lg p-4">
                                        <div className="text-2xl font-bold text-gray-900">{analytics.leads_stats.total_assigned}</div>
                                        <div className="text-sm text-gray-600">Leads Asignados</div>
                                    </div>
                                    <div className="bg-white border rounded-lg p-4">
                                        <div className="text-2xl font-bold text-green-600">{analytics.leads_stats.contacted}</div>
                                        <div className="text-sm text-gray-600">Contactados</div>
                                    </div>
                                    <div className="bg-white border rounded-lg p-4">
                                        <div className="text-2xl font-bold text-red-600">{analytics.leads_stats.pending_contact}</div>
                                        <div className="text-sm text-gray-600">Pendientes</div>
                                    </div>
                                    <div className="bg-white border rounded-lg p-4">
                                        <div className="text-2xl font-bold text-blue-600">{analytics.leads_stats.approved_applications}</div>
                                        <div className="text-sm text-gray-600">Aprobados</div>
                                    </div>
                                </div>

                                {/* Recent Leads */}
                                <div>
                                    <h3 className="font-semibold text-gray-900 mb-3">Leads Recientes</h3>
                                    <div className="bg-white border rounded-xl overflow-hidden">
                                        {analytics.recent_leads && analytics.recent_leads.length > 0 ? (
                                            <div className="divide-y">
                                                {analytics.recent_leads.map((lead) => (
                                                    <Link
                                                        key={lead.id}
                                                        href={`/escritorio/admin/cliente/${lead.id}`}
                                                        className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                                                    >
                                                        <div className="flex-1">
                                                            <div className="font-medium text-gray-900">{lead.name || 'Sin nombre'}</div>
                                                            <div className="text-sm text-gray-600">{lead.email}</div>
                                                            {lead.phone && (
                                                                <div className="text-sm text-gray-500">{lead.phone}</div>
                                                            )}
                                                        </div>
                                                        <div className="flex flex-col items-end gap-2">
                                                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${lead.contactado
                                                                ? 'bg-green-100 text-green-800'
                                                                : 'bg-red-100 text-red-800'
                                                                }`}>
                                                                {lead.contactado ? 'Contactado' : 'Pendiente'}
                                                            </span>
                                                            <span className="text-xs text-gray-500">
                                                                {new Date(lead.created_at).toLocaleDateString('es-MX')}
                                                            </span>
                                                        </div>
                                                    </Link>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="p-8 text-center text-gray-500">
                                                No hay leads asignados aún
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="border-t p-4 bg-gray-50">
                        <button
                            onClick={onClose}
                            className="w-full px-4 py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors"
                        >
                            Cerrar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserAnalyticsModal;
