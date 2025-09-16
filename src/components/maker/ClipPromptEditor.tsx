import { useCallback } from 'react';
import type { ScenesState, ClipPromptJson } from '@/lib/maker/types';

type Props = {
  sceneId: string;
  setScenesState: React.Dispatch<React.SetStateAction<ScenesState>>;
  clipPrompt: ClipPromptJson; // 상위에서 현재 씬의 clipPrompt를 내려주세요
};

export const ClipPromptEditor = ({
  sceneId,
  setScenesState,
  clipPrompt,
}: Props) => {
  /* ========= 경로 유틸: "a.b[0].c" → 깊은 set/get ========= */

  // "a.b[0].c" → ["a","b",0,"c"]
  const parsePath = (path: string): (string | number)[] => {
    const out: (string | number)[] = [];
    path.split('.').forEach(part => {
      const re = /([^[\]]+)|\[(\d+)\]/g;
      let m: RegExpExecArray | null;
      while ((m = re.exec(part))) {
        if (m[1] !== undefined) out.push(m[1]);
        else if (m[2] !== undefined) out.push(Number(m[2]));
      }
    });
    return out;
  };

  // 불변 깊은 set
  const deepSet = <T extends object>(obj: T, path: string, value: any): T => {
    const keys = parsePath(path);
    const root: any = Array.isArray(obj) ? obj.slice() : { ...(obj as any) };
    let curr: any = root;
    let src: any = obj;

    keys.forEach((k, i) => {
      const last = i === keys.length - 1;
      if (last) {
        curr[k] = value;
        return;
      }
      const nextSrc = src?.[k];
      const nextIsArr =
        Array.isArray(nextSrc) || typeof keys[i + 1] === 'number';
      const next = nextIsArr
        ? Array.isArray(nextSrc)
          ? nextSrc.slice()
          : nextSrc ?? []
        : typeof nextSrc === 'object' && nextSrc !== null
        ? { ...nextSrc }
        : {};
      curr[k] = next;
      curr = next;
      src = nextSrc;
    });

    return root;
  };

  // 깊은 get
  const deepGet = (obj: any, path: string): any => {
    const keys = parsePath(path);
    let curr = obj;
    for (const k of keys) {
      if (curr == null) return undefined;
      curr = curr[k as any];
    }
    return curr;
  };

  /* ========= 업데이트 ========= */

  const updateClip = useCallback(
    (path: string, v: any) => {
      setScenesState(prev => {
        const s = prev.byId.get(sceneId);
        if (!s) return prev;
        const next = deepSet(s.clipPrompt, path, v);
        const byId = new Map(prev.byId);
        byId.set(sceneId, { ...s, clipPrompt: next });
        return { ...prev, byId };
      });
    },
    [sceneId, setScenesState]
  );

  const v = (p: string) => deepGet(clipPrompt, p) ?? '';

  // 배열 조작: subject_motion / environment_motion
  const addSubjectMotion = () => {
    setScenesState(prev => {
      const s = prev.byId.get(sceneId);
      if (!s) return prev;
      const list = (s.clipPrompt as any).subject_motion ?? [];
      const nextList = [...list, { time: '', action: '' }];
      const next = deepSet(s.clipPrompt, 'subject_motion', nextList);
      const byId = new Map(prev.byId);
      byId.set(sceneId, { ...s, clipPrompt: next });
      return { ...prev, byId };
    });
  };

  const removeSubjectMotion = (idx: number) => {
    setScenesState(prev => {
      const s = prev.byId.get(sceneId);
      if (!s) return prev;
      const list = (s.clipPrompt as any).subject_motion ?? [];
      const nextList = list.filter((_: any, i: number) => i !== idx);
      const next = deepSet(s.clipPrompt, 'subject_motion', nextList);
      const byId = new Map(prev.byId);
      byId.set(sceneId, { ...s, clipPrompt: next });
      return { ...prev, byId };
    });
  };

  const updateSubjectMotion = (
    idx: number,
    field: 'time' | 'action',
    val: string
  ) => updateClip(`subject_motion[${idx}].${field}`, val);

  const addEnvMotion = () => {
    setScenesState(prev => {
      const s = prev.byId.get(sceneId);
      if (!s) return prev;
      const list = (s.clipPrompt as any).environment_motion ?? [];
      const nextList = [...list, { type: '', action: '' }];
      const next = deepSet(s.clipPrompt, 'environment_motion', nextList);
      const byId = new Map(prev.byId);
      byId.set(sceneId, { ...s, clipPrompt: next });
      return { ...prev, byId };
    });
  };

  const removeEnvMotion = (idx: number) => {
    setScenesState(prev => {
      const s = prev.byId.get(sceneId);
      if (!s) return prev;
      const list = (s.clipPrompt as any).environment_motion ?? [];
      const nextList = list.filter((_: any, i: number) => i !== idx);
      const next = deepSet(s.clipPrompt, 'environment_motion', nextList);
      const byId = new Map(prev.byId);
      byId.set(sceneId, { ...s, clipPrompt: next });
      return { ...prev, byId };
    });
  };

  const updateEnvMotion = (
    idx: number,
    field: 'type' | 'action',
    val: string
  ) => updateClip(`environment_motion[${idx}].${field}`, val);

  /* ========= 간결 UI ========= */

  const subjectList: Array<{ time: string; action: string }> =
    (clipPrompt as any).subject_motion ?? [];
  const envList: Array<{ type: string; action: string }> =
    (clipPrompt as any).environment_motion ?? [];

  return (
    <div className='space-y-3 text-sm'>
      {/* 1차 필드 */}
      <label className='block'>
        <span className='text-muted-foreground'>intent</span>
        <input
          className='mt-1 w-full rounded border px-2 py-1'
          value={v('intent')}
          onChange={e => updateClip('intent', e.target.value)}
          placeholder='Clip goal & feeling (≤12 words)'
        />
      </label>

      <label className='block'>
        <span className='text-muted-foreground'>img_message</span>
        <input
          className='mt-1 w-full rounded border px-2 py-1'
          value={v('img_message')}
          onChange={e => updateClip('img_message', e.target.value)}
          placeholder='What the base still conveys'
        />
      </label>

      {/* background */}
      <div className='rounded border p-2'>
        <div className='mb-1 font-medium'>background</div>
        <div className='grid grid-cols-3 gap-2'>
          <label className='block'>
            <span className='text-muted-foreground'>location</span>
            <input
              className='mt-1 w-full rounded border px-2 py-1'
              value={v('background.location')}
              onChange={e => updateClip('background.location', e.target.value)}
              placeholder='same as still unless changed'
            />
          </label>
          <label className='block'>
            <span className='text-muted-foreground'>props</span>
            <input
              className='mt-1 w-full rounded border px-2 py-1'
              value={v('background.props')}
              onChange={e => updateClip('background.props', e.target.value)}
              placeholder='props in still or consistent'
            />
          </label>
          <label className='block'>
            <span className='text-muted-foreground'>time</span>
            <input
              className='mt-1 w-full rounded border px-2 py-1'
              value={v('background.time')}
              onChange={e => updateClip('background.time', e.target.value)}
              placeholder='same as still unless specified'
            />
          </label>
        </div>
      </div>

      {/* camera_motion */}
      <div className='rounded border p-2'>
        <div className='mb-1 font-medium'>camera_motion</div>
        <div className='grid grid-cols-2 gap-2'>
          <label className='block'>
            <span className='text-muted-foreground'>type</span>
            <input
              className='mt-1 w-full rounded border px-2 py-1'
              value={v('camera_motion.type')}
              onChange={e => updateClip('camera_motion.type', e.target.value)}
              placeholder='push-in | pan | tilt | handheld sway | none'
            />
          </label>
          <label className='block'>
            <span className='text-muted-foreground'>easing</span>
            <input
              className='mt-1 w-full rounded border px-2 py-1'
              value={v('camera_motion.easing')}
              onChange={e => updateClip('camera_motion.easing', e.target.value)}
              placeholder='linear | ease-in | ease-out | ease-in-out'
            />
          </label>
        </div>
      </div>

      {/* subject_motion */}
      <div className='rounded border p-2'>
        <div className='mb-2 flex items-center justify-between'>
          <div className='font-medium'>subject_motion</div>
          <button
            type='button'
            className='rounded border px-2 py-1 text-xs'
            onClick={addSubjectMotion}
          >
            + add
          </button>
        </div>
        <div className='space-y-2'>
          {subjectList.map((item, i) => (
            <div key={i} className='grid grid-cols-[100px_1fr_auto] gap-2'>
              <input
                className='rounded border px-2 py-1'
                placeholder='0.0s'
                value={item.time ?? ''}
                onChange={e => updateSubjectMotion(i, 'time', e.target.value)}
              />
              <input
                className='rounded border px-2 py-1'
                placeholder='this character ...'
                value={item.action ?? ''}
                onChange={e => updateSubjectMotion(i, 'action', e.target.value)}
              />
              <button
                type='button'
                className='rounded border px-2 py-1 text-xs'
                onClick={() => removeSubjectMotion(i)}
              >
                remove
              </button>
            </div>
          ))}
          {subjectList.length === 0 && (
            <div className='text-xs text-muted-foreground'>
              No entries. Click “add” to insert a micro-movement.
            </div>
          )}
        </div>
      </div>

      {/* environment_motion */}
      <div className='rounded border p-2'>
        <div className='mb-2 flex items-center justify-between'>
          <div className='font-medium'>environment_motion</div>
          <button
            type='button'
            className='rounded border px-2 py-1 text-xs'
            onClick={addEnvMotion}
          >
            + add
          </button>
        </div>
        <div className='space-y-2'>
          {envList.map((item, i) => (
            <div key={i} className='grid grid-cols-[160px_1fr_auto] gap-2'>
              <input
                className='rounded border px-2 py-1'
                placeholder='lighting | atmosphere | background | particles | props'
                value={item.type ?? ''}
                onChange={e => updateEnvMotion(i, 'type', e.target.value)}
              />
              <input
                className='rounded border px-2 py-1'
                placeholder='subtle, physically plausible change'
                value={item.action ?? ''}
                onChange={e => updateEnvMotion(i, 'action', e.target.value)}
              />
              <button
                type='button'
                className='rounded border px-2 py-1 text-xs'
                onClick={() => removeEnvMotion(i)}
              >
                remove
              </button>
            </div>
          ))}
          {envList.length === 0 && (
            <div className='text-xs text-muted-foreground'>
              No entries. Click “add” to insert an environment change.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClipPromptEditor;
