import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { AssetHistoryRepository } from '@/lib/repositories/asset-history-repository';
import { deleteAsset } from '@/lib/storage/asset-storage';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/asset-history/[id]
 * Get a specific asset history record
 */
export async function GET(
  _request: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await ctx.params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const history = await AssetHistoryRepository.getById(id);

    if (!history) {
      return NextResponse.json(
        { error: 'Asset history not found' },
        { status: 404 }
      );
    }

    // Verify ownership
    if (history.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json(history);
  } catch (error) {
    console.error('Failed to get asset history:', error);
    return NextResponse.json(
      {
        error: 'Failed to get asset history',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/asset-history/[id]
 * Delete an asset history record and its associated file
 */
export async function DELETE(
  _request: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await ctx.params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the record first to verify ownership and get storage URL
    const history = await AssetHistoryRepository.getById(id);

    if (!history) {
      return NextResponse.json(
        { error: 'Asset history not found' },
        { status: 404 }
      );
    }

    // Verify ownership
    if (history.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Delete from storage (only if it's in our temp_asset bucket)
    if (history.storage_url.includes('/temp_asset/')) {
      try {
        await deleteAsset(history.storage_url);
      } catch (storageError) {
        console.error('Failed to delete asset from storage:', storageError);
        // Continue with database deletion even if storage deletion fails
      }
    }

    // Delete from database
    await AssetHistoryRepository.delete(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete asset history:', error);
    return NextResponse.json(
      {
        error: 'Failed to delete asset history',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/asset-history/[id]
 * Update metadata of an asset history record
 */
export async function PATCH(
  request: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await ctx.params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the record first to verify ownership
    const history = await AssetHistoryRepository.getById(id);

    if (!history) {
      return NextResponse.json(
        { error: 'Asset history not found' },
        { status: 404 }
      );
    }

    // Verify ownership
    if (history.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { metadata } = body;

    if (!metadata) {
      return NextResponse.json(
        { error: 'Metadata is required' },
        { status: 400 }
      );
    }

    const updated = await AssetHistoryRepository.updateMetadata(id, metadata);

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Failed to update asset history:', error);
    return NextResponse.json(
      {
        error: 'Failed to update asset history',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
