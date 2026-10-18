"use client";
import { useMemo, useState } from "react";
import type { Media, Product, Shade } from "@/lib/types";
import { BuyPanel } from "./BuyPanel";
import { Gallery } from "./Gallery";

/** المعرض + لوحة الشراء: اختيار لون له صورة يعرضها في المعرض. */
export function ProductView({ product }: { product: Product }) {
  const [shade, setShade] = useState<Shade | null>(null);
  const images = useMemo(() => {
    const base = [...product.images].sort((a, b) => a.position - b.position).map((i) => i.media).filter(Boolean) as Media[];
    const shadeImgs = product.shades.map((s) => s.image).filter(Boolean) as Media[];
    const seen = new Set(base.map((m) => m.id));
    return [...base, ...shadeImgs.filter((m) => !seen.has(m.id))];
  }, [product]);
  return (
    <div className="grid gap-6 md:gap-10 lg:grid-cols-[1.05fr_1fr]">
      <Gallery images={images} alt={product.nameAr || product.name} discount={product.discountPercent} focusMedia={shade?.image ?? null} />
      <BuyPanel product={product} onShade={setShade} />
    </div>
  );
}
