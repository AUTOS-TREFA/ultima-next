'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useDropzone } from 'react-dropzone';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  Pencil,
  Trash2,
  Images,
  Search,
  Eye,
  Plus,
  Car,
  DollarSign,
  MapPin,
  Shield,
  Tag,
  Settings2,
  Save,
} from 'lucide-react';
import {
  VehiclePhotoService,
  type VehicleWithoutPhotos,
  type VehicleWithPhotos,
  type VehicleEditData,
  type VehicleUpdatePayload,
} from '@/services/VehiclePhotoService';

// Constants for form options
const SUCURSALES = [
  'Monterrey',
  'Guadalupe',
  'Guadalupe 2',
  'Reynosa',
  'Saltillo',
  'Las Americas',
];

const GARANTIAS = [
  '365 días',
  '90 días',
  'Agencia',
];

const CARROCERIAS = [
  'SUV',
  'Sedán',
  'Pick Up',
  'Hatchback',
  'Motocicleta',
  'Crossover',
  'Coupé',
  'Van',
  'Wagon',
];

const TRANSMISIONES = [
  'Automático',
  'Manual',
];

const ORDENSTATUS_OPTIONS = [
  'Comprado',
  'Prospecto',
  'Historico',
  'Cancelado',
];

// Common promociones (can be extended by user)
const DEFAULT_PROMOCIONES = [
  'Enganche Bajo',
  'Tasa Preferencial',
  'MSI',
  'Seguro Gratis',
  'Garantía Extendida',
  'Mantenimiento Incluido',
];

interface PreviewFile extends File {
  preview: string;
  id: string;
}

