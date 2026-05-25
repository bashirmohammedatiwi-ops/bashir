"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Form, Input, InputNumber, Modal, Select, Space, Switch, message } from "antd";
import { useEffect, useMemo, useState } from "react";
import { PackageCoverPicker } from "@/components/packages/PackageCoverPicker";
import { PackageProductsEditor } from "@/components/packages/PackageProductsEditor";
import {
  PACKAGE_KINDS,
  type SkinRoutineKind,
  defaultSlugForKind,
  toFormValues,
  toPayload,
} from "@/lib/packageForm";
import {
  type ResolvedPackageProduct,
  packageProductFromItem,
} from "@/lib/resolveProductByBarcode";
import { mutations } from "@/lib/queries";

type PackageFormModalProps = {
  open: boolean;
  editing: any | null;
  onClose: () => void;
  onSaved?: () => void;
  defaultKind?: string;
  lockKind?: boolean;
  title?: string;
  coverVariant?: "default" | "hero";
  productsTitle?: string;
};

export function PackageFormModal({
  open,
  editing,
  onClose,
  onSaved,
  defaultKind = "GENERAL",
  lockKind = false,
  title,
  coverVariant = "default",
  productsTitle,
}: PackageFormModalProps) {
  const qc = useQueryClient();
  const [form] = Form.useForm();
  const [packageProducts, setPackageProducts] = useState<ResolvedPackageProduct[]>([]);
  const kindWatch = Form.useWatch("kind", form) as string | undefined;
  const coverId = Form.useWatch("coverImageId", form) as string | undefined;
  const coverPreview =
    editing?.coverImage &&
    (editing.coverImage.id === coverId || editing.coverImageId === coverId)
      ? editing.coverImage
      : undefined;

  useEffect(() => {
    if (!open) return;
    if (editing) {
      setPackageProducts(
        (editing.items ?? [])
          .map(packageProductFromItem)
          .filter(Boolean) as ResolvedPackageProduct[],
      );
      form.setFieldsValue(toFormValues(editing));
      return;
    }
    setPackageProducts([]);
    form.resetFields();
    form.setFieldsValue({
      isActive: true,
      isFeatured: true,
      position: 0,
      kind: defaultKind,
      badge: defaultKind.startsWith("ROUTINE_") ? "روتين" : undefined,
    });
  }, [open, editing, defaultKind, form]);

  const coverHint = useMemo(() => {
    if (kindWatch === "ROUTINE_MORNING") {
      return "يفضّل صورة مشرقة توضّح خطوات الصباح (تنظيف، ترطيب، واقي...)";
    }
    if (kindWatch === "ROUTINE_EVENING") {
      return "يفضّل صورة هادئة لخطوات المساء (تنظيف، سيروم، كريم ليل...)";
    }
    return undefined;
  }, [kindWatch]);

  const upsert = useMutation({
    mutationFn: async (values: any) => {
      const payload = toPayload(values, packageProducts.map((p) => p.id));
      return editing?.id
        ? mutations.updatePackage(editing.id, payload)
        : mutations.createPackage(payload);
    },
    onSuccess: () => {
      message.success(editing ? "تم التحديث" : "تم الإنشاء");
      qc.invalidateQueries({ queryKey: ["packages"] });
      onSaved?.();
      onClose();
    },
    onError: () => message.error("تعذر الحفظ"),
  });

  const modalTitle =
    title ??
    (editing
      ? lockKind
        ? "تعديل الروتين"
        : "تعديل الباقة"
      : lockKind
        ? "روتين جديد"
        : "باقة جديدة");

  return (
    <Modal
      title={modalTitle}
      open={open}
      onCancel={onClose}
      onOk={() => form.submit()}
      confirmLoading={upsert.isPending}
      okText="حفظ"
      cancelText="إلغاء"
      destroyOnHidden
      width={780}
    >
      <Form layout="vertical" form={form} onFinish={(v) => upsert.mutate(v)}>
        <div className="alhayaa-package-form-grid">
          <div className="alhayaa-package-form-cover">
            <Form.Item name="coverImageId" label="صورة الغلاف">
              <PackageCoverPicker
                variant={coverVariant}
                hint={coverHint}
                previewImage={coverPreview}
              />
            </Form.Item>
          </div>

          <div className="alhayaa-package-form-fields">
            <Form.Item name="name" label="الاسم" rules={[{ required: true }]}>
              <Input placeholder="روتين صباحي للبشرة الجافة" />
            </Form.Item>

            {!lockKind ? (
              <Form.Item name="kind" label="النوع" rules={[{ required: true }]}>
                <Select
                  options={PACKAGE_KINDS.map((k) => ({
                    value: k.value,
                    label: `${k.icon} ${k.label}`.trim(),
                  }))}
                />
              </Form.Item>
            ) : (
              <Form.Item name="kind" hidden>
                <Input />
              </Form.Item>
            )}

            <Form.Item name="slug" label="Slug">
              <Input
                placeholder={defaultSlugForKind(
                  (kindWatch as SkinRoutineKind) ?? defaultKind,
                )}
              />
            </Form.Item>

            <Form.Item name="subtitle" label="الوصف المختصر">
              <Input.TextArea rows={2} placeholder="3 خطوات: تنظيف → ترطيب → واقي" />
            </Form.Item>

            <Form.Item name="badge" label="شارة">
              <Input placeholder="روتين · الأكثر طلباً" />
            </Form.Item>

            <Space.Compact block>
              <Form.Item
                name="price"
                label="سعر الباقة"
                style={{ flex: 1 }}
                rules={[{ required: true }]}
              >
                <InputNumber style={{ width: "100%" }} min={0} />
              </Form.Item>
              <Form.Item
                name="originalPrice"
                label="السعر قبل الخصم"
                style={{ flex: 1, marginInlineStart: 8 }}
              >
                <InputNumber style={{ width: "100%" }} min={0} />
              </Form.Item>
            </Space.Compact>

            <Space.Compact block>
              <Form.Item name="position" label="الترتيب" style={{ flex: 1 }}>
                <InputNumber style={{ width: "100%" }} min={0} />
              </Form.Item>
              <Form.Item
                name="isFeatured"
                label="مميز"
                valuePropName="checked"
                style={{ flex: 1, marginInlineStart: 8 }}
              >
                <Switch />
              </Form.Item>
              <Form.Item
                name="isActive"
                label="نشط"
                valuePropName="checked"
                style={{ flex: 1, marginInlineStart: 8 }}
              >
                <Switch />
              </Form.Item>
            </Space.Compact>
          </div>
        </div>

        <PackageProductsEditor
          products={packageProducts}
          onChange={setPackageProducts}
          ordered
          title={productsTitle ?? "خطوات الروتين (بالباركود)"}
          emptyText="أضف منتجات الروتين بالترتيب — امسح الباركود لكل خطوة"
          scopeLabel="الروتين"
        />
      </Form>
    </Modal>
  );
}
