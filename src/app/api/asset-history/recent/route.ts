import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { AssetHistoryRepository } from '@/lib/repositories/asset-history-repository';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/asset-history/recent
 * Get recent asset history for current user
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
    const limit = parseInt(searchParams.get('limit') || '10');

    const history = await AssetHistoryRepository.getRecent(user.id, limit);

    return NextResponse.json(history);
  } catch (error) {
    console.error('Failed to get recent asset history:', error);
    return NextResponse.json(
      {
        error: 'Failed to get recent asset history',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
