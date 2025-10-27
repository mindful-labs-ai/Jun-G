import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { AssetHistoryRepository } from '@/lib/repositories/asset-history-repository';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/asset-history/search
 * Search asset history by original content
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
    const query = searchParams.get('q');
    const limit = parseInt(searchParams.get('limit') || '20');

    if (!query) {
      return NextResponse.json(
        { error: 'Search query is required' },
        { status: 400 }
      );
    }

    const results = await AssetHistoryRepository.search(user.id, query, limit);

    return NextResponse.json(results);
  } catch (error) {
    console.error('Failed to search asset history:', error);
    return NextResponse.json(
      {
        error: 'Failed to search asset history',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
