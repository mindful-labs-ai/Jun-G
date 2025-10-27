import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { AssetHistoryRepository } from '@/lib/repositories/asset-history-repository';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/asset-history/stats
 * Get statistics for user's asset history
 */
export async function GET(_request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const stats = await AssetHistoryRepository.getStats(user.id);

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Failed to get asset history stats:', error);
    return NextResponse.json(
      {
        error: 'Failed to get asset history stats',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
