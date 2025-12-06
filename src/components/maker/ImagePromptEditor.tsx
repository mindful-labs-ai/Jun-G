import { useCallback } from 'react';
import type { ScenesState, ImagePromptJson } from '@/lib/maker/types';

type Props = {
  sceneId: string;
  setScenesState: React.Dispatch<React.SetStateAction<ScenesState>>;
  imagePrompt: ImagePromptJson;
};

export const ImagePromptEditor = ({
  sceneId,
  setScenesState,
  imagePrompt,
}: Props) => {
  /* ========= 경로 유틸: "a.b[0].c" → 깊은 세트/겟 ========= */

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
          : (nextSrc ?? [])
        : typeof nextSrc === 'object' && nextSrc !== null
          ? { ...nextSrc }
          : {};
      curr[k] = next;
      curr = next;
      src = nextSrc;
    });

    return root;
  };

  // 깊은 get (입력 value 바인딩용)
  const deepGet = (obj: any, path: string): any => {
    const keys = parsePath(path);
    let curr = obj;
    for (const k of keys) {
      if (curr == null) return undefined;
      curr = curr[k as any];
    }
    return curr;
  };

  /* ========= 업데이트 래퍼 ========= */

  const updateImage = useCallback(
    (path: string, v: any) => {
      setScenesState(prev => {
        const s = prev.byId.get(sceneId);
        if (!s) return prev;
        const nextImage = deepSet(s.imagePrompt, path, v);
        const byId = new Map(prev.byId);
        byId.set(sceneId, { ...s, imagePrompt: nextImage });
        return { ...prev, byId };
      });
    },
    [sceneId, setScenesState]
  );

  const v = (p: string) => deepGet(imagePrompt, p) ?? '';

  /* ========= 간결 UI ========= */

  return (
    <div className='space-y-3 text-sm'>
      {/* 1차 필드 */}
      <label className='block'>
        <span className='text-muted-foreground'>intent</span>
        <input
          className='mt-1 w-full rounded border px-2 py-1'
          value={v('intent')}
          onChange={e => updateImage('intent', e.target.value)}
          placeholder='Scene purpose & dominant emotion'
        />
      </label>

      <label className='block'>
        <span className='text-muted-foreground'>img_style</span>
        <input
          className='mt-1 w-full rounded border px-2 py-1'
          value={v('img_style')}
          onChange={e => updateImage('img_style', e.target.value)}
          placeholder='Global visual style'
        />
      </label>

      {/* camera */}
      <div className='rounded border p-2'>
        <div className='mb-1 font-medium'>camera</div>
        <div className='grid grid-cols-3 gap-2'>
          <label className='block'>
            <span className='text-muted-foreground'>shot_type</span>
            <input
              className='mt-1 w-full rounded border px-2 py-1'
              value={v('camera.shot_type')}
              onChange={e => updateImage('camera.shot_type', e.target.value)}
              placeholder='close-up | medium | long'
            />
          </label>
          <label className='block'>
            <span className='text-muted-foreground'>angle</span>
            <input
              className='mt-1 w-full rounded border px-2 py-1'
              value={v('camera.angle')}
              onChange={e => updateImage('camera.angle', e.target.value)}
              placeholder='eye-level / high / low / 3/4 …'
            />
          </label>
          <label className='block'>
            <span className='text-muted-foreground'>focal_length</span>
            <input
              className='mt-1 w-full rounded border px-2 py-1'
              value={v('camera.focal_length')}
              onChange={e => updateImage('camera.focal_length', e.target.value)}
              placeholder='e.g., 50mm'
            />
          </label>
        </div>
      </div>

      {/* subject */}
      <div className='rounded border p-2'>
        <div className='mb-1 font-medium'>subject</div>
        <div className='grid grid-cols-4 gap-2'>
          <label className='block'>
            <span className='text-muted-foreground'>pose</span>
            <input
              className='mt-1 w-full rounded border px-2 py-1'
              value={v('subject.pose')}
              onChange={e => updateImage('subject.pose', e.target.value)}
              placeholder='pose & orientation'
            />
          </label>
          <label className='block'>
            <span className='text-muted-foreground'>expression</span>
            <input
              className='mt-1 w-full rounded border px-2 py-1'
              value={v('subject.expression')}
              onChange={e => updateImage('subject.expression', e.target.value)}
              placeholder='one clear emotion'
            />
          </label>
          <label className='block'>
            <span className='text-muted-foreground'>gaze</span>
            <input
              className='mt-1 w-full rounded border px-2 py-1'
              value={v('subject.gaze')}
              onChange={e => updateImage('subject.gaze', e.target.value)}
              placeholder='toward camera / off-screen …'
            />
          </label>
          <label className='block'>
            <span className='text-muted-foreground'>hands</span>
            <input
              className='mt-1 w-full rounded border px-2 py-1'
              value={v('subject.hands')}
              onChange={e => updateImage('subject.hands', e.target.value)}
              placeholder='gesture or object held'
            />
          </label>
        </div>
      </div>

      {/* lighting */}
      <div className='rounded border p-2'>
        <div className='mb-1 font-medium'>lighting</div>
        <div className='grid grid-cols-2 gap-2'>
          <label className='block'>
            <span className='text-muted-foreground'>key</span>
            <input
              className='mt-1 w-full rounded border px-2 py-1'
              value={v('lighting.key')}
              onChange={e => updateImage('lighting.key', e.target.value)}
              placeholder='direction & intensity; fill/back if needed'
            />
          </label>
          <label className='block'>
            <span className='text-muted-foreground'>mood</span>
            <input
              className='mt-1 w-full rounded border px-2 py-1'
              value={v('lighting.mood')}
              onChange={e => updateImage('lighting.mood', e.target.value)}
              placeholder='color temp + overall mood'
            />
          </label>
        </div>
      </div>

      {/* background */}
      <div className='rounded border p-2'>
        <div className='mb-1 font-medium'>background</div>
        <div className='grid grid-cols-4 gap-2'>
          <label className='block'>
            <span className='text-muted-foreground'>location</span>
            <input
              className='mt-1 w-full rounded border px-2 py-1'
              value={v('background.location')}
              onChange={e => updateImage('background.location', e.target.value)}
              placeholder='generic, brand-free'
            />
          </label>
          <label className='block'>
            <span className='text-muted-foreground'>dof</span>
            <input
              className='mt-1 w-full rounded border px-2 py-1'
              value={v('background.dof')}
              onChange={e => updateImage('background.dof', e.target.value)}
              placeholder='shallow | medium | deep'
            />
          </label>
          <label className='block'>
            <span className='text-muted-foreground'>props</span>
            <input
              className='mt-1 w-full rounded border px-2 py-1'
              value={v('background.props')}
              onChange={e => updateImage('background.props', e.target.value)}
              placeholder='essential props only'
            />
          </label>
          <label className='block'>
            <span className='text-muted-foreground'>time</span>
            <input
              className='mt-1 w-full rounded border px-2 py-1'
              value={v('background.time')}
              onChange={e => updateImage('background.time', e.target.value)}
              placeholder='dawn/morning/noon/sunset/evening/night'
            />
          </label>
        </div>
      </div>
    </div>
  );
};

export default ImagePromptEditor;
