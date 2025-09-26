'use client';

import { FileImage, Sparkles, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

export const BlurredGenerateVideoWithUpload = () => {
  return (
    <div className='w-full max-w-6xl mx-auto px-6 py-18 space-y-6 blur-xs'>
      <div className='grid md:grid-cols-3 gap-6'>
        {/* start frame 섹션 */}
        <div className='space-y-4'>
          <h3 className='text-lg font-semibold'>1. 스타트 프레임 업로드</h3>(
          <div
            className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors `}
          >
            <input type='file' accept='image/*' className='hidden' />

            <FileImage className='mx-auto h-12 w-12 text-gray-400 mb-4' />

            <p className='text-sm mb-4'>
              이미지를 드래그하거나 클릭하여 업로드
            </p>

            <Button variant='outline'>
              <Upload className='mr-2 h-4 w-4' />
              이미지 선택
            </Button>
          </div>
          )
        </div>

        <div className='space-y-4'>
          <h3 className='text-lg font-semibold'>1-2. 엔드 프레임 업로드</h3>
          <div
            className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors `}
          >
            <input type='file' accept='image/*' className='hidden' />

            <FileImage className='mx-auto h-12 w-12 text-gray-400 mb-4' />

            <p className='text-sm mb-4'>
              이미지를 드래그하거나 클릭하여 업로드
            </p>

            <Button variant='outline'>
              <Upload className='mr-2 h-4 w-4' />
              이미지 선택
            </Button>
          </div>
        </div>

        <div className='flex justify-center gap-6 items-center'>
          <div>
            <p>영상 길이</p>
            <div className='flex gap-2'>
              <input type='radio' value='5' id='duration-5' name='duration' />
              <label htmlFor='duration-5'>5s</label>
            </div>
            <div className='flex gap-2'>
              <input type='radio' value='10' id='duration-10' name='duration' />
              <label htmlFor='duration-10'>10s</label>
            </div>
            <p>생성 AI 종류</p>
            <div className='flex gap-2'>
              <input
                type='radio'
                value='SEE_DANCE'
                id='aiType-SEE_DANCE'
                name='aiType'
              />
              <label htmlFor='aiType-SEE_DANCE'>SeeDance 사용하기</label>
            </div>
            <div className='flex gap-2 select-none'>
              <input type='checkbox' id='force-lite-model' name='aiType' />
              <label htmlFor='force-lite-model'>강제 lite model 사용하기</label>
            </div>
          </div>
          <select>
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
            className='min-h-[150px]'
          />

          <Button className='w-full'>
            <>
              <Sparkles className='mr-2 h-4 w-4' />
            </>
          </Button>
          <Button className='w-full'>영상 읽어오기</Button>
        </div>
      </div>
    </div>
  );
};
