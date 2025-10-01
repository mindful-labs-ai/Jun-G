'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Search, Plus, Calendar, Clock, LoaderIcon } from 'lucide-react';
import { FunnelProps, QueryProps } from '@/lib/project/types';
import { useAuthStore } from '@/lib/shared/useAuthStore';
import { useCreateMutation, usePrefetchProject } from '@/lib/project/queries';
import { useHoverPrefetch } from '@/lib/project/usePrefetchHover';

export const ProjectList = ({
  funnel,
  query,
}: {
  funnel: FunnelProps;
  query: QueryProps;
}) => {
  const [searchKeyword, setSearchKeyword] = useState('');
  const userId = useAuthStore(s => s.userNumber);
  const [title, setTitle] = useState<string>('');
  const [desc, setDesc] = useState<string>('');

  const projects = query.projectList;

  const { mutateAsync: createProjectMutation, isPending } =
    useCreateMutation(userId);

  const prefetch = usePrefetchProject();

  const { bind } = useHoverPrefetch<number>(prefetch, {
    delay: 300,
    once: true,
  });

  const filtered = useMemo(() => {
    const q = searchKeyword.trim().toLowerCase();
    if (!q) return projects;
    return projects.filter(
      p =>
        p.title.toLowerCase().includes(q) ||
        (p.description ?? '').toLowerCase().includes(q)
    );
  }, [projects, searchKeyword]);

  const formatDate = (dateString: string) =>
    new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(new Date(dateString));

  const openProject = (id: number) => {
    funnel.selectProject(id);
  };

  const handleCreate = async () => {
    try {
      await createProjectMutation({
        userId,
        title: title,
        description: desc,
      });
    } catch (e) {
      console.error('create project failed:', e);
    }
  };

  return (
    <div className='container mx-auto py-8 px-4 max-w-7xl'>
      {/* Header */}
      <div className='mb-8'>
        <h1 className='text-3xl font-semibold text-foreground mb-2 text-balance'>
          내 프로젝트
        </h1>
        <p className='text-muted-foreground'>
          프로젝트를 관리하고 새로운 작업을 시작하세요
        </p>
      </div>

      {/* Actions Bar */}
      <div className='flex items-center justify-between gap-4 mb-6'>
        <div className='relative flex-1 max-w-md'>
          <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
          <Input
            type='text'
            placeholder='프로젝트 검색...'
            value={searchKeyword}
            onChange={e => setSearchKeyword(e.target.value)}
            className='pl-10'
          />
        </div>

        <div>
          <Input
            placeholder='제목'
            value={title}
            onChange={e => setTitle(e.target.value)}
          />
          <Input
            placeholder='설명'
            value={desc}
            onChange={e => setDesc(e.target.value)}
          />
          <Button className='gap-2' onClick={handleCreate} disabled={isPending}>
            {isPending ? (
              <span className='flex items-center gap-2'>
                <LoaderIcon className='h-4 w-4' />
                생성 중
              </span>
            ) : (
              <span className='flex items-center gap-2'>
                <Plus className='h-4 w-4' />새 프로젝트
              </span>
            )}
          </Button>
        </div>
      </div>

      {/* Projects Card Row */}
      {filtered.length === 0 ? (
        <div className='text-center py-12 text-muted-foreground'>
          프로젝트가 없습니다
        </div>
      ) : (
        <div className='rounded-2xl -mx-4 px-4 shadow-[inset_0px_0px_16px_0px_rgba(0,_0,_0,_0.1)] py-4'>
          <div className='overflow-x-auto py-2 drop-shadow-sm'>
            <div className='flex gap-4 w-max'>
              {filtered.map(project => (
                <Card
                  key={project.id}
                  {...bind(project.id)}
                  role='button'
                  tabIndex={0}
                  onClick={() => openProject(project.id)}
                  onKeyDown={e =>
                    (e.key === 'Enter' || e.key === ' ') &&
                    openProject(project.id)
                  }
                  className='p-6 hover:shadow-lg transition-shadow cursor-pointer w-80 flex-shrink-0 outline-none focus:ring-2 focus:ring-primary/40'
                  title='프로젝트 열기'
                >
                  <div className='flex items-start justify-between mb-3'>
                    <h3 className='text-lg font-semibold text-foreground group-hover:text-primary transition-colors'>
                      {project.title}
                    </h3>
                  </div>

                  <p className='text-sm text-muted-foreground mb-4 line-clamp-2 min-h-[2.5rem]'>
                    {project.description || '설명 없음'}
                  </p>

                  <div className='flex flex-col gap-2 text-xs text-muted-foreground'>
                    <div className='flex items-center gap-2'>
                      <Calendar className='h-3.5 w-3.5' />
                      <span>생성: {formatDate(project.created_at)}</span>
                    </div>
                    <div className='flex items-center gap-2'>
                      <Clock className='h-3.5 w-3.5' />
                      <span>수정: {formatDate(project.updated_at)}</span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className='mt-6 text-sm text-muted-foreground'>
        총 {filtered.length}개의 프로젝트
      </div>
    </div>
  );
};

export default ProjectList;
