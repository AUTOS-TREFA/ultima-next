'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import { SellCarService } from '../services/SellCarService';
import { AdminService } from '../services/AdminService';
import { Loader2, AlertTriangle, ArrowLeft, Car, User, Phone, Mail, MapPin, Calendar, FileText, CheckCircle, X, Save, Send, Tag, Edit, ListOrdered, Gauge, DollarSign, Users, Key, Receipt, Building, CreditCard, ShieldAlert, MessageSquare } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import EmailNotificationsHistory from '../components/EmailNotificationsHistory';

const ProfileDataItem: React.FC<{ label: string, value: any, icon?: React.ReactNode }> = ({ label, value, icon }) => (
    <div className="flex items-start gap-3">
        {icon && <div className="mt-1 text-primary-600">{icon}</div>}
        <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider">{label}</p>
            <p className="text-sm font-semibold text-gray-800">{value || 'N/A'}</p>
        </div>
    </div>
);

const AutosConOfertaPage: React.FC = () => {
    const params = useParams<{ listingId: string }>();
    const listingId = params?.listingId;
    const { user } = useAuth();
    const router = useRouter();
    const queryClient = useQueryClient();

    const [contacted, setContacted] = useState(false);
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [isEditingTags, setIsEditingTags] = useState(false);
    const [kommoWebhookUrl, setKommoWebhookUrl] = useState('');
    const [status, setStatus] = useState('');
    const [isEditingStatus, setIsEditingStatus] = useState(false);

    const { data: leadDetails, isLoading, isError, error } = useQuery<any, Error>({
        queryKey: ['purchaseLeadDetails', listingId],
        queryFn: () => SellCarService.getPurchaseLeadDetails(listingId!),
        enabled: !!listingId
    });

    const { data: availableTags = [] } = useQuery<any[], Error>({
        queryKey: ['availableTags'],
        queryFn: AdminService.getAvailableTags
    });

    const { data: appConfig = [] } = useQuery<any[], Error>({
        queryKey: ['appConfig'],
        queryFn: AdminService.getAppConfig
    });

    useEffect(() => {
        if (leadDetails) {
            setContacted(leadDetails.contacted || false);
            setSelectedTags(leadDetails.tags?.map((t: any) => t.id) || []);
            setStatus(leadDetails.status || 'pending');
        }
    }, [leadDetails]);

    useEffect(() => {
        const kommoConfig = appConfig.find((c: any) => c.key === 'kommo_webhook_url');
        if (kommoConfig) {
            setKommoWebhookUrl(kommoConfig.value);
        }
    }, [appConfig]);

    const updateContactedMutation = useMutation({
        mutationFn: (newContacted: boolean) => SellCarService.updateContactedStatus(listingId!, newContacted),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['purchaseLeadDetails', listingId] });
            queryClient.invalidateQueries({ queryKey: ['purchaseLeads'] });
        }
    });

    const sendToKommoMutation = useMutation({
        mutationFn: () => SellCarService.sendToKommo(listingId!, kommoWebhookUrl),
        onSuccess: () => {
            alert('Lead enviado a Kommo exitosamente');
        },
        onError: (error: any) => {
            alert(`Error: ${error.message}`);
        }
    });

    const updateStatusMutation = useMutation({
        mutationFn: (newStatus: string) => SellCarService.updateStatus(listingId!, newStatus),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['purchaseLeadDetails', listingId] });
            queryClient.invalidateQueries({ queryKey: ['purchaseLeads'] });
            queryClient.invalidateQueries({ queryKey: ['comprasDashboardStats'] });
            setIsEditingStatus(false);
        }
    });

    const handleToggleContacted = async () => {
        const newValue = !contacted;
        setContacted(newValue);
        updateContactedMutation.mutate(newValue);
    };

    const handleSendToKommo = () => {
        if (!kommoWebhookUrl) {
            alert('No se ha configurado el webhook de Kommo. Por favor configúralo en la página de Marketing.');
            return;
        }
        if (window.confirm('¿Seguro que quieres enviar este lead a Kommo?')) {
            sendToKommoMutation.mutate();
        }
    };

    if (isLoading) return <div className="flex justify-center items-center h-full"><Loader2 className="w-8 h-8 animate-spin text-primary-600" /></div>;
    if (isError) return <div className="p-4 bg-red-100 text-red-800 rounded-md"><AlertTriangle className="inline w-5 h-5 mr-2"/>{error?.message}</div>;
    if (!leadDetails) return <div className="p-4 bg-yellow-100 text-yellow-800 rounded-md">No se encontró el lead.</div>;

    const vehicle = leadDetails.valuation_data?.vehicle;
    const valuation = leadDetails.valuation_data?.valuation;

    return (
        <div className="space-y-6 max-w-6xl mx-auto">
            <div className="flex items-center justify-between">
                <Link href="/escritorio/admin/compras" className="flex items-center gap-2 text-primary-600 hover:text-primary-800 font-semibold">
                    <ArrowLeft className="w-5 h-5" />
                    Volver a Compras
                </Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white p-6 rounded-xl shadow-sm border">
                        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <Car className="w-6 h-6 text-primary-600" />
                            Detalles del Auto
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <ProfileDataItem label="Auto" value={vehicle?.label || 'N/A'} icon={<Car className="w-5 h-5" />} />
                            <ProfileDataItem label="Año" value={vehicle?.year} icon={<Calendar className="w-5 h-5" />} />
                            <ProfileDataItem label="Kilometraje" value={leadDetails.valuation_data?.mileage ? `${leadDetails.valuation_data.mileage.toLocaleString('es-MX')} km` : 'N/A'} icon={<Gauge className="w-5 h-5" />} />
                            <ProfileDataItem label="Oferta Inicial" value={valuation?.suggestedOffer ? new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(valuation.suggestedOffer) : 'N/A'} icon={<DollarSign className="w-5 h-5" />} />
                            <ProfileDataItem label="Número de Dueños" value={leadDetails.owner_count} icon={<Users className="w-5 h-5" />} />
                            <ProfileDataItem label="Llaves" value={leadDetails.key_info} icon={<Key className="w-5 h-5" />} />
                            <ProfileDataItem label="Estado de Factura" value={leadDetails.invoice_status === 'liberada' ? 'Liberada' : 'Financiada'} icon={<Receipt className="w-5 h-5" />} />
                            {leadDetails.invoice_status === 'financiada' && (
                                <>
                                    <ProfileDataItem label="Tipo de Entidad" value={leadDetails.financing_entity_type === 'banco' ? 'Banco' : 'Agencia'} icon={<Building className="w-5 h-5" />} />
                                    <ProfileDataItem label="Nombre de Entidad" value={leadDetails.financing_entity_name} icon={<Building className="w-5 h-5" />} />
                                </>
                            )}
                            <ProfileDataItem label="Estado del Auto" value={leadDetails.vehicle_state} icon={<MapPin className="w-5 h-5" />} />
                            <ProfileDataItem label="Estado de Placas" value={leadDetails.plate_registration_state} icon={<CreditCard className="w-5 h-5" />} />
                            <ProfileDataItem label="Historial de Accidentes" value={leadDetails.accident_history} icon={<ShieldAlert className="w-5 h-5" />} />
                            <ProfileDataItem label="Razón de Venta" value={leadDetails.reason_for_selling} icon={<MessageSquare className="w-5 h-5" />} />
                            <ProfileDataItem label="Sucursal de Inspección" value={leadDetails.inspection_branch} icon={<Building className="w-5 h-5" />} />
                        </div>
                        {leadDetails.additional_details && (
                            <div className="mt-6 pt-6 border-t">
                                <ProfileDataItem label="Detalles Adicionales" value={leadDetails.additional_details} icon={<FileText className="w-5 h-5" />} />
                            </div>
                        )}
                    </div>

                    <div className="bg-white p-6 rounded-xl shadow-sm border">
                        <h2 className="text-lg font-bold text-gray-800 mb-4">Fotos</h2>
                        <div className="space-y-4">
                            {leadDetails.exterior_photos && leadDetails.exterior_photos.length > 0 && (
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-700 mb-2">Exterior ({leadDetails.exterior_photos.length})</h3>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                        {leadDetails.exterior_photos.map((photo: string, idx: number) => (
                                            <img key={idx} src={`${photo}`} alt={`Exterior ${idx + 1}`} className="w-full h-24 object-cover rounded border" />
                                        ))}
                                    </div>
                                </div>
                            )}
                            {leadDetails.interior_photos && leadDetails.interior_photos.length > 0 && (
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-700 mb-2">Interior ({leadDetails.interior_photos.length})</h3>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                        {leadDetails.interior_photos.map((photo: string, idx: number) => (
                                            <img key={idx} src={`${photo}`} alt={`Interior ${idx + 1}`} className="w-full h-24 object-cover rounded border" />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-xl shadow-sm border">
                        <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <User className="w-5 h-5 text-primary-600" />
                            Información del Propietario
                        </h2>
                        <div className="space-y-4">
                            <ProfileDataItem label="Nombre" value={`${leadDetails.first_name || ''} ${leadDetails.last_name || ''}`.trim()} icon={<User className="w-5 h-5" />} />
                            <ProfileDataItem label="Email" value={leadDetails.email} icon={<Mail className="w-5 h-5" />} />
                            <ProfileDataItem label="Teléfono" value={leadDetails.phone} icon={<Phone className="w-5 h-5" />} />
                            <ProfileDataItem label="Fecha de Registro" value={new Date(leadDetails.created_at).toLocaleDateString('es-MX')} icon={<Calendar className="w-5 h-5" />} />
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl shadow-sm border">
                        <h2 className="text-lg font-bold text-gray-800 mb-4">Estado de Contacto</h2>
                        <button
                            onClick={handleToggleContacted}
                            disabled={updateContactedMutation.isPending}
                            className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-semibold transition-colors ${
                                contacted
                                    ? 'bg-green-100 text-green-800 hover:bg-green-200'
                                    : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                            }`}
                        >
                            {contacted ? <CheckCircle className="w-5 h-5" /> : <X className="w-5 h-5" />}
                            {contacted ? 'Contactado' : 'No Contactado'}
                        </button>
                    </div>

                    <div className="bg-white p-6 rounded-xl shadow-sm border">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                <ListOrdered className="w-5 h-5 text-primary-600" />
                                Estado del Proceso
                            </h2>
                            <button onClick={() => setIsEditingStatus(!isEditingStatus)} className="text-sm font-semibold text-primary-600 hover:text-primary-800">
                                {isEditingStatus ? 'Cancelar' : 'Editar'}
                            </button>
                        </div>
                        {isEditingStatus ? (
                            <div className="space-y-4">
                                <select
                                    value={status}
                                    onChange={(e) => setStatus(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                >
                                    <option value="pending">Pendiente</option>
                                    <option value="in_inspection">En Inspección</option>
                                    <option value="offer_made">Oferta Realizada</option>
                                    <option value="completed">Completado</option>
                                    <option value="rejected">Rechazado</option>
                                </select>
                                <button
                                    onClick={() => updateStatusMutation.mutate(status)}
                                    disabled={updateStatusMutation.isPending}
                                    className="w-full flex items-center justify-center gap-2 py-2 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 disabled:opacity-50"
                                >
                                    {updateStatusMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                    {updateStatusMutation.isPending ? 'Guardando...' : 'Guardar Cambios'}
                                </button>
                            </div>
                        ) : (
                            <div className="text-sm">
                                <span className={`px-3 py-1.5 rounded-full font-semibold ${
                                    status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                    status === 'in_inspection' ? 'bg-blue-100 text-blue-800' :
                                    status === 'offer_made' ? 'bg-purple-100 text-purple-800' :
                                    status === 'completed' ? 'bg-green-100 text-green-800' :
                                    status === 'rejected' ? 'bg-red-100 text-red-800' :
                                    'bg-gray-100 text-gray-800'
                                }`}>
                                    {status === 'pending' ? 'Pendiente' :
                                     status === 'in_inspection' ? 'En Inspección' :
                                     status === 'offer_made' ? 'Oferta Realizada' :
                                     status === 'completed' ? 'Completado' :
                                     status === 'rejected' ? 'Rechazado' : status}
                                </span>
                            </div>
                        )}
                    </div>

                    {(leadDetails?.user_id || leadDetails?.email) && (
                        <EmailNotificationsHistory
                            userId={leadDetails.user_id}
                            recipientEmail={!leadDetails.user_id ? leadDetails.email : undefined}
                        />
                    )}

                    <div className="bg-white p-6 rounded-xl shadow-sm border">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                <Tag className="w-5 h-5 text-primary-600" />
                                Etiquetas
                            </h2>
                            <button onClick={() => setIsEditingTags(!isEditingTags)} className="text-sm font-semibold text-primary-600 hover:text-primary-800">
                                {isEditingTags ? 'Cancelar' : 'Editar'}
                            </button>
                        </div>
                        {isEditingTags ? (
                            <div className="space-y-4">
                                <div className="flex flex-wrap gap-2">
                                    {availableTags.map(tag => {
                                        const isSelected = selectedTags.includes(tag.id);
                                        return (
                                            <button
                                                key={tag.id}
                                                onClick={() => {
                                                    setSelectedTags(prev =>
                                                        isSelected ? prev.filter(id => id !== tag.id) : [...prev, tag.id]
                                                    );
                                                }}
                                                className={`px-2 py-1 text-xs font-medium rounded-full border-2 ${
                                                    isSelected ? 'border-transparent' : 'border-gray-300'
                                                }`}
                                                style={{
                                                    backgroundColor: isSelected ? tag.color : '#fff',
                                                    color: isSelected ? '#fff' : '#000'
                                                }}
                                            >
                                                {tag.tag_name}
                                            </button>
                                        );
                                    })}
                                </div>
                                <button
                                    onClick={async () => {
                                        await AdminService.updateLeadTags(leadDetails.user_id, selectedTags);
                                        setIsEditingTags(false);
                                        queryClient.invalidateQueries({ queryKey: ['purchaseLeadDetails', listingId] });
                                    }}
                                    className="w-full flex items-center justify-center gap-2 py-2 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700"
                                >
                                    <Save className="w-4 h-4" /> Guardar Cambios
                                </button>
                            </div>
                        ) : (
                            <div className="flex flex-wrap gap-2">
                                {leadDetails.tags && leadDetails.tags.length > 0 ? (
                                    leadDetails.tags.map((tag: any) => (
                                        <span
                                            key={tag.id}
                                            className="px-2 py-1 text-xs font-medium rounded-full text-white"
                                            style={{ backgroundColor: tag.color }}
                                        >
                                            {tag.tag_name}
                                        </span>
                                    ))
                                ) : (
                                    <p className="text-sm text-gray-500">Sin etiquetas.</p>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="bg-white p-6 rounded-xl shadow-sm border">
                        <h2 className="text-lg font-bold text-gray-800 mb-4">Enviar a Kommo</h2>
                        <button
                            onClick={handleSendToKommo}
                            disabled={sendToKommoMutation.isPending || !kommoWebhookUrl}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {sendToKommoMutation.isPending ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <Send className="w-5 h-5" />
                            )}
                            {sendToKommoMutation.isPending ? 'Enviando...' : 'Enviar a Kommo'}
                        </button>
                        {!kommoWebhookUrl && (
                            <p className="text-xs text-red-600 mt-2">
                                No se ha configurado el webhook. Configúralo en{' '}
                                <Link href="/escritorio/admin/marketing" className="underline">
                                    Marketing
                                </Link>
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AutosConOfertaPage;
