"use client";
/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useHydrated } from "../Providers";
import { COMPARE_MAX, useCompare } from "@/lib/stores/compare";
import { Icon } from "../ui/Icon";

/** شريط المقارنة العائم — يظهر حين تختار الزبونة منتجاً للمقارنة. */
export function CompareTray() {
  const hydrated = useHydrated();
  const path = usePathname();
  const { items, remove, clear } = useCompare();
  if (!hydrated || !items.length || path.startsWith("/compare") || path.startsWith("/checkout")) return null;
  return (
    <div className="no-print fixed inset-x-3 bottom-[88px] z-[43] mx-auto flex max-w-2xl items-center gap-3 rounded-[24px] border border-hairline bg-surface/95 p-2.5 shadow-float backdrop-blur animate-fade-up md:bottom-6">
      <span className="hidden ps-2 text-sm font-extrabold md:block">⚖️ المقارنة</span>
      <div className="flex min-w-0 flex-1 gap-2">
        {Array.from({ length: COMPARE_MAX }, (_, i) => items[i]).map((it, i) =>
          it ? (
            <span key={it.id} className="relative h-12 w-12 flex-none rounded-xl border border-hairline bg-white p-1">
              <img src={it.image} alt={it.name} className="h-full w-full object-contain" />
              <button onClick={() => remove(it.id)} className="absolute -left-1.5 -top-1.5 grid h-5 w-5 place-items-center rounded-full bg-night text-white" aria-label="إزالة">
                <Icon name="close" size={11} />
              </button>
            </span>
          ) : (
            <span key={i} className="hidden h-12 w-12 flex-none rounded-xl border-2 border-dashed border-hairline sm:block" />
          ),
        )}
      </div>
      <button onClick={clear} className="p-2 text-xs font-bold text-ink-muted hover:text-sale">
        مسح
      </button>
      <Link href="/compare" className={`btn h-11 flex-none px-4 text-sm ${items.length >= 2 ? "bg-accent-dark text-white" : "pointer-events-none bg-canvas text-ink-muted"}`}>
        {items.length >= 2 ? `قارني (${items.length})` : "أضيفي منتجاً آخر"}
      </Link>
    </div>
  );
}
