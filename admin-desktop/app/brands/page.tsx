"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Button,
  Card,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Space,
  Switch,
  Table,
  Tag,
  message,
} from "antd";
import { useMemo, useState } from "react";
import { Shell } from "@/components/Shell";
import { MediaPicker } from "@/components/MediaPicker";
import { mutations, queries } from "@/lib/queries";

function slugify(name: string) {
  return name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w\u0600-\u06FF-]/g, "")
    .slice(0, 60) || `line-${Date.now()}`;
}

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
    mutationFn: mutations.deleteBrand,
    onSuccess: () => {
      message.success("تم الحذف");
      qc.invalidateQueries({ queryKey: ["brands"] });
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
    form.setFieldsValue(row);
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
    colForm.setFieldsValue(row);
    setColOpen(true);
  }

  return (
    <Shell>
      <Space direction="vertical" size={12} style={{ width: "100%" }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <h2 style={{ margin: 0 }}>البراندات وخطوط المنتجات</h2>
          <Button type="primary" onClick={openCreateBrand}>
            + براند جديد
          </Button>
        </div>
        <Card styles={{ body: { padding: 0 } }}>
          <Table
            rowKey={(r) => (r.rowType === "collection" ? `col-${r.id}` : r.id)}
            loading={isLoading}
            dataSource={tableData}
            pagination={false}
            columns={[
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
                      <Popconfirm
                        title="حذف البراند؟"
                        okText="حذف"
                        cancelText="إلغاء"
                        onConfirm={() => remove.mutate(r.id)}
                      >
                        <Button size="small" danger>
                          حذف
                        </Button>
                      </Popconfirm>
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
              slug: v.slug || slugify(v.name),
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
    </Shell>
  );
}
