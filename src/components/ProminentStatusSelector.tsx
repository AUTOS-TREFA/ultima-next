import React, { useState } from 'react';
import { ApplicationService } from '../services/ApplicationService';
import { Loader2, AlertCircle, CheckCircle2, FileWarning, Eye, ThumbsUp, ThumbsDown } from 'lucide-react';
import { toast } from 'sonner';
import { getStatusLabel, getStatusColor } from '../utils/crmHelpers';

interface ProminentStatusSelectorProps {
    applicationId: string;
    currentStatus: string;
    onStatusChanged?: () => void;
    showReminder?: boolean;
}

const ProminentStatusSelector: React.FC<ProminentStatusSelectorProps> = ({
    applicationId,
    currentStatus,
    onStatusChanged,
    showReminder = true
}) => {
    const [isUpdating, setIsUpdating] = useState(false);
    const [selectedStatus, setSelectedStatus] = useState(currentStatus);

    // Workflow statuses only (approval/rejection handled separately)
    // Using Spanish status values to match database schema
    const statusOptions = [
        {
            value: 'Borrador',
            label: 'Borrador',
            icon: FileWarning,
            description: 'La solicitud está en borrador',
            color: 'gray'
        },
        {
            value: 'Faltan Documentos',
            label: 'Faltan Documentos',
            icon: AlertCircle,
            description: 'Solicita los documentos faltantes al cliente',
            color: 'amber'
        },
        {
            value: 'Completa',
            label: 'Completa',
            icon: CheckCircle2,
            description: 'Todos los documentos están presentes',
            color: 'blue'
        },
        {
            value: 'En Revisión',
            label: 'En Revisión',
            icon: Eye,
            description: 'La solicitud está siendo revisada',
            color: 'purple'
        }
    ];

    const handleStatusChange = async (newStatus: string) => {
        if (newStatus === selectedStatus) return;

        setIsUpdating(true);
        setSelectedStatus(newStatus);

        try {
            await ApplicationService.updateApplicationStatus(applicationId, newStatus);

            // Show feedback based on status (using Spanish status values)
            const feedbackMessages: Record<string, { title: string; description: string; type: 'success' | 'warning' | 'info' | 'error' }> = {
                'Completa': {
                    title: '✅ Solicitud marcada como Completa',
                    description: 'Asegúrate de que todos los documentos estén presentes.',
                    type: 'success'
                },
                'Faltan Documentos': {
                    title: '⚠️ Faltan Documentos',
                    description: 'Contacta al cliente para solicitar los documentos faltantes.',
                    type: 'warning'
                },
                'En Revisión': {
                    title: '📋 En Revisión',
                    description: 'La solicitud está siendo revisada.',
                    type: 'info'
                },
                'Aprobada': {
                    title: '🎉 Solicitud Aprobada',
                    description: 'Contacta al cliente para informarle de la aprobación.',
                    type: 'success'
                },
                'Rechazada': {
                    title: '❌ Solicitud Rechazada',
                    description: 'Contacta al cliente para explicar la situación.',
                    type: 'error'
                },
                // Keep English values for backward compatibility
                'submitted': {
                    title: '✅ Solicitud marcada como Completa',
                    description: 'Asegúrate de que todos los documentos estén presentes.',
                    type: 'success'
                },
                'pending_docs': {
                    title: '⚠️ Faltan Documentos',
                    description: 'Contacta al cliente para solicitar los documentos faltantes.',
                    type: 'warning'
                },
                'reviewing': {
                    title: '📋 En Revisión',
                    description: 'La solicitud está siendo revisada.',
                    type: 'info'
                },
                'approved': {
                    title: '🎉 Solicitud Aprobada',
                    description: 'Contacta al cliente para informarle de la aprobación.',
                    type: 'success'
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
                    duration: newStatus === 'pending_docs' ? 6000 : 4000
                });
            } else {
                toast.success(`Estado actualizado a: ${getStatusLabel(newStatus)}`);
            }

            if (onStatusChanged) {
                onStatusChanged();
            }
        } catch (err: any) {
            console.error('Error updating application status:', err);
            toast.error(`Error al actualizar el estado: ${err.message}`);
            setSelectedStatus(currentStatus); // Revert
        } finally {
            setIsUpdating(false);
        }
    };

    const currentOption = statusOptions.find(opt => opt.value === selectedStatus);
    const statusColorClasses = getStatusColor(selectedStatus);

    return (
        <div>
            {isUpdating && (
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Actualizando...</span>
                </div>
            )}

            {/* Status Change Reminder */}
            {showReminder && selectedStatus !== 'Aprobada' && selectedStatus !== 'Rechazada' && selectedStatus !== 'approved' && selectedStatus !== 'rejected' && (
                <div className="mb-6 p-4 bg-gradient-to-r from-yellow-50 to-amber-50 border-2 border-yellow-200 rounded-lg">
                    <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="text-sm font-semibold text-yellow-900">Recordatorio</p>
                            <p className="text-xs text-yellow-800 mt-1">
                                Actualiza el estado de esta solicitud según los documentos y el progreso del cliente.
                                Esto ayudará a mantener el seguimiento organizado.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Status Options Grid */}
            <div className="grid grid-cols-2 gap-3">
                {statusOptions.map(option => {
                    const isSelected = option.value === selectedStatus;
                    const Icon = option.icon;
                    const colorClasses = getStatusColor(option.value);

                    return (
                        <button
                            key={option.value}
                            onClick={() => handleStatusChange(option.value)}
                            disabled={isUpdating}
                            className={`
                                p-4 rounded-lg border-2 transition-all transform
                                ${isSelected
                                    ? `${colorClasses.bg} ${colorClasses.border} ${colorClasses.text} scale-105 shadow-md`
                                    : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300 hover:shadow-sm'
                                }
                                ${isUpdating ? 'opacity-50 cursor-not-allowed' : 'hover:scale-102 cursor-pointer'}
                                disabled:opacity-50 disabled:cursor-not-allowed
                            `}
                        >
                            <div className="flex flex-col items-center gap-2">
                                <Icon className={`w-6 h-6 ${isSelected ? '' : 'text-gray-500'}`} />
                                <span className={`text-xs font-bold text-center ${isSelected ? '' : 'text-gray-700'}`}>
                                    {option.label}
                                </span>
                                {isSelected && (
                                    <div className="flex items-center gap-1 mt-1">
                                        <div className={`w-2 h-2 rounded-full ${colorClasses.dot} animate-pulse`}></div>
                                        <span className="text-[10px] font-medium opacity-80">Actual</span>
                                    </div>
                                )}
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default ProminentStatusSelector;
