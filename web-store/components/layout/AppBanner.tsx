"use client";
import { useEffect, useState } from "react";
import { APP_STORE_URL, PLAY_STORE_LIVE, PLAY_STORE_URL } from "@/lib/config";
import { Icon } from "../ui/Icon";

type InstallEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };
const KEY = "dh-app-banner";

/** آيفون: التطبيق من App Store. أندرويد: من Google Play بعد نشره للعامة. غيرهما: تثبيت الموقع كتطبيق إن دعمه المتصفح.
 *  يظهر أعلى الصفحة ضمن التدفق (لا يغطي رأس الموقع) ويختفي مع التمرير. */
export function AppBanner() {
  const [mode, setMode] = useState<"store" | "install" | null>(null);
  const [storeUrl, setStoreUrl] = useState("");
  const [evt, setEvt] = useState<InstallEvent | null>(null);

  useEffect(() => {
    if ("serviceWorker" in navigator && location.protocol === "https:") navigator.serviceWorker.register("/sw.js").catch(() => null);
    const standalone = window.matchMedia("(display-mode: standalone)").matches;
    let dismissed = false;
    try {
      dismissed = Number(localStorage.getItem(KEY) ?? 0) > Date.now();
    } catch {}
    if (standalone || dismissed) return;
    const ua = navigator.userAgent;
    const ios = /iPhone|iPad|iPod/i.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
    const store = ios ? APP_STORE_URL : /Android/i.test(ua) && PLAY_STORE_LIVE ? PLAY_STORE_URL : "";
    if (store) {
      const t = setTimeout(() => (setStoreUrl(store), setMode("store")), 1500);
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
    <div className="no-print mx-3 mt-3 flex items-center gap-3 rounded-[24px] bg-surface p-3 shadow-card ring-1 ring-hairline animate-fade-up md:mx-auto md:max-w-md">
      <img src="/icon-192.png" alt="" className="h-12 w-12 flex-none rounded-2xl" />
      <div className="min-w-0 flex-1">
        <p className="font-extrabold">{mode === "store" ? "تطبيق ديما الحياة" : "ثبّتي ديما على جهازكِ"}</p>
        <p className="text-xs text-ink-muted">{mode === "store" ? "إشعارات العروض وتتبّع طلبكِ" : "افتحي المتجر بلمسة مثل التطبيق"}</p>
      </div>
      {mode === "store" ? (
        <a href={storeUrl} target="_blank" rel="noopener noreferrer" onClick={() => dismiss(60)} className="btn h-10 flex-none bg-accent-dark px-4 text-sm text-white">
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
