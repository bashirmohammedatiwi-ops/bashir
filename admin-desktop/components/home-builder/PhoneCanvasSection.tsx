"use client";

import { Typography } from "antd";
import { useEffect, useState } from "react";
import { labelForType } from "./section-types";
import { formatCountdown } from "./preview-resolver";
import { mediaThumb } from "@/lib/mediaUrl";

const { Text } = Typography;

function imgUrl(obj: any): string | null {
  if (!obj) return null;
  return mediaThumb(obj.image ?? obj.logo ?? obj.coverImage ?? obj);
}

function productCover(p: any): string | null {
  const imgs = p?.images;
  if (Array.isArray(imgs) && imgs[0]?.media) return mediaThumb(imgs[0].media);
  return null;
}

function fmtPrice(n?: number) {
  if (n == null) return "";
  return `${n.toLocaleString("ar-IQ")} د.ع`;
}

function useCountdown(endsAt?: string | null) {
  const [display, setDisplay] = useState<string | undefined>(() => formatCountdown(endsAt));
  useEffect(() => {
    if (!endsAt) {
      setDisplay(undefined);
      return;
    }
    const tick = () => setDisplay(formatCountdown(endsAt));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [endsAt]);
  return display;
}

type Props = {
  block: { type: string; title?: string; subtitle?: string; payload?: Record<string, unknown> };
  resolved?: any;
  meta?: { color?: string; icon?: string };
};

export function PhoneCanvasSection({ block, resolved, meta }: Props) {
  const color = meta?.color ?? "#f5f5f5";
  const title = block.title || labelForType(block.type);

  switch (block.type) {
    case "HERO_BANNER":
      return <HeroSection resolved={resolved} />;
    case "PROMO_STRIP":
      return <PromoStrip block={block} title={title} />;
    case "FLASH_SALE":
      return (
        <FlashSaleSection
          title={title}
          products={resolved?.products}
          endsAt={(resolved?.endsAt ?? block.payload?.endsAt) as string | undefined}
        />
      );
    case "PRODUCT_LIST":
      return <ProductRowSection title={title} subtitle={block.subtitle} products={resolved?.products} />;
    case "PACKAGES":
      return <ProductRowSection title={title} products={resolved?.packages} isPackage />;
    case "FEATURED_BRANDS":
    case "BRAND_SHOWCASE":
      return <BrandsSection title={title} brands={resolved?.brands} cards={block.type === "BRAND_SHOWCASE"} />;
    case "CATEGORY_GRID":
    case "CATEGORY_TILES":
    case "MAKEUP_CATEGORIES":
      return <CategoriesSection title={title} categories={resolved?.categories} makeup={block.type === "MAKEUP_CATEGORIES"} tiles={block.type === "CATEGORY_TILES"} />;
    case "SKIN_CONCERNS":
      return <SkinConcernsSection title={title} concerns={resolved?.skinConcerns} />;
    case "IMAGE_TILES":
      return <ImageTilesSection title={title} items={resolved?.items} columns={(block.payload?.columns as number) ?? 2} />;
    case "BANNER_FULL":
    case "CUSTOM_BANNER":
      return <BannerFull banners={resolved?.banners} />;
    case "BANNER_GRID_2":
      return <BannerGrid banners={resolved?.banners ?? resolved?.items} cols={2} />;
    case "BANNER_GRID_3":
      return <BannerGrid banners={resolved?.banners ?? resolved?.items} cols={3} />;
    case "BANNER_CAROUSEL":
      return <BannerCarousel banners={resolved?.banners} />;
    default:
      return (
        <div className="pcs-fallback" style={{ background: color }}>
          {labelForType(block.type)}
        </div>
      );
  }
}

function HeroSection({ resolved }: { resolved?: any }) {
  const bannerUrl = imgUrl(resolved?.banners?.[0]);
  const cats = resolved?.categories ?? [];
  return (
    <div className="pcs-hero">
      <div
        className="pcs-hero-banner pcs-img"
        style={{ backgroundImage: bannerUrl ? `url(${bannerUrl})` : undefined }}
      />
      <div className="pcs-hero-fade" />
      <div className="pcs-hero-cats">
        {(cats.length ? cats : Array(5).fill(null)).slice(0, 6).map((c: any, i: number) => {
          const url = c ? imgUrl(c) : null;
          return (
            <div key={i} className="pcs-hero-cat">
              <div className="pcs-hero-cat-circle pcs-img" style={{ backgroundImage: url ? `url(${url})` : undefined }}>
                {!url && c?.icon && <span>{c.icon}</span>}
              </div>
              {c?.name && <Text className="pcs-hero-cat-label" ellipsis>{c.name}</Text>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PromoStrip({ block, title }: { block: Props["block"]; title: string }) {
  const bg = (block.payload?.backgroundColor as string) ?? "#FCE4EC";
  const text = (block.payload?.text as string) || title;
  return <div className="pcs-promo" style={{ background: bg }}>{text || "شريط ترويجي"}</div>;
}

function FlashSaleSection({
  title,
  products,
  endsAt,
}: {
  title: string;
  products?: any[];
  endsAt?: string;
}) {
  const timer = useCountdown(endsAt);
  return (
    <ProductRowSection title={title} products={products} accent="#E1306C" timer={timer} />
  );
}

function SectionHead({ title, subtitle, timer, action = "عرض الكل ‹" }: { title: string; subtitle?: string; timer?: string; action?: string }) {
  return (
    <div className="pcs-head">
      <div className="pcs-head-right">
        <Text strong className="pcs-head-title">{title}</Text>
        {subtitle && <Text type="secondary" className="pcs-head-sub">{subtitle}</Text>}
      </div>
      <div className="pcs-head-left">
        {timer && <span className="pcs-timer">⏱ {timer}</span>}
        <span className="pcs-view-all">{action}</span>
      </div>
    </div>
  );
}

function ProductRowSection({
  title,
  subtitle,
  products,
  accent,
  timer,
  isPackage,
}: {
  title: string;
  subtitle?: string;
  products?: any[];
  accent?: string;
  timer?: string;
  endsAt?: unknown;
  isPackage?: boolean;
}) {
  const list = products?.length ? products : [null, null, null];
  return (
    <div className="pcs-products">
      <SectionHead title={title} subtitle={subtitle} timer={timer} />
      <div className="pcs-product-row">
        {list.slice(0, 4).map((p, i) => {
          const url = isPackage ? imgUrl(p?.coverImage ?? p) : productCover(p);
          const discount = p?.discountPercent;
          return (
            <div key={i} className="pcs-product-card">
              <div className="pcs-product-img-wrap">
                <div className="pcs-product-img pcs-img" style={{ backgroundImage: url ? `url(${url})` : undefined }} />
                {discount > 0 && <span className="pcs-discount" style={{ background: accent ?? "#E1306C" }}>-{discount}%</span>}
                <span className="pcs-add-btn">+</span>
              </div>
              {p?.name && <Text className="pcs-product-name" ellipsis>{p.name}</Text>}
              {p?.price != null && <Text className="pcs-product-price" style={{ color: accent ?? "#E1306C" }}>{fmtPrice(p.price)}</Text>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function BrandsSection({ title, brands, cards }: { title: string; brands?: any[]; cards?: boolean }) {
  const list = brands?.length ? brands : Array(5).fill(null);
  return (
    <div className="pcs-brands">
      <SectionHead title={title} />
      <div className={`pcs-brand-row${cards ? " cards" : ""}`}>
        {list.slice(0, 6).map((b, i) => {
          const url = b ? imgUrl(b) : null;
          return (
            <div key={i} className={`pcs-brand${cards ? " card" : ""}`}>
              <div className="pcs-brand-logo pcs-img" style={{ backgroundImage: url ? `url(${url})` : undefined }} />
              {cards && b?.name && <Text ellipsis className="pcs-brand-name">{b.name}</Text>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CategoriesSection({
  title,
  categories,
  makeup,
  tiles,
}: {
  title: string;
  categories?: any[];
  makeup?: boolean;
  tiles?: boolean;
}) {
  const list = categories?.length ? categories : Array(4).fill(null);
  return (
    <div className="pcs-categories">
      {title && <SectionHead title={title} action="" />}
      <div className={`pcs-cat-row${tiles ? " tiles" : makeup ? " makeup" : " circles"}`}>
        {list.slice(0, tiles ? 4 : 6).map((c, i) => {
          const url = c ? imgUrl(c) : null;
          return (
            <div key={i} className="pcs-cat-item">
              <div
                className={`pcs-cat-img pcs-img${makeup ? " makeup" : tiles ? " tile" : " circle"}`}
                style={{ backgroundImage: url ? `url(${url})` : undefined, backgroundColor: makeup ? "#FCE4EC" : undefined }}
              >
                {!url && c?.icon && <span>{c.icon}</span>}
              </div>
              {c?.name && <Text ellipsis className="pcs-cat-label">{c.name}</Text>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SkinConcernsSection({ title, concerns }: { title: string; concerns?: any[] }) {
  const list = concerns?.length ? concerns : [{ name: "حب الشباب", icon: "🔴" }, { name: "تصبغات", icon: "🟤" }];
  return (
    <div className="pcs-skin">
      <SectionHead title={title || "تسوّق حسب مشكلتك"} action="" />
      <div className="pcs-skin-chips">
        {list.slice(0, 6).map((c, i) => (
          <span key={i} className="pcs-skin-chip">{c.icon ?? "✨"} {c.name}</span>
        ))}
      </div>
    </div>
  );
}

function ImageTilesSection({ title, items, columns }: { title: string; items?: any[]; columns: number }) {
  const list = items?.length ? items : [null, null];
  return (
    <div className="pcs-image-tiles">
      {title && <SectionHead title={title} action="" />}
      <div className="pcs-tiles-grid" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
        {list.map((item, i) => (
          <div key={i} className="pcs-tile">
            <div className="pcs-tile-img pcs-img" style={{ backgroundImage: item?.imageUrl ? `url(${item.imageUrl})` : undefined }} />
            {item?.title && <Text ellipsis className="pcs-tile-title">{item.title}</Text>}
          </div>
        ))}
      </div>
    </div>
  );
}

function BannerFull({ banners }: { banners?: any[] }) {
  const url = imgUrl(banners?.[0]);
  return <div className="pcs-banner-full pcs-img" style={{ backgroundImage: url ? `url(${url})` : undefined }} />;
}

function BannerGrid({ banners, cols }: { banners?: any[]; cols: number }) {
  return (
    <div className="pcs-banner-grid" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
      {Array.from({ length: cols }).map((_, i) => {
        const url = imgUrl(banners?.[i]);
        return <div key={i} className="pcs-banner-grid-item pcs-img" style={{ backgroundImage: url ? `url(${url})` : undefined }} />;
      })}
    </div>
  );
}

function BannerCarousel({ banners }: { banners?: any[] }) {
  const url = imgUrl(banners?.[0]);
  return (
    <div className="pcs-banner-carousel">
      <div className="pcs-banner-carousel-slide pcs-img" style={{ backgroundImage: url ? `url(${url})` : undefined }} />
      {(banners?.length ?? 0) > 1 && (
        <div className="pcs-dots">
          {banners!.slice(0, 4).map((_, i) => (
            <span key={i} className={i === 0 ? "active" : ""} />
          ))}
        </div>
      )}
    </div>
  );
}
