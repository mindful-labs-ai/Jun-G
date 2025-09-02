"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Upload, Loader2, X, FileImage, Sparkles } from "lucide-react";

interface UploadedImage {
  name: string;
  base64: string;
  dataUrl: string;
  mimeType: string;
}

interface KlingImageToVideoResponse {
  code: number;
  message: string;
  request_id: string;
  data: {
    task_id: string;
    task_status: string;
    task_info: Record<string, any>;
    created_at: number;
    updated_at: number;
  };
}

export interface KlingImageToVideoStatusResponse {
  code: number; // 0 = 성공
  message: string; // "SUCCEED" 등
  request_id: string;
  data: KlingTaskData;
}

export type KlingTaskStatus =
  | "pending"
  | "processing"
  | "running"
  | "succeed"
  | "failed"
  | "canceled";

export interface KlingTaskData {
  task_id: string; // "791749406890147886"
  task_status: KlingTaskStatus; // "succeed" 등
  task_info: Record<string, unknown>; // 현재는 {}
  task_result?: {
    videos: KlingVideo[];
    // 필요 시 다른 필드가 올 수 있으니 확장 가능
    [k: string]: unknown;
  };
  task_status_msg?: string; // 실패 메시지 등
  created_at: number; // epoch ms
  updated_at: number; // epoch ms
}

export interface KlingVideo {
  id: string; // "791749408236519505"
  url: string; // 서명된 MP4 URL
  duration: string | number; // "5.041" 또는 숫자일 수도 있음
  thumbnail_url?: string;
  fps?: number;
  resolution?: string; // "720p" 등 제공될 수 있음
}

