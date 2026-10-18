"use client";
/* eslint-disable @next/next/no-img-element */
import { useQuery, useQueryClient } from "@tanstack/react-query";
import clsx from "clsx";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { Skeleton } from "@/components/ui/Skeleton";
import { api } from "@/lib/api";
import { formatDateTime } from "@/lib/format";
import { brandHref, categoryHref, packageHref, productHref } from "@/lib/links";
import type { Paged } from "@/lib/types";

type N = { id: string; title: string; body: string; imageUrl?: string | null; linkType: string; linkId?: string | null; linkSlug?: string | null; linkLabel?: string | null; externalUrl?: string | null; isRead: boolean; time: string };

function href(n: N): string | null {
  const v = n.linkSlug || n.linkId || "";
  switch (n.linkType) {
    case "PRODUCT":
      return v ? productHref(v) : null;
    case "CATEGORY":
      return v ? categoryHref(v) : null;
    case "BRAND":
      return v ? brandHref(v) : null;
    case "PACKAGE":
      return v ? packageHref(v) : null;
    case "ORDER":
      return n.linkId ? `/account/orders/${n.linkId}` : "/account/orders";
    case "OFFERS":
      return "/offers";
    case "EXTERNAL_URL":
      return n.externalUrl ?? null;
    default:
      return null;
  }
}

export default function NotificationsPage() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["notifications"], queryFn: () => api<Paged<N>>("/notifications", { query: { page: 1, limit: 50 } }) });
  const items = q.data?.data ?? [];
  const unread = items.filter((n) => !n.isRead).length;
  const read = async (n: N) => {
    if (n.isRead) return;
    await api(`/notifications/${n.id}/read`, { method: "PATCH" }).catch(() => null);
    qc.invalidateQueries({ queryKey: ["notifications"] });
  };
  const readAll = async () => {
    await api("/notifications/read-all", { method: "PATCH" }).catch(() => null);
    qc.invalidateQueries({ queryKey: ["notifications"] });
  };
  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold">الإشعارات</h1>
        {unread > 0 && (
          <button onClick={readAll} className="text-sm font-bold text-accent-dark">
            تحديد الكل كمقروء
          </button>
        )}
      </div>
      <div className="mt-4 space-y-2">
        {q.isLoading ? (
          <Skeleton className="h-40" />
        ) : items.length ? (
          items.map((n) => {
            const h = href(n);
            const body = (
              <div className={clsx("card flex gap-3 p-4 transition", !n.isRead && "ring-1 ring-accent/30", h && "hover:shadow-lift")}>
                <span className={clsx("grid h-11 w-11 flex-none place-items-center overflow-hidden rounded-2xl", n.isRead ? "bg-canvas text-ink-muted" : "bg-accent-light text-accent-dark")}>
                  {n.imageUrl ? <img src={n.imageUrl} alt="" className="h-full w-full object-cover" /> : <Icon name="bell" size={20} />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <b className="line-clamp-1">{n.title}</b>
                    {!n.isRead && <span className="h-2 w-2 flex-none rounded-full bg-sale" />}
                  </span>
                  <span className="mt-0.5 block text-sm text-ink-soft">{n.body}</span>
                  <span className="mt-1 block text-xs text-ink-muted">{formatDateTime(n.time)}</span>
                </span>
              </div>
            );
            return h ? (
              <Link key={n.id} href={h} onClick={() => read(n)} className="block" target={n.linkType === "EXTERNAL_URL" ? "_blank" : undefined}>
                {body}
              </Link>
            ) : (
              <div key={n.id} onClick={() => read(n)}>
                {body}
              </div>
            );
          })
        ) : (
          <div className="card p-10 text-center">
            <Icon name="bell" size={36} className="mx-auto text-ink-muted" />
            <p className="mt-2 font-bold">لا إشعارات بعد</p>
            <p className="text-sm text-ink-muted">سنخبركِ هنا بحالة طلباتكِ والعروض الجديدة</p>
          </div>
        )}
      </div>
    </div>
  );
}
