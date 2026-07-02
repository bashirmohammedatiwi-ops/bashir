"use client";

import { Tag } from "antd";
import { STATUS_COLORS, STATUS_LABELS } from "./order-utils";

export function OrderStatusBadge({ status }: { status: string }) {
  const color = STATUS_COLORS[status] ?? "#94a3b8";
  return (
    <Tag
      style={{
        margin: 0,
        border: `1px solid ${color}33`,
        background: `${color}14`,
        color,
        fontWeight: 700,
        borderRadius: 8,
        padding: "2px 10px",
      }}
    >
      {STATUS_LABELS[status] ?? status}
    </Tag>
  );
}
