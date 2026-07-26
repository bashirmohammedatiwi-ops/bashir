"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CloudSyncOutlined, PlusOutlined } from "@ant-design/icons";
import {
  Avatar,
  Button,
  Form,
  Input,
  Modal,
  Popconfirm,
  Progress,
  Select,
  Space,
  Switch,
  message,
} from "antd";
import { useEffect, useMemo, useState } from "react";
import { BrandsSortableList } from "@/components/brands/BrandsSortableList";
import type { BrandCollection, BrandRow } from "@/lib/brandTypes";
import { MediaPicker } from "@/components/MediaPicker";
import { PageHeader } from "@/components/PageHeader";
import { fetchCatalogBrands } from "@/lib/catalogImport";
import { mediaThumb } from "@/lib/mediaUrl";
import { mutations, queries } from "@/lib/queries";
import { slugify } from "@/lib/slugify";
import "./brands-page.css";

const SYNC_BATCH = 40;

export default function BrandsPage() {
  const [activeOnly, setActiveOnly] = useState(true);
  const [filterCategoryId, setFilterCategoryId] = useState<string | undefined>();
  const [filterSubcategoryId, setFilterSubcategoryId] = useState<string | undefined>();
  const [filterTertiaryCategoryId, setFilterTertiaryCategoryId] = useState<string | undefined>();

  const brandFilters = useMemo(
    () => ({
      activeOnly,
      categoryId: filterCategoryId,
      subcategoryId: filterSubcategoryId,
      tertiaryCategoryId: filterTertiaryCategoryId,
    }),
    [activeOnly, filterCategoryId, filterSubcategoryId, filterTertiaryCategoryId],
  );

  const hasFilters = Boolean(
    activeOnly || filterCategoryId || filterSubcategoryId || filterTertiaryCategoryId,
  );
  const partialOrder = Boolean(filterCategoryId || filterSubcategoryId || filterTertiaryCategoryId);

  const { data, isLoading } = useQuery({
    queryKey: ["brands", brandFilters],
    queryFn: () => queries.brands(brandFilters),
  });
  const { data: allBrands } = useQuery({
    queryKey: ["brands", "all"],
    queryFn: () => queries.brands(),
  });
  const { data: categoriesData } = useQuery({
    queryKey: ["categories"],
    queryFn: queries.categories,
  });
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

  const qc = useQueryClient();
  const [localBrands, setLocalBrands] = useState<BrandRow[]>([]);
  const [open, setOpen] = useState(false);
  const [colOpen, setColOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [editingCol, setEditingCol] = useState<any | null>(null);
  const [brandForCol, setBrandForCol] = useState<any | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
  const [reassignTo, setReassignTo] = useState<string | undefined>();
  const [syncProgress, setSyncProgress] = useState<{ done: number; total: number } | null>(null);
  const [form] = Form.useForm();
  const [colForm] = Form.useForm();

  useEffect(() => {
    setLocalBrands((data as BrandRow[]) ?? []);
  }, [data]);

  const stats = useMemo(() => {
    const rows = (allBrands as BrandRow[]) ?? [];
    const active = rows.filter((b) => b.isActive !== false).length;
    const featured = rows.filter((b) => b.isFeatured).length;
    const withProducts = rows.filter((b) => (b.productCount ?? 0) > 0).length;
    return { total: rows.length, active, featured, withProducts, visible: localBrands.length };
  }, [allBrands, localBrands.length]);

  const reorder = useMutation({
    mutationFn: (ids: string[]) => mutations.reorderBrands(ids),
    onMutate: (ids) => {
      const byId = new Map(localBrands.map((b) => [b.id, b]));
      setLocalBrands(ids.map((id) => byId.get(id)).filter(Boolean) as BrandRow[]);
    },
    onSuccess: () => {
      message.success("تم حفظ ترتيب البراندات — سيتغيّر ترتيب المنتجات في التطبيق");
      qc.invalidateQueries({ queryKey: ["brands"] });
      qc.invalidateQueries({ queryKey: ["products"] });
    },
    onError: () => {
      message.error("تعذّر حفظ الترتيب");
      qc.invalidateQueries({ queryKey: ["brands"] });
    },
  });

  const upsert = useMutation({
    mutationFn: async (values: any) =>
      editing?.id ? mutations.updateBrand(editing.id, values) : mutations.createBrand(values),
    onSuccess: () => {
      message.success(editing ? "تم التحديث" : "تم الإنشاء");
      setOpen(false);
      qc.invalidateQueries({ queryKey: ["brands"] });
    },
  });

  const remove = useMutation({
    mutationFn: ({ id, reassignTo: to }: { id: string; reassignTo?: string }) =>
      mutations.deleteBrand(id, to ? { reassignTo: to } : undefined),
    onSuccess: (res: any) => {
      const moved = Number(res?.reassignedProducts || res?.data?.reassignedProducts || 0);
      message.success(moved > 0 ? `تم الحذف ونقل ${moved} منتج` : "تم الحذف");
      setDeleteTarget(null);
      setReassignTo(undefined);
      qc.invalidateQueries({ queryKey: ["brands"] });
      qc.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { message?: string | string[] } }; message?: string };
      const raw = e?.response?.data?.message;
      const msg = Array.isArray(raw) ? raw.join(" · ") : raw || e?.message || "تعذّر حذف البراند";
      message.error(msg);
    },
  });

  const syncFromCatalog = useMutation({
    mutationFn: async () => {
      message.loading({ content: "جاري جلب براندات المتاجر...", key: "brand-sync" });
      const catalog = await fetchCatalogBrands(true);
      const rows = (catalog.brands || []).map((b) => {
        const logoUrl = b.logoUrl || b.productImageUrl || undefined;
        const fromProduct = Boolean(!b.logoUrl && b.productImageUrl) || Boolean(b.logoIsProductImage);
        return {
          name: b.name,
          nameAr: b.nameAr,
          nameEn: b.nameEn,
          logoUrl,
          logoIsProductImage: fromProduct,
        };
      });
      if (!rows.length) throw new Error("لم يُعثر على براندات في الكتالوج");

      let created = 0;
      let matched = 0;
      let logosAttached = 0;
      setSyncProgress({ done: 0, total: rows.length });

      for (let i = 0; i < rows.length; i += SYNC_BATCH) {
        const chunk = rows.slice(i, i + SYNC_BATCH);
        const result = await mutations.syncBrandsFromCatalog({
          brands: chunk,
          attachLogos: true,
        });
        created += Number(result?.created || 0);
        matched += Number(result?.matched || 0);
        logosAttached += Number(result?.logosAttached || 0);
        setSyncProgress({ done: Math.min(i + chunk.length, rows.length), total: rows.length });
      }

      return { created, matched, logosAttached, total: rows.length };
    },
    onSuccess: (stats) => {
      setSyncProgress(null);
      message.success({
        content: `تمت المزامنة: ${stats.created} جديد · ${stats.matched} موجود · ${stats.logosAttached} شعار`,
        key: "brand-sync",
        duration: 6,
      });
      qc.invalidateQueries({ queryKey: ["brands"] });
    },
    onError: (err: unknown) => {
      setSyncProgress(null);
      const e = err as { message?: string; response?: { data?: { message?: string } } };
      message.error({
        content: e?.response?.data?.message || e?.message || "فشلت مزامنة البراندات",
        key: "brand-sync",
      });
    },
  });

  const upsertCol = useMutation({
    mutationFn: async (values: any) => {
      if (editingCol?.id) return mutations.updateBrandCollection(editingCol.id, values);
      return mutations.createBrandCollection(brandForCol!.id, values);
    },
    onSuccess: () => {
      message.success(editingCol ? "تم التحديث" : "تم إضافة الخط");
      setColOpen(false);
      setEditingCol(null);
      qc.invalidateQueries({ queryKey: ["brands"] });
    },
  });

  const removeCol = useMutation({
    mutationFn: mutations.deleteBrandCollection,
    onSuccess: () => {
      message.success("تم الحذف");
      qc.invalidateQueries({ queryKey: ["brands"] });
    },
  });

  function openCreateBrand() {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({ isFeatured: false, isActive: true });
    setOpen(true);
  }

  function openEditBrand(row: BrandRow) {
    setEditing(row);
    form.setFieldsValue({
      name: row.name,
      slug: row.slug,
      initial: row.initial,
      bgColorHex: row.bgColorHex,
      logoId: row.logoId ?? row.logo?.id,
      isFeatured: row.isFeatured,
      isActive: row.isActive,
    });
    setOpen(true);
  }

  function openCreateCollection(brand: BrandRow) {
    setBrandForCol(brand);
    setEditingCol(null);
    colForm.resetFields();
    colForm.setFieldsValue({ isActive: true, position: 0 });
    setColOpen(true);
  }

  function openEditCollection(brand: BrandRow, col: BrandCollection) {
    setBrandForCol(brand);
    setEditingCol({ ...col, brandId: brand.id, brandName: brand.name });
    colForm.setFieldsValue({
      name: col.name,
      slug: col.slug,
      description: col.description,
      position: col.position,
      isActive: col.isActive,
    });
    setColOpen(true);
  }

  function handleDeleteBrand(brand: BrandRow) {
    if ((brand.productCount ?? 0) > 0) {
      setDeleteTarget(brand);
      setReassignTo(undefined);
      return;
    }
    Modal.confirm({
      title: "حذف البراند؟",
      okText: "حذف",
      cancelText: "إلغاء",
      okButtonProps: { danger: true },
      onOk: () => remove.mutateAsync({ id: brand.id }),
    });
  }

  function resetFilters() {
    setActiveOnly(true);
    setFilterCategoryId(undefined);
    setFilterSubcategoryId(undefined);
    setFilterTertiaryCategoryId(undefined);
  }

  const productCountLabel =
    activeOnly || filterCategoryId || filterSubcategoryId || filterTertiaryCategoryId
      ? "منتج (مفلتر)"
      : "منتج";

  return (
    <div className="brands-page alhayaa-page">
      <PageHeader
        title="البراندات"
        subtitle="جدول ترتيب البراندات — منتجات التطبيق تُعرض مجمّعة حسب ترتيب البراند (انقر على الصف للتعديل)"
        extra={
          <Space wrap>
            <Button icon={<CloudSyncOutlined />} loading={syncFromCatalog.isPending} onClick={() => syncFromCatalog.mutate()}>
              مزامنة من الكتالوج
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreateBrand}>
              براند جديد
            </Button>
          </Space>
        }
      />

      <div className="bp-stats">
        <div className="bp-stat">
          <strong>{stats.total}</strong>
          <span>إجمالي البراندات</span>
        </div>
        <div className="bp-stat">
          <strong>{stats.visible}</strong>
          <span>ظاهر بالفلاتر</span>
        </div>
        <div className="bp-stat">
          <strong>{stats.withProducts}</strong>
          <span>بها منتجات</span>
        </div>
        <div className="bp-stat">
          <strong>{stats.featured}</strong>
          <span>مميزة</span>
        </div>
      </div>

      {syncProgress ? (
        <div className="bp-toolbar">
          <div>جاري المزامنة ({syncProgress.done}/{syncProgress.total})</div>
          <Progress
            percent={syncProgress.total ? Math.round((syncProgress.done / syncProgress.total) * 100) : 0}
            status="active"
          />
        </div>
      ) : null}

      <section className="bp-toolbar">
        <div className="bp-toolbar-row">
          <Switch checked={activeOnly} onChange={setActiveOnly} checkedChildren="نشط" unCheckedChildren="الكل" />
          <span className="bp-filter-label">براندات بمنتجات نشطة فقط</span>
        </div>
        <div className="bp-toolbar-row">
          <Select
            allowClear
            placeholder="القسم"
            style={{ minWidth: 170 }}
            value={filterCategoryId}
            options={(categoriesData ?? []).map((c: any) => ({ value: c.id, label: c.name }))}
            showSearch
            optionFilterProp="label"
            onChange={(v) => {
              setFilterCategoryId(v);
              setFilterSubcategoryId(undefined);
              setFilterTertiaryCategoryId(undefined);
            }}
          />
          <Select
            allowClear
            placeholder="قسم فرعي"
            style={{ minWidth: 170 }}
            value={filterSubcategoryId}
            disabled={!filterCategoryId}
            options={(filterSubcategories ?? []).map((s: any) => ({ value: s.id, label: s.name }))}
            showSearch
            optionFilterProp="label"
            onChange={(v) => {
              setFilterSubcategoryId(v);
              setFilterTertiaryCategoryId(undefined);
            }}
          />
          <Select
            allowClear
            placeholder="قسم ثانوي"
            style={{ minWidth: 170 }}
            value={filterTertiaryCategoryId}
            disabled={!filterSubcategoryId}
            options={(filterTertiarySections ?? []).map((t: any) => ({ value: t.id, label: t.name }))}
            showSearch
            optionFilterProp="label"
            onChange={setFilterTertiaryCategoryId}
          />
          {hasFilters ? <Button onClick={resetFilters}>إعادة تعيين الفلاتر</Button> : null}
        </div>
      </section>

      {localBrands.length > 0 ? (
        <section className="bp-preview-card">
          <h3 className="bp-preview-title">معاينة ترتيب التطبيق</h3>
          <div className="bp-preview-strip">
            {localBrands.map((brand) => {
              const src = mediaThumb(brand.logo);
              return (
                <div key={brand.id} className="bp-preview-chip">
                  {src ? (
                    <Avatar shape="circle" size={50} src={src} />
                  ) : (
                    <Avatar shape="circle" size={50} style={{ background: brand.bgColorHex || "#ece8f0", color: "#4a2466" }}>
                      {brand.initial || brand.name.charAt(0)}
                    </Avatar>
                  )}
                  <span>{brand.name}</span>
                </div>
              );
            })}
          </div>
        </section>
      ) : null}

      <section className="bp-list-card">
        <div className="bp-list-card-head">
          <h3>جدول البراندات ({localBrands.length})</h3>
          {reorder.isPending ? <span className="bp-filter-label">جاري الحفظ...</span> : null}
        </div>
        <BrandsSortableList
          brands={localBrands}
          loading={isLoading}
          reordering={reorder.isPending}
          partialOrder={partialOrder}
          productCountLabel={productCountLabel}
          onReorder={(ids) => reorder.mutate(ids)}
          onEdit={openEditBrand}
          onDelete={handleDeleteBrand}
          onAddCollection={openCreateCollection}
          onEditCollection={openEditCollection}
          onDeleteCollection={(id) => removeCol.mutate(id)}
        />
      </section>

      <Modal
        title={`حذف البراند: ${deleteTarget?.name || ""}`}
        open={Boolean(deleteTarget)}
        onCancel={() => {
          setDeleteTarget(null);
          setReassignTo(undefined);
        }}
        onOk={() => {
          if (!deleteTarget?.id) return;
          if (!reassignTo) {
            message.warning("اختر برانداً لنقل المنتجات إليه");
            return;
          }
          remove.mutate({ id: deleteTarget.id, reassignTo });
        }}
        confirmLoading={remove.isPending}
        okText="نقل وحذف"
        okButtonProps={{ danger: true }}
        cancelText="إلغاء"
        destroyOnHidden
      >
        <p style={{ marginBottom: 12 }}>
          هذا البراند مرتبط بـ <strong>{deleteTarget?.productCount ?? 0}</strong> منتج. اختر برانداً لنقل المنتجات إليه.
        </p>
        <Select
          style={{ width: "100%" }}
          showSearch
          optionFilterProp="label"
          placeholder="انقل المنتجات إلى..."
          value={reassignTo}
          onChange={setReassignTo}
          options={(allBrands || [])
            .filter((b: any) => b.id !== deleteTarget?.id)
            .map((b: any) => ({
              value: b.id,
              label: `${b.name}${b.productCount != null ? ` (${b.productCount})` : ""}`,
            }))}
        />
      </Modal>

      <Modal
        title={editing ? "تعديل البراند" : "براند جديد"}
        open={open}
        onCancel={() => setOpen(false)}
        onOk={() => form.submit()}
        confirmLoading={upsert.isPending}
        okText="حفظ"
        cancelText="إلغاء"
        destroyOnHidden
      >
        <Form layout="vertical" form={form} onFinish={(v) => upsert.mutate(v)}>
          <Form.Item name="name" label="الاسم" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="slug" label="Slug" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="initial" label="الحرف الأول">
            <Input maxLength={2} />
          </Form.Item>
          <Form.Item name="bgColorHex" label="لون الخلفية">
            <Input placeholder="#4a2466" />
          </Form.Item>
          <Form.Item name="logoId" label="الشعار">
            <MediaPicker purpose="BRAND" previewUrl={editing ? mediaThumb(editing.logo) : undefined} />
          </Form.Item>
          <Form.Item name="isFeatured" label="مميز" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item name="isActive" label="نشط" valuePropName="checked" initialValue={true}>
            <Switch />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={editingCol ? "تعديل الخط" : `خط جديد — ${brandForCol?.name ?? ""}`}
        open={colOpen}
        onCancel={() => setColOpen(false)}
        onOk={() => colForm.submit()}
        confirmLoading={upsertCol.isPending}
        okText="حفظ"
        cancelText="إلغاء"
        destroyOnHidden
      >
        <Form
          layout="vertical"
          form={colForm}
          onFinish={(v) =>
            upsertCol.mutate({
              ...v,
              slug: v.slug?.trim() || slugify(v.name, "line"),
            })
          }
        >
          <Form.Item name="name" label="اسم الخط/المجموعة" rules={[{ required: true }]}>
            <Input placeholder="Studio Fix" />
          </Form.Item>
          <Form.Item name="slug" label="Slug">
            <Input placeholder="studio-fix" />
          </Form.Item>
          <Form.Item name="description" label="الوصف">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name="position" label="الترتيب">
            <Input type="number" min={0} />
          </Form.Item>
          <Form.Item name="isActive" label="نشط" valuePropName="checked" initialValue={true}>
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
