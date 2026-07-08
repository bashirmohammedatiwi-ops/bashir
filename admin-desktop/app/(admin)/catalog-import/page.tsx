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
  Spin,
  Steps,
  Tag,
  Tree,
  Typography,
  message,
} from "antd";
import {
  AppstoreOutlined,
  BarcodeOutlined,
  CloudDownloadOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import type { DataNode } from "antd/es/tree";
import { useCallback, useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { CatalogOptionCard } from "@/components/catalog-import/CatalogOptionCard";
import { CATALOG_HUB_URL } from "@/lib/config";
import { matchCategoryFromHints } from "@/lib/catalogCategoryMatch";
import {
  catalogOptionKey,
  fetchCatalogProduct,
  fetchCatalogStores,
  fetchCategoryTree,
  listCategoryProducts,
  searchCatalogByBarcode,
  searchCatalogProducts,
  type CatalogCategoryNode,
  type CatalogImportOption,
  type CatalogImportProduct,
  type CatalogListProduct,
  type CatalogStore,
} from "@/lib/catalogImport";
import { fetchInventoryByBarcode } from "@/lib/inventorySync";
import { uploadCatalogImportImages } from "@/lib/uploadCatalogImages";
import { resolveCatalogImageUrl } from "@/lib/resolveCatalogImageUrl";
import { buildProductPayload } from "@/lib/productPayload";
import { resolveShadeColorHex } from "@/lib/shadeColorFromImage";
import { mutations, queries } from "@/lib/queries";
import "./catalog-import.css";

function errorMessage(err: unknown, fallback: string) {
  const e = err as { message?: string; response?: { data?: { error?: unknown; message?: unknown } } };
  const apiErr = e?.response?.data?.error;
  if (typeof apiErr === "string" && apiErr.trim()) return apiErr.trim();
  if (typeof e?.response?.data?.message === "string") return e.response.data.message;
  if (typeof e?.message === "string" && e.message.trim()) return e.message;
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

function stripHtml(html = "") {
  return String(html).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function toTreeData(nodes: CatalogCategoryNode[] = []): DataNode[] {
  return nodes.map((n) => ({
    key: n.id,
    title: (
      <span>
        {n.name}
        {n.productCount != null && n.productCount > 0 ? (
          <Tag style={{ marginInlineStart: 6 }}>{n.productCount}</Tag>
        ) : null}
      </span>
    ),
    isLeaf: n.isLeaf,
    children: n.children?.length ? toTreeData(n.children) : undefined,
  }));
}

function listProductToOption(p: CatalogListProduct, store: CatalogStore): CatalogImportOption {
  return {
    store: store.id,
    storeLabel: store.label,
    sourceId: p.id,
    nameAr: p.nameAr,
    nameEn: p.nameEn,
    brandAr: p.brandAr,
    thumb: p.thumb,
    shadeCount: p.shadeCount,
    price: p.price,
    category: p.category,
    matchType: "browse",
  };
}

export default function CatalogImportPage() {
  const [stores, setStores] = useState<CatalogStore[]>([]);
  const [activeStore, setActiveStore] = useState("miswag");
  const [tree, setTree] = useState<CatalogCategoryNode[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [categoryPath, setCategoryPath] = useState("");
  const [products, setProducts] = useState<CatalogListProduct[]>([]);
  const [productPage, setProductPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [treeLoading, setTreeLoading] = useState(false);

  const [searchText, setSearchText] = useState("");
  const [barcode, setBarcode] = useState("");
  const [searching, setSearching] = useState(false);
  const [options, setOptions] = useState<CatalogImportOption[]>([]);

  const [selected, setSelected] = useState<CatalogImportOption | null>(null);
  const [preview, setPreview] = useState<CatalogImportProduct | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [step, setStep] = useState(0);
  const [form] = Form.useForm();
  const qc = useQueryClient();

  const { data: categoriesData = [] } = useQuery({ queryKey: ["categories"], queryFn: queries.categories });
  const { data: brandsData = [] } = useQuery({ queryKey: ["brands"], queryFn: queries.brands });

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

  const storeMeta = useMemo(
    () => stores.find((s) => s.id === activeStore) || { id: activeStore, label: activeStore },
    [stores, activeStore],
  );

  useEffect(() => {
    fetchCatalogStores()
      .then((list) => {
        setStores(list);
        if (list.length && !list.find((s) => s.id === activeStore)) {
          setActiveStore(list[0].id);
        }
      })
      .catch(() => message.error("تعذّر تحميل قائمة المتاجر من الكتالوج"));
  }, [activeStore]);

  const loadTree = useCallback(async (storeId: string) => {
    setTreeLoading(true);
    setTree([]);
    setSelectedCategory(null);
    setCategoryPath("");
    setProducts([]);
    try {
      const data = await fetchCategoryTree(storeId);
      setTree(data.tree || []);
    } catch (err) {
      message.error(errorMessage(err, "فشل تحميل الأقسام"));
    } finally {
      setTreeLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeStore) loadTree(activeStore);
  }, [activeStore, loadTree]);

  const loadCategoryProducts = useCallback(
    async (catId: string, page = 1, append = false) => {
      setLoadingProducts(true);
      try {
        const data = await listCategoryProducts(activeStore, catId, page);
        setProducts((prev) => (append ? [...prev, ...data.products] : data.products));
        setProductPage(data.page);
        setHasMore(data.hasMore);
      } catch (err) {
        message.error(errorMessage(err, "فشل تحميل المنتجات"));
      } finally {
        setLoadingProducts(false);
      }
    },
    [activeStore],
  );

  const onSelectCategory = useCallback(
    (keys: React.Key[], info: { node: DataNode }) => {
      const id = String(keys[0] || "");
      if (!id) return;
      setSelectedCategory(id);
      setCategoryPath(String(info.node.title || id));
      setStep(0);
      setOptions([]);
      loadCategoryProducts(id, 1, false);
    },
    [loadCategoryProducts],
  );

  const runTextSearch = useCallback(async () => {
    const q = searchText.trim();
    if (!q) return;
    setSearching(true);
    setOptions([]);
    try {
      const data = await searchCatalogProducts(activeStore, q, 1, 30);
      const opts = data.products.map((p) => listProductToOption(p, storeMeta));
      setOptions(opts);
      if (!opts.length) message.info("لا توجد نتائج");
      else setStep(1);
    } catch (err) {
      message.error(errorMessage(err, "فشل البحث"));
    } finally {
      setSearching(false);
    }
  }, [searchText, activeStore, storeMeta]);

  const runBarcodeSearch = useCallback(async () => {
    const digits = barcode.replace(/\D/g, "");
    if (digits.length < 8) {
      message.warning("أدخل باركوداً صالحاً (8–14 رقم)");
      return;
    }
    setSearching(true);
    setOptions([]);
    try {
      const data = await searchCatalogByBarcode(digits, activeStore);
      setOptions(data.options);
      if (!data.options.length) message.info("لا توجد نتائج لهذا الباركود");
      else setStep(1);
    } catch (err) {
      message.error(errorMessage(err, "فشل البحث بالباركود"));
    } finally {
      setSearching(false);
    }
  }, [barcode, activeStore]);

  const loadPreview = useCallback(
    async (opt: CatalogImportOption) => {
      setSelected(opt);
      setLoadingPreview(true);
      setPreview(null);
      try {
        const product = await fetchCatalogProduct(opt.store, opt.sourceId, opt.storeLabel);
        setPreview(product);

        const brandId = matchBrandId(brandsData, product.brandAr, product.brandEn);
        const [allSubcategories, allTertiary] = await Promise.all([
          qc.fetchQuery({ queryKey: ["subcategories", "all"], queryFn: () => queries.subcategories() }),
          qc.fetchQuery({ queryKey: ["tertiary-sections", "all"], queryFn: () => queries.tertiarySections() }),
        ]);

        const catMatch = matchCategoryFromHints(
          categoriesData,
          allSubcategories || [],
          allTertiary || [],
          product.categoryHint || "",
          "",
        );

        form.setFieldsValue({
          brandId,
          categoryId: catMatch.categoryId,
          subcategoryId: catMatch.subcategoryId,
          tertiaryCategoryId: catMatch.tertiaryCategoryId,
        });
        setStep(2);
      } catch (err) {
        message.error(errorMessage(err, "فشل جلب تفاصيل المنتج"));
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
      const { productImages, shadeImageIds, failed: failedImages } = await uploadCatalogImportImages(
        preview,
        ({ done, total, failed }) => {
          message.loading({
            content: `جاري رفع الصور (${done}/${total})${failed ? ` · فشل ${failed}` : ""}...`,
            key: "import",
          });
        },
      );

      if (!productImages.length && (preview.images.length > 0 || preview.shades.some((s) => s.imageUrl))) {
        throw new Error("تعذّر رفع صور المنتج");
      }
      if (failedImages > 0) message.warning(`${failedImages} صورة لم تُرفع`);

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

        shades.push({
          name: String(s.name || s.nameAr || `درجة ${i + 1}`).trim(),
          colorHex,
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
      const mainBc = preview.barcode || selected?.barcode || barcode.replace(/\D/g, "");
      if (mainBc && !shades.length) {
        const inv = await fetchInventoryByBarcode(mainBc);
        if (inv) {
          price = inv.price;
          originalPrice = inv.originalPrice;
          discountPercent = inv.discountPercent;
          stock = inv.stock;
        }
      }
      if (shades.length) {
        const lead = shades.find((s) => s.price != null) || shades[0];
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
          barcode: mainBc || undefined,
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
      setSearchText("");
      setOptions([]);
      setSelected(null);
      setPreview(null);
      form.resetFields();
    },
    onError: (err: unknown) => {
      message.error({ content: errorMessage(err, "فشل الاستيراد"), key: "import" });
    },
  });

  const browseOptions = useMemo(
    () => products.map((p) => listProductToOption(p, storeMeta)),
    [products, storeMeta],
  );

  const displayOptions = options.length ? options : step >= 1 ? [] : browseOptions;

  return (
    <div className="catalog-import-page">
      <PageHeader
        title="الاستيراد من الكتالوج"
        subtitle={`تصفّح واستورد من المتاجر الخارجية — ${CATALOG_HUB_URL}`}
      />

      <Steps
        className="catalog-import-steps"
        current={step}
        items={[
          { title: "تصفح / بحث", description: "أقسام المتجر أو باركود" },
          { title: "اختيار المنتج", description: "معاينة سريعة" },
          { title: "التصنيف والاستيراد", description: "أقسام المتجر + POS" },
        ]}
      />

      <section className="catalog-import-toolbar">
        <div className="catalog-import-toolbar-text">
          <h3>
            <AppstoreOutlined style={{ marginInlineEnd: 6 }} />
            متجر الكتالوج
          </h3>
          <p>اختر المتجر ثم تصفّح الأقسام أو ابحث بالاسم/الباركود — البنية جاهزة لإضافة متاجر جديدة</p>
        </div>
        <Select
          value={activeStore}
          onChange={setActiveStore}
          style={{ minWidth: 200 }}
          options={stores.map((s) => ({ value: s.id, label: s.label }))}
        />
      </section>

      <Row gutter={16}>
        <Col xs={24} md={8} lg={7}>
          <Card title="أقسام المتجر" size="small" className="catalog-import-tree-card">
            {treeLoading ? (
              <div className="catalog-import-center"><Spin /></div>
            ) : (
              <Tree
                showLine
                selectable
                onSelect={onSelectCategory}
                treeData={toTreeData(tree)}
                height={420}
              />
            )}
          </Card>
        </Col>

        <Col xs={24} md={16} lg={17}>
          <section className="catalog-import-toolbar">
            <div className="catalog-import-search-row">
              <Input
                prefix={<SearchOutlined />}
                placeholder="بحث بالاسم..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onPressEnter={runTextSearch}
              />
              <Button type="primary" icon={<SearchOutlined />} loading={searching} onClick={runTextSearch}>
                بحث
              </Button>
            </div>
            <div className="catalog-import-search-row">
              <Input
                prefix={<BarcodeOutlined />}
                placeholder="باركود (8–14 رقم)"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                onPressEnter={runBarcodeSearch}
              />
              <Button icon={<BarcodeOutlined />} loading={searching} onClick={runBarcodeSearch}>
                باركود
              </Button>
            </div>
          </section>

          {selectedCategory && (
            <Alert
              type="info"
              showIcon
              style={{ marginBottom: 12 }}
              message={`القسم: ${categoryPath}`}
            />
          )}

          <div className="catalog-import-results">
            {loadingProducts && !displayOptions.length ? (
              <div className="catalog-import-center"><Spin size="large" /></div>
            ) : displayOptions.length ? (
              <div className="catalog-import-options">
                {displayOptions.map((opt) => (
                  <CatalogOptionCard
                    key={catalogOptionKey(opt)}
                    option={opt}
                    selected={selected ? catalogOptionKey(selected) === catalogOptionKey(opt) : false}
                    onSelect={loadPreview}
                  />
                ))}
              </div>
            ) : (
              <div className="catalog-import-empty">
                <Typography.Text type="secondary">
                  اختر قسماً من الشجرة أو ابحث بالاسم/الباركود
                </Typography.Text>
              </div>
            )}

            {hasMore && selectedCategory && (
              <div className="catalog-import-load-more">
                <Button
                  loading={loadingProducts}
                  onClick={() => loadCategoryProducts(selectedCategory, productPage + 1, true)}
                >
                  تحميل المزيد
                </Button>
              </div>
            )}
          </div>
        </Col>
      </Row>

      {step === 2 && (
        <Card
          className="catalog-import-preview-card"
          title="معاينة الاستيراد"
          extra={
            <Button
              type="primary"
              icon={<CloudDownloadOutlined />}
              loading={importProduct.isPending || loadingPreview}
              onClick={() => importProduct.mutate()}
            >
              استيراد المنتج
            </Button>
          }
        >
          {loadingPreview ? (
            <div className="catalog-import-center"><Spin /></div>
          ) : preview ? (
            <Row gutter={24}>
              <Col xs={24} md={10}>
                {(preview.images[0]?.url) ? (
                  <img
                    className="catalog-preview-hero"
                    src={resolveCatalogImageUrl(preview.images[0].url)}
                    alt={preview.nameAr}
                    referrerPolicy="no-referrer"
                  />
                ) : null}
                {preview.shades.length > 0 && (
                  <div className="catalog-preview-shades">
                    <Typography.Text strong>التدرجات ({preview.shades.length})</Typography.Text>
                    <div className="catalog-preview-shade-grid">
                      {preview.shades.map((s, i) => (
                        <div key={i} className="catalog-preview-shade">
                          {s.colorHex && (
                            <span className="catalog-preview-swatch" style={{ background: s.colorHex }} />
                          )}
                          <div>
                            <div>{s.name || s.nameAr}</div>
                            {s.barcode && <small>{s.barcode}</small>}
                            {s.colorHex && <small>{s.colorHex}</small>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Col>
              <Col xs={24} md={14}>
                <Typography.Title level={4}>{preview.nameAr}</Typography.Title>
                {preview.brandAr && <Tag>{preview.brandAr}</Tag>}
                {preview.priceHint && <Tag color="green">{preview.priceHint}</Tag>}
                {preview.categoryHint && (
                  <p className="catalog-preview-category">{preview.categoryHint}</p>
                )}

                <Form form={form} layout="vertical" className="catalog-import-form">
                  <Form.Item name="brandId" label="البراند">
                    <Select
                      allowClear
                      showSearch
                      optionFilterProp="label"
                      options={(brandsData || []).map((b: any) => ({
                        value: b.id,
                        label: b.nameAr || b.name || b.nameEn,
                      }))}
                    />
                  </Form.Item>
                  <Form.Item name="categoryId" label="القسم" rules={[{ required: true }]}>
                    <Select
                      showSearch
                      optionFilterProp="label"
                      options={(categoriesData || []).map((c: any) => ({
                        value: c.id,
                        label: c.nameAr || c.name,
                      }))}
                    />
                  </Form.Item>
                  <Form.Item name="subcategoryId" label="قسم فرعي">
                    <Select
                      allowClear
                      showSearch
                      optionFilterProp="label"
                      options={(subcategoriesData || []).map((s: any) => ({
                        value: s.id,
                        label: s.nameAr || s.name,
                      }))}
                    />
                  </Form.Item>
                  <Form.Item name="tertiaryCategoryId" label="قسم ثانوي">
                    <Select
                      allowClear
                      showSearch
                      optionFilterProp="label"
                      options={(tertiarySectionsData || []).map((s: any) => ({
                        value: s.id,
                        label: s.nameAr || s.name,
                      }))}
                    />
                  </Form.Item>
                </Form>
              </Col>
            </Row>
          ) : null}
        </Card>
      )}
    </div>
  );
}
