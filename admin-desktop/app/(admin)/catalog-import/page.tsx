"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Button,
  Drawer,
  Form,
  Input,
  Select,
  Space,
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
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { CatalogOptionCard, storeColor } from "@/components/catalog-import/CatalogOptionCard";
import { matchCategoryFromHints } from "@/lib/catalogCategoryMatch";
import { matchBrandIdLocal, matchCatalogBrandRow, catalogBrandLogoUrl } from "@/lib/catalogBrandMatch";
import {
  catalogOptionKey,
  fetchCatalogBrands,
  fetchCatalogProductSmart,
  fetchCatalogStores,
  fetchCategoryTree,
  isMiswagInternalId,
  isEanBarcode,
  fetchAmazonCrawlStatus,
  listCategoryProducts,
  searchCatalogByBarcode,
  searchCatalogProducts,
  type CatalogBrandRow,
  type CatalogCategoryNode,
  type CatalogImportOption,
  type CatalogImportProduct,
  type CatalogListProduct,
  type CatalogStore,
} from "@/lib/catalogImport";
import { fetchInventoryByBarcode, lookupInventoryBarcodes, resolveBarcodeLookup, type BarcodeInventoryLookup } from "@/lib/inventorySync";
import { uploadCatalogImportImages } from "@/lib/uploadCatalogImages";
import { resolveCatalogImageUrl } from "@/lib/resolveCatalogImageUrl";
import { buildProductPayload } from "@/lib/productPayload";
import { resolveShadeColorHex } from "@/lib/shadeColorFromImage";
import { mutations, queries } from "@/lib/queries";
import "./catalog-import.css";

function errorMessage(err: unknown, fallback: string) {
  const e = err as {
    message?: string;
    response?: { status?: number; data?: { error?: unknown; message?: unknown } };
  };
  const apiErr = e?.response?.data?.error;
  if (typeof apiErr === "string" && apiErr.trim()) return apiErr.trim();
  if (typeof e?.response?.data?.message === "string") return e.response.data.message;
  if (e?.response?.status === 409) {
    return "تعارض في البيانات — قد يكون المنتج أو البراند أو الباركود مستخدماً مسبقاً";
  }
  if (typeof e?.message === "string" && e.message.includes("status code 409")) {
    return "تعارض في البيانات — قد يكون المنتج أو البراند أو الباركود مستخدماً مسبقاً";
  }
  if (typeof e?.message === "string" && e.message.trim()) return e.message;
  return fallback;
}

/** اختيار براند محلياً أو إنشاؤه عبر الـ API إن لم يوجد */
async function ensureBrandId(
  brands: any[] = [],
  brandAr = "",
  brandEn = "",
  catalogBrands: { brands?: CatalogBrandRow[] } = {},
): Promise<string | undefined> {
  const local = matchBrandIdLocal(brands, brandAr, brandEn);
  if (local) return local;
  if (!String(brandAr || "").trim() && !String(brandEn || "").trim()) return undefined;

  const catalogHit = matchCatalogBrandRow(catalogBrands.brands || [], brandAr, brandEn);
  const logoUrl = catalogBrandLogoUrl(catalogHit);

  try {
    const result = await mutations.resolveBrand({
      brandAr,
      brandEn,
      logoUrl,
      logoIsProductImage: catalogHit?.logoIsProductImage,
      createIfMissing: true,
    });
    return result?.brand?.id || result?.id;
  } catch (err) {
    const status = (err as { response?: { status?: number } })?.response?.status;
    if (status === 409 || status === 500) {
      const fresh = await queries.brands().catch(() => brands);
      const retry = matchBrandIdLocal(fresh, brandAr, brandEn);
      if (retry) return retry;
    }
    throw err;
  }
}

