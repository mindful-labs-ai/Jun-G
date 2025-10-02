import { createClient } from '@/lib/supabase/client';
import {
  CreateProjectInput,
  ProjectRow,
  ProjectScriptUpdateInput,
  SaveAssetInput,
  SaveAssetResponse,
  SceneInsert,
  VideoPreferenceRow,
  VideoPreferenceUpdate,
} from './types';

const supabase = createClient();

export const createProject = async ({
  userId,
  title,
  description,
}: CreateProjectInput) => {
  const { data, error } = await supabase
    .from('projects')
    .insert({
      user_id: userId,
      title,
      description: description ?? null,
    })
    .select('id, user_id, title, description, created_at, updated_at')
    .single();

  if (error) {
    throw new Error(`Create Project Error! ${error}`);
  }

  const projectId =
    typeof data.id === 'string' ? Number(data.id) : (data.id as number);

  const { error: prefErr } = await supabase
    .from('video_preferences')
    .insert({ project_id: projectId })
    .select('id')
    .single();

  if (prefErr) {
    throw new Error(`Create Preference Error! ${error}`);
  }

  return { ...data, id: projectId };
};

export const getProjects = async (userId: number) => {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });

  if (error) {
    throw new Error(`Get Error! ${error}`);
  }

  return data as ProjectRow[];
};

export const getProjectById = async (projectId: number) => {
  const { data, error } = await supabase
    .from('projects')
    .select(
      'id,user_id,title,description,script,narration_version,created_at,updated_at'
    )
    .eq('id', projectId)
    .single();

  if (error) throw error;
  return data as ProjectRow;
};

// TODO : Edge function으로 통일
export const getProjectBundle = async (projectId: number) => {
  const { data: project, error: projectErr } = await supabase
    .from('projects')
    .select(
      'id, user_id, title, description, script, narration_version, created_at, updated_at'
    )
    .eq('id', projectId)
    .maybeSingle();
  if (projectErr) throw projectErr;

  const { data: prefs, error: prefErr } = await supabase
    .from('video_preferences')
    .select('*')
    .eq('project_id', projectId)
    .maybeSingle<VideoPreferenceRow>();
  if (prefErr) throw prefErr;

  const { data: scenes, error: sceneErr } = await supabase
    .from('scenes')
    .select('*')
    .eq('project_id', projectId)
    .order('order', { ascending: true });
  if (sceneErr) throw sceneErr;

  // TODO : 에셋들 불러오기, 조건문으로 version을 비교하고 가져오기.

  return { project, prefs, scenes };
};

export const updatePreferences = async (
  projectId: number,
  patch: VideoPreferenceUpdate
): Promise<VideoPreferenceRow> => {
  const { data, error } = await supabase
    .from('video_preferences')
    .upsert([{ project_id: projectId, ...patch }], { onConflict: 'project_id' })
    .select('*')
    .single();

  if (error) throw new Error(`Update error ${error}`);

  return data as VideoPreferenceRow;
};

export const updateScript = async (input: ProjectScriptUpdateInput) => {
  const { projectId, script } = input;

  const guard = script.trim().slice(0, 2000);

  const { error } = await supabase
    .from('projects')
    .update({ script: guard })
    .eq('id', projectId)
    .select(
      'id, user_id, title, description, script, narration_version, created_at, updated_at'
    )
    .single();

  if (error) throw new Error(`Script Update Error!`);
};

// TODO : Edge function으로 통일
export const upsertScenes = async (rows: SceneInsert[], projectId: number) => {
  const { error: delErr } = await supabase
    .from('scenes')
    .delete()
    .eq('project_id', projectId);
  if (delErr) throw new Error('Scenes DeleteError!');

  const { error: insErr } = await supabase
    .from('scenes')
    .insert(rows)
    .select('id, scene_id, "order"');
  if (insErr) throw new Error('Scenes InsertError!');
};

export const saveAsset = async (
  input: SaveAssetInput
): Promise<SaveAssetResponse> => {
  const { projectId, sceneId, type, dataUrl, fileUrl, mimeType, metadata } =
    input;

  if (!dataUrl && !fileUrl) {
    throw new Error('Provide either dataUrl or fileUrl');
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) throw new Error('Not logged in');

  const resp = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/upsert-asset`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        project_id: projectId,
        scene_id: sceneId ?? null, // null이면 서버에서 narration 처리
        type,
        data_url: dataUrl,
        file_url: fileUrl,
        mime_type: mimeType,
        metadata,
      }),
    }
  );

  const json = await resp.json();
  if (!resp.ok) throw new Error(json?.error || 'edge error');
  return json as SaveAssetResponse;
};
