'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

export default function ScriptEditDialog({
  open,
  tempScript,
  setTempScript,
  onCancel,
  onSave,
}: {
  open: boolean;
  tempScript: string;
  setTempScript: (v: string) => void;
  onCancel: () => void;
  onSave: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={() => onCancel()}>
      <DialogContent className='max-w-2xl'>
        <DialogHeader>
          <DialogTitle>스크립트 수정</DialogTitle>
          <DialogDescription>
            스크립트를 수정하면 생성된 모든 콘텐츠가 초기화될 수 있습니다.
          </DialogDescription>
        </DialogHeader>
        <div className='space-y-4'>
          <Textarea
            value={tempScript}
            onChange={e => setTempScript(e.target.value)}
            placeholder='스크립트를 입력하세요...'
            className='min-h-[200px]'
          />
          <div className='text-sm text-muted-foreground'>
            글자 수: {tempScript.length}
          </div>
        </div>
        <DialogFooter>
          <Button variant='outline' onClick={onCancel}>
            취소
          </Button>
          <Button onClick={onSave} disabled={!tempScript.trim()}>
            저장
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
