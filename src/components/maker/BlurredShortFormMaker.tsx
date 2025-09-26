'use client';

import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  FileArchive,
  HelpCircle,
  ImageIcon,
  Mic,
  RotateCcw,
  Scissors,
  Settings,
  Upload,
  Video,
} from 'lucide-react';
import { Badge } from '../ui/badge';

export const BlurredShortFormMaker = () => {
  return (
    <div className='min-h-screen bg-background blur-xs'>
      <header className='border-b border-border bg-card top-0 z-10'>
        <div className='container mx-auto px-4 py-4'>
          <div className='flex items-center justify-between'>
            {/* Left */}
            <div className='flex items-center gap-4'>
              <Button variant='ghost' size='sm' className='gap-2'>
                <ArrowLeft className='w-4 h-4' />
                돌아가기
              </Button>
              <h1 className='text-xl font-bold text-card-foreground'>
                AI 숏폼 메이커
              </h1>
              <Button variant='ghost' size='sm' className='gap-2'>
                {/* 아이콘은 페이지에서 import */}
                수정
              </Button>
            </div>

            {/* Center (md↑) */}
            <div className='hidden md:flex items-center gap-2'>
              <Badge variant={'secondary'} className='gap-1'>
                <Video className='w-3 h-3' /> 씬
              </Badge>
              <Badge variant={'secondary'} className='gap-1'>
                <ImageIcon className='w-3 h-3' /> 이미지
              </Badge>
              <Badge className='gap-1'>
                <Scissors className='w-3 h-3' /> 클립
              </Badge>
              <Badge className='gap-1'>
                <Mic className='w-3 h-3' /> 나레이션 대기
              </Badge>
            </div>

            {/* Right */}
            <Button>
              <FileArchive className='w-4 h-4' />
              ZIP 다운로드
            </Button>
          </div>

          {/* Mobile badges */}
          <div className='md:hidden mt-3 flex flex-wrap gap-2'>
            <Badge variant={'secondary'} className='gap-1'>
              <Video className='w-3 h-3' /> 씬
            </Badge>
            <Badge variant={'secondary'} className='gap-1'>
              <ImageIcon className='w-3 h-3' />
            </Badge>
            <Badge variant={'secondary'} className='gap-1'>
              <Scissors className='w-3 h-3' />
            </Badge>
            <Badge variant={'default'} className='gap-1'>
              <Mic className='w-3 h-3' /> 나레이션 완료
            </Badge>
          </div>
        </div>
      </header>
      <main className='container mx-auto px-4 py-6'>
        <div className='grid grid-cols-1 gap-6 mb-2'>
          <section className='relative w-full mx-auto'>
            {/* Sticky Stepper */}
            <div className='sticky top-2 z-20'>
              <div className='backdrop-blur supports-[backdrop-filter]:bg-background/60 bg-background/90 border rounded-2xl px-3 py-2'>
                <div className='flex justify-between'>
                  <div className='flex items-center gap-2'></div>
                  <div className='flex items-center gap-4'>
                    <input type='file' accept='image/*' className='hidden' />

                    <Button variant='outline'>
                      <Upload className='mr-2 h-4 w-4' />
                      참조 이미지 선택
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Airy Canvas */}
            <div className='relative mt-4 h-fit overflow-hidden rounded-3xl border'>
              {/* grid-ish background */}
              <div className='pointer-events-none absolute inset-0 opacity-[0.55]'>
                <div className='absolute inset-0 bg-[radial-gradient(#0000000a_1px,transparent_1px)] [background-size:14px_14px]' />
                <div className='absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-muted/70 to-transparent' />
              </div>

              <div className='relative flex justify-between items-center p-4 md:p-6'>
                <div className='flex items-center gap-2'>
                  <div className='inline-flex items-center gap-2 rounded-full border bg-card/80 px-3 py-1.5 backdrop-blur'>
                    <span className='text-sm font-medium'></span>
                  </div>
                  <p className='hidden md:block text-xs text-muted-foreground'></p>
                </div>
                <Button variant='outline'>
                  <Settings />
                </Button>
              </div>

              {/* Content */}
              <div className='relative p-4 md:p-6'></div>
            </div>
          </section>
        </div>
      </main>
      {/* Footer */}
      <footer className='border-t border-border sticky bottom-0 z-10 bg-card mt-auto'>
        <div className='container mx-auto px-4 py-4'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-2'>
              <Button variant='ghost' size='sm' className='gap-2'>
                <RotateCcw className='w-4 h-4' />
                초기화
              </Button>
              <Button variant='ghost' size='sm' className='gap-2'>
                <HelpCircle className='w-4 h-4' />
                도움말
              </Button>

              <Button>장면 임시 만들기</Button>
            </div>

            <div className='text-sm text-muted-foreground mr-8'></div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default BlurredShortFormMaker;
