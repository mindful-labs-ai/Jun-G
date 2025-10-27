import { createClient } from '@/lib/supabase/server';
import {
  AssetHistory,
  AssetMetadata,
  CreateAssetHistoryInput,
  AssetHistoryListParams,
  AssetHistoryListResponse,
} from '@/types/asset-history';

/**
 * Asset History Repository
 * Handles all database operations for asset_history table
 */
export class AssetHistoryRepository {
  /**
   * Create a new asset history record
   */
  static async create(
    userId: string,
    input: CreateAssetHistoryInput
  ): Promise<AssetHistory> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('asset_history')
      .insert({
        user_id: userId,
        original_content: input.original_content,
        storage_url: input.storage_url,
        asset_type: input.asset_type,
        metadata: input.metadata || {},
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create asset history: ${error.message}`);
    }

    return data;
  }

  /**
   * Get asset history by ID
   */
  static async getById(id: string): Promise<AssetHistory | null> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('asset_history')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Not found
        return null;
      }
      throw new Error(`Failed to get asset history: ${error.message}`);
    }

    return data;
  }

  /**
   * List asset history for current user with pagination and filters
   */
  static async list(
    userId: string,
    params: AssetHistoryListParams = {}
  ): Promise<AssetHistoryListResponse> {
    const supabase = await createClient();
    const { asset_type, limit = 20, offset = 0 } = params;

    // Build query
    let query = supabase
      .from('asset_history')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    // Apply filters
    if (asset_type) {
      query = query.eq('asset_type', asset_type);
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      throw new Error(`Failed to list asset history: ${error.message}`);
    }

    return {
      data: data || [],
      total: count || 0,
      hasMore: (count || 0) > offset + limit,
    };
  }

  /**
   * Get recent asset history for current user
   */
  static async getRecent(
    userId: string,
    limit: number = 10
  ): Promise<AssetHistory[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('asset_history')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to get recent asset history: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Delete asset history by ID
   */
  static async delete(id: string): Promise<void> {
    const supabase = await createClient();

    const { error } = await supabase
      .from('asset_history')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete asset history: ${error.message}`);
    }
  }

  static async updateMetadata(
    id: string,
    metadata: AssetMetadata
  ): Promise<AssetHistory> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('asset_history')
      .update({ metadata })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update asset history: ${error.message}`);
    }

    return data;
  }

  /**
   * Search asset history by original content
   */
  static async search(
    userId: string,
    searchQuery: string,
    limit: number = 20
  ): Promise<AssetHistory[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('asset_history')
      .select('*')
      .eq('user_id', userId)
      .ilike('original_content', `%${searchQuery}%`)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to search asset history: ${error.message}`);
    }

    return data || [];
  }

  static async getStats(
    userId: string
  ): Promise<{ totalImages: number; totalVideos: number; total: number }> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('asset_history')
      .select('asset_type')
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Failed to get asset history stats: ${error.message}`);
    }

    const totalImages = data.filter(item => item.asset_type === 'image').length;
    const totalVideos = data.filter(item => item.asset_type === 'video').length;

    return {
      totalImages,
      totalVideos,
      total: totalImages + totalVideos,
    };
  }
}
