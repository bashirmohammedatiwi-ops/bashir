"use client";

import { Form, Input, InputNumber, Select, Switch } from "antd";
import {
  IMAGE_ASPECT_OPTIONS,
  IMAGE_BORDER_OPTIONS,
  IMAGE_DISPLAY_OPTIONS,
  IMAGE_FIT_OPTIONS,
  IMAGE_OVERLAY_OPTIONS,
  IMAGE_SHAPE_OPTIONS,
  IMAGE_SIZE_OPTIONS,
} from "./image-section-options";
import { ShapePreviewChip } from "./ShapePreviewChip";

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

export const MEDIA_DISPLAY_OPTIONS = IMAGE_DISPLAY_OPTIONS.filter((o) =>
  ["scroll", "marquee", "grid", "stack"].includes(o.value),
).map(({ value, label }) => ({ value, label }));

export const MEDIA_SHAPE_OPTIONS = IMAGE_SHAPE_OPTIONS.slice(0, 5).map(({ value, label }) => ({ value, label }));

export const MEDIA_SIZE_OPTIONS = IMAGE_SIZE_OPTIONS.slice(0, 6).map(({ value, label }) => ({ value, label }));

export function PhotoWallStyleFields({ collage = false }: { collage?: boolean }) {
  return (
    <div className="hb-photo-wall-style">
      <Form.Item name={["payload", "display"]} label="طريقة العرض" initialValue={collage ? "bento" : "scroll"}>
        <Select
          options={IMAGE_DISPLAY_OPTIONS.filter((o) =>
            collage ? ["bento", "mosaic", "grid"].includes(o.value) : true,
          ).map((o) => ({ value: o.value, label: `${o.icon} ${o.label}` }))}
        />
      </Form.Item>
      <Form.Item name={["payload", "shape"]} label="الشكل الافتراضي" initialValue="rounded">
        <Select options={IMAGE_SHAPE_OPTIONS.map((o) => ({ value: o.value, label: `${o.preview} ${o.label}` }))} />
      </Form.Item>
      <ShapePreviewChip name={["payload", "shape"]} />
      <Form.Item name={["payload", "aspectRatio"]} label="نسبة العرض الافتراضية" initialValue="4:3">
        <Select options={IMAGE_ASPECT_OPTIONS.map((o) => ({ value: o.value, label: o.label }))} />
      </Form.Item>
      <Form.Item name={["payload", "size"]} label="الحجم الافتراضي" initialValue="md">
        <Select options={IMAGE_SIZE_OPTIONS.map((o) => ({ value: o.value, label: o.label }))} />
      </Form.Item>
      <Form.Item name={["payload", "itemFit"]} label="ملء الصورة" initialValue="cover">
        <Select options={[...IMAGE_FIT_OPTIONS]} />
      </Form.Item>
      <Form.Item name={["payload", "overlayStyle"]} label="طبقة النص الافتراضية" initialValue="none">
        <Select options={[...IMAGE_OVERLAY_OPTIONS]} />
      </Form.Item>
      <Form.Item name={["payload", "borderStyle"]} label="إطار الصور" initialValue="none">
        <Select options={[...IMAGE_BORDER_OPTIONS]} />
      </Form.Item>
      <Form.Item name={["payload", "height"]} label="ارتفاع الصف (px)" initialValue={160}>
        <InputNumber min={48} max={480} style={{ width: "100%" }} />
      </Form.Item>
      <Form.Item name={["payload", "gap"]} label="المسافة بين الصور" initialValue={12}>
        <InputNumber min={0} max={48} style={{ width: "100%" }} />
      </Form.Item>
      <Form.Item name={["payload", "fullBleed"]} label="ملاصق للحافة" valuePropName="checked">
        <Switch checkedChildren="نعم" unCheckedChildren="لا" />
      </Form.Item>
      <Form.Item name={["payload", "showShadow"]} label="ظل للصور" valuePropName="checked" initialValue>
        <Switch checkedChildren="نعم" unCheckedChildren="لا" />
      </Form.Item>
      <Form.Item noStyle shouldUpdate={(prev, cur) => prev?.payload?.display !== cur?.payload?.display}>
        {({ getFieldValue }) => {
          const display = getFieldValue(["payload", "display"]);
          if (display === "grid" || display === "bento" || display === "mosaic") {
            return (
              <Form.Item name={["payload", "columns"]} label="عدد الأعمدة" initialValue={3}>
                <InputNumber min={2} max={6} style={{ width: "100%" }} />
              </Form.Item>
            );
          }
          if (display === "marquee" || display === "carousel") {
            return (
              <Form.Item name={["payload", "marqueeSpeed"]} label="سرعة الحركة" initialValue={5}>
                <InputNumber min={1} max={15} style={{ width: "100%" }} />
              </Form.Item>
            );
          }
          return null;
        }}
      </Form.Item>
    </div>
  );
}

export function MediaGalleryStyleFields() {
  return <PhotoWallStyleFields />;
}
