import { createClient } from '@/lib/supabase/server';
import { AssetType } from '@/types/asset-history';
import type { SupabaseClient as SupabaseClientType } from '@supabase/supabase-js';

/**
 * Generate storage file path based on user_id and asset type
 * Format: temp_asset/{user_id}/{MMDD}/{filename}
 * Filename format: {timestamp}.{ext}
 */
export function generateStoragePath(
  userId: string,
  _originalContent: string | any, // Keep for API consistency but unused
  assetType: AssetType
): string {
  // Use timestamp in milliseconds for unique filename
  const timestamp = Date.now();

  // Get current date in MMDD format
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const dateFolder = `${month}${day}`;

  // Determine file extension
  const ext = assetType === 'image' ? 'png' : 'mp4';

  const filename = `${timestamp}.${ext}`;
  return `${userId}/${dateFolder}/${filename}`;
}

/**
 * Upload file to Supabase Storage
 * @param supabase - Authenticated Supabase client (pass from API route)
 * @param userId - User ID for folder organization
 * @param file - File to upload (File or Blob)
 * @param originalContent - Original content text for filename generation
 * @param assetType - Type of asset (image or video)
 * @returns Storage URL
 */
export async function uploadAsset(
  supabase: SupabaseClientType,
  userId: string,
  file: File | Blob,
  originalContent: string | any,
  assetType: AssetType
): Promise<string> {
  const path = generateStoragePath(userId, originalContent, assetType);

  console.log(`[uploadAsset] Uploading to path: ${path}`);

  const { data, error } = await supabase.storage
    .from('temp_asset')
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    console.error('[uploadAsset] Upload error:', error);
    throw new Error(`Failed to upload asset: ${error.message}`);
  }

  // Get public URL
  const {
    data: { publicUrl },
  } = supabase.storage.from('temp_asset').getPublicUrl(data.path);

  console.log(`[uploadAsset] Upload successful: ${publicUrl}`);
  return publicUrl;
}

/**
 * Upload base64 image to Supabase Storage
 * @param supabase - Authenticated Supabase client (pass from API route)
 * @param userId - User ID for folder organization
 * @param base64Data - Base64 encoded image data
 * @param originalContent - Original content text for filename generation
 * @returns Storage URL
 */
export async function uploadBase64Image(
  supabase: SupabaseClientType,
  userId: string,
  base64Data: string,
  originalContent: string | any
): Promise<string> {
  // Remove data:image/xxx;base64, prefix if exists
  const base64Content = base64Data.replace(/^data:image\/\w+;base64,/, '');

  // Convert base64 to blob
  const byteCharacters = atob(base64Content);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  const blob = new Blob([byteArray], { type: 'image/png' });

  return uploadAsset(supabase, userId, blob, originalContent, 'image');
}

/**
 * Delete asset from Supabase Storage
 * @param storageUrl - Full storage URL to delete
 */
export async function deleteAsset(storageUrl: string): Promise<void> {
  const supabase = await createClient();

  // Extract path from URL
  // URL format: https://{project}.supabase.co/storage/v1/object/public/temp_asset/{user_id}/{MMDD}/{filename}
  const urlParts = storageUrl.split('/temp_asset/');
  if (urlParts.length !== 2) {
    throw new Error('Invalid storage URL format');
  }

  const path = urlParts[1];

  const { error } = await supabase.storage.from('temp_asset').remove([path]);

  if (error) {
    throw new Error(`Failed to delete asset: ${error.message}`);
  }
}

/**
 * Get public URL for a storage path
 * @param path - Storage path relative to bucket
 */
export async function getPublicUrl(path: string): Promise<string> {
  const supabase = await createClient();

  const {
    data: { publicUrl },
  } = supabase.storage.from('temp_asset').getPublicUrl(path);

  return publicUrl;
}

/**
 * Download video from external URL and upload to Supabase Storage
 * @param supabase - Authenticated Supabase client (pass from API route)
 * @param userId - User ID for folder organization
 * @param videoUrl - External video URL (e.g., from SeedDance, Kling)
 * @param originalContent - Original content text for metadata
 * @returns Storage URL
 */
export async function downloadAndUploadVideo(
  supabase: SupabaseClientType,
  userId: string,
  videoUrl: string,
  originalContent: string | any
): Promise<string> {
  try {
    console.log('[downloadAndUploadVideo] Downloading from:', videoUrl);
    // Download video from external URL
    const response = await fetch(videoUrl);

    if (!response.ok) {
      throw new Error(`Failed to download video: ${response.statusText}`);
    }

    // Get video as blob
    const videoBlob = await response.blob();
    console.log('[downloadAndUploadVideo] Downloaded video size:', videoBlob.size);

    // Upload to our storage
    return await uploadAsset(supabase, userId, videoBlob, originalContent, 'video');
  } catch (error) {
    console.error('Failed to download and upload video:', error);
    throw error;
  }
}
