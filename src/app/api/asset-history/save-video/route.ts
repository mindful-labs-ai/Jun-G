import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { downloadAndUploadVideo } from '@/lib/storage/asset-storage';
import { AssetHistoryRepository } from '@/lib/repositories/asset-history-repository';
import { unauthorized, badRequest, internalError } from '@/lib/api/error-response';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return unauthorized();

    const body = await request.json();
    const { video_url, original_content, metadata } = body;

    if (!video_url || !original_content) {
      return badRequest('video_url and original_content are required');
    }

    const storageUrl = await downloadAndUploadVideo(supabase, user.id, video_url);

    const history = await AssetHistoryRepository.create(user.id, {
      original_content,
      storage_url: storageUrl,
      asset_type: 'video',
      metadata: metadata || {},
    });

    return NextResponse.json(history);
  } catch (error) {
    return internalError('Failed to save video to history', error);
  }
}
