import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { uploadBase64Image } from '@/lib/storage/asset-storage';
import { AssetHistoryRepository } from '@/lib/repositories/asset-history-repository';
import { unauthorized, badRequest, internalError } from '@/lib/api/error-response';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return unauthorized();

    const body = await request.json();
    const { image_data, original_content, metadata } = body;

    if (!image_data || !original_content) {
      return badRequest('image_data and original_content are required');
    }

    let storageUrl: string;

    if (image_data.startsWith('http://') || image_data.startsWith('https://')) {
      const response = await fetch(image_data);
      if (!response.ok) {
        throw new Error(`Failed to download image: ${response.statusText}`);
      }
      const imageBlob = await response.blob();
      const arrayBuffer = await imageBlob.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString('base64');
      const base64WithPrefix = `data:image/png;base64,${base64}`;

      storageUrl = await uploadBase64Image(supabase, user.id, base64WithPrefix);
    } else {
      storageUrl = await uploadBase64Image(supabase, user.id, image_data);
    }

    const history = await AssetHistoryRepository.create(user.id, {
      original_content,
      storage_url: storageUrl,
      asset_type: 'image',
      metadata: metadata || {},
    });

    return NextResponse.json(history);
  } catch (error: any) {
    return internalError('Failed to save image', error);
  }
}
