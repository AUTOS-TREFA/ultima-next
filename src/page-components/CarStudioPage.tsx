'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import VehicleService from '../services/VehicleService';
import CarStudioService, { CarStudioApiError } from '../services/CarStudioService';
import type { WordPressVehicle } from '../types/types';
import { Loader2, Send, ServerCrash, Info, Trash2, Camera, History, Layers } from 'lucide-react';
import LazyImage from '../components/LazyImage';
import { DEFAULT_PLACEHOLDER_IMAGE } from '../utils/constants';
import { ImageService } from '../services/ImageService';
import { SaveIcon } from '../components/icons';

type SubTab = 'generator' | 'webEditorHistory' | 'orderHistory';

const InputField: React.FC<{
    id: string;
    label: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    placeholder?: string;
    type?: string;
}> = ({ id, label, value, onChange, placeholder, type = "text" }) => (
    <div>
        <label htmlFor={id} className="text-sm font-medium text-gray-700">{label}</label>
        <input
            id={id}
            type={type}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            className="mt-1 w-full bg-white text-gray-900 rounded-lg px-4 py-2.5 border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
    </div>
);

const CarStudioPage: React.FC = () => {
    const [activeSubTab, setActiveSubTab] = useState<SubTab>('generator');
    const { data, isLoading, error } = useQuery({
        queryKey: ['vehicles-car-studio'],
        queryFn: () => VehicleService.getAllVehicles(),
    });

    const vehicles = data?.vehicles || [];
    const globalError = error ? String(error) : null;

    const subTabs = [
        { id: 'generator', label: 'Generar Imágenes', icon: Camera },
        { id: 'webEditorHistory', label: 'Historial Web Editor', icon: History },
        { id: 'orderHistory', label: 'Historial de Órdenes', icon: Layers },
    ];

    return (
        <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Depurador de API Car Studio</h1>
                <p className="mt-2 text-gray-600">Herramientas para procesar imágenes y consultar historiales de la API de Car Studio.</p>
            </div>

             <div className="border-b border-gray-200 mb-8">
                <nav className="-mb-px flex space-x-6 overflow-x-auto">
                    {subTabs.map(tab => (
                        <button key={tab.id} onClick={() => setActiveSubTab(tab.id as SubTab)}
                            className={`whitespace-nowrap flex items-center gap-2 py-4 px-1 border-b-2 font-semibold text-sm transition-colors ${activeSubTab === tab.id ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                           <tab.icon className="w-5 h-5" />
                           {tab.label}
                        </button>
                    ))}
                </nav>
            </div>
            
            {activeSubTab === 'generator' && <ImageGeneratorTab vehicles={vehicles} isLoading={isLoading} globalError={globalError} />}
            {activeSubTab === 'webEditorHistory' && <WebEditorHistoryTab />}
            {activeSubTab === 'orderHistory' && <OrderHistoryTab vehicles={vehicles} />}

        </div>
    );
};

// =================================================================================
// TABS & SUB-COMPONENTS
// =================================================================================

const ImageComparison: React.FC<{
    images: { original: string; processed: string }[];
    onSave: () => void;
    onDiscard: () => void;
    saveStatus: 'idle' | 'saving' | 'success' | 'error';
    saveError: string | null;
    replaceFeatureImage: boolean;
    onToggleFeatureImage: (checked: boolean) => void;
}> = ({ images, onSave, onDiscard, saveStatus, saveError, replaceFeatureImage, onToggleFeatureImage }) => {
    const [viewMode, setViewMode] = useState<'grid' | 'slider'>('grid');

    return (
        <div className="mt-4 space-y-4 pt-4 border-t">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-600">Revisa y Confirma las Imágenes</h3>
                <div className="flex gap-2">
                    <button
                        onClick={() => setViewMode('grid')}
                        className={`px-3 py-1 text-xs rounded ${viewMode === 'grid' ? 'bg-primary-500 text-white' : 'bg-gray-200 text-gray-700'}`}
                    >
                        Grid
                    </button>
                    <button
                        onClick={() => setViewMode('slider')}
                        className={`px-3 py-1 text-xs rounded ${viewMode === 'slider' ? 'bg-primary-500 text-white' : 'bg-gray-200 text-gray-700'}`}
                    >
                        Slider
                    </button>
                </div>
            </div>

            <div className="max-h-[800px] overflow-y-auto space-y-4 pr-2">
                {viewMode === 'grid' ? (
                    images.map((img, index) => (
                        <div key={index} className="grid grid-cols-2 gap-4 p-4 border rounded-lg bg-gray-50">
                            <div>
                                <p className="text-sm text-center mb-2 font-medium text-gray-600">Original</p>
                                <LazyImage src={img.original} alt="Original" className="w-full h-96 rounded object-cover" />
                            </div>
                            <div>
                                <p className="text-sm text-center mb-2 font-medium text-gray-600">Procesada</p>
                                <LazyImage src={img.processed} alt="Processed" className="w-full h-96 rounded object-cover" />
                            </div>
                        </div>
                    ))
                ) : (
                    <ImageSlider images={images} />
                )}
            </div>

            <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <input
                    type="checkbox"
                    id="replaceFeatureImage"
                    checked={replaceFeatureImage}
                    onChange={(e) => onToggleFeatureImage(e.target.checked)}
                    className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                />
                <label htmlFor="replaceFeatureImage" className="text-sm text-gray-700 cursor-pointer">
                    Reemplazar imagen destacada con la imagen RIGHT_FRONT (o FRONT si no está disponible)
                </label>
            </div>

            <div className="flex gap-4">
                <button
                    onClick={onSave}
                    disabled={saveStatus === 'saving'}
                    className="w-full flex items-center justify-center gap-2 bg-green-600 text-white font-semibold py-2.5 rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors"
                >
                    {saveStatus === 'saving' ? <Loader2 className="w-5 h-5 animate-spin" /> : <SaveIcon className="w-5 h-5" />}
                    {saveStatus === 'saving' ? 'Guardando...' : 'Guardar y Reemplazar'}
                </button>
                <button
                    onClick={onDiscard}
                    className="w-full flex items-center justify-center gap-2 bg-red-600 text-white font-semibold py-2.5 rounded-lg hover:bg-red-700 transition-colors"
                >
                    <Trash2 className="w-5 h-5" />
                    Descartar
                </button>
            </div>
            {saveStatus === 'success' && (
                <p className="p-2 text-center bg-green-100 text-sm text-green-800 rounded-md font-medium">
                    ¡Imágenes guardadas exitosamente!
                </p>
            )}
            {saveStatus === 'error' && <ErrorDisplay title="Error al Guardar" message={saveError || 'Ocurrió un error desconocido.'} />}
        </div>
    );
};

const ImageSlider: React.FC<{ images: { original: string; processed: string }[] }> = ({ images }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [sliderPosition, setSliderPosition] = useState(50);

    const handleNext = () => setCurrentIndex((prev) => (prev + 1) % images.length);
    const handlePrev = () => setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);

    return (
        <div className="space-y-3">
            <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden">
                <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}>
                    <img src={images[currentIndex].processed} alt="Processed" className="w-full h-full object-cover" />
                </div>
                <div className="absolute inset-0">
                    <img src={images[currentIndex].original} alt="Original" className="w-full h-full object-cover" />
                </div>
                <div
                    className="absolute inset-y-0 w-1 bg-white cursor-ew-resize shadow-lg"
                    style={{ left: `${sliderPosition}%` }}
                    onMouseDown={(e) => {
                        const handleMouseMove = (moveEvent: MouseEvent) => {
                            const rect = e.currentTarget.parentElement!.getBoundingClientRect();
                            const x = moveEvent.clientX - rect.left;
                            const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
                            setSliderPosition(percentage);
                        };
                        const handleMouseUp = () => {
                            document.removeEventListener('mousemove', handleMouseMove);
                            document.removeEventListener('mouseup', handleMouseUp);
                        };
                        document.addEventListener('mousemove', handleMouseMove);
                        document.addEventListener('mouseup', handleMouseUp);
                    }}
                >
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center">
                        <div className="text-xs">⟷</div>
                    </div>
                </div>
                <div className="absolute top-2 left-2 bg-black/60 text-white px-2 py-1 rounded text-xs">Original</div>
                <div className="absolute top-2 right-2 bg-black/60 text-white px-2 py-1 rounded text-xs">Procesada</div>
            </div>
            <div className="flex items-center justify-between">
                <button onClick={handlePrev} className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 text-sm">
                    ← Anterior
                </button>
                <span className="text-sm text-gray-600">
                    {currentIndex + 1} / {images.length}
                </span>
                <button onClick={handleNext} className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 text-sm">
                    Siguiente →
                </button>
            </div>
        </div>
    );
};

interface ImageGeneratorTabProps {
    vehicles: WordPressVehicle[];
    isLoading: boolean;
    globalError: string | null;
}

const ImageGeneratorTab: React.FC<ImageGeneratorTabProps> = ({ vehicles, isLoading, globalError }) => {
    const queryClient = useQueryClient();

    // Filter vehicles to show only those with galleries (exterior photos)
    const vehiclesWithGalleries = vehicles.filter(v => {
        const exteriorImages = (v.galeria_exterior || v.fotos_exterior_url || []).filter((url): url is string =>
            !!url && url !== DEFAULT_PLACEHOLDER_IMAGE
        );
        return exteriorImages.length > 0;
    });

    // Component State
    const [selectedVehicle, setSelectedVehicle] = useState<WordPressVehicle | null>(null);
    const [availableImages, setAvailableImages] = useState<string[]>([]);
    const [selectedImageIndices, setSelectedImageIndices] = useState<Set<number>>(new Set());
    const [uploadImages, setUploadImages] = useState<{ fileUrl: string; position: string }[]>([]);
    const [replaceFeatureImage, setReplaceFeatureImage] = useState<boolean>(true); // Default to true (checked)

    const [requestStatus, setRequestStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [apiResponse, setApiResponse] = useState<string | null>(null);
    const [interpretedError, setInterpretedError] = useState<string | null>(null);
    const [comparisonImages, setComparisonImages] = useState<{ original: string, processed: string }[]>([]);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
    const [saveError, setSaveError] = useState<string | null>(null);

     const handleSelectVehicle = (vehicle: WordPressVehicle) => {
        setSelectedVehicle(vehicle);
        setApiResponse(null);
        setRequestStatus('idle');
        setInterpretedError(null);
        setSaveStatus('idle');
        setSaveError(null);
        setComparisonImages([]);
        setReplaceFeatureImage(true); // Default to checked

        const exteriorImages = (vehicle.galeria_exterior || vehicle.fotos_exterior_url || []).filter((url): url is string => !!url && url !== DEFAULT_PLACEHOLDER_IMAGE);

        // Set available images but don't auto-select any
        setAvailableImages(exteriorImages.slice(0, 15));
        setSelectedImageIndices(new Set());
        setUploadImages([]);
    };

    const toggleImageSelection = (index: number) => {
        const newSelection = new Set(selectedImageIndices);
        const positions = ['FRONT', 'RIGHT_FRONT', 'RIGHT_SIDE', 'RIGHT_BACK', 'BACK', 'LEFT_BACK', 'LEFT_SIDE', 'LEFT_FRONT', 'CENTRAL_DASH', 'STEERING_WHEEL', 'LEFT_DRIVER_DOOR_OPEN', 'LEFT_REAR_DOOR_OPEN', 'RIGHT_PASSENGER_DOOR_OPEN', 'CEELING_FEATURES', 'OTHER'];

        if (newSelection.has(index)) {
            // Remove from selection
            newSelection.delete(index);
            // Remove from uploadImages
            setUploadImages(prev => prev.filter(img => img.fileUrl !== availableImages[index]));
        } else {
            // Add to selection
            newSelection.add(index);
            // Find next available position that isn't already used
            const usedPositions = new Set(uploadImages.map(img => img.position));
            const availablePosition = positions.find(pos => !usedPositions.has(pos)) || positions[0];
            // Add to uploadImages with default position
            setUploadImages(prev => [...prev, { fileUrl: availableImages[index], position: availablePosition }]);
        }
        setSelectedImageIndices(newSelection);
    };

    const selectAllImages = () => {
        const allIndices = new Set(availableImages.map((_, i) => i));
        setSelectedImageIndices(allIndices);
        const positions = ['FRONT', 'RIGHT_FRONT', 'RIGHT_SIDE', 'RIGHT_BACK', 'BACK', 'LEFT_BACK', 'LEFT_SIDE', 'LEFT_FRONT', 'CENTRAL_DASH', 'STEERING_WHEEL', 'LEFT_DRIVER_DOOR_OPEN', 'LEFT_REAR_DOOR_OPEN', 'RIGHT_PASSENGER_DOOR_OPEN', 'CEELING_FEATURES', 'OTHER'];
        setUploadImages(availableImages.map((url, idx) => ({ fileUrl: url, position: positions[idx % positions.length] })));
    };

    const deselectAllImages = () => {
        setSelectedImageIndices(new Set());
        setUploadImages([]);
    };

    const updateImagePosition = (imageUrl: string, newPosition: string) => {
        setUploadImages(prev => prev.map(img =>
            img.fileUrl === imageUrl ? { ...img, position: newPosition } : img
        ));
    };

    const handleSendRequest = useCallback(async () => {
        if (!selectedVehicle || uploadImages.length === 0) return;
        setRequestStatus('loading');
        setApiResponse(null);
        setInterpretedError(null);
        setComparisonImages([]);
        setSaveStatus('idle');
        setSaveError(null);

        try {
            const options: any = {
                fileExtension: 'JPG',
                blurBackground: false,
                traceId: `vehicle_${selectedVehicle.id}`, // Track vehicle ID for history
            };

            console.log('Sending images to CarStudio:');
            console.log('- Total images:', uploadImages.length);
            uploadImages.forEach((img, idx) => {
                console.log(`  [${idx}] Position: ${img.position}, URL: ${img.fileUrl}`);
            });
            console.log('- Options:', options);

            const response = await CarStudioService.uploadImagesWithUrlV2(uploadImages, options);

            console.log('CarStudio API Response:', response);
            console.log('Response structure check - has return?:', !!response.return);
            console.log('Response structure check - return keys:', response.return ? Object.keys(response.return) : 'N/A');

            // Check for faulty images first (CarStudio AI failures)
            const faultyImages = response.return?.faultyImages || [];
            const hasProcessedImages = response.return?.afterStudioImages && response.return.afterStudioImages.length > 0;

            if (faultyImages.length > 0) {
                // Extract error details from faulty images
                const faultyErrors = faultyImages.map((img: any) =>
                    `${img.errorCode || 'ERROR'}: ${img.errorMessage || 'Unknown error'}`
                );

                const errorMsg = `⚠️ CarStudio AI no pudo procesar ${faultyImages.length} imagen(es):\n\n` +
                    faultyErrors.join('\n') +
                    '\n\n🔍 Posibles causas:\n' +
                    '• La imagen no contiene un vehículo claramente visible\n' +
                    '• El fondo es demasiado complejo para el AI\n' +
                    '• La calidad de la imagen es muy baja (< 800px)\n' +
                    '• La imagen está muy borrosa, sobreexpuesta o mal iluminada\n' +
                    '• El vehículo está parcialmente oculto o cortado\n' +
                    '• La imagen tiene marca de agua o texto sobre el vehículo\n\n' +
                    '✅ Recomendaciones:\n' +
                    '• Usa imágenes con el vehículo completo y centrado\n' +
                    '• Preferir fondos simples y uniformes\n' +
                    '• Buena iluminación natural o de estudio\n' +
                    '• Mínimo 1200x800px de resolución\n' +
                    '• Formato JPG o PNG sin compresión excesiva';

                setInterpretedError(errorMsg);
                setApiResponse(JSON.stringify(response, null, 2));
                setRequestStatus('error');
            } else if (hasProcessedImages) {
                // Success: images were processed
                const originalUrls = uploadImages.map(img => img.fileUrl);
                const processedUrls = response.return.afterStudioImages.map((img: any) => img.imageUrl);
                const comparisons = processedUrls.map((pUrl: string, index: number) => ({ original: originalUrls[index], processed: pUrl }));
                setComparisonImages(comparisons);
                setApiResponse(JSON.stringify(response, null, 2));
                setRequestStatus('success');
            } else {
                // No processed images and no faulty images - check beforeStudioImages for errors
                const errors = response.return?.beforeStudioImages
                    ?.filter((img: any) => img.errorMessage)
                    .map((img: any) => img.errorMessage) || [];

                // Check if response.return exists at all
                if (!response.return) {
                    const errorMsg = '❌ NO RESPONSE: AI response parsing failed\n\n' +
                        '🔍 La estructura de respuesta de CarStudio AI no es reconocida.\n\n' +
                        '⚠️ Posibles causas:\n' +
                        '• El API de CarStudio cambió su formato de respuesta\n' +
                        '• Error de autenticación con el servicio\n' +
                        '• Las imágenes no cumplen los requisitos del AI\n\n' +
                        '📋 Detalles técnicos:\n' +
                        `Response keys: ${Object.keys(response).join(', ')}\n\n` +
                        '💡 Revisa la consola del navegador y la respuesta completa abajo para más detalles.';
                    setInterpretedError(errorMsg);
                    setApiResponse(JSON.stringify(response, null, 2));
                    setRequestStatus('error');
                } else {
                    const errorMsg = errors.length > 0
                        ? `Error procesando imágenes: ${errors.join(', ')}. Verifica que las URLs sean accesibles públicamente y que las imágenes sean JPG o PNG.`
                        : 'No se generaron imágenes procesadas. Verifica que las URLs sean accesibles públicamente.';

                    setInterpretedError(errorMsg);
                    setApiResponse(JSON.stringify(response, null, 2));
                    setRequestStatus('error');
                }
            }
        } catch (error: any) {
            setRequestStatus('error');
            if (error instanceof CarStudioApiError) {
                setInterpretedError(error.interpretedMessage);
                setApiResponse(JSON.stringify(error.rawResponse, null, 2));
            } else {
                setInterpretedError(error.message);
                setApiResponse(JSON.stringify({ status: 'client_error', message: error.message }, null, 2));
            }
        }
    }, [selectedVehicle, uploadImages]);

    const handleSaveImages = useCallback(async () => {
        if (!selectedVehicle || comparisonImages.length === 0) return;
        setSaveStatus('saving');
        setSaveError(null);
        try {
            const processedUrls = comparisonImages.map(img => img.processed);

            // Find the feature image to use (prefer RIGHT_FRONT, then FRONT, then first image)
            let featureImageUrl: string | undefined;
            if (replaceFeatureImage) {
                // Find the index of RIGHT_FRONT in uploadImages
                const rightFrontIndex = uploadImages.findIndex(img => img.position === 'RIGHT_FRONT');
                const frontIndex = uploadImages.findIndex(img => img.position === 'FRONT');

                if (rightFrontIndex !== -1 && rightFrontIndex < processedUrls.length) {
                    featureImageUrl = processedUrls[rightFrontIndex];
                    console.log(`Using RIGHT_FRONT as feature image (index ${rightFrontIndex})`);
                } else if (frontIndex !== -1 && frontIndex < processedUrls.length) {
                    featureImageUrl = processedUrls[frontIndex];
                    console.log(`RIGHT_FRONT not found, using FRONT as feature image (index ${frontIndex})`);
                } else {
                    featureImageUrl = processedUrls[0];
                    console.log('RIGHT_FRONT and FRONT not found, using first image as feature image');
                }
            }

            await ImageService.processAndSaveImages(
                selectedVehicle.id,
                processedUrls,
                featureImageUrl
            );

            // Invalidate React Query cache to force refetch updated vehicle data
            queryClient.invalidateQueries({ queryKey: ['vehicles-car-studio'] });
            queryClient.invalidateQueries({ queryKey: ['all-vehicles-car-studio-unpaginated'] });

            setSaveStatus('success');
            setTimeout(() => {
                setComparisonImages([]);
                setRequestStatus('idle');
                setReplaceFeatureImage(true); // Keep it checked for next time
            }, 2000);
        } catch (error: any) {
            setSaveStatus('error');
            setSaveError(error.message || 'An unknown error occurred.');
        }
    }, [selectedVehicle, comparisonImages, replaceFeatureImage, uploadImages, queryClient]);

    const handleDiscardImages = () => {
        setComparisonImages([]);
        setRequestStatus('idle');
    };

    const isSendDisabled = requestStatus === 'loading' || !selectedVehicle || uploadImages.length === 0;

    return (
         <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            <div className="lg:col-span-1 space-y-4 h-[calc(100vh-16rem)] overflow-y-auto pr-2">
                <h3 className="font-semibold text-gray-800">1. Selecciona un auto</h3>
                 {isLoading ? (
                    <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-primary-500" /></div>
                ) : globalError ? (
                    <ErrorDisplay title="Fallo al Cargar autos" message={globalError} />
                ) : vehiclesWithGalleries.length === 0 ? (
                    <div className="p-4 bg-gray-50 rounded-lg text-center text-gray-500">
                        No hay vehículos con galerías disponibles
                    </div>
                ) : (
                    vehiclesWithGalleries.map(vehicle => (
                        <div key={vehicle.id} className={`w-full text-left bg-white rounded-xl shadow-sm border p-4 transition-all duration-200 ${selectedVehicle?.id === vehicle.id ? 'border-primary-500 ring-2 ring-primary-500/50' : 'border-gray-200'}`}>
                            <button onClick={() => handleSelectVehicle(vehicle)} className='w-full text-left'>
                                <h2 className="font-bold text-gray-800 truncate">{vehicle.title}</h2>
                                <p className="text-sm text-gray-500 mb-2">ID: {vehicle.id}</p>
                            </button>
                        </div>
                    ))
                )}
            </div>
            <div className="lg:col-span-2 sticky top-24">
                 <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
                    <h2 className="text-xl font-bold text-gray-800">2. Configura y Envía</h2>

                    <div className="space-y-4 pt-4 border-t">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-medium text-gray-700">Seleccionar Imágenes ({selectedImageIndices.size}/{availableImages.length})</h3>
                            <div className="flex gap-2">
                                <button
                                    onClick={selectAllImages}
                                    disabled={availableImages.length === 0}
                                    className="px-3 py-1 text-xs bg-primary-100 text-primary-700 rounded hover:bg-primary-200 disabled:opacity-50"
                                >
                                    Seleccionar Todas
                                </button>
                                <button
                                    onClick={deselectAllImages}
                                    disabled={selectedImageIndices.size === 0}
                                    className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50"
                                >
                                    Deseleccionar Todas
                                </button>
                            </div>
                        </div>
                        {availableImages.length === 0 ? (
                            <div className="p-4 bg-gray-50 rounded-lg text-center text-gray-500 text-sm">
                                Selecciona un vehículo para ver sus imágenes
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-2">
                                {availableImages.map((imageUrl, index) => (
                                    <div
                                        key={index}
                                        className={`relative p-2 border-2 rounded-md cursor-pointer transition-all ${
                                            selectedImageIndices.has(index)
                                                ? 'border-primary-500 bg-primary-50'
                                                : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                                        }`}
                                        onClick={() => toggleImageSelection(index)}
                                    >
                                        <div className="absolute top-3 left-3 z-10">
                                            <input
                                                type="checkbox"
                                                checked={selectedImageIndices.has(index)}
                                                onChange={() => toggleImageSelection(index)}
                                                className="w-5 h-5 text-primary-600 rounded focus:ring-primary-500 cursor-pointer"
                                                onClick={(e) => e.stopPropagation()}
                                            />
                                        </div>
                                        <img
                                            src={imageUrl}
                                            alt={`Imagen ${index + 1}`}
                                            className="w-full h-32 object-contain rounded bg-gray-50"
                                        />
                                        <div className="mt-2 space-y-1">
                                            <p className="text-xs text-center text-gray-600">Imagen {index + 1}</p>
                                            {selectedImageIndices.has(index) && (
                                                <select
                                                    value={uploadImages.find(img => img.fileUrl === imageUrl)?.position || 'FRONT'}
                                                    onChange={(e) => {
                                                        e.stopPropagation();
                                                        updateImagePosition(imageUrl, e.target.value);
                                                    }}
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="w-full text-xs px-2 py-1 border border-primary-300 rounded bg-white text-gray-700 focus:ring-1 focus:ring-primary-500"
                                                >
                                                    <option value="FRONT">FRONT</option>
                                                    <option value="RIGHT_FRONT">RIGHT_FRONT</option>
                                                    <option value="RIGHT_SIDE">RIGHT_SIDE</option>
                                                    <option value="RIGHT_BACK">RIGHT_BACK</option>
                                                    <option value="BACK">BACK</option>
                                                    <option value="LEFT_BACK">LEFT_BACK</option>
                                                    <option value="LEFT_SIDE">LEFT_SIDE</option>
                                                    <option value="LEFT_FRONT">LEFT_FRONT</option>
                                                    <option value="CENTRAL_DASH">CENTRAL_DASH</option>
                                                    <option value="STEERING_WHEEL">STEERING_WHEEL</option>
                                                    <option value="LEFT_DRIVER_DOOR_OPEN">LEFT_DRIVER_DOOR_OPEN</option>
                                                    <option value="LEFT_REAR_DOOR_OPEN">LEFT_REAR_DOOR_OPEN</option>
                                                    <option value="RIGHT_PASSENGER_DOOR_OPEN">RIGHT_PASSENGER_DOOR_OPEN</option>
                                                    <option value="CEELING_FEATURES">CEELING_FEATURES</option>
                                                    <option value="OTHER">OTHER</option>
                                                </select>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                     <button onClick={handleSendRequest} disabled={isSendDisabled} className="w-full flex items-center justify-center gap-2 py-3 bg-primary-600 text-white font-bold rounded-lg hover:bg-primary-700 disabled:opacity-50">
                        {requestStatus === 'loading' ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                        {requestStatus === 'loading' ? 'Enviando...' : 'Enviar Petición'}
                    </button>
                    {interpretedError && <ErrorDisplay title="Error de API" message={interpretedError} />}
                    {apiResponse && <ApiResponseViewer response={apiResponse} />}

                    {comparisonImages.length > 0 && selectedVehicle && (
                        <ImageComparison
                            images={comparisonImages}
                            onSave={handleSaveImages}
                            onDiscard={handleDiscardImages}
                            saveStatus={saveStatus}
                            saveError={saveError}
                            replaceFeatureImage={replaceFeatureImage}
                            onToggleFeatureImage={setReplaceFeatureImage}
                        />
                    )}
                 </div>
            </div>
        </div>
    );
};

const WebEditorHistoryTab: React.FC = () => {
    const queryClient = useQueryClient();
    const [history, setHistory] = useState<any | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [params] = useState({ pageNumber: 0, limit: 10, sortBy: 'createdDate', direction: 'DESC' as 'ASC' | 'DESC' });

    const [saveStatus, setSaveStatus] = useState<{[key: string]: 'idle' | 'saving' | 'success' | 'error'}>({});
    const [saveError, setSaveError] = useState<{[key: string]: string}>({});
    const [selectedVehicleId, setSelectedVehicleId] = useState<{[key: string]: number | null}>({});

    // Extract vehicle ID from traceId (format: "vehicle_123")
    const extractVehicleId = (traceId?: string): number | null => {
        if (!traceId) return null;
        const match = traceId.match(/^vehicle_(\d+)$/);
        return match ? parseInt(match[1], 10) : null;
    };

    // Fetch ALL vehicles by requesting multiple pages (21 vehicles per page)
    // Fetching 10 pages = up to 210 vehicles to ensure comprehensive coverage
    const { data: vehiclesData } = useQuery({
        queryKey: ['all-vehicles-car-studio-unpaginated'],
        queryFn: async () => {
            const pagePromises = Array.from({ length: 10 }, (_, i) =>
                VehicleService.getAllVehicles({}, i + 1)
            );
            const results = await Promise.all(pagePromises);

            // Combine all vehicles from all pages and deduplicate by ID
            const allVehicles = results.flatMap(r => r.vehicles);
            const uniqueVehicles = Array.from(
                new Map(allVehicles.map(v => [v.id, v])).values()
            );

            return {
                vehicles: uniqueVehicles,
                totalCount: results[0]?.totalCount || uniqueVehicles.length
            };
        },
        staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    });
    const vehicles = vehiclesData?.vehicles || [];

    const fetchHistory = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await CarStudioService.listWebEditorRecords(params);
            setHistory(response);

            // Pre-select vehicles based on traceId
            if (response?.content) {
                const preSelectedVehicles: {[key: string]: number | null} = {};
                response.content.forEach((item: any) => {
                    const itemId = item._id;
                    const vehicleId = extractVehicleId(item.carStudio?.traceId);
                    if (vehicleId) {
                        preSelectedVehicles[itemId] = vehicleId;
                    }
                });
                setSelectedVehicleId(preSelectedVehicles);
            }
        } catch (e: any) {
            setError(e.message || "Failed to fetch web editor history.");
        } finally {
            setLoading(false);
        }
    }, [params]);

    useEffect(() => {
        fetchHistory();
    }, [fetchHistory]);

    const handleReplaceImages = async (itemId: string, images: string[]) => {
        const vehicleId = selectedVehicleId[itemId];
        if (!vehicleId || !images || images.length === 0) return;

        setSaveStatus(prev => ({...prev, [itemId]: 'saving'}));
        setSaveError(prev => ({...prev, [itemId]: ''}));

        try {
            // Note: History doesn't preserve position metadata, so we use the first image
            // In the future, consider storing position data in Car Studio projects
            await ImageService.processAndSaveImages(vehicleId, images, images[0]);

            // Invalidate React Query cache to force refetch updated vehicle data
            queryClient.invalidateQueries({ queryKey: ['vehicles-car-studio'] });
            queryClient.invalidateQueries({ queryKey: ['all-vehicles-car-studio'] });

            setSaveStatus(prev => ({...prev, [itemId]: 'success'}));
            setTimeout(() => {
                setSaveStatus(prev => ({...prev, [itemId]: 'idle'}));
            }, 2000);
        } catch (e: any) {
            setSaveStatus(prev => ({...prev, [itemId]: 'error'}));
            setSaveError(prev => ({...prev, [itemId]: e.message || 'Error desconocido'}));
        }
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Historial de Trabajos (Web Editor)</h2>
            {loading && <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-primary-500" /></div>}
            {error && <ErrorDisplay title="Error al Cargar Historial" message={error} />}
            {history && history.content && (
                <div className="space-y-4">
                    {history.content.map((item: any) => {
                        const itemId = item._id;
                        const processedImages = item.carStudio.afterStudioImages?.map((img: any) => img.afterStudioImageUrl) || [];
                        const trackedVehicleId = extractVehicleId(item.carStudio?.traceId);
                        const trackedVehicle = trackedVehicleId ? vehicles.find((v: any) => v.id === trackedVehicleId) : null;

                        return (
                            <div key={itemId} className="p-4 border rounded-lg space-y-3">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h3 className="font-semibold">{item.carStudio.projectName || `Trabajo ID: ${item.carStudio._id.slice(-6)}`}</h3>
                                        <p className="text-xs text-gray-500">Fecha: {new Date(item.carStudio.createdDate).toLocaleString()}</p>
                                        {trackedVehicle && (
                                            <div className="mt-1 inline-flex items-center gap-1 px-2 py-1 bg-primary-50 text-primary-700 rounded-md text-xs font-medium">
                                                <Camera className="w-3 h-3" />
                                                {trackedVehicle.title}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2">
                                    {item.carStudio.afterStudioImages?.map((img: any, idx: number) => (
                                        <a key={idx} href={img.afterStudioImageUrl} target="_blank" rel="noopener noreferrer">
                                            <LazyImage src={img.afterStudioImageUrl} alt={`Processed image ${idx+1}`} className="aspect-square rounded-md" />
                                        </a>
                                    ))}
                                </div>

                                {/* Replace Images Section */}
                                <div className="flex items-center gap-3 pt-3 border-t">
                                    <select
                                        value={selectedVehicleId[itemId] || ''}
                                        onChange={(e) => setSelectedVehicleId(prev => ({...prev, [itemId]: Number(e.target.value)}))}
                                        className="flex-1 px-3 py-2 border rounded-md text-sm"
                                    >
                                        <option value="">Seleccionar vehículo... ({vehicles.length} disponibles)</option>
                                        {vehicles.map((v: any) => (
                                            <option key={v.id} value={v.id}>
                                                {v.title} - {v.marca || ''} {v.modelo || ''} {v.anio || ''} (ID: {v.id})
                                            </option>
                                        ))}
                                    </select>
                                    <button
                                        onClick={() => handleReplaceImages(itemId, processedImages)}
                                        disabled={!selectedVehicleId[itemId] || saveStatus[itemId] === 'saving'}
                                        className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium flex items-center gap-2"
                                    >
                                        {saveStatus[itemId] === 'saving' ? (
                                            <><Loader2 className="w-4 h-4 animate-spin" /> Guardando...</>
                                        ) : (
                                            <><SaveIcon className="w-4 h-4" /> Reemplazar</>
                                        )}
                                    </button>
                                </div>
                                {saveStatus[itemId] === 'success' && (
                                    <p className="text-sm text-green-600 font-medium">¡Imágenes reemplazadas exitosamente!</p>
                                )}
                                {saveStatus[itemId] === 'error' && (
                                    <p className="text-sm text-red-600">{saveError[itemId]}</p>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

interface OrderHistoryTabProps {
    vehicles: WordPressVehicle[];
}

const OrderHistoryTab: React.FC<OrderHistoryTabProps> = ({ vehicles: _vehicles }) => {
    // Implementation for this tab would be similar to WebEditorHistoryTab
    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Historial de Órdenes (por Usuario)</h2>
            <InfoBox title="En Construcción">
                <p>Esta sección te permitirá ver las órdenes de procesamiento asociadas a tu cuenta, visualizar los resultados y asignarlos a un vehículo del inventario.</p>
            </InfoBox>
        </div>
    );
};


const ApiResponseViewer: React.FC<{ response: string }> = ({ response }) => (
    <div>
        <h3 className="text-sm font-semibold text-gray-600 mb-2 flex items-center gap-2"><ServerCrash className="w-4 h-4" /> Respuesta API</h3>
        <pre className="bg-gray-800 text-white p-4 rounded-md text-xs overflow-x-auto h-48"><code>{response}</code></pre>
    </div>
);

const ErrorDisplay: React.FC<{ title: string; message: string }> = ({ title, message }) => (
    <div className="p-3 bg-red-50 text-red-800 border-l-4 border-red-400">
        <p className="font-bold">{title}</p>
        <p className="text-sm mt-1">{message}</p>
    </div>
);

const InfoBox: React.FC<{title: string, children: React.ReactNode}> = ({ title, children }) => (
    <div className="mt-4 bg-blue-50 border-l-4 border-blue-400 text-blue-800 p-4 rounded-r-lg">
        <h4 className="font-bold flex items-center"><Info className="w-5 h-5 mr-2" />{title}</h4>
        <div className="text-sm mt-2 space-y-2 prose prose-sm max-w-none">{children}</div>
    </div>
);


export default CarStudioPage;