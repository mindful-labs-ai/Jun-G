/* eslint-disable import/no-unresolved, @typescript-eslint/no-explicit-any */
// @ts-nocheck

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SECRET_KEY")!; // service role
const ASSETS_BUCKET = Deno.env.get("ASSETS_BUCKET") ?? "assets";

const buildStoragePath = (p: {
  userId: number;
  projectId: number;
  sceneKey: string;
  version: number;
  ext: string;
}) => `${p.userId}/${p.projectId}/${p.sceneKey}_v${p.version}.${p.ext}`;

const parseDataUrl = (dataUrl: string) => {
  const m = dataUrl.match(/^data:(.+?);base64,(.+)$/);
  if (!m) throw new Error("Invalid data_url format");
  const [, mime, b64] = m;
  const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
  return { mime, bytes };
};

const extFromMime = (mime?: string) => {
  const m = (mime ?? "").toLowerCase();
  if (m.includes("png")) return "png";
  if (m.includes("jpeg") || m.includes("jpg")) return "jpg";
  if (m.includes("webp")) return "webp";
  if (m.includes("gif")) return "gif";
  if (m.includes("mp4")) return "mp4";
  if (m.includes("webm")) return "webm";
  if (m.includes("quicktime") || m.includes("mov")) return "mov";
  if (m.includes("mpeg")) return "mp3";
  if (m.includes("wav")) return "wav";
  if (m.includes("ogg")) return "ogg";
  if (m.includes("mp4a") || m.includes("m4a") || m.includes("aac")) return "m4a";
  return "bin";
};

