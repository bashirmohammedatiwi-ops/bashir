"use client";

import {
  Button,
  Card,
  Popconfirm,
  Space,
  Switch,
  Tag,
  Typography,
} from "antd";
import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  CopyOutlined,
  EditOutlined,
  HolderOutlined,
} from "@ant-design/icons";
import { useCallback, useState } from "react";
import { labelForType, metaForType } from "./section-types";

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
  onEdit: (block: HomeBlockRow) => void;
  onDuplicate: (block: HomeBlockRow) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string, active: boolean) => void;
  onReorder: (ids: string[]) => void;
};

export function HomeSectionList({
  blocks,
  onEdit,
  onDuplicate,
  onDelete,
  onToggle,
  onReorder,
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

  if (blocks.length === 0) {
    return (
      <Card size="small">
        <Text type="secondary">لا توجد أقسام — ابدأ بإضافة «بنر رئيسي + فئات»</Text>
      </Card>
    );
  }

  return (
    <Space direction="vertical" style={{ width: "100%" }} size={6}>
      {blocks.map((block, idx) => {
        const meta = metaForType(block.type);
        const isOver = overId === block.id && dragId !== block.id;
        return (
          <Card
            key={block.id}
            size="small"
            draggable
            onDragStart={() => setDragId(block.id)}
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
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <HolderOutlined style={{ color: "#bbb", cursor: "grab" }} />
              <Tag color="blue">{idx + 1}</Tag>
              <span style={{ fontSize: 18 }}>{meta?.icon ?? "📦"}</span>
              <div style={{ flex: 1, minWidth: 140 }}>
                <Text strong>{block.title || labelForType(block.type)}</Text>
                <br />
                <Text type="secondary" style={{ fontSize: 11 }}>
                  {labelForType(block.type)}
                  {block.subtitle ? ` · ${block.subtitle}` : ""}
                </Text>
              </div>
              <Tag style={{ background: meta?.color, border: "none", color: "#555" }}>
                {block.type}
              </Tag>
              <Switch
                size="small"
                checked={block.isActive !== false}
                onChange={(v) => onToggle(block.id, v)}
              />
              <Button size="small" icon={<ArrowUpOutlined />} disabled={idx === 0} onClick={() => move(block.id, -1)} />
              <Button
                size="small"
                icon={<ArrowDownOutlined />}
                disabled={idx === blocks.length - 1}
                onClick={() => move(block.id, 1)}
              />
              <Button size="small" icon={<EditOutlined />} onClick={() => onEdit(block)} />
              <Button size="small" icon={<CopyOutlined />} onClick={() => onDuplicate(block)} />
              <Popconfirm title="حذف القسم؟" onConfirm={() => onDelete(block.id)}>
                <Button size="small" danger>
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
