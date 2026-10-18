"use client";
export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="container grid min-h-[50vh] place-items-center py-16 text-center">
      <div>
        <p className="text-5xl">😕</p>
        <h1 className="mt-3 text-xl font-extrabold">حدث خطأ غير متوقع</h1>
        <p className="mt-1 text-ink-muted">تعذّر تحميل الصفحة — حاولي مرة أخرى</p>
        <button onClick={reset} className="btn-primary mt-5">
          إعادة المحاولة
        </button>
      </div>
    </div>
  );
}
