'use client';

import { BlurredGenerateImageWithGemini } from '@/components/image/BlurredGenerateImageWithGemini';
import { GenerateImageWithGemini } from '@/components/image/GenerateImageWithGemini';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/lib/shared/useAuthStore';
import { useRouter } from 'next/navigation';
import React from 'react';

const GeminiPage = () => {
  const userId = useAuthStore(s => s.userId);
  const router = useRouter();

  return (
    <>
      {userId ? (
        <GenerateImageWithGemini />
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
