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
import { AiImageSearchGrid } from "./AiImageSearchGrid";
import { aiSearchImages, aiShadeFamily, fetchAiModels } from "@/lib/aiProductApi";
import type { ShadeFamilyResult } from "@/lib/aiProductTypes";
import { matchBrandIdLocal } from "@/lib/catalogBrandMatch";
import { lookupInventoryBarcodes } from "@/lib/inventorySync";
import { defaultSku, saveAiProduct } from "@/lib/aiProductSave";
import { normalizeBarcode } from "@/lib/barcode";
import { queries, mutations } from "@/lib/queries";

type NamedRow = { id: string; nameAr?: string; name?: string; nameEn?: string };

type ShadeRow = {
  barcode: string;
  name: string;
  code: string;
  colorHex: string;
  imageUrl: string | null;
};

type Props = {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
};

const STEPS = ["الباركودات", "التسمية", "صور التدرجات", "صور المنتج", "التصنيف", "الحفظ"];

function parseBarcodes(raw: string): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const line of raw.split(/[\n,;]+/)) {
    const bc = normalizeBarcode(line);
    if (bc.length < 6 || seen.has(bc)) continue;
    seen.add(bc);
    out.push(bc);
  }
  return out;
}

export function AiShadeFamilyWizard({ open, onClose, onSuccess }: Props) {
  const qc = useQueryClient();
  const [step, setStep] = useState(0);
  const [barcodesRaw, setBarcodesRaw] = useState("");
  const [hint, setHint] = useState("");
  const [modelId, setModelId] = useState<string | undefined>();
  const [result, setResult] = useState<ShadeFamilyResult | null>(null);
  const [shades, setShades] = useState<ShadeRow[]>([]);
  const [nameAr, setNameAr] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [brandAr, setBrandAr] = useState("");
  const [brandEn, setBrandEn] = useState("");
  const [descAr, setDescAr] = useState("");
  const [brandId, setBrandId] = useState<string | undefined>();
  const [categoryId, setCategoryId] = useState<string | undefined>();
  const [subcategoryIds, setSubcategoryIds] = useState<string[]>([]);
  const [tertiaryIds, setTertiaryIds] = useState<string[]>([]);
  const [price, setPrice] = useState(0);
  const [stock, setStock] = useState(0);
  const [gallery, setGallery] = useState(result?.images ?? []);
  const [selectedGallery, setSelectedGallery] = useState<Set<string>>(new Set());
  const [activeShadeIdx, setActiveShadeIdx] = useState(0);
  const [shadeImages, setShadeImages] = useState<Record<string, string[]>>({});
  const [loadingShadeImages, setLoadingShadeImages] = useState(false);
  const [invMap, setInvMap] = useState<Record<string, { price: number; stock: number }>>({});

  const barcodes = useMemo(() => parseBarcodes(barcodesRaw), [barcodesRaw]);

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
    setBarcodesRaw("");
    setHint("");
    setResult(null);
    setShades([]);
    setNameAr("");
    setNameEn("");
    setBrandAr("");
    setBrandEn("");
    setDescAr("");
    setBrandId(undefined);
    setCategoryId(undefined);
    setSubcategoryIds([]);
    setTertiaryIds([]);
    setPrice(0);
    setStock(0);
    setGallery([]);
    setSelectedGallery(new Set());
    setActiveShadeIdx(0);
    setShadeImages({});
    setInvMap({});
  }, []);

  useEffect(() => {
    if (!open) reset();
  }, [open, reset]);

  useEffect(() => {
    if (!modelsQ.data?.default || modelId) return;
    setModelId(modelsQ.data.default);
  }, [modelsQ.data, modelId]);

  const familyMut = useMutation({
    mutationFn: async () => {
      if (barcodes.length < 2) throw new Error("أدخل باركودين على الأقل للتدرجات");
      const fill = await aiShadeFamily({ barcodes, hint, model: modelId });
      const inv = await lookupInventoryBarcodes(barcodes);
      return { fill, inv };
    },
    onSuccess: ({ fill, inv }) => {
      setResult(fill);
      setNameAr(fill.nameAr);
      setNameEn(fill.nameEn);
      setBrandAr(fill.brandAr);
      setBrandEn(fill.brandEn);
      setDescAr(fill.descriptionAr);
      setGallery(fill.images);
      if (fill.images.length) setSelectedGallery(new Set([fill.images[0].url]));
      if (fill.category.categoryId) setCategoryId(fill.category.categoryId);
      if (fill.category.subcategoryIds?.length) setSubcategoryIds(fill.category.subcategoryIds);
      if (fill.category.tertiaryCategoryIds?.length) setTertiaryIds(fill.category.tertiaryCategoryIds);
      const rows: ShadeRow[] = fill.shades.map((s) => ({
        barcode: s.barcode,
        name: s.name,
        code: s.code || "",
        colorHex: s.colorHex || "#CCCCCC",
        imageUrl: null,
      }));
      setShades(rows);
      const pos: Record<string, { price: number; stock: number }> = {};
      let totalStock = 0;
      for (const bc of barcodes) {
        const hit = inv[bc]?.pos;
        if (hit) {
          pos[bc] = { price: hit.price, stock: hit.stock };
          totalStock += hit.stock;
        }
      }
      setInvMap(pos);
      const lead = barcodes[0];
      if (pos[lead]) setPrice(pos[lead].price);
      setStock(totalStock);
      const brands = brandsQ.data ?? [];
      const matched = matchBrandIdLocal(brands, fill.brandAr, fill.brandEn);
      if (matched) setBrandId(matched);
      setStep(1);
      if (fill.isFallback) message.warning("تعرف محدود — راجع الأسماء والصور");
      else message.success(`تم التعرف على ${rows.length} تدرج`);
    },
    onError: (e: Error) => message.error(e.message || "فشل التعرف على التدرجات"),
  });

  const saveMut = useMutation({
    mutationFn: async () => {
      let resolvedBrandId = brandId;
      if (!resolvedBrandId) {
        const resolved = await mutations.resolveBrand({ brandAr, brandEn, createIfMissing: true });
        resolvedBrandId = resolved?.id;
      }
      if (!resolvedBrandId) throw new Error("تعذّر تحديد البراند");
      if (!categoryId) throw new Error("اختر القسم الرئيسي");
      const galleryUrls = [...selectedGallery];
      if (!galleryUrls.length) throw new Error("اختر صورة عامة واحدة على الأقل");

      const shadeRows = shades.map((s, i) => ({
        name: s.name,
        barcode: s.barcode,
        colorHex: s.colorHex,
        imageUrl: s.imageUrl,
        price: invMap[s.barcode]?.price,
        stock: invMap[s.barcode]?.stock,
        position: i,
      }));

      return saveAiProduct({
        values: {
          barcode: barcodes[0],
          sku: defaultSku(barcodes[0], "SHD"),
          nameAr,
          nameEn,
          descriptionAr: descAr,
          brandId: resolvedBrandId,
          categoryId,
          subcategoryIds,
          tertiaryCategoryIds: tertiaryIds,
          price,
          stock,
        },
        galleryUrls,
        shadeRows,
      });
    },
    onSuccess: () => {
      message.success("تم إنشاء منتج التدرجات بنجاح");
      qc.invalidateQueries({ queryKey: ["products"] });
      onSuccess?.();
      onClose();
    },
    onError: (e: Error) => message.error(e.message || "فشل الحفظ"),
  });

  const loadShadeImages = async (idx: number) => {
    const shade = shades[idx];
    if (!shade) return;
    setLoadingShadeImages(true);
    try {
      const q = [brandEn || brandAr, nameEn || nameAr, shade.name, shade.code].filter(Boolean).join(" ");
      const hits = await aiSearchImages({
        barcode: shade.barcode,
        mode: "name",
        query: q,
        nameHint: q,
      });
      setShadeImages((prev) => ({ ...prev, [shade.barcode]: hits.map((h) => h.url) }));
    } catch (e) {
      message.error((e as Error).message || "فشل جلب صور التدرج");
    } finally {
      setLoadingShadeImages(false);
    }
  };

  const activeShade = shades[activeShadeIdx];
  const activeShadeUrls = activeShade ? (shadeImages[activeShade.barcode] ?? []).map((url) => ({ url, thumbUrl: url })) : [];

  const canNext = useMemo(() => {
    if (step === 0) return barcodes.length >= 2;
    if (step === 1) return nameAr.trim() || nameEn.trim();
    if (step === 2) return shades.some((s) => s.imageUrl);
    if (step === 3) return selectedGallery.size > 0;
    if (step === 4) return !!categoryId;
    return true;
  }, [step, barcodes, nameAr, nameEn, shades, selectedGallery, categoryId]);

  if (!open) return null;

  return (
    <div className="ai-wizard-shell">
      <div className="ai-wizard-head">
        <Space style={{ width: "100%", justifyContent: "space-between" }}>
          <div>
            <strong style={{ fontSize: 18 }}>إضافة عائلة تدرجات بالذكاء الاصطناعي</strong>
            <div style={{ color: "#8a8194", fontSize: 13, marginTop: 4 }}>
              {barcodes.length ? `${barcodes.length} باركود` : "أدخل باركود كل تدرج"}
            </div>
          </div>
          <Button onClick={onClose}>إغلاق</Button>
        </Space>
        <Steps current={step} size="small" style={{ marginTop: 18 }} items={STEPS.map((t) => ({ title: t }))} />
      </div>

      <div className="ai-wizard-body">
        {step === 0 ? (
          <Space direction="vertical" size="large" style={{ width: "100%" }}>
            <Alert
              type="info"
              showIcon
              message="باركود كل تدرج في سطر"
              description="يمكن لصق قائمة من مسدس الأسعار أو الماسح. الباركود الأول يُستخدم كمنتج رئيسي."
            />
            <Form layout="vertical">
              <Form.Item label={`الباركودات (${barcodes.length})`} required>
                <Input.TextArea
                  rows={8}
                  value={barcodesRaw}
                  onChange={(e) => setBarcodesRaw(e.target.value)}
                  placeholder={"4052136246445\n4052136246452\n4052136246469"}
                />
              </Form.Item>
              <Form.Item label="تلميح المنتج">
                <Input value={hint} onChange={(e) => setHint(e.target.value)} placeholder="ARTDECO MAT PASSION Lip Fluid" />
              </Form.Item>
              <Form.Item label="نموذج AI">
                <Select
                  value={modelId}
                  onChange={setModelId}
                  options={(modelsQ.data?.models ?? []).map((m) => ({ value: m.id, label: m.labelAr }))}
                />
              </Form.Item>
            </Form>
          </Space>
        ) : null}

        {step === 1 ? (
          <Space direction="vertical" size="middle" style={{ width: "100%" }}>
            {result?.isFallback ? <Alert type="warning" message="تعرف محدود — راجع الأسماء" /> : null}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <Form.Item label="اسم المنتج عربي">
                <Input value={nameAr} onChange={(e) => setNameAr(e.target.value)} />
              </Form.Item>
              <Form.Item label="اسم المنتج إنجليزي">
                <Input value={nameEn} onChange={(e) => setNameEn(e.target.value)} />
              </Form.Item>
              <Form.Item label="البراند عربي">
                <Input value={brandAr} onChange={(e) => setBrandAr(e.target.value)} />
              </Form.Item>
              <Form.Item label="البراند إنجليزي">
                <Input value={brandEn} onChange={(e) => setBrandEn(e.target.value)} />
              </Form.Item>
            </div>
            <strong>التدرجات ({shades.length})</strong>
            {shades.map((s, i) => (
              <div key={s.barcode} className="ai-shade-row">
                <div className="ai-swatch" style={{ background: s.colorHex }} />
                <Input
                  value={s.name}
                  onChange={(e) => {
                    const next = [...shades];
                    next[i] = { ...s, name: e.target.value };
                    setShades(next);
                  }}
                />
                <Input
                  value={s.code}
                  placeholder="كود"
                  onChange={(e) => {
                    const next = [...shades];
                    next[i] = { ...s, code: e.target.value };
                    setShades(next);
                  }}
                />
                <Tag dir="ltr">{s.barcode}</Tag>
              </div>
            ))}
          </Space>
        ) : null}

        {step === 2 ? (
          <Space direction="vertical" size="middle" style={{ width: "100%" }}>
            <Space wrap>
              {shades.map((s, i) => (
                <Button
                  key={s.barcode}
                  type={activeShadeIdx === i ? "primary" : "default"}
                  onClick={() => {
                    setActiveShadeIdx(i);
                    if (!shadeImages[s.barcode]) loadShadeImages(i);
                  }}
                >
                  {s.name || s.code || i + 1}
                  {s.imageUrl ? " ✓" : ""}
                </Button>
              ))}
            </Space>
            {activeShade ? (
              <>
                <div style={{ color: "#6e6478" }}>
                  تدرج: <strong>{activeShade.name}</strong> · {activeShade.barcode}
                </div>
                <Button onClick={() => loadShadeImages(activeShadeIdx)} loading={loadingShadeImages}>
                  بحث صور هذا التدرج
                </Button>
                <AiImageSearchGrid
                  images={activeShadeUrls}
                  selected={new Set(activeShade.imageUrl ? [activeShade.imageUrl] : [])}
                  onToggle={(url) => {
                    const next = [...shades];
                    next[activeShadeIdx] = {
                      ...activeShade,
                      imageUrl: activeShade.imageUrl === url ? null : url,
                    };
                    setShades(next);
                  }}
                  loading={loadingShadeImages}
                />
              </>
            ) : null}
          </Space>
        ) : null}

        {step === 3 ? (
          <Space direction="vertical" size="middle" style={{ width: "100%" }}>
            <AiImageSearchGrid
              images={gallery}
              selected={selectedGallery}
              onToggle={(url) => {
                setSelectedGallery((prev) => {
                  const next = new Set(prev);
                  if (next.has(url)) next.delete(url);
                  else next.add(url);
                  return next;
                });
              }}
            />
          </Space>
        ) : null}

        {step === 4 ? (
          <Form layout="vertical" style={{ maxWidth: 560 }}>
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
        ) : null}

        {step === 5 ? (
          <Alert
            type="success"
            showIcon
            message="جاهز للحفظ"
            description={`${shades.length} تدرج · ${selectedGallery.size} صورة عامة · ${shades.filter((s) => s.imageUrl).length} تدرج بصورة`}
          />
        ) : null}
      </div>

      <div className="ai-wizard-foot">
        <Button disabled={step === 0 || familyMut.isPending || saveMut.isPending} onClick={() => setStep((s) => Math.max(0, s - 1))}>
          رجوع
        </Button>
        {step === 0 ? (
          <Button type="primary" loading={familyMut.isPending} onClick={() => familyMut.mutate()}>
            تعرف على التدرجات
          </Button>
        ) : step < 5 ? (
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
