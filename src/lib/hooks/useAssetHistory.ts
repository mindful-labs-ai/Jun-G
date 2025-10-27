import { useState, useCallback } from 'react';
import {
  AssetHistory,
  AssetType,
  AssetHistoryListParams,
  AssetHistoryListResponse,
} from '@/types/asset-history';

/**
 * Hook for managing asset history
 */
export function useAssetHistory() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * List asset history with filters
   */
  const listHistory = useCallback(
    async (params?: AssetHistoryListParams): Promise<AssetHistoryListResponse | null> => {
      setLoading(true);
      setError(null);

      try {
        const searchParams = new URLSearchParams();
        if (params?.asset_type) searchParams.set('asset_type', params.asset_type);
        if (params?.limit) searchParams.set('limit', params.limit.toString());
        if (params?.offset) searchParams.set('offset', params.offset.toString());

        const response = await fetch(`/api/asset-history?${searchParams.toString()}`);

        if (!response.ok) {
          throw new Error('Failed to fetch asset history');
        }

        const data = await response.json();
        return data;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMsg);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  /**
   * Get recent asset history
   */
  const getRecent = useCallback(async (limit: number = 10): Promise<AssetHistory[] | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/asset-history/recent?limit=${limit}`);

      if (!response.ok) {
        throw new Error('Failed to fetch recent history');
      }

      const data = await response.json();
      return data;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMsg);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Get a specific asset history by ID
   */
  const getById = useCallback(async (id: string): Promise<AssetHistory | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/asset-history/${id}`);

      if (!response.ok) {
        throw new Error('Failed to fetch asset history');
      }

      const data = await response.json();
      return data;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMsg);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Create a new asset history record (for video URLs from external services)
   */
  const createHistory = useCallback(
    async (input: {
      original_content: string;
      storage_url: string;
      asset_type: AssetType;
      metadata?: Record<string, any>;
    }): Promise<AssetHistory | null> => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/asset-history', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(input),
        });

        if (!response.ok) {
          throw new Error('Failed to create asset history');
        }

        const data = await response.json();
        return data;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMsg);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  /**
   * Delete an asset history record
   */
  const deleteHistory = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/asset-history/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete asset history');
      }

      return true;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMsg);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Search asset history by content
   */
  const searchHistory = useCallback(
    async (query: string, limit: number = 20): Promise<AssetHistory[] | null> => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/asset-history/search?q=${encodeURIComponent(query)}&limit=${limit}`
        );

        if (!response.ok) {
          throw new Error('Failed to search asset history');
        }

        const data = await response.json();
        return data;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMsg);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  /**
   * Get statistics
   */
  const getStats = useCallback(async (): Promise<{
    totalImages: number;
    totalVideos: number;
    total: number;
  } | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/asset-history/stats');

      if (!response.ok) {
        throw new Error('Failed to fetch stats');
      }

      const data = await response.json();
      return data;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMsg);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Update metadata
   */
  const updateMetadata = useCallback(
    async (id: string, metadata: Record<string, any>): Promise<AssetHistory | null> => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/asset-history/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ metadata }),
        });

        if (!response.ok) {
          throw new Error('Failed to update metadata');
        }

        const data = await response.json();
        return data;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMsg);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return {
    loading,
    error,
    listHistory,
    getRecent,
    getById,
    createHistory,
    deleteHistory,
    searchHistory,
    getStats,
    updateMetadata,
  };
}
