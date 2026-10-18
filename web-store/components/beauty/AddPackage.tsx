"use client";
import clsx from "clsx";
import { useState } from "react";
import { formatPrice } from "@/lib/format";
import { listedShades } from "@/lib/media";
import { useCart } from "@/lib/stores/cart";
import { toast, useUi } from "@/lib/stores/ui";
import type { BeautyPackage, Shade } from "@/lib/types";
import { Icon } from "../ui/Icon";

/** إضافة الباقة كاملة: اختيار التدرّج لكل منتج له تدرجات، ثم سعر الباقة يُطبَّق في السلة. */
export function AddPackage({ pack, compact }: { pack: BeautyPackage; compact?: boolean }) {
  const addPackage = useCart((s) => s.addPackage);
  const openCart = useUi((s) => s.openCart);
  const needs = pack.items.filter((it) => listedShades(it.product).length > 0);
  const [shades, setShades] = useState<Record<string, Shade | null>>({});
  const [open, setOpen] = useState(false);
  const missing = needs.filter((it) => !shades[it.product.id]);

  const add = () => {
    if (!pack.inStock) return;
    if (missing.length) return setOpen(true);
    addPackage(pack, shades);
    setOpen(false);
    toast({ text: `أُضيفت «${pack.name}» للسلة 🎁`, tone: "success" });
    openCart(true);
  };

  return (
    <>
      <button onClick={add} disabled={!pack.inStock} className={clsx("btn-primary w-full", compact ? "h-11 text-sm" : "text-base")}>
        <Icon name="bag" size={19} />
        {pack.inStock ? `أضيفي ${pack.isRoutine ? "الروتين" : "الباقة"} • ${formatPrice(pack.price)}` : "غير متوفرة حالياً"}
      </button>
      {open && (
        <div className="fixed inset-0 z-[80] flex items-end justify-center bg-night/40 md:items-center md:p-4" onClick={() => setOpen(false)}>
          <div className="max-h-[88vh] w-full max-w-lg overflow-y-auto rounded-t-[32px] bg-surface p-6 animate-fade-up md:rounded-[32px]" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-extrabold">اختاري التدرّجات</h3>
            <p className="text-sm text-ink-muted">بعض منتجات الباقة لها ألوان — اختاري المناسب لكِ</p>
            <div className="mt-4 space-y-5">
              {needs.map((it) => {
                const list = listedShades(it.product).filter((s) => s.stock > 0);
                const cur = shades[it.product.id];
                return (
                  <div key={it.id}>
                    <p className="mb-2 text-sm font-bold">
                      {it.stepTitle ? `${it.stepTitle} — ` : ""}
                      {it.product.nameAr || it.product.name}
                      {cur && <span className="ms-2 font-normal text-accent-dark">{cur.name}</span>}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {list.map((s) => (
                        <button
                          key={s.id}
                          onClick={() => setShades((x) => ({ ...x, [it.product.id]: s }))}
                          title={s.name}
                          className={clsx("h-10 w-10 rounded-full ring-offset-2 transition", cur?.id === s.id ? "ring-2 ring-accent-dark" : "ring-1 ring-hairline hover:ring-accent")}
                          style={{ background: s.colorHexEnd ? `linear-gradient(135deg, ${s.colorHex}, ${s.colorHexEnd})` : s.colorHex }}
                          aria-label={s.name}
                        />
                      ))}
                      {!list.length && <span className="text-sm text-sale">التدرجات نفدت</span>}
                    </div>
                  </div>
                );
              })}
            </div>
            <button onClick={add} disabled={missing.length > 0} className="btn-primary mt-6 w-full">
              {missing.length ? `اختاري ${missing.length} تدرّج متبقٍ` : `أضيفي للسلة • ${formatPrice(pack.price)}`}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
