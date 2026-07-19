"use client";

import { Form, Input, Select, Space, Typography } from "antd";
import { LINK_TARGET_TYPES } from "./link-target";

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

function namePath(prefix: (string | number)[], field: string) {
  return prefix.length ? [...prefix, field] : field;
}

export function LinkTargetPicker({
  prefix = [],
  entities,
  showLegacyLink = false,
  optional = true,
}: Props) {
  return (
    <>
      <Form.Item
        name={namePath(prefix, "linkType")}
        label="نوع الرابط"
        rules={optional ? [] : [{ required: true, message: "اختر نوع الرابط" }]}
      >
        <Select
          allowClear={optional}
          placeholder="بدون رابط"
          options={LINK_TARGET_TYPES.map((t) => ({
            value: t.value,
            label: `${t.icon} ${t.label}`,
          }))}
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
                  optionFilterProp="label"
                  placeholder="ابحث عن منتج..."
                  options={(entities.products ?? []).map((p) => ({
                    value: p.slug || p.id,
                    label: `${p.name ?? p.id}${p.brand?.name ? ` — ${p.brand.name}` : ""}`,
                  }))}
                />
              </Form.Item>
            );
          }

          if (linkType === "category") {
            return (
              <Form.Item name={namePath(prefix, "linkValue")} label="القسم الرئيسي" rules={[{ required: true }]}>
                <Select
                  showSearch
                  optionFilterProp="label"
                  options={(entities.categories ?? [])
                    .filter((c) => !c.parentId)
                    .map((c) => ({ value: c.id, label: c.name ?? c.id }))}
                />
              </Form.Item>
            );
          }

          if (linkType === "subcategory") {
            return (
              <Form.Item name={namePath(prefix, "linkValue")} label="القسم الفرعي" rules={[{ required: true }]}>
                <Select
                  showSearch
                  optionFilterProp="label"
                  options={(entities.subcategories ?? []).map((c) => ({
                    value: c.id,
                    label: c.parent?.name ? `${c.parent.name} › ${c.name}` : (c.name ?? c.id),
                  }))}
                />
              </Form.Item>
            );
          }

          if (linkType === "tertiary") {
            return (
              <Form.Item name={namePath(prefix, "linkValue")} label="القسم الثانوي" rules={[{ required: true }]}>
                <Select
                  showSearch
                  optionFilterProp="label"
                  options={(entities.tertiary ?? []).map((c) => ({
                    value: c.id,
                    label: c.name ?? c.slug ?? c.id,
                  }))}
                />
              </Form.Item>
            );
          }

          if (linkType === "brand") {
            return (
              <Form.Item name={namePath(prefix, "linkValue")} label="البراند" rules={[{ required: true }]}>
                <Select
                  showSearch
                  optionFilterProp="label"
                  options={(entities.brands ?? []).map((b) => ({
                    value: b.id,
                    label: b.name ?? b.id,
                  }))}
                />
              </Form.Item>
            );
          }

          if (linkType === "package") {
            return (
              <Form.Item name={namePath(prefix, "linkValue")} label="الباقة / الروتين" rules={[{ required: true }]}>
                <Select
                  showSearch
                  optionFilterProp="label"
                  options={(entities.packages ?? []).map((p) => ({
                    value: p.slug || p.id,
                    label: p.name ?? p.slug ?? p.id,
                  }))}
                />
              </Form.Item>
            );
          }

          if (linkType === "skinConcern") {
            return (
              <Form.Item name={namePath(prefix, "linkValue")} label="مشكلة البشرة" rules={[{ required: true }]}>
                <Select
                  showSearch
                  optionFilterProp="label"
                  options={(entities.skinConcerns ?? []).map((c) => ({
                    value: c.slug || c.id,
                    label: `${c.icon ?? "✨"} ${c.name ?? c.slug ?? c.id}`,
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
              <Form.Item
                name={namePath(prefix, "linkValue")}
                label="معاملات قائمة المنتجات"
                rules={[{ required: true }]}
                extra="مثال: isPromo=1&categoryId=xxx"
              >
                <Input placeholder="isPromo=1&brandId=..." />
              </Form.Item>
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
    </>
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
          optionFilterProp="label"
          placeholder="كل الأقسام"
          options={(entities.categories ?? [])
            .filter((c) => !c.parentId)
            .map((c) => ({ value: c.id, label: c.name ?? c.id }))}
        />
      </Form.Item>
      <Form.Item name={[...prefix, "subcategoryId"]} label="قسم فرعي">
        <Select
          allowClear
          showSearch
          optionFilterProp="label"
          options={(entities.subcategories ?? []).map((c) => ({
            value: c.id,
            label: c.parent?.name ? `${c.parent.name} › ${c.name}` : (c.name ?? c.id),
          }))}
        />
      </Form.Item>
      <Form.Item name={[...prefix, "tertiaryCategoryId"]} label="قسم ثانوي">
        <Select
          allowClear
          showSearch
          optionFilterProp="label"
          options={(entities.tertiary ?? []).map((c) => ({
            value: c.id,
            label: c.name ?? c.slug ?? c.id,
          }))}
        />
      </Form.Item>
      <Form.Item name={[...prefix, "brandId"]} label="براند">
        <Select
          allowClear
          showSearch
          optionFilterProp="label"
          options={(entities.brands ?? []).map((b) => ({
            value: b.id,
            label: b.name ?? b.id,
          }))}
        />
      </Form.Item>
    </Space>
  );
}
