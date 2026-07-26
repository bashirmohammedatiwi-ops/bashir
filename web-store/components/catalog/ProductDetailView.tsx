"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

import { LoadingState } from "@/components/ui/LoadingState";
import { fetchProduct } from "@/lib/api";
import { formatPrice, localizedName } from "@/lib/format";
import { productImageUrl, resolveMediaUrl } from "@/lib/mediaUrl";
import { brandHref, categoryHref } from "@/lib/storePaths";

export function ProductDetailView({ slug }: { slug: string }) {
  const { data: product, isLoading, isError } = useQuery({
    queryKey: ["product", slug],
    queryFn: () => fetchProduct(slug),
    enabled: !!slug,
  });

  if (!slug) return <p className="empty-state container">لم يُحدَّد منتج.</p>;
  if (isLoading) return <LoadingState />;
  if (isError || !product) {
    return <p className="empty-state container">المنتج غير موجود.</p>;
  }

  const mainImg = productImageUrl(product);
  const extraImages = (product.images ?? [])
    .map((i) => resolveMediaUrl(i.media?.full || i.media?.thumb))
    .filter(Boolean);

  return (
    <div className="container product-detail">
      <div>
        <div className="product-gallery">
          {mainImg ? <img src={mainImg} alt={localizedName(product)} /> : <div className="product-placeholder">صورة</div>}
        </div>
        {extraImages.length > 1 && (
          <div className="chip-row" style={{ marginTop: 12 }}>
            {extraImages.slice(0, 6).map((src) => (
              <img key={src} src={src} alt="" style={{ width: 64, height: 64, borderRadius: 12, objectFit: "cover" }} />
            ))}
          </div>
        )}
      </div>
      <div className="product-info">
        {product.brand && (
          <p className="meta">
            <Link href={brandHref(product.brand.slug)}>{localizedName(product.brand)}</Link>
            {product.category ? (
              <>
                {" · "}
                <Link href={categoryHref(product.category.slug)}>{localizedName(product.category)}</Link>
              </>
            ) : null}
          </p>
        )}
        <h1>{localizedName(product)}</h1>
        <div className="price-lg">
          {formatPrice(product.price)}
          {(product.discountPercent ?? 0) > 0 && product.originalPrice ? (
            <span className="price-old" style={{ marginInlineStart: 10 }}>
              {formatPrice(product.originalPrice)}
            </span>
          ) : null}
        </div>
        {(product.stock ?? 0) <= 0 ? (
          <p className="out-of-stock">نفدت الكمية حالياً</p>
        ) : (
          <p className="cod-note">للطلب: حمّلي تطبيق ديما الحياة وأضيفي المنتج للسلة — الدفع عند الاستلام.</p>
        )}
        {product.descriptionAr || product.description ? (
          <div className="desc">{product.descriptionAr || product.description}</div>
        ) : null}
      </div>
    </div>
  );
}
