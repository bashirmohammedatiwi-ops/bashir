"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Alert,
  Button,
  Form,
  Input,
  InputNumber,
  Select,
  Space,
  Steps,
  Tag,
  message,
} from "antd";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AiImageSearchPanel } from "./AiImageSearchPanel";
import { AiProgressOverlay, type AiProgressState } from "./AiProgressOverlay";
import { aiAutofill, fetchAiModels } from "@/lib/aiProductApi";
import type { AiAutofillResult } from "@/lib/aiProductTypes";
import { applyAiCategories } from "@/lib/aiCategoryApply";
import { catalogThumbToImage, enrichBarcodeFromCatalog, mergeUniqueImages } from "@/lib/aiCatalogEnrich";
import { matchBrandIdLocal } from "@/lib/catalogBrandMatch";
import { fetchInventoryByBarcode } from "@/lib/inventorySync";
import { defaultSku, saveAiProduct } from "@/lib/aiProductSave";
import { normalizeBarcode } from "@/lib/barcode";
import { formatAiError, startSimulatedProgress } from "@/lib/aiProgress";
import { queries, mutations } from "@/lib/queries";

type NamedRow = { id: string; nameAr?: string; name?: string; nameEn?: string };

type Props = {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  /** When true, hide close button (page embeds the wizard). */
  embedded?: boolean;
};

const STEPS = ["الباركود", "التسمية", "الصور", "التصنيف", "الحفظ"];

