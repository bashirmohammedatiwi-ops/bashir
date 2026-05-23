"use client";

import dynamic from "next/dynamic";
import {
  Button,
  Divider,
  Drawer,
  Form,
  Input,
  InputNumber,
  Select,
  Space,
  Switch,
  type FormInstance,
} from "antd";
import type { ImageItem } from "@/components/ProductImageDropzone";
import { ProductShadesEditor } from "@/components/ProductShadesEditor";
import { WizardTabs, type WizardTabItem } from "@/components/WizardTabs";
import { useFormWizard } from "@/hooks/useFormWizard";

const ProductImageDropzone = dynamic(
  () => import("@/components/ProductImageDropzone").then((m) => ({ default: m.ProductImageDropzone })),
  { ssr: false, loading: () => <div className="alhayaa-skeleton-block" /> },
);

const SKIN_TYPES = [
  { value: "جافة", label: "جافة" },
  { value: "دهنية", label: "دهنية" },
  { value: "مختلطة", label: "مختلطة" },
  { value: "حساسة", label: "حساسة" },
  { value: "عادية", label: "عادية" },
];

export const PRODUCT_WIZARD_TABS: WizardTabItem[] = [
  { key: "basic", label: "أساسي" },
  { key: "pricing", label: "السعر" },
  { key: "content", label: "الوصف" },
  { key: "images", label: "الصور" },
  { key: "shades", label: "الألوان" },
  { key: "variants", label: "المقاسات" },
  { key: "flags", label: "الإعدادات" },
];

const TAB_KEYS = PRODUCT_WIZARD_TABS.map((t) => t.key);

function TabPanel({
  tabKey,
  activeTab,
  children,
  className = "",
}: {
  tabKey: string;
  activeTab: string;
  children: React.ReactNode;
  className?: string;
}) {
  const visible = tabKey === activeTab;
  return (
    <div
      className={`alhayaa-form-section ${className}`.trim()}
      hidden={!visible}
      aria-hidden={!visible}
    >
      {children}
    </div>
  );
}

type ProductFormDrawerProps = {
  open: boolean;
  editing: { id?: string; name?: string } | null;
  activeTab: string;
  setActiveTab: (key: string) => void;
  form: FormInstance;
  saving: boolean;
  productImages: ImageItem[];
  setProductImages: (items: ImageItem[]) => void;
  shadePreviews: Record<number, ImageItem | null>;
  setShadePreviews: React.Dispatch<React.SetStateAction<Record<number, ImageItem | null>>>;
  categoriesData: any[];
  brandsData: any[];
  subcategoryOptions: { value: string; label: string }[];
  pricingFromSync?: boolean;
  syncLoading?: boolean;
  syncMeta?: { offerName?: string; syncedAt?: string } | null;
  onBarcodeLookup?: (barcode: string) => void;
  onClose: () => void;
  onSubmit: (values: any) => void;
};

