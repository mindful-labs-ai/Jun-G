import { createClient } from '@/lib/supabase/server';
import { AssetType } from '@/types/asset-history';
import type { SupabaseClient as SupabaseClientType } from '@supabase/supabase-js';

export function generateStoragePath(
  userId: string,
  assetType: AssetType
): string {
  const timestamp = Date.now();
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const dateFolder = `${month}${day}`;
  const ext = assetType === 'image' ? 'png' : 'mp4';
  const filename = `${timestamp}.${ext}`;

  return `${userId}/${dateFolder}/${filename}`;
}

export async function uploadAsset(
  supabase: SupabaseClientType,
  userId: string,
  file: File | Blob,
  assetType: AssetType
): Promise<string> {
  const path = generateStoragePath(userId, assetType);

  const { data, error } = await supabase.storage
    .from('temp_asset')
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    throw new Error(`Failed to upload asset: ${error.message}`);
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from('temp_asset').getPublicUrl(data.path);

  return publicUrl;
}

export async function uploadBase64Image(
  supabase: SupabaseClientType,
  userId: string,
  base64Data: string
): Promise<string> {
  const base64Content = base64Data.replace(/^data:image\/\w+;base64,/, '');
  const byteCharacters = atob(base64Content);
  const byteNumbers = new Array(byteCharacters.length);

  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }

  const byteArray = new Uint8Array(byteNumbers);
  const blob = new Blob([byteArray], { type: 'image/png' });

  return uploadAsset(supabase, userId, blob, 'image');
}

export async function deleteAsset(storageUrl: string): Promise<void> {
  const supabase = await createClient();
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

export async function getPublicUrl(path: string): Promise<string> {
  const supabase = await createClient();
  const {
    data: { publicUrl },
  } = supabase.storage.from('temp_asset').getPublicUrl(path);

  return publicUrl;
}

export async function downloadAndUploadVideo(
  supabase: SupabaseClientType,
  userId: string,
  videoUrl: string
): Promise<string> {
  const response = await fetch(videoUrl);

  if (!response.ok) {
    throw new Error(`Failed to download video: ${response.statusText}`);
  }

  const videoBlob = await response.blob();
  return await uploadAsset(supabase, userId, videoBlob, 'video');
}
