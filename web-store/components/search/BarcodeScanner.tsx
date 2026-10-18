"use client";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { productHref } from "@/lib/links";
import { Icon } from "../ui/Icon";

type Detector = { detect: (src: HTMLVideoElement) => Promise<{ rawValue: string }[]> };

/** مسح باركود المنتج بالكاميرا (مثل التطبيق) — أو كتابة الرقم يدوياً. */
export function BarcodeScanner({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const video = useRef<HTMLVideoElement>(null);
  const [status, setStatus] = useState<"starting" | "scanning" | "unsupported" | "denied" | "looking" | "notfound">("starting");
  const [manual, setManual] = useState("");
  const done = useRef(false);

  const lookup = async (code: string) => {
    if (done.current) return;
    done.current = true;
    setStatus("looking");
    try {
      const r = await api<{ product?: { slug: string } | null }>("/products/lookup/barcode", { auth: false, query: { code } });
      if (r.product?.slug) {
        onClose();
        router.push(productHref(r.product.slug));
        return;
      }
    } catch {}
    done.current = false;
    setStatus("notfound");
  };

  useEffect(() => {
    let stream: MediaStream | null = null;
    let raf = 0;
    const W = window as unknown as { BarcodeDetector?: new (o: { formats: string[] }) => Detector };
    (async () => {
      if (!W.BarcodeDetector || !navigator.mediaDevices?.getUserMedia) return setStatus("unsupported");
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      } catch {
        return setStatus("denied");
      }
      const v = video.current!;
      v.srcObject = stream;
      await v.play().catch(() => null);
      setStatus("scanning");
      const det = new W.BarcodeDetector({ formats: ["ean_13", "ean_8", "upc_a", "upc_e", "code_128", "qr_code"] });
      const tick = async () => {
        if (done.current) return;
        try {
          const codes = await det.detect(v);
          const raw = codes[0]?.rawValue?.trim();
          if (raw) {
            const m = raw.match(/\/product\/([^/?#]+)/);
            if (m) {
              done.current = true;
              onClose();
              return router.push(productHref(decodeURIComponent(m[1])));
            }
            return lookup(raw);
          }
        } catch {}
        raf = window.setTimeout(tick, 250) as unknown as number;
      };
      tick();
    })();
    return () => {
      clearTimeout(raf);
      stream?.getTracks().forEach((t) => t.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="fixed inset-0 z-[85] flex items-center justify-center bg-black/80 p-4" onClick={onClose}>
      <div className="w-full max-w-md overflow-hidden rounded-[28px] bg-surface" onClick={(e) => e.stopPropagation()}>
        <div className="relative aspect-[4/3] bg-black">
          <video ref={video} playsInline muted className="h-full w-full object-cover" />
          {status === "scanning" && <span className="absolute inset-x-10 top-1/2 h-0.5 -translate-y-1/2 animate-pulse rounded bg-accent shadow-[0_0_12px_rgb(var(--accent))]" />}
          {status !== "scanning" && (
            <div className="absolute inset-0 grid place-items-center p-6 text-center text-sm text-white/90">
              {status === "starting" && "نفتح الكاميرا…"}
              {status === "looking" && "نبحث عن المنتج…"}
              {status === "unsupported" && "متصفحكِ لا يدعم المسح بالكاميرا — اكتبي رقم الباركود بالأسفل"}
              {status === "denied" && "اسمحي باستخدام الكاميرا من إعدادات المتصفح، أو اكتبي الرقم بالأسفل"}
              {status === "notfound" && "ما لكينا هذا المنتج بالمتجر 🙈 جرّبي مرة ثانية أو ابحثي بالاسم"}
            </div>
          )}
          <button onClick={onClose} className="absolute left-3 top-3 rounded-full bg-black/50 p-2 text-white" aria-label="إغلاق">
            <Icon name="close" size={18} />
          </button>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (manual.trim()) lookup(manual.trim());
          }}
          className="flex gap-2 p-4"
        >
          <input value={manual} onChange={(e) => setManual(e.target.value.replace(/[^\d]/g, ""))} inputMode="numeric" placeholder="أو اكتبي رقم الباركود" className="field h-11 flex-1 text-left" dir="ltr" />
          <button className="btn h-11 bg-accent-dark px-4 text-sm text-white">بحث</button>
        </form>
      </div>
    </div>
  );
}
