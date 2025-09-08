export interface ImagePromptJson {
  intent: string;
  img_style: string;
  camera: {
    shot_type: string;
    angle: string;
    focal_length: string;
  };
  subject: {
    pose: string;
    expression: string;
    gaze: string;
    hands: string;
  };
  lighting: {
    key: string;
    mood: string;
  };
  background: {
    location: string;
    dof: string;
    props: string;
    time: string;
  };
}

export interface ClipPromptJson {
  intent: string;
  img_message: string;
  background: {
    location: string;
    props: string;
    time: string;
  };
  camera_motion: {
    type: string;
    easing: string;
  };
  subject_motion: Array<{
    time: string;
    action: string;
  }>;
  environment_motion: Array<{
    type: string;
    action: string;
  }>;
}

export interface Scene {
  id: string;
  originalText: string;
  englishPrompt: string;
  sceneExplain: string;
  koreanSummary: string;
  imagePrompt: ImagePromptJson;
  clipPrompt: ClipPromptJson;
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
