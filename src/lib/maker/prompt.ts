export const scenePrompt = (
  script: string,
  customRule: string,
  globalStyle: string
) => `
[Role]
You are a master director. Split the SCRIPT into video-ready scenes and, for each scene, fill the structured fields to directly generate a still image and a short clip.
Return **ONLY** a JSON array (no prose, no markdown).

[Input]
- SCRIPT: ${script}

[Output format — JSON array only]
[
  {
    "id": "scene-1",
    "originalText": "<Verbatim, contiguous excerpt from SCRIPT (no paraphrase).>",
    "englishPrompt": "<One compact technical description in English that literally contains 'this character'. No sizes/aspect ratios.>",
    "sceneExplain": "<Korean, 1–2 sentences describing intent/emotion/role. No tech terms.>",
    "koreanSummary": "<Korean, concise summary of the visual/technical aspects implied by englishPrompt (shot/lens/light/background/composition/how this character appears).>",

    "imagePrompt": {
      "intent": "<Scene purpose & dominant emotion in ≤12 words>",
      "img_style": "${globalStyle}",
      "camera": {
        "shot_type": "<close-up | medium | long (pick one)>",
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
]

[User Overrides — Highest Priority]
- If provided, these directives OVERRIDE any conflicting rules below.
- Safety still applies (no brands/readable text/watermarks).
- If a required value is missing, fall back to defaults.
- If per-scene overrides exceed the scene count, ignore extras.

[USER_OVERRIDES_TEXT]
{${customRule}}   ← (선택) 유저 자연어 지시문


[Priority Hierarchy]
1) User Overrides (Text/JSON) > 2) Prohibitions/Safety > 3) Validation checklist > 4) Diversity rules > 5) Defaults

[Segmentation rules]
1) Split by **semantic beats**, not sentence boundaries. If meaning shifts inside one sentence, split it.
2) Start a new scene when any of these change:
   - **Action/attention** of **this character** (gaze/gesture/posture/hand)
   - **Emotion/intent/tone** (e.g., calm → anxious)
   - **Viewpoint/POV** or implied **camera intent**
   - **Time/causal/transition** signals (“then/suddenly/however/therefore…”)
   - **Quotation/inner monologue** starts or ends
3) "originalText" = **verbatim, contiguous** span from SCRIPT (no paraphrase; do not merge non-contiguous spans).
4) Keep one scene to **1–3 short clauses** (~5–35 words). Merge fragments <5 words with a neighboring scene of the same meaning.
5) For lists, prefer **one item = one scene**, unless trivial.

[Global diversity & anti-duplication rules]
- Close-up quota: Keep **close-up** shots to **≤ 25%** of all scenes.
- Shot variety: Across the array, mix **close/medium/long**; for **angle**, include **≥ 3 distinct types** overall (e.g., eye-level / low / high / over-the-shoulder / POV / profile).
- Lens variety: Do **not** reuse the same **focal_length** in adjacent scenes (e.g., rotate 35mm → 50mm → 85mm).
- Composition variety: Avoid repeating the same framing (front / three-quarter / side), subject placement (center / off-center), and **dof** across adjacent scenes.
- Anti-duplication: If the following **Scene Signature** matches or is near-duplicate, **merge** or **alter** the scene:
  Scene Signature = { originalText(core meaning) + imagePrompt.camera.shot_type + imagePrompt.camera.angle + imagePrompt.subject.pose + imagePrompt.background.location }.
- Near-duplicate check: If two adjacent scenes share {shot_type, angle, location}, change at least one of:
  **subject.pose**, **camera.angle/shot_type/focal_length**, or **lighting.direction** to differentiate.
- Window balance: In every **block of 4 scenes**, ensure at least one **long**, one **medium**, and one **close** shot appear.

[Population rules — map to the JSON fields]
- **englishPrompt**: single compact line in English; must literally include **"this character"**; no sizes/aspect ratios/resolution.
- **imagePrompt.subject**: write actions/appearance so the subject clearly refers to **"this character"** (the literal phrase must appear at least once in subject/pose/hands/gaze or in englishPrompt).
- **background.props**: strictly brand-free; no readable UI text/logos/watermarks anywhere.
- **imagePrompt.camera.focal_length**: one value in mm (e.g., "50mm"); infer DOF via **background.dof**.
- **Variety hooks**: Prefer changing **shot_type / angle / focal_length / subject.pose / lighting.key** between adjacent scenes to avoid repetition.
- **clipPrompt.subject_motion**: provide **2–4** entries total; ascending **time** strings (e.g., "0.0s", "1.2s"); each **action** references **"this character"** with subtle, realistic micro-movements (blink, breath, hair/fabric ripple, small glance/shift).
- **camera_motion**: pick **one** clear type; pair with an **easing** curve.
- **environment_motion**: **0–2** subtle items max; physically plausible; consistent with still (e.g., light flicker, gentle steam, screen glow, dust motes).
- **img_style**: as entered.

[Prohibitions]
- No sizes, aspect ratios, pixel counts, 4K/UHD labels.
- No brand names, readable text, watermarks.
- Do not introduce new objects/locations contradictory to the still.

[Validation checklist]
- Output **only** the JSON array.
- Each scene object includes exactly these fields:
  id, originalText, englishPrompt, sceneExplain, koreanSummary, imagePrompt, clipPrompt, confirmed
- **"this character"** appears in **englishPrompt** and within **imagePrompt.subject** or **clipPrompt.subject_motion.action**.
- Background/props are brand-free and contain **no readable text**.
- Times in **subject_motion** are ascending strings with "s" suffix.
- **Diversity checks**:
  • Close-up shots ≤ 25% overall  
  • In every 4-scene window, at least one long + one medium + one close  
  • ≥ 3 distinct **angles** used across the array  
  • No adjacent repetition of {shot_type, angle, focal_length} without variation  
  • No Scene Signature duplicates (merged or differentiated)

[Execution]
- Follow the structure exactly.
- Return the JSON array and nothing else.
`;
