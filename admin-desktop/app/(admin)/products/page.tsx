"use client";

import dynamic from "next/dynamic";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Card, Form, Input, Popconfirm, Select, Space, Switch, Table, Tag, message } from "antd";
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

const ProductFormDrawer = dynamic(
  () =>
    import("@/components/products/ProductFormDrawer").then((m) => ({
      default: m.ProductFormDrawer,
    })),
  { ssr: false },
);

export default function ProductsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [filterCategoryId, setFilterCategoryId] = useState<string | undefined>();
  const [filterSubcategoryId, setFilterSubcategoryId] = useState<string | undefined>();
  const [filterConcernId, setFilterConcernId] = useState<string | undefined>();
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
    syncMeta,
    applyBarcode,
    refreshPricing,
    resetSync,
  } = useBarcodeInventorySync(form);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["products", page, search, filterCategoryId, filterSubcategoryId, filterConcernId],
    queryFn: () =>
      queries.products({
        page,
        limit: 15,
        search,
        categoryId: filterCategoryId,
        subcategoryId: filterSubcategoryId,
        concernId: filterConcernId,
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
        brandId: full?.brand?.id ?? full?.brandId,
        categoryId: full?.category?.id ?? full?.categoryId,
        subcategoryId: full?.subcategory?.id ?? full?.subcategoryId,
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

  const items = data?.data ?? [];
  const total = data?.meta?.total ?? 0;

  const { data: filterSubcategories } = useQuery({
    queryKey: ["subcategories", filterCategoryId],
    queryFn: () => queries.subcategories({ parentId: filterCategoryId }),
    enabled: !!filterCategoryId,
  });

  const selectedCategoryId = Form.useWatch("categoryId", form);
  const { data: formSubcategories } = useQuery({
    queryKey: ["subcategories", selectedCategoryId],
    queryFn: () => queries.subcategories({ parentId: selectedCategoryId }),
    enabled: !!selectedCategoryId,
  });

  const subcategoryOptions = useMemo(
    () => (formSubcategories ?? []).map((s: any) => ({ value: s.id, label: s.name })),
    [formSubcategories],
  );

  const columns = useMemo(
    () => [
      {
        title: "المنتج",
        key: "product",
        render: (_: unknown, r: any) => (
          <div className="alhayaa-product-cell">
            <ProductThumb product={r} size={48} />
            <div className="alhayaa-product-cell-text">
              <button type="button" className="alhayaa-product-name" onClick={() => openEdit(r)}>
                {displayProductName(r)}
              </button>
              {(r.nameAr && r.nameEn) ? (
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
        title: "الفئة",
        width: 130,
        render: (_: unknown, r: any) => (
          <div className="alhayaa-tags-stack">
            <Tag>{r.category?.name ?? "—"}</Tag>
            {r.subcategory?.name ? <Tag color="blue">{r.subcategory.name}</Tag> : null}
          </div>
        ),
      },
      {
        title: "السعر",
        dataIndex: "price",
        width: 110,
        render: (v: number, r: any) => (
          <div className="alhayaa-price-cell">
            <strong>{v?.toLocaleString()} د.ع</strong>
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
        title: "الألوان",
        width: 70,
        render: (_: unknown, r: any) => r._count?.shades ?? r.shades?.length ?? 0,
      },
      {
        title: "نشط",
        dataIndex: "isActive",
        width: 70,
        render: (v: boolean) => (
          <Switch checked={v} disabled size="small" className="alhayaa-switch-readonly" />
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
    [openEdit, remove],
  );

  return (
    <div className="alhayaa-page">
      <PageHeader
        title="المنتجات"
        subtitle={`${total.toLocaleString()} منتج${isFetching && !isLoading ? " — جاري التحديث..." : ""}`}
        extra={
          <Button type="primary" size="large" onClick={openCreate}>
            + منتج جديد
          </Button>
        }
      />

      <Card className="alhayaa-filter-card" bordered={false}>
        <div className="alhayaa-filter-bar">
          <Input.Search
            placeholder="بحث بالاسم أو SKU..."
            allowClear
            className="alhayaa-filter-search"
            onSearch={(v) => {
              setPage(1);
              setSearch(v);
            }}
          />
          <Select
            allowClear
            placeholder="الفئة"
            className="alhayaa-filter-select"
            value={filterCategoryId}
            options={(categoriesData ?? []).map((c: any) => ({ value: c.id, label: c.name }))}
            onChange={(v) => {
              setPage(1);
              setFilterCategoryId(v);
              setFilterSubcategoryId(undefined);
            }}
          />
          <Select
            allowClear
            placeholder="القسم الفرعي"
            className="alhayaa-filter-select"
            value={filterSubcategoryId}
            disabled={!filterCategoryId}
            options={(filterSubcategories ?? []).map((s: any) => ({
              value: s.id,
              label: s.name,
            }))}
            onChange={(v) => {
              setPage(1);
              setFilterSubcategoryId(v);
            }}
          />
          <Select
            allowClear
            placeholder="مشكلة البشرة"
            className="alhayaa-filter-select"
            value={filterConcernId}
            options={(skinConcernsData ?? []).map((c: any) => ({ value: c.id, label: c.name }))}
            onChange={(v) => {
              setPage(1);
              setFilterConcernId(v);
            }}
          />
        </div>
      </Card>

      <Card className="alhayaa-table-card" bordered={false} styles={{ body: { padding: 0 } }}>
        <Table
          rowKey="id"
          loading={isLoading}
          dataSource={items}
          columns={columns}
          scroll={{ x: 980 }}
          rowClassName={() => "alhayaa-table-row"}
          pagination={{
            current: page,
            total,
            pageSize: 15,
            showSizeChanger: false,
            showTotal: (t) => `${t} منتج`,
            onChange: setPage,
          }}
        />
      </Card>

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
        hasSyncData={hasSyncData}
        syncLoading={syncLoading}
        syncMeta={syncMeta}
        onBarcodeLookup={applyBarcode}
        onClose={() => setOpen(false)}
        onSubmit={(v) => upsert.mutate(v)}
      />
    </div>
  );
}
