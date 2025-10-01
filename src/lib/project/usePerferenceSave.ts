import { useMemo, useCallback } from 'react';
import type {
  VideoPreferenceRow,
  VideoPreferenceUpdate,
} from '@/lib/project/types';
import { shallowDiffKeys } from './utils';
import { useUpdatePreferencesAndScript } from './queries';

const DEFAULT_PREFS: VideoPreferenceUpdate = {
  image_gen_model: 'Gemini',
  video_gen_model: 'Seedance',
  voice_gen_model: 'Bin',
  stability: 0.5,
  resolution: '480p',
  ratio: '9:16',
  custom_style: '',
  split_rule: '',
};

export const usePreferenceSave = (opts: {
  projectId: number;
  local: VideoPreferenceUpdate;
  server?: VideoPreferenceRow | null;
  script: string;
  serverScript: string;
}) => {
  const { projectId, local, server, script, serverScript } = opts;
  const base = useMemo<VideoPreferenceUpdate>(
    () =>
      server
        ? {
            image_gen_model: server.image_gen_model,
            video_gen_model: server.video_gen_model,
            voice_gen_model: server.voice_gen_model,
            stability: server.stability,
            resolution: server.resolution,
            ratio: server.ratio,
            custom_style: server.custom_style ?? '',
            split_rule: server.split_rule ?? '',
          }
        : DEFAULT_PREFS,
    [server]
  );

  const dirtyKeys = useMemo(() => shallowDiffKeys(local, base), [local, base]);
  const isDirty = dirtyKeys.length > 0 || script !== serverScript;

  const patch = useMemo<Partial<VideoPreferenceUpdate>>(() => {
    type K = keyof VideoPreferenceUpdate;
    const keys = dirtyKeys as K[];
    const entries = keys.map(
      k => [k, local[k]] as [K, VideoPreferenceUpdate[K]]
    );
    return Object.fromEntries(entries) as Partial<VideoPreferenceUpdate>;
  }, [dirtyKeys, local]);

  const { mutateAsync, isPending } = useUpdatePreferencesAndScript(
    projectId ?? null
  );

  const save = useCallback(async () => {
    if (!projectId) throw new Error('projectId 없음');
    if (!isDirty) return;
    await mutateAsync({
      patch,
      script,
      isPrefChange: dirtyKeys.length > 0,
      isScriptChange: script !== serverScript,
    });
  }, [
    projectId,
    isDirty,
    mutateAsync,
    patch,
    script,
    dirtyKeys.length,
    serverScript,
  ]);

  return { isDirty, dirtyKeys, patch, save, isSaving: isPending };
};
