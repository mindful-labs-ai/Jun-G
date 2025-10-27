import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { AssetHistoryRepository } from '@/lib/repositories/asset-history-repository';
import { AssetType } from '@/types/asset-history';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/asset-history
 * List asset history with filters and pagination
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const assetType = searchParams.get('asset_type') as AssetType | null;
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    const result = await AssetHistoryRepository.list(user.id, {
      asset_type: assetType || undefined,
      limit,
      offset,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Failed to list asset history:', error);
    return NextResponse.json(
      {
        error: 'Failed to list asset history',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/asset-history
 * Create a new asset history record (for video URL saving)
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
    const { original_content, storage_url, asset_type, metadata } = body;

    if (!original_content || !storage_url || !asset_type) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (asset_type !== 'image' && asset_type !== 'video') {
      return NextResponse.json(
        { error: 'Invalid asset_type. Must be "image" or "video"' },
        { status: 400 }
      );
    }

    const history = await AssetHistoryRepository.create(user.id, {
      original_content,
      storage_url,
      asset_type,
      metadata: metadata || {},
    });

    return NextResponse.json(history);
  } catch (error) {
    console.error('Failed to create asset history:', error);
    return NextResponse.json(
      {
        error: 'Failed to create asset history',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
