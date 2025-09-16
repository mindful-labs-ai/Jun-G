import { ClipPromptJson, ImagePromptJson, Scene, UploadedImage } from './types';

export const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export const notify = (msg: string) => alert(msg);

export const nowId = (prefix: string) => `${prefix}-${Date.now()}`;

export const fileToBase64 = (file: File): Promise<UploadedImage> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const dataUrl = reader.result as string;
      const base64 = dataUrl.split(',')[1];

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

export const stripDataUrlPrefix = (input: string): string => {
  const s = input.trim();
  const comma = s.indexOf(',');
  if (s.startsWith('data:') && comma !== -1) {
    // base64 본문에 줄바꿈/공백이 끼어 있는 경우 대비
    return s.slice(comma + 1).replace(/\s/g, '');
  }
  return s;
};

export const normalizeImagePrompt = (src: ImagePromptJson) => {
  return {
    intent: src.intent ?? '',
    img_style: src.img_style ?? '',
    camera: {
      shot_type: src.camera?.shot_type ?? '',
      angle: src.camera?.angle ?? '',
      focal_length: src.camera?.focal_length ?? '',
    },
    subject: {
      pose: src.subject?.pose ?? '',
      expression: src.subject?.expression ?? '',
      gaze: src.subject?.gaze ?? '',
      hands: src.subject?.hands ?? '',
    },
    lighting: {
      key: src.lighting?.key ?? '',
      mood: src.lighting?.mood ?? '',
    },
    background: {
      location: src.background?.location ?? '',
      dof: src.background?.dof ?? '',
      props: src.background?.props ?? '',
      time: src.background?.time ?? '',
    },
  };
};

export const normalizeClipPrompt = (src: ClipPromptJson) => {
  return {
    intent: src.intent ?? '',
    img_message: src.img_message ?? '',
    background: {
      location: src.background?.location ?? '',
      props: src.background?.props ?? '',
      time: src.background?.time ?? '',
    },
    camera_motion: {
      type: src.camera_motion?.type ?? '',
      easing: src.camera_motion?.easing ?? '',
    },
    subject_motion: Array.isArray(src.subject_motion) ? src.subject_motion : [],
    environment_motion: Array.isArray(src.environment_motion)
      ? src.environment_motion
      : [],
  };
};

export const normalizeScene = (updated: Scene, sceneId: string): Scene => {
  return {
    id: sceneId,
    originalText: updated.originalText ?? '',
    englishPrompt: updated.englishPrompt ?? '',
    sceneExplain: updated.sceneExplain ?? '',
    koreanSummary: updated.koreanSummary ?? '',
    imagePrompt: normalizeImagePrompt(updated.imagePrompt),
    clipPrompt: normalizeClipPrompt(updated.clipPrompt),
    confirmed: false,
  };
};
