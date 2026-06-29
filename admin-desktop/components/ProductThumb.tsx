"use client";

import { memo } from "react";
import { productCoverUrl } from "@/lib/productCover";
import { displayProductName } from "@/lib/productName";

export const ProductThumb = memo(function ProductThumb({
  product,
  size = 44,
  className = "",
}: {
  product?: {
    images?: Array<{ media?: unknown }>;
    name?: string;
    nameAr?: string;
    nameEn?: string;
  } | null;
  size?: number;
  className?: string;
}) {
  const url = productCoverUrl(product);
  const initial = (displayProductName(product ?? {}).trim()?.[0] ?? "م").toUpperCase();

  return (
    <div
      className={`alhayaa-product-thumb ${className}`.trim()}
      style={{ width: size, height: size }}
      aria-hidden
    >
      {url ? (
        <img src={url} alt="" loading="lazy" decoding="async" />
      ) : (
        <span className="alhayaa-product-thumb-fallback">{initial}</span>
      )}
    </div>
  );
});
