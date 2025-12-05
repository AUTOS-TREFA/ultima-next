import React, { useState } from 'react';
import { ApplicationService } from '../services/ApplicationService';
import { Loader2, ThumbsUp, ThumbsDown, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

interface ApplicationDecisionProps {
    applicationId: string;
    currentStatus: string;
    onStatusChanged?: () => void;
}

const ApplicationDecision: React.FC<ApplicationDecisionProps> = ({
    applicationId,
    currentStatus,
    onStatusChanged
}) => {
    const [isUpdating, setIsUpdating] = useState(false);
    const [selectedDecision, setSelectedDecision] = useState(currentStatus);

    const handleDecision = async (decision: 'approved' | 'rejected') => {
        if (decision === selectedDecision) return;

        const confirmMessage = decision === 'approved'
            ? '¿Estás seguro de APROBAR esta solicitud? Esta acción notificará al cliente.'
            : '¿Estás seguro de RECHAZAR esta solicitud? Esta acción notificará al cliente.';

        if (!window.confirm(confirmMessage)) {
            return;
        }

        setIsUpdating(true);
        setSelectedDecision(decision);

        try {
            await ApplicationService.updateApplicationStatus(applicationId, decision);

            const feedbackMessages = {
                'approved': {
                    title: '🎉 Solicitud Aprobada',
                    description: 'Contacta al cliente para informarle de la aprobación.',
                    type: 'success' as const
                },
                'rejected': {
                    title: '❌ Solicitud Rechazada',
                    description: 'Contacta al cliente para explicar la situación.',
                    type: 'error' as const
                }
            };

            const feedback = feedbackMessages[decision];
            toast[feedback.type](feedback.title, {
                description: feedback.description,
                duration: 5000
            });

            if (onStatusChanged) {
                onStatusChanged();
            }
        } catch (err: any) {
            console.error('Error updating application decision:', err);
            toast.error(`Error al actualizar la decisión: ${err.message}`);
            setSelectedDecision(currentStatus); // Revert
        } finally {
            setIsUpdating(false);
        }
    };

    const isApproved = selectedDecision === 'approved';
    const isRejected = selectedDecision === 'rejected';
    const hasDecision = isApproved || isRejected;

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Decisión Final</h2>

            {isUpdating && (
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Actualizando decisión...</span>
                </div>
            )}

            {/* Current Decision Display */}
            {hasDecision && (
                <div className={`p-4 rounded-lg mb-4 border-2 ${
                    isApproved
                        ? 'bg-green-50 border-green-300'
                        : 'bg-red-50 border-red-300'
                }`}>
                    <div className="flex items-center gap-3">
                        {isApproved ? (
                            <CheckCircle className="w-6 h-6 text-green-600" />
                        ) : (
                            <ThumbsDown className="w-6 h-6 text-red-600" />
                        )}
                        <div>
                            <h3 className={`text-base font-bold ${
                                isApproved ? 'text-green-900' : 'text-red-900'
                            }`}>
                                {isApproved ? 'Solicitud Aprobada' : 'Solicitud Rechazada'}
                            </h3>
                            <p className={`text-xs ${
                                isApproved ? 'text-green-700' : 'text-red-700'
                            }`}>
                                {isApproved
                                    ? 'El cliente ha sido notificado de la aprobación'
                                    : 'El cliente ha sido notificado del rechazo'}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Decision Buttons */}
            <div className="grid grid-cols-2 gap-3">
                <button
                    onClick={() => handleDecision('approved')}
                    disabled={isUpdating}
                    className={`
                        flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-all transform
                        ${isApproved
                            ? 'bg-green-100 border-green-400 text-green-900 scale-105 shadow-md'
                            : 'bg-white border-gray-200 text-gray-700 hover:border-green-300 hover:bg-green-50'
                        }
                        ${isUpdating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-102'}
                        disabled:opacity-50 disabled:cursor-not-allowed
                    `}
                >
                    <ThumbsUp className={`w-4 h-4 ${isApproved ? 'text-green-600' : 'text-gray-500'}`} />
                    <span className="text-sm font-bold">Solicitud Aprobada</span>
                    {isApproved && (
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                    )}
                </button>

                <button
                    onClick={() => handleDecision('rejected')}
                    disabled={isUpdating}
                    className={`
                        flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-all transform
                        ${isRejected
                            ? 'bg-red-100 border-red-400 text-red-900 scale-105 shadow-md'
                            : 'bg-white border-gray-200 text-gray-700 hover:border-red-300 hover:bg-red-50'
                        }
                        ${isUpdating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-102'}
                        disabled:opacity-50 disabled:cursor-not-allowed
                    `}
                >
                    <ThumbsDown className={`w-4 h-4 ${isRejected ? 'text-red-600' : 'text-gray-500'}`} />
                    <span className="text-sm font-bold">Solicitud Rechazada</span>
                    {isRejected && (
                        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                    )}
                </button>
            </div>

            {/* Helper Text */}
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-xs text-blue-900">
                    <strong>Importante:</strong> Esta decisión es final y notificará automáticamente al cliente. Asegúrate de haber revisado completamente la solicitud antes de tomar una decisión.
                </p>
            </div>
        </div>
    );
};

export default ApplicationDecision;
