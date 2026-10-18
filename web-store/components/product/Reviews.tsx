"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import clsx from "clsx";
import Link from "next/link";
import { useState } from "react";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { useAuth } from "@/lib/stores/auth";
import { toast } from "@/lib/stores/ui";
import type { Paged, Product, Review } from "@/lib/types";
import { Icon } from "../ui/Icon";

function Stars({ value, size = 16 }: { value: number; size?: number }) {
  return (
    <span className="flex" dir="ltr">
      {[1, 2, 3, 4, 5].map((n) => (
        <Icon key={n} name="star" size={size} stroke={0} fill="currentColor" className={n <= Math.round(value) ? "text-star" : "text-hairline"} />
      ))}
    </span>
  );
}

export function Reviews({ product }: { product: Product }) {
  const user = useAuth((s) => s.user);
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["reviews", product.id], queryFn: () => api<Paged<Review>>(`/reviews/product/${product.id}`, { auth: false }) });
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const send = useMutation({
    mutationFn: () => api("/reviews", { method: "POST", body: { productId: product.id, rating, comment } }),
    onSuccess: () => {
      setComment("");
      toast({ text: "شكراً لتقييمكِ 💜 — يظهر بعد المراجعة" });
      qc.invalidateQueries({ queryKey: ["reviews", product.id] });
    },
    onError: (e) => toast({ text: (e as Error).message, tone: "error" }),
  });
  const list = data?.data ?? [];
  return (
    <section id="reviews" className="grid gap-6 lg:grid-cols-[320px_1fr]">
      <div className="card h-max p-6 text-center">
        <p className="text-5xl font-extrabold tabular-nums">{product.reviewCount > 0 ? product.rating.toFixed(1) : "—"}</p>
        <div className="mt-2 flex justify-center">
          <Stars value={product.rating} size={20} />
        </div>
        <p className="mt-1 text-sm text-ink-muted">{product.reviewCount > 0 ? `من ${product.reviewCount} تقييم` : "كوني أول من يقيّم"}</p>
        {user ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (comment.trim().length < 3) return toast({ text: "اكتبي رأيكِ بكلمات قليلة", tone: "error" });
              send.mutate();
            }}
            className="mt-5 space-y-3 text-start"
          >
            <div className="flex justify-center gap-1" dir="ltr">
              {[1, 2, 3, 4, 5].map((n) => (
                <button type="button" key={n} onClick={() => setRating(n)} aria-label={`${n} نجوم`}>
                  <Icon name="star" size={28} stroke={0} fill="currentColor" className={clsx("transition hover:scale-110", n <= rating ? "text-star" : "text-hairline")} />
                </button>
              ))}
            </div>
            <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={3} placeholder="شاركي تجربتكِ مع المنتج…" className="field h-auto py-3" />
            <button disabled={send.isPending} className="btn-primary w-full">
              {send.isPending ? "جارٍ الإرسال…" : "أرسلي التقييم"}
            </button>
          </form>
        ) : (
          <Link href={`/signin?next=${encodeURIComponent(`/product/${product.slug}#reviews`)}`} className="btn-soft mt-5 w-full">
            سجّلي الدخول لتقييم المنتج
          </Link>
        )}
      </div>
      <div className="space-y-3">
        {list.length === 0 ? (
          <div className="card p-10 text-center text-ink-muted">لا توجد تقييمات بعد</div>
        ) : (
          list.map((r) => (
            <article key={r.id} className="card p-5">
              <div className="mb-2 flex items-center justify-between">
                <span className="flex items-center gap-2 font-bold">
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-accent-light text-accent-dark">{(r.user?.name ?? "ز").slice(0, 1)}</span>
                  {r.user?.name ?? "زبونة"}
                </span>
                <span className="text-xs text-ink-muted">{formatDate(r.createdAt)}</span>
              </div>
              <Stars value={r.rating} />
              {r.comment && <p className="mt-2 leading-7 text-ink-soft">{r.comment}</p>}
            </article>
          ))
        )}
      </div>
    </section>
  );
}
