'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import { SellCarService } from '../services/SellCarService';
import { Loader2, AlertTriangle, Car, ShoppingCart, Clock, CheckCircle, Search, Trash2, TrendingUp, DollarSign } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import StatsCard from '../components/StatsCard';
import { toast } from 'react-hot-toast';

const AdminComprasDashboardPage: React.FC = () => {
    const { user, isSales } = useAuth();
    const [searchTerm, setSearchTerm] = useState('');
    const queryClient = useQueryClient();

    // Fetch purchase leads from Supabase (Autométrica valuations)
    const { data: purchaseLeads = [], isLoading: isLoadingLeads, isError: isErrorLeads, error: errorLeads } = useQuery<any[], Error>({
        queryKey: ['purchaseLeads'],
        queryFn: SellCarService.getAllPurchaseLeads
    });

    // Fetch dashboard stats
    const { data: stats = {}, isLoading: isLoadingStats, isError: isErrorStats, error: errorStats } = useQuery<any, Error>({
        queryKey: ['comprasDashboardStats'],
        queryFn: SellCarService.getPurchaseDashboardStats
    });

    // Delete purchase lead mutation
    const deletePurchaseLeadMutation = useMutation({
        mutationFn: (leadId: string) => SellCarService.deletePurchaseLead(leadId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['purchaseLeads'] });
            queryClient.invalidateQueries({ queryKey: ['comprasDashboardStats'] });
            toast.success('Lead de compra eliminado exitosamente');
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Error al eliminar el lead de compra');
        }
    });

    // Delete handler with confirmation
    const handleDeletePurchaseLead = (leadId: string, clientName: string) => {
        if (window.confirm(`¿Estás seguro de que deseas eliminar el lead de compra de ${clientName}?`)) {
            deletePurchaseLeadMutation.mutate(leadId);
        }
    };

    // Filter purchase leads based on search term and user role
    const filteredData = useMemo(() => {
        let filtered = purchaseLeads;

        // Apply sales filter - sales users only see their assigned leads
        if (isSales && user) {
            filtered = purchaseLeads.filter(lead => lead.asesor_asignado_id === user.id);
        }

        if (!searchTerm) return filtered;

        const lowercasedQuery = searchTerm.toLowerCase();

        return filtered.filter(lead =>
            `${lead.first_name || ''} ${lead.last_name || ''}`.toLowerCase().includes(lowercasedQuery) ||
            lead.email?.toLowerCase().includes(lowercasedQuery) ||
            lead.vehicle_info?.toLowerCase().includes(lowercasedQuery)
        );
    }, [purchaseLeads, searchTerm, isSales, user]);

    const isLoading = isLoadingLeads || isLoadingStats;
    const isError = isErrorLeads || isErrorStats;
    const error = errorLeads || errorStats;

    if (isLoading) return <div className="flex justify-center items-center h-full"><Loader2 className="w-8 h-8 animate-spin text-primary-600" /></div>;
    if (isError) return <div className="p-4 bg-red-100 text-red-800 rounded-md"><AlertTriangle className="inline w-5 h-5 mr-2"/>{error?.message}</div>;

    return (
        <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatsCard title="Total Valuaciones" value={stats.total_leads || 0} change="" changeType="neutral" icon={ShoppingCart} color="blue" />
                <StatsCard title="En Inspección" value={stats.in_inspection || 0} change="" changeType="neutral" icon={Clock} color="yellow" />
                <StatsCard title="Oferta Enviada" value={stats.offer_made || 0} change="" changeType="neutral" icon={DollarSign} color="purple" />
                <StatsCard title="Completados" value={stats.completed || 0} change="" changeType="neutral" icon={CheckCircle} color="green" />
            </div>

            <div className="bg-card p-6 rounded-xl shadow-sm border border-border">
                {/* Header with Search */}
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
                    <div>
                        <h2 className="text-xl font-bold text-foreground">Valuaciones Autométrica</h2>
                        <p className="text-sm text-muted-foreground">Autos que los usuarios quieren vender</p>
                    </div>
                    <div className="relative w-full sm:w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Buscar por nombre, email o auto..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-background border border-input rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                    </div>
                </div>

                {/* Table Content */}
                <div className="overflow-x-auto">
                    {filteredData.length > 0 && (
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-muted-foreground uppercase bg-accent/50">
                                <tr>
                                    <th scope="col" className="px-4 py-3">Propietario</th>
                                    <th scope="col" className="px-4 py-3">Contacto</th>
                                    <th scope="col" className="px-4 py-3">Vehículo</th>
                                    <th scope="col" className="px-4 py-3">Oferta</th>
                                    <th scope="col" className="px-4 py-3">Estado</th>
                                    <th scope="col" className="px-4 py-3">Contactado</th>
                                    <th scope="col" className="px-4 py-3">Asesor</th>
                                    <th scope="col" className="px-4 py-3 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {filteredData.map(lead => (
                                    <tr key={lead.id} className="bg-card hover:bg-accent/30 transition-colors">
                                        <td className="px-4 py-3 font-medium text-foreground whitespace-nowrap">
                                            <Link href={`/escritorio/admin/compras/${lead.id}`} className="hover:underline text-primary">
                                                {`${lead.first_name || ''} ${lead.last_name || ''}`.trim() || 'Sin Nombre'}
                                            </Link>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="truncate max-w-[180px] text-foreground" title={lead.email}>{lead.email || '-'}</div>
                                            <div className="text-xs text-muted-foreground">{lead.phone || '-'}</div>
                                        </td>
                                        <td className="px-4 py-3 text-foreground">{lead.vehicle_info || '-'}</td>
                                        <td className="px-4 py-3 font-medium text-foreground">
                                            {lead.suggested_offer ? new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(lead.suggested_offer) : '-'}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(lead.status)}`}>
                                                {getStatusLabel(lead.status)}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${lead.contacted ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
                                                {lead.contacted ? 'Sí' : 'Pendiente'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-muted-foreground">{lead.asesor_asignado || '-'}</td>
                                        <td className="px-4 py-3 text-right">
                                            <button
                                                onClick={() => handleDeletePurchaseLead(
                                                    lead.id,
                                                    `${lead.first_name || ''} ${lead.last_name || ''}`.trim() || 'este cliente'
                                                )}
                                                className="text-destructive hover:text-destructive/80 transition-colors disabled:opacity-50 p-1"
                                                title="Eliminar"
                                                disabled={deletePurchaseLeadMutation.isPending}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}

                        {/* Empty state */}
                        {filteredData.length === 0 && (
                            <div className="text-center py-12">
                                <Car className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                                <h3 className="text-lg font-medium text-foreground mb-2">No hay valuaciones</h3>
                                <p className="text-sm text-muted-foreground">
                                    Las valuaciones de Autométrica aparecerán aquí cuando los usuarios soliciten cotizaciones.
                                </p>
                            </div>
                        )}
                </div>
            </div>
        </div>
    );
};

const getStatusLabel = (status: string): string => {
    const labels: Record<string, string> = {
        'draft': 'Borrador',
        'in_inspection': 'En Inspección',
        'offer_made': 'Oferta Enviada',
        'accepted': 'Aceptado',
        'rejected': 'Rechazado',
        'completed': 'Completado'
    };
    return labels[status] || status;
};

const getStatusBadgeColor = (status: string): string => {
    const colors: Record<string, string> = {
        'draft': 'bg-gray-100 text-gray-800',
        'in_inspection': 'bg-yellow-100 text-yellow-800',
        'offer_made': 'bg-purple-100 text-purple-800',
        'accepted': 'bg-blue-100 text-blue-800',
        'rejected': 'bg-red-100 text-red-800',
        'completed': 'bg-green-100 text-green-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
};

export default AdminComprasDashboardPage;
