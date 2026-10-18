"use client";
/* eslint-disable @next/next/no-img-element */
import clsx from "clsx";
import { mediaUrl } from "@/lib/media";
import type { World } from "@/lib/types";
import { useSwitchWorld } from "../layout/SiteHeader";

/** محدّد العوالم الكبير (مثل التطبيق): لكل عالم لونه وصورته. */
export function WorldStrip({ worlds, current }: { worlds: World[]; current: World | null }) {
  const switchWorld = useSwitchWorld();
  if (worlds.length < 2) return null;
  return (
    <div className="scroll-row -mx-4 px-4 md:mx-0 md:grid md:grid-cols-5 md:px-0">
      {worlds.map((w) => {
        const on = w.id === current?.id;
        return (
          <button
            key={w.id}
            onClick={() => switchWorld(w)}
            className={clsx(
              "group relative flex w-[60%] flex-none snap-start sm:w-[36%] items-center gap-3 overflow-hidden rounded-3xl p-3 text-start transition md:w-auto",
              on ? "text-white shadow-lift" : "bg-surface text-ink shadow-card hover:-translate-y-0.5",
            )}
            style={on ? { background: `linear-gradient(135deg, ${w.accentColor}, ${w.accentColor}cc)` } : undefined}
          >
            <span className={clsx("grid h-12 w-12 flex-none place-items-center overflow-hidden rounded-2xl", on ? "bg-white/20" : "bg-canvas")}>
              {w.coverImage ? <img src={mediaUrl(w.coverImage, "thumb")} alt="" className="h-full w-full object-cover" /> : <span className="h-4 w-4 rounded-full" style={{ background: w.accentColor }} />}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-[15px] font-extrabold">{w.nameAr}</span>
              {w.taglineAr && <span className={clsx("block truncate text-xs", on ? "text-white/85" : "text-ink-muted")}>{w.taglineAr}</span>}
            </span>
          </button>
        );
      })}
    </div>
  );
}
