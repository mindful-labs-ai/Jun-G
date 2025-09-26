'use client';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Upload, FileImage, Sparkles } from 'lucide-react';
export const BlurredGenerateImageWithGemini = () => {
  return (
    <div className='w-full max-w-6xl mx-auto px-6 py-18 space-y-6 blur-xs'>
      <div className='grid md:grid-cols-2 gap-6'>
        {/* Left: drop zone + list */}
        <div className='space-y-4'>
          <h3 className='text-lg font-semibold'>
            1. 참조 이미지 업로드 (여러 장 가능)
          </h3>
          <div className='relative border-2 border-dashed rounded-lg p-8 text-center transition-colors border-gray-300 dark:border-gray-600'>
            <input type='file' accept='image/*' multiple className='hidden' />

            <FileImage className='mx-auto h-12 w-12 text-gray-400 mb-4' />
            <p className='text-sm mb-4'>
              이미지를 드래그하거나 클릭하여 여러 장 업로드
            </p>
            <Button variant='outline'>
              <Upload className='mr-2 h-4 w-4' /> 이미지 선택
            </Button>
          </div>
        </div>

        <div className='space-y-4'>
          <h3 className='text-lg font-semibold'>2. 생성 프롬프트 입력</h3>
          <Textarea
            placeholder='예: Reference 스타일을 유지하고, 스프라이트 시트 지침에 따라 장면을 생성'
            className='min-h-[180px]'
          />

          <Button className='w-full'>
            <>
              <Sparkles className='mr-2 h-4 w-4' /> Gemini로 이미지 생성
            </>
          </Button>
        </div>
      </div>
    </div>
  );
};
