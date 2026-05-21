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
  Select,
  Space,
  Switch,
  Table,
  Tag,
  message,
} from "antd";
import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { Shell } from "@/components/Shell";
import { MediaPicker } from "@/components/MediaPicker";
import { mediaThumb } from "@/lib/mediaUrl";
import { mutations, queries } from "@/lib/queries";

function slugify(name: string) {
  return name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w\u0600-\u06FF-]/g, "")
    .slice(0, 60) || `section-${Date.now()}`;
}

export default function SubcategoriesPage() {
  const [parentFilter, setParentFilter] = useState<string | undefined>();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [form] = Form.useForm();
  const qc = useQueryClient();

  useEffect(() => {
    const pid = new URLSearchParams(window.location.search).get("parentId");
    if (pid) setParentFilter(pid);
  }, []);

  const { data: categoriesData } = useQuery({
    queryKey: ["categories"],
    queryFn: queries.categories,
  });

  const { data, isLoading } = useQuery({
    queryKey: ["subcategories", parentFilter, search],
    queryFn: () =>
      queries.subcategories({
        parentId: parentFilter,
        search: search || undefined,
      }),
  });

  const parentOptions = useMemo(
    () =>
      (categoriesData ?? []).map((c: any) => ({
        value: c.id,
        label: `${c.icon ?? "📁"} ${c.name}`,
      })),
    [categoriesData],
  );

  const upsert = useMutation({
    mutationFn: async (values: any) => {
      const payload = {
        ...values,
        slug: values.slug || slugify(values.name),
      };
      return editing?.id
        ? mutations.updateSubcategory(editing.id, payload)
        : mutations.createSubcategory(payload);
    },
    onSuccess: () => {
      message.success(editing ? "تم التحديث" : "تم إنشاء القسم");
      setOpen(false);
      setEditing(null);
      qc.invalidateQueries({ queryKey: ["subcategories"] });
      qc.invalidateQueries({ queryKey: ["categories"] });
    },
    onError: (e: any) => {
      message.error(e?.response?.data?.message ?? "فشل الحفظ");
    },
  });

  const remove = useMutation({
    mutationFn: mutations.deleteSubcategory,
    onSuccess: () => {
      message.success("تم الحذف");
      qc.invalidateQueries({ queryKey: ["subcategories"] });
      qc.invalidateQueries({ queryKey: ["categories"] });
    },
  });

  function openCreate() {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({
      isActive: true,
      position: 0,
      parentId: parentFilter ?? parentOptions[0]?.value,
    });
    setOpen(true);
  }

  function openEdit(row: any) {
    setEditing(row);
    form.setFieldsValue({
      name: row.name,
      slug: row.slug,
      description: row.description,
      parentId: row.parentId ?? row.parent?.id,
      imageId: row.imageId,
      position: row.position,
      isActive: row.isActive,
    });
    setOpen(true);
  }

  const rows = data ?? [];

  return (
    <Shell>
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
            <h2 style={{ margin: 0 }}>الأقسام الفرعية</h2>
            <div style={{ fontSize: 12, color: "#888", marginTop: 4 }}>
              أقسام ثانوية داخل كل فئة رئيسية — تُربط بالمنتجات
            </div>
          </div>
          <Space>
            <Link href="/categories">
              <Button>الفئات الرئيسية</Button>
            </Link>
            <Button type="primary" onClick={openCreate} disabled={!parentOptions.length}>
              + قسم فرعي
            </Button>
          </Space>
        </div>

        <Card>
          <Space wrap style={{ marginBottom: 12 }}>
            <Select
              allowClear
              placeholder="فلترة حسب الفئة"
              style={{ width: 220 }}
              value={parentFilter}
              options={parentOptions}
              onChange={(v) => setParentFilter(v)}
            />
            <Input.Search
              placeholder="بحث بالاسم..."
              allowClear
              onSearch={setSearch}
              style={{ width: 240 }}
            />
          </Space>

          <Table
            rowKey="id"
            loading={isLoading}
            dataSource={rows}
            pagination={{ pageSize: 20 }}
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
                      }}
                    />
                  );
                },
              },
              { title: "الاسم", dataIndex: "name" },
              {
                title: "الفئة الرئيسية",
                render: (_: any, r: any) => (
                  <Tag color="purple">{r.parent?.name ?? r.parentName ?? "—"}</Tag>
                ),
              },
              { title: "Slug", dataIndex: "slug", width: 160 },
              {
                title: "المنتجات",
                dataIndex: "productCount",
                width: 90,
                render: (v) => v ?? 0,
              },
              { title: "الترتيب", dataIndex: "position", width: 80 },
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
                width: 160,
                render: (_: any, r: any) => (
                  <Space>
                    <Button size="small" onClick={() => openEdit(r)}>
                      تعديل
                    </Button>
                    <Popconfirm
                      title="حذف القسم؟"
                      description="سيُزال الربط من المنتجات المرتبطة"
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
        title={editing ? "تعديل القسم الفرعي" : "قسم فرعي جديد"}
        open={open}
        onCancel={() => {
          setOpen(false);
          setEditing(null);
        }}
        onOk={() => form.submit()}
        confirmLoading={upsert.isPending}
        okText="حفظ"
        cancelText="إلغاء"
        destroyOnHidden
        width={520}
      >
        <Form layout="vertical" form={form} onFinish={(v) => upsert.mutate(v)}>
          <Form.Item
            name="parentId"
            label="الفئة الرئيسية"
            rules={[{ required: true, message: "اختر الفئة" }]}
          >
            <Select options={parentOptions} placeholder="اختر الفئة" />
          </Form.Item>
          <Form.Item name="name" label="اسم القسم" rules={[{ required: true }]}>
            <Input placeholder="أحمر الشفاه" />
          </Form.Item>
          <Form.Item name="slug" label="Slug">
            <Input placeholder="يُولَّد تلقائياً" />
          </Form.Item>
          <Form.Item name="description" label="الوصف">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name="imageId" label="صورة القسم">
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
    </Shell>
  );
}
