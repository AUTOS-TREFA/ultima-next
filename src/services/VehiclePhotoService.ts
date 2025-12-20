/**
 * Vehicle Photo Service
 *
 * Service for managing vehicle photos:
 * - Query vehicles without photos
 * - Upload photos to R2
 * - Link photos to vehicles in inventario_cache
 */

import { supabase } from '@/lib/supabase/client';

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

export interface VehicleWithPhotos {
  id: string;
  ordencompra: string | null;
  title: string;
  brand: string | null;
  model: string | null;
  year: number | null;
  feature_image: string | null;
  r2_feature_image: string | null;
  r2_gallery: string[] | null;
  gallery_count: number;
  thumbnail_url: string | null;
  ubicacion: string | null;
}

// Extended vehicle data for editing
export interface VehicleEditData {
  id: string;
  ordencompra: string | null;
  title: string;
  marca: string | null;
  modelo: string | null;
  autoano: number | null;
  precio: number | null;
  mensualidad_minima: number | null;
  mensualidad_recomendada: number | null;
  ubicacion: string | null;
  garantia: string | null;
  promociones: string[] | null;
  carroceria: string | null;
  kilometraje: number | null;
  transmision: string | null;
  ordenstatus: string | null;
  feature_image: string | null;
  r2_feature_image: string | null;
  r2_gallery: string[] | null;
  gallery_count: number;
  thumbnail_url: string | null;
  has_feature_image: boolean;
  has_gallery: boolean;
}

// Update payload for vehicle data
export interface VehicleUpdatePayload {
  mensualidad_minima?: number | null;
  mensualidad_recomendada?: number | null;
  ubicacion?: string | null;
  garantia?: string | null;
  promociones?: string[] | null;
  carroceria?: string | null;
  kilometraje?: number | null;
  transmision?: string | null;
  ordenstatus?: string | null;
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
   * Upload a single file to R2 via API route (server-side to avoid CORS)
   */
  async uploadFileToR2(file: File, vehicleId: string): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', 'vehicles');
    formData.append('vehicleId', vehicleId);

    const response = await fetch('/api/r2/upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }));
      throw new Error(errorData.error || `Error al subir: ${response.status}`);
    }

