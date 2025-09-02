"use client";

import { Button } from "@/components/ui/button";
import ImageSceneCard from "./ImageSceneCard";
import { GeneratedImage, Scene } from "./types";

export default function ImageSection({
  scenes,
  images,
  generatingIds,
  onGenerateImage,
  onConfirmImage,
}: {
  scenes: Scene[];
  images: GeneratedImage[];
  generatingIds: string[];
  onGenerateImage: (sceneId: string) => void;
  onConfirmImage: (imgId: string) => void;
}) {
  return (
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
          {scenes.map((scene) => (
            <ImageSceneCard
              key={scene.id}
              scene={{
                id: scene.id,
                koreanSummary: scene.koreanSummary,
                englishPrompt: scene.englishPrompt,
              }}
              images={images}
              isGenerating={generatingIds.includes(scene.id)}
              onGenerateImage={onGenerateImage}
              onConfirmImage={onConfirmImage}
            />
          ))}
        </div>
      ) : (
        <Button variant="outline" className="w-full bg-transparent" disabled>
          이미지 생성
        </Button>
      )}
    </div>
  );
}
