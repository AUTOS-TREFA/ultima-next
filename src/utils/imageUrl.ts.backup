/**
 * Image URL utilities for CDN integration
 *
 * This utility provides centralized image URL handling with:
 * - Cloudflare CDN proxy support
 * - Automatic image optimization
 * - Fallback to direct Supabase URLs
 */

const SUPABASE_STORAGE_BASE = 'https://jjepfehmuybpctdzipnu.supabase.co/storage/v1/object/public';
const IMAGE_CDN_URL = import.meta.env.VITE_IMAGE_CDN_URL || '';
const R2_PUBLIC_URL = import.meta.env.VITE_CLOUDFLARE_R2_PUBLIC_URL || '';

export interface ImageOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'avif' | 'jpeg' | 'png' | 'auto';
}

/**
 * Converts a Supabase storage URL to use the CDN proxy
 *
 * @param url - Original Supabase storage URL
 * @param options - Optional image transformation parameters
 * @returns Optimized CDN URL or original URL if CDN is not configured
 *
 * @example
 * // Basic usage
 * getCdnUrl('https://...supabase.co/storage/v1/object/public/fotos_airtable/app/suv.png')
 * // Returns: 'https://images.trefa.mx/fotos_airtable/app/suv.png'
 *
 * @example
 * // With transformations
 * getCdnUrl('https://...supabase.co/storage/v1/object/public/fotos_airtable/app/suv.png', {
 *   width: 800,
 *   quality: 85,
 *   format: 'webp'
 * })
 * // Returns: 'https://images.trefa.mx/fotos_airtable/app/suv.png?w=800&q=85&f=webp'
 */
export function getCdnUrl(url: string | null | undefined, options?: ImageOptions): string {
  if (!url) return '';

  // If URL is already from R2, return as-is
  if (R2_PUBLIC_URL && url.startsWith(R2_PUBLIC_URL)) {
    return url;
  }

  // If CDN is not configured, return original URL
  if (!IMAGE_CDN_URL) {
    return url;
  }

  // Extract the path after '/storage/v1/object/public/'
  const pathMatch = url.match(/\/storage\/v1\/object\/public\/(.+)$/);
  if (!pathMatch) {
    // Not a Supabase storage URL, return as-is
    return url;
  }

  const imagePath = pathMatch[1];
  let cdnUrl = `${IMAGE_CDN_URL}/${imagePath}`;

  // Add transformation parameters if provided
  if (options) {
    const params = new URLSearchParams();
    if (options.width) params.set('w', options.width.toString());
    if (options.height) params.set('h', options.height.toString());
    if (options.quality) params.set('q', options.quality.toString());
    if (options.format) params.set('f', options.format);

    const queryString = params.toString();
    if (queryString) {
      cdnUrl += `?${queryString}`;
    }
  }

  return cdnUrl;
}

/**
 * Gets a thumbnail URL for an image
 *
 * @param url - Original image URL
 * @param size - Thumbnail size (default: 400)
 * @returns Optimized thumbnail URL
 */
export function getThumbnailUrl(url: string | null | undefined, size: number = 400): string {
  return getCdnUrl(url, {
    width: size,
    quality: 85,
    format: 'auto'
  });
}

/**
 * Gets a responsive image srcset for modern browsers
 *
 * @param url - Original image URL
 * @param sizes - Array of widths for responsive images
 * @returns srcset string for use in <img> elements
 *
 * @example
 * const srcset = getResponsiveSrcSet(imageUrl, [400, 800, 1200]);
 * // Returns: 'https://images.trefa.mx/path/image.png?w=400 400w, ...'
 */
export function getResponsiveSrcSet(
  url: string | null | undefined,
  sizes: number[] = [400, 800, 1200, 1600]
): string {
  if (!url) return '';

  return sizes
    .map(size => {
      const optimizedUrl = getCdnUrl(url, { width: size, format: 'auto', quality: 85 });
      return `${optimizedUrl} ${size}w`;
    })
    .join(', ');
}

/**
 * Checks if an image URL is already optimized (from CDN or R2)
 */
export function isOptimizedUrl(url: string | null | undefined): boolean {
  if (!url) return false;

  return (
    (IMAGE_CDN_URL && url.startsWith(IMAGE_CDN_URL)) ||
    (R2_PUBLIC_URL && url.startsWith(R2_PUBLIC_URL))
  );
}

/**
 * Gets the base URL for Supabase storage (for direct uploads)
 */
export function getSupabaseStorageUrl(): string {
  return SUPABASE_STORAGE_BASE;
}

/**
 * Checks if the CDN is configured and available
 */
export function isCdnEnabled(): boolean {
  return !!IMAGE_CDN_URL;
}

/**
 * Checks if R2 storage is configured
 */
export function isR2Enabled(): boolean {
  return !!R2_PUBLIC_URL;
}
