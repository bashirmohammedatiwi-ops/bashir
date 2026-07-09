"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Button,
  Drawer,
  Form,
  Input,
  Select,
  Spin,
  Tag,
  Tree,
  message,
} from "antd";
import {
  AppstoreOutlined,
  BarcodeOutlined,
  CheckCircleFilled,
  CloudDownloadOutlined,
  CloseOutlined,
  SearchOutlined,
  ShopOutlined,
} from "@ant-design/icons";
import type { DataNode } from "antd/es/tree";
import { useCallback, useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { CatalogOptionCard, storeColor } from "@/components/catalog-import/CatalogOptionCard";
import { matchCategoryFromHints } from "@/lib/catalogCategoryMatch";
import {
  catalogOptionKey,
  fetchCatalogProduct,
  fetchCatalogStores,
  fetchCategoryTree,
  isMiswagInternalId,
  isEanBarcode,
  fetchAmazonCrawlStatus,
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
          <Tag style={{ marginInlineStart: 6 }}>{n.productCount.toLocaleString("ar-IQ")}</Tag>
        ) : null}
      </span>
    ),
    isLeaf: n.isLeaf,
    children: n.children?.length ? toTreeData(n.children) : undefined,
    // بيانات خام للاستخدام في onSelect
    name: n.name,
    path: n.path,
  } as DataNode & { name?: string; path?: string }));
}

function findCategoryLabel(tree: CatalogCategoryNode[], id: string, prefix = ""): string {
  for (const node of tree) {
    const path = prefix ? `${prefix} › ${node.name}` : node.name;
    if (node.id === id) return path;
    if (node.children?.length) {
      const hit = findCategoryLabel(node.children, id, path);
      if (hit) return hit;
    }
  }
  return id;
}

