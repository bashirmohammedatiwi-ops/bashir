"use client";

import { Tag, Tooltip } from "antd";
import { STAGE_COLORS, STAGE_LABELS, STATUS_COLORS, STATUS_LABELS } from "./order-utils";

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

/** مرحلة التجهيز والشحن (fulfillmentStage) بجانب حالة الطلب. */
export function OrderStageBadge({ stage, size = "default" }: { stage?: string | null; size?: "small" | "default" }) {
  if (!stage) return null;
  const color = STAGE_COLORS[stage] ?? "#64748b";
  return (
    <Tooltip title="مرحلة التجهيز والشحن">
      <Tag
        style={{
          margin: 0,
          border: `1px dashed ${color}66`,
          background: "#fff",
          color,
          fontWeight: 600,
          borderRadius: 8,
          padding: size === "small" ? "0 6px" : "2px 10px",
          fontSize: size === "small" ? 11 : undefined,
        }}
      >
        {STAGE_LABELS[stage] ?? stage}
      </Tag>
    </Tooltip>
  );
}

/** الطلب تغيّر مبلغه بعد التجهيز (نقص أو إضافة). */
export function OrderAdjustedBadge({ size = "default" }: { size?: "small" | "default" }) {
  return (
    <Tooltip title="تغيّر الطلب بعد التجهيز (نقص أو إضافة) والمبلغ النهائي مختلف عن الأصلي">
      <Tag
        style={{
          margin: 0,
          border: "1px solid #DB8B1255",
          background: "#DB8B1214",
          color: "#b45309",
          fontWeight: 700,
          borderRadius: 8,
          padding: size === "small" ? "0 6px" : "2px 10px",
          fontSize: size === "small" ? 11 : undefined,
        }}
      >
        ⚠ معدَّل
      </Tag>
    </Tooltip>
  );
}
