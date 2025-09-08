'use client';

import { cn } from '@/lib/shared/utils';
import { Separator } from '@/components/ui/separator';
import { Video, ImageIcon, Scissors, Upload, Settings } from 'lucide-react';
import SceneList from '@/components/maker/SceneList';
import ImageSection from '@/components/maker/ImageSection';
import ClipSection from '@/components/maker/ClipSection';
import {
  Scene,
  GeneratedImage,
  GeneratedClip,
  UploadedImage,
} from '@/lib/maker/types';
import { useRef, useState } from 'react';
import { fileToBase64, notify } from '@/lib/maker/utils';
import { Button } from '../ui/button';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '../ui/hover-card';
import { useAIConfigStore } from '@/lib/maker/useAiConfigStore';

type Props = {
  step: number;
  setStep: (s: number) => void;

  // scenes
  scenes: Scene[];
  generatingScenes: boolean;
  onGenerateScenes: () => void | Promise<void>;
  onConfirmScene: (id: string) => void;
  onConfirmAllScenes: () => void;
  isConfirmedAllScenes: boolean;
  onEditScene: (id: string) => void;
  editingScene: string | number | null;

  // images
  images: Map<string, GeneratedImage>;
  onGenerateImage: (sceneId: string) => Promise<void>;
  onGenerateAllImages: () => void;
  onConfirmImage: (imgId: string) => void;
  onConfirmAllImages: () => void;
  isConfirmedAllImage: boolean;
  uploadRefImage: React.Dispatch<React.SetStateAction<UploadedImage | null>>;
  setIdleSceneImage: (sceneId: string) => void;

  // clips
  clips: Map<string, GeneratedClip>;
  onGenerateClip: (
    sceneId: string,
    aiType: 'kling' | 'seedance'
  ) => Promise<void>;
  onGenerateAllClips: () => void;
  onConfirmClip: (clipId: string) => void;
  onConfirmAllClips: () => void;
  onQueueAction: ({
    sceneId,
    aiType,
  }: {
    sceneId: string;
    aiType: 'kling' | 'seedance';
  }) => Promise<void>;
  setIdleSceneClip: (sceneId: string) => void;
};

const steps = [
  { key: 0, label: 'Scenes', sub: 'Script to Scenes', icon: Video },
  { key: 1, label: 'Images', sub: 'Generate Images', icon: ImageIcon },
  { key: 2, label: 'Clips', sub: 'Make video Clips', icon: Scissors },
];

