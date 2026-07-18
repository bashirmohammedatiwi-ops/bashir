"use client";

import dynamic from "next/dynamic";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AppstoreOutlined,
  CloudDownloadOutlined,
  PlusOutlined,
  SearchOutlined,
  UnorderedListOutlined,
} from "@ant-design/icons";
import {
  Button,
  Empty,
  Form,
  Input,
  Popconfirm,
  Select,
  Segmented,
  Space,
  Switch,
  Table,
  Tag,
  Tooltip,
  message,
} from "antd";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { ImageItem } from "@/components/ProductImageDropzone";
import { PageHeader } from "@/components/PageHeader";
import { ProductThumb } from "@/components/ProductThumb";
import { initShadePreviews, shadeFromApi } from "@/components/ProductShadesEditor";
import { imagesFromProduct } from "@/lib/productFormHelpers";
import { buildProductPayload } from "@/lib/productPayload";
import { displayProductName } from "@/lib/productName";
import { mutations, queries } from "@/lib/queries";
import { useBarcodeInventorySync } from "@/hooks/useBarcodeInventorySync";
import "./products-page.css";

const ProductFormDrawer = dynamic(
  () =>
    import("@/components/products/ProductFormDrawer").then((m) => ({
      default: m.ProductFormDrawer,
    })),
  { ssr: false },
);

type ViewMode = "table" | "grid";
type ActiveFilter = "all" | "active" | "inactive";

