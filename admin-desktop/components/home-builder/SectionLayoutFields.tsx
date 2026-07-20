"use client";

import {
  Alert,
  Collapse,
  Divider,
  Form,
  InputNumber,
  Select,
  Switch,
  Typography,
} from "antd";
import { FormInstance } from "antd/es/form";
import { AdSlotPicker } from "./AdSlotPicker";
import { CardSizePicker } from "./CardSizePicker";
import { EntitySizesEditor } from "./EntitySizesEditor";
import { defaultAdSlotForType } from "./ad-slots";
import {
  CardSizeContext,
  CardSizeId,
  defaultCardSizeForType,
  defaultLayoutForType,
  layoutsForType,
} from "./card-sizes";
import { SectionType } from "./section-types";

const { Text } = Typography;

type Entity = { id: string; name?: string; title?: string; slug?: string };

type Props = {
  type: SectionType;
  form: FormInstance;
  categories?: Entity[];
  brands?: Entity[];
  banners?: Entity[];
};

function cardContextForType(type: SectionType): CardSizeContext {
  if (type.includes("BRAND")) return "brand";
  if (type === "HERO_BANNER" || type.includes("BANNER") || type === "CUSTOM_BANNER" || type === "IMAGE_MARQUEE") return "banner";
  if (type === "IMAGE_TILES") return "image";
  if (type === "CIRCLE_TILES") return "category";
  if (type === "ROUTINE_CAROUSEL") return "package";
  if (type === "PRODUCT_LIST" || type === "FLASH_SALE") return "product";
  if (type === "PACKAGES") return "package";
  return "category";
}

function isAdSection(type: SectionType) {
  return (
    type === "HERO_BANNER" ||
    type.includes("BANNER") ||
    type === "CUSTOM_BANNER" ||
    type === "IMAGE_MARQUEE"
  );
}

function idFieldForType(type: SectionType): string | null {
  switch (type) {
    case "CATEGORY_GRID":
    case "CATEGORY_TILES":
    case "MAKEUP_CATEGORIES":
      return "categoryIds";
    case "FEATURED_BRANDS":
    case "BRAND_SHOWCASE":
      return "brandIds";
    case "BANNER_CAROUSEL":
    case "BANNER_GRID_2":
    case "BANNER_GRID_3":
      return "bannerIds";
    case "PACKAGES":
      return "packageIds";
    case "PRODUCT_LIST":
    case "FLASH_SALE":
      return "productIds";
    default:
      return null;
  }
}

function entitiesForType(type: SectionType, props: Props): Entity[] {
  if (type.includes("BRAND")) return props.brands ?? [];
  if (type.includes("BANNER") || type === "CUSTOM_BANNER") return props.banners ?? [];
  if (type === "PACKAGES") return (props as any).packages ?? [];
  return props.categories ?? [];
}

const LAYOUT_SECTION_TYPES: SectionType[] = [
  "HERO_BANNER",
  "CATEGORY_TILES",
  "MAKEUP_CATEGORIES",
  "CATEGORY_GRID",
  "FEATURED_BRANDS",
  "BRAND_SHOWCASE",
  "BANNER_GRID_2",
  "BANNER_GRID_3",
  "BANNER_CAROUSEL",
  "IMAGE_TILES",
  "IMAGE_MARQUEE",
  "CIRCLE_TILES",
  "PRODUCT_LIST",
  "FLASH_SALE",
  "PACKAGES",
  "ROUTINE_CAROUSEL",
  "SKIN_CONCERNS",
  "CARE_HUB",
  "BANNER_FULL",
  "CUSTOM_BANNER",
];

