"use client";

import { Button, Form, Space, Typography } from "antd";
import { QUICK_LINK_PRESETS } from "./link-target";

const { Text } = Typography;

type Props = {
  prefix?: (string | number)[];
};

function fieldPath(prefix: (string | number)[], field: string): (string | number)[] {
  return prefix.length ? [...prefix, field] : [field];
}

export function QuickLinkBar({ prefix = [] }: Props) {
  const form = Form.useFormInstance();

  return (
    <div className="hb-quick-links">
      <Text type="secondary" className="hb-quick-links-title">
        روابط سريعة
      </Text>
      <Space wrap size={[6, 6]}>
        {QUICK_LINK_PRESETS.map((preset) => (
          <Button
            key={preset.id}
            size="small"
            className="hb-quick-link-btn"
            onClick={() => {
              form.setFieldValue(fieldPath(prefix, "linkType"), preset.linkType);
              form.setFieldValue(fieldPath(prefix, "linkValue"), preset.linkValue ?? "");
            }}
          >
            {preset.icon} {preset.label}
          </Button>
        ))}
      </Space>
    </div>
  );
}
