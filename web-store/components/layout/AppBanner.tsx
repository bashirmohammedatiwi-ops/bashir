"use client";
import { useEffect, useState } from "react";
import { PLAY_STORE_URL } from "@/lib/config";
import { Icon } from "../ui/Icon";

type InstallEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };
const KEY = "dh-app-banner";

/** أندرويد: «حمّلي التطبيق» من Google Play. غيره: تثبيت الموقع كتطبيق إن دعمه المتصفح. */
export function AppBanner() {
  const [mode, setMode] = useState<"android" | "install" | null>(null);
  const [evt, setEvt] = useState<InstallEvent | null>(null);

  useEffect(() => {
    if ("serviceWorker" in navigator && location.protocol === "https:") navigator.serviceWorker.register("/sw.js").catch(() => null);
    const standalone = window.matchMedia("(display-mode: standalone)").matches;
    let dismissed = false;
    try {
      dismissed = Number(localStorage.getItem(KEY) ?? 0) > Date.now();
    } catch {}
    if (standalone || dismissed) return;
    if (/Android/i.test(navigator.userAgent)) {
      const t = setTimeout(() => setMode("android"), 2500);
      return () => clearTimeout(t);
    }
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setEvt(e as InstallEvent);
      setMode("install");
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  const dismiss = (days = 14) => {
    setMode(null);
    try {
      localStorage.setItem(KEY, String(Date.now() + days * 864e5));
    } catch {}
  };

  if (!mode) return null;
  return (
    <div className="fixed inset-x-3 top-3 z-[90] mx-auto flex max-w-md items-center gap-3 rounded-[24px] bg-surface p-3 shadow-float ring-1 ring-hairline animate-fade-up">
      <img src="/icon-192.png" alt="" className="h-12 w-12 flex-none rounded-2xl" />
      <div className="min-w-0 flex-1">
        <p className="font-extrabold">{mode === "android" ? "تطبيق ديما الحياة" : "ثبّتي ديما على جهازكِ"}</p>
        <p className="text-xs text-ink-muted">{mode === "android" ? "أسرع، مع إشعارات العروض وتتبّع الطلب" : "افتحي المتجر بلمسة مثل التطبيق"}</p>
      </div>
      {mode === "android" ? (
        <a href={PLAY_STORE_URL} target="_blank" rel="noopener noreferrer" onClick={() => dismiss(60)} className="btn h-10 flex-none bg-accent-dark px-4 text-sm text-white">
          حمّليه
        </a>
      ) : (
        <button
          onClick={async () => {
            await evt?.prompt();
            dismiss(60);
          }}
          className="btn h-10 flex-none bg-accent-dark px-4 text-sm text-white"
        >
          تثبيت
        </button>
      )}
      <button onClick={() => dismiss()} className="p-1 text-ink-muted" aria-label="إغلاق">
        <Icon name="close" size={18} />
      </button>
    </div>
  );
}
