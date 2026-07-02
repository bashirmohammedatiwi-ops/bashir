"use client";

import { Form, Select, Switch } from "antd";

export function SectionStyleFields({ showLayout = false }: { showLayout?: boolean }) {
  return (
    <>
      {showLayout && (
        <Form.Item name={["payload", "layout"]} label="تخطيط العرض (قديم)">
          <Select
            options={[
              { value: "overlap", label: "متداخل (دوائر فوق البنر)" },
              { value: "below", label: "تحت البنر" },
              { value: "tiles", label: "بلاطات أفقية" },
              { value: "grid", label: "شبكة مربعة" },
            ]}
            allowClear
            placeholder="افتراضي"
          />
        </Form.Item>
      )}
      <Form.Item name={["payload", "showViewAll"]} label="زر «عرض الكل»" valuePropName="checked">
        <Switch />
      </Form.Item>
    </>
  );
}
