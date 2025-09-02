/* eslint-disable @next/next/no-img-element */
"use client";

import { Button } from "@/components/ui/button";
import { GeneratedClip, GeneratedImage } from "./types";
import { DownloadIcon, Play, RefreshCw, Check } from "lucide-react";
import { useMemo } from "react";

export default function ClipSection({
  images,
  clips,
  generatingIds,
  onGenerateClip,
  onConfirmClip,
  onConfirmAll,
}: {
  images: GeneratedImage[];
  clips: GeneratedClip[];
  generatingIds: string[];
  onGenerateClip: (imageId: string) => void;
  onConfirmClip: (clipId: string) => void;
  onConfirmAll: () => void;
}) {
  const confirmedImages = useMemo(
    () => images.filter((i) => i.confirmed),
    [images]
  );

  return (
    <div
      className={`p-4 border border-border rounded-lg ${
        confirmedImages.length === 0 ? "opacity-50" : ""
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold">3. 클립 생성</h3>
        {clips.length > 0 && (
          <Button size="sm" variant="outline" onClick={onConfirmAll}>
            전체 확정
          </Button>
        )}
      </div>
      <p className="text-sm text-muted-foreground mb-3">
        이미지를 동영상 클립으로 변환합니다
      </p>

      {confirmedImages.length > 0 ? (
        <div className="space-y-3 max-h-80 overflow-y-auto">
          {confirmedImages.map((image) => {
            const imageClips = clips.filter(
              (clip) => clip.imageId === image.id
            );
            const isGenerating = generatingIds.includes(image.id);

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
                    <p className="text-sm font-medium">{image.prompt}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onGenerateClip(image.id)}
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
                          src={clip.thumbnail || "/placeholder.svg"}
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
                            variant={clip.confirmed ? "default" : "secondary"}
                            className="h-6 w-6 p-0"
                            onClick={() => onConfirmClip(clip.id)}
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
        <Button variant="outline" className="w-full bg-transparent" disabled>
          클립 생성
        </Button>
      )}
    </div>
  );
}
