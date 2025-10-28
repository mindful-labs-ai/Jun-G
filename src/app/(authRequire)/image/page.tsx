'use client';

import { BlurredGenerateImageWithGemini } from '@/components/image/BlurredGenerateImageWithGemini';
import { GenerateImageWithGemini } from '@/components/image/GenerateImageWithGemini';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/lib/shared/useAuthStore';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';
import { Plus, Minus } from 'lucide-react';

const GeminiPage = () => {
  const userId = useAuthStore(s => s.userId);
  const router = useRouter();
  const [instances, setInstances] = useState<number[]>([1]);

  const addInstance = () => {
    setInstances(prev => [...prev, Math.max(...prev, 0) + 1]);
  };

  const removeInstance = (id: number) => {
    if (instances.length > 1) {
      setInstances(prev => prev.filter(instanceId => instanceId !== id));
    }
  };

  return (
    <>
      {userId ? (
        <div className='flex flex-col gap-4 p-4'>
          <div className='flex justify-center items-center gap-2 sticky top-0 bg-background z-10 py-2'>
            <Button
              onClick={addInstance}
              size='sm'
              className='flex items-center gap-1'
            >
              <Plus className='w-4 h-4' />
              이미지 생성 추가
            </Button>
            <span className='text-sm text-muted-foreground'>
              {instances.length}개 실행 중
            </span>
          </div>
          <div className='grid grid-cols-1 gap-4'>
            {instances.map(id => (
              <div key={id} className='relative border rounded-lg p-4'>
                {instances.length > 1 && (
                  <Button
                    onClick={() => removeInstance(id)}
                    size='sm'
                    variant='destructive'
                    className='absolute top-2 right-2 z-10 flex items-center gap-1'
                  >
                    <Minus className='w-4 h-4' />
                    제거
                  </Button>
                )}
                <GenerateImageWithGemini />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className='relative'>
          <div className='fixed w-dvw h-dvh flex flex-col gap-2 justify-center items-center z-10'>
            <Button
              className='text-lg hover:bg-gray-700 active:scale-95 active:bg-gray-500'
              onClick={() => router.push('/signin')}
            >
              로그인하고 Image 만들기
            </Button>
          </div>
          <BlurredGenerateImageWithGemini />
        </div>
      )}
    </>
  );
};

export default GeminiPage;
