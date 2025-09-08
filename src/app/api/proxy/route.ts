import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const target = searchParams.get('url');
  const mode = (searchParams.get('mode') ?? 'view') as 'view' | 'download';
  const filename = searchParams.get('filename') ?? undefined;

  if (!target) {
    return NextResponse.json({ error: 'Missing url' }, { status: 400 });
  }

  // (선택) 매우 간단한 SSRF 가드
  try {
    const u = new URL(target);
    if (!/^https?:$/.test(u.protocol)) {
      return NextResponse.json(
        { error: 'Only http/https allowed' },
        { status: 400 }
      );
    }
  } catch {
    return NextResponse.json({ error: 'Invalid url' }, { status: 400 });
  }

  try {
    const upstream = await fetch(target, {
      cache: 'no-store',
      redirect: 'follow',
      // 필요한 경우 헤더 추가 가능
      // headers: { "User-Agent": "AIShortform/1.0" },
    });

    if (!upstream.ok || !upstream.body) {
      return NextResponse.json(
        { error: `Upstream error: ${upstream.status}` },
        { status: upstream.status || 502 }
      );
    }

    const contentType =
      upstream.headers.get('content-type') ?? 'application/octet-stream';
    const guessed = guessNameFromUrl(target, contentType);
    const name = filename || guessed;

    const headers = new Headers();
    headers.set('Content-Type', contentType);
    headers.set('Cache-Control', 'private, no-store');

    if (mode === 'download') {
      headers.set('Content-Disposition', `attachment; filename="${name}"`);
    } else {
      headers.set('Content-Disposition', 'inline');
    }

    // 스트리밍으로 그대로 전달
    return new NextResponse(upstream.body, { status: 200, headers });
  } catch (e: any) {
    return NextResponse.json(
      { error: String(e?.message || e) },
      { status: 500 }
    );
  }
}

function extFromMime(type?: string) {
  if (!type) return 'bin';
  const t = type.toLowerCase();
  if (t.includes('png')) return 'png';
  if (t.includes('jpeg') || t.includes('jpg')) return 'jpg';
  if (t.includes('webp')) return 'webp';
  if (t.includes('gif')) return 'gif';
  if (t.includes('mp4')) return 'mp4';
  if (t.includes('webm')) return 'webm';
  if (t.includes('quicktime') || t.includes('mov')) return 'mov';
  return 'bin';
}

function guessNameFromUrl(raw: string, contentType: string) {
  try {
    const u = new URL(raw);
    const last = u.pathname.split('/').filter(Boolean).pop() || 'file';
    if (last.includes('.')) return last;
    const ext = extFromMime(contentType);
    return `${last}.${ext}`;
  } catch {
    const ext = extFromMime(contentType);
    return `file.${ext}`;
  }
}
