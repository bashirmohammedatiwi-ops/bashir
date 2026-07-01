"use client";

import { Form, Input, InputNumber, Select, Switch } from "antd";

const LAYOUT_OPTIONS = [
  { value: "overlap", label: "متداخل (دوائر فوق البنر)" },
  { value: "below", label: "تحت البنر" },
  { value: "tiles", label: "بلاطات أفقية" },
  { value: "grid", label: "شبكة مربعة" },
];

export function SectionStyleFields({ showLayout = false }: { showLayout?: boolean }) {
  return (
    <>
      <Form.Item name={["payload", "backgroundColor"]} label="لون خلفية القسم" extra="مثال: #FFFFFF">
        <Input placeholder="#FFFFFF أو فارغ" />
      </Form.Item>
      <Form.Item name={["payload", "paddingTop"]} label="مسافة علوية (px)">
        <InputNumber min={0} max={48} style={{ width: "100%" }} placeholder="افتراضي" />
      </Form.Item>
      <Form.Item name={["payload", "paddingBottom"]} label="مسافة سفلية (px)">
        <InputNumber min={0} max={48} style={{ width: "100%" }} placeholder="افتراضي" />
      </Form.Item>
      {showLayout && (
        <Form.Item name={["payload", "layout"]} label="تخطيط العرض">
          <Select options={LAYOUT_OPTIONS} allowClear placeholder="افتراضي" />
        </Form.Item>
      )}
      <Form.Item name={["payload", "showViewAll"]} label="زر «عرض الكل»" valuePropName="checked">
        <Switch />
      </Form.Item>
    </>
  );
}
