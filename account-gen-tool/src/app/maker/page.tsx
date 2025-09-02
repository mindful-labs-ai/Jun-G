"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { HelpCircle, Mic, RotateCcw, Video } from "lucide-react";
import HeaderBar from "@/components/maker/HeaderBar";
import SceneList from "@/components/maker/SceneList";
import ImageSection from "@/components/maker/ImageSection";
import ClipSection from "@/components/maker/ClipSection";
import NarrationPanel from "@/components/maker/NarrationPanel";
import ResetDialog from "@/components/maker/ResetDialog";
import ScriptEditDialog from "@/components/maker/ScriptEditDialog";

import { nowId } from "@/components/maker/utils";
import {
  GeneratedClip,
  GeneratedImage,
  GeneratedNarration,
  NarrationSettings,
  ResetType,
  Scene,
} from "@/components/maker/types";

export default function MakerPage() {
  const router = useRouter();

  // core state
  const [script, setScript] = useState("");
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [images, setImages] = useState<GeneratedImage[]>([]);
  const [clips, setClips] = useState<GeneratedClip[]>([]);
  const [narration, setNarration] = useState<GeneratedNarration | null>(null);

  // UI/flow state
  const [editingScene, setEditingScene] = useState<number | null>(null);
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
  const stepTitle = (step: number) => {
    switch (step) {
      case 0:
        return "장면 스텝";
      case 1:
        return "이미지 스텝";
      case 2:
        return "클립 스텝";
      default:
        return "X";
    }
  };

  // audio sim
  const [narrationSettings, setNarrationSettings] = useState<NarrationSettings>(
    {
      tempo: 50,
      tone: "neutral",
      voice: "female",
      style: "professional",
    }
  );
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const playTimerRef = useRef<NodeJS.Timeout | null>(null);

  // derived project status
  const status = useMemo(() => {
    const scenesConfirmed = scenes.filter((s) => s.confirmed).length;
    const imagesConfirmed = images.filter((i) => i.confirmed).length;
    const clipsConfirmed = clips.filter((c) => c.confirmed).length;
    return {
      scenes: scenesConfirmed,
      totalScenes: scenes.length,
      images: imagesConfirmed,
      totalImages: images.length,
      clips: clipsConfirmed,
      totalClips: clips.length,
      narrationDone: narration?.confirmed || false,
    };
  }, [scenes, images, clips, narration]);

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
      router.push("/");
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
      scenes.length > 0 || images.length > 0 || clips.length > 0 || !!narration;
    const apply = () => {
      setScript(tempScript);
      localStorage.setItem("ai-shortform-script", tempScript);
      setScenes([]);
      setImages([]);
      setClips([]);
      setNarration(null);
      setEditingScriptOpen(false);
      notify("스크립트 수정됨, 하위 단계가 모두 초기화되었습니다.");
    };
    if (hasDownstream) openConfirm("script", apply);
    else apply();
  };

  /* ============ Visual: Scenes / Images / Clips ============ */
  const handleGenerateScenes = async () => {
    if (!script.trim()) return notify("먼저 스크립트를 입력해주세요.");
    if (
      confirm(
        "기존 장면 프롬프트는 초기화 됩니다. \n스크립트를 장면으로 분해 하시겠습니까?"
      )
    ) {
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
        const scenes: Scene[] = await res.json();

        console.log(scenes);

        setScenes(scenes);
        notify(`${scenes.length}개의 장면이 생성되었습니다.`);
      } catch (error) {
        notify(`${error}`);
      } finally {
        setGeneratingScenes(false);
      }
    }
  };

  const generateImageForScene = async (sceneId: string) => {
    const scene = scenes.find((s) => s.id === sceneId);
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

  const confirmScene = (sceneId: string) => {
    setScenes((prev) =>
      prev.map((s) => (s.id === sceneId ? { ...s, confirmed: true } : s))
    );
    notify("장면이 확정되었습니다.");
  };
  const confirmAllScenes = () => {
    setScenes((prev) => prev.map((s) => ({ ...s, confirmed: true })));
    notify("모든 장면이 확정되었습니다.");
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
      setScenes([]);
      setImages([]);
      setClips([]);
      setNarration(null);
      setCurrentTime(0);
      setIsPlaying(false);
      notify("모든 진행 상황이 초기화되었습니다.");
    }
  };

  const openHelp = () => notify("AI 영상을 한 플랫폼에서 시작해보세요.");

  /* ============ render ============ */
  return (
    <div className="min-h-screen bg-background">
      <HeaderBar
        onBack={() => router.push("/")}
        onEditScript={handleEditScript}
        status={status}
        onZip={handleZipDownload}
        zipReady={zipReady}
      />

      <main className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-1 gap-6 min-h-[calc(100vh-200px)]">
          {/* Visual */}
          <div className="space-y-6">
            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Video className="w-5 h-5" />
                  시각 파이프라인
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {step === 0 && (
                    <SceneList
                      scenes={scenes}
                      generating={generatingScenes}
                      onGenerate={handleGenerateScenes}
                      onConfirm={confirmScene}
                      onEdit={(id) => setEditingScene(id)}
                      editing={editingScene}
                      onConfirmAll={confirmAllScenes}
                    />
                  )}
                  {step === 1 && (
                    <ImageSection
                      scenes={scenes}
                      images={images}
                      generatingIds={generatingImages}
                      onGenerateImage={handleGenerateImage}
                      onConfirmImage={confirmImage}
                    />
                  )}
                  {step === 2 && (
                    <ClipSection
                      images={images}
                      clips={clips}
                      generatingIds={generatingClips}
                      onGenerateClip={generateClip}
                      onConfirmClip={confirmClip}
                      onConfirmAll={confirmAllClips}
                    />
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Audio */}
          <div className="space-y-6">
            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mic className="w-5 h-5" />
                  청각 파이프라인
                </CardTitle>
              </CardHeader>
              <CardContent>
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
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

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
