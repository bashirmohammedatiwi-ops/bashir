"use client";

import { Col, Form, InputNumber, Row, Select } from "antd";
import {
  IMAGE_ASPECT_OPTIONS,
  IMAGE_BORDER_OPTIONS,
  IMAGE_OVERLAY_OPTIONS,
  IMAGE_SHAPE_OPTIONS,
  IMAGE_SIZE_OPTIONS,
} from "./image-section-options";
import { ShapePreviewChip } from "./ShapePreviewChip";

type Props = {
  /** مسار Form للعنصر — مثلاً ["payload", "items", 0] */
  prefix: (string | number)[];
  collage?: boolean;
  /** عند true لا تُعرض الحقول الفارغة كتجاوز */
  optional?: boolean;
};

function field(prefix: (string | number)[], name: string) {
  return [...prefix, name];
}

/** حقول شكل/حجم/إطار لصورة واحدة — تتجاوز افتراضيات القسم */
export function PhotoItemStyleFields({ prefix, collage = false, optional = true }: Props) {
  return (
    <div className="hb-photo-item-style">
      <Row gutter={12}>
        <Col xs={24} sm={8}>
          <Form.Item name={field(prefix, "shape")} label="الشكل">
            <Select
              allowClear={optional}
              placeholder="افتراضي القسم"
              options={IMAGE_SHAPE_OPTIONS.map((o) => ({
                value: o.value,
                label: `${o.preview} ${o.label}`,
              }))}
            />
          </Form.Item>
          <ShapePreviewChip name={field(prefix, "shape")} />
        </Col>
        <Col xs={24} sm={8}>
          <Form.Item name={field(prefix, "aspectRatio")} label="النسبة">
            <Select
              allowClear={optional}
              placeholder="افتراضي القسم"
              options={IMAGE_ASPECT_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
            />
          </Form.Item>
        </Col>
        <Col xs={24} sm={8}>
          <Form.Item name={field(prefix, "size")} label="الحجم">
            <Select
              allowClear={optional}
              placeholder="افتراضي القسم"
              options={IMAGE_SIZE_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
            />
          </Form.Item>
        </Col>
      </Row>

      <Form.Item noStyle shouldUpdate>
        {({ getFieldValue }) =>
          getFieldValue(field(prefix, "aspectRatio")) === "custom" ? (
            <Row gutter={12}>
              <Col span={12}>
                <Form.Item name={field(prefix, "customWidth")} label="عرض (px)">
                  <InputNumber min={40} max={900} style={{ width: "100%" }} placeholder="مثال: 180" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name={field(prefix, "customHeight")} label="ارتفاع (px)">
                  <InputNumber min={40} max={900} style={{ width: "100%" }} placeholder="مثال: 240" />
                </Form.Item>
              </Col>
            </Row>
          ) : null
        }
      </Form.Item>

      {collage && (
        <Row gutter={12}>
          <Col span={12}>
            <Form.Item name={field(prefix, "spanCols")} label="امتداد أعمدة">
              <InputNumber min={1} max={4} style={{ width: "100%" }} placeholder="1" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name={field(prefix, "spanRows")} label="امتداد صفوف">
              <InputNumber min={1} max={3} style={{ width: "100%" }} placeholder="1" />
            </Form.Item>
          </Col>
        </Row>
      )}

      <Row gutter={12}>
        <Col xs={24} sm={12}>
          <Form.Item name={field(prefix, "overlayStyle")} label="طبقة النص">
            <Select allowClear={optional} placeholder="افتراضي" options={[...IMAGE_OVERLAY_OPTIONS]} />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12}>
          <Form.Item name={field(prefix, "borderStyle")} label="الإطار">
            <Select allowClear={optional} placeholder="افتراضي" options={[...IMAGE_BORDER_OPTIONS]} />
          </Form.Item>
        </Col>
      </Row>
    </div>
  );
}
