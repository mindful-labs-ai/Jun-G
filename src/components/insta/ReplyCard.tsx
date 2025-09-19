'use client';
import { AIReplyItem } from '@/app/insta/page';
import { Button } from '../ui/button';
import { useState } from 'react';

const copy = async (text: string) => {
  await navigator.clipboard.writeText(text);
};

const ReplyCard = ({ it }: { it: AIReplyItem }) => {
  const [copied, setCopied] = useState<boolean>(false);
  return (
    <div key={it.id} className='border rounded p-3 space-y-2'>
      <div className='flex flex-col text-sm text-muted-foreground'>
        <strong>{it.author}</strong>
        <span>: {it.content}</span>
        <span>{it?.content_ko}</span>
      </div>
      <div className='flex items-start justify-between gap-3'>
        <div className='flex flex-col'>
          <p className='whitespace-pre-wrap'>{it.reply}</p>
          <span>{it?.reply_ko}</span>
        </div>
        <Button
          size='sm'
          className='hover:bg-gray-400 active:bg-blue-400'
          onClick={() => {
            copy(it.reply).then(() => {});
            setCopied(true);
          }}
        >
          {copied ? '복사됨' : '복사'}
        </Button>
      </div>
    </div>
  );
};

export default ReplyCard;
