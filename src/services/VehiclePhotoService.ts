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
  feature_image_url: string | null;
  r2_feature_image: string | null;
  galeria_exterior: string[] | null;
  fotos_exterior_url: string[] | string | null;
  r2_gallery: string[] | null;
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
  feature_image_url: string | null;
  r2_feature_image: string | null;
  galeria_exterior: string[] | null;
  fotos_exterior_url: string[] | string | null;
  r2_gallery: string[] | null;
  use_r2_images: boolean | null;
}

export const VehiclePhotoService = {
  /**
   * Get vehicles with OrdenStatus='Comprado' that are missing photos
   * Checks all image fields: feature_image, feature_image_url, r2_feature_image, fotos_exterior_url
   * Only shows vehicles that are missing at least one of these image sources
   */
  async getVehiclesWithoutPhotos(): Promise<VehicleWithoutPhotos[]> {
    // Only fetch vehicles that are "Comprado" (purchased inventory ready for photos)
    const { data, error } = await supabase
      .from('inventario_cache')
      .select('id, ordencompra, title, titulo, marca, modelo, autoano, feature_image, feature_image_url, r2_feature_image, galeria_exterior, fotos_exterior_url, r2_gallery, use_r2_images')
      .eq('ordenstatus', 'Comprado')
      .order('ordencompra', { ascending: false });

    if (error) {
      console.error('Error fetching vehicles without photos:', error);
      throw new Error('No se pudieron obtener los vehículos sin fotos.');
    }

    // Helper to check if a value is a valid non-empty string
    const isValidString = (val: any): boolean => {
      return typeof val === 'string' && val.trim() !== '' && val !== 'null' && val !== 'undefined';
    };

    // Helper to check if a value is a valid non-empty array or non-empty string
    const hasGalleryContent = (val: any): boolean => {
      if (Array.isArray(val) && val.length > 0) {
        // Check if array has at least one valid URL
        return val.some(item => isValidString(item));
      }
      if (typeof val === 'string' && val.trim() !== '') {
        // Could be a comma-separated string or JSON
        return true;
      }
      return false;
    };

    // Filter vehicles that don't have ALL required images
    // A vehicle needs BOTH a feature image AND gallery content to be considered complete
    return ((data as InventarioCacheRow[]) || [])
      .filter(vehicle => {
        // Check if vehicle has any feature image from ANY of these fields
        const hasFeatureImage =
          isValidString(vehicle.feature_image) ||
          isValidString(vehicle.feature_image_url) ||
          isValidString(vehicle.r2_feature_image);

        // Check if vehicle has any gallery images
        const hasGallery =
          hasGalleryContent(vehicle.galeria_exterior) ||
          hasGalleryContent(vehicle.fotos_exterior_url) ||
          hasGalleryContent(vehicle.r2_gallery);

        // Only include vehicles that are MISSING feature image OR gallery
        return !hasFeatureImage || !hasGallery;
      })
      .map(vehicle => {
        // Check for any feature image
        const hasFeatureImage =
          isValidString(vehicle.feature_image) ||
          isValidString(vehicle.feature_image_url) ||
          isValidString(vehicle.r2_feature_image);

        // Check for any gallery
        const hasGallery =
          hasGalleryContent(vehicle.galeria_exterior) ||
          hasGalleryContent(vehicle.fotos_exterior_url) ||
          hasGalleryContent(vehicle.r2_gallery);

        return {
          id: vehicle.id,
          ordencompra: vehicle.ordencompra,
          title: vehicle.title || vehicle.titulo || `${vehicle.marca || ''} ${vehicle.modelo || ''} ${vehicle.autoano || ''}`.trim() || 'Sin título',
          brand: vehicle.marca,
          model: vehicle.modelo,
          year: vehicle.autoano,
          feature_image: vehicle.feature_image,
          feature_image_url: vehicle.feature_image_url,
          r2_feature_image: vehicle.r2_feature_image,
          galeria_exterior: vehicle.galeria_exterior,
          fotos_exterior_url: vehicle.fotos_exterior_url,
          r2_gallery: vehicle.r2_gallery,
          has_feature_image: hasFeatureImage,
          has_gallery: hasGallery,
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
      // Store in dedicated R2 fields for priority over Airtable/Supabase images
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const updateData: any = {
        // Store in R2-specific fields (highest priority)
        r2_gallery: uploadedUrls,
        use_r2_images: true,
        // Also update regular fields for backwards compatibility
        galeria_exterior: uploadedUrls,
        fotos_exterior_url: uploadedUrls,
        updated_at: new Date().toISOString(),
      };

      // Set first image as featured if requested and we have images
      if (setFirstAsFeatured && uploadedUrls.length > 0) {
        updateData.r2_feature_image = uploadedUrls[0]; // R2 priority field
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
      // First, get existing gallery (including R2 fields)
      const { data: vehicle, error: fetchError } = await supabase
        .from('inventario_cache')
        .select('galeria_exterior, feature_image, r2_gallery, r2_feature_image')
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

      // Get existing R2 gallery if any
      const existingR2Gallery = Array.isArray(vehicleData?.r2_gallery)
        ? vehicleData.r2_gallery
        : [];

      // Combine galleries
      const combinedGallery = [...existingGallery, ...uploadedUrls];
      const combinedR2Gallery = [...existingR2Gallery, ...uploadedUrls];

      // Build update data
      // Store in dedicated R2 fields for priority over Airtable/Supabase images
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const updateData: any = {
        // Store in R2-specific fields (highest priority)
        r2_gallery: combinedR2Gallery,
        use_r2_images: true,
        // Also update regular fields for backwards compatibility
        galeria_exterior: combinedGallery,
        fotos_exterior_url: combinedGallery,
        updated_at: new Date().toISOString(),
      };

      // Set featured image if requested and vehicle doesn't have one
      if (setFirstAsFeatured && !vehicleData?.feature_image && uploadedUrls.length > 0) {
        updateData.r2_feature_image = uploadedUrls[0]; // R2 priority field
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
   * Get count of vehicles without photos (only 'Comprado' status)
   * Note: This is a simplified count - the actual filtering logic in getVehiclesWithoutPhotos
   * checks both legacy and R2 fields, so the count here may be slightly different.
   */
  async getVehiclesWithoutPhotosCount(): Promise<number> {
    // For accurate count, we fetch and filter the same way as getVehiclesWithoutPhotos
    const vehicles = await this.getVehiclesWithoutPhotos();
    return vehicles.length;
  },
};

export default VehiclePhotoService;
