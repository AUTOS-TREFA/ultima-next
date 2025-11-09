import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { SellCarService } from '../services/SellCarService';
import { Loader2, AlertTriangle, Car, ShoppingCart, Clock, CheckCircle, Search, Trash2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import StatsCard from '../components/StatsCard';
import { config } from './config';
import { toast } from 'react-hot-toast';

type TabType = 'generated' | 'accepted';

const AdminComprasDashboardPage: React.FC = () => {
    const { user, isSales } = useAuth();
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState<TabType>('accepted');
    const queryClient = useQueryClient();

    const { data: purchaseLeads = [], isLoading: isLoadingLeads, isError: isErrorLeads, error: errorLeads } = useQuery<any[], Error>({
        queryKey: ['purchaseLeads'],
        queryFn: SellCarService.getAllPurchaseLeads
    });

    const { data: stats = {}, isLoading: isLoadingStats, isError: isErrorStats, error: errorStats } = useQuery<any, Error>({
        queryKey: ['comprasDashboardStats'],
        queryFn: SellCarService.getPurchaseDashboardStats
    });

    // Fetch all valuations from Airtable storage table
    const { data: airtableValuations = [], isLoading: isLoadingAirtable, isError: isErrorAirtable, error: errorAirtable } = useQuery<any[], Error>({
        queryKey: ['airtableValuations'],
        queryFn: async () => {
            const response = await fetch(
                `https://api.airtable.com/v0/${config.airtable.valuation.baseId}/${config.airtable.valuation.storageTableId}`,
                {
                    headers: {
                        'Authorization': `Bearer ${config.airtable.valuation.apiKey}`
                    }
                }
            );
            if (!response.ok) throw new Error('Failed to fetch valuations from Airtable');
            const data = await response.json();
            return data.records.map((record: any) => ({
                id: record.id,
                ...record.fields,
                createdTime: record.createdTime
            }));
        }
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

    // Delete Airtable valuation mutation
    const deleteAirtableValuationMutation = useMutation({
        mutationFn: async (recordId: string) => {
            const response = await fetch(
                `https://api.airtable.com/v0/${config.airtable.valuation.baseId}/${config.airtable.valuation.storageTableId}/${recordId}`,
                {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${config.airtable.valuation.apiKey}`
                    }
                }
            );
            if (!response.ok) throw new Error('Failed to delete valuation from Airtable');
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['airtableValuations'] });
            toast.success('Valuación eliminada exitosamente');
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Error al eliminar la valuación');
        }
    });

    // Delete handlers with confirmation
    const handleDeletePurchaseLead = (leadId: string, clientName: string) => {
        if (window.confirm(`¿Estás seguro de que deseas eliminar el lead de compra de ${clientName}?`)) {
            deletePurchaseLeadMutation.mutate(leadId);
        }
    };

    const handleDeleteAirtableValuation = (recordId: string, clientName: string) => {
        if (window.confirm(`¿Estás seguro de que deseas eliminar la valuación de ${clientName}?`)) {
            deleteAirtableValuationMutation.mutate(recordId);
        }
    };

    const filteredData = useMemo(() => {
        // Choose data source based on active tab
        const dataSource = activeTab === 'accepted' ? purchaseLeads : airtableValuations;
        let filtered = dataSource;

        // Apply sales filter only for accepted leads tab
        if (activeTab === 'accepted' && isSales && user) {
            filtered = dataSource.filter(lead => lead.asesor_asignado_id === user.id);
        }

        if (!searchTerm) return filtered;

        const lowercasedQuery = searchTerm.toLowerCase();

        // Search logic for accepted leads
        if (activeTab === 'accepted') {
            return filtered.filter(lead =>
                `${lead.first_name || ''} ${lead.last_name || ''}`.toLowerCase().includes(lowercasedQuery) ||
                lead.email?.toLowerCase().includes(lowercasedQuery) ||
                lead.vehicle_info?.toLowerCase().includes(lowercasedQuery)
            );
        }

        // Search logic for generated valuations
        return filtered.filter(valuation =>
            valuation['Client Name']?.toLowerCase().includes(lowercasedQuery) ||
            valuation['Client Email']?.toLowerCase().includes(lowercasedQuery) ||
            valuation['Client Phone']?.toLowerCase().includes(lowercasedQuery)
        );
    }, [purchaseLeads, airtableValuations, searchTerm, isSales, user, activeTab]);

    const isLoading = isLoadingLeads || isLoadingStats || (activeTab === 'generated' && isLoadingAirtable);
    const isError = isErrorLeads || isErrorStats || (activeTab === 'generated' && isErrorAirtable);
    const error = errorLeads || errorStats || (activeTab === 'generated' ? errorAirtable : null);

    if (isLoading) return <div className="flex justify-center items-center h-full"><Loader2 className="w-8 h-8 animate-spin text-primary-600" /></div>;
    if (isError) return <div className="p-4 bg-red-100 text-red-800 rounded-md"><AlertTriangle className="inline w-5 h-5 mr-2"/>{error?.message}</div>;

    return (
        <div className="space-y-8">
            {/* Stats Cards - only show for accepted leads tab */}
            {activeTab === 'accepted' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatsCard title="Total de Compras" value={stats.total_leads || 0} change="" changeType="neutral" icon={ShoppingCart} color="blue" />
                    <StatsCard title="En Inspección" value={stats.in_inspection || 0} change="" changeType="neutral" icon={Clock} color="yellow" />
                    <StatsCard title="Oferta Enviada" value={stats.offer_made || 0} change="" changeType="neutral" icon={Car} color="purple" />
                    <StatsCard title="Completados" value={stats.completed || 0} change="" changeType="neutral" icon={CheckCircle} color="green" />
                </div>
            )}

            <div className="bg-white p-6 rounded-xl shadow-sm border">
                {/* Tab Navigation */}
                <div className="flex gap-4 border-b border-gray-200 mb-6">
                    <button
                        onClick={() => setActiveTab('accepted')}
                        className={`pb-3 px-2 text-sm font-semibold transition-all ${
                            activeTab === 'accepted'
                                ? 'text-primary-600 border-b-2 border-primary-600'
                                : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        Valuaciones Aceptadas
                    </button>
                    <button
                        onClick={() => setActiveTab('generated')}
                        className={`pb-3 px-2 text-sm font-semibold transition-all ${
                            activeTab === 'generated'
                                ? 'text-primary-600 border-b-2 border-primary-600'
                                : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        Valuaciones Generadas
                    </button>
                </div>

                {/* Search Bar */}
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
                    <h2 className="text-xl font-bold text-gray-800">
                        {activeTab === 'accepted' ? 'Autos para Comprar' : 'Todas las Valuaciones'}
                    </h2>
                    <div className="relative w-full sm:w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Buscar por nombre, email o vehículo..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                    </div>
                </div>

                {/* Table Content */}
                <div className="overflow-x-auto">
                    {activeTab === 'accepted' ? (
                        // Accepted Leads Table
                        <table className="w-full text-sm text-left text-gray-500">
                            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3">Propietario</th>
                                    <th scope="col" className="px-6 py-3">Email / Teléfono</th>
                                    <th scope="col" className="px-6 py-3">Vehículo</th>
                                    <th scope="col" className="px-6 py-3">Oferta Inicial</th>
                                    <th scope="col" className="px-6 py-3">Estado</th>
                                    <th scope="col" className="px-6 py-3">Contactado</th>
                                    <th scope="col" className="px-6 py-3">Asesor</th>
                                    <th scope="col" className="px-6 py-3">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredData.map(lead => (
                                    <tr key={lead.id} className="bg-white border-b hover:bg-gray-50">
                                        <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                                            <Link to={`/escritorio/admin/compras/${lead.id}`} className="hover:underline text-primary-600">
                                                {`${lead.first_name || ''} ${lead.last_name || ''}`.trim() || 'Sin Nombre'}
                                            </Link>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="truncate w-48" title={lead.email}>{lead.email}</div>
                                            <div className="text-xs text-gray-400">{lead.phone}</div>
                                        </td>
                                        <td className="px-6 py-4">{lead.vehicle_info || '-'}</td>
                                        <td className="px-6 py-4">
                                            {lead.suggested_offer ? new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(lead.suggested_offer) : '-'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(lead.status)}`}>
                                                {getStatusLabel(lead.status)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${lead.contacted ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                {lead.contacted ? 'Sí' : 'No'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">{lead.asesor_asignado || '-'}</td>
                                        <td className="px-6 py-4">
                                            <button
                                                onClick={() => handleDeletePurchaseLead(
                                                    lead.id,
                                                    `${lead.first_name || ''} ${lead.last_name || ''}`.trim() || 'este cliente'
                                                )}
                                                className="text-red-600 hover:text-red-800 transition-colors disabled:opacity-50"
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
                    ) : (
                        // Generated Valuations Table
                        <table className="w-full text-sm text-left text-gray-500">
                            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3">Nombre del Cliente</th>
                                    <th scope="col" className="px-6 py-3">Email / Teléfono</th>
                                    <th scope="col" className="px-6 py-3">Vehículo</th>
                                    <th scope="col" className="px-6 py-3">Kilometraje</th>
                                    <th scope="col" className="px-6 py-3">Oferta Sugerida</th>
                                    <th scope="col" className="px-6 py-3">Fecha</th>
                                    <th scope="col" className="px-6 py-3">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredData.map((valuation: any, index: number) => (
                                    <tr key={valuation.id || index} className="bg-white border-b hover:bg-gray-50">
                                        <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                                            {valuation['Client Name'] || 'Sin Nombre'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="truncate w-48" title={valuation['Client Email']}>{valuation['Client Email'] || '-'}</div>
                                            <div className="text-xs text-gray-400">{valuation['Client Phone'] || '-'}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {valuation['Inventario'] ? (
                                                Array.isArray(valuation['Inventario']) ? valuation['Inventario'][0] : valuation['Inventario']
                                            ) : '-'}
                                        </td>
                                        <td className="px-6 py-4">
                                            {valuation['Kilometraje'] ? new Intl.NumberFormat('es-MX').format(valuation['Kilometraje']) + ' km' : '-'}
                                        </td>
                                        <td className="px-6 py-4">
                                            {valuation['Oferta Sugerida'] ? new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(valuation['Oferta Sugerida']) : '-'}
                                        </td>
                                        <td className="px-6 py-4 text-xs text-gray-500">
                                            {valuation.createdTime ? new Date(valuation.createdTime).toLocaleDateString('es-MX') : '-'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <button
                                                onClick={() => handleDeleteAirtableValuation(
                                                    valuation.id,
                                                    valuation['Client Name'] || 'este cliente'
                                                )}
                                                className="text-red-600 hover:text-red-800 transition-colors disabled:opacity-50"
                                                title="Eliminar"
                                                disabled={deleteAirtableValuationMutation.isPending}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
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
