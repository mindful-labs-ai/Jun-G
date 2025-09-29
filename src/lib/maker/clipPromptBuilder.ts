export type ClipPrompt = {
  intent?: string;
  img_message?: string;
  background?: {
    location?: string;
    props?: string;
    time?: string;
  };
  camera_motion?: {
    type?: string;
    easing?: string;
  };
  subject_motion?: Array<{
    time?: string;
    action?: string;
  }>;
  environment_motion?: Array<{
    type?: string;
    action?: string;
  }>;
};

const isNonEmpty = (v?: string) => !!v && v.trim().length > 0;

const join = (parts: Array<string | undefined>, sep = ', ') =>
  parts.filter(isNonEmpty).join(sep);

const label = (key: string, value?: string) =>
  isNonEmpty(value) ? `${key}: ${value}` : '';

const clampSpaces = (s: string) => s.replace(/\s+/g, ' ').trim();

const normalizeTimeS = (t?: string) => {
  if (!isNonEmpty(t)) return undefined;
  const s = t!.trim();
  return /\ds$/.test(s) ? s : `${s.replace(/[^\d.]/g, '')}s`;
};

type SerializeOptions = {
  mode?: 'one-line' | 'multiline' | 'timeline';
  includeSafetyTail?: boolean;
  bullet?: string;
};

export function serializeClipPrompt(
  p: ClipPrompt,
  options: SerializeOptions = {}
): string {
  const { mode = 'one-line', includeSafetyTail = true, bullet = '•' } = options;

  const bg = p.background ?? {};
  const cam = p.camera_motion ?? {};
  const safetyTail = includeSafetyTail
    ? 'Keep consistent with the still; no new objects/locations, no brands/readable text/logos/watermarks.'
    : '';

  const subjectTimeline = (p.subject_motion ?? [])
    .map(item => ({
      time: normalizeTimeS(item.time),
      action: item.action?.trim(),
    }))
    .filter(it => isNonEmpty(it.time) && isNonEmpty(it.action))
    .sort((a, b) => parseFloat(a.time!) - parseFloat(b.time!));

  const subjectMotionOneLine = subjectTimeline
    .map(it => `${it.time}: ${it.action}`)
    .join(' | ');

  const subjectMotionMultiline = subjectTimeline
    .map(it => `${bullet} ${it.time}: ${it.action}`)
    .join('\n');

  const envList = (p.environment_motion ?? [])
    .map(it => {
      const head = isNonEmpty(it.type) ? `${it.type}: ` : '';
      return isNonEmpty(it.action) ? `${head}${it.action}` : '';
    })
    .filter(isNonEmpty);

  const envOneLine = envList.join(' | ');
  const envMultiline = envList.map(s => `${bullet} ${s}`).join('\n');

  const bgStr = join(
    [
      bg.location && `location: ${bg.location}`,
      bg.props && `props: ${bg.props}`,
      bg.time && `time: ${bg.time}`,
    ],
    '; '
  );

  const camStr = join(
    [cam.type && `type: ${cam.type}`, cam.easing && `easing: ${cam.easing}`],
    '; '
  );

  if (mode === 'multiline') {
    const lines = [
      label('Intent', p.intent),
      label('Base', p.img_message),
      isNonEmpty(bgStr) ? `Background: ${bgStr}` : '',
      isNonEmpty(camStr) ? `Camera Motion: ${camStr}` : '',
      subjectTimeline.length
        ? 'Subject Motion:\n' + subjectMotionMultiline
        : '',
      envList.length ? 'Environment Motion:\n' + envMultiline : '',
      safetyTail,
    ].filter(isNonEmpty);

    return lines.join('\n');
  }

  if (mode === 'timeline') {
    const sections = [
      label('Intent', p.intent),
      label('Base', p.img_message),
      isNonEmpty(camStr) ? `Camera Motion — ${camStr}` : '',
      subjectTimeline.length ? `Subject — ${subjectMotionOneLine}` : '',
      envList.length ? `Environment — ${envOneLine}` : '',
      isNonEmpty(bgStr) ? `Background — ${bgStr}` : '',
      safetyTail,
    ].filter(isNonEmpty);

    return clampSpaces(sections.join(' — '));
  }

  const segments = [
    label('Intent', p.intent),
    label('Base', p.img_message),
    isNonEmpty(camStr) ? `Cam: ${camStr}` : '',
    subjectTimeline.length ? `Subject: ${subjectMotionOneLine}` : '',
    envList.length ? `Env: ${envOneLine}` : '',
    isNonEmpty(bgStr) ? `BG: ${bgStr}` : '',
    safetyTail,
  ].filter(isNonEmpty);

  return clampSpaces(segments.join(' | '));
}

export const buildClipPromptText = (
  p: ClipPrompt,
  opts?: Omit<SerializeOptions, 'mode'>
) => serializeClipPrompt(p, { mode: 'one-line', ...opts });

export const buildClipPromptPretty = (
  p: ClipPrompt,
  opts?: Omit<SerializeOptions, 'mode'>
) => serializeClipPrompt(p, { mode: 'multiline', ...opts });

export const buildClipPromptTimeline = (
  p: ClipPrompt,
  opts?: Omit<SerializeOptions, 'mode'>
) => serializeClipPrompt(p, { mode: 'timeline', ...opts });
