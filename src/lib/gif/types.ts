export interface UploadedImage {
  name: string;
  base64: string;
  dataUrl: string;
  mimeType: string;
}

export interface TemplateFrame {
  id: number;
  label: string;
  prompt: string;
  delayMs?: number;
}
export interface TemplateDef {
  id: string;
  name: string;
  frames: TemplateFrame[];
  description?: string;
}
export interface FrameState {
  index: number;
  label: string;
  prompt: string;
  status: 'pending' | 'generating' | 'done' | 'error';
  error?: string;
  image?: UploadedImage;
}
