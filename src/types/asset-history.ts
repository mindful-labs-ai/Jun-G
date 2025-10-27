export type AssetType = 'image' | 'video';

export interface AssetHistory {
  id: string;
  user_id: string;
  original_content: string;
  storage_url: string;
  asset_type: AssetType;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface CreateAssetHistoryInput {
  original_content: string;
  storage_url: string;
  asset_type: AssetType;
  metadata?: Record<string, any>;
}

export interface AssetHistoryListParams {
  asset_type?: AssetType;
  limit?: number;
  offset?: number;
}

export interface AssetHistoryListResponse {
  data: AssetHistory[];
  total: number;
  hasMore: boolean;
}
