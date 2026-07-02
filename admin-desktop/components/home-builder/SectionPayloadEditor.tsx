"use client";

import {
  Button,
  Card,
  Divider,
  Form,
  Input,
  InputNumber,
  Radio,
  Select,
  Switch,
  Typography,
} from "antd";
import { MinusCircleOutlined, PlusOutlined } from "@ant-design/icons";
import { MediaPicker } from "@/components/MediaPicker";
import { EntityMultiPicker } from "./EntityMultiPicker";
import { LinkTargetPicker, ProductScopeFields } from "./LinkTargetPicker";
import { SectionStyleFields } from "./SectionStyleFields";
import { CardSizePicker } from "./CardSizePicker";
import { PRODUCT_FILTERS, SectionType } from "./section-types";

const { Text } = Typography;

export type EditorEntities = {
  banners?: any[];
  categories?: any[];
  subcategories?: any[];
  tertiary?: any[];
  brands?: any[];
  packages?: any[];
  products?: any[];
  skinConcerns?: any[];
};

type Props = {
  type: SectionType;
  form: ReturnType<typeof Form.useForm>[0];
  tab?: "content" | "style" | "link";
} & EditorEntities;

function entityLists(props: EditorEntities) {
  return {
    products: props.products ?? [],
    categories: props.categories ?? [],
    subcategories: props.subcategories ?? [],
    tertiary: props.tertiary ?? [],
    brands: props.brands ?? [],
  };
}

