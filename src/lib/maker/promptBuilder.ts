import { Scene } from "@/lib/maker/types";

type SceneLike = {
  id: string;
  image_prompt?: unknown;
  clip_prompt?: unknown;
};

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function flattenKV(obj: Record<string, unknown>, prefix = ""): string[] {
  const out: string[] = [];
  for (const key of Object.keys(obj)) {
    const val = obj[key];
    const path = prefix ? `${prefix}.${key}` : key;
    if (isPlainObject(val)) {
      out.push(...flattenKV(val, path));
    } else if (Array.isArray(val)) {
      const arr = val.map((v) =>
        typeof v === "string" ? v : JSON.stringify(v)
      );
      out.push(`${path}: ${arr.join(", ")}`);
    } else if (typeof val !== "undefined") {
      out.push(`${path}: ${String(val)}`);
    }
  }
  return out;
}

export function buildImagePromptText(scene: SceneLike): string {
  const src = scene.image_prompt;
  if (typeof src === "string") return src;
  if (isPlainObject(src)) {
    const lines = flattenKV(src);
    const suffix =
      "No text, no logos, no watermarks. Keep the art style of this character and the background consistent.";
    return `${lines.join("\n")}\n\n${suffix}`;
  }
  return "";
}

export function buildClipPromptText(scene: SceneLike): string {
  const src = scene.clip_prompt;
  if (typeof src === "string") return src;
  if (isPlainObject(src)) {
    const lines = flattenKV(src);
    const suffix =
      "Keep motion subtle and natural. Do not introduce new objects or readable text.";
    return `${lines.join("\n")}\n\n${suffix}`;
  }
  return "";
}

export function compileImagePromptToText(scene: Scene): string {
  if (scene.image_prompt_override?.trim()) return scene.image_prompt_override;

  const ip = scene.image_prompt;
  const lines = [
    `${ip.core_structure.image_organization}; subject: ${ip.core_structure.primary_subject}`,
    `style: ${ip.style_definition.primary_style}; lighting: ${ip.style_definition.lighting_control}`,
    `shot: ${ip.technical_specifications.camera_settings.shot_type}, ${ip.technical_specifications.camera_settings.focal_length}, ${ip.technical_specifications.camera_settings.aperture_effects}`,
    `DoF: ${ip.technical_specifications.camera_settings.depth_of_field}; env: ${ip.environmental_factors.setting}`,
    `composition: ${ip.composition_controls.framing} / ${ip.composition_controls.perspective}`,
    `emotion: ${scene.image_emotional_en}`,
    `${ip.constraints.style_unification}. ${ip.constraints.prohibitions}`,
  ];
  return lines.join(". ");
}

export function compileClipPromptToText(scene: Scene): string {
  if (scene.clip_prompt_override?.trim()) return scene.clip_prompt_override;

  const cp = scene.clip_prompt;
  const t = cp.technical_specifications;
  const md = t.motion_design;

  const lines = [
    `shot: ${cp.core_structure.shot_organization}; composition: ${cp.core_structure.composition_style}`,
    `camera: ${t.camera_settings.movement} (${t.camera_settings.speed_profile})`,
    `subject micro: ${md.subject_micro}; env motion: ${md.environment_motion}`,
    `parallax: ${cp.composition_controls.parallax}`,
    `timing: ${t.timing.target_duration_s}s (${t.timing.beats})`,
    `emotion: ${scene.clip_emotional_en}`,
    `${cp.constraints.style_unification}. ${cp.constraints.prohibitions}`,
  ];
  return lines.join(". ");
}
