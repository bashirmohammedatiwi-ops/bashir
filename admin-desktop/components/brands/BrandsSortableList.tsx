"use client";

import {
  ArrowDownOutlined,
  ArrowLeftOutlined,
  ArrowRightOutlined,
  ArrowUpOutlined,
  DeleteOutlined,
  HolderOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import { Avatar, Button, Dropdown, Empty, Popconfirm, Space, Spin, Tag, Tooltip } from "antd";
import { useCallback, useState, type MouseEvent } from "react";
import type { BrandCollection, BrandRow } from "@/lib/brandTypes";
import { mediaThumb } from "@/lib/mediaUrl";

export type { BrandCollection, BrandRow } from "@/lib/brandTypes";

const GRID_COLS = 5;

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
  onEditCollection: (brand: BrandRow, collection: BrandCollection) => void;
  onDeleteCollection: (collectionId: string) => void;
};

function stopCardClick(e: MouseEvent) {
  e.stopPropagation();
}

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

  const reorderIds = useCallback(
    (ids: string[]) => onReorder(ids),
    [onReorder],
  );

  const move = useCallback(
    (id: string, offset: number) => {
      const idx = brands.findIndex((b) => b.id === id);
      const next = idx + offset;
      if (next < 0 || next >= brands.length) return;
      const ids = brands.map((b) => b.id);
      const [item] = ids.splice(idx, 1);
      ids.splice(next, 0, item);
      reorderIds(ids);
    },
    [brands, reorderIds],
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
      reorderIds(ids);
      setDragId(null);
      setOverId(null);
    },
    [brands, dragId, reorderIds],
  );

  if (loading) {
    return (
      <div className="bp-list-loading">
        <Spin size="large" />
      </div>
    );
  }

  if (!brands.length) {
    return <Empty description="لا توجد براندات مطابقة للفلاتر" style={{ padding: 32 }} />;
  }

  return (
    <div className={`bp-grid-wrap${reordering ? " is-saving" : ""}`}>
      <p className="bp-partial-hint">
        {partialOrder
          ? "السحب يعيد ترتيب البراندات الظاهرة ضمن الترتيب العام."
          : "شبكة 5 أعمدة — اسحب البطاقة أو استخدم الأسهم. انقر على البطاقة للتعديل."}
      </p>

      <div className="bp-brands-grid">
        {brands.map((brand, idx) => {
          const src = mediaThumb(brand.logo);
          const collections = brand.collections ?? [];
          const isOver = overId === brand.id && dragId !== brand.id;
          const isDragging = dragId === brand.id;
          const rowNum = Math.floor(idx / GRID_COLS) + 1;
          const colNum = (idx % GRID_COLS) + 1;

          const collectionMenu =
            collections.length > 0
              ? {
                  items: collections.map((col) => ({
                    key: col.id,
                    label: (
                      <div className="bp-collection-menu-item">
                        <span>{col.name}</span>
                        <Space size={4}>
                          <Button
                            size="small"
                            type="link"
                            onClick={(e) => {
                              stopCardClick(e);
                              onEditCollection(brand, col);
                            }}
                          >
                            تعديل
                          </Button>
                          <Popconfirm
                            title="حذف الخط؟"
                            okText="حذف"
                            cancelText="إلغاء"
                            onConfirm={() => onDeleteCollection(col.id)}
                          >
                            <Button size="small" type="link" danger onClick={stopCardClick}>
                              حذف
                            </Button>
                          </Popconfirm>
                        </Space>
                      </div>
                    ),
                  })),
                }
              : null;

          return (
            <article
              key={brand.id}
              className={[
                "bp-brand-tile",
                isOver ? "is-over" : "",
                isDragging ? "is-dragging" : "",
                brand.isActive === false ? "is-inactive" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              onClick={() => onEdit(brand)}
              onDragOver={(e) => {
                e.preventDefault();
                setOverId(brand.id);
              }}
              onDrop={(e) => {
                e.preventDefault();
                onDrop(brand.id);
              }}
            >
              <div className="bp-tile-top">
                <span className="bp-rank" title={`الصف ${rowNum} — العمود ${colNum}`}>
                  {idx + 1}
                </span>
                <button
                  type="button"
                  className="bp-drag-handle"
                  aria-label="سحب للترتيب"
                  draggable={!reordering}
                  onClick={stopCardClick}
                  onMouseDown={stopCardClick}
                  onDragStart={(e) => {
                    e.stopPropagation();
                    setDragId(brand.id);
                  }}
                  onDragEnd={() => {
                    setDragId(null);
                    setOverId(null);
                  }}
                >
                  <HolderOutlined />
                </button>
              </div>

              <div className="bp-tile-logo">
                {src ? (
                  <Avatar shape="square" size={72} src={src} style={{ background: brand.bgColorHex || "#f5f5f5" }} />
                ) : (
                  <Avatar
                    shape="square"
                    size={72}
                    style={{ background: brand.bgColorHex || "#ece8f0", color: "#4a2466", fontSize: 28 }}
                  >
                    {brand.initial || brand.name.charAt(0)}
                  </Avatar>
                )}
              </div>

              <h4 className="bp-tile-name">{brand.name}</h4>
              <p className="bp-tile-meta">
                {brand.productCount ?? 0} {productCountLabel}
                {collections.length ? ` · ${collections.length} خط` : ""}
              </p>

              <div className="bp-tile-tags">
                {brand.isFeatured ? <Tag color="gold">مميز</Tag> : null}
                {brand.isActive === false ? <Tag>غير نشط</Tag> : null}
              </div>

              <div className="bp-tile-actions" onClick={stopCardClick}>
                <Tooltip title="سابق">
                  <Button
                    size="small"
                    type="text"
                    icon={<ArrowRightOutlined />}
                    disabled={idx === 0 || reordering}
                    onClick={() => move(brand.id, -1)}
                  />
                </Tooltip>
                <Tooltip title="تالي">
                  <Button
                    size="small"
                    type="text"
                    icon={<ArrowLeftOutlined />}
                    disabled={idx === brands.length - 1 || reordering}
                    onClick={() => move(brand.id, 1)}
                  />
                </Tooltip>
                <Tooltip title="صف أعلى">
                  <Button
                    size="small"
                    type="text"
                    icon={<ArrowUpOutlined />}
                    disabled={idx < GRID_COLS || reordering}
                    onClick={() => move(brand.id, -GRID_COLS)}
                  />
                </Tooltip>
                <Tooltip title="صف أسفل">
                  <Button
                    size="small"
                    type="text"
                    icon={<ArrowDownOutlined />}
                    disabled={idx + GRID_COLS >= brands.length || reordering}
                    onClick={() => move(brand.id, GRID_COLS)}
                  />
                </Tooltip>
                <Tooltip title="إضافة خط">
                  <Button size="small" type="text" icon={<PlusOutlined />} onClick={() => onAddCollection(brand)} />
                </Tooltip>
                {collectionMenu ? (
                  <Dropdown menu={collectionMenu} trigger={["click"]}>
                    <Button size="small" type="text" onClick={stopCardClick}>
                      خطوط
                    </Button>
                  </Dropdown>
                ) : null}
                <Tooltip title="حذف">
                  <Button size="small" type="text" danger icon={<DeleteOutlined />} onClick={() => onDelete(brand)} />
                </Tooltip>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
