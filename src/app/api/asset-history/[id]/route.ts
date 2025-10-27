import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { AssetHistoryRepository } from '@/lib/repositories/asset-history-repository';
import { deleteAsset } from '@/lib/storage/asset-storage';
import {
  unauthorized,
  notFound,
  forbidden,
  badRequest,
  internalError,
} from '@/lib/api/error-response';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

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

    if (!user) return unauthorized();

    const history = await AssetHistoryRepository.getById(id);
    if (!history) return notFound('Asset history');
    if (history.user_id !== user.id) return forbidden();

    return NextResponse.json(history);
  } catch (error) {
    return internalError('Failed to get asset history', error);
  }
}

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

    if (!user) return unauthorized();

    const history = await AssetHistoryRepository.getById(id);
    if (!history) return notFound('Asset history');
    if (history.user_id !== user.id) return forbidden();

    if (history.storage_url.includes('/temp_asset/')) {
      try {
        await deleteAsset(history.storage_url);
      } catch (storageError) {
        console.error('Failed to delete asset from storage:', storageError);
      }
    }

    await AssetHistoryRepository.delete(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return internalError('Failed to delete asset history', error);
  }
}

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

    if (!user) return unauthorized();

    const history = await AssetHistoryRepository.getById(id);
    if (!history) return notFound('Asset history');
    if (history.user_id !== user.id) return forbidden();

    const body = await request.json();
    const { metadata } = body;

    if (!metadata) return badRequest('Metadata is required');

    const updated = await AssetHistoryRepository.updateMetadata(id, metadata);
    return NextResponse.json(updated);
  } catch (error) {
    return internalError('Failed to update asset history', error);
  }
}
