"use client";

import { Form, Typography } from "antd";
import { buildAppLinkPath, linkTargetLabel } from "./link-target";

const { Text } = Typography;

type EntityLists = {
  products?: any[];
  categories?: any[];
  subcategories?: any[];
  tertiary?: any[];
  brands?: any[];
  packages?: any[];
  skinConcerns?: any[];
};

function namePath(prefix: (string | number)[], field: string) {
  return prefix.length ? [...prefix, field] : field;
}

export function LinkPreviewChip({
  prefix = [],
  entities,
  legacyLink,
}: {
  prefix?: (string | number)[];
  entities?: EntityLists;
  legacyLink?: string | null;
}) {
  const form = Form.useFormInstance();
  const linkType = Form.useWatch(namePath(prefix, "linkType"), form);
  const linkValue = Form.useWatch(namePath(prefix, "linkValue"), form);
  const legacy = legacyLink ?? Form.useWatch(namePath(prefix, "link"), form);

  const path = buildAppLinkPath(linkType, linkValue, legacy);
  const label = linkTargetLabel(linkType, linkValue, entities);

  if (!linkType && !legacy) {
    return (
      <div className="hb-link-preview hb-link-preview--empty">
        <Text type="secondary">⚠️ بدون رابط — الضغط لن يفعل شيئاً</Text>
      </div>
    );
  }

  return (
    <div className="hb-link-preview">
      <Text className="hb-link-preview-label">{label}</Text>
      {path ? (
        <Text code className="hb-link-preview-path" dir="ltr">
          {path}
        </Text>
      ) : (
        <Text type="warning">أكمل اختيار الهدف</Text>
      )}
    </div>
  );
}
