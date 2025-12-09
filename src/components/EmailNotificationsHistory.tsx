'use client';

import React, { useState, useEffect } from 'react';
import { Mail, CheckCircle, XCircle, Clock } from 'lucide-react';
import { BrevoEmailService } from '../services/BrevoEmailService';

interface EmailNotificationsHistoryProps {
    userId?: string;
    recipientEmail?: string;
}

const EmailNotificationsHistory: React.FC<EmailNotificationsHistoryProps> = ({ userId, recipientEmail }) => {
    const [emails, setEmails] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchEmails = async () => {
            try {
                // Use the secure BrevoEmailService which fetches from Supabase
                // This avoids exposing API keys to the client
                const emailHistory = await BrevoEmailService.getRecentEmailHistory(50);

                // Filter by recipient email if provided
                const filteredEmails = recipientEmail
                    ? emailHistory.filter((email: any) => email.recipient_email === recipientEmail)
                    : emailHistory;

                setEmails(filteredEmails);
            } catch (error) {
                console.error('Error fetching email notifications:', error);
                setEmails([]);
            } finally {
                setLoading(false);
            }
        };

        fetchEmails();
    }, [userId, recipientEmail]);

    const getStatusIcon = (status: string) => {
        if (status === 'sent' || status === 'delivered') {
            return <CheckCircle className="w-4 h-4 text-green-600" />;
        } else if (status === 'failed' || status === 'bounced') {
            return <XCircle className="w-4 h-4 text-red-600" />;
        }
        return <Clock className="w-4 h-4 text-gray-600" />;
    };

    const getStatusLabel = (status: string) => {
        const labels: { [key: string]: string } = {
            'sent': 'Enviado',
            'delivered': 'Entregado',
            'failed': 'Fallido',
            'bounced': 'Rebotado',
            'pending': 'Pendiente'
        };
        return labels[status] || status;
    };

    if (loading) {
        return (
            <div className="bg-white p-6 rounded-xl shadow-sm border">
                <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <Mail className="w-5 h-5" />
                    Historial de Notificaciones
                </h2>
                <p className="text-sm text-gray-500 text-center py-4">Cargando...</p>
            </div>
        );
    }

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Mail className="w-5 h-5" />
                Historial de Notificaciones ({emails.length})
            </h2>
            <div className="space-y-3 max-h-60 overflow-y-auto">
                {emails.length > 0 ? emails.map((email, index) => (
                    <div key={email.id || index} className="p-3 bg-gray-50 rounded-lg border">
                        <div className="flex items-start gap-3">
                            {getStatusIcon(email.status || 'sent')}
                            <div className="flex-grow">
                                <div className="flex justify-between items-start">
                                    <p className="text-sm font-semibold text-gray-800">{email.subject || 'Sin asunto'}</p>
                                    <span className="text-xs text-gray-500">
                                        {email.created_at ? new Date(email.created_at).toLocaleDateString('es-MX') : ''}
                                    </span>
                                </div>
                                <p className="text-xs text-gray-600 mt-1">{getStatusLabel(email.status || 'sent')}</p>
                                {email.recipient_email && (
                                    <p className="text-xs text-gray-400 mt-0.5">{email.recipient_email}</p>
                                )}
                            </div>
                        </div>
                    </div>
                )) : <p className="text-sm text-gray-500 text-center py-4">No se han enviado notificaciones.</p>}
            </div>
        </div>
    );
};

export default EmailNotificationsHistory;
