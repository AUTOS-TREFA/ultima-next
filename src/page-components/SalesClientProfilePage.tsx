'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import { SalesService } from '../services/SalesService';
import { AdminService } from '../services/AdminService';
import { KommoService } from '../services/KommoService';
import type { Profile } from '../types/types';
import { Loader2, AlertTriangle, User, FileText, CheckCircle, Clock, Tag, Save, X, ArrowLeft, Plus, Trash2, Lock } from 'lucide-react';
import PrintableApplication from '../components/PrintableApplication';
import { ApplicationService } from '../services/ApplicationService';
import { toast } from 'sonner';

const ProfileDataItem: React.FC<{ label: string, value: any }> = ({ label, value }) => (
    <div>
        <p className="text-xs text-gray-500 uppercase tracking-wider">{label}</p>
        <p className="text-sm font-semibold text-gray-800">{value || 'N/A'}</p>
    </div>
);

const TagsManager: React.FC<{ leadId: string; initialTags: any[]; salesUserId: string }> = ({ leadId, initialTags, salesUserId }) => {
    const [assignedTags, setAssignedTags] = useState(initialTags);
    const [availableTags, setAvailableTags] = useState<any[]>([]);
    const [isEditing, setIsEditing] = useState(false);
    const [selectedTagIds, setSelectedTagIds] = useState<string[]>(() => initialTags.map(t => t.id));
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        SalesService.getAvailableTags().then(setAvailableTags).catch(err => {
            console.error('Error loading tags:', err);
            setError('Error al cargar las etiquetas disponibles.');
        });
    }, []);

    const handleSave = async () => {
        setError(null);
        try {
            await SalesService.updateLeadTags(leadId, selectedTagIds, salesUserId);
            const updatedAssignedTags = availableTags.filter(t => selectedTagIds.includes(t.id));
            setAssignedTags(updatedAssignedTags);
            setIsEditing(false);
        } catch (err: any) {
            setError(err.message || 'Error al guardar las etiquetas.');
        }
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2"><Tag className="w-5 h-5"/>Etiquetas</h2>
                <button onClick={() => setIsEditing(!isEditing)} className="text-sm font-semibold text-primary-600 hover:text-primary-800">
                    {isEditing ? 'Cancelar' : 'Editar'}
                </button>
            </div>
            {error && (
                <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg">
                    {error}
                </div>
            )}
            {isEditing ? (
                <div className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                        {availableTags.map(tag => {
                            const isSelected = selectedTagIds.includes(tag.id);
                            return (
                                <button key={tag.id} onClick={() => {
                                    setSelectedTagIds(prev => isSelected ? prev.filter(id => id !== tag.id) : [...prev, tag.id]);
                                }} className={`px-2 py-1 text-xs font-medium rounded-full border-2 ${isSelected ? 'border-transparent' : 'border-gray-300'}`} style={{ backgroundColor: isSelected ? tag.color : '#fff', color: isSelected ? '#fff' : '#000' }}>
                                    {tag.tag_name}
                                </button>
                            );
                        })}
                    </div>
                    <button onClick={handleSave} className="w-full flex items-center justify-center gap-2 py-2 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700">
                        <Save className="w-4 h-4" /> Guardar Cambios
                    </button>
                </div>
            ) : (
                <div className="flex flex-wrap gap-2">
                    {assignedTags.length > 0 ? assignedTags.map(tag => (
                        <span key={tag.id} className="px-2 py-1 text-xs font-medium rounded-full text-white" style={{ backgroundColor: tag.color }}>
                            {tag.tag_name}
                        </span>
                    )) : <p className="text-sm text-gray-500">Sin etiquetas.</p>}
                </div>
            )}
        </div>
    );
};

