import type { Vehicle, WordPressVehicle } from '../types/types';
import { DEFAULT_PLACEHOLDER_IMAGE, PLACEHOLDER_IMAGES } from './constants';
import { getCdnUrl } from './imageUrl';

export function getVehicleImage(vehicle: Partial<Vehicle & WordPressVehicle>): string {
  const parseStringOrArray = (value: string | string[] | undefined): string[] => {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') return value.split(',').map(s => s.trim());
    return [];
  };

  // Build potential images array, handling both strings and arrays
  const buildImagesList = () => {
    const images = [];

    // 0. HIGHEST PRIORITY: R2 images (uploaded via Cargar Fotos admin panel)
    // Always check R2 fields first - they take precedence over any other source
    const r2FeatureImage = (vehicle as any).r2_feature_image;
    if (r2FeatureImage && typeof r2FeatureImage === 'string' && r2FeatureImage.trim()) {
      images.push(r2FeatureImage);
    }

    // Add R2 gallery images
    const r2Gallery = parseStringOrArray((vehicle as any).r2_gallery);
    if (r2Gallery.length > 0) {
      images.push(...r2Gallery);
    }

    // 1. Prioritize explicit feature images and their variants
    // Handle both string and array formats
    const addImage = (img: any) => {
      if (Array.isArray(img)) {
        images.push(...img);
      } else if (img) {
        images.push(img);
      }
    };

    addImage(vehicle.feature_image);
    addImage(vehicle.feature_image_url);
    addImage(vehicle.thumbnail_webp);
    addImage(vehicle.thumbnail);
    addImage(vehicle.feature_image_webp);

    // 2. Fallback to the first image from any gallery
    images.push(...parseStringOrArray(vehicle.galeria_exterior));
    images.push(...parseStringOrArray(vehicle.fotos_exterior_url));
    images.push(...parseStringOrArray(vehicle.galeria_interior));
    images.push(...parseStringOrArray(vehicle.fotos_interior_url));

    return images;
  };

  const potentialImages = buildImagesList();

  // Find the first valid, non-empty URL from the prioritized list
  for (const imageSource of potentialImages) {
    if (imageSource && typeof imageSource === 'string') {
      const trimmed = imageSource.trim();
      // Skip empty or invalid values
      if (
        trimmed === '' ||
        trimmed === '#ERROR!' ||
        trimmed === 'null' ||
        trimmed === 'undefined' ||
        trimmed === 'N/A' ||
        trimmed === 'n/a' ||
        trimmed === '-' ||
        trimmed.includes('#ERROR!') || // Catches JSON like {"error": "#ERROR!"}
        trimmed.startsWith('{') // Skip any JSON objects
      ) {
        continue;
      }
      // Only accept URLs that start with http://, https://, or /
      // Exclude miniextensions URLs - these are Airtable attachment links, not actual images
      if (trimmed.includes('miniextensions.com')) {
        continue;
      }
      if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('/')) {
        // Convert Supabase URL to CDN URL
        return getCdnUrl(trimmed);
      }
    }
  }

  // 3. If no valid image URL is found, use the classification-specific placeholder
  // Try clasificacionid first, then fallback to carroceria field
  let clasificacion = '';

  const value = Array.isArray(vehicle.clasificacionid)
    ? vehicle.clasificacionid[0]
    : vehicle.clasificacionid;

  if (typeof value === "string" && value.trim()) {
    clasificacion = value.toLowerCase().replace(/ /g, '-');
  } else if ((vehicle as any).carroceria && typeof (vehicle as any).carroceria === "string") {
    // Fallback to carroceria field if clasificacionid is not available
    clasificacion = (vehicle as any).carroceria.toLowerCase().replace(/ /g, '-');
  }

  return PLACEHOLDER_IMAGES[clasificacion] ?? DEFAULT_PLACEHOLDER_IMAGE;
}