function stripHtml(html = "") {
  return String(html).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function formatIqd(n: number) {
  return `${Number(n || 0).toLocaleString("ar-IQ")} د.ع`;
}

function BarcodeInventoryMeta({
  lookup,
  compact = false,
}: {
  lookup: BarcodeInventoryLookup | null;
  compact?: boolean;
}) {
  if (!lookup) return null;

  return (
    <div className={`ci-inv-meta${compact ? " is-compact" : ""}`}>
      {lookup.pos ? (
        <>
          <Tag color="gold">POS: {formatIqd(lookup.pos.price)}</Tag>
          <Tag color="cyan">المخزون: {lookup.pos.stock.toLocaleString("ar-IQ")}</Tag>
          {lookup.pos.discountPercent > 0 ? (
            <Tag color="orange">خصم {lookup.pos.discountPercent}%</Tag>
          ) : null}
        </>
      ) : (
        <Tag>غير موجود في POS</Tag>
      )}
      {lookup.inApp ? (
        <Tag color="success" icon={<CheckCircleFilled />}>
          موجود في التطبيق{lookup.inApp.name ? `: ${lookup.inApp.name}` : ""}
        </Tag>
      ) : (
        <Tag color="default">غير مضاف للتطبيق</Tag>
      )}
    </div>
  );
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
    barcode: p.barcode,
    shadeCount: p.shadeCount,
    price: p.price,
    category: p.category,
    matchType: "browse",
  };
}

function mergeSearchOptions(
  prev: CatalogImportOption[],
  next: CatalogImportOption[],
): CatalogImportOption[] {
  const map = new Map<string, CatalogImportOption>();
  for (const opt of prev) map.set(catalogOptionKey(opt), opt);
  for (const opt of next) map.set(catalogOptionKey(opt), opt);
  return Array.from(map.values());
}

