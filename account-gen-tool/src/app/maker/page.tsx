"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft,
  RotateCcw,
  Undo2,
  HelpCircle,
  Video,
  ImageIcon,
  Scissors,
  Mic,
  Edit3,
  Check,
  RefreshCw,
  Play,
  DownloadIcon,
  Pause,
  Volume2,
  AlertTriangle,
  FileArchive,
} from "lucide-react";

interface Scene {
  id: string;
  originalText: string;
  englishPrompt: string;
  koreanSummary: string;
  confirmed: boolean;
}

interface GeneratedImage {
  id: string;
  sceneId: string;
  url: string;
  prompt: string;
  timestamp: number;
  confirmed: boolean;
}

interface GeneratedClip {
  id: string;
  imageId: string;
  url: string;
  duration: number;
  thumbnail: string;
  confirmed: boolean;
}

interface NarrationSettings {
  tempo: number;
  tone: string;
  voice: string;
  style: string;
}

interface GeneratedNarration {
  id: string;
  url: string;
  duration: number;
  settings: NarrationSettings;
  confirmed: boolean;
}

interface ProjectStatus {
  scenes: number;
  totalScenes: number;
  images: number;
  totalImages: number;
  clips: number;
  totalClips: number;
  narration: boolean;
}

export default function MakerPage() {
  const [script, setScript] = useState("");
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [images, setImages] = useState<GeneratedImage[]>([]);
  const [clips, setClips] = useState<GeneratedClip[]>([]);
  const [narration, setNarration] = useState<GeneratedNarration | null>(null);
  const [narrationSettings, setNarrationSettings] = useState<NarrationSettings>(
    {
      tempo: 50,
      tone: "neutral",
      voice: "female",
      style: "professional",
    }
  );
  const [editingScene, setEditingScene] = useState<string | null>(null);
  const [editingScript, setEditingScript] = useState(false);
  const [tempScript, setTempScript] = useState("");
  const [showResetWarning, setShowResetWarning] = useState(false);
  const [resetType, setResetType] = useState<"script" | "image" | "scene">(
    "script"
  );
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  const [generatingScenes, setGeneratingScenes] = useState(false);
  const [generatingImages, setGeneratingImages] = useState<string[]>([]);
  const [generatingClips, setGeneratingClips] = useState<string[]>([]);
  const [generatingNarration, setGeneratingNarration] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [projectStatus, setProjectStatus] = useState<ProjectStatus>({
    scenes: 0,
    totalScenes: 0,
    images: 0,
    totalImages: 0,
    clips: 0,
    totalClips: 0,
    narration: false,
  });
  const router = useRouter();

  // Load script from localStorage on mount
  useEffect(() => {
    const savedScript = localStorage.getItem("ai-shortform-script");
    if (!savedScript) {
      alert("스크립트가 없습니다");
      router.push("/");
      return;
    }
    setScript(savedScript);
  }, [router]);

  // Update project status when scenes/images/clips/narration change
  useEffect(() => {
    setProjectStatus({
      scenes: scenes.filter((s) => s.confirmed).length,
      totalScenes: scenes.length,
      images: images.filter((i) => i.confirmed).length,
      totalImages: images.length,
      clips: clips.filter((c) => c.confirmed).length,
      totalClips: clips.length,
      narration: narration?.confirmed || false,
    });
  }, [scenes, images, clips, narration]);

  // Check if ZIP download should be enabled
  const isZipDownloadReady = () => {
    return (
      projectStatus.clips === projectStatus.totalClips &&
      projectStatus.totalClips > 0 &&
      projectStatus.narration
    );
  };

  const handleZipDownload = () => {
    if (!isZipDownloadReady()) {
      alert("모든 클립과 나레이션을 확정해야 다운로드할 수 있습니다.");
      return;
    }

    const confirmedClips = clips.filter((c) => c.confirmed);
    const fileList = [
      "project-info.json",
      "narration.mp3",
      ...confirmedClips.map((clip, index) => `clip-${index + 1}.mp4`),
      "scenes.json",
      "settings.json",
    ];

    const fakeZipContent = `AI 숏폼 메이커 - 완성된 프로젝트
    
포함된 파일:
${fileList.map((file) => `- ${file}`).join("\n")}

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

    alert("영상 소스 다운로드 완료");
  };

  const handleReset = () => {
    setScenes([]);
    setImages([]);
    setClips([]);
    setNarration(null);
    setProjectStatus({
      scenes: 0,
      totalScenes: 0,
      images: 0,
      totalImages: 0,
      clips: 0,
      totalClips: 0,
      narration: false,
    });
    alert("모든 진행 상황이 초기화되었습니다.");
  };

  const handleHelp = () => {
    alert("왼쪽에서 시각 요소를, 오른쪽에서 오디오를 제작하세요.");
  };

  const handleEditScript = () => {
    setEditingScript(true);
    setTempScript(script);
  };

  const handleScriptChange = () => {
    if (
      scenes.length > 0 ||
      images.length > 0 ||
      clips.length > 0 ||
      narration
    ) {
      setResetType("script");
      setShowResetWarning(true);
      setPendingAction(() => () => {
        setScript(tempScript);
        localStorage.setItem("ai-shortform-script", tempScript);
        // Reset all downstream content
        setScenes([]);
        setImages([]);
        setClips([]);
        setNarration(null);
        setEditingScript(false);
        alert("스크립트 수정됨, 하위 단계가 모두 초기화되었습니다.");
      });
    } else {
      setScript(tempScript);
      localStorage.setItem("ai-shortform-script", tempScript);
      setEditingScript(false);
      alert("스크립트가 업데이트되었습니다.");
    }
  };

  const handleCancelScriptEdit = () => {
    setEditingScript(false);
    setTempScript("");
  };

  const handleConfirmReset = () => {
    if (pendingAction) {
      pendingAction();
      setPendingAction(null);
    }
    setShowResetWarning(false);
  };

  const handleCancelReset = () => {
    setShowResetWarning(false);
    setPendingAction(null);
    if (resetType === "script") {
      setEditingScript(false);
      setTempScript("");
    }
  };

  const handleGenerateScenes = async () => {
    if (!script.trim()) {
      alert("먼저 스크립트를 입력해주세요.");
      return;
    }

    setGeneratingScenes(true);

    // Stub API call - simulate scene generation
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const mockScenes: Scene[] = [
      {
        id: "scene-1",
        originalText: script.substring(0, Math.min(50, script.length)) + "...",
        englishPrompt:
          "A person speaking confidently in a modern office setting",
        koreanSummary: "현대적인 사무실에서 자신감 있게 말하는 사람",
        confirmed: false,
      },
      {
        id: "scene-2",
        originalText:
          script.substring(50, Math.min(100, script.length)) + "...",
        englishPrompt: "Close-up of hands typing on a laptop keyboard",
        koreanSummary: "노트북 키보드를 타이핑하는 손의 클로즈업",
        confirmed: false,
      },
      {
        id: "scene-3",
        originalText:
          script.substring(100, Math.min(150, script.length)) + "...",
        englishPrompt:
          "Wide shot of a bustling city street with people walking",
        koreanSummary: "사람들이 걸어다니는 번화한 도시 거리의 와이드샷",
        confirmed: false,
      },
    ];

    setScenes(mockScenes);
    setGeneratingScenes(false);

    alert(`${mockScenes.length}개의 장면이 생성되었습니다.`);
  };

  const handleGenerateImage = async (sceneId: string) => {
    const scene = scenes.find((s) => s.id === sceneId);
    if (!scene) return;

    // Check if regenerating will affect clips
    const existingImages = images.filter(
      (img) => img.sceneId === sceneId && img.confirmed
    );
    const affectedClips = clips.filter((clip) =>
      existingImages.some((img) => img.id === clip.imageId)
    );

    if (affectedClips.length > 0) {
      setResetType("image");
      setShowResetWarning(true);
      setPendingAction(() => async () => {
        // Remove affected clips
        setClips((prev) =>
          prev.filter(
            (clip) => !existingImages.some((img) => img.id === clip.imageId)
          )
        );
        await generateImageForScene(sceneId);
      });
      return;
    }

    await generateImageForScene(sceneId);
  };

  const generateImageForScene = async (sceneId: string) => {
    const scene = scenes.find((s) => s.id === sceneId);
    if (!scene) return;

    setGeneratingImages((prev) => [...prev, sceneId]);

    // Stub API call - simulate image generation
    await new Promise((resolve) => setTimeout(resolve, 3000));

    const newImage: GeneratedImage = {
      id: `image-${Date.now()}`,
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

    alert("새 이미지가 생성되었습니다.");
  };

  const handleGenerateClip = async (imageId: string) => {
    const image = images.find((i) => i.id === imageId);
    if (!image) return;

    setGeneratingClips((prev) => [...prev, imageId]);

    // Stub API call - simulate clip generation
    await new Promise((resolve) => setTimeout(resolve, 4000));

    const newClip: GeneratedClip = {
      id: `clip-${Date.now()}`,
      imageId,
      url: `/placeholder.svg?height=200&width=300&query=video-clip`,
      duration: Math.floor(Math.random() * 10) + 5, // 5-15 seconds
      thumbnail: image.url,
      confirmed: false,
    };

    setClips((prev) => [...prev, newClip]);
    setGeneratingClips((prev) => prev.filter((id) => id !== imageId));

    alert(`${newClip.duration}초 클립이 생성되었습니다.`);
  };

  const handleConfirmScene = (sceneId: string) => {
    setScenes((prev) =>
      prev.map((s) => (s.id === sceneId ? { ...s, confirmed: true } : s))
    );
    alert("장면이 확정되었습니다.");
  };

  const handleConfirmImage = (imageId: string) => {
    setImages((prev) =>
      prev.map((i) => (i.id === imageId ? { ...i, confirmed: true } : i))
    );
    alert("이미지가 확정되었습니다.");
  };

  const handleConfirmClip = (clipId: string) => {
    setClips((prev) =>
      prev.map((c) => (c.id === clipId ? { ...c, confirmed: true } : c))
    );
    alert("클립이 확정되었습니다.");
  };

  const handleConfirmAllScenes = () => {
    setScenes((prev) => prev.map((s) => ({ ...s, confirmed: true })));
    alert("모든 장면이 확정되었습니다.");
  };

  const handleConfirmAllClips = () => {
    const unconfirmedClips = clips.filter((c) => !c.confirmed);
    if (unconfirmedClips.length === 0) {
      alert("모든 클립이 이미 확정되었습니다.");
      return;
    }

    setClips((prev) => prev.map((c) => ({ ...c, confirmed: true })));
    alert(`${unconfirmedClips.length}개 클립이 확정되었습니다.`);
  };

  const handleGenerateNarration = async () => {
    if (!script.trim()) {
      alert("먼저 스크립트를 입력해주세요.");
      return;
    }

    setGeneratingNarration(true);

    // Stub API call - simulate narration generation
    await new Promise((resolve) => setTimeout(resolve, 5000));

    const newNarration: GeneratedNarration = {
      id: `narration-${Date.now()}`,
      url: `/placeholder.svg?height=100&width=300&query=audio-waveform`,
      duration: Math.floor(script.length / 10) + 30, // Rough estimate based on script length
      settings: { ...narrationSettings },
      confirmed: false,
    };

    setNarration(newNarration);
    setGeneratingNarration(false);

    alert(`${newNarration.duration}초 나레이션이 생성되었습니다.`);
  };

  const handlePlayPause = () => {
    if (!narration) return;

    setIsPlaying(!isPlaying);

    if (!isPlaying) {
      // Simulate audio playback
      const interval = setInterval(() => {
        setCurrentTime((prev) => {
          if (prev >= narration.duration) {
            setIsPlaying(false);
            clearInterval(interval);
            return 0;
          }
          return prev + 1;
        });
      }, 1000);
    }
  };

  const handleDownloadNarration = () => {
    if (!narration) return;

    // Stub implementation - create fake audio download
    const fakeAudioContent = "AI 생성 나레이션 오디오 파일";
    const blob = new Blob([fakeAudioContent], { type: "audio/mp3" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "narration.mp3";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    alert("나레이션 파일이 다운로드되었습니다.");
  };

  const handleConfirmNarration = () => {
    if (!narration) return;

    setNarration((prev) => (prev ? { ...prev, confirmed: true } : null));
    alert("나레이션이 확정되었습니다.");
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getResetWarningMessage = () => {
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
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Left: Back button and title */}
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/")}
                className="gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                돌아가기
              </Button>
              <h1 className="text-xl font-bold text-card-foreground">
                AI 숏폼 메이커
              </h1>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleEditScript}
                className="gap-2"
              >
                <Edit3 className="w-4 h-4" />
                스크립트 수정
              </Button>
            </div>

            {/* Center: Project status badges */}
            <div className="hidden md:flex items-center gap-2">
              <Badge
                variant={
                  projectStatus.totalScenes > 0 ? "default" : "secondary"
                }
                className="gap-1"
              >
                <Video className="w-3 h-3" />씬 {projectStatus.scenes}/
                {projectStatus.totalScenes}
              </Badge>
              <Badge
                variant={
                  projectStatus.totalImages > 0 ? "default" : "secondary"
                }
                className="gap-1"
              >
                <ImageIcon className="w-3 h-3" />
                이미지 {projectStatus.images}/{projectStatus.totalImages}
              </Badge>
              <Badge
                variant={projectStatus.totalClips > 0 ? "default" : "secondary"}
                className="gap-1"
              >
                <Scissors className="w-3 h-3" />
                클립 {projectStatus.clips}/{projectStatus.totalClips}
              </Badge>
              <Badge
                variant={projectStatus.narration ? "default" : "secondary"}
                className="gap-1"
              >
                <Mic className="w-3 h-3" />
                나레이션 {projectStatus.narration ? "완료" : "대기"}
              </Badge>
            </div>

            {/* Right: ZIP download button */}
            <Button
              onClick={handleZipDownload}
              disabled={!isZipDownloadReady()}
              className="gap-2"
              variant={isZipDownloadReady() ? "default" : "secondary"}
            >
              <FileArchive className="w-4 h-4" />
              ZIP 다운로드
              {isZipDownloadReady() && (
                <Badge variant="secondary" className="ml-1">
                  준비됨
                </Badge>
              )}
            </Button>
          </div>

          {/* Mobile status badges */}
          <div className="md:hidden mt-3 flex flex-wrap gap-2">
            <Badge
              variant={projectStatus.totalScenes > 0 ? "default" : "secondary"}
              className="gap-1"
            >
              <Video className="w-3 h-3" />씬 {projectStatus.scenes}/
              {projectStatus.totalScenes}
            </Badge>
            <Badge
              variant={projectStatus.totalImages > 0 ? "default" : "secondary"}
              className="gap-1"
            >
              <ImageIcon className="w-3 h-3" />
              이미지 {projectStatus.images}/{projectStatus.totalImages}
            </Badge>
            <Badge
              variant={projectStatus.totalClips > 0 ? "default" : "secondary"}
              className="gap-1"
            >
              <Scissors className="w-3 h-3" />
              클립 {projectStatus.clips}/{projectStatus.totalClips}
            </Badge>
            <Badge
              variant={projectStatus.narration ? "default" : "secondary"}
              className="gap-1"
            >
              <Mic className="w-3 h-3" />
              나레이션 {projectStatus.narration ? "완료" : "대기"}
            </Badge>
          </div>
        </div>
      </header>

      {/* Main Content - Two Column Layout */}
      <main className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 min-h-[calc(100vh-200px)]">
          {/* Left Column - Visual Pipeline */}
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
                  {/* Scene Generation Section */}
                  <div className="p-4 border border-border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold">1. 장면 프롬프트</h3>
                      {scenes.length > 0 && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleConfirmAllScenes}
                        >
                          전체 확정
                        </Button>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      스크립트를 장면별로 분해합니다
                    </p>

                    <Button
                      variant="outline"
                      className="w-full bg-transparent mb-4"
                      onClick={handleGenerateScenes}
                      disabled={generatingScenes}
                    >
                      {generatingScenes ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          장면 생성 중...
                        </>
                      ) : (
                        "장면 쪼개기"
                      )}
                    </Button>

                    {/* Scene Cards */}
                    {scenes.length > 0 && (
                      <div className="space-y-3 max-h-60 overflow-y-auto">
                        {scenes.map((scene) => (
                          <div
                            key={scene.id}
                            className="p-3 border border-border rounded-lg bg-card"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1">
                                <p className="text-xs text-muted-foreground mb-1">
                                  원문:
                                </p>
                                <p className="text-sm font-medium mb-2">
                                  {scene.originalText}
                                </p>
                                <p className="text-xs text-muted-foreground mb-1">
                                  영어 프롬프트:
                                </p>
                                <p className="text-sm text-muted-foreground mb-2">
                                  {scene.englishPrompt}
                                </p>
                                <p className="text-xs text-muted-foreground mb-1">
                                  한글 요약:
                                </p>
                                <p className="text-sm">{scene.koreanSummary}</p>
                              </div>
                              <div className="flex items-center gap-1 ml-2">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => setEditingScene(scene.id)}
                                >
                                  <Edit3 className="w-3 h-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant={
                                    scene.confirmed ? "default" : "outline"
                                  }
                                  onClick={() => handleConfirmScene(scene.id)}
                                  disabled={scene.confirmed}
                                >
                                  <Check className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <Separator />

                  {/* Image Generation Section */}
                  <div
                    className={`p-4 border border-border rounded-lg ${
                      scenes.length === 0 ? "opacity-50" : ""
                    }`}
                  >
                    <h3 className="font-semibold mb-2">2. 이미지 생성</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      각 장면에 맞는 이미지를 생성합니다
                    </p>

                    {scenes.length > 0 ? (
                      <div className="space-y-3 max-h-80 overflow-y-auto">
                        {scenes.map((scene) => {
                          const sceneImages = images.filter(
                            (img) => img.sceneId === scene.id
                          );
                          const isGenerating = generatingImages.includes(
                            scene.id
                          );

                          return (
                            <div
                              key={scene.id}
                              className="p-3 border border-border rounded-lg bg-card"
                            >
                              <div className="flex items-center justify-between mb-2">
                                <p className="text-sm font-medium">
                                  {scene.koreanSummary}
                                </p>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleGenerateImage(scene.id)}
                                  disabled={isGenerating}
                                >
                                  {isGenerating ? (
                                    <RefreshCw className="w-3 h-3 animate-spin" />
                                  ) : (
                                    "생성"
                                  )}
                                </Button>
                              </div>

                              {sceneImages.length > 0 && (
                                <div className="grid grid-cols-2 gap-2 mt-2">
                                  {sceneImages.slice(-2).map((image) => (
                                    <div key={image.id} className="relative">
                                      <img
                                        src={image.url || "/placeholder.svg"}
                                        alt={image.prompt}
                                        className="w-full h-20 object-cover rounded border"
                                      />
                                      <div className="absolute top-1 right-1 flex gap-1">
                                        <Button
                                          size="sm"
                                          variant={
                                            image.confirmed
                                              ? "default"
                                              : "secondary"
                                          }
                                          className="h-6 w-6 p-0"
                                          onClick={() =>
                                            handleConfirmImage(image.id)
                                          }
                                        >
                                          <Check className="w-3 h-3" />
                                        </Button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <Button
                        variant="outline"
                        className="w-full bg-transparent"
                        disabled
                      >
                        이미지 생성
                      </Button>
                    )}
                  </div>

                  <Separator />

                  {/* Clip Generation Section */}
                  <div
                    className={`p-4 border border-border rounded-lg ${
                      images.filter((i) => i.confirmed).length === 0
                        ? "opacity-50"
                        : ""
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold">3. 클립 생성</h3>
                      {clips.length > 0 && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleConfirmAllClips}
                        >
                          전체 확정
                        </Button>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      이미지를 동영상 클립으로 변환합니다
                    </p>

                    {images.filter((i) => i.confirmed).length > 0 ? (
                      <div className="space-y-3 max-h-80 overflow-y-auto">
                        {images
                          .filter((i) => i.confirmed)
                          .map((image) => {
                            const imageClips = clips.filter(
                              (clip) => clip.imageId === image.id
                            );
                            const isGenerating = generatingClips.includes(
                              image.id
                            );

                            return (
                              <div
                                key={image.id}
                                className="p-3 border border-border rounded-lg bg-card"
                              >
                                <div className="flex items-center gap-3 mb-2">
                                  <img
                                    src={image.url || "/placeholder.svg"}
                                    alt={image.prompt}
                                    className="w-12 h-12 object-cover rounded border"
                                  />
                                  <div className="flex-1">
                                    <p className="text-sm font-medium">
                                      {image.prompt}
                                    </p>
                                  </div>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleGenerateClip(image.id)}
                                    disabled={isGenerating}
                                  >
                                    {isGenerating ? (
                                      <RefreshCw className="w-3 h-3 animate-spin" />
                                    ) : (
                                      "클립 생성"
                                    )}
                                  </Button>
                                </div>

                                {imageClips.length > 0 && (
                                  <div className="space-y-2 mt-2">
                                    {imageClips.map((clip) => (
                                      <div
                                        key={clip.id}
                                        className="flex items-center gap-2 p-2 border border-border rounded bg-muted/50"
                                      >
                                        <img
                                          src={
                                            clip.thumbnail || "/placeholder.svg"
                                          }
                                          alt="클립 썸네일"
                                          className="w-8 h-8 object-cover rounded"
                                        />
                                        <div className="flex-1">
                                          <p className="text-xs text-muted-foreground">
                                            {clip.duration}초 클립
                                          </p>
                                        </div>
                                        <div className="flex gap-1">
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-6 w-6 p-0"
                                          >
                                            <Play className="w-3 h-3" />
                                          </Button>
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-6 w-6 p-0"
                                          >
                                            <DownloadIcon className="w-3 h-3" />
                                          </Button>
                                          <Button
                                            size="sm"
                                            variant={
                                              clip.confirmed
                                                ? "default"
                                                : "secondary"
                                            }
                                            className="h-6 w-6 p-0"
                                            onClick={() =>
                                              handleConfirmClip(clip.id)
                                            }
                                          >
                                            <Check className="w-3 h-3" />
                                          </Button>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                      </div>
                    ) : (
                      <Button
                        variant="outline"
                        className="w-full bg-transparent"
                        disabled
                      >
                        클립 생성
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Audio Pipeline */}
          <div className="space-y-6">
            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mic className="w-5 h-5" />
                  청각 파이프라인
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Narration Section */}
                  <div className="p-4 border border-border rounded-lg">
                    <h3 className="font-semibold mb-2">나레이션 생성</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      스크립트를 음성으로 변환합니다
                    </p>

                    {/* Audio Controls */}
                    <div className="space-y-4">
                      {/* Tempo Control */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">템포</span>
                          <span className="text-sm text-muted-foreground">
                            {narrationSettings.tempo}%
                          </span>
                        </div>
                        <Slider
                          value={[narrationSettings.tempo]}
                          onValueChange={(value) =>
                            setNarrationSettings((prev) => ({
                              ...prev,
                              tempo: value[0],
                            }))
                          }
                          max={200}
                          min={25}
                          step={5}
                          className="w-full"
                        />
                      </div>

                      {/* Tone Control */}
                      <div className="space-y-2">
                        <span className="text-sm font-medium">톤</span>
                        <Select
                          value={narrationSettings.tone}
                          onValueChange={(value) =>
                            setNarrationSettings((prev) => ({
                              ...prev,
                              tone: value,
                            }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="neutral">중립적</SelectItem>
                            <SelectItem value="friendly">친근한</SelectItem>
                            <SelectItem value="professional">전문적</SelectItem>
                            <SelectItem value="energetic">활기찬</SelectItem>
                            <SelectItem value="calm">차분한</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Voice Control */}
                      <div className="space-y-2">
                        <span className="text-sm font-medium">음성</span>
                        <Select
                          value={narrationSettings.voice}
                          onValueChange={(value) =>
                            setNarrationSettings((prev) => ({
                              ...prev,
                              voice: value,
                            }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="female">여성</SelectItem>
                            <SelectItem value="male">남성</SelectItem>
                            <SelectItem value="child">아동</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Style Control */}
                      <div className="space-y-2">
                        <span className="text-sm font-medium">스타일</span>
                        <Select
                          value={narrationSettings.style}
                          onValueChange={(value) =>
                            setNarrationSettings((prev) => ({
                              ...prev,
                              style: value,
                            }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="professional">전문적</SelectItem>
                            <SelectItem value="conversational">
                              대화형
                            </SelectItem>
                            <SelectItem value="dramatic">드라마틱</SelectItem>
                            <SelectItem value="educational">교육적</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Generate Button */}
                    <Button
                      variant="outline"
                      className="w-full mt-4 bg-transparent"
                      onClick={handleGenerateNarration}
                      disabled={generatingNarration}
                    >
                      {generatingNarration ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          나레이션 생성 중...
                        </>
                      ) : narration ? (
                        "나레이션 재생성"
                      ) : (
                        "나레이션 생성"
                      )}
                    </Button>

                    {/* Audio Player */}
                    {narration && (
                      <div className="mt-4 p-3 border border-border rounded-lg bg-card">
                        <div className="flex items-center gap-3 mb-3">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={handlePlayPause}
                            className="w-10 h-10 p-0 bg-transparent"
                          >
                            {isPlaying ? (
                              <Pause className="w-4 h-4" />
                            ) : (
                              <Play className="w-4 h-4" />
                            )}
                          </Button>

                          <div className="flex-1">
                            <div className="flex items-center justify-between text-sm text-muted-foreground mb-1">
                              <span>{formatTime(currentTime)}</span>
                              <span>{formatTime(narration.duration)}</span>
                            </div>
                            <div className="w-full bg-muted rounded-full h-2">
                              <div
                                className="bg-primary h-2 rounded-full transition-all duration-1000"
                                style={{
                                  width: `${
                                    (currentTime / narration.duration) * 100
                                  }%`,
                                }}
                              />
                            </div>
                          </div>

                          <Volume2 className="w-4 h-4 text-muted-foreground" />
                        </div>

                        {/* Audio Controls */}
                        <div className="flex items-center justify-between">
                          <div className="text-sm text-muted-foreground">
                            {narrationSettings.voice} • {narrationSettings.tone}{" "}
                            • {narrationSettings.tempo}%
                          </div>

                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={handleDownloadNarration}
                              className="gap-1"
                            >
                              <DownloadIcon className="w-3 h-3" />
                              다운로드
                            </Button>

                            <Button
                              size="sm"
                              variant={
                                narration.confirmed ? "default" : "outline"
                              }
                              onClick={handleConfirmNarration}
                              disabled={narration.confirmed}
                              className="gap-1"
                            >
                              <Check className="w-3 h-3" />
                              {narration.confirmed ? "확정됨" : "확정"}
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card mt-auto">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleReset}
                className="gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                초기화
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleHelp}
                className="gap-2"
              >
                <HelpCircle className="w-4 h-4" />
                도움말
              </Button>
            </div>

            <div className="text-sm text-muted-foreground">
              {script ? `스크립트: ${script.length}자` : "스크립트 없음"}
            </div>
          </div>
        </div>
      </footer>

      <Dialog open={showResetWarning} onOpenChange={setShowResetWarning}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              하위 단계 초기화 경고
            </DialogTitle>
            <DialogDescription>{getResetWarningMessage()}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={handleCancelReset}>
              취소
            </Button>
            <Button variant="destructive" onClick={handleConfirmReset}>
              계속 진행
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editingScript} onOpenChange={setEditingScript}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>스크립트 수정</DialogTitle>
            <DialogDescription>
              스크립트를 수정하면 생성된 모든 콘텐츠가 초기화될 수 있습니다.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              value={tempScript}
              onChange={(e) => setTempScript(e.target.value)}
              placeholder="스크립트를 입력하세요..."
              className="min-h-[200px]"
            />
            <div className="text-sm text-muted-foreground">
              글자 수: {tempScript.length}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCancelScriptEdit}>
              취소
            </Button>
            <Button onClick={handleScriptChange} disabled={!tempScript.trim()}>
              저장
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
