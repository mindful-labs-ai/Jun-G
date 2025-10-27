import { AssetType } from '@/types/asset-history';

/**
 * Client-side utility for saving asset history
 * This should be called after successful asset generation
 */

export interface SaveAssetHistoryParams {
  originalContent: string;
  storageUrl: string;
  assetType: AssetType;
  metadata?: Record<string, any>;
}

/**
 * Save generated asset to history
 * Silent fail - doesn't throw errors to avoid breaking the main flow
 */
export async function saveAssetToHistory(params: SaveAssetHistoryParams): Promise<string | null> {
  try {
    const response = await fetch('/api/asset-history', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        original_content: params.originalContent,
        storage_url: params.storageUrl,
        asset_type: params.assetType,
        metadata: params.metadata || {},
      }),
    });

    if (!response.ok) {
      console.error('Failed to save asset to history:', response.statusText);
      return null;
    }

    const data = await response.json();
    console.log('✅ Asset saved to history:', data.id);
    return data.id;
  } catch (error) {
    console.error('Error saving asset to history:', error);
    return null;
  }
}

/**
 * Save image to history (convenience wrapper)
 * DEPRECATED: Use uploadAndSaveImageToHistory instead to upload to storage
 */
export async function saveImageToHistory(
  prompt: string,
  imageUrl: string,
  metadata?: Record<string, any>
): Promise<string | null> {
  return saveAssetToHistory({
    originalContent: prompt,
    storageUrl: imageUrl,
    assetType: 'image',
    metadata,
  });
}

/**
 * Upload image (base64 or URL) to storage and save to history
 * Use this for images from GPT, Gemini, etc.
 * @param prompt - Original prompt/content
 * @param imageData - Base64 image data or image URL
 * @param metadata - Optional metadata
 */
export async function uploadAndSaveImageToHistory(
  prompt: string,
  imageData: string,
  metadata?: Record<string, any>
): Promise<string | null> {
  try {
    const response = await fetch('/api/asset-history/save-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image_data: imageData,
        original_content: prompt,
        metadata: metadata || {},
      }),
    });

    if (!response.ok) {
      console.error('Failed to upload and save image:', response.statusText);
      return null;
    }

    const data = await response.json();
    console.log('✅ Image uploaded and saved to history:', data.id);
    return data.id;
  } catch (error) {
    console.error('Error uploading and saving image:', error);
    return null;
  }
}

/**
 * Save video/clip to history (convenience wrapper)
 */
export async function saveVideoToHistory(
  prompt: string,
  videoUrl: string,
  metadata?: Record<string, any>
): Promise<string | null> {
  return saveAssetToHistory({
    originalContent: prompt,
    storageUrl: videoUrl,
    assetType: 'video',
    metadata,
  });
}

/**
 * Download video from external URL, upload to our storage, and save to history
 * Use this for videos from SeedDance, Kling, etc.
 */
export async function downloadAndSaveVideoToHistory(
  prompt: string,
  videoUrl: string,
  metadata?: Record<string, any>
): Promise<string | null> {
  try {
    const response = await fetch('/api/asset-history/save-video', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        video_url: videoUrl,
        original_content: prompt,
        metadata: metadata || {},
      }),
    });

    if (!response.ok) {
      console.error('Failed to download and save video:', response.statusText);
      return null;
    }

    const data = await response.json();
    console.log('✅ Video downloaded and saved to history:', data.id);
    return data.id;
  } catch (error) {
    console.error('Error downloading and saving video:', error);
    return null;
  }
}

/**
 * Batch save multiple assets
 */
export async function batchSaveAssets(
  assets: SaveAssetHistoryParams[]
): Promise<Array<string | null>> {
  const promises = assets.map((asset) => saveAssetToHistory(asset));
  return Promise.all(promises);
}
