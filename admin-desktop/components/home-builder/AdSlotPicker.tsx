"use client";

import { Typography } from "antd";
import { AD_SLOTS, AdSlotId } from "./ad-slots";

const { Text } = Typography;

type Props = {
  value?: AdSlotId | string;
  onChange?: (v: AdSlotId) => void;
  compact?: boolean;
  /** عرض مجموعة فرعية فقط */
  filter?: (slot: (typeof AD_SLOTS)[number]) => boolean;
};

export function AdSlotPicker({ value, onChange, compact, filter }: Props) {
  const options = filter ? AD_SLOTS.filter(filter) : AD_SLOTS;
  const selected = (value as AdSlotId) || "wide";

  return (
    <div className={`hb-ad-slots${compact ? " compact" : ""}`}>
      {options.map((slot) => {
        const active = selected === slot.id;
        return (
          <button
            key={slot.id}
            type="button"
            className={`hb-ad-slot-opt${active ? " active" : ""}${slot.fullBleed ? " full-bleed" : ""}`}
            onClick={() => onChange?.(slot.id)}
            title={slot.description}
          >
            <Text className="hb-ad-slot-ratio">{slot.ratioLabel}</Text>
            <span
              className="hb-ad-slot-preview"
              style={{ width: slot.previewW, height: slot.previewH }}
            />
            <Text className="hb-ad-slot-label">{slot.label}</Text>
            {!compact && (
              <Text type="secondary" className="hb-ad-slot-desc">
                {slot.description}
              </Text>
            )}
          </button>
        );
      })}
    </div>
  );
}

export function AdSlotLegend() {
  return (
    <div className="hb-ad-slot-legend">
      {AD_SLOTS.slice(0, 6).map((s) => (
        <span key={s.id}>
          <strong>{s.ratioLabel}</strong> {s.label}
        </span>
      ))}
    </div>
  );
}
