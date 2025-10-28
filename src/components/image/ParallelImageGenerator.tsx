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
  Plus,
  Minus,
} from 'lucide-react';
import { notify } from '@/lib/maker/utils';
import { reportUsage } from '@/lib/shared/usage';

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
  promptIndex: number;
}

interface PromptItem {
  id: number;
  prompt: string;
  isGenerating: boolean;
}

const ratioArr = [
  '1:1',
  '2:3',
  '3:2',
  '3:4',
  '4:3',
  '4:5',
  '5:4',
  '9:16',
  '16:9',
  '21:9',
];

export const ParallelImageGenerator = () => {
  const [assets, setAssets] = useState<ImageAsset[]>([]);
  const [prompts, setPrompts] = useState<PromptItem[]>([
    { id: 1, prompt: '', isGenerating: false },
  ]);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedRatio, setSelectedRatio] = useState(ratioArr[0]);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);

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

  const addPrompt = () => {
    const maxId = Math.max(...prompts.map(p => p.id), 0);
    setPrompts(prev => [
      ...prev,
      { id: maxId + 1, prompt: '', isGenerating: false },
    ]);
  };

  const removePrompt = (id: number) => {
    if (prompts.length > 1) {
      setPrompts(prev => prev.filter(p => p.id !== id));
    }
  };

  const updatePrompt = (id: number, prompt: string) => {
    setPrompts(prev => prev.map(p => (p.id === id ? { ...p, prompt } : p)));
  };

  const setPromptGenerating = (id: number, isGenerating: boolean) => {
    setPrompts(prev =>
      prev.map(p => (p.id === id ? { ...p, isGenerating } : p))
    );
  };

  const buildPayload = (prompt: string) => {
    const payload: any = {
      prompt,
      ratio: selectedRatio,
      resolution: 480,
    };

    if (primary) {
      payload.imageBase64 = primary.base64;
      payload.imageMimeType = primary.mimeType;
      payload.additions = additions.map(a => ({
        caption: a.caption || '',
        inlineData: { mimeType: a.mimeType, data: a.base64 },
      }));
    }

    return payload;
  };

  const generateSinglePrompt = async (promptItem: PromptItem) => {
    let tokenUsage;
    try {
      if (!promptItem.prompt.trim()) {
        notify('프롬프트를 입력하세요.');
        return;
      }

      setPromptGenerating(promptItem.id, true);
      setError(null);

      const payload = buildPayload(promptItem.prompt);

      const res = await fetch('/api/image-gen/textToimg', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('이미지 생성 실패');

      const data = await res.json();
      tokenUsage = data.tokenUsage;

      if (!data.success) {
        notify('이미지 생성에 실패하셨습니다. 프롬프트를 더 다듬어주세요.');
        return;
      }

      if (data.generatedImage) {
        const imageDataUrl = `data:image/png;base64,${data.generatedImage}`;
        setGeneratedImages(prev => [
          ...prev,
          {
            dataUrl: imageDataUrl,
            timestamp: new Date(),
            promptIndex: promptItem.id,
          },
        ]);

        if (data.historyId) {
          console.log('✅ Image saved to history:', data.historyId);
        }
      }
    } catch (err: any) {
      notify(err?.message || '알 수 없는 오류');
    } finally {
      setPromptGenerating(promptItem.id, false);
      if (tokenUsage) {
        await reportUsage('imageGemini', tokenUsage, 1);
      }
    }
  };

  const generateAll = async () => {
    const validPrompts = prompts.filter(
      p => p.prompt.trim() && !p.isGenerating
    );
    if (validPrompts.length === 0) {
      notify('생성할 프롬프트가 없습니다.');
      return;
    }

    notify(`${validPrompts.length}개의 이미지를 생성합니다...`);

    // 병렬 실행
    await Promise.all(validPrompts.map(p => generateSinglePrompt(p)));

    notify('모든 이미지 생성이 완료되었습니다!');
  };

  const downloadImage = (dataUrl: string, index: number) => {
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `parallel-generated-${index + 1}.png`;
    a.click();
  };

  const resetAll = () => {
    setAssets([]);
    setPrompts([{ id: 1, prompt: '', isGenerating: false }]);
    setGeneratedImages([]);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const anyGenerating = prompts.some(p => p.isGenerating);

  return (
    <div className='w-full max-w-7xl mx-auto px-6 py-8 space-y-6'>
      <div className='flex items-center justify-between'>
        <h1 className='text-2xl font-bold'>병렬 이미지 생성</h1>
        <Button variant='outline' size='sm' onClick={resetAll}>
          <X className='mr-2 h-4 w-4' /> 전체 초기화
        </Button>
      </div>

      <div className='grid lg:grid-cols-2 gap-6'>
        {/* Left: Reference Images Section */}
        <div className='space-y-4'>
          <div className='flex items-center justify-between'>
            <h3 className='text-lg font-semibold'>
              참조 이미지 (선택, 모든 프롬프트에 공통 적용)
            </h3>
          </div>

          <div
            className='relative border-2 border-dashed rounded-lg p-8 text-center transition-colors border-gray-300 dark:border-gray-600'
            onDragOver={e => e.preventDefault()}
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

          {assets.length > 0 && (
            <div className='grid grid-cols-2 gap-3'>
              {assets.map(a => (
                <div
                  key={a.id}
                  className='rounded-lg border p-3 space-y-2 relative'
                >
                  <img
                    src={a.dataUrl}
                    alt={a.name}
                    className='w-full rounded'
                  />

                  <div className='flex items-center justify-between'>
                    <Button
                      type='button'
                      variant={a.isPrimary ? 'default' : 'secondary'}
                      size='sm'
                      onClick={() => setPrimaryAsset(a.id)}
                    >
                      <Star className='h-4 w-4 mr-1' /> Primary
                    </Button>

                    <Button
                      type='button'
                      variant='destructive'
                      size='sm'
                      onClick={() => removeAsset(a.id)}
                    >
                      <X className='h-4 w-4' />
                    </Button>
                  </div>

                  <Input
                    placeholder='이미지 설명(선택)'
                    value={a.caption || ''}
                    onChange={e => setCaption(a.id, e.target.value)}
                  />
                </div>
              ))}
            </div>
          )}

          <div className='space-y-2'>
            <h3 className='text-lg font-semibold'>비율 설정 (공통)</h3>
            <select
              value={selectedRatio}
              onChange={e => setSelectedRatio(e.target.value)}
              className='w-full p-2 border rounded-md'
              disabled={anyGenerating}
            >
              {ratioArr.map(ratio => (
                <option key={ratio} value={ratio}>
                  {ratio}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Right: Prompts Section */}
        <div className='space-y-4'>
          <div className='flex items-center justify-between'>
            <h3 className='text-lg font-semibold'>생성 프롬프트</h3>
            <div className='flex gap-2'>
              <Button
                onClick={addPrompt}
                size='sm'
                variant='outline'
                disabled={anyGenerating}
              >
                <Plus className='w-4 h-4 mr-1' />
                프롬프트 추가
              </Button>
              <Button
                onClick={generateAll}
                size='sm'
                disabled={anyGenerating || prompts.every(p => !p.prompt.trim())}
              >
                <Sparkles className='w-4 h-4 mr-1' />
                전체 생성
              </Button>
            </div>
          </div>

          <div className='space-y-3 max-h-[600px] overflow-y-auto pr-2'>
            {prompts.map((promptItem, index) => (
              <div
                key={promptItem.id}
                className='border rounded-lg p-4 space-y-2 relative'
              >
                <div className='flex items-center justify-between mb-2'>
                  <span className='text-sm font-medium text-gray-500'>
                    프롬프트 #{index + 1}
                  </span>
                  {prompts.length > 1 && (
                    <Button
                      onClick={() => removePrompt(promptItem.id)}
                      size='sm'
                      variant='ghost'
                      disabled={anyGenerating}
                    >
                      <Minus className='w-4 h-4' />
                    </Button>
                  )}
                </div>

                <Textarea
                  placeholder='예: Reference 스타일을 유지하고, 스프라이트 시트 지침에 따라 장면을 생성'
                  value={promptItem.prompt}
                  onChange={e => updatePrompt(promptItem.id, e.target.value)}
                  className='min-h-[100px]'
                  disabled={promptItem.isGenerating}
                />

                <Button
                  className='w-full'
                  onClick={() => generateSinglePrompt(promptItem)}
                  disabled={
                    promptItem.isGenerating || !promptItem.prompt.trim()
                  }
                  size='sm'
                >
                  {promptItem.isGenerating ? (
                    <>
                      <Loader2 className='mr-2 h-4 w-4 animate-spin' /> 생성
                      중...
                    </>
                  ) : (
                    <>
                      <Sparkles className='mr-2 h-4 w-4' /> 이 프롬프트만 생성
                    </>
                  )}
                </Button>
              </div>
            ))}
          </div>

          {error && (
            <div className='bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm'>
              {error}
            </div>
          )}
        </div>
      </div>

      {/* Results Section */}
      {generatedImages.length > 0 && (
        <div className='space-y-4 mt-8'>
          <h3 className='text-lg font-semibold'>
            생성된 이미지 ({generatedImages.length})
          </h3>

          <div className='grid md:grid-cols-3 lg:grid-cols-4 gap-4'>
            {generatedImages
              .map((img, idx) => (
                <div key={idx} className='relative group'>
                  <img
                    src={img.dataUrl}
                    alt={`Generated ${idx + 1}`}
                    className='w-full rounded-lg border'
                  />
                  <div className='absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded'>
                    프롬프트 #{img.promptIndex}
                  </div>
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
              ))
              .reverse()}
          </div>
        </div>
      )}
    </div>
  );
};
