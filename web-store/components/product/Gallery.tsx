"use client";
/* eslint-disable @next/next/no-img-element */
import clsx from "clsx";
import { useEffect, useRef, useState } from "react";
import { mediaUrl } from "@/lib/media";
import type { Media } from "@/lib/types";
import { Icon } from "../ui/Icon";
import { DiscountBadge } from "../ui/Price";

/** معرض صور المنتج: مصغّرات، تكبير عند المرور (حاسوب)، سحب (هاتف)، وعرض بملء الشاشة. */
export function Gallery({ images, alt, discount, focusMedia }: { images: Media[]; alt: string; discount?: number; focusMedia?: Media | null }) {
  const [i, setI] = useState(0);
  const [zoom, setZoom] = useState<{ x: number; y: number } | null>(null);
  const [full, setFull] = useState(false);
  const touch = useRef<number | null>(null);
  const list = images.length ? images : [];
  const n = list.length;

  // اختيار تدرّج له صورة ← نعرضها.
  useEffect(() => {
    if (!focusMedia) return;
    const k = list.findIndex((m) => m.id === focusMedia.id);
    if (k >= 0) setI(k);
  }, [focusMedia, list]);

  const current = list[i];
  const step = (d: number) => setI((x) => (x + d + n) % n);

  return (
    <div className="lg:sticky lg:top-36">
      <div className="flex flex-col-reverse gap-3 md:flex-row">
        {n > 1 && (
          <div className="no-scrollbar flex gap-2 overflow-x-auto md:max-h-[560px] md:w-20 md:flex-col md:overflow-y-auto">
            {list.map((m, k) => (
              <button
                key={m.id ?? k}
                onClick={() => setI(k)}
                className={clsx("aspect-square w-16 flex-none overflow-hidden rounded-2xl border-2 bg-white p-1 transition md:w-full", k === i ? "border-accent" : "border-transparent opacity-70 hover:opacity-100")}
                aria-label={`صورة ${k + 1}`}
              >
                <img src={mediaUrl(m, "thumb")} alt="" className="h-full w-full object-contain" loading="lazy" />
              </button>
            ))}
          </div>
        )}
        <div
          className="relative aspect-square flex-1 cursor-zoom-in overflow-hidden rounded-[32px] bg-white shadow-card"
          onMouseMove={(e) => {
            const r = e.currentTarget.getBoundingClientRect();
            setZoom({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 });
          }}
          onMouseLeave={() => setZoom(null)}
          onClick={() => setFull(true)}
          onTouchStart={(e) => (touch.current = e.touches[0].clientX)}
          onTouchEnd={(e) => {
            if (touch.current == null || n < 2) return;
            const d = e.changedTouches[0].clientX - touch.current;
            if (Math.abs(d) > 40) step(d > 0 ? 1 : -1);
            touch.current = null;
          }}
        >
          {current ? (
            <img
              src={mediaUrl(current, "large")}
              alt={alt}
              className="h-full w-full object-contain p-6 transition-transform duration-200"
              style={zoom ? { transform: "scale(1.9)", transformOrigin: `${zoom.x}% ${zoom.y}%` } : undefined}
            />
          ) : (
            <div className="grid h-full place-items-center text-ink-muted">بلا صورة</div>
          )}
          {!!discount && <DiscountBadge percent={discount} className="absolute right-5 top-5 px-3 py-1 text-sm" />}
          {n > 1 && (
            <span className="absolute bottom-4 left-4 rounded-full bg-ink/70 px-2.5 py-1 text-xs font-bold text-white" dir="ltr">
              {i + 1} / {n}
            </span>
          )}
        </div>
      </div>

      {full && current && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/90 animate-fade-up" onClick={() => setFull(false)}>
          <img src={mediaUrl(current, "large")} alt={alt} className="max-h-[92vh] max-w-[92vw] object-contain" onClick={(e) => e.stopPropagation()} />
          <button className="absolute left-5 top-5 rounded-full bg-white/15 p-3 text-white" aria-label="إغلاق">
            <Icon name="close" />
          </button>
          {n > 1 && (
            <>
              <button onClick={(e) => (e.stopPropagation(), step(-1))} className="absolute right-5 rounded-full bg-white/15 p-3 text-white" aria-label="السابق">
                <Icon name="chevronRight" />
              </button>
              <button onClick={(e) => (e.stopPropagation(), step(1))} className="absolute left-5 bottom-1/2 rounded-full bg-white/15 p-3 text-white" aria-label="التالي">
                <Icon name="chevronLeft" />
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
