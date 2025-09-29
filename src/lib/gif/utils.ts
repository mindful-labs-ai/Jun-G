import { UploadedImage } from './types';
import { GIFEncoder, quantize, applyPalette, nearestColorIndex } from 'gifenc';

export const fileToBase64 = (file: File): Promise<UploadedImage> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const dataUrl = reader.result as string;
      const base64 = dataUrl.split(',')[1];

      resolve({
        name: file.name,
        base64,
        dataUrl,
        mimeType: file.type,
      });
    };

    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const notify = (msg: string) => alert(msg);

const ensureClient = () => {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    throw new Error('makeGifFromDataUrls는 브라우저에서만 호출해야 합니다.');
  }
};

const dist2 = (
  r: number,
  g: number,
  b: number,
  rr: number,
  gg: number,
  bb: number
) => (r - rr) * (r - rr) + (g - gg) * (g - gg) + (b - bb) * (b - bb);

/** 간단 백분위수 */
const percentile = (arr: number[], p: number) => {
  if (!arr.length) return 0;
  const a = [...arr].sort((x, y) => x - y);
  const idx = Math.min(
    a.length - 1,
    Math.max(0, Math.floor((p / 100) * a.length))
  );
  return a[idx];
};

const estimateBorderColor = (
  rgba: Uint8ClampedArray,
  w: number,
  h: number,
  border = 4,
  step = 2
) => {
  const rs: number[] = [],
    gs: number[] = [],
    bs: number[] = [];
  const push = (i: number) => {
    rs.push(rgba[i]);
    gs.push(rgba[i + 1]);
    bs.push(rgba[i + 2]);
  };
  // top & bottom
  for (let y = 0; y < border; y += step) {
    for (let x = 0; x < w; x += step) {
      push((y * w + x) * 4);
    }
  }
  for (let y = h - border; y < h; y += step) {
    for (let x = 0; x < w; x += step) {
      push((y * w + x) * 4);
    }
  }
  // left & right
  for (let y = 0; y < h; y += step) {
    for (let x = 0; x < border; x += step) {
      push((y * w + x) * 4);
    }
    for (let x = w - border; x < w; x += step) {
      push((y * w + x) * 4);
    }
  }
  const med = (a: number[]) => percentile(a, 50);
  return [med(rs), med(gs), med(bs)] as [number, number, number];
};

const makeBackgroundMaskHybrid = (
  rgba: Uint8ClampedArray,
  w: number,
  h: number,
  base: [number, number, number], // 테두리에서 추정한 배경 기준색
  tolDist: number, // 색 허용치(유클리드 거리)
  minIsland = 24, // 내부 섬 최소 픽셀 수
  expand = 1 // 경계 보정(0~1)
) => {
  const tol2 = tolDist * tolDist;
  const N = w * h;

  // 1) 전역 후보 마스크: 배경색과 유사한 픽셀
  const cand = new Uint8Array(N);
  for (let p = 0, i = 0; p < N; p++, i += 4) {
    if (
      dist2(rgba[i], rgba[i + 1], rgba[i + 2], base[0], base[1], base[2]) <=
      tol2
    )
      cand[p] = 1;
  }

  // 2) 경계 연결 flood-fill → 확실한 배경
  const bg = new Uint8Array(N);
  const stack: number[] = [];
  const pushIf = (x: number, y: number) => {
    if (x < 0 || y < 0 || x >= w || y >= h) return;
    const p = y * w + x;
    if (!bg[p] && cand[p]) {
      bg[p] = 1;
      stack.push(p);
    }
  };
  for (let x = 0; x < w; x++) {
    pushIf(x, 0);
    pushIf(x, h - 1);
  }
  for (let y = 0; y < h; y++) {
    pushIf(0, y);
    pushIf(w - 1, y);
  }

  while (stack.length) {
    const p = stack.pop()!;
    const x = p % w,
      y = (p / w) | 0;
    const tryPush = (nx: number, ny: number) => {
      if (nx < 0 || ny < 0 || nx >= w || ny >= h) return;
      const pp = ny * w + nx;
      if (!bg[pp] && cand[pp]) {
        bg[pp] = 1;
        stack.push(pp);
      }
    };
    tryPush(x + 1, y);
    tryPush(x - 1, y);
    tryPush(x, y + 1);
    tryPush(x, y - 1);
  }

  // 3) 내부 섬 채택: cand이지만 bg가 아닌 연결 컴포넌트 중 area ≥ minIsland
  const out = bg.slice(0);
  const seen = bg.slice(0);
  for (let s = 0; s < N; s++) {
    if (!cand[s] || seen[s]) continue;
    const comp: number[] = [s];
    seen[s] = 1;
    for (let k = 0; k < comp.length; k++) {
      const p = comp[k],
        x = p % w,
        y = (p / w) | 0;
      const tryPush = (nx: number, ny: number) => {
        if (nx < 0 || ny < 0 || nx >= w || ny >= h) return;
        const pp = ny * w + nx;
        if (!seen[pp] && cand[pp]) {
          seen[pp] = 1;
          comp.push(pp);
        }
      };
      tryPush(x + 1, y);
      tryPush(x - 1, y);
      tryPush(x, y + 1);
      tryPush(x, y - 1);
    }
    if (comp.length >= minIsland) for (const p of comp) out[p] = 1;
  }

  // 4) 1픽셀 팽창(dilation)로 경계 잔털 제거(선택)
  if (expand > 0) {
    const dil = out.slice(0);
    for (let p = 0; p < N; p++) {
      if (out[p]) continue;
      const x = p % w,
        y = (p / w) | 0;
      const any =
        (x > 0 && out[p - 1]) ||
        (x < w - 1 && out[p + 1]) ||
        (y > 0 && out[p - w]) ||
        (y < h - 1 && out[p + w]);
      if (any) dil[p] = 1;
    }
    return dil;
  }
  return out;
};

