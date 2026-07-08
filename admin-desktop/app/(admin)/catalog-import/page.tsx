"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Alert,
  Button,
  Card,
  Form,
  Input,
  Select,
  Spin,
  Steps,
  Tag,
  Typography,
  message,
} from "antd";
import {
  BarcodeOutlined,
  CloudDownloadOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { CatalogOptionCard, STORE_COLORS } from "@/components/catalog-import/CatalogOptionCard";
import { CATALOG_HUB_URL } from "@/lib/config";
import { matchCategoryFromHints } from "@/lib/catalogCategoryMatch";
import {
  catalogOptionKey,
  createInitialStoreStatuses,
  fetchCatalogProduct,
  fetchCatalogSummariesBatch,
  searchCatalogByBarcodeProgressive,
  CATALOG_STORES,
  CATALOG_STORE_META,
  type CatalogImportOption,
  type CatalogImportProduct,
  type CatalogImportSummary,
  type CatalogStoreSearchStatus,
} from "@/lib/catalogImport";
import { fetchInventoryByBarcode, type InventorySyncPreview } from "@/lib/inventorySync";
import { uploadCatalogImportImages } from "@/lib/uploadCatalogImages";
import { resolveCatalogImageUrl } from "@/lib/resolveCatalogImageUrl";
import { buildProductPayload } from "@/lib/productPayload";
import { resolveShadeColorHex } from "@/lib/shadeColorFromImage";
import { mutations, queries } from "@/lib/queries";
import "./catalog-import.css";

function errorMessage(err: unknown, fallback: string) {
  const e = err as { message?: string; response?: { data?: { error?: unknown; message?: unknown } } };
  const apiErr = e?.response?.data?.error;
  if (typeof apiErr === "string" && apiErr.trim() && apiErr !== "[object Object]") return apiErr.trim();
  if (apiErr && typeof apiErr === "object" && typeof (apiErr as { message?: string }).message === "string") {
    return (apiErr as { message: string }).message;
  }
  if (typeof e?.response?.data?.message === "string") return e.response.data.message;
  if (typeof e?.message === "string" && e.message.trim() && e.message !== "[object Object]") return e.message;
  return fallback;
}

function matchBrandId(brands: any[] = [], brandAr = "", brandEn = "") {
  const keys = [brandAr, brandEn].map((s) => String(s || "").trim().toLowerCase()).filter(Boolean);
  if (!keys.length) return undefined;
  const hit = brands.find((b) => {
    const names = [b.name, b.nameAr, b.nameEn].map((n) => String(n || "").trim().toLowerCase());
    return keys.some((k) => names.some((n) => n === k || n.includes(k) || k.includes(n)));
  });
  return hit?.id;
}

function hintToString(v?: string | string[]) {
  if (!v) return "";
  return Array.isArray(v) ? v.join(" › ") : v;
}

function stripHtml(html = "") {
  return String(html).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

export default function CatalogImportPage() {
  const [barcode, setBarcode] = useState("");
  const [searching, setSearching] = useState(false);
  const [options, setOptions] = useState<CatalogImportOption[]>([]);
  const [storeStatuses, setStoreStatuses] = useState<Record<string, CatalogStoreSearchStatus>>({});
  const searchAbortRef = useRef<AbortController | null>(null);
  const [summaries, setSummaries] = useState<Record<string, CatalogImportSummary | null>>({});
  const [summaryLoadingKeys, setSummaryLoadingKeys] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<CatalogImportOption | null>(null);
  const [preview, setPreview] = useState<CatalogImportProduct | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [step, setStep] = useState(0);
  const [posLoading, setPosLoading] = useState(false);
  const [posByBarcode, setPosByBarcode] = useState<Record<string, InventorySyncPreview | null>>({});
  const [form] = Form.useForm();
  const qc = useQueryClient();
  const enrichGen = useRef(0);
  const searchGen = useRef(0);

  const { data: categoriesData = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: queries.categories,
  });
  const { data: brandsData = [] } = useQuery({
    queryKey: ["brands"],
    queryFn: queries.brands,
  });

  const categoryId = Form.useWatch("categoryId", form);
  const subcategoryId = Form.useWatch("subcategoryId", form);
  const { data: subcategoriesData = [] } = useQuery({
    queryKey: ["subcategories", categoryId],
    queryFn: () => queries.subcategories({ parentId: categoryId }),
    enabled: !!categoryId,
  });
  const { data: tertiarySectionsData = [] } = useQuery({
    queryKey: ["tertiary-sections", subcategoryId],
    queryFn: () => queries.tertiarySections({ parentId: subcategoryId }),
    enabled: !!subcategoryId,
  });

  const subcategoryOptions = useMemo(
    () =>
      (subcategoriesData || []).map((s: any) => ({
        value: s.id,
        label: s.nameAr || s.name || s.nameEn,
      })),
    [subcategoriesData],
  );
  const tertiaryOptions = useMemo(
    () =>
      (tertiarySectionsData || []).map((s: any) => ({
        value: s.id,
        label: s.nameAr || s.name || s.nameEn,
      })),
    [tertiarySectionsData],
  );

  const optionsByStore = useMemo(() => {
    const groups = new Map<string, CatalogImportOption[]>();
    for (const opt of options) {
      const list = groups.get(opt.store) || [];
      list.push(opt);
      groups.set(opt.store, list);
    }
    return [...groups.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [options]);

  useEffect(() => {
    if (!options.length) {
      setSummaries({});
      setSummaryLoadingKeys(new Set());
      return;
    }

    const gen = ++enrichGen.current;
    const keys = new Set(options.map((o) => catalogOptionKey(o)));
    setSummaryLoadingKeys(keys);

    fetchCatalogSummariesBatch(options, (key, summary) => {
      if (gen !== enrichGen.current) return;
      setSummaries((prev) => ({ ...prev, [key]: summary }));
      setSummaryLoadingKeys((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    }).then(() => {
      if (gen !== enrichGen.current) return;
      setSummaryLoadingKeys(new Set());
    });
  }, [options]);

  useEffect(() => {
    if (!preview) {
      setPosByBarcode({});
      return;
    }

    let cancelled = false;
    const codes = new Set<string>();
    const mainBc = preview.barcode || selected?.barcode || barcode.replace(/\D/g, "");
    if (mainBc) codes.add(mainBc);
    for (const s of preview.shades || []) {
      if (s.barcode) codes.add(s.barcode);
    }

    (async () => {
      setPosLoading(true);
      const next: Record<string, InventorySyncPreview | null> = {};
      for (const code of codes) {
        if (cancelled) return;
        next[code] = await fetchInventoryByBarcode(code);
      }
      if (!cancelled) {
        setPosByBarcode(next);
        setPosLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [preview, selected, barcode]);

  const posSummary = useMemo(() => {
    const rows = Object.values(posByBarcode).filter(Boolean) as InventorySyncPreview[];
    if (!rows.length) return null;
    return {
      price: rows[0]?.price ?? 0,
      originalPrice: rows[0]?.originalPrice ?? 0,
      discountPercent: rows[0]?.discountPercent ?? 0,
      stock: rows.reduce((sum, r) => sum + Number(r.stock ?? 0), 0),
      matched: rows.length,
    };
  }, [posByBarcode]);

  const runSearch = useCallback(async () => {
    const q = barcode.replace(/\D/g, "");
    if (!/^\d{8,14}$/.test(q)) {
      message.warning("أدخل باركوداً صالحاً (8–14 رقم)");
      return;
    }
    searchAbortRef.current?.abort();
    const controller = new AbortController();
    searchAbortRef.current = controller;
    const gen = ++searchGen.current;

    setSearching(true);
    setOptions([]);
    setStoreStatuses(createInitialStoreStatuses());
    setSummaries({});
    setSummaryLoadingKeys(new Set());
    setSelected(null);
    setPreview(null);
    setStep(0);

    try {
      const data = await searchCatalogByBarcodeProgressive(
        q,
        (partial) => {
          if (partial.length) {
            setOptions(partial);
            setStep(1);
          }
        },
        (event) => {
          if (event.type === "start") {
            const stores = (event as { stores?: Array<CatalogStoreSearchStatus & { id?: string }> }).stores;
            if (stores?.length) {
              const next: Record<string, CatalogStoreSearchStatus> = {};
              for (const s of stores) {
                const key = s.store || s.id || "";
                if (!key) continue;
                next[key] = { ...s, store: key };
              }
              setStoreStatuses(next);
            }
          }
          if (event.type === "store-status") {
            setStoreStatuses((prev) => ({
              ...prev,
              [event.store]: {
                store: event.store,
                status: event.status,
                label: event.label,
                count: event.count,
                message: event.message,
                fromIndex: event.fromIndex,
              },
            }));
          }
          if (event.type === "done") {
            setStoreStatuses((prev) => {
              const next = { ...prev };
              for (const storeId of CATALOG_STORES) {
                const cur = next[storeId];
                if (!cur || cur.status === "pending" || cur.status === "searching") {
                  next[storeId] = {
                    store: storeId,
                    status: "done",
                    label: CATALOG_STORE_META[storeId] || storeId,
                    count: cur?.count ?? 0,
                    message: cur?.message,
                  };
                }
              }
              return next;
            });
          }
        },
        controller.signal,
      );
      setOptions(data.options || []);
      if (gen !== searchGen.current) return;
      if (!data.options?.length) {
        const failedStores = (data.errors || []).filter((e) => e.message);
        message.info({
          key: "catalog-no-results",
          content: failedStores.length
            ? `لا توجد نتائج — فشل البحث في: ${failedStores.map((e) => e.store).join("، ")}`
            : "لا توجد نتائج في الكتالوج لهذا الباركود",
        });
      } else {
        setStep(1);
      }
    } catch (err: any) {
      if (err?.name !== "AbortError" && gen === searchGen.current) {
        message.error(errorMessage(err, "فشل البحث"));
      }
    } finally {
      if (searchAbortRef.current === controller && gen === searchGen.current) {
        setSearching(false);
        searchAbortRef.current = null;
      }
    }
  }, [barcode]);

  const loadPreview = useCallback(
    async (opt: CatalogImportOption) => {
      setSelected(opt);
      setLoadingPreview(true);
      setPreview(null);
      const bc = opt.barcode || barcode.replace(/\D/g, "");
      try {
        // مرحلة 1: عرض سريع بدون إثراء باركودات الدرجات
        const quick = await fetchCatalogProduct(opt.store, opt.sourceId, bc, { light: true });
        setPreview(quick);
        setLoadingPreview(false);
        setStep(2);

        const brandId = matchBrandId(brandsData, quick.brandAr, quick.brandEn);
        const [allSubcategories, allTertiary] = await Promise.all([
          qc.fetchQuery({
            queryKey: ["subcategories", "all"],
            queryFn: () => queries.subcategories(),
          }),
          qc.fetchQuery({
            queryKey: ["tertiary-sections", "all"],
            queryFn: () => queries.tertiarySections(),
          }),
        ]);

        const catMatch = matchCategoryFromHints(
          categoriesData,
          allSubcategories || [],
          allTertiary || [],
          hintToString(quick.categoryHint),
          hintToString(quick.categoryHintEn),
        );

        form.setFieldsValue({
          brandId,
          categoryId: catMatch.categoryId,
          subcategoryId: catMatch.subcategoryId,
          tertiaryCategoryId: catMatch.tertiaryCategoryId,
        });

        // مرحلة 2: إثراء باركود كل درجة في الخلفية
        fetchCatalogProduct(opt.store, opt.sourceId, bc, { enrichShades: true })
          .then((full) => setPreview(full))
          .catch(() => { /* المعاينة السريعة كافية */ });
      } catch (err: any) {
        message.error(errorMessage(err, "فشل جلب تفاصيل المنتج"));
        setLoadingPreview(false);
      }
    },
    [barcode, brandsData, categoriesData, form, qc],
  );

  const importProduct = useMutation({
    mutationFn: async () => {
      if (!preview) throw new Error("لا يوجد منتج للاستيراد");
      const values = await form.validateFields();

      message.loading({ content: "جاري رفع الصور...", key: "import" });

      const { productImages, shadeImageIds, failed: failedImages } =
        await uploadCatalogImportImages(preview, ({ done, total, failed }) => {
          message.loading({
            content: `جاري رفع الصور (${done}/${total})${failed ? ` · فشل ${failed}` : ""}...`,
            key: "import",
          });
        });

      if (!productImages.length && (preview.images.length > 0 || preview.shades.some((s) => s.imageUrl))) {
        throw new Error("تعذّر رفع صور المنتج من الكتالوج");
      }
      if (failedImages > 0) {
        message.warning(`${failedImages} صورة لم تُرفع — سيتم استيراد الباقي`);
      }

      const shades: any[] = [];
      for (let i = 0; i < (preview.shades || []).length; i++) {
        const s = preview.shades[i];
        const imageId = s.imageUrl ? shadeImageIds.get(s.imageUrl) : undefined;
        const colorHex = (await resolveShadeColorHex(s)) || s.colorHex || "#CCCCCC";

        let price: number | undefined;
        let originalPrice = 0;
        let discountPercent = 0;
        let stock = 0;
        if (s.barcode) {
          const inv = await fetchInventoryByBarcode(s.barcode);
          if (inv) {
            price = inv.price;
            originalPrice = inv.originalPrice;
            discountPercent = inv.discountPercent;
            stock = inv.stock;
          }
        }

        const shadeName = String(s.name || s.nameEn || `درجة ${i + 1}`).trim();
        shades.push({
          name: shadeName,
          colorHex,
          colorHexEnd: s.colorHexEnd,
          isGradient: !!s.isGradient,
          barcode: s.barcode || "",
          imageId,
          price,
          originalPrice,
          discountPercent,
          stock,
        });
      }

      let price = 0;
      let originalPrice = 0;
      let discountPercent = 0;
      let stock = 0;
      const mainBc =
        preview.barcode ||
        (preview.shades?.length ? undefined : selected?.barcode || barcode);
      if (mainBc) {
        const inv = await fetchInventoryByBarcode(mainBc);
        if (inv) {
          price = inv.price;
          originalPrice = inv.originalPrice;
          discountPercent = inv.discountPercent;
          stock = inv.stock;
        }
      }

      if (shades.length) {
        const withStock = shades.filter((s) => (s.stock ?? 0) > 0 || s.price != null);
        const lead = withStock[0] || shades[0];
        if (lead?.price != null) price = lead.price;
        if (lead?.originalPrice) originalPrice = lead.originalPrice;
        if (lead?.discountPercent) discountPercent = lead.discountPercent;
        stock = shades.reduce((sum, s) => sum + Number(s.stock ?? 0), 0);
      }

      const payload = buildProductPayload(
        {
          ...values,
          nameAr: preview.nameAr,
          nameEn: preview.nameEn,
          descriptionAr: stripHtml(preview.descriptionAr),
          descriptionEn: stripHtml(preview.descriptionEn),
          barcode: mainBc,
          sku: preview.sku || `CAT-${preview.store}-${preview.sourceId}`,
          price,
          originalPrice,
          discountPercent,
          stock,
          isActive: true,
          shades,
          variants: [],
          tags: [`import:${preview.store}`, preview.brandAr].filter(Boolean),
          skinType: [],
          concernIds: [],
        },
        productImages,
      );

      message.loading({ content: "جاري إنشاء المنتج...", key: "import" });
      return mutations.createProduct(payload);
    },
    onSuccess: () => {
      message.success({ content: "تم استيراد المنتج بنجاح", key: "import" });
      qc.invalidateQueries({ queryKey: ["products"] });
      setStep(0);
      setBarcode("");
      setOptions([]);
      setSummaries({});
      setSelected(null);
      setPreview(null);
      form.resetFields();
    },
    onError: (err: unknown) => {
      message.error({ content: errorMessage(err, "فشل الاستيراد"), key: "import" });
    },
  });

  const selectedKey = selected ? catalogOptionKey(selected) : null;

  return (
    <div className="catalog-import-page">
      <PageHeader
        title="الاستيراد من الكتالوج"
        subtitle={`البحث في Nice One · الريان · ميرايا · نجد · أورزدي · بيوتي وي · ڤانير · مسواگ · وجوه · Amazon — ${CATALOG_HUB_URL}`}
      />

      <Steps
        className="catalog-import-steps"
        current={step}
        items={[
          { title: "مسح الباركود", description: "ابحث في كل المتاجر" },
          { title: "اختيار النسخة", description: "قارن الصور والتصنيف" },
          { title: "التصنيف والاستيراد", description: "POS + أقسام المتجر" },
        ]}
      />

      <section className="catalog-import-toolbar">
        <div className="catalog-import-toolbar-text">
          <h3>
            <BarcodeOutlined style={{ marginInlineEnd: 6 }} />
            بحث بالباركود
          </h3>
          <p>ابحث في Nice One · الريان · ميرايا · نجد · أورزدي · بيوتي وي · ڤانير · مسواگ · وجوه · Amazon — تظهر النتائج أفقياً مع الصور والتدرجات</p>
        </div>
        <div className="catalog-import-search-row">
          <Input
            prefix={<SearchOutlined style={{ color: "#9a8faa" }} />}
            placeholder="باركود (8–14 رقم)"
            value={barcode}
            onChange={(e) => setBarcode(e.target.value)}
            onPressEnter={runSearch}
            dir="ltr"
            maxLength={20}
          />
          <Button type="primary" icon={<CloudDownloadOutlined />} loading={searching} onClick={runSearch}>
            بحث
          </Button>
        </div>
      </section>

      {(searching || Object.keys(storeStatuses).length > 0) && (
        <div className="catalog-import-store-progress">
          {CATALOG_STORES.map((storeId) => {
            const s = storeStatuses[storeId] || { store: storeId, status: "pending" as const };
            const color = STORE_COLORS[s.store] || "#888";
            const label = s.label || s.store;
            let tag = "…";
            if (s.status === "pending") tag = "انتظار";
            if (s.status === "searching") tag = "جاري";
            if (s.status === "done") tag = s.count ? `${s.count}` : "—";
            if (s.status === "error") tag = "!";
            return (
              <Tag
                key={s.store}
                title={s.message}
                color={s.status === "error" ? "red" : s.status === "done" && s.count ? color : "default"}
                style={{ opacity: s.status === "pending" ? 0.55 : 1 }}
              >
                {label} {tag}
              </Tag>
            );
          })}
          {searching && <Spin size="small" />}
        </div>
      )}

      {searching && !options.length && (
        <div className="catalog-import-empty">
          <Spin size="large" />
          <p style={{ marginTop: 16 }}>جاري البحث — النتائج تظهر فور وصولها من كل متجر</p>
        </div>
      )}

      {!searching && !options.length && Object.keys(storeStatuses).length > 0 && (
        <div className="catalog-import-empty">
          <Alert
            type="info"
            showIcon
            message="لا توجد نتائج لهذا الباركود"
            description="تم البحث في جميع المتاجر المتصلة. قد يكون المنتج غير معروض في الكتالوج، أو يستخدم كوداً داخلياً (وليس باركود EAN) — خصوصاً في أورزدي حيث ~65% من المنتجات لا تحتوي باركود EAN."
          />
        </div>
      )}

      {options.length > 0 && (
        <section className="catalog-import-results">
          <div className="catalog-import-results-head">
            <h4>النسخ المتوفرة في الكتالوج</h4>
            <Tag color="purple">{options.length} نتيجة{searching ? " · البحث مستمر…" : ""}</Tag>
          </div>
          {optionsByStore.map(([store, storeOptions]) => (
            <div key={store} className="catalog-import-store-block">
              <div className="catalog-import-store-label">
                <Tag color={STORE_COLORS[store] || "default"}>{storeOptions[0]?.storeLabel || store}</Tag>
                <span className="count">{storeOptions.length}</span>
              </div>
              <div className="catalog-import-rows">
                {storeOptions.map((opt) => {
                  const key = catalogOptionKey(opt);
                  return (
                    <CatalogOptionCard
                      key={`${key}:${opt.barcode || ""}`}
                      option={opt}
                      summary={summaries[key]}
                      summaryLoading={summaryLoadingKeys.has(key)}
                      selected={selectedKey === key}
                      onSelect={loadPreview}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </section>
      )}

      {loadingPreview && (
        <div className="catalog-import-empty">
          <Spin size="large" tip="جاري تحميل المعاينة..." />
        </div>
      )}

      {preview && !loadingPreview && (
        <div className="catalog-import-preview-layout">
          <Card className="catalog-preview-card" title="معاينة من الكتالوج">
            <div className="catalog-preview-hero">
              {preview.images[0]?.url && (
                <img
                  className={`catalog-preview-hero-img${selected?.store === "amazon" ? " catalog-preview-hero-img--amazon" : ""}`}
                  src={resolveCatalogImageUrl(preview.images[0].url)}
                  alt={preview.nameAr}
                  referrerPolicy="no-referrer"
                />
              )}
              <div className="catalog-preview-hero-body">
                {selected && <Tag color={STORE_COLORS[selected.store]}>{selected.storeLabel}</Tag>}
                <Typography.Title level={5} style={{ margin: "8px 0 4px" }}>
                  {preview.nameAr}
                </Typography.Title>
                {preview.nameEn && (
                  <Typography.Text type="secondary" className="alhayaa-ltr-input">
                    {preview.nameEn}
                  </Typography.Text>
                )}
                <div className="catalog-preview-stats">
                  <Tag color="processing">{preview.images.length} صور</Tag>
                  {preview.hasShades && <Tag color="purple">{preview.shades.length} تدرجات</Tag>}
                  {preview.priceHint && <Tag dir="ltr">{preview.priceHint}</Tag>}
                </div>
                <Typography.Text type="secondary" style={{ fontSize: 12 }} dir="ltr">
                  {preview.barcode || "—"}
                </Typography.Text>
              </div>
            </div>

            {(preview.categoryHint || preview.categoryHintEn) && (
              <div className="catalog-preview-category-box">
                <strong>تصنيف الكتالوج</strong>
                <span>
                  {Array.isArray(preview.categoryHint)
                    ? preview.categoryHint.join(" › ")
                    : preview.categoryHint}
                  {preview.categoryHintEn && preview.categoryHint !== preview.categoryHintEn
                    ? ` · ${Array.isArray(preview.categoryHintEn) ? preview.categoryHintEn.join(" › ") : preview.categoryHintEn}`
                    : ""}
                </span>
              </div>
            )}

            <p style={{ fontSize: 13, margin: "0 0 8px" }}>
              <strong>العلامة:</strong> {preview.brandAr}
              {preview.brandEn ? ` / ${preview.brandEn}` : ""}
            </p>

            {preview.shades?.length > 0 && (
              <>
                <Typography.Text strong>التدرجات اللونية</Typography.Text>
                <div className="catalog-shades-grid">
                  {preview.shades.map((s, i) => {
                    const inv = s.barcode ? posByBarcode[s.barcode] : null;
                    return (
                      <div key={`${s.barcode || s.name}-${i}`} className="catalog-shade-chip">
                        {s.colorHex ? (
                          <span
                            className="catalog-shade-swatch"
                            style={{
                              background: s.isGradient && s.colorHexEnd
                                ? `linear-gradient(135deg, ${s.colorHex}, ${s.colorHexEnd})`
                                : s.colorHex,
                            }}
                          />
                        ) : s.imageUrl ? (
                          <img
                            src={resolveCatalogImageUrl(s.imageUrl)}
                            alt=""
                            className="catalog-shade-swatch"
                            style={{ objectFit: "cover" }}
                            referrerPolicy="no-referrer"
                          />
                        ) : null}
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontWeight: 600 }}>{s.name}</div>
                          {s.barcode && (
                            <div style={{ fontSize: 10, opacity: 0.7 }} dir="ltr">
                              {s.barcode}
                            </div>
                          )}
                          {posLoading ? (
                            <Spin size="small" />
                          ) : inv ? (
                            <div style={{ fontSize: 10, color: "#389e0d" }}>
                              {inv.price} ر.س · مخزون {inv.stock}
                            </div>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            <Typography.Paragraph ellipsis={{ rows: 3 }} style={{ marginTop: 16 }}>
              <strong>الوصف (عربي):</strong> {stripHtml(preview.descriptionAr).slice(0, 400) || "—"}
            </Typography.Paragraph>
            {preview.descriptionEn && (
              <Typography.Paragraph ellipsis={{ rows: 3 }} className="alhayaa-ltr-input">
                <strong>الوصف (إنجليزي):</strong> {stripHtml(preview.descriptionEn).slice(0, 400)}
              </Typography.Paragraph>
            )}

            <div className="catalog-preview-gallery">
              {preview.images.map((img) => (
                <img
                  key={img.url}
                  className={selected?.store === "amazon" ? "catalog-preview-gallery-img--amazon" : undefined}
                  src={resolveCatalogImageUrl(img.url)}
                  alt=""
                  referrerPolicy="no-referrer"
                />
              ))}
            </div>
          </Card>

          <Card className="catalog-preview-card" title="إعدادات الاستيراد + POS">
            <Alert
              type="warning"
              showIcon
              style={{ marginBottom: 16 }}
              message="السعر والكمية والتخفيض تُجلب تلقائياً من نظام POS — لا تُستورد من الكتالوج"
            />
            {posLoading ? (
              <div style={{ marginBottom: 16 }}>
                <Spin size="small" /> جاري جلب بيانات POS...
              </div>
            ) : posSummary ? (
              <Alert
                type="success"
                showIcon
                style={{ marginBottom: 16 }}
                message={`من POS: السعر ${posSummary.price} ر.س · المخزون ${posSummary.stock} · خصم ${posSummary.discountPercent}% (${posSummary.matched} باركود)`}
              />
            ) : (
              <Alert
                type="info"
                showIcon
                style={{ marginBottom: 16 }}
                message="لم يُعثر على بيانات POS — سيُنشأ المنتج بسعر/مخزون صفر"
              />
            )}

            <Typography.Text type="secondary" style={{ display: "block", marginBottom: 12 }}>
              القسم · القسم الفرعي · القسم الثانوي · البراند
            </Typography.Text>
            <Form form={form} layout="vertical">
              <Form.Item
                name="categoryId"
                label="القسم"
                rules={[{ required: true, message: "اختر القسم" }]}
              >
                <Select
                  placeholder="اختر القسم"
                  options={(categoriesData || []).map((c: any) => ({
                    value: c.id,
                    label: c.nameAr || c.name,
                  }))}
                  showSearch
                  optionFilterProp="label"
                  onChange={() => {
                    form.setFieldValue("subcategoryId", undefined);
                    form.setFieldValue("tertiaryCategoryId", undefined);
                  }}
                />
              </Form.Item>
              <Form.Item name="subcategoryId" label="القسم الفرعي">
                <Select
                  allowClear
                  placeholder="اختياري"
                  options={subcategoryOptions}
                  disabled={!categoryId}
                  showSearch
                  optionFilterProp="label"
                  onChange={() => form.setFieldValue("tertiaryCategoryId", undefined)}
                />
              </Form.Item>
              <Form.Item name="tertiaryCategoryId" label="القسم الثانوي">
                <Select
                  allowClear
                  placeholder="اختياري"
                  options={tertiaryOptions}
                  disabled={!subcategoryId}
                  showSearch
                  optionFilterProp="label"
                />
              </Form.Item>
              <Form.Item
                name="brandId"
                label="البراند في متجرك"
                rules={[{ required: true, message: "اختر البراند" }]}
              >
                <Select
                  placeholder="اختر البراند"
                  options={(brandsData || []).map((b: any) => ({
                    value: b.id,
                    label: b.nameAr || b.name || b.nameEn,
                  }))}
                  showSearch
                  optionFilterProp="label"
                />
              </Form.Item>
              <Button
                type="primary"
                size="large"
                block
                icon={<CloudDownloadOutlined />}
                loading={importProduct.isPending}
                onClick={() => importProduct.mutate()}
              >
                استيراد المنتج إلى المتجر
              </Button>
            </Form>
          </Card>
        </div>
      )}
    </div>
  );
}
