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
import { ProductShadesEditor, initShadePreviews, shadeFromApi } from "@/components/ProductShadesEditor";
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

      <Form layout="vertical" form={form} onFinish={onSubmit} className="alhayaa-product-form">
        {activeTab === "basic" && (
          <div className="alhayaa-form-section">
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
          </div>
        )}

        {activeTab === "pricing" && (
          <div className="alhayaa-form-section">
            <div className="alhayaa-form-row">
              <Form.Item
                name="price"
                label="السعر (د.ع)"
                className="alhayaa-form-col"
                rules={[{ required: true }]}
              >
                <InputNumber style={{ width: "100%" }} min={0} />
              </Form.Item>
              <Form.Item name="originalPrice" label="السعر الأصلي" className="alhayaa-form-col">
                <InputNumber style={{ width: "100%" }} min={0} />
              </Form.Item>
            </div>
            <div className="alhayaa-form-row">
              <Form.Item name="discountPercent" label="نسبة الخصم %" className="alhayaa-form-col">
                <InputNumber style={{ width: "100%" }} min={0} max={100} />
              </Form.Item>
              <Form.Item
                name="stock"
                label="المخزون"
                className="alhayaa-form-col"
                rules={[{ required: true }]}
              >
                <InputNumber style={{ width: "100%" }} min={0} />
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
          </div>
        )}

        {activeTab === "content" && (
          <div className="alhayaa-form-section">
            <Form.Item name="description" label="وصف المنتج">
              <Input.TextArea rows={5} placeholder="وصف تفصيلي يظهر في صفحة المنتج..." />
            </Form.Item>
            <Form.Item name="ingredients" label="المكونات / المواد">
              <Input.TextArea rows={4} placeholder="Aqua, Glycerin, Niacinamide..." />
            </Form.Item>
            <Form.Item name="howToUse" label="طريقة الاستخدام">
              <Input.TextArea rows={4} placeholder="1. نظّفي البشرة..." />
            </Form.Item>
          </div>
        )}

        {activeTab === "images" && (
          <div className="alhayaa-form-section">
            <ProductImageDropzone
              items={productImages}
              onChange={setProductImages}
              purpose="PRODUCT"
              max={12}
            />
          </div>
        )}

        {activeTab === "shades" && (
          <div className="alhayaa-form-section">
            <Form.List name="shades">
              {(fields, { add, remove }) => (
                <ProductShadesEditor
                  fields={fields}
                  add={add}
                  remove={remove}
                  form={form}
                  shadePreviews={shadePreviews}
                  setShadePreviews={setShadePreviews}
                />
              )}
            </Form.List>
          </div>
        )}

        {activeTab === "variants" && (
          <div className="alhayaa-form-section">
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
          </div>
        )}

        {activeTab === "flags" && (
          <div className="alhayaa-form-section alhayaa-flags-grid">
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
          </div>
        )}
      </Form>
    </Drawer>
  );
}
