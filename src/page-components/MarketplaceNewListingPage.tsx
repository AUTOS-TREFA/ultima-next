'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/lib/supabase/client';
import { ConsignmentService } from '@/services/ConsignmentService';
import { Upload, X, Car, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const listingSchema = z.object({
  brand: z.string().min(1, 'La marca es requerida'),
  model: z.string().min(1, 'El modelo es requerido'),
  year: z.number().min(1900).max(new Date().getFullYear() + 1),
  version: z.string().optional(),
  mileage: z.number().min(0, 'El kilometraje debe ser mayor a 0'),
  price: z.number().min(1, 'El precio debe ser mayor a 0'),
  negotiable: z.boolean().default(true),
  description: z.string().min(20, 'La descripción debe tener al menos 20 caracteres'),
  state: z.string().min(1, 'El estado es requerido'),
  city: z.string().min(1, 'La ciudad es requerida'),
});

type ListingFormData = z.infer<typeof listingSchema>;

interface UploadedImage {
  file: File;
  preview: string;
  uploaded?: boolean;
}

export default function MarketplaceNewListingPage() {
  const router = useRouter();
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ListingFormData>({
    resolver: zodResolver(listingSchema),
    defaultValues: {
      negotiable: true,
    },
  });

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    if (images.length + files.length > 20) {
      setError('Máximo 20 imágenes permitidas');
      return;
    }

    const newImages: UploadedImage[] = files.map(file => ({
      file,
      preview: URL.createObjectURL(file),
    }));

    setImages(prev => [...prev, ...newImages]);
    setError(null);
  };

  const removeImage = (index: number) => {
    setImages(prev => {
      const updated = [...prev];
      URL.revokeObjectURL(updated[index].preview);
      updated.splice(index, 1);
      return updated;
    });
  };

  const uploadImages = async (listingId: string, userId: string): Promise<void> => {
    for (let i = 0; i < images.length; i++) {
      const image = images[i];
      const timestamp = Date.now();
      const fileName = `consignment/${listingId}/${timestamp}-${i}-${image.file.name}`;

      // Upload to storage
      const { data, error: uploadError } = await supabase.storage
        .from('marketplace-photos')
        .upload(fileName, image.file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        console.error('Error uploading image:', uploadError);
        throw uploadError;
      }

      if (data) {
        // Get public URL
        const { data: urlData } = supabase.storage
          .from('marketplace-photos')
          .getPublicUrl(data.path);

        // Add image to listing using service
        await ConsignmentService.addListingImage(
          userId,
          listingId,
          data.path,
          urlData.publicUrl,
          'exterior',
          i === 0 // First image is primary
        );
      }
    }
  };

  const onSubmit = async (data: ListingFormData) => {
    try {
      setError(null);
      setUploading(true);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('No hay usuario autenticado');
      }

      // Create listing using ConsignmentService
      const listing = await ConsignmentService.createListing(user.id, {
        brand: data.brand,
        model: data.model,
        year: data.year,
        version: data.version || undefined,
        mileage: data.mileage,
        price: data.price,
        negotiable: data.negotiable,
        description: data.description,
        state: data.state,
        city: data.city,
      });

      // Upload images
      if (images.length > 0) {
        await uploadImages(listing.id, user.id);
      }

      // Submit for approval automatically
      await ConsignmentService.submitForApproval(user.id, listing.id);

      setSuccess(true);
      setTimeout(() => {
        router.push('/escritorio/marketplace');
      }, 2000);
    } catch (err: any) {
      console.error('Error creating listing:', err);
      setError(err.message || 'Error al crear el listing');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-3 sm:p-4 md:p-6 space-y-3 sm:space-y-4">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-orange-100 rounded-lg">
          <Car className="w-6 h-6 text-orange-600" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Publicar Vehículo</h1>
          <p className="text-sm text-gray-600">Completa la información de tu vehículo</p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="mb-4 bg-green-50 border-green-200">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            ¡Listing creado exitosamente! Tu vehículo está pendiente de aprobación.
          </AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Vehicle Information */}
        <Card className="bg-white/95 border-gray-100">
          <CardHeader className="p-3 sm:p-4">
            <CardTitle className="text-base sm:text-lg">Información del Vehículo</CardTitle>
            <CardDescription className="text-sm">Detalles básicos de tu auto</CardDescription>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label htmlFor="brand" className="text-sm">Marca *</Label>
                <Input
                  id="brand"
                  {...register('brand')}
                  placeholder="Ej: Toyota"
                  className="mt-1"
                />
                {errors.brand && (
                  <p className="text-xs text-red-600 mt-1">{errors.brand.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="model" className="text-sm">Modelo *</Label>
                <Input
                  id="model"
                  {...register('model')}
                  placeholder="Ej: Corolla"
                  className="mt-1"
                />
                {errors.model && (
                  <p className="text-xs text-red-600 mt-1">{errors.model.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label htmlFor="year" className="text-sm">Año *</Label>
                <Input
                  id="year"
                  type="number"
                  {...register('year', { valueAsNumber: true })}
                  placeholder="2020"
                  className="mt-1"
                />
                {errors.year && (
                  <p className="text-xs text-red-600 mt-1">{errors.year.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="version" className="text-sm">Versión</Label>
                <Input
                  id="version"
                  {...register('version')}
                  placeholder="Ej: XLE Premium"
                  className="mt-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label htmlFor="mileage" className="text-sm">Kilometraje *</Label>
                <Input
                  id="mileage"
                  type="number"
                  {...register('mileage', { valueAsNumber: true })}
                  placeholder="50000"
                  className="mt-1"
                />
                {errors.mileage && (
                  <p className="text-xs text-red-600 mt-1">{errors.mileage.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="price" className="text-sm">Precio (MXN) *</Label>
                <Input
                  id="price"
                  type="number"
                  {...register('price', { valueAsNumber: true })}
                  placeholder="250000"
                  className="mt-1"
                />
                {errors.price && (
                  <p className="text-xs text-red-600 mt-1">{errors.price.message}</p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="description" className="text-sm">Descripción *</Label>
              <Textarea
                id="description"
                {...register('description')}
                placeholder="Describe tu vehículo, características especiales, mantenimiento, etc."
                rows={4}
                className="mt-1"
              />
              {errors.description && (
                <p className="text-xs text-red-600 mt-1">{errors.description.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Location */}
        <Card className="bg-white/95 border-gray-100">
          <CardHeader className="p-3 sm:p-4">
            <CardTitle className="text-base sm:text-lg">Ubicación</CardTitle>
            <CardDescription className="text-sm">¿Dónde se encuentra el vehículo?</CardDescription>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label htmlFor="state" className="text-sm">Estado *</Label>
                <Input
                  id="state"
                  {...register('state')}
                  placeholder="Ej: Jalisco"
                  className="mt-1"
                />
                {errors.state && (
                  <p className="text-xs text-red-600 mt-1">{errors.state.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="city" className="text-sm">Ciudad *</Label>
                <Input
                  id="city"
                  {...register('city')}
                  placeholder="Ej: Guadalajara"
                  className="mt-1"
                />
                {errors.city && (
                  <p className="text-xs text-red-600 mt-1">{errors.city.message}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Photos */}
        <Card className="bg-white/95 border-gray-100">
          <CardHeader className="p-3 sm:p-4">
            <CardTitle className="text-base sm:text-lg">Fotografías</CardTitle>
            <CardDescription className="text-sm">
              Sube hasta 20 fotos de tu vehículo
            </CardDescription>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {images.map((img, index) => (
                <div key={index} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
                  <img
                    src={img.preview}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                  {index === 0 && (
                    <div className="absolute bottom-1 left-1 px-2 py-0.5 bg-orange-600 text-white text-xs rounded">
                      Principal
                    </div>
                  )}
                </div>
              ))}

              {images.length < 20 && (
                <label className="aspect-square rounded-lg border-2 border-dashed border-gray-300 hover:border-orange-500 cursor-pointer flex flex-col items-center justify-center gap-2 transition-colors bg-gray-50">
                  <Upload className="w-6 h-6 text-gray-400" />
                  <span className="text-xs text-gray-600">Subir foto</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                </label>
              )}
            </div>
            <p className="text-xs text-gray-500">
              {images.length} de 20 fotos subidas
            </p>
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex gap-3 justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isSubmitting || uploading}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || uploading || images.length === 0}
            className="bg-orange-600 hover:bg-orange-700"
          >
            {uploading ? 'Publicando...' : 'Publicar Vehículo'}
          </Button>
        </div>
      </form>
    </div>
  );
}
