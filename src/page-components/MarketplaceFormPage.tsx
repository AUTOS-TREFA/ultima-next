'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { ConsignmentService, ConsignmentListing } from '@/services/ConsignmentService';
import { ImageService } from '@/services/ImageService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Store,
  ArrowLeft,
  Save,
  Send,
  Upload,
  X,
  ImagePlus,
  AlertCircle,
  CheckCircle,
  Car,
  DollarSign,
  MapPin,
  FileText,
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { formatPrice } from '@/utils/formatters';

interface MarketplaceFormPageProps {
  mode: 'create' | 'edit';
  listingId?: string;
}

const MEXICAN_STATES = [
  'Aguascalientes', 'Baja California', 'Baja California Sur', 'Campeche', 'Chiapas',
  'Chihuahua', 'Coahuila', 'Colima', 'Durango', 'Guanajuato', 'Guerrero', 'Hidalgo',
  'Jalisco', 'México', 'Michoacán', 'Morelos', 'Nayarit', 'Nuevo León', 'Oaxaca',
  'Puebla', 'Querétaro', 'Quintana Roo', 'San Luis Potosí', 'Sinaloa', 'Sonora',
  'Tabasco', 'Tamaulipas', 'Tlaxcala', 'Veracruz', 'Yucatán', 'Zacatecas',
];

const FUEL_TYPES = ['Gasolina', 'Diesel', 'Híbrido', 'Eléctrico', 'Gas LP', 'Flex'];
const TRANSMISSIONS = ['Manual', 'Automática', 'CVT', 'Doble Embrague'];
const COLORS = [
  'Blanco', 'Negro', 'Plata', 'Gris', 'Rojo', 'Azul', 'Verde', 'Amarillo',
  'Naranja', 'Café', 'Dorado', 'Otro',
];

