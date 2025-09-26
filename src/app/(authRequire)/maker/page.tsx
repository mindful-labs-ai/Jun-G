'use client';

import BlurredShortFormMaker from '@/components/maker/BlurredShortFormMaker';
import ShortFormMaker from '@/components/maker/ShortFormMaker';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/lib/shared/useAuthStore';
import { useRouter } from 'next/navigation';
import React from 'react';

const MakerPage = () => {
  const userId = useAuthStore(s => s.userId);
  const router = useRouter();
  return (
    <>
      {userId ? (
        <ShortFormMaker />
      ) : (
        <div className='relative'>
          <div className='fixed w-dvw h-dvh flex flex-col gap-2 justify-center items-center z-10'>
            <Button
              className='text-lg hover:bg-gray-700 active:scale-95 active:bg-gray-500'
              onClick={() => router.push('/signin')}
            >
              로그인하고 숏폼 영상 만들기
            </Button>
          </div>
          <BlurredShortFormMaker />
        </div>
      )}
    </>
  );
};

export default MakerPage;
