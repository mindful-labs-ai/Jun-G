'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/lib/shared/useAuthStore';

const emptyUsage = {
  allScene: 0,
  oneScene: 0,
  imageGPT: 0,
  imageGemini: 0,
  clipSeedance: 0,
};

export function useAuthHydration() {
  const supabase = createClient();
  const initState = useAuthStore(s => s.initState);
  const setId = useAuthStore(s => s.setId);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let unsub: { unsubscribe: () => void } | null = null;

    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user?.id) {
        setId(user.id);
        const res = await fetch('/api/me', { cache: 'no-store' });
        if (res.ok) {
          const me = await res.json();
          initState({
            userId: me.id,
            userEmail: me.email,
            tokenUsage: me.tokenUsage ?? emptyUsage,
            usedCount: me.usedCount ?? emptyUsage,
          });
        } else {
          initState({
            userId: user.id,
            userEmail: user.email ?? '',
            tokenUsage: emptyUsage,
            usedCount: emptyUsage,
          });
        }
      } else {
        initState({
          userId: '',
          userEmail: '',
          tokenUsage: emptyUsage,
          usedCount: emptyUsage,
        });
      }

      const { data: sub } = supabase.auth.onAuthStateChange(
        async (_event, session) => {
          if (session?.user) {
            setId(session.user.id);
            const res = await fetch('/api/me', { cache: 'no-store' });
            if (res.ok) {
              const me = await res.json();
              initState({
                userId: me.id,
                userEmail: me.email,

                tokenUsage: me.tokenUsage ?? emptyUsage,
                usedCount: me.usedCount ?? emptyUsage,
              });
            }
          } else {
            initState({
              userId: '',
              userEmail: '',
              tokenUsage: emptyUsage,
              usedCount: emptyUsage,
            });
          }
        }
      );

      unsub = sub?.subscription ?? null;
      setReady(true);
    })();

    return () => {
      unsub?.unsubscribe?.();
    };
  }, [supabase, initState, setId]);

  return ready;
}
