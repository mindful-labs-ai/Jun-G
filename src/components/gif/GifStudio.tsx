'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Loader2,
  PlayCircle,
  Redo2,
  X,
  Download,
  Images,
  Film,
  Upload,
  FileImage,
  ChevronDown,
} from 'lucide-react';
import type { UploadedImage } from '@/lib/maker/types';
import { fileToBase64, makeGifFromDataUrls, notify } from '@/lib/gif/utils';
import { FrameState, TemplateDef } from '@/lib/gif/types';
import { TEMPLATES } from '@/lib/gif/template';

const generateImageOnce = async ({
  prompt,
  refImage,
  signal,
}: {
  prompt: string;
  refImage: UploadedImage;
  signal?: AbortSignal;
}) => {
  const response = await fetch(`/api/image-gen/gemini/gif`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt: `무조건 이미지를 생성해줘, 내가 요구한 요소만 수정해줘, ${prompt}, 캐릭터를 제외한 배경의 색은 '#ff00ff' 단색으로 줘`,
      imageBase64: refImage.base64,
      imageMimeType: refImage.mimeType,
    }),
    signal,
  });
  if (!response.ok) throw new Error('요청이 이상해요!');
  const data = await response.json();

  if (data.success) {
    return {
      base64: data.generatedImage,
      dataUrl: `data:image/png;base64,${data.generatedImage}`,
      mimeType: 'image/png',
      status: 'success',
    };
  } else {
    throw new Error('AI가 이미지 제작에 실패했습니다.');
  }
};

