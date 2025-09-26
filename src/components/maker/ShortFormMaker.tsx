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
import { HelpCircle, Mic, RotateCcw } from 'lucide-react';
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
} from '../../app/api/seedance/clip-gen/[id]/route';
import { KlingImageToVideoResponse } from '../../app/api/kling/clip-gen/[id]/route';
import { KlingImageToVideoStatusResponse } from '../../app/api/kling/[id]/route';
import { useAIConfigStore } from '@/lib/maker/useAiConfigStore';
import ConfigModal from '@/components/maker/ConfigModal';
import { buildClipPromptText } from '@/lib/maker/clipPromptBuilder';
import { useAuthStore } from '@/lib/shared/useAuthStore';
import { reportUsage } from '@/lib/shared/usage';

type ClipJob = { sceneId: string; aiType: 'kling' | 'seedance' };

export const ShortFormMaker = () => {
  const router = useRouter();
  const user = useAuthStore(s => s.tokenUsage);

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
  const [selectedSceneIds, setSelectedSceneIds] = useState<Set<string>>(
    new Set()
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
    { stability: 50, model: 'jB1Cifc2UQbq1gR3wnb0' }
  );
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const HANDLE_W = 40;
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const narrationObjectUrlRef = useRef<string | null>(null);

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

  const allClipsConfirmed = status.clips === scenes.length;

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
  const extFromMime = (type?: string) => {
    if (!type) return 'bin';
    const t = type.toLowerCase();
    if (t.includes('png')) return 'png';
    if (t.includes('jpeg') || t.includes('jpg')) return 'jpg';
    if (t.includes('webp')) return 'webp';
    if (t.includes('gif')) return 'gif';
    if (t.includes('mp4')) return 'mp4';
    if (t.includes('webm')) return 'webm';
    if (t.includes('quicktime') || t.includes('mov')) return 'mov';
    if (t.includes('audio/mpeg') || t.includes('mpeg')) return 'mp3';
    if (t.includes('audio/wav') || t.includes('x-wav') || t.includes('wave'))
      return 'wav';
    if (t.includes('audio/ogg') || t.includes('application/ogg')) return 'ogg';
    if (t.includes('audio/webm')) return 'webm';
    if (t.includes('audio/mp4') || t.includes('m4a') || t.includes('aac'))
      return 'm4a';
    return 'bin';
  };

  const buildProxyUrl = (
    srcUrl: string,
    opts?: { mode?: 'view' | 'download'; filename?: string }
  ) => {
    const u = new URL('/api/proxy', window.location.origin);
    u.searchParams.set('url', srcUrl);
    if (opts?.mode) u.searchParams.set('mode', opts.mode);
    if (opts?.filename) u.searchParams.set('filename', opts.filename);
    return u.toString();
  };

  const blobFromUrlOrDataUrl = async (url: string): Promise<Blob> => {
    if (url.startsWith('data:')) {
      const res = await fetch(url);
      return await res.blob();
    }

    try {
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) throw new Error(`Status ${res.status}`);
      return await res.blob();
    } catch {
      const proxied = buildProxyUrl(url, { mode: 'download' });
      const res2 = await fetch(proxied, { cache: 'no-store' });
      if (!res2.ok) throw new Error(`Proxy status ${res2.status}`);
      return await res2.blob();
    }
  };

  const pad2 = (n: number) => {
    return String(n).padStart(2, '0');
  };

  const handleZipDownload = async () => {
    setZipDownloading(true);
    try {
      const okImages = Array.from(imagesByScene.entries()).filter(
        ([, img]) => img.status === 'succeeded' && !!img.dataUrl
      );
      const okClips = Array.from(clipsByScene.entries()).filter(
        ([, clip]) => clip.status === 'succeeded' && !!clip.dataUrl
      );

      const hasNarration = !!(narration && narration.url);

      if (okImages.length === 0 && okClips.length === 0 && !hasNarration) {
        notify('다운로드할 완료된 이미지/클립/나레이션이 없습니다.');
        return;
      }

      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();

      const imagesFolder = zip.folder('images');
      const clipsFolder = zip.folder('clips');
      const audioFolder = zip.folder('audio');

      const indexOf = (sceneId: string) =>
        Math.max(0, scenesState.order.indexOf(sceneId));

      await Promise.all(
        okImages.map(async ([sceneId, img]) => {
          const blob = await blobFromUrlOrDataUrl(img.dataUrl!);
          const ext = extFromMime(blob.type) || 'png';
          const idx = indexOf(sceneId);
          const filename = `scene-${pad2(idx + 1)}-${sceneId}.${ext}`;
          imagesFolder!.file(filename, await blob.arrayBuffer());
        })
      );

      await Promise.all(
        okClips.map(async ([sceneId, clip]) => {
          const blob = await blobFromUrlOrDataUrl(clip.dataUrl!);
          const ext = extFromMime(blob.type) || 'mp4';
          const idx = indexOf(sceneId);
          const filename = `scene-${pad2(idx + 1)}-${sceneId}.${ext}`;
          clipsFolder!.file(filename, await blob.arrayBuffer());
        })
      );

      let narrationMeta: {
        present: boolean;
        confirmed?: boolean;
        duration?: number;
        settings?: any;
        mimeType?: string;
        sizeBytes?: number;
        filename?: string;
      } = { present: false };

      if (hasNarration) {
        try {
          const nBlob = await blobFromUrlOrDataUrl(narration!.url);
          const nExt = extFromMime(nBlob.type) || 'mp3';
          const nFile = `narration.${nExt}`;
          audioFolder!.file(nFile, await nBlob.arrayBuffer());

          narrationMeta = {
            present: true,
            confirmed: narration!.confirmed,
            duration: narration!.duration,
            settings: narration!.settings ?? null,
            mimeType: nBlob.type || (null as any),
            sizeBytes: nBlob.size,
            filename: `audio/${nFile}`,
          };
        } catch (e) {
          narrationMeta = {
            present: false,
          };
          console.warn('Failed to add narration to zip:', e);
        }
      }

      const manifest = {
        generatedAt: new Date().toISOString(),
        summary: {
          scenesTotal: scenesState.byId.size,
          imagesSucceeded: okImages.length,
          clipsSucceeded: okClips.length,
          narrationIncluded: narrationMeta.present,
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
        narration: narrationMeta,
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
    allConfirmed
      ? setScenesState(prev => {
          if (prev.byId.size === 0) return prev;
          const byId = new Map(prev.byId);
          for (const [id, s] of byId.entries()) {
            byId.set(id, { ...s, confirmed: false });
          }
          return { ...prev, byId };
        })
      : setScenesState(prev => {
          if (prev.byId.size === 0) return prev;
          const byId = new Map(prev.byId);
          for (const [id, s] of byId.entries()) {
            byId.set(id, { ...s, confirmed: true });
          }
          return { ...prev, byId };
        });

  const insertNewScene = useCallback((index: number) => {
    const newScene: Scene = {
      id: nowId(`added-scene-${index}`),
      originalText: '',
      englishPrompt: '',
      sceneExplain: '',
      koreanSummary: '',
      imagePrompt: {
        intent: '',
        img_style: '',
        camera: {
          shot_type: '',
          angle: '',
          focal_length: '',
        },
        subject: {
          pose: '',
          expression: '',
          gaze: '',
          hands: '',
        },
        lighting: {
          key: '',
          mood: '',
        },
        background: {
          location: '',
          dof: '',
          props: '',
          time: '',
        },
      },
      clipPrompt: {
        intent: '',
        img_message: '',
        background: {
          location: '',
          props: '',
          time: '',
        },
        camera_motion: {
          type: '',
          easing: '',
        },
        subject_motion: [
          {
            time: '',
            action: '',
          },
        ],
        environment_motion: [
          {
            type: '',
            action: '',
          },
        ],
      },
      confirmed: false,
    };

    setScenesState(prev => {
      const byId = new Map(prev.byId);
      byId.set(newScene.id, newScene);

      const order = [...prev.order];
      const idx = Math.max(0, Math.min(index, order.length));
      order.splice(idx, 0, newScene.id);

      return { byId, order };
    });

    setCurrentSceneId(newScene.id);
    setEditingScene(newScene.id);
    notify('새 장면이 추가되었습니다.');
  }, []);

  const insertSceneAfter = useCallback(
    (targetId: string) => {
      const insertOrder = scenesState.order.indexOf(targetId);
      if (insertOrder < 0) {
        notify('잘못된 대상입니다.');
        return;
      }
      insertNewScene(insertOrder + 1);
    },
    [scenesState.order, insertNewScene]
  );

  const removeScene = useCallback(
    async (sceneId: string) => {
      if (!confirm(`장면 ${sceneId}를 정말 삭제하시겠습니까?`)) {
        return;
      }

      if (!scenesState.byId.has(sceneId)) return;

      const idx = scenesState.order.indexOf(sceneId);
      const nextId =
        scenesState.order[idx + 1] ?? scenesState.order[idx - 1] ?? null;

      const clip = clipsByScene.get(sceneId);

      if (
        clip?.taskUrl &&
        (clip.status === 'pending' || clip.status === 'queueing')
      ) {
        if (clipAiType === 'seedance') {
          try {
            await fetch(`/api/seedance/${clip.taskUrl}`, {
              method: 'DELETE',
              cache: 'no-store',
            });
          } catch (e) {
            console.error('seedance cancel failed:', e);
          }
        }
      }

      imageQueuedSetRef.current.delete(sceneId);
      imageQueueRef.current = imageQueueRef.current.filter(
        id => id !== sceneId
      );
      clipQueuedSetRef.current.delete(sceneId);
      clipQueueRef.current = clipQueueRef.current.filter(
        job => job.sceneId !== sceneId
      );

      setScenesState(prev => {
        const byId = new Map(prev.byId);
        byId.delete(sceneId);
        const order = prev.order.filter(id => id !== sceneId);
        return { byId, order };
      });

      setImagesByScene(prev => {
        if (!prev.has(sceneId)) return prev;
        const next = new Map(prev);
        next.delete(sceneId);
        return next;
      });

      setClipsByScene(prev => {
        if (!prev.has(sceneId)) return prev;
        const next = new Map(prev);
        next.delete(sceneId);
        return next;
      });

      if (currentSceneId === sceneId) setCurrentSceneId(nextId);
      if (editingScene === sceneId) setEditingScene(nextId);

      notify('장면이 삭제되었습니다.');
    },
    [
      scenesState.byId,
      scenesState.order,
      clipsByScene,
      clipAiType,
      currentSceneId,
      editingScene,
    ]
  );

  // 현재 씬
  const currentScene = useMemo(
    () =>
      currentSceneId ? scenesState.byId.get(currentSceneId) ?? null : null,
    [scenesState, currentSceneId]
  );

  const toggleSelectScene = (sceneId: string) => {
    setSelectedSceneIds(prev => {
      const next = new Set(prev);
      if (next.has(sceneId)) next.delete(sceneId);
      else next.add(sceneId);
      return next;
    });
  };

  const when = <T extends object>(cond: boolean, extra: T) =>
    cond ? extra : ({} as Partial<T>);

  /* ============ Visual: Scenes / Images / Clips ============ */
  const handleGenerateScenes = async () => {
    if (!script.trim()) return notify('먼저 스크립트를 입력해주세요.');
    if (
      !confirm(
        '기존 장면 프롬프트는 초기화 됩니다. \n스크립트를 장면으로 분해 하시겠습니까?'
      )
    )
      return;

    let tokenUsage;

    try {
      setGeneratingScenes(true);
      const res = await fetch('/api/scenes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ script, customRule, globalStyle }),
      });
      if (!res.ok) {
        const { error } = await res.json();
        throw new Error(error ?? '생성 실패');
      }
      const { text, usage }: { text: Scene[]; usage: number } =
        await res.json();
      applyScenes(text);
      console.log(text);
      notify(`${text.length}개의 장면이 생성되었습니다.`);
      tokenUsage = usage;
    } catch (error) {
      notify(String(error));
    } finally {
      setGeneratingScenes(false);
      await reportUsage('allScene', tokenUsage!, 1);
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
    async (sceneId: string, queue?: boolean, opts?: { selected?: boolean }) => {
      const isSelected = !!opts?.selected;

      if (!queue) {
        if (!uploadedImage) {
          notify('참조 이미지를 선택해주세요.');
          return;
        }

        notify('장면에 대한 이미지를 생성합니다.');
      }

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

      if (isSelected) {
        let tokenUsage;
        try {
          const body = {
            globalStyle: globalStyle,
            prompt,
            imageUrl: uploadedImage?.dataUrl,
            ratio: sourceRatio,
            resolution: sourceResolution,
            noCharacter: true,
          };

          const res = await fetch(`/api/image-gen/gpt/${sceneId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          });

          if (!res.ok) throw new Error('이미지 생성 실패');

          const { response, token } = await res.json();

          tokenUsage = token;

          console.log(response);

          if (response.output[0].result) {
            setImagesByScene(prev => {
              const next = new Map(prev);
              next.set(sceneId, {
                status: 'succeeded',
                sceneId,
                dataUrl: `data:image/png;base64,${response.output[0].result}`,
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
        } finally {
          await reportUsage('imageGPT', tokenUsage, 1);
        }
        return;
      }

      if (imageAiType === 'gemini') {
        let token;
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

          token = json.tokenUsage;

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
        } finally {
          await reportUsage('imageGemini', token, 1);
        }
        return;
      }

      if (imageAiType === 'gpt') {
        let tokenUsage;
        try {
          const body = {
            globalStyle: globalStyle,
            prompt,
            imageUrl: uploadedImage?.dataUrl,
            ratio: sourceRatio,
            resolution: sourceResolution,
            noCharacter: false,
          };

          const res = await fetch(`/api/image-gen/gpt/${sceneId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          });

          if (!res.ok) throw new Error('이미지 생성 실패');

          const { response, token } = await res.json();

          tokenUsage = token;

          console.log(response);

          if (response.output[0].result) {
            setImagesByScene(prev => {
              const next = new Map(prev);
              next.set(sceneId, {
                status: 'succeeded',
                sceneId,
                dataUrl: `data:image/png;base64,${response.output[0].result}`,
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
        } finally {
          await reportUsage('imageGPT', tokenUsage, 1);
        }
        return;
      }
    },
    [
      globalStyle,
      scenesState.byId,
      uploadedImage,
      imageAiType,
      sourceRatio,
      sourceResolution,
    ]
  );

  const startImageQueue = useCallback(
    (intervalMs = 500) => {
      if (imageQueueTimerRef.current) return;

      imageQueueTimerRef.current = setInterval(() => {
        const nextId = imageQueueRef.current.shift();

        if (!nextId) {
          clearInterval(imageQueueTimerRef.current!);
          imageQueueTimerRef.current = null;
          imageQueuedSetRef.current.clear();
          return;
        }

        const isSelected = selectedSceneIds.has(nextId);
        void handleGenerateImage(nextId, true, { selected: isSelected });
      }, intervalMs);
    },
    [handleGenerateImage, selectedSceneIds]
  );

  const enqueueImageId = useCallback(
    (sceneId: string) => {
      const img = imagesByScene.get(sceneId);
      if (img && img.status === 'pending') return;

      if (imageQueuedSetRef.current.has(sceneId)) return;

      imageQueuedSetRef.current.add(sceneId);
      imageQueueRef.current.push(sceneId);
    },
    [imagesByScene]
  );

  const generateMultiImages = useCallback(() => {
    if (!uploadedImage) {
      notify('참조 이미지를 먼저 선택해주세요.');
      return;
    }

    const allIds = scenesState.order;
    if (allIds.length === 0) {
      notify('장면이 없습니다.');
      return;
    }

    const confirmedSceneIds = allIds.filter(
      id => scenesState.byId.get(id)?.confirmed
    );
    if (confirmedSceneIds.length === 0) {
      notify('확정된 장면이 없습니다. 장면을 먼저 확정해주세요.');
      return;
    }

    let targets: string[];
    if (confirmedSceneIds.length === allIds.length) {
      if (!confirm(`모든 장면, ${allIds.length}개에 대해 이미지를 생성합니다.`))
        return;
      targets = allIds;
    } else {
      // 일부만 확정: 확인=선택 생성(확정만), 취소=전체 생성(전체)
      const useOnlyConfirmed = confirm(
        `선택된 장면, ${confirmedSceneIds.length}개의 이미지를 생성합니다.`
      );
      targets = useOnlyConfirmed ? confirmedSceneIds : [];
    }

    if (targets.length === 0) {
      return;
    }

    let enqueued = 0;
    for (const id of targets) {
      enqueueImageId(id);
      enqueued++;
    }

    if (enqueued === 0) {
      notify('큐에 넣을 항목이 없습니다.');
      return;
    }

    startImageQueue(500);
    notify(`${enqueued}건이 이미지 큐에 추가되었습니다.`);
  }, [
    uploadedImage,
    scenesState.order,
    scenesState.byId,
    enqueueImageId,
    startImageQueue,
  ]);

  const confirmImage = (sceneId: string) => {
    setImagesByScene(prev => {
      const img = prev.get(sceneId);
      if (!img) return prev;
      const next = new Map(prev);
      next.set(sceneId, { ...img, confirmed: !img.confirmed });
      return next;
    });
  };

  const confirmAllImages = () =>
    allImagesConfirmed
      ? setImagesByScene(prev => {
          if (prev.size === 0) return prev;
          const next = new Map(prev);
          for (const [sceneId, img] of next) {
            next.set(sceneId, { ...img, confirmed: false });
          }
          return next;
        })
      : setImagesByScene(prev => {
          if (prev.size === 0) return prev;
          const next = new Map(prev);
          for (const [sceneId, img] of next) {
            if (!img.confirmed) next.set(sceneId, { ...img, confirmed: true });
          }
          return next;
        });

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

      if (aiType === 'seedance') {
        try {
          const body = {
            prompt: buildClipPromptText(prompt),
            resolution: sourceResolution,
            ratio: sourceRatio,
            baseImage: baseImage,
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
      const c = clipsByScene.get(job.sceneId);
      if (
        c &&
        (c.status === 'pending' ||
          c.status === 'queueing' ||
          c.status === 'succeeded')
      ) {
        return;
      }
      if (clipQueuedSetRef.current.has(job.sceneId)) return;

      clipQueuedSetRef.current.add(job.sceneId);
      clipQueueRef.current.push(job);
    },
    [clipsByScene]
  );

  const startClipQueue = useCallback(
    (intervalMs = 500) => {
      if (clipQueueTimerRef.current) return;

      clipQueueTimerRef.current = setInterval(() => {
        const next = clipQueueRef.current.shift();

        if (!next) {
          clearInterval(clipQueueTimerRef.current!);
          clipQueueTimerRef.current = null;
          clipQueuedSetRef.current.clear();
          return;
        }

        void handleGenerateClip(next.sceneId, next.aiType, true);
      }, intervalMs);
    },
    [handleGenerateClip]
  );

  const getClip = async ({
    sceneId,
    aiType,
    polling,
  }: {
    sceneId: string;
    aiType: 'kling' | 'seedance';
    polling?: boolean;
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
          notify('클립 생성 중 입니다.');
          return;
        }

        if (json.data.task_status === 'submitted') {
          notify('클립 생성 요청 중 입니다.');
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

          const tokenUsage = json.usage?.total_tokens ?? 0;

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
          await reportUsage('clipSeedance', tokenUsage, 1);
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

  const generateMultiClips = useCallback(() => {
    const allIds = scenesState.order;
    if (allIds.length === 0) {
      notify('장면이 없습니다.');
      return;
    }

    const allValidWithImage = allIds.filter(
      id => !!imagesByScene.get(id)?.dataUrl
    );
    if (allValidWithImage.length === 0) {
      notify('클립을 만들 이미지가 없습니다. 먼저 이미지를 생성하세요.');
      return;
    }

    const confirmedImageIds = allValidWithImage.filter(id => {
      const img = imagesByScene.get(id);
      return !!img?.dataUrl && img?.confirmed;
    });

    if (!confirm('이전 클립은 삭제됩니다. 진행하시겠습니까?')) {
      return;
    }

    let targets: string[];
    if (allClipsConfirmed) {
      if (
        !confirm(
          `모든 이미지, ${confirmedImageIds.length}개의 클립을 생성합니다.`
        )
      )
        return;
      targets = confirmedImageIds;
    } else {
      const useOnlyConfirmed = confirm(
        `확정된 이미지, ${confirmedImageIds.length}개의 클립을 생성합니다.`
      );
      targets = useOnlyConfirmed ? confirmedImageIds : [];
    }

    if (targets.length === 0) {
      return;
    }

    let enqueued = 0;
    for (const id of targets) {
      enqueueClipJob({ sceneId: id, aiType: clipAiType });
      enqueued++;
    }

    if (enqueued === 0) {
      notify('큐에 넣을 항목이 없습니다.');
      return;
    }

    startClipQueue(500);
    notify(`${enqueued}개가 클립 큐에 추가되었습니다.`);
  }, [
    allClipsConfirmed,
    scenesState.order,
    imagesByScene,
    enqueueClipJob,
    startClipQueue,
    clipAiType,
  ]);

  const confirmClip = (sceneId: string) => {
    setClipsByScene(prev => {
      const clip = prev.get(sceneId);
      if (!clip) return prev;
      const next = new Map(prev);
      next.set(sceneId, { ...clip, confirmed: !clip.confirmed });
      return next;
    });
  };

  const confirmAllClips = () =>
    allClipsConfirmed
      ? setClipsByScene(prev => {
          if (prev.size === 0) return prev;
          const next = new Map(prev);
          for (const [sceneId, clip] of next) {
            next.set(sceneId, { ...clip, confirmed: false });
          }
          return next;
        })
      : setClipsByScene(prev => {
          if (prev.size === 0) return prev;
          const next = new Map(prev);
          for (const [sceneId, clip] of next) {
            if (!clip.confirmed)
              next.set(sceneId, { ...clip, confirmed: true });
          }
          return next;
        });

  useEffect(() => {
    return () => {
      if (clipQueueTimerRef.current) {
        clearInterval(clipQueueTimerRef.current);
        clipQueueTimerRef.current = null;
      }
    };
  }, []);

  /* ============ Audio: Narration ============ */
  const replaceObjectUrl = (url: string) => {
    if (narrationObjectUrlRef.current) {
      try {
        URL.revokeObjectURL(narrationObjectUrlRef.current);
      } catch {}
    }
    narrationObjectUrlRef.current = url;
  };

  const ensureAudio = () => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.addEventListener('play', () => setIsPlaying(true));
      audioRef.current.addEventListener('pause', () => setIsPlaying(false));
      audioRef.current.addEventListener('timeupdate', () => {
        setCurrentTime(Math.floor(audioRef.current!.currentTime || 0));
      });
      audioRef.current.addEventListener('ended', () => {
        setIsPlaying(false);
        setCurrentTime(0);
      });
    }
    return audioRef.current;
  };

  const handleGenerateNarration = async () => {
    if (!script.trim()) return notify('먼저 스크립트를 입력해주세요.');
    setGeneratingNarration(true);

    try {
      const res = await fetch('/api/narration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          voiceId: narrationSettings.model,
          text: script,
          stability: narrationSettings?.stability
            ? Math.max(0, Math.min(1, narrationSettings.stability / 100))
            : 0.5,
        }),
      });

      if (!res.ok) {
        let msg = '나레이션 생성에 실패했습니다.';
        try {
          const j = await res.json();
          msg = j?.error || msg;
        } catch {}
        throw new Error(msg);
      }

      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);

      const probe = new Audio();
      const duration = await new Promise<number>((resolve, reject) => {
        probe.src = objectUrl;
        probe.addEventListener(
          'loadedmetadata',
          () => {
            resolve(Math.max(1, Math.floor(probe.duration || 0)));
          },
          { once: true }
        );
        probe.addEventListener(
          'error',
          () => reject(new Error('오디오 메타데이터 로딩 실패')),
          { once: true }
        );
      });

      replaceObjectUrl(objectUrl);

      const newNarration: GeneratedNarration = {
        id: nowId('narration'),
        url: objectUrl,
        duration,
        settings: { ...narrationSettings },
        confirmed: false,
      };
      setNarration(newNarration);

      const audio = ensureAudio();
      audio.src = objectUrl;
      audio.currentTime = 0;

      setCurrentTime(0);
      setIsPlaying(false);
      notify(`${duration}초 나레이션이 생성되었습니다.`);
    } catch (e: any) {
      console.error(e);
      notify(e?.message ?? '나레이션 생성 중 오류가 발생했습니다.');
    } finally {
      setGeneratingNarration(false);
    }
  };

  const togglePlay = () => {
    if (!narration?.url) return notify('나레이션이 없습니다.');
    const audio = ensureAudio();

    if (audio.src !== narration.url) {
      audio.src = narration.url;
      audio.currentTime = currentTime || 0;
    }

    if (audio.paused) {
      audio.currentTime = currentTime || 0;
      void audio.play();
    } else {
      audio.pause();
    }
  };

  const seekNarration = (sec: number) => {
    if (!narration) return;
    const audio = ensureAudio();
    if (audio.src !== narration.url) {
      audio.src = narration.url;
    }
    const clamped = Math.max(0, Math.min(sec, narration.duration));
    audio.currentTime = clamped;
    setCurrentTime(Math.floor(clamped));
  };

  const downloadNarration = () => {
    if (!narration?.url) return;
    const a = document.createElement('a');
    a.href = narration.url;
    a.download = 'narration.mp3';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    notify('나레이션 파일이 다운로드되었습니다.');
  };

  const confirmNarration = () => {
    if (!narration) return;
    setNarration({ ...narration, confirmed: true });
    notify('나레이션이 확정되었습니다.');
  };

  useEffect(() => {
    return () => {
      try {
        audioRef.current?.pause();
      } catch {}
      if (narrationObjectUrlRef.current) {
        try {
          URL.revokeObjectURL(narrationObjectUrlRef.current);
        } catch {}
        narrationObjectUrlRef.current = null;
      }
    };
  }, []);

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
      <Button
        onClick={() => {
          console.log(scenesState);
          console.log(user);
        }}
      >
        테스트
      </Button>

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
            addScene={insertSceneAfter}
            removeScene={removeScene}
            selected={selectedSceneIds}
            setSelected={toggleSelectScene}
            // images
            images={imagesByScene}
            uploadRefImage={setUploadedImage}
            onGenerateImage={handleGenerateImage}
            onGenerateAllImages={generateMultiImages}
            onConfirmImage={confirmImage}
            onConfirmAllImages={confirmAllImages}
            isConfirmedAllImage={allImagesConfirmed}
            setIdleSceneImage={idleSceneImage}
            // clips
            clips={clipsByScene}
            onGenerateClip={handleGenerateClip}
            onGenerateAllClips={generateMultiClips}
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
            script={script}
            step={step as 0 | 1 | 2}
            scene={currentScene}
            setScenesState={setScenesState}
            images={imagesByScene}
            clips={clipsByScene}
            onConfirmScene={confirmScene}
            selected={selectedSceneIds}
            onGenerateImage={handleGenerateImage}
            onConfirmImage={confirmImage}
            onGenerateClip={handleGenerateClip}
            onConfirmClip={confirmClip}
          />
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
                onSeek={seekNarration}
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
};

export default ShortFormMaker;
