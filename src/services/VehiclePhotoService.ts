/**
 * Vehicle Photo Service
 *
 * Service for managing vehicle photos:
 * - Query vehicles without photos
 * - Upload photos to R2
 * - Link photos to vehicles in inventario_cache
 */

import { supabase } from '@/lib/supabase/client';
import { r2Storage } from './R2StorageService';

export interface VehicleWithoutPhotos {
  id: string;
  ordencompra: string | null;
  title: string;
  brand: string | null;
  model: string | null;
  year: number | null;
  feature_image: string | null;
  galeria_exterior: string[] | null;
  has_feature_image: boolean;
  has_gallery: boolean;
}

export interface UploadResult {
  success: boolean;
  uploadedCount: number;
  urls: string[];
  error?: string;
}

// Raw database row type
interface InventarioCacheRow {
  id: string;
  ordencompra: string | null;
  title: string | null;
  titulo: string | null;
  marca: string | null;
  modelo: string | null;
  autoano: number | null;
  feature_image: string | null;
  galeria_exterior: string[] | null;
}

export const VehiclePhotoService = {
  /**
   * Get all vehicles that are missing photos (no feature_image or empty galleries)
   */
  async getVehiclesWithoutPhotos(): Promise<VehicleWithoutPhotos[]> {
    const { data, error } = await supabase
      .from('inventario_cache')
      .select('id, ordencompra, title, titulo, marca, modelo, autoano, feature_image, galeria_exterior')
      .or('feature_image.is.null,galeria_exterior.is.null,galeria_exterior.eq.[]')
      .order('ordencompra', { ascending: false });

    if (error) {
      console.error('Error fetching vehicles without photos:', error);
      throw new Error('No se pudieron obtener los vehículos sin fotos.');
    }

    // Map and add computed flags
    return ((data as InventarioCacheRow[]) || []).map(vehicle => {
      const featureImage = vehicle.feature_image;
      const galeriaExterior = vehicle.galeria_exterior;

      return {
        id: vehicle.id,
        ordencompra: vehicle.ordencompra,
        title: vehicle.title || vehicle.titulo || `${vehicle.marca || ''} ${vehicle.modelo || ''} ${vehicle.autoano || ''}`.trim() || 'Sin título',
        brand: vehicle.marca,
        model: vehicle.modelo,
        year: vehicle.autoano,
        feature_image: featureImage,
        galeria_exterior: galeriaExterior,
        has_feature_image: !!featureImage && featureImage.trim() !== '',
        has_gallery: Array.isArray(galeriaExterior) && galeriaExterior.length > 0,
      };
    });
  },

  /**
   * Upload multiple photos to R2 and link them to a vehicle
   */
  async uploadAndLinkPhotos(
    vehicleId: string,
    files: File[],
    setFirstAsFeatured: boolean = true
  ): Promise<UploadResult> {
    if (!r2Storage.isAvailable()) {
      return {
        success: false,
        uploadedCount: 0,
        urls: [],
        error: 'El almacenamiento R2 no está configurado.',
      };
    }

    const uploadedUrls: string[] = [];

    try {
      // Upload each file to R2
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const path = r2Storage.generatePath(`vehicles/${vehicleId}`, file.name);

        const publicUrl = await r2Storage.uploadFile(file, path, file.type);
        uploadedUrls.push(publicUrl);
      }

      // Build the update data
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const updateData: any = {
        galeria_exterior: uploadedUrls,
        fotos_exterior_url: uploadedUrls,
        updated_at: new Date().toISOString(),
      };

      // Set first image as featured if requested and we have images
      if (setFirstAsFeatured && uploadedUrls.length > 0) {
        updateData.feature_image = uploadedUrls[0];
        updateData.feature_image_url = uploadedUrls[0];
      }

      // Update the vehicle record
      // Note: Using 'as any' because Supabase types are not generated for inventario_cache
      const { error: updateError } = await (supabase
        .from('inventario_cache') as any)
        .update(updateData)
        .eq('id', vehicleId);

      if (updateError) {
        console.error('Error updating vehicle with photos:', updateError);
        throw new Error('Las fotos se subieron pero no se pudieron vincular al vehículo.');
      }

      return {
        success: true,
        uploadedCount: uploadedUrls.length,
        urls: uploadedUrls,
      };
    } catch (error) {
      console.error('Error in uploadAndLinkPhotos:', error);
      return {
        success: false,
        uploadedCount: uploadedUrls.length,
        urls: uploadedUrls,
        error: error instanceof Error ? error.message : 'Error desconocido al subir fotos.',
      };
    }
  },

  /**
   * Add photos to an existing gallery (append, don't replace)
   */
  async appendPhotosToGallery(
    vehicleId: string,
    files: File[],
    setFirstAsFeatured: boolean = false
  ): Promise<UploadResult> {
    if (!r2Storage.isAvailable()) {
      return {
        success: false,
        uploadedCount: 0,
        urls: [],
        error: 'El almacenamiento R2 no está configurado.',
      };
    }

    try {
      // First, get existing gallery
      const { data: vehicle, error: fetchError } = await supabase
        .from('inventario_cache')
        .select('galeria_exterior, feature_image')
        .eq('id', vehicleId)
        .single();

      if (fetchError) {
        throw new Error('No se pudo obtener el vehículo.');
      }

      // Cast vehicle to any to access properties
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const vehicleData = vehicle as any;
      const existingGallery = Array.isArray(vehicleData?.galeria_exterior)
        ? vehicleData.galeria_exterior
        : [];

      // Upload new files
      const uploadedUrls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const path = r2Storage.generatePath(`vehicles/${vehicleId}`, file.name);
        const publicUrl = await r2Storage.uploadFile(file, path, file.type);
        uploadedUrls.push(publicUrl);
      }

      // Combine galleries
      const combinedGallery = [...existingGallery, ...uploadedUrls];

      // Build update data
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const updateData: any = {
        galeria_exterior: combinedGallery,
        fotos_exterior_url: combinedGallery,
        updated_at: new Date().toISOString(),
      };

      // Set featured image if requested and vehicle doesn't have one
      if (setFirstAsFeatured && !vehicleData?.feature_image && uploadedUrls.length > 0) {
        updateData.feature_image = uploadedUrls[0];
        updateData.feature_image_url = uploadedUrls[0];
      }

      // Update vehicle
      // Note: Using 'as any' because Supabase types are not generated for inventario_cache
      const { error: updateError } = await (supabase
        .from('inventario_cache') as any)
        .update(updateData)
        .eq('id', vehicleId);

      if (updateError) {
        throw new Error('Las fotos se subieron pero no se pudieron vincular al vehículo.');
      }

      return {
        success: true,
        uploadedCount: uploadedUrls.length,
        urls: uploadedUrls,
      };
    } catch (error) {
      console.error('Error in appendPhotosToGallery:', error);
      return {
        success: false,
        uploadedCount: 0,
        urls: [],
        error: error instanceof Error ? error.message : 'Error desconocido.',
      };
    }
  },

  /**
   * Get count of vehicles without photos
   */
  async getVehiclesWithoutPhotosCount(): Promise<number> {
    const { count, error } = await supabase
      .from('inventario_cache')
      .select('id', { count: 'exact', head: true })
      .or('feature_image.is.null,galeria_exterior.is.null,galeria_exterior.eq.[]');

    if (error) {
      console.error('Error getting count:', error);
      return 0;
    }

    return count || 0;
  },
};

export default VehiclePhotoService;
