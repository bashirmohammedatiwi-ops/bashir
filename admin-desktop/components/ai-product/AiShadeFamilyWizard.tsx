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
import { AiImageSearchPanel } from "./AiImageSearchPanel";
import { AiProgressOverlay, type AiProgressState } from "./AiProgressOverlay";
import { aiSearchImages, aiShadeFamily, fetchAiModels } from "@/lib/aiProductApi";
import type { AiAutofillImage, ShadeFamilyResult } from "@/lib/aiProductTypes";
import { applyAiCategories } from "@/lib/aiCategoryApply";
import { catalogThumbToImage, applyCatalogHitToRow, enrichShadeColors, enrichShadesFromCatalog, inferProductIdentityFromCatalog, isBarcodeLikeProductName, isGenericShadeName, mergeUniqueImages, resolveFamilyProductNames, resolveShadeRowColor } from "@/lib/aiCatalogEnrich";
import { formatAiError, startShadeFamilyProgressTicker } from "@/lib/aiProgress";
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

const IDENTIFY_STAGES = [
  "تحليل الباركودات",
  "التعرف بالذكاء الاصطناعي",
  "بحث عالمي ذكي",
  "تطبيق التصنيفات",
];

const EMPTY_PROGRESS: AiProgressState = {
  open: false,
  title: "",
  stageLabel: "",
  percent: 0,
  stageIndex: 0,
  totalStages: IDENTIFY_STAGES.length,
};

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
  const [shadeImages, setShadeImages] = useState<Record<string, AiAutofillImage[]>>({});
  const [loadingShadeImages, setLoadingShadeImages] = useState(false);
  const [invMap, setInvMap] = useState<Record<string, { price: number; stock: number }>>({});
  const [identifying, setIdentifying] = useState(false);
  const [progress, setProgress] = useState<AiProgressState>(EMPTY_PROGRESS);

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
    setIdentifying(false);
    setProgress(EMPTY_PROGRESS);
  }, []);

  useEffect(() => {
    if (!open) reset();
  }, [open, reset]);

  useEffect(() => {
    if (!modelsQ.data?.default || modelId) return;
    setModelId(modelsQ.data.default);
  }, [modelsQ.data, modelId]);

  const applyFillResult = async (fill: ShadeFamilyResult, inv: Awaited<ReturnType<typeof lookupInventoryBarcodes>>) => {
    const familyNames = resolveFamilyProductNames({
      hint,
      nameEn: fill.nameEn,
      nameAr: fill.nameAr,
      brandEn: fill.brandEn,
      brandAr: fill.brandAr,
    });

    setResult(fill);
    setNameAr(familyNames.nameAr);
    setNameEn(familyNames.nameEn);
    setBrandAr(familyNames.brandAr || fill.brandAr);
    setBrandEn(familyNames.brandEn || fill.brandEn);
    setDescAr(fill.descriptionAr);
    setGallery(fill.images);
    if (fill.images.length) setSelectedGallery(new Set([fill.images[0].url]));

    setProgress((p) => ({
      ...p,
      stageIndex: 3,
      stageLabel: IDENTIFY_STAGES[3],
      percent: 92,
      detail: "تطبيق التصنيفات والبراند...",
    }));

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

    const rows: ShadeRow[] = fill.shades.map((s) => ({
      barcode: s.barcode,
      name: s.name,
      code: s.code || "",
      colorHex: s.colorHex || "#CCCCCC",
      imageUrl: null,
    }));

    setProgress((p) => ({
      ...p,
      stageIndex: 2,
      stageLabel: IDENTIFY_STAGES[2],
      percent: 85,
      detail: `بحث عالمي عن ${barcodes.length} باركود (متاجر عربية وعالمية)...`,
    }));

    try {
      const catalogMap = await enrichShadesFromCatalog(barcodes, undefined, hint);
      const identity = inferProductIdentityFromCatalog(catalogMap, hint);
      const refreshed = resolveFamilyProductNames({
        hint,
        nameEn: identity?.nameEn || familyNames.nameEn,
        nameAr: identity?.nameAr || familyNames.nameAr,
        brandEn: identity?.brandEn || familyNames.brandEn,
        brandAr: identity?.brandAr || familyNames.brandAr,
      });
      setBrandEn(refreshed.brandEn);
      setBrandAr(refreshed.brandAr);
      setNameEn(refreshed.nameEn);
      setNameAr(refreshed.nameAr);
      for (let i = 0; i < rows.length; i++) {
        const hit = catalogMap.get(rows[i].barcode);
        if (!hit) continue;
        applyCatalogHitToRow(rows[i], hit);
        const img = catalogThumbToImage(hit);
        if (img) {
          setShadeImages((prev) => ({
            ...prev,
            [rows[i].barcode]: mergeUniqueImages(prev[rows[i].barcode] ?? [], [img]),
          }));
        }
      }
      await enrichShadeColors(rows, catalogMap);
    } catch {
      /* optional */
    }

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
  };

  const runIdentify = async () => {
    if (barcodes.length < 2) {
      message.error("أدخل باركودين على الأقل للتدرجات");
      return;
    }

    setIdentifying(true);
    let stopTicker: (() => void) | undefined;
    setProgress({
      open: true,
      title: "جاري التعرف على التدرجات",
      stageLabel: IDENTIFY_STAGES[0],
      detail: `جاري تحليل ${barcodes.length} باركود على السيرفر...`,
      percent: 6,
      stageIndex: 0,
      totalStages: IDENTIFY_STAGES.length,
    });

    try {
      stopTicker = startShadeFamilyProgressTicker(
        (tick) =>
          setProgress((p) =>
            p.open
              ? {
                  ...p,
                  stageIndex: tick.stageIndex,
                  stageLabel: IDENTIFY_STAGES[tick.stageIndex] ?? p.stageLabel,
                  detail: tick.detail,
                  percent: tick.percent,
                }
              : p,
          ),
        IDENTIFY_STAGES,
        barcodes.length,
      );

      const fillPromise = aiShadeFamily({ barcodes, hint, model: modelId });
      const invPromise = lookupInventoryBarcodes(barcodes);
      const fill = await fillPromise;
      stopTicker();
      stopTicker = undefined;

      setProgress((p) => ({
        ...p,
        percent: 85,
        stageIndex: 2,
        stageLabel: IDENTIFY_STAGES[2],
        detail: "جلب المخزون وإثراء الأسماء من المتاجر...",
      }));
      const inv = await invPromise;

      await applyFillResult(fill, inv);

      setProgress((p) => ({ ...p, percent: 100, detail: "اكتمل!" }));
      setStep(1);
      if (fill.isFallback) message.warning("تعرف محدود — راجع الأسماء والصور");
      else message.success(`تم التعرف على ${fill.shades.length} تدرج`);
    } catch (e) {
      message.error(formatAiError(e, "فشل التعرف على التدرجات"));
    } finally {
      stopTicker?.();
      setIdentifying(false);
      window.setTimeout(() => setProgress(EMPTY_PROGRESS), 600);
    }
  };

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
      const shadeLabel = isGenericShadeName(shade.name) ? "" : shade.name;
      const nameHint = [brandEn, brandAr, hint, nameEn, nameAr, shadeLabel, shade.code]
        .filter(Boolean)
        .join(" | ");
      const barcodeHits = await aiSearchImages({
        barcode: shade.barcode,
        mode: "barcode",
        nameHint,
      });
      let hits = barcodeHits;
      if (hits.length < 4) {
        const nameHits = await aiSearchImages({
          barcode: shade.barcode,
          mode: "name",
          query: [brandEn, nameEn, shadeLabel, shade.code].filter(Boolean).join(" "),
          nameHint,
        });
        hits = mergeUniqueImages(hits, nameHits, 36);
      }
      setShadeImages((prev) => ({ ...prev, [shade.barcode]: hits }));
      const imageUrl = shade.imageUrl || hits[0]?.url || null;
      if (imageUrl) {
        const colorHex = await resolveShadeRowColor({
          name: shade.name,
          colorHex: shade.colorHex,
          imageUrl,
        });
        setShades((prev) => {
          const next = [...prev];
          const cur = next[idx];
          if (!cur) return prev;
          next[idx] = { ...cur, imageUrl: cur.imageUrl || imageUrl, colorHex };
          return next;
        });
      }
    } catch (e) {
      message.error((e as Error).message || "فشل جلب صور التدرج");
    } finally {
      setLoadingShadeImages(false);
    }
  };

  useEffect(() => {
    if (step !== 2 || !shades.length) return;
    const bc = shades[activeShadeIdx]?.barcode;
    if (!bc || shadeImages[bc]?.length) return;
    void loadShadeImages(activeShadeIdx);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, activeShadeIdx, shades.map((s) => s.barcode).join(",")]);

  useEffect(() => {
    if (step !== 4 || categoryId || !result) return;
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

  const activeShade = shades[activeShadeIdx];
  const activeShadeUrls = activeShade ? (shadeImages[activeShade.barcode] ?? []) : [];

  const canNext = useMemo(() => {
    if (step === 0) return barcodes.length >= 2;
    if (step === 1) return nameAr.trim() || nameEn.trim();
    if (step === 2) return true;
    if (step === 3) return selectedGallery.size > 0;
    if (step === 4) return !!categoryId;
    return true;
  }, [step, barcodes, nameAr, nameEn, shades, selectedGallery, categoryId]);

  if (!open) return null;

  return (
    <div className="ai-wizard-shell">
      <AiProgressOverlay state={progress} />
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
            {isBarcodeLikeProductName(nameEn, barcodes) || isBarcodeLikeProductName(nameAr, barcodes) ? (
              <Alert
                type="warning"
                showIcon
                message="اسم المنتج غير مكتمل"
                description="أدخل تلميح المنتج في الخطوة الأولى (مثل ARTDECO MAT PASSION Lip Fluid) أو اضغط «إثراء الأسماء من المتاجر»."
              />
            ) : null}
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
            <Button
              size="small"
              onClick={async () => {
                const map = await enrichShadesFromCatalog(barcodes, undefined, hint);
                const identity = inferProductIdentityFromCatalog(map, hint);
                const refreshed = resolveFamilyProductNames({
                  hint,
                  nameEn: identity?.nameEn || nameEn,
                  nameAr: identity?.nameAr || nameAr,
                  brandEn: identity?.brandEn || brandEn,
                  brandAr: identity?.brandAr || brandAr,
                });
                setBrandEn(refreshed.brandEn);
                setBrandAr(refreshed.brandAr);
                setNameEn(refreshed.nameEn);
                setNameAr(refreshed.nameAr);
                const nextRows = shades.map((row) => ({ ...row }));
                for (const row of nextRows) {
                  const hit = map.get(row.barcode);
                  if (hit) applyCatalogHitToRow(row, hit);
                }
                await enrichShadeColors(nextRows, map);
                setShades(nextRows);
                message.success(`تم تحديث ${nextRows.filter((r) => !isGenericShadeName(r.name)).length}/${nextRows.length} تدرج (بحث عالمي)`);
              }}
            >
              إثراء عالمي ذكي
            </Button>
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
                <Input
                  type="color"
                  value={s.colorHex}
                  title="لون التدرج"
                  onChange={(e) => {
                    const next = [...shades];
                    next[i] = { ...s, colorHex: e.target.value };
                    setShades(next);
                  }}
                  style={{ width: 44, padding: 2, cursor: "pointer" }}
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
          <AiImageSearchPanel
            barcode={barcodes[0] ?? ""}
            nameHints={[brandEn, brandAr, nameEn, nameAr, hint]}
            images={gallery}
            selected={selectedGallery}
            onImagesChange={setGallery}
            onToggle={(url) => {
              setSelectedGallery((prev) => {
                const next = new Set(prev);
                if (next.has(url)) next.delete(url);
                else next.add(url);
                return next;
              });
            }}
          />
        ) : null}

        {step === 4 ? (
          <Form layout="vertical" style={{ maxWidth: 560 }}>
            {(result?.category.categoryNameAr || result?.productTypeAr) ? (
              <Alert
                type="info"
                showIcon
                style={{ marginBottom: 16 }}
                message={`تصنيف مقترح: ${[result?.category.categoryNameAr, result?.category.subcategoryNameAr, result?.productTypeAr].filter(Boolean).join(" › ")}`}
              />
            ) : null}
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
        <Button disabled={step === 0 || identifying || saveMut.isPending} onClick={() => setStep((s) => Math.max(0, s - 1))}>
          رجوع
        </Button>
        {step === 0 ? (
          <Button type="primary" loading={identifying} onClick={() => void runIdentify()}>
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
