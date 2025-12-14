// =============================================
// FILE UPLOAD SERVICE
// =============================================
// Handles file uploads to Supabase Storage for studio customization

import { supabase } from '@/lib/supabase';

const LOGO_BUCKET = 'studio-logos';
const PORTFOLIO_BUCKET = 'studio-portfolio';
const TERMS_PDF_BUCKET = 'studio-terms-pdfs';
const LAYOUT_PHOTOS_BUCKET = 'studio-layout-photos';
const MAX_LOGO_SIZE = 2 * 1024 * 1024; // 2MB
const MAX_PORTFOLIO_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_PDF_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_LAYOUT_PHOTO_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
const ALLOWED_PDF_TYPES = ['application/pdf'];

export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

/**
 * Validate file before upload
 */
export function validateFile(file: File, maxSize: number = MAX_LOGO_SIZE): { valid: boolean; error?: string } {
  // Check file size
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File size too large. Maximum size is ${maxSize / (1024 * 1024)}MB`
    };
  }

  // Check file type
  if (!ALLOWED_FILE_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: 'Invalid file type. Only JPG, PNG, WebP, and GIF images are allowed.'
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

    // Debug authentication status
    const { data: { session } } = await supabase.auth.getSession();
    console.log('Current auth session:', { user: session?.user?.id, sessionValid: !!session?.user });

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
 * Upload About photo to Supabase Storage
 */
export async function uploadAboutPhoto(file: File, studioId: string): Promise<UploadResult> {
  try {
    // Validate file
    const validation = validateFile(file, MAX_LOGO_SIZE);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    // Create unique filename with studio ID and timestamp
    const fileExt = file.name.split('.').pop();
    const fileName = `about_${studioId}_${Date.now()}.${fileExt}`;
    const filePath = `${studioId}/about/${fileName}`;

    // Debug authentication status
    const { data: { session } } = await supabase.auth.getSession();
    console.log('Current auth session:', { user: session?.user?.id, sessionValid: !!session?.user });

    // Upload file to logo bucket (reusing the same bucket)
    const { data, error } = await supabase.storage
      .from(LOGO_BUCKET)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true
      });

    if (error) {
      console.error('About photo upload error:', error);
      return { success: false, error: 'Failed to upload about photo' };
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(LOGO_BUCKET)
      .getPublicUrl(filePath);

    return { success: true, url: publicUrl };
  } catch (error) {
    console.error('Unexpected error during about photo upload:', error);
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

/**
 * Upload portfolio photo to Supabase Storage
 */
export async function uploadPortfolioPhoto(file: File): Promise<UploadResult> {
  try {
    // Get current admin to find their studio
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      return { success: false, error: 'No authenticated user' };
    }

    // Get admin user with studio info
    const { data: adminUser, error: adminError } = await supabase
      .from('admin_users')
      .select('studio_id')
      .eq('auth_user_id', session.user.id)
      .eq('is_active', true)
      .single();

    if (adminError || !adminUser) {
      return { success: false, error: 'Failed to find admin studio' };
    }

    const studioId = adminUser.studio_id;

    // Validate file
    const validation = validateFile(file, MAX_PORTFOLIO_SIZE);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    // Create unique filename with studio ID and timestamp
    const fileExt = file.name.split('.').pop();
    const fileName = `${studioId}_${Date.now()}.${fileExt}`;
    const filePath = `${studioId}/${fileName}`;

    // Upload file
    const { data, error } = await supabase.storage
      .from(PORTFOLIO_BUCKET)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true
      });

    if (error) {
      console.error('Portfolio upload error:', error);
      return { success: false, error: 'Failed to upload portfolio photo' };
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(PORTFOLIO_BUCKET)
      .getPublicUrl(filePath);

    // Save photo record to database
    const { error: dbError } = await supabase
      .from('portfolio_photos')
      .insert({
        studio_id: studioId,
        photo_url: publicUrl,
        file_name: file.name,
        file_size: file.size
      });

    if (dbError) {
      console.error('Failed to save photo to database:', dbError);
      return { success: false, error: 'Failed to save photo record' };
    }

    return { success: true, url: publicUrl };
  } catch (error) {
    console.error('Unexpected error during portfolio upload:', error);
    return { success: false, error: 'Unexpected error occurred' };
  }
}

/**
 * Delete portfolio photo from Supabase Storage
 */
export async function deletePortfolioPhoto(url: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Extract file path from URL
    // URL format: https://{project}.supabase.co/storage/v1/object/public/studio-portfolio/{path}
    const urlParts = url.split('/storage/v1/object/public/');
    if (urlParts.length < 2) {
      return { success: false, error: 'Invalid URL format' };
    }

    const fullPath = urlParts[1];
    const pathParts = fullPath.split('/');
    if (pathParts[0] !== PORTFOLIO_BUCKET) {
      return { success: false, error: 'Invalid bucket' };
    }

    const filePath = pathParts.slice(1).join('/');

    // Delete file
    const { error } = await supabase.storage
      .from(PORTFOLIO_BUCKET)
      .remove([filePath]);

    if (error) {
      console.error('Delete portfolio photo error:', error);
      return { success: false, error: 'Failed to delete portfolio photo' };
    }

    return { success: true };
  } catch (error) {
    console.error('Unexpected error during portfolio deletion:', error);
    return { success: false, error: 'Unexpected error occurred' };
  }
}

/**
 * Validate PDF file before upload
 */
export function validatePdfFile(file: File): { valid: boolean; error?: string } {
  // Check file size
  if (file.size > MAX_PDF_SIZE) {
    return {
      valid: false,
      error: `File size too large. Maximum size is ${MAX_PDF_SIZE / (1024 * 1024)}MB`
    };
  }

  // Check file type
  if (!ALLOWED_PDF_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: 'Invalid file type. Only PDF files are allowed.'
    };
  }

  return { valid: true };
}

/**
 * Upload Terms & Conditions PDF to Supabase Storage
 */
export async function uploadTermsPdf(file: File, studioId: string): Promise<UploadResult> {
  try {
    // Validate file
    const validation = validatePdfFile(file);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    // Create unique filename with studio ID and timestamp
    const fileExt = file.name.split('.').pop();
    const fileName = `${studioId}_terms_${Date.now()}.${fileExt}`;
    const filePath = `${studioId}/${fileName}`;

    // Debug authentication status
    const { data: { session } } = await supabase.auth.getSession();
    console.log('Current auth session:', { user: session?.user?.id, sessionValid: !!session?.user });

    // Upload file
    const { data, error } = await supabase.storage
      .from(TERMS_PDF_BUCKET)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true
      });

    if (error) {
      console.error('PDF upload error:', error);
      return { success: false, error: 'Failed to upload PDF file' };
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(TERMS_PDF_BUCKET)
      .getPublicUrl(filePath);

    return { success: true, url: publicUrl };
  } catch (error) {
    console.error('Unexpected error during PDF upload:', error);
    return { success: false, error: 'Unexpected error occurred' };
  }
}

/**
 * Upload layout photo to Supabase Storage
 */
export async function uploadLayoutPhoto(file: File, layoutId: string, studioId: string): Promise<UploadResult> {
  try {
    // Validate file
    const validation = validateFile(file, MAX_LAYOUT_PHOTO_SIZE);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    // Create unique filename with layout ID and timestamp
    const fileExt = file.name.split('.').pop();
    const fileName = `${layoutId}_${Date.now()}.${fileExt}`;
    const filePath = `${studioId}/${layoutId}/${fileName}`;

    // Debug authentication status
    const { data: { session } } = await supabase.auth.getSession();
    console.log('Current auth session:', { user: session?.user?.id, sessionValid: !!session?.user });

    // Upload file
    const { data, error } = await supabase.storage
      .from(LAYOUT_PHOTOS_BUCKET)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true
      });

    if (error) {
      console.error('Layout photo upload error:', error);
      return { success: false, error: 'Failed to upload layout photo' };
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(LAYOUT_PHOTOS_BUCKET)
      .getPublicUrl(filePath);

    return { success: true, url: publicUrl };
  } catch (error) {
    console.error('Unexpected error during layout photo upload:', error);
    return { success: false, error: 'Unexpected error occurred' };
  }
}

/**
 * Delete layout photo from Supabase Storage
 */
export async function deleteLayoutPhoto(url: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Extract file path from URL
    // URL format: https://{project}.supabase.co/storage/v1/object/public/studio-layout-photos/{path}
    const urlParts = url.split('/storage/v1/object/public/');
    if (urlParts.length < 2) {
      return { success: false, error: 'Invalid URL format' };
    }

    const fullPath = urlParts[1];
    const pathParts = fullPath.split('/');
    if (pathParts[0] !== LAYOUT_PHOTOS_BUCKET) {
      return { success: false, error: 'Invalid bucket' };
    }

    const filePath = pathParts.slice(1).join('/');

    // Delete file
    const { error } = await supabase.storage
      .from(LAYOUT_PHOTOS_BUCKET)
      .remove([filePath]);

    if (error) {
      console.error('Delete layout photo error:', error);
      return { success: false, error: 'Failed to delete layout photo' };
    }

    return { success: true };
  } catch (error) {
    console.error('Unexpected error during layout photo deletion:', error);
    return { success: false, error: 'Unexpected error occurred' };
  }
}