function listProductToOption(p: CatalogListProduct, store: CatalogStore): CatalogImportOption {
  return {
    store: p.store || store.id,
    storeLabel: p.storeLabel || store.label,
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
  // البحث الافتراضي يشمل أمازون — النتائج تظهر تدريجياً من المتاجر الأسرع
  const [activeStores, setActiveStores] = useState<string[]>(["miswag", "najdalatheyah", "elryan", "amazon"]);
  const [browseStore, setBrowseStore] = useState("miswag");
  const [tree, setTree] = useState<CatalogCategoryNode[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [categoryPath, setCategoryPath] = useState("");
  const [products, setProducts] = useState<CatalogListProduct[]>([]);
  const [productPage, setProductPage] = useState(1);
  const [productTotal, setProductTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [treeLoading, setTreeLoading] = useState(false);
  const [amazonCatalogHint, setAmazonCatalogHint] = useState("");

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
    () => stores.find((s) => s.id === browseStore) || { id: browseStore, label: browseStore },
    [stores, browseStore],
  );
  const searchStoreLabels = useMemo(
    () => activeStores.map((id) => stores.find((s) => s.id === id)?.label || id).join(" · "),
    [activeStores, stores],
  );

  useEffect(() => {
    fetchCatalogStores()
      .then((list) => {
        setStores(list);
        setActiveStores((prev) => {
          const valid = prev.filter((id) => list.some((s) => s.id === id));
          if (valid.length) return valid;
          return list.map((s) => s.id);
        });
        setBrowseStore((prev) => (list.some((s) => s.id === prev) ? prev : list[0]?.id || "miswag"));
      })
      .catch(() => message.error("تعذّر تحميل قائمة المتاجر من الكتالوج"));
  }, []);

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
    if (browseStore) loadTree(browseStore);
  }, [browseStore, loadTree]);

  const loadCategoryProducts = useCallback(
    async (catId: string, page = 1, append = false) => {
      setLoadingProducts(true);
      try {
        const data = await listCategoryProducts(browseStore, catId, page);
        setProducts((prev) => (append ? [...prev, ...data.products] : data.products));
        setProductPage(data.page);
        setProductTotal(data.total || 0);
        setHasMore(data.hasMore);
        // أمازون captcha: تنبيه خفيف فقط إن لم تُعرض منتجات
        if (data.softBlocked && !(data.products || []).length && !append) {
          message.warning(data.message || "أمازون محدود مؤقتاً — جرّب بعد دقيقة أو متجراً آخر");
        }
      } catch (err) {
        const msg = errorMessage(err, "فشل تحميل المنتجات");
        if (/captcha|حظر|تهدئة/i.test(msg)) {
          message.warning("أمازون محدود مؤقتاً — جرّب بعد دقيقة أو استخدم مسواگ/الريان");
        } else {
          message.error(msg);
        }
      } finally {
        setLoadingProducts(false);
      }
    },
    [browseStore],
  );

  // تحميل أول قسم تلقائياً عند فتح المتجر
  useEffect(() => {
    if (!browseStore || !tree.length || selectedCategory) return;
    const preferred =
      browseStore === "miswag"
        ? tree.find((n) => n.id === "beauty") || tree[0]
        : browseStore === "amazon"
          ? tree.find((n) => n.id === "3760911") || tree[0]
          : tree.find((n) => /جميع|all/i.test(n.name)) || tree[0];
    if (!preferred?.id) return;
    // أمازون: ابدأ من جذر Beauty لعرض كل المنتجات المفهرسة (مثل «جميع المنتجات» في باقي المتاجر)
    setSelectedCategory(preferred.id);
    setCategoryPath(preferred.name);
    loadCategoryProducts(preferred.id, 1, false);
  }, [browseStore, tree, selectedCategory, loadCategoryProducts]);

  // أمازون: أظهر تقدّم ملء الفهرس المحلي (مثل باقي المتاجر بعد اكتمال الزحف)
  useEffect(() => {
    if (browseStore !== "amazon") {
      setAmazonCatalogHint("");
      return;
    }
    let cancelled = false;
    let lastCount = 0;
    const tick = async () => {
      try {
        const st = await fetchAmazonCrawlStatus();
        if (cancelled) return;
        const n = Number(st.productCount || 0);
        const count = n.toLocaleString("ar-IQ");
        if (st.running || st.status === "running") {
          const done = st.progress?.done || 0;
          const total = st.progress?.total || 0;
          setAmazonCatalogHint(`جاري ملء كتالوج أمازون… ${count} منتج${total ? ` · ${done}/${total}` : ""} — اضغط «تحميل المزيد» أو أعد اختيار القسم لرؤية الجديد`);
        } else if (n > 0) {
          setAmazonCatalogHint(`${count} منتج مفهرس من Amazon Beauty`);
        } else {
          setAmazonCatalogHint("البحث والتصفح يعملان مباشرة من Amazon — الفهرس المحلي يمتلئ تدريجياً");
        }
        // حدّث الشبكة مرة عند نمو الفهرس بشكل ملحوظ (صفحة 1 فقط)
        if (
          selectedCategory
          && !searching
          && productPage <= 1
          && n > lastCount + 40
        ) {
          lastCount = n;
          loadCategoryProducts(selectedCategory, 1, false);
        } else if (n > lastCount) {
          lastCount = n;
        }
      } catch {
        if (!cancelled) setAmazonCatalogHint("");
      }
    };
    tick();
    const id = window.setInterval(tick, 15_000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [browseStore, selectedCategory, searching, productPage, loadCategoryProducts]);

  const onSelectCategory = useCallback(
    (keys: React.Key[]) => {
      const id = String(keys[0] || "");
      if (!id) return;
      setSelectedCategory(id);
      setCategoryPath(findCategoryLabel(tree, id));
      setStep(0);
      setOptions([]);
      loadCategoryProducts(id, 1, false);
    },
    [loadCategoryProducts, tree],
  );

  const runTextSearch = useCallback(async () => {
    const q = searchText.trim();
    if (!q || !activeStores.length) return;
    setSearching(true);
    setOptions([]);
    setProducts([]);
    try {
      const useMulti = activeStores.length > 1;
      const data = await searchCatalogProducts(
        activeStores,
        q,
        1,
        30,
        useMulti ? "" : selectedCategory || "",
        (partial) => {
          // أظهر نتائج المتجر السريع فوراً (نجد) دون انتظار مسواگ
          const opts = partial.products.map((p) =>
            listProductToOption(
              p,
              stores.find((s) => s.id === p.store) || storeMeta,
            ),
          );
          setOptions(opts);
          if (opts.length) {
            setStep(1);
            // أوقف دوران الزر بعد أول نتائج — الدمج يستمر في الخلفية
            if (!partial.done) setSearching(false);
          }
        },
      );
      const opts = data.products.map((p) =>
        listProductToOption(
          p,
          stores.find((s) => s.id === p.store) || storeMeta,
        ),
      );
      setOptions(opts);

      const failed = (data.stores || []).filter((s) => s.error);
      if (failed.length) {
        const names = failed
          .map((f) => stores.find((s) => s.id === f.id)?.label || f.id)
          .join("، ");
        message.warning(`تعذّر البحث في: ${names}`);
      }

      if (!opts.length) message.info("لا توجد نتائج");
      else setStep(1);
    } catch (err) {
      message.error(errorMessage(err, "فشل البحث"));
    } finally {
      setSearching(false);
    }
  }, [searchText, activeStores, stores, storeMeta, selectedCategory]);

  const includesMiswag = activeStores.includes("miswag");
  const isMiswagBrowse = browseStore === "miswag";
  const codeLabel = "بحث بالباركود";

  const runCodeSearch = useCallback(async () => {
    const digits = barcode.replace(/\D/g, "");
    if (!digits) {
      message.warning("أدخل باركود EAN أو رقم مسواگ");
      return;
    }
    if (includesMiswag) {
      if (!isEanBarcode(digits) && !isMiswagInternalId(digits)) {
        message.warning("أدخل باركود EAN (8–14 رقم) أو رقم مسواگ الداخلي (10 أرقام)");
        return;
      }
    } else if (digits.length < 8) {
      message.warning("أدخل باركوداً صالحاً (8–14 رقم)");
      return;
    }
    setSearching(true);
    setOptions([]);
    try {
      const data = await searchCatalogByBarcode(digits, activeStores, (partial) => {
        setOptions(partial.options);
        if (partial.options.length) {
          setStep(1);
          if (!partial.done) setSearching(false);
        }
      });
      setOptions(data.options);

      const failed = (data.stores || []).filter((s) => s.error);
      if (failed.length) {
        const names = failed
          .map((f) => stores.find((s) => s.id === f.id)?.label || f.id)
          .join("، ");
        message.warning(`تعذّر البحث في: ${names}`);
      }

      if (!data.options.length) {
        message.info(isEanBarcode(digits) ? "لا توجد نتائج لهذا الباركود" : "لا توجد نتائج لهذا الرقم");
      } else {
        setStep(1);
      }
    } catch (err) {
      message.error(errorMessage(err, `فشل البحث ب${codeLabel}`));
    } finally {
      setSearching(false);
    }
  }, [barcode, activeStores, stores, includesMiswag, codeLabel]);

  const loadPreview = useCallback(
    async (opt: CatalogImportOption) => {
      setSelected(opt);
      setLoadingPreview(true);
      setPreview(null);
      try {
        let product;
        try {
          product = await fetchCatalogProduct(opt.store, opt.sourceId, opt.storeLabel);
        } catch (err) {
          // أمازون: البطاقة ظاهرة من البحث — ابنِ معاينة مؤقتة بدل «لم يُعثر»
          if (opt.store === "amazon" && opt.sourceId) {
            message.warning("تعذّر تحميل كامل تفاصيل أمازون — يمكنك إعادة المحاولة أو الاستيراد بالبيانات المتوفرة");
            product = {
              store: opt.store,
              storeLabel: opt.storeLabel,
              sourceId: opt.sourceId,
              nameAr: opt.nameAr || "",
              nameEn: opt.nameEn || "",
              brandAr: opt.brandAr || "",
              brandEn: "",
              descriptionAr: "",
              descriptionEn: "",
              barcode: opt.barcode || "",
              sku: opt.sourceId,
              images: opt.thumb ? [{ url: opt.thumb, isPrimary: true }] : [],
              shades: [],
              hasShades: (opt.shadeCount || 0) > 1,
              sourceUrl: "",
              priceHint: opt.price || "",
              categoryHint: opt.category || "",
            };
          } else {
            throw err;
          }
        }
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
        const shadeBarcode = s.barcode && !isMiswagInternalId(s.barcode) ? s.barcode : "";
        if (shadeBarcode) {
          const inv = await fetchInventoryByBarcode(shadeBarcode);
          if (inv) {
            price = inv.price;
            originalPrice = inv.originalPrice;
            discountPercent = inv.discountPercent;
            stock = inv.stock;
          }
        }

        shades.push({
          name: String(s.nameAr || s.nameEn || s.name || `درجة ${i + 1}`).trim(),
          colorHex,
          barcode: shadeBarcode || undefined,
          sku: s.sku || s.miswagId,
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
        (preview.barcode && !isMiswagInternalId(preview.barcode) ? preview.barcode : undefined) ||
        (selected?.barcode && !isMiswagInternalId(selected.barcode) ? selected.barcode : undefined);
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

  const displayOptions = options.length > 0 ? options : browseOptions;
  const isSearchMode = options.length > 0;
  const drawerOpen = step === 2 || loadingPreview;

  const selectStoreForBrowse = useCallback((id: string) => {
    setActiveStores((prev) => (prev.includes(id) ? prev : [...prev, id]));
    if (browseStore === id) return;
    setBrowseStore(id);
    setSelectedCategory(null);
    setCategoryPath("");
    setProducts([]);
    setOptions([]);
    setStep(0);
  }, [browseStore]);

  const closeImportDrawer = useCallback(() => {
    setStep(displayOptions.length ? 1 : 0);
    setSelected(null);
    setPreview(null);
  }, [displayOptions.length]);

  return (
    <div className="catalog-import-page alhayaa-page">
      <PageHeader
        title="الاستيراد من الكتالوج"
        subtitle="ابحث أو تصفّح من مسواگ ونجد والريان، ثم صنّف المنتج واستورده إلى متجرك بخطوة واحدة."
        extra={
          <Tag icon={<ShopOutlined />} color="purple">
            {stores.length || 3} متاجر متصلة
          </Tag>
        }
      />

      <div className="ci-progress">
        {[
          { title: "اكتشف", desc: "بحث أو تصفح الأقسام" },
          { title: "اختر", desc: "حدد المنتج المناسب" },
          { title: "استورد", desc: "التصنيف ثم الحفظ" },
        ].map((item, index) => {
          const state = step > index ? "is-done" : step === index ? "is-active" : "";
          return (
            <div key={item.title} className={`ci-progress-step ${state}`}>
              <span className="ci-progress-index">
                {step > index ? <CheckCircleFilled /> : index + 1}
              </span>
              <div className="ci-progress-copy">
                <strong>{item.title}</strong>
                <span>{item.desc}</span>
              </div>
            </div>
          );
        })}
      </div>

      <section className="ci-command">
        <div className="ci-command-top">
          <div>
            <h3 className="ci-command-title">مركز البحث والاستيراد</h3>
            <p className="ci-command-sub">
              اضغط شريحة المتجر لتفعيله في البحث وتصفح أقسامه. أمازون بيوتي يعمل بالبحث الحي حتى لو كان الفهرس المحلي فارغاً.
            </p>
          </div>
          <div className="ci-store-chips">
            {stores.map((store) => {
              const active = activeStores.includes(store.id);
              const browsing = browseStore === store.id;
              const color = storeColor(store.id);
              return (
                <button
                  key={store.id}
                  type="button"
                  className={`ci-store-chip${active ? " is-active" : ""}${browsing ? " is-browse" : ""}`}
                  style={active ? { background: color } : { color }}
                  onClick={() => selectStoreForBrowse(store.id)}
                  title={browsing ? "متجر التصفح الحالي" : "فتح تصفح هذا المتجر"}
                >
                  <span className="ci-store-dot" style={active ? undefined : { background: color }} />
                  {store.label}
                  {browsing ? " · تصفح" : ""}
                </button>
              );
            })}
          </div>
        </div>

        <div className="ci-search-grid">
          <div className="ci-search-field">
            <SearchOutlined />
            <Input
              placeholder="ابحث بالاسم أو الماركة..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onPressEnter={runTextSearch}
              allowClear
            />
          </div>
          <div className="ci-search-field">
            <BarcodeOutlined />
            <Input
              placeholder={includesMiswag ? "باركود EAN أو رقم مسواگ" : "باركود المنتج"}
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              onPressEnter={runCodeSearch}
              allowClear
            />
          </div>
          <div className="ci-search-actions">
            <Button type="primary" icon={<SearchOutlined />} loading={searching} onClick={runTextSearch}>
              بحث بالاسم
            </Button>
            <Button icon={<BarcodeOutlined />} loading={searching} onClick={runCodeSearch}>
              {codeLabel}
            </Button>
          </div>
        </div>

        <div className="ci-meta-row">
          <span className="ci-meta-pill">
            البحث في: <strong>{searchStoreLabels || "—"}</strong>
          </span>
          <span className="ci-meta-pill">
            التصفح من: <strong>{storeMeta.label}</strong>
          </span>
          {selectedCategory ? (
            <span className="ci-meta-pill">
              القسم: <strong>{categoryPath}</strong>
              {productTotal ? ` · ${productTotal.toLocaleString("ar-IQ")} منتج` : ""}
            </span>
          ) : null}
          {isSearchMode ? (
            <span className="ci-meta-pill">
              نتائج البحث: <strong>{displayOptions.length}</strong>
            </span>
          ) : null}
        </div>
      </section>

      <div className="ci-workspace">
        <aside className="ci-sidebar">
          <div className="ci-panel-head">
            <div>
              <h3>أقسام {storeMeta.label}</h3>
              <p>اختر قسماً لعرض منتجاته</p>
            </div>
            <Select
              className="ci-browse-select"
              size="small"
              value={browseStore}
              onChange={(id) => {
                const next = String(id || "");
                if (!next) return;
                setBrowseStore(next);
                setActiveStores((prev) => (prev.includes(next) ? prev : [...prev, next]));
              }}
              options={stores.map((s) => ({ value: s.id, label: s.label }))}
            />
          </div>
          <div className="ci-tree-wrap">
            {treeLoading ? (
              <div className="ci-center"><Spin /></div>
            ) : (
              <Tree
                key={browseStore}
                showLine
                selectable
                defaultExpandedKeys={isMiswagBrowse ? ["beauty"] : tree[0]?.id ? [tree[0].id] : []}
                selectedKeys={selectedCategory ? [selectedCategory] : []}
                onSelect={onSelectCategory}
                treeData={toTreeData(tree)}
                height={560}
              />
            )}
          </div>
        </aside>

        <section className="ci-main">
          <div className="ci-results-head">
            <div>
              <h3>
                {isSearchMode
                  ? `نتائج البحث (${displayOptions.length})`
                  : selectedCategory
                    ? `منتجات القسم (${displayOptions.length}${productTotal ? ` / ${productTotal.toLocaleString("ar-IQ")}` : ""})`
                    : "المنتجات"}
              </h3>
              <p>
                {isSearchMode
                  ? "النتائج تظهر تدريجياً من المتاجر الأسرع"
                  : amazonCatalogHint && browseStore === "amazon"
                    ? amazonCatalogHint
                    : "اختر منتجاً لفتح لوحة الاستيراد"}
              </p>
            </div>
            {isSearchMode ? (
              <Button
                onClick={() => {
                  setOptions([]);
                  setStep(0);
                  setSelected(null);
                  setPreview(null);
                }}
              >
                العودة للتصفح
              </Button>
            ) : null}
          </div>

          <div className="ci-results-body">
            {loadingProducts && !displayOptions.length ? (
              <div className="ci-center"><Spin size="large" /></div>
            ) : displayOptions.length ? (
              <>
                <div className="ci-product-grid">
                  {displayOptions.map((opt) => (
                    <CatalogOptionCard
                      key={catalogOptionKey(opt)}
                      option={opt}
                      selected={selected ? catalogOptionKey(selected) === catalogOptionKey(opt) : false}
                      onSelect={loadPreview}
                    />
                  ))}
                </div>
                {hasMore && selectedCategory && !isSearchMode ? (
                  <div className="ci-load-more">
                    <Button
                      loading={loadingProducts}
                      onClick={() => loadCategoryProducts(selectedCategory, productPage + 1, true)}
                    >
                      تحميل المزيد
                    </Button>
                  </div>
                ) : null}
              </>
            ) : (
              <div className="ci-empty">
                <div>
                  <strong>ابدأ من البحث أو الأقسام</strong>
                  <span>
                    اكتب اسم منتج، امسح باركوداً، أو اختر قسماً من الشجرة على اليمين لعرض المنتجات.
                  </span>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>

      <Drawer
        className="ci-drawer"
        open={drawerOpen}
        onClose={closeImportDrawer}
        width={560}
        destroyOnClose={false}
        title="تجهيز الاستيراد"
        closeIcon={<CloseOutlined />}
      >
        <div className="ci-drawer-content">
          {loadingPreview ? (
            <div className="ci-center"><Spin size="large" /></div>
          ) : preview ? (
            <>
              <div className="ci-drawer-hero">
                <div className="ci-drawer-hero-grid">
                  {preview.images[0]?.url ? (
                    <img
                      className="ci-drawer-image"
                      src={resolveCatalogImageUrl(preview.images[0].url)}
                      alt={preview.nameAr}
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="ci-drawer-image-ph"><AppstoreOutlined /></div>
                  )}
                  <div>
                    <h3 className="ci-drawer-title">{preview.nameAr}</h3>
                    {preview.nameEn && preview.nameEn !== preview.nameAr ? (
                      <p className="ci-drawer-sub alhayaa-ltr-input">{preview.nameEn}</p>
                    ) : null}
                    <div className="ci-drawer-tags">
                      {preview.storeLabel ? (
                        <Tag color={storeColor(preview.store || selected?.store || "")}>
                          {preview.storeLabel}
                        </Tag>
                      ) : null}
                      {preview.brandAr ? <Tag>{preview.brandAr}</Tag> : null}
                      {preview.brandEn && preview.brandEn !== preview.brandAr ? (
                        <Tag className="alhayaa-ltr-input">{preview.brandEn}</Tag>
                      ) : null}
                      {preview.priceHint ? <Tag color="green">{preview.priceHint}</Tag> : null}
                      {preview.categoryHint ? <Tag color="purple">{preview.categoryHint}</Tag> : null}
                    </div>
                  </div>
                </div>
              </div>

              {(preview.descriptionAr || preview.descriptionEn) && (
                <div className="ci-drawer-section">
                  <h4>الوصف</h4>
                  {preview.descriptionAr ? (
                    <div style={{ marginBottom: preview.descriptionEn ? 10 : 0 }}>
                      <Tag color="blue" style={{ marginBottom: 6 }}>عربي</Tag>
                      <p className="ci-desc">{preview.descriptionAr}</p>
                    </div>
                  ) : null}
                  {preview.descriptionEn && preview.descriptionEn !== preview.descriptionAr ? (
                    <div>
                      <Tag color="geekblue" style={{ marginBottom: 6 }}>English</Tag>
                      <p className="ci-desc alhayaa-ltr-input">{preview.descriptionEn}</p>
                    </div>
                  ) : null}
                </div>
              )}

              {preview.shades.length > 0 && (
                <div className="ci-drawer-section">
                  <h4>التدرجات ({preview.shades.length})</h4>
                  <div className="ci-shade-list">
                    {preview.shades.map((s, i) => (
                      <div key={i} className="ci-shade-item">
                        {s.colorHex ? (
                          <span className="ci-shade-swatch" style={{ background: s.colorHex }} />
                        ) : (
                          <span className="ci-shade-swatch" style={{ background: "#ddd" }} />
                        )}
                        <div>
                          <div>{s.nameAr || s.name}</div>
                          {s.nameEn && s.nameEn !== (s.nameAr || s.name) ? (
                            <small className="alhayaa-ltr-input">{s.nameEn}</small>
                          ) : null}
                          {s.barcode && !isMiswagInternalId(s.barcode) ? (
                            <small>باركود: {s.barcode}</small>
                          ) : null}
                          {(s.miswagId || (s.barcode && isMiswagInternalId(s.barcode))) ? (
                            <small>رقم مسواگ: {s.miswagId || s.barcode}</small>
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="ci-drawer-section">
                <h4>تصنيف المنتج في متجرك</h4>
                <Form form={form} layout="vertical">
                  <div className="ci-form-grid">
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
                    <Form.Item name="categoryId" label="القسم" rules={[{ required: true }]} className="span-2">
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
                  </div>
                </Form>
              </div>

              <div className="ci-drawer-actions">
                <Button onClick={closeImportDrawer}>إلغاء</Button>
                <Button
                  type="primary"
                  icon={<CloudDownloadOutlined />}
                  loading={importProduct.isPending}
                  onClick={() => importProduct.mutate()}
                >
                  استيراد المنتج
                </Button>
              </div>
            </>
          ) : (
            <div className="ci-empty" style={{ margin: 18, minHeight: 240 }}>
              <div>
                <strong>لا توجد معاينة</strong>
                <span>اختر منتجاً من الشبكة لفتح تفاصيل الاستيراد.</span>
              </div>
            </div>
          )}
        </div>
      </Drawer>
    </div>
  );
}
