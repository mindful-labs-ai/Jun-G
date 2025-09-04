"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
  useDeferredValue,
} from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { HelpCircle, Mic, RefreshCw, RotateCcw } from "lucide-react";
import HeaderBar from "@/components/maker/HeaderBar";
import NarrationPanel from "@/components/maker/NarrationPanel";
import ResetDialog from "@/components/maker/ResetDialog";
import ScriptEditDialog from "@/components/maker/ScriptEditDialog";
import SceneRail from "@/components/maker/SceneRail";
import SceneCanvas from "@/components/maker/SceneCanvas";
import { nowId } from "@/lib/maker/utils";
import {
  GeneratedClip,
  GeneratedImage,
  GeneratedNarration,
  NarrationSettings,
  ResetType,
  Scene,
} from "@/lib/maker/types";
import VisualPipeline from "@/components/maker/VisualPipeLine";

/** Map + order 상태 타입 */
type ScenesState = {
  byId: Map<string, Scene>;
  order: string[]; // 화면 표시에 사용할 순서의 정답
};

export default function MakerPage() {
  const router = useRouter();

  // core state
  const [script, setScript] = useState("");
  const [scenesState, setScenesState] = useState<ScenesState>({
    byId: new Map(),
    order: [],
  });
  const [images, setImages] = useState<GeneratedImage[]>([]);
  const [clips, setClips] = useState<GeneratedClip[]>([]);
  const [narration, setNarration] = useState<GeneratedNarration | null>(null);
  const [currentSceneId, setCurrentSceneId] = useState<string | null>(null);

  // UI/flow state
  const [editingScene, setEditingScene] = useState<string | null>(null);
  const [editingScriptOpen, setEditingScriptOpen] = useState(false);
  const [tempScript, setTempScript] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [resetType, setResetType] = useState<ResetType>("script");
  const pendingActionRef = useRef<(() => void) | null>(null);

  // loading flags
  const [generatingScenes, setGeneratingScenes] = useState(false);
  const [generatingImages, setGeneratingImages] = useState<string[]>([]);
  const [generatingClips, setGeneratingClips] = useState<string[]>([]);
  const [generatingNarration, setGeneratingNarration] = useState(false);

  // funnel state
  const [step, setStep] = useState<number>(0);
  const stepTitle = (s: number) =>
    s === 0
      ? "장면 스텝"
      : s === 1
      ? "이미지 스텝"
      : s === 2
      ? "클립 스텝"
      : "X";

  // audio sim
  const [audioOpen, setAudioOpen] = useState(false);
  const [narrationSettings, setNarrationSettings] = useState<NarrationSettings>(
    { tempo: 50, tone: "neutral", voice: "female", style: "professional" }
  );
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const playTimerRef = useRef<NodeJS.Timeout | null>(null);
  const HANDLE_W = 40;

  // ---- 파생 배열(하위 컴포넌트들은 배열로 유지) ----
  const scenes = useMemo(
    () =>
      scenesState.order.map((id) => scenesState.byId.get(id)!).filter(Boolean),
    [scenesState]
  );

  const deferredScenes = useDeferredValue(scenes);

  // derived project status
  const status = useMemo(() => {
    const scenesConfirmed = [...scenesState.byId.values()].filter(
      (s) => s.confirmed
    ).length;
    const imagesConfirmed = images.filter((i) => i.confirmed).length;
    const clipsConfirmed = clips.filter((c) => c.confirmed).length;
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

  const zipReady = useMemo(
    () =>
      status.totalClips > 0 &&
      status.clips === status.totalClips &&
      status.narrationDone,
    [status]
  );

  /* ============ init / cleanup ============ */
  useEffect(() => {
    const savedScript = localStorage.getItem("ai-shortform-script");
    if (!savedScript) {
      alert("스크립트가 없습니다");
      router.replace("/");
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
      case "script":
        return "스크립트를 수정하면 생성된 모든 장면, 이미지, 클립, 나레이션이 초기화됩니다.";
      case "image":
        return "이미지를 재생성하면 해당 이미지로 만든 클립이 초기화됩니다.";
      case "scene":
        return "장면을 수정하면 해당 장면의 이미지와 클립이 초기화됩니다.";
      default:
        return "이 작업을 수행하면 하위 단계가 초기화됩니다.";
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
    if (resetType === "script") {
      setEditingScriptOpen(false);
      setTempScript("");
    }
  };

  /* ============ notifications (stub) ============ */
  const notify = (msg: string) => alert(msg);

  /* ============ ZIP (stub) ============ */
  const handleZipDownload = () => {
    if (!zipReady)
      return notify("모든 클립과 나레이션을 확정해야 다운로드할 수 있습니다.");
    const confirmedClips = clips.filter((c) => c.confirmed);
    const fileList = [
      "project-info.json",
      "narration.mp3",
      ...confirmedClips.map((_, i) => `clip-${i + 1}.mp4`),
      "scenes.json",
      "settings.json",
    ];
    const fakeZipContent = `AI 숏폼 메이커 - 완성된 프로젝트

포함된 파일:
${fileList.map((f) => `- ${f}`).join("\n")}

프로젝트 정보:
- 총 ${confirmedClips.length}개 클립
- 나레이션 길이: ${narration?.duration}초
- 생성 일시: ${new Date().toLocaleString("ko-KR")}
`;
    const blob = new Blob([fakeZipContent], { type: "application/zip" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ai-shortform-project-${Date.now()}.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    notify("영상 소스 다운로드 완료");
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
      localStorage.setItem("ai-shortform-script", tempScript);
      setScenesState({ byId: new Map(), order: [] });
      setImages([]);
      setClips([]);
      setNarration(null);
      setEditingScriptOpen(false);
      notify("스크립트 수정됨, 하위 단계가 모두 초기화되었습니다.");
    };
    if (hasDownstream) openConfirm("script", apply);
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
    setScenesState((prev) => {
      const s = prev.byId.get(sceneId);
      if (!s) return prev;
      const byId = new Map(prev.byId);
      byId.set(sceneId, { ...s, confirmed: !s.confirmed });
      return { ...prev, byId };
    });

  const confirmAllScenes = () =>
    setScenesState((prev) => {
      if (prev.byId.size === 0) return prev;
      const byId = new Map(prev.byId);
      for (const [id, s] of byId.entries()) {
        byId.set(id, { ...s, confirmed: true });
      }
      return { ...prev, byId };
    });

  // 프롬프트 편집 반영 (현재 씬)
  const updateCurrentScenePrompt = (id: string, v: string) => {
    if (!id) return;
    setScenesState((prev) => {
      const s = prev.byId.get(id);
      if (!s) return prev;
      const byId = new Map(prev.byId);
      byId.set(id, { ...s, imagePrompt: v });
      return { ...prev, byId };
    });
  };

  // 현재 씬
  const currentScene = useMemo(
    () =>
      currentSceneId ? scenesState.byId.get(currentSceneId) ?? null : null,
    [scenesState, currentSceneId]
  );

  /* ============ Visual: Scenes / Images / Clips ============ */
  const handleGenerateScenes = async () => {
    if (!script.trim()) return notify("먼저 스크립트를 입력해주세요.");
    if (
      !confirm(
        "기존 장면 프롬프트는 초기화 됩니다. \n스크립트를 장면으로 분해 하시겠습니까?"
      )
    )
      return;

    try {
      setGeneratingScenes(true);
      const res = await fetch("/api/scenes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ script }),
      });
      if (!res.ok) {
        const { error } = await res.json();
        throw new Error(error ?? "생성 실패");
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

  const generateImageForScene = async (sceneId: string) => {
    const scene = scenesState.byId.get(sceneId);
    if (!scene) return;
    setGeneratingImages((prev) => [...prev, sceneId]);
    await new Promise((r) => setTimeout(r, 1000 + Math.random() * 1500)); // stub
    const newImage: GeneratedImage = {
      id: nowId("image"),
      sceneId,
      url: `/placeholder.svg?height=300&width=400&query=${encodeURIComponent(
        scene.englishPrompt
      )}`,
      prompt: scene.englishPrompt,
      timestamp: Date.now(),
      confirmed: false,
    };
    setImages((prev) => [...prev, newImage]);
    setGeneratingImages((prev) => prev.filter((id) => id !== sceneId));
    notify("새 이미지가 생성되었습니다.");
  };

  const handleGenerateImage = (sceneId: string) => {
    const existingConfirmedImgs = images.filter(
      (i) => i.sceneId === sceneId && i.confirmed
    );
    const affectedClips = clips.filter((c) =>
      existingConfirmedImgs.some((img) => img.id === c.imageId)
    );
    if (affectedClips.length > 0) {
      openConfirm("image", () => {
        setClips((prev) =>
          prev.filter(
            (c) => !existingConfirmedImgs.some((img) => img.id === c.imageId)
          )
        );
        generateImageForScene(sceneId);
      });
      return;
    }
    generateImageForScene(sceneId);
  };

  const confirmImage = (imageId: string) => {
    setImages((prev) =>
      prev.map((i) => (i.id === imageId ? { ...i, confirmed: true } : i))
    );
    notify("이미지가 확정되었습니다.");
  };

  const generateClip = async (imageId: string) => {
    setGeneratingClips((prev) => [...prev, imageId]);
    await new Promise((r) => setTimeout(r, 1200 + Math.random() * 1800)); // stub
    const image = images.find((i) => i.id === imageId);
    if (!image) return;
    const newClip: GeneratedClip = {
      id: nowId("clip"),
      imageId,
      url: `/placeholder.svg?height=200&width=300&query=video-clip`,
      duration: Math.floor(Math.random() * 10) + 5,
      thumbnail: image.url,
      confirmed: false,
    };
    setClips((prev) => [...prev, newClip]);
    setGeneratingClips((prev) => prev.filter((id) => id !== imageId));
    notify(`${newClip.duration}초 클립이 생성되었습니다.`);
  };

  const confirmClip = (clipId: string) => {
    setClips((prev) =>
      prev.map((c) => (c.id === clipId ? { ...c, confirmed: true } : c))
    );
    notify("클립이 확정되었습니다.");
  };

  const confirmAllClips = () => {
    const cnt = clips.filter((c) => !c.confirmed).length;
    if (cnt === 0) return notify("모든 클립이 이미 확정되었습니다.");
    setClips((prev) => prev.map((c) => ({ ...c, confirmed: true })));
    notify(`${cnt}개 클립이 확정되었습니다.`);
  };

  /* ============ Audio: Narration ============ */
  const handleGenerateNarration = async () => {
    if (!script.trim()) return notify("먼저 스크립트를 입력해주세요.");
    setGeneratingNarration(true);
    await new Promise((r) => setTimeout(r, 1500 + Math.random() * 2000)); // stub
    const newNarration: GeneratedNarration = {
      id: nowId("narration"),
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
      setCurrentTime((prev) => {
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
    const blob = new Blob(["AI 생성 나레이션 오디오 파일"], {
      type: "audio/mp3",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "narration.mp3";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    notify("나레이션 파일이 다운로드되었습니다.");
  };

  const confirmNarration = () => {
    if (!narration) return;
    setNarration({ ...narration, confirmed: true });
    notify("나레이션이 확정되었습니다.");
  };

  /* ============ Global actions ============ */
  const resetAll = () => {
    if (confirm("초기화 하시겠습니까?")) {
      setScenesState({ byId: new Map(), order: [] });
      setImages([]);
      setClips([]);
      setNarration(null);
      setCurrentSceneId(null);
      setCurrentTime(0);
      setIsPlaying(false);
      notify("모든 진행 상황이 초기화되었습니다.");
    }
  };

  const openHelp = () => notify("AI 영상을 한 플랫폼에서 시작해보세요.");

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!script && scenesState.byId.size === 0) return;
      event.preventDefault();
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [script, scenesState.byId.size]);

  /* ============ render ============ */
  return (
    <div className="min-h-screen bg-background">
      <HeaderBar
        onBack={() => router.replace("/")}
        onEditScript={handleEditScript}
        status={status}
        onZip={handleZipDownload}
        zipReady={zipReady}
      />

      <main className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 gap-6 mb-2">
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
            onEditScene={(id) => {
              setEditingScene(id);
              setCurrentSceneId(id);
            }}
            editingScene={editingScene}
            updatePrompt={updateCurrentScenePrompt}
            // images
            images={images}
            generatingImages={generatingImages}
            onGenerateImage={handleGenerateImage}
            onConfirmImage={confirmImage}
            // clips
            clips={clips}
            generatingClips={generatingClips}
            onGenerateClip={generateClip}
            onConfirmClip={confirmClip}
            onConfirmAllClips={confirmAllClips}
          />
        </div>

        <div className="space-y-6">
          <SceneRail
            scenes={deferredScenes}
            images={images}
            clips={clips}
            currentSceneId={currentSceneId}
            onSelect={setCurrentSceneId}
          />
          <SceneCanvas
            step={step as 0 | 1 | 2}
            scene={currentScene}
            images={images}
            clips={clips}
            isGeneratingImage={
              currentSceneId ? generatingImages.includes(currentSceneId) : false
            }
            isGeneratingClipIds={generatingClips}
            onUpdatePrompt={updateCurrentScenePrompt}
            onConfirmScene={confirmScene}
            onGenerateImage={handleGenerateImage}
            onConfirmImage={confirmImage}
            onGenerateClip={generateClip}
            onConfirmClip={confirmClip}
          />

          {step === 0 && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={handleGenerateScenes}
                disabled={generatingScenes}
              >
                {generatingScenes ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> 장면
                    생성 중
                  </>
                ) : (
                  "장면 쪼개기"
                )}
              </Button>
              <Button variant="outline" onClick={confirmAllScenes}>
                모든 장면 확정
              </Button>
            </div>
          )}
        </div>
      </main>

      <div
        className={[
          "fixed right-0 top-0 z-50 h-full",
          "w-[420px] sm:w-[480px]",
          "border-l border-border bg-card shadow-xl",
          "transition-transform duration-300 ease-in-out",
          audioOpen
            ? "translate-x-0"
            : "translate-x-[calc(100%-var(--handle))]",
        ].join(" ")}
        style={{ ["--handle" as any]: `${HANDLE_W}px` }}
      >
        <div className="relative h-full">
          {/* 패널 손잡이 */}
          <button
            type="button"
            onClick={() => setAudioOpen((o) => !o)}
            aria-label={
              audioOpen ? "청각 파이프라인 닫기" : "청각 파이프라인 열기"
            }
            aria-expanded={audioOpen}
            className={[
              "group absolute top-1/2 -translate-y-1/2",
              "-left-[var(--handle)]",
              "h-28 w-[var(--handle)]",
              "rounded-l-md rounded-r-none",
              "bg-primary text-primary-foreground",
              "shadow-lg hover:brightness-110 active:scale-[0.98]",
              "flex items-center justify-center",
              "transition-all duration-200",
            ].join(" ")}
          >
            <div className="flex flex-col items-center gap-2">
              <Mic className="h-5 w-5" />
              <span className="text-[10px] tracking-widest rotate-180 [writing-mode:vertical-rl]">
                AUDIO
              </span>
            </div>
          </button>

          {/* 패널 본문 */}
          <div className="h-full flex flex-col">
            <div className="px-4 py-5 border-b border-border">
              <h3 className="text-lg font-semibold">나레이션</h3>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <NarrationPanel
                scriptPresent={!!script}
                narration={narration}
                settings={narrationSettings}
                setSettings={(s) => setNarrationSettings(s)}
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
      <footer className="border-t border-border sticky bottom-0 z-10 bg-card mt-auto">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={resetAll}
                className="gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                초기화
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={openHelp}
                className="gap-2"
              >
                <HelpCircle className="w-4 h-4" />
                도움말
              </Button>
            </div>

            <div className="text-sm text-muted-foreground">
              {script ? `스크립트: ${script.length}자` : "스크립트 없음"}
            </div>

            <div className="flex w-42 justify-end items-center gap-2 select-none">
              <Button
                className="w-full rounded-tl-full rounded-bl-full rounded-tr-none rounded-br-none"
                onClick={() => setStep((prev) => prev - 1)}
                disabled={step === 0}
                variant="default"
              >
                {stepTitle(step - 1)}
              </Button>
              <Button
                className="w-full rounded-tl-none rounded-bl-none rounded-tr-full rounded-br-full"
                onClick={() => setStep((prev) => prev + 1)}
                disabled={step === 2}
                variant="default"
              >
                {stepTitle(step + 1)}
              </Button>
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
          setTempScript("");
        }}
        onSave={saveScriptChange}
      />
    </div>
  );
}
