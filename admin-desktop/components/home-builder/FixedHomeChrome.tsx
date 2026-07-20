"use client";

import { LockOutlined } from "@ant-design/icons";
import { Typography } from "antd";
import { mediaThumb } from "@/lib/mediaUrl";
import type { EditorEntities } from "./SectionPayloadEditor";
import { pickHeroBanners, pickHeroCategories } from "./fixed-hero";

const { Text } = Typography;

type Props = {
  entities: EditorEntities;
};

function imgUrl(obj: any): string | null {
  if (!obj) return null;
  return mediaThumb(obj.image ?? obj.logo ?? obj.coverImage ?? obj);
}

export function FixedHomeChrome({ entities }: Props) {
  const banners = pickHeroBanners(entities);
  const categories = pickHeroCategories(entities);
  const bannerUrl = banners[0] ? imgUrl(banners[0]) : null;

  return (
    <div className="hb-fixed-chrome">
      <div className="hb-fixed-chrome-badge">
        <LockOutlined /> ثابت — من صفحات البنرات والفئات
      </div>

      <div className="hb-fixed-header">
        <div className="hb-fixed-top-row">
          <span className="hb-fixed-icon">🔔</span>
          <Text className="hb-fixed-greeting">مساء الخير</Text>
          <span className="hb-fixed-icon">💬</span>
        </div>
        <div className="hb-fixed-search">
          <span>🔍</span>
          <span>ابحثي عن منتج أو براند…</span>
          <span className="hb-fixed-qr">▣</span>
        </div>
      </div>

      <div
        className="hb-fixed-banner pcs-img"
        style={{ backgroundImage: bannerUrl ? `url(${bannerUrl})` : undefined }}
      >
        {!bannerUrl && <span>بانر رئيسي</span>}
        {banners.length > 1 && (
          <div className="hb-fixed-banner-dots">
            {banners.slice(0, 4).map((_, i) => (
              <span key={i} className={i === 0 ? "active" : ""} />
            ))}
          </div>
        )}
      </div>

      <div className="hb-fixed-dock">
        {[
          { icon: "🏷️", label: "العروض" },
          { icon: "☰", label: "الفئات" },
          { icon: "🏪", label: "براندات" },
          { icon: "▣", label: "مسح" },
        ].map((item) => (
          <div key={item.label} className="hb-fixed-dock-item">
            <span className="hb-fixed-dock-icon">{item.icon}</span>
            <Text className="hb-fixed-dock-label">{item.label}</Text>
          </div>
        ))}
      </div>

      <div className="hb-fixed-trust">🚚 شحن مجاني فوق 50,000 د.ع</div>

      {categories.length > 0 && (
        <div className="hb-fixed-cats">
          {categories.slice(0, 8).map((cat: any, i) => {
            const url = imgUrl(cat);
            return (
              <div key={cat.id ?? i} className="hb-fixed-cat">
                <div
                  className="hb-fixed-cat-img pcs-img"
                  style={{
                    backgroundImage: url ? `url(${url})` : undefined,
                    backgroundColor: ["#E8EFE4", "#F5E8EC", "#F0EBE2", "#EDEAF2"][i % 4],
                  }}
                >
                  {!url && (cat.icon || cat.name?.charAt(0) || "•")}
                </div>
                <Text ellipsis className="hb-fixed-cat-label">
                  {cat.name ?? "فئة"}
                </Text>
              </div>
            );
          })}
        </div>
      )}

      <div className="hb-fixed-divider">
        <span>↓ أقسام قابلة للتحرير</span>
      </div>
    </div>
  );
}
