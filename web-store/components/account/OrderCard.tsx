/* eslint-disable @next/next/no-img-element */
import clsx from "clsx";
import Link from "next/link";
import { arProducts, formatDate, formatPrice } from "@/lib/format";
import { productCover } from "@/lib/media";
import { statusOf } from "@/lib/orders";
import type { Order } from "@/lib/types";
import { Icon, type IconName } from "../ui/Icon";

export function StatusPill({ status }: { status: string }) {
  const s = statusOf(status);
  return (
    <span className={clsx("inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-extrabold", s.tone)}>
      <Icon name={s.icon as IconName} size={13} stroke={2.4} /> {s.label}
    </span>
  );
}

export function OrderCard({ order }: { order: Order }) {
  const items = order.items ?? [];
  const qty = items.reduce((s, i) => s + i.quantity, 0);
  return (
    <Link href={`/account/orders/${order.id}`} className="card group block p-4 transition hover:shadow-lift md:p-5">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-extrabold" dir="ltr">
          #{order.orderNumber}
        </span>
        <StatusPill status={order.status} />
        <span className="ms-auto text-xs text-ink-muted">{formatDate(order.createdAt)}</span>
      </div>
      <div className="mt-3 flex items-center gap-3">
        <div className="flex -space-x-3 space-x-reverse">
          {items.slice(0, 4).map((it) => (
            <span key={it.id} className="grid h-12 w-12 place-items-center overflow-hidden rounded-xl border-2 border-surface bg-white p-1 shadow-sm">
              {it.product && productCover(it.product, "thumb") ? <img src={productCover(it.product, "thumb")} alt="" className="h-full w-full object-contain" /> : <Icon name="box" size={18} className="text-ink-muted" />}
            </span>
          ))}
          {items.length > 4 && <span className="grid h-12 w-12 place-items-center rounded-xl border-2 border-surface bg-canvas text-xs font-bold">+{items.length - 4}</span>}
        </div>
        <div className="ms-auto text-left">
          <p className="font-extrabold tabular-nums">{formatPrice(order.total)}</p>
          <p className="text-xs text-ink-muted">{arProducts(qty)}</p>
        </div>
        <Icon name="chevronLeft" size={18} className="text-ink-muted transition group-hover:-translate-x-1" />
      </div>
    </Link>
  );
}
