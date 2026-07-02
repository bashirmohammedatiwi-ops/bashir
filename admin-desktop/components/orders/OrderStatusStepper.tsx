"use client";

import { CheckOutlined } from "@ant-design/icons";
import { STATUS_COLORS, STATUS_FLOW, STATUS_LABELS } from "./order-utils";

export function OrderStatusStepper({ status }: { status: string }) {
  if (status === "CANCELLED" || status === "REFUNDED") {
    const color = STATUS_COLORS[status] ?? "#94a3b8";
    return (
      <div className="ord-stepper ord-stepper--terminal" style={{ borderColor: `${color}33` }}>
        <span className="ord-stepper-terminal-dot" style={{ background: color }} />
        <span style={{ color, fontWeight: 700 }}>{STATUS_LABELS[status] ?? status}</span>
      </div>
    );
  }

  const currentIdx = STATUS_FLOW.indexOf(status);

  return (
    <div className="ord-stepper">
      {STATUS_FLOW.map((step, i) => {
        const done = i <= currentIdx;
        const active = i === currentIdx;
        const color = STATUS_COLORS[step] ?? "#94a3b8";
        return (
          <div key={step} className={`ord-step${done ? " done" : ""}${active ? " active" : ""}`}>
            <div
              className="ord-step-dot"
              style={{
                background: done ? color : "#fff",
                borderColor: done ? color : "#e2e8f0",
                color: done ? "#fff" : "#94a3b8",
              }}
            >
              {done ? <CheckOutlined style={{ fontSize: 10 }} /> : i + 1}
            </div>
            <span className="ord-step-label" style={{ color: active ? color : done ? "#334155" : "#94a3b8" }}>
              {STATUS_LABELS[step]}
            </span>
            {i < STATUS_FLOW.length - 1 && (
              <div className="ord-step-line" style={{ background: i < currentIdx ? color : "#e2e8f0" }} />
            )}
          </div>
        );
      })}
    </div>
  );
}
