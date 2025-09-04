"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Check, RefreshCw, ImageIcon } from "lucide-react";
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
  images: Map<string, GeneratedImage>;
  clips: Map<string, GeneratedClip>;
  onUpdatePrompt: (id: string, v: string) => void;
  onUpdateClipPrompt: (id: string, v: string) => void;
  onConfirmScene?: (id: string) => void;
  onGenerateImage?: (sceneId: string) => void;
  onConfirmImage?: (imageId: string) => void;
  onGenerateClip?: (
    sceneId: string,
    aiType: "kling" | "seedance"
  ) => Promise<void>;
  onConfirmClip?: (clipId: string) => void;
};

export default function SceneCanvas({
  step,
  scene,
  images,
  clips,
  onUpdatePrompt,
  onUpdateClipPrompt,
  onConfirmScene,
  onGenerateImage,
  onConfirmImage,
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
  const sceneImages = images.get(scene.id);
  const sceneClips = clips.get(scene.id);

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
            <div className="text-xs text-muted-foreground mb-2">
              {step === 2 ? "ClipPrompt" : "ImagePrompt"}
            </div>
            <TextareaAutoSize
              className="min-h-[220px] w-full disabled:text-black disabled:cursor-not-allowed resize-none rounded-lg p-2 break-keep"
              value={step === 2 ? scene.clipPrompt : scene.imagePrompt}
              onChange={(e) => {
                step === 2
                  ? onUpdateClipPrompt(scene.id, e.target.value)
                  : onUpdatePrompt(scene.id, e.target.value);
              }}
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
                  disabled={sceneImages?.status === "pending"}
                >
                  {sceneImages?.status === "pending" ? (
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
        <div className="flex justify-center items-center h-full p-6 space-y-4">
          {step === 1 && (
            <>
              {!sceneImages?.dataUrl ? (
                <div className="text-sm text-muted-foreground">
                  아직 생성된 이미지가 없습니다.
                </div>
              ) : (
                <div
                  key={sceneImages?.sceneId}
                  className="relative rounded border overflow-hidden"
                >
                  <img
                    src={sceneImages?.dataUrl}
                    alt={sceneImages?.sceneId}
                    className="w-full h-full object-contain"
                  />
                  <div className="p-2 flex items-center justify-between">
                    <Button
                      size="sm"
                      variant={sceneImages?.confirmed ? "default" : "secondary"}
                      onClick={() => onConfirmImage?.(sceneImages?.sceneId)}
                    >
                      <Check className="w-3 h-3 mr-1" />
                      {sceneImages?.confirmed ? "확정됨" : "확정"}
                    </Button>
                    {/* {sceneImages?.confirmed && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onGenerateClip?.(sceneImages?.sceneId, )}
                      >
                        {sceneClips?.status === "pending" ? (
                          <>
                            <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                            클립 생성 중
                          </>
                        ) : (
                          <>
                            <Scissors className="w-3 h-3 mr-1" /> 클립 생성
                          </>
                        )}
                      </Button>
                    )} */}
                  </div>
                </div>
              )}
            </>
          )}

          {step === 2 && (
            <>
              {sceneClips?.status !== "succeeded" ? (
                <div className="text-sm text-center text-muted-foreground">
                  아직 생성된 클립이 없습니다.
                </div>
              ) : (
                <div
                  key={scene.id}
                  className="flex flex-col items-center gap-2 p-2 border rounded bg-muted/40"
                >
                  <video
                    src={sceneClips?.dataUrl}
                    controls
                    className="w-full h-full object-cover rounded"
                  />
                  <Button
                    size="sm"
                    variant={sceneClips?.confirmed ? "default" : "secondary"}
                    onClick={() => onConfirmClip?.(scene.id)}
                  >
                    <Check className="w-3 h-3 mr-1" />
                    {sceneClips?.confirmed ? "확정됨" : "확정"}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </Card>
    </div>
  );
}
