'use client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, FileText, MessageSquare, Hash } from 'lucide-react';

export const BlurredScriptInputBox = () => {
  return (
    <div className='min-h-screen bg-background blur-xs'>
      {/* Header */}
      <header className='border-b border-border bg-card'>
        <div className='container mx-auto px-4 py-6'>
          <h1 className='text-3xl font-bold text-card-foreground text-center'>
            AI 숏폼 메이커
          </h1>
          <p className='text-muted-foreground text-center mt-2'>
            스크립트를 입력하고 AI로 숏폼 비디오를 제작하세요
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className='container mx-auto px-4 py-8 max-w-4xl'>
        <Card className='rounded-2xl'>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <FileText className='w-5 h-5' />
              스크립트 입력
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-6'>
            {/* Textarea */}
            <div className='space-y-2'>
              <Textarea
                placeholder='여기에 숏폼 비디오용 스크립트를 입력하세요. 최소 120자 이상 입력해주세요...'
                className='min-h-[200px] resize-none text-base leading-relaxed'
              />
            </div>

            {/* Text Statistics */}
            <div className='flex flex-wrap gap-4'>
              <div className='flex items-center gap-2'>
                <Hash className='w-4 h-4 text-muted-foreground' />
                <span className='text-sm text-muted-foreground'>글자:</span>
                <Badge></Badge>
              </div>

              <div className='flex items-center gap-2'>
                <MessageSquare className='w-4 h-4 text-muted-foreground' />
                <span className='text-sm text-muted-foreground'>단어:</span>
                <Badge variant='outline'></Badge>
              </div>

              <div className='flex items-center gap-2'>
                <FileText className='w-4 h-4 text-muted-foreground' />
                <span className='text-sm text-muted-foreground'>문장:</span>
                <Badge variant='outline'></Badge>
              </div>
            </div>

            {/* Navigation Button */}
            <div className='flex justify-end pt-4'>
              <Button size='lg' className='gap-2'>
                메이커로 이동
                <ArrowRight className='w-4 h-4' />
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default BlurredScriptInputBox;
