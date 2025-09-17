/* eslint-disable @next/next/no-img-element */
'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Upload, Loader2, X, FileImage, Sparkles } from 'lucide-react';
import { KlingImageToVideoStatusResponse } from '@/app/api/kling/[id]/route';
import {
  SeeDanceImageToVideoResponse,
  TaskResponse,
} from '@/app/api/seedance/clip-gen/[id]/route';
import { KlingImageToVideoResponse } from '@/app/api/kling/clip-gen/[id]/route';

interface UploadedImage {
  name: string;
  base64: string;
  dataUrl: string;
  mimeType: string;
}

interface CalledVideoInfo {
  aiType: string;
  id: string;
  url: string;
}

type Ratio = '16:9' | '4:3' | '1:1' | '3:4' | '9:16';

export function GenerateVideoWithUpload() {
  const [uploadedFirstFrame, setUploadedFirstFrame] =
    useState<UploadedImage | null>(null);
  const [uploadedLastFrame, setUploadedLastFrame] =
    useState<UploadedImage | null>(null);
  const [aiType, setAiType] = useState<'SEE_DANCE'>('SEE_DANCE');
  const [generatedClips, setGeneratedClips] = useState<CalledVideoInfo[]>([]);
  const [clipId, setClipId] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [cfgValue, setCfgValue] = useState<number>(0);
  const [duration, setDuration] = useState<'5' | '10'>('5');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const firstFrameInputRef = useRef<HTMLInputElement>(null);
  const lastFrameInputRef = useRef<HTMLInputElement>(null);
  const [liteModel, setLiteModel] = useState(false);
  const [ratio, setRatio] = useState<Ratio>('16:9');

  // 파일을 Base64로 변환
  const fileToBase64 = (file: File): Promise<UploadedImage> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => {
        const dataUrl = reader.result as string;
        const base64 = dataUrl.split(',')[1];

        resolve({
          name: file.name,
          base64,
          dataUrl,
          mimeType: file.type,
        });
      };

      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // 파일 처리
  const processFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('이미지 파일만 업로드 가능합니다.');
      return;
    }

    try {
      const convertedImage = await fileToBase64(file);
      setUploadedFirstFrame(convertedImage);
      setError(null);
    } catch (err) {
      setError('이미지 변환 실패');
    }
  };

  const processLastFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('이미지 파일만 업로드 가능합니다.');
      return;
    }

    try {
      const convertedImage = await fileToBase64(file);
      setUploadedLastFrame(convertedImage);
      setError(null);
    } catch (err) {
      setError('이미지 변환 실패');
    }
  };

  // 드래그 앤 드롭 핸들러
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleLastDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processLastFile(e.dataTransfer.files[0]);
    }
  };

  // 파일 선택 핸들러
  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleLastFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processLastFile(e.target.files[0]);
    }
  };

  const handleGenerateVideo = () => {
    generateWithSeedance();
  };

  // const generateWithKling = async () => {
  //   if (!uploadedFirstFrame || !prompt.trim()) {
  //     setError('이미지와 프롬프트를 모두 입력해주세요.');
  //     return;
  //   }

  //   setIsGenerating(true);
  //   setError(null);

  //   try {
  //     const response = await fetch('/api/kling', {
  //       method: 'POST',
  //       headers: {
  //         'Content-Type': 'application/json',
  //       },
  //       body: JSON.stringify({
  //         duration: duration,
  //         image_base64: uploadedFirstFrame.base64,
  //         prompt: prompt,
  //         negative_prompt: negativePrompt,
  //         cfg_scale: cfgValue,
  //       }),
  //     });

  //     if (!response.ok) {
  //       console.log('에러남');
  //       throw new Error('이미지 생성 실패');
  //     }

  //     const data = (await response.json()) as KlingImageToVideoResponse;

  //     console.log(data);

  //     setClipId(data.data.task_id);
  //   } catch (err) {
  //     setError(err instanceof Error ? err.message : '알 수 없는 오류');
  //   } finally {
  //     setIsGenerating(false);
  //   }
  // };

  const generateWithSeedance = async () => {
    if (!uploadedFirstFrame || !prompt.trim()) {
      setError('이미지와 프롬프트를 모두 입력해주세요.');
      return;
    }

    setIsGenerating(true);
    setError(null);

    const body = !!uploadedLastFrame
      ? {
          prompt: prompt,
          baseImage: uploadedFirstFrame?.dataUrl,
          lastImage: uploadedLastFrame?.dataUrl,
          resolution: 720,
          ratio: ratio,
          liteModel: liteModel,
        }
      : {
          prompt: prompt,
          baseImage: uploadedFirstFrame?.dataUrl,
          resolution: 720,
          ratio: ratio,
          liteModel: liteModel,
        };

    try {
      const response = await fetch('/api/seedance/clip-gen/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        console.log('에러남');
        throw new Error('이미지 생성 실패');
      }

      const data = (await response.json()) as SeeDanceImageToVideoResponse;

      console.log(data);

      setClipId(data.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGetVideo = (id: string) => {
    if (aiType === 'SEE_DANCE') {
      getWithSeedance(id);
    }
  };

  // const getWithKling = async (id: string) => {
  //   {
  //     const response = await fetch(`/api/kling/${id}`, {
  //       method: 'GET',
  //       cache: 'no-store',
  //     });

  //     if (!response.ok) {
  //       throw new Error(`Status ${response.status}`);
  //     }

  //     const jsonData =
  //       (await response.json()) as KlingImageToVideoStatusResponse;

  //     const videoUrl = jsonData.data.task_result?.videos[0].url;

  //     if (videoUrl === undefined || jsonData.message !== 'SUCCEED') {
  //       return;
  //     }

  //     setGeneratedClips(prev => {
  //       const next = [
  //         ...prev,
  //         {
  //           aiType: 'KLING',
  //           id: jsonData.data.task_id,
  //           url: videoUrl,
  //         },
  //       ];
  //       console.log(next);
  //       console.log(jsonData);
  //       return next;
  //     });
  //   }
  // };

  const getWithSeedance = async (id: string) => {
    {
      const response = await fetch(`/api/seedance/${id}`, {
        method: 'GET',
        cache: 'no-store',
      });

      if (!response.ok) {
        throw new Error(`Status ${response.status}`);
      }

      const jsonData = (await response.json()) as TaskResponse;

      const videoUrl = jsonData.content.video_url ?? [];
      if (videoUrl === undefined || jsonData.status !== 'succeeded') return;

      setGeneratedClips(prev => {
        const next = [
          ...prev,
          {
            aiType: 'KLING',
            id: jsonData.id,
            url: videoUrl,
          },
        ];
        console.log(next);
        console.log(jsonData);
        return next;
      });
    }
  };

  // const getUrlId = async () => {
  //   const response = await fetch(`/api/kling`, {
  //     method: 'GET',
  //     cache: 'no-store',
  //   });

  //   const data = await response.json();

  //   console.log(data);
  // };

  // 이미지 다운로드
  // const downloadImage = (dataUrl: string, index: number) => {
  //   const link = document.createElement('a');
  //   link.href = dataUrl;
  //   link.download = `kling-generated-${index + 1}.mp3`;
  //   link.click();
  // };

  // 초기화
  // const reset = () => {
  //   setUploadedFirstFrame(null);
  //   setGeneratedClips([]);
  //   setPrompt('');
  //   setError(null);
  //   if (firstFrameInputRef.current) {
  //     firstFrameInputRef.current.value = '';
  //   }
  //   if (lastFrameInputRef.current) {
  //     lastFrameInputRef.current.value = '';
  //   }
  // };

  return (
    <div className='w-full max-w-6xl mx-auto p-6 space-y-6'>
      <div className='grid md:grid-cols-3 gap-6'>
        {/* start frame 섹션 */}
        <div className='space-y-4'>
          <h3 className='text-lg font-semibold'>1. 스타트 프레임 업로드</h3>

          {!uploadedFirstFrame ? (
            <div
              className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragActive
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-300 dark:border-gray-600'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input
                ref={firstFrameInputRef}
                type='file'
                accept='image/*'
                onChange={handleFileInput}
                className='hidden'
              />

              <FileImage className='mx-auto h-12 w-12 text-gray-400 mb-4' />

              <p className='text-sm mb-4'>
                이미지를 드래그하거나 클릭하여 업로드
              </p>

              <Button
                onClick={() => firstFrameInputRef.current?.click()}
                variant='outline'
              >
                <Upload className='mr-2 h-4 w-4' />
                이미지 선택
              </Button>
            </div>
          ) : (
            <div className='space-y-3'>
              <div className='relative'>
                <img
                  src={uploadedFirstFrame.dataUrl}
                  alt='Uploaded'
                  className='w-full rounded-lg border'
                />
                <Button
                  variant='destructive'
                  size='sm'
                  className='absolute top-2 right-2'
                  onClick={() => setUploadedFirstFrame(null)}
                >
                  <X className='h-4 w-4' />
                </Button>
              </div>
              <p className='text-sm text-gray-500'>
                파일명: {uploadedFirstFrame.name}
              </p>
            </div>
          )}
        </div>

        {/* end frame 섹션 */}
        <div className='space-y-4'>
          <h3 className='text-lg font-semibold'>1-2. 엔드 프레임 업로드</h3>

          {!uploadedLastFrame ? (
            <div
              className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragActive
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-300 dark:border-gray-600'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleLastDrop}
            >
              <input
                ref={lastFrameInputRef}
                type='file'
                accept='image/*'
                onChange={handleLastFileInput}
                className='hidden'
              />

              <FileImage className='mx-auto h-12 w-12 text-gray-400 mb-4' />

              <p className='text-sm mb-4'>
                이미지를 드래그하거나 클릭하여 업로드
              </p>

              <Button
                onClick={() => lastFrameInputRef.current?.click()}
                variant='outline'
              >
                <Upload className='mr-2 h-4 w-4' />
                이미지 선택
              </Button>
            </div>
          ) : (
            <div className='space-y-3'>
              <div className='relative'>
                <img
                  src={uploadedLastFrame.dataUrl}
                  alt='Uploaded'
                  className='w-full rounded-lg border'
                />
                <Button
                  variant='destructive'
                  size='sm'
                  className='absolute top-2 right-2'
                  onClick={() => setUploadedLastFrame(null)}
                >
                  <X className='h-4 w-4' />
                </Button>
              </div>
              <p className='text-sm text-gray-500'>
                파일명: {uploadedLastFrame.name}
              </p>
            </div>
          )}
        </div>

        <div className='flex justify-center gap-6 items-center'>
          {/* <div className="w-fit flex flex-col text-center">
            <p>영상 역동성 : {cfgValue}</p>
            <input
              type="range"
              value={cfgValue}
              onChange={(e) => setCfgValue(Number(e.target.value))}
              min={0}
              step={0.1}
              max={1}
            />
          </div> */}
          <div>
            <p>영상 길이</p>
            <div className='flex gap-2'>
              <input
                type='radio'
                value='5'
                id='duration-5'
                checked={duration === '5'}
                onChange={() => setDuration('5')}
                name='duration'
              />
              <label htmlFor='duration-5'>5s</label>
            </div>
            <div className='flex gap-2'>
              <input
                type='radio'
                value='10'
                id='duration-10'
                checked={duration === '10'}
                onChange={() => setDuration('10')}
                name='duration'
              />
              <label htmlFor='duration-10'>10s</label>
            </div>
            <p>생성 AI 종류</p>
            <div className='flex gap-2'>
              <input
                type='radio'
                value='SEE_DANCE'
                id='aiType-SEE_DANCE'
                checked={aiType === 'SEE_DANCE'}
                onChange={() => setAiType('SEE_DANCE')}
                name='aiType'
              />
              <label htmlFor='aiType-SEE_DANCE'>SeeDance 사용하기</label>
            </div>
            <div className='flex gap-2 select-none'>
              <input
                type='checkbox'
                id='force-lite-model'
                checked={liteModel}
                onChange={() => setLiteModel(prev => !prev)}
                name='aiType'
              />
              <label htmlFor='force-lite-model'>강제 lite model 사용하기</label>
            </div>
          </div>
          <select
            value={ratio}
            onChange={e => setRatio(e.target.value as Ratio)}
          >
            <option key='16:9' value='16:9'>
              16:9
            </option>
            <option key='4:3' value='4:3'>
              4:3
            </option>
            <option key='1:1' value='1:1'>
              1:1
            </option>
            <option key='3:4' value='3:4'>
              3:4
            </option>
            <option key='9:16' value='9:16'>
              9:16
            </option>
          </select>
        </div>

        {/* 프롬프트 섹션 */}
        <div className='space-y-4 col-span-3'>
          <h3 className='text-lg font-semibold'>2. 생성 프롬프트 입력</h3>

          <Textarea
            placeholder='예: Create a picture of my cat eating a nano-banana in a fancy restaurant under the Gemini constellation'
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            className='min-h-[150px]'
          />

          {error && (
            <div className='bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm'>
              {error}
            </div>
          )}

          <Button
            onClick={handleGenerateVideo}
            disabled={!uploadedFirstFrame || !prompt.trim() || isGenerating}
            className='w-full'
          >
            {isGenerating ? (
              <>
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                생성 중...
              </>
            ) : (
              <>
                <Sparkles className='mr-2 h-4 w-4' />
                {`${aiType} 생성 ${
                  liteModel ? '/ 강제 lite model 활성화' : ''
                }`}
              </>
            )}
          </Button>
          <Button className='w-full' onClick={() => handleGetVideo(clipId!)}>
            영상 읽어오기
          </Button>
        </div>
      </div>
      {generatedClips.length !== 0 && (
        <div className='grid grid-cols-3 gap-4'>
          {generatedClips
            .map((clip, index) => {
              return (
                <div className='text-center' key={clip.id + index}>
                  <video
                    src={clip.url}
                    controls
                    preload='metadata'
                    playsInline
                  ></video>
                </div>
              );
            })
            .reverse()}
        </div>
      )}
    </div>
  );
}
