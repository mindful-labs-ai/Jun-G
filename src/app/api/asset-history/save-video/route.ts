import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { downloadAndUploadVideo } from '@/lib/storage/asset-storage';
import { AssetHistoryRepository } from '@/lib/repositories/asset-history-repository';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/asset-history/save-video
 * Download video from external URL, upload to storage, and save to history
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { video_url, original_content, metadata } = body;

    if (!video_url || !original_content) {
      return NextResponse.json(
        { error: 'Missing required fields: video_url, original_content' },
        { status: 400 }
      );
    }

    // Download video from external URL and upload to our storage
    console.log('Downloading video from:', video_url);
    const storageUrl = await downloadAndUploadVideo(
      supabase,
      user.id,
      video_url,
      original_content
    );
    console.log('Video uploaded to storage:', storageUrl);

    // Save to history with our storage URL
    const history = await AssetHistoryRepository.create(user.id, {
      original_content,
      storage_url: storageUrl,
      asset_type: 'video',
      metadata: metadata || {},
    });

    console.log('✅ Video saved to history:', history.id);

    return NextResponse.json(history);
  } catch (error) {
    console.error('Failed to save video to history:', error);
    return NextResponse.json(
      {
        error: 'Failed to save video to history',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
