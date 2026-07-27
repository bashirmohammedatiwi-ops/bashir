"use client";

import { Button, Form, Input, Select, Space, Typography } from "antd";
import {
  LINK_TARGET_TYPES,
  LinkTargetType,
  PRODUCT_QUERY_PRESETS,
} from "./link-target";
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

type Props = {
  prefix?: (string | number)[];
  entities: EntityLists;
  optional?: boolean;
};

const LINK_GROUPS: { label: string; types: LinkTargetType[] }[] = [
  { label: "تسوق", types: ["product", "brand", "package", "offers"] },
  { label: "أقسام", types: ["category", "subcategory", "tertiary", "categoriesTab"] },
  { label: "اكتشاف", types: ["search", "skinConcern", "products"] },
  { label: "متقدم", types: ["url"] },
];

const NO_VALUE_TYPES = new Set<LinkTargetType>(["offers", "categoriesTab"]);

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

function ProductsQueryField({ prefix }: { prefix: (string | number)[] }) {
  const form = Form.useFormInstance();
  return (
    <Form.Item label="قائمة المنتجات" required>
      <Space direction="vertical" style={{ width: "100%" }} size={8}>
        <Select
          allowClear
          placeholder="قوالب جاهزة (اختياري)"
          options={PRODUCT_QUERY_PRESETS.map((p) => ({ value: p.value, label: p.label }))}
          onChange={(v) => form.setFieldValue(namePath(prefix, "linkValue"), v ?? undefined)}
        />
        <Form.Item
          name={namePath(prefix, "linkValue")}
          noStyle
          rules={[{ required: true, message: "اختر قالباً أو اكتب التصفية" }]}
        >
          <Input dir="ltr" placeholder="isPromo=1&title=العروض" allowClear />
        </Form.Item>
        <Space wrap size={[4, 4]}>
          {PRODUCT_QUERY_PRESETS.map((p) => (
            <Button
              key={p.value}
              size="small"
              type="dashed"
              onClick={() => form.setFieldValue(namePath(prefix, "linkValue"), p.value)}
            >
              {p.label}
            </Button>
          ))}
        </Space>
      </Space>
    </Form.Item>
  );
}

