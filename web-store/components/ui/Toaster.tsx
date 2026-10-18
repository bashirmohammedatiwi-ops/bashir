"use client";
import clsx from "clsx";
import Link from "next/link";
import { useUi } from "@/lib/stores/ui";
import { Icon } from "./Icon";

export function Toaster() {
  const toasts = useUi((s) => s.toasts);
  const dismiss = useUi((s) => s.dismiss);
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-24 z-[70] flex flex-col items-center gap-2 px-4 md:bottom-8">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={clsx(
            "pointer-events-auto flex w-full max-w-md items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-white shadow-float animate-fade-up",
            t.tone === "error" ? "bg-sale" : "bg-ink",
          )}
          role="status"
        >
          <Icon name={t.tone === "error" ? "close" : "check"} size={18} className={t.tone === "error" ? "" : "text-emerald-300"} />
          <span className="flex-1">{t.text}</span>
          {t.action && (
            <Link href={t.action.href} onClick={() => dismiss(t.id)} className="rounded-full bg-white/15 px-3 py-1 text-xs font-bold hover:bg-white/25">
              {t.action.label}
            </Link>
          )}
        </div>
      ))}
    </div>
  );
}
