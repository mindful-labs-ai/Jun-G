/* eslint-disable @next/next/no-img-element */
"use client";

import { Button } from "@/components/ui/button";
import { GeneratedClip, GeneratedImage, Scene } from "../../lib/maker/types";
import {
  RefreshCw,
  Check,
  Image as ImageIcon,
  Film,
  Clock,
} from "lucide-react";
import { useState } from "react";

type RatioValue = "16:9" | "4:3" | "1:1" | "3:4" | "9:16" | "21:9";

export default function ClipSection({
  scenes,
  images,
  clips,
  aiType,
  onGenerateClip,
  onConfirmClip,
  onConfirmAll,
  onQueueAction,
  setIdleSceneClip,
}: {
  scenes: Scene[];
  images: Map<string, GeneratedImage>;
  clips: Map<string, GeneratedClip>;
  aiType: "kling" | "seedance";
  onGenerateClip: (
    sceneId: string,
    aiType: "kling" | "seedance"
  ) => Promise<void>;
  onConfirmClip: (clipId: string) => void;
  onConfirmAll: () => void;
  onQueueAction: ({
    sceneId,
    aiType,
  }: {
    sceneId: string;
    aiType: "kling" | "seedance";
  }) => Promise<void>;
  setIdleSceneClip: (sceneId: string) => void;
}) {
  const [ratio, setRatio] = useState<string>("1:1");
  const anyClipReady =
    Array.from(clips.values()).filter((c) => !!c.dataUrl).length > 0;

  const viewProcess = async (aiType: "kling" | "seedance") => {
    const response = await fetch(`/api/${aiType}/clip-gen/id`, {
      method: "GET",
      cache: "no-store",
    });

    const data = await response.json();

    console.log(data);
  };

  return (
    <div
      className={[
        "p-4 border border-border rounded-lg",
        scenes.length === 0 ? "opacity-50" : "",
      ].join(" ")}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex flex-col gap-3">
          <h3 className="font-semibold">3. 클립 생성</h3>
          <div className="text-sm text-muted-foreground mb-3">
            이미지를 동영상 클립으로 변환합니다
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button onClick={() => viewProcess(aiType)}>진행 상황 보기</Button>
          {anyClipReady && (
            <Button size="sm" variant="outline" onClick={onConfirmAll}>
              전체 확정
            </Button>
          )}
        </div>
      </div>

      {/* List */}
      {scenes.length > 0 ? (
        <div className="space-y-2 max-h-[70vh] overflow-y-auto pr-1">
          {scenes.map((scene) => {
            const baseImage = images.get(scene.id)?.dataUrl;
            const clip = clips.get(scene.id);

            const isGenerating = clip?.status === "pending";
            const isQueueing = clip?.status === "queueing";
            const videoSrc = clip?.dataUrl; // data:video/mp4;base64,... 혹은 URL

            const statusChip =
              clip?.status === "queueing"
                ? "생성 중"
                : clip?.status === "pending"
                ? "요청 중"
                : clip?.status === "failed"
                ? "실패"
                : clip?.confirmed
                ? "확정됨"
                : clip?.status === "succeeded"
                ? "완료"
                : "대기";

            return (
              <div
                key={scene.id}
                className="relative flex gap-4 rounded-lg border bg-card p-3 hover:shadow-sm transition-shadow"
              >
                {/* 좌: 비디오 프레임 */}
                <div className="shrink-0">
                  <div className="relative overflow-hidden rounded-lg border bg-muted/20">
                    <div className="h-[256px] w-[256px]">
                      {videoSrc ? (
                        <video
                          id={`video-${scene.id}`}
                          className="h-full w-full object-cover"
                          src={videoSrc}
                          controls
                          poster={baseImage}
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                          <div className="flex flex-col items-center gap-2">
                            <Film className="h-7 w-7" />
                            <span className="text-xs">클립 없음 (미생성)</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* 로딩/대기열 오버레이 */}
                    {isGenerating && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                        {isGenerating ? (
                          <RefreshCw className="h-6 w-6 animate-spin text-white" />
                        ) : (
                          <div className="flex flex-col items-center gap-2 text-white">
                            <Clock className="h-6 w-6" />
                            <span className="text-xs">대기열</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* status === queueing → 임의 버튼 */}
                    {isQueueing && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => {
                            console.log(aiType);
                            onQueueAction({
                              sceneId: scene.id,
                              aiType: aiType,
                            });
                            console.log(scene.id, aiType, clips.get(scene.id));
                          }}
                          className="h-7"
                        >
                          <Clock className="mr-2 h-3 w-3" />
                          클립 불러오기
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* 좌측 하단: 액션들 */}
                  <div className="mt-2 flex justify-center gap-2">
                    <Button
                      className="flex-1"
                      size="sm"
                      variant="outline"
                      onClick={() => onGenerateClip(scene.id, aiType)}
                      disabled={isGenerating || isQueueing}
                    >
                      {isGenerating ? (
                        <>
                          <RefreshCw className="mr-2 h-3 w-3 animate-spin" />
                          생성 중…
                        </>
                      ) : isQueueing ? (
                        "대기 중…"
                      ) : (
                        "클립 생성"
                      )}
                    </Button>

                    <Button
                      size="sm"
                      variant={clip?.confirmed ? "default" : "secondary"}
                      className="h-8 w-8 p-0"
                      disabled={!videoSrc}
                      onClick={() => onConfirmClip(scene.id)}
                      title="확정"
                    >
                      <Check className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* 우: 설명 패널 */}
                <div className="min-w-0 flex-1">
                  <div className="mb-2 flex items-start justify-between">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="rounded-full border px-2.5 py-1">
                        {statusChip}
                      </span>
                      <span>
                        • {scene.id}
                        <Button
                          className="text-xs text-muted-foreground"
                          size="sm"
                          variant="link"
                          onClick={() => setIdleSceneClip(scene.id)}
                        >
                          클립 초기화
                        </Button>
                      </span>
                    </div>
                    {/* 작은 이미지 썸네일 */}
                    <div className="right-3 absolute">
                      {baseImage ? (
                        <img
                          src={baseImage}
                          alt="base"
                          className="h-12 w-12 rounded border object-cover"
                        />
                      ) : (
                        <div className="h-12 w-12 rounded border flex items-center justify-center text-muted-foreground bg-muted/30">
                          <ImageIcon className="h-4 w-4" />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <h4 className="text-sm font-semibold">원문</h4>
                      <p className="mt-1 whitespace-pre-line text-sm text-muted-foreground">
                        {scene.originalText}
                      </p>
                    </div>

                    <div>
                      <h4 className="text-sm font-semibold">클립 프롬프트</h4>
                      <p className="mt-1 whitespace-pre-line text-sm text-muted-foreground">
                        {scene.clipPrompt}
                      </p>
                    </div>

                    <details className="group">
                      <summary className="cursor-pointer text-xs text-muted-foreground underline decoration-dotted underline-offset-2">
                        요약/장면 프롬프트 보기
                      </summary>
                      <div className="mt-2 space-y-2 rounded-md border bg-muted/30 p-2">
                        <div>
                          <div className="text-[11px] font-medium text-muted-foreground">
                            요약
                          </div>
                          <p className="whitespace-pre-line text-sm">
                            {scene.sceneExplain}
                          </p>
                        </div>
                        <div>
                          <div className="text-[11px] font-medium text-muted-foreground">
                            장면 프롬프트(Scene Prompt)
                          </div>
                          <p className="whitespace-pre-line text-sm">
                            {scene.englishPrompt}
                          </p>
                        </div>
                      </div>
                    </details>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <Button variant="outline" className="w-full bg-transparent" disabled>
          클립 생성
        </Button>
      )}
    </div>
  );
}
