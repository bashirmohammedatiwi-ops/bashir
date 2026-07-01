"use client";

import { CheckOutlined } from "@ant-design/icons";
import { Empty, Input, Typography } from "antd";
import { useMemo, useState } from "react";
import { mediaThumb } from "@/lib/mediaUrl";

const { Text } = Typography;

type Entity = {
  id: string;
  name?: string;
  title?: string;
  slug?: string;
  image?: unknown;
  logo?: unknown;
  imageId?: string;
  brand?: { name?: string };
};

type Props = {
  items: Entity[];
  value?: string[];
  onChange?: (ids: string[]) => void;
  max?: number;
  imageKey?: "image" | "logo";
  placeholder?: string;
};

function entityLabel(e: Entity) {
  return e.name ?? e.title ?? e.slug ?? e.id;
}

function entityImage(e: Entity, imageKey: "image" | "logo") {
  const media = (imageKey === "logo" ? e.logo : e.image) as Parameters<typeof mediaThumb>[0];
  return mediaThumb(media);
}

export function EntityMultiPicker({
  items,
  value,
  onChange,
  max,
  imageKey = "image",
  placeholder = "بحث...",
}: Props) {
  const [q, setQ] = useState("");
  const selected = value ?? [];

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return items;
    return items.filter((e) => entityLabel(e).toLowerCase().includes(s));
  }, [items, q]);

  function toggle(id: string) {
    const set = new Set(selected);
    if (set.has(id)) {
      set.delete(id);
    } else {
      if (max && set.size >= max) return;
      set.add(id);
    }
    onChange?.([...set]);
  }

  function move(id: string, dir: -1 | 1) {
    const idx = selected.indexOf(id);
    if (idx < 0) return;
    const next = idx + dir;
    if (next < 0 || next >= selected.length) return;
    const copy = [...selected];
    [copy[idx], copy[next]] = [copy[next], copy[idx]];
    onChange?.(copy);
  }

  const selectedItems = selected
    .map((id) => items.find((e) => e.id === id))
    .filter(Boolean) as Entity[];

  return (
    <div className="hb-entity-picker">
      {selected.length > 0 && (
        <div className="hb-entity-selected">
          <Text type="secondary" style={{ fontSize: 11, display: "block", marginBottom: 6 }}>
            الترتيب في التطبيق ({selected.length}{max ? ` / ${max}` : ""})
          </Text>
          <div className="hb-entity-selected-row">
            {selectedItems.map((e, idx) => {
              const url = entityImage(e, imageKey);
              return (
                <div key={e.id} className="hb-entity-chip">
                  <div
                    className="hb-entity-chip-img"
                    style={{
                      background: url ? `center/cover url(${url})` : "linear-gradient(135deg,#f5f5f5,#ececec)",
                    }}
                  />
                  <Text ellipsis className="hb-entity-chip-label">
                    {entityLabel(e)}
                  </Text>
                  <div className="hb-entity-chip-actions">
                    <button type="button" onClick={() => move(e.id, -1)} disabled={idx === 0}>
                      ↑
                    </button>
                    <button type="button" onClick={() => move(e.id, 1)} disabled={idx === selected.length - 1}>
                      ↓
                    </button>
                    <button type="button" className="danger" onClick={() => toggle(e.id)}>
                      ×
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <Input
        placeholder={placeholder}
        value={q}
        onChange={(e) => setQ(e.target.value)}
        allowClear
        style={{ marginBottom: 8 }}
      />

      {filtered.length === 0 ? (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="لا توجد عناصر" />
      ) : (
        <div className="hb-entity-grid">
          {filtered.map((e) => {
            const active = selected.includes(e.id);
            const url = entityImage(e, imageKey);
            const disabled = !active && max !== undefined && selected.length >= max;
            return (
              <button
                key={e.id}
                type="button"
                className={`hb-entity-tile${active ? " active" : ""}${disabled ? " disabled" : ""}`}
                onClick={() => !disabled && toggle(e.id)}
              >
                <div
                  className="hb-entity-tile-img"
                  style={{
                    background: url ? `center/cover url(${url})` : "linear-gradient(135deg,#fafafa,#eee)",
                  }}
                >
                  {active && (
                    <span className="hb-entity-check">
                      <CheckOutlined />
                    </span>
                  )}
                </div>
                <Text ellipsis className="hb-entity-tile-label">
                  {entityLabel(e)}
                </Text>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
