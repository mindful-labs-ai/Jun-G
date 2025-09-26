'use client';

import { Button } from '@/components/ui/button';

export const BlurredInstagHelper = () => {
  const TopBar = (
    <div className='flex items-center justify-between'>
      <h1 className='text-xl font-bold'>Instagram 댓글/답글 생성기</h1>
      <div className='flex gap-2'>
        <Button>댓글/답글</Button>
        <Button>캡션(택틱)</Button>
      </div>
    </div>
  );

  const Options = (
    <div className='grid gap-3 border rounded p-3'>
      <label className='text-sm font-medium'>문체 프롬프트</label>
      <textarea className='w-full h-20 border rounded p-2' />
      <div className='flex gap-2 items-center'>
        <label className='text-sm font-medium'>언어</label>
        <select className='border rounded px-2 py-1'>
          <option value='ko'>한국어</option>
          <option value='en'>English</option>
          <option value='ja'>日本語</option>
        </select>
      </div>
    </div>
  );

  return (
    <div className='max-w-3xl mx-auto p-6 space-y-6 blur-xs'>
      {TopBar}
      {Options}
    </div>
  );
};

export default BlurredInstagHelper;
