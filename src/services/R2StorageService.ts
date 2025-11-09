/**
 * Cloudflare R2 Storage Service
 *
 * This service handles image uploads to Cloudflare R2 storage.
 * R2 provides S3-compatible storage with zero egress fees.
 *
 * Setup required:
 * 1. Create R2 bucket in Cloudflare Dashboard
 * 2. Generate R2 API tokens
 * 3. Configure environment variables
 */

import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

const R2_ACCOUNT_ID = process.env.NEXT_PUBLIC_CLOUDFLARE_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.NEXT_PUBLIC_CLOUDFLARE_R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.NEXT_PUBLIC_CLOUDFLARE_R2_SECRET_ACCESS_KEY;
const R2_PUBLIC_URL = process.env.NEXT_PUBLIC_CLOUDFLARE_R2_PUBLIC_URL;
const R2_BUCKET_NAME = 'trefa-images'; // Change to your bucket name

class R2StorageService {
  private client: S3Client | null = null;
  private isConfigured: boolean = false;

  constructor() {
    // Only initialize if all R2 credentials are available
    if (R2_ACCOUNT_ID && R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY) {
      this.client = new S3Client({
        region: 'auto',
        endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
        credentials: {
          accessKeyId: R2_ACCESS_KEY_ID,
          secretAccessKey: R2_SECRET_ACCESS_KEY,
        },
      });
      this.isConfigured = true;
    } else {
      console.warn(
        'R2 Storage not configured. Set CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_R2_ACCESS_KEY_ID, and CLOUDFLARE_R2_SECRET_ACCESS_KEY in environment variables.'
      );
    }
  }

  /**
   * Check if R2 storage is configured and available
   */
  isAvailable(): boolean {
    return this.isConfigured;
  }

  /**
   * Upload a file to R2 storage
   *
   * @param file - The file to upload
   * @param path - The path/key in the bucket (e.g., 'vehicles/123/image.jpg')
   * @param contentType - MIME type of the file
   * @returns Public URL of the uploaded file
   */
  async uploadFile(
    file: File | Blob,
    path: string,
    contentType?: string
  ): Promise<string> {
    if (!this.client || !this.isConfigured) {
      throw new Error('R2 Storage is not configured');
    }

    if (!R2_PUBLIC_URL) {
      throw new Error('VITE_CLOUDFLARE_R2_PUBLIC_URL is not configured');
    }

    try {
      const buffer = await file.arrayBuffer();

      const command = new PutObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: path,
        Body: new Uint8Array(buffer),
        ContentType: contentType || file.type || 'application/octet-stream',
        CacheControl: 'public, max-age=31536000', // 1 year cache
      });

      await this.client.send(command);

      // Return the public URL
      return `${R2_PUBLIC_URL}/${path}`;
    } catch (error) {
      console.error('Error uploading to R2:', error);
      throw new Error(`Failed to upload file to R2: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete a file from R2 storage
   *
   * @param path - The path/key of the file to delete
   */
  async deleteFile(path: string): Promise<void> {
    if (!this.client || !this.isConfigured) {
      throw new Error('R2 Storage is not configured');
    }

    try {
      const command = new DeleteObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: path,
      });

      await this.client.send(command);
    } catch (error) {
      console.error('Error deleting from R2:', error);
      throw new Error(`Failed to delete file from R2: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate a unique file path for upload
   *
   * @param folder - Folder name (e.g., 'vehicles', 'profiles')
   * @param filename - Original filename
   * @returns Unique path with timestamp
   */
  generatePath(folder: string, filename: string): string {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    const ext = filename.split('.').pop() || 'jpg';
    const sanitizedName = filename
      .split('.')[0]
      .replace(/[^a-zA-Z0-9]/g, '-')
      .substring(0, 50);

    return `${folder}/${sanitizedName}-${timestamp}-${randomString}.${ext}`;
  }

  /**
   * Get the public URL base for R2
   */
  getPublicUrlBase(): string {
    return R2_PUBLIC_URL || '';
  }
}

// Export singleton instance
export const r2Storage = new R2StorageService();
export default r2Storage;
