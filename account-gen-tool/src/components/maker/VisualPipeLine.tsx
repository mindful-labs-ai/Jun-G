"use client";

import { cn } from "@/lib/shared/utils";
import { Separator } from "@/components/ui/separator";
import { Video, ImageIcon, Scissors } from "lucide-react";
import SceneList from "@/components/maker/SceneList";
import ImageSection from "@/components/maker/ImageSection";
import ClipSection from "@/components/maker/ClipSection";
import { Scene, GeneratedImage, GeneratedClip } from "@/lib/maker/types";

type Props = {
  step: number;
  setStep: (s: number) => void;

  // scenes
  scenes: Scene[];
  generatingScenes: boolean;
  onGenerateScenes: () => void | Promise<void>;
  onConfirmScene: (id: string) => void;
  onConfirmAllScenes: () => void;
  isConfirmedAllScenes: boolean;
  onEditScene: (id: string) => void;
  editingScene: string | number | null;
  updatePrompt: (id: string, v: string) => void;

  // images
  images: GeneratedImage[];
  generatingImages: string[];
  onGenerateImage: (sceneId: string) => void;
  onConfirmImage: (imgId: string) => void;

  // clips
  clips: GeneratedClip[];
  generatingClips: string[];
  onGenerateClip: (imageId: string) => void;
  onConfirmClip: (clipId: string) => void;
  onConfirmAllClips: () => void;
};

const steps = [
  { key: 0, label: "Scenes", sub: "Script to Scenes", icon: Video },
  { key: 1, label: "Images", sub: "Generate Images", icon: ImageIcon },
  { key: 2, label: "Clips", sub: "Make video Clips", icon: Scissors },
];

export default function VisualPipeline({
  step,
  setStep,
  scenes,
  generatingScenes,
  onGenerateScenes,
  onConfirmScene,
  onConfirmAllScenes,
  isConfirmedAllScenes,

  images,
  generatingImages,
  onGenerateImage,
  onConfirmImage,

  clips,
  generatingClips,
  onGenerateClip,
  onConfirmClip,
  onConfirmAllClips,
}: Props) {
  const CurrentIcon = steps[step].icon;

  return (
    <section className="relative w-full mx-auto">
      {/* Sticky Stepper */}
      <div className="sticky top-18 z-20">
        <div className="backdrop-blur supports-[backdrop-filter]:bg-background/60 bg-background/90 border rounded-2xl px-3 py-2">
          <div className="flex items-center gap-2">
            {steps.map((s, idx) => {
              const ActiveIcon = s.icon;
              const active = s.key === step;
              const done = s.key < step;
              return (
                <button
                  key={s.key}
                  onClick={() => setStep(s.key)}
                  className={cn(
                    "group relative flex items-center gap-2 rounded-xl px-3 py-2 transition-colors",
                    active
                      ? "bg-primary/10 text-primary"
                      : done
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <ActiveIcon
                    className={cn("h-4 w-4", active && "text-primary")}
                  />
                  <div className="text-left">
                    <div className="text-sm leading-tight">{s.label}</div>
                    <div className="text-xs leading-tight text-muted-foreground">
                      {s.sub}
                    </div>
                  </div>
                  {idx < steps.length - 1 && (
                    <div className="mx-3 h-5 w-px bg-border/80 hidden sm:block" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Airy Canvas */}
      <div className="relative mt-4 h-fit overflow-hidden rounded-3xl border">
        {/* grid-ish background */}
        <div className="pointer-events-none absolute inset-0 opacity-[0.55]">
          <div className="absolute inset-0 bg-[radial-gradient(#0000000a_1px,transparent_1px)] [background-size:14px_14px]" />
          <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-muted/70 to-transparent" />
        </div>

        {/* Header inside canvas */}
        <div className="relative flex items-center gap-2 p-4 md:p-6">
          <div className="inline-flex items-center gap-2 rounded-full border bg-card/80 px-3 py-1.5 backdrop-blur">
            <CurrentIcon className="h-4 w-4" />
            <span className="text-sm font-medium">{steps[step].label}</span>
          </div>
          <Separator className="mx-2 hidden md:block" orientation="vertical" />
          <p className="hidden md:block text-xs text-muted-foreground">
            {steps[step].sub}
          </p>
        </div>

        {/* Content */}
        <div className="relative p-4 md:p-6">
          <div className="mx-auto rounded-lg shadow-md">
            {step === 0 && (
              <div className="space-y-4">
                <SceneList
                  scenes={scenes}
                  generating={generatingScenes}
                  onGenerate={onGenerateScenes}
                  onConfirm={onConfirmScene}
                  onConfirmAll={onConfirmAllScenes}
                  isConfirmedAllScenes={isConfirmedAllScenes}
                />
              </div>
            )}

            {step === 1 && (
              <div className="space-y-4">
                <ImageSection
                  scenes={scenes}
                  images={images}
                  generatingIds={generatingImages}
                  onGenerateImage={onGenerateImage}
                  onConfirmImage={onConfirmImage}
                />
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <ClipSection
                  images={images}
                  clips={clips}
                  generatingIds={generatingClips}
                  onGenerateClip={onGenerateClip}
                  onConfirmClip={onConfirmClip}
                  onConfirmAll={onConfirmAllClips}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
