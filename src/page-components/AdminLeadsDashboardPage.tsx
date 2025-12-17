'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import { AdminService } from '../services/AdminService';
import { ApplicationService } from '../services/ApplicationService';
import { Loader2, AlertTriangle, User, Users, FileText, Clock, Search, Filter, CheckCircle2, AlertCircle, TrendingUp, Phone, Mail } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '../../supabaseClient';
import StatsCard from '../components/StatsCard';

// Helper to check if application has all required documents
const hasAllDocuments = (documents: any[]): boolean => {
    if (!documents || documents.length === 0) return false;

    const requiredTypes = ['ine_front', 'ine_back', 'comprobante_domicilio', 'comprobante_ingresos'];
    const availableTypes = documents.map(doc => doc.document_type.toLowerCase());

    return requiredTypes.every(reqType =>
        availableTypes.some(availType => availType.includes(reqType.replace('_', ' ')))
    );
};

// Helper to get correct status based on documents
const getCorrectApplicationStatus = (status: string, documents: any[], isSubmitted: boolean): string => {
    if (status === 'submitted' && isSubmitted) {
        return hasAllDocuments(documents) ? 'submitted' : 'pending_docs';
    }
    return status;
};

const AdminLeadsDashboardPage: React.FC = () => {
    const { user, isSales } = useAuth();
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [filterContactado, setFilterContactado] = useState<string>('all');
    const [filterPriority, setFilterPriority] = useState<string>('all');
    const [updatingStatuses, setUpdatingStatuses] = useState<Set<string>>(new Set());
    const queryClient = useQueryClient();

    const { data: leads = [], isLoading: isLoadingLeads, isError: isErrorLeads, error: errorLeads } = useQuery<any[], Error>({
        queryKey: ['leads'],
        queryFn: AdminService.getAllLeads
    });

    const { data: stats = {}, isLoading: isLoadingStats, isError: isErrorStats, error: errorStats } = useQuery<any, Error>({
        queryKey: ['dashboardStats'],
        queryFn: AdminService.getDashboardStats
    });

    // Process leads to correct statuses and add priority flags
    const processedLeads = useMemo(() => {
        let filtered = leads;

        if (isSales && user) {
            filtered = leads.filter(lead => lead.asesor_asignado_id === user.id);
        }

        return filtered.map(lead => {
            const correctStatus = lead.latest_app_status
                ? getCorrectApplicationStatus(
                    lead.latest_app_status,
                    lead.documents || [],
                    lead.latest_app_submitted || false
                  )
                : null;

            // Determine priority
            const needsAction = !lead.contactado ||
                               correctStatus === 'pending_docs' ||
                               correctStatus === 'submitted';

            return {
                ...lead,
                correctedStatus: correctStatus,
                needsAction,
                hasBankProfile: !!lead.bank_profile_data
            };
        });
    }, [leads, isSales, user]);

    const filteredLeads = useMemo(() => {
        let filtered = processedLeads;

        // Filter by search term
        if (searchTerm) {
            const lowercasedQuery = searchTerm.toLowerCase();
            filtered = filtered.filter(lead =>
                `${lead.first_name || ''} ${lead.last_name || ''}`.toLowerCase().includes(lowercasedQuery) ||
                lead.email?.toLowerCase().includes(lowercasedQuery) ||
                lead.phone?.toLowerCase().includes(lowercasedQuery) ||
                lead.source?.toLowerCase().includes(lowercasedQuery) ||
                lead.utm_source?.toLowerCase().includes(lowercasedQuery) ||
                lead.utm_campaign?.toLowerCase().includes(lowercasedQuery)
            );
        }

        // Filter by application status
        if (filterStatus !== 'all') {
            filtered = filtered.filter(lead => lead.correctedStatus === filterStatus);
        }

        // Filter by contactado status
        if (filterContactado !== 'all') {
            filtered = filtered.filter(lead => {
                if (filterContactado === 'contacted') return lead.contactado === true;
                if (filterContactado === 'not_contacted') return lead.contactado === false;
                return true;
            });
        }

        // Filter by priority
        if (filterPriority === 'needs_action') {
            filtered = filtered.filter(lead => lead.needsAction);
        }

        // Sort by priority (needs action first)
        return filtered.sort((a, b) => {
            if (a.needsAction && !b.needsAction) return -1;
            if (!a.needsAction && b.needsAction) return 1;
            return 0;
        });
    }, [processedLeads, searchTerm, filterStatus, filterContactado, filterPriority]);

    // Count leads needing action
    const leadsNeedingAction = useMemo(() => {
        return processedLeads.filter(lead => lead.needsAction).length;
    }, [processedLeads]);

    // Toggle contactado status
    const toggleContactado = async (leadId: string, currentValue: boolean) => {
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ contactado: !currentValue })
                .eq('id', leadId);

            if (error) throw error;

            // Invalidate and refetch
            await queryClient.invalidateQueries({ queryKey: ['leads'] });
            await queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });

            toast.success(`Marcado como ${!currentValue ? 'contactado' : 'no contactado'}`);
        } catch (err: any) {
            console.error('Error toggling contactado:', err);
            toast.error(`Error: ${err.message}`);
        }
    };

    // Update application status
    const updateApplicationStatus = async (lead: any, newStatus: string) => {
        if (!lead.latest_app_id) {
            toast.error('No hay solicitud para actualizar');
            return;
        }

        setUpdatingStatuses(prev => new Set(prev).add(lead.id));

        try {
            await ApplicationService.updateApplicationStatus(lead.latest_app_id, newStatus);

            // Show feedback based on status
            if (newStatus === 'submitted') {
                toast.success('Solicitud marcada como Completa', {
                    description: 'Asegúrate de que todos los documentos estén presentes.'
                });
            } else if (newStatus === 'pending_docs') {
                toast.warning('Faltan Documentos', {
                    description: 'Contacta al cliente para solicitar los documentos faltantes.',
                    duration: 5000
                });
            } else if (newStatus === 'reviewing') {
                toast.info('En Revisión', {
                    description: 'La solicitud está siendo revisada.'
                });
            } else if (newStatus === 'approved') {
                toast.success('Solicitud Aprobada', {
                    description: 'Contacta al cliente para informarle.'
                });
            } else if (newStatus === 'rejected') {
                toast.error('Solicitud Rechazada', {
                    description: 'Contacta al cliente para explicar la situación.'
                });
            } else {
                toast.success(`Estado actualizado a: ${getStatusLabel(newStatus)}`);
            }

            // Invalidate and refetch
            await queryClient.invalidateQueries({ queryKey: ['leads'] });
            await queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
        } catch (err: any) {
            console.error('[AdminLeads] Status update failed:', err);
            toast.error(`Error al actualizar: ${err.message}`);
        } finally {
            setUpdatingStatuses(prev => {
                const next = new Set(prev);
                next.delete(lead.id);
                return next;
            });
        }
    };

    const getStatusLabel = (status: string): string => {
        const labels: Record<string, string> = {
            'submitted': 'Completa',
            'reviewing': 'En Revisión',
            'pending_docs': 'Faltan Docs',
            'approved': 'Aprobada',
            'rejected': 'Rechazada',
            'draft': 'Borrador'
        };
        return labels[status] || status;
    };

    const getStatusColor = (status: string): { bg: string; text: string; border: string } => {
        const colors: Record<string, { bg: string; text: string; border: string }> = {
            'submitted': { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-300' },
            'reviewing': { bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-300' },
            'pending_docs': { bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-300' },
            'approved': { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-300' },
            'rejected': { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-300' },
            'draft': { bg: 'bg-gray-100', text: 'text-gray-600', border: 'border-gray-300' }
        };
        return colors[status] || { bg: 'bg-gray-100', text: 'text-gray-600', border: 'border-gray-300' };
    };

    const isLoading = isLoadingLeads || isLoadingStats;
    const isError = isErrorLeads || isErrorStats;
    const error = errorLeads || errorStats;

    if (isLoading) return <div className="flex justify-center items-center h-full"><Loader2 className="w-8 h-8 animate-spin text-primary-600" /></div>;
    if (isError) return <div className="p-4 bg-red-100 text-red-800 rounded-md"><AlertTriangle className="inline w-5 h-5 mr-2"/>{error?.message}</div>;

    return (
        <div className="space-y-6">
            {/* Action Bar */}
            {leadsNeedingAction > 0 && (
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200 rounded-xl p-4 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-amber-500 rounded-full flex items-center justify-center shadow-md">
                                <AlertCircle className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-amber-900">
                                    {leadsNeedingAction} Lead{leadsNeedingAction > 1 ? 's' : ''} Necesitan Atención
                                </h3>
                                <p className="text-sm text-amber-700">
                                    Hay leads sin contactar o con solicitudes pendientes de actualización
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => setFilterPriority('needs_action')}
                            className="px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg shadow-md transition-all transform hover:scale-105"
                        >
                            Ver Urgentes
                        </button>
                    </div>
                </div>
            )}

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatsCard title="Total de Clientes Potenciales" value={stats.total_leads || 0} change="" changeType="neutral" icon={Users} color="blue" />
                <StatsCard title="Con Solicitud Activa" value={stats.leads_with_active_app || 0} change="" changeType="neutral" icon={FileText} color="purple" />
                <StatsCard title="Solicitud Incompleta" value={stats.leads_with_unfinished_app || 0} change="" changeType="neutral" icon={User} color="yellow" />
                <StatsCard title="Necesitan Seguimiento" value={String(leadsNeedingAction)} change="" changeType="neutral" icon={Clock} color="red" />
            </div>

            {/* Main Content */}
            <div className="bg-white p-6 rounded-xl shadow-sm border">
                {/* Search and Filters */}
                <div className="space-y-4 mb-6">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                        <h2 className="text-xl font-bold text-gray-800">Directorio de Clientes</h2>
                        <div className="relative w-full sm:w-72">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Buscar por nombre, email o fuente..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                            />
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="flex flex-wrap gap-4 items-center">
                        <div className="flex items-center gap-2">
                            <Filter className="w-5 h-5 text-gray-500" />
                            <span className="text-sm font-medium text-gray-700">Filtros:</span>
                        </div>

                        <select
                            value={filterPriority}
                            onChange={e => setFilterPriority(e.target.value)}
                            className="text-sm px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 font-semibold"
                        >
                            <option value="all">Todos (Prioridad)</option>
                            <option value="needs_action">Necesitan Acción</option>
                        </select>

                        <select
                            value={filterContactado}
                            onChange={e => setFilterContactado(e.target.value)}
                            className="text-sm px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        >
                            <option value="all">Todos (Contactado)</option>
                            <option value="not_contacted">No Contactados</option>
                            <option value="contacted">Contactados</option>
                        </select>

                        <select
                            value={filterStatus}
                            onChange={e => setFilterStatus(e.target.value)}
                            className="text-sm px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        >
                            <option value="all">Todos (Estado Solicitud)</option>
                            <option value="draft">Borrador</option>
                            <option value="submitted">Completas</option>
                            <option value="pending_docs">Faltan Docs</option>
                            <option value="reviewing">En Revisión</option>
                            <option value="approved">Aprobadas</option>
                            <option value="rejected">Rechazadas</option>
                        </select>

                        {(searchTerm || filterStatus !== 'all' || filterContactado !== 'all' || filterPriority !== 'all') && (
                            <button
                                onClick={() => {
                                    setSearchTerm('');
                                    setFilterStatus('all');
                                    setFilterContactado('all');
                                    setFilterPriority('all');
                                }}
                                className="text-sm text-primary-600 hover:text-primary-800 font-medium"
                            >
                                Limpiar Filtros
                            </button>
                        )}
                    </div>
                </div>

                {/* Results count */}
                <div className="mb-4 text-sm text-gray-600">
                    Mostrando {filteredLeads.length} de {processedLeads.length} leads
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-500">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                            <tr>
                                <th scope="col" className="px-4 py-3">Prioridad</th>
                                <th scope="col" className="px-4 py-3">Nombre</th>
                                <th scope="col" className="px-4 py-3">Contacto</th>
                                <th scope="col" className="px-4 py-3">Último Auto</th>
                                <th scope="col" className="px-4 py-3">Perfil Bancario</th>
                                <th scope="col" className="px-4 py-3">Estado</th>
                                <th scope="col" className="px-4 py-3">Fuente</th>
                                <th scope="col" className="px-4 py-3 text-center">Contactado</th>
                                <th scope="col" className="px-4 py-3">Asesor</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredLeads.map(lead => {
                                const statusColor = getStatusColor(lead.correctedStatus || '');
                                const isUpdating = updatingStatuses.has(lead.id);

                                return (
                                    <tr
                                        key={lead.id}
                                        className={`border-b hover:bg-gray-50 ${lead.needsAction ? 'bg-amber-50/30' : 'bg-white'}`}
                                    >
                                        <td className="px-4 py-4">
                                            {lead.needsAction ? (
                                                <div className="flex items-center justify-center">
                                                    <AlertCircle className="w-5 h-5 text-amber-600 animate-pulse" />
                                                </div>
                                            ) : (
                                                <div className="flex items-center justify-center">
                                                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-4 py-4 font-medium text-gray-900">
                                            <Link href={`/escritorio/admin/cliente/${lead.id}`} className="hover:underline text-primary-600 font-semibold">
                                                {`${lead.first_name || ''} ${lead.last_name || ''}`.trim() || 'Sin Nombre'}
                                            </Link>
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-1 text-xs">
                                                    <Mail className="w-3 h-3 text-gray-400" />
                                                    <span className="truncate max-w-[150px]" title={lead.email}>{lead.email}</span>
                                                </div>
                                                {lead.phone && (
                                                    <div className="flex items-center gap-1 text-xs text-gray-500">
                                                        <Phone className="w-3 h-3 text-gray-400" />
                                                        <span>{lead.phone}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="max-w-[180px] truncate text-xs" title={lead.latest_app_car_info?._vehicleTitle}>
                                                {lead.latest_app_car_info?._vehicleTitle || '-'}
                                            </div>
                                        </td>
                                        <td className="px-4 py-4">
                                            {lead.hasBankProfile ? (
                                                <div className="flex items-center gap-1">
                                                    <TrendingUp className="w-4 h-4 text-green-600" />
                                                    <span className="text-xs font-semibold text-green-700">
                                                        {lead.bank_profile_data?.recommended_bank || 'Completado'}
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-gray-400">Sin perfil</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-4">
                                            {lead.correctedStatus && lead.latest_app_id ? (
                                                <div className="flex flex-col gap-2">
                                                    <select
                                                        value={lead.correctedStatus}
                                                        onChange={(e) => updateApplicationStatus(lead, e.target.value)}
                                                        disabled={isUpdating}
                                                        className={`text-xs font-bold px-3 py-1.5 rounded-lg border-2 ${statusColor.bg} ${statusColor.text} ${statusColor.border} cursor-pointer hover:opacity-80 transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
                                                    >
                                                        <option value="draft">Borrador</option>
                                                        <option value="submitted">Completa</option>
                                                        <option value="pending_docs">Faltan Docs</option>
                                                        <option value="reviewing">En Revisión</option>
                                                        <option value="approved">Aprobada</option>
                                                        <option value="rejected">Rechazada</option>
                                                    </select>
                                                    {isUpdating && (
                                                        <div className="flex items-center gap-1 text-xs text-gray-500">
                                                            <Loader2 className="w-3 h-3 animate-spin" />
                                                            <span>Actualizando...</span>
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="text-xs text-gray-400">Sin solicitud</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="flex flex-col gap-0.5 max-w-[150px]">
                                                <span className="truncate text-xs" title={lead.source || '-'}>
                                                    {lead.source || '-'}
                                                </span>
                                                {(lead.utm_source || lead.utm_campaign || lead.rfdm || lead.referrer) && (
                                                    <div className="text-[10px] text-gray-500 space-y-0.5">
                                                        {lead.utm_source && <div className="truncate">UTM: {lead.utm_source}</div>}
                                                        {lead.utm_campaign && <div className="truncate">Camp: {lead.utm_campaign}</div>}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 text-center">
                                            <input
                                                type="checkbox"
                                                checked={lead.contactado}
                                                onChange={() => toggleContactado(lead.id, lead.contactado)}
                                                className="w-5 h-5 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 focus:ring-2 cursor-pointer"
                                            />
                                        </td>
                                        <td className="px-4 py-4">
                                            <span className="text-xs text-gray-600">{lead.asesor_asignado || '-'}</span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AdminLeadsDashboardPage;