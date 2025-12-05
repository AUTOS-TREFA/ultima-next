import React, { useState, useEffect } from 'react';
import { Mail, Loader2, RefreshCw, CheckCircle2, XCircle, Clock, AlertCircle } from 'lucide-react';
import { supabase } from '../../supabaseClient';
import { toast } from 'sonner';

interface EmailLog {
    id: string;
    recipient: string;
    subject: string;
    status: 'sent' | 'delivered' | 'failed' | 'bounced';
    created_at: string;
    error_message?: string;
    metadata?: any;
}

interface EmailLogsComponentProps {
    userId: string;
    limit?: number;
}

const EmailLogsComponent: React.FC<EmailLogsComponentProps> = ({ userId, limit = 10 }) => {
    const [emailLogs, setEmailLogs] = useState<EmailLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchEmailLogs = async () => {
        try {
            setIsLoading(true);
            setError(null);

            // Fetch email logs for this user
            const { data, error: fetchError } = await supabase
                .from('email_logs')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .limit(limit);

            if (fetchError) throw fetchError;

            setEmailLogs(data || []);
        } catch (err: any) {
            console.error('Error fetching email logs:', err);
            setError('No se pudieron cargar los registros de email');
            toast.error('Error al cargar los logs de email');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchEmailLogs();
    }, [userId, limit]);

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'sent':
                return <Mail className="w-4 h-4 text-blue-600" />;
            case 'delivered':
                return <CheckCircle2 className="w-4 h-4 text-green-600" />;
            case 'failed':
                return <XCircle className="w-4 h-4 text-red-600" />;
            case 'bounced':
                return <AlertCircle className="w-4 h-4 text-yellow-600" />;
            default:
                return <Clock className="w-4 h-4 text-gray-400" />;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'sent':
                return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'delivered':
                return 'bg-green-100 text-green-800 border-green-200';
            case 'failed':
                return 'bg-red-100 text-red-800 border-red-200';
            case 'bounced':
                return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            default:
                return 'bg-gray-100 text-gray-600 border-gray-200';
        }
    };

    const getStatusLabel = (status: string) => {
        const labels: Record<string, string> = {
            'sent': 'Enviado',
            'delivered': 'Entregado',
            'failed': 'Fallido',
            'bounced': 'Rebotado'
        };
        return labels[status] || status;
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-MX', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (isLoading) {
        return (
            <div className="bg-white p-6 rounded-xl shadow-sm border">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                        <Mail className="w-5 h-5" />
                        Historial de Emails
                    </h2>
                </div>
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <Mail className="w-5 h-5" />
                    Historial de Emails
                </h2>
                <button
                    onClick={fetchEmailLogs}
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Refrescar"
                >
                    <RefreshCw className="w-4 h-4" />
                </button>
            </div>

            {error && (
                <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200">
                    {error}
                </div>
            )}

            {emailLogs.length === 0 ? (
                <div className="text-center py-8">
                    <Mail className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-sm text-gray-500">No se han enviado emails a este usuario</p>
                </div>
            ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                    {emailLogs.map((log) => (
                        <div
                            key={log.id}
                            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex items-start gap-3 flex-grow">
                                    <div className="mt-0.5">
                                        {getStatusIcon(log.status)}
                                    </div>
                                    <div className="flex-grow min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <p className="text-sm font-semibold text-gray-900 truncate">
                                                {log.subject}
                                            </p>
                                            <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${getStatusColor(log.status)}`}>
                                                {getStatusLabel(log.status)}
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-600 mb-1">
                                            Para: {log.recipient}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {formatDate(log.created_at)}
                                        </p>
                                        {log.error_message && (
                                            <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                                                <strong>Error:</strong> {log.error_message}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {emailLogs.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-xs text-gray-500 text-center">
                        Mostrando los últimos {emailLogs.length} emails enviados
                    </p>
                </div>
            )}
        </div>
    );
};

export default EmailLogsComponent;
