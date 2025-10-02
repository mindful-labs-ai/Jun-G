/* eslint-disable import/no-unresolved, @typescript-eslint/no-explicit-any */
// @ts-nocheck
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SECRET_KEY")!;
const ASSETS_BUCKET = Deno.env.get("ASSETS_BUCKET") ?? "assets";
const DEBUG = Deno.env.get("DEBUG") === "1";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (status: number, payload: unknown) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json", ...cors },
  });

const ok = (payload: unknown) => json(201, payload);
const err = (status: number, message: string, extra?: Record<string, unknown>) =>
  json(status, DEBUG ? { error: message, extra } : { error: message });

type Body = {
  project_id: number;
  scene_id?: string | null;
  type: "image" | "clip" | "narration";
  data_url?: string;
  file_url?: string;
  mime_type?: string;
  metadata?: Record<string, any>;
};

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

// 저장 경로: assets/{user_id}/{project_id}/{sceneId|narration}_v{version}.{ext}
const buildPath = (p: {
  userId: number;
  projectId: number;
  sceneId?: string | null;
  version: number;
  ext: string;
}) => {
  const sceneSlug = p.sceneId ?? "narration";
  return `${p.userId}/${p.projectId}/${sceneSlug}_v${p.version}.${p.ext}`;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const auth = req.headers.get("Authorization");
    if (!auth) return err(401, "Missing Authorization header");

    // RLS용 (소유권 검증)
    const rls = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: auth } },
    });
    // 권한 작업용
    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const body: Body = await req.json().catch(() => ({} as Body));
    const { project_id, scene_id, type, data_url, file_url } = body;

    if (!project_id || !type || (!data_url && !file_url)) {
      return err(400, "Invalid body", { body });
    }

    // 1) 세션 → 이메일
    const { data: uinfo, error: uerr } = await rls.auth.getUser();
    if (uerr || !uinfo?.user?.email) {
      return err(401, "Unauthorized", { uerr });
    }
    const email = uinfo.user.email;

    // 2) public.users → bigint id
    const { data: pubUser, error: pubUserErr } = await admin
      .from("users")
      .select("id, email")
      .eq("email", email)
      .single();
    if (pubUserErr || !pubUser) {
      return err(403, "User row not found", { email, pubUserErr });
    }
    const userId = Number(pubUser.id);

    // 3) 프로젝트 RLS로 소유권 검증
    const { data: proj, error: projErr } = await rls
      .from("projects")
      .select("id")
      .eq("id", project_id)
      .single();
    if (projErr || !proj) {
      return err(403, "Forbidden: not owner", { project_id, projErr });
    }

    // 4) parents_id 규칙
    const parents_id = `${project_id}-${scene_id ?? "narration"}`;
    if (parents_id.length > 30) {
      return err(400, "parents_id too long (>30)", { parents_id });
    }

    // 5) 바이트/타입 준비
    let bytes: Uint8Array;
    let mime = body.mime_type ?? "";
    if (data_url) {
      try {
        const parsed = parseDataUrl(data_url);
        bytes = parsed.bytes;
        mime = mime || parsed.mime;
      } catch (e) {
        return err(400, "Invalid data_url", { message: String(e) });
      }
    } else {
      // file_url: HEAD 없이 바로 GET (TOS 등 HEAD 금지 케이스 회피)
      let res: Response;
      try {
        res = await fetch(file_url!, {
          redirect: "follow",
          cache: "no-store",
        });
      } catch (e) {
        return err(424, "fetch threw exception", {
          message: String(e),
          file_url,
        });
      }
      if (!res.ok) {
        return err(424, "fetch file_url failed", {
          status: res.status,
          file_url,
        });
      }
      bytes = new Uint8Array(await res.arrayBuffer());
      mime = mime || res.headers.get("content-type") || "application/octet-stream";
    }
    const ext = extFromMime(mime);

    // 6) 다음 버전 계산
    const getNextVersion = async () => {
      const { data: row, error } = await admin
        .from("assets")
        .select("version")
        .eq("parents_id", parents_id)
        .eq("type", type)
        .order("version", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return (row?.version ?? 0) + 1;
    };

    let version = await getNextVersion();

    // 업로드 함수
    const uploadAt = async (v: number) => {
      const objectPath = buildPath({
        userId,
        projectId: project_id,
        sceneId: scene_id ?? null,
        version: v,
        ext,
      });
      const { error: uploadErr } = await admin.storage
        .from(ASSETS_BUCKET)
        .upload(objectPath, bytes, { contentType: mime, upsert: false });
      return { objectPath, uploadErr };
    };

    // 7) 1차 업로드
    const first = await uploadAt(version);
    if (first.uploadErr) {
      return err(500, "upload failed", { message: first.uploadErr.message });
    }

    const storageUrlFor = (path: string) => `${ASSETS_BUCKET}/${path}`;

    // 8) insert 시도
    const insertOnce = async (v: number, path: string) => {
      const payload = {
        parents_id,
        version: v,
        user_id: userId,
        type,
        storage_url: storageUrlFor(path),
        metadata: body.metadata ?? {},
      };
      const { data, error } = await admin
        .from("assets")
        .insert(payload)
        .select("id, parents_id, version, type, storage_url")
        .single();
      return { data, error };
    };

    let { data: asset, error: insErr } = await insertOnce(version, first.objectPath);

    // 9) 버전 경합(23505) → 재시도
    if (insErr && String((insErr as any).code) === "23505") {
      // 새 버전 구해서 다시 업로드/insert
      const prevPath = first.objectPath;
      version = await getNextVersion();
      const second = await uploadAt(version);
      if (second.uploadErr) {
        // 2차 업로드도 실패 → 이전 파일 orphan일 수 있으나 보고만
        return err(500, "re-upload failed after conflict", {
          message: second.uploadErr.message,
        });
      }
      const secondIns = await insertOnce(version, second.objectPath);
      asset = secondIns.data;
      insErr = secondIns.error;

      // 가능하면 이전 업로드 정리(실패해도 무시)
      try {
        await admin.storage.from(ASSETS_BUCKET).remove([prevPath]);
      } catch (_e) {
        // no-op
      }
    }

    if (insErr || !asset) {
      return err(500, "insert failed", { message: String(insErr?.message ?? insErr) });
    }

    // 10) OK
    return ok({
      ok: true,
      asset_id: asset.id,
      parents_id,
      type,
      version,
      bucket: ASSETS_BUCKET,
      path: asset.storage_url.replace(`${ASSETS_BUCKET}/`, ""), // 경로만
      storage_url: asset.storage_url,
      mime,
    });
  } catch (e: any) {
    return err(500, "unhandled error", { message: String(e?.message ?? e) });
  }
});