"use client";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";

/** شريط تقدّم رفيع أعلى الصفحة أثناء التنقل — يحسس الزبونة إن الضغطة وصلت. */
function Bar() {
  const path = usePathname();
  const sp = useSearchParams();
  const [p, setP] = useState(0);
  const timer = useRef<number>();

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as HTMLElement).closest("a");
      if (!a || a.target === "_blank" || a.hasAttribute("download")) return;
      const href = a.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin) return;
      if (url.pathname === location.pathname && url.search === location.search) return;
      setP(12);
      clearInterval(timer.current);
      timer.current = window.setInterval(() => setP((x) => (x < 90 ? x + (90 - x) * 0.12 : x)), 200);
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  useEffect(() => {
    if (!p) return;
    clearInterval(timer.current);
    setP(100);
    const t = setTimeout(() => setP(0), 260);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, sp]);

  if (!p) return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[100] h-[3px]">
      <div className="h-full rounded-l-full bg-gradient-to-l from-accent to-[#C2508A] shadow-[0_0_10px_rgb(var(--accent))] transition-all duration-200 ease-out" style={{ width: `${p}%` }} />
    </div>
  );
}

export function NavProgress() {
  return (
    <Suspense>
      <Bar />
    </Suspense>
  );
}
