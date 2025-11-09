import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../../supabaseClient';
import {
    Mail,
    Database,
    Activity,
    TrendingUp,
    RefreshCw,
    Download,
    Filter,
    Search,
    Calendar,
    AlertCircle,
    CheckCircle,
    XCircle,
    Clock
} from 'lucide-react';

interface EmailLog {
    id: string;
    recipient_email: string;
    template_type: string;
    status: string;
    created_at: string;
    subject?: string;
    error_message?: string;
}

interface SyncLog {
    id: string;
    sync_type: string;
    status: string;
    records_processed: number;
    records_added: number;
    records_updated: number;
    records_failed: number;
    started_at: string;
    completed_at: string;
    error_message?: string;
}

interface ConversionLog {
    id: string;
    event_type: string;
    event_name: string;
    user_id?: string;
    metadata: any;
    created_at: string;
    source?: string;
}

export default function AdminLogsPage() {
    const { profile } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'emails' | 'sync' | 'conversions' | 'events'>('emails');
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Email logs state
    const [emailLogs, setEmailLogs] = useState<EmailLog[]>([]);
    const [emailFilter, setEmailFilter] = useState<string>('all');
    const [emailSearch, setEmailSearch] = useState<string>('');

    // Sync logs state
    const [syncLogs, setSyncLogs] = useState<SyncLog[]>([]);
    const [syncFilter, setSyncFilter] = useState<string>('all');

    // Conversion logs state
    const [conversionLogs, setConversionLogs] = useState<ConversionLog[]>([]);
    const [conversionFilter, setConversionFilter] = useState<string>('all');

    // Redirect if not admin
    useEffect(() => {
        if (profile && profile.role !== 'admin') {
            navigate('/escritorio/dashboard');
        }
    }, [profile, navigate]);

    useEffect(() => {
        loadData();
    }, [activeTab]);

    const loadData = async (silent = false) => {
        if (!silent) setLoading(true);
        else setRefreshing(true);

        try {
            switch (activeTab) {
                case 'emails':
                    await loadEmailLogs();
                    break;
                case 'sync':
                    await loadSyncLogs();
                    break;
                case 'conversions':
                case 'events':
                    await loadConversionLogs();
                    break;
            }
        } catch (error) {
            console.error('[AdminLogs] Error loading data:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const loadEmailLogs = async () => {
        const { data, error } = await supabase
            .from('email_history')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(100);

        if (error) {
            console.error('Error loading email logs:', error);
            return;
        }

        setEmailLogs(data || []);
    };

    const loadSyncLogs = async () => {
        const { data, error } = await supabase
            .from('inventory_sync_logs')
            .select('*')
            .order('started_at', { ascending: false })
            .limit(50);

        if (error) {
            console.error('Error loading sync logs:', error);
            return;
        }

        setSyncLogs(data || []);
    };

    const loadConversionLogs = async () => {
        const { data, error } = await supabase
            .from('marketing_events')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(100);

        if (error) {
            console.error('Error loading conversion logs:', error);
            return;
        }

        setConversionLogs(data || []);
    };

    const getStatusBadge = (status: string) => {
        const statusConfig: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
            sent: { label: 'Enviado', className: 'bg-green-100 text-green-700', icon: <CheckCircle className="w-3 h-3" /> },
            delivered: { label: 'Entregado', className: 'bg-green-100 text-green-700', icon: <CheckCircle className="w-3 h-3" /> },
            failed: { label: 'Fallido', className: 'bg-red-100 text-red-700', icon: <XCircle className="w-3 h-3" /> },
            pending: { label: 'Pendiente', className: 'bg-yellow-100 text-yellow-700', icon: <Clock className="w-3 h-3" /> },
            success: { label: 'Exitoso', className: 'bg-green-100 text-green-700', icon: <CheckCircle className="w-3 h-3" /> },
            error: { label: 'Error', className: 'bg-red-100 text-red-700', icon: <XCircle className="w-3 h-3" /> },
            completed: { label: 'Completado', className: 'bg-blue-100 text-blue-700', icon: <CheckCircle className="w-3 h-3" /> },
        };

        const config = statusConfig[status?.toLowerCase()] || {
            label: status,
            className: 'bg-gray-100 text-gray-700',
            icon: <AlertCircle className="w-3 h-3" />
        };

        return (
            <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium ${config.className}`}>
                {config.icon}
                {config.label}
            </span>
        );
    };

    const filteredEmailLogs = emailLogs.filter(log => {
        if (emailFilter !== 'all' && log.status !== emailFilter) return false;
        if (emailSearch && !log.recipient_email.toLowerCase().includes(emailSearch.toLowerCase())) return false;
        return true;
    });

    const filteredSyncLogs = syncLogs.filter(log => {
        if (syncFilter !== 'all' && log.status !== syncFilter) return false;
        return true;
    });

    const filteredConversionLogs = conversionLogs.filter(log => {
        if (conversionFilter !== 'all' && log.event_type !== conversionFilter) return false;
        return true;
    });

    if (loading && !refreshing) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="text-center">
                    <RefreshCw className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
                    <p className="text-gray-600">Cargando logs...</p>
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
                            <h1 className="text-2xl font-bold text-gray-900">Logs y Monitoreo</h1>
                            <p className="text-sm text-gray-500 mt-1">
                                Sistema de seguimiento de eventos y sincronizaciones
                            </p>
                        </div>
                        <button
                            onClick={() => loadData(true)}
                            disabled={refreshing}
                            className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 disabled:opacity-50"
                            title="Actualizar datos"
                        >
                            <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                {/* Tab Navigation */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
                    <div className="flex border-b border-gray-200 overflow-x-auto">
                        <button
                            onClick={() => setActiveTab('emails')}
                            className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors whitespace-nowrap ${
                                activeTab === 'emails'
                                    ? 'border-b-2 border-blue-600 text-blue-600'
                                    : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            <Mail className="w-4 h-4" />
                            Historial de Emails
                        </button>
                        <button
                            onClick={() => setActiveTab('sync')}
                            className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors whitespace-nowrap ${
                                activeTab === 'sync'
                                    ? 'border-b-2 border-blue-600 text-blue-600'
                                    : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            <Database className="w-4 h-4" />
                            Sincronizaciones R2/Airtable
                        </button>
                        <button
                            onClick={() => setActiveTab('conversions')}
                            className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors whitespace-nowrap ${
                                activeTab === 'conversions'
                                    ? 'border-b-2 border-blue-600 text-blue-600'
                                    : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            <TrendingUp className="w-4 h-4" />
                            Conversiones y Eventos
                        </button>
                        <button
                            onClick={() => setActiveTab('events')}
                            className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors whitespace-nowrap ${
                                activeTab === 'events'
                                    ? 'border-b-2 border-blue-600 text-blue-600'
                                    : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            <Activity className="w-4 h-4" />
                            Eventos del Sistema
                        </button>
                    </div>

                    {/* Tab Content */}
                    <div className="p-6">
                        {/* Email Logs Tab */}
                        {activeTab === 'emails' && (
                            <div>
                                {/* Filters */}
                                <div className="flex gap-4 mb-6">
                                    <div className="flex-1">
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                            <input
                                                type="text"
                                                placeholder="Buscar por email..."
                                                value={emailSearch}
                                                onChange={(e) => setEmailSearch(e.target.value)}
                                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                        </div>
                                    </div>
                                    <select
                                        value={emailFilter}
                                        onChange={(e) => setEmailFilter(e.target.value)}
                                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    >
                                        <option value="all">Todos los estados</option>
                                        <option value="sent">Enviados</option>
                                        <option value="delivered">Entregados</option>
                                        <option value="failed">Fallidos</option>
                                        <option value="pending">Pendientes</option>
                                    </select>
                                </div>

                                {/* Email Logs List */}
                                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                                    {filteredEmailLogs.length === 0 ? (
                                        <div className="text-center py-12 text-gray-500">
                                            <Mail className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                                            <p>No hay logs de emails disponibles</p>
                                        </div>
                                    ) : (
                                        filteredEmailLogs.map((log) => (
                                            <div
                                                key={log.id}
                                                className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                                            >
                                                <div className="p-2 bg-blue-100 rounded-lg">
                                                    <Mail className="w-5 h-5 text-blue-600" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <p className="font-medium text-gray-900 truncate">
                                                            {log.recipient_email}
                                                        </p>
                                                        {getStatusBadge(log.status)}
                                                    </div>
                                                    <p className="text-sm text-gray-600 mb-1">
                                                        {log.subject || log.template_type || 'Sin asunto'}
                                                    </p>
                                                    <div className="flex items-center gap-4 text-xs text-gray-500">
                                                        <span className="flex items-center gap-1">
                                                            <Calendar className="w-3 h-3" />
                                                            {new Date(log.created_at).toLocaleString('es-MX')}
                                                        </span>
                                                    </div>
                                                    {log.error_message && (
                                                        <p className="text-xs text-red-600 mt-2">
                                                            Error: {log.error_message}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Sync Logs Tab */}
                        {activeTab === 'sync' && (
                            <div>
                                {/* Filters */}
                                <div className="flex gap-4 mb-6">
                                    <select
                                        value={syncFilter}
                                        onChange={(e) => setSyncFilter(e.target.value)}
                                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    >
                                        <option value="all">Todos los estados</option>
                                        <option value="completed">Completados</option>
                                        <option value="error">Con errores</option>
                                        <option value="pending">Pendientes</option>
                                    </select>
                                </div>

                                {/* Sync Logs List */}
                                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                                    {filteredSyncLogs.length === 0 ? (
                                        <div className="text-center py-12 text-gray-500">
                                            <Database className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                                            <p>No hay logs de sincronización disponibles</p>
                                        </div>
                                    ) : (
                                        filteredSyncLogs.map((log) => (
                                            <div
                                                key={log.id}
                                                className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                                            >
                                                <div className="flex items-start justify-between mb-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2 bg-purple-100 rounded-lg">
                                                            <Database className="w-5 h-5 text-purple-600" />
                                                        </div>
                                                        <div>
                                                            <p className="font-medium text-gray-900">
                                                                {log.sync_type || 'Sincronización'}
                                                            </p>
                                                            <p className="text-xs text-gray-500">
                                                                {new Date(log.started_at).toLocaleString('es-MX')}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    {getStatusBadge(log.status)}
                                                </div>
                                                <div className="grid grid-cols-4 gap-4 text-sm">
                                                    <div>
                                                        <p className="text-gray-500 text-xs">Procesados</p>
                                                        <p className="font-semibold text-gray-900">{log.records_processed || 0}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-gray-500 text-xs">Agregados</p>
                                                        <p className="font-semibold text-green-600">{log.records_added || 0}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-gray-500 text-xs">Actualizados</p>
                                                        <p className="font-semibold text-blue-600">{log.records_updated || 0}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-gray-500 text-xs">Fallidos</p>
                                                        <p className="font-semibold text-red-600">{log.records_failed || 0}</p>
                                                    </div>
                                                </div>
                                                {log.error_message && (
                                                    <p className="text-xs text-red-600 mt-3 p-2 bg-red-50 rounded">
                                                        Error: {log.error_message}
                                                    </p>
                                                )}
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Conversion & Events Logs Tab */}
                        {(activeTab === 'conversions' || activeTab === 'events') && (
                            <div>
                                {/* Filters */}
                                <div className="flex gap-4 mb-6">
                                    <select
                                        value={conversionFilter}
                                        onChange={(e) => setConversionFilter(e.target.value)}
                                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    >
                                        <option value="all">Todos los eventos</option>
                                        <option value="PageView">Vistas de página</option>
                                        <option value="Lead">Leads</option>
                                        <option value="CompleteRegistration">Registros</option>
                                        <option value="SubmitApplication">Solicitudes</option>
                                    </select>
                                </div>

                                {/* Conversion Logs List */}
                                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                                    {filteredConversionLogs.length === 0 ? (
                                        <div className="text-center py-12 text-gray-500">
                                            <Activity className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                                            <p>No hay logs de conversión disponibles</p>
                                        </div>
                                    ) : (
                                        filteredConversionLogs.map((log) => (
                                            <div
                                                key={log.id}
                                                className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                                            >
                                                <div className="p-2 bg-green-100 rounded-lg">
                                                    <TrendingUp className="w-5 h-5 text-green-600" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <p className="font-medium text-gray-900">
                                                            {log.event_name || log.event_type}
                                                        </p>
                                                        <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full font-medium">
                                                            {log.event_type}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-4 text-xs text-gray-500 mb-2">
                                                        <span className="flex items-center gap-1">
                                                            <Calendar className="w-3 h-3" />
                                                            {new Date(log.created_at).toLocaleString('es-MX')}
                                                        </span>
                                                        {log.source && (
                                                            <span>Fuente: {log.source}</span>
                                                        )}
                                                    </div>
                                                    {log.metadata && Object.keys(log.metadata).length > 0 && (
                                                        <details className="mt-2">
                                                            <summary className="text-xs text-blue-600 cursor-pointer hover:underline">
                                                                Ver metadata
                                                            </summary>
                                                            <pre className="text-xs bg-white p-2 rounded mt-2 overflow-x-auto">
                                                                {JSON.stringify(log.metadata, null, 2)}
                                                            </pre>
                                                        </details>
                                                    )}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