// Vehicle Edit Dialog Component
function VehicleEditDialog({
  open,
  onOpenChange,
  vehicle,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vehicle: VehicleEditData | null;
  onSaved: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<VehicleUpdatePayload>({});
  const [selectedPromociones, setSelectedPromociones] = useState<string[]>([]);
  const [customPromocion, setCustomPromocion] = useState('');
  const [availablePromociones, setAvailablePromociones] = useState<string[]>(DEFAULT_PROMOCIONES);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Photo management state
  const [photoDialogOpen, setPhotoDialogOpen] = useState(false);

  // Load form data when vehicle changes
  useEffect(() => {
    if (vehicle && open) {
      setFormData({
        mensualidad_minima: vehicle.mensualidad_minima,
        mensualidad_recomendada: vehicle.mensualidad_recomendada,
        ubicacion: vehicle.ubicacion,
        garantia: vehicle.garantia,
        carroceria: vehicle.carroceria,
        kilometraje: vehicle.kilometraje,
        transmision: vehicle.transmision,
        ordenstatus: vehicle.ordenstatus || 'Comprado',
      });
      setSelectedPromociones(vehicle.promociones || []);
      setSaveMessage(null);

      // Load unique promociones
      VehiclePhotoService.getUniquePromociones().then(promos => {
        const allPromos = new Set([...DEFAULT_PROMOCIONES, ...promos]);
        setAvailablePromociones(Array.from(allPromos).sort());
      });
    }
  }, [vehicle, open]);

  const handleInputChange = (field: keyof VehicleUpdatePayload, value: unknown) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setSaveMessage(null);
  };

  const handlePromocionToggle = (promo: string, checked: boolean) => {
    if (checked) {
      setSelectedPromociones(prev => [...prev, promo]);
    } else {
      setSelectedPromociones(prev => prev.filter(p => p !== promo));
    }
    setSaveMessage(null);
  };

  const handleAddCustomPromocion = () => {
    const trimmed = customPromocion.trim();
    if (trimmed && !availablePromociones.includes(trimmed)) {
      setAvailablePromociones(prev => [...prev, trimmed].sort());
      setSelectedPromociones(prev => [...prev, trimmed]);
      setCustomPromocion('');
      setSaveMessage(null);
    }
  };

  const handleSave = async () => {
    if (!vehicle) return;

    setSaving(true);
    setSaveMessage(null);

    const payload: VehicleUpdatePayload = {
      ...formData,
      promociones: selectedPromociones.length > 0 ? selectedPromociones : null,
    };

    const result = await VehiclePhotoService.updateVehicleData(vehicle.id, payload);

    setSaving(false);

    if (result.success) {
      setSaveMessage({ type: 'success', text: 'Datos guardados correctamente' });
      onSaved();
      setTimeout(() => {
        onOpenChange(false);
      }, 1500);
    } else {
      setSaveMessage({ type: 'error', text: result.error || 'Error al guardar' });
    }
  };

  const formatCurrency = (value: number | null | undefined) => {
    if (value == null) return '-';
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      maximumFractionDigits: 0,
    }).format(value);
  };

  if (!vehicle) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings2 className="w-5 h-5" />
            Editar Vehículo
          </DialogTitle>
          <DialogDescription>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="font-mono text-xs bg-muted px-2 py-1 rounded">
                {vehicle.ordencompra || 'Sin OC'}
              </span>
              <span className="font-medium">{vehicle.title}</span>
            </div>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Non-editable info */}
          <Card className="bg-muted/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Car className="w-4 h-4" />
                Información del Vehículo (Solo lectura)
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground text-xs">Marca</p>
                <p className="font-medium">{vehicle.marca || '-'}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Modelo</p>
                <p className="font-medium">{vehicle.modelo || '-'}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Año</p>
                <p className="font-medium">{vehicle.autoano || '-'}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Precio</p>
                <p className="font-medium text-primary">{formatCurrency(vehicle.precio)}</p>
              </div>
            </CardContent>
          </Card>

          {/* Photo Status */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Camera className="w-4 h-4" />
                  Fotos
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPhotoDialogOpen(true)}
                  className="gap-2"
                >
                  <Images className="w-4 h-4" />
                  Administrar Fotos
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                {vehicle.thumbnail_url ? (
                  <div className="w-24 h-16 rounded-lg overflow-hidden bg-muted relative">
                    <Image
                      src={vehicle.thumbnail_url}
                      alt={vehicle.title}
                      fill
                      className="object-cover"
                      sizes="96px"
                    />
                  </div>
                ) : (
                  <div className="w-24 h-16 rounded-lg bg-muted flex items-center justify-center">
                    <ImageOff className="w-6 h-6 text-muted-foreground" />
                  </div>
                )}
                <div className="flex gap-2 flex-wrap">
                  {vehicle.has_feature_image ? (
                    <Badge variant="default" className="bg-green-600">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Foto Principal
                    </Badge>
                  ) : (
                    <Badge variant="destructive">
                      <AlertCircle className="w-3 h-3 mr-1" />
                      Sin Foto Principal
                    </Badge>
                  )}
                  {vehicle.has_gallery ? (
                    <Badge variant="secondary">
                      <Images className="w-3 h-3 mr-1" />
                      {vehicle.gallery_count} fotos
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-amber-600 border-amber-300">
                      <ImageOff className="w-3 h-3 mr-1" />
                      Sin galería
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Editable Fields */}
          <div className="grid gap-6">
            {/* Mensualidades */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="mensualidad_minima" className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Mensualidad Mínima
                </Label>
                <Input
                  id="mensualidad_minima"
                  type="number"
                  placeholder="0"
                  value={formData.mensualidad_minima ?? ''}
                  onChange={(e) => handleInputChange('mensualidad_minima', e.target.value ? Number(e.target.value) : null)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mensualidad_recomendada" className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Mensualidad Recomendada
                </Label>
                <Input
                  id="mensualidad_recomendada"
                  type="number"
                  placeholder="0"
                  value={formData.mensualidad_recomendada ?? ''}
                  onChange={(e) => handleInputChange('mensualidad_recomendada', e.target.value ? Number(e.target.value) : null)}
                />
              </div>
            </div>

            {/* Sucursal y Garantía */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ubicacion" className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Sucursal
                </Label>
                <Select
                  value={formData.ubicacion || ''}
                  onValueChange={(value) => handleInputChange('ubicacion', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar sucursal" />
                  </SelectTrigger>
                  <SelectContent>
                    {SUCURSALES.map(suc => (
                      <SelectItem key={suc} value={suc}>{suc}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="garantia" className="flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Garantía
                </Label>
                <Select
                  value={formData.garantia || ''}
                  onValueChange={(value) => handleInputChange('garantia', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar garantía" />
                  </SelectTrigger>
                  <SelectContent>
                    {GARANTIAS.map(g => (
                      <SelectItem key={g} value={g}>{g}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Carrocería, Kilometraje, Transmisión */}
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="carroceria">Carrocería</Label>
                <Select
                  value={formData.carroceria || ''}
                  onValueChange={(value) => handleInputChange('carroceria', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    {CARROCERIAS.map(c => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="kilometraje">Kilometraje</Label>
                <Input
                  id="kilometraje"
                  type="number"
                  placeholder="0"
                  value={formData.kilometraje ?? ''}
                  onChange={(e) => handleInputChange('kilometraje', e.target.value ? Number(e.target.value) : null)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="transmision">Transmisión</Label>
                <Select
                  value={formData.transmision || ''}
                  onValueChange={(value) => handleInputChange('transmision', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    {TRANSMISIONES.map(t => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Order Status */}
            <div className="space-y-2">
              <Label htmlFor="ordenstatus">Estado de Orden</Label>
              <Select
                value={formData.ordenstatus || 'Comprado'}
                onValueChange={(value) => handleInputChange('ordenstatus', value)}
              >
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Seleccionar estado" />
                </SelectTrigger>
                <SelectContent>
                  {ORDENSTATUS_OPTIONS.map(s => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Promociones */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <Tag className="w-4 h-4" />
                Promociones
              </Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {availablePromociones.map(promo => (
                  <div key={promo} className="flex items-center space-x-2">
                    <Checkbox
                      id={`promo-${promo}`}
                      checked={selectedPromociones.includes(promo)}
                      onCheckedChange={(checked) => handlePromocionToggle(promo, checked as boolean)}
                    />
                    <label
                      htmlFor={`promo-${promo}`}
                      className="text-sm cursor-pointer leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {promo}
                    </label>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 mt-2">
                <Input
                  placeholder="Nueva promoción..."
                  value={customPromocion}
                  onChange={(e) => setCustomPromocion(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddCustomPromocion();
                    }
                  }}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={handleAddCustomPromocion}
                  disabled={!customPromocion.trim()}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Save message */}
          {saveMessage && (
            <Alert variant={saveMessage.type === 'error' ? 'destructive' : 'default'} className={saveMessage.type === 'success' ? 'bg-green-50 border-green-200' : ''}>
              {saveMessage.type === 'success' ? (
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              <AlertDescription className={saveMessage.type === 'success' ? 'text-green-700' : ''}>
                {saveMessage.text}
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving} className="gap-2">
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Guardar Cambios
              </>
            )}
          </Button>
        </DialogFooter>

        {/* Photo Manager Dialog (nested) */}
        <PhotoManagerDialog
          open={photoDialogOpen}
          onOpenChange={setPhotoDialogOpen}
          vehicle={vehicle ? {
            id: vehicle.id,
            ordencompra: vehicle.ordencompra,
            title: vehicle.title,
            brand: vehicle.marca,
            model: vehicle.modelo,
            year: vehicle.autoano,
            feature_image: vehicle.feature_image,
            r2_feature_image: vehicle.r2_feature_image,
            r2_gallery: vehicle.r2_gallery,
            gallery_count: vehicle.gallery_count,
            thumbnail_url: vehicle.thumbnail_url,
            ubicacion: vehicle.ubicacion,
          } : null}
          onPhotoDeleted={() => onSaved()}
          onFeaturedChanged={() => onSaved()}
          onPhotosAdded={() => onSaved()}
        />
      </DialogContent>
    </Dialog>
  );
}

// Photo Manager Dialog Component
function PhotoManagerDialog({
  open,
  onOpenChange,
  vehicle,
  onPhotoDeleted,
  onFeaturedChanged,
  onPhotosAdded,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vehicle: VehicleWithPhotos | null;
  onPhotoDeleted: () => void;
  onFeaturedChanged: () => void;
  onPhotosAdded: () => void;
}) {
  const [loading, setLoading] = useState(true);
  const [photoDetails, setPhotoDetails] = useState<{
    id: string;
    ordencompra: string | null;
    title: string;
    feature_image: string | null;
    r2_feature_image: string | null;
    r2_gallery: string[];
    galeria_exterior: string[];
    fotos_exterior_url: string[];
  } | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [settingFeatured, setSettingFeatured] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [newFiles, setNewFiles] = useState<PreviewFile[]>([]);

  // Fetch photo details when vehicle changes
  useEffect(() => {
    if (vehicle && open) {
      setLoading(true);
      VehiclePhotoService.getVehiclePhotoDetails(vehicle.id)
        .then(details => {
          setPhotoDetails(details);
          setLoading(false);
        })
        .catch(() => {
          setLoading(false);
        });
    }
  }, [vehicle, open]);

  // Get all unique photos (prioritize R2, then others)
  const allPhotos = useMemo(() => {
    if (!photoDetails) return [];
    const seen = new Set<string>();
    const photos: string[] = [];

    // Add R2 gallery first (highest priority)
    photoDetails.r2_gallery.forEach(url => {
      if (!seen.has(url)) {
        seen.add(url);
        photos.push(url);
      }
    });

    // Add galeria_exterior
    photoDetails.galeria_exterior.forEach(url => {
      if (!seen.has(url)) {
        seen.add(url);
        photos.push(url);
      }
    });

    // Add fotos_exterior_url
    photoDetails.fotos_exterior_url.forEach(url => {
      if (!seen.has(url)) {
        seen.add(url);
        photos.push(url);
      }
    });

    return photos;
  }, [photoDetails]);

  const currentFeatured = photoDetails?.r2_feature_image || photoDetails?.feature_image;

  // Dropzone for adding new photos
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newPreviewFiles = acceptedFiles.map(file =>
      Object.assign(file, {
        preview: URL.createObjectURL(file),
        id: `file-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      })
    ) as PreviewFile[];
    setNewFiles(prev => [...prev, ...newPreviewFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp'],
    },
    maxSize: 10 * 1024 * 1024,
  });

  const removeNewFile = (id: string) => {
    setNewFiles(prev => {
      const file = prev.find(f => f.id === id);
      if (file) URL.revokeObjectURL(file.preview);
      return prev.filter(f => f.id !== id);
    });
  };

  const handleDelete = async (photoUrl: string) => {
    if (!vehicle) return;
    setDeleting(photoUrl);
    const result = await VehiclePhotoService.deletePhotoFromGallery(vehicle.id, photoUrl);
    setDeleting(null);
    if (result.success) {
      // Refresh photo details
      const details = await VehiclePhotoService.getVehiclePhotoDetails(vehicle.id);
      setPhotoDetails(details);
      onPhotoDeleted();
    }
  };

  const handleSetFeatured = async (photoUrl: string) => {
    if (!vehicle) return;
    setSettingFeatured(photoUrl);
    const result = await VehiclePhotoService.setFeaturedImage(vehicle.id, photoUrl);
    setSettingFeatured(null);
    if (result.success) {
      // Refresh photo details
      const details = await VehiclePhotoService.getVehiclePhotoDetails(vehicle.id);
      setPhotoDetails(details);
      onFeaturedChanged();
    }
  };

  const handleUploadNew = async () => {
    if (!vehicle || newFiles.length === 0) return;
    setUploading(true);
    setUploadProgress(0);

    const progressInterval = setInterval(() => {
      setUploadProgress(prev => Math.min(prev + 10, 90));
    }, 200);

    const result = await VehiclePhotoService.appendPhotosToGallery(
      vehicle.id,
      newFiles,
      false
    );

    clearInterval(progressInterval);
    setUploadProgress(100);

    if (result.success) {
      // Clear new files
      newFiles.forEach(f => URL.revokeObjectURL(f.preview));
      setNewFiles([]);
      // Refresh photo details
      const details = await VehiclePhotoService.getVehiclePhotoDetails(vehicle.id);
      setPhotoDetails(details);
      onPhotosAdded();
    }

    setUploading(false);
  };

  const handleClose = () => {
    newFiles.forEach(f => URL.revokeObjectURL(f.preview));
    setNewFiles([]);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Images className="w-5 h-5" />
            Administrar Fotos
          </DialogTitle>
          <DialogDescription>
            {vehicle && (
              <div className="flex items-center gap-2 mt-1">
                <span className="font-mono text-xs bg-muted px-2 py-1 rounded">
                  {vehicle.ordencompra || 'Sin OC'}
                </span>
                <span>{vehicle.title}</span>
              </div>
            )}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Current Photos Grid */}
            <div>
              <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                <Camera className="w-4 h-4" />
                Fotos Actuales ({allPhotos.length})
              </h3>

              {allPhotos.length === 0 ? (
                <div className="text-center py-8 bg-muted/30 rounded-lg">
                  <ImageOff className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground text-sm">No hay fotos</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {allPhotos.map((photoUrl, index) => {
                    const isFeatured = photoUrl === currentFeatured;
                    const isDeleting = deleting === photoUrl;
                    const isSettingFeatured = settingFeatured === photoUrl;

                    return (
                      <div
                        key={`${photoUrl}-${index}`}
                        className={`relative group rounded-lg overflow-hidden border-2 transition-all ${
                          isFeatured ? 'border-amber-500 ring-2 ring-amber-500/20' : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <div className="aspect-square relative">
                          <Image
                            src={photoUrl}
                            alt={`Foto ${index + 1}`}
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 50vw, 25vw"
                          />
                        </div>

                        {/* Featured Badge */}
                        {isFeatured && (
                          <div className="absolute top-2 left-2">
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-500 text-white text-xs font-semibold rounded-full shadow-md">
                              <Star className="w-3 h-3" />
                              Principal
                            </span>
                          </div>
                        )}

                        {/* Hover Overlay with Actions */}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          {/* Set as Featured */}
                          {!isFeatured && (
                            <Button
                              size="icon"
                              variant="secondary"
                              className="h-8 w-8"
                              onClick={() => handleSetFeatured(photoUrl)}
                              disabled={isSettingFeatured || isDeleting}
                              title="Hacer foto principal"
                            >
                              {isSettingFeatured ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Star className="w-4 h-4" />
                              )}
                            </Button>
                          )}

                          {/* Delete */}
                          <Button
                            size="icon"
                            variant="destructive"
                            className="h-8 w-8"
                            onClick={() => handleDelete(photoUrl)}
                            disabled={isDeleting || isSettingFeatured}
                            title="Eliminar foto"
                          >
                            {isDeleting ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Add New Photos Section */}
            <div className="border-t pt-6">
              <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Agregar Nuevas Fotos
              </h3>

              <div
                {...getRootProps()}
                className={`
                  border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all
                  ${isDragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}
                  ${uploading ? 'pointer-events-none opacity-50' : ''}
                `}
              >
                <input {...getInputProps()} />
                <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                {isDragActive ? (
                  <p className="text-primary font-medium">Suelta las fotos aquí...</p>
                ) : (
                  <>
                    <p className="text-foreground font-medium">Arrastra fotos aquí</p>
                    <p className="text-muted-foreground text-sm mt-1">o haz clic para seleccionar</p>
                  </>
                )}
              </div>

              {/* New Files Preview */}
              {newFiles.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm text-muted-foreground mb-2">
                    {newFiles.length} foto{newFiles.length > 1 ? 's' : ''} seleccionada{newFiles.length > 1 ? 's' : ''}
                  </p>
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                    {newFiles.map(file => (
                      <div key={file.id} className="relative group">
                        <div className="aspect-square rounded-lg overflow-hidden border border-border">
                          <img
                            src={file.preview}
                            alt={file.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeNewFile(file.id)}
                          className="absolute -top-1 -right-1 p-1 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>

                  {uploading && (
                    <div className="mt-3 space-y-2">
                      <Progress value={uploadProgress} className="h-2" />
                      <p className="text-sm text-muted-foreground text-center">
                        Subiendo fotos... {uploadProgress}%
                      </p>
                    </div>
                  )}

                  <Button
                    onClick={handleUploadNew}
                    disabled={uploading}
                    className="mt-3 w-full"
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Subiendo...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        Subir {newFiles.length} Foto{newFiles.length > 1 ? 's' : ''}
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// All Vehicles DataTable Component
function AllVehiclesTable({
  vehicles,
  loading,
  onRefresh,
  onEdit,
}: {
  vehicles: VehicleEditData[];
  loading: boolean;
  onRefresh: () => void;
  onEdit: (vehicle: VehicleEditData) => void;
}) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredVehicles = useMemo(() => {
    if (!searchTerm.trim()) return vehicles;
    const search = searchTerm.toLowerCase();
    return vehicles.filter(v =>
      v.title.toLowerCase().includes(search) ||
      v.ordencompra?.toLowerCase().includes(search) ||
      v.marca?.toLowerCase().includes(search) ||
      v.modelo?.toLowerCase().includes(search) ||
      v.ubicacion?.toLowerCase().includes(search)
    );
  }, [vehicles, searchTerm]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search and Refresh */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por OC, título, marca, sucursal..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button variant="outline" onClick={onRefresh} className="flex items-center gap-2">
          <RefreshCw className="w-4 h-4" />
          Actualizar
        </Button>
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-20">Foto</TableHead>
              <TableHead>Vehículo</TableHead>
              <TableHead className="w-28">Sucursal</TableHead>
              <TableHead className="w-24">Fotos</TableHead>
              <TableHead className="w-28">Estado</TableHead>
              <TableHead className="w-28 text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredVehicles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <Car className="w-8 h-8 text-muted-foreground" />
                    <p className="text-muted-foreground">
                      {searchTerm ? 'No se encontraron vehículos' : 'No hay vehículos comprados'}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredVehicles.map(vehicle => (
                <TableRow key={vehicle.id} className="hover:bg-muted/30">
                  {/* Thumbnail */}
                  <TableCell>
                    <div className="w-16 h-12 rounded-md overflow-hidden bg-muted relative">
                      {vehicle.thumbnail_url ? (
                        <Image
                          src={vehicle.thumbnail_url}
                          alt={vehicle.title}
                          fill
                          className="object-cover"
                          sizes="64px"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ImageOff className="w-4 h-4 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                  </TableCell>

                  {/* Vehicle Info */}
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded">
                          {vehicle.ordencompra || 'Sin OC'}
                        </span>
                      </div>
                      <p className="font-medium text-sm">{vehicle.title}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {vehicle.autoano && <span>{vehicle.autoano}</span>}
                        {vehicle.kilometraje && (
                          <>
                            <span>•</span>
                            <span>{vehicle.kilometraje.toLocaleString()} km</span>
                          </>
                        )}
                      </div>
                    </div>
                  </TableCell>

                  {/* Location */}
                  <TableCell>
                    <span className="text-sm">
                      {vehicle.ubicacion || '-'}
                    </span>
                  </TableCell>

                  {/* Photo Status */}
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      {vehicle.has_feature_image ? (
                        <Badge variant="secondary" className="text-xs w-fit">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Principal
                        </Badge>
                      ) : (
                        <Badge variant="destructive" className="text-xs w-fit">
                          <AlertCircle className="w-3 h-3 mr-1" />
                          Sin foto
                        </Badge>
                      )}
                      {vehicle.gallery_count > 0 && (
                        <Badge variant="outline" className="text-xs w-fit">
                          <Images className="w-3 h-3 mr-1" />
                          {vehicle.gallery_count}
                        </Badge>
                      )}
                    </div>
                  </TableCell>

                  {/* Status */}
                  <TableCell>
                    <Badge
                      variant={vehicle.ordenstatus === 'Comprado' ? 'default' : 'secondary'}
                      className={vehicle.ordenstatus === 'Comprado' ? 'bg-green-600' : ''}
                    >
                      {vehicle.ordenstatus || 'Sin estado'}
                    </Badge>
                  </TableCell>

                  {/* Actions */}
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onEdit(vehicle)}
                      className="gap-2"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      Editar
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Summary */}
      <p className="text-sm text-muted-foreground">
        Mostrando {filteredVehicles.length} de {vehicles.length} vehículos
      </p>
    </div>
  );
}

// Vehicles Without Photos Table
function VehiclesWithoutPhotosTable({
  vehicles,
  loading,
  onRefresh,
  onUpload,
}: {
  vehicles: VehicleWithoutPhotos[];
  loading: boolean;
  onRefresh: () => void;
  onUpload: (vehicle: VehicleWithoutPhotos) => void;
}) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (vehicles.length === 0) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="py-12 text-center">
          <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground">Todos los autos tienen fotos</h3>
          <p className="text-muted-foreground mt-1">No hay vehículos pendientes de cargar fotos.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          variant="outline"
          onClick={onRefresh}
          disabled={loading}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Actualizar
        </Button>
      </div>
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
                  onClick={() => onUpload(vehicle)}
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
    </div>
  );
}

// Main Component
export default function AdminPhotoUploadPage() {
  const [activeTab, setActiveTab] = useState<'todos' | 'sin-fotos' | 'con-fotos'>('todos');

  // All vehicles state
  const [allVehicles, setAllVehicles] = useState<VehicleEditData[]>([]);
  const [loadingAll, setLoadingAll] = useState(true);

  // Vehicles without photos state
  const [vehiclesWithoutPhotos, setVehiclesWithoutPhotos] = useState<VehicleWithoutPhotos[]>([]);
  const [loadingWithout, setLoadingWithout] = useState(true);

  // Vehicles with photos state
  const [vehiclesWithPhotos, setVehiclesWithPhotos] = useState<VehicleWithPhotos[]>([]);
  const [loadingWith, setLoadingWith] = useState(true);

  // Edit dialog state
  const [editingVehicle, setEditingVehicle] = useState<VehicleEditData | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  // Upload sheet state
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleWithoutPhotos | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  // Photo manager dialog state
  const [photoManagerVehicle, setPhotoManagerVehicle] = useState<VehicleWithPhotos | null>(null);
  const [photoDialogOpen, setPhotoDialogOpen] = useState(false);

  // Upload state for sheet
  const [featuredImage, setFeaturedImage] = useState<PreviewFile | null>(null);
  const [galleryImages, setGalleryImages] = useState<PreviewFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [uploadMessage, setUploadMessage] = useState('');

  // Fetch all vehicles
  const fetchAllVehicles = useCallback(async () => {
    try {
      setLoadingAll(true);
      const data = await VehiclePhotoService.getAllVehiclesForEdit();
      setAllVehicles(data);
    } catch (error) {
      console.error('Error fetching all vehicles:', error);
    } finally {
      setLoadingAll(false);
    }
  }, []);

  // Fetch vehicles without photos
  const fetchVehiclesWithoutPhotos = useCallback(async () => {
    try {
      setLoadingWithout(true);
      const data = await VehiclePhotoService.getVehiclesWithoutPhotos();
      setVehiclesWithoutPhotos(data);
    } catch (error) {
      console.error('Error fetching vehicles:', error);
    } finally {
      setLoadingWithout(false);
    }
  }, []);

  // Fetch vehicles with photos
  const fetchVehiclesWithPhotos = useCallback(async () => {
    try {
      setLoadingWith(true);
      const data = await VehiclePhotoService.getVehiclesWithPhotos();
      setVehiclesWithPhotos(data);
    } catch (error) {
      console.error('Error fetching vehicles with photos:', error);
    } finally {
      setLoadingWith(false);
    }
  }, []);

  useEffect(() => {
    fetchAllVehicles();
    fetchVehiclesWithoutPhotos();
    fetchVehiclesWithPhotos();
  }, [fetchAllVehicles, fetchVehiclesWithoutPhotos, fetchVehiclesWithPhotos]);

  // Generate unique ID for files
  const generateId = () => `file-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

  // Dropzone for featured image
  const onDropFeatured = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
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
      const allFiles: File[] = [];
      if (featuredImage) {
        allFiles.push(featuredImage);
      }
      allFiles.push(...galleryImages);

      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const result = await VehiclePhotoService.uploadAndLinkPhotos(
        selectedVehicle.id,
        allFiles,
        !!featuredImage
      );

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (result.success) {
        setUploadStatus('success');
        setUploadMessage(`${result.uploadedCount} foto${result.uploadedCount > 1 ? 's' : ''} subida${result.uploadedCount > 1 ? 's' : ''} y vinculada${result.uploadedCount > 1 ? 's' : ''} exitosamente.`);

        // Refresh all lists
        fetchAllVehicles();
        fetchVehiclesWithoutPhotos();
        fetchVehiclesWithPhotos();

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

  // Count stats
  const withPhotosCount = allVehicles.filter(v => v.has_feature_image && v.has_gallery).length;
  const withoutPhotosCount = allVehicles.filter(v => !v.has_feature_image || !v.has_gallery).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Camera className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">Gestor de Fotos</h1>
            <p className="text-sm text-muted-foreground">
              Administra fotos y datos del inventario comprado
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-500/10 rounded-full">
                <Car className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{allVehicles.length}</p>
                <p className="text-sm text-muted-foreground">Total Comprados</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-amber-500/10 rounded-full">
                <ImageOff className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{withoutPhotosCount}</p>
                <p className="text-sm text-muted-foreground">Sin fotos completas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-500/10 rounded-full">
                <Images className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{withPhotosCount}</p>
                <p className="text-sm text-muted-foreground">Con fotos completas</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
        <TabsList className="grid w-full max-w-lg grid-cols-3">
          <TabsTrigger value="todos" className="gap-2">
            <Car className="w-4 h-4" />
            Todos ({allVehicles.length})
          </TabsTrigger>
          <TabsTrigger value="sin-fotos" className="gap-2">
            <ImageOff className="w-4 h-4" />
            Sin Fotos ({vehiclesWithoutPhotos.length})
          </TabsTrigger>
          <TabsTrigger value="con-fotos" className="gap-2">
            <Images className="w-4 h-4" />
            Con Fotos ({vehiclesWithPhotos.length})
          </TabsTrigger>
        </TabsList>

        {/* Tab: All Vehicles */}
        <TabsContent value="todos" className="mt-6">
          <AllVehiclesTable
            vehicles={allVehicles}
            loading={loadingAll}
            onRefresh={fetchAllVehicles}
            onEdit={(vehicle) => {
              setEditingVehicle(vehicle);
              setEditDialogOpen(true);
            }}
          />
        </TabsContent>

        {/* Tab: Vehicles Without Photos */}
        <TabsContent value="sin-fotos" className="mt-6">
          <VehiclesWithoutPhotosTable
            vehicles={vehiclesWithoutPhotos}
            loading={loadingWithout}
            onRefresh={fetchVehiclesWithoutPhotos}
            onUpload={handleOpenSheet}
          />
        </TabsContent>

        {/* Tab: Vehicles With Photos */}
        <TabsContent value="con-fotos" className="mt-6">
          <AllVehiclesTable
            vehicles={allVehicles.filter(v => v.has_feature_image || v.has_gallery)}
            loading={loadingAll}
            onRefresh={fetchAllVehicles}
            onEdit={(vehicle) => {
              setEditingVehicle(vehicle);
              setEditDialogOpen(true);
            }}
          />
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <VehicleEditDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        vehicle={editingVehicle}
        onSaved={() => {
          fetchAllVehicles();
          fetchVehiclesWithoutPhotos();
          fetchVehiclesWithPhotos();
        }}
      />

      {/* Upload Sheet (for vehicles without photos) */}
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
                  <div className="absolute top-3 left-3">
                    <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-500 text-white text-xs font-semibold rounded-full shadow-md">
                      <Star className="w-3 h-3" />
                      Principal
                    </span>
                  </div>
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

              {galleryImages.length > 0 && (
                <div className="space-y-2">
                  {galleryImages.map((file, index) => (
                    <div
                      key={file.id}
                      className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg border border-border"
                    >
                      <div className="text-muted-foreground">
                        <GripVertical className="w-4 h-4" />
                      </div>
                      <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
                        <img
                          src={file.preview}
                          alt={`Galería ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{file.name}</p>
                        <p className="text-xs text-muted-foreground">Posición: {index + 1}</p>
                      </div>
                      {!uploading && (
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => moveImageUp(index)}
                            disabled={index === 0}
                          >
                            <ChevronUp className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => moveImageDown(index)}
                            disabled={index === galleryImages.length - 1}
                          >
                            <ChevronDown className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-amber-500 hover:text-amber-600 hover:bg-amber-50"
                            onClick={() => promoteToFeatured(file.id)}
                            title="Hacer foto principal"
                          >
                            <Star className="w-4 h-4" />
                          </Button>
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

            {uploadStatus === 'uploading' && (
              <div className="space-y-2">
                <Progress value={uploadProgress} className="h-2" />
                <p className="text-sm text-muted-foreground text-center">
                  Subiendo fotos... {uploadProgress}%
                </p>
              </div>
            )}

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
