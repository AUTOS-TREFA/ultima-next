'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SellCarService } from '../services/SellCarService';
import { supabase } from '../../supabaseClient';
import { Loader2, AlertTriangle, ArrowLeft, Car, User, MapPin, FileText, Calendar, CheckCircle2, XCircle, MessageSquare, DollarSign, Camera, Clock, Key, FileCheck, Building2, Shield, AlertCircle, HelpCircle } from 'lucide-react';
import exifr from 'exifr';

interface PhotoWithMetadata {
    url: string;
    path: string;
    metadata?: {
        dateTaken?: string;
        camera?: string;
        location?: string;
    };
}

const VehicleForSaleDetailPage: React.FC = () => {
    const { listingId } = useParams<{ listingId: string }>();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [photoMetadata, setPhotoMetadata] = useState<PhotoWithMetadata[]>([]);
    const [selectedPhoto, setSelectedPhoto] = useState<PhotoWithMetadata | null>(null);

    const { data: listing, isLoading, isError, error } = useQuery<any, Error>({
        queryKey: ['purchaseLeadDetails', listingId],
        queryFn: () => SellCarService.getPurchaseLeadDetails(listingId!)
    });

    const updateContactedMutation = useMutation({
        mutationFn: (contacted: boolean) => SellCarService.updateContactedStatus(listingId!, contacted),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['purchaseLeadDetails', listingId] })
    });

    // Extract EXIF metadata from photos
    useEffect(() => {
        const loadPhotoMetadata = async () => {
            if (!listing) return;

            const allPhotos: string[] = [
                ...(listing.exterior_photos || []),
                ...(listing.interior_photos || [])
            ];

            const photosWithMetadata: PhotoWithMetadata[] = await Promise.all(
                allPhotos.map(async (path) => {
                    const { data } = supabase.storage.from('user-car-photos').getPublicUrl(path);
                    const url = data.publicUrl;

                    try {
                        const exifData = await exifr.parse(url, { xmp: true, ifd1: true, mergeOutput: false });

                        return {
                            url,
                            path,
                            metadata: {
                                dateTaken: exifData?.DateTimeOriginal || exifData?.DateTime || exifData?.CreateDate,
                                camera: exifData?.Model || exifData?.Make,
                                location: exifData?.GPSLatitude && exifData?.GPSLongitude
                                    ? `${exifData.GPSLatitude.toFixed(4)}, ${exifData.GPSLongitude.toFixed(4)}`
                                    : undefined
                            }
                        };
                    } catch (err) {
                        return { url, path, metadata: undefined };
                    }
                })
            );

            setPhotoMetadata(photosWithMetadata);
        };

        loadPhotoMetadata();
    }, [listing]);

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-96">
                <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
            </div>
        );
    }

    if (isError || !listing) {
        return (
            <div className="p-4 bg-red-100 text-red-800 rounded-md">
                <AlertTriangle className="inline w-5 h-5 mr-2" />
                {error?.message || 'No se pudo cargar el vehículo'}
            </div>
        );
    }

    const vehicleInfo = listing.valuation_data?.vehicle?.label || 'Vehículo';
    const suggestedOffer = listing.valuation_data?.valuation?.suggestedOffer;
    const userAccepted = listing.status === 'accepted';
    const offerMade = listing.status === 'offer_made' || userAccepted;

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full">
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="flex-1">
                    <h1 className="text-3xl font-bold text-gray-900">{vehicleInfo}</h1>
                    <p className="text-gray-600">ID: {listing.id?.slice(0, 8)}</p>
                </div>
                <span className={`px-4 py-2 text-sm font-semibold rounded-full ${getStatusBadgeColor(listing.status)}`}>
                    {getStatusLabel(listing.status)}
                </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content - Left Column */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Owner Information */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border">
                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                            <User className="w-5 h-5" />
                            Información del Propietario
                        </h2>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-gray-600">Nombre</p>
                                <p className="font-semibold">{`${listing.first_name || ''} ${listing.last_name || ''}`.trim() || 'N/A'}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Email</p>
                                <p className="font-semibold">{listing.email || 'N/A'}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Teléfono</p>
                                <p className="font-semibold">{listing.phone || 'N/A'}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Asesor Asignado</p>
                                <p className="font-semibold">{listing.asesor_asignado || 'Sin asignar'}</p>
                            </div>
                        </div>
                    </div>

                    {/* Vehicle Details */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border">
                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                            <Car className="w-5 h-5" />
                            Detalles del Vehículo
                        </h2>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-gray-600 flex items-center gap-1">
                                    <User className="w-4 h-4" />
                                    Número de Dueños
                                </p>
                                <p className="font-semibold">{listing.owner_count || 'N/A'}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600 flex items-center gap-1">
                                    <Key className="w-4 h-4" />
                                    Llaves
                                </p>
                                <p className="font-semibold">{listing.key_info || 'N/A'}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600 flex items-center gap-1">
                                    <FileCheck className="w-4 h-4" />
                                    Estado de Factura
                                </p>
                                <p className="font-semibold capitalize">{listing.invoice_status || 'N/A'}</p>
                            </div>
                            {listing.financing_entity_name && (
                                <div>
                                    <p className="text-sm text-gray-600 flex items-center gap-1">
                                        <Building2 className="w-4 h-4" />
                                        Entidad Financiera
                                    </p>
                                    <p className="font-semibold">{listing.financing_entity_name} ({listing.financing_entity_type})</p>
                                </div>
                            )}
                            <div>
                                <p className="text-sm text-gray-600 flex items-center gap-1">
                                    <MapPin className="w-4 h-4" />
                                    Estado del Vehículo
                                </p>
                                <p className="font-semibold">{listing.vehicle_state || 'N/A'}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600 flex items-center gap-1">
                                    <Shield className="w-4 h-4" />
                                    Estado de Placas
                                </p>
                                <p className="font-semibold">{listing.plate_registration_state || 'N/A'}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600 flex items-center gap-1">
                                    <AlertCircle className="w-4 h-4" />
                                    Historial de Accidentes
                                </p>
                                <p className="font-semibold">{listing.accident_history || 'N/A'}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600 flex items-center gap-1">
                                    <HelpCircle className="w-4 h-4" />
                                    Motivo de Venta
                                </p>
                                <p className="font-semibold">{listing.reason_for_selling || 'N/A'}</p>
                            </div>
                            <div className="col-span-2">
                                <p className="text-sm text-gray-600">Sucursal de Inspección</p>
                                <p className="font-semibold flex items-center gap-2">
                                    <MapPin className="w-4 h-4" />
                                    {listing.inspection_branch || 'N/A'}
                                </p>
                            </div>
                            {listing.additional_details && (
                                <div className="col-span-2">
                                    <p className="text-sm text-gray-600">Detalles Adicionales</p>
                                    <p className="font-semibold">{listing.additional_details}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Photos with Metadata */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border">
                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                            <Camera className="w-5 h-5" />
                            Fotos ({photoMetadata.length})
                        </h2>

                        {photoMetadata.length > 0 ? (
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {photoMetadata.map((photo, idx) => (
                                    <div
                                        key={idx}
                                        className="relative group cursor-pointer"
                                        onClick={() => setSelectedPhoto(photo)}
                                    >
                                        <img
                                            src={photo.url}
                                            alt={`Foto ${idx + 1}`}
                                            className="w-full h-48 object-cover rounded-lg border-2 border-gray-200 hover:border-primary-500 transition-colors"
                                        />
                                        {photo.metadata?.dateTaken && (
                                            <div className="absolute bottom-2 left-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                                                <Clock className="w-3 h-3 inline mr-1" />
                                                {new Date(photo.metadata.dateTaken).toLocaleDateString()}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-500 text-center py-8">Sin fotos disponibles</p>
                        )}
                    </div>
                </div>

                {/* Right Sidebar */}
                <div className="space-y-6">
                    {/* Offer Information */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border">
                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                            <DollarSign className="w-5 h-5" />
                            Ofertas
                        </h2>

                        {suggestedOffer && (
                            <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                                <p className="text-sm text-blue-800 mb-1">Oferta Inicial Sugerida</p>
                                <p className="text-2xl font-bold text-blue-900">
                                    {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(suggestedOffer)}
                                </p>
                            </div>
                        )}

                        {listing.final_offer && (
                            <div className={`p-4 rounded-lg ${userAccepted ? 'bg-green-50' : 'bg-purple-50'}`}>
                                <p className="text-sm text-gray-700 mb-1 flex items-center gap-2">
                                    {userAccepted && <CheckCircle2 className="w-4 h-4 text-green-600" />}
                                    Oferta Final
                                </p>
                                <p className={`text-2xl font-bold ${userAccepted ? 'text-green-900' : 'text-purple-900'}`}>
                                    {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(listing.final_offer)}
                                </p>
                                {userAccepted && (
                                    <p className="text-sm text-green-700 mt-2 font-semibold">
                                        Usuario aceptó la oferta
                                    </p>
                                )}
                            </div>
                        )}

                        {listing.inspection_notes && (
                            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                                <p className="text-sm text-gray-600 mb-1">Notas de Inspección</p>
                                <p className="text-sm">{listing.inspection_notes}</p>
                            </div>
                        )}
                    </div>

                    {/* Contact Actions */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border">
                        <h2 className="text-xl font-bold mb-4">Acciones</h2>

                        <div className="space-y-3">
                            <button
                                onClick={() => updateContactedMutation.mutate(!listing.contacted)}
                                className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-semibold transition-colors ${
                                    listing.contacted
                                        ? 'bg-green-100 text-green-800 hover:bg-green-200'
                                        : 'bg-primary-600 text-white hover:bg-primary-700'
                                }`}
                            >
                                {listing.contacted ? <CheckCircle2 className="w-5 h-5" /> : <MessageSquare className="w-5 h-5" />}
                                {listing.contacted ? 'Contactado' : 'Marcar como Contactado'}
                            </button>

                            {listing.email && (
                                <a
                                    href={`mailto:${listing.email}`}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-lg font-semibold transition-colors"
                                >
                                    <MessageSquare className="w-5 h-5" />
                                    Enviar Email
                                </a>
                            )}

                            {listing.phone && (
                                <a
                                    href={`tel:${listing.phone}`}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-lg font-semibold transition-colors"
                                >
                                    <MessageSquare className="w-5 h-5" />
                                    Llamar
                                </a>
                            )}
                        </div>
                    </div>

                    {/* Timeline */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border">
                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                            <Calendar className="w-5 h-5" />
                            Cronología
                        </h2>
                        <div className="space-y-3">
                            {listing.created_at && (
                                <div className="flex gap-3">
                                    <div className="flex-shrink-0 w-2 h-2 mt-2 rounded-full bg-blue-500"></div>
                                    <div>
                                        <p className="text-sm font-semibold">Solicitud Creada</p>
                                        <p className="text-xs text-gray-600">
                                            {new Date(listing.created_at).toLocaleString('es-MX')}
                                        </p>
                                    </div>
                                </div>
                            )}
                            {listing.updated_at && listing.updated_at !== listing.created_at && (
                                <div className="flex gap-3">
                                    <div className="flex-shrink-0 w-2 h-2 mt-2 rounded-full bg-purple-500"></div>
                                    <div>
                                        <p className="text-sm font-semibold">Última Actualización</p>
                                        <p className="text-xs text-gray-600">
                                            {new Date(listing.updated_at).toLocaleString('es-MX')}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Photo Modal */}
            {selectedPhoto && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80 p-4"
                    onClick={() => setSelectedPhoto(null)}
                >
                    <div className="max-w-4xl w-full bg-white rounded-lg overflow-hidden" onClick={(e) => e.stopPropagation()}>
                        <img src={selectedPhoto.url} alt="Foto" className="w-full h-auto" />
                        {selectedPhoto.metadata && (
                            <div className="p-4 bg-gray-50 border-t">
                                <h3 className="font-bold mb-2">Metadata de la Foto</h3>
                                <div className="grid grid-cols-2 gap-3 text-sm">
                                    {selectedPhoto.metadata.dateTaken && (
                                        <div>
                                            <p className="text-gray-600">Fecha Tomada</p>
                                            <p className="font-semibold">
                                                {new Date(selectedPhoto.metadata.dateTaken).toLocaleString('es-MX')}
                                            </p>
                                        </div>
                                    )}
                                    {selectedPhoto.metadata.camera && (
                                        <div>
                                            <p className="text-gray-600">Cámara</p>
                                            <p className="font-semibold">{selectedPhoto.metadata.camera}</p>
                                        </div>
                                    )}
                                    {selectedPhoto.metadata.location && (
                                        <div className="col-span-2">
                                            <p className="text-gray-600">Ubicación GPS</p>
                                            <p className="font-semibold">{selectedPhoto.metadata.location}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                        <div className="p-4 bg-gray-100 flex justify-end">
                            <button
                                onClick={() => setSelectedPhoto(null)}
                                className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900"
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const getStatusLabel = (status: string): string => {
    const labels: Record<string, string> = {
        'draft': 'Borrador',
        'in_inspection': 'En Inspección',
        'offer_made': 'Oferta Enviada',
        'accepted': 'Aceptado',
        'rejected': 'Rechazado',
        'completed': 'Completado'
    };
    return labels[status] || status;
};

const getStatusBadgeColor = (status: string): string => {
    const colors: Record<string, string> = {
        'draft': 'bg-gray-100 text-gray-800',
        'in_inspection': 'bg-yellow-100 text-yellow-800',
        'offer_made': 'bg-purple-100 text-purple-800',
        'accepted': 'bg-blue-100 text-blue-800',
        'rejected': 'bg-red-100 text-red-800',
        'completed': 'bg-green-100 text-green-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
};

export default VehicleForSaleDetailPage;