export default function CatalogImportPage() {
  const [stores, setStores] = useState<CatalogStore[]>([]);
  // البحث الافتراضي يشمل أمازون — النتائج تظهر تدريجياً من المتاجر الأسرع
  const [activeStores, setActiveStores] = useState<string[]>(["miswag", "najdalatheyah", "alkhabeer", "elryan", "faces", "miraaya", "beautyway", "khaton", "orisdi", "waheteter", "niceone", "amazon"]);
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
  const [searchStoreStats, setSearchStoreStats] = useState<
    { id: string; count: number; error?: string }[]
  >([]);

  const [selected, setSelected] = useState<CatalogImportOption | null>(null);
  const [preview, setPreview] = useState<CatalogImportProduct | null>(null);
  const [previewImageIdx, setPreviewImageIdx] = useState(0);
  const [barcodeLookup, setBarcodeLookup] = useState<Record<string, BarcodeInventoryLookup>>({});
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [step, setStep] = useState(0);
  const [form] = Form.useForm();
  const qc = useQueryClient();
  const previewLoadIdRef = useRef(0);
  /** يمنع إعادة الخطوة إلى «اختر» أثناء فتح تفاصيل منتج (نتائج بحث متدفقة) */
  const previewLockedRef = useRef(false);

  const bumpChooseStep = useCallback(() => {
    if (!previewLockedRef.current) setStep(1);
  }, []);

  const { data: categoriesData = [] } = useQuery({ queryKey: ["categories"], queryFn: queries.categories });
  const { data: brandsData = [] } = useQuery({ queryKey: ["brands"], queryFn: queries.brands });
  const { data: catalogBrandsData = { brands: [] } } = useQuery({
    queryKey: ["catalog-brands"],
    queryFn: () => fetchCatalogBrands(false),
    staleTime: 15 * 60 * 1000,
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

  useEffect(() => {
    if (!preview) {
      setBarcodeLookup({});
      return;
    }

    const codes: string[] = [];
    const add = (bc?: string) => {
      if (bc && !isMiswagInternalId(bc)) codes.push(bc);
    };
    add(preview.barcode);
    add(selected?.barcode);
    for (const shade of preview.shades || []) add(shade.barcode);

    if (!codes.length) {
      setBarcodeLookup({});
      return;
    }

    let cancelled = false;
    lookupInventoryBarcodes(codes)
      .then((items) => {
        if (!cancelled) setBarcodeLookup(items);
      })
      .catch(() => {
        if (!cancelled) setBarcodeLookup({});
      });

    return () => {
      cancelled = true;
    };
  }, [preview, selected?.barcode]);

  const previewMainBarcode = useMemo(() => {
    if (!preview) return "";
    return (
      (preview.barcode && !isMiswagInternalId(preview.barcode) ? preview.barcode : "") ||
      (selected?.barcode && !isMiswagInternalId(selected.barcode) ? selected.barcode : "")
    );
  }, [preview, selected?.barcode]);

  const previewMainLookup = useMemo(
    () => (previewMainBarcode ? resolveBarcodeLookup(previewMainBarcode, barcodeLookup) : null),
    [previewMainBarcode, barcodeLookup],
  );

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
          ? tree.find((n) => n.id === "all") || tree.find((n) => /جميع|all/i.test(n.name)) || tree[0]
          : tree.find((n) => /جميع|all/i.test(n.name)) || tree[0];
    if (!preferred?.id) return;
    // أمازون: ابدأ من جميع الأقسام لعرض كل المنتجات المفهرسة
    setSelectedCategory(preferred.id);
    setCategoryPath(preferred.name);
    loadCategoryProducts(preferred.id, 1, false);
  }, [browseStore, tree, selectedCategory, loadCategoryProducts]);

  useEffect(() => {
    setPreviewImageIdx(0);
  }, [preview?.sourceId, preview?.store]);

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
          setAmazonCatalogHint(`${count} منتج مفهرس من أمازون`);
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

    // باركود EAN أو ASIN أمازون — مسار البحث الدقيق
    const normalized = q.replace(/[\s-]/g, "");
    const digitsOnly = q.replace(/\D/g, "");
    const asin = /^[A-Z0-9]{10}$/i.test(normalized) ? normalized.toUpperCase() : "";
    if ((digitsOnly.length >= 8 && digitsOnly === normalized) || asin) {
      const lookup = asin || digitsOnly;
      setBarcode(lookup);
      setSearching(true);
      setOptions([]);
      setProducts([]);
      setSearchStoreStats([]);
      try {
        const data = await searchCatalogByBarcode(lookup, activeStores, (partial) => {
          setOptions((prev) => mergeSearchOptions(prev, partial.options));
          setSearchStoreStats(partial.stores || []);
          if (partial.options.length) {
            bumpChooseStep();
            if (!partial.done) setSearching(false);
          }
        });
        setOptions(data.options);
        setSearchStoreStats(data.stores || []);

        const failed = (data.stores || []).filter((s) => s.error);
        if (failed.length) {
          const names = failed
            .map((f) => stores.find((s) => s.id === f.id)?.label || f.id)
            .join("، ");
          message.warning(`تعذّر البحث في: ${names}`);
        }

        if (!data.options.length) message.info("لا توجد نتائج لهذا الباركود");
        else bumpChooseStep();
      } catch (err) {
        message.error(errorMessage(err, "فشل البحث بالباركود"));
      } finally {
        setSearching(false);
      }
      return;
    }

    setSearching(true);
    setOptions([]);
    setProducts([]);
    setSearchStoreStats([]);
    try {
      // بحث عام دائماً — لا نقيّد بقسم التصفح حتى لا تُخفى منتجات موجودة
      const data = await searchCatalogProducts(
        activeStores,
        q,
        1,
        40,
        "",
        (partial) => {
          setSearchStoreStats(partial.stores || []);
          const opts = partial.products.map((p) =>
            listProductToOption(
              p,
              stores.find((s) => s.id === p.store) || storeMeta,
            ),
          );
          setOptions((prev) => mergeSearchOptions(prev, opts));
          if (opts.length) {
            bumpChooseStep();
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
      setSearchStoreStats(data.stores || []);

      const failed = (data.stores || []).filter((s) => s.error);
      if (failed.length) {
        const names = failed
          .map((f) => stores.find((s) => s.id === f.id)?.label || f.id)
          .join("، ");
        message.warning(`تعذّر البحث في: ${names}`);
      }

      if (!opts.length) message.info("لا توجد نتائج");
      else bumpChooseStep();
    } catch (err) {
      message.error(errorMessage(err, "فشل البحث"));
    } finally {
      setSearching(false);
    }
  }, [searchText, activeStores, stores, storeMeta, bumpChooseStep]);

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
        message.warning("أدخل باركود EAN (8–14 رقم) أو رقم مسواگ (يبدأ بـ 17)");
        return;
      }
    } else if (digits.length < 8) {
      message.warning("أدخل باركوداً صالحاً (8–14 رقم)");
      return;
    }
    setSearching(true);
    setOptions([]);
    setSearchStoreStats([]);
    try {
      const data = await searchCatalogByBarcode(digits, activeStores, (partial) => {
        setOptions((prev) => mergeSearchOptions(prev, partial.options));
        setSearchStoreStats(partial.stores || []);
        if (partial.options.length) {
          bumpChooseStep();
          if (!partial.done) setSearching(false);
        }
      });
      setOptions(data.options);
      setSearchStoreStats(data.stores || []);

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
        bumpChooseStep();
      }
    } catch (err) {
      message.error(errorMessage(err, `فشل البحث ب${codeLabel}`));
    } finally {
      setSearching(false);
    }
  }, [barcode, activeStores, stores, includesMiswag, codeLabel, bumpChooseStep]);

  const loadPreview = useCallback(
    async (opt: CatalogImportOption) => {
      const loadId = ++previewLoadIdRef.current;
      const isStale = () => loadId !== previewLoadIdRef.current;

      previewLockedRef.current = true;
      setSelected(opt);
      setLoadingPreview(true);
      setStep(2);

      const sameProduct =
        selected?.store === opt.store && String(selected?.sourceId) === String(opt.sourceId);
      if (!sameProduct) {
        setPreview(null);
      }

      try {
        let product: CatalogImportProduct;
        try {
          // أمازون: light أولاً (التدرجات تظهر فوراً) ثم full (الباركودات)
          product = await fetchCatalogProductSmart(
            opt.store,
            opt.sourceId,
            opt.storeLabel,
            (partial) => {
              if (isStale()) return;
              if (partial.shades?.length || partial.nameAr) {
                setPreview(partial);
              }
            },
            {
              listingAsin: opt.listingAsin,
              expectedShadeCount: opt.shadeCount,
            },
          );
        } catch (err) {
          // أمازون: البطاقة ظاهرة من البحث — ابنِ معاينة مؤقتة بدل «لم يُعثر»
          if (opt.store === "amazon" && opt.sourceId) {
            message.warning("تعذّر تحميل كامل تفاصيل أمازون — أعد النقر بعد لحظات");
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

        if (isStale()) return;
        setPreview(product);

        const [allSubcategories, allTertiary] = await Promise.all([
          qc.fetchQuery({ queryKey: ["subcategories", "all"], queryFn: () => queries.subcategories() }),
          qc.fetchQuery({ queryKey: ["tertiary-sections", "all"], queryFn: () => queries.tertiarySections() }),
        ]);

        if (isStale()) return;

        const catMatch = matchCategoryFromHints(
          categoriesData,
          allSubcategories || [],
          allTertiary || [],
          product.categoryHint || "",
          "",
        );

        let brandId: string | undefined;
        try {
          brandId = await ensureBrandId(brandsData, product.brandAr, product.brandEn, catalogBrandsData);
          if (brandId) {
            void qc.fetchQuery({ queryKey: ["brands"], queryFn: queries.brands });
          }
        } catch (brandErr) {
          if (!isStale()) {
            message.warning(
              errorMessage(brandErr, "تعذّر مطابقة البراند تلقائياً — اختره يدوياً من القائمة"),
            );
          }
        }

        if (isStale()) return;
        form.setFieldsValue({
          brandId,
          categoryId: catMatch.categoryId,
          subcategoryId: catMatch.subcategoryId,
          tertiaryCategoryId: catMatch.tertiaryCategoryId,
        });

        if (opt.store === "amazon" && product.shades?.length) {
          // استخرج ألوان السواتش على دفعات — لا تُبقي القائمة على تدرج واحد أثناء الانتظار
          const withHex = product.shades.map((s) => ({ ...s }));
          const batchSize = 8;
          for (let i = 0; i < withHex.length; i += batchSize) {
            if (isStale()) break;
            const resolved = await Promise.all(
              withHex.slice(i, i + batchSize).map(async (s) => ({
                ...s,
                colorHex: s.colorHex || (await resolveShadeColorHex(s)) || "",
              })),
            );
            for (let j = 0; j < resolved.length; j += 1) {
              withHex[i + j] = resolved[j];
            }
            if (!isStale()) {
              setPreview((prev) => (prev ? { ...prev, shades: [...withHex] } : prev));
            }
          }
        }
      } catch (err) {
        if (!isStale()) {
          message.error(errorMessage(err, "فشل جلب تفاصيل المنتج"));
          previewLockedRef.current = false;
          setStep(options.length > 0 || products.length > 0 ? 1 : 0);
          setPreview(null);
          setSelected(null);
        }
      } finally {
        if (!isStale()) setLoadingPreview(false);
      }
    },
    [brandsData, catalogBrandsData, categoriesData, form, options.length, products.length, qc, selected],
  );

  const importProduct = useMutation({
    mutationFn: async () => {
      if (!preview) throw new Error("لا يوجد منتج للاستيراد");
      const values = await form.validateFields();

      // تأكيد البراند قبل الإنشاء — إنشاء تلقائي إن لم يكن موجوداً
      let brandId = values.brandId as string | undefined;
      if (!brandId && (preview.brandAr || preview.brandEn)) {
        brandId = await ensureBrandId(brandsData, preview.brandAr, preview.brandEn, catalogBrandsData);
        if (brandId) {
          await qc.fetchQuery({ queryKey: ["brands"], queryFn: queries.brands });
          form.setFieldsValue({ brandId });
        }
      }
      if (!brandId) throw new Error("تعذّر تحديد البراند — أضفه يدوياً أو اختر برانداً من القائمة");

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

        const shadeNumber = String(s.shadeNumber || s.shadeCode || s.nameEn || s.name || "").trim();
        shades.push({
          name: shadeNumber || `درجة ${i + 1}`,
          colorHex,
          barcode: shadeBarcode || undefined,
          sku: s.sku || s.miswagId,
          imageId,
          price,
          originalPrice,
          discountPercent,
          stock,
          position: Number.isFinite(Number(s.position)) ? Number(s.position) : i,
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
          brandId,
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
      previewLockedRef.current = false;
      setStep(0);
      setBarcode("");
      setSearchText("");
      setOptions([]);
      setSelected(null);
      setPreview(null);
      setBarcodeLookup({});
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
  const drawerOpen = step >= 2 || loadingPreview || Boolean(preview);

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
    previewLoadIdRef.current += 1;
    previewLockedRef.current = false;
    setStep(displayOptions.length ? 1 : 0);
    setSelected(null);
    setPreview(null);
    setLoadingPreview(false);
    setBarcodeLookup({});
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
              اضغط شريحة المتجر لتفعيله في البحث وتصفح أقسامه. أمازون يعمل بالبحث الحي في كل الأقسام حتى لو كان الفهرس المحلي فارغاً.
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
          {isSearchMode && searchStoreStats.length ? (
            <span className="ci-meta-pill">
              حسب المتجر:{" "}
              {searchStoreStats.map((s) => {
                const label = stores.find((st) => st.id === s.id)?.label || s.id;
                const text = s.error ? `${label}: خطأ` : `${label}: ${s.count}`;
                return <strong key={s.id} style={{ marginInlineStart: 8 }}>{text}</strong>;
              })}
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
            <div className="ci-panel-actions">
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
                  previewLockedRef.current = false;
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
          {loadingPreview && !preview ? (
            <div className="ci-center"><Spin size="large" /></div>
          ) : preview ? (
            <>
              {loadingPreview ? (
                <div className="ci-drawer-loading-hint">
                  <Spin size="small" /> جاري تحديث التفاصيل...
                </div>
              ) : null}
              <div className="ci-drawer-hero">
                <div className="ci-drawer-hero-grid">
                  {(() => {
                    const gallery = (preview.images || []).filter((img) => img?.url);
                    const heroUrl = gallery[previewImageIdx]?.url || gallery[0]?.url;
                    return heroUrl ? (
                      <img
                        className="ci-drawer-image"
                        src={resolveCatalogImageUrl(heroUrl)}
                        alt={preview.nameAr}
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="ci-drawer-image-ph"><AppstoreOutlined /></div>
                    );
                  })()}
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
                      {preview.barcode && !isMiswagInternalId(preview.barcode) ? (
                        <Tag color="blue" className="alhayaa-ltr-input">EAN: {preview.barcode}</Tag>
                      ) : null}
                      {preview.categoryHint ? <Tag color="purple">{preview.categoryHint}</Tag> : null}
                    </div>
                    {previewMainBarcode ? (
                      <BarcodeInventoryMeta lookup={previewMainLookup} />
                    ) : null}
                  </div>
                </div>
                {(preview.images || []).filter((img) => img?.url).length > 1 ? (
                  <div className="ci-drawer-gallery">
                    {(preview.images || []).filter((img) => img?.url).map((img, i) => (
                      <button
                        key={`${img.url}-${i}`}
                        type="button"
                        className={`ci-drawer-gallery-thumb${i === previewImageIdx ? " is-active" : ""}`}
                        onClick={() => setPreviewImageIdx(i)}
                        aria-label={`صورة ${i + 1}`}
                      >
                        <img
                          src={resolveCatalogImageUrl(img.url)}
                          alt=""
                          referrerPolicy="no-referrer"
                        />
                      </button>
                    ))}
                  </div>
                ) : null}
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
                  <h4>
                    التدرجات ({preview.shades.length})
                    {loadingPreview && (selected?.shadeCount || 0) > preview.shades.length ? (
                      <span style={{ marginInlineStart: 8, fontWeight: 400, fontSize: 13 }}>
                        / {selected?.shadeCount} جاري التحميل...
                      </span>
                    ) : null}
                  </h4>
                  <div className="ci-shade-list" style={{ maxHeight: 360, overflowY: "auto" }}>
                    {preview.shades.map((s, i) => {
                      const swatch = resolveCatalogImageUrl(s.swatchUrl || s.imageUrl || "");
                      const shadeBarcode = s.barcode && !isMiswagInternalId(s.barcode) ? s.barcode : "";
                      const shadeLookup = shadeBarcode
                        ? resolveBarcodeLookup(shadeBarcode, barcodeLookup)
                        : null;
                      return (
                        <div key={i} className="ci-shade-item">
                          {swatch ? (
                            <img
                              className="ci-shade-swatch-img"
                              src={swatch}
                              alt={s.nameAr || s.name || ""}
                              referrerPolicy="no-referrer"
                            />
                          ) : s.colorHex ? (
                            <span className="ci-shade-swatch" style={{ background: s.colorHex }} />
                          ) : (
                            <span className="ci-shade-swatch" style={{ background: "#ddd" }} />
                          )}
                          <div>
                            <div>
                              {s.shadeNumber || s.nameEn || s.name || `درجة ${i + 1}`}
                            </div>
                            {s.shadeTitleEn ? (
                              <small className="alhayaa-ltr-input">{s.shadeTitleEn}</small>
                            ) : null}
                            {s.shadeTitleAr && s.shadeTitleAr !== s.shadeTitleEn ? (
                              <small>{s.shadeTitleAr}</small>
                            ) : null}
                            {s.barcode && !isMiswagInternalId(s.barcode) ? (
                              <small>باركود: {s.barcode}</small>
                            ) : null}
                            {shadeBarcode ? <BarcodeInventoryMeta lookup={shadeLookup} compact /> : null}
                            {s.sku && !/^\d{8,14}$/.test(s.sku) ? (
                              <small className="alhayaa-ltr-input">ASIN: {s.sku}</small>
                            ) : null}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="ci-drawer-section">
                <h4>تصنيف المنتج في متجرك</h4>
                <Form form={form} layout="vertical">
                  <div className="ci-form-grid">
                    <Form.Item
                      name="brandId"
                      label="البراند"
                      rules={[{ required: true, message: "البراند مطلوب" }]}
                      extra="يُختار تلقائياً من الكتالوج ويُنشأ إن لم يكن موجوداً"
                    >
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
                    <Form.Item name="categoryId" label="القسم" className="span-2">
                      <Select
                        allowClear
                        showSearch
                        optionFilterProp="label"
                        placeholder="بدون تصنيف (اختياري)"
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
