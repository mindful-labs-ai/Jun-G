'use client';

import { createClient } from '@/lib/supabase/client';

export default function SocialButtons() {
  const supabase = createClient();

  const signInWithGoogle = () =>
    supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${location.origin}/auth/callback` },
    });

  return (
    <main className='min-h-screen grid place-items-center p-6'>
      <div className='w-full max-w-sm space-y-3'>
        <h1 className='text-xl font-semibold'>로그인</h1>
        <button
          onClick={signInWithGoogle}
          className='w-full rounded border px-3 py-2'
        >
          Continue with Google
        </button>
      </div>
    </main>
  );
}
