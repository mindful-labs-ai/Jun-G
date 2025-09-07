import { UploadedImage } from "./types";

export const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

export const notify = (msg: string) => alert(msg);

export const nowId = (prefix: string) => `${prefix}-${Date.now()}`;

export const fileToBase64 = (file: File): Promise<UploadedImage> => {
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

export const stripDataUrlPrefix = (input: string): string => {
  const s = input.trim();
  const comma = s.indexOf(",");
  if (s.startsWith("data:") && comma !== -1) {
    // base64 본문에 줄바꿈/공백이 끼어 있는 경우 대비
    return s.slice(comma + 1).replace(/\s/g, "");
  }
  return s;
};
