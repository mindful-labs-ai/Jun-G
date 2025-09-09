'use client';

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
  useDeferredValue,
} from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { HelpCircle, Mic, RefreshCw, RotateCcw } from 'lucide-react';
import HeaderBar from '@/components/maker/HeaderBar';
import NarrationPanel from '@/components/maker/NarrationPanel';
import ResetDialog from '@/components/maker/ResetDialog';
import ScriptEditDialog from '@/components/maker/ScriptEditDialog';
import SceneRail from '@/components/maker/SceneRail';
import SceneCanvas from '@/components/maker/SceneCanvas';
import { notify, nowId, stripDataUrlPrefix } from '@/lib/maker/utils';
import {
  GeneratedClip,
  GeneratedImage,
  GeneratedNarration,
  NarrationSettings,
  ResetType,
  Scene,
  ScenesState,
  UploadedImage,
} from '@/lib/maker/types';
import VisualPipeline from '@/components/maker/VisualPipeLine';
import { tempScenes } from '@/components/temp/tempJson';
import {
  SeeDanceImageToVideoResponse,
  TaskResponse,
} from '../api/seedance/clip-gen/[id]/route';
import { KlingImageToVideoResponse } from '../api/kling/clip-gen/[id]/route';
import { KlingImageToVideoStatusResponse } from '../api/kling/[id]/route';
import { useAIConfigStore } from '@/lib/maker/useAiConfigStore';
import ConfigModal from '@/components/maker/ConfigModal';
import { buildClipPromptText } from '@/lib/maker/clipPromptBuilder';

type ClipJob = { sceneId: string; aiType: 'kling' | 'seedance' };

