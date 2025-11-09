'use client';

import React, { useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Loader2, UploadCloud, Image as ImageIcon, AlertTriangle, CheckCircle } from 'lucide-react';
import AirtableDirectService from '../services/AirtableDirectService';
import StorageService from '../services/StorageService';

const DropzoneField: React.FC<{
  fieldName: string;
  onDrop: (files: File[]) => void;
  uploading: boolean;
  uploadedFile: File | null;
  error: string | null;
}> = ({ fieldName, onDrop, uploading, uploadedFile, error }) => {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpeg', '.jpg', '.png'] },
    multiple: false,
    disabled: uploading,
  });

  const getBorderColor = () => {
    if (isDragActive) return 'border-primary-600 bg-primary-50';
    if (error) return 'border-red-500 bg-red-50';
    if (uploadedFile) return 'border-green-500 bg-green-50';
    return 'border-gray-300 hover:border-primary-500';
  };

  return (
    <div {...getRootProps()} className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${getBorderColor()}`}>
      <input {...getInputProps()} />
      {uploading ? (
        <div className="flex flex-col items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
          <p className="mt-2 text-sm text-gray-500">Subiendo...</p>
        </div>
      ) : error ? (
         <div className="flex flex-col items-center justify-center">
          <AlertTriangle className="w-8 h-8 text-red-500" />
          <p className="mt-2 text-sm text-red-700">{error}</p>
        </div>
      ) : uploadedFile ? (
        <div className="flex flex-col items-center justify-center">
          <ImageIcon className="w-8 h-8 text-green-500" />
          <p className="mt-2 text-sm text-gray-700 truncate">{uploadedFile.name}</p>
          <p className="text-xs text-green-600">¡Subido!</p>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center">
          <UploadCloud className="w-8 h-8 text-gray-400" />
          <p className="mt-2 text-sm text-gray-500">Arrastra o haz clic para subir a <span className="font-semibold">{fieldName}</span></p>
          <p className="text-xs text-gray-400">PNG, JPG, JPEG</p>
        </div>
      )}
    </div>
  );
};

const AirtableImageUploader: React.FC = () => {
  const [vehicles, setVehicles] = useState<{ id: string; ordenCompra: string }[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [uploads, setUploads] = useState<{ [key: string]: { file: File | null; uploading: boolean; error: string | null } }>({
    Foto: { file: null, uploading: false, error: null },
    fotos_exterior_archivos: { file: null, uploading: false, error: null },
    fotos_interior_archivos: { file: null, uploading: false, error: null },
  });
  const [globalStatus, setGlobalStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  useEffect(() => {
    const fetchVehicles = async () => {
      setLoading(true);
      try {
        const data = await AirtableDirectService.getVehiclesForImageUpload();
        setVehicles(data);
      } catch (error) {
        console.error("Error fetching vehicles:", error);
        setGlobalStatus({ type: 'error', message: 'No se pudieron cargar los vehículos desde Airtable.' });
      } finally {
        setLoading(false);
      }
    };
    fetchVehicles();
  }, []);

  const handleDrop = (fieldName: string) => async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file || !selectedVehicleId) {
        if(!selectedVehicleId) {
            setGlobalStatus({ type: 'error', message: 'Por favor, selecciona un vehículo antes de subir una imagen.' });
        }
        return;
    }

    setUploads(prev => ({ ...prev, [fieldName]: { file, uploading: true, error: null } }));
    setGlobalStatus(null);

    try {
        const { publicURL } = await StorageService.uploadFile(file, `inventory-images/${selectedVehicleId}`);
        
        await AirtableDirectService.updateVehicleImages(selectedVehicleId, fieldName, [publicURL]);

        setUploads(prev => ({ ...prev, [fieldName]: { file, uploading: false, error: null } }));
        setGlobalStatus({ type: 'success', message: `¡${file.name} subido a ${fieldName} exitosamente!` });
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`Error uploading to ${fieldName}:`, error);
        setUploads(prev => ({ ...prev, [fieldName]: { file: null, uploading: false, error: errorMessage } }));
        setGlobalStatus({ type: 'error', message: `Error al subir ${String(file.name)}: ${errorMessage}` });
    }
  };
  
  const resetUploader = () => {
    // Don't reset the selected vehicle, just the upload state for that vehicle
    setUploads({
      Foto: { file: null, uploading: false, error: null },
      fotos_exterior_archivos: { file: null, uploading: false, error: null },
      fotos_interior_archivos: { file: null, uploading: false, error: null },
    });
    setGlobalStatus(null);
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 mt-8">
      <div className="p-6 border-b">
        <h3 className="text-lg font-semibold text-gray-800">Subir Imágenes de Vehículos a Airtable</h3>
        <p className="text-sm text-gray-500 mt-1">Selecciona una Orden de Compra y arrastra las imágenes a las casillas correspondientes.</p>
      </div>
      <div className="p-6 space-y-6">
        {loading ? (
          <div className="flex items-center justify-center h-24">
            <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
            <p className="ml-3 text-gray-600">Cargando vehículos sin imágenes...</p>
          </div>
        ) : (
          <div>
            <label htmlFor="orden-compra-select" className="block text-sm font-medium text-gray-700 mb-2">
              Orden de Compra (Solo se muestran autos 'Comprado' sin imágenes)
            </label>
            <div className="flex gap-4">
                <select
                id="orden-compra-select"
                value={selectedVehicleId}
                onChange={(e) => {
                    setSelectedVehicleId(e.target.value);
                    resetUploader(); // Reset fields when changing vehicle
                }}
                className="block w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                <option value="" disabled>Selecciona un vehículo</option>
                {Array.isArray(vehicles) && vehicles.filter(v => v.ordenCompra).map(v => (
                    <option key={v.id} value={v.id}>{String(v.ordenCompra)}</option>
                ))}
                </select>
                <button onClick={resetUploader} className="px-4 py-2 text-sm font-semibold text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200">
                    Limpiar Campos
                </button>
            </div>
          </div>
        )}

        
          <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 ${!selectedVehicleId ? 'opacity-50 cursor-not-allowed' : ''}`}>
            <DropzoneField fieldName="Foto" onDrop={handleDrop('Foto')} uploading={uploads.Foto.uploading} uploadedFile={uploads.Foto.file} error={uploads.Foto.error} />
            <DropzoneField fieldName="fotos_exterior_archivos" onDrop={handleDrop('fotos_exterior_archivos')} uploading={uploads.fotos_exterior_archivos.uploading} uploadedFile={uploads.fotos_exterior_archivos.file} error={uploads.fotos_exterior_archivos.error} />
            <DropzoneField fieldName="fotos_interior_archivos" onDrop={handleDrop('fotos_interior_archivos')} uploading={uploads.fotos_interior_archivos.uploading} uploadedFile={uploads.fotos_interior_archivos.file} error={uploads.fotos_interior_archivos.error} />
          </div>
        

        {globalStatus && (
            <div className={`p-3 rounded-md flex items-center text-sm ${globalStatus.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {globalStatus.type === 'success' ? <CheckCircle className="w-5 h-5 mr-2" /> : <AlertTriangle className="w-5 h-5 mr-2" />}
                {globalStatus.message}
            </div>
        )}
      </div>
    </div>
  );
};

export default AirtableImageUploader;