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
import { AlertTriangle } from 'lucide-react';

export default function ResetDialog({
  open,
  onOpenChange,
  message,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  message: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <AlertTriangle className='w-5 h-5 text-destructive' />
            하위 단계 초기화 경고
          </DialogTitle>
          <DialogDescription>{message}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant='outline' onClick={onCancel}>
            취소
          </Button>
          <Button variant='destructive' onClick={onConfirm}>
            계속 진행
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
