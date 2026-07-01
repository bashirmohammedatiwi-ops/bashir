"use client";

import { Typography, Tag } from "antd";
import { labelForType, metaForType } from "./section-types";

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
};

export function HomePhonePreview({ blocks, previewSections }: Props) {
  const sorted = [...blocks].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
  const active = sorted.filter((b) => b.isActive !== false);

  return (
    <div style={{ display: "flex", justifyContent: "center", padding: "8px 0" }}>
      <div
        style={{
          width: 280,
          height: 560,
          borderRadius: 28,
          border: "8px solid #1a1a1a",
          background: "#fff",
          overflow: "hidden",
          boxShadow: "0 12px 40px rgba(0,0,0,0.15)",
          position: "relative",
        }}
      >
        <div
          style={{
            height: 24,
            background: "#000",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div style={{ width: 80, height: 6, borderRadius: 3, background: "#333" }} />
        </div>
        <div
          style={{
            height: "calc(100% - 24px)",
            overflowY: "auto",
            padding: "0 0 12px",
          }}
        >
          {active.length === 0 ? (
            <div style={{ padding: 24, textAlign: "center" }}>
              <Text type="secondary">لا توجد أقسام نشطة</Text>
            </div>
          ) : (
            active.map((block, idx) => {
              const meta = metaForType(block.type);
              const resolved = previewSections?.find((s) => s.id === block.id);
              return (
                <PhoneSectionBlock
                  key={block.id}
                  index={idx}
                  block={block}
                  meta={meta}
                  resolved={resolved}
                />
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
    return (
      <div style={{ marginBottom: 4 }}>
        <div
          style={{
            height: 120,
            background: "linear-gradient(135deg, #E1306C, #c2185b)",
            position: "relative",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 8,
              left: 8,
              right: 8,
              height: 28,
              borderRadius: 8,
              background: "rgba(255,255,255,0.25)",
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: 36,
              background: "linear-gradient(transparent, white)",
            }}
          />
        </div>
        <div style={{ display: "flex", gap: 6, padding: "0 10px", marginTop: -18 }}>
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              style={{
                width: 44,
                height: 44,
                borderRadius: "50%",
                background: "#fff",
                border: "2px solid #eee",
                flexShrink: 0,
              }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (block.type === "PROMO_STRIP") {
    const bg = (block.payload?.backgroundColor as string) ?? color;
    const text = (block.payload?.text as string) || label;
    return (
      <div
        style={{
          margin: "6px 10px",
          padding: "8px 10px",
          borderRadius: 8,
          background: bg,
          fontSize: 10,
          fontWeight: 700,
          textAlign: "center",
        }}
      >
        {text || "شريط ترويجي"}
      </div>
    );
  }

  if (block.type === "SKIN_CONCERNS") {
    return (
      <MiniSection title={label} subtitle={block.subtitle}>
        <div style={{ display: "flex", gap: 4, padding: "0 10px 8px", overflow: "hidden" }}>
          {["حب الشباب", "تصبغات", "جفاف", "حساسية"].map((t) => (
            <span
              key={t}
              style={{
                fontSize: 8,
                padding: "4px 8px",
                borderRadius: 12,
                background: "#FCE4EC",
                color: "#E1306C",
                whiteSpace: "nowrap",
              }}
            >
              {t}
            </span>
          ))}
        </div>
      </MiniSection>
    );
  }

  if (block.type === "FLASH_SALE") {
    return (
      <MiniSection title={label} subtitle={block.subtitle} badge="⏱ 02:15:30">
        <ProductRow count={resolved?.products?.length ?? 4} accent="#FF5722" />
      </MiniSection>
    );
  }

  if (block.type === "PRODUCT_LIST" || block.type === "PACKAGES") {
    return (
      <MiniSection title={label} subtitle={block.subtitle} showViewAll>
        <ProductRow count={resolved?.products?.length ?? resolved?.packages?.length ?? 3} />
      </MiniSection>
    );
  }

  if (block.type.startsWith("BANNER")) {
    const cols = block.type === "BANNER_GRID_3" ? 3 : block.type === "BANNER_GRID_2" ? 2 : 1;
    return (
      <MiniSection title={block.type === "BANNER_FULL" ? undefined : label}>
        <div style={{ display: "flex", gap: 4, padding: "0 10px 8px" }}>
          {Array.from({ length: cols }).map((_, i) => (
            <div
              key={i}
              style={{
                flex: 1,
                height: cols === 1 ? 56 : 72,
                borderRadius: 8,
                background: color,
              }}
            />
          ))}
        </div>
      </MiniSection>
    );
  }

  if (block.type.includes("CATEGORY") || block.type === "MAKEUP_CATEGORIES") {
    return (
      <MiniSection title={label} subtitle={block.subtitle}>
        <div style={{ display: "flex", gap: 6, padding: "0 10px 8px" }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} style={{ width: 56, flexShrink: 0 }}>
              <div style={{ height: 56, borderRadius: 8, background: color }} />
              <div style={{ height: 6, marginTop: 4, borderRadius: 3, background: "#eee" }} />
            </div>
          ))}
        </div>
      </MiniSection>
    );
  }

  if (block.type.includes("BRAND")) {
    return (
      <MiniSection title={label} showViewAll>
        <div style={{ display: "flex", gap: 6, padding: "0 10px 8px" }}>
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              style={{
                width: 48,
                height: 48,
                borderRadius: 8,
                background: "#f5f5f5",
                border: "1px solid #eee",
                flexShrink: 0,
              }}
            />
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
      <div
        style={{
          display: "flex",
          alignItems: "center",
          padding: "8px 10px 4px",
          gap: 6,
        }}
      >
        <Text strong style={{ fontSize: 11, flex: 1 }}>
          {title}
        </Text>
        {badge && (
          <span style={{ fontSize: 8, color: "#E1306C", fontWeight: 700 }}>{badge}</span>
        )}
        {showViewAll && (
          <span style={{ fontSize: 8, color: "#999" }}>عرض الكل ‹</span>
        )}
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

function ProductRow({ count, accent }: { count: number; accent?: string }) {
  const n = Math.min(Math.max(count, 2), 5);
  return (
    <div style={{ display: "flex", gap: 6, padding: "0 10px 8px", overflow: "hidden" }}>
      {Array.from({ length: n }).map((_, i) => (
        <div key={i} style={{ width: 72, flexShrink: 0 }}>
          <div
            style={{
              height: 72,
              borderRadius: 8,
              background: "#f7f7f7",
              border: "1px solid #efefef",
              position: "relative",
            }}
          >
            {accent && i === 0 && (
              <span
                style={{
                  position: "absolute",
                  top: 4,
                  right: 4,
                  fontSize: 7,
                  background: accent,
                  color: "#fff",
                  padding: "1px 4px",
                  borderRadius: 4,
                }}
              >
                -30%
              </span>
            )}
          </div>
          <div style={{ height: 5, marginTop: 4, borderRadius: 2, background: "#eee" }} />
          <div style={{ height: 5, marginTop: 2, width: "60%", borderRadius: 2, background: accent ?? "#E1306C", opacity: 0.5 }} />
        </div>
      ))}
    </div>
  );
}
