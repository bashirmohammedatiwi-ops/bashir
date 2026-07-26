"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import Link from "next/link";

import { LoadingState } from "@/components/ui/LoadingState";
import { fetchProduct } from "@/lib/api";
import { formatPrice, localizedName } from "@/lib/format";
import { productGalleryUrls, productImageUrl } from "@/lib/mediaUrl";
import { brandHref, categoryHref } from "@/lib/storePaths";

export function ProductDetailView({ slug }: { slug: string }) {
  const [activeImage, setActiveImage] = useState(0);

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

  const gallery = productGalleryUrls(product);
  const mainImg = gallery[activeImage] || productImageUrl(product);

  return (
    <div className="container product-detail">
      <div className="product-detail-gallery">
        <div className="product-gallery">
          {mainImg ? (
            <img src={mainImg} alt={localizedName(product)} />
          ) : (
            <div className="product-placeholder">صورة</div>
          )}
        </div>
        {gallery.length > 1 ? (
          <div className="gallery-thumbs">
            {gallery.map((src, idx) => (
              <button
                key={src}
                type="button"
                className={idx === activeImage ? "is-active" : ""}
                onClick={() => setActiveImage(idx)}
              >
                <img src={src} alt="" />
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <div className="product-info">
        <div className="product-breadcrumb">
          {product.brand ? (
            <Link href={brandHref(product.brand.slug)}>{localizedName(product.brand)}</Link>
          ) : null}
          {product.category ? (
            <>
              {product.brand ? <span> · </span> : null}
              <Link href={categoryHref(product.category.slug)}>{localizedName(product.category)}</Link>
            </>
          ) : null}
        </div>

        <h1>{localizedName(product)}</h1>

        <div className="product-badges-row">
          {product.isNew ? <span className="pill new">جديد</span> : null}
          {(product.discountPercent ?? 0) > 0 ? (
            <span className="pill sale">-{product.discountPercent}%</span>
          ) : null}
        </div>

        <div className="price-lg">
          {formatPrice(product.price)}
          {(product.discountPercent ?? 0) > 0 && product.originalPrice ? (
            <span className="price-old">{formatPrice(product.originalPrice)}</span>
          ) : null}
        </div>

        {(product.stock ?? 0) <= 0 ? (
          <p className="out-of-stock">نفدت الكمية حالياً</p>
        ) : (
          <p className="cod-note">
            للطلب: حمّلي تطبيق ديما الحياة وأضيفي المنتج للسلة — الدفع عند الاستلام.
          </p>
        )}

        {product.descriptionAr || product.description ? (
          <div className="desc">{product.descriptionAr || product.description}</div>
        ) : null}
      </div>
    </div>
  );
}
