"use client";

import {
  ColorPicker,
  Form,
  Input,
  InputNumber,
  Select,
  Switch,
  Typography,
} from "antd";
import { MediaPicker } from "@/components/MediaPicker";
import { PRODUCT_FILTERS, SectionType } from "./section-types";

type Props = {
  type: SectionType;
  form: ReturnType<typeof Form.useForm>[0];
  banners?: any[];
  categories?: any[];
  brands?: any[];
  packages?: any[];
};

export function SectionPayloadEditor({
  type,
  form,
  banners = [],
  categories = [],
  brands = [],
  packages = [],
}: Props) {
  const bannerOptions = banners.map((b) => ({
    value: b.id,
    label: b.title ?? b.id,
  }));
  const categoryOptions = categories.map((c) => ({
    value: c.id,
    label: c.name ?? c.id,
  }));
  const brandOptions = brands.map((b) => ({
    value: b.id,
    label: b.name ?? b.id,
  }));
  const packageOptions = packages.map((p) => ({
    value: p.id,
    label: p.name ?? p.id,
  }));

  switch (type) {
    case "HERO_BANNER":
      return (
        <>
          <Form.Item name={["payload", "bannerIds"]} label="بنرات السلايدر">
            <Select mode="multiple" options={bannerOptions} placeholder="فارغ = كل البنرات النشطة" />
          </Form.Item>
          <Form.Item name={["payload", "categoryIds"]} label="فئات سريعة">
            <Select mode="multiple" options={categoryOptions} placeholder="فارغ = أول 8 فئات" />
          </Form.Item>
          <Form.Item name={["payload", "maxItems"]} label="عدد الفئات" initialValue={8}>
            <InputNumber min={4} max={16} style={{ width: "100%" }} />
          </Form.Item>
        </>
      );

    case "CATEGORY_GRID":
    case "CATEGORY_TILES":
      return (
        <>
          <Form.Item name={["payload", "categoryIds"]} label="الفئات">
            <Select mode="multiple" options={categoryOptions} />
          </Form.Item>
          <Form.Item name={["payload", "maxItems"]} label="الحد الأقصى" initialValue={8}>
            <InputNumber min={3} max={12} style={{ width: "100%" }} />
          </Form.Item>
        </>
      );

    case "MAKEUP_CATEGORIES":
      return (
        <>
          <Form.Item name={["payload", "categoryIds"]} label="أقسام المكياج">
            <Select mode="multiple" options={categoryOptions} />
          </Form.Item>
          <Form.Item name={["payload", "accentColor"]} label="لون الخلفية الوردي">
            <Input placeholder="#FCE4EC" />
          </Form.Item>
        </>
      );

    case "BANNER_FULL":
    case "CUSTOM_BANNER":
      return (
        <Form.Item name={["payload", "bannerId"]} label="البنر" rules={[{ required: true }]}>
          <Select options={bannerOptions} showSearch optionFilterProp="label" />
        </Form.Item>
      );

    case "BANNER_GRID_2":
      return (
        <>
          <Form.Item name={["payload", "bannerIds"]} label="البنرات (2)">
            <Select mode="multiple" maxCount={2} options={bannerOptions} />
          </Form.Item>
          <Typography.Text type="secondary">أو اختر بنرات محددة من قائمة البنرات أعلاه</Typography.Text>
        </>
      );

    case "BANNER_GRID_3":
    case "BANNER_CAROUSEL":
      return (
        <Form.Item name={["payload", "bannerIds"]} label="البنرات">
          <Select mode="multiple" options={bannerOptions} />
        </Form.Item>
      );

    case "PRODUCT_LIST":
      return (
        <>
          <Form.Item name={["payload", "filter"]} label="فلتر المنتجات" initialValue="bestSeller">
            <Select options={PRODUCT_FILTERS} />
          </Form.Item>
          <Form.Item name={["payload", "limit"]} label="عدد المنتجات" initialValue={12}>
            <InputNumber min={4} max={24} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name={["payload", "backgroundColor"]} label="لون خلفية القسم">
            <Input placeholder="#FFFFFF أو #E8F4FC" />
          </Form.Item>
          <Form.Item name={["payload", "showViewAll"]} label="عرض الكل" valuePropName="checked" initialValue>
            <Switch />
          </Form.Item>
        </>
      );

    case "FLASH_SALE":
      return (
        <>
          <Form.Item name={["payload", "filter"]} label="فلتر" initialValue="promo">
            <Select options={PRODUCT_FILTERS} />
          </Form.Item>
          <Form.Item name={["payload", "limit"]} label="عدد المنتجات" initialValue={12}>
            <InputNumber min={4} max={24} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name={["payload", "endsAt"]} label="وقت انتهاء العرض (ISO)">
            <Input placeholder="2026-12-31T23:59:59.000Z — فارغ = من الإعدادات" />
          </Form.Item>
          <Form.Item name={["payload", "showViewAll"]} label="عرض الكل" valuePropName="checked" initialValue>
            <Switch />
          </Form.Item>
        </>
      );

    case "FEATURED_BRANDS":
    case "BRAND_SHOWCASE":
      return (
        <>
          <Form.Item name={["payload", "brandIds"]} label="البراندات">
            <Select mode="multiple" options={brandOptions} placeholder="فارغ = البراندات المميزة" />
          </Form.Item>
          <Form.Item name={["payload", "layout"]} label="التخطيط" initialValue="logos">
            <Select
              options={[
                { value: "logos", label: "شعارات أفقية" },
                { value: "cards", label: "بطاقات مع خصم" },
              ]}
            />
          </Form.Item>
        </>
      );

    case "PACKAGES":
      return (
        <Form.Item name={["payload", "packageIds"]} label="الباقات">
          <Select mode="multiple" options={packageOptions} placeholder="فارغ = كل الباقات" />
        </Form.Item>
      );

    case "PROMO_STRIP":
      return (
        <>
          <Form.Item name={["payload", "text"]} label="نص الشريط" rules={[{ required: true }]}>
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name={["payload", "link"]} label="رابط">
            <Input placeholder="/products?isPromo=1" />
          </Form.Item>
          <Form.Item name={["payload", "backgroundColor"]} label="لون الخلفية" initialValue="#FCE4EC">
            <Input />
          </Form.Item>
        </>
      );

    default:
      return null;
  }
}

export function BannerExtraFields() {
  return (
    <>
      <Form.Item name="linkType" label="نوع الرابط">
        <Select
          allowClear
          options={[
            { value: "url", label: "رابط" },
            { value: "product", label: "منتج" },
            { value: "category", label: "قسم" },
            { value: "brand", label: "براند" },
            { value: "offers", label: "عروض" },
          ]}
        />
      </Form.Item>
      <Form.Item name="linkValue" label="قيمة الرابط">
        <Input placeholder="slug أو id أو URL" />
      </Form.Item>
      <Form.Item name="discountText" label="نص الخصم">
        <Input placeholder="50% أو خصم حتى 80%" />
      </Form.Item>
      <Form.Item name="backgroundColor" label="لون الخلفية">
        <Input placeholder="#E8F4FC" />
      </Form.Item>
    </>
  );
}