export function SectionPayloadEditor(props: Props) {
  const { type, form, tab = "content" } = props;
  const entities = entityLists(props);

  if (tab === "style") {
    return <SectionStyleFields showLayout={type === "CATEGORY_GRID"} />;
  }

  if (tab === "link") {
    if (type === "PROMO_STRIP") {
      return <LinkTargetPicker prefix={["payload"]} entities={entities} showLegacyLink />;
    }
    if (type === "PRODUCT_LIST" || type === "FLASH_SALE") {
      return (
        <>
          <Text type="secondary">رابط «عرض الكل» يُبنى تلقائياً من الفلتر والتصفية</Text>
          <ProductScopeFields entities={entities} />
        </>
      );
    }
    return <Text type="secondary">لا توجد إعدادات ربط لهذا النوع — اربط من البنرات أو بطاقات الصور</Text>;
  }

  switch (type) {
    case "HERO_BANNER":
      return (
        <>
          <Form.Item name={["payload", "bannerIds"]} label="بنرات السلايدر">
            <EntityMultiPicker items={props.banners ?? []} imageKey="image" placeholder="بحث في البنرات..." />
          </Form.Item>
          <Form.Item name={["payload", "categoryIds"]} label="فئات سريعة">
            <EntityMultiPicker
              items={props.categories ?? []}
              max={16}
              placeholder="بحث في الفئات..."
            />
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
            <EntityMultiPicker items={props.categories ?? []} max={12} placeholder="بحث..." />
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
            <EntityMultiPicker items={props.categories ?? []} max={8} />
          </Form.Item>
          <Form.Item name={["payload", "accentColor"]} label="لون خلفية البطاقات">
            <Input placeholder="#FCE4EC" />
          </Form.Item>
        </>
      );

    case "SKIN_CONCERNS":
      return (
        <>
          <Form.Item name={["payload", "concernIds"]} label="مشاكل البشرة">
            <Select
              mode="multiple"
              options={(props.skinConcerns ?? []).map((c) => ({
                value: c.id,
                label: `${c.icon ?? "✨"} ${c.name ?? c.slug ?? c.id}`,
              }))}
              placeholder="فارغ = الكل النشط"
            />
          </Form.Item>
          <Form.Item name={["payload", "maxItems"]} label="الحد الأقصى" initialValue={10}>
            <InputNumber min={3} max={16} style={{ width: "100%" }} />
          </Form.Item>
        </>
      );

    case "BANNER_FULL":
    case "CUSTOM_BANNER":
      return (
        <Form.Item name={["payload", "bannerId"]} label="البنر" rules={[{ required: true }]}>
          <Select
            showSearch
            optionFilterProp="label"
            options={(props.banners ?? []).map((b) => ({
              value: b.id,
              label: b.title ?? b.id,
            }))}
          />
        </Form.Item>
      );

    case "BANNER_GRID_2":
    case "BANNER_GRID_3":
      return (
        <>
          <Text type="secondary" style={{ display: "block", marginBottom: 8 }}>
            اختر بنرات جاهزة أو خصّص كل بطاقة
          </Text>
          <Form.Item name={["payload", "bannerIds"]} label="البنرات">
            <EntityMultiPicker
              items={props.banners ?? []}
              max={type === "BANNER_GRID_2" ? 2 : 3}
            />
          </Form.Item>
          <Divider plain>تخصيص متقدم</Divider>
          <Form.List name={["payload", "items"]}>
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...rest }) => (
                  <Card key={key} size="small" style={{ marginBottom: 8 }}>
                    <Form.Item {...rest} name={[name, "bannerId"]} label="البنر" rules={[{ required: true }]}>
                      <Select
                        options={(props.banners ?? []).map((b) => ({
                          value: b.id,
                          label: b.title ?? b.id,
                        }))}
                      />
                    </Form.Item>
                    <Form.Item {...rest} name={[name, "title"]} label="عنوان">
                      <Input placeholder="اختياري" />
                    </Form.Item>
                    <Form.Item {...rest} name={[name, "discountText"]} label="نص الخصم">
                      <Input placeholder="50%" />
                    </Form.Item>
                    <Form.Item {...rest} name={[name, "cardSize"]} label="حجم البطاقة" initialValue="md">
                      <CardSizePicker context="banner" compact />
                    </Form.Item>
                    <Button danger type="link" icon={<MinusCircleOutlined />} onClick={() => remove(name)}>
                      حذف
                    </Button>
                  </Card>
                ))}
                <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                  إضافة بنر مخصص
                </Button>
              </>
            )}
          </Form.List>
        </>
      );

    case "BANNER_CAROUSEL":
      return (
        <Form.Item name={["payload", "bannerIds"]} label="البنرات">
          <EntityMultiPicker items={props.banners ?? []} placeholder="فارغ = كل البنرات" />
        </Form.Item>
      );

    case "PRODUCT_LIST":
      return (
        <>
          <Form.Item name={["payload", "source"]} label="مصدر المنتجات" initialValue="filter">
            <Radio.Group>
              <Radio value="filter">فلتر تلقائي</Radio>
              <Radio value="manual">اختيار يدوي</Radio>
            </Radio.Group>
          </Form.Item>
          <Form.Item noStyle shouldUpdate={(p, c) => p.payload?.source !== c.payload?.source}>
            {({ getFieldValue }) =>
              getFieldValue(["payload", "source"]) === "manual" ? (
                <Form.Item name={["payload", "productIds"]} label="المنتجات">
                  <EntityMultiPicker items={props.products ?? []} max={24} />
                </Form.Item>
              ) : (
                <>
                  <Form.Item name={["payload", "filter"]} label="فلتر المنتجات" initialValue="bestSeller">
                    <Select options={PRODUCT_FILTERS} />
                  </Form.Item>
                  <Form.Item name={["payload", "limit"]} label="عدد المنتجات" initialValue={12}>
                    <InputNumber min={4} max={24} style={{ width: "100%" }} />
                  </Form.Item>
                  <ProductScopeFields entities={entities} />
                </>
              )
            }
          </Form.Item>
          <Form.Item name={["payload", "showViewAll"]} label="عرض الكل" valuePropName="checked" initialValue>
            <Switch />
          </Form.Item>
        </>
      );

    case "FLASH_SALE":
      return (
        <>
          <Form.Item name={["payload", "source"]} label="مصدر المنتجات" initialValue="filter">
            <Radio.Group>
              <Radio value="filter">فلتر تلقائي</Radio>
              <Radio value="manual">اختيار يدوي</Radio>
            </Radio.Group>
          </Form.Item>
          <Form.Item noStyle shouldUpdate={(p, c) => p.payload?.source !== c.payload?.source}>
            {({ getFieldValue }) =>
              getFieldValue(["payload", "source"]) === "manual" ? (
                <Form.Item name={["payload", "productIds"]} label="منتجات العرض">
                  <EntityMultiPicker items={props.products ?? []} max={24} />
                </Form.Item>
              ) : (
                <>
                  <Form.Item name={["payload", "filter"]} label="فلتر" initialValue="promo">
                    <Select options={PRODUCT_FILTERS} />
                  </Form.Item>
                  <Form.Item name={["payload", "limit"]} label="عدد المنتجات" initialValue={12}>
                    <InputNumber min={4} max={24} style={{ width: "100%" }} />
                  </Form.Item>
                  <ProductScopeFields entities={entities} />
                </>
              )
            }
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
            <EntityMultiPicker
              items={props.brands ?? []}
              imageKey="logo"
              placeholder="فارغ = البراندات المميزة"
            />
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
          <EntityMultiPicker items={props.packages ?? []} placeholder="فارغ = كل الباقات" />
        </Form.Item>
      );

    case "PROMO_STRIP":
      return (
        <>
          <Form.Item name={["payload", "text"]} label="نص الشريط" rules={[{ required: true }]}>
            <Input.TextArea rows={3} placeholder="شحن مجاني للطلبات فوق 50,000 د.ع" />
          </Form.Item>
          <Form.Item name={["payload", "backgroundColor"]} label="لون الخلفية" initialValue="#FCE4EC">
            <Input placeholder="#FCE4EC" />
          </Form.Item>
          <Typography.Text strong style={{ display: "block", margin: "12px 0 8px" }}>
            عند الضغط — ينتقل إلى:
          </Typography.Text>
          <LinkTargetPicker prefix={["payload"]} entities={entities} showLegacyLink optional={false} />
        </>
      );

    case "IMAGE_TILES":
      return (
        <>
          <Form.Item name={["payload", "columns"]} label="عدد الأعمدة" initialValue={2}>
            <Select
              options={[
                { value: 2, label: "عمودان" },
                { value: 3, label: "3 أعمدة" },
              ]}
            />
          </Form.Item>
          <Form.List name={["payload", "items"]}>
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...rest }) => (
                  <Card
                    key={key}
                    size="small"
                    title={`بطاقة ${name + 1}`}
                    style={{ marginBottom: 10 }}
                    extra={
                      <Button danger type="link" icon={<MinusCircleOutlined />} onClick={() => remove(name)}>
                        حذف
                      </Button>
                    }
                  >
                    <Form.Item {...rest} name={[name, "imageId"]} label="الصورة" rules={[{ required: true }]}>
                      <MediaPicker label="اختر صورة البطاقة" />
                    </Form.Item>
                    <Form.Item {...rest} name={[name, "title"]} label="العنوان">
                      <Input placeholder="عنوان البطاقة" />
                    </Form.Item>
                    <Form.Item {...rest} name={[name, "subtitle"]} label="وصف قصير">
                      <Input placeholder="نص ثانوي" />
                    </Form.Item>
                    <Text strong style={{ display: "block", marginBottom: 8 }}>
                      الرابط
                    </Text>
                    <LinkTargetPicker prefix={["payload", "items", name]} entities={entities} />
                    <Form.Item {...rest} name={[name, "cardSize"]} label="حجم البطاقة" initialValue="md">
                      <CardSizePicker context="image" compact />
                    </Form.Item>
                  </Card>
                ))}
                <Button type="dashed" onClick={() => add({})} block icon={<PlusOutlined />}>
                  + بطاقة صورة جديدة
                </Button>
              </>
            )}
          </Form.List>
        </>
      );

    default:
      return null;
  }
}

export function BannerExtraFields({ entities }: { entities?: EditorEntities }) {
  const lists = entityLists(entities ?? {});
  return (
    <>
      <Form.Item name="imageId" label="صورة البنر">
        <MediaPicker label="اختر صورة" />
      </Form.Item>
      <LinkTargetPicker entities={lists} optional />
      <Form.Item name="discountText" label="نص الخصم على الصورة">
        <Input placeholder="50% أو خصم حتى 80%" />
      </Form.Item>
      <Form.Item name="backgroundColor" label="لون الخلفية (بدون صورة)">
        <Input placeholder="#E8F4FC" />
      </Form.Item>
    </>
  );
}
