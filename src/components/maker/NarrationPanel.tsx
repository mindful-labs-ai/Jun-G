'use client';

import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DownloadIcon,
  Pause,
  Play,
  RefreshCw,
  Volume2,
  Check,
} from 'lucide-react';
import { GeneratedNarration, NarrationSettings } from '../../lib/maker/types';
import { formatTime } from '../../lib/maker/utils';
import { useMemo, useRef, useState } from 'react';

export default function NarrationPanel({
  scriptPresent,
  narration,
  settings,
  setSettings,
  generating,
  isPlaying,
  currentTime,
  onGenerate,
  onPlayPause,
  onDownload,
  onConfirm,
  onSeek, // ★ 추가
}: {
  scriptPresent: boolean;
  narration: GeneratedNarration | null;
  settings: NarrationSettings;
  setSettings: (s: NarrationSettings) => void;
  generating: boolean;
  isPlaying: boolean;
  currentTime: number;
  onGenerate: () => void;
  onPlayPause: () => void;
  onDownload: () => void;
  onConfirm: () => void;
  onSeek: (sec: number) => void; // ★ 추가
}) {
  // 드래그(스크럽) 중 임시 값
  const [scrub, setScrub] = useState<number | null>(null);
  const isScrubbing = useRef(false);

  const duration = narration?.duration ?? 0;
  const displayCurrent = scrub ?? currentTime;

  // 슬라이더 value는 항상 배열
  const sliderValue = useMemo<[number]>(() => {
    return [Math.min(duration || 0, Math.max(0, displayCurrent || 0))];
  }, [displayCurrent, duration]);

  const canSeek = !!narration && duration > 0;

  return (
    <div className='p-4 border border-border rounded-lg'>
      <h3 className='font-semibold mb-2'>나레이션 생성</h3>
      <p className='text-sm text-muted-foreground mb-4'>
        스크립트를 음성으로 변환합니다
      </p>

      {/* controls */}
      <div className='space-y-4'>
        {/* Stability */}
        <div className='flex flex-col gap-2'>
          <span className='text-sm font-medium'>Stability</span>
          <div className='flex flex-col gap-1'>
            <Slider
              value={[settings.stability]}
              onValueChange={value =>
                setSettings({ ...settings, stability: value[0] })
              }
              max={100}
              min={0}
              step={50}
              className='w-full'
            />
            <div className='w-full text-xs text-muted-foreground flex justify-between'>
              <span>Creative</span>
              <span>Robust</span>
            </div>
          </div>
        </div>

        {/* Voice */}
        <div className='space-y-2'>
          <span className='text-sm font-medium'>음성</span>
          <Select
            value={settings.model}
            onValueChange={value => setSettings({ ...settings, model: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='jB1Cifc2UQbq1gR3wnb0'>
                Bin(한글 모델)
              </SelectItem>
              <SelectItem value='3JDquces8E8bkmvbh6Bc'>
                Otani(일본어 모델)
              </SelectItem>
              <SelectItem value='Bj9UqZbhQsanLzgalpEG'>
                Austin(영어 모델)
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Generate */}
      <Button
        variant='outline'
        className='w-full mt-4 bg-transparent'
        onClick={onGenerate}
        disabled={generating || !scriptPresent}
      >
        {generating ? (
          <>
            <RefreshCw className='w-4 h-4 mr-2 animate-spin' />
            나레이션 생성 중...
          </>
        ) : narration ? (
          '나레이션 재생성'
        ) : (
          '나레이션 생성'
        )}
      </Button>

      {/* Player */}
      {narration && (
        <div className='mt-4 p-3 border border-border rounded-lg bg-card'>
          <div className='flex items-center gap-3 mb-3'>
            <Button
              size='sm'
              variant='outline'
              onClick={onPlayPause}
              className='w-10 h-10 p-0 bg-transparent'
            >
              {isPlaying ? (
                <Pause className='w-4 h-4' />
              ) : (
                <Play className='w-4 h-4' />
              )}
            </Button>

            <div className='flex-1'>
              <div className='flex items-center justify-between text-sm text-muted-foreground mb-1'>
                <span>{formatTime(Math.floor(displayCurrent))}</span>
                <span>{formatTime(duration)}</span>
              </div>

              {/* ★ 재생바: Slider로 교체 (드래그 시 프리뷰, 놓을 때 onSeek 호출) */}
              <div
                className='w-full'
                onPointerDown={() => {
                  isScrubbing.current = true;
                }}
                onPointerUp={() => {
                  if (!canSeek) return;
                  if (isScrubbing.current) {
                    isScrubbing.current = false;
                    if (typeof scrub === 'number') {
                      onSeek(Math.max(0, Math.min(duration, scrub)));
                    }
                    setScrub(null);
                  }
                }}
              >
                <Slider
                  value={sliderValue}
                  max={Math.max(1, duration)}
                  min={0}
                  step={0.1}
                  disabled={!canSeek}
                  onValueChange={v => {
                    if (!canSeek) return;
                    // 드래그 중엔 프리뷰만 갱신
                    setScrub(v[0]);
                  }}
                  className='w-full'
                />
              </div>
            </div>

            <Volume2 className='w-4 h-4 text-muted-foreground' />
          </div>

          <div className='flex items-center justify-end'>
            <div className='flex items-center gap-2'>
              <Button
                size='sm'
                variant='ghost'
                onClick={onDownload}
                className='gap-1'
              >
                <DownloadIcon className='w-3 h-3' />
                다운로드
              </Button>
              <Button
                size='sm'
                variant={narration.confirmed ? 'default' : 'outline'}
                onClick={onConfirm}
                disabled={narration.confirmed}
                className='gap-1'
              >
                <Check className='w-3 h-3' />
                {narration.confirmed ? '확정됨' : '확정'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
