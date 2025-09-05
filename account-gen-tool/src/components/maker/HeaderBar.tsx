"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  FileArchive,
  ImageIcon,
  Mic,
  RefreshCw,
  Scissors,
  Video,
} from "lucide-react";

export default function HeaderBar({
  onBack,
  onEditScript,
  status,
  onZip,
  zipDownloading,
}: {
  onBack: () => void;
  onEditScript: () => void;
  status: {
    scenes: number;
    totalScenes: number;
    images: number;
    totalImages: number;
    clips: number;
    totalClips: number;
    narrationDone: boolean;
  };
  onZip: () => void;
  zipDownloading: boolean;
}) {
  return (
    <header className="border-b border-border bg-card top-0 z-10">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Left */}
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              돌아가기
            </Button>
            <h1 className="text-xl font-bold text-card-foreground">
              AI 숏폼 메이커
            </h1>
            <Button
              variant="ghost"
              size="sm"
              onClick={onEditScript}
              className="gap-2"
            >
              {/* 아이콘은 페이지에서 import */}
              수정
            </Button>
          </div>

          {/* Center (md↑) */}
          <div className="hidden md:flex items-center gap-2">
            <Badge
              variant={status.totalScenes > 0 ? "default" : "secondary"}
              className="gap-1"
            >
              <Video className="w-3 h-3" /> 씬 {status.scenes}/
              {status.totalScenes}
            </Badge>
            <Badge
              variant={status.totalImages > 0 ? "default" : "secondary"}
              className="gap-1"
            >
              <ImageIcon className="w-3 h-3" /> 이미지 {status.images}/
              {status.totalImages}
            </Badge>
            <Badge
              variant={status.totalClips > 0 ? "default" : "secondary"}
              className="gap-1"
            >
              <Scissors className="w-3 h-3" /> 클립 {status.clips}/
              {status.totalClips}
            </Badge>
            <Badge
              variant={status.narrationDone ? "default" : "secondary"}
              className="gap-1"
            >
              <Mic className="w-3 h-3" /> 나레이션{" "}
              {status.narrationDone ? "완료" : "대기"}
            </Badge>
          </div>

          {/* Right */}
          <Button
            onClick={onZip}
            disabled={zipDownloading}
            className="gap-2"
            variant={zipDownloading ? "secondary" : "default"}
          >
            <FileArchive className="w-4 h-4" />
            {zipDownloading ? "압축 중..." : "ZIP 다운로드"}
            {zipDownloading && (
              <Badge variant="secondary" className="ml-1">
                <RefreshCw className="h-6 w-6 animate-spin text-black" />
              </Badge>
            )}
          </Button>
        </div>

        {/* Mobile badges */}
        <div className="md:hidden mt-3 flex flex-wrap gap-2">
          <Badge
            variant={status.totalScenes > 0 ? "default" : "secondary"}
            className="gap-1"
          >
            <Video className="w-3 h-3" /> 씬 {status.scenes}/
            {status.totalScenes}
          </Badge>
          <Badge
            variant={status.totalImages > 0 ? "default" : "secondary"}
            className="gap-1"
          >
            <ImageIcon className="w-3 h-3" /> 이미지 {status.images}/
            {status.totalImages}
          </Badge>
          <Badge
            variant={status.totalClips > 0 ? "default" : "secondary"}
            className="gap-1"
          >
            <Scissors className="w-3 h-3" /> 클립 {status.clips}/
            {status.totalClips}
          </Badge>
          <Badge
            variant={status.narrationDone ? "default" : "secondary"}
            className="gap-1"
          >
            <Mic className="w-3 h-3" /> 나레이션{" "}
            {status.narrationDone ? "완료" : "대기"}
          </Badge>
        </div>
      </div>
    </header>
  );
}
