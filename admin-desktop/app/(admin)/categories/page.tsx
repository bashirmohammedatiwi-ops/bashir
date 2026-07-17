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
import { PageHeader } from "@/components/PageHeader";
import { MediaPicker } from "@/components/MediaPicker";
import { slugify } from "@/lib/slugify";
import { mediaThumb } from "@/lib/mediaUrl";
import { mutations, queries } from "@/lib/queries";

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
      qc.invalidateQueries({ queryKey: ["tertiary-sections"] });
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
      name: row.nameAr || row.name,
      nameAr: row.nameAr || row.name,
      nameEn: row.nameEn || undefined,
      slug: row.slug,
      icon: row.icon,
      position: row.position,
      isActive: row.isActive,
      description: row.description,
      imageId: row.imageId ?? row.image?.id,
    });
    setOpen(true);
  }

  return (
    <div className="alhayaa-page">
      <PageHeader
        title="الأقسام"
        subtitle="تقسيمة نايس ون — أقسام رئيسية / فرعية / ثانوية (عربي + إنجليزي)"
        extra={
          <Space>
            <Link href="/subcategories">
              <Button>أقسام فرعية</Button>
            </Link>
            <Link href="/tertiary-sections">
              <Button>أقسام ثانوية</Button>
            </Link>
            <Button type="primary" onClick={openCreate}>
              + قسم
            </Button>
          </Space>
        }
      />
      <Card className="alhayaa-table-card" bordered={false} styles={{ body: { padding: 0 } }}>
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
              {
                title: "EN",
                dataIndex: "nameEn",
                width: 140,
                render: (v: string) => v || "—",
              },
              { title: "Slug", dataIndex: "slug", width: 160 },
              {
                title: "أقسام فرعية",
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
                      title="حذف القسم؟"
                      description="سيُحذف القسم وجميع الأقسام الفرعية والثانوية التابعة"
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
            const nameAr = (v.nameAr || v.name || "").trim();
            upsert.mutate({
              ...v,
              name: nameAr,
              nameAr,
              nameEn: v.nameEn?.trim() || undefined,
              slug: v.slug?.trim() || slugify(nameAr || v.nameEn, "cat"),
            });
          }}
        >
          <Form.Item name="nameAr" label="الاسم (عربي)" rules={[{ required: true, message: "الاسم مطلوب" }]}>
            <Input />
          </Form.Item>
          <Form.Item name="nameEn" label="الاسم (EN)">
            <Input placeholder="Makeup" />
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
    </div>
  );
}
