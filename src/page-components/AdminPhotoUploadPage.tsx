'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
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
  Image as ImageIcon,
  RefreshCw,
} from 'lucide-react';
import { VehiclePhotoService, type VehicleWithoutPhotos } from '@/services/VehiclePhotoService';

interface PreviewFile extends File {
  preview: string;
}

export default function AdminPhotoUploadPage() {
  const [vehicles, setVehicles] = useState<VehicleWithoutPhotos[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleWithoutPhotos | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [files, setFiles] = useState<PreviewFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [uploadMessage, setUploadMessage] = useState('');
  const [setFirstAsFeatured, setSetFirstAsFeatured] = useState(true);

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

  // Dropzone config
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = acceptedFiles.map(file =>
      Object.assign(file, {
        preview: URL.createObjectURL(file),
      })
    ) as PreviewFile[];
    setFiles(prev => [...prev, ...newFiles]);
    setUploadStatus('idle');
    setUploadMessage('');
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp'],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  // Remove a file from the list
  const removeFile = (index: number) => {
    setFiles(prev => {
      const updated = [...prev];
      URL.revokeObjectURL(updated[index].preview);
      updated.splice(index, 1);
      return updated;
    });
  };

  // Clear all files
  const clearFiles = () => {
    files.forEach(file => URL.revokeObjectURL(file.preview));
    setFiles([]);
  };

  // Open sheet for a vehicle
  const handleOpenSheet = (vehicle: VehicleWithoutPhotos) => {
    setSelectedVehicle(vehicle);
    setSheetOpen(true);
    setFiles([]);
    setUploadStatus('idle');
    setUploadMessage('');
    setSetFirstAsFeatured(true);
  };

  // Close sheet
  const handleCloseSheet = () => {
    setSheetOpen(false);
    clearFiles();
    setSelectedVehicle(null);
    setUploadStatus('idle');
    setUploadMessage('');
  };

  // Upload photos
  const handleUpload = async () => {
    if (!selectedVehicle || files.length === 0) return;

    setUploading(true);
    setUploadStatus('uploading');
    setUploadProgress(0);

    try {
      // Simulate progress (R2 doesn't provide upload progress)
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const result = await VehiclePhotoService.uploadAndLinkPhotos(
        selectedVehicle.id,
        files,
        setFirstAsFeatured
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
      files.forEach(file => URL.revokeObjectURL(file.preview));
    };
  }, [files]);

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
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto bg-card">
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

          <div className="py-6 space-y-4">
            {/* Dropzone */}
            <div
              {...getRootProps()}
              className={`
                border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
                ${isDragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}
                ${uploading ? 'pointer-events-none opacity-50' : ''}
              `}
            >
              <input {...getInputProps()} />
              <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              {isDragActive ? (
                <p className="text-primary font-medium">Suelta las fotos aquí...</p>
              ) : (
                <>
                  <p className="text-foreground font-medium">Arrastra fotos aquí</p>
                  <p className="text-muted-foreground text-sm mt-1">o haz clic para seleccionar</p>
                </>
              )}
              <p className="text-xs text-muted-foreground mt-2">JPG, PNG, WebP - Max 10MB cada una</p>
            </div>

            {/* File Previews */}
            {files.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-foreground">
                    {files.length} foto{files.length > 1 ? 's' : ''} seleccionada{files.length > 1 ? 's' : ''}
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFiles}
                    disabled={uploading}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    Limpiar todo
                  </Button>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {files.map((file, index) => (
                    <div key={index} className="relative aspect-square rounded-lg overflow-hidden bg-muted">
                      <img
                        src={file.preview}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      {!uploading && (
                        <button
                          type="button"
                          onClick={() => removeFile(index)}
                          className="absolute top-1 right-1 p-1 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90 transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                      {index === 0 && setFirstAsFeatured && (
                        <div className="absolute bottom-1 left-1 px-2 py-0.5 bg-primary text-primary-foreground text-xs rounded">
                          Principal
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Set as Featured Option */}
            {files.length > 0 && (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="setFeatured"
                  checked={setFirstAsFeatured}
                  onCheckedChange={(checked) => setSetFirstAsFeatured(checked as boolean)}
                  disabled={uploading}
                />
                <label
                  htmlFor="setFeatured"
                  className="text-sm font-medium leading-none text-foreground peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Usar primera foto como imagen principal
                </label>
              </div>
            )}

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
              disabled={files.length === 0 || uploading || uploadStatus === 'success'}
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
                  Subir {files.length} Foto{files.length > 1 ? 's' : ''}
                </>
              )}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
