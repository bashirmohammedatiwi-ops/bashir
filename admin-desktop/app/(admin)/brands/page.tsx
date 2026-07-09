"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Avatar,
  Button,
  Card,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Progress,
  Select,
  Space,
  Switch,
  Table,
  Tag,
  message,
} from "antd";
import { CloudSyncOutlined } from "@ant-design/icons";
import { useMemo, useState } from "react";
import { MediaPicker } from "@/components/MediaPicker";
import { fetchCatalogBrands } from "@/lib/catalogImport";
import { mediaThumb } from "@/lib/mediaUrl";
import { mutations, queries } from "@/lib/queries";
import { slugify } from "@/lib/slugify";

const SYNC_BATCH = 40;

export default function BrandsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["brands"],
    queryFn: queries.brands,
  });
  const qc = useQueryClient();
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

  const upsert = useMutation({
    mutationFn: async (values: any) =>
      editing?.id
        ? mutations.updateBrand(editing.id, values)
        : mutations.createBrand(values),
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
      message.loading({ content: "جاري جلب براندات المتاجر الأربعة...", key: "brand-sync" });
      const catalog = await fetchCatalogBrands(true);
      const rows = (catalog.brands || []).map((b) => ({
        name: b.name,
        nameAr: b.nameAr,
        nameEn: b.nameEn,
        // شعار حقيقي فقط — لا نرفع صورة منتج كشعار براند
        logoUrl: b.logoUrl && !b.logoIsProductImage ? b.logoUrl : undefined,
      }));
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

      return { created, matched, logosAttached, total: rows.length, withLogo: catalog.withLogo };
    },
    onSuccess: (stats) => {
      setSyncProgress(null);
      message.success({
        content: `تمت المزامنة: ${stats.created} جديد · ${stats.matched} موجود · ${stats.logosAttached} شعار · من ${stats.total} براند`,
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

  const tableData = useMemo(() => {
    const rows: any[] = [];
    for (const brand of data ?? []) {
      rows.push({ ...brand, rowType: "brand" });
      for (const col of brand.collections ?? []) {
        rows.push({
          ...col,
          rowType: "collection",
          brandName: brand.name,
          brandId: brand.id,
        });
      }
    }
    return rows;
  }, [data]);

  function openCreateBrand() {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({ isFeatured: false, isActive: true, position: 0 });
    setOpen(true);
  }

  function openEditBrand(row: any) {
    setEditing(row);
    form.setFieldsValue({
      name: row.name,
      slug: row.slug,
      initial: row.initial,
      bgColorHex: row.bgColorHex,
      logoId: row.logoId ?? row.logo?.id,
      position: row.position,
      isFeatured: row.isFeatured,
      isActive: row.isActive,
    });
    setOpen(true);
  }

  function openCreateCollection(brand: any) {
    setBrandForCol(brand);
    setEditingCol(null);
    colForm.resetFields();
    colForm.setFieldsValue({ isActive: true, position: 0 });
    setColOpen(true);
  }

  function openEditCollection(row: any) {
    setBrandForCol({ id: row.brandId, name: row.brandName });
    setEditingCol(row);
    colForm.setFieldsValue({
      name: row.name,
      slug: row.slug,
      description: row.description,
      position: row.position,
      isActive: row.isActive,
    });
    setColOpen(true);
  }

  return (
     <>
      <Space direction="vertical" size={12} style={{ width: "100%" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <h2 style={{ margin: 0 }}>البراندات وخطوط المنتجات</h2>
          <Space wrap>
            <Button
              icon={<CloudSyncOutlined />}
              loading={syncFromCatalog.isPending}
              onClick={() => syncFromCatalog.mutate()}
            >
              مزامنة من الكتالوج
            </Button>
            <Button type="primary" onClick={openCreateBrand}>
              + براند جديد
            </Button>
          </Space>
        </div>
        {syncProgress ? (
          <Card size="small">
            <div style={{ marginBottom: 8 }}>
              جاري المزامنة ({syncProgress.done}/{syncProgress.total}) — بدون تكرار، مع الشعارات عند توفرها
            </div>
            <Progress
              percent={syncProgress.total ? Math.round((syncProgress.done / syncProgress.total) * 100) : 0}
              status="active"
            />
          </Card>
        ) : null}
        <Card styles={{ body: { padding: 0 } }}>
          <Table
            rowKey={(r) => (r.rowType === "collection" ? `col-${r.id}` : r.id)}
            loading={isLoading}
            dataSource={tableData}
            pagination={false}
            columns={[
              {
                title: "الشعار",
                width: 64,
                render: (_: any, r: any) => {
                  if (r.rowType !== "brand") return null;
                  const src = mediaThumb(r.logo);
                  return src ? (
                    <Avatar shape="square" size={40} src={src} style={{ background: r.bgColorHex || "#f5f5f5" }} />
                  ) : (
                    <Avatar shape="square" size={40} style={{ background: r.bgColorHex || "#eee", color: "#555" }}>
                      {r.initial || (r.name || "?").charAt(0)}
                    </Avatar>
                  );
                },
              },
              {
                title: "الاسم",
                dataIndex: "name",
                render: (v, r: any) =>
                  r.rowType === "collection" ? (
                    <span style={{ paddingInlineStart: 24, color: "#555" }}>↳ {v}</span>
                  ) : (
                    <strong>{v}</strong>
                  ),
              },
              {
                title: "النوع",
                width: 120,
                render: (_: any, r: any) =>
                  r.rowType === "collection" ? (
                    <Tag color="cyan">خط/مجموعة</Tag>
                  ) : (
                    <Tag color="gold">براند</Tag>
                  ),
              },
              { title: "Slug", dataIndex: "slug", width: 160 },
              {
                title: "الحرف",
                dataIndex: "initial",
                width: 70,
                render: (v, r: any) => (r.rowType === "brand" ? v : "—"),
              },
              {
                title: "المنتجات",
                width: 90,
                render: (_: any, r: any) => (r.rowType === "brand" ? r.productCount ?? 0 : "—"),
              },
              {
                title: "مميز",
                width: 80,
                render: (_: any, r: any) =>
                  r.rowType === "brand" ? (
                    <Tag color={r.isFeatured ? "gold" : "default"}>
                      {r.isFeatured ? "نعم" : "لا"}
                    </Tag>
                  ) : (
                    "—"
                  ),
              },
              { title: "ترتيب", dataIndex: "position", width: 70 },
              {
                title: "إجراءات",
                width: 260,
                render: (_: any, r: any) =>
                  r.rowType === "brand" ? (
                    <Space wrap>
                      <Button size="small" onClick={() => openCreateCollection(r)}>
                        + خط
                      </Button>
                      <Button size="small" onClick={() => openEditBrand(r)}>
                        تعديل
                      </Button>
                      {(r.productCount ?? 0) > 0 ? (
                        <Button
                          size="small"
                          danger
                          onClick={() => {
                            setDeleteTarget(r);
                            setReassignTo(undefined);
                          }}
                        >
                          حذف
                        </Button>
                      ) : (
                        <Popconfirm
                          title="حذف البراند؟"
                          okText="حذف"
                          cancelText="إلغاء"
                          onConfirm={() => remove.mutate({ id: r.id })}
                        >
                          <Button size="small" danger loading={remove.isPending}>
                            حذف
                          </Button>
                        </Popconfirm>
                      )}
                    </Space>
                  ) : (
                    <Space>
                      <Button size="small" onClick={() => openEditCollection(r)}>
                        تعديل
                      </Button>
                      <Popconfirm
                        title="حذف الخط؟"
                        okText="حذف"
                        cancelText="إلغاء"
                        onConfirm={() => removeCol.mutate(r.id)}
                      >
                        <Button size="small" danger>
                          حذف
                        </Button>
                      </Popconfirm>
                    </Space>
                  ),
              },
            ]}
          />
        </Card>
      </Space>

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
          هذا البراند مرتبط بـ <strong>{deleteTarget?.productCount ?? 0}</strong> منتج.
          اختر برانداً لنقل المنتجات إليه ثم احذف البراند.
        </p>
        <Select
          style={{ width: "100%" }}
          showSearch
          optionFilterProp="label"
          placeholder="انقل المنتجات إلى..."
          value={reassignTo}
          onChange={setReassignTo}
          options={(data || [])
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
            <MediaPicker />
          </Form.Item>
          <Form.Item name="position" label="الترتيب">
            <InputNumber style={{ width: "100%" }} min={0} />
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
        title={
          editingCol
            ? "تعديل الخط"
            : `خط جديد — ${brandForCol?.name ?? ""}`
        }
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
            <InputNumber style={{ width: "100%" }} min={0} />
          </Form.Item>
          <Form.Item name="isActive" label="نشط" valuePropName="checked" initialValue={true}>
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    
    </>
  );
}
