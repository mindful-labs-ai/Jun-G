import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

export async function GET() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: cookiesToSet => {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ user: null });

  const { data: row } = await supabase
    .from('temp_users')
    .select(
      `
      id, email,
      all_scene_tokens, one_scene_tokens, image_gpt_tokens, image_gemini_tokens, clip_seedance_tokens,
      all_scene_count,  one_scene_count,  image_gpt_count,  image_gemini_count,  clip_seedance_count
    `
    )
    .eq('id', user.id)
    .single();

  const tokenUsage = {
    allScene: row?.all_scene_tokens ?? 0,
    oneScene: row?.one_scene_tokens ?? 0,
    imageGPT: row?.image_gpt_tokens ?? 0,
    imageGemini: row?.image_gemini_tokens ?? 0,
    clipSeedance: row?.clip_seedance_tokens ?? 0,
  };

  const usedCount = {
    allScene: row?.all_scene_count ?? 0,
    oneScene: row?.one_scene_count ?? 0,
    imageGPT: row?.image_gpt_count ?? 0,
    imageGemini: row?.image_gemini_count ?? 0,
    clipSeedance: row?.clip_seedance_count ?? 0,
  };

  return NextResponse.json({
    id: user.id,
    email: user.email,
    tokenUsage,
    usedCount,
  });
}
