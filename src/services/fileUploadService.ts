// =============================================
// FILE UPLOAD SERVICE
// =============================================
// Handles file uploads to Supabase Storage for studio customization

import { supabase } from '@/lib/supabase';

const LOGO_BUCKET = 'studio-logos';
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

/**
 * Validate file before upload
 */
export function validateFile(file: File): { valid: boolean; error?: string } {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File size too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB`
    };
  }

  // Check file type
  if (!ALLOWED_FILE_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: 'Invalid file type. Only JPG, PNG, and WebP images are allowed.'
    };
  }

  return { valid: true };
}

/**
 * Upload logo to Supabase Storage
 */
export async function uploadLogo(file: File, studioId: string): Promise<UploadResult> {
  try {
    // Validate file
    const validation = validateFile(file);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    // Create unique filename with studio ID and timestamp
    const fileExt = file.name.split('.').pop();
    const fileName = `${studioId}_${Date.now()}.${fileExt}`;
    const filePath = `${studioId}/${fileName}`;

    // Check if bucket exists, create if not
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketExists = buckets?.some(b => b.name === LOGO_BUCKET);

    if (!bucketExists) {
      // Create bucket with public access
      const { error: bucketError } = await supabase.storage.createBucket(LOGO_BUCKET, {
        public: true,
        fileSizeLimit: MAX_FILE_SIZE,
        allowedMimeTypes: ALLOWED_FILE_TYPES
      });

      if (bucketError) {
        console.error('Failed to create bucket:', bucketError);
        return { success: false, error: 'Failed to initialize storage' };
      }
    }

    // Upload file
    const { data, error } = await supabase.storage
      .from(LOGO_BUCKET)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true
      });

    if (error) {
      console.error('Upload error:', error);
      return { success: false, error: 'Failed to upload file' };
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(LOGO_BUCKET)
      .getPublicUrl(filePath);

    return { success: true, url: publicUrl };
  } catch (error) {
    console.error('Unexpected error during upload:', error);
    return { success: false, error: 'Unexpected error occurred' };
  }
}

/**
 * Delete logo from Supabase Storage
 */
export async function deleteLogo(url: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Extract file path from URL
    // URL format: https://{project}.supabase.co/storage/v1/object/public/studio-logos/{path}
    const urlParts = url.split('/storage/v1/object/public/');
    if (urlParts.length < 2) {
      return { success: false, error: 'Invalid URL format' };
    }

    const fullPath = urlParts[1];
    const pathParts = fullPath.split('/');
    if (pathParts[0] !== LOGO_BUCKET) {
      return { success: false, error: 'Invalid bucket' };
    }

    const filePath = pathParts.slice(1).join('/');

    // Delete file
    const { error } = await supabase.storage
      .from(LOGO_BUCKET)
      .remove([filePath]);

    if (error) {
      console.error('Delete error:', error);
      return { success: false, error: 'Failed to delete file' };
    }

    return { success: true };
  } catch (error) {
    console.error('Unexpected error during deletion:', error);
    return { success: false, error: 'Unexpected error occurred' };
  }
}

/**
 * Get public URL for a file path
 */
export function getPublicUrl(filePath: string): string {
  const { data: { publicUrl } } = supabase.storage
    .from(LOGO_BUCKET)
    .getPublicUrl(filePath);

  return publicUrl;
}

/**
 * Upload file and return base64 data URL (fallback for development)
 */
export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
}
