import { useEffect, useRef } from "react";

type Options = {
  enabled?: boolean;
  root?: Element | null;
  rootMargin?: string;
};

export function useLoadMoreSentinel(onLoadMore: () => void, options: Options = {}) {
  const { enabled = true, root = null, rootMargin = "480px" } = options;
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const onLoadMoreRef = useRef(onLoadMore);

  useEffect(() => {
    onLoadMoreRef.current = onLoadMore;
  }, [onLoadMore]);

  useEffect(() => {
    if (!enabled) return;
    const el = sentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          onLoadMoreRef.current();
        }
      },
      { root, rootMargin, threshold: 0 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [enabled, root, rootMargin]);

  return sentinelRef;
}
