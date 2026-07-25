"use client";

import { Alert, Button, Form, Space, Typography } from "antd";
import { QUICK_LINK_PRESETS, summarizeItemLinks } from "./link-target";

const { Text } = Typography;

type Props = {
  itemLabel?: string;
};

/** تطبيق رابط واحد على كل صور المعرض */
export function GalleryBulkLinksPanel({ itemLabel = "صورة" }: Props) {
  const form = Form.useFormInstance();
  const items = (Form.useWatch(["payload", "items"], form) ?? []) as Record<string, unknown>[];
  const stats = summarizeItemLinks(items);

  const applyToAll = (linkType: string, linkValue?: string) => {
    const next = items.map((item) => ({
      ...item,
      linkType,
      linkValue: linkValue ?? "",
    }));
    form.setFieldValue(["payload", "items"], next);
  };

  if (stats.total === 0) {
    return (
      <Alert
        type="info"
        showIcon
        message="أضف صوراً من تبويب المحتوى أولاً"
        style={{ marginBottom: 12 }}
      />
    );
  }

  return (
    <div className="hb-gallery-bulk-links">
      <Alert
        type={stats.linked === stats.total ? "success" : "warning"}
        showIcon
        message={`${stats.linked}/${stats.total} ${itemLabel} مربوطة`}
        style={{ marginBottom: 12 }}
      />
      <Text type="secondary" style={{ display: "block", marginBottom: 8, fontSize: 11, fontWeight: 700 }}>
        تطبيق رابط واحد على كل الصور
      </Text>
      <Space wrap size={[6, 6]}>
        {QUICK_LINK_PRESETS.map((preset) => (
          <Button
            key={preset.id}
            size="small"
            className="hb-quick-link-btn"
            onClick={() => applyToAll(preset.linkType, preset.linkValue)}
          >
            {preset.icon} {preset.label}
          </Button>
        ))}
      </Space>
    </div>
  );
}
