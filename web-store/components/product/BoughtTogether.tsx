"use client";
/* eslint-disable @next/next/no-img-element */
import clsx from "clsx";
import Link from "next/link";
import { useState } from "react";
import { cardTitle } from "@/lib/brandSearch";
import { formatNumber, formatPrice } from "@/lib/format";
import { productHref } from "@/lib/links";
import { listedShades, productCover } from "@/lib/media";
import { useCart } from "@/lib/stores/cart";
import { toast, useUi } from "@/lib/stores/ui";
import type { Product } from "@/lib/types";
import { Icon } from "../ui/Icon";

/** «تُشترى معاً»: المنتج + منتجين يكمّلانه، بمجموع واحد وزر إضافة للكل. */
export function BoughtTogether({ product, pairs }: { product: Product; pairs: Product[] }) {
  const simple = (x: Product) => listedShades(x).length === 0 && x.stock > 0;
  const picks = pairs.filter((x) => x.stock > 0).slice(0, 2);
  const all = [product, ...picks];
  const [on, setOn] = useState<Record<string, boolean>>(() => Object.fromEntries(all.map((x) => [x.id, true])));
  const add = useCart((s) => s.add);
  const openCart = useUi((s) => s.openCart);
  if (!picks.length) return null;
  const chosen = all.filter((x) => on[x.id]);
  const total = chosen.reduce((s, x) => s + x.price, 0);
  const old = chosen.reduce((s, x) => s + Math.max(x.originalPrice, x.price), 0);
  const needShade = chosen.filter((x) => listedShades(x).length > 0);

  const addAll = () => {
    if (needShade.length) {
      toast({ text: `«${cardTitle(needShade[0])}» له ألوان — اختاريه من صفحته`, action: { label: "افتحي", href: productHref(needShade[0].slug) } });
    }
    let n = 0;
    for (const x of chosen) if (simple(x) && add(x, 1)) n++;
    if (n) {
      toast({ text: `أُضيف ${n} للسلة ✨`, tone: "success" });
      openCart(true);
    }
  };

  return (
    <div className="card p-5 md:p-6">
      <h3 className="text-lg font-extrabold">تُشترى معاً غالباً</h3>
      <div className="mt-4 flex flex-col gap-5 md:flex-row md:items-center">
        <div className="flex flex-1 items-center gap-2 overflow-x-auto md:gap-3">
          {all.map((x, i) => (
            <div key={x.id} className="flex items-center gap-2 md:gap-3">
              {i > 0 && <Icon name="plus" size={18} className="flex-none text-ink-muted" />}
              <label className={clsx("relative block w-28 flex-none cursor-pointer md:w-36", !on[x.id] && "opacity-45")}>
                <input type="checkbox" checked={!!on[x.id]} onChange={(e) => setOn({ ...on, [x.id]: e.target.checked })} className="absolute right-2 top-2 z-10 h-5 w-5 accent-[rgb(var(--accent-dark))]" />
                <span className="block aspect-square overflow-hidden rounded-2xl border border-hairline bg-white p-2">
                  <img src={productCover(x, "small")} alt="" loading="lazy" className="h-full w-full object-contain" />
                </span>
                <span className="mt-1.5 line-clamp-2 block text-xs font-semibold">{i === 0 ? "هذا المنتج" : <Link href={productHref(x.slug)} className="hover:text-accent-dark">{cardTitle(x)}</Link>}</span>
                <span className="text-sm font-extrabold tabular-nums">{formatNumber(x.price)}</span>
              </label>
            </div>
          ))}
        </div>
        <div className="flex-none rounded-2xl bg-canvas p-4 md:w-60">
          <p className="text-sm text-ink-muted">المجموع ({chosen.length})</p>
          <p className="text-2xl font-extrabold tabular-nums">{formatPrice(total)}</p>
          {old > total && <p className="text-xs font-bold text-success">توفّرين {formatPrice(old - total)}</p>}
          <button onClick={addAll} disabled={!chosen.length} className="btn-primary mt-3 h-11 w-full text-sm">
            <Icon name="bag" size={17} /> أضيفي المحدد للسلة
          </button>
        </div>
      </div>
    </div>
  );
}
