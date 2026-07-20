"use client";

import { Form, Input, InputNumber, Select, Switch } from "antd";

const FRAME_PRESETS = [
  { label: "كريمي ناعم", value: "#F8F4EF" },
  { label: "وردي خفيف", value: "#FCE4EC" },
  { label: "أخضر زيتي", value: "#E8EFE4" },
  { label: "بنفسجي", value: "#EDE7F6" },
  { label: "أزرق فاتح", value: "#E3F2FD" },
  { label: "ذهبي", value: "#FFF8E7" },
  { label: "أبيض", value: "#FFFFFF" },
];

export function FrameStyleFields() {
  return (
    <div className="hb-frame-fields">
      <Form.Item name={["payload", "backgroundColor"]} label="لون الخلفية">
        <Input placeholder="#F8F4EF" addonBefore="HEX" />
      </Form.Item>
      <div className="hb-color-chips">
        {FRAME_PRESETS.map((c) => (
          <Form.Item noStyle shouldUpdate key={c.value}>
            {({ setFieldValue, getFieldValue }) => (
              <button
                type="button"
                className={`hb-color-chip${getFieldValue(["payload", "backgroundColor"]) === c.value ? " active" : ""}`}
                style={{ background: c.value }}
                title={c.label}
                onClick={() => setFieldValue(["payload", "backgroundColor"], c.value)}
              />
            )}
          </Form.Item>
        ))}
      </div>
      <Form.Item name={["payload", "titleColor"]} label="لون العنوان">
        <Input placeholder="#2A2826" />
      </Form.Item>
      <Form.Item name={["payload", "borderColor"]} label="لون الإطار (اختياري)">
        <Input placeholder="اتركه فارغاً بدون حد" />
      </Form.Item>
      <Form.Item name={["payload", "borderRadius"]} label="استدارة الزوايا">
        <InputNumber min={0} max={40} addonAfter="px" style={{ width: "100%" }} />
      </Form.Item>
      <Form.Item name={["payload", "paddingTop"]} label="حشوة علوية">
        <InputNumber min={0} max={48} style={{ width: "100%" }} />
      </Form.Item>
      <Form.Item name={["payload", "paddingBottom"]} label="حشوة سفلية">
        <InputNumber min={0} max={48} style={{ width: "100%" }} />
      </Form.Item>
      <Form.Item name={["payload", "paddingH"]} label="حشوة أفقية">
        <InputNumber min={0} max={32} style={{ width: "100%" }} />
      </Form.Item>
      <Form.Item name={["payload", "shadow"]} label="ظل ناعم" valuePropName="checked">
        <Switch checkedChildren="نعم" unCheckedChildren="لا" />
      </Form.Item>
    </div>
  );
}

export const MEDIA_DISPLAY_OPTIONS = [
  { value: "scroll", label: "تمرير يدوي — سحب أفقي" },
  { value: "marquee", label: "متحرك تلقائياً (marquee)" },
  { value: "grid", label: "شبكة ثابتة" },
  { value: "stack", label: "عمود — صور كاملة العرض" },
];

export const MEDIA_SHAPE_OPTIONS = [
  { value: "rect", label: "مستطيل" },
  { value: "rounded", label: "زوايا ناعمة" },
  { value: "circle", label: "دائرة" },
  { value: "pill", label: "كapsule / pill" },
  { value: "banner", label: "بانر عريض 16:9" },
];

export const MEDIA_SIZE_OPTIONS = [
  { value: "xs", label: "صغير جداً (72)" },
  { value: "sm", label: "صغير (96)" },
  { value: "md", label: "متوسط (128)" },
  { value: "lg", label: "كبير (160)" },
  { value: "xl", label: "كبير جداً (200)" },
  { value: "full", label: "كامل العرض" },
];