export function KlingVideoWithUpload() {
  const [uploadedImage, setUploadedImage] = useState<UploadedImage | null>(
    null
  );
  const [generatedClips, setGeneratedClips] = useState<KlingVideo[]>([]);
  const [clipId, setClipId] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");
  const [negativePrompt, setNegativePrompt] = useState("");
  const [cfgValue, setCfgValue] = useState<number>(0);
  const [duration, setDuration] = useState<"5" | "10">("5");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const tailFileInputRef = useRef<HTMLInputElement>(null);

  // 파일을 Base64로 변환
  const fileToBase64 = (file: File): Promise<UploadedImage> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => {
        const dataUrl = reader.result as string;
        const base64 = dataUrl.split(",")[1];

        resolve({
          name: file.name,
          base64,
          dataUrl,
          mimeType: file.type,
        });
      };

      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // 파일 처리
  const processFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("이미지 파일만 업로드 가능합니다.");
      return;
    }

    try {
      const convertedImage = await fileToBase64(file);
      setUploadedImage(convertedImage);
      setError(null);
    } catch (err) {
      setError("이미지 변환 실패");
    }
  };

  // 드래그 앤 드롭 핸들러
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  // 파일 선택 핸들러
  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  // Kling API 호출
  const generateWithKling = async () => {
    if (!uploadedImage || !prompt.trim()) {
      setError("이미지와 프롬프트를 모두 입력해주세요.");
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch("/api/kling", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          duration: duration,
          image_base64: uploadedImage.base64,
          prompt: prompt,
          negative_prompt: negativePrompt,
          cfg_scale: cfgValue,
        }),
      });

      console.log({
        duration: duration,
        image_base64: uploadedImage.base64,
        prompt: prompt,
        negative_prompt: negativePrompt,
        cfg_scale: cfgValue,
      });

      if (!response.ok) {
        console.log("에러남");
        throw new Error("이미지 생성 실패");
      }

      const data = (await response.json()) as KlingImageToVideoResponse;

      console.log(data);

      setClipId(data.data.task_id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "알 수 없는 오류");
    } finally {
      setIsGenerating(false);
    }
  };

  const getWithKling = async (id: string) => {
    {
      const response = await fetch(`/api/kling/${id}`, {
        method: "GET",
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(`Status ${response.status}`);
      }

      const jsonData =
        (await response.json()) as KlingImageToVideoStatusResponse;

      const videos = jsonData.data?.task_result?.videos ?? [];
      if (videos.length === 0 || jsonData.message !== "SUCCEED") return;

      setGeneratedClips((prev) => {
        const next = [...prev, ...videos];
        console.log(next);
        console.log(jsonData);
        return next;
      });
    }
  };

  const getUrlId = async () => {
    const response = await fetch(`/api/kling`, {
      method: "GET",
      cache: "no-store",
    });

    const data = await response.json();

    console.log(data);
  };

  // 이미지 다운로드
  const downloadImage = (dataUrl: string, index: number) => {
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = `kling-generated-${index + 1}.mp3`;
    link.click();
  };

  // 초기화
  const reset = () => {
    setUploadedImage(null);
    setGeneratedClips([]);
    setPrompt("");
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    if (tailFileInputRef.current) {
      tailFileInputRef.current.value = "";
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-6 space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        {/* 왼쪽: 업로드 섹션 */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">1. 스타트 프레임 업로드</h3>

          {!uploadedImage ? (
            <div
              className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragActive
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                  : "border-gray-300 dark:border-gray-600"
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileInput}
                className="hidden"
              />

              <FileImage className="mx-auto h-12 w-12 text-gray-400 mb-4" />

              <p className="text-sm mb-4">
                이미지를 드래그하거나 클릭하여 업로드
              </p>

              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
              >
                <Upload className="mr-2 h-4 w-4" />
                이미지 선택
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="relative">
                <img
                  src={uploadedImage.dataUrl}
                  alt="Uploaded"
                  className="w-full rounded-lg border"
                />
                <Button
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={() => setUploadedImage(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-sm text-gray-500">
                파일명: {uploadedImage.name}
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-center gap-6 items-center">
          <div className="w-fit flex flex-col text-center">
            <p>영상 역동성 : {cfgValue}</p>
            <input
              type="range"
              value={cfgValue}
              onChange={(e) => setCfgValue(Number(e.target.value))}
              min={0}
              step={0.1}
              max={1}
            />
          </div>
          <div>
            <p>영상 길이</p>
            <div className="flex gap-2">
              <input
                type="radio"
                value="5"
                id="duration-5"
                checked={duration === "5"}
                onChange={() => setDuration("5")}
                name="duration"
              />
              <label htmlFor="duration-5">5s</label>
            </div>
            <div className="flex gap-2">
              <input
                type="radio"
                value="10"
                id="duration-10"
                checked={duration === "10"}
                onChange={() => setDuration("10")}
                name="duration"
              />
              <label htmlFor="duration-10">10s</label>
            </div>
          </div>
        </div>

        {/* 오른쪽: 프롬프트 섹션 */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">2. 생성 프롬프트 입력</h3>

          <Textarea
            placeholder="예: Create a picture of my cat eating a nano-banana in a fancy restaurant under the Gemini constellation"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="min-h-[150px]"
          />

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
              {error}
            </div>
          )}
        </div>
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">2-1. 부정 프롬프트 입력</h3>

          <Textarea
            placeholder="예: Create a picture of my cat eating a nano-banana in a fancy restaurant under the Gemini constellation"
            value={negativePrompt}
            onChange={(e) => setNegativePrompt(e.target.value)}
            className="min-h-[150px]"
          />

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
              {error}
            </div>
          )}
        </div>
        <Button
          onClick={generateWithKling}
          disabled={!uploadedImage || !prompt.trim() || isGenerating}
          className="w-full"
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              생성 중...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Kling 생성
            </>
          )}
        </Button>
        <Button onClick={() => getWithKling("791793773151535158")}>
          영상 읽어오기
        </Button>
      </div>
      {generatedClips.length !== 0 && (
        <div className="grid grid-cols-3 gap-4">
          {generatedClips.map((clip, index) => {
            return (
              <div className="text-center" key={clip.id + index}>
                <video
                  src={clip.url}
                  controls
                  preload="metadata"
                  playsInline
                ></video>
                <span>{clip.duration}초 영상</span>
              </div>
            );
          })}
        </div>
      )}
      <Button onClick={() => getUrlId()}>임시버튼</Button>
    </div>
  );
}
