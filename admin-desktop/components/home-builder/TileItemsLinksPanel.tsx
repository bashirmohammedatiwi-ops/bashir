"use client";

import { Alert, Button, Collapse, Form, Space, Typography } from "antd";
import { LinkTargetPicker } from "./LinkTargetPicker";
import { QUICK_LINK_PRESETS, summarizeItemLinks } from "./link-target";

const { Text } = Typography;

type EntityLists = Parameters<typeof LinkTargetPicker>[0]["entities"];

type Props = {
  entities: EntityLists;
  itemLabel?: string;
};

export function TileItemsLinksPanel({ entities, itemLabel = "عنصر" }: Props) {
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

  return (
    <div className="hb-tile-links-panel">
      <Alert
        type={stats.total > 0 && stats.linked === stats.total ? "success" : stats.total > 0 ? "warning" : "info"}
        showIcon
        message={`🔗 روابط ${itemLabel}: ${stats.linked}/${stats.total || 0}`}
        description={
          stats.total === 0
            ? "أضف عناصر من تبويب «المحتوى» أولاً — ثم عد هنا لربطها بسرعة."
            : stats.linked < stats.total
              ? `${stats.total - stats.linked} عنصر بدون رابط — الضغط لن يفعل شيئاً`
              : "كل العناصر مربوطة ✓"
        }
        style={{ marginBottom: 12 }}
      />

      {stats.total > 0 && (
        <>
          <Text type="secondary" style={{ display: "block", marginBottom: 8, fontSize: 11, fontWeight: 700 }}>
            تطبيق رابط واحد على الكل
          </Text>
          <Space wrap size={[6, 6]} style={{ marginBottom: 16 }}>
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

          <Collapse
            accordion
            size="small"
            className="hb-tile-links-collapse"
            items={items.map((item, i) => {
              const hasLink = Boolean(item?.linkType || item?.link);
              const title = item?.title ? String(item.title).slice(0, 28) : "";
              return {
                key: String(i),
                label: (
                  <span className={hasLink ? "hb-tile-link-ok" : "hb-tile-link-missing"}>
                    {itemLabel} {i + 1}
                    {title ? ` · ${title}` : ""}
                    {hasLink ? " ✓" : " ⚠️"}
                  </span>
                ),
                children: (
                  <LinkTargetPicker prefix={["payload", "items", i]} entities={entities} optional={false} />
                ),
              };
            })}
          />
        </>
      )}
    </div>
  );
}
