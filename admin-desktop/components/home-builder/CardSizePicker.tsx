"use client";

import { Typography } from "antd";
import {
  CARD_SIZES,
  CardSizeContext,
  CardSizeId,
  sizesForContext,
} from "./card-sizes";

const { Text } = Typography;

type Props = {
  value?: CardSizeId | string;
  onChange?: (v: CardSizeId) => void;
  context?: CardSizeContext;
  compact?: boolean;
};

export function CardSizePicker({ value, onChange, context = "category", compact }: Props) {
  const options = sizesForContext(context);
  const selected = (value as CardSizeId) || "md";

  return (
    <div className={`hb-card-sizes${compact ? " compact" : ""}`}>
      {options.map((size) => {
        const active = selected === size.value;
        return (
          <button
            key={size.value}
            type="button"
            className={`hb-card-size-opt${active ? " active" : ""}`}
            onClick={() => onChange?.(size.value)}
            title={size.description}
          >
            <span
              className="hb-card-size-preview"
              style={{
                width: size.previewW,
                height: size.previewH,
              }}
            />
            <Text className="hb-card-size-label">{size.short}</Text>
            {!compact && (
              <Text type="secondary" className="hb-card-size-desc">
                {size.label}
              </Text>
            )}
          </button>
        );
      })}
    </div>
  );
}

export function CardSizeLegend() {
  return (
    <div className="hb-card-size-legend">
      {CARD_SIZES.slice(0, 5).map((s) => (
        <span key={s.value}>
          <strong>{s.short}</strong> {s.label}
        </span>
      ))}
    </div>
  );
}
