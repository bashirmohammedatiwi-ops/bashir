"use client";

import { Form, Input, Select, Space, Typography } from "antd";
import { LINK_TARGET_TYPES, LinkTargetType, PRODUCT_QUERY_PRESETS } from "./link-target";
import { LinkPreviewChip } from "./LinkPreviewChip";
import { QuickLinkBar } from "./QuickLinkBar";
import { ProductSearchSelect } from "./ProductSearchSelect";

type EntityLists = {
  products?: any[];
  categories?: any[];
  subcategories?: any[];
  tertiary?: any[];
  brands?: any[];
  packages?: any[];
  skinConcerns?: any[];
};

type SearchOption = {
  value: string;
  label: string;
  searchLabel?: string;
};

const LINK_GROUPS: { label: string; types: LinkTargetType[] }[] = [
  { label: "تسوق", types: ["product", "brand", "package", "offers"] },
  { label: "أقسام", types: ["category", "subcategory", "tertiary", "categoriesTab"] },
  { label: "اكتشاف", types: ["search", "skinConcern", "products"] },
  { label: "متقدم", types: ["url"] },
];

function namePath(prefix: (string | number)[], field: string) {
  return prefix.length ? [...prefix, field] : field;
}

function filterOption(input: string, option?: SearchOption) {
  const q = input.toLowerCase().trim();
  if (!q) return true;
  const hay = (option?.searchLabel ?? option?.label ?? "").toString().toLowerCase();
  return hay.includes(q);
}

function categoryOptions(categories: any[], rootsOnly = false): SearchOption[] {
  return (categories ?? [])
    .filter((c) => !rootsOnly || !c.parentId)
    .map((c) => ({
      value: c.id,
      label: c.name ?? c.id,
      searchLabel: [c.name, c.slug, c.id].filter(Boolean).join(" "),
    }));
}

function subcategoryOptions(subcategories: any[]): SearchOption[] {
  return (subcategories ?? []).map((c) => ({
    value: c.id,
    label: c.parent?.name ? `${c.parent.name} › ${c.name}` : (c.name ?? c.id),
    searchLabel: [c.parent?.name, c.name, c.slug, c.id].filter(Boolean).join(" "),
  }));
}

function simpleOptions(items: any[], extra?: (item: any) => string): SearchOption[] {
  return (items ?? []).map((item) => {
    const name = item.name ?? item.slug ?? item.id;
    return {
      value: item.slug || item.id,
      label: extra ? extra(item) : name,
      searchLabel: [name, item.slug, item.id].filter(Boolean).join(" "),
    };
  });
}

export function ProductScopeFields({ prefix = ["payload"], entities }: { prefix?: string[]; entities: EntityLists }) {
  return (
    <Space direction="vertical" style={{ width: "100%" }} size={0}>
      <Typography.Text type="secondary" style={{ display: "block", marginBottom: 8 }}>
        تصفية إضافية (اختياري) — حدّد قسم أو براند لعرض منتجاته فقط
      </Typography.Text>
      <Form.Item name={[...prefix, "categoryId"]} label="قسم رئيسي">
        <Select
          allowClear
          showSearch
          filterOption={filterOption}
          placeholder="كل الأقسام"
          options={categoryOptions(entities.categories ?? [], true)}
        />
      </Form.Item>
      <Form.Item name={[...prefix, "subcategoryId"]} label="قسم فرعي">
        <Select
          allowClear
          showSearch
          filterOption={filterOption}
          options={subcategoryOptions(entities.subcategories ?? [])}
        />
      </Form.Item>
      <Form.Item name={[...prefix, "tertiaryCategoryId"]} label="قسم ثانوي">
        <Select
          allowClear
          showSearch
          filterOption={filterOption}
          options={simpleOptions(entities.tertiary ?? [])}
        />
      </Form.Item>
      <Form.Item name={[...prefix, "brandId"]} label="براند">
        <Select
          allowClear
          showSearch
          filterOption={filterOption}
          options={simpleOptions(entities.brands ?? [])}
        />
      </Form.Item>
    </Space>
  );
}

/** النسخة القديمة — للمرجع فقط */
export function LegacyManualLinkPicker({
  prefix = [],
  entities,
  showLegacyLink = false,
  optional = true,
}: {
  prefix?: (string | number)[];
  entities: EntityLists;
  showLegacyLink?: boolean;
  optional?: boolean;
}) {
  const form = Form.useFormInstance();
  const groupedLinkTypes = LINK_GROUPS.map((g) => ({
    label: g.label,
    options: LINK_TARGET_TYPES.filter((t) => g.types.includes(t.value)).map((t) => ({
      value: t.value,
      label: `${t.icon} ${t.label}`,
    })),
  }));

  return (
    <div className="hb-link-picker">
      <QuickLinkBar prefix={prefix} />
      <Form.Item name={namePath(prefix, "linkType")} label="نوع الرابط">
        <Select allowClear={optional} showSearch optionFilterProp="label" options={groupedLinkTypes} />
      </Form.Item>
      <Form.Item noStyle shouldUpdate>
        {({ getFieldValue }) => {
          const linkType = getFieldValue(namePath(prefix, "linkType")) as string | undefined;
          if (!linkType) return null;
          if (linkType === "product") {
            return (
              <Form.Item name={namePath(prefix, "linkValue")} label="المنتج">
                <ProductSearchSelect seedProducts={entities.products ?? []} />
              </Form.Item>
            );
          }
          if (linkType === "products") {
            return (
              <Form.Item name={namePath(prefix, "linkValue")} label="query">
                <Input dir="ltr" />
              </Form.Item>
            );
          }
          return (
            <Form.Item name={namePath(prefix, "linkValue")} label="القيمة">
              <Input />
            </Form.Item>
          );
        }}
      </Form.Item>
      {showLegacyLink && (
        <Form.Item name={namePath(prefix, "link")} label="رابط قديم">
          <Input />
        </Form.Item>
      )}
      <LinkPreviewChip prefix={prefix} entities={entities} />
    </div>
  );
}
