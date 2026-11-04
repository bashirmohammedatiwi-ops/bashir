"use client";
import { useEffect } from "react";
import { reportClientError } from "@/lib/reportError";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => reportClientError("boundary", error), [error]);
  return (
    <div className="container grid min-h-[50vh] place-items-center py-16 text-center">
      <div>
        <p className="text-5xl">😕</p>
        <h1 className="mt-3 text-xl font-extrabold">حدث خطأ غير متوقع</h1>
        <p className="mt-1 text-ink-muted">تعذّر تحميل الصفحة — حاولي مرة أخرى</p>
        <button onClick={reset} className="btn-primary mt-5">
          إعادة المحاولة
        </button>
        {/* رمز قصير يساعد الدعم على معرفة السبب من لقطة الشاشة */}
        <p dir="ltr" className="mx-auto mt-6 max-w-xs break-words text-[10px] text-ink-muted/70">
          {(error?.name || "Error") + ": " + String(error?.message ?? "").slice(0, 120)}
        </p>
      </div>
    </div>
  );
}
