import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AdminService } from '../services/AdminService';
import { KommoService } from '../services/KommoService';
import type { Profile } from '../types/types';
import { Loader2, AlertTriangle, User, FileText, CheckCircle, Clock, Tag, Save, X, ArrowLeft, Plus, Trash2, Download, Eye, Phone, Printer } from 'lucide-react';
import PrintableApplication from '../components/PrintableApplication';
import { ApplicationService } from '../services/ApplicationService';
import { supabase } from '../../supabaseClient';
import BankingProfileSummary from '../components/BankingProfileSummary';
import EmailNotificationsHistory from '../components/EmailNotificationsHistory';
import { toast } from 'sonner';

const BUCKET_NAME = 'application-documents';

const ProfileDataItem: React.FC<{ label: string, value: any }> = ({ label, value }) => (
    <div>
        <p className="text-xs text-gray-500 uppercase tracking-wider">{label}</p>
        <p className="text-sm font-semibold text-gray-800">{value || 'N/A'}</p>
    </div>
);

const TagsManager: React.FC<{ leadId: string; initialTags: any[] }> = ({ leadId, initialTags }) => {
    const [assignedTags, setAssignedTags] = useState(initialTags);
    const [availableTags, setAvailableTags] = useState<any[]>([]);
    const [isEditing, setIsEditing] = useState(false);
    const [selectedTagIds, setSelectedTagIds] = useState<string[]>(() => initialTags.map(t => t.id));

    useEffect(() => {
        AdminService.getAvailableTags().then(setAvailableTags);
    }, []);

    const handleSave = async () => {
        await AdminService.updateLeadTags(leadId, selectedTagIds);
        const updatedAssignedTags = availableTags.filter(t => selectedTagIds.includes(t.id));
        setAssignedTags(updatedAssignedTags);
        setIsEditing(false);
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2"><Tag className="w-5 h-5"/>Etiquetas</h2>
                <button onClick={() => setIsEditing(!isEditing)} className="text-sm font-semibold text-primary-600 hover:text-primary-800">
                    {isEditing ? 'Cancelar' : 'Editar'}
                </button>
            </div>
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

const RemindersManager: React.FC<{ leadId: string; initialReminders: any[]; agentId: string }> = ({ leadId, initialReminders, agentId }) => {
    const [reminders, setReminders] = useState(initialReminders);
    const [isAdding, setIsAdding] = useState(false);
    const [newReminderText, setNewReminderText] = useState('');
    const [newReminderDate, setNewReminderDate] = useState('');

    const handleAdd = async () => {
        if (!newReminderText || !newReminderDate) return;
        await AdminService.createReminder({
            lead_id: leadId,
            agent_id: agentId,
            reminder_text: newReminderText,
            reminder_date: newReminderDate
        });
        const updatedReminders = await AdminService.getClientProfile(leadId).then(data => data?.reminders || []);
        setReminders(updatedReminders);
        setIsAdding(false);
        setNewReminderText('');
        setNewReminderDate('');
    };
    
    const handleToggleComplete = async (reminder: any) => {
        await AdminService.updateReminder(reminder.id, { is_completed: !reminder.is_completed });
        setReminders(reminders.map(r => r.id === reminder.id ? { ...r, is_completed: !r.is_completed } : r));
    };

    const handleDelete = async (reminderId: string) => {
        if (window.confirm('¿Seguro que quieres eliminar este recordatorio?')) {
            await AdminService.deleteReminder(reminderId);
            setReminders(reminders.filter(r => r.id !== reminderId));
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
    const [selectedApp, setSelectedApp] = useState<any | null>(applications.length > 0 ? applications[0] : null);
    const printRef = useRef<HTMLDivElement>(null);
    const [isDownloading, setIsDownloading] = useState(false);

    useEffect(() => {
        if (applications.length > 0 && !selectedApp) {
            setSelectedApp(applications[0]);
        }
    }, [applications, selectedApp]);

    const handlePrint = () => {
        window.print();
    };

    const handleDownloadPDF = async () => {
        if (!printRef.current || !selectedApp) return;

        setIsDownloading(true);
        try {
            // Dynamic import for better bundle splitting
            const html2canvas = (await import('html2canvas')).default;
            const jsPDF = (await import('jspdf')).default;

            const canvas = await html2canvas(printRef.current, {
                scale: 2,
                useCORS: true,
                logging: false,
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4',
            });

            const imgWidth = 210; // A4 width in mm
            const imgHeight = (canvas.height * imgWidth) / canvas.width;

            pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
            pdf.save(`solicitud-${selectedApp.id?.slice(0, 8)}.pdf`);
        } catch (error) {
            console.error('Error generating PDF:', error);
            alert('Error al generar el PDF. Por favor, intenta de nuevo.');
        } finally {
            setIsDownloading(false);
        }
    };

    if (applications.length === 0) {
        return (
            <div className="bg-white p-6 rounded-xl shadow-sm border">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Solicitud de Financiamiento</h2>
                <p className="text-sm text-gray-500 text-center py-8">Este usuario aún no ha enviado ninguna solicitud.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Application Selector and Actions */}
            <div className="bg-white p-6 rounded-xl shadow-sm border">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                    <div className="flex-grow">
                        <h2 className="text-lg font-semibold text-gray-800">Solicitud de Financiamiento</h2>
                        <p className="text-sm text-gray-500">Total de solicitudes: {applications.length}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                        {applications.length > 1 && (
                            <select
                                value={selectedApp?.id || ''}
                                onChange={(e) => {
                                    const app = applications.find(a => a.id === e.target.value);
                                    setSelectedApp(app || null);
                                }}
                                className="text-sm px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            >
                                {applications.map((app, idx) => (
                                    <option key={app.id} value={app.id}>
                                        Solicitud {idx + 1} - {app.car_info?._vehicleTitle || 'General'}
                                    </option>
                                ))}
                            </select>
                        )}
                        {selectedApp && (
                            <select
                                value={selectedApp.status}
                                onChange={(e) => onStatusChange(selectedApp.id, e.target.value)}
                                className="text-sm font-semibold bg-gray-100 text-gray-700 px-3 py-2 rounded-lg border-none focus:ring-2 focus:ring-primary-500"
                            >
                                <option value="draft">Borrador</option>
                                <option value="submitted">Enviada</option>
                                <option value="reviewing">En Revisión</option>
                                <option value="pending_docs">Docs Pendientes</option>
                                <option value="approved">Aprobada</option>
                                <option value="rejected">Rechazada</option>
                            </select>
                        )}
                    </div>
                </div>

                {/* Prominent Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3">
                    <button
                        onClick={handleDownloadPDF}
                        disabled={isDownloading || !selectedApp}
                        className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white font-bold rounded-lg hover:from-primary-700 hover:to-primary-800 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg transform transition-all hover:scale-105"
                    >
                        {isDownloading ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Generando PDF...
                            </>
                        ) : (
                            <>
                                <Download className="w-5 h-5" />
                                Descargar Solicitud (PDF)
                            </>
                        )}
                    </button>
                    <button
                        onClick={handlePrint}
                        disabled={!selectedApp}
                        className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-700 text-white font-semibold rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                    >
                        <Printer className="w-5 h-5" />
                        Imprimir
                    </button>
                </div>
            </div>

            {/* Application Preview */}
            {selectedApp && (
                <div ref={printRef} className="print:p-0">
                    <PrintableApplication application={selectedApp} />
                </div>
            )}
        </div>
    );
};


const DocumentViewer: React.FC<{ documents: any[]; onStatusChange: (docId: string, status: string) => void }> = ({ documents, onStatusChange }) => {
    const [viewingDoc, setViewingDoc] = useState<any | null>(null);
    const [documentsWithUrls, setDocumentsWithUrls] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadDocumentUrls = async () => {
            setLoading(true);
            const docsWithSignedUrls = await Promise.all(
                documents.map(async (doc) => {
                    try {
                        const { data, error } = await supabase.storage
                            .from(BUCKET_NAME)
                            .createSignedUrl(doc.file_path, 3600); // 1 hour expiry

                        if (error) {
                            console.error(`Error generating signed URL for ${doc.file_path}:`, error);
                            return { ...doc, url: null };
                        }

                        return { ...doc, url: data.signedUrl };
                    } catch (error) {
                        console.error('Error loading document URL:', error);
                        return { ...doc, url: null };
                    }
                })
            );
            setDocumentsWithUrls(docsWithSignedUrls);
            setLoading(false);
        };

        if (documents.length > 0) {
            loadDocumentUrls();
        } else {
            setDocumentsWithUrls([]);
            setLoading(false);
        }
    }, [documents]);

    const getStatusColor = (status: string) => {
        switch(status) {
            case 'approved': return 'bg-green-100 text-green-800 border-green-200';
            case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
            case 'reviewing': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const downloadDocument = async (doc: any) => {
        try {
            if (!doc.url) {
                alert('No se pudo generar la URL del documento');
                return;
            }

            const response = await fetch(doc.url);
            if (!response.ok) {
                throw new Error('Error al descargar el archivo');
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = doc.file_name;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error('Error downloading document:', error);
            alert('Error al descargar el documento');
        }
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Documentos Cargados ({documents.length})</h2>
            {loading ? (
                <div className="flex justify-center items-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
                    <span className="ml-2 text-sm text-gray-600">Cargando documentos...</span>
                </div>
            ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
                {documentsWithUrls.length > 0 ? documentsWithUrls.map(doc => (
                    <div key={doc.id} className="p-3 border rounded-lg hover:bg-gray-50">
                        <div className="flex items-center gap-3 mb-2">
                            <FileText className="w-5 h-5 text-primary-600 flex-shrink-0"/>
                            <div className="flex-grow min-w-0">
                                <p className="text-sm font-semibold text-gray-800 truncate">{doc.file_name}</p>
                                <p className="text-xs text-gray-500">{doc.document_type} - {new Date(doc.created_at).toLocaleDateString()}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                            <select
                                value={doc.status}
                                onChange={(e) => onStatusChange(doc.id, e.target.value)}
                                className={`text-xs font-semibold px-2 py-1 rounded-full border ${getStatusColor(doc.status)} cursor-pointer`}
                            >
                                <option value="reviewing">En Revisión</option>
                                <option value="approved">Aprobado</option>
                                <option value="rejected">Rechazado</option>
                            </select>
                            <div className="flex-grow"></div>
                            <button
                                onClick={() => setViewingDoc(doc)}
                                className="p-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                                title="Ver documento"
                            >
                                <Eye className="w-4 h-4"/>
                            </button>
                            <button
                                onClick={() => downloadDocument(doc)}
                                className="p-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                                title="Descargar documento"
                            >
                                <Download className="w-4 h-4"/>
                            </button>
                        </div>
                    </div>
                )) : <p className="text-sm text-gray-500 text-center py-8">No hay documentos cargados.</p>}
            </div>
            )}

            {viewingDoc && (
                <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setViewingDoc(null)}>
                    <div className="relative bg-white w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-xl flex flex-col" onClick={e => e.stopPropagation()}>
                        <div className="p-4 border-b flex justify-between items-center flex-shrink-0">
                            <div>
                                <h3 className="text-lg font-bold">{viewingDoc.file_name}</h3>
                                <p className="text-sm text-gray-500">{viewingDoc.document_type}</p>
                            </div>
                            <button onClick={() => setViewingDoc(null)} className="p-2 rounded-full hover:bg-gray-100"><X className="w-5 h-5" /></button>
                        </div>
                        <div className="overflow-y-auto flex-1 p-4 bg-gray-100">
                            {viewingDoc.content_type?.startsWith('image/') ? (
                                <img src={viewingDoc.url} alt={viewingDoc.file_name} className="max-w-full h-auto mx-auto" />
                            ) : viewingDoc.content_type === 'application/pdf' ? (
                                <iframe src={viewingDoc.url} className="w-full h-full min-h-[600px]" title={viewingDoc.file_name} />
                            ) : (
                                <div className="text-center py-8">
                                    <FileText className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                                    <p className="text-gray-600">Vista previa no disponible para este tipo de archivo</p>
                                    <button
                                        onClick={() => downloadDocument(viewingDoc)}
                                        className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                                    >
                                        Descargar Archivo
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const LeadSourceInfo: React.FC<{ metadata: any; source: string }> = ({ metadata, source }) => {
    if (!metadata && !source) {
        return null;
    }

    const utmParams = metadata ? Object.entries(metadata).filter(([key]) => key.startsWith('utm_')) : [];
    const fbclid = metadata?.fbclid;

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Fuente del Lead</h2>
            <div className="space-y-3">
                {source && <ProfileDataItem label="Origen" value={source} />}
                {metadata?.rfdm && <ProfileDataItem label="Referencia (rfdm)" value={metadata.rfdm} />}
                {metadata?.ordencompra && <ProfileDataItem label="Vehículo de Interés" value={metadata.ordencompra} />}
                {fbclid && <ProfileDataItem label="Facebook Click ID" value={fbclid} />}
                {utmParams.length > 0 && (
                    <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Parámetros UTM</p>
                        {utmParams.map(([key, value]) => (
                            <div key={key} className="mb-1">
                                <span className="text-xs text-gray-600">{key.replace('utm_', '')}: </span>
                                <span className="text-sm font-semibold text-gray-800">{value as string}</span>
                            </div>
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

const AdminClientProfilePage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { user } = useAuth();
    const [clientData, setClientData] = useState<{ profile: Profile; applications: any[]; tags: any[]; reminders: any[]; documents: any[] } | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isSyncing, setIsSyncing] = useState(false);
    const [syncMessage, setSyncMessage] = useState('');

    useEffect(() => {
        if (!id) {
            setError("ID del cliente no proporcionado en la URL. Por favor, verifica el enlace.");
            setLoading(false);
            return;
        }
        const fetchData = async () => {
            setLoading(true);
            setError(null);
            try {
                const data = await AdminService.getClientProfile(id);
                if (!data || !data.profile) {
                    throw new Error(`No se encontró el cliente con ID: ${id}. Es posible que no tengas permisos para ver este perfil o que el cliente no exista.`);
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
    }, [id]);

    const handleSyncToKommo = async () => {
        if (!clientData) return;
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
                    const updatedData = await AdminService.getClientProfile(id!);
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

    const handleDocumentStatusChange = async (docId: string, status: string) => {
        if (!clientData) return;
        try {
            await AdminService.updateDocumentStatus(docId, status);
            setClientData(prev => prev ? ({
                ...prev,
                documents: prev.documents.map(doc => doc.id === docId ? { ...doc, status } : doc),
            }) : null);
        } catch(e: any) {
            alert(`Error updating document status: ${e.message}`);
        }
    };

    const handleCallClient = () => {
        if (clientData?.profile?.phone) {
            window.location.href = `tel:${clientData.profile.phone}`;
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-full">
                <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="max-w-2xl mx-auto mt-10">
                <div className="p-6 bg-red-50 border-2 border-red-200 text-red-800 rounded-xl">
                    <div className="flex items-start gap-3">
                        <AlertTriangle className="w-6 h-6 flex-shrink-0 mt-0.5" />
                        <div className="flex-grow">
                            <h2 className="text-lg font-bold mb-2">Error al Cargar Perfil</h2>
                            <p className="text-sm mb-4">{error}</p>
                            <Link
                                to="/escritorio/admin/crm"
                                className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                Volver al CRM
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!clientData || !user) {
        return (
            <div className="max-w-2xl mx-auto mt-10">
                <div className="p-6 bg-yellow-50 border-2 border-yellow-200 text-yellow-800 rounded-xl">
                    <p className="font-semibold">No hay datos del cliente disponibles.</p>
                    <Link
                        to="/escritorio/admin/crm"
                        className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-yellow-600 text-white font-semibold rounded-lg hover:bg-yellow-700 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Volver al CRM
                    </Link>
                </div>
            </div>
        );
    }

    const { profile, applications, tags, reminders, documents } = clientData;

    return (
        <div className="space-y-8">
            <Link to="/escritorio/admin/crm" className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 font-semibold">
                <ArrowLeft className="w-4 h-4" />
                Volver al CRM
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
                            <ProfileDataItem label="Asesor Asignado" value={profile.asesor_asignado_name || 'N/A'} />
                            <ProfileDataItem label="Contactado" value={profile.contactado ? 'Sí' : 'No'} />
                        </div>
                        <div className="mt-6 border-t pt-4 space-y-2">
                            <button onClick={handleCallClient} disabled={!profile.phone} className="w-full flex items-center justify-center gap-2 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed">
                                <Phone className="w-4 h-4" />
                                Llamar Cliente
                            </button>
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

                    <BankingProfileSummary applications={applications} />
                    <LeadSourceInfo metadata={profile.metadata} source={profile.source} />
                    <KommoDataDisplay kommoData={profile.kommo_data} lastSynced={profile.kommo_last_synced} />
                    <EmailNotificationsHistory userId={profile.id} />
                    <TagsManager leadId={profile.id} initialTags={tags} />
                    <RemindersManager leadId={profile.id} initialReminders={reminders} agentId={user.id} />
                </div>

                {/* Right Column: Applications & History */}
                <div className="lg:col-span-2 space-y-6">
                    <ApplicationManager applications={applications} onStatusChange={handleStatusChange} />
                    <DocumentViewer documents={documents} onStatusChange={handleDocumentStatusChange} />
                </div>
            </div>
        </div>
    );
};
export default AdminClientProfilePage;