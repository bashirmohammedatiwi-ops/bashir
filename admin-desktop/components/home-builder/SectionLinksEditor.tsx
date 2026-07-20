"use client";

import { Alert, Divider, Form, Switch, Typography } from "antd";
import { LinkTargetPicker, ProductScopeFields } from "./LinkTargetPicker";
import { CategoryItemsEditor } from "./CategoryItemsEditor";
import { TileItemsLinksPanel } from "./TileItemsLinksPanel";
import { ViewAllPicker } from "./ViewAllPicker";
import { SectionType } from "./section-types";
import type { EditorEntities } from "./SectionPayloadEditor";

const { Text, Title } = Typography;

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

function ViewAllToggle() {
  return (
    <Form.Item name={["payload", "showViewAll"]} label="زر «عرض الكل»" valuePropName="checked">
      <Switch checkedChildren="ظاهر" unCheckedChildren="مخفي" />
    </Form.Item>
  );
}

export function SectionLinksEditor({ type, form, ...props }: Props) {
  const entities = entityLists(props);
  const payload = Form.useWatch("payload", form) ?? {};
  const categoryIds = (payload.categoryIds as string[]) ?? [];

  return (
    <div className="hb-links-panel">
      <Title level={5} style={{ marginTop: 0 }}>
        🔗 الربط — بسيط وواضح
      </Title>
      <Text type="secondary" style={{ display: "block", marginBottom: 16 }}>
        اختر وجهة من القوائم أو استخدم «روابط سريعة». المعاينة أسفل كل حقل تُظهر المسار في التطبيق.
      </Text>

      {type === "PROMO_STRIP" && (
        <>
          <Alert type="info" showIcon message="عند الضغط على الشريط ينتقل العميل إلى:" style={{ marginBottom: 16 }} />
          <LinkTargetPicker prefix={["payload"]} entities={entities} optional={false} />
        </>
      )}

      {(type === "PRODUCT_LIST" || type === "FLASH_SALE") && (
        <>
          <Alert
            type="info"
            showIcon
            message="نطاق المنتجات + عرض الكل"
            description="حدّد فئة/براند لتضييق القائمة. «عرض الكل» يُبنى تلقائياً أو من القوالب."
            style={{ marginBottom: 16 }}
          />
          <ProductScopeFields entities={entities} />
          <Divider plain>عرض الكل</Divider>
          <ViewAllToggle />
          <ViewAllPicker />
        </>
      )}

      {(type === "FEATURED_BRANDS" || type === "BRAND_SHOWCASE") && (
        <>
          <Alert type="success" showIcon message="كل براند يفتح منتجاته تلقائياً." style={{ marginBottom: 16 }} />
          <ViewAllToggle />
          <ViewAllPicker defaultQuery="/brands" />
        </>
      )}

      {(type === "PACKAGES" || type === "ROUTINE_CAROUSEL") && (
        <>
          <Alert type="success" showIcon message="كل باقة تفتح صفحتها (/package/slug)." style={{ marginBottom: 16 }} />
          <ViewAllToggle />
          <ViewAllPicker defaultQuery="isPromo=1&title=الباقات" />
        </>
      )}

      {(type === "IMAGE_TILES" || type === "CIRCLE_TILES" || type === "IMAGE_MARQUEE") && (
        <TileItemsLinksPanel
          entities={entities}
          itemLabel={type === "CIRCLE_TILES" ? "دائرة" : type === "IMAGE_MARQUEE" ? "صورة" : "بطاقة"}
        />
      )}

      {(type === "BANNER_FULL" || type === "CUSTOM_BANNER" || type.startsWith("BANNER_")) && (
        <>
          <Alert
            type="info"
            showIcon
            message="ربط البنرات"
            description="بنرات من صفحة البنرات: عدّل الربط هناك. البنر المباشر (inline): من تبويب المحتوى."
          />
          {type === "BANNER_FULL" || type === "CUSTOM_BANNER" ? (
            <div style={{ marginTop: 16 }}>
              <LinkTargetPicker prefix={["payload"]} entities={entities} optional />
            </div>
          ) : null}
        </>
      )}

      {(type === "CATEGORY_GRID" || type === "CATEGORY_TILES" || type === "MAKEUP_CATEGORIES") && (
        <>
          <Alert
            type="info"
            showIcon
            message="الفئات"
            description="افتراضياً كل فئة تفتح منتجاتها. يمكن تجاوز رابط فئة محددة:"
            style={{ marginBottom: 16 }}
          />
          <CategoryItemsEditor categories={props.categories ?? []} entities={entities} selectedIds={categoryIds} />
          <Divider plain>عرض الكل</Divider>
          <ViewAllToggle />
          <ViewAllPicker defaultQuery="/categories" />
        </>
      )}

      {type === "CARE_HUB" && (
        <>
          <Alert type="info" showIcon message="مركز العناية — نطاق المنتجات وعرض الكل" style={{ marginBottom: 16 }} />
          <ProductScopeFields entities={entities} />
          <Divider plain>عرض الكل</Divider>
          <ViewAllToggle />
          <ViewAllPicker defaultQuery="isFeatured=1&title=العناية" />
        </>
      )}

      {type === "MEDIA_GALLERY" && (
        <TileItemsLinksPanel entities={entities} itemLabel="صورة" />
      )}

      {type === "SECTION_GROUP" && (
        <Alert
          type="info"
          showIcon
          message="روابط الأقسام الفرعية"
          description="عدّل رابط كل قسم فرعي من تبويب «المحتوى» داخل بطاقة القسم."
        />
      )}

      {type === "SKIN_CONCERNS" && (
        <Alert type="success" showIcon message="كل مشكلة بشرة تفتح منتجاتها تلقائياً (concernSlug)." />
      )}

      {!["PROMO_STRIP", "PRODUCT_LIST", "FLASH_SALE", "FEATURED_BRANDS", "BRAND_SHOWCASE", "PACKAGES", "ROUTINE_CAROUSEL", "IMAGE_TILES", "CIRCLE_TILES", "IMAGE_MARQUEE", "MEDIA_GALLERY", "SECTION_GROUP", "BANNER_FULL", "CUSTOM_BANNER", "BANNER_GRID_2", "BANNER_GRID_3", "BANNER_CAROUSEL", "CATEGORY_GRID", "CATEGORY_TILES", "MAKEUP_CATEGORIES", "CARE_HUB", "SKIN_CONCERNS", "HERO_BANNER"].includes(type) && (
        <Text type="secondary">لا إعدادات ربط إضافية — المحتوى يُربط تلقائياً في التطبيق.</Text>
      )}
    </div>
  );
}
