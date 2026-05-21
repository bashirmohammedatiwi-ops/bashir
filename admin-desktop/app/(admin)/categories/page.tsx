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
import Link from "next/link";
import { useState } from "react";
import { MediaPicker } from "@/components/MediaPicker";
import { mediaThumb } from "@/lib/mediaUrl";
import { mutations, queries } from "@/lib/queries";

function slugify(name: string) {
  return name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w\u0600-\u06FF-]/g, "")
    .slice(0, 60) || `cat-${Date.now()}`;
}

export default function CategoriesPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["categories-full"],
    queryFn: queries.categoriesFull,
  });
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [form] = Form.useForm();

  const upsert = useMutation({
    mutationFn: async (values: any) =>
      editing?.id
        ? mutations.updateCategory(editing.id, values)
        : mutations.createCategory(values),
    onSuccess: () => {
      message.success(editing ? "تم التحديث" : "تم الإنشاء");
      setOpen(false);
      qc.invalidateQueries({ queryKey: ["categories"] });
      qc.invalidateQueries({ queryKey: ["categories-full"] });
    },
  });

  const remove = useMutation({
    mutationFn: mutations.deleteCategory,
    onSuccess: () => {
      message.success("تم الحذف");
      qc.invalidateQueries({ queryKey: ["categories"] });
      qc.invalidateQueries({ queryKey: ["categories-full"] });
      qc.invalidateQueries({ queryKey: ["subcategories"] });
    },
  });

  function openCreate() {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({ isActive: true, position: 0 });
    setOpen(true);
  }

  function openEdit(row: any) {
    setEditing(row);
    form.setFieldsValue({
      name: row.name,
      slug: row.slug,
      icon: row.icon,
      position: row.position,
      isActive: row.isActive,
      description: row.description,
      imageId: row.imageId,
    });
    setOpen(true);
  }

  return (
     <>
      <Space direction="vertical" size={12} style={{ width: "100%" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <div>
            <h2 style={{ margin: 0 }}>الفئات الرئيسية</h2>
            <div style={{ fontSize: 12, color: "#888", marginTop: 4 }}>
              الفئات العليا — الأقسام الفرعية تُدار من صفحة{" "}
              <Link href="/subcategories">الأقسام الفرعية</Link>
            </div>
          </div>
          <Space>
            <Link href="/subcategories">
              <Button>الأقسام الفرعية</Button>
            </Link>
            <Button type="primary" onClick={openCreate}>
              + فئة رئيسية
            </Button>
          </Space>
        </div>
        <Card styles={{ body: { padding: 0 } }}>
          <Table
            rowKey="id"
            loading={isLoading}
            dataSource={data ?? []}
            pagination={false}
            columns={[
              {
                title: "الصورة",
                width: 70,
                render: (_: any, r: any) => {
                  const url = mediaThumb(r.image);
                  return (
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 8,
                        background: url
                          ? `center/cover url(${url})`
                          : "#f0f0f5",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 20,
                      }}
                    >
                      {!url && (r.icon ?? "📁")}
                    </div>
                  );
                },
              },
              { title: "الاسم", dataIndex: "name" },
              { title: "Slug", dataIndex: "slug", width: 160 },
              {
                title: "الأقسام الفرعية",
                width: 130,
                render: (_: any, r: any) => (
                  <Link href={`/subcategories?parentId=${r.id}`}>
                    {r.subcategoriesCount ?? r.children?.length ?? 0} قسم
                  </Link>
                ),
              },
              {
                title: "المنتجات",
                width: 90,
                render: (_: any, r: any) => r.productCount ?? 0,
              },
              { title: "ترتيب", dataIndex: "position", width: 70 },
              {
                title: "نشط",
                dataIndex: "isActive",
                width: 80,
                render: (v) => (
                  <Tag color={v !== false ? "green" : "red"}>
                    {v !== false ? "نشط" : "موقوف"}
                  </Tag>
                ),
              },
              {
                title: "إجراءات",
                width: 260,
                render: (_: any, r: any) => (
                  <Space wrap>
                    <Link href={`/subcategories?parentId=${r.id}`}>
                      <Button size="small">+ قسم فرعي</Button>
                    </Link>
                    <Button size="small" onClick={() => openEdit(r)}>
                      تعديل
                    </Button>
                    <Popconfirm
                      title="حذف الفئة؟"
                      description="سيُحذف القسم وجميع الأقسام الفرعية التابعة"
                      okText="حذف"
                      cancelText="إلغاء"
                      onConfirm={() => remove.mutate(r.id)}
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
        title={editing ? "تعديل الفئة" : "فئة رئيسية جديدة"}
        open={open}
        onCancel={() => setOpen(false)}
        onOk={() => form.submit()}
        confirmLoading={upsert.isPending}
        okText="حفظ"
        cancelText="إلغاء"
        destroyOnHidden
      >
        <Form
          layout="vertical"
          form={form}
          onFinish={(v) => {
            upsert.mutate({
              ...v,
              slug: v.slug || slugify(v.name),
            });
          }}
        >
          <Form.Item name="name" label="الاسم" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="slug" label="Slug">
            <Input placeholder="يُولَّد تلقائياً من الاسم" />
          </Form.Item>
          <Form.Item name="icon" label="الأيقونة">
            <Input placeholder="🧴" />
          </Form.Item>
          <Form.Item name="description" label="الوصف">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name="imageId" label="صورة الفئة">
            <MediaPicker />
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
