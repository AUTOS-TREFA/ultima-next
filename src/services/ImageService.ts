import { supabase } from '../../supabaseClient';

const BACKUP_BUCKET_NAME = 'car-studio-backups';
const CONSIGNMENT_BUCKET_NAME = 'consignment-images';

export const ImageService = {
  /**
   * Updates the vehicle record in the cache to use the new Car Studio images.
   * @param vehicleId - The WordPress ID of the vehicle.
   * @param featureImageUrl - The new primary image URL from Car Studio.
   * @param galleryImageUrls - An array of new gallery image URLs from Car Studio.
   */
  async saveCarStudioImagesToVehicle(
    vehicleId: number,
    featureImageUrl: string,
    galleryImageUrls: string[]
  ) {
    const { error } = await supabase
      .from('vehicles_cache')
      .update({
        car_studio_feature_image: featureImageUrl,
        car_studio_gallery: galleryImageUrls,
        last_synced_at: new Date().toISOString(), // Touch the record
      })
      .eq('id', vehicleId);

    if (error) {
      console.error('Error updating vehicle with Car Studio images:', error);
      throw new Error('No se pudo guardar las nuevas imágenes en el registro del vehículo.');
    }
  },

  /**
   * Fetches an image from a public URL and uploads it as a backup to Supabase Storage.
   * @param imageUrl - The public URL of the image to back up.
   * @param vehicleId - The ID of the vehicle this image belongs to (can be either numeric or Airtable record ID string).
   * @returns The path of the uploaded file in Supabase Storage.
   */
  async backupImageToSupabase(imageUrl: string, vehicleId: number | string): Promise<string> {
    try {
      // Fetch the image from the public URL
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch image from URL: ${response.statusText}`);
      }
      const imageBlob = await response.blob();
      
      // Create a unique file name
      const fileExtension = imageBlob.type.split('/')[1] || 'jpg';
      const fileName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExtension}`;
      const filePath = `${vehicleId}/${fileName}`;

      // Upload to Supabase Storage
      const { data, error: uploadError } = await supabase.storage
        .from(BACKUP_BUCKET_NAME)
        .upload(filePath, imageBlob);

      if (uploadError) {
        throw uploadError;
      }

      return data.path;
    } catch (error) {
      console.error(`Failed to back up image ${imageUrl}:`, error);
      // Don't throw an error that stops the whole process, just log it.
      // The primary goal is to save the URLs, backup is secondary.
      return ''; 
    }
  },

  /**
   * A comprehensive function to save Car Studio images and back them up.
   * @param vehicleId - The ID of the vehicle (can be either numeric or Airtable record ID string).
   * @param processedImages - An array of image URLs from Car Studio.
   * @param replaceFeatureImageUrl - Optional URL to replace the feature image (first processed image by default)
   */
  async processAndSaveImages(vehicleId: number | string, processedImages: string[], replaceFeatureImageUrl?: string) {
    if (!processedImages || processedImages.length === 0) {
      throw new Error('No images to process.');
    }

    const galleryImages = processedImages.slice(0); // Use all images for gallery

    // Step 1: Save the gallery images to inventario_cache
    const updateData: any = {
      fotos_exterior_url: galleryImages, // Save as JSONB array
      galeria_exterior: galleryImages, // Save as JSONB array (for Car Studio processed images)
      updated_at: new Date().toISOString(),
    };

    // If replaceFeatureImageUrl is provided, update the feature image
    if (replaceFeatureImageUrl) {
      updateData.feature_image = replaceFeatureImageUrl; // Save as TEXT
      updateData.car_studio_feature_image = replaceFeatureImageUrl; // Save as TEXT
    }

    // Determine which column to use for matching based on the vehicleId type
    // If it's a string starting with "rec", it's an Airtable ID
    // If it's a number or numeric string, it's the database ID
    const isAirtableId = typeof vehicleId === 'string' && vehicleId.startsWith('rec');
    const matchColumn = isAirtableId ? 'airtable_id' : 'id';

    const { error } = await supabase
      .from('inventario_cache')
      .update(updateData)
      .eq(matchColumn, vehicleId);

    if (error) {
      console.error('Error updating vehicle with Car Studio images:', error);
      console.error('Error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      throw new Error(`No se pudo guardar las nuevas imágenes: ${error.message}`);
    }

    // Step 2: Asynchronously back up all images to Supabase Storage.
    // We don't wait for this to finish to give the user a faster response.
    // The Promise.all is for running backups in parallel.
    Promise.all(
        processedImages.map(url => this.backupImageToSupabase(url, vehicleId))
    ).then(paths => {
        console.log('Successfully backed up images to Supabase Storage:', paths.filter(p => p));
    }).catch(err => {
        console.error("An error occurred during the background image backup process:", err);
    });
  },

  /**
   * Uploads a consignment listing image file to Supabase Storage.
   * @param listingId - The ID of the consignment listing
   * @param file - The image file to upload
   * @returns Object with storagePath and publicUrl
   */
  async uploadConsignmentImage(listingId: string, file: File): Promise<{ storagePath: string; publicUrl: string }> {
    try {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        throw new Error('Tipo de archivo no válido. Solo se permiten JPG, PNG y WebP.');
      }

      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        throw new Error('El archivo es demasiado grande. Máximo 5MB.');
      }

      // Create a unique file name
      const fileExtension = file.name.split('.').pop() || 'jpg';
      const fileName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExtension}`;
      const filePath = `${listingId}/${fileName}`;

      // Upload to Supabase Storage
      const { data, error: uploadError } = await supabase.storage
        .from(CONSIGNMENT_BUCKET_NAME)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw new Error(`Error al subir imagen: ${uploadError.message}`);
      }

      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from(CONSIGNMENT_BUCKET_NAME)
        .getPublicUrl(data.path);

      return {
        storagePath: data.path,
        publicUrl,
      };
    } catch (error: any) {
      console.error('Error uploading consignment image:', error);
      throw error;
    }
  },
};
