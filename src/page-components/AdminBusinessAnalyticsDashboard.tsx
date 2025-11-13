'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { BusinessAnalyticsService, BusinessMetrics } from '../services/BusinessAnalyticsService';
import { BrevoEmailService } from '../services/BrevoEmailService';
import {
    Car,
    AlertTriangle,
    RefreshCw,
    Mail,
    Package,
    BarChart3,
    CheckCircle2,
    DollarSign,
    Users,
    TrendingUp
} from 'lucide-react';
import { Bar, BarChart as RechartsBarChart, Pie, PieChart as RechartsPieChart, Cell, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid, Line, LineChart } from 'recharts';

const COLORS = ['#f97316', '#ea580c', '#c2410c', '#9a3412', '#7c2d12', '#431407'];

export default function AdminBusinessAnalyticsDashboard() {
    const { user, profile } = useAuth();
    const router = useRouter();
    const [metrics, setMetrics] = useState<BusinessMetrics | null>(null);
    const [loading, setLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
    const [refreshing, setRefreshing] = useState(false);
    const [sendingEmail, setSendingEmail] = useState<string | null>(null);

    const isAdmin = profile?.role === 'admin';

    useEffect(() => {
        loadBusinessData();
    }, []);

    const loadBusinessData = async (silent = false) => {
        try {
            if (!silent) setLoading(true);
            else setRefreshing(true);

            console.log('[Business Analytics] Starting to load data...');
            const businessMetrics = await BusinessAnalyticsService.getBusinessMetrics();
            console.log('[Business Analytics] Data loaded:', businessMetrics);
            setMetrics(businessMetrics);
            setLastUpdated(new Date());
        } catch (error) {
            console.error('[Business Analytics] Error loading metrics:', error);
            alert(`Error cargando datos: ${error instanceof Error ? error.message : 'Error desconocido'}`);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleSendAvailabilityEmail = async (app: any) => {
        if (!window.confirm(`¿Enviar email a ${app.applicantName} notificando que el vehículo ya no está disponible?`)) {
            return;
        }

        try {
            setSendingEmail(app.applicationId);
            await BrevoEmailService.sendVehicleUnavailableEmail({
                email: app.applicantEmail,
                name: app.applicantName,
                vehicleTitle: app.vehicleTitle
            });
            alert('Email enviado exitosamente');
        } catch (error) {
            console.error('Error sending email:', error);
            alert('Error al enviar el email');
        } finally {
            setSendingEmail(null);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="text-center">
                    <RefreshCw className="w-12 h-12 animate-spin text-orange-600 mx-auto mb-4" />
                    <p className="text-gray-600">Cargando análisis de negocio...</p>
                </div>
            </div>
        );
    }

    if (!metrics) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="text-center">
                    <p className="text-gray-600">No se pudieron cargar los datos</p>
                    <button
                        onClick={() => loadBusinessData(false)}
                        className="mt-4 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
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
                                Datos
                            </h1>
                            <p className="text-sm text-gray-500 mt-1">
                                Análisis de vehículos, ventas y tendencias de mercado
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
                                onClick={() => loadBusinessData(true)}
                                disabled={refreshing}
                                className="p-2 rounded-lg bg-orange-50 text-orange-600 hover:bg-orange-100 disabled:opacity-50"
                                title="Actualizar datos"
                            >
                                <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <MetricCard
                        title="Solicitudes Activas"
                        value={metrics.totalActiveApplications}
                        icon={<Package className="w-6 h-6" />}
                        color="orange"
                        subtitle="En proceso"
                    />
                    <MetricCard
                        title="Vehículos con Solicitudes"
                        value={metrics.inventoryVehiclesWithApplications.filter(v => v.ongoingApplications > 0).length}
                        icon={<Car className="w-6 h-6" />}
                        color="blue"
                        subtitle="Inventario con demanda"
                    />
                </div>

                {/* Unavailable Vehicle Applications - URGENT */}
                {metrics.unavailableVehicleApplications.length > 0 && (
                    <div className="bg-red-50 border-2 border-red-300 rounded-xl p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <AlertTriangle className="w-6 h-6 text-red-600" />
                            <div>
                                <h3 className="text-lg font-bold text-red-900">
                                    Solicitudes con Vehículos No Disponibles
                                </h3>
                                <p className="text-sm text-red-700">
                                    {metrics.unavailableVehicleApplications.length} aplicaciones requieren acción inmediata
                                </p>
                            </div>
                        </div>
                        <div className="space-y-3 max-h-96 overflow-y-auto">
                            {metrics.unavailableVehicleApplications.map(app => (
                                <div
                                    key={app.applicationId}
                                    className="bg-white rounded-lg p-4 flex items-center justify-between border border-red-200"
                                >
                                    <div className="flex-1">
                                        <p className="font-semibold text-gray-900">{app.vehicleTitle}</p>
                                        <p className="text-sm text-gray-600">
                                            Cliente: {app.applicantName} • {app.applicantEmail}
                                        </p>
                                        <p className="text-xs text-gray-500 mt-1">
                                            Solicitud: {new Date(app.createdAt).toLocaleDateString('es-MX')} •
                                            Estado: {app.status}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => handleSendAvailabilityEmail(app)}
                                        disabled={sendingEmail === app.applicationId}
                                        className="ml-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2 text-sm font-medium"
                                    >
                                        {sendingEmail === app.applicationId ? (
                                            <RefreshCw className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <Mail className="w-4 h-4" />
                                        )}
                                        Notificar Cliente
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Vehicle Insights - Most Active Vehicles */}
                <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                <Car className="w-6 h-6 text-orange-600" />
                                Vehículos con Mayor Demanda
                            </h3>
                            <p className="text-sm text-gray-600 mt-1">
                                Top 10 vehículos por cantidad de solicitudes activas
                            </p>
                        </div>
                    </div>
                    {metrics.vehicleInsights.length === 0 ? (
                        <div className="text-center py-12">
                            <Car className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500 text-sm">No hay datos de solicitudes por vehículo aún</p>
                            <p className="text-gray-400 text-xs mt-2">Los datos aparecerán cuando haya solicitudes activas</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {metrics.vehicleInsights.slice(0, 10).map((vehicle, index) => (
                            <div
                                key={vehicle.id}
                                className="bg-gradient-to-r from-orange-50 to-white rounded-lg p-4 border border-orange-200 hover:border-orange-300 transition-all"
                            >
                                <div className="flex items-start gap-4">
                                    <div className="flex-shrink-0">
                                        {vehicle.thumbnail ? (
                                            <img
                                                src={vehicle.thumbnail}
                                                alt={vehicle.titulo}
                                                className="w-20 h-20 rounded-lg object-cover"
                                            />
                                        ) : (
                                            <div className="w-20 h-20 rounded-lg bg-gray-200 flex items-center justify-center">
                                                <Car className="w-8 h-8 text-gray-400" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2">
                                            <p className="font-semibold text-gray-900 text-sm line-clamp-2">
                                                {vehicle.titulo}
                                            </p>
                                            <span className="flex-shrink-0 text-2xl font-bold text-orange-600">
                                                #{index + 1}
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-600 mt-1">
                                            ${vehicle.precio.toLocaleString('es-MX')} MXN
                                        </p>
                                        <div className="grid grid-cols-2 gap-3 mt-2">
                                            <div className="flex items-center gap-1">
                                                <BarChart3 className="w-4 h-4 text-orange-600" />
                                                <span className="text-sm font-semibold text-gray-900">
                                                    {vehicle.applicationCount}
                                                </span>
                                                <span className="text-xs text-gray-500">solicitudes</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <CheckCircle2 className="w-4 h-4 text-green-600" />
                                                <span className="text-sm font-semibold text-gray-900">
                                                    {vehicle.activeApplications}
                                                </span>
                                                <span className="text-xs text-gray-500">activas</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                </svg>
                                                <span className="text-sm font-semibold text-gray-900">
                                                    {vehicle.viewCount}
                                                </span>
                                                <span className="text-xs text-gray-500">vistas</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <TrendingUp className="w-4 h-4 text-purple-600" />
                                                <span className="text-sm font-semibold text-gray-900">
                                                    {vehicle.conversionRate}%
                                                </span>
                                                <span className="text-xs text-gray-500">conversión</span>
                                            </div>
                                        </div>
                                        <div className="mt-2">
                                            <span className={`inline-block text-xs px-2 py-1 rounded ${
                                                vehicle.ordenstatus === 'Disponible'
                                                    ? 'bg-green-100 text-green-700'
                                                    : 'bg-gray-100 text-gray-700'
                                            }`}>
                                                {vehicle.ordenstatus}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                        </div>
                    )}
                </div>

                {/* Inventory Vehicles with Applications */}
                <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                <Package className="w-6 h-6 text-orange-600" />
                                Inventario con Solicitudes Activas
                            </h3>
                            <p className="text-sm text-gray-600 mt-1">
                                Todos los vehículos en inventario con aplicaciones activas
                            </p>
                        </div>
                    </div>
                    {metrics.inventoryVehiclesWithApplications.length === 0 ? (
                        <div className="text-center py-12">
                            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500 text-sm">No hay vehículos en inventario con solicitudes activas</p>
                            <p className="text-gray-400 text-xs mt-2">Los datos aparecerán cuando haya solicitudes en proceso</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {metrics.inventoryVehiclesWithApplications
                                .filter(v => v.ongoingApplications > 0)
                                .slice(0, 30)
                                .map((vehicle) => (
                                <div
                                    key={vehicle.id}
                                    className="flex items-center justify-between p-4 bg-gray-50 hover:bg-orange-50 rounded-lg transition-colors border border-gray-200"
                                >
                                    <div className="flex items-center gap-4 flex-1 min-w-0">
                                        <span className="text-sm font-mono text-gray-500 flex-shrink-0">
                                            #{vehicle.id.slice(0, 8)}
                                        </span>
                                        <div className="flex-1 min-w-0">
                                            <span className="text-sm font-medium text-gray-900 truncate block">
                                                {vehicle.titulo}
                                            </span>
                                            <div className="flex items-center gap-4 mt-1">
                                                <span className="text-xs text-gray-500">
                                                    <svg className="w-3 h-3 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                    </svg>
                                                    {vehicle.viewCount} vistas
                                                </span>
                                                <span className="text-xs text-purple-600 font-semibold">
                                                    {vehicle.conversionRate}% conversión
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <a
                                        href={`/escritorio/admin/crm?vehicle=${vehicle.id}`}
                                        className="flex items-center gap-2 px-4 py-2 bg-orange-100 hover:bg-orange-200 text-orange-800 rounded-lg text-sm font-semibold transition-colors flex-shrink-0"
                                    >
                                        {vehicle.ongoingApplications} solicitudes activas
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </a>
                                </div>
                            ))}
                            {metrics.inventoryVehiclesWithApplications.filter(v => v.ongoingApplications > 0).length === 0 && (
                                <div className="text-center py-8 text-gray-500 text-sm">
                                    No hay vehículos en inventario con solicitudes activas en este momento
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Price Range Insights */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
                        <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2 mb-6">
                            <DollarSign className="w-6 h-6 text-orange-600" />
                            Distribución por Rango de Precio
                        </h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <RechartsPieChart>
                                <Pie
                                    data={metrics.priceRangeInsights}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={(entry) => `${entry.range}: ${entry.count}`}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="count"
                                >
                                    {metrics.priceRangeInsights.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </RechartsPieChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
                        <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2 mb-6">
                            <BarChart3 className="w-6 h-6 text-orange-600" />
                            Promedio de Solicitudes por Rango
                        </h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <RechartsBarChart data={metrics.priceRangeInsights}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="range" angle={-45} textAnchor="end" height={80} />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="avgApplications" fill="#f97316" name="Promedio de Solicitudes" />
                            </RechartsBarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Lead Persona Insights */}
                <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
                    <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2 mb-6">
                        <Users className="w-6 h-6 text-orange-600" />
                        Perfil de Leads y Tasas de Aprobación
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {metrics.leadPersonaInsights.map(persona => (
                            <div
                                key={persona.civilStatus}
                                className="bg-gradient-to-br from-orange-50 to-white rounded-lg p-4 border border-orange-200"
                            >
                                <h4 className="font-semibold text-gray-900 mb-3">{persona.civilStatus}</h4>
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-600">Cantidad:</span>
                                        <span className="font-bold text-gray-900">{persona.count}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-600">Ingreso Prom:</span>
                                        <span className="font-bold text-gray-900">
                                            ${Math.round(persona.avgIncome).toLocaleString('es-MX')}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-600">Tasa Aprobación:</span>
                                        <span className={`font-bold ${
                                            persona.approvalRate >= 50 ? 'text-green-600' : 'text-orange-600'
                                        }`}>
                                            {persona.approvalRate.toFixed(1)}%
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Conversion Rate by Price Chart */}
                <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
                    <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2 mb-6">
                        <TrendingUp className="w-6 h-6 text-orange-600" />
                        Tasa de Conversión por Rango de Precio
                    </h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={metrics.conversionRateByPrice}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="range" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Line
                                type="monotone"
                                dataKey="rate"
                                stroke="#f97316"
                                strokeWidth={2}
                                name="Promedio de Solicitudes"
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}

// Helper Components
interface MetricCardProps {
    title: string;
    value: string | number;
    icon: React.ReactNode;
    color: 'orange' | 'blue' | 'green' | 'red';
    subtitle?: string;
}

function MetricCard({ title, value, icon, color, subtitle }: MetricCardProps) {
    const colorClasses = {
        orange: 'bg-orange-50 border-orange-200 text-orange-600',
        blue: 'bg-blue-50 border-blue-200 text-blue-600',
        green: 'bg-green-50 border-green-200 text-green-600',
        red: 'bg-red-50 border-red-200 text-red-600'
    };

    return (
        <div className={`${colorClasses[color].split(' ')[0]} rounded-xl shadow-sm p-6 border-2 ${colorClasses[color].split(' ')[1]}`}>
            <div className="flex items-start justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-700">{title}</h3>
                <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
                    {icon}
                </div>
            </div>
            <p className={`text-3xl font-black ${colorClasses[color].split(' ')[2]}`}>
                {value}
            </p>
            {subtitle && <p className="text-sm text-gray-600 mt-2">{subtitle}</p>}
        </div>
    );
}
