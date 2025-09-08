'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type AspectRatio = '1:1' | '4:3' | '3:4' | '16:9' | '9:16' | '21:9';
export type ImageAIType = 'gemini' | 'gpt';
export type ClipAIType = 'kling' | 'seedance';

export interface RefImage {
  id: string;
  dataUrl: string;
  mimeType: string;
  role?: string;
  note?: string;
  createdAt: number;
}

type AIConfigState = {
  ratio: AspectRatio;
  resolution: number;
  imageAiType: ImageAIType;
  clipAiType: ClipAIType;
  duration: number; // seconds
  refImages: RefImage[];
};

type AIConfigActions = {
  // 개별 setter
  setRatio: (v: AspectRatio) => void;
  setResolution: (px: number) => void;
  setImageAiType: (v: ImageAIType) => void;
  setClipAiType: (v: ClipAIType) => void;
  setDuration: (sec: number) => void;

  // refImages 조작
  setRefImages: (list: RefImage[]) => void;
  addRefImage: (img: RefImage) => void;
  updateRefImage: (id: string, patch: Partial<RefImage>) => void;
  removeRefImage: (id: string) => void;
  moveRefImage: (from: number, to: number) => void;

  // reset(부분/전체)
  resetRatio: () => void;
  resetResolution: () => void;
  resetImageAI: () => void;
  resetClipAI: () => void;
  resetDuration: () => void;
  resetRefImages: () => void;
  resetAll: () => void;
};

const DEFAULT: AIConfigState = {
  ratio: '9:16',
  resolution: 720,
  imageAiType: 'gemini',
  clipAiType: 'kling',
  duration: 5,
  refImages: [],
};

export const useAIConfigStore = create<AIConfigState & AIConfigActions>()(
  persist(
    set => ({
      ...DEFAULT,

      // === setters: 바뀌는 키만 부분 업데이트 ===
      setRatio: v => set({ ratio: v }),
      setResolution: px => set({ resolution: px }),
      setImageAiType: v => set({ imageAiType: v }),
      setClipAiType: v => set({ clipAiType: v }),
      setDuration: sec => set({ duration: sec }),

      setRefImages: list => set({ refImages: list }),
      addRefImage: img => set(s => ({ refImages: [...s.refImages, img] })),
      updateRefImage: (id, patch) =>
        set(s => ({
          refImages: s.refImages.map(r =>
            r.id === id ? { ...r, ...patch } : r
          ),
        })),
      removeRefImage: id =>
        set(s => ({ refImages: s.refImages.filter(r => r.id !== id) })),
      moveRefImage: (from, to) =>
        set(s => {
          const arr = s.refImages.slice();
          if (
            from === to ||
            from < 0 ||
            to < 0 ||
            from >= arr.length ||
            to >= arr.length
          ) {
            return {};
          }
          const [m] = arr.splice(from, 1);
          arr.splice(to, 0, m);
          return { refImages: arr };
        }),

      resetRatio: () => set({ ratio: DEFAULT.ratio }),
      resetResolution: () => set({ resolution: DEFAULT.resolution }),
      resetImageAI: () => set({ imageAiType: DEFAULT.imageAiType }),
      resetClipAI: () => set({ clipAiType: DEFAULT.clipAiType }),
      resetDuration: () => set({ duration: DEFAULT.duration }),
      resetRefImages: () => set({ refImages: DEFAULT.refImages }),

      resetAll: () => set({ ...DEFAULT }),
    }),
    {
      name: 'ai-config',
      storage: createJSONStorage(() => localStorage),
      partialize: s => ({
        ratio: s.ratio,
        resolution: s.resolution,
        imageAiType: s.imageAiType,
        clipAiType: s.clipAiType,
        duration: s.duration,
        refImages: s.refImages,
      }),
    }
  )
);
