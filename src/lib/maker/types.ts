export interface Scene {
  id: string;
  originalText: string;
  englishPrompt: string;
  sceneExplain: string;
  koreanSummary: string;
  imagePrompt: string;
  clipPrompt: string;
  confirmed: boolean;
}

export interface ScenesState {
  byId: Map<string, Scene>;
  order: string[];
}

export interface UploadedImage {
  name: string;
  base64: string;
  dataUrl: string;
  mimeType: string;
}

export interface GeneratedImage {
  status: 'idle' | 'pending' | 'succeeded' | 'failed';
  sceneId: string;
  dataUrl?: string;
  timestamp: number;
  confirmed: boolean;
  error?: string;
}

export interface GeneratedClip {
  status: 'idle' | 'pending' | 'queueing' | 'succeeded' | 'failed';
  sceneId: string;
  taskUrl?: string;
  dataUrl?: string;
  timestamp: number;
  error?: string;
  duration?: number;
  confirmed: boolean;
}

export interface NarrationSettings {
  tempo: number; // 25-200
  tone: string; // "neutral" | ...
  voice: string; // "female" | ...
  style: string; // "professional" | ...
}

export interface GeneratedNarration {
  id: string;
  url: string;
  duration: number;
  settings: NarrationSettings;
  confirmed: boolean;
}

export type ResetType = 'script' | 'image' | 'scene';
