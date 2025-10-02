import { QueryObserverResult, RefetchOptions } from '@tanstack/react-query';

export type FunnelProps = {
  reset: () => void;
  step: number;
  next: () => void;
  prev: () => void;
  selectProject: (id: number) => void;
  projectIdRef: React.RefObject<number | null>;
  signal: number;
};

export type QueryProps = {
  projectList: ProjectRow[];
  refetch: (
    options?: RefetchOptions
  ) => Promise<QueryObserverResult<any[], Error>>;
};

export type StateProps = {
  preference: Partial<
    Omit<VideoPreferenceRow, 'updated_at' | 'id' | 'project_id' | 'created_at'>
  >;
  chancePreference: <K extends keyof VideoPreferenceUpdate>(
    key: K,
    value: VideoPreferenceUpdate[K]
  ) => void;
  aspectOptions: string[];
  resolutionOptions: number[];
  script: string;
  setScript: React.Dispatch<React.SetStateAction<string>>;
};

export type CreateProjectInput = {
  userId: number;
  title: string;
  description?: string | null;
};

export type ProjectScriptUpdateInput = {
  projectId: number;
  script: string;
};

export type ProjectRow = {
  id: number;
  user_id: number;
  title: string;
  description: string | null;
  created_at: string;
  updated_at: string;
};

export type SceneJson = Record<string, unknown>;
export type AssetMetadata = Record<string, unknown>;

export type SceneStatus =
  | 'init'
  | 'prompt'
  | 'prompt_confirmed'
  | 'image'
  | 'image_confirmed'
  | 'clip';

export interface SceneRow {
  id: number;
  project_id: number;
  user_id: number;
  status: SceneStatus;
  scene_id: string;
  scene_json: SceneJson;
  image_version: number | null;
  clip_version: number | null;
  order: number;
  no_subject: boolean;
  created_at: string;
  updated_at: string;
}

export type SceneInsert = {
  project_id: number;
  user_id: number;
  scene_id: string;
  order: number;
  scene_json?: SceneJson;
  status?: SceneStatus;
  image_version?: number | null;
  clip_version?: number | null;
  no_subject?: boolean;
};

export type SceneUpdate = Partial<
  Omit<SceneRow, 'id' | 'project_id' | 'user_id' | 'created_at' | 'updated_at'>
>;

export type AssetType = 'narration' | 'clip' | 'image';

export interface AssetRow {
  id: number;
  parents_id: string;
  version: number;
  user_id: number;
  type: AssetType;
  storage_url: string;
  metadata: AssetMetadata;
  created_at: string;
  updated_at: string;
}

export type AssetInsert = {
  parents_id: string;
  user_id: number;
  type: AssetType;
  storage_url: string;
  version?: number;
  metadata?: AssetMetadata;
};

export type AssetUpdate = Partial<
  Omit<AssetRow, 'id' | 'user_id' | 'created_at' | 'updated_at'>
>;

export type ImageGenModel = 'Gemini' | 'GPT' | (string & {});
export type VideoGenModel = 'Seedance' | 'Kling' | (string & {});
export type VoiceGenModel = 'Bin' | 'Otani' | (string & {});
export type ResolutionPreset = '480p' | '720p' | '1080p' | (string & {});
export type RatioPreset =
  | '1:1'
  | '4:3'
  | '3:4'
  | '16:9'
  | '9:16'
  | (string & {});

export interface VideoPreferenceRow {
  id: number;
  project_id: number;
  image_gen_model: ImageGenModel;
  video_gen_model: VideoGenModel;
  voice_gen_model: VoiceGenModel;
  stability: number;
  resolution: ResolutionPreset;
  ratio: RatioPreset;
  custom_style: string | null;
  split_rule: string | null;
  created_at: string;
  updated_at: string;
}

export type VideoPreferenceInsert = {
  project_id: number;
  image_gen_model?: ImageGenModel;
  video_gen_model?: VideoGenModel;
  voice_gen_model?: VoiceGenModel;
  stability?: number;
  resolution?: ResolutionPreset;
  ratio: RatioPreset;
  custom_style?: string | null;
  split_rule?: string | null;
};

export type VideoPreferenceUpdate = Partial<
  Omit<VideoPreferenceRow, 'id' | 'project_id' | 'created_at' | 'updated_at'>
>;

export type AIGeneratedScene = {
  id: string;
  originalText: string;
  englishPrompt: string;
  sceneExplain: string;
  koreanSummary: string;
  imagePrompt: unknown;
  clipPrompt: unknown;
  confirmed: boolean;
};

export type PrepareOptions = {
  /** DB 기록할 초기 상태 (default: 'prompt') */
  status?: SceneStatus;
  /** order 시작값 (default: 1) */
  startOrderAt?: number;
  /** no_subject 기본값 (default: false) */
  noSubjectDefault?: boolean;
  /** scene_id 최대 길이 (default: 20) */
  maxIdLength?: number;
  /** 이미 DB 등에 존재하는 scene_id 들(충돌 회피용) */
  existingSceneIds?: string[];
};

export type SaveAssetInput = {
  projectId: number;
  sceneId?: string | null;
  type: 'image' | 'clip' | 'narration';
  dataUrl?: string;
  fileUrl?: string;
  mimeType?: string;
  metadata?: Record<string, unknown>; // 임의 메타
};

export type SaveAssetResponse = {
  ok: true;
  asset_id: number;
  parents_id: string;
  type: 'image' | 'clip' | 'narration';
  version: number;
  bucket: string;
  path: string;
  storage_url: string;
  mime: string;
};

export type BundleResponse = {
  project: {
    id: number;
    user_id: number;
    title: string;
    description: string | null;
    script: string | null;
    narration_version: number | null;
    created_at: string;
    updated_at: string;
  } | null;
  prefs: VideoPreferenceRow | null;
  scenes: any[];
  assets?: {
    imagesByScene: Record<string, any>;
    clipsByScene: Record<string, any>;
    narration: any | null;
  };
};
