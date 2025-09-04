"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Check, RefreshCw, ImageIcon, Scissors } from "lucide-react";
import TextareaAutoSize from "react-textarea-autosize";
import type {
  Scene,
  GeneratedImage,
  GeneratedClip,
} from "../../lib/maker/types";

type Step = 0 | 1 | 2;

type Props = {
  step: Step; // 0: scenes, 1: images, 2: clips
  scene: Scene | null;
  images: GeneratedImage[];
  clips: GeneratedClip[];
  isGeneratingImage: boolean;
  isGeneratingClipIds: string[];
  onUpdatePrompt: (id: string, v: string) => void;
  onConfirmScene?: (id: string) => void;
  onGenerateImage?: (sceneId: string) => void;
  onConfirmImage?: (imageId: string) => void;
  onGenerateClip?: (imageId: string) => void;
  onConfirmClip?: (clipId: string) => void;
};

export default function SceneCanvas({
  step,
  scene,
  images,
  clips,
  isGeneratingImage,
  isGeneratingClipIds,
  onUpdatePrompt,
  onConfirmScene,
  onGenerateImage,
  onConfirmImage,
  onGenerateClip,
  onConfirmClip,
}: Props) {
  if (!scene) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          장면을 선택하세요.
        </CardContent>
      </Card>
    );
  }

  // 현재 씬에 해당하는 이미지/클립만 필터
  const sceneImages = images.filter((i) => i.sceneId === scene.id);
  const sceneClips = clips.filter((c) =>
    sceneImages.some((i) => i.id === c.imageId)
  );

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      {/* 좌: 텍스트/프롬프트 */}
      <Card className="h-full">
        <CardContent className="p-6 space-y-4">
          <div>
            <div className="text-xs text-muted-foreground mb-1">
              Original text
            </div>
            <div className="text-sm leading-relaxed whitespace-pre-wrap">
              {scene.originalText}
            </div>
          </div>
          <Separator />
          <div>
            <div className="text-xs text-muted-foreground mb-2">Prompt</div>
            <TextareaAutoSize
              className="min-h-[220px] w-full disabled:text-black disabled:cursor-not-allowed resize-none rounded-lg p-2 break-keep"
              value={scene.imagePrompt}
              onChange={(e) => onUpdatePrompt(scene.id, e.target.value)}
              disabled={scene.confirmed}
            />
            <div className="mt-2 flex items-center gap-2">
              <Button
                size="sm"
                variant={scene.confirmed ? "default" : "outline"}
                onClick={() => onConfirmScene?.(scene.id)}
              >
                <Check className="w-4 h-4 mr-1" />
                {scene.confirmed ? "확정됨" : "장면 확정"}
              </Button>
              {step === 1 && (
                <Button
                  size="sm"
                  variant="default"
                  onClick={() => onGenerateImage?.(scene.id)}
                  disabled={isGeneratingImage}
                >
                  {isGeneratingImage ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-1 animate-spin" /> 이미지
                      생성 중
                    </>
                  ) : (
                    <>
                      <ImageIcon className="w-4 h-4 mr-1" /> 이 프롬프트로
                      이미지 생성
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 우: 결과 보드(이미지/클립) */}
      <Card className="h-full">
        <CardContent className="p-6 space-y-4">
          {step === 1 && (
            <>
              <div className="text-sm font-medium">
                생성된 이미지 ({sceneImages.length})
              </div>
              {sceneImages.length === 0 ? (
                <div className="text-sm text-muted-foreground">
                  아직 생성된 이미지가 없습니다.
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {sceneImages.map((img) => (
                    <div
                      key={img.id}
                      className="relative rounded border overflow-hidden"
                    >
                      <img
                        src={img.url || "/placeholder.svg"}
                        alt={img.prompt}
                        className="w-full h-32 object-cover"
                      />
                      <div className="p-2 flex items-center justify-between">
                        <Button
                          size="sm"
                          variant={img.confirmed ? "default" : "secondary"}
                          onClick={() => onConfirmImage?.(img.id)}
                        >
                          <Check className="w-3 h-3 mr-1" />
                          {img.confirmed ? "확정됨" : "확정"}
                        </Button>
                        {img.confirmed && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onGenerateClip?.(img.id)}
                            disabled={isGeneratingClipIds.includes(img.id)}
                          >
                            {isGeneratingClipIds.includes(img.id) ? (
                              <>
                                <RefreshCw className="w-3 h-3 mr-1 animate-spin" />{" "}
                                클립 생성 중
                              </>
                            ) : (
                              <>
                                <Scissors className="w-3 h-3 mr-1" /> 클립 생성
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {step === 2 && (
            <>
              <div className="text-sm font-medium">
                생성된 클립 ({sceneClips.length})
              </div>
              {sceneClips.length === 0 ? (
                <div className="text-sm text-muted-foreground">
                  아직 생성된 클립이 없습니다.
                </div>
              ) : (
                <div className="space-y-2">
                  {sceneClips.map((clip) => (
                    <div
                      key={clip.id}
                      className="flex items-center gap-2 p-2 border rounded bg-muted/40"
                    >
                      <img
                        src={clip.thumbnail || "/placeholder.svg"}
                        alt="thumb"
                        className="w-10 h-10 object-cover rounded"
                      />
                      <div className="text-sm flex-1">{clip.duration}s</div>
                      <Button
                        size="sm"
                        variant={clip.confirmed ? "default" : "secondary"}
                        onClick={() => onConfirmClip?.(clip.id)}
                      >
                        <Check className="w-3 h-3 mr-1" />
                        {clip.confirmed ? "확정됨" : "확정"}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
