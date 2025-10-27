export type AssetType = 'image' | 'video';

export interface AssetMetadata {
  service?: string;
  ratio?: string;
  resolution?: string | number;
  globalStyle?: string;
  duration?: string | number;
  tokenUsage?: number;
  hasLastFrame?: boolean;
  liteModel?: boolean;
  hasReference?: boolean;
  sceneId?: string;
  timestamp?: string | number;
  [key: string]: unknown;
}

export interface AssetHistory {
  id: string;
  user_id: string;
  original_content: string;
  storage_url: string;
  asset_type: AssetType;
  metadata?: AssetMetadata;
  created_at: string;
  updated_at: string;
}

export interface CreateAssetHistoryInput {
  original_content: string;
  storage_url: string;
  asset_type: AssetType;
  metadata?: AssetMetadata;
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
