'use client';

import { useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import {
  Upload,
  Loader2,
  Download,
  X,
  FileImage,
  Sparkles,
  Star,
} from 'lucide-react';
import { notify } from '@/lib/maker/utils';

interface ImageAsset {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  dataUrl: string;
  base64: string;
  caption?: string;
  isPrimary?: boolean;
}

interface GeneratedImage {
  dataUrl: string;
  timestamp: Date;
}

export function GeminiImageWithUpload() {
  const [assets, setAssets] = useState<ImageAsset[]>([]);
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const primary = useMemo(
    () => assets.find(a => a.isPrimary) || assets[0],
    [assets]
  );
  const additions = useMemo(
    () => assets.filter(a => primary && a.id !== primary.id),
    [assets, primary]
  );

  const fileToBase64 = (
    file: File
  ): Promise<{ base64: string; dataUrl: string }> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        const base64 = dataUrl.split(',')[1] || '';
        resolve({ base64, dataUrl });
      };
      reader.onerror = () => reject(new Error('파일을 읽을 수 없습니다.'));
      reader.readAsDataURL(file);
    });
  };

  const addFiles = async (files: FileList | File[]) => {
    const list = Array.from(files).filter(f => f.type.startsWith('image/'));
    if (list.length === 0) {
      setError('이미지 파일만 업로드 가능합니다.');
      return;
    }
    setError(null);

    const results = await Promise.all(
      list.map(async file => {
        const { base64, dataUrl } = await fileToBase64(file);
        return {
          id: crypto.randomUUID(),
          name: file.name,
          mimeType: file.type,
          size: file.size,
          dataUrl,
          base64,
          caption: '',
          isPrimary: false,
        } as ImageAsset;
      })
    );

    setAssets(prev => {
      const next = [...prev, ...results];
      if (!next.some(a => a.isPrimary) && next.length > 0) {
        next[0].isPrimary = true;
      }
      return [...next];
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFiles(e.dataTransfer.files);
    }
  };

  const handleClickUpload = () => fileInputRef.current?.click();

  const removeAsset = (id: string) => {
    setAssets(prev => {
      const next = prev.filter(a => a.id !== id);
      if (!next.some(a => a.isPrimary) && next.length > 0) {
        next[0].isPrimary = true;
      }
      return next;
    });
  };

  const setPrimaryAsset = (id: string) => {
    setAssets(prev => prev.map(a => ({ ...a, isPrimary: a.id === id })));
  };

  const setCaption = (id: string, caption: string) => {
    setAssets(prev => prev.map(a => (a.id === id ? { ...a, caption } : a)));
  };

  const resetAll = () => {
    setAssets([]);
    setPrompt('');
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const buildPayload = () => {
    if (!primary) throw new Error('최소 1장의 참조 이미지가 필요합니다.');
    const payload = {
      prompt,
      ratio: '16:9',
      resolution: 720,
      imageBase64: primary.base64,
      imageMimeType: primary.mimeType,
      additions: additions.map(a => ({
        caption: a.caption || '',
        inlineData: { mimeType: a.mimeType, data: a.base64 },
      })),
    };
    return payload;
  };

  const generateWithGemini = async () => {
    try {
      if (!prompt.trim()) {
        setError('프롬프트를 입력하세요.');
        return;
      }
      if (!primary) {
        setError('최소 1장의 참조 이미지가 필요합니다.');
        return;
      }
      setIsGenerating(true);
      setError(null);

      const payload = buildPayload();

      const res = await fetch('/api/image-gen/gemini/scene-1', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('이미지 생성 실패');

      const data = await res.json();

      console.log(data);

      if (!data.success) {
        notify('이미지 생성에 실패하셨습니다. 프롬프트를 더 다듬어주세요.');
        return;
      }

      if (data.generatedImage) {
        setGeneratedImages(prev => [
          ...prev,
          {
            dataUrl: `data:image/png;base64,${data.generatedImage}`,
            timestamp: new Date(),
          },
        ]);
      }
    } catch (err: any) {
      setError(err?.message || '알 수 없는 오류');
    } finally {
      setIsGenerating(false);
    }
  };

  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);

  const downloadImage = (dataUrl: string, index: number) => {
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `gemini-generated-${index + 1}.png`;
    a.click();
  };

  return (
    <div className='w-full max-w-6xl mx-auto p-6 space-y-6'>
      <div className='grid md:grid-cols-2 gap-6'>
        {/* Left: drop zone + list */}
        <div className='space-y-4'>
          <h3 className='text-lg font-semibold'>
            1. 참조 이미지 업로드 (여러 장 가능)
          </h3>
          <div
            className='relative border-2 border-dashed rounded-lg p-8 text-center transition-colors border-gray-300 dark:border-gray-600'
            onDragOver={e => {
              e.preventDefault();
            }}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type='file'
              accept='image/*'
              multiple
              className='hidden'
              onChange={e => e.target.files && addFiles(e.target.files)}
            />

            <FileImage className='mx-auto h-12 w-12 text-gray-400 mb-4' />
            <p className='text-sm mb-4'>
              이미지를 드래그하거나 클릭하여 여러 장 업로드
            </p>
            <Button variant='outline' onClick={handleClickUpload}>
              <Upload className='mr-2 h-4 w-4' /> 이미지 선택
            </Button>
          </div>
        </div>

        {/* Right: prompt + generate */}
        <div className='space-y-4'>
          <h3 className='text-lg font-semibold'>2. 생성 프롬프트 입력</h3>
          <Textarea
            placeholder='예: Reference 스타일을 유지하고, 스프라이트 시트 지침에 따라 장면을 생성'
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            className='min-h-[180px]'
          />

          <Button
            className='w-full'
            onClick={generateWithGemini}
            disabled={isGenerating || assets.length === 0 || !prompt.trim()}
          >
            {isGenerating ? (
              <>
                <Loader2 className='mr-2 h-4 w-4 animate-spin' /> 생성 중...
              </>
            ) : (
              <>
                <Sparkles className='mr-2 h-4 w-4' /> Gemini로 이미지 생성
              </>
            )}
          </Button>

          {error && (
            <div className='bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm'>
              {error}
            </div>
          )}
        </div>
      </div>

      {assets.length > 0 && (
        <div className='space-y-3'>
          <div className='grid sm:grid-cols-2 lg:grid-cols-3 gap-4'>
            {assets.map(a => (
              <div
                key={a.id}
                className='rounded-lg border p-3 space-y-2 relative'
              >
                <img src={a.dataUrl} alt={a.name} className='w-full rounded' />

                <div className='flex items-center justify-between'>
                  <Button
                    type='button'
                    variant={a.isPrimary ? 'default' : 'secondary'}
                    size='sm'
                    onClick={() => setPrimaryAsset(a.id)}
                    title='이 이미지를 기본(Primary)로 지정'
                  >
                    <Star className='h-4 w-4 mr-1' /> Primary
                  </Button>

                  <Button
                    type='button'
                    variant='destructive'
                    size='sm'
                    onClick={() => removeAsset(a.id)}
                    title='이미지 제거'
                  >
                    <X className='h-4 w-4' />
                  </Button>
                </div>

                <Input
                  placeholder='이 이미지 설명(선택)'
                  value={a.caption || ''}
                  onChange={e => setCaption(a.id, e.target.value)}
                />

                <div className='text-xs text-gray-500 truncate'>{a.name}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 결과 */}
      {generatedImages.length > 0 && (
        <div className='space-y-4'>
          <div className='flex justify-between items-center'>
            <h3 className='text-lg font-semibold'>
              생성된 이미지 ({generatedImages.length})
            </h3>
            <Button variant='outline' size='sm' onClick={resetAll}>
              <X className='mr-2 h-4 w-4' /> 전체 초기화
            </Button>
          </div>

          <div className='grid md:grid-cols-2 lg:grid-cols-3 gap-4'>
            {generatedImages.map((img, idx) => (
              <div key={idx} className='relative group'>
                <img
                  src={img.dataUrl}
                  alt={`Generated ${idx + 1}`}
                  className='w-full rounded-lg border'
                />
                <div className='absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center'>
                  <Button
                    variant='secondary'
                    size='sm'
                    onClick={() => downloadImage(img.dataUrl, idx)}
                  >
                    <Download className='mr-2 h-4 w-4' /> 다운로드
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
