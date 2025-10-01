import { useCallback, useEffect, useRef } from 'react';

type Options = {
  delay?: number;
  once?: boolean;
};

export function useHoverPrefetch<ID extends string | number>(
  prefetch: (id: ID) => void | Promise<void>,
  { delay = 1000, once = true }: Options = {}
) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hoveredIdRef = useRef<ID | null>(null);
  const prefetchedRef = useRef<Set<ID>>(new Set());

  const enter = useCallback(
    (id: ID) => {
      if (once && prefetchedRef.current.has(id)) return;

      if (timerRef.current) clearTimeout(timerRef.current);
      hoveredIdRef.current = id;

      timerRef.current = setTimeout(async () => {
        if (hoveredIdRef.current !== id) return;
        await prefetch(id);
        if (once) prefetchedRef.current.add(id);
      }, delay);
    },
    [prefetch, delay, once]
  );

  const leave = useCallback((id?: ID) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (!id || hoveredIdRef.current === id) hoveredIdRef.current = null;
  }, []);

  const bind = useCallback(
    (id: ID) => ({
      onMouseEnter: () => enter(id),
      onMouseLeave: () => leave(id),
    }),
    [enter, leave]
  );

  const reset = useCallback(() => {
    prefetchedRef.current.clear();
  }, []);

  const hasPrefetched = useCallback(
    (id: ID) => prefetchedRef.current.has(id),
    []
  );

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return { enter, leave, bind, reset, hasPrefetched };
}