const MarketplaceFormPage: React.FC<MarketplaceFormPageProps> = ({ mode, listingId }) => {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [loading, setLoading] = useState(mode === 'edit');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Form state
  const [formData, setFormData] = useState<Partial<ConsignmentListing>>({
    brand: '',
    model: '',
    year: new Date().getFullYear(),
    version: '',
    mileage: 0,
    price: 0,
    negotiable: true,
    description: '',
    transmission: '',
    fuel_type: '',
    exterior_color: '',
    interior_color: '',
    state: 'Nuevo León',
    city: '',
  });

  // Image upload state
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<any[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [primaryImageIndex, setPrimaryImageIndex] = useState(0);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/acceder');
      return;
    }

    if (mode === 'edit' && listingId && user) {
      loadListing();
    }
  }, [user, authLoading, mode, listingId]);

  const loadListing = async () => {
    if (!user || !listingId) return;

    setLoading(true);
    try {
      const listing = await ConsignmentService.getMyListingById(user.id, listingId);
      if (!listing) {
        setError('Listado no encontrado');
        return;
      }

      setFormData(listing);

      // Load existing images
      const imgs = await ConsignmentService.getListingImages(listingId);
      setExistingImages(imgs);

      // Find primary image index
      const primaryIdx = imgs.findIndex(img => img.is_primary);
      if (primaryIdx !== -1) {
        setPrimaryImageIndex(primaryIdx);
      }
    } catch (err: any) {
      console.error('Error loading listing:', err);
      setError(err.message || 'Error al cargar el listado');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof ConsignmentListing, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Limit to 20 images total
    const totalImages = images.length + existingImages.length + files.length;
    if (totalImages > 20) {
      setError('Máximo 20 imágenes permitidas');
      return;
    }

    setImages(prev => [...prev, ...files]);

    // Generate previews
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeNewImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const removeExistingImage = async (imageId: string, index: number) => {
    if (!user || !listingId) return;

    try {
      await ConsignmentService.deleteListingImage(user.id, listingId, imageId);
      setExistingImages(prev => prev.filter(img => img.id !== imageId));

      // Adjust primary index if needed
      if (index === primaryImageIndex && existingImages.length > 1) {
        setPrimaryImageIndex(0);
      }
    } catch (err: any) {
      console.error('Error deleting image:', err);
      setError('Error al eliminar imagen');
    }
  };

  const validate = (): string | null => {
    if (!formData.brand || formData.brand.trim().length === 0) return 'La marca es requerida';
    if (!formData.model || formData.model.trim().length === 0) return 'El modelo es requerido';
    if (!formData.year || formData.year < 1990 || formData.year > new Date().getFullYear() + 1) {
      return 'Año inválido';
    }
    if (!formData.price || formData.price <= 0) return 'El precio debe ser mayor a 0';
    if (mode === 'create' && images.length === 0) return 'Debes subir al menos 1 imagen';

    return null;
  };

  const handleSaveDraft = async () => {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    await saveListing('draft');
  };

  const handleSubmitForReview = async () => {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    await saveListing('submit');
  };

  const saveListing = async (action: 'draft' | 'submit') => {
    if (!user) return;

    setSaving(true);
    setError(null);

    try {
      let savedListing: ConsignmentListing;

      // Create or update listing
      if (mode === 'create') {
        savedListing = await ConsignmentService.createListing(user.id, formData);
      } else if (listingId) {
        savedListing = await ConsignmentService.updateListing(user.id, listingId, formData);
      } else {
        throw new Error('ID de listado no válido');
      }

      // Upload new images if any
      if (images.length > 0) {
        setUploadingImages(true);
        for (let i = 0; i < images.length; i++) {
          const file = images[i];
          const existingCount = existingImages.length;
          const isPrimary = (existingCount === 0 && i === 0); // First image is primary if no existing images

          try {
            const { storagePath, publicUrl } = await ImageService.uploadConsignmentImage(
              savedListing.id,
              file
            );

            await ConsignmentService.addListingImage(
              user.id,
              savedListing.id,
              storagePath,
              publicUrl,
              'exterior', // Default to exterior, user can categorize later
              isPrimary
            );
          } catch (uploadErr) {
            console.error('Error uploading image:', uploadErr);
            // Continue with other images
          }
        }
        setUploadingImages(false);
      }

      // Submit for approval if requested
      if (action === 'submit') {
        await ConsignmentService.submitForApproval(user.id, savedListing.id);
      }

      setSuccess(true);

      // Redirect after short delay
      setTimeout(() => {
        router.push('/escritorio/marketplace');
      }, 1500);
    } catch (err: any) {
      console.error('Error saving listing:', err);
      setError(err.message || 'Error al guardar el listado');
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (success) {
    return (
      <Card className="max-w-md mx-auto mt-12">
        <CardContent className="pt-6 text-center">
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">
            {mode === 'create' ? '¡Listado creado!' : '¡Cambios guardados!'}
          </h2>
          <p className="text-muted-foreground">
            Redirigiendo al dashboard...
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/escritorio/marketplace')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                <Store className="w-6 h-6 text-primary" />
                {mode === 'create' ? 'Nuevo Listado' : 'Editar Listado'}
              </h1>
              <p className="text-muted-foreground text-sm mt-1">
                {mode === 'create'
                  ? 'Publica tu vehículo en nuestro marketplace'
                  : 'Actualiza la información de tu vehículo'}
              </p>
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Form Tabs */}
        <Tabs defaultValue="vehicle" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="vehicle">
              <Car className="w-4 h-4 mr-2" />
              Vehículo
            </TabsTrigger>
            <TabsTrigger value="pricing">
              <DollarSign className="w-4 h-4 mr-2" />
              Precio
            </TabsTrigger>
            <TabsTrigger value="images">
              <ImagePlus className="w-4 h-4 mr-2" />
              Fotos ({existingImages.length + images.length})
            </TabsTrigger>
          </TabsList>

          {/* Vehicle Info Tab */}
          <TabsContent value="vehicle" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Información del vehículo</CardTitle>
                <CardDescription>
                  Proporciona los detalles básicos de tu vehículo
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="brand">Marca *</Label>
                    <Input
                      id="brand"
                      placeholder="Ej: Toyota"
                      value={formData.brand || ''}
                      onChange={e => handleInputChange('brand', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="model">Modelo *</Label>
                    <Input
                      id="model"
                      placeholder="Ej: Camry"
                      value={formData.model || ''}
                      onChange={e => handleInputChange('model', e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="year">Año *</Label>
                    <Input
                      id="year"
                      type="number"
                      min="1990"
                      max={new Date().getFullYear() + 1}
                      value={formData.year || ''}
                      onChange={e => handleInputChange('year', parseInt(e.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="version">Versión</Label>
                    <Input
                      id="version"
                      placeholder="Ej: XLE"
                      value={formData.version || ''}
                      onChange={e => handleInputChange('version', e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="mileage">Kilometraje</Label>
                    <Input
                      id="mileage"
                      type="number"
                      placeholder="Ej: 50000"
                      value={formData.mileage || ''}
                      onChange={e => handleInputChange('mileage', parseInt(e.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="transmission">Transmisión</Label>
                    <Select
                      value={formData.transmission || ''}
                      onValueChange={value => handleInputChange('transmission', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona transmisión" />
                      </SelectTrigger>
                      <SelectContent>
                        {TRANSMISSIONS.map(t => (
                          <SelectItem key={t} value={t}>{t}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fuel_type">Combustible</Label>
                    <Select
                      value={formData.fuel_type || ''}
                      onValueChange={value => handleInputChange('fuel_type', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona combustible" />
                      </SelectTrigger>
                      <SelectContent>
                        {FUEL_TYPES.map(f => (
                          <SelectItem key={f} value={f}>{f}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="exterior_color">Color exterior</Label>
                    <Select
                      value={formData.exterior_color || ''}
                      onValueChange={value => handleInputChange('exterior_color', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona color" />
                      </SelectTrigger>
                      <SelectContent>
                        {COLORS.map(c => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descripción</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe las características y condición de tu vehículo..."
                    rows={5}
                    value={formData.description || ''}
                    onChange={e => handleInputChange('description', e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Incluye detalles sobre el estado, servicios recientes, accesorios, etc.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Ubicación</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="state">Estado</Label>
                    <Select
                      value={formData.state || ''}
                      onValueChange={value => handleInputChange('state', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona estado" />
                      </SelectTrigger>
                      <SelectContent>
                        {MEXICAN_STATES.map(s => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city">Ciudad</Label>
                    <Input
                      id="city"
                      placeholder="Ej: Monterrey"
                      value={formData.city || ''}
                      onChange={e => handleInputChange('city', e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Pricing Tab */}
          <TabsContent value="pricing" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Precio y negociación</CardTitle>
                <CardDescription>
                  Establece el precio de venta de tu vehículo
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Precio *</Label>
                  <Input
                    id="price"
                    type="number"
                    placeholder="Ej: 250000"
                    value={formData.price || ''}
                    onChange={e => handleInputChange('price', parseFloat(e.target.value))}
                  />
                  {formData.price && formData.price > 0 && (
                    <p className="text-sm text-muted-foreground">
                      {formatPrice(formData.price)}
                    </p>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="negotiable"
                    checked={formData.negotiable}
                    onCheckedChange={checked => handleInputChange('negotiable', checked)}
                  />
                  <Label htmlFor="negotiable" className="cursor-pointer">
                    El precio es negociable
                  </Label>
                </div>

                <Alert>
                  <FileText className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Nota:</strong> TREFA cobrará una comisión del 5% sobre el precio de venta
                    una vez que el vehículo sea vendido.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Images Tab */}
          <TabsContent value="images" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Fotos del vehículo</CardTitle>
                <CardDescription>
                  Sube hasta 20 fotos de tu vehículo. La primera foto será la principal.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Image upload */}
                <div className="border-2 border-dashed rounded-lg p-6 text-center">
                  <Input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageSelect}
                    className="hidden"
                    id="image-upload"
                  />
                  <Label htmlFor="image-upload" className="cursor-pointer">
                    <div className="flex flex-col items-center">
                      <Upload className="w-12 h-12 text-muted-foreground mb-2" />
                      <p className="text-sm font-medium">Click para subir fotos</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Máximo 20 imágenes (JPG, PNG, WebP)
                      </p>
                    </div>
                  </Label>
                </div>

                {/* Existing images grid */}
                {existingImages.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Fotos actuales</h4>
                    <div className="grid grid-cols-4 gap-4">
                      {existingImages.map((img, index) => (
                        <div key={img.id} className="relative group">
                          <img
                            src={img.public_url}
                            alt={`Imagen ${index + 1}`}
                            className="w-full h-24 object-cover rounded-lg"
                          />
                          {img.is_primary && (
                            <Badge className="absolute top-1 left-1 text-xs">Principal</Badge>
                          )}
                          <Button
                            size="sm"
                            variant="destructive"
                            className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => removeExistingImage(img.id, index)}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* New images preview grid */}
                {imagePreviews.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Fotos nuevas</h4>
                    <div className="grid grid-cols-4 gap-4">
                      {imagePreviews.map((preview, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={preview}
                            alt={`Nueva imagen ${index + 1}`}
                            className="w-full h-24 object-cover rounded-lg"
                          />
                          {existingImages.length === 0 && index === 0 && (
                            <Badge className="absolute top-1 left-1 text-xs">Principal</Badge>
                          )}
                          <Button
                            size="sm"
                            variant="destructive"
                            className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => removeNewImage(index)}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {uploadingImages && (
                  <Alert>
                    <AlertDescription className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-primary"></div>
                      Subiendo imágenes...
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Action Buttons */}
        <Card>
          <CardFooter className="flex justify-between pt-6">
            <Button
              variant="outline"
              onClick={() => router.push('/escritorio/marketplace')}
              disabled={saving}
            >
              Cancelar
            </Button>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleSaveDraft}
                disabled={saving || uploadingImages}
              >
                <Save className="w-4 h-4 mr-2" />
                Guardar borrador
              </Button>
              <Button
                onClick={handleSubmitForReview}
                disabled={saving || uploadingImages}
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                    Guardando...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Enviar a revisión
                  </>
                )}
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>
  );
};

export default MarketplaceFormPage;
