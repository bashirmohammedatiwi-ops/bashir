import Link from "next/link";

import { sectionLinkHref } from "@/lib/links";
import { formatPrice } from "@/lib/format";
import { imageFromUnknown } from "@/lib/mediaUrl";
import { packageHref } from "@/lib/storePaths";
import type { StorePackage } from "@/lib/types";

export function PackageCard({ pack }: { pack: StorePackage }) {
  const img = imageFromUnknown(pack.coverImage);
  const href = sectionLinkHref(pack) ?? packageHref(pack.slug || pack.id);
  const hasDiscount = (pack.originalPrice ?? 0) > pack.price;

  return (
    <Link href={href} className="package-card">
      <div className="package-card-media">
        {img ? <img src={img} alt={pack.name} loading="lazy" /> : <div className="banner-fallback" />}
      </div>
      <div className="package-card-body">
        <h3>{pack.name}</h3>
        <div className="product-price-row">
          <span className="price">{formatPrice(pack.price)}</span>
          {hasDiscount && pack.originalPrice ? (
            <span className="price-old">{formatPrice(pack.originalPrice)}</span>
          ) : null}
        </div>
      </div>
    </Link>
  );
}

export function PackageCarousel({ packages }: { packages: StorePackage[] }) {
  if (!packages.length) return null;
  return (
    <div className="package-carousel">
      {packages.map((pack) => (
        <div key={pack.id} className="package-carousel-item">
          <PackageCard pack={pack} />
        </div>
      ))}
    </div>
  );
}
