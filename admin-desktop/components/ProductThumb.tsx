"use client";

import { memo, useState } from "react";
import { productCoverUrl } from "@/lib/productCover";
import { displayProductName } from "@/lib/productName";

export const ProductThumb = memo(function ProductThumb({
  product,
  size = 44,
  className = "",
  fit = "cover",
}: {
  product?: {
    images?: Array<{ media?: unknown }>;
    name?: string;
    nameAr?: string;
    nameEn?: string;
  } | null;
  size?: number;
  className?: string;
  fit?: "cover" | "contain";
}) {
  const url = productCoverUrl(product, size >= 96 ? "medium" : "small");
  const [failed, setFailed] = useState(false);
  const initial = (displayProductName(product ?? {}).trim()?.[0] ?? "م").toUpperCase();

  return (
    <div
      className={`alhayaa-product-thumb ${className}`.trim()}
      data-fit={fit}
      style={{
        width: size,
        height: size,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        background: fit === "contain" ? "#fff" : undefined,
      }}
      aria-hidden
    >
      {url && !failed ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt=""
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
          style={
            fit === "contain"
              ? {
                  width: "auto",
                  height: "auto",
                  maxWidth: "100%",
                  maxHeight: "100%",
                  objectFit: "contain",
                }
              : undefined
          }
        />
      ) : (
        <span className="alhayaa-product-thumb-fallback">{initial}</span>
      )}
    </div>
  );
});
