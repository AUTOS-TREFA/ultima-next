import React, { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Upload, Image as ImageIcon, Trash2, Loader2, CheckCircle, XCircle,
  FolderOpen, Search, Filter, Download, Eye, Car
} from 'lucide-react';
import VehicleService from '../services/VehicleService';
import r2Storage from '../services/R2StorageService';
import { supabase } from '../../supabaseClient';
import type { WordPressVehicle } from '../types/types';

interface UploadedImage {
  id: string;
  vehicle_id: number;
  vehicle_title: string;
  file_name: string;
  file_path: string;
  file_url: string;
  file_size: number;
  mime_type: string;
  uploaded_by: string;
  uploaded_at: string;
}

interface UploadProgress {
  file: File;
  status: 'pending' | 'uploading' | 'success' | 'error';
  progress: number;
  url?: string;
  error?: string;
}

const R2ImageManagerPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'upload' | 'gallery'>('upload');
  const [selectedVehicleId, setSelectedVehicleId] = useState<number | null>(null);
  const [uploadQueue, setUploadQueue] = useState<UploadProgress[]>([]);
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [loadingGallery, setLoadingGallery] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterVehicle, setFilterVehicle] = useState<number | null>(null);

  // Fetch vehicles
  const { data: vehiclesData, isLoading: loadingVehicles } = useQuery({
    queryKey: ['vehicles-r2'],
    queryFn: () => VehicleService.getAllVehicles(),
  });

  const vehicles = vehiclesData?.vehicles || [];
  const selectedVehicle = vehicles.find(v => v.id === selectedVehicleId);

  // Load images from database
  const loadImages = useCallback(async () => {
    setLoadingGallery(true);
    try {
      let query = supabase
        .from('r2_images')
        .select('*')
        .order('uploaded_at', { ascending: false });

      if (filterVehicle) {
        query = query.eq('vehicle_id', filterVehicle);
      }

      const { data, error } = await query;

      if (error) throw error;
      setImages(data || []);
    } catch (error) {
      console.error('Failed to load images:', error);
    } finally {
      setLoadingGallery(false);
    }
  }, [filterVehicle]);

  useEffect(() => {
    if (activeTab === 'gallery') {
      loadImages();
    }
  }, [activeTab, filterVehicle, loadImages]);

  // Handle file selection
  const handleFileSelect = (files: FileList | null) => {
    if (!files || !selectedVehicleId) return;

    const newUploads: UploadProgress[] = Array.from(files).map(file => ({
      file,
      status: 'pending',
      progress: 0,
    }));

    setUploadQueue(prev => [...prev, ...newUploads]);
  };

  // Upload files
  const uploadFiles = async () => {
    if (!selectedVehicleId || !selectedVehicle) return;

    const pendingUploads = uploadQueue.filter(u => u.status === 'pending');

    for (const upload of pendingUploads) {
      try {
        // Update status to uploading
        setUploadQueue(prev =>
          prev.map(u => (u === upload ? { ...u, status: 'uploading', progress: 50 } : u))
        );

        // Generate path
        const path = r2Storage.generatePath(`vehicles/${selectedVehicleId}`, upload.file.name);

        // Upload to R2
        const url = await r2Storage.uploadFile(upload.file, path, upload.file.type);

        // Save to database
        const { data: { user } } = await supabase.auth.getUser();
        const { error } = await supabase.from('r2_images').insert([{
          vehicle_id: selectedVehicleId,
          vehicle_title: selectedVehicle.titulo,
          file_name: upload.file.name,
          file_path: path,
          file_url: url,
          file_size: upload.file.size,
          mime_type: upload.file.type,
          uploaded_by: user?.id || 'unknown',
        }]);

        if (error) throw error;

        // Update status to success
        setUploadQueue(prev =>
          prev.map(u => (u === upload ? { ...u, status: 'success', progress: 100, url } : u))
        );
      } catch (error) {
        console.error('Upload failed:', error);
        setUploadQueue(prev =>
          prev.map(u =>
            u === upload
              ? { ...u, status: 'error', error: error instanceof Error ? error.message : 'Upload failed' }
              : u
          )
        );
      }
    }

    // Reload gallery after uploads
    loadImages();
  };

  // Clear completed uploads
  const clearCompleted = () => {
    setUploadQueue(prev => prev.filter(u => u.status !== 'success'));
  };

  // Delete image
  const deleteImage = async (image: UploadedImage) => {
    if (!confirm(`¿Eliminar ${image.file_name}?`)) return;

    try {
      // Delete from R2
      await r2Storage.deleteFile(image.file_path);

      // Delete from database
      const { error } = await supabase.from('r2_images').delete().eq('id', image.id);

      if (error) throw error;

      // Reload gallery
      loadImages();
    } catch (error) {
      console.error('Failed to delete image:', error);
      alert('Error al eliminar la imagen');
    }
  };

  // Drag and drop handlers
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const filteredImages = images.filter(img =>
    img.file_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    img.vehicle_title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <ImageIcon className="w-8 h-8 text-primary-600" />
          Gestor de Imágenes R2
        </h1>
        <p className="mt-2 text-gray-600">
          Sube y administra imágenes de vehículos en Cloudflare R2
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('upload')}
            className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
              activeTab === 'upload'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Upload className="w-4 h-4" />
            Subir Imágenes
          </button>
          <button
            onClick={() => setActiveTab('gallery')}
            className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
              activeTab === 'gallery'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <FolderOpen className="w-4 h-4" />
            Galería ({images.length})
          </button>
        </nav>
      </div>

      {/* Upload Tab */}
      {activeTab === 'upload' && (
        <div className="space-y-6">
          {/* Vehicle Selector */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Selecciona el Vehículo
            </label>
            {loadingVehicles ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
              </div>
            ) : (
              <select
                value={selectedVehicleId || ''}
                onChange={(e) => setSelectedVehicleId(Number(e.target.value) || null)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                <option value="">-- Selecciona un vehículo --</option>
                {vehicles.map(vehicle => (
                  <option key={vehicle.id} value={vehicle.id}>
                    {vehicle.titulo} (ID: {vehicle.id})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Upload Area */}
          {selectedVehicleId && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
                  isDragging
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-lg font-medium text-gray-900 mb-2">
                  Arrastra imágenes aquí o haz clic para seleccionar
                </p>
                <p className="text-sm text-gray-500 mb-4">
                  JPG, PNG, WEBP hasta 10MB por archivo
                </p>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => handleFileSelect(e.target.files)}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="inline-block px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 cursor-pointer"
                >
                  Seleccionar Archivos
                </label>
              </div>

              {/* Upload Queue */}
              {uploadQueue.length > 0 && (
                <div className="mt-6 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900">
                      Cola de Subida ({uploadQueue.length})
                    </h3>
                    <div className="flex gap-2">
                      <button
                        onClick={clearCompleted}
                        className="text-sm text-gray-600 hover:text-gray-900"
                      >
                        Limpiar Completados
                      </button>
                      <button
                        onClick={uploadFiles}
                        disabled={uploadQueue.every(u => u.status !== 'pending')}
                        className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 text-sm font-medium"
                      >
                        Subir Todo
                      </button>
                    </div>
                  </div>

                  {uploadQueue.map((upload, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="flex-shrink-0">
                        {upload.status === 'success' && <CheckCircle className="w-5 h-5 text-green-600" />}
                        {upload.status === 'error' && <XCircle className="w-5 h-5 text-red-600" />}
                        {upload.status === 'uploading' && <Loader2 className="w-5 h-5 animate-spin text-primary-600" />}
                        {upload.status === 'pending' && <ImageIcon className="w-5 h-5 text-gray-400" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{upload.file.name}</p>
                        <p className="text-xs text-gray-500">
                          {(upload.file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                      <div className="flex-shrink-0 text-sm">
                        {upload.status === 'success' && <span className="text-green-600">✓ Subido</span>}
                        {upload.status === 'error' && <span className="text-red-600">{upload.error}</span>}
                        {upload.status === 'uploading' && <span className="text-primary-600">Subiendo...</span>}
                        {upload.status === 'pending' && <span className="text-gray-500">Pendiente</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Gallery Tab */}
      {activeTab === 'gallery' && (
        <div className="space-y-6">
          {/* Filters */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Search className="w-4 h-4 inline mr-2" />
                  Buscar
                </label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar por nombre de archivo o vehículo..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Filter className="w-4 h-4 inline mr-2" />
                  Filtrar por Vehículo
                </label>
                <select
                  value={filterVehicle || ''}
                  onChange={(e) => setFilterVehicle(Number(e.target.value) || null)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Todos los vehículos</option>
                  {vehicles.map(vehicle => (
                    <option key={vehicle.id} value={vehicle.id}>
                      {vehicle.titulo}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Gallery Grid */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            {loadingGallery ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
              </div>
            ) : filteredImages.length === 0 ? (
              <div className="text-center py-12">
                <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No hay imágenes</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredImages.map((image) => (
                  <div key={image.id} className="relative group">
                    <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                      <img
                        src={image.file_url}
                        alt={image.file_name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    </div>
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity rounded-lg flex items-center justify-center gap-2">
                      <a
                        href={image.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="opacity-0 group-hover:opacity-100 p-2 bg-white rounded-lg hover:bg-gray-100 transition-all"
                      >
                        <Eye className="w-5 h-5 text-gray-700" />
                      </a>
                      <button
                        onClick={() => deleteImage(image)}
                        className="opacity-0 group-hover:opacity-100 p-2 bg-white rounded-lg hover:bg-red-50 transition-all"
                      >
                        <Trash2 className="w-5 h-5 text-red-600" />
                      </button>
                    </div>
                    <div className="mt-2">
                      <p className="text-xs font-medium text-gray-900 truncate">{image.file_name}</p>
                      <p className="text-xs text-gray-500 truncate">
                        <Car className="w-3 h-3 inline mr-1" />
                        {image.vehicle_title}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default R2ImageManagerPage;