export const GifStudio = () => {
  // Left sidebar state
  const [uploadedImage, setUploadedImage] = useState<UploadedImage | null>(
    null
  );
  const [dragActive, setDragActive] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [templateId, setTemplateId] = useState('');
  const [isCombining, setIsCombining] = useState(false);

  // Center + right state
  const [frames, setFrames] = useState<FrameState[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [gallery, setGallery] = useState<{ index: number; dataUrl: string }[]>(
    []
  );
  const [gifUrl, setGifUrl] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => () => abortRef.current?.abort(), []);

  useEffect(() => {
    return () => {
      if (gifUrl) URL.revokeObjectURL(gifUrl);
    };
  }, [gifUrl]);

  const handleQueueStop = () => {
    abortRef.current?.abort();
  };

  const template = useMemo(
    () => TEMPLATES.find(t => t.id === templateId) || null,
    [templateId]
  );

  const ready = Boolean(uploadedImage && template);

  const initFramesFromTemplate = (
    template: TemplateDef | undefined
  ): FrameState[] => {
    if (!template) return [];
    return template.frames.map((f, i) => ({
      index: i,
      label: f.label,
      prompt: f.prompt,
      status: 'pending',
    }));
  };

  const handleMakeGif = async () => {
    try {
      setIsCombining(true);
      setErrorMsg(null);

      // 이전 결과 URL 정리
      if (gifUrl) {
        URL.revokeObjectURL(gifUrl);
        setGifUrl(null);
      }

      const urls = frames
        .filter(f => f.status === 'done' && f.image?.dataUrl)
        .map(f => f.image!.dataUrl);

      if (!urls.length) {
        notify('완료된 프레임이 없습니다.');
        return;
      }

      const url = await makeGifFromDataUrls(urls, {
        fps: 4,
        repeat: 0,
      });
      setGifUrl(url);
    } catch (e: any) {
      setErrorMsg(e?.message || 'GIF 생성 실패');
    } finally {
      setIsCombining(false);
    }
  };

  // -------- left sidebar --------
  const processFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      notify('이미지가 아닌 파일입니다.');
      return;
    }
    try {
      const converted = await fileToBase64(file);
      setUploadedImage(converted as UploadedImage);
    } catch {
      notify('이미지 변환 실패');
    }
  };
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0])
      processFile(e.dataTransfer.files[0]);
  };
  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) processFile(e.target.files[0]);
  };

  const handleReset = () => {
    setErrorMsg(null);
    setGifUrl(null);
    setGallery([]);
    setFrames([]);
  };

  // -------- center section --------
  const startGeneration = async () => {
    if (!ready || !uploadedImage || !template) return;
    setErrorMsg(null);
    setGifUrl(null);
    setGallery([]);
    setIsGenerating(true);
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    setFrames(prev => {
      const base = initFramesFromTemplate(template);
      return base.map((f, i) => ({
        ...f,
        prompt: prev[i]?.prompt ?? f.prompt,
      }));
    });

    try {
      let prevRef = uploadedImage;
      for (let i = 0; i < template.frames.length; i++) {
        setFrames(prev =>
          prev.map(fr =>
            fr.index === i
              ? { ...fr, status: 'generating', error: undefined }
              : fr
          )
        );

        const prompt = frames[i]?.prompt ?? template.frames[i].prompt;

        // call API
        const data = await generateImageOnce({
          prompt,
          refImage: prevRef,
          signal: abortRef.current.signal,
        });

        if (data.status !== 'success') {
          notify('알수 없는 에러에 의해 이미지 생성에 실패했습니다.');
          return;
        }

        setFrames(prev =>
          prev.map(fr =>
            fr.index === i
              ? {
                  ...fr,
                  status: 'done',
                  image: {
                    name: `frame-${i}`,
                    base64: data.base64,
                    dataUrl: data.dataUrl,
                    mimeType: data.mimeType,
                  },
                }
              : fr
          )
        );

        setGallery(prev => [...prev, { index: i, dataUrl: data.dataUrl }]);

        prevRef = {
          name: 'frame-i',
          base64: data.base64,
          dataUrl: data.dataUrl,
          mimeType: data.mimeType,
        };
      }
    } catch (e: any) {
      setFrames(prev =>
        prev.map(fr =>
          fr.status === 'generating'
            ? { ...fr, status: 'error', error: e?.message || '오류' }
            : fr
        )
      );
      if (e?.name === 'AbortError') return;
      setErrorMsg(e?.message || '생성 중 오류');
    } finally {
      setIsGenerating(false);
    }
  };

  const regenerateFrame = async (idx: number) => {
    if (!uploadedImage) {
      notify('참조할 이미지가 없습니다!');
      return;
    }
    setIsGenerating(true);
    setErrorMsg(null);

    abortRef.current?.abort();
    abortRef.current = new AbortController();

    const prevFile = frames[idx - 1]?.image || uploadedImage;

    setFrames(prev =>
      prev.map(fr =>
        fr.index === idx
          ? { ...fr, status: 'generating', error: undefined }
          : fr
      )
    );
    try {
      const prompt = frames[idx]?.prompt || template?.frames[idx].prompt;
      if (!prompt) {
        notify('프롬프트를 입력해주세요');
        return;
      }

      console.log({
        prompt,
        refImage: prevFile,
        signal: abortRef.current?.signal,
      });

      const data = await generateImageOnce({
        prompt,
        refImage: prevFile,
        signal: abortRef.current?.signal,
      });

      setFrames(prev =>
        prev.map(fr =>
          fr.index === idx
            ? {
                ...fr,
                status: 'done',
                image: {
                  name: `frame-${idx}`,
                  base64: data.base64,
                  dataUrl: data.dataUrl,
                  mimeType: data.mimeType,
                },
              }
            : fr
        )
      );

      setGallery(prev => {
        const next = [...prev];
        const pos = next.findIndex(g => g.index === idx);
        if (pos >= 0) next[pos] = { index: idx, dataUrl: data.dataUrl };
        else next.push({ index: idx, dataUrl: data.dataUrl });
        return next;
      });
    } catch (e: any) {
      setFrames(prev =>
        prev.map(fr =>
          fr.index === idx
            ? { ...fr, status: 'error', error: e?.message || '오류' }
            : fr
        )
      );
      setErrorMsg(e?.message || '생성 중 오류');
    } finally {
      setIsGenerating(false);
    }
  };

  const updatePrompt = (idx: number, v: string) =>
    setFrames(prev =>
      prev.map(fr => (fr.index === idx ? { ...fr, prompt: v } : fr))
    );

  const canCombine = useMemo(
    () =>
      frames.length > 0 && frames.every(f => f.status === 'done' && f.image),
    [frames]
  );

  const progressPct = frames.length
    ? Math.round(
        (frames.filter(f => f.status === 'done').length / frames.length) * 100
      )
    : 0;

  const downloadGif = () => {
    if (!gifUrl) return;
    const a = document.createElement('a');
    a.href = gifUrl;
    a.download = `my-character-${Date.now()}.gif`;
    a.click();
  };

  // UI
  return (
    <div className='w-full h-[calc(100dvh-2rem)] mx-auto p-3 md:p-4'>
      {/* 3‑pane layout */}
      <div className='grid grid-cols-12 gap-4 h-full'>
        {/* Left Sidebar — Settings */}
        <aside className='col-span-12 md:col-span-3 xl:col-span-2 border rounded-xl p-3 md:p-4 bg-white/80 shadow-sm flex flex-col'>
          <div className='space-y-5'>
            <div className='space-y-3'>
              <div className='text-sm font-medium'>내 캐릭터 선택</div>
              {!uploadedImage ? (
                <div
                  className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                    dragActive
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-300'
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  <input
                    ref={imageInputRef}
                    type='file'
                    accept='image/*'
                    onChange={handleFileInput}
                    className='hidden'
                  />
                  <FileImage className='mx-auto h-10 w-10 text-gray-400 mb-3' />
                  <p className='text-xs mb-3 text-gray-600'>
                    이미지를 드래그하거나 클릭하여 업로드
                  </p>
                  <Button
                    onClick={() => imageInputRef.current?.click()}
                    variant='outline'
                    size='sm'
                  >
                    <Upload className='mr-2 h-4 w-4' /> 이미지 선택
                  </Button>
                </div>
              ) : (
                <div className='relative'>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={uploadedImage.dataUrl}
                    alt='Uploaded'
                    className='w-full rounded-lg border'
                  />
                  <Button
                    variant='destructive'
                    size='icon'
                    className='absolute top-2 right-2'
                    onClick={() => setUploadedImage(null)}
                  >
                    <X className='h-4 w-4' />
                  </Button>
                </div>
              )}
            </div>
            <div className='space-y-3'>
              <div className='text-sm font-medium'>템플릿 선택</div>
              <select
                className='w-full border rounded-md h-10 px-3 bg-white'
                value={templateId}
                onChange={e => {
                  handleReset();
                  setTemplateId(e.target.value);
                  setFrames(
                    initFramesFromTemplate(
                      TEMPLATES.find(t => t.id === e.target.value)
                    )
                  );
                }}
              >
                <option value='' disabled>
                  템플릿을 선택하세요
                </option>
                {TEMPLATES.map((t, i) => (
                  <option key={t.frames[i].id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
              {template && (
                <p className='text-xs text-gray-500'>{template.description}</p>
              )}
            </div>
          </div>

          <div className='mt-auto pt-3 flex flex-col gap-2'>
            {isGenerating && (
              <Button className='w-full' onClick={handleQueueStop}>
                실행 중지
              </Button>
            )}
            <Button
              className='w-full'
              disabled={!ready || isGenerating}
              onClick={startGeneration}
            >
              {isGenerating ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' /> 생성 중...
                </>
              ) : (
                <>
                  <PlayCircle className='mr-2 h-4 w-4' /> 만들기
                </>
              )}
            </Button>

            <div className='text-xs text-gray-500'>진행률: {progressPct}%</div>
            <div className='w-full h-2 rounded bg-neutral-200 overflow-hidden'>
              <div
                className='h-full bg-neutral-800 transition-all'
                style={{ width: `${progressPct}%` }}
              />
            </div>
            {errorMsg && (
              <div className='text-xs text-red-600 border border-red-200 bg-red-50 rounded p-2'>
                {errorMsg}
              </div>
            )}
          </div>
        </aside>

        {/* Center — Pipeline */}
        <main className='col-span-12 md:col-span-6 xl:col-span-8 rounded-xl p-3 md:p-5 bg-white/60 border overflow-y-auto'>
          <div className='flex items-center gap-2 mb-3'>
            <Images className='h-5 w-5' />
            <h3 className='font-semibold'>생성 파이프라인</h3>
            <Button onClick={() => console.log(uploadedImage)}>테스트</Button>
            <span className='text-xs text-gray-500'>
              ({frames.filter(f => f.status !== 'pending').length}/
              {frames.length})
            </span>
          </div>

          {frames.length === 0 && (
            <div className='text-sm text-gray-500'>
              왼쪽 사이드바에서 캐릭터/템플릿을 선택하고 <b>만들기</b>를 눌러
              시작하세요.
            </div>
          )}

          <div className='flex flex-col gap-6'>
            {frames.map((fr, i) => (
              <div key={fr.index} className='flex flex-col gap-6 items-stretch'>
                {/* Card */}
                <div className='rounded-xl border bg-white shadow-sm p-3 md:p-4'>
                  <div className='flex items-center justify-between mb-2'>
                    <div className='text-sm font-semibold'>{fr.label}</div>
                    <div className='flex items-center gap-2'>
                      <Button
                        size='sm'
                        variant='secondary'
                        disabled={fr.status === 'generating' || !uploadedImage}
                        onClick={() => regenerateFrame(fr.index)}
                      >
                        <Redo2 className='h-4 w-4 mr-1' /> 개별 생성
                      </Button>
                    </div>
                  </div>

                  <div className='flex gap-3'>
                    {/* Preview */}
                    <div className='aspect-square max-w-[256px] w-full rounded-md overflow-hidden border bg-neutral-100 flex items-center justify-center'>
                      {fr.status === 'done' && fr.image && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={fr.image.dataUrl}
                          alt={`frame-${fr.index + 1}`}
                          className='w-full h-full object-contain'
                        />
                      )}
                      {fr.status === 'generating' && (
                        <div className='flex items-center gap-2 text-neutral-500'>
                          <Loader2 className='h-4 w-4 animate-spin' /> 생성
                          중...
                        </div>
                      )}
                      {fr.status === 'pending' && (
                        <div className='text-neutral-400 text-xs'>대기 중…</div>
                      )}
                      {fr.status === 'error' && (
                        <div className='text-red-600 text-xs'>
                          {fr.error || '오류'}
                        </div>
                      )}
                    </div>

                    {/* Prompt editor */}
                    <div className='flex flex-1 flex-col gap-2'>
                      <div className='text-xs text-gray-600'>프롬프트</div>
                      <Textarea
                        disabled={isGenerating}
                        value={fr.prompt}
                        onChange={e => updatePrompt(fr.index, e.target.value)}
                        className='min-h-[120px]'
                      />
                      <div className='text-[11px] text-gray-500'>
                        이 프롬프트를 수정하고 ‘개별 생성’을 누르면 해당
                        프레임만 재생성됩니다.
                      </div>
                    </div>
                  </div>
                </div>

                {i < frames.length - 1 && (
                  <div className='flex items-center justify-center my-2'>
                    <div className='h-6 w-px bg-neutral-300' />
                    <ChevronDown className='mx-2 text-neutral-400' />
                    <div className='h-6 w-px bg-neutral-300' />
                  </div>
                )}
              </div>
            ))}
          </div>
        </main>

        <aside className='col-span-12 md:col-span-3 xl:col-span-2 border rounded-xl p-3 md:p-4 bg-white/80 shadow-sm flex flex-col'>
          <div className='flex items-center gap-2 mb-2'>
            <Film className='h-5 w-5' />
            <div className='font-semibold'>갤러리 & GIF</div>
          </div>

          <div className='grid grid-cols-2 gap-2 mb-3 overflow-y-auto max-h-[40vh]'>
            {gallery.length === 0 && (
              <div className='col-span-2 text-xs text-gray-500'>
                아직 생성된 이미지가 없습니다.
              </div>
            )}
            {gallery.map(g => (
              <div
                key={g.index}
                className='relative rounded-md overflow-hidden border bg-neutral-50'
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={g.dataUrl}
                  alt={`thumb-${g.index + 1}`}
                  className='w-full h-full object-cover'
                />
                <div className='absolute bottom-0 right-0 text-[10px] bg-black/60 text-white px-1.5 py-0.5 rounded-tl'>
                  F{g.index + 1}
                </div>
              </div>
            ))}
          </div>

          {gifUrl && (
            <div className='rounded-md overflow-hidden border mb-2'>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={gifUrl}
                alt='gif-preview'
                className='w-full h-auto bg-transparent'
              />
            </div>
          )}
          <div className='space-y-2 mt-auto'>
            <Button
              className='w-full'
              disabled={!canCombine || isCombining}
              onClick={handleMakeGif}
            >
              {isCombining ? (
                <>
                  <Loader2 className='h-4 w-4 mr-2 animate-spin' />
                  GIF 만드는 중...
                </>
              ) : (
                <>GIF 만들기</>
              )}
            </Button>

            <Button
              className='w-full'
              variant='outline'
              disabled={!gifUrl}
              onClick={downloadGif}
            >
              <Download className='h-4 w-4 mr-1' /> 다운로드
            </Button>
            {!canCombine && (
              <div className='text-[11px] text-gray-500'>
                모든 프레임이 완료되면 활성화됩니다.
              </div>
            )}
          </div>
        </aside>
      </div>

      {isGenerating && (
        <div className='fixed top-3 left-1/2 -translate-x-1/2 z-50 rounded-full bg-white/90 border px-3 py-1 shadow-sm flex items-center gap-2 text-sm'>
          <Loader2 className='h-4 w-4 animate-spin' /> 생성 중… (
          {frames.filter(f => f.status === 'done').length}/{frames.length})
        </div>
      )}

      {errorMsg && (
        <div className='fixed bottom-3 left-1/2 -translate-x-1/2 z-50 max-w-md w-[90vw] bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-md text-sm shadow-sm'>
          {errorMsg}
        </div>
      )}
    </div>
  );
};

export default GifStudio;
