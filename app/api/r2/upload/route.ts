/**
 * API Route for R2 Image Upload
 *
 * Handles image uploads to Cloudflare R2 server-side to avoid CORS issues.
 */

import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { createServerSupabaseClient } from '../../../../lib/supabase/server';

const R2_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;
const R2_PUBLIC_URL = process.env.NEXT_PUBLIC_CLOUDFLARE_R2_PUBLIC_URL || 'https://images.trefa.mx';
const R2_BUCKET_NAME = 'trefa-images';

// Initialize S3 client for R2
const getR2Client = () => {
  if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
    return null;
  }

  return new S3Client({
    region: 'auto',
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: R2_ACCESS_KEY_ID,
      secretAccessKey: R2_SECRET_ACCESS_KEY,
    },
  });
};

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const supabase = createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    // Check if user has admin role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json(
        { error: 'Solo administradores pueden subir fotos' },
        { status: 403 }
      );
    }

    // Get R2 client
    const r2Client = getR2Client();
    if (!r2Client) {
      return NextResponse.json(
        { error: 'R2 Storage no está configurado. Verifica las variables de entorno.' },
        { status: 500 }
      );
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const folder = formData.get('folder') as string || 'vehicles';
    const vehicleId = formData.get('vehicleId') as string;

    if (!file) {
      return NextResponse.json(
        { error: 'No se proporcionó archivo' },
        { status: 400 }
      );
    }

    // Generate unique path
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    const ext = file.name.split('.').pop() || 'jpg';
    const sanitizedName = file.name
      .split('.')[0]
      .replace(/[^a-zA-Z0-9]/g, '-')
      .substring(0, 50);

    const path = vehicleId
      ? `${folder}/${vehicleId}/${sanitizedName}-${timestamp}-${randomString}.${ext}`
      : `${folder}/${sanitizedName}-${timestamp}-${randomString}.${ext}`;

    // Convert file to buffer
    const buffer = await file.arrayBuffer();

    // Upload to R2
    const command = new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: path,
      Body: new Uint8Array(buffer),
      ContentType: file.type || 'image/jpeg',
      CacheControl: 'public, max-age=31536000', // 1 year cache
    });

    await r2Client.send(command);

    // Return public URL
    const publicUrl = `${R2_PUBLIC_URL}/${path}`;

    return NextResponse.json({
      success: true,
      url: publicUrl,
      path: path,
    });

  } catch (error) {
    console.error('Error uploading to R2:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al subir archivo' },
      { status: 500 }
    );
  }
}
