'use client';

import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/lib/shared/useAuthStore';
import type { AIKey } from '@/lib/shared/useAuthStore';

export async function reportUsage(key: AIKey, tokenInc: number, countInc = 1) {
  const { tokenUsed, countUp } = useAuthStore.getState();
  if (tokenInc && tokenInc !== 0) tokenUsed(tokenInc, key);
  if (countInc && countInc !== 0) countUp(key);

  try {
    const supabase = createClient();
    const { error } = await supabase.rpc('increase_usage', {
      p_key: key,
      p_token_inc: tokenInc,
      p_count_inc: countInc,
    });
    if (error) {
      console.error('[usage] increase_usage RPC failed:', error);
    }
  } catch (e) {
    console.error('[usage] increase_usage RPC error:', e);
  }
}
