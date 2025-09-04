"use client";

import { Button } from "@/components/ui/button";
import ImageSceneCard from "./ImageSceneCard";
import { GeneratedImage, Scene } from "../../lib/maker/types";

export default function ImageSection({
  scenes,
  images,
  generatingIds,
  onGenerateImage,
  onConfirmImage,
  selectable,
  selectedSceneIds,
  onToggleSelectScene,
}: {
  scenes: Scene[];
  images: GeneratedImage[];
  generatingIds: string[];
  onGenerateImage: (sceneId: string) => void;
  onConfirmImage: (imgId: string) => void;

  selectable?: boolean;
  selectedSceneIds?: Set<string>;
  onToggleSelectScene?: (sceneId: string) => void;
}) {
  return (
    <div
      className={`p-4 border border-border rounded-lg ${
        scenes.length === 0 ? "opacity-50" : ""
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold">2. 이미지 생성</h3>

        {/* 선택 모드일 때 멀티 버튼 */}
        {selectable && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              선택됨 {selectedSceneIds?.size ?? 0}개
            </span>
            <Button
              size="sm"
              variant="default"
              disabled={!selectedSceneIds || selectedSceneIds.size === 0}
              onClick={() => {
                // 부모에서 병렬 실행 핸들러를 내려받아서 써도 되고,
                // 여기선 `CustomEvent`로 부모에 알리는 패턴 대신
                // 간단히 부모에서 onGenerateSelected를 prop으로 내려도 OK
                const event = new CustomEvent("image:generateSelected");
                window.dispatchEvent(event);
              }}
            >
              선택 씬 병렬 생성
            </Button>
          </div>
        )}
      </div>

      <p className="text-sm text-muted-foreground mb-3">
        각 장면에 맞는 이미지를 생성합니다
      </p>
      {scenes.length > 0 ? (
        <div className="space-y-3 max-h-160 overflow-y-auto">
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
              selectable={selectable}
              selectedSceneIds={selectedSceneIds}
              onToggleSelectScene={onToggleSelectScene}
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
