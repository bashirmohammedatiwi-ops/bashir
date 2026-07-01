"use client";

import { Button, Card, Empty, Popconfirm, Space, Spin, Switch, Tag, Typography } from "antd";
import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  CopyOutlined,
  EditOutlined,
  HolderOutlined,
} from "@ant-design/icons";
import { useCallback, useState } from "react";
import { labelForType, metaForType } from "./section-types";
import { mediaThumb } from "@/lib/mediaUrl";

const { Text } = Typography;

export type HomeBlockRow = {
  id: string;
  type: string;
  title?: string;
  subtitle?: string;
  isActive?: boolean;
  position?: number;
  payload?: Record<string, unknown>;
};

type Props = {
  blocks: HomeBlockRow[];
  previewSections?: any[];
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  onEdit: (block: HomeBlockRow) => void;
  onDuplicate: (block: HomeBlockRow) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string, active: boolean) => void;
  onReorder: (ids: string[]) => void;
  loading?: boolean;
};

function sectionThumb(block: HomeBlockRow, resolved?: any): string | null {
  if (!resolved) return null;
  if (block.type === "HERO_BANNER" || block.type.startsWith("BANNER")) {
    const b = resolved.banners?.[0] ?? resolved.items?.[0];
    return mediaThumb(b?.image ?? b);
  }
  if (block.type.includes("CATEGORY") || block.type === "MAKEUP_CATEGORIES") {
    return mediaThumb(resolved.categories?.[0]?.image);
  }
  if (block.type.includes("BRAND")) {
    return mediaThumb(resolved.brands?.[0]?.logo);
  }
  if (block.type === "PRODUCT_LIST" || block.type === "FLASH_SALE") {
    return mediaThumb(resolved.products?.[0]?.images?.[0]?.media);
  }
  if (block.type === "IMAGE_TILES") {
    const url = resolved.items?.[0]?.imageUrl;
    return url ?? null;
  }
  return null;
}

function contentSummary(block: HomeBlockRow, resolved?: any): string {
  if (!resolved) return metaForType(block.type)?.description?.slice(0, 40) ?? "";
  if (resolved.products?.length) return `${resolved.products.length} منتج`;
  if (resolved.categories?.length) return `${resolved.categories.length} فئة`;
  if (resolved.brands?.length) return `${resolved.brands.length} براند`;
  if (resolved.banners?.length) return `${resolved.banners.length} بنر`;
  if (resolved.items?.length) return `${resolved.items.length} بطاقة`;
  if (resolved.packages?.length) return `${resolved.packages.length} باقة`;
  if (resolved.skinConcerns?.length) return `${resolved.skinConcerns.length} concern`;
  if (block.payload?.text) return String(block.payload.text).slice(0, 50);
  return "—";
}

export function HomeSectionList({
  blocks,
  previewSections,
  selectedId,
  onSelect,
  onEdit,
  onDuplicate,
  onDelete,
  onToggle,
  onReorder,
  loading,
}: Props) {
  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  const move = useCallback(
    (id: string, dir: -1 | 1) => {
      const idx = blocks.findIndex((b) => b.id === id);
      const next = idx + dir;
      if (next < 0 || next >= blocks.length) return;
      const ids = blocks.map((b) => b.id);
      [ids[idx], ids[next]] = [ids[next], ids[idx]];
      onReorder(ids);
    },
    [blocks, onReorder],
  );

  const onDrop = useCallback(
    (targetId: string) => {
      if (!dragId || dragId === targetId) {
        setDragId(null);
        setOverId(null);
        return;
      }
      const ids = blocks.map((b) => b.id);
      const from = ids.indexOf(dragId);
      const to = ids.indexOf(targetId);
      if (from < 0 || to < 0) return;
      ids.splice(from, 1);
      ids.splice(to, 0, dragId);
      onReorder(ids);
      setDragId(null);
      setOverId(null);
    },
    [blocks, dragId, onReorder],
  );

  if (loading) return <Spin style={{ display: "block", margin: "40px auto" }} />;

  if (blocks.length === 0) {
    return <Empty description="لا توجد أقسام — ابدأ من لوحة «إضافة قسم»" />;
  }

  return (
    <Space direction="vertical" style={{ width: "100%" }} size={6}>
      {blocks.map((block, idx) => {
        const meta = metaForType(block.type);
        const resolved = previewSections?.find((s) => s.id === block.id);
        const thumb = sectionThumb(block, resolved);
        const isOver = overId === block.id && dragId !== block.id;
        const selected = selectedId === block.id;

        return (
          <Card
            key={block.id}
            size="small"
            className={`hb-section-card${selected ? " selected" : ""}`}
            draggable
            onClick={() => onSelect?.(block.id)}
            onDragStart={(e) => {
              e.stopPropagation();
              setDragId(block.id);
            }}
            onDragEnd={() => {
              setDragId(null);
              setOverId(null);
            }}
            onDragOver={(e) => {
              e.preventDefault();
              setOverId(block.id);
            }}
            onDrop={(e) => {
              e.preventDefault();
              onDrop(block.id);
            }}
            styles={{
              body: {
                padding: "10px 12px",
                opacity: block.isActive === false ? 0.55 : 1,
                borderTop: isOver ? "2px solid #E1306C" : undefined,
                cursor: "grab",
              },
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <HolderOutlined style={{ color: "#bbb" }} />
              <div
                className="hb-section-thumb hb-preview-img"
                style={{
                  background: thumb ? `center/cover url(${thumb})` : meta?.color ?? "#f5f5f5",
                }}
              />
              <div className="hb-section-meta">
                <Space size={4}>
                  <Tag color="blue">{idx + 1}</Tag>
                  <Text strong>{block.title || labelForType(block.type)}</Text>
                </Space>
                <br />
                <Text type="secondary" style={{ fontSize: 11 }}>
                  {meta?.icon} {labelForType(block.type)} · {contentSummary(block, resolved)}
                </Text>
              </div>
              <Switch
                size="small"
                checked={block.isActive !== false}
                onClick={(_, e) => e.stopPropagation()}
                onChange={(v) => onToggle(block.id, v)}
              />
              <Button size="small" icon={<ArrowUpOutlined />} disabled={idx === 0} onClick={(e) => { e.stopPropagation(); move(block.id, -1); }} />
              <Button size="small" icon={<ArrowDownOutlined />} disabled={idx === blocks.length - 1} onClick={(e) => { e.stopPropagation(); move(block.id, 1); }} />
              <Button size="small" type="primary" ghost icon={<EditOutlined />} onClick={(e) => { e.stopPropagation(); onEdit(block); }} />
              <Button size="small" icon={<CopyOutlined />} onClick={(e) => { e.stopPropagation(); onDuplicate(block); }} />
              <Popconfirm title="حذف القسم؟" onConfirm={() => onDelete(block.id)}>
                <Button size="small" danger onClick={(e) => e.stopPropagation()}>
                  حذف
                </Button>
              </Popconfirm>
            </div>
          </Card>
        );
      })}
    </Space>
  );
}
