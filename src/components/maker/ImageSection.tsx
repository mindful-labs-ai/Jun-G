'use client';

import { Button } from '@/components/ui/button';
import { GeneratedImage, Scene, UploadedImage } from '@/lib/maker/types';
import { Check, Image as ImageIcon, Loader2, RefreshCw } from 'lucide-react';

type Props = {
  scenes: Scene[];
  images: Map<string, GeneratedImage>;
  onGenerateImage: (sceneId: string) => void;
  onGenerateAllClips: () => void;
  onConfirmImage: (imgId: string) => void;
  onConfirmAllImages: () => void;
  isConfirmedAllImage: boolean;
  uploadRefImage: React.Dispatch<React.SetStateAction<UploadedImage | null>>;
  setIdleSceneImage: (sceneId: string) => void;

  // 선택 모드(선택 가능하면 체크박스가 뜸)
  selectable?: boolean;
  selectedSceneIds?: Set<string>;
};

export default function ImageSection({
  scenes,
  images,
  onConfirmImage,
  onConfirmAllImages,
  isConfirmedAllImage,
  onGenerateImage,
  onGenerateAllClips,
  setIdleSceneImage,
}: Props) {
  return (
    <div
      className={`p-4 border border-border rounded-lg ${
        scenes.length === 0 ? 'opacity-50' : ''
      }`}
    >
      <div className='flex justify-between mb-2'>
        <div className='flex flex-col gap-3'>
          <h3 className='font-semibold'>2. 이미지 생성</h3>
          <p className='text-sm text-muted-foreground mb-3'>
            각 장면에 맞는 이미지를 생성합니다
          </p>
        </div>
        <div className='space-x-2'>
          {Array.from(images.values()).filter(img => img.dataUrl).length ===
            scenes.length &&
            (!isConfirmedAllImage ? (
              <Button variant='outline' onClick={onConfirmAllImages}>
                전체 확정
              </Button>
            ) : (
              <Button onClick={() => onGenerateAllClips()}>
                클립 병렬 작업
              </Button>
            ))}
        </div>
      </div>

      {scenes.length > 0 ? (
        <div className='space-y-2 max-h-[70vh] overflow-y-auto pr-1'>
          {scenes.map(scene => {
            const image = images.get(scene.id);
            const clipPrompt = scene.clipPrompt as string | undefined;

            const statusChip =
              image?.status === 'pending'
                ? '생성 중'
                : image?.status === 'failed'
                ? '실패'
                : image?.confirmed
                ? '확정됨'
                : image?.status === 'succeeded'
                ? '완료'
                : '대기';

            return (
              <div
                key={scene.id}
                className='relative flex gap-4 rounded-lg border bg-card p-3 hover:shadow-sm transition-shadow'
              >
                {/* 좌: 프레임(이미지) */}
                <div className=' shrink-0'>
                  <div className='relative overflow-hidden rounded-lg border bg-muted/20'>
                    <div className='h-[256px] w-[256px]'>
                      {image?.dataUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={image.dataUrl}
                          alt={image.sceneId}
                          className='h-full w-full object-cover'
                          loading='lazy'
                        />
                      ) : (
                        <div className='flex h-full w-full items-center justify-center text-muted-foreground'>
                          <div className='flex flex-col items-center gap-2'>
                            <ImageIcon className='h-6 w-6' />
                            <span className='text-xs'>이미지 없음</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* 로딩 오버레이 */}
                    {image?.status === 'pending' && (
                      <div className='absolute inset-0 flex items-center justify-center bg-black/40'>
                        <Loader2 className='h-6 w-6 animate-spin text-white' />
                      </div>
                    )}
                  </div>

                  {/* 액션 */}
                  <div className='mt-2 flex gap-2'>
                    <Button
                      className='flex-1'
                      size='sm'
                      variant='outline'
                      onClick={() => onGenerateImage(scene.id)}
                      disabled={image?.status === 'pending'}
                    >
                      {image?.status === 'pending' ? (
                        <>
                          <RefreshCw className='mr-2 h-3 w-3 animate-spin' />
                          생성 중…
                        </>
                      ) : (
                        '이미지 생성'
                      )}
                    </Button>
                    <Button
                      size='sm'
                      variant={image?.confirmed ? 'default' : 'secondary'}
                      className='h-8 w-8 p-0'
                      onClick={() => image && onConfirmImage(image.sceneId)}
                      disabled={!image || image.confirmed}
                    >
                      <Check className='h-4 w-4' />
                    </Button>
                  </div>
                </div>

                {/* 우: 설명 패널 */}
                <div className='min-w-0 flex-1'>
                  <div className='mb-2 flex items-center justify-between'>
                    <div className='flex items-center gap-2 text-xs text-muted-foreground'>
                      <span className='rounded-full border px-2.5 py-1'>
                        {statusChip}
                      </span>
                      <span>
                        • {scene.id}
                        <Button
                          className='text-xs text-muted-foreground'
                          size='sm'
                          variant='link'
                          onClick={() => setIdleSceneImage(scene.id)}
                        >
                          이미지 초기화
                        </Button>
                      </span>
                    </div>
                    {image && (
                      <span className='text-xs rounded-full border px-2 py-0.5 text-muted-foreground'>
                        {new Date(image.timestamp).toLocaleTimeString()}
                      </span>
                    )}
                  </div>

                  <div className='space-y-3'>
                    <div>
                      <h4 className='text-sm font-semibold'>원문</h4>
                      <p className='mt-1 whitespace-pre-line text-sm text-muted-foreground'>
                        {scene.originalText}
                      </p>
                    </div>

                    <div>
                      <h4 className='text-sm font-semibold'>이미지 프롬프트</h4>
                      <p className='mt-1 whitespace-pre-line text-sm text-muted-foreground'>
                        {scene.imagePrompt}
                      </p>
                    </div>

                    <details className='group'>
                      <summary className='cursor-pointer text-xs text-muted-foreground underline decoration-dotted underline-offset-2'>
                        요약/클립 프롬프트 보기
                      </summary>
                      <div className='mt-2 space-y-2 rounded-md border bg-muted/30 p-2'>
                        <div>
                          <div className='text-[11px] font-medium text-muted-foreground'>
                            요약
                          </div>
                          <p className='whitespace-pre-line text-sm'>
                            {scene.sceneExplain}
                          </p>
                        </div>
                        <div>
                          <div className='text-[11px] font-medium text-muted-foreground'>
                            장면 프롬프트(Scene Prompt)
                          </div>
                          <p className='whitespace-pre-line text-sm'>
                            {scene.englishPrompt}
                          </p>
                        </div>
                      </div>
                    </details>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <Button variant='outline' className='w-full bg-transparent' disabled>
          이미지 생성
        </Button>
      )}
    </div>
  );
}
