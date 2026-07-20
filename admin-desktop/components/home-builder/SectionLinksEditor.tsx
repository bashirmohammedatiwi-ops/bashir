"use client";

import { Alert, Divider, Form, Input, Switch, Typography } from "antd";
import { LinkTargetPicker, ProductScopeFields } from "./LinkTargetPicker";
import { CategoryItemsEditor } from "./CategoryItemsEditor";
import { SectionType } from "./section-types";
import type { EditorEntities } from "./SectionPayloadEditor";

const { Text } = Typography;

type Props = {
  type: SectionType;
  form: ReturnType<typeof Form.useForm>[0];
} & EditorEntities;

function entityLists(props: EditorEntities) {
  return {
    products: props.products ?? [],
    categories: props.categories ?? [],
    subcategories: props.subcategories ?? [],
    tertiary: props.tertiary ?? [],
    brands: props.brands ?? [],
    packages: props.packages ?? [],
    skinConcerns: props.skinConcerns ?? [],
  };
}

function ViewAllFields({ defaultQuery }: { defaultQuery?: string }) {
  return (
    <>
      <Form.Item name={["payload", "showViewAll"]} label="زر «عرض الكل»" valuePropName="checked">
        <Switch checkedChildren="ظاهر" unCheckedChildren="مخفي" />
      </Form.Item>
      <Form.Item
        name={["payload", "viewAllQuery"]}
        label="رابط عرض الكل (اختياري)"
        tooltip="مثال: isPromo=1&title=الباقات — فارغ = افتراضي النظام"
      >
        <Input placeholder={defaultQuery ?? "isFeatured=1&title=..."} dir="ltr" />
      </Form.Item>
    </>
  );
}

export function SectionLinksEditor({ type, form, ...props }: Props) {
  const entities = entityLists(props);
  const payload = Form.useWatch("payload", form) ?? {};
  const categoryIds = (payload.categoryIds as string[]) ?? [];

  if (type === "PROMO_STRIP") {
    return (
      <>
        <Alert
          type="info"
          showIcon
          message="عند الضغط على الشريط ينتقل العميل إلى:"
          style={{ marginBottom: 16 }}
        />
        <LinkTargetPicker prefix={["payload"]} entities={entities} showLegacyLink optional={false} />
      </>
    );
  }

  if (type === "PRODUCT_LIST" || type === "FLASH_SALE") {
    return (
      <>
        <Alert
          type="info"
          showIcon
          message="نطاق المنتجات"
          description="يُبنى رابط «عرض الكل» تلقائياً من الفلتر والفئات المختارة — أو خصّصه أدناه."
          style={{ marginBottom: 16 }}
        />
        <ProductScopeFields entities={entities} />
        <Divider plain>عرض الكل</Divider>
        <ViewAllFields />
      </>
    );
  }

  if (type === "FEATURED_BRANDS" || type === "BRAND_SHOWCASE") {
    return (
      <>
        <Alert
          type="info"
          showIcon
          message="كل براند يفتح منتجاته تلقائياً عند الضغط."
          style={{ marginBottom: 16 }}
        />
        <ViewAllFields />
        <Text type="secondary" style={{ fontSize: 12 }}>
          الافتراضي: صفحة كل البراندات (/brands)
        </Text>
      </>
    );
  }

  if (type === "PACKAGES" || type === "ROUTINE_CAROUSEL") {
    return (
      <>
        <Alert
          type="info"
          showIcon
          message="كل باقة تفتح صفحتها (/package/slug) عند الضغط."
          style={{ marginBottom: 16 }}
        />
        <ViewAllFields defaultQuery="isPromo=1&title=الباقات" />
      </>
    );
  }

  if (type === "IMAGE_TILES" || type === "CIRCLE_TILES" || type === "IMAGE_MARQUEE") {
    return (
      <Alert
        type="warning"
        showIcon
        message="الربط لكل عنصر"
        description="اربط كل بطاقة/صورة من تبويب «المحتوى» — حقل الرابط داخل كل عنصر."
      />
    );
  }

  if (
    type === "BANNER_FULL" ||
    type === "CUSTOM_BANNER" ||
    type.startsWith("BANNER_")
  ) {
    return (
      <Alert
        type="info"
        showIcon
        message="ربط البنرات"
        description="من تبويب المحتوى: صورة + رابط مباشر، أو اختر بنراً من صفحة البنرات. يُحل الرابط في API."
      />
    );
  }

  if (
    type === "CATEGORY_GRID" ||
    type === "CATEGORY_TILES" ||
    type === "MAKEUP_CATEGORIES"
  ) {
    return (
      <>
        <Alert
          type="info"
          showIcon
          message="الفئات"
          description="كل فئة تفتح منتجاتها افتراضياً. يمكن تجاوز رابط فئة محددة أدناه."
          style={{ marginBottom: 16 }}
        />
        <CategoryItemsEditor
          categories={props.categories ?? []}
          entities={entities}
          selectedIds={categoryIds}
        />
      </>
    );
  }

  if (type === "HERO_BANNER") {
    return (
      <>
        <Alert
          type="info"
          showIcon
          message="الهيرو"
          description="البنرات من صفحة البنرات. أيقونات الفئات تفتح أقسامها. تجاوز روابط الفئات:"
          style={{ marginBottom: 16 }}
        />
        <CategoryItemsEditor
          categories={props.categories ?? []}
          entities={entities}
          selectedIds={categoryIds}
        />
      </>
    );
  }

  if (type === "CARE_HUB") {
    return (
      <>
        <Alert
          type="info"
          showIcon
          message="مركز العناية"
          description="الروابط تُبنى من المحتوى. حدّد نطاق منتجات العناية وعرض الكل:"
          style={{ marginBottom: 16 }}
        />
        <ProductScopeFields entities={entities} />
        <Divider plain>عرض الكل</Divider>
        <ViewAllFields defaultQuery="isFeatured=1&title=العناية" />
      </>
    );
  }

  if (type === "SKIN_CONCERNS") {
    return (
      <Alert type="info" showIcon message="كل مشكلة بشرة تفتح منتجاتها عبر concernSlug." />
    );
  }

  return (
    <Text type="secondary">لا إعدادات ربط إضافية — المحتوى يُربط تلقائياً في التطبيق.</Text>
  );
}
