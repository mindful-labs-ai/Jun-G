'use client';

import TextareaAutosize from 'react-textarea-autosize';
import { useEffect, useMemo, useRef, useState } from 'react';

type SceneLike = {
  id: string;
  confirmed?: boolean;
} | null;

type Props = {
  scene: SceneLike;
  mode: 'image' | 'clip';
  // 무거운 빌더는 외부에서 주입
  buildImage: (scene: NonNullable<SceneLike>) => string;
  buildClip: (scene: NonNullable<SceneLike>) => string;
  // 커밋 핸들러는 선택적(없으면 읽기 전용으로 동작)
  onCommitImage?: (id: string, text: string) => void;
  onCommitClip?: (id: string, text: string) => void;
  disabled?: boolean;
  debounceMs?: number;
};

// 안전하게 override 읽는 헬퍼(필드가 없어도 에러 안 남)
function readOverride(
  scene: NonNullable<SceneLike>,
  key: 'image_prompt_override' | 'clip_prompt_override'
) {
  if (typeof scene !== 'object' || scene === null) return null;
  const val = (scene as Record<string, unknown>)[key];
  return typeof val === 'string' ? val : null;
}

export default function PromptEditor({
  scene,
  mode,
  buildImage,
  buildClip,
  onCommitImage,
  onCommitClip,
  disabled,
  debounceMs = 250,
}: Props) {
  // scene 없으면 빈 편집기(비활성)
  const isDisabled = disabled || !scene || !!scene?.confirmed;

  // 무거운 빌더 결과는 memo
  const built = useMemo(() => {
    if (!scene) return '';
    return mode === 'image' ? buildImage(scene) : buildClip(scene);
    // ⚠️ build 함수 내부에서 참조하는 scene의 필드만 deps에 넣으면 더 효율적
  }, [scene, mode, buildImage, buildClip]);

  // override가 있으면 우선 사용(필드가 없어도 안전)
  const override = useMemo(() => {
    if (!scene) return null;
    return mode === 'image'
      ? readOverride(scene, 'image_prompt_override')
      : readOverride(scene, 'clip_prompt_override');
  }, [scene, mode]);

  // 로컬 버퍼(입력 중 상위 리렌더 방지)
  const [buf, setBuf] = useState<string>(override ?? built);
  useEffect(() => {
    // 씬 전환/외부 변경 시 동기화
    setBuf(override ?? built);
  }, [override, built, scene?.id]);

  // 디바운스 커밋(핸들러가 없으면 읽기 전용)
  const tRef = useRef<number | null>(null);
  useEffect(() => {
    if (!scene) return;
    const handler = mode === 'image' ? onCommitImage : onCommitClip;
    if (!handler) return; // 읽기 전용

    const source = override ?? built;
    if (buf === source) return;

    if (tRef.current) window.clearTimeout(tRef.current);
    tRef.current = window.setTimeout(() => {
      handler(scene.id, buf);
    }, debounceMs);

    return () => {
      if (tRef.current) window.clearTimeout(tRef.current);
    };
  }, [
    buf,
    scene,
    mode,
    onCommitImage,
    onCommitClip,
    override,
    built,
    debounceMs,
  ]);

  return (
    <TextareaAutosize
      className='min-h-[220px] w-full disabled:text-black disabled:cursor-not-allowed resize-none rounded-lg break-keep font-mono text-sm'
      value={buf}
      onChange={e => setBuf(e.target.value)}
      onBlur={() => {
        if (!scene) return;
        const handler = mode === 'image' ? onCommitImage : onCommitClip;
        if (!handler) return; // 읽기 전용
        const source = override ?? built;
        if (buf !== source) handler(scene.id, buf);
      }}
      disabled={isDisabled}
      spellCheck={false}
      cacheMeasurements
      minRows={10}
    />
  );
}