export function ProductFormDrawer({
  open,
  editing,
  activeTab,
  setActiveTab,
  form,
  saving,
  productImages,
  setProductImages,
  shadePreviews,
  setShadePreviews,
  categoriesData,
  brandsData,
  subcategoryOptions,
  pricingFromSync = false,
  syncLoading = false,
  syncMeta = null,
  onBarcodeLookup,
  onClose,
  onSubmit,
}: ProductFormDrawerProps) {
  useFormWizard(TAB_KEYS, activeTab, setActiveTab, {
    enabled: open,
    onSave: () => form.submit(),
    onClose,
  });

  const tabsWithCounts = PRODUCT_WIZARD_TABS.map((t) =>
    t.key === "images" ? { ...t, label: `الصور (${productImages.length})` } : t,
  );

  return (
    <Drawer
      title={
        <div className="alhayaa-drawer-title">
          <span>{editing?.id ? "تعديل منتج" : "منتج جديد"}</span>
          {editing?.name ? <small>{editing.name}</small> : null}
        </div>
      }
      open={open}
      onClose={onClose}
      width={920}
      destroyOnHidden
      className="alhayaa-product-drawer"
      extra={
        <Space>
          <Button onClick={onClose}>إلغاء</Button>
          <Button type="primary" loading={saving} onClick={() => form.submit()}>
            حفظ المنتج
          </Button>
        </Space>
      }
    >
      <WizardTabs tabs={tabsWithCounts} activeKey={activeTab} onChange={setActiveTab} />

      <Form
        layout="vertical"
        form={form}
        onFinish={onSubmit}
        className="alhayaa-product-form"
        onFinishFailed={(info) => {
          const field = String(info.errorFields[0]?.name?.[0] ?? "");
          if (["name", "sku", "slug", "brandId", "categoryId", "subcategoryId", "tags", "skinType"].includes(field)) {
            setActiveTab("basic");
          } else if (["price", "stock", "originalPrice", "discountPercent", "pointsEarned", "rating"].includes(field)) {
            setActiveTab("pricing");
          }
        }}
      >
        <TabPanel tabKey="basic" activeTab={activeTab}>
            <Form.Item name="name" label="اسم المنتج" rules={[{ required: true }]}>
              <Input placeholder="كريم مرطب فاخر" autoFocus />
            </Form.Item>
            <div className="alhayaa-form-row">
              <Form.Item name="sku" label="SKU" className="alhayaa-form-col">
                <Input placeholder="يُولَّد تلقائياً" />
              </Form.Item>
              <Form.Item name="slug" label="Slug" className="alhayaa-form-col">
                <Input placeholder="يُولَّد من الاسم" />
              </Form.Item>
            </div>
            <Form.Item name="barcode" label="الباركود">
              <Input.Search
                placeholder="امسح أو أدخل الباركود — يُجلب السعر والكمية تلقائياً"
                loading={syncLoading}
                enterButton="جلب"
                onSearch={(v) => onBarcodeLookup?.(v)}
                onBlur={(e) => {
                  const v = e.target.value.trim();
                  if (v) onBarcodeLookup?.(v);
                }}
              />
            </Form.Item>
            <Form.Item name="brandId" label="البراند" rules={[{ required: true }]}>
              <Select
                showSearch
                optionFilterProp="label"
                placeholder="اختر البراند"
                options={(brandsData ?? []).map((b: any) => ({ value: b.id, label: b.name }))}
              />
            </Form.Item>
            <div className="alhayaa-form-row">
              <Form.Item
                name="categoryId"
                label="الفئة"
                className="alhayaa-form-col"
                rules={[{ required: true }]}
              >
                <Select
                  placeholder="اختر الفئة"
                  options={(categoriesData ?? []).map((c: any) => ({ value: c.id, label: c.name }))}
                  onChange={() => form.setFieldValue("subcategoryId", undefined)}
                />
              </Form.Item>
              {subcategoryOptions.length > 0 && (
                <Form.Item
                  name="subcategoryId"
                  label="القسم الفرعي"
                  className="alhayaa-form-col"
                  rules={[{ required: true, message: "اختر القسم الفرعي" }]}
                >
                  <Select placeholder="اختر القسم الفرعي" options={subcategoryOptions} />
                </Form.Item>
              )}
            </div>
            <Form.Item name="tags" label="الوسوم (مفصولة بفاصلة)">
              <Input placeholder="شفاه, مات, فاخر" />
            </Form.Item>
            <Form.Item name="skinType" label="نوع البشرة المناسب">
              <Select mode="multiple" options={SKIN_TYPES} placeholder="اختر..." />
            </Form.Item>
        </TabPanel>

        <TabPanel tabKey="pricing" activeTab={activeTab}>
            {pricingFromSync ? (
              <div className="alhayaa-sync-banner">
                الأسعار والكمية من بيانات المزامنة (POS) — لا تُعدَّل يدوياً
                {syncMeta?.offerName ? ` — عرض: ${syncMeta.offerName}` : ""}
              </div>
            ) : null}
            <div className="alhayaa-form-row">
              <Form.Item
                name="price"
                label="السعر (د.ع)"
                className="alhayaa-form-col"
                rules={[{ required: true }]}
              >
                <InputNumber style={{ width: "100%" }} min={0} disabled={pricingFromSync} />
              </Form.Item>
              <Form.Item name="originalPrice" label="السعر الأصلي" className="alhayaa-form-col">
                <InputNumber style={{ width: "100%" }} min={0} disabled={pricingFromSync} />
              </Form.Item>
            </div>
            <div className="alhayaa-form-row">
              <Form.Item name="discountPercent" label="نسبة الخصم %" className="alhayaa-form-col">
                <InputNumber style={{ width: "100%" }} min={0} max={100} disabled={pricingFromSync} />
              </Form.Item>
              <Form.Item
                name="stock"
                label="المخزون"
                className="alhayaa-form-col"
                rules={[{ required: true }]}
              >
                <InputNumber style={{ width: "100%" }} min={0} disabled={pricingFromSync} />
              </Form.Item>
            </div>
            <div className="alhayaa-form-row">
              <Form.Item name="pointsEarned" label="نقاط الولاء" className="alhayaa-form-col">
                <InputNumber style={{ width: "100%" }} min={0} />
              </Form.Item>
              <Form.Item name="rating" label="التقييم" className="alhayaa-form-col">
                <InputNumber style={{ width: "100%" }} min={0} max={5} step={0.1} />
              </Form.Item>
            </div>
        </TabPanel>

        <TabPanel tabKey="content" activeTab={activeTab}>
            <Form.Item name="description" label="وصف المنتج">
              <Input.TextArea rows={5} placeholder="وصف تفصيلي يظهر في صفحة المنتج..." />
            </Form.Item>
            <Form.Item name="ingredients" label="المكونات / المواد">
              <Input.TextArea rows={4} placeholder="Aqua, Glycerin, Niacinamide..." />
            </Form.Item>
            <Form.Item name="howToUse" label="طريقة الاستخدام">
              <Input.TextArea rows={4} placeholder="1. نظّفي البشرة..." />
            </Form.Item>
        </TabPanel>

        <TabPanel tabKey="images" activeTab={activeTab}>
            <ProductImageDropzone
              items={productImages}
              onChange={setProductImages}
              purpose="PRODUCT"
              max={12}
            />
        </TabPanel>

        <TabPanel tabKey="shades" activeTab={activeTab}>
            <Form.List name="shades">
              {(fields, { add, remove }) => (
                <ProductShadesEditor
                  fields={fields}
                  add={add}
                  remove={remove}
                  form={form}
                  shadePreviews={shadePreviews}
                  setShadePreviews={setShadePreviews}
                  onShadeBarcodeLookup={onBarcodeLookup}
                />
              )}
            </Form.List>
        </TabPanel>

        <TabPanel tabKey="variants" activeTab={activeTab}>
            <Form.List name="variants">
              {(fields, { add, remove: rm }) => (
                <div className="alhayaa-variants-list">
                  <div className="alhayaa-variants-head">
                    <strong>المقاسات / المتغيرات</strong>
                    <Button size="small" type="dashed" onClick={() => add()}>
                      + متغير
                    </Button>
                  </div>
                  {fields.length === 0 && (
                    <p className="alhayaa-empty-hint">لا توجد متغيرات — أضف مقاساً أو حجمًا مختلفاً</p>
                  )}
                  {fields.map((f) => (
                    <div key={f.key} className="alhayaa-variant-row">
                      <Form.Item
                        {...f}
                        name={[f.name, "label"]}
                        label="التسمية"
                        rules={[{ required: true }]}
                      >
                        <Input placeholder="30ml" />
                      </Form.Item>
                      <Form.Item {...f} name={[f.name, "sizeLabel"]} label="المقاس">
                        <Input placeholder="30 مل" />
                      </Form.Item>
                      <Form.Item {...f} name={[f.name, "priceDelta"]} label="فرق السعر">
                        <InputNumber placeholder="0" />
                      </Form.Item>
                      <Form.Item {...f} name={[f.name, "stock"]} label="مخزون">
                        <InputNumber min={0} placeholder="0" />
                      </Form.Item>
                      <Button danger type="text" onClick={() => rm(f.name)}>
                        حذف
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </Form.List>
        </TabPanel>

        <TabPanel tabKey="flags" activeTab={activeTab} className="alhayaa-flags-grid">
            <Form.Item name="isFeatured" label="منتج مميز" valuePropName="checked">
              <Switch />
            </Form.Item>
            <Form.Item name="isNew" label="منتج جديد" valuePropName="checked">
              <Switch />
            </Form.Item>
            <Form.Item name="isBestSeller" label="الأكثر مبيعاً" valuePropName="checked">
              <Switch />
            </Form.Item>
            <Form.Item name="isPromo" label="عرض ترويجي" valuePropName="checked">
              <Switch />
            </Form.Item>
            <Form.Item name="isBogo" label="BOGO" valuePropName="checked">
              <Switch />
            </Form.Item>
            <Divider className="alhayaa-flags-divider" />
            <Form.Item name="isActive" label="نشط ومتاح للبيع" valuePropName="checked">
              <Switch />
            </Form.Item>
        </TabPanel>
      </Form>
    </Drawer>
  );
}