export const makeGifFromDataUrls = async (
  dataUrls: string[],
  opts: { fps?: number; repeat?: number } = {}
): Promise<string> => {
  ensureClient();
  const urls = dataUrls.filter(Boolean);
  if (!urls.length) throw new Error('프레임이 없습니다.');

  const fps = opts.fps ?? 8;
  const delay = Math.max(1, Math.round(1000 / fps));
  const repeat = opts.repeat ?? 0;

  // 1) 프레임 로드
  const loadImageData = (u: string) =>
    new Promise<ImageData>((res, rej) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const c = document.createElement('canvas');
        c.width = img.naturalWidth;
        c.height = img.naturalHeight;
        const ctx = c.getContext('2d')!;
        ctx.drawImage(img, 0, 0);
        res(ctx.getImageData(0, 0, c.width, c.height));
      };
      img.onerror = () => rej(new Error('이미지 로드 실패'));
      img.src = u;
    });
  const images = await Promise.all(urls.map(loadImageData));
  const { width, height } = images[0];

  // 2) 전역 팔레트(샘플링)
  const stride = 4,
    sampleEvery = 4;
  const samples: number[] = [];
  for (const img of images) {
    const d = img.data;
    for (let i = 0; i < d.length; i += stride * sampleEvery)
      samples.push(d[i], d[i + 1], d[i + 2], 255); // 알파 납작화
  }
  let palette = quantize(new Uint8Array(samples), 255, {
    oneBitAlpha: false,
    clearAlpha: false,
  } as any) as number[][];

  // 투명용 키색(인덱스0) 강제 삽입
  const KEY: [number, number, number] = [0, 0, 0];
  palette = [KEY, ...palette];
  if (palette.length > 256) palette.pop();
  const transparentIndex = 0;

  // 3) 인코딩(모든 프레임 동일 팔레트/투명 인덱스/Dispose=2)
  const c = document.createElement('canvas');
  c.width = width;
  c.height = height;
  const ctx = c.getContext('2d')!;
  const gif = GIFEncoder();

  for (let f = 0; f < images.length; f++) {
    const img = images[f];

    // 표준 캔버스에 맞춤
    const tmp = document.createElement('canvas');
    tmp.width = img.width;
    tmp.height = img.height;
    tmp.getContext('2d')!.putImageData(img, 0, 0);
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(tmp, 0, 0, width, height);

    const rgba = ctx.getImageData(0, 0, width, height).data;

    // ── 변경된 부분: 하이브리드 마스크 사용
    const base = estimateBorderColor(rgba, width, height, 6, 2);

    // 동적 톨러런스 계산(경계 표본의 95퍼센타일 + 여유), 마지막에 sqrt로 거리로 변환
    const borderDists: number[] = [];
    for (let x = 0; x < width; x += 4) {
      const iTop = x * 4,
        iBot = ((height - 1) * width + x) * 4;
      borderDists.push(
        dist2(rgba[iTop], rgba[iTop + 1], rgba[iTop + 2], ...base)
      );
      borderDists.push(
        dist2(rgba[iBot], rgba[iBot + 1], rgba[iBot + 2], ...base)
      );
    }
    const tolDist = Math.sqrt(
      Math.min(4000, percentile(borderDists, 98) + 300)
    ); // 필요시 조절

    // 내부 섬까지 포함하는 마스크
    const mask = makeBackgroundMaskHybrid(
      rgba,
      width,
      height,
      base,
      tolDist,
      /*minIsland*/ 32,
      /*expand*/ 1
    );

    // 팔레트 적용 + 마스크 위치 투명화(인덱스 덮어쓰기)
    const indexed = applyPalette(rgba, palette as any);
    for (let p = 0; p < mask.length; p++)
      if (mask[p]) indexed[p] = transparentIndex;

    gif.writeFrame(indexed, width, height, {
      palette: palette as any,
      transparent: true,
      transparentIndex,
      dispose: 2,
      delay,
      repeat: f === 0 ? repeat : undefined,
    });
  }

  gif.finish();
  const bytes = gif.bytes();
  const ab = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(ab).set(bytes);
  return URL.createObjectURL(new Blob([ab], { type: 'image/gif' }));
};
