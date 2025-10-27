import { AssetType, AssetMetadata } from '@/types/asset-history';

export interface SaveAssetHistoryParams {
  originalContent: string;
  storageUrl: string;
  assetType: AssetType;
  metadata?: AssetMetadata;
}

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
    return data.id;
  } catch (error) {
    console.error('Error saving asset to history:', error);
    return null;
  }
}

export async function saveImageToHistory(
  prompt: string,
  imageUrl: string,
  metadata?: AssetMetadata
): Promise<string | null> {
  return saveAssetToHistory({
    originalContent: prompt,
    storageUrl: imageUrl,
    assetType: 'image',
    metadata,
  });
}

export async function uploadAndSaveImageToHistory(
  prompt: string,
  imageData: string,
  metadata?: AssetMetadata
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
    return data.id;
  } catch (error) {
    console.error('Error uploading and saving image:', error);
    return null;
  }
}

export async function saveVideoToHistory(
  prompt: string,
  videoUrl: string,
  metadata?: AssetMetadata
): Promise<string | null> {
  return saveAssetToHistory({
    originalContent: prompt,
    storageUrl: videoUrl,
    assetType: 'video',
    metadata,
  });
}

export async function downloadAndSaveVideoToHistory(
  prompt: string,
  videoUrl: string,
  metadata?: AssetMetadata
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
    return data.id;
  } catch (error) {
    console.error('Error downloading and saving video:', error);
    return null;
  }
}

export async function batchSaveAssets(
  assets: SaveAssetHistoryParams[]
): Promise<Array<string | null>> {
  const promises = assets.map((asset) => saveAssetToHistory(asset));
  return Promise.all(promises);
}
