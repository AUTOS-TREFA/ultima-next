'use client';

import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { SalesService } from '../services/SalesService';
import { Loader2, AlertTriangle, User, Users, FileText, Clock, Search, Filter } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import StatsCard from '../components/StatsCard';
import { supabase } from '../../supabaseClient';
import { toast } from 'react-hot-toast';

const SalesLeadsDashboardPage: React.FC = () => {
    const { user } = useAuth();
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [filterContactado, setFilterContactado] = useState<string>('all');
    const queryClient = useQueryClient();

    // Fetch only assigned leads (server-side filtering)
    const { data: myClients = [], isLoading: isLoadingLeads, isError: isErrorLeads, error: errorLeads } = useQuery<any[], Error>({
        queryKey: ['salesAssignedLeads', user?.id],
        queryFn: () => SalesService.getMyAssignedLeads(user?.id || ''),
        enabled: !!user?.id,
    });

    // Fetch stats for assigned leads only (server-side calculation)
    const { data: stats = {}, isLoading: isLoadingStats, isError: isErrorStats, error: errorStats } = useQuery<any, Error>({
        queryKey: ['salesDashboardStats', user?.id],
        queryFn: () => SalesService.getMyLeadsStats(user?.id || ''),
        enabled: !!user?.id,
    });

    const filteredLeads = useMemo(() => {
        let filtered = myClients;

        // Filter by search term
        if (searchTerm) {
            const lowercasedQuery = searchTerm.toLowerCase();
            filtered = filtered.filter(lead =>
                `${lead.first_name || ''} ${lead.last_name || ''}`.toLowerCase().includes(lowercasedQuery) ||
                lead.email?.toLowerCase().includes(lowercasedQuery) ||
                lead.phone?.toLowerCase().includes(lowercasedQuery)
            );
        }

        // Filter by application status
        if (filterStatus !== 'all') {
            filtered = filtered.filter(lead => lead.latest_app_status === filterStatus);
        }

        // Filter by contactado status
        if (filterContactado !== 'all') {
            filtered = filtered.filter(lead => {
                if (filterContactado === 'contacted') return lead.contactado === true;
                if (filterContactado === 'not_contacted') return lead.contactado === false;
                return true;
            });
        }

        return filtered;
    }, [myClients, searchTerm, filterStatus, filterContactado]);

    // Toggle contactado status
    const toggleContactado = async (leadId: string, currentValue: boolean) => {
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ contactado: !currentValue })
                .eq('id', leadId);

            if (error) throw error;

            // Invalidate and refetch
            await queryClient.invalidateQueries({ queryKey: ['salesAssignedLeads', user?.id] });
            await queryClient.invalidateQueries({ queryKey: ['salesDashboardStats', user?.id] });

            toast.success(`Marcado como ${!currentValue ? 'contactado' : 'no contactado'}`);
        } catch (err: any) {
            console.error('Error toggling contactado:', err);
            toast.error(`Error: ${err.message}`);
        }
    };

    const isLoading = isLoadingLeads || isLoadingStats;
    const isError = isErrorLeads || isErrorStats;
    const error = errorLeads || errorStats;

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

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Mis Leads Asignados</h1>
                <p className="text-gray-600 mt-1">Gestiona tus clientes asignados y da seguimiento a sus solicitudes.</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatsCard
                    title="Mis Leads Totales"
                    value={stats.total_leads || 0}
                    change=""
                    changeType="neutral"
                    icon={Users}
                    color="blue"
                />
                <StatsCard
                    title="Con Solicitud Activa"
                    value={stats.leads_with_active_app || 0}
                    change=""
                    changeType="neutral"
                    icon={FileText}
                    color="purple"
                />
                <StatsCard
                    title="Sin Contactar"
                    value={stats.leads_not_contacted || 0}
                    change=""
                    changeType="neutral"
                    icon={User}
                    color="yellow"
                />
                <StatsCard
                    title="Necesitan Seguimiento"
                    value={stats.leads_needing_follow_up || 0}
                    change=""
                    changeType="neutral"
                    icon={Clock}
                    color="red"
                />
            </div>

            {/* Main Content */}
            <div className="bg-white p-6 rounded-xl shadow-sm border">
                {/* Search and Filters */}
                <div className="space-y-4 mb-6">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                        <h2 className="text-xl font-bold text-gray-800">Mis Clientes</h2>
                        <div className="relative w-full sm:w-72">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Buscar por nombre, email o teléfono..."
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
                            <option value="submitted">Enviada</option>
                            <option value="reviewing">En Revisión</option>
                            <option value="pending_docs">Docs Pendientes</option>
                            <option value="approved">Aprobada</option>
                            <option value="rejected">Rechazada</option>
                        </select>

                        {(searchTerm || filterStatus !== 'all' || filterContactado !== 'all') && (
                            <button
                                onClick={() => {
                                    setSearchTerm('');
                                    setFilterStatus('all');
                                    setFilterContactado('all');
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
                    Mostrando {filteredLeads.length} de {myClients.length} leads
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-500">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3">Nombre</th>
                                <th scope="col" className="px-6 py-3">Email / Teléfono</th>
                                <th scope="col" className="px-6 py-3">Último Auto de Interés</th>
                                <th scope="col" className="px-6 py-3">Estado Solicitud</th>
                                <th scope="col" className="px-6 py-3">Contactado</th>
                                <th scope="col" className="px-6 py-3">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredLeads.length > 0 ? (
                                filteredLeads.map(lead => (
                                    <tr key={lead.id} className="bg-white border-b hover:bg-gray-50">
                                        <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                                            <Link to={`/escritorio/ventas/cliente/${lead.id}`} className="hover:underline text-primary-600">
                                                {`${lead.first_name || ''} ${lead.last_name || ''}`.trim() || 'Sin Nombre'}
                                            </Link>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="truncate w-48" title={lead.email}>{lead.email}</div>
                                            <div className="text-xs text-gray-400">{lead.phone}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="max-w-xs truncate" title={lead.latest_app_car_info?._vehicleTitle}>
                                                {lead.latest_app_car_info?._vehicleTitle || '-'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {lead.latest_app_status ? (
                                                <div className="flex items-center gap-2">
                                                    <span className={`w-3 h-3 rounded-full animate-pulse ${
                                                        lead.latest_app_status === 'submitted' ? 'bg-blue-500' :
                                                        lead.latest_app_status === 'reviewing' ? 'bg-purple-500' :
                                                        lead.latest_app_status === 'pending_docs' ? 'bg-yellow-500' :
                                                        lead.latest_app_status === 'approved' ? 'bg-green-500' :
                                                        lead.latest_app_status === 'draft' ? 'bg-gray-400' :
                                                        'bg-gray-400'
                                                    }`}></span>
                                                    <span className={`font-bold text-sm ${
                                                        lead.latest_app_status === 'submitted' ? 'text-blue-700' :
                                                        lead.latest_app_status === 'reviewing' ? 'text-purple-700' :
                                                        lead.latest_app_status === 'pending_docs' ? 'text-yellow-700' :
                                                        lead.latest_app_status === 'approved' ? 'text-green-700' :
                                                        lead.latest_app_status === 'draft' ? 'text-gray-600' :
                                                        'text-gray-600'
                                                    }`}>
                                                        {lead.latest_app_status === 'submitted' ? 'Enviada' :
                                                        lead.latest_app_status === 'reviewing' ? 'En Revisión' :
                                                        lead.latest_app_status === 'pending_docs' ? 'Docs Pendientes' :
                                                        lead.latest_app_status === 'approved' ? 'Aprobada' :
                                                        lead.latest_app_status === 'rejected' ? 'Rechazada' :
                                                        lead.latest_app_status === 'draft' ? 'Borrador' :
                                                        lead.latest_app_status}
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className="text-gray-400">-</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <input
                                                type="checkbox"
                                                checked={lead.contactado}
                                                onChange={() => toggleContactado(lead.id, lead.contactado)}
                                                className="w-5 h-5 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 focus:ring-2 cursor-pointer"
                                            />
                                        </td>
                                        <td className="px-6 py-4">
                                            <Link
                                                to={`/escritorio/ventas/cliente/${lead.id}`}
                                                className="inline-flex items-center px-3 py-1.5 text-xs font-semibold text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors"
                                            >
                                                Ver Perfil
                                            </Link>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                        {searchTerm || filterStatus !== 'all' || filterContactado !== 'all'
                                            ? 'No se encontraron leads con los filtros seleccionados.'
                                            : 'No tienes leads asignados aún.'}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default SalesLeadsDashboardPage;
