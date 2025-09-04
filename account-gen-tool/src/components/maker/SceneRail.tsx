"use client";

import { memo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Check, ImageIcon, Video } from "lucide-react";
import type {
  Scene,
  GeneratedImage,
  GeneratedClip,
} from "../../lib/maker/types";
import { Separator } from "../ui/separator";

type Props = {
  scenes: Scene[];
  images: GeneratedImage[];
  clips: GeneratedClip[];
  currentSceneId: string | null;
  onSelect: (id: string) => void;
};

export default memo(function SceneRail({
  scenes,
  images,
  clips,
  currentSceneId,
  onSelect,
}: Props) {
  return (
    <div className="sticky top-[56px] z-10 bg-background border-b">
      <div className="py-2 flex items-center gap-2 overflow-x-auto no-scrollbar">
        {scenes.map((s) => {
          const sceneImages = images.filter((i) => i.sceneId === s.id);
          const sceneClips = clips.filter((c) =>
            sceneImages.some((i) => i.id === c.imageId)
          );
          const active = s.id === currentSceneId;

          return (
            <HoverCard key={s.id} openDelay={300}>
              <HoverCardTrigger asChild>
                <Button
                  variant={active ? "default" : "secondary"}
                  size="sm"
                  className="shrink-0 rounded-full"
                  onClick={() => onSelect(s.id)}
                >
                  {s.id.replace("scene-", "#")}
                </Button>
              </HoverCardTrigger>
              <HoverCardContent className="w-[420px]">
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs text-muted-foreground">
                    {s.id}
                    <div className="flex items-center gap-1">
                      <Badge
                        variant={s.confirmed ? "default" : "outline"}
                        className="px-1"
                      >
                        <Check className="w-3 h-3 mr-1" />
                        {s.confirmed ? "확정" : "대기"}
                      </Badge>
                      <Badge variant="outline" className="px-1">
                        <ImageIcon className="w-3 h-3 mr-1" />
                        {sceneImages.length}
                      </Badge>
                      <Badge variant="outline" className="px-1">
                        <Video className="w-3 h-3 mr-1" />
                        {sceneClips.length}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-sm font-medium">{s.koreanSummary}</div>
                  <Separator className="my-4" />
                  <div className="text-xs text-muted-foreground">Prompt</div>
                  <p className="text-sm leading-relaxed">{s.imagePrompt}</p>
                  <Separator className="my-4" />
                  <div className="text-xs text-muted-foreground">
                    Original text
                  </div>
                  <p className="text-sm leading-relaxed">{s.originalText}</p>
                </div>
              </HoverCardContent>
            </HoverCard>
          );
        })}
      </div>
    </div>
  );
});
