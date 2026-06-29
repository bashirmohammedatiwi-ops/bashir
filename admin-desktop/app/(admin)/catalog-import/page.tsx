"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Alert,
  Button,
  Card,
  Form,
  Input,
  Select,
  Space,
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
  fetchCatalogProduct,
  fetchCatalogSummariesBatch,
  searchCatalogByBarcodeProgressive,
  type CatalogImportOption,
  type CatalogImportProduct,
  type CatalogImportSummary,
} from "@/lib/catalogImport";
import { fetchInventoryByBarcode, type InventorySyncPreview } from "@/lib/inventorySync";
import { uploadCatalogImportImages } from "@/lib/uploadCatalogImages";
import { resolveCatalogImageUrl } from "@/lib/uploadFromUrl";
import { buildProductPayload } from "@/lib/productPayload";
import { mutations, queries } from "@/lib/queries";
import "./catalog-import.css";

function matchBrandId(brands: any[] = [], brandAr = "", brandEn = "") {
  const keys = [brandAr, brandEn].map((s) => String(s || "").trim().toLowerCase()).filter(Boolean);
  if (!keys.length) return undefined;
  const hit = brands.find((b) => {
    const names = [b.name, b.nameAr, b.nameEn].map((n) => String(n || "").trim().toLowerCase());
    return keys.some((k) => names.some((n) => n === k || n.includes(k) || k.includes(n)));
  });
  return hit?.id;
}

