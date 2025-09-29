import { useCallback, useEffect, useRef } from 'react';
import { notify } from '@/lib/maker/utils';
import { reportUsage } from '@/lib/shared/usage';
import type { GeneratedClip } from '@/lib/maker/types';

type SeedanceTaskResponse = {
  id?: string;
  status?: 'queued' | 'running' | 'succeeded' | 'failed' | 'canceled';
  content?: { video_url?: string };
  usage?: { total_tokens?: number };
  error?: string;
};

type KlingStatusResponse = {
  message?: string;
  data?: {
    task_status?: 'submitted' | 'processing' | 'succeeded' | 'failed' | string;
    task_result?: { videos?: { url: string }[] };
  };
};

function isTransient(res: Response) {
  return res.status === 404 || res.status === 429 || res.status >= 500;
}

export function useSceneClipPolling(
  setClipsByScene: React.Dispatch<
    React.SetStateAction<Map<string, GeneratedClip>>
  >
) {
  const timersRef = useRef<Map<string, ReturnType<typeof setInterval>>>(
    new Map()
  );
  const abortRef = useRef<Map<string, AbortController>>(new Map());
  const lastStatusRef = useRef<Map<string, string>>(new Map());

  const safeSetFailure = useCallback(
    (sceneId: string, taskId: string | undefined, message: string) => {
      setClipsByScene(prev => {
        const prevClip = prev.get(sceneId);
        if (prevClip?.status === 'succeeded' || (prevClip as any)?.final)
          return prev;
        const next = new Map(prev);
        next.set(sceneId, {
          ...(prevClip ?? { sceneId, timestamp: Date.now(), confirmed: false }),
          status: 'failed',
          taskUrl: taskId,
          error: message,
        });
        return next;
      });
    },
    [setClipsByScene]
  );

  const stopClipPolling = useCallback((sceneId: string) => {
    const t = timersRef.current.get(sceneId);
    if (t) {
      clearInterval(t);
      timersRef.current.delete(sceneId);
    }
    const c = abortRef.current.get(sceneId);
    if (c) {
      c.abort();
      abortRef.current.delete(sceneId);
    }
    lastStatusRef.current.delete(sceneId);
  }, []);

  const checkKlingOnce = useCallback(
    async (sceneId: string, taskId: string) => {
      try {
        const old = abortRef.current.get(sceneId);
        if (old) old.abort();
        const ctrl = new AbortController();
        abortRef.current.set(sceneId, ctrl);

        const res = await fetch(`/api/kling/${taskId}`, {
          method: 'GET',
          cache: 'no-store',
          signal: ctrl.signal,
        });

        if (!res.ok) {
          if (isTransient(res)) return 'pending';
          throw new Error(`Status ${res.status}`);
        }

        const json = (await res.json()) as KlingStatusResponse;
        const statusRaw = json?.data?.task_status;

        const last = lastStatusRef.current.get(sceneId);
        if (statusRaw && statusRaw !== last) {
          lastStatusRef.current.set(sceneId, statusRaw);
        }

        if (
          json?.message === 'SUCCEED' &&
          json?.data?.task_result?.videos?.[0]?.url
        ) {
          const url = json.data.task_result.videos[0].url;
          setClipsByScene(prev => {
            const next = new Map(prev);
            next.set(sceneId, {
              status: 'succeeded',
              taskUrl: taskId,
              sceneId,
              dataUrl: url,
              timestamp: Date.now(),
              confirmed: false,
            });
            return next;
          });
          stopClipPolling(sceneId);
          return 'done';
        }

        if (statusRaw && /fail|cancel/i.test(statusRaw)) {
          safeSetFailure(sceneId, taskId, `AI Error: ${statusRaw}`);
          stopClipPolling(sceneId);
          return 'error';
        }

        return 'pending';
      } catch (e: any) {
        if (e?.name === 'AbortError') return 'pending';
        if (
          e?.message?.includes('Failed to fetch') ||
          e?.message?.includes('NetworkError')
        ) {
          return 'pending';
        }
        safeSetFailure(sceneId, taskId, String(e?.message ?? e));
        stopClipPolling(sceneId);
        return 'error';
      }
    },
    [setClipsByScene, safeSetFailure, stopClipPolling]
  );

  const checkSeedanceOnce = useCallback(
    async (sceneId: string, taskId: string) => {
      try {
        const old = abortRef.current.get(sceneId);
        if (old) old.abort();
        const ctrl = new AbortController();
        abortRef.current.set(sceneId, ctrl);

        const res = await fetch(`/api/seedance/${taskId}`, {
          method: 'GET',
          cache: 'no-store',
          signal: ctrl.signal,
        });

        if (!res.ok) {
          if (isTransient(res)) return 'pending';
          throw new Error(`Status ${res.status}`);
        }

        const json = (await res.json()) as SeedanceTaskResponse;
        const status = json?.status;

        const last = lastStatusRef.current.get(sceneId);
        if (status && status !== last) {
          lastStatusRef.current.set(sceneId, status);
        }

        if (status === 'succeeded') {
          const url = json?.content?.video_url;
          if (!url) throw new Error('클립 생성 실패');

          setClipsByScene(prev => {
            const next = new Map(prev);
            next.set(sceneId, {
              status: 'succeeded',
              taskUrl: taskId,
              sceneId,
              dataUrl: url,
              timestamp: Date.now(),
              confirmed: false,
            });
            return next;
          });

          const tokenUsage = json?.usage?.total_tokens ?? 0;
          await reportUsage('clipSeedance', tokenUsage, 1);

          stopClipPolling(sceneId);
          return 'done';
        }

        if (status === 'failed' || status === 'canceled') {
          safeSetFailure(sceneId, taskId, json?.error ?? '알 수 없는 오류');
          stopClipPolling(sceneId);
          return 'error';
        }

        return 'pending';
      } catch (e: any) {
        if (e?.name === 'AbortError') return 'pending';
        if (
          e?.message?.includes('Failed to fetch') ||
          e?.message?.includes('NetworkError')
        ) {
          return 'pending';
        }
        safeSetFailure(sceneId, taskId, String(e?.message ?? e));
        stopClipPolling(sceneId);
        return 'error';
      }
    },
    [setClipsByScene, safeSetFailure, stopClipPolling]
  );

  const checkOnce = useCallback(
    (sceneId: string, aiType: 'kling' | 'seedance', taskId: string) => {
      return aiType === 'kling'
        ? checkKlingOnce(sceneId, taskId)
        : checkSeedanceOnce(sceneId, taskId);
    },
    [checkKlingOnce, checkSeedanceOnce]
  );

  const startClipPolling = useCallback(
    (
      sceneId: string,
      aiType: 'kling' | 'seedance',
      taskId: string,
      intervalMs = 5000
    ) => {
      if (!taskId) {
        notify('클립 ID가 없습니다.');
        return;
      }
      if (timersRef.current.has(sceneId)) return;

      const run = () => {
        void checkOnce(sceneId, aiType, taskId);
      };
      run();

      const jitter = Math.floor(Math.random() * 1000);
      const timer = setInterval(run, intervalMs + jitter);
      timersRef.current.set(sceneId, timer);
    },
    [checkOnce]
  );

  useEffect(() => {
    return () => {
      timersRef.current.forEach(t => clearInterval(t));
      timersRef.current.clear();
      abortRef.current.forEach(c => c.abort());
      abortRef.current.clear();
      lastStatusRef.current.clear();
    };
  }, []);

  return { startClipPolling, stopClipPolling };
}
