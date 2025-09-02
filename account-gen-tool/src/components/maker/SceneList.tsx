"use client";

import { Button } from "@/components/ui/button";
import { Check, Edit3, RefreshCw } from "lucide-react";
import { Scene } from "./types";

export default function SceneList({
  scenes,
  generating,
  onGenerate,
  onConfirm,
  onEdit,
  editing,
  onConfirmAll,
}: {
  scenes: Scene[];
  generating: boolean;
  editing: number | null;
  onGenerate: () => void;
  onConfirm: (id: string) => void;
  onEdit: (id: string) => void;
  onConfirmAll: () => void;
}) {
  return (
    <div className="p-4 border border-border rounded-lg">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold">1. 장면 프롬프트</h3>
        {scenes.length > 0 && (
          <Button size="sm" variant="outline" onClick={onConfirmAll}>
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
        onClick={onGenerate}
        disabled={generating}
      >
        {generating ? (
          <>
            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            장면 생성 중...
          </>
        ) : (
          "장면 쪼개기"
        )}
      </Button>

      {scenes.length > 0 && (
        <div className="space-y-3 max-h-60 overflow-y-auto">
          {scenes.map((scene) => (
            <div
              key={scene.id}
              className="p-3 border border-border rounded-lg bg-card"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground mb-1">원문:</p>
                  <p className="text-sm font-medium mb-2 whitespace-pre-line">
                    {scene.originalText}
                  </p>
                  <p className="text-xs text-muted-foreground mb-1">
                    이미지 프롬프트:
                  </p>
                  <p className="text-sm text-muted-foreground mb-2">
                    {scene.imagePrompt}
                  </p>
                  <p className="text-xs text-muted-foreground mb-1">
                    한글 요약:
                  </p>
                  <p className="text-sm text-muted-foreground mb-2">
                    {scene.koreanSummary}
                  </p>
                  <p className="text-xs text-muted-foreground mb-1">
                    장면 요약:
                  </p>
                  <p className="text-sm">{scene.sceneExplain}</p>
                </div>
                <div className="flex items-center gap-1 ml-2">
                  <Button size="sm" onClick={() => onEdit(scene.id)}>
                    <Edit3 className="w-3 h-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant={scene.confirmed ? "default" : "outline"}
                    onClick={() => onConfirm(scene.id)}
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
  );
}
