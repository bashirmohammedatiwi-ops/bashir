"use client";

import { Form } from "antd";
import { IMAGE_SHAPE_OPTIONS } from "./image-section-options";

type Props = {
  /** مسار Form كامل — مثلاً ["payload", "shape"] */
  name: (string | number)[];
};

/** معاينة بصرية للشكل المختار */
export function ShapePreviewChip({ name }: Props) {
  return (
    <Form.Item noStyle shouldUpdate>
      {({ getFieldValue }) => {
        const shape = getFieldValue(name) as string | undefined;
        const active = shape ?? "rounded";
        return (
          <div className="hb-shape-preview-row" aria-hidden>
            {IMAGE_SHAPE_OPTIONS.map((o) => (
              <span
                key={o.value}
                className={`hb-shape-preview ${active === o.value ? "active" : ""} hb-shape-${o.value}`}
                title={o.label}
              >
                {o.preview}
              </span>
            ))}
          </div>
        );
      }}
    </Form.Item>
  );
}
