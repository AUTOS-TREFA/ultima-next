'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminService } from '@/services/AdminService';
import {
    Loader2,
    AlertTriangle,
    UserPlus,
    Users,
    Activity,
    AlertCircle,
    CheckCircle,
    XCircle,
    Phone,
    Mail,
    Calendar,
    TrendingUp,
    Eye,
    FileText,
    FileDown,
    FileSpreadsheet
} from 'lucide-react';
import { toast } from 'sonner';
import CreateUserModal from '@/components/CreateUserModal';
import UserAnalyticsModal from '@/components/UserAnalyticsModal';
import ApplicationAnalyticsPanel from '@/components/ApplicationAnalyticsPanel';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import * as XLSX from 'xlsx';

interface SalesUser {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    phone: string;
    picture_url?: string;
    role?: string;
    created_at: string;
    last_sign_in_at: string;
    last_assigned_at: string;
    leads_assigned: number;
    leads_contacted: number;
    leads_with_applications: number;
    leads_actualizados: number;
    solicitudes_enviadas: number;
    solicitudes_procesadas: number;
    is_overloaded: boolean;
}

const AdminUserManagementPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'users' | 'applications'>('users');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
    const queryClient = useQueryClient();

    const { data: salesUsers = [], isLoading, isError, error } = useQuery<SalesUser[], Error>({
        queryKey: ['salesUsers'],
        queryFn: AdminService.getSalesUsersWithAnalytics
    });


    const formatDate = (dateString: string | null) => {
        if (!dateString) return 'Nunca';
        const date = new Date(dateString);
        return date.toLocaleDateString('es-MX', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const formatRelativeTime = (dateString: string | null) => {
        if (!dateString) return 'Nunca';

        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffSec = Math.floor(diffMs / 1000);
        const diffMin = Math.floor(diffSec / 60);
        const diffHour = Math.floor(diffMin / 60);
        const diffDay = Math.floor(diffHour / 24);
        const diffWeek = Math.floor(diffDay / 7);
        const diffMonth = Math.floor(diffDay / 30);

        if (diffMin < 1) return 'hace unos segundos';
        if (diffMin < 60) return `hace ${diffMin} min${diffMin !== 1 ? 's' : ''}`;
        if (diffHour < 24) return `hace ${diffHour} hora${diffHour !== 1 ? 's' : ''}`;
        if (diffDay < 7) return `hace ${diffDay} día${diffDay !== 1 ? 's' : ''}`;
        if (diffWeek < 4) return `hace ${diffWeek} semana${diffWeek !== 1 ? 's' : ''}`;
        if (diffMonth < 12) return `hace ${diffMonth} mes${diffMonth !== 1 ? 'es' : ''}`;

        return formatDate(dateString);
    };

    const getStatusBadge = (user: SalesUser) => {
        if (user.is_overloaded) {
            return (
                <Badge variant="destructive" className="gap-1 bg-red-600 text-white hover:bg-red-700">
                    <AlertCircle className="w-3 h-3" />
                    Sobrecargado
                </Badge>
            );
        }
        return (
            <Badge variant="default" className="gap-1 bg-green-600 text-white hover:bg-green-700">
                <CheckCircle className="w-3 h-3" />
                Activo
            </Badge>
        );
    };

    const getActivityBadge = (lastSignIn: string | null) => {
        if (!lastSignIn) return (
            <Badge variant="outline" className="bg-gray-100 text-gray-700 border-gray-300">Sin actividad</Badge>
        );

        const date = new Date(lastSignIn);
        const now = new Date();
        const diffDays = Math.ceil((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays <= 1) {
            return <Badge className="bg-emerald-500 text-white hover:bg-emerald-600">En línea</Badge>;
        } else if (diffDays <= 7) {
            return <Badge className="bg-blue-500 text-white hover:bg-blue-600">Activo</Badge>;
        } else if (diffDays <= 30) {
            return <Badge className="bg-amber-500 text-white hover:bg-amber-600">Poco activo</Badge>;
        } else {
            return <Badge className="bg-red-500 text-white hover:bg-red-600">Inactivo</Badge>;
        }
    };

    const totalLeads = salesUsers.reduce((sum, user) => sum + user.leads_assigned, 0);
    const totalContacted = salesUsers.reduce((sum, user) => sum + user.leads_contacted, 0);
    const totalApplications = salesUsers.reduce((sum, user) => sum + user.leads_with_applications, 0);
    const totalLeadsActualizados = salesUsers.reduce((sum, user) => sum + user.leads_actualizados, 0);
    const activeUsers = salesUsers.length; // All users are active by default
    const overloadedUsers = salesUsers.filter(user => user.is_overloaded).length;

    // Separar usuarios por rol
    const salesTeam = salesUsers.filter(user => user.role === 'sales');
    const admins = salesUsers.filter(user => user.role === 'admin');
    const others = salesUsers.filter(user => user.role && user.role !== 'sales' && user.role !== 'admin');

    const exportToCSV = () => {
        try {
            if (salesUsers.length === 0) {
                toast.error('No hay datos para exportar');
                return;
            }

            // Preparar los datos para CSV
            const csvData = salesUsers.map(user => ({
                'Nombre': `${user.first_name} ${user.last_name}`,
                'Email': user.email,
                'Teléfono': user.phone || 'N/A',
                'Sobrecargado': user.is_overloaded ? 'Sí' : 'No',
                'Leads Asignados': user.leads_assigned,
                'Leads Contactados': user.leads_contacted,
                'Leads Actualizados': user.leads_actualizados,
                'Solicitudes Enviadas': user.solicitudes_enviadas,
                'Solicitudes Procesadas': user.solicitudes_procesadas,
                'Con Solicitudes': user.leads_with_applications,
                'Último Inicio Sesión': formatDate(user.last_sign_in_at),
                'Fecha Creación': formatDate(user.created_at),
            }));

            // Convertir a CSV
            const headers = Object.keys(csvData[0]).join(',');
            const rows = csvData.map(row =>
                Object.values(row).map(val => `"${val}"`).join(',')
            );
            const csv = [headers, ...rows].join('\n');

            // Descargar archivo
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `usuarios_ventas_${new Date().toISOString().split('T')[0]}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            toast.success(`${salesUsers.length} usuarios exportados a CSV`);
        } catch (error) {
            console.error('Error exporting to CSV:', error);
            toast.error('Error al exportar a CSV');
        }
    };

    const exportToExcel = () => {
        try {
            if (salesUsers.length === 0) {
                toast.error('No hay datos para exportar');
                return;
            }

            // Preparar los datos para Excel
            const excelData = salesUsers.map(user => ({
                'Nombre': `${user.first_name} ${user.last_name}`,
                'Email': user.email,
                'Teléfono': user.phone || 'N/A',
                'Sobrecargado': user.is_overloaded ? 'Sí' : 'No',
                'Leads Asignados': user.leads_assigned,
                'Leads Contactados': user.leads_contacted,
                'Leads Actualizados': user.leads_actualizados,
                'Solicitudes Enviadas': user.solicitudes_enviadas,
                'Solicitudes Procesadas': user.solicitudes_procesadas,
                'Con Solicitudes': user.leads_with_applications,
                'Último Inicio Sesión': formatDate(user.last_sign_in_at),
                'Fecha Creación': formatDate(user.created_at),
            }));

            // Crear workbook y worksheet
            const ws = XLSX.utils.json_to_sheet(excelData);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Usuarios de Ventas');

            // Ajustar anchos de columnas
            const colWidths = [
                { wch: 25 }, // Nombre
                { wch: 30 }, // Email
                { wch: 15 }, // Teléfono
                { wch: 12 }, // Estado
                { wch: 15 }, // Sobrecargado
                { wch: 15 }, // Leads Asignados
                { wch: 18 }, // Leads Contactados
                { wch: 18 }, // Leads Actualizados
                { wch: 20 }, // Solicitudes Enviadas
                { wch: 22 }, // Solicitudes Procesadas
                { wch: 18 }, // Con Solicitudes
                { wch: 20 }, // Último Inicio Sesión
                { wch: 18 }, // Fecha Creación
            ];
            ws['!cols'] = colWidths;

            // Descargar archivo
            XLSX.writeFile(wb, `usuarios_ventas_${new Date().toISOString().split('T')[0]}.xlsx`);

            toast.success(`${salesUsers.length} usuarios exportados a Excel`);
        } catch (error) {
            console.error('Error exporting to Excel:', error);
            toast.error('Error al exportar a Excel');
        }
    };

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
                        <AlertTriangle className="w-5 h-5" />
                        <span>{error?.message}</span>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="flex-1 space-y-4 pt-2">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Gestión de Usuarios y Solicitudes</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                        Administra el equipo de ventas y analiza las solicitudes
                    </p>
                </div>
                {activeTab === 'users' && (
                    <div className="flex items-center gap-2">
                        <Button
                            onClick={exportToCSV}
                            variant="outline"
                            size="sm"
                            disabled={salesUsers.length === 0}
                        >
                            <FileDown className="w-4 h-4 mr-2" />
                            Exportar CSV
                        </Button>
                        <Button
                            onClick={exportToExcel}
                            variant="outline"
                            size="sm"
                            disabled={salesUsers.length === 0}
                        >
                            <FileSpreadsheet className="w-4 h-4 mr-2" />
                            Exportar Excel
                        </Button>
                        <Button onClick={() => setIsCreateModalOpen(true)}>
                            <UserPlus className="w-4 h-4 mr-2" />
                            Crear Usuario de Ventas
                        </Button>
                    </div>
                )}
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)}>
                <TabsList className="grid w-full max-w-md grid-cols-2">
                    <TabsTrigger value="users" className="gap-2">
                        <Users className="w-4 h-4" />
                        Usuarios de Ventas
                    </TabsTrigger>
                    <TabsTrigger value="applications" className="gap-2">
                        <FileText className="w-4 h-4" />
                        Análisis de Solicitudes
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="users" className="space-y-4">
                    {/* Stats Overview */}
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Usuarios</CardTitle>
                                <Users className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{salesUsers.length}</div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Activos</CardTitle>
                                <CheckCircle className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{activeUsers}</div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Leads Totales</CardTitle>
                                <Activity className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{totalLeads}</div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Contactados</CardTitle>
                                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{totalContacted}</div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Actualizados</CardTitle>
                                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{totalLeadsActualizados}</div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Sobrecargados</CardTitle>
                                <AlertCircle className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{overloadedUsers}</div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Users Table */}
                    <Card>
                        <CardContent className="p-0">
                            <div className="rounded-md border overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead className="bg-muted">
                                            <tr className="border-b">
                                                <th className="px-6 py-3 text-left font-medium">Usuario</th>
                                                <th className="px-6 py-3 text-left font-medium">Estado</th>
                                                <th className="px-6 py-3 text-left font-medium">Actividad</th>
                                                <th className="px-6 py-3 text-left font-medium">Leads</th>
                                                <th className="px-6 py-3 text-left font-medium">Métricas</th>
                                                <th className="px-6 py-3 text-left font-medium">Acciones</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y">
                                            {/* Sección: Equipo de Ventas */}
                                            {salesTeam.length > 0 && (
                                                <>
                                                    <tr>
                                                        <td colSpan={6} className="px-6 py-3 bg-blue-50 dark:bg-blue-900/20 font-semibold text-blue-900 dark:text-blue-100">
                                                            Equipo de Ventas ({salesTeam.length})
                                                        </td>
                                                    </tr>
                                                    {salesTeam.map((user) => (
                                                        <tr key={user.id} className="hover:bg-accent transition-colors">
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            {user.picture_url ? (
                                                                <img
                                                                    src={user.picture_url}
                                                                    alt={`${user.first_name} ${user.last_name}`}
                                                                    className="w-10 h-10 rounded-full object-cover border-2 border-primary/20"
                                                                />
                                                            ) : (
                                                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                                                    <span className="text-sm font-semibold">
                                                                        {user.first_name?.charAt(0)}{user.last_name?.charAt(0)}
                                                                    </span>
                                                                </div>
                                                            )}
                                                            <div>
                                                                <div className="font-medium">
                                                                    {user.first_name} {user.last_name}
                                                                </div>
                                                                <div className="text-xs text-muted-foreground flex items-center gap-1">
                                                                    <Calendar className="w-3 h-3" />
                                                                    Desde {formatDate(user.created_at)}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        {getStatusBadge(user)}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="space-y-1">
                                                            {getActivityBadge(user.last_sign_in_at)}
                                                            <div className="text-xs text-muted-foreground">
                                                                {formatRelativeTime(user.last_sign_in_at)}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="text-sm">
                                                            <div className="font-medium">
                                                                {user.leads_assigned} asignados
                                                            </div>
                                                            <div className="text-xs text-muted-foreground">
                                                                Última: {formatDate(user.last_assigned_at)}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="space-y-1 text-xs">
                                                            <div className="flex justify-between gap-4">
                                                                <span className="text-muted-foreground">Contactados:</span>
                                                                <span className="font-medium">
                                                                    {user.leads_contacted}/{user.leads_assigned}
                                                                </span>
                                                            </div>
                                                            <div className="flex justify-between gap-4">
                                                                <span className="text-muted-foreground">Actualizados:</span>
                                                                <span className="font-medium">
                                                                    {user.leads_actualizados}
                                                                </span>
                                                            </div>
                                                            <div className="flex justify-between gap-4">
                                                                <span className="text-muted-foreground">Procesadas:</span>
                                                                <span className="font-medium">
                                                                    {user.solicitudes_procesadas}/{user.solicitudes_enviadas}
                                                                </span>
                                                            </div>
                                                            <div className="w-full bg-secondary rounded-full h-1.5 mt-2">
                                                                <div
                                                                    className="bg-primary h-1.5 rounded-full transition-all"
                                                                    style={{
                                                                        width: `${user.leads_assigned > 0
                                                                            ? (user.leads_contacted / user.leads_assigned) * 100
                                                                            : 0
                                                                            }%`
                                                                    }}
                                                                ></div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-2">
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => setSelectedUserId(user.id)}
                                                            >
                                                                <Eye className="w-3 h-3 mr-1" />
                                                                Ver
                                                            </Button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                                </>
                                            )}

                                            {/* Sección: Administradores */}
                                            {admins.length > 0 && (
                                                <>
                                                    <tr>
                                                        <td colSpan={6} className="px-6 py-3 bg-purple-50 dark:bg-purple-900/20 font-semibold text-purple-900 dark:text-purple-100">
                                                            Administradores del Sitio ({admins.length})
                                                        </td>
                                                    </tr>
                                                    {admins.map((user) => (
                                                        <tr key={user.id} className="hover:bg-accent transition-colors">
                                                            <td className="px-6 py-4">
                                                                <div className="flex items-center gap-3">
                                                                    {user.picture_url ? (
                                                                        <img
                                                                            src={user.picture_url}
                                                                            alt={`${user.first_name} ${user.last_name}`}
                                                                            className="w-10 h-10 rounded-full object-cover border-2 border-primary/20"
                                                                        />
                                                                    ) : (
                                                                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                                                            <span className="text-sm font-semibold">
                                                                                {user.first_name?.charAt(0)}{user.last_name?.charAt(0)}
                                                                            </span>
                                                                        </div>
                                                                    )}
                                                                    <div>
                                                                        <div className="font-medium">
                                                                            {user.first_name} {user.last_name}
                                                                        </div>
                                                                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                                                                            <Calendar className="w-3 h-3" />
                                                                            Desde {formatDate(user.created_at)}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                {getStatusBadge(user)}
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <div className="space-y-1">
                                                                    {getActivityBadge(user.last_sign_in_at)}
                                                                    <div className="text-xs text-muted-foreground">
                                                                        {formatRelativeTime(user.last_sign_in_at)}
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <div className="text-sm">
                                                                    <div className="font-medium">
                                                                        {user.leads_assigned} asignados
                                                                    </div>
                                                                    <div className="text-xs text-muted-foreground">
                                                                        Última: {formatDate(user.last_assigned_at)}
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <div className="space-y-1 text-xs">
                                                                    <div className="flex justify-between gap-4">
                                                                        <span className="text-muted-foreground">Contactados:</span>
                                                                        <span className="font-medium">
                                                                            {user.leads_contacted}/{user.leads_assigned}
                                                                        </span>
                                                                    </div>
                                                                    <div className="flex justify-between gap-4">
                                                                        <span className="text-muted-foreground">Actualizados:</span>
                                                                        <span className="font-medium">
                                                                            {user.leads_actualizados}
                                                                        </span>
                                                                    </div>
                                                                    <div className="flex justify-between gap-4">
                                                                        <span className="text-muted-foreground">Procesadas:</span>
                                                                        <span className="font-medium">
                                                                            {user.solicitudes_procesadas}/{user.solicitudes_enviadas}
                                                                        </span>
                                                                    </div>
                                                                    <div className="w-full bg-secondary rounded-full h-1.5 mt-2">
                                                                        <div
                                                                            className="bg-primary h-1.5 rounded-full transition-all"
                                                                            style={{
                                                                                width: `${user.leads_assigned > 0
                                                                                    ? (user.leads_contacted / user.leads_assigned) * 100
                                                                                    : 0
                                                                                    }%`
                                                                            }}
                                                                        ></div>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <div className="flex items-center gap-2">
                                                                    <Button
                                                                        variant="outline"
                                                                        size="sm"
                                                                        onClick={() => setSelectedUserId(user.id)}
                                                                    >
                                                                        <Eye className="w-3 h-3 mr-1" />
                                                                        Ver
                                                                    </Button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </>
                                            )}

                                            {/* Sección: Otros Usuarios */}
                                            {others.length > 0 && (
                                                <>
                                                    <tr>
                                                        <td colSpan={6} className="px-6 py-3 bg-gray-50 dark:bg-gray-900/20 font-semibold text-gray-900 dark:text-gray-100">
                                                            Otros Usuarios ({others.length})
                                                        </td>
                                                    </tr>
                                                    {others.map((user) => (
                                                        <tr key={user.id} className="hover:bg-accent transition-colors">
                                                            <td className="px-6 py-4">
                                                                <div className="flex items-center gap-3">
                                                                    {user.picture_url ? (
                                                                        <img
                                                                            src={user.picture_url}
                                                                            alt={`${user.first_name} ${user.last_name}`}
                                                                            className="w-10 h-10 rounded-full object-cover border-2 border-primary/20"
                                                                        />
                                                                    ) : (
                                                                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                                                            <span className="text-sm font-semibold">
                                                                                {user.first_name?.charAt(0)}{user.last_name?.charAt(0)}
                                                                            </span>
                                                                        </div>
                                                                    )}
                                                                    <div>
                                                                        <div className="font-medium">
                                                                            {user.first_name} {user.last_name}
                                                                        </div>
                                                                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                                                                            <Calendar className="w-3 h-3" />
                                                                            Desde {formatDate(user.created_at)}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                {getStatusBadge(user)}
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <div className="space-y-1">
                                                                    {getActivityBadge(user.last_sign_in_at)}
                                                                    <div className="text-xs text-muted-foreground">
                                                                        {formatRelativeTime(user.last_sign_in_at)}
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <div className="text-sm">
                                                                    <div className="font-medium">
                                                                        {user.leads_assigned} asignados
                                                                    </div>
                                                                    <div className="text-xs text-muted-foreground">
                                                                        Última: {formatDate(user.last_assigned_at)}
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <div className="space-y-1 text-xs">
                                                                    <div className="flex justify-between gap-4">
                                                                        <span className="text-muted-foreground">Contactados:</span>
                                                                        <span className="font-medium">
                                                                            {user.leads_contacted}/{user.leads_assigned}
                                                                        </span>
                                                                    </div>
                                                                    <div className="flex justify-between gap-4">
                                                                        <span className="text-muted-foreground">Actualizados:</span>
                                                                        <span className="font-medium">
                                                                            {user.leads_actualizados}
                                                                        </span>
                                                                    </div>
                                                                    <div className="flex justify-between gap-4">
                                                                        <span className="text-muted-foreground">Procesadas:</span>
                                                                        <span className="font-medium">
                                                                            {user.solicitudes_procesadas}/{user.solicitudes_enviadas}
                                                                        </span>
                                                                    </div>
                                                                    <div className="w-full bg-secondary rounded-full h-1.5 mt-2">
                                                                        <div
                                                                            className="bg-primary h-1.5 rounded-full transition-all"
                                                                            style={{
                                                                                width: `${user.leads_assigned > 0
                                                                                    ? (user.leads_contacted / user.leads_assigned) * 100
                                                                                    : 0
                                                                                    }%`
                                                                            }}
                                                                        ></div>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <div className="flex items-center gap-2">
                                                                    <Button
                                                                        variant="outline"
                                                                        size="sm"
                                                                        onClick={() => setSelectedUserId(user.id)}
                                                                    >
                                                                        <Eye className="w-3 h-3 mr-1" />
                                                                        Ver
                                                                    </Button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="applications">
                    <ApplicationAnalyticsPanel />
                </TabsContent>
            </Tabs>

            {/* Modals */}
            <CreateUserModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSuccess={() => {
                    queryClient.invalidateQueries({ queryKey: ['salesUsers'] });
                    setIsCreateModalOpen(false);
                }}
            />

            {selectedUserId && (
                <UserAnalyticsModal
                    userId={selectedUserId}
                    onClose={() => setSelectedUserId(null)}
                />
            )}
        </div>
    );
};

export default AdminUserManagementPage;