type Body = {
  project_id: number;
  scene_id?: string | null; // image/clip이면 필수, narration이면 null 허용
  type: "image" | "clip" | "narration";
  data_url?: string;         // base64 Data URL
  file_url?: string;         // 외부 URL (seedance 등)
  mime_type?: string;        // 선택
  metadata?: Record<string, any>;
};

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: cors });
  }

  try {
    const auth = req.headers.get("Authorization");
    if (!auth) {
      return new Response(JSON.stringify({ error: "Missing Authorization header" }), {
        status: 401, headers: { "Content-Type": "application/json", ...cors },
      });
    }

    // RLS 검증용 (소유자 확인)
    const rls = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: auth } },
    });
    // 쓰기/업로드용 (권한 필요)
    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const body: Body = await req.json();
    const { project_id, scene_id, type, data_url, file_url } = body;

    // 기본 검증
    if (!project_id || !type || (!data_url && !file_url)) {
      return new Response(JSON.stringify({ error: "Invalid body" }), {
        status: 400, headers: { "Content-Type": "application/json", ...cors },
      });
    }
    if ((type === "image" || type === "clip") && !scene_id) {
      return new Response(JSON.stringify({ error: "scene_id required for image/clip" }), {
        status: 400, headers: { "Content-Type": "application/json", ...cors },
      });
    }

    // 1) 세션 사용자 → email
    const { data: userInfo, error: userErr } = await rls.auth.getUser();
    if (userErr || !userInfo?.user?.email) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { "Content-Type": "application/json", ...cors },
      });
    }
    const email = userInfo.user.email!;

    // 2) public.users.id (bigint) 조회
    const { data: pubUser, error: pubUserErr } = await admin
      .from("users")
      .select("id, email")
      .eq("email", email)
      .single();
    if (pubUserErr || !pubUser) {
      return new Response(JSON.stringify({ error: "User row not found" }), {
        status: 403, headers: { "Content-Type": "application/json", ...cors },
      });
    }
    const userId = pubUser.id as number;

    // 3) 프로젝트 소유 검증 (RLS로 접근 가능해야 함)
    const { data: proj, error: projErr } = await rls
      .from("projects")
      .select("id")
      .eq("id", project_id)
      .single();
    if (projErr || !proj) {
      return new Response(JSON.stringify({ error: "Forbidden: not owner" }), {
        status: 403, headers: { "Content-Type": "application/json", ...cors },
      });
    }

    // 4) parents_id & sceneKey
    const sceneKey = scene_id ?? "narration";
    const parents_id = `${project_id}-${sceneKey}`; // varchar(30) 제한 내 (scene_id가 20자 제한)
    if (parents_id.length > 30) {
      return new Response(JSON.stringify({ error: "parents_id too long (>30)" }), {
        status: 400, headers: { "Content-Type": "application/json", ...cors },
      });
    }

    // 5) 데이터 바이트 준비 (data_url 우선, fallback: file_url 페치)
    let bytes: Uint8Array;
    let mime = body.mime_type ?? "";
    if (data_url) {
      const parsed = parseDataUrl(data_url);
      bytes = parsed.bytes;
      mime = mime || parsed.mime;
    } else {
      const res = await fetch(file_url!);
      if (!res.ok) throw new Error(`fetch file_url failed: ${res.status}`);
      bytes = new Uint8Array(await res.arrayBuffer());
      mime = mime || res.headers.get("content-type") || "application/octet-stream";
    }
    const ext = extFromMime(mime);

    // 6) 다음 버전 계산 (assets 기준 max(version)+1)
    const getNextVersion = async () => {
      const { data: row, error } = await admin
        .from("assets")
        .select("version")
        .eq("parents_id", parents_id)
        .eq("type", type)
        .order("version", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw new Error(`version_query_failed: ${error.message}`);
      return (row?.version ?? 0) + 1;
    };

    let version = await getNextVersion();

    // 7) 스토리지 업로드
    const path = buildStoragePath({
      userId, projectId: project_id, sceneKey, version, ext,
    });

    const { error: uploadErr } = await admin
      .storage
      .from(ASSETS_BUCKET)
      .upload(path, bytes, { contentType: mime, upsert: false });

    if (uploadErr) {
      return new Response(JSON.stringify({ error: `upload_failed: ${uploadErr.message}` }), {
        status: 500, headers: { "Content-Type": "application/json", ...cors },
      });
    }

    // 8) assets INSERT (경합 시 1회 재시도: unique(parents_id,type,version))
    const storage_url = `${ASSETS_BUCKET}/${path}`;
    const insertOnce = async (v: number) => {
      return await admin
        .from("assets")
        .insert({
          parents_id,
          version: v,
          user_id: userId,
          type,
          storage_url,
          metadata: body.metadata ?? {},
        })
        .select("id, parents_id, version, type, storage_url")
        .single();
    };

    let { data: asset, error: insErr } = await insertOnce(version);
    if (insErr && String((insErr as any).code) === "23505") {
      // unique_violation → 버전 재조회 후 1회 재시도
      version = await getNextVersion();
      const second = await insertOnce(version);
      asset = second.data;
      insErr = second.error;
    }
    if (insErr || !asset) {
      return new Response(JSON.stringify({ error: `insert_failed: ${insErr?.message}` }), {
        status: 500, headers: { "Content-Type": "application/json", ...cors },
      });
    }

    // 9) 포인터 갱신 (정확한 행만) — 이미지/클립은 scenes, 나레이션은 projects
    if (type === "image" || type === "clip") {
      // 반드시 scene_id로 특정 씬 1행만 갱신
      const { data: srow, error: sErr } = await admin
        .from("scenes")
        .select("image_version, clip_version")
        .eq("project_id", project_id)
        .eq("scene_id", scene_id!) // 정확 매칭
        .single();

      if (sErr || !srow) {
        console.error("scene_not_found_for_pointer", { project_id, scene_id, sErr });
      } else {
        const payload: Record<string, number> = {};
        if (type === "image") {
          if ((srow.image_version ?? 0) < version) payload.image_version = version;
        } else {
          if ((srow.clip_version ?? 0) < version) payload.clip_version = version;
        }
        if (Object.keys(payload).length > 0) {
          const { error: upErr } = await admin
            .from("scenes")
            .update(payload)
            .eq("project_id", project_id)
            .eq("scene_id", scene_id!);
          if (upErr) console.error("pointer_update_failed(scenes)", upErr);
        }
      }
    } else {
      // narration → projects.narration_version
      const { data: prow, error: pErr } = await admin
        .from("projects")
        .select("narration_version")
        .eq("id", project_id)
        .single();

      if (pErr || !prow) {
        console.error("project_not_found_for_pointer", { project_id, pErr });
      } else if ((prow.narration_version ?? 0) < version) {
        const { error: upErr } = await admin
          .from("projects")
          .update({ narration_version: version })
          .eq("id", project_id);
        if (upErr) console.error("pointer_update_failed(projects)", upErr);
      }
    }

    // 10) 응답
    return new Response(
      JSON.stringify({
        ok: true,
        asset_id: asset.id,
        parents_id,
        type,
        version,
        bucket: ASSETS_BUCKET,
        path,
        storage_url,
      }),
      { status: 201, headers: { "Content-Type": "application/json", ...cors } }
    );
  } catch (e: any) {
    console.error("edge_failed", e);
    return new Response(JSON.stringify({ error: `edge_failed: ${e?.message ?? String(e)}` }), {
      status: 500, headers: { "Content-Type": "application/json", ...cors },
    });
  }
});