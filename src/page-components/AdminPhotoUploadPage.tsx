'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Camera,
  Upload,
  X,
  ImageOff,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
  Star,
  GripVertical,
  ChevronUp,
  ChevronDown,
  ImagePlus,
} from 'lucide-react';
import { VehiclePhotoService, type VehicleWithoutPhotos } from '@/services/VehiclePhotoService';

interface PreviewFile extends File {
  preview: string;
  id: string;
}

export default function AdminPhotoUploadPage() {
  const [vehicles, setVehicles] = useState<VehicleWithoutPhotos[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleWithoutPhotos | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  // Separate state for featured image and gallery
  const [featuredImage, setFeaturedImage] = useState<PreviewFile | null>(null);
  const [galleryImages, setGalleryImages] = useState<PreviewFile[]>([]);

  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [uploadMessage, setUploadMessage] = useState('');

  // Fetch vehicles without photos
  const fetchVehicles = useCallback(async () => {
    try {
      setLoading(true);
      const data = await VehiclePhotoService.getVehiclesWithoutPhotos();
      setVehicles(data);
    } catch (error) {
      console.error('Error fetching vehicles:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles]);

  // Generate unique ID for files
  const generateId = () => `file-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

  // Dropzone for featured image
  const onDropFeatured = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      // Revoke old preview if exists
      if (featuredImage) {
        URL.revokeObjectURL(featuredImage.preview);
      }
      const previewFile = Object.assign(file, {
        preview: URL.createObjectURL(file),
        id: generateId(),
      }) as PreviewFile;
      setFeaturedImage(previewFile);
    }
    setUploadStatus('idle');
    setUploadMessage('');
  }, [featuredImage]);

  const { getRootProps: getFeaturedRootProps, getInputProps: getFeaturedInputProps, isDragActive: isFeaturedDragActive } = useDropzone({
    onDrop: onDropFeatured,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp'],
    },
    maxSize: 10 * 1024 * 1024,
    maxFiles: 1,
  });

  // Dropzone for gallery images
  const onDropGallery = useCallback((acceptedFiles: File[]) => {
    const newFiles = acceptedFiles.map(file =>
      Object.assign(file, {
        preview: URL.createObjectURL(file),
        id: generateId(),
      })
    ) as PreviewFile[];
    setGalleryImages(prev => [...prev, ...newFiles]);
    setUploadStatus('idle');
    setUploadMessage('');
  }, []);

  const { getRootProps: getGalleryRootProps, getInputProps: getGalleryInputProps, isDragActive: isGalleryDragActive } = useDropzone({
    onDrop: onDropGallery,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp'],
    },
    maxSize: 10 * 1024 * 1024,
  });

  // Remove featured image
  const removeFeatured = () => {
    if (featuredImage) {
      URL.revokeObjectURL(featuredImage.preview);
      setFeaturedImage(null);
    }
  };

  // Remove a gallery image
  const removeGalleryImage = (id: string) => {
    setGalleryImages(prev => {
      const index = prev.findIndex(f => f.id === id);
      if (index !== -1) {
        URL.revokeObjectURL(prev[index].preview);
        return prev.filter(f => f.id !== id);
      }
      return prev;
    });
  };

  // Move gallery image up
  const moveImageUp = (index: number) => {
    if (index <= 0) return;
    setGalleryImages(prev => {
      const updated = [...prev];
      [updated[index - 1], updated[index]] = [updated[index], updated[index - 1]];
      return updated;
    });
  };

  // Move gallery image down
  const moveImageDown = (index: number) => {
    if (index >= galleryImages.length - 1) return;
    setGalleryImages(prev => {
      const updated = [...prev];
      [updated[index], updated[index + 1]] = [updated[index + 1], updated[index]];
      return updated;
    });
  };

  // Promote gallery image to featured
  const promoteToFeatured = (id: string) => {
    const imageToPromote = galleryImages.find(f => f.id === id);
    if (!imageToPromote) return;

    // If there's already a featured image, move it to gallery
    if (featuredImage) {
      setGalleryImages(prev => [featuredImage, ...prev.filter(f => f.id !== id)]);
    } else {
      setGalleryImages(prev => prev.filter(f => f.id !== id));
    }
    setFeaturedImage(imageToPromote);
  };

  // Clear all files
  const clearAllFiles = () => {
    if (featuredImage) {
      URL.revokeObjectURL(featuredImage.preview);
    }
    galleryImages.forEach(file => URL.revokeObjectURL(file.preview));
    setFeaturedImage(null);
    setGalleryImages([]);
  };

  // Open sheet for a vehicle
  const handleOpenSheet = (vehicle: VehicleWithoutPhotos) => {
    setSelectedVehicle(vehicle);
    setSheetOpen(true);
    setFeaturedImage(null);
    setGalleryImages([]);
    setUploadStatus('idle');
    setUploadMessage('');
  };

  // Close sheet
  const handleCloseSheet = () => {
    setSheetOpen(false);
    clearAllFiles();
    setSelectedVehicle(null);
    setUploadStatus('idle');
    setUploadMessage('');
  };

  // Upload photos
  const handleUpload = async () => {
    if (!selectedVehicle) return;

    const hasFiles = featuredImage || galleryImages.length > 0;
    if (!hasFiles) return;

    setUploading(true);
    setUploadStatus('uploading');
    setUploadProgress(0);

    try {
      // Combine all files - featured first, then gallery
      const allFiles: File[] = [];
      if (featuredImage) {
        allFiles.push(featuredImage);
      }
      allFiles.push(...galleryImages);

      // Simulate progress (R2 doesn't provide upload progress)
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const result = await VehiclePhotoService.uploadAndLinkPhotos(
        selectedVehicle.id,
        allFiles,
        !!featuredImage // Set first as featured if we have a featured image
      );

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (result.success) {
        setUploadStatus('success');
        setUploadMessage(`${result.uploadedCount} foto${result.uploadedCount > 1 ? 's' : ''} subida${result.uploadedCount > 1 ? 's' : ''} y vinculada${result.uploadedCount > 1 ? 's' : ''} exitosamente.`);

        // Remove the vehicle from the list after successful upload
        setVehicles(prev => prev.filter(v => v.id !== selectedVehicle.id));

        // Close sheet after 2 seconds
        setTimeout(() => {
          handleCloseSheet();
        }, 2000);
      } else {
        setUploadStatus('error');
        setUploadMessage(result.error || 'Error al subir las fotos.');
      }
    } catch (error) {
      console.error('Upload error:', error);
      setUploadStatus('error');
      setUploadMessage('Error inesperado al subir las fotos.');
    } finally {
      setUploading(false);
    }
  };

  // Cleanup previews on unmount
  useEffect(() => {
    return () => {
      if (featuredImage) {
        URL.revokeObjectURL(featuredImage.preview);
      }
      galleryImages.forEach(file => URL.revokeObjectURL(file.preview));
    };
  }, []);

  const totalPhotos = (featuredImage ? 1 : 0) + galleryImages.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Camera className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">Cargar Fotos</h1>
            <p className="text-sm text-muted-foreground">
              Inventario comprado pendiente de fotos
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          onClick={fetchVehicles}
          disabled={loading}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Actualizar
        </Button>
      </div>

      {/* Stats Card */}
      <Card className="bg-card border-border">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-amber-500/10 rounded-full">
              <ImageOff className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{vehicles.length}</p>
              <p className="text-sm text-muted-foreground">Autos comprados sin fotos</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Vehicle List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : vehicles.length === 0 ? (
        <Card className="bg-card border-border">
          <CardContent className="py-12 text-center">
            <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground">Todos los autos comprados tienen fotos</h3>
            <p className="text-muted-foreground mt-1">No hay vehículos pendientes de cargar fotos.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {vehicles.map(vehicle => (
            <Card key={vehicle.id} className="bg-card border-border hover:border-primary/50 transition-colors">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-sm bg-muted px-2 py-1 rounded text-foreground">
                        {vehicle.ordencompra || 'Sin OC'}
                      </span>
                      <h3 className="font-semibold text-foreground">
                        {vehicle.title || `${vehicle.brand || ''} ${vehicle.model || ''} ${vehicle.year || ''}`.trim() || 'Sin título'}
                      </h3>
                    </div>

                    <div className="flex gap-2 mt-2">
                      {!vehicle.has_feature_image && (
                        <Badge variant="destructive" className="text-xs">
                          <AlertCircle className="w-3 h-3 mr-1" />
                          Sin foto principal
                        </Badge>
                      )}
                      {!vehicle.has_gallery && (
                        <Badge variant="secondary" className="text-xs bg-amber-500/10 text-amber-700 border-amber-200">
                          <ImageOff className="w-3 h-3 mr-1" />
                          Galería vacía
                        </Badge>
                      )}
                    </div>
                  </div>

                  <Button
                    onClick={() => handleOpenSheet(vehicle)}
                    className="bg-primary hover:bg-primary/90"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Subir Fotos
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Upload Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto bg-card">
          <SheetHeader>
            <SheetTitle className="text-foreground">Subir Fotos</SheetTitle>
            <SheetDescription>
              {selectedVehicle && (
                <div className="flex items-center gap-2 flex-wrap mt-1">
                  <span className="font-mono text-xs bg-muted px-2 py-1 rounded">
                    {selectedVehicle.ordencompra || 'Sin OC'}
                  </span>
                  <span className="text-foreground">
                    {selectedVehicle.title || `${selectedVehicle.brand || ''} ${selectedVehicle.model || ''} ${selectedVehicle.year || ''}`.trim()}
                  </span>
                </div>
              )}
            </SheetDescription>
          </SheetHeader>

          <div className="py-6 space-y-6">
            {/* SECTION 1: Featured Image */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-500" />
                <h3 className="font-semibold text-foreground">Foto Principal</h3>
              </div>

              {!featuredImage ? (
                <div
                  {...getFeaturedRootProps()}
                  className={`
                    border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all
                    ${isFeaturedDragActive ? 'border-amber-500 bg-amber-500/5' : 'border-amber-300 hover:border-amber-400 bg-amber-50/50'}
                    ${uploading ? 'pointer-events-none opacity-50' : ''}
                  `}
                >
                  <input {...getFeaturedInputProps()} />
                  <Star className="w-8 h-8 text-amber-400 mx-auto mb-2" />
                  {isFeaturedDragActive ? (
                    <p className="text-amber-600 font-medium">Suelta la foto aquí...</p>
                  ) : (
                    <>
                      <p className="text-foreground font-medium">Arrastra la foto principal</p>
                      <p className="text-muted-foreground text-sm mt-1">o haz clic para seleccionar</p>
                    </>
                  )}
                </div>
              ) : (
                <div className="relative rounded-xl overflow-hidden border-2 border-amber-300 bg-amber-50/30">
                  <div className="aspect-video w-full">
                    <img
                      src={featuredImage.preview}
                      alt="Foto principal"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  {/* Principal Badge - Pill Style */}
                  <div className="absolute top-3 left-3">
                    <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-500 text-white text-xs font-semibold rounded-full shadow-md">
                      <Star className="w-3 h-3" />
                      Principal
                    </span>
                  </div>
                  {/* Remove Button */}
                  {!uploading && (
                    <button
                      type="button"
                      onClick={removeFeatured}
                      className="absolute top-3 right-3 p-2 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90 transition-colors shadow-md"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Divider */}
            <div className="border-t border-border" />

            {/* SECTION 2: Gallery Images */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ImagePlus className="w-4 h-4 text-primary" />
                  <h3 className="font-semibold text-foreground">Galería Exterior</h3>
                  {galleryImages.length > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {galleryImages.length} foto{galleryImages.length > 1 ? 's' : ''}
                    </Badge>
                  )}
                </div>
                {galleryImages.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      galleryImages.forEach(file => URL.revokeObjectURL(file.preview));
                      setGalleryImages([]);
                    }}
                    disabled={uploading}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10 text-xs"
                  >
                    Limpiar galería
                  </Button>
                )}
              </div>

              {/* Gallery Dropzone */}
              <div
                {...getGalleryRootProps()}
                className={`
                  border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all
                  ${isGalleryDragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}
                  ${uploading ? 'pointer-events-none opacity-50' : ''}
                `}
              >
                <input {...getGalleryInputProps()} />
                <Upload className="w-7 h-7 text-muted-foreground mx-auto mb-2" />
                {isGalleryDragActive ? (
                  <p className="text-primary font-medium">Suelta las fotos aquí...</p>
                ) : (
                  <>
                    <p className="text-foreground font-medium text-sm">Arrastra fotos de la galería</p>
                    <p className="text-muted-foreground text-xs mt-1">Puedes subir múltiples fotos</p>
                  </>
                )}
              </div>

              {/* Gallery Previews with Reorder Controls */}
              {galleryImages.length > 0 && (
                <div className="space-y-2">
                  {galleryImages.map((file, index) => (
                    <div
                      key={file.id}
                      className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg border border-border"
                    >
                      {/* Grip Icon */}
                      <div className="text-muted-foreground">
                        <GripVertical className="w-4 h-4" />
                      </div>

                      {/* Thumbnail */}
                      <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
                        <img
                          src={file.preview}
                          alt={`Galería ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      {/* File Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{file.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Posición: {index + 1}
                        </p>
                      </div>

                      {/* Controls */}
                      {!uploading && (
                        <div className="flex items-center gap-1">
                          {/* Move Up */}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => moveImageUp(index)}
                            disabled={index === 0}
                          >
                            <ChevronUp className="w-4 h-4" />
                          </Button>

                          {/* Move Down */}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => moveImageDown(index)}
                            disabled={index === galleryImages.length - 1}
                          >
                            <ChevronDown className="w-4 h-4" />
                          </Button>

                          {/* Promote to Featured */}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-amber-500 hover:text-amber-600 hover:bg-amber-50"
                            onClick={() => promoteToFeatured(file.id)}
                            title="Hacer foto principal"
                          >
                            <Star className="w-4 h-4" />
                          </Button>

                          {/* Remove */}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => removeGalleryImage(file.id)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Upload Progress */}
            {uploadStatus === 'uploading' && (
              <div className="space-y-2">
                <Progress value={uploadProgress} className="h-2" />
                <p className="text-sm text-muted-foreground text-center">
                  Subiendo fotos... {uploadProgress}%
                </p>
              </div>
            )}

            {/* Status Messages */}
            {uploadStatus === 'success' && (
              <Alert className="bg-green-500/10 border-green-500/20">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-700">
                  {uploadMessage}
                </AlertDescription>
              </Alert>
            )}

            {uploadStatus === 'error' && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{uploadMessage}</AlertDescription>
              </Alert>
            )}
          </div>

          <SheetFooter className="mt-4">
            <Button
              variant="outline"
              onClick={handleCloseSheet}
              disabled={uploading}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleUpload}
              disabled={totalPhotos === 0 || uploading || uploadStatus === 'success'}
              className="bg-primary hover:bg-primary/90"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Subiendo...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Subir {totalPhotos} Foto{totalPhotos > 1 ? 's' : ''}
                </>
              )}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
