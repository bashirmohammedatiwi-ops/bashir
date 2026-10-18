"use client";
import clsx from "clsx";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useHydrated } from "../Providers";
import { useAdvisor } from "@/lib/advisor";
import { AdvisorChat, DeemaOrb } from "./AdvisorChat";

/** زر «ديما» العائم ونافذتها — في كل الصفحات عدا صفحتها الكاملة والدفع. */
export function AdvisorLauncher() {
  const hydrated = useHydrated();
  const path = usePathname();
  const { open, setOpen, start, entries } = useAdvisor();
  const [hint, setHint] = useState(false);
  const hidden = path.startsWith("/advisor") || path.startsWith("/checkout") || path.startsWith("/pay");

  useEffect(() => {
    if (!open) return;
    start();
    document.documentElement.style.overflow = window.innerWidth < 768 ? "hidden" : "";
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", esc);
    return () => {
      window.removeEventListener("keydown", esc);
      document.documentElement.style.overflow = "";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // تلميح لطيف مرة واحدة للزائرة الجديدة.
  useEffect(() => {
    if (!hydrated || entries.length) return;
    try {
      if (localStorage.getItem("dh-advisor-hint")) return;
    } catch {
      return;
    }
    const t = setTimeout(() => setHint(true), 9000);
    return () => clearTimeout(t);
  }, [hydrated, entries.length]);

  if (!hydrated || hidden) return null;
  const dismissHint = () => {
    setHint(false);
    try {
      localStorage.setItem("dh-advisor-hint", "1");
    } catch {}
  };

  return (
    <>
      {!open && (
        <div className="no-print fixed bottom-24 left-4 z-[45] flex items-end gap-2 md:bottom-6 md:left-6">
          <button onClick={() => (dismissHint(), setOpen(true))} className="group relative rounded-full transition hover:scale-105" aria-label="اسألي ديما">
            <span className="absolute inset-0 animate-ping rounded-full bg-accent/30 [animation-duration:2.6s]" />
            <DeemaOrb size={58} />
          </button>
          {hint && (
            <div className="relative mb-2 max-w-[220px] rounded-3xl rounded-bl-lg bg-surface p-3 text-sm shadow-float animate-fade-up">
              <button onClick={dismissHint} className="absolute left-2 top-2 text-xs text-ink-muted" aria-label="إغلاق">
                ✕
              </button>
              <b>محتارة شتختارين؟</b>
              <p className="text-xs text-ink-soft">أنا ديما — أرشحلكِ الأنسب لبشرتكِ وذوقكِ مع السبب ✨</p>
            </div>
          )}
        </div>
      )}
      <div className={clsx("fixed inset-0 z-[70] transition", open ? "pointer-events-auto" : "pointer-events-none")} aria-hidden={!open}>
        <div onClick={() => setOpen(false)} className={clsx("absolute inset-0 bg-ink/30 transition-opacity md:bg-ink/10", open ? "opacity-100" : "opacity-0")} />
        <aside
          role="dialog"
          aria-label="ديما — مستشارتكِ الجمالية"
          className={clsx(
            "absolute inset-0 flex flex-col bg-canvas shadow-float transition-transform duration-300 ease-out md:inset-auto md:bottom-6 md:left-6 md:h-[min(760px,calc(100vh-48px))] md:w-[460px] md:overflow-hidden md:rounded-[32px]",
            open ? "translate-y-0" : "translate-y-full md:translate-y-[110%]",
          )}
        >
          {open && <AdvisorChat variant="panel" onClose={() => setOpen(false)} />}
        </aside>
      </div>
    </>
  );
}
