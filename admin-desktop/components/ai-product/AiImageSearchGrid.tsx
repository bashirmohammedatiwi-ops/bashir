"use client";

import { useState } from "react";
import type { AiAutofillImage } from "@/lib/aiProductTypes";

type Props = {
  images: AiAutofillImage[];
  selected: Set<string>;
  onToggle: (url: string) => void;
  loading?: boolean;
  emptyText?: string;
};

export function AiImageSearchGrid({
  images,
  selected,
  onToggle,
  loading,
  emptyText = "لا توجد صور — جرّب البحث مرة أخرى",
}: Props) {
  const [broken, setBroken] = useState<Set<string>>(() => new Set());

  if (loading && !images.length) {
    return (
      <div style={{ textAlign: "center", padding: 48, color: "#8a8194" }}>
        جاري جلب الصور…
      </div>
    );
  }

  const visible = images.filter((img) => !broken.has(img.url));

  if (!visible.length && !loading) {
    return (
      <div style={{ textAlign: "center", padding: 48, color: "#8a8194" }}>{emptyText}</div>
    );
  }

  return (
    <div>
      {loading ? (
        <div style={{ textAlign: "center", padding: "8px 0 16px", color: "#8a8194", fontSize: 13 }}>
          جاري جلب المزيد من الصور…
        </div>
      ) : null}
      <div className="ai-image-grid">
      {visible.map((img) => {
        const url = img.url;
        const thumb = img.thumbUrl || img.url;
        const isSelected = selected.has(url);
        return (
          <button
            key={url}
            type="button"
            className={`ai-image-tile${isSelected ? " selected" : ""}`}
            onClick={() => onToggle(url)}
            title={img.title || undefined}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={thumb}
              alt={img.title || "صورة منتج"}
              loading="lazy"
              decoding="async"
              onError={() => setBroken((prev) => new Set(prev).add(url))}
            />
            {img.title ? <div className="ai-image-title">{img.title}</div> : null}
          </button>
        );
      })}
      </div>
    </div>
  );
}