export default function VisualPipeline({
  step,
  setStep,

  scenes,
  generatingScenes,
  onGenerateScenes,
  onConfirmScene,
  onConfirmAllScenes,
  isConfirmedAllScenes,

  images,
  onGenerateImage,
  onGenerateAllImages,
  onConfirmImage,
  onConfirmAllImages,
  isConfirmedAllImage,
  uploadRefImage,
  setIdleSceneImage,

  clips,
  onGenerateClip,
  onGenerateAllClips,
  onConfirmClip,
  onConfirmAllClips,
  onQueueAction,
  setIdleSceneClip,
}: Props) {
  const setModalOpen = useAIConfigStore(config => config.setModalOpen);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [refFile, setRefFile] = useState<{
    file: File | null;
    url: string;
  }>({ file: null, url: '' });

  const processFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      notify('이미지 파일만 업로드 가능합니다.');
      return;
    }

    try {
      const convertedImage = await fileToBase64(file);
      uploadRefImage(convertedImage);
      setRefFile({ file, url: convertedImage.dataUrl });
    } catch (err) {
      notify('이미지 변환에 실패하였습니다.');
      console.error(err);
    }
  };

  // 파일 선택 핸들러
  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const CurrentIcon = steps[step].icon;

  return (
    <section className='relative w-full mx-auto'>
      {/* Sticky Stepper */}
      <div className='sticky top-2 z-20'>
        <div className='backdrop-blur supports-[backdrop-filter]:bg-background/60 bg-background/90 border rounded-2xl px-3 py-2'>
          <div className='flex justify-between'>
            <div className='flex items-center gap-2'>
              {steps.map((s, idx) => {
                const ActiveIcon = s.icon;
                const active = s.key === step;
                const done = s.key < step;
                return (
                  <button
                    key={s.key}
                    onClick={() => setStep(s.key)}
                    className={cn(
                      'group relative flex items-center gap-2 rounded-xl px-3 py-2 transition-colors',
                      active
                        ? 'bg-primary/10 text-primary'
                        : done
                        ? 'text-foreground'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    <ActiveIcon
                      className={cn('h-4 w-4', active && 'text-primary')}
                    />
                    <div className='text-left'>
                      <div className='text-sm leading-tight'>{s.label}</div>
                      <div className='text-xs leading-tight text-muted-foreground'>
                        {s.sub}
                      </div>
                    </div>
                    {idx < steps.length - 1 && (
                      <div className='mx-3 h-5 w-px bg-border/80 hidden sm:block' />
                    )}
                  </button>
                );
              })}
            </div>
            <div className='flex items-center gap-4'>
              <input
                ref={fileInputRef}
                type='file'
                accept='image/*'
                onChange={handleFileInput}
                className='hidden'
              />
              <HoverCard openDelay={120} closeDelay={80}>
                <HoverCardTrigger asChild>
                  <p className='max-w-[200px] truncate text-sm text-muted-foreground cursor-help underline decoration-dotted underline-offset-2'>
                    {refFile?.file?.name || '참조 이미지 없음'}
                  </p>
                </HoverCardTrigger>
                <HoverCardContent className='w-auto p-2'>
                  {refFile.url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={refFile.url}
                      alt='참조 이미지 미리보기'
                      className='h-44 w-44 object-cover rounded-md border'
                    />
                  ) : (
                    <div className='h-44 w-44 flex items-center justify-center text-xs text-muted-foreground'>
                      미리볼 이미지 없음
                    </div>
                  )}
                </HoverCardContent>
              </HoverCard>

              <Button
                onClick={() => fileInputRef.current?.click()}
                variant='outline'
              >
                <Upload className='mr-2 h-4 w-4' />
                참조 이미지 선택
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Airy Canvas */}
      <div className='relative mt-4 h-fit overflow-hidden rounded-3xl border'>
        {/* grid-ish background */}
        <div className='pointer-events-none absolute inset-0 opacity-[0.55]'>
          <div className='absolute inset-0 bg-[radial-gradient(#0000000a_1px,transparent_1px)] [background-size:14px_14px]' />
          <div className='absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-muted/70 to-transparent' />
        </div>

        {/* Header inside canvas */}
        <div className='relative flex justify-between items-center p-4 md:p-6'>
          <div className='flex items-center gap-2'>
            <div className='inline-flex items-center gap-2 rounded-full border bg-card/80 px-3 py-1.5 backdrop-blur'>
              <CurrentIcon className='h-4 w-4' />
              <span className='text-sm font-medium'>{steps[step].label}</span>
            </div>
            <Separator
              className='mx-2 hidden md:block'
              orientation='vertical'
            />
            <p className='hidden md:block text-xs text-muted-foreground'>
              {steps[step].sub}
            </p>
          </div>
          <Button variant='outline' onClick={() => setModalOpen(true)}>
            <Settings />
          </Button>
        </div>

        {/* Content */}
        <div className='relative p-4 md:p-6'>
          <div className='mx-auto rounded-lg shadow-md'>
            {step === 0 && (
              <div className='space-y-4'>
                <SceneList
                  scenes={scenes}
                  generating={generatingScenes}
                  onGenerate={onGenerateScenes}
                  onGenerateImage={onGenerateImage}
                  onGenerateAllImages={onGenerateAllImages}
                  onConfirm={onConfirmScene}
                  onConfirmAll={onConfirmAllScenes}
                  isConfirmedAllScenes={isConfirmedAllScenes}
                />
              </div>
            )}

            {step === 1 && (
              <div className='space-y-4'>
                <ImageSection
                  scenes={scenes}
                  images={images}
                  onGenerateImage={onGenerateImage}
                  onGenerateAllClips={onGenerateAllClips}
                  onConfirmImage={onConfirmImage}
                  onConfirmAllImages={onConfirmAllImages}
                  isConfirmedAllImage={isConfirmedAllImage}
                  uploadRefImage={uploadRefImage}
                  selectable={true}
                  setIdleSceneImage={setIdleSceneImage}
                />
              </div>
            )}

            {step === 2 && (
              <div className='space-y-4'>
                <ClipSection
                  scenes={scenes}
                  images={images}
                  clips={clips}
                  onGenerateClip={onGenerateClip}
                  onConfirmClip={onConfirmClip}
                  onConfirmAll={onConfirmAllClips}
                  onQueueAction={onQueueAction}
                  setIdleSceneClip={setIdleSceneClip}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
