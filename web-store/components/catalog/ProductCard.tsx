import Link from "next/link";

import { formatPrice, localizedName } from "@/lib/format";
import { productImageUrl } from "@/lib/mediaUrl";
import { productHref } from "@/lib/storePaths";
import type { Product } from "@/lib/types";

export function ProductCard({ product }: { product: Product }) {
  const img = productImageUrl(product);
  const hasDiscount = (product.discountPercent ?? 0) > 0;

  return (
    <Link href={productHref(product.slug)} className="product-card">
      <div className="product-image-wrap">
        {img ? (
          <img src={img} alt={localizedName(product)} loading="lazy" />
        ) : (
          <div className="product-placeholder">صورة</div>
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
