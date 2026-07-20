"use client";

import {
  Button,
  Card,
  DatePicker,
  Divider,
  Form,
  Input,
  InputNumber,
  Radio,
  Select,
  Switch,
  Typography,
  Alert,
} from "antd";
import { MinusCircleOutlined, PlusOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { MediaPicker } from "@/components/MediaPicker";
import { EntityMultiPicker } from "./EntityMultiPicker";
import { LinkTargetPicker, ProductScopeFields } from "./LinkTargetPicker";
import { SectionStyleFields } from "./SectionStyleFields";
import { CardSizePicker } from "./CardSizePicker";
import { FrameStyleFields, MEDIA_DISPLAY_OPTIONS, MEDIA_SHAPE_OPTIONS, MEDIA_SIZE_OPTIONS } from "./FrameStyleFields";
import { GroupChildrenEditor } from "./GroupChildrenEditor";
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
    packages: props.packages ?? [],
    skinConcerns: props.skinConcerns ?? [],
  };
}

export function SectionLinkHints({
  type,
  ...props
}: { type: SectionType } & EditorEntities) {
  const entities = entityLists(props);

  if (type === "PROMO_STRIP") {
    return (
      <Text type="secondary">
        الربط يُعدّ في حقول «عند الضغط» أعلاه — اختر منتج، فئة، أو عروض.
      </Text>
    );
  }
  if (type === "PRODUCT_LIST" || type === "FLASH_SALE") {
    return (
      <>
        <Text type="secondary">رابط «عرض الكل» يُبنى تلقائياً من الفلتر</Text>
        <ProductScopeFields entities={entities} />
      </>
    );
  }
  if (type === "HERO_BANNER") {
    return (
      <Text type="secondary">
        البنرات: اربطها من صفحة البنرات. الفئات: كل أيقونة تفتح قسمها تلقائياً.
      </Text>
    );
  }
  if (
    type === "CATEGORY_GRID" ||
    type === "CATEGORY_TILES" ||
    type === "MAKEUP_CATEGORIES"
  ) {
    return (
      <Text type="secondary">
        كل فئة تفتح منتجاتها تلقائياً. لتخصيص رابط فئة: تبويب «الروابط» → تجاوز رابط فئة.
      </Text>
    );
  }
  if (type === "FEATURED_BRANDS" || type === "BRAND_SHOWCASE") {
    return <Text type="secondary">كل براند يفتح صفحة منتجاته</Text>;
  }
  if (type === "PACKAGES" || type === "ROUTINE_CAROUSEL") {
    return <Text type="secondary">كل باقة تفتح صفحة الباقة (/package/slug)</Text>;
  }
  if (type === "SKIN_CONCERNS") {
    return <Text type="secondary">كل مشكلة تفتح منتجاتها عبر concernSlug</Text>;
  }
  if (type === "BANNER_FULL" || type === "CUSTOM_BANNER" || type.startsWith("BANNER_")) {
    return (
      <Text type="secondary">
        اربط البنر من الأسفل مباشرة (صورة + رابط) أو من صفحة البنرات — يُحل الرابط في API
      </Text>
    );
  }
  if (type === "IMAGE_MARQUEE") {
    return <Text type="secondary">اربط كل صورة من بطاقة العنصر — منتج، قسم، براند…</Text>;
  }
  if (type === "IMAGE_TILES" || type === "CIRCLE_TILES") {
    return <Text type="secondary">اربط كل بطاقة من حقل الرابط داخل العنصر أدناه</Text>;
  }
  if (type === "CARE_HUB") {
    return <Text type="secondary">الروابط تُبنى تلقائياً من المحتوى المختار</Text>;
  }
  return <Text type="secondary">لا إعدادات ربط إضافية — المحتوى يُربط تلقائياً</Text>;
}

