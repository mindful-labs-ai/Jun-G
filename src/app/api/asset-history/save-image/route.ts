import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { uploadBase64Image } from '@/lib/storage/asset-storage';
import { AssetHistoryRepository } from '@/lib/repositories/asset-history-repository';

/**
 * POST /api/asset-history/save-image
 * Download image from URL or upload base64 image, save to storage, and create history record
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { image_data, original_content, metadata } = body;

    if (!image_data || !original_content) {
      return NextResponse.json(
        { error: 'image_data and original_content are required' },
        { status: 400 }
      );
    }

    let storageUrl: string;

    // Check if image_data is a URL or base64
    if (image_data.startsWith('http://') || image_data.startsWith('https://')) {
      // Download from URL
      const response = await fetch(image_data);
      if (!response.ok) {
        throw new Error(`Failed to download image: ${response.statusText}`);
      }
      const imageBlob = await response.blob();

      // Convert blob to base64 to use existing uploadBase64Image function
      const arrayBuffer = await imageBlob.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString('base64');
      const base64WithPrefix = `data:image/png;base64,${base64}`;

      storageUrl = await uploadBase64Image(supabase, user.id, base64WithPrefix, original_content);
    } else {
      // Upload base64 image directly
      storageUrl = await uploadBase64Image(supabase, user.id, image_data, original_content);
    }

    // Save to history with our storage URL
    const history = await AssetHistoryRepository.create(user.id, {
      original_content,
      storage_url: storageUrl,
      asset_type: 'image',
      metadata: metadata || {},
    });

    return NextResponse.json(history);
  } catch (error: any) {
    console.error('Error saving image:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to save image' },
      { status: 500 }
    );
  }
}