export default function MakerPage() {
  const router = useRouter();

  // core state
  const [script, setScript] = useState('');
  const [scenesState, setScenesState] = useState<ScenesState>({
    byId: new Map(),
    order: [],
  });
  const [imagesByScene, setImagesByScene] = useState<
    Map<string, GeneratedImage>
  >(new Map());
  const [clipsByScene, setClipsByScene] = useState<Map<string, GeneratedClip>>(
    new Map()
  );
  const [narration, setNarration] = useState<GeneratedNarration | null>(null);
  const [currentSceneId, setCurrentSceneId] = useState<string | null>(null);
  const [uploadedImage, setUploadedImage] = useState<UploadedImage | null>(
    null
  );

  // ai config state
  const customRule = useAIConfigStore(config => config.customRule);
  const globalStyle = useAIConfigStore(config => config.globalStyle);
  const imageAiType = useAIConfigStore(config => config.imageAiType);
  const clipAiType = useAIConfigStore(config => config.clipAiType);
  const sourceRatio = useAIConfigStore(config => config.ratio);
  const sourceResolution = useAIConfigStore(config => config.resolution);

  // UI/flow state
  const [editingScene, setEditingScene] = useState<string | null>(null);
  const [editingScriptOpen, setEditingScriptOpen] = useState(false);
  const [tempScript, setTempScript] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [resetType, setResetType] = useState<ResetType>('script');
  const pendingActionRef = useRef<(() => void) | null>(null);

  // loading flags
  const [generatingScenes, setGeneratingScenes] = useState(false);
  const [generatingNarration, setGeneratingNarration] = useState(false);
  const [zipDownloading, setZipDownloading] = useState(false);

  // funnel state
  const [step, setStep] = useState<number>(0);

  // audio sim
  const [audioOpen, setAudioOpen] = useState(false);
  const [narrationSettings, setNarrationSettings] = useState<NarrationSettings>(
    { tempo: 50, tone: 'neutral', voice: 'female', style: 'professional' }
  );
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const playTimerRef = useRef<NodeJS.Timeout | null>(null);
  const HANDLE_W = 40;

  // queue state
  const imageQueueRef = useRef<string[]>([]);
  const imageQueuedSetRef = useRef<Set<string>>(new Set());
  const imageQueueTimerRef = useRef<ReturnType<typeof setInterval> | null>(
    null
  );

  const clipQueueRef = useRef<ClipJob[]>([]);
  const clipQueuedSetRef = useRef<Set<string>>(new Set()); // sceneId 중복 방지
  const clipQueueTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ---- 파생 배열(하위 컴포넌트들은 배열로 유지) ----
  const scenes = useMemo(
    () =>
      scenesState.order.map(id => scenesState.byId.get(id)!).filter(Boolean),
    [scenesState]
  );

  const images = useMemo(
    () => Array.from(imagesByScene.values()),
    [imagesByScene]
  );

  const clips = useMemo(
    () => Array.from(clipsByScene.values()),
    [clipsByScene]
  );

  const deferredScenes = useDeferredValue(scenes);

  // derived project status
  const status = useMemo(() => {
    const scenesConfirmed = [...scenesState.byId.values()].filter(
      s => s.confirmed
    ).length;
    const imagesConfirmed = images.filter(i => i.confirmed).length;
    const clipsConfirmed = clips.filter(c => c.confirmed).length;
    return {
      scenes: scenesConfirmed,
      totalScenes: scenesState.byId.size,
      images: imagesConfirmed,
      totalImages: images.length,
      clips: clipsConfirmed,
      totalClips: clips.length,
      narrationDone: narration?.confirmed || false,
    };
  }, [scenesState, images, clips, narration]);

  const allConfirmed = status.scenes === scenes.length;

  const allImagesConfirmed = status.images === scenes.length;

  /* ============ init / cleanup ============ */
  useEffect(() => {
    const savedScript = localStorage.getItem('ai-shortform-script');
    if (!savedScript) {
      alert('스크립트가 없습니다');
      router.replace('/');
      return;
    }
    setScript(savedScript);
  }, [router]);

  /* ============ confirm dialog helpers ============ */
  const openConfirm = useCallback((type: ResetType, action: () => void) => {
    setResetType(type);
    pendingActionRef.current = action;
    setConfirmOpen(true);
  }, []);

  const confirmMessage = useMemo(() => {
    switch (resetType) {
      case 'script':
        return '스크립트를 수정하면 생성된 모든 장면, 이미지, 클립, 나레이션이 초기화됩니다.';
      case 'image':
        return '이미지를 재생성하면 해당 이미지로 만든 클립이 초기화됩니다.';
      case 'scene':
        return '장면을 수정하면 해당 장면의 이미지와 클립이 초기화됩니다.';
      default:
        return '이 작업을 수행하면 하위 단계가 초기화됩니다.';
    }
  }, [resetType]);

  const runPending = () => {
    pendingActionRef.current?.();
    pendingActionRef.current = null;
    setConfirmOpen(false);
  };
  const cancelPending = () => {
    pendingActionRef.current = null;
    setConfirmOpen(false);
    if (resetType === 'script') {
      setEditingScriptOpen(false);
      setTempScript('');
    }
  };

  /* ============ ZIP (stub) ============ */
  function extFromMime(type?: string) {
    if (!type) return 'bin';
    const t = type.toLowerCase();
    if (t.includes('png')) return 'png';
    if (t.includes('jpeg') || t.includes('jpg')) return 'jpg';
    if (t.includes('webp')) return 'webp';
    if (t.includes('gif')) return 'gif';
    if (t.includes('mp4')) return 'mp4';
    if (t.includes('webm')) return 'webm';
    if (t.includes('quicktime') || t.includes('mov')) return 'mov';
    return 'bin';
  }

  function buildProxyUrl(
    srcUrl: string,
    opts?: { mode?: 'view' | 'download'; filename?: string }
  ) {
    const u = new URL('/api/proxy', window.location.origin);
    u.searchParams.set('url', srcUrl);
    if (opts?.mode) u.searchParams.set('mode', opts.mode);
    if (opts?.filename) u.searchParams.set('filename', opts.filename);
    return u.toString();
  }

  // 기존 함수 교체: CORS 에러 시 자동으로 프록시로 폴백
  async function blobFromUrlOrDataUrl(url: string): Promise<Blob> {
    // data: URL은 직접 fetch 가능
    if (url.startsWith('data:')) {
      const res = await fetch(url);
      return await res.blob();
    }

    // 1차: 직접 fetch 시도 (CORS 허용되면 굳이 프록시 안 거침)
    try {
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) throw new Error(`Status ${res.status}`);
      return await res.blob();
    } catch {
      // 2차: 프록시로 우회
      const proxied = buildProxyUrl(url, { mode: 'download' });
      const res2 = await fetch(proxied, { cache: 'no-store' });
      if (!res2.ok) throw new Error(`Proxy status ${res2.status}`);
      return await res2.blob();
    }
  }

  function pad2(n: number) {
    return String(n).padStart(2, '0');
  }

  // === ZIP 다운로드 로직 ===
  const handleZipDownload = async () => {
    setZipDownloading(true);
    try {
      // 지표 검사
      const okImages = Array.from(imagesByScene.entries()).filter(
        ([, img]) => img.status === 'succeeded' && !!img.dataUrl
      );
      const okClips = Array.from(clipsByScene.entries()).filter(
        ([, clip]) => clip.status === 'succeeded' && !!clip.dataUrl
      );

      if (okImages.length === 0 && okClips.length === 0) {
        notify('다운로드할 완료된 이미지/클립이 없습니다.');
        return;
      }

      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();

      // 폴더 구성
      const imagesFolder = zip.folder('images');
      const clipsFolder = zip.folder('clips');

      // 파일명은 scenesState.order 순서를 기준으로 정렬
      const indexOf = (sceneId: string) =>
        Math.max(0, scenesState.order.indexOf(sceneId));

      // 이미지 추가
      await Promise.all(
        okImages.map(async ([sceneId, img]) => {
          const blob = await blobFromUrlOrDataUrl(img.dataUrl!);
          const ext = extFromMime(blob.type) || 'png';
          const idx = indexOf(sceneId);
          const filename = `scene-${pad2(idx + 1)}-${sceneId}.${ext}`;
          imagesFolder!.file(filename, await blob.arrayBuffer());
        })
      );

      // 클립 추가 (kling/seedance는 보통 URL이므로 fetch->Blob)
      await Promise.all(
        okClips.map(async ([sceneId, clip]) => {
          const blob = await blobFromUrlOrDataUrl(clip.dataUrl!);
          const ext = extFromMime(blob.type) || 'mp4';
          const idx = indexOf(sceneId);
          const filename = `scene-${pad2(idx + 1)}-${sceneId}.${ext}`;
          clipsFolder!.file(filename, await blob.arrayBuffer());
        })
      );

      // manifest + scenes 스냅샷
      const manifest = {
        generatedAt: new Date().toISOString(),
        summary: {
          scenesTotal: scenesState.byId.size,
          imagesSucceeded: okImages.length,
          clipsSucceeded: okClips.length,
        },
        scenes: scenes.map(s => ({
          id: s.id,
          confirmed: s.confirmed,
          imagePrompt: (s as any).imagePrompt ?? s.englishPrompt,
          clipPrompt: (s as any).clipPrompt,
        })),
        images: Array.from(imagesByScene.entries()).map(([sceneId, i]) => ({
          sceneId,
          status: i.status,
          confirmed: i.confirmed,
          timestamp: i.timestamp,
          hasData: !!i.dataUrl,
          error: i.error ?? null,
        })),
        clips: Array.from(clipsByScene.entries()).map(([sceneId, c]) => ({
          sceneId,
          status: c.status,
          confirmed: c.confirmed,
          timestamp: c.timestamp,
          hasData: !!c.dataUrl,
          providerTaskId: c.taskUrl ?? null,
          error: c.error ?? null,
        })),
      };

      zip.file('manifest.json', JSON.stringify(manifest, null, 2));
      zip.file(
        'scenes.json',
        JSON.stringify(
          scenes.map(s => ({
            id: s.id,
            originalText: s.originalText,
            koreanSummary: s.koreanSummary,
            englishPrompt: s.englishPrompt,
            imagePrompt: (s as any).imagePrompt ?? s.englishPrompt,
            clipPrompt: (s as any).clipPrompt ?? null,
            confirmed: s.confirmed,
          })),
          null,
          2
        )
      );

      // 압축 생성 & 다운로드
      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const ts = new Date()
        .toISOString()
        .replace(/[:.]/g, '-')
        .replace('T', '_')
        .replace('Z', '');
      a.href = url;
      a.download = `ai-shortform-assets_${ts}.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      notify('ZIP 다운로드가 시작되었습니다.');
    } catch (err) {
      console.error(err);
      notify(`압축 중 오류: ${err}`);
    } finally {
      setZipDownloading(false);
    }
  };

  /* ============ Script edit ============ */
  const handleEditScript = () => {
    setEditingScriptOpen(true);
    setTempScript(script);
  };
  const saveScriptChange = () => {
    const hasDownstream =
      scenesState.byId.size > 0 ||
      images.length > 0 ||
      clips.length > 0 ||
      !!narration;
    const apply = () => {
      setScript(tempScript);
      localStorage.setItem('ai-shortform-script', tempScript);
      setScenesState({ byId: new Map(), order: [] });
      setImagesByScene(new Map());
      setClipsByScene(new Map());
      setNarration(null);
      setEditingScriptOpen(false);
      notify('스크립트 수정됨, 하위 단계가 모두 초기화되었습니다.');
    };
    if (hasDownstream) openConfirm('script', apply);
    else apply();
  };

  /* ============ Scenes helpers ============ */
  const applyScenes = (list: Scene[]) => {
    const byId = new Map<string, Scene>();
    const order: string[] = [];
    for (const s of list) {
      byId.set(s.id, s);
      order.push(s.id);
    }
    setScenesState({ byId, order });
    setCurrentSceneId(order[0] ?? null);
  };

  const confirmScene = (sceneId: string) =>
    setScenesState(prev => {
      const s = prev.byId.get(sceneId);
      if (!s) return prev;
      const byId = new Map(prev.byId);
      byId.set(sceneId, { ...s, confirmed: !s.confirmed });
      return { ...prev, byId };
    });

  const confirmAllScenes = () =>
    setScenesState(prev => {
      if (prev.byId.size === 0) return prev;
      const byId = new Map(prev.byId);
      for (const [id, s] of byId.entries()) {
        byId.set(id, { ...s, confirmed: true });
      }
      return { ...prev, byId };
    });

  // // 프롬프트 편집 반영 (현재 씬)
  // const updateCurrentImagePromptJsonUnit = (
  //   sceneId: string,
  //   key: string,
  //   v: string
  // ) => {
  //   if (!sceneId) return;
  //   setScenesState(prev => {
  //     const s = prev.byId.get(sceneId);
  //     if (!s) return prev;
  //     const byId = new Map(prev.byId);
  //     byId.set(sceneId, { ...s, imagePrompt: { ...s.imagePrompt, [key]: v } });
  //     return { ...prev, byId };
  //   });
  // };

  // const updateCurrentClipPromptJsonUnit = (
  //   sceneId: string,
  //   key: string,
  //   v: string
  // ) => {
  //   if (!sceneId) return;
  //   setScenesState(prev => {
  //     const s = prev.byId.get(sceneId);
  //     if (!s) return prev;
  //     const byId = new Map(prev.byId);
  //     byId.set(sceneId, { ...s, clipPrompt: { ...s.clipPrompt, [key]: v } });
  //     return { ...prev, byId };
  //   });
  // };

  // 현재 씬
  const currentScene = useMemo(
    () =>
      currentSceneId ? scenesState.byId.get(currentSceneId) ?? null : null,
    [scenesState, currentSceneId]
  );

  /* ============ Visual: Scenes / Images / Clips ============ */
  const handleGenerateScenes = async () => {
    if (!script.trim()) return notify('먼저 스크립트를 입력해주세요.');
    if (
      !confirm(
        '기존 장면 프롬프트는 초기화 됩니다. \n스크립트를 장면으로 분해 하시겠습니까?'
      )
    )
      return;

    try {
      setGeneratingScenes(true);
      const res = await fetch('/api/scenes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ script, customRule }),
      });
      if (!res.ok) {
        const { error } = await res.json();
        throw new Error(error ?? '생성 실패');
      }
      const list: Scene[] = await res.json();
      applyScenes(list);
      console.log(list);
      notify(`${list.length}개의 장면이 생성되었습니다.`);
    } catch (error) {
      notify(String(error));
    } finally {
      setGeneratingScenes(false);
    }
  };

  const idleSceneImage = (sceneId: string) => {
    if (confirm('정말 초기화 하시겠습니까?')) {
      const placeIdle: GeneratedImage = {
        status: 'idle',
        sceneId,
        timestamp: Date.now(),
        confirmed: false,
      };
      setImagesByScene(prev => {
        const next = new Map(prev);
        next.set(sceneId, placeIdle);
        return next;
      });
    }
  };

  const handleGenerateImage = useCallback(
    async (sceneId: string, queue?: boolean) => {
      if (!queue) {
        if (!uploadedImage) {
          notify('참조 이미지를 선택해주세요.');
          return;
        }

        notify('장면에 대한 이미지를 생성합니다.');
      }

      // 1) pending placeholder 삽입
      const placeholder: GeneratedImage = {
        status: 'pending',
        sceneId,
        timestamp: Date.now(),
        confirmed: false,
      };
      setImagesByScene(prev => {
        const next = new Map(prev);
        next.set(sceneId, placeholder);
        return next;
      });

      const prompt = scenesState.byId.get(sceneId)?.imagePrompt;

      if (imageAiType === 'gemini') {
        try {
          const body = {
            globalStyle: globalStyle,
            prompt,
            imageBase64: uploadedImage?.base64,
            imageMimeType: uploadedImage?.mimeType,
            ratio: sourceRatio,
            resolution: sourceResolution,
          };

          const res = await fetch(`/api/image-gen/gemini/${sceneId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          });

          console.log(body);

          if (!res.ok) throw new Error('이미지 생성 실패');

          const json = await res.json();

          console.log(json);

          if (json.success) {
            setImagesByScene(prev => {
              const next = new Map(prev);
              next.set(sceneId, {
                status: 'succeeded',
                sceneId,
                dataUrl: `data:image/png;base64,${json.generatedImage}`,
                timestamp: Date.now(),
                confirmed: false,
              });
              console.log(next);
              return next;
            });
          } else {
            throw new Error('Failed to create Image, Please change Prompt.');
          }
        } catch (e) {
          setImagesByScene(prev => {
            const next = new Map(prev);
            next.set(sceneId, {
              status: 'failed',
              sceneId,
              timestamp: Date.now(),
              confirmed: false,
              error: `생성 실패 : ${e}`,
            });
            return next;
          });
        }
      }

      if (imageAiType === 'gpt') {
        try {
          const body = {
            globalStyle: globalStyle,
            prompt,
            imageUrl: uploadedImage?.dataUrl,
          };

          const res = await fetch(`/api/image-gen/gpt/${sceneId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          });

          if (!res.ok) throw new Error('이미지 생성 실패');

          const json = await res.json();

          console.log(json);

          if (json.output[0].result) {
            setImagesByScene(prev => {
              const next = new Map(prev);
              next.set(sceneId, {
                status: 'succeeded',
                sceneId,
                dataUrl: `data:image/png;base64,${json.output[0].result}`,
                timestamp: Date.now(),
                confirmed: false,
              });
              console.log(next);
              return next;
            });
          } else {
            throw new Error('Failed to create Image, Please change Prompt.');
          }
        } catch (e) {
          setImagesByScene(prev => {
            const next = new Map(prev);
            next.set(sceneId, {
              status: 'failed',
              sceneId,
              timestamp: Date.now(),
              confirmed: false,
              error: `생성 실패 : ${e}`,
            });
            return next;
          });
        }
      }
    },
    [
      scenesState.byId,
      uploadedImage,
      imageAiType,
      sourceRatio,
      sourceResolution,
    ]
  );

  const startImageQueue = useCallback(
    (intervalMs = 500) => {
      if (imageQueueTimerRef.current) return; // 이미 동작 중이면 무시

      imageQueueTimerRef.current = setInterval(() => {
        const nextId = imageQueueRef.current.shift();

        // 큐가 비면 종료
        if (!nextId) {
          clearInterval(imageQueueTimerRef.current!);
          imageQueueTimerRef.current = null;
          imageQueuedSetRef.current.clear();
          return;
        }

        // 응답 대기 없이 발사
        void handleGenerateImage(nextId, /* fromBatch */ true);
      }, intervalMs);
    },
    [handleGenerateImage]
  );

  const enqueueImageId = useCallback(
    (sceneId: string) => {
      // 진행 중이거나 이미 성공한 씬은 스킵
      const img = imagesByScene.get(sceneId);
      if (img && (img.status === 'pending' || img.status === 'succeeded'))
        return;

      // 중복 enque 방지
      if (imageQueuedSetRef.current.has(sceneId)) return;

      imageQueuedSetRef.current.add(sceneId);
      imageQueueRef.current.push(sceneId);
    },
    [imagesByScene]
  );

  const generateAllImages = useCallback(() => {
    if (!uploadedImage) {
      notify('참조 이미지를 먼저 선택해주세요.');
      return;
    }
    if (
      !confirm('모든 장면에 대한 이미지를 큐에 넣어 0.5초 간격으로 요청합니다.')
    ) {
      return;
    }

    // 순서대로 큐 적재
    for (const id of scenesState.order) {
      enqueueImageId(id);
    }

    // 드레인 시작 (응답은 기다리지 않음)
    startImageQueue(500);

    notify(`${imageQueueRef.current.length}건이 큐에 추가되었습니다.`);
  }, [uploadedImage, scenesState.order, enqueueImageId, startImageQueue]);

  const confirmImage = (sceneId: string) => {
    setImagesByScene(prev => {
      const img = prev.get(sceneId);
      if (!img) return prev;
      const next = new Map(prev);
      next.set(sceneId, { ...img, confirmed: !img.confirmed });
      return next;
    });
  };

  const confirmAllImages = () => {
    setImagesByScene(prev => {
      if (prev.size === 0) return prev;
      const next = new Map(prev);
      for (const [sceneId, img] of next) {
        if (!img.confirmed) next.set(sceneId, { ...img, confirmed: true });
      }
      return next;
    });
  };

  useEffect(() => {
    return () => {
      if (imageQueueTimerRef.current) {
        clearInterval(imageQueueTimerRef.current);
        imageQueueTimerRef.current = null;
      }
    };
  }, []);

  const idleSceneClip = async (sceneId: string) => {
    if (confirm('정말 초기화 하시겠습니까?')) {
      const placeIdle: GeneratedClip = {
        status: 'idle',
        sceneId,
        timestamp: Date.now(),
        confirmed: false,
      };

      const clipId = clipsByScene.get(sceneId)?.taskUrl;

      if (clipAiType === 'seedance') {
        try {
          const response = await fetch(`/api/seedance/${clipId}`, {
            method: 'DELETE',
            cache: 'no-store',
          });

          if (!response.ok) {
            throw new Error('Clip cancel failed');
          }

          console.log('Clip successfully cancelled', response);
        } catch (error) {
          console.error('token already consumed :', error);
        }
      }

      setClipsByScene(prev => {
        const next = new Map(prev);
        next.set(sceneId, placeIdle);
        return next;
      });
    }
  };

  const handleGenerateClip = useCallback(
    async (sceneId: string, aiType: 'kling' | 'seedance', queue?: boolean) => {
      const baseImage = imagesByScene.get(sceneId)?.dataUrl ?? '';

      if (!queue) {
        if (!baseImage || baseImage === '') {
          notify('클립이 될 이미지를 먼저 만들어주세요.');
          return;
        }

        if (!confirm('이전 클립은 삭제됩니다. 진행하시겠습니까?')) {
          return;
        }
      }
      // 1) pending placeholder 삽입
      const placeholder: GeneratedClip = {
        status: 'pending',
        sceneId,
        timestamp: Date.now(),
        confirmed: false,
      };
      setClipsByScene(prev => {
        const next = new Map(prev);
        next.set(sceneId, placeholder);
        return next;
      });

      const prompt = scenesState.byId.get(sceneId)?.clipPrompt;

      if (!prompt) return notify('프롬프트가 비었습니다.');

      // kling 요청 보내기
      if (aiType === 'kling') {
        try {
          const body = {
            duration: '5',
            image_base64: stripDataUrlPrefix(baseImage),
            prompt,
            negative_prompt: null,
            cfg_scale: 0.5,
            sourceRatio,
          };

          const response = await fetch(`/api/kling/clip-gen/${sceneId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          });

          console.log(body);

          if (!response.ok) throw new Error('이미지 생성 실패');

          const json = (await response.json()) as KlingImageToVideoResponse;

          console.log(json);

          if (json.code !== 0) throw new Error('이미지 생성 실패');

          setClipsByScene(prev => {
            const next = new Map(prev);
            next.set(sceneId, {
              status: 'queueing',
              taskUrl: json?.data?.task_id,
              sceneId,
              timestamp: Date.now(),
              confirmed: false,
            });
            console.log(next);
            return next;
          });
        } catch (error) {
          setClipsByScene(prev => {
            const next = new Map(prev);
            next.set(sceneId, {
              status: 'failed',
              sceneId,
              timestamp: Date.now(),
              confirmed: false,
              error: `생성 실패 : ${error}`,
            });
            return next;
          });
        }
      }

      // seedance 요청 보내기
      if (aiType === 'seedance') {
        try {
          const body = {
            prompt: buildClipPromptText(prompt),
            resolution: sourceResolution,
            ratio: sourceRatio,
            baseImage: baseImage,
            characterSheet: uploadedImage?.dataUrl,
          };

          const response = await fetch(`/api/seedance/clip-gen/${sceneId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          });

          console.log(body);

          const json = (await response.json()) as SeeDanceImageToVideoResponse;

          if (!json.id) throw new Error('이미지 생성 실패');

          console.log(json);

          setClipsByScene(prev => {
            const next = new Map(prev);
            next.set(sceneId, {
              status: 'queueing',
              taskUrl: json.id,
              sceneId,
              timestamp: Date.now(),
              confirmed: false,
            });
            console.log(next);
            return next;
          });
        } catch (error) {
          setClipsByScene(prev => {
            const next = new Map(prev);
            next.set(sceneId, {
              status: 'failed',
              sceneId,
              timestamp: Date.now(),
              confirmed: false,
              error: `생성 실패 : ${error}`,
            });
            return next;
          });
        }
      }
    },
    [imagesByScene, scenesState.byId]
  );

  const enqueueClipJob = useCallback(
    (job: ClipJob) => {
      // 이미 진행/대기/완료인 씬은 스킵
      const c = clipsByScene.get(job.sceneId);
      if (
        c &&
        (c.status === 'pending' ||
          c.status === 'queueing' ||
          c.status === 'succeeded')
      ) {
        return;
      }
      // 같은 sceneId 중복 enqueue 방지
      if (clipQueuedSetRef.current.has(job.sceneId)) return;

      clipQueuedSetRef.current.add(job.sceneId);
      clipQueueRef.current.push(job);
    },
    [clipsByScene]
  );

  const startClipQueue = useCallback(
    (intervalMs = 500) => {
      if (clipQueueTimerRef.current) return; // 이미 동작 중이면 무시

      clipQueueTimerRef.current = setInterval(() => {
        const next = clipQueueRef.current.shift();

        // 큐가 비면 정지 + 리셋
        if (!next) {
          clearInterval(clipQueueTimerRef.current!);
          clipQueueTimerRef.current = null;
          clipQueuedSetRef.current.clear();
          return;
        }

        // 응답 기다리지 않고 발사
        void handleGenerateClip(next.sceneId, next.aiType, /* queue */ true);
      }, intervalMs);
    },
    [handleGenerateClip]
  );

  const getClip = async ({
    sceneId,
    aiType,
  }: {
    sceneId: string;
    aiType: 'kling' | 'seedance';
  }) => {
    const clipId = clipsByScene.get(sceneId)?.taskUrl;

    if (aiType === 'kling') {
      try {
        const response = await fetch(`/api/kling/${clipId}`, {
          method: 'GET',
          cache: 'no-store',
        });

        if (!response.ok) {
          throw new Error(`Status ${response.status}`);
        }

        const json = (await response.json()) as KlingImageToVideoStatusResponse;

        console.log(json);

        if (json.data.task_status === 'processing') {
          return;
        }

        if (json.data.task_status === 'submitted') {
          return;
        }

        const videoUrl = json.data.task_result?.videos[0]?.url;

        if (videoUrl === undefined || json.message !== 'SUCCEED') {
          throw new Error('비디오 생성 실패');
        }

        setClipsByScene(prev => {
          const next = new Map(prev);
          next.set(sceneId, {
            status: 'succeeded',
            taskUrl: clipId,
            sceneId,
            dataUrl: videoUrl,
            timestamp: Date.now(),
            confirmed: false,
          });
          console.log(next);
          return next;
        });
      } catch (error) {
        setClipsByScene(prev => {
          const next = new Map(prev);
          next.set(sceneId, {
            status: 'failed',
            sceneId,
            timestamp: Date.now(),
            confirmed: false,
          });
          console.log(next);
          return next;
        });
        console.log(`kling get clip ERROR! : ${error}`);
      }
    }

    if (aiType === 'seedance') {
      try {
        const response = await fetch(`/api/seedance/${clipId}`, {
          method: 'GET',
          cache: 'no-store',
        });

        if (!response.ok) {
          throw new Error(`Status ${response.status}`);
        }

        const json = (await response.json()) as TaskResponse;

        if (json.status === 'failed' || json.status === 'cancled') {
          throw new Error(`AI Error : ${json.error}`);
        }

        if (json.status === 'queued') {
          notify('요청 대기 중 입니다.');
        }

        if (json.status === 'running') {
          notify('클립 생성 중 입니다.');
        }

        if (json.status === 'succeeded') {
          const videoUrl = json.content?.video_url ?? [];

          if (videoUrl === undefined) {
            throw new Error('클립 생성 실패');
          }

          setClipsByScene(prev => {
            const next = new Map(prev);
            next.set(sceneId, {
              status: 'succeeded',
              taskUrl: clipId,
              sceneId,
              dataUrl: videoUrl,
              timestamp: Date.now(),
              confirmed: false,
            });
            console.log(next);
            return next;
          });
        }
      } catch (error) {
        setClipsByScene(prev => {
          const next = new Map(prev);
          next.set(sceneId, {
            status: 'failed',
            sceneId,
            timestamp: Date.now(),
            confirmed: false,
          });
          console.log(next);
          return next;
        });
        console.log(`kling get clip ERROR! : ${error}`);
      }
    }
  };

  const generateAllClips = () => {
    if (imagesByScene.size < scenes.length) {
      notify('이미지를 먼저 만들어주세요.');
      return;
    }
    if (!confirm('이전 클립은 삭제됩니다. 진행하시겠습니까?')) return;
    if (
      !confirm(
        '모든 이미지를 클립으로 만듭니다. 큐에 넣고 0.5초 간격으로 요청합니다.'
      )
    )
      return;

    // 씬 순서대로 큐 적재 (이미지 없는 씬은 스킵)
    let enqueued = 0;
    for (const sceneId of scenesState.order) {
      const base = imagesByScene.get(sceneId)?.dataUrl;
      if (!base) continue; // 안전장치: base image 없는 씬은 제외
      enqueueClipJob({ sceneId, aiType: clipAiType });
      enqueued++;
    }

    if (enqueued === 0) {
      notify(
        '큐에 넣을 항목이 없습니다. (이미지 없음 또는 클립이 이미 진행/완료 상태)'
      );
      return;
    }

    // 3) 드레인 시작 (응답 대기 없이 발사)
    startClipQueue(500);
    notify(`${enqueued}개가 큐에 추가되었습니다.`);
  };

  const confirmClip = (sceneId: string) => {
    setClipsByScene(prev => {
      const clip = prev.get(sceneId);
      if (!clip) return prev;
      const next = new Map(prev);
      next.set(sceneId, { ...clip, confirmed: !clip.confirmed });
      return next;
    });
  };

  const confirmAllClips = () => {
    setClipsByScene(prev => {
      if (prev.size === 0) return prev;
      const next = new Map(prev);
      for (const [sceneId, clip] of next) {
        if (!clip.confirmed) next.set(sceneId, { ...clip, confirmed: true });
      }
      return next;
    });
  };

  useEffect(() => {
    return () => {
      if (clipQueueTimerRef.current) {
        clearInterval(clipQueueTimerRef.current);
        clipQueueTimerRef.current = null;
      }
    };
  }, []);

  /* ============ Audio: Narration ============ */
  const handleGenerateNarration = async () => {
    if (!script.trim()) return notify('먼저 스크립트를 입력해주세요.');
    setGeneratingNarration(true);
    await new Promise(r => setTimeout(r, 1500 + Math.random() * 2000)); // stub
    const newNarration: GeneratedNarration = {
      id: nowId('narration'),
      url: `/placeholder.svg?height=100&width=300&query=audio-waveform`,
      duration: Math.floor(script.length / 10) + 30,
      settings: { ...narrationSettings },
      confirmed: false,
    };
    setNarration(newNarration);
    setGeneratingNarration(false);
    setCurrentTime(0);
    setIsPlaying(false);
    notify(`${newNarration.duration}초 나레이션이 생성되었습니다.`);
  };

  const togglePlay = () => {
    if (!narration) return;
    if (isPlaying) {
      if (playTimerRef.current) clearInterval(playTimerRef.current);
      setIsPlaying(false);
      return;
    }
    setIsPlaying(true);
    playTimerRef.current = setInterval(() => {
      setCurrentTime(prev => {
        if (!narration) return 0;
        if (prev >= narration.duration) {
          if (playTimerRef.current) clearInterval(playTimerRef.current);
          setIsPlaying(false);
          return 0;
        }
        return prev + 1;
      });
    }, 1000);
  };

  const downloadNarration = () => {
    if (!narration) return;
    const blob = new Blob(['AI 생성 나레이션 오디오 파일'], {
      type: 'audio/mp3',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'narration.mp3';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    notify('나레이션 파일이 다운로드되었습니다.');
  };

  const confirmNarration = () => {
    if (!narration) return;
    setNarration({ ...narration, confirmed: true });
    notify('나레이션이 확정되었습니다.');
  };

  /* ============ Global actions ============ */
  const resetAll = () => {
    if (confirm('초기화 하시겠습니까?')) {
      setScenesState({ byId: new Map(), order: [] });
      setImagesByScene(new Map());
      setClipsByScene(new Map());
      setNarration(null);
      setCurrentSceneId(null);
      setCurrentTime(0);
      setIsPlaying(false);
      notify('모든 진행 상황이 초기화되었습니다.');
    }
  };

  const openHelp = () => notify('AI 영상을 한 플랫폼에서 시작해보세요.');

  // 페이지 튕김 방지
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!script && scenesState.byId.size === 0) return;
      event.preventDefault();
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [script, scenesState.byId.size]);

  /* ============ render ============ */
  return (
    <div className='min-h-screen bg-background'>
      <HeaderBar
        onBack={() => router.replace('/')}
        onEditScript={handleEditScript}
        status={status}
        zipDownloading={zipDownloading}
        onZip={handleZipDownload}
      />

      <main className='container mx-auto px-4 py-6'>
        <div className='grid grid-cols-1 gap-6 mb-2'>
          <VisualPipeline
            step={step}
            setStep={setStep}
            // scenes
            scenes={deferredScenes}
            generatingScenes={generatingScenes}
            onGenerateScenes={handleGenerateScenes}
            onConfirmScene={confirmScene}
            onConfirmAllScenes={confirmAllScenes}
            isConfirmedAllScenes={allConfirmed}
            onEditScene={id => {
              setEditingScene(id);
              setCurrentSceneId(id);
            }}
            editingScene={editingScene}
            // images
            images={imagesByScene}
            uploadRefImage={setUploadedImage}
            onGenerateImage={handleGenerateImage}
            onGenerateAllImages={generateAllImages}
            onConfirmImage={confirmImage}
            onConfirmAllImages={confirmAllImages}
            isConfirmedAllImage={allImagesConfirmed}
            setIdleSceneImage={idleSceneImage}
            // clips
            clips={clipsByScene}
            onGenerateClip={handleGenerateClip}
            onGenerateAllClips={generateAllClips}
            onConfirmClip={confirmClip}
            onConfirmAllClips={confirmAllClips}
            onQueueAction={getClip}
            setIdleSceneClip={idleSceneClip}
          />
        </div>

        <div className='space-y-6'>
          <SceneRail
            scenes={deferredScenes}
            images={imagesByScene}
            clips={clipsByScene}
            currentSceneId={currentSceneId}
            onSelect={setCurrentSceneId}
          />
          <SceneCanvas
            step={step as 0 | 1 | 2}
            scene={currentScene}
            setScenesState={setScenesState}
            images={imagesByScene}
            clips={clipsByScene}
            onConfirmScene={confirmScene}
            onGenerateImage={handleGenerateImage}
            onConfirmImage={confirmImage}
            onGenerateClip={handleGenerateClip}
            onConfirmClip={confirmClip}
          />

          {step === 0 && (
            <div className='flex items-center gap-2'>
              <Button
                variant='outline'
                onClick={handleGenerateScenes}
                disabled={generatingScenes}
              >
                {generatingScenes ? (
                  <>
                    <RefreshCw className='w-4 h-4 mr-2 animate-spin' /> 장면
                    생성 중
                  </>
                ) : (
                  '장면 쪼개기'
                )}
              </Button>
              <Button variant='outline' onClick={confirmAllScenes}>
                모든 장면 확정
              </Button>
            </div>
          )}
        </div>
      </main>

      <div
        className={[
          'fixed right-0 top-0 z-50 h-full',
          'w-[420px] sm:w-[480px]',
          'border-l border-border bg-card shadow-xl',
          'transition-transform duration-300 ease-in-out',
          audioOpen
            ? 'translate-x-0'
            : 'translate-x-[calc(100%+40px-var(--handle))]',
        ].join(' ')}
        style={{ ['--handle' as any]: `${HANDLE_W}px` }}
      >
        <div className='relative h-full'>
          {/* 패널 손잡이 */}
          <button
            type='button'
            onClick={() => setAudioOpen(o => !o)}
            aria-label={
              audioOpen ? '청각 파이프라인 닫기' : '청각 파이프라인 열기'
            }
            aria-expanded={audioOpen}
            className={[
              'group absolute top-1/2 -translate-y-1/2',
              '-left-[var(--handle)]',
              'h-28 w-[var(--handle)]',
              'rounded-l-md rounded-r-none',
              'bg-primary text-primary-foreground',
              'shadow-lg hover:brightness-110 active:scale-[0.98]',
              'flex items-center justify-center',
              'transition-all duration-200',
            ].join(' ')}
          >
            <div className='flex flex-col items-center gap-2'>
              <Mic className='h-5 w-5' />
              <span className='text-[10px] tracking-widest rotate-180 [writing-mode:vertical-rl]'>
                AUDIO
              </span>
            </div>
          </button>

          {/* 패널 본문 */}
          <div className='h-full flex flex-col'>
            <div className='px-4 py-5 border-b border-border'>
              <h3 className='text-lg font-semibold'>AUDIO PANEL</h3>
            </div>
            <div className='flex-1 overflow-y-auto p-4'>
              <NarrationPanel
                scriptPresent={!!script}
                narration={narration}
                settings={narrationSettings}
                setSettings={s => setNarrationSettings(s)}
                generating={generatingNarration}
                isPlaying={isPlaying}
                currentTime={currentTime}
                onGenerate={handleGenerateNarration}
                onPlayPause={togglePlay}
                onDownload={downloadNarration}
                onConfirm={confirmNarration}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className='border-t border-border sticky bottom-0 z-10 bg-card mt-auto'>
        <div className='container mx-auto px-4 py-4'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-2'>
              <Button
                variant='ghost'
                size='sm'
                onClick={resetAll}
                className='gap-2'
              >
                <RotateCcw className='w-4 h-4' />
                초기화
              </Button>
              <Button
                variant='ghost'
                size='sm'
                onClick={openHelp}
                className='gap-2'
              >
                <HelpCircle className='w-4 h-4' />
                도움말
              </Button>

              <Button onClick={() => applyScenes(tempScenes)}>
                장면 임시 만들기
              </Button>
            </div>

            <div className='text-sm text-muted-foreground mr-8'>
              {script ? `스크립트: ${script.length}자` : '스크립트 없음'}
            </div>
          </div>
        </div>
      </footer>

      {/* Confirm dialog (reset) */}
      <ResetDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        message={confirmMessage}
        onCancel={cancelPending}
        onConfirm={runPending}
      />

      {/* Script edit dialog */}
      <ScriptEditDialog
        open={editingScriptOpen}
        tempScript={tempScript}
        setTempScript={setTempScript}
        onCancel={() => {
          setEditingScriptOpen(false);
          setTempScript('');
        }}
        onSave={saveScriptChange}
      />

      <ConfigModal />
    </div>
  );
}
