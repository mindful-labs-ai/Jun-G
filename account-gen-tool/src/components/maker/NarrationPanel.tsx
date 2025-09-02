"use client";

import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DownloadIcon,
  Pause,
  Play,
  RefreshCw,
  Volume2,
  Check,
} from "lucide-react";
import { GeneratedNarration, NarrationSettings } from "./types";
import { formatTime } from "./utils";

export default function NarrationPanel({
  scriptPresent,
  narration,
  settings,
  setSettings,
  generating,
  isPlaying,
  currentTime,
  onGenerate,
  onPlayPause,
  onDownload,
  onConfirm,
}: {
  scriptPresent: boolean;
  narration: GeneratedNarration | null;
  settings: NarrationSettings;
  setSettings: (s: NarrationSettings) => void;
  generating: boolean;
  isPlaying: boolean;
  currentTime: number;
  onGenerate: () => void;
  onPlayPause: () => void;
  onDownload: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="p-4 border border-border rounded-lg">
      <h3 className="font-semibold mb-2">나레이션 생성</h3>
      <p className="text-sm text-muted-foreground mb-4">
        스크립트를 음성으로 변환합니다
      </p>

      {/* controls */}
      <div className="space-y-4">
        {/* Tempo */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">템포</span>
            <span className="text-sm text-muted-foreground">
              {settings.tempo}%
            </span>
          </div>
          <Slider
            value={[settings.tempo]}
            onValueChange={(value) =>
              setSettings({ ...settings, tempo: value[0] })
            }
            max={200}
            min={25}
            step={5}
            className="w-full"
          />
        </div>

        {/* Tone */}
        <div className="space-y-2">
          <span className="text-sm font-medium">톤</span>
          <Select
            value={settings.tone}
            onValueChange={(value) => setSettings({ ...settings, tone: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="neutral">중립적</SelectItem>
              <SelectItem value="friendly">친근한</SelectItem>
              <SelectItem value="professional">전문적</SelectItem>
              <SelectItem value="energetic">활기찬</SelectItem>
              <SelectItem value="calm">차분한</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Voice */}
        <div className="space-y-2">
          <span className="text-sm font-medium">음성</span>
          <Select
            value={settings.voice}
            onValueChange={(value) =>
              setSettings({ ...settings, voice: value })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="female">여성</SelectItem>
              <SelectItem value="male">남성</SelectItem>
              <SelectItem value="child">아동</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Style */}
        <div className="space-y-2">
          <span className="text-sm font-medium">스타일</span>
          <Select
            value={settings.style}
            onValueChange={(value) =>
              setSettings({ ...settings, style: value })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="professional">전문적</SelectItem>
              <SelectItem value="conversational">대화형</SelectItem>
              <SelectItem value="dramatic">드라마틱</SelectItem>
              <SelectItem value="educational">교육적</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Generate */}
      <Button
        variant="outline"
        className="w-full mt-4 bg-transparent"
        onClick={onGenerate}
        disabled={generating || !scriptPresent}
      >
        {generating ? (
          <>
            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            나레이션 생성 중...
          </>
        ) : narration ? (
          "나레이션 재생성"
        ) : (
          "나레이션 생성"
        )}
      </Button>

      {/* Player */}
      {narration && (
        <div className="mt-4 p-3 border border-border rounded-lg bg-card">
          <div className="flex items-center gap-3 mb-3">
            <Button
              size="sm"
              variant="outline"
              onClick={onPlayPause}
              className="w-10 h-10 p-0 bg-transparent"
            >
              {isPlaying ? (
                <Pause className="w-4 h-4" />
              ) : (
                <Play className="w-4 h-4" />
              )}
            </Button>
            <div className="flex-1">
              <div className="flex items-center justify-between text-sm text-muted-foreground mb-1">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(narration.duration)}</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-1000"
                  style={{
                    width: `${(currentTime / narration.duration) * 100}%`,
                  }}
                />
              </div>
            </div>
            <Volume2 className="w-4 h-4 text-muted-foreground" />
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {narration.settings.voice} • {narration.settings.tone} •{" "}
              {narration.settings.tempo}%
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={onDownload}
                className="gap-1"
              >
                <DownloadIcon className="w-3 h-3" />
                다운로드
              </Button>
              <Button
                size="sm"
                variant={narration.confirmed ? "default" : "outline"}
                onClick={onConfirm}
                disabled={narration.confirmed}
                className="gap-1"
              >
                <Check className="w-3 h-3" />
                {narration.confirmed ? "확정됨" : "확정"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
