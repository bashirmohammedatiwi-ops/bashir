"use client";
/* eslint-disable @next/next/no-img-element */
import clsx from "clsx";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { resolveLink } from "@/lib/links";
import { mediaSrcSet, mediaUrl } from "@/lib/media";
import type { Banner } from "@/lib/types";
import { Icon } from "../ui/Icon";

/** بنرات العالم: تتبدّل تلقائياً، سحب على الهاتف، نقاط وأسهم. */
export function HeroCarousel({ banners }: { banners: Banner[] }) {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const touch = useRef<number | null>(null);
  const n = banners.length;
  // البنرات متراكبة في نفس المكان، فكلها «ظاهرة» للمتصفح ويحمّل ويفكّ كل الصور الكبيرة دفعة واحدة.
  // نركّب صورة البنر الحالي والتالي فقط (وما عُرض سابقاً).
  const [mounted, setMounted] = useState<number[]>([0, 1]);
  useEffect(() => {
    const next = (i + 1) % Math.max(n, 1);
    setMounted((m) => (m.includes(i) && m.includes(next) ? m : Array.from(new Set([...m, i, next]))));
  }, [i, n]);
  useEffect(() => {
    if (n < 2 || paused) return;
    const t = setInterval(() => setI((x) => (x + 1) % n), 5500);
    return () => clearInterval(t);
  }, [n, paused]);
  if (!n) return null;
  return (
    <div
      className="group relative overflow-hidden rounded-[28px] bg-accent-light shadow-card md:rounded-4xl"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={(e) => (touch.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touch.current == null) return;
        const d = e.changedTouches[0].clientX - touch.current;
        if (Math.abs(d) > 40) setI((x) => (x + (d > 0 ? 1 : -1) + n) % n);
        touch.current = null;
      }}
    >
      {/* نفس نسبة تصاميم بنرات التطبيق (2150×1000) حتى لا يُقصّ النص المصمَّم داخل الصورة */}
      <div className="relative aspect-[43/20]">
        {banners.map((b, k) => {
          const href = resolveLink(b.linkType, b.linkValue, b.link);
          const img = !mounted.includes(k) ? null : (
            <img
              src={b.imageUrl || mediaUrl(b.image, "large")}
              srcSet={b.imageUrl ? undefined : mediaSrcSet(b.image)}
              sizes="100vw"
              alt={b.title ?? ""}
              loading={k === 0 ? "eager" : "lazy"}
              className="h-full w-full object-cover"
            />
          );
          return (
            <div key={b.id} className={clsx("absolute inset-0 transition-opacity duration-700", k === i ? "opacity-100" : "pointer-events-none opacity-0")}>
              {href ? <Link href={href} aria-label={b.title ?? "عرض"}>{img}</Link> : img}
              {/* العنوان مكتوب داخل صورة البنر (كما في التطبيق)؛ الطبقة النصية فقط لبنر له زر صريح */}
              {b.ctaLabel && (
                <div className="pointer-events-none absolute inset-0 flex items-end bg-gradient-to-t from-black/45 via-black/5 to-transparent p-5 md:p-10">
                  <div className="max-w-lg text-white">
                    {b.tag && <span className="mb-2 inline-block rounded-full bg-white/20 px-3 py-1 text-xs font-bold backdrop-blur">{b.tag}</span>}
                    {b.title && <h2 className="text-2xl font-extrabold leading-tight md:text-4xl">{b.title}</h2>}
                    {b.subtitle && <p className="mt-1 text-sm opacity-90 md:text-base">{b.subtitle}</p>}
                    {b.ctaLabel && href && <span className="pointer-events-auto mt-4 inline-flex rounded-full bg-white px-5 py-2.5 text-sm font-bold text-ink">{b.ctaLabel}</span>}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      {n > 1 && (
        <>
          <div className="absolute inset-x-0 bottom-3 flex justify-center gap-1.5">
            {banners.map((b, k) => (
              <button key={b.id} onClick={() => setI(k)} className={clsx("h-1.5 rounded-full transition-all", k === i ? "w-6 bg-white" : "w-1.5 bg-white/60")} aria-label={`بنر ${k + 1}`} />
            ))}
          </div>
          <button onClick={() => setI((i - 1 + n) % n)} className="absolute right-4 top-1/2 hidden h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/85 text-ink opacity-0 shadow-lift transition group-hover:opacity-100 md:grid" aria-label="السابق">
            <Icon name="chevronRight" />
          </button>
          <button onClick={() => setI((i + 1) % n)} className="absolute left-4 top-1/2 hidden h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/85 text-ink opacity-0 shadow-lift transition group-hover:opacity-100 md:grid" aria-label="التالي">
            <Icon name="chevronLeft" />
          </button>
        </>
      )}
    </div>
  );
}