export function SectionPayloadEditor(props: Props) {
  const { type, form, tab = "content", ...editorEntities } = props;
  const entities = entityLists(editorEntities);

  if (tab === "style") {
    return <SectionStyleFields showLayout={type === "CATEGORY_GRID"} />;
  }

  if (tab === "link") {
    return <SectionLinkHints type={type} {...editorEntities} />;
  }

  switch (type) {
    case "HERO_BANNER":
      return (
        <>
          <Form.Item name={["payload", "bannerIds"]} label="بنرات السلايدر">
            <EntityMultiPicker items={props.banners ?? []} imageKey="image" placeholder="ابحث واختر البنرات..." />
          </Form.Item>
          <Form.Item name={["payload", "categoryIds"]} label="أيقونات الفئات (حتى 8)">
            <EntityMultiPicker
              items={props.categories ?? []}
              max={8}
              placeholder="ابحث واختر الفئات..."
            />
          </Form.Item>
          <Form.Item name={["payload", "maxItems"]} label="عدد الأيقونات" initialValue={8} hidden>
            <InputNumber min={4} max={8} style={{ width: "100%" }} />
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
          <Form.Item name={["payload", "display"]} label="طريقة العرض" initialValue="chips">
            <Select
              options={[
                { value: "chips", label: "شرائح نصية" },
                { value: "circles", label: "دوائر بصور" },
                { value: "cards", label: "بطاقات" },
              ]}
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
        <>
          <Form.Item name={["payload", "source"]} label="مصدر الإعلان" initialValue="banner">
            <Radio.Group>
              <Radio value="banner">بنر جاهز من المكتبة</Radio>
              <Radio value="inline">صورة + رابط مباشر</Radio>
            </Radio.Group>
          </Form.Item>
          <Form.Item noStyle shouldUpdate={(p, c) => p.payload?.source !== c.payload?.source}>
            {({ getFieldValue }) =>
              getFieldValue(["payload", "source"]) === "inline" ? (
                <>
                  <Form.Item name={["payload", "imageId"]} label="صورة الإعلان" rules={[{ required: true }]}>
                    <MediaPicker label="ارفع أو اختر صورة" />
                  </Form.Item>
                  <Form.Item name={["payload", "title"]} label="عنوان (اختياري)">
                    <Input placeholder="يظهر إذا لم تكن الصورة نصية" />
                  </Form.Item>
                  <Form.Item name={["payload", "discountText"]} label="نص الخصم">
                    <Input placeholder="50%" />
                  </Form.Item>
                  <Typography.Text strong style={{ display: "block", margin: "8px 0" }}>
                    عند الضغط — ينتقل إلى:
                  </Typography.Text>
                  <LinkTargetPicker prefix={["payload"]} entities={entities} optional />
                </>
              ) : (
                <Form.Item name={["payload", "bannerId"]} label="البنر" rules={[{ required: true }]}>
                  <Select
                    showSearch
                    optionFilterProp="label"
                    placeholder="ابحث عن بنر..."
                    options={(props.banners ?? []).map((b) => ({
                      value: b.id,
                      label: b.title ?? b.id,
                    }))}
                  />
                </Form.Item>
              )
            }
          </Form.Item>
        </>
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
                    <Typography.Text strong style={{ display: "block", marginBottom: 8 }}>
                      الرابط
                    </Typography.Text>
                    <LinkTargetPicker prefix={["payload", "items", name]} entities={entities} />
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
          <Form.Item
            name={["payload", "endsAt"]}
            label="وقت انتهاء العرض"
            getValueFromEvent={(d) => (d ? (d as dayjs.Dayjs).toISOString() : undefined)}
            getValueProps={(v) => ({ value: v ? dayjs(v as string) : null })}
          >
            <DatePicker
              showTime={{ format: "HH:mm" }}
              format="YYYY-MM-DD HH:mm"
              style={{ width: "100%" }}
              placeholder="فارغ = من إعدادات المتجر"
              allowClear
            />
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
        <>
          <Form.Item name={["payload", "kind"]} label="نوع الباقة" initialValue="all">
            <Select
              options={[
                { value: "all", label: "كل الأنواع" },
                { value: "GENERAL", label: "عامة" },
                { value: "ROUTINE_MORNING", label: "روتين صباحي" },
                { value: "ROUTINE_EVENING", label: "روتين مسائي" },
                { value: "BRIDAL_KIT", label: "باقة عروس" },
              ]}
            />
          </Form.Item>
          <Form.Item name={["payload", "packageIds"]} label="الباقات">
            <EntityMultiPicker items={props.packages ?? []} placeholder="فارغ = كل الباقات" />
          </Form.Item>
        </>
      );

    case "PROMO_STRIP":
      return (
        <>
          <Form.Item name={["payload", "variant"]} label="شكل العرض" initialValue="news">
            <Select
              options={[
                { value: "news", label: "📰 نشرة إخبارية (عاجل + متحرك)" },
                { value: "ticker", label: "📜 شريط متحرك نحيف" },
                { value: "strip", label: "🎁 بطاقة ترويج" },
              ]}
            />
          </Form.Item>
          <Form.Item name={["payload", "label"]} label="شارة النشرة" initialValue="عاجل">
            <Input placeholder="عاجل / جديد / حصري" maxLength={12} />
          </Form.Item>
          <Form.Item name={["payload", "text"]} label="نص رئيسي">
            <Input placeholder="شحن مجاني للطلبات فوق 50,000 د.ع" />
          </Form.Item>
          <Form.List name={["payload", "items"]}>
            {(fields, { add, remove }) => (
              <>
                <Text strong style={{ display: "block", marginBottom: 8 }}>
                  أسطر النشرة (تتتابع في الشريط المتحرك)
                </Text>
                {fields.map(({ key, name, ...rest }) => (
                  <div key={key} style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                    <Form.Item {...rest} name={name} style={{ flex: 1, marginBottom: 0 }}>
                      <Input placeholder="سطر إخباري..." />
                    </Form.Item>
                    <Button danger type="text" icon={<MinusCircleOutlined />} onClick={() => remove(name)} />
                  </div>
                ))}
                <Button type="dashed" onClick={() => add("")} icon={<PlusOutlined />} block>
                  إضافة سطر
                </Button>
              </>
            )}
          </Form.List>
          <Form.Item name={["payload", "separator"]} label="فاصل بين الأسطر" initialValue="   •   ">
            <Input placeholder="   •   " />
          </Form.Item>
          <Form.Item name={["payload", "icon"]} label="أيقونة (إيموجي)" initialValue="🎁">
            <Input placeholder="🎁" maxLength={4} />
          </Form.Item>
          <Form.Item name={["payload", "showIcon"]} label="إظهار الأيقونة" valuePropName="checked" initialValue={true}>
            <Switch />
          </Form.Item>
          <Form.Item name={["payload", "marquee"]} label="نص متحرك" valuePropName="checked" initialValue={true}>
            <Switch checkedChildren="متحرك" unCheckedChildren="ثابت" />
          </Form.Item>
          <Form.Item name={["payload", "marqueeSpeed"]} label="سرعة الحركة (1–10)" initialValue={5}>
            <InputNumber min={1} max={10} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name={["payload", "backgroundColor"]} label="لون الخلفية" initialValue="#FCE4EC">
            <Input placeholder="#FCE4EC" />
          </Form.Item>
          <Form.Item name={["payload", "textColor"]} label="لون النص">
            <Input placeholder="#2A2826" />
          </Form.Item>
          <Alert
            type="info"
            showIcon
            message="الربط"
            description="اضبط وجهة الضغط من تبويب «الروابط»."
            style={{ marginTop: 8 }}
          />
        </>
      );

    case "IMAGE_MARQUEE":
      return (
        <>
          <Text type="secondary" style={{ display: "block", marginBottom: 12 }}>
            أضف صوراً تتحرك أفقياً — كل صورة قابلة للربط بمنتج أو قسم أو براند
          </Text>
          <Form.List name={["payload", "items"]}>
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...rest }) => (
                  <Card
                    key={key}
                    size="small"
                    title={`صورة ${name + 1}`}
                    style={{ marginBottom: 10 }}
                    extra={
                      <Button danger type="link" icon={<MinusCircleOutlined />} onClick={() => remove(name)}>
                        حذف
                      </Button>
                    }
                  >
                    <Form.Item {...rest} name={[name, "imageId"]} label="الصورة" rules={[{ required: true }]}>
                      <MediaPicker label="اختر صورة الإعلان" />
                    </Form.Item>
                    <Form.Item {...rest} name={[name, "title"]} label="عنوان (اختياري)">
                      <Input placeholder="للمعاينة في لوحة التحكم" />
                    </Form.Item>
                    <Typography.Text strong style={{ display: "block", marginBottom: 8 }}>
                      عند الضغط — ينتقل إلى:
                    </Typography.Text>
                    <LinkTargetPicker prefix={["payload", "items", name]} entities={entities} />
                  </Card>
                ))}
                <Button type="dashed" onClick={() => add({})} block icon={<PlusOutlined />}>
                  + صورة متحركة
                </Button>
              </>
            )}
          </Form.List>
        </>
      );

    case "IMAGE_TILES":
      return (
        <>
          <Form.Item name={["payload", "shape"]} label="شكل البطاقة" initialValue="rect">
            <Select
              options={[
                { value: "rect", label: "مستطيل" },
                { value: "circle", label: "دائرة" },
              ]}
            />
          </Form.Item>
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

    case "CIRCLE_TILES":
      return (
        <>
          <Form.Item name={["payload", "sectionLayout"]} label="التخطيط" initialValue="row">
            <Select
              options={[
                { value: "row", label: "صف أفقي" },
                { value: "grid3", label: "شبكة 3 أعمدة" },
                { value: "grid", label: "شبكة 4 أعمدة" },
              ]}
            />
          </Form.Item>
          <Form.Item name={["payload", "maxItems"]} label="الحد الأقصى" initialValue={12}>
            <InputNumber min={3} max={16} style={{ width: "100%" }} />
          </Form.Item>
          <Form.List name={["payload", "items"]}>
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...rest }) => (
                  <Card
                    key={key}
                    size="small"
                    title={`دائرة ${name + 1}`}
                    style={{ marginBottom: 10 }}
                    extra={
                      <Button danger type="link" icon={<MinusCircleOutlined />} onClick={() => remove(name)}>
                        حذف
                      </Button>
                    }
                  >
                    <Form.Item {...rest} name={[name, "imageId"]} label="الصورة" rules={[{ required: true }]}>
                      <MediaPicker label="اختر صورة" />
                    </Form.Item>
                    <Form.Item {...rest} name={[name, "title"]} label="العنوان">
                      <Input placeholder="عنوان الدائرة" />
                    </Form.Item>
                    <Form.Item {...rest} name={[name, "subtitle"]} label="وصف قصير">
                      <Input placeholder="نص ثانوي" />
                    </Form.Item>
                    <Text strong style={{ display: "block", marginBottom: 8 }}>
                      الرابط
                    </Text>
                    <LinkTargetPicker prefix={["payload", "items", name]} entities={entities} />
                    <Form.Item {...rest} name={[name, "cardSize"]} label="حجم الدائرة" initialValue="md">
                      <CardSizePicker context="category" compact />
                    </Form.Item>
                  </Card>
                ))}
                <Button type="dashed" onClick={() => add({})} block icon={<PlusOutlined />}>
                  + دائرة جديدة
                </Button>
              </>
            )}
          </Form.List>
        </>
      );

    case "ROUTINE_CAROUSEL":
      return (
        <>
          <Form.Item name={["payload", "kind"]} label="نوع الروتين" initialValue="ROUTINE_MORNING">
            <Select
              options={[
                { value: "ROUTINE_MORNING", label: "روتين صباحي" },
                { value: "ROUTINE_EVENING", label: "روتين مسائي" },
                { value: "both", label: "صباحي + مسائي" },
              ]}
            />
          </Form.Item>
          <Form.Item name={["payload", "packageIds"]} label="باقات محددة (اختياري)">
            <EntityMultiPicker items={props.packages ?? []} placeholder="فارغ = تلقائي حسب النوع" />
          </Form.Item>
          <Form.Item name={["payload", "limit"]} label="عدد الباقات" initialValue={8}>
            <InputNumber min={2} max={16} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name={["payload", "showViewAll"]} label="عرض الكل" valuePropName="checked" initialValue>
            <Switch />
          </Form.Item>
        </>
      );

    case "CARE_HUB":
      return (
        <>
          <Form.Item name={["payload", "layout"]} label="التخطيط" initialValue="stacked">
            <Select
              options={[
                { value: "stacked", label: "أقسام مكدسة" },
                { value: "tabs", label: "تبويبات" },
              ]}
            />
          </Form.Item>
          <Form.Item name={["payload", "routineKinds"]} label="أنواع الروتين">
            <Select
              mode="multiple"
              options={[
                { value: "ROUTINE_MORNING", label: "🌅 روتين صباحي" },
                { value: "ROUTINE_EVENING", label: "🌙 روتين مسائي" },
              ]}
              placeholder="صباحي + مسائي"
            />
          </Form.Item>
          <Form.Item name={["payload", "concernIds"]} label="مشاكل البشرة">
            <Select
              mode="multiple"
              options={(props.skinConcerns ?? []).map((c) => ({
                value: c.id,
                label: `${c.icon ?? "✨"} ${c.name ?? c.slug ?? c.id}`,
              }))}
              placeholder="فارغ = الكل"
            />
          </Form.Item>
          <Form.Item name={["payload", "categoryIds"]} label="فئات العناية">
            <EntityMultiPicker items={props.categories ?? []} max={8} />
          </Form.Item>
          <Form.Item name={["payload", "morningPackageIds"]} label="باقات روتين صباحي">
            <EntityMultiPicker items={props.packages ?? []} max={6} />
          </Form.Item>
          <Form.Item name={["payload", "eveningPackageIds"]} label="باقات روتين مسائي">
            <EntityMultiPicker items={props.packages ?? []} max={6} />
          </Form.Item>
          <Form.Item name={["payload", "productFilter"]} label="منتجات العناية" initialValue="featured">
            <Select options={PRODUCT_FILTERS} />
          </Form.Item>
          <Form.Item name={["payload", "productLimit"]} label="عدد المنتجات" initialValue={8}>
            <InputNumber min={4} max={16} style={{ width: "100%" }} />
          </Form.Item>
        </>
      );

    case "SECTION_GROUP":
      return (
        <>
          <FrameStyleFields />
          <Divider plain>الأقسام داخل الإطار</Divider>
          <GroupChildrenEditor entities={props} />
        </>
      );

    case "MEDIA_GALLERY":
      return (
        <>
          <Form.Item name={["payload", "display"]} label="طريقة العرض" initialValue="scroll">
            <Select options={MEDIA_DISPLAY_OPTIONS} />
          </Form.Item>
          <Form.Item name={["payload", "shape"]} label="شكل الصور" initialValue="rounded">
            <Select options={MEDIA_SHAPE_OPTIONS} />
          </Form.Item>
          <Form.Item name={["payload", "size"]} label="الحجم" initialValue="md">
            <Select options={MEDIA_SIZE_OPTIONS} />
          </Form.Item>
          <Form.Item name={["payload", "height"]} label="ارتفاع الصورة (px)" initialValue={140}>
            <InputNumber min={60} max={320} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name={["payload", "gap"]} label="المسافة بين الصور" initialValue={12}>
            <InputNumber min={4} max={32} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item noStyle shouldUpdate={(prev, cur) => prev?.payload?.display !== cur?.payload?.display}>
            {({ getFieldValue }) =>
              getFieldValue(["payload", "display"]) === "grid" ? (
                <Form.Item name={["payload", "columns"]} label="عدد الأعمدة" initialValue={3}>
                  <InputNumber min={2} max={4} style={{ width: "100%" }} />
                </Form.Item>
              ) : getFieldValue(["payload", "display"]) === "marquee" ? (
                <Form.Item name={["payload", "marqueeSpeed"]} label="سرعة الحركة" initialValue={5}>
                  <InputNumber min={1} max={12} style={{ width: "100%" }} />
                </Form.Item>
              ) : null
            }
          </Form.Item>
          <Divider plain>الصور</Divider>
          <Form.List name={["payload", "items"]}>
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...rest }) => (
                  <Card
                    key={key}
                    size="small"
                    title={`صورة ${name + 1}`}
                    style={{ marginBottom: 10 }}
                    extra={
                      <Button danger type="link" icon={<MinusCircleOutlined />} onClick={() => remove(name)}>
                        حذف
                      </Button>
                    }
                  >
                    <Form.Item {...rest} name={[name, "imageId"]} label="الصورة" rules={[{ required: true }]}>
                      <MediaPicker label="اختر صورة" />
                    </Form.Item>
                    <Form.Item {...rest} name={[name, "title"]} label="تسمية (اختياري)">
                      <Input />
                    </Form.Item>
                    <Form.Item {...rest} name={[name, "shape"]} label="شكل (تجاوز)">
                      <Select allowClear options={MEDIA_SHAPE_OPTIONS} placeholder="افتراضي القسم" />
                    </Form.Item>
                    <LinkTargetPicker prefix={["payload", "items", name]} entities={entities} />
                  </Card>
                ))}
                <Button type="dashed" onClick={() => add({})} block icon={<PlusOutlined />}>
                  + صورة
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
