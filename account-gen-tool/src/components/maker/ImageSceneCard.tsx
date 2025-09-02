/* eslint-disable @next/next/no-img-element */
"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, RefreshCw } from "lucide-react";
import { GeneratedImage } from "./types";

export default function ImageSceneCard({
  scene,
  images,
  isGenerating,
  onGenerateImage,
  onConfirmImage,
}: {
  scene: { id: string; koreanSummary: string; englishPrompt: string };
  images: GeneratedImage[];
  isGenerating: boolean;
  onGenerateImage: (sceneId: string) => void;
  onConfirmImage: (imgId: string) => void;
}) {
  const sceneImages = images.filter((i) => i.sceneId === scene.id);
  const recent = sceneImages.slice(-2);

  return (
    <Card className="p-3 border border-border rounded-lg bg-card">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-medium">{scene.koreanSummary}</p>
        <Button
          size="sm"
          variant="outline"
          onClick={() => onGenerateImage(scene.id)}
          disabled={isGenerating}
        >
          {isGenerating ? (
            <RefreshCw className="w-3 h-3 animate-spin" />
          ) : (
            "생성"
          )}
        </Button>
      </div>

      <p className="text-xs text-muted-foreground mb-2">프롬프트</p>
      <p className="text-sm text-muted-foreground mb-2">
        {scene.englishPrompt}
      </p>

      {recent.length > 0 && (
        <div className="grid grid-cols-2 gap-2 mt-2">
          {recent.map((image) => (
            <div key={image.id} className="relative">
              <img
                src={image.url || "/placeholder.svg"}
                alt={image.prompt}
                className="w-full h-20 object-cover rounded border"
              />
              <Button
                size="sm"
                variant={image.confirmed ? "default" : "secondary"}
                className="absolute top-1 right-1 h-6 w-6 p-0"
                onClick={() => onConfirmImage(image.id)}
              >
                <Check className="w-3 h-3" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
