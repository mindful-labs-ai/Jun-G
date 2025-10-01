'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import ProjectList from './ProjectList';
import { useAuthStore } from '@/lib/shared/useAuthStore';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import BlurredShortFormMaker from '../maker/BlurredShortFormMaker';
import ScriptInputBox from '@/lib/makerScript/ScriptInputBox';
import ShortFormMaker from '../maker/ShortFormMaker';
import {
  FunnelProps,
  QueryProps,
  StateProps,
  VideoPreferenceUpdate,
} from '@/lib/project/types';
import { useGetProjectList } from '@/lib/project/queries';

const aspectOptions = ['1:1', '4:3', '3:4', '16:9', '9:16', '21:9'];
const resolutionOptions = [480, 720, 1080];

const ProjectScreen = () => {
  const userId = useAuthStore(s => s.userNumber);
  const router = useRouter();

  const projectIdRef = useRef<number | null>(null);
  const [step, setStep] = useState<number>(0);
  const [signal, setSignal] = useState(0);
  const [script, setScript] = useState<string>('');
  const [preference, setPreference] = useState<VideoPreferenceUpdate>({
    image_gen_model: 'Gemini',
    video_gen_model: 'Seedance',
    voice_gen_model: 'Bin',
    stability: 0.5,
    resolution: '480p',
    ratio: '9:16',
    custom_style: '',
    split_rule: '',
  });

  const next = useCallback(() => setStep(s => Math.min(2, s + 1)), []);
  const prev = useCallback(() => setStep(s => Math.max(0, s - 1)), []);
  const selectProject = useCallback((id: number) => {
    projectIdRef.current = id;
    setSignal(x => x + 1);
    setStep(1);
  }, []);
  const chancePreference = useCallback(
    <K extends keyof VideoPreferenceUpdate>(
      key: K,
      value: VideoPreferenceUpdate[K]
    ) => {
      setPreference(prev => ({ ...prev, [key]: value }));
    },
    []
  );

  const {
    data: projects = [],
    isLoading,
    isError,
    refetch,
  } = useGetProjectList(userId);

  const funnel = useMemo<FunnelProps>(
    () => ({
      step,
      next,
      prev,
      selectProject,
      projectIdRef,
      signal,
    }),
    [step, next, prev, selectProject, signal]
  );

  const query = useMemo<QueryProps>(
    () => ({
      projectList: projects,
      refetch,
    }),
    [projects, refetch]
  );

  const state = useMemo<StateProps>(
    () => ({
      preference,
      chancePreference,
      aspectOptions,
      resolutionOptions,
      script,
      setScript,
    }),
    [preference, chancePreference, script]
  );

  return (
    <>
      <div className='flex justify-center'>
        <button onClick={funnel.next}>앞으로</button>
        <button onClick={funnel.prev}>뒤으로</button>
      </div>
      {userId !== 0 ? (
        isLoading ? (
          <div>로딩</div>
        ) : isError ? (
          <div>프로젝트 호출 실패</div>
        ) : (
          <div>
            {step === 0 && <ProjectList funnel={funnel} query={query} />}
            {step === 1 && (
              <ScriptInputBox key={signal} funnel={funnel} state={state} />
            )}
            {step === 2 && <ShortFormMaker key={signal} />}
          </div>
        )
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

export default ProjectScreen;
