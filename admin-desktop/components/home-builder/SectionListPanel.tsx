"use client";

import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  CopyOutlined,
  DeleteOutlined,
  EditOutlined,
  HolderOutlined,
  PlusOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import { Button, Empty, Input, Popconfirm, Space, Switch, Tag, Tooltip, Typography } from "antd";
import { useMemo, useState } from "react";
import { labelForType, metaForType } from "./section-types";
import { sectionSummary } from "./section-summary";
import { validateSection } from "./section-validation";

const { Text } = Typography;

export type ListBlock = {
  id: string;
  type: string;
  title?: string;
  subtitle?: string;
  isActive?: boolean;
  position?: number;
  payload?: Record<string, unknown>;
};

type Props = {
  blocks: ListBlock[];
  selectedId?: string | null;
  loading?: boolean;
  onSelect: (id: string) => void;
  onAdd: () => void;
  onEdit: (block: ListBlock) => void;
  onMove: (id: string, dir: -1 | 1) => void;
  onDuplicate: (block: ListBlock) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string, active: boolean) => void;
  onReorder: (ids: string[]) => void;
};

export function SectionListPanel({
  blocks,
  selectedId,
  loading,
  onSelect,
  onAdd,
  onEdit,
  onMove,
  onDuplicate,
  onDelete,
  onToggle,
  onReorder,
}: Props) {
  const [search, setSearch] = useState("");
  const [dragId, setDragId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return blocks;
    return blocks.filter(
      (b) =>
        (b.title ?? "").toLowerCase().includes(q) ||
        labelForType(b.type).toLowerCase().includes(q) ||
        sectionSummary(b).toLowerCase().includes(q),
    );
  }, [blocks, search]);

  function onDrop(targetId: string) {
    if (!dragId || dragId === targetId) {
      setDragId(null);
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
  }

  return (
    <div className="hb-list-panel">
      <div className="hb-list-toolbar">
        <Input.Search
          placeholder="بحث بالعنوان أو النوع..."
          allowClear
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ flex: 1 }}
        />
        <Button type="primary" icon={<PlusOutlined />} onClick={onAdd}>
          قسم
        </Button>
      </div>

      {loading ? (
        <div className="hb-list-loading">جاري التحميل...</div>
      ) : filtered.length === 0 ? (
        <Empty description={blocks.length ? "لا نتائج" : "لا توجد أقسام — ابدأ بإضافة قسم"}>
          {!blocks.length && (
            <Button type="primary" icon={<PlusOutlined />} onClick={onAdd}>
              إضافة أول قسم
            </Button>
          )}
        </Empty>
      ) : (
        <div className="hb-list">
          {filtered.map((block) => {
            const idx = blocks.indexOf(block);
            const meta = metaForType(block.type);
            const selected = selectedId === block.id;
            const inactive = block.isActive === false;
            const warnings = validateSection(block);
            const hasError = warnings.some((w) => w.level === "error");
            const hasWarn = warnings.some((w) => w.level === "warn");

            return (
              <div
                key={block.id}
                className={`hb-list-row${selected ? " selected" : ""}${inactive ? " inactive" : ""}`}
                draggable
                onDragStart={() => setDragId(block.id)}
                onDragEnd={() => setDragId(null)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => onDrop(block.id)}
                onClick={() => onSelect(block.id)}
              >
                <HolderOutlined className="hb-list-drag" title="اسحب للترتيب" />

                <span className="hb-list-order">{idx + 1}</span>

                <span className="hb-list-icon">{meta?.icon ?? "📦"}</span>

                <div className="hb-list-body">
                  <div className="hb-list-title-row">
                    <Text strong ellipsis className="hb-list-title">
                      {block.title || labelForType(block.type)}
                    </Text>
                    {(hasError || hasWarn) && (
                      <Tooltip title={warnings.map((w) => w.message).join(" · ")}>
                        <WarningOutlined className={hasError ? "hb-warn error" : "hb-warn"} />
                      </Tooltip>
                    )}
                  </div>
                  <div className="hb-list-meta">
                    <Tag bordered={false} color="processing" className="hb-list-type-tag">
                      {labelForType(block.type)}
                    </Tag>
                    <Text type="secondary" ellipsis className="hb-list-summary">
                      {sectionSummary(block)}
                    </Text>
                  </div>
                </div>

                <div className="hb-list-status" onClick={(e) => e.stopPropagation()}>
                  <Switch
                    size="small"
                    checked={!inactive}
                    onChange={(checked) => onToggle(block.id, checked)}
                  />
                  <Text type="secondary" className="hb-list-status-label">
                    {inactive ? "مخفي" : "نشط"}
                  </Text>
                </div>

                <Space size={0} className="hb-list-actions" onClick={(e) => e.stopPropagation()}>
                  <Tooltip title="أعلى">
                    <Button
                      type="text"
                      size="small"
                      icon={<ArrowUpOutlined />}
                      disabled={idx === 0}
                      onClick={() => onMove(block.id, -1)}
                    />
                  </Tooltip>
                  <Tooltip title="أسفل">
                    <Button
                      type="text"
                      size="small"
                      icon={<ArrowDownOutlined />}
                      disabled={idx === blocks.length - 1}
                      onClick={() => onMove(block.id, 1)}
                    />
                  </Tooltip>
                  <Tooltip title="تعديل">
                    <Button type="text" size="small" icon={<EditOutlined />} onClick={() => onEdit(block)} />
                  </Tooltip>
                  <Tooltip title="نسخ">
                    <Button type="text" size="small" icon={<CopyOutlined />} onClick={() => onDuplicate(block)} />
                  </Tooltip>
                  <Popconfirm title="حذف هذا القسم؟" okText="حذف" cancelText="إلغاء" onConfirm={() => onDelete(block.id)}>
                    <Button type="text" size="small" danger icon={<DeleteOutlined />} />
                  </Popconfirm>
                </Space>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
