"use client";

import Link from "next/link";
import { useState } from "react";

import { formatPrice, localizedName } from "@/lib/format";
import { productImageUrl } from "@/lib/mediaUrl";
import { productHref } from "@/lib/storePaths";
import type { Product } from "@/lib/types";

export function ProductCard({ product }: { product: Product }) {
  const img = productImageUrl(product);
  const hasDiscount = (product.discountPercent ?? 0) > 0;
  const [loaded, setLoaded] = useState(false);

  return (
    <Link href={productHref(product.slug)} className="product-card">
      <div className="product-image-wrap">
        {img ? (
          <>
            {!loaded && <div className="skeleton" style={{ position: "absolute", inset: 0, borderRadius: 0, zIndex: 0 }} aria-hidden />}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={img}
              alt={localizedName(product)}
              width={600}
              height={600}
              loading="lazy"
              decoding="async"
              className={loaded ? "loaded" : undefined}
              onLoad={() => setLoaded(true)}
              onError={() => setLoaded(true)}
            />
          </>
        ) : (
          <div className="product-placeholder" aria-hidden>
            <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round">
              <path d="M12 7c-1.8-2.1-4.9-2.4-6.6-.5-1.6 1.8-1.2 4.7.8 6.3L12 18l5.8-5.2c2-1.6 2.4-4.5.8-6.3-1.7-1.9-4.8-1.6-6.6.5Z" />
              <path d="M12 7v11" />
            </svg>
          </div>
        )}
        {hasDiscount && <span className="badge discount">-{product.discountPercent}%</span>}
        {product.isNew && <span className="badge new">جديد</span>}
      </div>
      <div className="product-body">
        {product.brand && <span className="product-brand">{localizedName(product.brand)}</span>}
        <h3 className="product-name">{localizedName(product)}</h3>
        <div className="product-price-row">
          <span className="price">{formatPrice(product.price)}</span>
          {hasDiscount && product.originalPrice ? (
            <span className="price-old">{formatPrice(product.originalPrice)}</span>
          ) : null}
        </div>
        {(product.stock ?? 0) <= 0 && <span className="out-of-stock">نفدت الكمية</span>}
      </div>
    </Link>
  );
}
