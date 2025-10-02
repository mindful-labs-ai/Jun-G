'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ArrowRight,
  FileText,
  MessageSquare,
  Hash,
  SlidersHorizontal,
  MonitorSmartphone,
  Sparkles,
} from 'lucide-react';
import TextareaAutosize from 'react-textarea-autosize';
import { getTextStats } from '@/lib/shared/getTextStats';
import { FunnelProps, StateProps } from '@/lib/project/types';
import { useGetProjectBundle } from '@/lib/project/queries';
import { normalizePrefs, shallowDiffKeys } from '../project/utils';
import { usePreferenceSave } from '../project/usePerferenceSave';
import { useAuthStore } from '../shared/useAuthStore';

const MIN_CHARACTERS = 120;

export const ScriptInputBox = ({
  funnel,
  state,
}: {
  funnel: FunnelProps;
  state: StateProps;
}) => {
  const [isValid, setIsValid] = useState(false);
  const userId = useAuthStore(s => s.userNumber);

  const {
    data: bundle,
    isLoading,
    error,
  } = useGetProjectBundle(funnel.projectIdRef.current, funnel.signal);

  const { isDirty, save, isSaving } = usePreferenceSave({
    projectId: funnel.projectIdRef.current!,
    userId,
    local: state.preference,
    server: bundle?.prefs ?? null,
    script: state.script,
    serverScript: bundle?.project?.script ?? '',
  });

  const hydratedForSignalRef = useRef<number | null>(null);

  useEffect(() => {
    setIsValid(state.script.length >= MIN_CHARACTERS);
  }, [state.script]);

  useEffect(() => {
    if (!bundle?.project) return;
    if (hydratedForSignalRef.current === funnel.signal) return;
    const nextPref = normalizePrefs(bundle.prefs);
    const diffKeys = shallowDiffKeys(state.preference, nextPref);

    if (diffKeys.length) {
      for (const k of diffKeys) {
        state.chancePreference(k, nextPref[k]);
      }
    }
    state.setScript(bundle.project.script ?? '');

    hydratedForSignalRef.current = funnel.signal;
  }, [bundle, funnel.signal, state.preference, state.chancePreference, state]);

  const { characters, words, sentences } = getTextStats(state.script);

  const handleNavigateToMaker = () => {
    if (!isValid) {
      alert(
        `스크립트가 너무 짧습니다. 최소 ${MIN_CHARACTERS}자 이상 입력해주세요.`
      );
      return;
    }
    if (isDirty) {
      save();
    }
    alert('스크립트 저장됨, 메이커 페이지로 이동합니다.');
    funnel.next();
  };

  if (isLoading)
    return (
      <div className='p-8 text-center text-muted-foreground'>
        프로젝트 불러오는 중…
      </div>
    );
  if (error)
    return (
      <div className='p-8 text-center text-destructive'>불러오기 실패</div>
    );

  const progress = Math.min(
    100,
    Math.floor((characters / MIN_CHARACTERS) * 100)
  );

  return (
    <div className='min-h-screen bg-background'>
      {/* Header */}
      <header className='border-b border-border bg-card/50 backdrop-blur'>
        <div className='container mx-auto px-4 py-6 flex items-center justify-between'>
          <div>
            <h1 className='text-2xl md:text-3xl font-bold text-card-foreground'>
              {bundle?.project?.title ?? '프로젝트'}
            </h1>
            <p className='text-muted-foreground mt-1 line-clamp-2'>
              {bundle?.project?.description || ''}
            </p>
          </div>

          <div className='hidden md:flex items-center gap-2'>
            <Badge variant='outline' className='gap-1'>
              <Sparkles className='h-3.5 w-3.5' />
              준비 단계
            </Badge>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className='container mx-auto px-4 py-8'>
        <div className='grid grid-cols-1 lg:grid-cols-3 gap-6 items-start'>
          {/* Left: Script */}
          <Card className='lg:col-span-2 rounded-2xl'>
            <CardHeader className='pb-3'>
              <CardTitle className='flex items-center gap-2'>
                <FileText className='w-5 h-5' />
                스크립트 입력
              </CardTitle>
              <div className='mt-3'>
                {/* Progress bar */}
                <div className='h-2 w-full rounded-full bg-muted overflow-hidden'>
                  <div
                    style={{ width: `${progress}%` }}
                    className={`h-full transition-all ${
                      progress >= 100 ? 'bg-primary' : 'bg-primary/60'
                    }`}
                  />
                </div>
                <div className='mt-2 flex items-center gap-3 text-xs text-muted-foreground'>
                  <span>최소 {MIN_CHARACTERS}자</span>
                  <span>현재 {characters}자</span>
                </div>
              </div>
            </CardHeader>

            <CardContent className='space-y-6'>
              {/* Textarea */}
              <Textarea
                placeholder='여기에 숏폼 비디오용 스크립트를 입력하세요. 최소 120자 이상 입력해주세요…'
                value={state.script}
                onChange={e => state.setScript(e.target.value)}
                className='min-h-[260px] resize-none text-base leading-relaxed rounded-xl'
              />

              {/* Warning */}
              {state.script.length > 0 &&
                state.script.length < MIN_CHARACTERS && (
                  <p className='text-sm text-destructive'>
                    {MIN_CHARACTERS - state.script.length}자 더 입력해주세요
                  </p>
                )}

              {/* Stats */}
              <div className='flex flex-wrap gap-4'>
                <div className='flex items-center gap-2'>
                  <Hash className='w-4 h-4 text-muted-foreground' />
                  <span className='text-sm text-muted-foreground'>글자:</span>
                  <Badge
                    variant={
                      characters >= MIN_CHARACTERS ? 'default' : 'secondary'
                    }
                  >
                    {characters}
                  </Badge>
                </div>

                <div className='flex items-center gap-2'>
                  <MessageSquare className='w-4 h-4 text-muted-foreground' />
                  <span className='text-sm text-muted-foreground'>단어:</span>
                  <Badge variant='outline'>{words}</Badge>
                </div>

                <div className='flex items-center gap-2'>
                  <FileText className='w-4 h-4 text-muted-foreground' />
                  <span className='text-sm text-muted-foreground'>문장:</span>
                  <Badge variant='outline'>{sentences}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Right: Preferences */}
          <Card className='rounded-2xl'>
            <CardHeader className='pb-3'>
              <CardTitle className='flex items-center gap-2'>
                <SlidersHorizontal className='w-5 h-5' />
                비주얼 설정
              </CardTitle>
            </CardHeader>

            <CardContent className='space-y-6'>
              {/* Aspect ratio */}
              <section className='space-y-2'>
                <div className='text-sm font-medium flex items-center gap-2'>
                  <MonitorSmartphone className='w-4 h-4 text-muted-foreground' />
                  화면비
                </div>
                <div className='inline-flex flex-wrap gap-1 rounded-full border p-1 bg-card'>
                  {state.aspectOptions.map(r => (
                    <Button
                      key={r}
                      size='sm'
                      variant={
                        state.preference.ratio === r ? 'default' : 'ghost'
                      }
                      className='h-7 rounded-full'
                      onClick={() => state.chancePreference('ratio', r)}
                    >
                      {r}
                    </Button>
                  ))}
                </div>
              </section>

              {/* Resolution */}
              <section className='space-y-2'>
                <div className='text-sm font-medium'>해상도</div>
                <div className='inline-flex flex-wrap gap-1 rounded-full border p-1 bg-card'>
                  {state.resolutionOptions.map(r => (
                    <Button
                      key={r}
                      size='sm'
                      variant={
                        state.preference.resolution === `${r}p`
                          ? 'default'
                          : 'ghost'
                      }
                      className='h-7 rounded-full'
                      onClick={() =>
                        state.chancePreference('resolution', `${r}p`)
                      }
                    >
                      {r}p
                    </Button>
                  ))}
                </div>
              </section>

              {/* Image model */}
              <section className='space-y-2'>
                <div className='text-sm font-medium'>이미지 모델</div>
                <div className='inline-flex rounded-full border p-1 bg-card'>
                  <Button
                    size='sm'
                    variant={
                      state.preference.image_gen_model === 'Gemini'
                        ? 'default'
                        : 'ghost'
                    }
                    className='h-7 rounded-full'
                    onClick={() =>
                      state.chancePreference('image_gen_model', 'Gemini')
                    }
                  >
                    Gemini
                  </Button>
                  <Button
                    size='sm'
                    variant={
                      state.preference.image_gen_model === 'GPT'
                        ? 'default'
                        : 'ghost'
                    }
                    className='h-7 rounded-full'
                    onClick={() =>
                      state.chancePreference('image_gen_model', 'GPT')
                    }
                  >
                    GPT
                  </Button>
                </div>
              </section>

              {/* Clip model */}
              <section className='space-y-2'>
                <div className='text-sm font-medium'>클립 모델</div>
                <div className='inline-flex rounded-full border p-1 bg-card'>
                  <Button
                    size='sm'
                    variant={
                      state.preference.video_gen_model === 'Seedance'
                        ? 'default'
                        : 'ghost'
                    }
                    className='h-7 rounded-full'
                    onClick={() =>
                      state.chancePreference('video_gen_model', 'Seedance')
                    }
                  >
                    Seedance
                  </Button>
                </div>
              </section>

              {/* Global Style */}
              <section className='space-y-2'>
                <div className='flex items-center justify-between'>
                  <label className='text-sm font-medium'>이미지 스타일</label>
                  <span className='text-xs text-muted-foreground'>
                    {state.preference.custom_style?.length}/150
                  </span>
                </div>

                <TextareaAutosize
                  minRows={2}
                  maxRows={4}
                  value={state.preference.custom_style ?? ''}
                  onChange={e =>
                    state.chancePreference('custom_style', e.target.value)
                  }
                  className='w-full resize-none rounded-md border bg-background px-3 py-2 text-sm focus:outline-none'
                  placeholder={[
                    '예) A masterpiece Japanese style anime illustration,',
                    'A photorealistic,',
                    'A kawaii-style sticker,',
                  ].join(' ')}
                />
                <p className='text-xs text-muted-foreground'>
                  자연어로 자유롭게 작성하세요. 모든 이미지에 일괄 적용됩니다.
                </p>
              </section>

              {/* Custom Rule */}
              <section className='space-y-2'>
                <div className='flex items-center justify-between'>
                  <label className='text-sm font-medium'>
                    장면 분할 커스텀 룰
                  </label>
                  <span className='text-xs text-muted-foreground'>
                    {state.preference.split_rule?.length}/1000
                  </span>
                </div>

                <TextareaAutosize
                  minRows={5}
                  maxRows={12}
                  value={state.preference.split_rule ?? ''}
                  onChange={e =>
                    state.chancePreference('split_rule', e.target.value)
                  }
                  className='w-full resize-none rounded-md border bg-background px-3 py-2 text-sm focus:outline-none'
                  placeholder={[
                    '예) Close-up은 전체의 15% 이하, 실내는 handheld 금지,',
                    '파스텔 톤 유지, 장면 2/5에는 우산 소품 반복,',
                    '앵글은 eye-level/low/high 최소 3종 이상 섞기,',
                    '내 캐릭터 변경 금지',
                  ].join(' ')}
                />
                <p className='text-xs text-muted-foreground'>
                  사용자 규칙이 프롬프트에서 우선됩니다(안전 규칙 제외).
                </p>
              </section>
            </CardContent>
          </Card>
        </div>

        {/* Sticky Action */}
        <div className='sticky bottom-0 mt-8 bg-gradient-to-t from-background via-background/90 to-transparent pt-4'>
          <div className='flex p-4 justify-end'>
            <Button
              onClick={handleNavigateToMaker}
              disabled={!isValid || isSaving}
              size='lg'
              className='gap-2 rounded-xl shadow-sm'
            >
              메이커로 이동
              <ArrowRight className='w-4 h-4' />
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ScriptInputBox;
