import { useCallback, useState } from 'react';
import type { Scene, ScenesState } from '@/lib/maker/types';
import { notify } from '@/lib/maker/utils';
import { Button } from '../ui/button';

type Props = {
  sceneId: string;
  scene: Scene;
  script: string;
  customRule?: string;
  setScenesState: React.Dispatch<React.SetStateAction<ScenesState>>;
};

export const SingleSceneRegenerator = ({
  sceneId,
  scene,
  script,
  customRule,
  setScenesState,
}: Props) => {
  const [explain, setExplain] = useState('');
  const [loading, setLoading] = useState(false);

  const regenerate = useCallback(async () => {
    const sceneExplain = (explain ?? '').trim();
    if (!sceneExplain) {
      notify('생성을 위한 텍스트를 입력해주세요.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/scenes/regenerate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ script, customRule, sceneExplain }),
      });

      if (!res.ok) {
        const { error } = await res.json().catch(() => ({}));
        throw new Error(error ?? '부분 재생성 실패');
      }

      const regenerated: Partial<Scene> = await res.json();

      setScenesState(prev => {
        const old = prev.byId.get(sceneId);
        if (!old) return prev;
        const byId = new Map(prev.byId);
        byId.set(sceneId, {
          ...old,
          ...regenerated,
          id: sceneId,
          originalText: '(추가된 장면)',
          confirmed: false,
        } as Scene);
        return { byId, order: prev.order };
      });

      notify('장면 생성에 성공하였습니다.');
    } catch (e) {
      notify(String(e));
    } finally {
      setLoading(false);
    }
  }, [explain, script, customRule, sceneId, setScenesState]);

  return (
    <div className='space-y-3 text-sm'>
      <label className='block'>
        <span className='text-muted-foreground'>재생성 기준 텍스트</span>
        <textarea
          className='mt-1 w-full rounded border px-2 py-1 h-20'
          value={explain}
          onChange={e => setExplain(e.target.value)}
          placeholder={
            scene.sceneExplain ||
            '이 장면에서 전달하고 싶은 의도/감정/역할을 간단히 적어주세요'
          }
        />
      </label>

      <div className='flex justify-end gap-2'>
        <Button
          type='button'
          className='rounded w-full bg-primary text-primary-foreground disabled:opacity-50'
          onClick={regenerate}
          disabled={loading || !explain.trim()}
          title='해당 의도를 바탕으로 이 장면 JSON 재생성'
        >
          {loading ? '재생성 중…' : '장면 재생성'}
        </Button>
      </div>

      {/* 참고로 현재 장면의 핵심 필드 미리보기(읽기 전용) */}
      <div className='rounded border p-2 text-xs space-y-1'>
        <div>
          <span className='text-muted-foreground'>id</span> : {scene.id}
        </div>
        <div>
          <span className='text-muted-foreground'>englishPrompt</span> :{' '}
          {(scene as any).englishPrompt ?? ''}
        </div>
        <div>
          <span className='text-muted-foreground'>sceneExplain</span> :{' '}
          {scene.sceneExplain ?? ''}
        </div>
        <div>
          <span className='text-muted-foreground'>koreanSummary</span> :{' '}
          {scene.koreanSummary ?? ''}
        </div>
      </div>
    </div>
  );
};

export default SingleSceneRegenerator;
