"use client";

import { Button, Form, Input, Select, Space, Typography } from "antd";
import type { FormListFieldData } from "antd/es/form/FormList";
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

type ListFieldRest = Omit<FormListFieldData, "name" | "key">;

type Props = {
  /** فهرس العنصر داخل Form.List */
  fieldName: number;
  restField?: ListFieldRest;
  /** مسار القائمة — الافتراضي payload.items */
  listName?: (string | number)[];
  entities: EntityLists;
  optional?: boolean;
};

const DEFAULT_LIST_NAME = ["payload", "items"];

const LINK_GROUPS: { label: string; types: LinkTargetType[] }[] = [
  { label: "تسوق", types: ["product", "brand", "package", "offers"] },
  { label: "أقسام", types: ["category", "subcategory", "tertiary", "categoriesTab"] },
  { label: "اكتشاف", types: ["search", "skinConcern", "products"] },
  { label: "متقدم", types: ["url"] },
];

const NO_VALUE_TYPES = new Set<LinkTargetType>(["offers", "categoriesTab"]);

function fullPath(listName: (string | number)[], fieldName: number, field: string) {
  return [...listName, fieldName, field];
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

function ProductsQueryField({
  fieldName,
  restField,
  listName,
}: {
  fieldName: number;
  restField?: ListFieldRest;
  listName: (string | number)[];
}) {
  const form = Form.useFormInstance();
  const linkValuePath = fullPath(listName, fieldName, "linkValue");

  return (
    <Form.Item label="قائمة المنتجات" required>
      <Space direction="vertical" style={{ width: "100%" }} size={8}>
        <Select
          allowClear
          placeholder="قوالب جاهزة (اختياري)"
          options={PRODUCT_QUERY_PRESETS.map((p) => ({ value: p.value, label: p.label }))}
          onChange={(v) => form.setFieldValue(linkValuePath, v ?? undefined)}
        />
        <Form.Item
          {...restField}
          name={[fieldName, "linkValue"]}
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
              onClick={() => form.setFieldValue(linkValuePath, p.value)}
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
  fieldName,
  restField,
  listName,
  entities,
}: {
  linkType: LinkTargetType;
  fieldName: number;
  restField?: ListFieldRest;
  listName: (string | number)[];
  entities: EntityLists;
}) {
  const itemProps = { ...restField, name: [fieldName, "linkValue"] as [number, string] };

  if (NO_VALUE_TYPES.has(linkType)) {
    return (
      <Typography.Text type="secondary" style={{ fontSize: 12 }}>
        لا حاجة لاختيار هدف — الرابط جاهز تلقائياً
      </Typography.Text>
    );
  }

  if (linkType === "product") {
    return (
      <Form.Item {...itemProps} label="اختر المنتج" rules={[{ required: true, message: "اختر منتجاً" }]}>
        <ProductSearchSelect seedProducts={entities.products ?? []} placeholder="ابحث بالاسم أو SKU أو الباركود" />
      </Form.Item>
    );
  }

  if (linkType === "category") {
    return (
      <Form.Item {...itemProps} label="اختر القسم الرئيسي" rules={[{ required: true, message: "اختر قسماً" }]}>
        <Select
          allowClear
          showSearch
          filterOption={filterOption}
          placeholder="ابحث واختر القسم الرئيسي"
          options={categoryOptions(entities.categories ?? [], true)}
        />
      </Form.Item>
    );
  }

  if (linkType === "subcategory") {
    return (
      <Form.Item {...itemProps} label="اختر القسم الفرعي" rules={[{ required: true, message: "اختر قسماً فرعياً" }]}>
        <Select
          allowClear
          showSearch
          filterOption={filterOption}
          placeholder="ابحث واختر القسم الفرعي"
          options={subcategoryOptions(entities.subcategories ?? [])}
        />
      </Form.Item>
    );
  }

  if (linkType === "tertiary") {
    return (
      <Form.Item {...itemProps} label="اختر القسم الثانوي" rules={[{ required: true, message: "اختر قسماً ثانوياً" }]}>
        <Select
          allowClear
          showSearch
          filterOption={filterOption}
          placeholder="ابحث واختر القسم الثانوي"
          options={simpleOptions(entities.tertiary ?? [])}
        />
      </Form.Item>
    );
  }

  if (linkType === "brand") {
    return (
      <Form.Item {...itemProps} label="اختر البراند" rules={[{ required: true, message: "اختر برانداً" }]}>
        <Select
          allowClear
          showSearch
          filterOption={filterOption}
          placeholder="ابحث واختر البراند"
          options={simpleOptions(entities.brands ?? [])}
          notFoundContent="لا توجد براندات — أضفها من صفحة البراندات"
        />
      </Form.Item>
    );
  }

  if (linkType === "package") {
    return (
      <Form.Item {...itemProps} label="اختر الباقة / الروتين" rules={[{ required: true, message: "اختر باقة" }]}>
        <Select
          allowClear
          showSearch
          filterOption={filterOption}
          placeholder="ابحث واختر الباقة"
          options={simpleOptions(entities.packages ?? [])}
        />
      </Form.Item>
    );
  }

  if (linkType === "skinConcern") {
    return (
      <Form.Item {...itemProps} label="اختر مشكلة البشرة" rules={[{ required: true, message: "اختر مشكلة بشرة" }]}>
        <Select
          allowClear
          showSearch
          filterOption={filterOption}
          placeholder="ابحث واختر مشكلة البشرة"
          options={simpleOptions(entities.skinConcerns ?? [])}
        />
      </Form.Item>
    );
  }

  if (linkType === "search") {
    return (
      <Form.Item {...itemProps} label="كلمة البحث" rules={[{ required: true, message: "أدخل كلمة البحث" }]}>
        <Input placeholder="مثال: كريم واقي شمس" allowClear />
      </Form.Item>
    );
  }

  if (linkType === "products") {
    return <ProductsQueryField fieldName={fieldName} restField={restField} listName={listName} />;
  }

  if (linkType === "url") {
    return (
      <Form.Item {...itemProps} label="المسار داخل التطبيق" rules={[{ required: true, message: "أدخل المسار" }]}>
        <Input dir="ltr" placeholder="/brands أو /products?isNew=1" allowClear />
      </Form.Item>
    );
  }

  return null;
}

/** ربط متدرج: نوع الرابط → اختيار الهدف (متوافق مع Form.List) */
export function CascadingLinkPicker({
  fieldName,
  restField,
  listName = DEFAULT_LIST_NAME,
  entities,
  optional = true,
}: Props) {
  const form = Form.useFormInstance();
  const linkTypePath = fullPath(listName, fieldName, "linkType");
  const linkType = Form.useWatch(linkTypePath, form) as LinkTargetType | undefined;

  const groupedLinkTypes = LINK_GROUPS.map((g) => ({
    label: g.label,
    options: LINK_TARGET_TYPES.filter((t) => g.types.includes(t.value)).map((t) => ({
      value: t.value,
      label: `${t.icon} ${t.label}`,
    })),
  }));

  const onTypeChange = (next: LinkTargetType | null) => {
    const linkValuePath = fullPath(listName, fieldName, "linkValue");
    const linkPath = fullPath(listName, fieldName, "link");
    form.setFields([
      { name: linkTypePath, value: next ?? undefined },
      { name: linkPath, value: undefined },
      {
        name: linkValuePath,
        value: !next || NO_VALUE_TYPES.has(next) ? (next ? "" : undefined) : undefined,
      },
    ]);
  };

  return (
    <div className="hb-cascading-link">
      <Form.Item {...restField} name={[fieldName, "linkType"]} label="نوع الرابط">
        <Select
          allowClear={optional}
          showSearch
          optionFilterProp="label"
          placeholder="اختر نوع الربط"
          options={groupedLinkTypes}
          onChange={onTypeChange}
        />
      </Form.Item>

      {linkType ? (
        <LinkValueField
          linkType={linkType}
          fieldName={fieldName}
          restField={restField}
          listName={listName}
          entities={entities}
        />
      ) : null}
    </div>
  );
}
