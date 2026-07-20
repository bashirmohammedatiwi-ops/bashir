"use client";

import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  CopyOutlined,
  DeleteOutlined,
  EditOutlined,
  EyeInvisibleOutlined,
  EyeOutlined,
  HolderOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import { Button, Empty, Tooltip } from "antd";
import { useCallback, useState } from "react";
import { labelForType, metaForType } from "./section-types";
import { FixedHomeChrome } from "./FixedHomeChrome";
import { PhoneCanvasSection } from "./PhoneCanvasSection";
import type { EditorEntities } from "./SectionPayloadEditor";
import type { DeviceSize } from "./StudioToolbar";

export type CanvasBlock = {
  id: string;
  type: string;
  title?: string;
  subtitle?: string;
  isActive?: boolean;
  position?: number;
  payload?: Record<string, unknown>;
};

type Props = {
  blocks: CanvasBlock[];
  previewSections?: any[];
  editorEntities: EditorEntities;
  selectedId?: string | null;
  zoom?: number;
  deviceSize?: DeviceSize;
  onSelect: (id: string) => void;
  onEdit: (block: CanvasBlock) => void;
  onAddAt: (index: number) => void;
  onMove: (id: string, dir: -1 | 1) => void;
  onDuplicate: (block: CanvasBlock) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string, active: boolean) => void;
  onReorder: (ids: string[]) => void;
};

const DEVICE_WIDTH: Record<DeviceSize, number> = { "375": 375, "390": 390, "414": 414 };

export function PhoneCanvas({
  blocks,
  previewSections,
  editorEntities,
  selectedId,
  zoom = 1,
  deviceSize = "375",
  onSelect,
  onEdit,
  onAddAt,
  onMove,
  onDuplicate,
  onDelete,
  onToggle,
  onReorder,
}: Props) {
  const sorted = [...blocks].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const width = DEVICE_WIDTH[deviceSize];

  const onDrop = useCallback(
    (targetId: string) => {
      if (!dragId || dragId === targetId) {
        setDragId(null);
        setOverId(null);
        return;
      }
      const ids = sorted.map((b) => b.id);
      const from = ids.indexOf(dragId);
      const to = ids.indexOf(targetId);
      if (from < 0 || to < 0) return;
      ids.splice(from, 1);
      ids.splice(to, 0, dragId);
      onReorder(ids);
      setDragId(null);
      setOverId(null);
    },
    [sorted, dragId, onReorder],
  );

  return (
    <div className="hb-canvas-wrap">
      <div
        className="hb-canvas-scale"
        style={{ transform: `scale(${zoom})`, width: width * zoom + 24 }}
      >
        <div className="hb-canvas-device" style={{ width, height: Math.round(width * 2.08) }}>
          <div className="hb-canvas-notch" />
          <div className="hb-canvas-status">
            <span>9:41</span>
            <span className="hb-canvas-status-icons">▮▮▮ WiFi 🔋</span>
          </div>

          <div className="hb-canvas-scroll">
            <FixedHomeChrome entities={editorEntities} />
            {sorted.length === 0 ? (
              <div className="hb-canvas-empty hb-canvas-empty-below">
                <Empty description="لا أقسام بعد — أضف أول قسم أسفل الرأس الثابت" />
                <Button type="primary" icon={<PlusOutlined />} onClick={() => onAddAt(0)}>
                  أضف قسم
                </Button>
              </div>
            ) : (
              <>
                <AddSlot index={0} onAdd={onAddAt} />
                {sorted.map((block, idx) => {
                  const meta = metaForType(block.type);
                  const resolved = previewSections?.find((s) => s.id === block.id);
                  const selected = selectedId === block.id;
                  const inactive = block.isActive === false;
                  const isOver = overId === block.id && dragId !== block.id;

                  return (
                    <div key={block.id}>
                      <div
                        className={`hb-canvas-block${selected ? " selected" : ""}${inactive ? " inactive" : ""}${isOver ? " drop-target" : ""}`}
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
                        onClick={() => onSelect(block.id)}
                      >
                        <div className="hb-canvas-block-bar">
                          <HolderOutlined className="hb-canvas-drag" />
                          <span className="hb-canvas-block-type">
                            {meta?.icon} {labelForType(block.type)}
                          </span>
                          <span className="hb-canvas-block-pos">{idx + 1}</span>
                          <div className="hb-canvas-block-actions" onClick={(e) => e.stopPropagation()}>
                            <Tooltip title="أعلى">
                              <Button size="small" type="text" icon={<ArrowUpOutlined />} disabled={idx === 0} onClick={() => onMove(block.id, -1)} />
                            </Tooltip>
                            <Tooltip title="أسفل">
                              <Button size="small" type="text" icon={<ArrowDownOutlined />} disabled={idx === sorted.length - 1} onClick={() => onMove(block.id, 1)} />
                            </Tooltip>
                            <Tooltip title="تعديل">
                              <Button size="small" type="text" icon={<EditOutlined />} onClick={() => onEdit(block)} />
                            </Tooltip>
                            <Tooltip title="نسخ">
                              <Button size="small" type="text" icon={<CopyOutlined />} onClick={() => onDuplicate(block)} />
                            </Tooltip>
                            <Tooltip title={inactive ? "إظهار" : "إخفاء"}>
                              <Button
                                size="small"
                                type="text"
                                icon={inactive ? <EyeOutlined /> : <EyeInvisibleOutlined />}
                                onClick={() => onToggle(block.id, inactive)}
                              />
                            </Tooltip>
                            <Tooltip title="حذف">
                              <Button size="small" type="text" danger icon={<DeleteOutlined />} onClick={() => onDelete(block.id)} />
                            </Tooltip>
                          </div>
                        </div>
                        <div className="hb-canvas-block-content">
                          <PhoneCanvasSection block={block} resolved={resolved} meta={meta} />
                        </div>
                      </div>
                      <AddSlot index={idx + 1} onAdd={onAddAt} />
                    </div>
                  );
                })}
              </>
            )}
          </div>

          <div className="hb-canvas-tabbar">
            <span className="active">🏠<br />الرئيسية</span>
            <span>☰<br />الأقسام</span>
            <span className="fab">%</span>
            <span>🛒<br />السلة</span>
            <span>👤<br />حسابي</span>
          </div>
        </div>
      </div>
      <p className="hb-canvas-hint">انقر للتعديل · اسحب ≡ للترتيب · + بين الأقسام للإضافة</p>
    </div>
  );
}

function AddSlot({ index, onAdd }: { index: number; onAdd: (i: number) => void }) {
  return (
    <button type="button" className="hb-canvas-add-slot" onClick={() => onAdd(index)}>
      <PlusOutlined /> إضافة قسم
    </button>
  );
}
