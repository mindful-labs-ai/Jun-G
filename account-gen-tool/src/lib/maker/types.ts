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

export interface GeneratedImage {
  id: string;
  sceneId: string;
  url: string;
  prompt: string;
  timestamp: number;
  confirmed: boolean;
}

export interface GeneratedClip {
  id: string;
  imageId: string;
  url: string;
  duration: number;
  thumbnail: string;
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

export type ResetType = "script" | "image" | "scene";
