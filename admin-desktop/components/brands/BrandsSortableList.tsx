"use client";

import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  DeleteOutlined,
  HolderOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import { Avatar, Button, Empty, Popconfirm, Space, Spin, Table, Tag, Tooltip } from "antd";
import type { TableColumnsType } from "antd";
import { useCallback, useMemo, useState, type MouseEvent } from "react";
import type { BrandCollection, BrandRow } from "@/lib/brandTypes";
import { mediaThumb } from "@/lib/mediaUrl";

export type { BrandCollection, BrandRow } from "@/lib/brandTypes";

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

function stopRowClick(e: MouseEvent) {
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

  const columns: TableColumnsType<BrandRow> = useMemo(
    () => [
      {
        title: "",
        width: 44,
        render: (_: unknown, row: BrandRow) => (
          <button
            type="button"
            className="bp-drag-handle"
            aria-label="سحب للترتيب"
            draggable={!reordering}
            onMouseDown={stopRowClick}
            onClick={stopRowClick}
            onDragStart={(e) => {
              e.stopPropagation();
              setDragId(row.id);
            }}
            onDragEnd={() => {
              setDragId(null);
              setOverId(null);
            }}
          >
            <HolderOutlined />
          </button>
        ),
      },
      {
        title: "#",
        width: 88,
        render: (_: unknown, row: BrandRow, idx: number) => (
          <Space size={4} onClick={stopRowClick}>
            <span className="bp-rank">{idx + 1}</span>
            <Button
              size="small"
              type="text"
              icon={<ArrowUpOutlined />}
              disabled={idx === 0 || reordering}
              onClick={() => move(row.id, -1)}
            />
            <Button
              size="small"
              type="text"
              icon={<ArrowDownOutlined />}
              disabled={idx === brands.length - 1 || reordering}
              onClick={() => move(row.id, 1)}
            />
          </Space>
        ),
      },
      {
        title: "الشعار",
        width: 72,
        render: (_: unknown, row: BrandRow) => {
          const src = mediaThumb(row.logo);
          return src ? (
            <Avatar shape="square" size={44} src={src} style={{ background: row.bgColorHex || "#f5f5f5" }} />
          ) : (
            <Avatar shape="square" size={44} style={{ background: row.bgColorHex || "#ece8f0", color: "#4a2466" }}>
              {row.initial || row.name.charAt(0)}
            </Avatar>
          );
        },
      },
      {
        title: "البراند",
        render: (_: unknown, row: BrandRow) => (
          <div className="bp-table-brand-cell">
            <strong>{row.name}</strong>
            <span className="bp-table-brand-slug">{row.slug || "—"}</span>
          </div>
        ),
      },
      {
        title: productCountLabel,
        width: 110,
        align: "center",
        render: (_: unknown, row: BrandRow) => <strong>{row.productCount ?? 0}</strong>,
      },
      {
        title: "الحالة",
        width: 130,
        render: (_: unknown, row: BrandRow) => (
          <Space size={4} wrap>
            {row.isFeatured ? <Tag color="gold">مميز</Tag> : null}
            {row.isActive === false ? <Tag>غير نشط</Tag> : <Tag color="green">نشط</Tag>}
          </Space>
        ),
      },
      {
        title: "إجراءات",
        width: 120,
        render: (_: unknown, row: BrandRow) => (
          <Space size={4} onClick={stopRowClick}>
            <Tooltip title="إضافة خط">
              <Button size="small" icon={<PlusOutlined />} onClick={() => onAddCollection(row)} />
            </Tooltip>
            <Tooltip title="حذف">
              <Button size="small" danger icon={<DeleteOutlined />} onClick={() => onDelete(row)} />
            </Tooltip>
          </Space>
        ),
      },
    ],
    [brands.length, move, onAddCollection, onDelete, productCountLabel, reordering],
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
    <div className={`bp-table-wrap${reordering ? " is-saving" : ""}`}>
      <p className="bp-partial-hint">
        {partialOrder
          ? "السحب يعيد ترتيب البراندات الظاهرة ضمن الترتيب العام — منتجات التطبيق تُجمَّع حسب ترتيب البراند."
          : "اسحب من ⋮⋮ أو استخدم الأسهم — انقر على الصف لتعديل البراند. ترتيب المنتجات في التطبيق يتبع هذا الترتيب."}
      </p>
      <Table<BrandRow>
        rowKey="id"
        size="middle"
        pagination={false}
        columns={columns}
        dataSource={brands}
        className="bp-brands-table"
        onRow={(row) => ({
          className: [
            "bp-table-row",
            dragId === row.id ? "is-dragging" : "",
            overId === row.id && dragId !== row.id ? "is-over" : "",
            row.isActive === false ? "is-inactive" : "",
          ]
            .filter(Boolean)
            .join(" "),
          onClick: (e) => {
            const el = e.target as HTMLElement;
            if (
              el.closest(
                ".bp-drag-handle, button, a, .ant-popconfirm, .ant-table-row-expand-icon-cell, .ant-table-expanded-row",
              )
            ) {
              return;
            }
            onEdit(row);
          },
          onDragOver: (e) => {
            e.preventDefault();
            setOverId(row.id);
          },
          onDrop: (e) => {
            e.preventDefault();
            onDrop(row.id);
          },
        })}
        expandable={{
          rowExpandable: (row) => (row.collections?.length ?? 0) > 0,
          expandedRowRender: (row) => (
            <div className="bp-collections-list">
              {(row.collections ?? []).map((col) => (
                <div key={col.id} className="bp-collection-row">
                  <span className="bp-collection-name">↳ {col.name}</span>
                  <Tag color={col.isActive === false ? "default" : "cyan"}>
                    {col.isActive === false ? "متوقف" : "نشط"}
                  </Tag>
                  <Space size={4}>
                    <Button size="small" onClick={() => onEditCollection(row, col)}>
                      تعديل
                    </Button>
                    <Popconfirm
                      title="حذف الخط؟"
                      okText="حذف"
                      cancelText="إلغاء"
                      onConfirm={() => onDeleteCollection(col.id)}
                    >
                      <Button size="small" danger>
                        حذف
                      </Button>
                    </Popconfirm>
                  </Space>
                </div>
              ))}
            </div>
          ),
        }}
      />
    </div>
  );
}
