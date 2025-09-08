export type ImagePrompt = {
  intent?: string;
  img_style?: string;
  camera?: {
    shot_type?: string;
    angle?: string;
    focal_length?: string;
  };
  subject?: {
    pose?: string;
    expression?: string;
    gaze?: string;
    hands?: string;
  };
  lighting?: {
    key?: string;
    mood?: string;
  };
  background?: {
    location?: string;
    dof?: string;
    props?: string;
    time?: string;
  };
};

// helpers ────────────────────────────────────────────────────────────
const isNonEmpty = (v?: string) => !!v && v.trim().length > 0;

const join = (parts: Array<string | undefined>, sep = ', ') =>
  parts.filter(isNonEmpty).join(sep);

const label = (key: string, value?: string) =>
  isNonEmpty(value) ? `${key}: ${value}` : '';

const clampSpaces = (s: string) => s.replace(/\s+/g, ' ').trim();

type SerializeOptions = {
  mode?: 'one-line' | 'multiline' | 'clauses';
  includeSafetyTail?: boolean;
  sectionSeparator?: string;
};

export function serializeImagePrompt(
  p: ImagePrompt,
  options: SerializeOptions = {}
): string {
  const {
    mode = 'one-line',
    includeSafetyTail = true,
    sectionSeparator = ' — ',
  } = options;

  const cam = p.camera ?? {};
  const subj = p.subject ?? {};
  const lit = p.lighting ?? {};
  const bg = p.background ?? {};

  const cameraStr = join([cam.shot_type, cam.focal_length, cam.angle], ', ');

  const subjectStr = join(
    [
      subj.pose,
      subj.expression && `expression: ${subj.expression}`,
      subj.gaze && `gaze: ${subj.gaze}`,
      subj.hands && `hands: ${subj.hands}`,
    ],
    '; '
  );

  const lightingStr = join(
    [lit.key && `key: ${lit.key}`, lit.mood && `mood: ${lit.mood}`],
    '; '
  );

  const backgroundStr = join(
    [
      bg.location && `location: ${bg.location}`,
      bg.dof && `dof: ${bg.dof}`,
      bg.props && `props: ${bg.props}`,
      bg.time && `time: ${bg.time}`,
    ],
    '; '
  );

  const safetyTail = includeSafetyTail
    ? 'No readable text, no logos, no watermarks.'
    : '';

  if (mode === 'multiline') {
    const lines = [
      isNonEmpty(p.intent) ? `1. Intent: ${p.intent}, ` : '',
      isNonEmpty(p.img_style) ? `2. Style: ${p.img_style}, ` : '',
      isNonEmpty(cameraStr) ? `3. Camera: ${cameraStr}, ` : '',
      isNonEmpty(subjectStr) ? `4. Subject: ${subjectStr}, ` : '',
      isNonEmpty(lightingStr) ? `5. Lighting: ${lightingStr}, ` : '',
      isNonEmpty(backgroundStr) ? `6. Background: ${backgroundStr}` : '',
      safetyTail,
    ].filter(isNonEmpty);

    return lines.join('\n');
  }

  if (mode === 'clauses') {
    const clauses = [
      isNonEmpty(p.intent) ? `Intent ${p.intent}` : '',
      isNonEmpty(p.img_style) ? `Style ${p.img_style}` : '',
      isNonEmpty(cameraStr) ? `Camera ${cameraStr}` : '',
      isNonEmpty(subjectStr) ? `Subject ${subjectStr}` : '',
      isNonEmpty(lightingStr) ? `Lighting ${lightingStr}` : '',
      isNonEmpty(backgroundStr) ? `Background ${backgroundStr}` : '',
      safetyTail,
    ].filter(isNonEmpty);

    return clampSpaces(clauses.join(sectionSeparator));
  }

  const segments = [
    label('Intent', p.intent),
    label('Style', p.img_style),
    isNonEmpty(cameraStr) ? `Camera: ${cameraStr}` : '',
    isNonEmpty(subjectStr) ? `Subject: ${subjectStr}` : '',
    isNonEmpty(lightingStr) ? `Lighting: ${lightingStr}` : '',
    isNonEmpty(backgroundStr) ? `Background: ${backgroundStr}` : '',
    safetyTail,
  ].filter(isNonEmpty);

  return clampSpaces(segments.join(' | '));
}

export const buildImagePromptText = (
  p: ImagePrompt,
  opts?: Omit<SerializeOptions, 'mode'>
) => serializeImagePrompt(p, { mode: 'one-line', ...opts });

export const buildImagePromptPretty = (
  p: ImagePrompt,
  opts?: Omit<SerializeOptions, 'mode'>
) => serializeImagePrompt(p, { mode: 'multiline', ...opts });
