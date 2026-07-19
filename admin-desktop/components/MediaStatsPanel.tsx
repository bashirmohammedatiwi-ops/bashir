"use client";

import { Card, Col, Row, Statistic, Typography } from "antd";
import { formatBytes } from "@/lib/formatBytes";

const { Text } = Typography;

export type MediaStats = {
  products: {
    uniqueMediaCount: number;
    productImageCount: number;
    shadeImageCount: number;
    totalImageCount: number;
    storageBytes: number;
    diskFileCount: number;
    bytesRecorded: number;
  };
  all?: {
    mediaCount: number;
    storageBytes: number;
    diskFileCount: number;
    bytesRecorded: number;
  };
};

type Props = {
  stats?: MediaStats | null;
  loading?: boolean;
  compact?: boolean;
};

export function MediaStatsPanel({ stats, loading, compact }: Props) {
  const p = stats?.products;
  if (!p && !loading) return null;

  const items = [
    {
      title: "صور مرتبطة بالمنتجات",
      value: p?.totalImageCount ?? 0,
      suffix: "صورة",
      hint: `${(p?.productImageCount ?? 0).toLocaleString("ar-IQ")} منتج + ${(p?.shadeImageCount ?? 0).toLocaleString("ar-IQ")} درجة`,
    },
    {
      title: "ملفات وسائط فريدة",
      value: p?.uniqueMediaCount ?? 0,
      suffix: "ملف",
      hint: "صور مخزّنة بغرض PRODUCT",
    },
    {
      title: "حجم التخزين (القرص)",
      value: formatBytes(p?.storageBytes ?? 0),
      hint: `${(p?.diskFileCount ?? 0).toLocaleString("ar-IQ")} ملف على القرص (يشمل المقاسات)`,
    },
    {
      title: "حجم مسجّل في القاعدة",
      value: formatBytes(p?.bytesRecorded ?? 0),
      hint: "تقدير أولي عند الرفع — أقل من الحجم الفعلي",
    },
  ];

  if (compact) {
    return (
      <div className="media-stats-compact">
        {items.slice(0, 3).map((item) => (
          <div key={item.title} className="media-stats-compact-item">
            <strong>{typeof item.value === "number" ? item.value.toLocaleString("ar-IQ") : item.value}</strong>
            <span>{item.title}</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <Card loading={loading} className="media-stats-panel" title="إحصائيات صور المنتجات">
      <Row gutter={[12, 12]}>
        {items.map((item) => (
          <Col key={item.title} xs={12} md={6}>
            <Statistic
              title={item.title}
              value={item.value}
              suffix={item.suffix}
              valueStyle={{ fontSize: 20 }}
            />
            <Text type="secondary" style={{ fontSize: 11 }}>
              {item.hint}
            </Text>
          </Col>
        ))}
      </Row>
      {stats?.all && (
        <Text type="secondary" style={{ display: "block", marginTop: 12, fontSize: 12 }}>
          إجمالي كل الوسائط: {stats.all.mediaCount.toLocaleString("ar-IQ")} ملف —{" "}
          {formatBytes(stats.all.storageBytes)} على القرص
        </Text>
      )}
    </Card>
  );
}
