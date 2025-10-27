'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Search,
  Trash2,
  Image as ImageIcon,
  Video,
  Download,
} from 'lucide-react';
import { useAssetHistory } from '@/lib/hooks/useAssetHistory';
import { AssetHistory, AssetType } from '@/types/asset-history';

export default function HistoryPage() {
  const {
    listHistory,
    deleteHistory,
    searchHistory,
    getStats,
    loading,
    error,
  } = useAssetHistory();

  const [history, setHistory] = useState<AssetHistory[]>([]);
  const [filter, setFilter] = useState<AssetType | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState<{
    totalImages: number;
    totalVideos: number;
    total: number;
  } | null>(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const PAGE_SIZE = 20;

  useEffect(() => {
    loadHistory();
    loadStats();
  }, []);

  const loadHistory = async () => {
    const params = filter === 'all' ? {} : { asset_type: filter };
    const result = await listHistory({
      ...params,
      limit: PAGE_SIZE,
      offset: 0,
    });

    if (result) {
      setHistory(result.data);
      setHasMore(result.hasMore);
      setPage(0);
    }
  };

  const loadStats = async () => {
    const statsData = await getStats();
    setStats(statsData);
  };

  const handleFilterChange = async (newFilter: AssetType | 'all') => {
    setFilter(newFilter);
    setSearchQuery('');

    const params = newFilter === 'all' ? {} : { asset_type: newFilter };
    const result = await listHistory({
      ...params,
      limit: PAGE_SIZE,
      offset: 0,
    });

    if (result) {
      setHistory(result.data);
      setHasMore(result.hasMore);
      setPage(0);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!searchQuery.trim()) {
      loadHistory();
      return;
    }

    const results = await searchHistory(searchQuery, 50);
    if (results) {
      setHistory(results);
      setHasMore(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('정말 삭제하시겠습니까? 스토리지 파일도 함께 삭제됩니다.')) {
      return;
    }

    const success = await deleteHistory(id);
    if (success) {
      setHistory(prev => prev.filter(item => item.id !== id));
      loadStats();
    }
  };

  const handleLoadMore = async () => {
    const nextPage = page + 1;
    const params = filter === 'all' ? {} : { asset_type: filter };
    const result = await listHistory({
      ...params,
      limit: PAGE_SIZE,
      offset: nextPage * PAGE_SIZE,
    });

    if (result) {
      setHistory(prev => [...prev, ...result.data]);
      setHasMore(result.hasMore);
      setPage(nextPage);
    }
  };

  const handleDownload = (url: string, filename: string) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
  };

  return (
    <div className='min-h-screen bg-background'>
      {/* Header */}
      <div className='border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60'>
        <div className='container mx-auto px-4 py-4'>
          <div className='flex items-center justify-between'>
            <div>
              <h1 className='text-2xl font-bold'>생성 히스토리</h1>
              <p className='text-sm text-muted-foreground'>
                AI로 생성한 모든 이미지와 비디오
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className='container mx-auto px-4 py-6'>
        {/* Stats */}
        {stats && (
          <div className='grid grid-cols-3 gap-4 mb-6'>
            <div className='bg-card rounded-lg p-4 border'>
              <div className='flex items-center gap-2 text-muted-foreground mb-1'>
                <ImageIcon className='h-4 w-4' />
                <span className='text-sm'>이미지</span>
              </div>
              <p className='text-2xl font-bold'>{stats.totalImages}</p>
            </div>
            <div className='bg-card rounded-lg p-4 border'>
              <div className='flex items-center gap-2 text-muted-foreground mb-1'>
                <Video className='h-4 w-4' />
                <span className='text-sm'>비디오</span>
              </div>
              <p className='text-2xl font-bold'>{stats.totalVideos}</p>
            </div>
            <div className='bg-card rounded-lg p-4 border'>
              <div className='flex items-center gap-2 text-muted-foreground mb-1'>
                <span className='text-sm'>전체</span>
              </div>
              <p className='text-2xl font-bold'>{stats.total}</p>
            </div>
          </div>
        )}

        {/* Filters & Search */}
        <div className='flex flex-col sm:flex-row gap-4 mb-6'>
          <div className='flex gap-2'>
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              onClick={() => handleFilterChange('all')}
            >
              전체
            </Button>
            <Button
              variant={filter === 'image' ? 'default' : 'outline'}
              onClick={() => handleFilterChange('image')}
            >
              이미지
            </Button>
            <Button
              variant={filter === 'video' ? 'default' : 'outline'}
              onClick={() => handleFilterChange('video')}
            >
              비디오
            </Button>
          </div>

          <form onSubmit={handleSearch} className='flex-1 flex gap-2'>
            <Input
              placeholder='프롬프트로 검색...'
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            <Button type='submit' variant='outline'>
              <Search className='h-4 w-4' />
            </Button>
          </form>
        </div>

        {/* Error */}
        {error && (
          <div className='bg-destructive/10 text-destructive rounded-lg p-4 mb-6'>
            에러: {error}
          </div>
        )}

        {/* Loading */}
        {loading && history.length === 0 && (
          <div className='text-center py-12 text-muted-foreground'>
            로딩 중...
          </div>
        )}

        {/* Empty */}
        {!loading && history.length === 0 && (
          <div className='text-center py-12 text-muted-foreground'>
            <p className='text-lg mb-2'>생성된 에셋이 없습니다</p>
            <p className='text-sm'>
              이미지나 비디오를 생성하면 여기에 표시됩니다
            </p>
          </div>
        )}

        {/* Grid */}
        {history.length > 0 && (
          <>
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'>
              {history.map(item => (
                <div
                  key={item.id}
                  className='bg-card rounded-lg border overflow-hidden group hover:shadow-lg transition-shadow'
                >
                  {/* Preview */}
                  <div className='aspect-video bg-muted relative overflow-hidden'>
                    {item.asset_type === 'image' ? (
                      <img
                        src={item.storage_url}
                        alt={item.original_content}
                        className='w-full h-full object-cover'
                      />
                    ) : (
                      <video
                        src={item.storage_url}
                        controls
                        className='w-full h-full object-cover'
                      />
                    )}

                    {/* Action Buttons - Always visible in top-right corner */}
                    <div className='absolute top-2 right-2 flex gap-2'>
                      <Button
                        size='sm'
                        variant='secondary'
                        className='h-8 w-8 p-0 shadow-md'
                        onClick={() =>
                          handleDownload(
                            item.storage_url,
                            `${item.asset_type}-${new Date(item.created_at).toISOString()}.${
                              item.asset_type === 'image' ? 'png' : 'mp4'
                            }`
                          )
                        }
                      >
                        <Download className='h-4 w-4' />
                      </Button>
                      <Button
                        size='sm'
                        variant='destructive'
                        className='h-8 w-8 p-0 shadow-md'
                        onClick={() => handleDelete(item.id)}
                      >
                        <Trash2 className='h-4 w-4' />
                      </Button>
                    </div>
                  </div>

                  {/* Info */}
                  <div className='p-3'>
                    <div className='flex items-center gap-2 mb-2'>
                      {item.asset_type === 'image' ? (
                        <ImageIcon className='h-4 w-4 text-muted-foreground' />
                      ) : (
                        <Video className='h-4 w-4 text-muted-foreground' />
                      )}
                      <span className='text-xs text-muted-foreground'>
                        {new Date(item.created_at).toLocaleDateString('ko-KR', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <p className='text-sm line-clamp-2 mb-2'>
                      {item.original_content}
                    </p>
                    {item.metadata && Object.keys(item.metadata).length > 0 && (
                      <div className='flex flex-wrap gap-1'>
                        {item.metadata.service && (
                          <span className='text-xs bg-primary/10 text-primary px-2 py-0.5 rounded'>
                            {item.metadata.service}
                          </span>
                        )}
                        {item.metadata.ratio && (
                          <span className='text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded'>
                            {item.metadata.ratio}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Load More */}
            {hasMore && (
              <div className='text-center mt-8'>
                <Button
                  onClick={handleLoadMore}
                  disabled={loading}
                  variant='outline'
                >
                  {loading ? '로딩 중...' : '더 보기'}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