export function AiSingleProductWizard({ open, onClose, onSuccess, embedded }: Props) {
  const qc = useQueryClient();
  const [step, setStep] = useState(0);
  const [barcode, setBarcode] = useState("");
  const [hint, setHint] = useState("");
  const [modelId, setModelId] = useState<string | undefined>();
  const [result, setResult] = useState<AiAutofillResult | null>(null);
  const [nameAr, setNameAr] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [brandAr, setBrandAr] = useState("");
  const [brandEn, setBrandEn] = useState("");
  const [descAr, setDescAr] = useState("");
  const [descEn, setDescEn] = useState("");
  const [brandId, setBrandId] = useState<string | undefined>();
  const [categoryId, setCategoryId] = useState<string | undefined>();
  const [subcategoryIds, setSubcategoryIds] = useState<string[]>([]);
  const [tertiaryIds, setTertiaryIds] = useState<string[]>([]);
  const [price, setPrice] = useState(0);
  const [stock, setStock] = useState(0);
  const [images, setImages] = useState(result?.images ?? []);
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());
  const [imageQuery, setImageQuery] = useState("");
  const [progress, setProgress] = useState<AiProgressState>({
    open: false,
    title: "",
    stageLabel: "",
    detail: "",
    percent: 0,
    stageIndex: 0,
    totalStages: 4,
  });

  const modelsQ = useQuery({
    queryKey: ["ai-models"],
    queryFn: fetchAiModels,
    enabled: open,
  });

  const brandsQ = useQuery({
    queryKey: ["brands"],
    queryFn: () => queries.brands({ activeOnly: true }),
    enabled: open,
  });

  const categoriesQ = useQuery({
    queryKey: ["categories"],
    queryFn: queries.categories,
    enabled: open,
  });

  const subsQ = useQuery({
    queryKey: ["subcategories", categoryId],
    queryFn: () => queries.subcategories({ parentId: categoryId }),
    enabled: open && !!categoryId,
  });

  const tertQ = useQuery({
    queryKey: ["tertiary", subcategoryIds.join(",")],
    queryFn: async () => {
      const merged: Array<{ id: string; name?: string; nameAr?: string; nameEn?: string }> = [];
      const seen = new Set<string>();
      for (const subId of subcategoryIds) {
        const list = await queries.tertiarySections({ parentId: subId });
        for (const t of list) {
          if (!seen.has(t.id)) {
            seen.add(t.id);
            merged.push(t);
          }
        }
      }
      return merged;
    },
    enabled: open && subcategoryIds.length > 0,
  });

  const reset = useCallback(() => {
    setStep(0);
    setBarcode("");
    setHint("");
    setResult(null);
    setNameAr("");
    setNameEn("");
    setBrandAr("");
    setBrandEn("");
    setDescAr("");
    setDescEn("");
    setBrandId(undefined);
    setCategoryId(undefined);
    setSubcategoryIds([]);
    setTertiaryIds([]);
    setPrice(0);
    setStock(0);
    setImages([]);
    setSelectedImages(new Set());
    setImageQuery("");
  }, []);

  useEffect(() => {
    if (!open) reset();
  }, [open, reset]);

  useEffect(() => {
    if (!modelsQ.data?.default || modelId) return;
    setModelId(modelsQ.data.default);
  }, [modelsQ.data, modelId]);

  const autofillMut = useMutation({
    mutationFn: async () => {
      const bc = normalizeBarcode(barcode);
      if (bc.length < 6) throw new Error("أدخل باركود صالح (6 أرقام على الأقل)");
      const check = await queries.productBarcodeCheck(bc);
      if (check?.exists) throw new Error("المنتج موجود مسبقاً — استخدم تعديل المنتجات");

      setProgress({
        open: true,
        title: "جاري التعرف على المنتج",
        stageLabel: "الباركود",
        detail: "جلب بيانات الباركود من قواعد عالمية...",
        percent: 8,
        stageIndex: 0,
        totalStages: 4,
      });
      const stopTicker = startSimulatedProgress(
        (percent) =>
          setProgress((p) => ({
            ...p,
            percent,
            stageIndex: percent < 30 ? 0 : percent < 55 ? 1 : percent < 75 ? 2 : 3,
            stageLabel: percent < 30 ? "الباركود" : percent < 55 ? "الصور" : percent < 75 ? "التسمية" : "التصنيف",
            detail:
              percent < 30
                ? "جلب بيانات الباركود من قواعد عالمية..."
                : percent < 55
                  ? "بحث صور المنتج..."
                  : percent < 75
                    ? "تسمية المنتج بالذكاء الاصطناعي..."
                    : "اقتراح التصنيف...",
          })),
        { from: 10, to: 88, intervalMs: 900, step: 3 },
      );

      try {
        const fill = await aiAutofill({ barcode: bc, hint, model: modelId });
        const inv = await fetchInventoryByBarcode(bc);
        const nameLooksLikeBarcode =
          /^\d{8,14}$/.test(String(fill.nameEn ?? "").trim()) ||
          /^\d{8,14}$/.test(String(fill.nameAr ?? "").trim());
        const missingBrand = !String(fill.brandEn || fill.brandAr).trim();
        if (nameLooksLikeBarcode || missingBrand) {
          throw new Error(
            "تعذّر التعرف على المنتج (الاسم/البراند فارغ). أضف تلميحاً مثل اسم الماركة والخط ثم أعد المحاولة.",
          );
        }
        return { fill, inv };
      } finally {
        stopTicker();
      }
    },
    onSuccess: async ({ fill, inv }) => {
      setProgress((p) => ({ ...p, open: false, percent: 100 }));
      setResult(fill);
      setNameAr(fill.nameAr);
      setNameEn(fill.nameEn);
      setBrandAr(fill.brandAr);
      setBrandEn(fill.brandEn);
      setDescAr(fill.descriptionAr);
      setDescEn(fill.descriptionEn);
      setImages(fill.images);
      setImageQuery([fill.brandEn, fill.nameEn, hint].filter(Boolean).join(" "));
      if (fill.images.length) {
        setSelectedImages(new Set([fill.images[0].url]));
      }
      const applied = await applyAiCategories(fill.category, {
        categories: categoriesQ.data ?? [],
        nameAr: fill.nameAr,
        nameEn: fill.nameEn,
        productTypeAr: fill.productTypeAr,
        hint,
      });
      if (applied.categoryId) setCategoryId(applied.categoryId);
      if (applied.subcategoryIds.length) setSubcategoryIds(applied.subcategoryIds);
      if (applied.tertiaryCategoryIds.length) setTertiaryIds(applied.tertiaryCategoryIds);
      if (inv) {
        setPrice(inv.price);
        setStock(inv.stock);
      }
      const brands = brandsQ.data ?? [];
      const matched = matchBrandIdLocal(brands, fill.brandAr, fill.brandEn);
      if (matched) setBrandId(matched);
      void enrichBarcodeFromCatalog(normalizeBarcode(barcode)).then((hit) => {
        if (!hit) return;
        const img = catalogThumbToImage(hit);
        if (img) {
          setImages((prev) => mergeUniqueImages(prev, [img]));
          setSelectedImages((prev) => (prev.size ? prev : new Set([img.url])));
        }
        if (hit.nameAr && !fill.nameAr) setNameAr(hit.nameAr);
        if (hit.brandAr && !fill.brandAr) setBrandAr(hit.brandAr);
      });
      setStep(1);
      message.success("تم التعرف على المنتج");
    },
    onError: (e: Error) => {
      setProgress((p) => ({ ...p, open: false }));
      message.error(formatAiError(e, "فشل التعرف على المنتج"));
    },
  });

  const saveMut = useMutation({
    mutationFn: async () => {
      const bc = normalizeBarcode(barcode);
      let resolvedBrandId = brandId;
      if (!resolvedBrandId) {
        const resolved = await mutations.resolveBrand({
          brandAr,
          brandEn,
          createIfMissing: true,
        });
        resolvedBrandId = resolved?.id;
      }
      if (!resolvedBrandId) throw new Error("تعذّر تحديد البراند");
      if (!categoryId) throw new Error("اختر القسم الرئيسي");
      const gallery = [...selectedImages];
      if (!gallery.length) throw new Error("اختر صورة واحدة على الأقل");

      return saveAiProduct({
        values: {
          barcode: bc,
          sku: defaultSku(bc),
          nameAr,
          nameEn,
          descriptionAr: descAr,
          descriptionEn: descEn,
          brandId: resolvedBrandId,
          categoryId,
          subcategoryIds,
          tertiaryCategoryIds: tertiaryIds,
          price,
          stock,
        },
        galleryUrls: gallery,
      });
    },
    onSuccess: () => {
      message.success("تم إنشاء المنتج بنجاح");
      qc.invalidateQueries({ queryKey: ["products"] });
      onSuccess?.();
      if (embedded) reset();
      else onClose();
    },
    onError: (e: Error) => message.error(e.message || "فشل الحفظ"),
  });

  useEffect(() => {
    if (step !== 3 || categoryId || !result) return;
    void applyAiCategories(result.category, {
      categories: categoriesQ.data ?? [],
      nameAr,
      nameEn,
      productTypeAr: result.productTypeAr,
      hint,
    }).then((applied) => {
      if (applied.categoryId) setCategoryId(applied.categoryId);
      if (applied.subcategoryIds.length) setSubcategoryIds(applied.subcategoryIds);
      if (applied.tertiaryCategoryIds.length) setTertiaryIds(applied.tertiaryCategoryIds);
    });
  }, [step, categoryId, categoriesQ.data, nameAr, nameEn, result, hint]);

  const toggleImage = (url: string) => {
    setSelectedImages((prev) => {
      const next = new Set(prev);
      if (next.has(url)) next.delete(url);
      else next.add(url);
      return next;
    });
  };

  const canNext = useMemo(() => {
    if (step === 0) return barcode.trim().length >= 6;
    if (step === 1) return nameAr.trim() || nameEn.trim();
    if (step === 2) return selectedImages.size > 0;
    if (step === 3) return !!categoryId;
    return true;
  }, [step, barcode, nameAr, nameEn, selectedImages, categoryId]);

  if (!open) return null;

  return (
    <div className="ai-wizard-shell">
      <AiProgressOverlay state={progress} />
      <div className="ai-wizard-head">
        <Space style={{ width: "100%", justifyContent: "space-between" }}>
          <div>
            <strong style={{ fontSize: 18 }}>إضافة منتج مفرد</strong>
            <div style={{ color: "#8a8194", fontSize: 13, marginTop: 4 }}>
              اختر الموديل ← تعرّف على الباركود ← راجع التسمية والصور ← احفظ
            </div>
          </div>
          {!embedded ? <Button onClick={onClose}>إغلاق</Button> : null}
        </Space>
        <Steps current={step} size="small" style={{ marginTop: 18 }} items={STEPS.map((t) => ({ title: t }))} />
      </div>

      <div className="ai-wizard-body">
        {step === 0 ? (
          <Space direction="vertical" size="large" style={{ width: "100%", maxWidth: 520 }}>
            <Alert
              type="info"
              showIcon
              message="امسح أو أدخل باركود المنتج"
              description="أضف تلميحاً (اسم المنتج على العبوة) لنتائج أدق في التسمية والصور."
            />
            <Form layout="vertical">
              <Form.Item label="الباركود" required>
                <Input
                  size="large"
                  prefix="📦"
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value.replace(/\D/g, ""))}
                  placeholder="4052136246445"
                  inputMode="numeric"
                />
              </Form.Item>
              <Form.Item label="تلميح المنتج (اختياري)">
                <Input
                  value={hint}
                  onChange={(e) => setHint(e.target.value)}
                  placeholder="ARTDECO MAT PASSION Lip Fluid"
                />
              </Form.Item>
              <Form.Item
                label="نموذج التسمية"
                extra="Terra موصى به · Sol أقوى · Luna/Composer أسرع وأرخص"
              >
                <Select
                  value={modelId}
                  onChange={setModelId}
                  loading={modelsQ.isLoading}
                  optionLabelProp="label"
                  options={(modelsQ.data?.models ?? []).map((m) => ({
                    value: m.id,
                    label: m.labelAr,
                    title: m.descriptionAr,
                  }))}
                  optionRender={(opt) => {
                    const m = (modelsQ.data?.models ?? []).find((x) => x.id === opt.value);
                    return (
                      <div style={{ padding: "4px 0" }}>
                        <div style={{ fontWeight: 600 }}>{opt.label}</div>
                        {m?.descriptionAr ? (
                          <div style={{ fontSize: 12, color: "#8a8194", marginTop: 2 }}>
                            {m.descriptionAr}
                          </div>
                        ) : null}
                      </div>
                    );
                  }}
                />
              </Form.Item>
            </Form>
          </Space>
        ) : null}

        {step === 1 ? (
          <Space direction="vertical" size="middle" style={{ width: "100%" }}>
            {result?.needsReview ? (
              <Alert type="warning" showIcon message="يُنصح بمراجعة الأسماء قبل الحفظ" />
            ) : null}
            {result?.namesVerified ? <Tag color="green">تم تأكيد الاسم بالـ AI</Tag> : null}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <Form.Item label="الاسم عربي">
                <Input value={nameAr} onChange={(e) => setNameAr(e.target.value)} />
              </Form.Item>
              <Form.Item label="الاسم إنجليزي">
                <Input value={nameEn} onChange={(e) => setNameEn(e.target.value)} />
              </Form.Item>
              <Form.Item label="البراند عربي">
                <Input value={brandAr} onChange={(e) => setBrandAr(e.target.value)} />
              </Form.Item>
              <Form.Item label="البراند إنجليزي">
                <Input value={brandEn} onChange={(e) => setBrandEn(e.target.value)} />
              </Form.Item>
            </div>
            <Form.Item label="الوصف عربي">
              <Input.TextArea rows={3} value={descAr} onChange={(e) => setDescAr(e.target.value)} />
            </Form.Item>
          </Space>
        ) : null}

        {step === 2 ? (
          <AiImageSearchPanel
            barcode={barcode}
            nameHints={[brandEn, brandAr, nameEn, nameAr, hint, imageQuery]}
            images={images}
            selected={selectedImages}
            onImagesChange={setImages}
            onToggle={toggleImage}
          />
        ) : null}

        {step === 3 ? (
          <Space direction="vertical" size="middle" style={{ width: "100%", maxWidth: 560 }}>
            {(result?.category.categoryNameAr || result?.productTypeAr) ? (
              <Alert
                type="info"
                showIcon
                message={`تصنيف مقترح: ${[result?.category.categoryNameAr, result?.category.subcategoryNameAr, result?.productTypeAr].filter(Boolean).join(" › ")}`}
              />
            ) : null}
            <Form layout="vertical">
              <Form.Item label="القسم الرئيسي" required>
                <Select
                  value={categoryId}
                  onChange={(v) => {
                    setCategoryId(v);
                    setSubcategoryIds([]);
                    setTertiaryIds([]);
                  }}
                  options={(categoriesQ.data ?? []).map((c: NamedRow) => ({
                    value: c.id,
                    label: c.nameAr || c.name || c.nameEn,
                  }))}
                />
              </Form.Item>
              <Form.Item label="قسم فرعي">
                <Select
                  mode="multiple"
                  value={subcategoryIds}
                  onChange={setSubcategoryIds}
                  options={(subsQ.data ?? []).map((s: NamedRow) => ({
                    value: s.id,
                    label: s.nameAr || s.name || s.nameEn,
                  }))}
                />
              </Form.Item>
              <Form.Item label="قسم ثانوي">
                <Select
                  mode="multiple"
                  value={tertiaryIds}
                  onChange={setTertiaryIds}
                  options={(tertQ.data ?? []).map((t: NamedRow) => ({
                    value: t.id,
                    label: t.nameAr || t.name || t.nameEn,
                  }))}
                />
              </Form.Item>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <Form.Item label="السعر">
                  <InputNumber style={{ width: "100%" }} min={0} value={price} onChange={(v) => setPrice(Number(v ?? 0))} />
                </Form.Item>
                <Form.Item label="المخزون">
                  <InputNumber style={{ width: "100%" }} min={0} value={stock} onChange={(v) => setStock(Number(v ?? 0))} />
                </Form.Item>
              </div>
            </Form>
          </Space>
        ) : null}

        {step === 4 ? (
          <Space direction="vertical" size="middle" style={{ width: "100%" }}>
            <Alert type="success" showIcon message="جاهز للحفظ" description="سيتم رفع الصور وإنشاء المنتج في المتجر." />
            <div style={{ background: "#faf8fc", padding: 16, borderRadius: 12 }}>
              <div><strong>الاسم:</strong> {nameAr || nameEn}</div>
              <div><strong>الباركود:</strong> {normalizeBarcode(barcode)}</div>
              <div><strong>الصور:</strong> {selectedImages.size}</div>
              <div><strong>السعر:</strong> {price} · <strong>المخزون:</strong> {stock}</div>
            </div>
          </Space>
        ) : null}
      </div>

      <div className="ai-wizard-foot">
        <Button
          disabled={step === 0 || autofillMut.isPending || saveMut.isPending}
          onClick={() => setStep((s) => Math.max(0, s - 1))}
        >
          رجوع
        </Button>
        {step === 0 ? (
          <Button type="primary" loading={autofillMut.isPending} onClick={() => autofillMut.mutate()}>
            تعرف بالذكاء الاصطناعي
          </Button>
        ) : step < 4 ? (
          <Button type="primary" disabled={!canNext} onClick={() => setStep((s) => s + 1)}>
            التالي
          </Button>
        ) : (
          <Button type="primary" loading={saveMut.isPending} onClick={() => saveMut.mutate()}>
            حفظ المنتج
          </Button>
        )}
      </div>
    </div>
  );
}
