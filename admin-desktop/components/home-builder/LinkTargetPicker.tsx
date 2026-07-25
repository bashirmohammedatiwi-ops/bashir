"use client";

import { Form, Input } from "antd";
import { SmartLinkPicker } from "./SmartLinkPicker";

type EntityLists = Parameters<typeof SmartLinkPicker>[0]["entities"];

type Props = {
  prefix?: (string | number)[];
  entities: EntityLists;
  showLegacyLink?: boolean;
  optional?: boolean;
};

/** واجهة الربط الموحّدة — بحث ذكي في كل أقسام بناء الصفحة */
export function LinkTargetPicker({
  prefix = [],
  entities,
  showLegacyLink = false,
  optional = true,
}: Props) {
  return (
    <div className="hb-link-picker">
      <SmartLinkPicker
        prefix={prefix}
        entities={entities}
        optional={optional}
        showAdvanced
        showPreview
        showQuickBar
      />
      {showLegacyLink && (
        <Form.Item name={prefix.length ? [...prefix, "link"] : "link"} label="رابط قديم (اختياري)">
          <Input placeholder="/products?isPromo=1" />
        </Form.Item>
      )}
    </div>
  );
}

export { ProductScopeFields } from "./LinkTargetPickerLegacy";
