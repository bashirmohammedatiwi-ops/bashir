"use client";

import {
  CopyOutlined,
  DeleteOutlined,
  EyeInvisibleOutlined,
  EyeOutlined,
  HolderOutlined,
  PlusOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { Badge, Button, Empty, Input, Select, Tooltip, Typography } from "antd";
import { useMemo, useState } from "react";
import { labelForType, metaForType, SECTION_TYPES } from "./section-types";
import { validateSection } from "./section-validation";
import type { CanvasBlock } from "./PhoneCanvas";

const { Text } = Typography;

type Props = {
  blocks: CanvasBlock[];
  selectedId?: string | null;
  onSelect: (id: string) => void;
  onAdd: () => void;
  onDuplicate: (block: CanvasBlock) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string, active: boolean) => void;
  onReorder: (ids: string[]) => void;
};

export function SectionOutline({
  blocks,
  selectedId,
  onSelect,
  onAdd,
  onDuplicate,
  onDelete,
  onToggle,
  onReorder,
}: Props) {
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [dragId, setDragId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return blocks.filter((b) => {
      const q = search.trim().toLowerCase();
      const matchSearch =
        !q ||
        (b.title ?? "").toLowerCase().includes(q) ||
        labelForType(b.type).toLowerCase().includes(q);
      const matchType = filterType === "all" || b.type === filterType;
      const matchStatus =
        filterStatus === "all" ||
        (filterStatus === "active" && b.isActive !== false) ||
        (filterStatus === "hidden" && b.isActive === false);
      return matchSearch && matchType && matchStatus;
    });
  }, [blocks, search, filterType, filterStatus]);

  const activeCount = blocks.filter((b) => b.isActive !== false).length;
  const hiddenCount = blocks.length - activeCount;

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
    <aside className="hb-outline">
      <div className="hb-outline-head">
        <div className="hb-outline-title-row">
          <Text strong className="hb-outline-title">الأقسام</Text>
          <Badge count={blocks.length} style={{ backgroundColor: "#E1306C" }} />
        </div>
        <div className="hb-outline-stats">
          <span className="hb-stat active">{activeCount} نشط</span>
          {hiddenCount > 0 && <span className="hb-stat hidden">{hiddenCount} مخفي</span>}
        </div>
        <Button type="primary" block icon={<PlusOutlined />} onClick={onAdd} className="hb-outline-add">
          إضافة قسم
        </Button>
      </div>

      <div className="hb-outline-filters">
        <Input
          prefix={<SearchOutlined />}
          placeholder="بحث..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          allowClear
          size="small"
        />
        <div className="hb-outline-filter-row">
          <Select
            size="small"
            value={filterType}
            onChange={setFilterType}
            options={[
              { value: "all", label: "كل الأنواع" },
              ...SECTION_TYPES.map((t) => ({ value: t.value, label: t.label })),
            ]}
            popupMatchSelectWidth={false}
          />
          <Select
            size="small"
            value={filterStatus}
            onChange={setFilterStatus}
            options={[
              { value: "all", label: "الكل" },
              { value: "active", label: "نشط" },
              { value: "hidden", label: "مخفي" },
            ]}
          />
        </div>
      </div>

      <div className="hb-outline-list">
        {filtered.length === 0 ? (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="لا توجد أقسام" />
        ) : (
          filtered.map((block) => {
            const meta = metaForType(block.type);
            const selected = selectedId === block.id;
            const inactive = block.isActive === false;
            const warnings = validateSection(block);
            const hasError = warnings.some((w) => w.level === "error");

            return (
              <div
                key={block.id}
                className={`hb-outline-item${selected ? " selected" : ""}${inactive ? " inactive" : ""}${hasError ? " has-error" : ""}`}
                draggable
                onDragStart={() => setDragId(block.id)}
                onDragEnd={() => setDragId(null)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => onDrop(block.id)}
                onClick={() => onSelect(block.id)}
              >
                <HolderOutlined className="hb-outline-drag" />
                <span className="hb-outline-icon">{meta?.icon ?? "📦"}</span>
                <div className="hb-outline-meta">
                  <Text strong ellipsis className="hb-outline-name">
                    {block.title || labelForType(block.type)}
                  </Text>
                  <Text type="secondary" className="hb-outline-type">
                    {labelForType(block.type)} · #{blocks.indexOf(block) + 1}
                  </Text>
                </div>
                <div className="hb-outline-actions" onClick={(e) => e.stopPropagation()}>
                  <Tooltip title={inactive ? "إظهار" : "إخفاء"}>
                    <Button
                      type="text"
                      size="small"
                      icon={inactive ? <EyeOutlined /> : <EyeInvisibleOutlined />}
                      onClick={() => onToggle(block.id, inactive)}
                    />
                  </Tooltip>
                  <Tooltip title="نسخ">
                    <Button type="text" size="small" icon={<CopyOutlined />} onClick={() => onDuplicate(block)} />
                  </Tooltip>
                  <Tooltip title="حذف">
                    <Button type="text" size="small" danger icon={<DeleteOutlined />} onClick={() => onDelete(block.id)} />
                  </Tooltip>
                </div>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
}
