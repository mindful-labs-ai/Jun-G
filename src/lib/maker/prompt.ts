export const scenePrompt = (script: string) => `
[Role]
You are famous master director, split a story script into video-ready scenes and craft each scene into an English prompt suitable for image generation. Output MUST be a JSON array only.

[Input]
- SCRIPT: ${script}

[Output format (JSON array only)]
[
  {
    "id": "scene-1",
    "originalText": "<Insert the exact original script text for this scene (verbatim).>",
    "englishPrompt": "<Technical, image-generation prompt in English. Must literally include the words 'this character'.>",
    "sceneExplain": "<In Korean, 1–2 sentences that describe the scene’s narrative intent/emotion/role (no technical terms).>",
    "koreanSummary": "<In Korean, a concise summary of the englishPrompt’s visual/technical elements (shot/lens/lighting/background/composition/how this character appears).>",
    "imagePrompt": "<One-line English prompt that MERGES the technical description from englishPrompt with the narrative intent of sceneExplain, phrased for image generation. Must literally include 'this character'. End with: No text, no logos, no watermarks. Keep the art style of this character and the background consistent.>",
    "clipPrompt": "<One-line English motion prompt for turning the image into a short video: describe subtle, realistic motion (camera push-in/pan, gentle handheld sway, parallax; micro-movements like this character blinking, hair/breath, fabric ripple; environmental motion like rain/drizzle, steam, light flicker). Must literally include 'this character'. Do NOT introduce new objects or text. No size/aspect/resolution numbers. No logos/watermarks.>",
    "confirmed": false
  },
  ...
]

[Segmentation rules]
1) Split by **semantic beats**, not sentence boundaries. If meaning shifts inside a single sentence, split it.
2) Start a new scene when any of the following changes occur:
   - **Action/attention** change of **this character** (gaze, hand movement, gesture, posture)
   - **Emotion/intent/tone** shift (e.g., anxiety → resolve, calm → panic)
   - **Viewpoint/POV** or implied **camera intent** change (frontal → over-the-shoulder; observational → subjective)
   - **Time/causal/transition** signals (“then / suddenly / soon / eventually / however / but / therefore”)
   - **Contrastive/turning conjunctions** that split independent meanings (“, and / , but / —” segments)
   - **Quotation/dialogue/inner monologue** starts or ends
3) "originalText" must be a **verbatim, contiguous span** from the SCRIPT (no paraphrase; do not merge non-contiguous spans).
4) Keep one scene to **1–3 short clauses** (≈5–35 words).
   - Very small fragments (<5 words) should be **merged** with an adjacent scene of the same meaning.
   - If a single sentence contains **multiple actions/meanings**, **split** them.
5) For lists/enumerations, prefer **“one item = one scene”**, unless items are trivial—then group them.
6) "id" increments from **"scene-1"** and **preserves source order**.

[englishPrompt guidelines — technical (CRITICAL)]
- Every scene must literally include the words **"this character"**.
- Do NOT include image size/resolution/aspect-ratio (e.g., 9:16, 1024×1024, 4K, UHD).
- Explicitly include:
  1) **Camera**: shot type (close-up/medium/over-the-shoulder/top-down…), **lens (mm)**, **aperture (f/ value)**, **camera height/angle**
  2) **Subject**: explicitly tie to **this character** (e.g., “this character’s hands”, “this character holding a phone”, “POV of this character”)
  3) **Lighting**: key/fill/back, color (warm/cool), direction (left/right/back), mood (soft/hard/moody)
  4) **Background**: location/material/bokeh/DOF (shallow/deep), props (no brands/readable text)
  5) **Composition**: rule of thirds/negative space/split-screen, etc.
  6) **Prohibitions**: **No text, no logos, no watermarks.**
- Tone & mood: visually imply the script’s emotion (anxiety, contemplation, hope, etc.).
- Example phrasing:
  - “Cinematic close-up (85mm, f/1.8) of this character …”
  - “Top-down 35mm POV of this character’s phone …”
  - “Macro 100mm of this character’s hands …”
  - “Split-screen with this character on the right …”

[sceneExplain guidelines — narrative (Korean)]
- Write in **Korean**, 1–2 sentences.
- Explain the scene’s intent/emotion/narrative role (e.g., opening that recognizes anxiety in a happy moment).
- No camera/tech terms. No new story beyond the original script.

[koreanSummary guidelines — technical summary (Korean)]
- In **Korean**, concisely summarize key visual/technical elements of englishPrompt (shot/lens/lighting/background/composition/how this character appears).
- This is not a story summary; it’s a prompt-structure summary.

[imagePrompt guidelines — combined, one-line (English)]
- **One line only**, in **English**.
- Merge the **technical description** from englishPrompt with the **narrative intent** from sceneExplain (translate/compress the intent into English).
- Must literally include **"this character"**.
- Do NOT add size/resolution/aspect ratio.
- Start with the technical composition; then append a short clause that conveys the intent/emotion (e.g., “— conveying a fleeting joy tinged with anxiety”).
- End with: **No text, no logos, no watermarks. Keep the art style of this character and the background consistent.**

[clipPrompt guidelines — motion (English, one line)]
- **One line only**, in **English**.
- Describe natural motion to animate the still: camera movement (slow push-in/pan/tilt/handheld sway), subject micro-movements (this character blinking, breathing, hair sway), and/or environmental motion (subtle rain, steam, ripples, neon flicker).
- Must literally include **"this character"**.
- Keep consistent with the still image; do NOT introduce new objects, locations, or readable text.
- No size/aspect/resolution numbers, no timestamps/durations, no logos/watermarks.

[Validation checklist]
- Did you output **only** the JSON array? (No extra prose/markdown.)
- Does each object contain exactly these 8 fields?
  id, originalText, englishPrompt, sceneExplain, koreanSummary, imagePrompt, clipPrompt, confirmed
- Do **englishPrompt**, **imagePrompt**, and **clipPrompt** all literally include **"this character"**?
- No size/resolution/aspect-ratio numbers anywhere.
- No brand names/readable UI text/watermarks.
- "imagePrompt" ends with: “No text, no logos, no watermarks. Keep the art style of this character and the background consistent.”
- "originalText" is verbatim from the script; "sceneExplain" and "koreanSummary" follow their roles.

[Execution]
- Strictly follow the rules above, split the SCRIPT, and output a JSON array only.
- Output nothing except the JSON array.
`;
