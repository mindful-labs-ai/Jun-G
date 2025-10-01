'use client';

import { create } from 'zustand';

export type UsableAI = {
  allScene: number;
  oneScene: number;
  imageGPT: number;
  imageGemini: number;
  clipSeedance: number;
};

export type AIKey = keyof UsableAI;

export type AuthStoreState = {
  userId: string;
  userEmail: string;
  userNumber: number;
  tokenUsage: UsableAI;
  usedCount: UsableAI;
};

export type AuthStoreActions = {
  initState: (state: AuthStoreState) => void;
  setId: (id: string) => void;
  tokenUsed: (amount: number, key: AIKey) => void;
  countUp: (key: AIKey) => void;
};

export const useAuthStore = create<AuthStoreState & AuthStoreActions>()(
  set => ({
    userId: '',
    userEmail: '',
    userNumber: 0,
    tokenUsage: {
      allScene: 0,
      oneScene: 0,
      imageGPT: 0,
      imageGemini: 0,
      clipSeedance: 0,
    },
    usedCount: {
      allScene: 0,
      oneScene: 0,
      imageGPT: 0,
      imageGemini: 0,
      clipSeedance: 0,
    },

    initState: state =>
      set({
        userId: state.userId,
        userEmail: state.userEmail,
        tokenUsage: state.tokenUsage,
        usedCount: state.usedCount,
        userNumber: state.userNumber,
      }),

    setId: id => set({ userId: id }),

    tokenUsed: (amount, key) =>
      set(state => ({
        tokenUsage: {
          ...state.tokenUsage,
          [key]: state.tokenUsage[key] + amount,
        },
      })),

    countUp: key =>
      set(state => ({
        usedCount: {
          ...state.usedCount,
          [key]: state.usedCount[key] + 1,
        },
      })),
  })
);
