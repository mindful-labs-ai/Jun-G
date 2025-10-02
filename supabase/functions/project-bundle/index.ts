/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("ANON_KEY")!;
const ASSETS_BUCKET = Deno.env.get("ASSETS_BUCKET") ?? "assets";

type BundleInput = {
  project_id: number;
  // 버킷이 public이 아닐 때 서명 URL이 필요하면 초 단위로 넘김(예: 3600)
  signed_url_expires?: number | null;
};

type AssetRow = {
  id: number;
  parents_id: string;
  version: number;
  user_id: number;
  type: "image" | "clip" | "narration";
  storage_url: string; // "assets/123/456/scene-1_v3.png" 식 (bucket/path)
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
};

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const splitStorageUrl = (storage_url: string) => {
  // "bucket/path/to/file"
  const [bucket, ...rest] = storage_url.split("/");
  return { bucket, path: rest.join("/") };
};

// PostgREST or() 구문은 “,로 이어진 and()” 묶음이다.
// 값에 콤마/괄호가 없다는 전제 하에 안전. (scene_id는 'scene-XX' 형태이므로 OK)
const buildOrClauses = (combos: Array<{ parents_id: string; type: string; version: number }>) => {
  return combos.map(c =>
    `and(parents_id.eq.${c.parents_id},type.eq.${c.type},version.eq.${c.version})`
  );
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

    const rls = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: auth } },
    });

    const body: BundleInput = await req.json();
    const projectId = body?.project_id;
    const signedTTL = body?.signed_url_expires ?? null;

    if (!projectId) {
      return new Response(JSON.stringify({ error: "project_id is required" }), {
        status: 400, headers: { "Content-Type": "application/json", ...cors },
      });
    }

    // 1) project (RLS로 내 것만 조회 가능)
    const { data: project, error: projectErr } = await rls
      .from("projects")
      .select(
        "id, user_id, title, description, script, narration_version, created_at, updated_at",
      )
      .eq("id", projectId)
      .maybeSingle();

    if (projectErr) {
      return new Response(JSON.stringify({ error: projectErr.message }), {
        status: 500, headers: { "Content-Type": "application/json", ...cors },
      });
    }
    if (!project) {
      return new Response(JSON.stringify({ error: "project_not_found" }), {
        status: 404, headers: { "Content-Type": "application/json", ...cors },
      });
    }

    // 2) video_preferences
    const { data: prefs, error: prefErr } = await rls
      .from("video_preferences")
      .select("*")
      .eq("project_id", projectId)
      .maybeSingle();

    if (prefErr) {
      return new Response(JSON.stringify({ error: prefErr.message }), {
        status: 500, headers: { "Content-Type": "application/json", ...cors },
      });
    }

    // 3) scenes
    const { data: scenes, error: sceneErr } = await rls
      .from("scenes")
      .select("*")
      .eq("project_id", projectId)
      .order("order", { ascending: true });

    if (sceneErr) {
      return new Response(JSON.stringify({ error: sceneErr.message }), {
        status: 500, headers: { "Content-Type": "application/json", ...cors },
      });
    }

    // 4) 필요 자산 조합 목록 수집 (포인터만 대상)
    const combos: Array<{ parents_id: string; type: "image" | "clip"; version: number; scene_id: string }> = [];
    for (const s of (scenes ?? [])) {
      const sceneKey = s.scene_id as string;
      const parentsId = `${projectId}-${sceneKey}`;

      if (s.image_version) {
        combos.push({ parents_id: parentsId, type: "image", version: s.image_version, scene_id: sceneKey });
      }
      if (s.clip_version) {
        combos.push({ parents_id: parentsId, type: "clip", version: s.clip_version, scene_id: sceneKey });
      }
    }

    // narration 포인터
    let narrCombo: { parents_id: string; type: "narration"; version: number } | null = null;
    if (project.narration_version) {
      narrCombo = {
        parents_id: `${projectId}-narration`,
        type: "narration",
        version: project.narration_version,
      };
    }

    // 5) assets 조회 (or()로 정확히 해당 버전만) — 덩어리가 큰 경우 안전하게 청크로 분할
    const allClauses: string[] = buildOrClauses(combos);
    if (narrCombo) {
      allClauses.push(
        `and(parents_id.eq.${narrCombo.parents_id},type.eq.${narrCombo.type},version.eq.${narrCombo.version})`,
      );
    }

    let assets: AssetRow[] = [];
    if (allClauses.length > 0) {
      const CHUNK = 40; // or() 구문이 너무 길어지는걸 방지
      for (let i = 0; i < allClauses.length; i += CHUNK) {
        const part = allClauses.slice(i, i + CHUNK).join(",");
        const { data, error } = await rls
          .from("assets")
          .select("*")
          .or(part);
        if (error) {
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500, headers: { "Content-Type": "application/json", ...cors },
          });
        }
        assets = assets.concat(data as AssetRow[]);
      }
    }

    // 6) public/signed URL 변환
    // storage_url = "bucket/path"
    const storage = rls.storage; // 같은 클라이언트 사용
    const decorateUrl = async (row: AssetRow) => {
      const { bucket, path } = splitStorageUrl(row.storage_url);
      if (signedTTL && signedTTL > 0) {
        const { data } = await storage.from(bucket).createSignedUrl(path, signedTTL);
        return { ...row, public_url: data?.signedUrl ?? null };
      }
      const { data } = storage.from(bucket).getPublicUrl(path);
      return { ...row, public_url: data.publicUrl ?? null };
    };

    const decorated: Array<AssetRow & { public_url: string | null }> = [];
    for (const a of assets) {
      decorated.push(await decorateUrl(a));
    }

    // 7) 결과 매핑
    const imagesByScene: Record<string, any> = {};
    const clipsByScene: Record<string, any> = {};
    let narrationAsset: any = null;

    for (const a of decorated) {
      if (a.type === "narration") {
        narrationAsset = a;
        continue;
      }
      // parents_id = `${projectId}-${scene_id}`
      const sceneId = a.parents_id.replace(`${projectId}-`, "");
      if (a.type === "image") imagesByScene[sceneId] = a;
      if (a.type === "clip")  clipsByScene[sceneId]  = a;
    }

    return new Response(JSON.stringify({
      project,
      prefs,
      scenes,
      assets: {
        imagesByScene,
        clipsByScene,
        narration: narrationAsset,
      }
    }), {
      status: 200, headers: { "Content-Type": "application/json", ...cors },
    });

  } catch (e: any) {
    console.error("bundle_failed", e);
    return new Response(JSON.stringify({ error: `bundle_failed: ${e?.message ?? String(e)}` }), {
      status: 500, headers: { "Content-Type": "application/json", ...cors },
    });
  }
});