function LinkValueField({
  linkType,
  prefix,
  entities,
}: {
  linkType: LinkTargetType;
  prefix: (string | number)[];
  entities: EntityLists;
}) {
  if (NO_VALUE_TYPES.has(linkType)) {
    return (
      <Typography.Text type="secondary" style={{ fontSize: 12 }}>
        لا حاجة لاختيار هدف — الرابط جاهز تلقائياً
      </Typography.Text>
    );
  }

  if (linkType === "product") {
    return (
      <Form.Item name={namePath(prefix, "linkValue")} label="اختر المنتج" rules={[{ required: true, message: "اختر منتجاً" }]}>
        <ProductSearchSelect seedProducts={entities.products ?? []} placeholder="ابحث بالاسم أو SKU أو الباركود" />
      </Form.Item>
    );
  }

  if (linkType === "category") {
    return (
      <Form.Item name={namePath(prefix, "linkValue")} label="اختر القسم الرئيسي" rules={[{ required: true, message: "اختر قسماً" }]}>
        <Select
          allowClear
          showSearch
          filterOption={filterOption}
          placeholder="كل الأقسام الرئيسية"
          options={categoryOptions(entities.categories ?? [], true)}
        />
      </Form.Item>
    );
  }

  if (linkType === "subcategory") {
    return (
      <Form.Item name={namePath(prefix, "linkValue")} label="اختر القسم الفرعي" rules={[{ required: true, message: "اختر قسماً فرعياً" }]}>
        <Select
          allowClear
          showSearch
          filterOption={filterOption}
          placeholder="كل الأقسام الفرعية"
          options={subcategoryOptions(entities.subcategories ?? [])}
        />
      </Form.Item>
    );
  }

  if (linkType === "tertiary") {
    return (
      <Form.Item name={namePath(prefix, "linkValue")} label="اختر القسم الثانوي" rules={[{ required: true, message: "اختر قسماً ثانوياً" }]}>
        <Select
          allowClear
          showSearch
          filterOption={filterOption}
          placeholder="كل الأقسام الثانوية"
          options={simpleOptions(entities.tertiary ?? [])}
        />
      </Form.Item>
    );
  }

  if (linkType === "brand") {
    return (
      <Form.Item name={namePath(prefix, "linkValue")} label="اختر البراند" rules={[{ required: true, message: "اختر برانداً" }]}>
        <Select
          allowClear
          showSearch
          filterOption={filterOption}
          placeholder="كل البراندات"
          options={simpleOptions(entities.brands ?? [])}
        />
      </Form.Item>
    );
  }

  if (linkType === "package") {
    return (
      <Form.Item name={namePath(prefix, "linkValue")} label="اختر الباقة / الروتين" rules={[{ required: true, message: "اختر باقة" }]}>
        <Select
          allowClear
          showSearch
          filterOption={filterOption}
          placeholder="كل الباقات"
          options={simpleOptions(entities.packages ?? [])}
        />
      </Form.Item>
    );
  }

  if (linkType === "skinConcern") {
    return (
      <Form.Item name={namePath(prefix, "linkValue")} label="اختر مشكلة البشرة" rules={[{ required: true, message: "اختر مشكلة بشرة" }]}>
        <Select
          allowClear
          showSearch
          filterOption={filterOption}
          placeholder="كل مشاكل البشرة"
          options={simpleOptions(entities.skinConcerns ?? [])}
        />
      </Form.Item>
    );
  }

  if (linkType === "search") {
    return (
      <Form.Item name={namePath(prefix, "linkValue")} label="كلمة البحث" rules={[{ required: true, message: "أدخل كلمة البحث" }]}>
        <Input placeholder="مثال: كريم واقي شمس" allowClear />
      </Form.Item>
    );
  }

  if (linkType === "products") {
    return <ProductsQueryField prefix={prefix} />;
  }

  if (linkType === "url") {
    return (
      <Form.Item name={namePath(prefix, "linkValue")} label="المسار داخل التطبيق" rules={[{ required: true, message: "أدخل المسار" }]}>
        <Input dir="ltr" placeholder="/brands أو /products?isNew=1" allowClear />
      </Form.Item>
    );
  }

  return null;
}

/** ربط متدرج: نوع الرابط → اختيار الهدف */
export function CascadingLinkPicker({ prefix = [], entities, optional = true }: Props) {
  const form = Form.useFormInstance();
  const groupedLinkTypes = LINK_GROUPS.map((g) => ({
    label: g.label,
    options: LINK_TARGET_TYPES.filter((t) => g.types.includes(t.value)).map((t) => ({
      value: t.value,
      label: `${t.icon} ${t.label}`,
    })),
  }));

  const onTypeChange = (linkType: LinkTargetType | null) => {
    form.setFieldValue(namePath(prefix, "link"), undefined);
    if (!linkType || NO_VALUE_TYPES.has(linkType)) {
      form.setFieldValue(namePath(prefix, "linkValue"), linkType ? "" : undefined);
    } else {
      form.setFieldValue(namePath(prefix, "linkValue"), undefined);
    }
  };

  return (
    <div className="hb-cascading-link">
      <Form.Item name={namePath(prefix, "linkType")} label="نوع الرابط">
        <Select
          allowClear={optional}
          showSearch
          optionFilterProp="label"
          placeholder="اختر نوع الربط"
          options={groupedLinkTypes}
          onChange={onTypeChange}
        />
      </Form.Item>

      <Form.Item noStyle shouldUpdate>
        {({ getFieldValue }) => {
          const linkType = getFieldValue(namePath(prefix, "linkType")) as LinkTargetType | undefined;
          if (!linkType) return null;
          return <LinkValueField linkType={linkType} prefix={prefix} entities={entities} />;
        }}
      </Form.Item>
    </div>
  );
}
