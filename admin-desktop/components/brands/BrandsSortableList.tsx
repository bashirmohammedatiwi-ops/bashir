"use client";

import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  DeleteOutlined,
  EditOutlined,
  HolderOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import { Avatar, Button, Collapse, Empty, Popconfirm, Space, Spin, Switch, Tag, Typography } from "antd";
import { useCallback, useState } from "react";
import { mediaThumb, type MediaRecord } from "@/lib/mediaUrl";

const { Text } = Typography;

export type BrandRow = {
  id: string;
  name: string;
  slug?: string;
  initial?: string;
  bgColorHex?: string;
  logoId?: string | null;
  logo?: MediaRecord | null;
  productCount?: number;
  isFeatured?: boolean;
  isActive?: boolean;
  position?: number;
  collections?: Array<{
    id: string;
    name: string;
    slug?: string;
    position?: number;
    isActive?: boolean;
    description?: string;
  }>;
};

type Props = {
  brands: BrandRow[];
  loading?: boolean;
  reordering?: boolean;
  partialOrder?: boolean;
  productCountLabel?: string;
  onReorder: (ids: string[]) => void;
  onEdit: (brand: BrandRow) => void;
  onDelete: (brand: BrandRow) => void;
  onAddCollection: (brand: BrandRow) => void;
  onEditCollection: (brand: BrandRow, collection: BrandRow["collections"][number]) => void;
  onDeleteCollection: (collectionId: string) => void;
};

export function BrandsSortableList({
  brands,
  loading,
  reordering,
  partialOrder,
  productCountLabel = "منتج",
  onReorder,
  onEdit,
  onDelete,
  onAddCollection,
  onEditCollection,
  onDeleteCollection,
}: Props) {
  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  const move = useCallback(
    (id: string, dir: -1 | 1) => {
      const idx = brands.findIndex((b) => b.id === id);
      const next = idx + dir;
      if (next < 0 || next >= brands.length) return;
      const ids = brands.map((b) => b.id);
      [ids[idx], ids[next]] = [ids[next], ids[idx]];
      onReorder(ids);
    },
    [brands, onReorder],
  );

  const onDrop = useCallback(
    (targetId: string) => {
      if (!dragId || dragId === targetId) {
        setDragId(null);
        setOverId(null);
        return;
      }
      const ids = brands.map((b) => b.id);
      const from = ids.indexOf(dragId);
      const to = ids.indexOf(targetId);
      if (from < 0 || to < 0) return;
      ids.splice(from, 1);
      ids.splice(to, 0, dragId);
      onReorder(ids);
      setDragId(null);
      setOverId(null);
    },
    [brands, dragId, onReorder],
  );

  if (loading) {
    return (
      <div className="bp-list-loading">
        <Spin size="large" />
      </div>
    );
  }

  if (!brands.length) {
    return <Empty description="لا توجد براندات مطابقة للفلاتر" />;
  }

  return (
    <div className={`bp-sortable-list${reordering ? " is-saving" : ""}`}>
      {partialOrder ? (
        <p className="bp-partial-hint">
          السحب يعيد ترتيب البراندات الظاهرة فقط ضمن ترتيب التطبيق العام — البراندات المخفية بالفلاتر تبقى في
          مواقعها.
        </p>
      ) : (
        <p className="bp-partial-hint">اسحب البطاقات أو استخدم الأسهم لتغيير ترتيب البراندات في التطبيق.</p>
      )}
      {brands.map((brand, idx) => {
        const src = mediaThumb(brand.logo);
        const isOver = overId === brand.id && dragId !== brand.id;
        const isDragging = dragId === brand.id;
        const collections = brand.collections ?? [];

        return (
          <article
            key={brand.id}
            className={`bp-brand-card${isOver ? " is-over" : ""}${isDragging ? " is-dragging" : ""}${
              brand.isActive === false ? " is-inactive" : ""
            }`}
            draggable={!reordering}
            onDragStart={() => setDragId(brand.id)}
            onDragEnd={() => {
              setDragId(null);
              setOverId(null);
            }}
            onDragOver={(e) => {
              e.preventDefault();
              setOverId(brand.id);
            }}
            onDrop={(e) => {
              e.preventDefault();
              onDrop(brand.id);
            }}
          >
            <div className="bp-brand-card-main">
              <button type="button" className="bp-drag-handle" aria-label="سحب للترتيب">
                <HolderOutlined />
              </button>
              <div className="bp-rank">{idx + 1}</div>
              {src ? (
                <Avatar shape="square" size={52} src={src} className="bp-logo" style={{ background: brand.bgColorHex || "#f5f5f5" }} />
              ) : (
                <Avatar shape="square" size={52} className="bp-logo" style={{ background: brand.bgColorHex || "#ece8f0", color: "#4a2466" }}>
                  {brand.initial || (brand.name || "?").charAt(0)}
                </Avatar>
              )}
              <div className="bp-brand-meta">
                <div className="bp-brand-title-row">
                  <Text strong className="bp-brand-name">
                    {brand.name}
                  </Text>
                  {brand.isFeatured ? <Tag color="gold">مميز</Tag> : null}
                  {brand.isActive === false ? <Tag>غير نشط</Tag> : null}
                </div>
                <Text type="secondary" className="bp-brand-sub">
                  {brand.slug || "—"} · {brand.productCount ?? 0} {productCountLabel}
                  {collections.length ? ` · ${collections.length} خط` : ""}
                </Text>
              </div>
              <Space size={4} className="bp-brand-actions" wrap>
                <Button size="small" icon={<ArrowUpOutlined />} disabled={idx === 0 || reordering} onClick={() => move(brand.id, -1)} />
                <Button
                  size="small"
                  icon={<ArrowDownOutlined />}
                  disabled={idx === brands.length - 1 || reordering}
                  onClick={() => move(brand.id, 1)}
                />
                <Button size="small" icon={<PlusOutlined />} onClick={() => onAddCollection(brand)}>
                  خط
                </Button>
                <Button size="small" icon={<EditOutlined />} onClick={() => onEdit(brand)}>
                  تعديل
                </Button>
                <Button size="small" danger icon={<DeleteOutlined />} onClick={() => onDelete(brand)}>
                  حذف
                </Button>
              </Space>
            </div>
            {collections.length ? (
              <Collapse
                ghost
                className="bp-collections-collapse"
                items={[
                  {
                    key: "collections",
                    label: `خطوط المنتجات (${collections.length})`,
                    children: (
                      <div className="bp-collections-list">
                        {collections.map((col) => (
                          <div key={col.id} className="bp-collection-row">
                            <span className="bp-collection-name">↳ {col.name}</span>
                            <Tag color={col.isActive === false ? "default" : "cyan"}>
                              {col.isActive === false ? "متوقف" : "نشط"}
                            </Tag>
                            <Space size={4}>
                              <Button size="small" onClick={() => onEditCollection(brand, col)}>
                                تعديل
                              </Button>
                              <Popconfirm title="حذف الخط؟" okText="حذف" cancelText="إلغاء" onConfirm={() => onDeleteCollection(col.id)}>
                                <Button size="small" danger>
                                  حذف
                                </Button>
                              </Popconfirm>
                            </Space>
                          </div>
                        ))}
                      </div>
                    ),
                  },
                ]}
              />
            ) : null}
          </article>
        );
      })}
    </div>
  );
}
