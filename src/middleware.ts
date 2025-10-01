import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

const EXP_SKEW_MS = 60_000;
const THROTTLE_COOKIE = 'mw_auth_next_check_at';
const THROTTLE_MS = 30_000;

const getProjectRef = (): string | null => {
  const m = process.env.SUPABASE_URL?.match(/^https:\/\/([^.]+)\.supabase\.co/);
  return m?.[1] ?? null;
};

const hasSessionCookie = (req: NextRequest): boolean => {
  const ref = getProjectRef();
  if (!ref) return false;
  const base = `sb-${ref}-auth-token`;
  return req.cookies
    .getAll()
    .some(c => c.name === base || c.name.startsWith(base + '.'));
};

const readSessionCookieRaw = (req: NextRequest): string | null => {
  const ref = getProjectRef();
  if (!ref) return null;
  const base = `sb-${ref}-auth-token`;

  const direct = req.cookies.get(base)?.value;
  if (direct) return direct;

  const chunks = req.cookies
    .getAll()
    .filter(c => c.name.startsWith(base + '.'))
    .sort(
      (a, b) =>
        Number(a.name.split('.').pop() || 0) -
        Number(b.name.split('.').pop() || 0)
    );

  if (!chunks.length) return null;
  return chunks.map(c => c.value).join('');
};

const tryParseExpiresAtMs = (raw: string | null): number | null => {
  if (!raw) return null;
  try {
    const obj = JSON.parse(raw);
    if (typeof obj?.expires_at === 'number') return obj.expires_at * 1000;
  } catch {}
  try {
    const json = Buffer.from(raw, 'base64').toString('utf8');
    const obj = JSON.parse(json);
    if (typeof obj?.expires_at === 'number') return obj.expires_at * 1000;
  } catch {}
  return null;
};

export const middleware = async (req: NextRequest) => {
  const url = req.nextUrl;
  const pathname = url.pathname;
  const method = req.method;

  const isCallbackRoute = pathname.startsWith('/auth/callback');
  if (isCallbackRoute || method === 'HEAD' || method === 'OPTIONS') {
    const pass = NextResponse.next();
    pass.headers.set('x-mw', 'bypass-auth-route');
    return pass;
  }

  const loggedInByCookie = hasSessionCookie(req);

  if (pathname === '/signin') {
    if (loggedInByCookie) {
      let redirectTo = url.searchParams.get('redirectedFrom');
      if (!redirectTo) {
        const ref = req.headers.get('referer');
        if (ref) {
          try {
            const refUrl = new URL(ref);
            if (refUrl.origin === url.origin && refUrl.pathname !== '/signin') {
              redirectTo = refUrl.pathname + refUrl.search + refUrl.hash;
            }
          } catch {}
        }
      }
      if (!redirectTo) redirectTo = '/project';
      return NextResponse.redirect(new URL(redirectTo, url.origin));
    }
    return NextResponse.next({ request: { headers: req.headers } });
  }

  if (pathname === '/') {
    if (loggedInByCookie) {
      let redirectTo = url.searchParams.get('redirectedFrom');
      if (!redirectTo) {
        const ref = req.headers.get('referer');
        if (ref) {
          try {
            const refUrl = new URL(ref);
            if (refUrl.origin === url.origin && refUrl.pathname !== '/') {
              redirectTo = refUrl.pathname + refUrl.search + refUrl.hash;
            }
          } catch {}
        }
      }
      if (!redirectTo) redirectTo = '/project';
      return NextResponse.redirect(new URL(redirectTo, url.origin));
    }
    return NextResponse.next({ request: { headers: req.headers } });
  }

  if (!loggedInByCookie) {
    const guest = NextResponse.next({ request: { headers: req.headers } });
    return guest;
  }

  const expMs = tryParseExpiresAtMs(readSessionCookieRaw(req));
  const now = Date.now();
  if (expMs && now < expMs - EXP_SKEW_MS) {
    const fast = NextResponse.next({ request: { headers: req.headers } });
    return fast;
  }

  const nextCheckAtStr = req.cookies.get(THROTTLE_COOKIE)?.value;
  const nextCheckAt = nextCheckAtStr ? Number(nextCheckAtStr) : 0;
  if (now < nextCheckAt) {
    const fast = NextResponse.next({ request: { headers: req.headers } });
    return fast;
  }

  const res = NextResponse.next({ request: { headers: req.headers } });
  res.cookies.set(THROTTLE_COOKIE, String(now + THROTTLE_MS), {
    path: '/',
    httpOnly: false,
    sameSite: 'lax',
  });

  const supabase = createServerClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: cs =>
          cs.forEach(({ name, value, options }) =>
            res.cookies.set(name, value, options)
          ),
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();
  console.log('세션 갱신');

  res.headers.set('x-mw', expMs ? 'slow-exp-imminent' : 'slow-exp-unknown');
  return res;
};

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|icons|images|api|auth/callback).*)',
  ],
};
