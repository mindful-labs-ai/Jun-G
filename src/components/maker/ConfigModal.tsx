'use client';

import * as React from 'react';
import TextareaAutosize from 'react-textarea-autosize';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { useAIConfigStore } from '@/lib/maker/useAiConfigStore';

export type AspectRatio = '1:1' | '4:3' | '3:4' | '16:9' | '9:16' | '21:9';

type ImageAI = 'gemini' | 'gpt';
type ClipAI = 'kling' | 'seedance';

const aspectOptions: AspectRatio[] = [
  '1:1',
  '4:3',
  '3:4',
  '16:9',
  '9:16',
  '21:9',
];

const resolutionOptions = [480, 720] as const;

export default function ConfigModal() {
  // const open = useAIConfigStore(config => config.modalOpen);
  // const onOpenChange = useAIConfigStore(config => config.setModalOpen);

  // const globalStyle = useAIConfigStore(config => config.globalStyle);
  // const setGlobalStyle = useAIConfigStore(config => config.setGlobalStyle);
  // const imageAiType = useAIConfigStore(config => config.imageAiType);
  // const setImageAiType = useAIConfigStore(config => config.setImageAiType);
  // const clipAiType = useAIConfigStore(config => config.clipAiType);
  // const setClipAiType = useAIConfigStore(config => config.setClipAiType);
  // const ratio = useAIConfigStore(config => config.ratio);
  // const setRatio = useAIConfigStore(config => config.setRatio);
  // const resolution = useAIConfigStore(config => config.resolution);
  // const setResolution = useAIConfigStore(config => config.setResolution);
  // const customRule = useAIConfigStore(config => config.customRule);
  // const setCustomRule = useAIConfigStore(config => config.setCustomRule);

  // // draft states
  // const [draftImageAI, setDraftImageAI] = React.useState<ImageAI>(imageAiType);
  // const [draftClipAI, setDraftClipAI] = React.useState<ClipAI>(clipAiType);
  // const [draftRatio, setDraftRatio] = React.useState<AspectRatio>(ratio);
  // const [draftResolution, setDraftResolution] =
  //   React.useState<number>(resolution);
  // const [draftCustomRule, setDraftCustomRule] =
  //   React.useState<string>(customRule);
  // const [draftGlobalStyle, setDraftGlobalStyle] =
  //   React.useState<string>(globalStyle);

  // // 열릴 때 현재 값으로 동기화
  // React.useEffect(() => {
  //   if (open) {
  //     setDraftImageAI(imageAiType);
  //     setDraftClipAI(clipAiType);
  //     setDraftRatio(ratio);
  //     setDraftResolution(resolution);
  //     setDraftCustomRule(customRule);
  //     setDraftGlobalStyle(globalStyle);
  //   }
  // }, [
  //   open,
  //   imageAiType,
  //   clipAiType,
  //   ratio,
  //   resolution,
  //   customRule,
  //   globalStyle,
  // ]);

  // const handleApply = () => {
  //   setImageAiType(draftImageAI);
  //   setClipAiType(draftClipAI);
  //   setRatio(draftRatio);
  //   setResolution(draftResolution);
  //   setCustomRule(draftCustomRule?.trim());
  //   setGlobalStyle(draftGlobalStyle?.trim());
  //   onOpenChange(false);
  // };

  return (
    // <Dialog open={open} onOpenChange={onOpenChange}>
    //   <DialogContent className='max-w-2xl'>
    //     <DialogHeader>
    //       <DialogTitle>AI Configs</DialogTitle>
    //       <DialogDescription>
    //         AI에 대한 전반적인 설정을 다룹니다.
    //       </DialogDescription>
    //     </DialogHeader>

    //     <div className='space-y-4'>
    //       <div className='flex flex-col items-center gap-3'>
    //         <h3>비율 및 해상도 설정</h3>
    //         <div className='flex flex-wrap items-center gap-3'>
    //           <div className='inline-flex rounded-full border p-1 bg-card'>
    //             {aspectOptions.map(r => (
    //               <Button
    //                 key={r}
    //                 size='sm'
    //                 variant={draftRatio === r ? 'default' : 'ghost'}
    //                 className='h-7 rounded-full'
    //                 onClick={() => setDraftRatio(r)}
    //               >
    //                 {r}
    //               </Button>
    //             ))}
    //           </div>

    //           {/* Resolution */}
    //           <div className='inline-flex rounded-full border p-1 bg-card'>
    //             {resolutionOptions.map(r => (
    //               <Button
    //                 key={r}
    //                 size='sm'
    //                 variant={draftResolution === r ? 'default' : 'ghost'}
    //                 className='h-7 rounded-full'
    //                 onClick={() => setDraftResolution(r)}
    //               >
    //                 {r}
    //               </Button>
    //             ))}
    //           </div>
    //         </div>
    //         <h3>이미지/클립 AI 종류 선택</h3>
    //         <div className='flex flex-wrap items-center gap-3'>
    //           <div className='inline-flex rounded-full border p-1 bg-card'>
    //             <Button
    //               size='sm'
    //               variant={draftImageAI === 'gemini' ? 'default' : 'ghost'}
    //               className='h-7 rounded-full'
    //               onClick={() => setDraftImageAI('gemini')}
    //             >
    //               Gemini
    //             </Button>
    //             <Button
    //               size='sm'
    //               variant={draftImageAI === 'gpt' ? 'default' : 'ghost'}
    //               className='h-7 rounded-full'
    //               onClick={() => setDraftImageAI('gpt')}
    //             >
    //               GPT
    //             </Button>
    //           </div>

    //           <div className='inline-flex rounded-full border p-1 bg-card'>
    //             <Button
    //               size='sm'
    //               variant={draftClipAI === 'kling' ? 'default' : 'ghost'}
    //               className='h-7 rounded-full'
    //               onClick={() => setDraftClipAI('kling')}
    //             >
    //               Kling
    //             </Button>
    //             <Button
    //               size='sm'
    //               variant={draftClipAI === 'seedance' ? 'default' : 'ghost'}
    //               className='h-7 rounded-full'
    //               onClick={() => setDraftClipAI('seedance')}
    //             >
    //               Seedance
    //             </Button>
    //           </div>
    //         </div>
    //       </div>

    //       {/* Global Style 입력 */}
    //       <div className='space-y-2'>
    //         <div className='flex items-center justify-between'>
    //           <label className='text-sm font-medium'>이미지 스타일</label>
    //           <span className='text-xs text-muted-foreground'>
    //             {draftGlobalStyle.length}/150
    //           </span>
    //         </div>

    //         <TextareaAutosize
    //           minRows={2}
    //           maxRows={4}
    //           value={draftGlobalStyle}
    //           onChange={e => setDraftGlobalStyle(e.target.value)}
    //           className='w-full resize-none rounded-md border bg-background px-3 py-2 text-sm focus:outline-none'
    //           placeholder={[
    //             '예) A masterpiece Japanese style anime illustration,',
    //             'A photorealistic,',
    //             'A kawaii-style sticker,',
    //           ].join(' ')}
    //         />

    //         <p className='text-xs text-muted-foreground'>
    //           힌트: 자연어로 자유롭게 작성하세요. 생성되는 모든 이미지에
    //           스타일이 적용됩니다.
    //         </p>
    //       </div>

    //       {/* Custom Rule 입력 */}
    //       <div className='space-y-2'>
    //         <div className='flex items-center justify-between'>
    //           <label className='text-sm font-medium'>장면 분할 커스텀 룰</label>
    //           <span className='text-xs text-muted-foreground'>
    //             {draftCustomRule.length}/1000
    //           </span>
    //         </div>

    //         <TextareaAutosize
    //           minRows={5}
    //           maxRows={12}
    //           value={draftCustomRule}
    //           onChange={e => setDraftCustomRule(e.target.value)}
    //           className='w-full resize-none rounded-md border bg-background px-3 py-2 text-sm focus:outline-none'
    //           placeholder={[
    //             '예) Close-up은 전체의 15% 이하, 실내는 handheld 금지,',
    //             '파스텔 톤 유지, 장면 2/5에는 우산 소품 반복,',
    //             '앵글은 eye-level/low/high 최소 3종 이상 섞기,',
    //             '내 캐릭터 변경 금지',
    //           ].join(' ')}
    //         />

    //         <p className='text-xs text-muted-foreground'>
    //           힌트: 자연어로 자유롭게 작성하세요. 프롬프트에서 사용자 규칙이
    //           우선됩니다(안전 규칙 제외).
    //         </p>
    //       </div>
    //     </div>

    //     <DialogFooter className='gap-2'>
    //       <DialogClose asChild>
    //         <Button variant='outline'>Cancel</Button>
    //       </DialogClose>
    //       <Button onClick={handleApply}>Apply</Button>
    //     </DialogFooter>
    //   </DialogContent>
    // </Dialog>

    <>삭제 예정</>
  );
}
