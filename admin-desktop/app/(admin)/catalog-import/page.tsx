"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Alert,
  Button,
  Card,
  Col,
  Form,
  Input,
  Row,
  Select,
  Space,
  Spin,
  Steps,
  Table,
  Tag,
  Typography,
  message,
} from "antd";
import { useCallback, useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { CATALOG_HUB_URL } from "@/lib/config";
import {
  fetchCatalogProduct,
  searchCatalogByBarcodeProgressive,
  type CatalogImportOption,
  type CatalogImportProduct,
} from "@/lib/catalogImport";
import { fetchInventoryByBarcode, type InventorySyncPreview } from "@/lib/inventorySync";
import { uploadCatalogImportImages } from "@/lib/uploadCatalogImages";
import { resolveCatalogImageUrl } from "@/lib/uploadFromUrl";
import { buildProductPayload } from "@/lib/productPayload";
import { mutations, queries } from "@/lib/queries";

const STORE_COLORS: Record<string, string> = {
  niceone: "#e91e63",
  vanilla: "#9c27b0",
  elryan: "#1976d2",
  miraaya: "#00897b",
  faces: "#212121",
};

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
  const [selected, setSelected] = useState<CatalogImportOption | null>(null);
  const [preview, setPreview] = useState<CatalogImportProduct | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [step, setStep] = useState(0);
  const [posLoading, setPosLoading] = useState(false);
  const [posByBarcode, setPosByBarcode] = useState<Record<string, InventorySyncPreview | null>>({});
  const [form] = Form.useForm();
  const qc = useQueryClient();

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
        form.setFieldsValue({
          categoryId: undefined,
          subcategoryId: undefined,
          brandId,
        });
        setStep(2);
      } catch (err: any) {
        message.error(err?.message || "فشل جلب تفاصيل المنتج");
      } finally {
        setLoadingPreview(false);
      }
    },
    [brandsData, form],
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
      setSelected(null);
      setPreview(null);
      form.resetFields();
    },
    onError: (err: any) => {
      message.error({ content: err?.message || "فشل الاستيراد", key: "import" });
    },
  });

  const optionColumns = [
    {
      title: "المتجر",
      dataIndex: "storeLabel",
      render: (_: string, row: CatalogImportOption) => (
        <Tag color={STORE_COLORS[row.store] || "default"}>{row.storeLabel}</Tag>
      ),
    },
    {
      title: "المنتج",
      dataIndex: "nameAr",
      render: (_: string, row: CatalogImportOption) => (
        <div>
          <div>{row.nameAr}</div>
          {row.nameEn && (
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              {row.nameEn}
            </Typography.Text>
          )}
        </div>
      ),
    },
    {
      title: "العلامة",
      dataIndex: "brandAr",
    },
    {
      title: "الباركود",
      dataIndex: "barcode",
      render: (v: string) => <span dir="ltr">{v}</span>,
    },
    {
      title: "",
      render: (_: unknown, row: CatalogImportOption) => (
        <Button type="primary" size="small" onClick={() => loadPreview(row)}>
          اختيار
        </Button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="الاستيراد من الكتالوج"
        subtitle={`البحث في Nice One · Vanilla · الريان · ميرايا · وجوه — ${CATALOG_HUB_URL}`}
      />

      <Steps
        current={step}
        style={{ marginBottom: 24, maxWidth: 720 }}
        items={[
          { title: "الباركود" },
          { title: "اختيار النسخة" },
          { title: "التصنيف والاستيراد" },
        ]}
      />

      <Card style={{ marginBottom: 16 }}>
        <Space wrap size="middle">
          <Input
            placeholder="امسح أو أدخل الباركود"
            value={barcode}
            onChange={(e) => setBarcode(e.target.value)}
            onPressEnter={runSearch}
            style={{ width: 280 }}
            dir="ltr"
            maxLength={20}
          />
          <Button type="primary" loading={searching} onClick={runSearch}>
            بحث في الكتالوج
          </Button>
        </Space>
      </Card>

      {options.length > 0 && (
        <Card title="النسخ المتوفرة" style={{ marginBottom: 16 }}>
          <Table
            rowKey={(r) => `${r.store}:${r.sourceId}:${r.barcode}`}
            dataSource={options}
            columns={optionColumns}
            pagination={false}
            size="small"
          />
        </Card>
      )}

      {loadingPreview && (
        <div style={{ textAlign: "center", padding: 40 }}>
          <Spin size="large" tip="جاري جلب تفاصيل المنتج مع كل التدرجات..." />
        </div>
      )}

      {preview && !loadingPreview && (
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={14}>
            <Card title="معاينة من الكتالوج">
              {selected && (
                <Tag color={STORE_COLORS[selected.store]}>{selected.storeLabel}</Tag>
              )}
              <Typography.Title level={5} style={{ marginTop: 12 }}>
                {preview.nameAr}
              </Typography.Title>
              {preview.nameEn && (
                <Typography.Paragraph type="secondary">{preview.nameEn}</Typography.Paragraph>
              )}
              <p>
                <strong>العلامة:</strong> {preview.brandAr}
                {preview.brandEn ? ` / ${preview.brandEn}` : ""}
              </p>
              <p>
                <strong>الباركود:</strong> <span dir="ltr">{preview.barcode || "—"}</span>
              </p>
              {preview.hasShades && (
                <Alert
                  type="info"
                  showIcon
                  style={{ marginBottom: 12 }}
                  message={`يُستورد المنتج مع ${preview.shades.length} تدرج لون`}
                />
              )}
              {preview.shades?.length > 0 && (
                <Table
                  size="small"
                  pagination={false}
                  rowKey={(s, i) => `${s.barcode || s.name}-${i}`}
                  dataSource={preview.shades}
                  columns={[
                    { title: "التدرج", dataIndex: "name" },
                    {
                      title: "الباركود",
                      dataIndex: "barcode",
                      render: (v) => <span dir="ltr">{v || "—"}</span>,
                    },
                    {
                      title: "POS",
                      render: (_, s) => {
                        const inv = s.barcode ? posByBarcode[s.barcode] : null;
                        if (posLoading) return <Spin size="small" />;
                        if (!inv) return <Tag>لا يوجد</Tag>;
                        return (
                          <span>
                            {inv.price} ر.س · مخزون {inv.stock}
                            {inv.discountPercent > 0 ? ` · خصم ${inv.discountPercent}%` : ""}
                          </span>
                        );
                      },
                    },
                    {
                      title: "اللون",
                      render: (_, s) =>
                        s.colorHex ? (
                          <span
                            style={{
                              display: "inline-block",
                              width: 20,
                              height: 20,
                              borderRadius: 4,
                              background: s.colorHex,
                              border: "1px solid #ddd",
                            }}
                          />
                        ) : (
                          "—"
                        ),
                    },
                  ]}
                />
              )}
              <Typography.Paragraph ellipsis={{ rows: 4 }}>
                <strong>الوصف (عربي):</strong>{" "}
                {stripHtml(preview.descriptionAr).slice(0, 300) || "—"}
                {stripHtml(preview.descriptionAr).length > 300 ? "…" : ""}
              </Typography.Paragraph>
              {preview.descriptionEn && (
                <Typography.Paragraph ellipsis={{ rows: 4 }} className="alhayaa-ltr-input">
                  <strong>الوصف (إنجليزي):</strong>{" "}
                  {stripHtml(preview.descriptionEn).slice(0, 300)}
                  {stripHtml(preview.descriptionEn).length > 300 ? "…" : ""}
                </Typography.Paragraph>
              )}
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
                {preview.images.map((img) => (
                  <img
                    key={img.url}
                    src={resolveCatalogImageUrl(img.url)}
                    alt=""
                    style={{ width: 72, height: 72, objectFit: "cover", borderRadius: 8 }}
                  />
                ))}
              </div>
            </Card>
          </Col>

          <Col xs={24} lg={10}>
            <Card title="إعدادات يدوية + POS">
              <Alert
                type="warning"
                showIcon
                style={{ marginBottom: 16 }}
                message="السعر والكمية والتخفيض تُجلب تلقائياً من نظام POS المزامن — لا تُستورد من الكتالوج"
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
                  message="لم يُعثر على بيانات POS لهذا الباركود — سيُنشأ المنتج بسعر/مخزون صفر"
                />
              )}
              <Typography.Text type="secondary" style={{ display: "block", marginBottom: 12 }}>
                يدوياً: القسم · القسم الفرعي · القسم الثانوي · البراند
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
                  loading={importProduct.isPending}
                  onClick={() => importProduct.mutate()}
                >
                  استيراد المنتج إلى المتجر
                </Button>
              </Form>
            </Card>
          </Col>
        </Row>
      )}
    </div>
  );
}
