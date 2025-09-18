'use client';

import { Button } from '@/components/ui/button';
import {
  Check,
  MinusSquareIcon,
  PlusSquareIcon,
  RefreshCw,
} from 'lucide-react';
import { Scene } from '../../lib/maker/types';
import { buildImagePromptText } from '@/lib/maker/imagePromptBuilder';

export const SceneList = ({
  scenes,
  generating,
  onGenerate,
  onGenerateImage,
  onGenerateAllImages,
  onConfirm,
  onConfirmAll,
  isConfirmedAllScenes,
  addScene,
  removeScene,
  selected,
  setSelected,
}: {
  scenes: Scene[];
  generating: boolean;
  onGenerate: () => void;
  onGenerateImage: (
    sceneId: string,
    queue?: boolean,
    opts?: {
      selected?: boolean;
    }
  ) => Promise<void>;
  onGenerateAllImages: () => void;
  onConfirm: (id: string) => void;
  onConfirmAll: () => void;
  isConfirmedAllScenes: boolean;
  addScene: (targetId: string) => void;
  removeScene: (sceneId: string) => Promise<void>;
  selected: Set<string>;
  setSelected: (sceneId: string) => void;
}) => {
  return (
    <div className='p-4 border border-border rounded-lg'>
      <div className='flex items-center justify-between mb-2'>
        <div className='flex flex-col gap-3'>
          <h3 className='font-semibold'>1. 장면 프롬프트</h3>
          <p className='text-sm text-muted-foreground mb-3'>
            스크립트를 장면에 따라 나눕니다.
          </p>
        </div>
        <div className='space-x-2'>
          {scenes.length > 0 && (
            <>
              <Button variant='outline' onClick={onConfirmAll}>
                {isConfirmedAllScenes ? '전체 해제' : '전체 선택'}
              </Button>
              <Button
                variant={isConfirmedAllScenes ? 'default' : 'outline'}
                onClick={() => onGenerateAllImages()}
              >
                {isConfirmedAllScenes ? '전체 생성' : '선택 생성'}
              </Button>
            </>
          )}
          <Button
            variant='outline'
            className='bg-transparent'
            onClick={onGenerate}
            disabled={generating}
          >
            {generating ? (
              <>
                <RefreshCw className='w-4 h-4 mr-2 animate-spin' />
                장면 생성 중...
              </>
            ) : (
              '장면 쪼개기'
            )}
          </Button>
        </div>
      </div>

      {scenes.length > 0 ? (
        <div className='space-y-2 max-h-[calc(100dvh-498px)] overflow-y-auto'>
          {scenes.map(scene => (
            <div
              key={scene.id}
              className='p-3 border border-border rounded-lg bg-card'
            >
              <div className='flex relative items-start justify-between mb-2'>
                <div className='flex-1'>
                  <div className='flex gap-4 mb-4'>
                    <h1 className='text-lg'># {scene.id}</h1>
                    <div className='flex text-xs text-muted-foreground gap-1 items-center'>
                      <input
                        checked={selected.has(scene.id)}
                        onChange={() => setSelected(scene.id)}
                        id={scene.id}
                        type='checkbox'
                      />
                      <label htmlFor={scene.id}>이미지 캐릭터 미사용</label>
                    </div>
                  </div>
                  <p className='text-xs text-muted-foreground mb-1'>원문:</p>
                  <p className='text-sm font-medium mb-2 whitespace-pre-line'>
                    {scene.originalText}
                  </p>
                  <p className='text-xs text-muted-foreground mb-1'>
                    이미지 프롬프트:
                  </p>
                  <p className='text-sm text-muted-foreground mb-2'>
                    {buildImagePromptText(scene.imagePrompt)}
                  </p>
                  <p className='text-xs text-muted-foreground mb-1'>
                    한글 요약:
                  </p>
                  <p className='text-sm text-muted-foreground mb-2'>
                    {scene.koreanSummary}
                  </p>
                  <p className='text-xs text-muted-foreground mb-1'>
                    장면 요약:
                  </p>
                  <p className='text-sm'>{scene.sceneExplain}</p>
                </div>
                <div className='absolute flex gap-1 right-0'>
                  <Button
                    size='default'
                    variant={scene.confirmed ? 'default' : 'outline'}
                    onClick={() => onConfirm(scene.id)}
                  >
                    <Check className='w-4 h-4' />
                  </Button>
                  <Button
                    size='default'
                    variant='outline'
                    onClick={() =>
                      onGenerateImage(scene.id, false, {
                        selected: selected.has(scene.id),
                      })
                    }
                  >
                    이미지 생성
                  </Button>
                </div>
                <div className='absolute flex gap-1 right-0 bottom-0'>
                  <Button
                    size='icon'
                    variant='outline'
                    onClick={() => addScene(scene.id)}
                  >
                    <PlusSquareIcon />
                  </Button>
                  <Button
                    size='icon'
                    variant='destructive'
                    onClick={() => removeScene(scene.id)}
                  >
                    <MinusSquareIcon />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className='text-center text-muted-foreground mb-4'>
          장면을 만들어주세요.
        </p>
      )}
    </div>
  );
};

export default SceneList;
