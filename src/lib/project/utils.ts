import { Scene, ScenesState } from '../maker/types';
import { AIGeneratedScene, PrepareOptions, SceneInsert, SceneJson, SceneRow, VideoPreferenceRow, VideoPreferenceUpdate } from './types';

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

export const normalizeSceneId = (raw: string, maxLen: number): string => {
  const base = (raw || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-_]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^[-_]+|[-_]+$/g, '');
  return base.slice(0, Math.max(1, maxLen));
};

export const bumpId = (id: string, maxLen: number): string => {
  const m = id.match(/^(.*?)(?:-(\d+))?$/);
  if (!m) return id.slice(0, maxLen);
  const prefix = m[1] || id;
  const n = Number(m[2] || 1) + 1;
  return `${prefix}-${n}`.slice(0, maxLen);
};

export const prepareScenesUpsertPayload = (
  aiScenes: AIGeneratedScene[],
  projectId: number,
  userId: number,
  opts: PrepareOptions = {}
): SceneInsert[] => {
  const {
    status = 'prompt',
    startOrderAt = 1,
    noSubjectDefault = false,
    maxIdLength = 20,
    existingSceneIds = [],
  } = opts;

  const taken = new Set<string>(existingSceneIds.map(s => s.toLowerCase()));
  const rows: SceneInsert[] = [];

  aiScenes.forEach((sc, idx) => {
    let sceneId = normalizeSceneId(
      sc.id || `scene-${idx + startOrderAt}`,
      maxIdLength
    );
    if (!sceneId) sceneId = `s${idx + startOrderAt}`.slice(0, maxIdLength);

    while (taken.has(sceneId)) {
      sceneId = bumpId(sceneId, maxIdLength);
    }
    taken.add(sceneId);

    rows.push({
      project_id: projectId,
      user_id: userId,
      scene_id: sceneId,
      order: idx + startOrderAt,
      scene_json: sc as SceneJson,
      status,
      image_version: null,
      clip_version: null,
      no_subject: noSubjectDefault,
    });
  });

  return rows;
};

export const toUiScene = (r: SceneRow): Scene => {
  const j = (r.scene_json ?? {}) as any;
  return {
    id: r.scene_id,
    originalText: j.originalText ?? '',
    englishPrompt: j.englishPrompt ?? '',
    sceneExplain: j.sceneExplain ?? '',
    koreanSummary: j.koreanSummary ?? '',
    imagePrompt: j.imagePrompt ?? {
      intent: '',
      img_style: '',
      camera: { shot_type: '', angle: '', focal_length: '' },
      subject: { pose: '', expression: '', gaze: '', hands: '' },
      lighting: { key: '', mood: '' },
      background: { location: '', dof: '', props: '', time: '' },
    },
    clipPrompt: j.clipPrompt ?? {
      intent: '',
      img_message: '',
      background: { location: '', props: '', time: '' },
      camera_motion: { type: '', easing: '' },
      subject_motion: [{ time: '', action: '' }],
      environment_motion: [{ type: '', action: '' }],
    },
    confirmed: ['prompt_confirmed', 'image_confirmed', 'clip'].includes(
      r.status
    ),
  };
};

export const buildScenesState = (rows: SceneRow[]): ScenesState => {
  const byId = new Map<string, Scene>();
  const order: string[] = [];
  rows
    .slice()
    .sort((a, b) => a.order - b.order)
    .forEach(r => {
      const s = toUiScene(r);
      byId.set(s.id, s);
      order.push(s.id);
    });
  return { byId, order };
};

export const isSameScenesState = (a: ScenesState, b: ScenesState) => {
  if (a.order.length !== b.order.length) return false;
  for (let i = 0; i < a.order.length; i++) {
    if (a.order[i] !== b.order[i]) return false;
  }
  return a.byId.size === b.byId.size;
};
