"use client";

import { Empty, Spin, Tag, Typography } from "antd";
import { labelForType, metaForType } from "./section-types";
import { mediaThumb } from "@/lib/mediaUrl";

const { Text } = Typography;

type Block = {
  id: string;
  type: string;
  title?: string;
  subtitle?: string;
  isActive?: boolean;
  position?: number;
  payload?: Record<string, unknown>;
};

type Props = {
  blocks: Block[];
  previewSections?: any[];
  selectedId?: string | null;
  onSelectSection?: (id: string) => void;
};

function imgUrl(obj: any): string | null {
  if (!obj) return null;
  return mediaThumb(obj.image ?? obj.logo ?? obj.coverImage ?? obj);
}

function productCover(p: any): string | null {
  const imgs = p?.images;
  if (Array.isArray(imgs) && imgs[0]?.media) return mediaThumb(imgs[0].media);
  return null;
}

export function HomePhonePreview({ blocks, previewSections, selectedId, onSelectSection }: Props) {
  const sorted = [...blocks].sort((a, b) => {
    const heroA = a.type === "HERO_BANNER";
    const heroB = b.type === "HERO_BANNER";
    if (heroA && !heroB) return -1;
    if (!heroA && heroB) return 1;
    return (a.position ?? 0) - (b.position ?? 0);
  });
  const active = sorted.filter((b) => b.isActive !== false);

  return (
    <div className="hb-phone-wrap">
      <div className="hb-phone">
        <div className="hb-phone-notch">
          <div className="hb-phone-notch-bar" />
        </div>
        <div className="hb-phone-scroll">
          {active.length === 0 ? (
            <Empty description="لا أقسام نشطة" style={{ marginTop: 80 }} />
          ) : (
            active.map((block, idx) => {
              const meta = metaForType(block.type);
              const resolved = previewSections?.find((s) => s.id === block.id);
              const selected = selectedId === block.id;
              return (
                <div
                  key={block.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => onSelectSection?.(block.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") onSelectSection?.(block.id);
                  }}
                  style={{
                    outline: selected ? "2px solid #E1306C" : "none",
                    outlineOffset: -2,
                    cursor: onSelectSection ? "pointer" : "default",
                  }}
                >
                  <PhoneSectionBlock index={idx} block={block} meta={meta} resolved={resolved} />
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

function PhoneSectionBlock({
  index,
  block,
  meta,
  resolved,
}: {
  index: number;
  block: Block;
  meta?: (typeof import("./section-types").SECTION_TYPES)[0];
  resolved?: any;
}) {
  const color = meta?.color ?? "#f5f5f5";
  const label = block.title || labelForType(block.type);

  if (block.type === "HERO_BANNER") {
    const bannerUrl = imgUrl(resolved?.banners?.[0]);
    const cats = resolved?.categories ?? [];
    return (
      <div style={{ marginBottom: 4 }}>
        <div
          className="hb-preview-img"
          style={{
            height: 120,
            background: bannerUrl
              ? `center/cover url(${bannerUrl})`
              : "linear-gradient(135deg, #E1306C, #c2185b)",
          }}
        />
        <div style={{ display: "flex", gap: 6, padding: "0 10px", marginTop: -18, overflow: "hidden" }}>
          {(cats.length ? cats : [1, 2, 3, 4, 5]).slice(0, 5).map((c: any, i: number) => {
            const url = typeof c === "object" ? imgUrl(c) : null;
            return (
              <div
                key={i}
                className="hb-preview-img"
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: "50%",
                  background: url ? `center/cover url(${url})` : "#fff",
                  border: "2px solid #eee",
                  flexShrink: 0,
                }}
              />
            );
          })}
        </div>
      </div>
    );
  }

  if (block.type === "PROMO_STRIP") {
    const bg = (block.payload?.backgroundColor as string) ?? color;
    const text = (block.payload?.text as string) || label;
    return (
      <div style={{ margin: "6px 10px", padding: "8px 10px", borderRadius: 8, background: bg, fontSize: 10, fontWeight: 700, textAlign: "center" }}>
        {text || "شريط ترويجي"}
      </div>
    );
  }

  if (block.type === "IMAGE_TILES") {
    const items = resolved?.items ?? [];
    const cols = (block.payload?.columns as number) ?? 2;
    return (
      <MiniSection title={label} subtitle={block.subtitle}>
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 4, padding: "0 10px 8px" }}>
          {(items.length ? items : [1, 2]).map((item: any, i: number) => (
            <div key={i} style={{ borderRadius: 8, overflow: "hidden" }}>
              <div
                className="hb-preview-img"
                style={{
                  height: cols === 3 ? 56 : 72,
                  background: item.imageUrl
                    ? `center/cover url(${item.imageUrl})`
                    : color,
                }}
              />
              {item.title && (
                <Text style={{ fontSize: 8, display: "block", padding: "2px 4px" }} ellipsis>
                  {item.title}
                </Text>
              )}
            </div>
          ))}
        </div>
      </MiniSection>
    );
  }

  if (block.type === "FLASH_SALE") {
    return (
      <MiniSection title={label} subtitle={block.subtitle} badge="⏱">
        <ProductRow products={resolved?.products} accent="#FF5722" />
      </MiniSection>
    );
  }

  if (block.type === "PRODUCT_LIST" || block.type === "PACKAGES") {
    const list = resolved?.products ?? resolved?.packages;
    return (
      <MiniSection title={label} subtitle={block.subtitle} showViewAll>
        <ProductRow products={list} isPackage={block.type === "PACKAGES"} />
      </MiniSection>
    );
  }

  if (block.type.startsWith("BANNER")) {
    const banners = resolved?.banners ?? resolved?.items ?? [];
    const cols = block.type === "BANNER_GRID_3" ? 3 : block.type === "BANNER_GRID_2" ? 2 : 1;
    return (
      <MiniSection title={block.type === "BANNER_FULL" ? undefined : label}>
        <div style={{ display: "flex", gap: 4, padding: "0 10px 8px" }}>
          {Array.from({ length: cols }).map((_, i) => {
            const url = imgUrl(banners[i]);
            return (
              <div
                key={i}
                className="hb-preview-img"
                style={{ flex: 1, height: cols === 1 ? 56 : 72, borderRadius: 8, background: url ? `center/cover url(${url})` : color }}
              />
            );
          })}
        </div>
      </MiniSection>
    );
  }

  if (block.type.includes("CATEGORY") || block.type === "MAKEUP_CATEGORIES") {
    const cats = resolved?.categories ?? [];
    return (
      <MiniSection title={label} subtitle={block.subtitle}>
        <div style={{ display: "flex", gap: 6, padding: "0 10px 8px" }}>
          {(cats.length ? cats : [1, 2, 3, 4]).slice(0, 4).map((c: any, i: number) => {
            const url = typeof c === "object" ? imgUrl(c) : null;
            return (
              <div key={i} style={{ width: 56, flexShrink: 0 }}>
                <div className="hb-preview-img" style={{ height: 56, borderRadius: 8, background: url ? `center/cover url(${url})` : color }} />
                {typeof c === "object" && c.name && (
                  <Text style={{ fontSize: 7, display: "block", marginTop: 2 }} ellipsis>
                    {c.name}
                  </Text>
                )}
              </div>
            );
          })}
        </div>
      </MiniSection>
    );
  }

  if (block.type.includes("BRAND")) {
    const brands = resolved?.brands ?? [];
    return (
      <MiniSection title={label} showViewAll>
        <div style={{ display: "flex", gap: 6, padding: "0 10px 8px" }}>
          {(brands.length ? brands : [1, 2, 3, 4]).slice(0, 5).map((b: any, i: number) => {
            const url = typeof b === "object" ? imgUrl(b) : null;
            return (
              <div
                key={i}
                className="hb-preview-img"
                style={{ width: 48, height: 48, borderRadius: 8, background: url ? `center/cover url(${url})` : "#f5f5f5", border: "1px solid #eee", flexShrink: 0 }}
              />
            );
          })}
        </div>
      </MiniSection>
    );
  }

  if (block.type === "SKIN_CONCERNS") {
    const concerns = resolved?.skinConcerns ?? [];
    return (
      <MiniSection title={label}>
        <div style={{ display: "flex", gap: 4, padding: "0 10px 8px", overflow: "hidden" }}>
          {(concerns.length ? concerns : [{ name: "حب الشباب" }, { name: "تصبغات" }]).slice(0, 4).map((c: any, i: number) => (
            <span key={i} style={{ fontSize: 8, padding: "4px 8px", borderRadius: 12, background: "#FCE4EC", color: "#E1306C", whiteSpace: "nowrap" }}>
              {c.icon ?? "✨"} {c.name}
            </span>
          ))}
        </div>
      </MiniSection>
    );
  }

  return (
    <div style={{ margin: "4px 10px", padding: 8, borderRadius: 8, background: color }}>
      <Tag style={{ fontSize: 9 }}>{index + 1}</Tag> {labelForType(block.type)}
    </div>
  );
}

function MiniSection({
  title,
  subtitle,
  badge,
  showViewAll,
  children,
}: {
  title?: string;
  subtitle?: string;
  badge?: string;
  showViewAll?: boolean;
  children: React.ReactNode;
}) {
  if (!title) return <>{children}</>;
  return (
    <div style={{ marginBottom: 4 }}>
      <div style={{ display: "flex", alignItems: "center", padding: "8px 10px 4px", gap: 6 }}>
        <Text strong style={{ fontSize: 11, flex: 1 }}>
          {title}
        </Text>
        {badge && <span style={{ fontSize: 8, color: "#E1306C", fontWeight: 700 }}>{badge}</span>}
        {showViewAll && <span style={{ fontSize: 8, color: "#999" }}>عرض الكل ‹</span>}
      </div>
      {subtitle && (
        <Text type="secondary" style={{ fontSize: 9, padding: "0 10px", display: "block" }}>
          {subtitle}
        </Text>
      )}
      {children}
    </div>
  );
}

function ProductRow({
  products,
  accent,
  isPackage,
}: {
  products?: any[];
  accent?: string;
  isPackage?: boolean;
}) {
  const list = products?.length ? products : [null, null, null];
  const n = Math.min(list.length, 4);
  return (
    <div style={{ display: "flex", gap: 6, padding: "0 10px 8px", overflow: "hidden" }}>
      {list.slice(0, n).map((p, i) => {
        const url = isPackage ? imgUrl(p?.coverImage ?? p) : productCover(p);
        return (
          <div key={i} className="hb-preview-product">
            <div
              className="hb-preview-img hb-preview-product-img"
              style={{ background: url ? `center/cover url(${url})` : "#f7f7f7" }}
            />
            {p?.name && (
              <Text style={{ fontSize: 7, display: "block", marginTop: 2 }} ellipsis>
                {p.name}
              </Text>
            )}
          </div>
        );
      })}
    </div>
  );
}
