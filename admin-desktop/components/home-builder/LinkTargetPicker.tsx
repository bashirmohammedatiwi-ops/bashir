"use client";

import { Form, Input, Select, Space, Typography } from "antd";
import { LINK_TARGET_TYPES, LinkTargetType, PRODUCT_QUERY_PRESETS } from "./link-target";
import { LinkPreviewChip } from "./LinkPreviewChip";
import { QuickLinkBar } from "./QuickLinkBar";

type EntityLists = {
  products?: any[];
  categories?: any[];
  subcategories?: any[];
  tertiary?: any[];
  brands?: any[];
  packages?: any[];
  skinConcerns?: any[];
};

type Props = {
  /** مسار Form — مثلاً ["payload"] أو [] للجذر */
  prefix?: (string | number)[];
  entities: EntityLists;
  showLegacyLink?: boolean;
  optional?: boolean;
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

function productOptions(products: any[]): SearchOption[] {
  return (products ?? []).map((p) => {
    const name = p.name ?? p.id;
    const brand = p.brand?.name ?? "";
    return {
      value: p.slug || p.id,
      label: brand ? `${name} — ${brand}` : name,
      searchLabel: [name, p.slug, p.id, brand, p.sku, p.barcode].filter(Boolean).join(" "),
    };
  });
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

export function LinkTargetPicker({
  prefix = [],
  entities,
  showLegacyLink = false,
  optional = true,
}: Props) {
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
      <Form.Item
        name={namePath(prefix, "linkType")}
        label="نوع الرابط"
        rules={optional ? [] : [{ required: true, message: "اختر نوع الرابط" }]}
      >
        <Select
          allowClear={optional}
          placeholder="ابحث أو اختر نوع الرابط..."
          showSearch
          optionFilterProp="label"
          options={groupedLinkTypes}
        />
      </Form.Item>

      <Form.Item noStyle shouldUpdate>
        {({ getFieldValue }) => {
          const linkType = getFieldValue(namePath(prefix, "linkType")) as string | undefined;
          if (!linkType) return null;

          if (linkType === "offers") {
            return (
              <Typography.Text type="secondary" style={{ display: "block", marginBottom: 12 }}>
                يفتح صفحة العروض والتخفيضات
              </Typography.Text>
            );
          }

          if (linkType === "categoriesTab") {
            return (
              <Typography.Text type="secondary" style={{ display: "block", marginBottom: 12 }}>
                يفتح تبويب الأقسام في شريط التنقل السفلي
              </Typography.Text>
            );
          }

          if (linkType === "product") {
            return (
              <Form.Item name={namePath(prefix, "linkValue")} label="المنتج" rules={[{ required: true }]}>
                <Select
                  showSearch
                  filterOption={filterOption}
                  placeholder="ابحث بالاسم، البراند، أو SKU..."
                  options={productOptions(entities.products ?? [])}
                />
              </Form.Item>
            );
          }

          if (linkType === "category") {
            return (
              <Form.Item name={namePath(prefix, "linkValue")} label="القسم الرئيسي" rules={[{ required: true }]}>
                <Select
                  showSearch
                  filterOption={filterOption}
                  placeholder="ابحث عن قسم رئيسي..."
                  options={categoryOptions(entities.categories ?? [], true)}
                />
              </Form.Item>
            );
          }

          if (linkType === "subcategory") {
            return (
              <Form.Item name={namePath(prefix, "linkValue")} label="القسم الفرعي" rules={[{ required: true }]}>
                <Select
                  showSearch
                  filterOption={filterOption}
                  placeholder="ابحث: قسم › فرعي..."
                  options={subcategoryOptions(entities.subcategories ?? [])}
                />
              </Form.Item>
            );
          }

          if (linkType === "tertiary") {
            return (
              <Form.Item name={namePath(prefix, "linkValue")} label="القسم الثانوي" rules={[{ required: true }]}>
                <Select
                  showSearch
                  filterOption={filterOption}
                  placeholder="ابحث عن قسم ثانوي..."
                  options={simpleOptions(entities.tertiary ?? [])}
                />
              </Form.Item>
            );
          }

          if (linkType === "brand") {
            return (
              <Form.Item name={namePath(prefix, "linkValue")} label="البراند" rules={[{ required: true }]}>
                <Select
                  showSearch
                  filterOption={filterOption}
                  placeholder="ابحث عن براند..."
                  options={simpleOptions(entities.brands ?? [])}
                />
              </Form.Item>
            );
          }

          if (linkType === "package") {
            return (
              <Form.Item name={namePath(prefix, "linkValue")} label="الباقة / الروتين" rules={[{ required: true }]}>
                <Select
                  showSearch
                  filterOption={filterOption}
                  placeholder="ابحث عن باقة..."
                  options={simpleOptions(entities.packages ?? [])}
                />
              </Form.Item>
            );
          }

          if (linkType === "skinConcern") {
            return (
              <Form.Item name={namePath(prefix, "linkValue")} label="مشكلة البشرة" rules={[{ required: true }]}>
                <Select
                  showSearch
                  filterOption={filterOption}
                  options={(entities.skinConcerns ?? []).map((c) => ({
                    value: c.slug || c.id,
                    label: `${c.icon ?? "✨"} ${c.name ?? c.slug ?? c.id}`,
                    searchLabel: [c.name, c.slug, c.id].filter(Boolean).join(" "),
                  }))}
                />
              </Form.Item>
            );
          }

          if (linkType === "search") {
            return (
              <Form.Item name={namePath(prefix, "linkValue")} label="كلمة البحث" rules={[{ required: true }]}>
                <Input placeholder="مثال: فيتامين C" />
              </Form.Item>
            );
          }

          if (linkType === "products") {
            return (
              <>
                <Form.Item label="قالب سريع" style={{ marginBottom: 8 }}>
                  <Select
                    allowClear
                    placeholder="اختر قالباً..."
                    options={PRODUCT_QUERY_PRESETS.map((p) => ({ value: p.value, label: p.label }))}
                    onChange={(v) => v && form.setFieldValue(namePath(prefix, "linkValue"), v)}
                  />
                </Form.Item>
                <Form.Item
                  name={namePath(prefix, "linkValue")}
                  label="معاملات قائمة المنتجات"
                  rules={[{ required: true }]}
                  extra="أو عدّل يدوياً: isPromo=1&categoryId=xxx"
                >
                  <Input placeholder="isPromo=1&brandId=..." dir="ltr" />
                </Form.Item>
              </>
            );
          }

          return (
            <Form.Item
              name={namePath(prefix, "linkValue")}
              label="المسار"
              rules={[{ required: true }]}
              extra="مثال: /products?isNew=1"
            >
              <Input placeholder="/products?isFeatured=1" />
            </Form.Item>
          );
        }}
      </Form.Item>

      {showLegacyLink && (
        <Form.Item name={namePath(prefix, "link")} label="رابط قديم (اختياري)">
          <Input placeholder="/products?isPromo=1" />
        </Form.Item>
      )}

      <LinkPreviewChip prefix={prefix} entities={entities} />
    </div>
  );
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
