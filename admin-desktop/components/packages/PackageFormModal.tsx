"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Alert,
  Button,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Space,
  Spin,
  Switch,
  Tabs,
  message,
} from "antd";
import dayjs from "dayjs";
import { useEffect, useMemo, useState } from "react";
import { PackageCoverPicker } from "@/components/packages/PackageCoverPicker";
import { PackageProductsEditor } from "@/components/packages/PackageProductsEditor";
import { WorldSlugsSelect } from "@/components/WorldSlugsSelect";
import { SKIN_TYPES } from "@/lib/beauty";
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
import { mutations, queries } from "@/lib/queries";

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
  /** يحدّ اختيار النوع (مثلاً الباقات بلا أنواع الروتين). */
  kindOptions?: string[];
};

const fmt = (n: number) => `${Math.round(n).toLocaleString()} د.ع`;

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
  kindOptions,
}: PackageFormModalProps) {
  const qc = useQueryClient();
  const [form] = Form.useForm();
  const [packageProducts, setPackageProducts] = useState<ResolvedPackageProduct[]>([]);
  const kindWatch = Form.useWatch("kind", form) as string | undefined;
  const priceWatch = Form.useWatch("price", form) as number | undefined;
  const coverId = Form.useWatch("coverImageId", form) as string | undefined;
  const isRoutine = (kindWatch ?? defaultKind).startsWith("ROUTINE_");

  // التعديل: نجلب الباقة كاملة بمنتجاتها — القائمة المختصرة لا تحمل المنتجات،
  // والحفظ بدونها كان يمسح خطوات الباقة.
  const full = useQuery({
    queryKey: ["package-admin", editing?.id],
    queryFn: () => queries.packageAdmin(editing!.id),
    enabled: open && !!editing?.id,
    staleTime: 0,
  });
  const source = editing?.id ? (full.data as any) : null;
  const loadingFull = !!editing?.id && full.isLoading;

  const { data: concerns } = useQuery({
    queryKey: ["skin-concerns-admin"],
    queryFn: () => queries.skinConcerns(true),
    enabled: open,
  });

  const coverPreview =
    source?.coverImage && (source.coverImage.id === coverId || source.coverImageId === coverId)
      ? source.coverImage
      : undefined;

  useEffect(() => {
    if (!open) return;
    if (editing?.id) {
      if (!source) return;
      setPackageProducts(
        (source.items ?? []).map(packageProductFromItem).filter(Boolean) as ResolvedPackageProduct[],
      );
      form.setFieldsValue({
        ...toFormValues(source),
        description: source.description ?? "",
        worldSlugs: source.worldSlugs ?? [],
        concernSlugs: source.concernSlugs ?? [],
        skinTypes: source.skinTypes ?? [],
        endsAt: source.endsAt ? dayjs(source.endsAt) : null,
      });
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
      worldSlugs: [],
      concernSlugs: [],
      skinTypes: [],
    });
  }, [open, editing?.id, source, defaultKind, form]);

  const itemsTotal = useMemo(
    () => packageProducts.reduce((s, p) => s + (p.price ?? 0) * (p.quantity ?? 1), 0),
    [packageProducts],
  );
  const price = Number(priceWatch) || 0;
  const saving = itemsTotal - price;
  const percent = itemsTotal > 0 ? Math.round((saving / itemsTotal) * 100) : 0;

  const coverHint = useMemo(() => {
    if (kindWatch === "ROUTINE_MORNING") return "يفضّل صورة مشرقة توضّح خطوات الصباح (تنظيف، ترطيب، واقي...)";
    if (kindWatch === "ROUTINE_EVENING") return "يفضّل صورة هادئة لخطوات المساء (تنظيف، سيروم، كريم ليل...)";
    return "صورة الباقة كاملة (المنتجات معاً) — تظهر في الرئيسية وصفحة الباقة";
  }, [kindWatch]);

  const upsert = useMutation({
    mutationFn: async (values: any) => {
      const payload = {
        ...toPayload(values, packageProducts.map((p) => p.id)),
        description: values.description ?? "",
        worldSlugs: values.worldSlugs ?? [],
        concernSlugs: values.concernSlugs ?? [],
        skinTypes: values.skinTypes ?? [],
        endsAt: values.endsAt ? dayjs(values.endsAt).toISOString() : null,
        items: packageProducts.map((p) => ({
          productId: p.id,
          stepTitle: p.stepTitle ?? null,
          note: p.note ?? null,
          quantity: p.quantity ?? 1,
        })),
      };
      return editing?.id ? mutations.updatePackage(editing.id, payload) : mutations.createPackage(payload);
    },
    onSuccess: () => {
      message.success(editing ? "تم التحديث" : "تم الإنشاء");
      qc.invalidateQueries({ queryKey: ["packages"] });
      qc.invalidateQueries({ queryKey: ["package-admin"] });
      qc.invalidateQueries({ queryKey: ["showcase"] });
      onSaved?.();
      onClose();
    },
    onError: (e: any) => message.error(e?.response?.data?.message ?? "تعذر الحفظ"),
  });

  const submit = () => {
    if (!packageProducts.length) {
      message.warning(isRoutine ? "أضيفي خطوات الروتين أولاً" : "أضيفي منتجات الباقة أولاً");
      return;
    }
    form.submit();
  };

  const modalTitle =
    title ?? (editing ? (lockKind ? "تعديل الروتين" : "تعديل الباقة") : lockKind ? "روتين جديد" : "باقة جديدة");

  const kinds = PACKAGE_KINDS.filter((k) => !kindOptions || kindOptions.includes(k.value));

  return (
    <Modal
      title={modalTitle}
      open={open}
      onCancel={onClose}
      onOk={submit}
      confirmLoading={upsert.isPending}
      okText="حفظ"
      cancelText="إلغاء"
      destroyOnHidden
      width={980}
    >
      <Spin spinning={loadingFull}>
        {/* ملخص السعر: مجموع المنتجات الحالي مقابل سعر الباقة */}
        <div className="alhayaa-pkg-summary">
          <span>
            مجموع المنتجات: <b>{fmt(itemsTotal)}</b>
          </span>
          <span>
            سعر {isRoutine ? "الروتين" : "الباقة"}: <b>{price ? fmt(price) : "—"}</b>
          </span>
          {price > 0 && itemsTotal > 0 ? (
            saving > 0 ? (
              <span className="is-good">
                توفير الزبونة: <b>{fmt(saving)}</b> ({percent}%)
              </span>
            ) : (
              <span className="is-bad">السعر ليس أقل من مجموع المنتجات — لا يوجد توفير</span>
            )
          ) : null}
          {itemsTotal > 0 ? (
            <Space size={4}>
              {[10, 15, 20].map((p) => (
                <Button
                  key={p}
                  size="small"
                  onClick={() => form.setFieldValue("price", Math.round((itemsTotal * (1 - p / 100)) / 250) * 250)}
                >
                  −{p}%
                </Button>
              ))}
            </Space>
          ) : null}
        </div>

        <Form layout="vertical" form={form} onFinish={(v) => upsert.mutate(v)}>
          <Tabs
            items={[
              {
                key: "info",
                label: "المعلومات",
                forceRender: true,
                children: (
                  <div className="alhayaa-package-form-grid">
                    <div className="alhayaa-package-form-cover">
                      <Form.Item name="coverImageId" label="صورة الغلاف">
                        <PackageCoverPicker variant={coverVariant} hint={coverHint} previewImage={coverPreview} />
                      </Form.Item>
                    </div>

                    <div className="alhayaa-package-form-fields">
                      <Form.Item name="name" label="الاسم" rules={[{ required: true, message: "الاسم مطلوب" }]}>
                        <Input placeholder={isRoutine ? "روتين صباحي للبشرة الدهنية" : "باقة العناية الكاملة"} />
                      </Form.Item>

                      {!lockKind ? (
                        <Form.Item name="kind" label="النوع" rules={[{ required: true }]}>
                          <Select options={kinds.map((k) => ({ value: k.value, label: `${k.icon} ${k.label}` }))} />
                        </Form.Item>
                      ) : (
                        <Form.Item name="kind" hidden>
                          <Input />
                        </Form.Item>
                      )}

                      <Form.Item name="subtitle" label="سطر مختصر (يظهر على البطاقة)">
                        <Input placeholder={isRoutine ? "3 خطوات: تنظيف ← ترطيب ← حماية" : "كل ما تحتاجينه بسعر أوفر"} />
                      </Form.Item>

                      <Form.Item name="description" label="الشرح (صفحة الباقة)">
                        <Input.TextArea
                          rows={3}
                          placeholder={
                            isRoutine
                              ? "لماذا هذا الروتين؟ لمن يناسب؟ متى تظهر النتيجة؟"
                              : "ماذا تحتوي الباقة ولمن تناسب"
                          }
                        />
                      </Form.Item>

                      <Space.Compact block>
                        <Form.Item
                          name="price"
                          label="السعر الخاص"
                          style={{ flex: 1 }}
                          rules={[{ required: true, message: "السعر مطلوب" }]}
                        >
                          <InputNumber style={{ width: "100%" }} min={0} step={250} />
                        </Form.Item>
                        <Form.Item name="badge" label="شارة" style={{ flex: 1, marginInlineStart: 8 }}>
                          <Input placeholder="الأكثر طلباً" />
                        </Form.Item>
                      </Space.Compact>

                      <Form.Item
                        name="endsAt"
                        label="ينتهي العرض في (اختياري — يظهر عدّاد)"
                        extra="بعد هذا الموعد تختفي الباقة تلقائياً من التطبيق"
                      >
                        <DatePicker showTime style={{ width: "100%" }} format="YYYY-MM-DD HH:mm" />
                      </Form.Item>

                      <Space.Compact block>
                        <Form.Item name="position" label="الترتيب" style={{ flex: 1 }}>
                          <InputNumber style={{ width: "100%" }} min={0} />
                        </Form.Item>
                        <Form.Item
                          name="isFeatured"
                          label="مميز (يظهر أولاً)"
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

                      <Form.Item name="slug" label="Slug (رابط)">
                        <Input placeholder={defaultSlugForKind((kindWatch as SkinRoutineKind) ?? defaultKind)} />
                      </Form.Item>
                    </div>
                  </div>
                ),
              },
              {
                key: "items",
                label: `${isRoutine ? "الخطوات" : "المنتجات"} (${packageProducts.length})`,
                forceRender: true,
                children: (
                  <PackageProductsEditor
                    products={packageProducts}
                    onChange={setPackageProducts}
                    ordered={isRoutine}
                    withSteps={isRoutine}
                    withQuantity={!isRoutine}
                    title={productsTitle ?? (isRoutine ? "خطوات الروتين (بالباركود)" : "منتجات الباقة (بالباركود)")}
                    emptyText={
                      isRoutine
                        ? "أضيفي منتجات الروتين بالترتيب — امسحي الباركود لكل خطوة"
                        : "أضيفي منتجات الباقة بالباركود"
                    }
                    scopeLabel={isRoutine ? "الروتين" : "الباقة"}
                  />
                ),
              },
              {
                key: "target",
                label: "لمن تظهر",
                forceRender: true,
                children: (
                  <>
                    <Alert
                      type="info"
                      showIcon
                      style={{ marginBottom: 12 }}
                      message="الاستهداف يحدد أين تظهر في التطبيق: العوالم، صفحات مشاكل البشرة، ونتيجة اختبار البشرة."
                    />
                    <Form.Item name="worldSlugs" label="العوالم" extra="فارغ = تظهر في كل العوالم">
                      <WorldSlugsSelect />
                    </Form.Item>
                    <Form.Item
                      name="concernSlugs"
                      label="مشاكل البشرة التي تعالجها"
                      extra="تظهر في صفحة كل مشكلة من دليل البشرة، وتُرشَّح في نتيجة الاختبار"
                    >
                      <Select
                        mode="multiple"
                        allowClear
                        placeholder="اختاري المشاكل"
                        options={((concerns as any[]) ?? []).map((c) => ({
                          value: c.slug,
                          label: `${c.icon ?? ""} ${c.name}`.trim(),
                        }))}
                      />
                    </Form.Item>
                    <Form.Item
                      name="skinTypes"
                      label="أنواع البشرة المناسبة"
                      extra="فارغ = تناسب كل الأنواع. نتيجة الاختبار تعرض المطابق أولاً"
                    >
                      <Select
                        mode="multiple"
                        allowClear
                        placeholder="كل الأنواع"
                        options={SKIN_TYPES.map((t) => ({ value: t.value, label: `${t.icon} ${t.label}` }))}
                      />
                    </Form.Item>
                  </>
                ),
              },
            ]}
          />
        </Form>
      </Spin>
    </Modal>
  );
}
