"use client";

import { Form, Input, Space, Typography } from "antd";
import { VIEW_ALL_PRESETS } from "./link-target";

const { Text } = Typography;

type Props = {
  defaultQuery?: string;
};

export function ViewAllPicker({ defaultQuery }: Props) {
  const form = Form.useFormInstance();
  const value = Form.useWatch(["payload", "viewAllQuery"], form) as string | undefined;
  const effective = value ?? defaultQuery ?? "";
  const previewPath = effective.startsWith("/")
    ? effective
    : effective
      ? `/products?${effective}`
      : "(يُبنى تلقائياً من فلتر القسم)";

  return (
    <div className="hb-view-all-picker">
      <Text type="secondary" style={{ display: "block", marginBottom: 8, fontSize: 12 }}>
        قوالب جاهزة — أو اكتب query / مسار مخصص
      </Text>
      <Space wrap size={[6, 6]} style={{ marginBottom: 10 }}>
        {VIEW_ALL_PRESETS.filter((p) => p.value !== "").map((preset) => (
          <button
            key={preset.value}
            type="button"
            className={`hb-view-all-chip${value === preset.value ? " active" : ""}`}
            onClick={() => form.setFieldValue(["payload", "viewAllQuery"], preset.value)}
          >
            {preset.label}
          </button>
        ))}
        <button
          type="button"
          className="hb-view-all-chip"
          onClick={() => form.setFieldValue(["payload", "viewAllQuery"], undefined)}
        >
          تلقائي
        </button>
      </Space>
      <Form.Item
        name={["payload", "viewAllQuery"]}
        label="Query أو مسار (اختياري)"
        extra="مثال: isPromo=1&title=العروض — أو /brands"
      >
        <Input dir="ltr" placeholder={defaultQuery ?? "اتركه فارغاً للافتراضي"} allowClear />
      </Form.Item>
      <Text type="secondary" className="hb-link-preview-path" dir="ltr">
        → {previewPath}
      </Text>
    </div>
  );
}
