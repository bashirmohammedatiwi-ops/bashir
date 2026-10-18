"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/stores/auth";

type Summary = { paymentStatus?: string; status?: string };

/** العودة من صفحة دفع كي كارد: نسأل السيرفر عن النتيجة الحقيقية ثم نفتح صفحة الطلب. */
function PayReturn() {
  const sp = useSearchParams();
  const router = useRouter();
  const order = sp.get("order");
  const ready = useAuth((s) => s.ready);
  const [state, setState] = useState<"checking" | "paid" | "failed">("checking");

  useEffect(() => {
    if (!order || !ready) return;
    let tries = 0;
    let stop = false;
    const check = async () => {
      try {
        const r = await api<Summary>(`/payments/orders/${order}/confirm`, { method: "POST" });
        if (stop) return;
        if (r.paymentStatus === "PAID") {
          setState("paid");
          setTimeout(() => router.replace(`/account/orders/${order}?placed=1`), 1200);
          return;
        }
        if (++tries < 4) return void setTimeout(check, 2500);
        setState("failed");
      } catch {
        if (!stop) setState("failed");
      }
    };
    check();
    return () => {
      stop = true;
    };
  }, [order, ready, router]);

  return (
    <div className="container grid min-h-[60vh] place-items-center py-12">
      <div className="card w-full max-w-md p-8 text-center">
        {state === "checking" && (
          <>
            <span className="mx-auto block h-14 w-14 animate-spin rounded-full border-4 border-accent-light border-t-accent-dark" />
            <p className="mt-4 text-lg font-extrabold">نتحقق من الدفع…</p>
            <p className="mt-1 text-sm text-ink-muted">لحظات فقط، لا تغلقي الصفحة</p>
          </>
        )}
        {state === "paid" && (
          <>
            <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald-50 text-success">
              <Icon name="check" size={32} stroke={3} />
            </span>
            <p className="mt-4 text-lg font-extrabold">تم الدفع بنجاح 💜</p>
          </>
        )}
        {state === "failed" && (
          <>
            <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-rose-soft text-sale">
              <Icon name="close" size={30} />
            </span>
            <p className="mt-4 text-lg font-extrabold">لم يكتمل الدفع</p>
            <p className="mt-1 text-sm text-ink-muted">طلبكِ محفوظ — يمكنكِ المحاولة مرة أخرى من صفحة الطلب، ولن يُسحب المبلغ مرتين.</p>
            {order && (
              <Link href={`/account/orders/${order}`} className="btn-primary mt-5">
                صفحة الطلب
              </Link>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense>
      <PayReturn />
    </Suspense>
  );
}