function stripHtml(html = "") {
  return String(html).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

export default function CatalogImportPage() {
  const [barcode, setBarcode] = useState("");
  const [searching, setSearching] = useState(false);
  const [options, setOptions] = useState<CatalogImportOption[]>([]);
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
    setSearching(true);
    setOptions([]);
    setSummaries({});
    setSummaryLoadingKeys(new Set());
    setSelected(null);
    setPreview(null);
    setStep(0);
    try {
      const data = await searchCatalogByBarcodeProgressive(q, (partial) => {
        if (partial.length) {
          setOptions(partial);
          setStep(1);
        }
      });
      setOptions(data.options || []);
      if (!data.options?.length) {
        message.info("لا توجد نتائج في الكتالوج لهذا الباركود");
      } else {
        message.success(`وُجد ${data.options.length} نسخة في الكتالوج`);
        setStep(1);
      }
    } catch (err: any) {
      message.error(err?.message || "فشل البحث");
    } finally {
      setSearching(false);
    }
  }, [barcode]);

  const loadPreview = useCallback(
    async (opt: CatalogImportOption) => {
      setSelected(opt);
      setLoadingPreview(true);
      setPreview(null);
      try {
        const product = await fetchCatalogProduct(opt.store, opt.sourceId);
        setPreview(product);
        const brandId = matchBrandId(brandsData, product.brandAr, product.brandEn);

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
          product.categoryHint,
          product.categoryHintEn,
        );

        form.setFieldsValue({
          brandId,
          categoryId: catMatch.categoryId,
          subcategoryId: catMatch.subcategoryId,
          tertiaryCategoryId: catMatch.tertiaryCategoryId,
        });
        setStep(2);
      } catch (err: any) {
        message.error(err?.message || "فشل جلب تفاصيل المنتج");
      } finally {
        setLoadingPreview(false);
      }
    },
    [brandsData, categoriesData, form, qc],
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

        shades.push({
          name: s.name,
          colorHex: s.colorHex || "#CCCCCC",
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
      const mainBc = preview.barcode || selected?.barcode || barcode;
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
    onError: (err: any) => {
      message.error({ content: err?.message || "فشل الاستيراد", key: "import" });
    },
  });

  const selectedKey = selected ? catalogOptionKey(selected) : null;

  return (
    <div className="catalog-import-page">
      <PageHeader
        title="الاستيراد من الكتالوج"
        subtitle={`البحث في Nice One · Vanilla · الريان · ميرايا · وجوه — ${CATALOG_HUB_URL}`}
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

      <section className="catalog-import-hero">
        <h3>
          <BarcodeOutlined style={{ marginInlineEnd: 8 }} />
          بحث سريع بالباركود
        </h3>
        <p>امسح الباركود أو أدخله يدوياً — ستظهر النتائج تدريجياً مع تصنيف كل منتج وعدد الصور والتدرجات.</p>
        <div className="catalog-import-search-row">
          <Input
            prefix={<SearchOutlined style={{ color: "#9a8faa" }} />}
            placeholder="امسح أو أدخل الباركود (8–14 رقم)"
            value={barcode}
            onChange={(e) => setBarcode(e.target.value)}
            onPressEnter={runSearch}
            style={{ flex: "1 1 280px", maxWidth: 420 }}
            dir="ltr"
            maxLength={20}
            size="large"
          />
          <Button type="primary" size="large" icon={<CloudDownloadOutlined />} loading={searching} onClick={runSearch}>
            بحث في الكتالوج
          </Button>
        </div>
      </section>

      {searching && !options.length && (
        <div className="catalog-import-empty">
          <Spin size="large" />
          <p style={{ marginTop: 16 }}>جاري البحث في متاجر الكتالوج...</p>
        </div>
      )}

      {options.length > 0 && (
        <Card
          className="catalog-preview-card"
          title={
            <Space>
              <span>النسخ المتوفرة</span>
              <Tag>{options.length} نتيجة</Tag>
            </Space>
          }
          style={{ marginBottom: 16 }}
        >
          {optionsByStore.map(([store, storeOptions]) => (
            <div key={store} className="catalog-import-store-group">
              <div className="catalog-import-store-header">
                <Tag color={STORE_COLORS[store] || "default"}>{storeOptions[0]?.storeLabel || store}</Tag>
                <h4>منتجات {storeOptions[0]?.storeLabel}</h4>
                <span className="catalog-import-store-count">{storeOptions.length}</span>
              </div>
              <div className="catalog-import-grid">
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
        </Card>
      )}

      {loadingPreview && (
        <div className="catalog-import-empty">
          <Spin size="large" tip="جاري جلب تفاصيل المنتج مع كل التدرجات..." />
        </div>
      )}

      {preview && !loadingPreview && (
        <div className="catalog-import-preview-layout">
          <Card className="catalog-preview-card" title="معاينة من الكتالوج">
            {selected && <Tag color={STORE_COLORS[selected.store]}>{selected.storeLabel}</Tag>}

            <Typography.Title level={4} style={{ marginTop: 12, marginBottom: 4 }}>
              {preview.nameAr}
            </Typography.Title>
            {preview.nameEn && (
              <Typography.Paragraph type="secondary" style={{ marginBottom: 12 }}>
                {preview.nameEn}
              </Typography.Paragraph>
            )}

            <div className="catalog-preview-stats">
              <Tag icon={<span>📷</span>} color="processing">
                {preview.images.length} {preview.images.length === 1 ? "صورة" : "صور"}
              </Tag>
              {preview.hasShades && (
                <Tag icon={<span>🎨</span>} color="purple">
                  {preview.shades.length} {preview.shades.length === 1 ? "تدرج لوني" : "تدرجات لونية"}
                </Tag>
              )}
              {preview.priceHint && (
                <Tag color="gold" dir="ltr">
                  {preview.priceHint}
                </Tag>
              )}
            </div>

            {(preview.categoryHint || preview.categoryHintEn) && (
              <div className="catalog-preview-category-box">
                <strong>تصنيف الكتالوج</strong>
                <span>
                  {preview.categoryHint}
                  {preview.categoryHintEn && preview.categoryHint !== preview.categoryHintEn
                    ? ` · ${preview.categoryHintEn}`
                    : ""}
                </span>
              </div>
            )}

            <p>
              <strong>العلامة:</strong> {preview.brandAr}
              {preview.brandEn ? ` / ${preview.brandEn}` : ""}
            </p>
            <p>
              <strong>الباركود:</strong> <span dir="ltr">{preview.barcode || "—"}</span>
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
                <img key={img.url} src={resolveCatalogImageUrl(img.url)} alt="" />
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
