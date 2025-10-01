import { VideoPreferenceRow, VideoPreferenceUpdate } from './types';

export const normalizePrefs = (
  prefs: VideoPreferenceRow | null
): VideoPreferenceUpdate => {
  return {
    image_gen_model: prefs?.image_gen_model ?? 'Gemini',
    video_gen_model: prefs?.video_gen_model ?? 'Seedance',
    voice_gen_model: prefs?.voice_gen_model ?? 'Bin',
    stability: prefs?.stability ?? 0.5,
    resolution: prefs?.resolution ?? '480p',
    ratio: prefs?.ratio ?? '9:16',
    custom_style: prefs?.custom_style ?? '',
    split_rule: prefs?.split_rule ?? '',
  };
};

export const shallowDiffKeys = <T extends Record<string, any>>(
  a: T,
  b: T
): (keyof T)[] => {
  const keys = Object.keys(a) as Array<keyof T>;
  const out: (keyof T)[] = [];
  for (const k of keys) if (a[k] !== b[k]) out.push(k);
  return out;
};