const RemindersManager: React.FC<{ leadId: string; initialReminders: any[]; salesUserId: string }> = ({ leadId, initialReminders, salesUserId }) => {
    const [reminders, setReminders] = useState(initialReminders);
    const [isAdding, setIsAdding] = useState(false);
    const [newReminderText, setNewReminderText] = useState('');
    const [newReminderDate, setNewReminderDate] = useState('');
    const [error, setError] = useState<string | null>(null);

    const handleAdd = async () => {
        if (!newReminderText || !newReminderDate) return;
        setError(null);
        try {
            await SalesService.createReminder({
                lead_id: leadId,
                agent_id: salesUserId,
                reminder_text: newReminderText,
                reminder_date: newReminderDate
            }, salesUserId);

            // Reload reminders
            const updatedProfile = await SalesService.getClientProfile(leadId, salesUserId);
            setReminders(updatedProfile?.reminders || []);
            setIsAdding(false);
            setNewReminderText('');
            setNewReminderDate('');
        } catch (err: any) {
            setError(err.message || 'Error al crear el recordatorio.');
        }
    };

    const handleToggleComplete = async (reminder: any) => {
        try {
            await SalesService.updateReminder(reminder.id, { is_completed: !reminder.is_completed });
            setReminders(reminders.map(r => r.id === reminder.id ? { ...r, is_completed: !r.is_completed } : r));
        } catch (err: any) {
            setError(err.message || 'Error al actualizar el recordatorio.');
        }
    };

    const handleDelete = async (reminderId: string) => {
        if (window.confirm('¿Seguro que quieres eliminar este recordatorio?')) {
            try {
                await SalesService.deleteReminder(reminderId);
                setReminders(reminders.filter(r => r.id !== reminderId));
            } catch (err: any) {
                setError(err.message || 'Error al eliminar el recordatorio.');
            }
        }
    };

    return (
         <div className="bg-white p-6 rounded-xl shadow-sm border">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2"><Clock className="w-5 h-5"/>Recordatorios</h2>
                <button onClick={() => setIsAdding(!isAdding)} className="text-sm font-semibold text-primary-600 hover:text-primary-800">
                    {isAdding ? <X className="w-5 h-5"/> : <Plus className="w-5 h-5"/>}
                </button>
            </div>
            {error && (
                <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg">
                    {error}
                </div>
            )}
            {isAdding && (
                <div className="space-y-3 p-3 bg-gray-50 rounded-lg border mb-4">
                    <input type="text" value={newReminderText} onChange={e => setNewReminderText(e.target.value)} placeholder="Texto del recordatorio..." className="w-full text-sm p-2 border rounded"/>
                    <input type="datetime-local" value={newReminderDate} onChange={e => setNewReminderDate(e.target.value)} className="w-full text-sm p-2 border rounded"/>
                    <button onClick={handleAdd} className="w-full text-sm p-2 bg-primary-600 text-white rounded">Guardar</button>
                </div>
            )}
            <div className="space-y-3 max-h-60 overflow-y-auto">
                {reminders.length > 0 ? reminders.map(r => (
                     <div key={r.id} className={`p-3 rounded-lg flex items-center gap-3 ${r.is_completed ? 'bg-green-50' : 'bg-yellow-50'}`}>
                        <button onClick={() => handleToggleComplete(r)}>
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${r.is_completed ? 'bg-green-500 border-green-500' : 'border-gray-400'}`}>
                                {r.is_completed && <CheckCircle className="w-4 h-4 text-white"/>}
                            </div>
                        </button>
                        <div className="flex-grow">
                            <p className={`text-sm ${r.is_completed ? 'line-through text-gray-500' : 'text-gray-800'}`}>{r.reminder_text}</p>
                            <p className="text-xs text-gray-500">{new Date(r.reminder_date).toLocaleString()}</p>
                        </div>
                        <button onClick={() => handleDelete(r.id)} className="text-gray-400 hover:text-red-600"><Trash2 className="w-4 h-4"/></button>
                    </div>
                )) : <p className="text-sm text-gray-500 text-center py-4">No hay recordatorios.</p>}
            </div>
        </div>
    )
};

const ApplicationManager: React.FC<{ applications: any[], onStatusChange: (appId: string, status: string) => void }> = ({ applications, onStatusChange }) => {
    const [viewingApp, setViewingApp] = useState<any | null>(null);

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Historial de Aplicaciones ({applications.length})</h2>
            <div className="space-y-4">
                {applications.length > 0 ? applications.map(app => (
                    <div key={app.id} className="p-4 border rounded-lg flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                        <div>
                            <p className="font-semibold text-gray-800">{app.car_info?._vehicleTitle || 'Solicitud General'}</p>
                            <p className="text-xs text-gray-500">Enviada: {new Date(app.created_at).toLocaleDateString()}</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <select
                                value={app.status}
                                onChange={(e) => onStatusChange(app.id, e.target.value)}
                                className="text-xs font-semibold bg-gray-100 text-gray-700 px-2 py-1 rounded-full border-none focus:ring-2 focus:ring-primary-500"
                            >
                                <option value="draft">Borrador</option>
                                <option value="submitted">Enviada</option>
                                <option value="reviewing">En Revisión</option>
                                <option value="pending_docs">Docs Pendientes</option>
                                <option value="approved">Aprobada</option>
                                <option value="rejected">Rechazada</option>
                            </select>
                            <button onClick={() => setViewingApp(app)} className="p-2 text-gray-500 hover:bg-gray-100 rounded-md">
                                <FileText className="w-4 h-4"/>
                            </button>
                        </div>
                    </div>
                )) : <p className="text-sm text-gray-500 text-center py-8">Este usuario aún no ha enviado ninguna solicitud.</p>}
            </div>
            {viewingApp && (
                <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setViewingApp(null)}>
                    <div className="relative bg-white w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-xl flex flex-col" onClick={e => e.stopPropagation()}>
                        <div className="p-4 border-b flex justify-between items-center flex-shrink-0">
                            <h3 className="text-lg font-bold">Vista Previa de la Solicitud</h3>
                            <button onClick={() => setViewingApp(null)} className="p-2 rounded-full hover:bg-gray-100"><X className="w-5 h-5" /></button>
                        </div>
                        <div className="overflow-y-auto p-2">
                             <PrintableApplication application={viewingApp} />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const DocumentViewer: React.FC<{ documents: any[] }> = ({ documents }) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Documentos Cargados ({documents.length})</h2>
        <div className="space-y-3 max-h-96 overflow-y-auto">
            {documents.length > 0 ? documents.map(doc => (
                <a href={doc.url} target="_blank" rel="noopener noreferrer" key={doc.id} className="p-3 border rounded-lg flex items-center gap-3 hover:bg-gray-50">
                    <FileText className="w-5 h-5 text-primary-600"/>
                    <div>
                        <p className="text-sm font-semibold text-gray-800">{doc.file_name}</p>
                        <p className="text-xs text-gray-500">{doc.document_type} - {new Date(doc.created_at).toLocaleDateString()}</p>
                    </div>
                </a>
            )) : <p className="text-sm text-gray-500 text-center py-8">No hay documentos cargados.</p>}
        </div>
    </div>
);

const LeadSourceInfo: React.FC<{ metadata: any }> = ({ metadata }) => {
    if (!metadata || Object.keys(metadata).length === 0) {
        return null;
    }

    const utmParams = Object.entries(metadata).filter(([key]) => key.startsWith('utm_'));

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Fuente del Lead</h2>
            <div className="space-y-3">
                {metadata.rfdm && <ProfileDataItem label="Referencia (rfdm)" value={metadata.rfdm} />}
                {metadata.ordencompra && <ProfileDataItem label="Vehículo de Interés (ordencompra)" value={metadata.ordencompra} />}
                {utmParams.length > 0 && (
                    <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wider">Parámetros UTM</p>
                        {utmParams.map(([key, value]) => (
                            <p key={key} className="text-sm font-mono text-gray-700">{`${key}: ${value}`}</p>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

const KommoDataDisplay: React.FC<{ kommoData: any; lastSynced: string }> = ({ kommoData, lastSynced }) => {
    if (!kommoData) {
        return null;
    }

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleString('es-MX', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl shadow-sm border border-blue-200">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Datos de Kommo CRM
                </h2>
                <span className="text-xs text-gray-600">
                    {lastSynced && `Sincronizado: ${formatDate(lastSynced)}`}
                </span>
            </div>
            <div className="space-y-3 bg-white p-4 rounded-lg">
                <ProfileDataItem label="ID de Lead en Kommo" value={`#${kommoData.kommo_id}`} />
                <ProfileDataItem label="Pipeline" value={kommoData.pipeline_name} />
                <div className="flex items-center gap-2">
                    <div className="flex-1">
                        <ProfileDataItem label="Etapa" value={kommoData.status_name} />
                    </div>
                    {kommoData.price > 0 && (
                        <div className="flex-1">
                            <ProfileDataItem
                                label="Valor"
                                value={new Intl.NumberFormat('es-MX', {
                                    style: 'currency',
                                    currency: 'MXN'
                                }).format(kommoData.price)}
                            />
                        </div>
                    )}
                </div>
                {kommoData.tags && kommoData.tags.length > 0 && (
                    <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Etiquetas en Kommo</p>
                        <div className="flex flex-wrap gap-2">
                            {kommoData.tags.map((tag: string, idx: number) => (
                                <span key={idx} className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                                    {tag}
                                </span>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const SalesClientProfilePage: React.FC = () => {
    const params = useParams<{ id: string }>();
    const vehicleId = params?.id;
    const applicationIdFromUrl = params?.id;
    const id = params?.id;
    const { user } = useAuth();
    const [clientData, setClientData] = useState<{ profile: Profile; applications: any[]; tags: any[]; reminders: any[]; documents: any[] } | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isSyncing, setIsSyncing] = useState(false);
    const [syncMessage, setSyncMessage] = useState('');

    useEffect(() => {
        if (!id || !user?.id) {
            setError("ID del cliente o usuario no proporcionado.");
            setLoading(false);
            return;
        }
        const fetchData = async () => {
            setLoading(true);
            setError(null);
            try {
                const data = await SalesService.getClientProfile(id, user.id);
                if (!data || !data.profile) {
                    throw new Error(`No se encontró el cliente con ID: ${id}. Es posible que no tengas acceso autorizado a este perfil o que el cliente no exista.`);
                }
                setClientData(data);
            } catch (err: any) {
                console.error('Error fetching client profile:', err);
                setError(err.message || 'Error desconocido al cargar el perfil del cliente.');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id, user?.id]);

    const handleSyncToKommo = async () => {
        if (!clientData || !user?.id) return;
        setIsSyncing(true);
        setSyncMessage('');

        try {
            const result = await KommoService.syncLeadWithKommo(clientData.profile);

            if (result.success) {
                if (result.action === 'found') {
                    setSyncMessage(`✓ Lead encontrado en Kommo - ${result.kommoData?.pipeline_name} / ${result.kommoData?.status_name}`);
                } else if (result.action === 'created') {
                    setSyncMessage(`✓ Lead creado en Kommo exitosamente`);
                }

                // Save Kommo data to database
                if (result.kommoData) {
                    console.log('[Kommo Data]', result.kommoData);
                    await AdminService.saveKommoData(clientData.profile.id, result.kommoData);

                    // Reload profile data to show updated Kommo information
                    const updatedData = await SalesService.getClientProfile(id!, user.id);
                    if (updatedData) {
                        setClientData(updatedData);
                    }

                    toast.success('Datos de Kommo actualizados correctamente');
                }
            } else {
                setSyncMessage(`❌ Error: ${result.message}`);
                toast.error(result.message);
            }
        } catch (error: any) {
            console.error('[Kommo Sync Error]', error);
            setSyncMessage(`❌ Error al sincronizar con Kommo`);
            toast.error('Error al sincronizar con Kommo');
        }

        setIsSyncing(false);
        setTimeout(() => setSyncMessage(''), 8000);
    };

    const handleStatusChange = async (appId: string, status: string) => {
        if (!clientData) return;

        // Show confirmation dialog for "En Revisión" status
        if (status === 'reviewing') {
            const userConfirmed = window.confirm('¿Ya te envió o cargó a su cuenta los documentos?');
            if (!userConfirmed) {
                return; // Cancel the status change
            }
        }

        try {
            await ApplicationService.updateApplicationStatus(appId, status);

            // Update local state for instant feedback
            setClientData(prev => prev ? ({
                ...prev,
                applications: prev.applications.map(app => app.id === appId ? { ...app, status } : app),
            }) : null);

            // Show success toast
            const statusLabels: Record<string, string> = {
                'draft': 'Borrador',
                'submitted': 'Enviada',
                'reviewing': 'En Revisión',
                'pending_docs': 'Docs Pendientes',
                'approved': 'Aprobada',
                'rejected': 'Rechazada'
            };

            toast.success(`Estado actualizado a: ${statusLabels[status] || status}`);
        } catch(e: any) {
            console.error('Error updating status:', e);
            toast.error(`Error al actualizar el estado: ${e.message}`);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-full">
                <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
            </div>
        );
    }

    if (error || !clientData || !user) {
        return (
            <div className="max-w-2xl mx-auto mt-10">
                <div className="p-6 bg-red-50 border-2 border-red-200 text-red-800 rounded-xl">
                    <div className="flex items-start gap-3">
                        <AlertTriangle className="w-6 h-6 flex-shrink-0 mt-0.5" />
                        <div className="flex-grow">
                            <h2 className="text-lg font-bold mb-2">Error al Cargar Perfil</h2>
                            <p className="text-sm mb-4">{error || 'No se pudo cargar el perfil del cliente. Verifica que tengas acceso autorizado.'}</p>
                            <Link
                                href="/escritorio/ventas/leads"
                                className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                Volver a Mis Leads
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const { profile, applications, tags, reminders, documents } = clientData;

    return (
        <div className="space-y-8">
            <Link href="/escritorio/ventas/leads" className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 font-semibold">
                <ArrowLeft className="w-4 h-4" />
                Volver a Mis Leads
            </Link>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                {/* Left Column: Profile & Actions */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white p-6 rounded-xl shadow-sm border">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                                <User className="w-8 h-8" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-gray-900">{`${profile.first_name || ''} ${profile.last_name || ''}`}</h1>
                                <p className="text-sm text-gray-500">{profile.email}</p>
                                <p className="text-sm text-gray-500">{profile.phone}</p>
                            </div>
                        </div>
                        <div className="mt-6 grid grid-cols-2 gap-4">
                            <ProfileDataItem label="Fuente" value={profile.source} />
                            <ProfileDataItem label="RFC" value={profile.rfc} />
                            <ProfileDataItem label="Contactado" value={profile.contactado ? 'Sí' : 'No'} />
                            <ProfileDataItem label="Acceso Autorizado" value={profile.asesor_autorizado_acceso ? 'Sí' : 'No'} />
                        </div>
                        <div className="mt-6 border-t pt-4">
                            <button
                                onClick={handleSyncToKommo}
                                disabled={isSyncing || !profile.phone}
                                className="w-full flex items-center justify-center gap-2 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
                                title={!profile.phone ? 'Se requiere número de teléfono para sincronizar' : 'Sincronizar con Kommo CRM'}
                            >
                                {isSyncing ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Sincronizar a Kommo'}
                            </button>
                            {!profile.phone && !isSyncing && (
                                <p className="text-xs text-center mt-2 text-gray-500">⚠️ Requiere número de teléfono</p>
                            )}
                            {syncMessage && <p className="text-xs text-center mt-2 text-gray-700">{syncMessage}</p>}
                        </div>
                    </div>

                    <LeadSourceInfo metadata={profile.metadata} />
                    <KommoDataDisplay kommoData={profile.kommo_data} lastSynced={profile.kommo_last_synced} />
                    <TagsManager leadId={profile.id} initialTags={tags} salesUserId={user.id} />
                    <RemindersManager leadId={profile.id} initialReminders={reminders} salesUserId={user.id} />
                </div>

                {/* Right Column: Applications & History */}
                <div className="lg:col-span-2 space-y-6">
                    <ApplicationManager applications={applications} onStatusChange={handleStatusChange} />
                    <DocumentViewer documents={documents} />
                </div>
            </div>
        </div>
    );
};

export default SalesClientProfilePage;