export default function ProductsPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(24);
  const [search, setSearch] = useState("");
  const [searchDraft, setSearchDraft] = useState("");
  const [filterCategoryId, setFilterCategoryId] = useState<string | undefined>();
  const [filterSubcategoryId, setFilterSubcategoryId] = useState<string | undefined>();
  const [filterTertiaryCategoryId, setFilterTertiaryCategoryId] = useState<string | undefined>();
  const [filterConcernId, setFilterConcernId] = useState<string | undefined>();
  const [filterBrandId, setFilterBrandId] = useState<string | undefined>();
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [editing, setEditing] = useState<any | null>(null);
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("basic");
  const [productImages, setProductImages] = useState<ImageItem[]>([]);
  const [shadePreviews, setShadePreviews] = useState<Record<number, ImageItem | null>>({});
  const [form] = Form.useForm();
  const qc = useQueryClient();
  const {
    hasSyncData,
    syncLoading,
    shadeSyncLoading,
    syncMeta,
    applyBarcode,
    applyShadeBarcode,
    refreshPricing,
    resetSync,
  } = useBarcodeInventorySync(form);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: [
      "products",
      page,
      pageSize,
      search,
      filterCategoryId,
      filterSubcategoryId,
      filterTertiaryCategoryId,
      filterConcernId,
      filterBrandId,
    ],
    queryFn: () =>
      queries.products({
        page,
        limit: pageSize,
        search,
        categoryId: filterCategoryId,
        subcategoryId: filterSubcategoryId,
        tertiaryCategoryId: filterTertiaryCategoryId,
        concernId: filterConcernId,
        brandId: filterBrandId,
      }),
    staleTime: 3 * 60_000,
  });

  const { data: categoriesData } = useQuery({
    queryKey: ["categories"],
    queryFn: queries.categories,
    staleTime: 5 * 60_000,
  });
  const { data: brandsData } = useQuery({
    queryKey: ["brands"],
    queryFn: queries.brands,
    staleTime: 5 * 60_000,
  });
  const { data: skinConcernsData } = useQuery({
    queryKey: ["skin-concerns"],
    queryFn: () => queries.skinConcerns(true),
    staleTime: 5 * 60_000,
  });

  const remove = useMutation({
    mutationFn: mutations.deleteProduct,
    onSuccess: () => {
      message.success("تم الحذف");
      qc.invalidateQueries({ queryKey: ["products"] });
    },
  });

  const toggleActive = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      mutations.updateProduct(id, { isActive }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products"] });
    },
    onError: () => message.error("تعذّر تحديث حالة المنتج"),
  });

  const upsert = useMutation({
    mutationFn: async (values: any) => {
      const payload = buildProductPayload(values, productImages);
      if (editing?.id) return mutations.updateProduct(editing.id, payload);
      return mutations.createProduct(payload);
    },
    onSuccess: () => {
      message.success(editing?.id ? "تم تعديل المنتج" : "تم إنشاء المنتج");
      setOpen(false);
      setEditing(null);
      qc.invalidateQueries({ queryKey: ["products"] });
    },
  });

  const openCreate = useCallback(() => {
    setEditing(null);
    setActiveTab("basic");
    setProductImages([]);
    setShadePreviews({});
    resetSync();
    form.resetFields();
    form.setFieldsValue({
      isActive: true,
      price: 0,
      stock: 0,
      originalPrice: 0,
      discountPercent: 0,
      pointsEarned: 0,
      rating: 0,
      shades: [],
      variants: [],
      skinType: [],
      concernIds: [],
      subcategoryIds: [],
      tertiaryCategoryIds: [],
    });
    setOpen(true);
  }, [form, resetSync]);

  const openEdit = useCallback(
    async (row: any) => {
      setEditing(row);
      setActiveTab("basic");
      resetSync();
      let full = row;
      try {
        full = (await queries.product(row.id)) ?? row;
      } catch {
        /* use row */
      }
      setProductImages(imagesFromProduct(full));
      setShadePreviews(initShadePreviews(full?.shades));
      form.setFieldsValue({
        ...full,
        nameAr: full?.nameAr ?? full?.name ?? "",
        nameEn: full?.nameEn ?? "",
        descriptionAr: full?.descriptionAr ?? full?.description ?? "",
        descriptionEn: full?.descriptionEn ?? "",
        brandId: full?.brand?.id ?? full?.brandId,
        categoryId: full?.category?.id ?? full?.categoryId,
        subcategoryIds: Array.isArray(full?.subcategoryIds) && full.subcategoryIds.length
          ? full.subcategoryIds
          : (full?.subcategory?.id ?? full?.subcategoryId)
            ? [full?.subcategory?.id ?? full?.subcategoryId]
            : [],
        tertiaryCategoryIds: Array.isArray(full?.tertiaryCategoryIds) && full.tertiaryCategoryIds.length
          ? full.tertiaryCategoryIds
          : (full?.tertiaryCategory?.id ?? full?.tertiaryCategoryId)
            ? [full?.tertiaryCategory?.id ?? full?.tertiaryCategoryId]
            : [],
        tags: Array.isArray(full?.tags)
          ? full.tags.join(", ")
          : typeof full?.tags === "string"
            ? (() => {
                try {
                  return JSON.parse(full.tags).join(", ");
                } catch {
                  return full.tags;
                }
              })()
            : "",
        skinType: Array.isArray(full?.skinType)
          ? full.skinType
          : typeof full?.skinType === "string"
            ? (() => {
                try {
                  return JSON.parse(full.skinType);
                } catch {
                  return [];
                }
              })()
            : [],
        concernIds: full?.concernIds ?? full?.skinConcerns?.map((c: any) => c.id) ?? [],
        shades: (full?.shades ?? []).map(shadeFromApi),
        variants: full?.variants ?? [],
      });
      setOpen(true);
      window.setTimeout(() => void applyBarcode(), 0);
    },
    [form, resetSync, applyBarcode],
  );

  useEffect(() => {
    if (!open) return;
    const tick = () => void refreshPricing();
    tick();
    const id = window.setInterval(tick, 15_000);
    return () => window.clearInterval(id);
  }, [open, refreshPricing]);

  useEffect(() => {
    if (!open) {
      setEditing(null);
      setProductImages([]);
      setShadePreviews({});
      form.resetFields();
    }
  }, [open, form]);

  const rawItems = data?.data ?? [];
  const total = data?.meta?.total ?? 0;

  const items = useMemo(() => {
    if (activeFilter === "all") return rawItems;
    if (activeFilter === "active") return rawItems.filter((p: any) => p.isActive);
    return rawItems.filter((p: any) => !p.isActive);
  }, [rawItems, activeFilter]);

  const stats = useMemo(() => {
    const active = rawItems.filter((p: any) => p.isActive).length;
    const lowStock = rawItems.filter((p: any) => Number(p.stock ?? 0) <= 5).length;
    return { active, lowStock, pageCount: rawItems.length };
  }, [rawItems]);

  const { data: filterSubcategories } = useQuery({
    queryKey: ["subcategories", filterCategoryId],
    queryFn: () => queries.subcategories({ parentId: filterCategoryId }),
    enabled: !!filterCategoryId,
  });
  const { data: filterTertiarySections } = useQuery({
    queryKey: ["tertiary-sections", filterSubcategoryId],
    queryFn: () => queries.tertiarySections({ parentId: filterSubcategoryId }),
    enabled: !!filterSubcategoryId,
  });

  const selectedCategoryId = Form.useWatch("categoryId", form);
  const watchedSubcategoryIds = Form.useWatch("subcategoryIds", form);
  const selectedSubcategoryIds = useMemo<string[]>(
    () => (Array.isArray(watchedSubcategoryIds) ? watchedSubcategoryIds.filter(Boolean) : []),
    [watchedSubcategoryIds],
  );
  const { data: formSubcategories } = useQuery({
    queryKey: ["subcategories", selectedCategoryId],
    queryFn: () => queries.subcategories({ parentId: selectedCategoryId }),
    enabled: !!selectedCategoryId,
  });
  // أقسام ثانوية لكل قسم فرعي مختار (مجموعات)
  const subIdsKey = useMemo(() => [...selectedSubcategoryIds].sort().join(","), [selectedSubcategoryIds]);
  const { data: formTertiaryGroups } = useQuery({
    queryKey: ["tertiary-sections-multi", subIdsKey],
    queryFn: async () =>
      Promise.all(
        selectedSubcategoryIds.map(async (id) => ({
          id,
          items: (await queries.tertiarySections({ parentId: id })) ?? [],
        })),
      ),
    enabled: selectedSubcategoryIds.length > 0,
  });

  const subcategoryOptions = useMemo(
    () => (formSubcategories ?? []).map((s: any) => ({ value: s.id, label: s.name })),
    [formSubcategories],
  );
  const tertiaryCategoryOptions = useMemo(() => {
    const nameById = new Map((formSubcategories ?? []).map((s: any) => [s.id, s.name]));
    return (formTertiaryGroups ?? [])
      .filter((g: any) => g.items.length > 0)
      .map((g: any) => ({
        label: String(nameById.get(g.id) ?? "قسم فرعي"),
        options: g.items.map((t: any) => ({ value: t.id, label: t.name })),
      }));
  }, [formTertiaryGroups, formSubcategories]);

  // إزالة الأقسام الثانوية التي لم يعد قسمها الفرعي مختاراً
  useEffect(() => {
    if (!open) return;
    const current: string[] = form.getFieldValue("tertiaryCategoryIds") ?? [];
    if (!current.length) return;
    if (selectedSubcategoryIds.length === 0) {
      form.setFieldValue("tertiaryCategoryIds", []);
      return;
    }
    if (!formTertiaryGroups) return; // لا نحذف أثناء التحميل
    const valid = new Set(
      formTertiaryGroups.flatMap((g: any) => g.items.map((t: any) => t.id)),
    );
    const pruned = current.filter((id) => valid.has(id));
    if (pruned.length !== current.length) {
      form.setFieldValue("tertiaryCategoryIds", pruned);
    }
  }, [open, form, formTertiaryGroups, selectedSubcategoryIds]);

  const resetFilters = () => {
    setPage(1);
    setSearch("");
    setSearchDraft("");
    setFilterCategoryId(undefined);
    setFilterSubcategoryId(undefined);
    setFilterTertiaryCategoryId(undefined);
    setFilterConcernId(undefined);
    setFilterBrandId(undefined);
    setActiveFilter("all");
  };

  const columns = useMemo(
    () => [
      {
        title: "المنتج",
        key: "product",
        render: (_: unknown, r: any) => (
          <div className="alhayaa-product-cell">
            <ProductThumb product={r} size={56} />
            <div className="alhayaa-product-cell-text">
              <button type="button" className="alhayaa-product-name" onClick={() => openEdit(r)}>
                {displayProductName(r)}
              </button>
              {r.nameAr && r.nameEn ? (
                <span className="alhayaa-product-sku alhayaa-ltr-input">{r.nameEn}</span>
              ) : null}
              <span className="alhayaa-product-sku">{r.sku ?? "—"}</span>
            </div>
          </div>
        ),
      },
      {
        title: "البراند",
        width: 120,
        render: (_: unknown, r: any) => (
          <Tag className="alhayaa-tag-soft">{r.brand?.name ?? "—"}</Tag>
        ),
      },
      {
        title: "القسم",
        width: 160,
        render: (_: unknown, r: any) => (
          <div className="alhayaa-tags-stack">
            <Tag>{r.category?.name ?? "—"}</Tag>
            {r.subcategory?.name ? <Tag color="blue">{r.subcategory.name}</Tag> : null}
            {r.tertiaryCategory?.name ? <Tag color="cyan">{r.tertiaryCategory.name}</Tag> : null}
          </div>
        ),
      },
      {
        title: "السعر",
        dataIndex: "price",
        width: 120,
        render: (v: number, r: any) => (
          <div className="alhayaa-price-cell">
            <strong>{Number(v || 0).toLocaleString("ar-IQ")} د.ع</strong>
            {r.discountPercent > 0 ? (
              <Tag color="red" className="alhayaa-tag-mini">
                -{r.discountPercent}%
              </Tag>
            ) : null}
          </div>
        ),
      },
      {
        title: "المخزون",
        dataIndex: "stock",
        width: 90,
        render: (v: number) => (
          <span className={`alhayaa-stock${v <= 5 ? " low" : ""}`}>{v ?? 0}</span>
        ),
      },
      {
        title: "ألوان",
        width: 70,
        render: (_: unknown, r: any) => r._count?.shades ?? r.shades?.length ?? 0,
      },
      {
        title: "نشط",
        dataIndex: "isActive",
        width: 80,
        render: (v: boolean, r: any) => (
          <Switch
            checked={v}
            size="small"
            loading={toggleActive.isPending}
            onChange={(checked) => toggleActive.mutate({ id: r.id, isActive: checked })}
          />
        ),
      },
      {
        title: "إجراءات",
        key: "actions",
        width: 160,
        fixed: "right" as const,
        render: (_: unknown, r: any) => (
          <Space size={4}>
            <Button size="small" type="primary" ghost onClick={() => openEdit(r)}>
              تعديل
            </Button>
            <Popconfirm
              title="حذف المنتج؟"
              description="لا يمكن التراجع عن هذا الإجراء"
              onConfirm={() => remove.mutate(r.id)}
              okText="حذف"
              cancelText="إلغاء"
            >
              <Button danger size="small">
                حذف
              </Button>
            </Popconfirm>
          </Space>
        ),
      },
    ],
    [openEdit, remove, toggleActive],
  );

  return (
    <div className="alhayaa-page products-page">
      <PageHeader
        title="المنتجات"
        subtitle={`${total.toLocaleString("ar-IQ")} منتج${isFetching && !isLoading ? " — جاري التحديث..." : ""}`}
        extra={
          <Space wrap>
            <Link href="/catalog-import">
              <Button size="large" icon={<CloudDownloadOutlined />}>
                استيراد من الكتالوج
              </Button>
            </Link>
            <Button type="primary" size="large" icon={<PlusOutlined />} onClick={openCreate}>
              منتج جديد
            </Button>
          </Space>
        }
      />

      <div className="pp-stats">
        <div className="pp-stat">
          <strong>{total.toLocaleString("ar-IQ")}</strong>
          <span>إجمالي المنتجات</span>
        </div>
        <div className="pp-stat">
          <strong>{stats.active}</strong>
          <span>نشط في الصفحة</span>
        </div>
        <div className={`pp-stat${stats.lowStock ? " is-warn" : ""}`}>
          <strong>{stats.lowStock}</strong>
          <span>مخزون منخفض ≤5</span>
        </div>
        <div className="pp-stat">
          <strong>{(brandsData ?? []).length}</strong>
          <span>براندات</span>
        </div>
      </div>

      <section className="pp-toolbar">
        <div className="pp-toolbar-search">
          <Input
            size="large"
            allowClear
            prefix={<SearchOutlined />}
            placeholder="ابحث بالاسم أو SKU أو الباركود..."
            value={searchDraft}
            onChange={(e) => setSearchDraft(e.target.value)}
            onPressEnter={() => {
              setPage(1);
              setSearch(searchDraft.trim());
            }}
          />
          <Button
            type="primary"
            size="large"
            onClick={() => {
              setPage(1);
              setSearch(searchDraft.trim());
            }}
          >
            بحث
          </Button>
        </div>

        <div className="pp-toolbar-filters">
          <Select
            allowClear
            placeholder="البراند"
            className="pp-filter"
            value={filterBrandId}
            options={(brandsData ?? []).map((b: any) => ({
              value: b.id,
              label: b.nameAr || b.name || b.nameEn,
            }))}
            showSearch
            optionFilterProp="label"
            onChange={(v) => {
              setPage(1);
              setFilterBrandId(v);
            }}
          />
          <Select
            allowClear
            placeholder="القسم"
            className="pp-filter"
            value={filterCategoryId}
            options={(categoriesData ?? []).map((c: any) => ({ value: c.id, label: c.name }))}
            onChange={(v) => {
              setPage(1);
              setFilterCategoryId(v);
              setFilterSubcategoryId(undefined);
              setFilterTertiaryCategoryId(undefined);
            }}
          />
          <Select
            allowClear
            placeholder="قسم فرعي"
            className="pp-filter"
            value={filterSubcategoryId}
            disabled={!filterCategoryId}
            options={(filterSubcategories ?? []).map((s: any) => ({
              value: s.id,
              label: s.name,
            }))}
            onChange={(v) => {
              setPage(1);
              setFilterSubcategoryId(v);
              setFilterTertiaryCategoryId(undefined);
            }}
          />
          <Select
            allowClear
            placeholder="قسم ثانوي"
            className="pp-filter"
            value={filterTertiaryCategoryId}
            disabled={!filterSubcategoryId}
            options={(filterTertiarySections ?? []).map((s: any) => ({
              value: s.id,
              label: s.name,
            }))}
            onChange={(v) => {
              setPage(1);
              setFilterTertiaryCategoryId(v);
            }}
          />
          <Select
            allowClear
            placeholder="مشكلة البشرة"
            className="pp-filter"
            value={filterConcernId}
            options={(skinConcernsData ?? []).map((c: any) => ({ value: c.id, label: c.name }))}
            onChange={(v) => {
              setPage(1);
              setFilterConcernId(v);
            }}
          />
          <Segmented
            value={activeFilter}
            onChange={(v) => setActiveFilter(v as ActiveFilter)}
            options={[
              { label: "الكل", value: "all" },
              { label: "نشط", value: "active" },
              { label: "متوقف", value: "inactive" },
            ]}
          />
          <Button type="link" onClick={resetFilters}>
            مسح الفلاتر
          </Button>
        </div>

        <div className="pp-toolbar-view">
          <Segmented
            value={viewMode}
            onChange={(v) => setViewMode(v as ViewMode)}
            options={[
              { value: "grid", icon: <AppstoreOutlined />, label: "بطاقات" },
              { value: "table", icon: <UnorderedListOutlined />, label: "جدول" },
            ]}
          />
        </div>
      </section>

      {viewMode === "grid" ? (
        <div className={`pp-grid${isLoading ? " is-loading" : ""}`}>
          {!isLoading && !items.length ? (
            <div className="pp-empty">
              <Empty
                description="لا توجد منتجات مطابقة"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              >
                <Space>
                  <Button onClick={resetFilters}>مسح الفلاتر</Button>
                  <Button type="primary" onClick={openCreate}>
                    إضافة منتج
                  </Button>
                </Space>
              </Empty>
            </div>
          ) : (
            items.map((r: any) => {
              const shades = r._count?.shades ?? r.shades?.length ?? 0;
              const stock = Number(r.stock ?? 0);
              return (
                <article
                  key={r.id}
                  className={`pp-card${!r.isActive ? " is-inactive" : ""}${stock <= 5 ? " is-low" : ""}`}
                >
                  <button type="button" className="pp-card-media" onClick={() => openEdit(r)}>
                    <ProductThumb product={r} size={160} className="pp-card-thumb" />
                    {!r.isActive ? <span className="pp-badge is-off">متوقف</span> : null}
                    {r.discountPercent > 0 ? (
                      <span className="pp-badge is-sale">-{r.discountPercent}%</span>
                    ) : null}
                  </button>
                  <div className="pp-card-body">
                    {r.brand?.name ? <p className="pp-card-brand">{r.brand.name}</p> : null}
                    <h3 className="pp-card-title">
                      <button type="button" onClick={() => openEdit(r)}>
                        {displayProductName(r)}
                      </button>
                    </h3>
                    <p className="pp-card-meta">
                      <span className="alhayaa-ltr-input">{r.sku || "—"}</span>
                      {r.category?.name ? <span>· {r.category.name}</span> : null}
                    </p>
                    <div className="pp-card-price-row">
                      <strong>{Number(r.price || 0).toLocaleString("ar-IQ")} د.ع</strong>
                      <span className={`pp-stock${stock <= 5 ? " low" : ""}`}>
                        مخزون {stock}
                      </span>
                    </div>
                    <div className="pp-card-foot">
                      <Tooltip title={r.isActive ? "تعطيل" : "تفعيل"}>
                        <Switch
                          size="small"
                          checked={!!r.isActive}
                          loading={toggleActive.isPending}
                          onChange={(checked) =>
                            toggleActive.mutate({ id: r.id, isActive: checked })
                          }
                        />
                      </Tooltip>
                      {shades > 0 ? <Tag color="purple">{shades} تدرج</Tag> : <span />}
                      <Space size={4}>
                        <Button size="small" type="link" onClick={() => openEdit(r)}>
                          تعديل
                        </Button>
                        <Popconfirm
                          title="حذف المنتج؟"
                          onConfirm={() => remove.mutate(r.id)}
                          okText="حذف"
                          cancelText="إلغاء"
                        >
                          <Button size="small" type="link" danger>
                            حذف
                          </Button>
                        </Popconfirm>
                      </Space>
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </div>
      ) : (
        <div className="pp-table-wrap">
          <Table
            rowKey="id"
            loading={isLoading}
            dataSource={items}
            columns={columns}
            scroll={{ x: 1040 }}
            locale={{ emptyText: <Empty description="لا توجد منتجات" /> }}
            rowClassName={(r) =>
              `alhayaa-table-row${!r.isActive ? " is-inactive" : ""}`
            }
            pagination={false}
          />
        </div>
      )}

      <div className="pp-pager">
        <Select
          value={pageSize}
          options={[
            { value: 12, label: "12 / صفحة" },
            { value: 24, label: "24 / صفحة" },
            { value: 48, label: "48 / صفحة" },
          ]}
          onChange={(v) => {
            setPage(1);
            setPageSize(v);
          }}
        />
        <Space>
          <Button disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
            السابق
          </Button>
          <span className="pp-page-label">
            صفحة {page} · {total.toLocaleString("ar-IQ")} منتج
          </span>
          <Button
            disabled={page * pageSize >= total}
            onClick={() => setPage((p) => p + 1)}
          >
            التالي
          </Button>
        </Space>
      </div>

      <ProductFormDrawer
        open={open}
        editing={editing}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        form={form}
        saving={upsert.isPending}
        productImages={productImages}
        setProductImages={setProductImages}
        shadePreviews={shadePreviews}
        setShadePreviews={setShadePreviews}
        categoriesData={categoriesData ?? []}
        brandsData={brandsData ?? []}
        skinConcernsData={skinConcernsData ?? []}
        subcategoryOptions={subcategoryOptions}
        tertiaryCategoryOptions={tertiaryCategoryOptions}
        hasSyncData={hasSyncData}
        syncLoading={syncLoading}
        syncMeta={syncMeta}
        onBarcodeLookup={applyBarcode}
        onShadeBarcodeLookup={applyShadeBarcode}
        shadeSyncLoading={shadeSyncLoading}
        onClose={() => setOpen(false)}
        onSubmit={(v) => upsert.mutate(v)}
      />
    </div>
  );
}
