import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    }
  );

  // 2) 내부 코드 → 세션 교환
  if (code) {
    try {
      await supabase.auth.exchangeCodeForSession(code);
    } catch (e) {
      console.error('exchange failed:', e);
      // 실패 시 로그인 페이지로
      return NextResponse.redirect(new URL('/signin', url.origin));
    }
  }

  // 3) 쿼리 제거 + 홈(또는 이전 경로)로 이동
  return NextResponse.redirect(new URL('/makerScript', url.origin));
}
