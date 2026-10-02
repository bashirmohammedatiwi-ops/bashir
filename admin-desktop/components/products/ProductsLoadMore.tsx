"use client";

import { Spin } from "antd";
import { useCallback } from "react";
import { useLoadMoreSentinel } from "@/hooks/useLoadMoreSentinel";

type Props = {
  loaded: number;
  total: number;
  hasMore: boolean;
  loadingMore: boolean;
  onLoadMore: () => void;
};

export function ProductsLoadMore({ loaded, total, hasMore, loadingMore, onLoadMore }: Props) {
  const handleLoadMore = useCallback(() => {
    if (hasMore && !loadingMore) onLoadMore();
  }, [hasMore, loadingMore, onLoadMore]);

  const sentinelRef = useLoadMoreSentinel(handleLoadMore, { enabled: hasMore });

  const pct = total > 0 ? Math.min(100, Math.round((loaded / total) * 100)) : 0;

  return (
    <div className="pp-infinite">
      <div className="pp-infinite-track" aria-hidden>
        <div className="pp-infinite-fill" style={{ width: `${pct}%` }} />
      </div>
      <div className="pp-infinite-meta">
        <span>
          عُرض {loaded.toLocaleString("ar-IQ")} من {total.toLocaleString("ar-IQ")} منتج
        </span>
        {hasMore ? (
          loadingMore ? (
            <span className="pp-infinite-status">
              <Spin size="small" /> جاري تحميل المزيد...
            </span>
          ) : (
            <span className="pp-infinite-hint">مرّر للأسفل لتحميل المزيد</span>
          )
        ) : loaded > 0 ? (
          <span className="pp-infinite-done">تم عرض كل المنتجات</span>
        ) : null}
      </div>
      <div ref={sentinelRef} className="pp-infinite-sentinel" aria-hidden />
    </div>
  );
}

export function ProductsGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <article key={i} className="pp-card pp-card-skeleton" aria-hidden>
          <div className="pp-skeleton-media" />
          <div className="pp-skeleton-body">
            <div className="pp-skeleton-line short" />
            <div className="pp-skeleton-line" />
            <div className="pp-skeleton-line tiny" />
          </div>
        </article>
      ))}
    </>
  );
}
