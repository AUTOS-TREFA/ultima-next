'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { AdminService } from '@/services/AdminService';
import { SalesService } from '@/services/SalesService';
import { ApplicationService } from '@/services/ApplicationService';
import {
    Loader2, AlertTriangle, User, Users, FileText, Clock, Search, Filter,
    CheckCircle2, AlertCircle, TrendingUp, Phone, Mail, RefreshCw, ArrowUpDown,
    ArrowUp, ArrowDown, Edit2, Check, X, Ban
} from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '../../supabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import DateRangeFilter, { DateRange } from '@/components/DateRangeFilter';
import {
    processLeads,
    getStatusLabel,
    getStatusColor,
    getStatusEmoji,
    formatRelativeTime
} from '@/utils/crmHelpers';
import { APPLICATION_STATUS } from '@/constants/applicationStatus';

interface UnifiedCRMPageProps {
    userRole: 'admin' | 'sales';
}

type SortColumn = 'name' | 'last_sign_in_at' | 'status' | 'contactado';
type SortDirection = 'asc' | 'desc';

const UnifiedCRMPage: React.FC<UnifiedCRMPageProps> = ({ userRole }) => {
    const { user } = useAuth();
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [filterContactado, setFilterContactado] = useState<string>('all');
    const [filterPriority, setFilterPriority] = useState<string>('all');
    const [updatingStatuses, setUpdatingStatuses] = useState<Set<string>>(new Set());
    const [sortColumn, setSortColumn] = useState<SortColumn>('last_sign_in_at');
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
    const [editingSource, setEditingSource] = useState<string | null>(null);
    const [tempSource, setTempSource] = useState<string>('');
    const [asesores, setAsesores] = useState<Array<{ id: string; name: string }>>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(25);
    const [dateRange, setDateRange] = useState<DateRange>({
        startDate: null,
        endDate: null,
        preset: 'allTime'
    });
    const queryClient = useQueryClient();

    const isAdmin = userRole === 'admin';
    const leadsQueryKey = isAdmin ? ['adminLeads'] : ['salesLeads', user?.id];
    const statsQueryKey = isAdmin ? ['adminStats'] : ['salesStats', user?.id];

    const { data: leads = [], isLoading: isLoadingLeads, isError: isErrorLeads, error: errorLeads } = useQuery<any[], Error>({
        queryKey: leadsQueryKey,
        queryFn: () => isAdmin ? AdminService.getAllLeads() : SalesService.getMyAssignedLeads(user?.id || ''),
        enabled: !!user?.id,
    });

    const { data: stats = {}, isLoading: isLoadingStats, isError: isErrorStats, error: errorStats } = useQuery<any, Error>({
        queryKey: statsQueryKey,
        queryFn: () => isAdmin ? AdminService.getDashboardStats() : SalesService.getMyLeadsStats(user?.id || ''),
        enabled: !!user?.id,
    });

    React.useEffect(() => {
        if (isAdmin) {
            supabase
                .from('profiles')
                .select('id, first_name, last_name, email')
                .in('role', ['admin', 'sales'])
                .order('first_name')
                .then(({ data }) => {
                    const asesorList = (data || []).map(a => ({
                        id: a.id,
                        name: `${a.first_name || ''} ${a.last_name || ''}`.trim() || a.email || 'Sin nombre'
                    }));
                    setAsesores(asesorList);
                });
        }
    }, [isAdmin]);

    const processedLeads = useMemo(() => processLeads(leads), [leads]);

    const filteredAndSortedLeads = useMemo(() => {
        let filtered = processedLeads;

        // Filter by date range first
        if (dateRange.startDate && dateRange.endDate) {
            filtered = filtered.filter(lead => {
                const leadDate = new Date(lead.created_at || lead.last_sign_in_at);
                return leadDate >= dateRange.startDate! && leadDate <= dateRange.endDate!;
            });
        }

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

        if (filterStatus !== 'all') {
            filtered = filtered.filter(lead => lead.correctedStatus === filterStatus);
        }

        if (filterContactado !== 'all') {
            filtered = filtered.filter(lead => {
                if (filterContactado === 'contacted') return lead.contactado === true;
                if (filterContactado === 'not_contacted') return lead.contactado === false;
                return true;
            });
        }

        if (filterPriority === 'needs_action') {
            filtered = filtered.filter(lead => lead.needsAction);
        }

        const sorted = [...filtered].sort((a, b) => {
            let aVal: any;
            let bVal: any;

            switch (sortColumn) {
                case 'name':
                    aVal = `${a.first_name || ''} ${a.last_name || ''}`.toLowerCase();
                    bVal = `${b.first_name || ''} ${b.last_name || ''}`.toLowerCase();
                    break;
                case 'last_sign_in_at':
                    aVal = a.last_sign_in_at ? new Date(a.last_sign_in_at).getTime() : 0;
                    bVal = b.last_sign_in_at ? new Date(b.last_sign_in_at).getTime() : 0;
                    break;
                case 'status':
                    const statusPriority: Record<string, number> = {
                        [APPLICATION_STATUS.FALTAN_DOCUMENTOS]: 1,
                        [APPLICATION_STATUS.PENDING_DOCS]: 1,
                        [APPLICATION_STATUS.COMPLETA]: 2,
                        [APPLICATION_STATUS.SUBMITTED]: 2,
                        [APPLICATION_STATUS.EN_REVISION]: 3,
                        [APPLICATION_STATUS.REVIEWING]: 3,
                        [APPLICATION_STATUS.IN_REVIEW]: 3,
                        [APPLICATION_STATUS.APROBADA]: 4,
                        [APPLICATION_STATUS.APPROVED]: 4,
                        [APPLICATION_STATUS.DRAFT]: 5,
                        [APPLICATION_STATUS.RECHAZADA]: 6,
                        'rejected': 6
                    };
                    aVal = statusPriority[a.correctedStatus || ''] || 999;
                    bVal = statusPriority[b.correctedStatus || ''] || 999;
                    break;
                case 'contactado':
                    aVal = a.contactado ? 1 : 0;
                    bVal = b.contactado ? 1 : 0;
                    break;
                default:
                    return 0;
            }

            if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
            return 0;
        });

        return sorted;
    }, [processedLeads, searchTerm, filterStatus, filterContactado, filterPriority, sortColumn, sortDirection, dateRange]);

    const paginatedLeads = useMemo(() => {
        const startIndex = (currentPage - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        return filteredAndSortedLeads.slice(startIndex, endIndex);
    }, [filteredAndSortedLeads, currentPage, pageSize]);

    const totalPages = Math.ceil(filteredAndSortedLeads.length / pageSize);

    const leadsNeedingAction = useMemo(() => {
        return filteredAndSortedLeads.filter(lead => lead.needsAction).length;
    }, [filteredAndSortedLeads]);

    // Recalculate stats based on filtered data
    const filteredStats = useMemo(() => {
        if (!dateRange.startDate || !dateRange.endDate) return stats;

        const total = filteredAndSortedLeads.length;
        const withActiveApp = filteredAndSortedLeads.filter(lead => lead.latest_app_id).length;
        const unfinished = filteredAndSortedLeads.filter(lead =>
            lead.latest_app_id && (
                // Check both new and legacy status values
                lead.correctedStatus === APPLICATION_STATUS.PENDING_DOCS ||
                lead.correctedStatus === APPLICATION_STATUS.FALTAN_DOCUMENTOS ||
                lead.correctedStatus === APPLICATION_STATUS.DRAFT ||
                !lead.is_complete
            )
        ).length;
        const notContacted = filteredAndSortedLeads.filter(lead => !lead.contactado).length;

        return {
            total_leads: total,
            leads_with_active_app: withActiveApp,
            leads_with_unfinished_app: unfinished,
            leads_not_contacted: notContacted
        };
    }, [filteredAndSortedLeads, stats, dateRange]);

    // Use filtered stats when date range is active
    const displayStats = (dateRange.startDate && dateRange.endDate) ? filteredStats : stats;

    React.useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, filterStatus, filterContactado, filterPriority, dateRange]);

    const handleSort = (column: SortColumn) => {
        if (sortColumn === column) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortColumn(column);
            setSortDirection('desc');
        }
    };

    const toggleContactado = async (leadId: string, currentValue: boolean) => {
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ contactado: !currentValue })
                .eq('id', leadId);

            if (error) throw error;

            await queryClient.invalidateQueries({ queryKey: leadsQueryKey });
            await queryClient.invalidateQueries({ queryKey: statsQueryKey });

            toast.success(`Marcado como ${!currentValue ? 'contactado' : 'no contactado'}`);
        } catch (err: any) {
            console.error('Error toggling contactado:', err);
            toast.error(`Error: ${err.message}`);
        }
    };

    const updateApplicationStatus = async (lead: any, newStatus: string) => {
        if (!lead.latest_app_id) {
            toast.error('No hay solicitud para actualizar');
            return;
        }

        setUpdatingStatuses(prev => new Set(prev).add(lead.id));

        try {
            await ApplicationService.updateApplicationStatus(lead.latest_app_id, newStatus);

            const feedbackMessages: Record<string, { title: string; description: string; type: 'success' | 'warning' | 'info' | 'error' }> = {
                [APPLICATION_STATUS.COMPLETA]: {
                    title: '✅ Solicitud marcada como Completa',
                    description: 'Asegúrate de que todos los documentos estén presentes.',
                    type: 'success'
                },
                [APPLICATION_STATUS.SUBMITTED]: {
                    title: '✅ Solicitud marcada como Completa',
                    description: 'Asegúrate de que todos los documentos estén presentes.',
                    type: 'success'
                },
                [APPLICATION_STATUS.FALTAN_DOCUMENTOS]: {
                    title: '⚠️ Faltan Documentos',
                    description: 'Contacta al cliente para solicitar los documentos faltantes.',
                    type: 'warning'
                },
                [APPLICATION_STATUS.PENDING_DOCS]: {
                    title: '⚠️ Faltan Documentos',
                    description: 'Contacta al cliente para solicitar los documentos faltantes.',
                    type: 'warning'
                },
                [APPLICATION_STATUS.EN_REVISION]: {
                    title: '📋 En Revisión',
                    description: 'La solicitud está siendo revisada.',
                    type: 'info'
                },
                [APPLICATION_STATUS.REVIEWING]: {
                    title: '📋 En Revisión',
                    description: 'La solicitud está siendo revisada.',
                    type: 'info'
                },
                [APPLICATION_STATUS.IN_REVIEW]: {
                    title: '📋 En Revisión',
                    description: 'La solicitud está siendo revisada.',
                    type: 'info'
                },
                [APPLICATION_STATUS.APROBADA]: {
                    title: '🎉 Solicitud Aprobada',
                    description: 'Contacta al cliente para informarle.',
                    type: 'success'
                },
                [APPLICATION_STATUS.APPROVED]: {
                    title: '🎉 Solicitud Aprobada',
                    description: 'Contacta al cliente para informarle.',
                    type: 'success'
                },
                [APPLICATION_STATUS.RECHAZADA]: {
                    title: '❌ Solicitud Rechazada',
                    description: 'Contacta al cliente para explicar la situación.',
                    type: 'error'
                },
                'rejected': {
                    title: '❌ Solicitud Rechazada',
                    description: 'Contacta al cliente para explicar la situación.',
                    type: 'error'
                }
            };

            const feedback = feedbackMessages[newStatus];
            if (feedback) {
                toast[feedback.type](feedback.title, {
                    description: feedback.description,
                    duration: newStatus === 'pending_docs' ? 5000 : 4000
                });
            } else {
                toast.success(`Estado actualizado a: ${getStatusLabel(newStatus)}`);
            }

            await queryClient.invalidateQueries({ queryKey: leadsQueryKey });
            await queryClient.invalidateQueries({ queryKey: statsQueryKey });
        } catch (err: any) {
            console.error('Status update failed:', err);
            toast.error(`Error al actualizar: ${err.message}`);
        } finally {
            setUpdatingStatuses(prev => {
                const next = new Set(prev);
                next.delete(lead.id);
                return next;
            });
        }
    };

    const updateAsesorAsignado = async (leadId: string, asesorId: string | null) => {
        if (!isAdmin) return;

        try {
            const { error } = await supabase
                .from('profiles')
                .update({ asesor_asignado_id: asesorId || null })
                .eq('id', leadId);

            if (error) throw error;

            await queryClient.invalidateQueries({ queryKey: leadsQueryKey });
            toast.success(asesorId ? 'Asesor asignado correctamente' : 'Asesor removido');
        } catch (err: any) {
            toast.error(`Error: ${err.message}`);
        }
    };

    const handleRefresh = () => {
        queryClient.invalidateQueries({ queryKey: leadsQueryKey });
        queryClient.invalidateQueries({ queryKey: statsQueryKey });
    };

    const isLoading = isLoadingLeads || isLoadingStats;
    const isError = isErrorLeads || isErrorStats;
    const error = errorLeads || errorStats;

    if (!user) {
        return (
            <div className="flex flex-col items-center justify-center h-96">
                <AlertTriangle className="w-12 h-12 text-destructive mb-4" />
                <h2 className="text-xl font-semibold mb-2">Sesión Requerida</h2>
                <p className="text-muted-foreground">Debes iniciar sesión para acceder a esta página</p>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-96">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (isError) {
        return (
            <Card className="border-destructive">
                <CardContent className="pt-6">
                    <div className="flex items-center gap-2 text-destructive">
                        <AlertTriangle className="w-5 h-5"/>
                        <span>{error?.message}</span>
                    </div>
                </CardContent>
            </Card>
        );
    }

    const profileBasePath = isAdmin ? '/escritorio/admin/cliente' : '/escritorio/ventas/cliente';

    return (
        <div className="flex-1 w-full max-w-[1400px] mx-auto space-y-3 sm:space-y-4 p-3 sm:p-4 md:p-6 pt-4 sm:pt-6 overflow-x-hidden">
            {/* Priority Action Bar */}
            {leadsNeedingAction > 0 && (
                <Card className="border-amber-200 bg-amber-50/50">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center">
                                    <AlertCircle className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h3 className="font-semibold">
                                        {leadsNeedingAction} Lead{leadsNeedingAction > 1 ? 's' : ''} Necesitan Atención
                                    </h3>
                                    <p className="text-sm text-muted-foreground">
                                        Leads sin contactar o con solicitudes pendientes
                                    </p>
                                </div>
                            </div>
                            <Button onClick={() => setFilterPriority('needs_action')}>
                                Ver Urgentes
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">
                        {isAdmin ? 'CRM - Gestión de Leads' : 'Mis Leads Asignados'}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        {isAdmin
                            ? 'Gestiona todos los leads y asigna asesores'
                            : 'Gestiona tus clientes asignados y da seguimiento'}
                    </p>
                </div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                    <DateRangeFilter value={dateRange} onChange={setDateRange} />
                    <Button variant="outline" onClick={handleRefresh}>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Refrescar
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            {isAdmin ? "Total de Leads" : "Mis Leads"}
                        </CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{displayStats.total_leads || 0}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Con Solicitud Activa</CardTitle>
                        <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{displayStats.leads_with_active_app || 0}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Solicitud Incompleta</CardTitle>
                        <User className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{displayStats.leads_with_unfinished_app || displayStats.leads_not_contacted || 0}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Necesitan Seguimiento</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{leadsNeedingAction}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Main Content */}
            <Card>
                <CardHeader>
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                        <CardTitle>
                            {isAdmin ? 'Directorio de Clientes' : 'Mis Clientes'}
                        </CardTitle>
                        <div className="relative w-full sm:w-72">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                type="text"
                                placeholder="Buscar por nombre, email..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {/* Filters - Available for both admins and sales */}
                    <div className="flex flex-wrap gap-2 mb-4 p-3 bg-muted rounded-lg">
                        <div className="flex items-center gap-2">
                            <Filter className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm font-medium">Filtros:</span>
                        </div>

                        <select
                            value={filterPriority}
                            onChange={e => setFilterPriority(e.target.value)}
                            className="text-sm px-3 py-1.5 border rounded-md focus:outline-none focus:ring-2 focus:ring-ring bg-background"
                        >
                            <option value="all">Todos (Prioridad)</option>
                            <option value="needs_action">⚡ Necesitan Acción</option>
                        </select>

                        <select
                            value={filterContactado}
                            onChange={e => setFilterContactado(e.target.value)}
                            className="text-sm px-3 py-1.5 border rounded-md focus:outline-none focus:ring-2 focus:ring-ring bg-background"
                        >
                            <option value="all">Todos (Contactado)</option>
                            <option value="not_contacted">No Contactados</option>
                            <option value="contacted">Contactados</option>
                        </select>

                        <select
                            value={filterStatus}
                            onChange={e => setFilterStatus(e.target.value)}
                            className="text-sm px-3 py-1.5 border rounded-md focus:outline-none focus:ring-2 focus:ring-ring bg-background"
                        >
                            <option value="all">Todos (Estado)</option>
                            <option value={APPLICATION_STATUS.DRAFT}>{getStatusEmoji(APPLICATION_STATUS.DRAFT)} Borrador</option>
                            <option value={APPLICATION_STATUS.COMPLETA}>{getStatusEmoji(APPLICATION_STATUS.COMPLETA)} Completas</option>
                            <option value={APPLICATION_STATUS.FALTAN_DOCUMENTOS}>{getStatusEmoji(APPLICATION_STATUS.FALTAN_DOCUMENTOS)} Faltan Docs</option>
                            <option value={APPLICATION_STATUS.EN_REVISION}>{getStatusEmoji(APPLICATION_STATUS.EN_REVISION)} En Revisión</option>
                            <option value={APPLICATION_STATUS.APROBADA}>{getStatusEmoji(APPLICATION_STATUS.APROBADA)} Aprobadas</option>
                            <option value={APPLICATION_STATUS.RECHAZADA}>{getStatusEmoji(APPLICATION_STATUS.RECHAZADA)} Rechazadas</option>
                        </select>

                        {(searchTerm || filterStatus !== 'all' || filterContactado !== 'all' || filterPriority !== 'all') && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    setSearchTerm('');
                                    setFilterStatus('all');
                                    setFilterContactado('all');
                                    setFilterPriority('all');
                                }}
                            >
                                Limpiar
                            </Button>
                        )}

                        <div className="ml-auto flex items-center gap-3">
                            <span className="text-sm text-muted-foreground">
                                {filteredAndSortedLeads.length} lead{filteredAndSortedLeads.length !== 1 ? 's' : ''}
                                {!isAdmin && ' asignados'}
                            </span>
                            <select
                                value={pageSize}
                                onChange={(e) => {
                                    setPageSize(Number(e.target.value));
                                    setCurrentPage(1);
                                }}
                                className="text-sm px-2 py-1 border rounded-md focus:outline-none focus:ring-2 focus:ring-ring bg-background"
                            >
                                <option value={10}>10</option>
                                <option value={25}>25</option>
                                <option value={50}>50</option>
                                <option value={100}>100</option>
                            </select>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="rounded-md border overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-muted">
                                    <tr className="border-b">
                                        <th className="px-4 py-3 text-left font-medium">
                                            <button
                                                onClick={() => handleSort('name')}
                                                className="flex items-center gap-1 hover:text-primary"
                                            >
                                                Cliente
                                                {sortColumn === 'name' ? (
                                                    sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                                                ) : <ArrowUpDown className="w-3 h-3 opacity-40" />}
                                            </button>
                                        </th>
                                        <th className="px-4 py-3 text-left font-medium">Fuente</th>
                                        <th className="px-4 py-3 text-left font-medium">
                                            <button
                                                onClick={() => handleSort('last_sign_in_at')}
                                                className="flex items-center gap-1 hover:text-primary"
                                            >
                                                Último Acceso
                                                {sortColumn === 'last_sign_in_at' ? (
                                                    sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                                                ) : <ArrowUpDown className="w-3 h-3 opacity-40" />}
                                            </button>
                                        </th>
                                        <th className="px-4 py-3 text-left font-medium">
                                            <button
                                                onClick={() => handleSort('status')}
                                                className="flex items-center gap-1 hover:text-primary"
                                            >
                                                Estado
                                                {sortColumn === 'status' ? (
                                                    sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                                                ) : <ArrowUpDown className="w-3 h-3 opacity-40" />}
                                            </button>
                                        </th>
                                        <th className="px-4 py-3 text-center font-medium">
                                            <button
                                                onClick={() => handleSort('contactado')}
                                                className="flex items-center gap-1 hover:text-primary mx-auto"
                                            >
                                                Contactado
                                                {sortColumn === 'contactado' ? (
                                                    sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                                                ) : <ArrowUpDown className="w-3 h-3 opacity-40" />}
                                            </button>
                                        </th>
                                        {isAdmin && <th className="px-4 py-3 text-left font-medium">Asesor</th>}
                                        <th className="px-4 py-3 text-center font-medium">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedLeads.length > 0 ? (
                                        paginatedLeads.map(lead => {
                                            const statusColor = getStatusColor(lead.correctedStatus || '');
                                            const isUpdating = updatingStatuses.has(lead.id);

                                            return (
                                                <tr
                                                    key={lead.id}
                                                    className={`border-b hover:bg-accent transition-colors ${lead.needsAction ? 'bg-amber-50/30' : ''}`}
                                                >
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-start gap-2">
                                                            {lead.needsAction ? (
                                                                <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                                                            ) : (
                                                                <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                                                            )}
                                                            <div className="min-w-0">
                                                                <Link href={`${profileBasePath}/${lead.id}`} className="font-medium hover:text-primary hover:underline block truncate">
                                                                    {`${lead.first_name || ''} ${lead.last_name || ''}`.trim() || 'Sin Nombre'}
                                                                </Link>
                                                                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                                                                    <Mail className="w-3 h-3" />
                                                                    <span className="truncate max-w-[180px]">{lead.email}</span>
                                                                </div>
                                                                {lead.phone && (
                                                                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                                        <Phone className="w-3 h-3" />
                                                                        <span>{lead.phone}</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="text-xs space-y-0.5">
                                                            {lead.utm_campaign && <div className="font-semibold">{lead.utm_campaign}</div>}
                                                            {lead.utm_source && <div className="text-muted-foreground">utm: {lead.utm_source}</div>}
                                                            {lead.source && !lead.utm_source && !lead.utm_campaign && <div>{lead.source}</div>}
                                                            {!lead.utm_campaign && !lead.utm_source && !lead.source && <span className="text-muted-foreground">-</span>}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="text-xs">{formatRelativeTime(lead.last_sign_in_at)}</div>
                                                        {lead.latest_app_car_info?._vehicleTitle && (
                                                            <div className="text-xs text-muted-foreground mt-1 truncate max-w-[140px]">
                                                                {lead.latest_app_car_info._vehicleTitle}
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        {lead.correctedStatus && lead.latest_app_id ? (
                                                            <div className="flex items-center gap-2">
                                                                {/* Pulsating dot */}
                                                                <div className="relative flex h-3 w-3">
                                                                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${statusColor.dotColor} opacity-75`}></span>
                                                                    <span className={`relative inline-flex rounded-full h-3 w-3 ${statusColor.dotColor}`}></span>
                                                                </div>
                                                                {/* Status text with color */}
                                                                <span className={`text-xs font-semibold ${statusColor.textColor}`}>
                                                                    {statusColor.label}
                                                                </span>
                                                            </div>
                                                        ) : (
                                                            <span className="text-xs text-muted-foreground">Sin solicitud</span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        <input
                                                            type="checkbox"
                                                            checked={lead.contactado}
                                                            onChange={() => toggleContactado(lead.id, lead.contactado)}
                                                            className="w-4 h-4 rounded border-input cursor-pointer"
                                                        />
                                                    </td>
                                                    {isAdmin && (
                                                        <td className="px-4 py-3">
                                                            <select
                                                                value={lead.asesor_asignado_id || ''}
                                                                onChange={(e) => updateAsesorAsignado(lead.id, e.target.value || null)}
                                                                className="text-xs px-2 py-1 border rounded-md focus:outline-none focus:ring-2 focus:ring-ring bg-background cursor-pointer"
                                                            >
                                                                <option value="">Sin asignar</option>
                                                                {asesores.map(asesor => (
                                                                    <option key={asesor.id} value={asesor.id}>
                                                                        {asesor.name}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </td>
                                                    )}
                                                    <td className="px-4 py-3 text-center">
                                                        <Button size="sm" asChild>
                                                            <Link href={`${profileBasePath}/${lead.id}`}>
                                                                Abrir
                                                            </Link>
                                                        </Button>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    ) : (
                                        <tr>
                                            <td colSpan={isAdmin ? 7 : 6} className="px-6 py-12 text-center text-muted-foreground">
                                                {searchTerm || filterStatus !== 'all' || filterContactado !== 'all' || filterPriority !== 'all'
                                                    ? 'No se encontraron leads con los filtros seleccionados.'
                                                    : 'No hay leads disponibles.'}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="mt-4 flex items-center justify-between">
                            <div className="text-sm text-muted-foreground">
                                Página {currentPage} de {totalPages} • {((currentPage - 1) * pageSize) + 1}-{Math.min(currentPage * pageSize, filteredAndSortedLeads.length)} de {filteredAndSortedLeads.length}
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                    disabled={currentPage === 1}
                                >
                                    Anterior
                                </Button>

                                <div className="flex items-center gap-1">
                                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                        let pageNum;
                                        if (totalPages <= 5) {
                                            pageNum = i + 1;
                                        } else if (currentPage <= 3) {
                                            pageNum = i + 1;
                                        } else if (currentPage >= totalPages - 2) {
                                            pageNum = totalPages - 4 + i;
                                        } else {
                                            pageNum = currentPage - 2 + i;
                                        }

                                        return (
                                            <Button
                                                key={pageNum}
                                                variant={currentPage === pageNum ? "default" : "outline"}
                                                size="sm"
                                                className="w-9"
                                                onClick={() => setCurrentPage(pageNum)}
                                            >
                                                {pageNum}
                                            </Button>
                                        );
                                    })}
                                </div>

                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                    disabled={currentPage === totalPages}
                                >
                                    Siguiente
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default UnifiedCRMPage;
