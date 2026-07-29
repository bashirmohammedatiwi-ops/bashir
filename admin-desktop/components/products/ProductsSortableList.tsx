"use client";

import {
  ArrowDownOutlined,
  ArrowLeftOutlined,
  ArrowRightOutlined,
  ArrowUpOutlined,
  HolderOutlined,
} from "@ant-design/icons";
import { Button, Empty, Spin, Tag, Tooltip } from "antd";
import { useCallback, useState } from "react";
import { ProductThumb } from "@/components/ProductThumb";
import { displayProductName } from "@/lib/productName";

export type ProductOrderRow = {
  id: string;
  name?: string;
  nameAr?: string;
  nameEn?: string;
  price?: number;
  stock?: number;
  isActive?: boolean;
  brand?: { name?: string };
  images?: any[];
};

type Props = {
  products: ProductOrderRow[];
  loading?: boolean;
  reordering?: boolean;
  onReorder: (ids: string[]) => void;
  onEdit?: (product: ProductOrderRow) => void;
};

export function ProductsSortableList({
  products,
  loading,
  reordering,
  onReorder,
  onEdit,
}: Props) {
  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  const reorderIds = useCallback((ids: string[]) => onReorder(ids), [onReorder]);

  const move = useCallback(
    (id: string, offset: number) => {
      const idx = products.findIndex((p) => p.id === id);
      const next = idx + offset;
      if (next < 0 || next >= products.length) return;
      const ids = products.map((p) => p.id);
      const [item] = ids.splice(idx, 1);
      ids.splice(next, 0, item);
      reorderIds(ids);
    },
    [products, reorderIds],
  );

  const onDrop = useCallback(
    (targetId: string) => {
      if (!dragId || dragId === targetId) {
        setDragId(null);
        setOverId(null);
        return;
      }
      const ids = products.map((p) => p.id);
      const from = ids.indexOf(dragId);
      const to = ids.indexOf(targetId);
      if (from < 0 || to < 0) return;
      ids.splice(from, 1);
      ids.splice(to, 0, dragId);
      reorderIds(ids);
      setDragId(null);
      setOverId(null);
    },
    [products, dragId, reorderIds],
  );

  if (loading) {
    return (
      <div className="pp-order-loading">
        <Spin size="large" />
      </div>
    );
  }

  if (!products.length) {
    return <Empty description="لا توجد منتجات في هذا البراند" style={{ padding: 32 }} />;
  }

  return (
    <div className={`pp-order-list${reordering ? " is-saving" : ""}`}>
      <p className="pp-order-hint">
        اسحب المنتجات أو استخدم الأسهم لتغيير ترتيب العرض داخل التطبيق. المنتجات الجديدة تُضاف تلقائياً في
        آخر القائمة.
      </p>
      <div className="pp-order-rows">
        {products.map((product, idx) => {
          const isOver = overId === product.id && dragId !== product.id;
          const isDragging = dragId === product.id;
          return (
            <article
              key={product.id}
              className={[
                "pp-order-row",
                isOver ? "is-over" : "",
                isDragging ? "is-dragging" : "",
                product.isActive === false ? "is-inactive" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              onDragOver={(e) => {
                e.preventDefault();
                setOverId(product.id);
              }}
              onDrop={(e) => {
                e.preventDefault();
                onDrop(product.id);
              }}
            >
              <span className="pp-order-rank">{idx + 1}</span>
              <button
                type="button"
                className="pp-order-handle"
                aria-label="سحب للترتيب"
                draggable={!reordering}
                onDragStart={(e) => {
                  e.stopPropagation();
                  setDragId(product.id);
                }}
                onDragEnd={() => {
                  setDragId(null);
                  setOverId(null);
                }}
              >
                <HolderOutlined />
              </button>
              <button
                type="button"
                className="pp-order-thumb-btn"
                onClick={() => onEdit?.(product)}
              >
                <ProductThumb product={product} size={56} className="pp-order-thumb" />
              </button>
              <button type="button" className="pp-order-main" onClick={() => onEdit?.(product)}>
                <strong>{displayProductName(product)}</strong>
                <span>
                  {Number(product.price ?? 0).toLocaleString("ar-IQ")} د.ع
                  {product.stock != null ? ` · مخزون ${product.stock}` : ""}
                </span>
              </button>
              <div className="pp-order-tags">
                {product.isActive === false ? <Tag>متوقف</Tag> : null}
              </div>
              <div className="pp-order-actions">
                <Tooltip title="أعلى">
                  <Button
                    size="small"
                    type="text"
                    icon={<ArrowUpOutlined />}
                    disabled={idx === 0 || reordering}
                    onClick={() => move(product.id, -1)}
                  />
                </Tooltip>
                <Tooltip title="أسفل">
                  <Button
                    size="small"
                    type="text"
                    icon={<ArrowDownOutlined />}
                    disabled={idx === products.length - 1 || reordering}
                    onClick={() => move(product.id, 1)}
                  />
                </Tooltip>
                <Tooltip title="سابق">
                  <Button
                    size="small"
                    type="text"
                    icon={<ArrowRightOutlined />}
                    disabled={idx === 0 || reordering}
                    onClick={() => move(product.id, -1)}
                  />
                </Tooltip>
                <Tooltip title="تالي">
                  <Button
                    size="small"
                    type="text"
                    icon={<ArrowLeftOutlined />}
                    disabled={idx === products.length - 1 || reordering}
                    onClick={() => move(product.id, 1)}
                  />
                </Tooltip>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