export function SectionLayoutFields({ type, form, categories, brands, banners }: Props) {
  const payload = Form.useWatch("payload", form) ?? {};
  const idField = idFieldForType(type);
  const ids = (idField ? (payload[idField] as string[]) : []) ?? [];
  const context = cardContextForType(type);
  const defaultSize = (payload.cardSize as CardSizeId) ?? defaultCardSizeForType(type);
  const layoutOptions = layoutsForType(type);
  const adSection = isAdSection(type);

  if (!LAYOUT_SECTION_TYPES.includes(type)) {
    return (
      <Alert
        type="info"
        showIcon
        message="هذا النوع لا يحتاج تخطيط بطاقات — استخدم تبويب التصميم للألوان والمسافات"
      />
    );
  }

  return (
    <>
      <Alert
        type="info"
        showIcon
        message={adSection ? "مقاس الإعلان — اختر النسبة المناسبة للصورة" : "الإعدادات الأساسية — الباقي اختياري"}
        style={{ marginBottom: 16 }}
      />

      {layoutOptions.length > 1 && (
        <Form.Item
          name={["payload", "sectionLayout"]}
          label="شكل العرض"
          initialValue={defaultLayoutForType(type)}
        >
          <Select
            options={layoutOptions.map((l) => ({
              value: l.value,
              label: l.label,
              title: l.description,
            }))}
          />
        </Form.Item>
      )}

      <Form.Item name={["payload", "showTitle"]} label="إظهار العنوان" valuePropName="checked">
        <Switch />
      </Form.Item>

      {adSection ? (
        <>
          <Form.Item
            name={["payload", "adSlot"]}
            label="مقاس الإعلان"
            initialValue={defaultAdSlotForType(type)}
            getValueFromEvent={(v) => {
              form.setFieldValue(["payload", "cardSize"], v);
              if (v === "fullBleed") form.setFieldValue(["payload", "fullBleed"], true);
              return v;
            }}
          >
            <AdSlotPicker />
          </Form.Item>
          <Form.Item name={["payload", "fullBleed"]} label="عرض الشاشة (بدون هوامش)" valuePropName="checked">
            <Switch checkedChildren="كامل" unCheckedChildren="مع هوامش" />
          </Form.Item>
          <Form.Item
            name={["payload", "bannerAspect"]}
            label="نسبة مخصصة (عرض ÷ ارتفاع)"
            extra="اتركه فارغاً لاستخدام نسبة المقاس المختار"
          >
            <InputNumber min={0.5} max={4} step={0.01} style={{ width: "100%" }} placeholder="مثال: 1.78 = 16:9" />
          </Form.Item>
          {type === "IMAGE_MARQUEE" && (
            <>
              <Form.Item name={["payload", "imageHeight"]} label="ارتفاع الصور (px)" initialValue={120}>
                <InputNumber min={64} max={280} style={{ width: "100%" }} />
              </Form.Item>
              <Form.Item name={["payload", "marqueeSpeed"]} label="سرعة الحركة (1–10)" initialValue={5}>
                <InputNumber min={1} max={10} style={{ width: "100%" }} />
              </Form.Item>
              <Form.Item name={["payload", "marqueeGap"]} label="مسافة بين الصور (px)" initialValue={12}>
                <InputNumber min={4} max={32} style={{ width: "100%" }} />
              </Form.Item>
            </>
          )}
          <Form.Item name={["payload", "cardSize"]} hidden>
            <Select />
          </Form.Item>
        </>
      ) : (
        <Form.Item
          name={["payload", "cardSize"]}
          label="حجم البطاقات"
          initialValue={defaultCardSizeForType(type)}
        >
          <CardSizePicker context={context} />
        </Form.Item>
      )}

      {(type === "PRODUCT_LIST" || type === "FLASH_SALE") && (
        <Form.Item
          name={["payload", "productCardSize"]}
          label="حجم بطاقة المنتج"
          initialValue="md"
        >
          <CardSizePicker context="product" compact />
        </Form.Item>
      )}

      <Collapse
        ghost
        items={[
          {
            key: "advanced",
            label: "إعدادات متقدمة (اختياري)",
            children: (
              <>
                {!adSection && payload.sectionLayout !== "uniform" && idField && ids.length > 0 && (
                  <>
                    <Text strong style={{ display: "block", marginBottom: 8 }}>
                      حجم كل عنصر
                    </Text>
                    <EntitySizesEditor
                      ids={ids}
                      entities={entitiesForType(type, { type, form, categories, brands, banners })}
                      context={context}
                      defaultSize={defaultSize}
                    />
                    <Divider plain />
                  </>
                )}
                <Form.Item name={["payload", "paddingTop"]} label="مسافة علوية (px)">
                  <InputNumber min={0} max={48} style={{ width: "100%" }} placeholder="افتراضي" />
                </Form.Item>
                <Form.Item name={["payload", "paddingBottom"]} label="مسافة سفلية (px)">
                  <InputNumber min={0} max={48} style={{ width: "100%" }} placeholder="افتراضي" />
                </Form.Item>
              </>
            ),
          },
        ]}
      />
    </>
  );
}