    const data = await response.json();
    return data.url;
  },

  /**
   * Upload multiple photos to R2 and link them to a vehicle
   * Uses server-side API route to avoid CORS issues
   */
  async uploadAndLinkPhotos(
    vehicleId: string,
    files: File[],
    setFirstAsFeatured: boolean = true
  ): Promise<UploadResult> {
    const uploadedUrls: string[] = [];

    try {
      // Upload each file to R2 via API route
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const publicUrl = await this.uploadFileToR2(file, vehicleId);
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
   * Uses server-side API route to avoid CORS issues
   */
  async appendPhotosToGallery(
    vehicleId: string,
    files: File[],
    setFirstAsFeatured: boolean = false
  ): Promise<UploadResult> {
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

      // Upload new files via API route
      const uploadedUrls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const publicUrl = await this.uploadFileToR2(file, vehicleId);
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

  /**
   * Get vehicles with OrdenStatus='Comprado' that HAVE photos (for photo management)
   */
  async getVehiclesWithPhotos(): Promise<VehicleWithPhotos[]> {
    const { data, error } = await supabase
      .from('inventario_cache')
      .select('id, ordencompra, title, titulo, marca, modelo, autoano, feature_image, feature_image_url, r2_feature_image, galeria_exterior, fotos_exterior_url, r2_gallery, ubicacion')
      .eq('ordenstatus', 'Comprado')
      .order('ordencompra', { ascending: false });

    if (error) {
      console.error('Error fetching vehicles with photos:', error);
      throw new Error('No se pudieron obtener los vehículos con fotos.');
    }

    // Helper to check if a value is a valid non-empty string
    const isValidString = (val: unknown): boolean => {
      return typeof val === 'string' && val.trim() !== '' && val !== 'null' && val !== 'undefined';
    };

    // Helper to get gallery array
    const getGalleryArray = (val: unknown): string[] => {
      if (Array.isArray(val)) {
        return val.filter(item => isValidString(item));
      }
      if (typeof val === 'string' && val.trim() !== '') {
        try {
          const parsed = JSON.parse(val);
          if (Array.isArray(parsed)) {
            return parsed.filter(item => isValidString(item));
          }
        } catch {
          // Not JSON, treat as comma-separated
          return val.split(',').map(s => s.trim()).filter(s => s !== '');
        }
      }
      return [];
    };

    // Filter vehicles that HAVE photos (at least feature image OR gallery)
    return ((data as InventarioCacheRow[]) || [])
      .filter(vehicle => {
        const hasFeatureImage =
          isValidString(vehicle.feature_image) ||
          isValidString(vehicle.feature_image_url) ||
          isValidString(vehicle.r2_feature_image);

        const r2Gallery = getGalleryArray(vehicle.r2_gallery);
        const exteriorGallery = getGalleryArray(vehicle.galeria_exterior);
        const fotosUrl = getGalleryArray(vehicle.fotos_exterior_url);

        const hasGallery = r2Gallery.length > 0 || exteriorGallery.length > 0 || fotosUrl.length > 0;

        return hasFeatureImage || hasGallery;
      })
      .map(vehicle => {
        // Get the best thumbnail URL (R2 priority)
        const thumbnailUrl =
          (isValidString(vehicle.r2_feature_image) ? vehicle.r2_feature_image : null) ||
          (isValidString(vehicle.feature_image) ? vehicle.feature_image : null) ||
          (isValidString(vehicle.feature_image_url) ? vehicle.feature_image_url : null);

        // Count gallery images
        const r2Gallery = getGalleryArray(vehicle.r2_gallery);
        const exteriorGallery = getGalleryArray(vehicle.galeria_exterior);
        const fotosUrl = getGalleryArray(vehicle.fotos_exterior_url);

        // Prefer R2 gallery count, otherwise use the largest gallery
        const galleryCount = r2Gallery.length > 0
          ? r2Gallery.length
          : Math.max(exteriorGallery.length, fotosUrl.length);

        return {
          id: vehicle.id,
          ordencompra: vehicle.ordencompra,
          title: vehicle.title || vehicle.titulo || `${vehicle.marca || ''} ${vehicle.modelo || ''} ${vehicle.autoano || ''}`.trim() || 'Sin título',
          brand: vehicle.marca,
          model: vehicle.modelo,
          year: vehicle.autoano,
          feature_image: vehicle.feature_image,
          r2_feature_image: vehicle.r2_feature_image as string | null,
          r2_gallery: r2Gallery.length > 0 ? r2Gallery : null,
          gallery_count: galleryCount,
          thumbnail_url: thumbnailUrl,
          ubicacion: (vehicle as any).ubicacion || null,
        };
      });
  },

  /**
   * Get full photo details for a specific vehicle (for editing)
   */
  async getVehiclePhotoDetails(vehicleId: string): Promise<{
    id: string;
    ordencompra: string | null;
    title: string;
    feature_image: string | null;
    r2_feature_image: string | null;
    r2_gallery: string[];
    galeria_exterior: string[];
    fotos_exterior_url: string[];
  } | null> {
    const { data, error } = await supabase
      .from('inventario_cache')
      .select('id, ordencompra, title, titulo, marca, modelo, autoano, feature_image, feature_image_url, r2_feature_image, galeria_exterior, fotos_exterior_url, r2_gallery')
      .eq('id', vehicleId)
      .single();

    if (error || !data) {
      console.error('Error fetching vehicle photo details:', error);
      return null;
    }

    const vehicle = data as InventarioCacheRow;

    // Helper to get gallery array
    const getGalleryArray = (val: unknown): string[] => {
      if (Array.isArray(val)) {
        return val.filter(item => typeof item === 'string' && item.trim() !== '');
      }
      if (typeof val === 'string' && val.trim() !== '') {
        try {
          const parsed = JSON.parse(val);
          if (Array.isArray(parsed)) {
            return parsed.filter(item => typeof item === 'string' && item.trim() !== '');
          }
        } catch {
          return val.split(',').map(s => s.trim()).filter(s => s !== '');
        }
      }
      return [];
    };

    return {
      id: vehicle.id,
      ordencompra: vehicle.ordencompra,
      title: vehicle.title || vehicle.titulo || `${vehicle.marca || ''} ${vehicle.modelo || ''} ${vehicle.autoano || ''}`.trim() || 'Sin título',
      feature_image: vehicle.feature_image,
      r2_feature_image: vehicle.r2_feature_image as string | null,
      r2_gallery: getGalleryArray(vehicle.r2_gallery),
      galeria_exterior: getGalleryArray(vehicle.galeria_exterior),
      fotos_exterior_url: getGalleryArray(vehicle.fotos_exterior_url),
    };
  },

  /**
   * Update vehicle photos (set featured image and gallery)
   */
  async updateVehiclePhotos(
    vehicleId: string,
    featuredImage: string | null,
    gallery: string[]
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const updateData: Record<string, unknown> = {
        r2_feature_image: featuredImage,
        r2_gallery: gallery,
        use_r2_images: true,
        // Also update legacy fields for backwards compatibility
        feature_image: featuredImage,
        feature_image_url: featuredImage,
        galeria_exterior: gallery,
        fotos_exterior_url: gallery,
        updated_at: new Date().toISOString(),
      };

      const { error } = await (supabase
        .from('inventario_cache') as any)
        .update(updateData)
        .eq('id', vehicleId);

      if (error) {
        console.error('Error updating vehicle photos:', error);
        return { success: false, error: 'Error al actualizar las fotos del vehículo.' };
      }

      return { success: true };
    } catch (error) {
      console.error('Error in updateVehiclePhotos:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido.'
      };
    }
  },

  /**
   * Delete a photo from a vehicle's gallery
   */
  async deletePhotoFromGallery(
    vehicleId: string,
    photoUrl: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Get current vehicle data
      const { data, error: fetchError } = await supabase
        .from('inventario_cache')
        .select('r2_gallery, galeria_exterior, fotos_exterior_url, r2_feature_image, feature_image')
        .eq('id', vehicleId)
        .single();

      if (fetchError || !data) {
        return { success: false, error: 'No se pudo obtener el vehículo.' };
      }

      const vehicleData = data as any;

      // Helper to filter out the photo from an array
      const filterPhoto = (arr: unknown): string[] => {
        if (!Array.isArray(arr)) return [];
        return arr.filter(url => url !== photoUrl);
      };

      // Remove from all gallery arrays
      const newR2Gallery = filterPhoto(vehicleData.r2_gallery);
      const newGaleriaExterior = filterPhoto(vehicleData.galeria_exterior);
      const newFotosUrl = filterPhoto(vehicleData.fotos_exterior_url);

      // Check if we're deleting the featured image
      const isFeatureImage =
        vehicleData.r2_feature_image === photoUrl ||
        vehicleData.feature_image === photoUrl;

      const updateData: Record<string, unknown> = {
        r2_gallery: newR2Gallery,
        galeria_exterior: newGaleriaExterior,
        fotos_exterior_url: newFotosUrl,
        updated_at: new Date().toISOString(),
      };

      // If deleting featured image, set to first gallery image or null
      if (isFeatureImage) {
        const newFeatured = newR2Gallery[0] || newGaleriaExterior[0] || null;
        updateData.r2_feature_image = newFeatured;
        updateData.feature_image = newFeatured;
        updateData.feature_image_url = newFeatured;
      }

      const { error: updateError } = await (supabase
        .from('inventario_cache') as any)
        .update(updateData)
        .eq('id', vehicleId);

      if (updateError) {
        return { success: false, error: 'Error al eliminar la foto.' };
      }

      return { success: true };
    } catch (error) {
      console.error('Error in deletePhotoFromGallery:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido.'
      };
    }
  },

  /**
   * Set a photo as the featured image
   */
  async setFeaturedImage(
    vehicleId: string,
    photoUrl: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const updateData = {
        r2_feature_image: photoUrl,
        feature_image: photoUrl,
        feature_image_url: photoUrl,
        use_r2_images: true,
        updated_at: new Date().toISOString(),
      };

      const { error } = await (supabase
        .from('inventario_cache') as any)
        .update(updateData)
        .eq('id', vehicleId);

      if (error) {
        return { success: false, error: 'Error al establecer la foto principal.' };
      }

      return { success: true };
    } catch (error) {
      console.error('Error in setFeaturedImage:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido.'
      };
    }
  },

  /**
   * Get ALL vehicles with OrdenStatus='Comprado' for editing (includes all fields)
   */
  async getAllVehiclesForEdit(): Promise<VehicleEditData[]> {
    const { data, error } = await supabase
      .from('inventario_cache')
      .select(`
        id, ordencompra, title, titulo, marca, modelo, autoano, precio,
        mensualidad_minima, mensualidad_recomendada, ubicacion, garantia,
        promociones, carroceria, kilometraje, transmision, ordenstatus,
        feature_image, feature_image_url, r2_feature_image,
        galeria_exterior, fotos_exterior_url, r2_gallery
      `)
      .eq('ordenstatus', 'Comprado')
      .order('ordencompra', { ascending: false });

    if (error) {
      console.error('Error fetching all vehicles:', error);
      throw new Error('No se pudieron obtener los vehículos.');
    }

    // Helper to check if a value is a valid non-empty string
    const isValidString = (val: unknown): boolean => {
      return typeof val === 'string' && val.trim() !== '' && val !== 'null' && val !== 'undefined';
    };

    // Helper to get gallery array
    const getGalleryArray = (val: unknown): string[] => {
      if (Array.isArray(val)) {
        return val.filter(item => isValidString(item));
      }
      if (typeof val === 'string' && val.trim() !== '') {
        try {
          const parsed = JSON.parse(val);
          if (Array.isArray(parsed)) {
            return parsed.filter(item => isValidString(item));
          }
        } catch {
          return val.split(',').map(s => s.trim()).filter(s => s !== '');
        }
      }
      return [];
    };

    // Helper to parse kilometraje (can be number, string, or JSON object)
    const parseKilometraje = (val: unknown): number | null => {
      if (typeof val === 'number') return val;
      if (typeof val === 'string') {
        const parsed = parseInt(val.replace(/[^0-9]/g, ''), 10);
        return isNaN(parsed) ? null : parsed;
      }
      if (val && typeof val === 'object' && 'value' in val) {
        return parseKilometraje((val as any).value);
      }
      return null;
    };

    // Helper to parse promociones (can be array of strings/IDs)
    const parsePromociones = (val: unknown): string[] | null => {
      if (Array.isArray(val)) {
        return val.filter(item => typeof item === 'string' && item.trim() !== '');
      }
      if (typeof val === 'string' && val.trim() !== '') {
        try {
          const parsed = JSON.parse(val);
          if (Array.isArray(parsed)) {
            return parsed.filter(item => typeof item === 'string' && item.trim() !== '');
          }
        } catch {
          return val.split(',').map(s => s.trim()).filter(s => s !== '');
        }
      }
      return null;
    };

    return ((data as any[]) || []).map(vehicle => {
      const hasFeatureImage =
        isValidString(vehicle.feature_image) ||
        isValidString(vehicle.feature_image_url) ||
        isValidString(vehicle.r2_feature_image);

      const r2Gallery = getGalleryArray(vehicle.r2_gallery);
      const exteriorGallery = getGalleryArray(vehicle.galeria_exterior);
      const fotosUrl = getGalleryArray(vehicle.fotos_exterior_url);

      const hasGallery = r2Gallery.length > 0 || exteriorGallery.length > 0 || fotosUrl.length > 0;
      const galleryCount = r2Gallery.length > 0
        ? r2Gallery.length
        : Math.max(exteriorGallery.length, fotosUrl.length);

      const thumbnailUrl =
        (isValidString(vehicle.r2_feature_image) ? vehicle.r2_feature_image : null) ||
        (isValidString(vehicle.feature_image) ? vehicle.feature_image : null) ||
        (isValidString(vehicle.feature_image_url) ? vehicle.feature_image_url : null);

      return {
        id: vehicle.id,
        ordencompra: vehicle.ordencompra,
        title: vehicle.title || vehicle.titulo || `${vehicle.marca || ''} ${vehicle.modelo || ''} ${vehicle.autoano || ''}`.trim() || 'Sin título',
        marca: vehicle.marca,
        modelo: vehicle.modelo,
        autoano: vehicle.autoano,
        precio: vehicle.precio,
        mensualidad_minima: vehicle.mensualidad_minima,
        mensualidad_recomendada: vehicle.mensualidad_recomendada,
        ubicacion: vehicle.ubicacion,
        garantia: vehicle.garantia,
        promociones: parsePromociones(vehicle.promociones),
        carroceria: vehicle.carroceria,
        kilometraje: parseKilometraje(vehicle.kilometraje),
        transmision: vehicle.transmision,
        ordenstatus: vehicle.ordenstatus,
        feature_image: vehicle.feature_image,
        r2_feature_image: vehicle.r2_feature_image,
        r2_gallery: r2Gallery.length > 0 ? r2Gallery : null,
        gallery_count: galleryCount,
        thumbnail_url: thumbnailUrl,
        has_feature_image: hasFeatureImage,
        has_gallery: hasGallery,
      };
    });
  },

  /**
   * Update vehicle data (non-photo fields)
   */
  async updateVehicleData(
    vehicleId: string,
    payload: VehicleUpdatePayload
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const updateData: Record<string, unknown> = {
        ...payload,
        updated_at: new Date().toISOString(),
      };

      const { error } = await (supabase
        .from('inventario_cache') as any)
        .update(updateData)
        .eq('id', vehicleId);

      if (error) {
        console.error('Error updating vehicle data:', error);
        return { success: false, error: 'Error al actualizar los datos del vehículo.' };
      }

      return { success: true };
    } catch (error) {
      console.error('Error in updateVehicleData:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido.'
      };
    }
  },

  /**
   * Get unique promociones from all vehicles (for dropdown options)
   */
  async getUniquePromociones(): Promise<string[]> {
    const { data, error } = await supabase
      .from('inventario_cache')
      .select('promociones')
      .not('promociones', 'is', null);

    if (error) {
      console.error('Error fetching promociones:', error);
      return [];
    }

    const allPromociones = new Set<string>();
    (data || []).forEach((row: any) => {
      if (Array.isArray(row.promociones)) {
        row.promociones.forEach((p: string) => {
          if (p && typeof p === 'string') {
            allPromociones.add(p);
          }
        });
      }
    });

    return Array.from(allPromociones).sort();
  },
};

export default VehiclePhotoService;
