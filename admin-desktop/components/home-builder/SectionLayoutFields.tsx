"use client";

import { Alert, Divider, Form, InputNumber, Select, Switch, Typography } from "antd";
import { FormInstance } from "antd/es/form";
import { CardSizePicker } from "./CardSizePicker";
import { EntitySizesEditor } from "./EntitySizesEditor";
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
  if (type.includes("BANNER") || type === "CUSTOM_BANNER") return "banner";
  if (type === "IMAGE_TILES") return "image";
  if (type === "CIRCLE_TILES") return "category";
  if (type === "ROUTINE_CAROUSEL") return "package";
  if (type === "PRODUCT_LIST" || type === "FLASH_SALE") return "product";
  if (type === "PACKAGES") return "package";
  return "category";
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
  "CATEGORY_TILES",
  "MAKEUP_CATEGORIES",
  "CATEGORY_GRID",
  "FEATURED_BRANDS",
  "BRAND_SHOWCASE",
  "BANNER_GRID_2",
  "BANNER_GRID_3",
  "BANNER_CAROUSEL",
  "IMAGE_TILES",
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
        message="اختر تخطيط القسم وحجم البطاقات — يظهر مباشرة في التطبيق"
        style={{ marginBottom: 16 }}
      />

      {layoutOptions.length > 1 && (
        <Form.Item
          name={["payload", "sectionLayout"]}
          label="تخطيط القسم"
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

      <Form.Item name={["payload", "showTitle"]} label="إظهار العنوان في التطبيق" valuePropName="checked">
        <Switch />
      </Form.Item>

      <Divider plain>حجم البطاقات</Divider>

      <Form.Item
        name={["payload", "cardSize"]}
        label="الحجم الافتراضي لكل البطاقات"
        initialValue={defaultCardSizeForType(type)}
      >
        <CardSizePicker context={context} />
      </Form.Item>

      {payload.sectionLayout !== "uniform" && idField && ids.length > 0 && (
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
        </>
      )}

      {(type === "PRODUCT_LIST" || type === "FLASH_SALE") && (
        <Form.Item
          name={["payload", "productCardSize"]}
          label="حجم بطاقة المنتج"
          initialValue="md"
          extra="يُطبّق على سلايدر المنتجات"
        >
          <CardSizePicker context="product" compact />
        </Form.Item>
      )}

      <Divider plain>المسافات</Divider>

      <Form.Item name={["payload", "paddingTop"]} label="مسافة علوية (px)">
        <InputNumber min={0} max={48} style={{ width: "100%" }} placeholder="افتراضي" />
      </Form.Item>
      <Form.Item name={["payload", "paddingBottom"]} label="مسافة سفلية (px)">
        <InputNumber min={0} max={48} style={{ width: "100%" }} placeholder="افتراضي" />
      </Form.Item>
    </>
  );
}
