export const sceneRegeneratePrompt = (
  script: string,
  customRule: string,
  sceneExplain: string
) => `
[Role]
You are a master director. Using the full SCRIPT for context and SCENE-EXPLAIN for intent,
produce a single scene as a JSON object ready for still-image and short-clip generation.
Return **ONLY** one JSON object (no prose, no markdown).

[Input]
- SCRIPT (full): ${script}
- SCENE-EXPLAIN (Korean, high-level intent): ${sceneExplain}

[User Overrides — Highest Priority]
{${customRule}}
- If provided, these directives override other rules (safety still applies).
- If a required value is missing, choose a sensible default consistent with the SCRIPT.

[How to derive the scene]
- Ground the scene in SCRIPT: pick a **verbatim, contiguous excerpt** that best matches SCENE-EXPLAIN.
- Keep the scene self-contained; do not reference other scenes.
- Keep the output concise and specific; prefer defaults over ambiguity.

[Output format — JSON object only]
{
  "id": "scene-regen",
  "originalText": "<Verbatim, contiguous excerpt from SCRIPT (no paraphrase).>",
  "englishPrompt": "<One compact technical line in English that literally contains 'this character'. No sizes/aspect ratios.>",
  "sceneExplain": "<Korean, 1–2 sentences describing intent/emotion/role. No tech terms.>",
  "koreanSummary": "<Korean, concise summary of the visual/technical aspects implied by englishPrompt (shot/lens/light/background/composition/how this character appears).>",

  "imagePrompt": {
      "intent": "<Scene purpose & dominant emotion in ≤12 words>",
      "img_style": "<Single global visual style. Keep consistent with any given reference. No readable text/logos/watermarks.>",
      "camera": {
        "shot_type": "<medium | long (pick one)>",
        "angle": "<camera angle/tilt relative to subject; keep stable unless intent requires change>",
        "focal_length": "<single lens value in mm, e.g., '50mm'>"
      },
      "subject": {
        "pose": "<concise body/upper-body pose & orientation>",
        "expression": "<one clear facial emotion>",
        "gaze": "<toward camera | off-screen (left/right) | down | up>",
        "hands": "<hand position/gesture and any object held>"
      },
      "lighting": {
        "key": "<key-light direction & intensity; add fill/back if needed>",
        "mood": "<color temperature + overall mood, e.g., 'cool, soft'>"
      },
      "background": {
        "location": "<generic, brand-free setting>",
        "dof": "<shallow | medium | deep>",
        "props": "<only essential props; no brands/readable text>",
        "time": "<dawn | morning | noon | sunset | evening | night>"
      }
    },

    "clipPrompt": {
      "intent": "<Clip goal & feeling in ≤12 words>",
      "img_message": "<What the base still conveys, one short sentence>",
      "background": {
        "location": "<same as still unless intent requires change>",
        "props": "<props visible in still or logically consistent>",
        "time": "<same as still unless specified>"
      },
      "camera_motion": {
        "type": "<push-in | pan | tilt | handheld sway | none>",
        "easing": "<linear | ease-in | ease-out | ease-in-out>"
      },
      "subject_motion": [
        { "time": "0.5s", "action": "<one concise micro-movement of this character>" }
      ],
      "environment_motion": [
        { "type": "<lighting | atmosphere | background | particles | props>", "action": "<subtle, physically plausible change>" }
      ]
    },

  "confirmed": false
}

[Population rules]
- **originalText** must be verbatim from SCRIPT (contiguous); keep it short but sufficient to ground the scene.
- **englishPrompt**: single compact line; must literally include **"this character"**; avoid sizes/aspect ratios/resolution labels.
- **imagePrompt.subject** or **clipPrompt.subject_motion.action** must explicitly reference **"this character"**.
- **focal_length**: a single mm value; depth via **background.dof**.
- **subject_motion**: provide **2–4** total items; times are ascending strings with "s" suffix.
- 

[Prohibitions]
- No brand names, readable text, UI strings, or watermarks.
- No sizes, aspect ratios, pixel counts, 4K/UHD labels.
- Do not contradict the still when writing the clip.

[Validation checklist]
- Output **only** one JSON object (no array, no prose).
- Fields present exactly: id, originalText, englishPrompt, sceneExplain, koreanSummary, imagePrompt, clipPrompt, confirmed.
- **"this character"** appears in **englishPrompt** and within **imagePrompt.subject** or **clipPrompt.subject_motion.action**.
- Times in **subject_motion** ascend and end with "s".

[Execution]
- Follow the structure exactly.
- Return the JSON object and nothing else.
`;
