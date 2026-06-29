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
import { PageHeader } from "@/components/PageHeader";
import { MediaPicker } from "@/components/MediaPicker";
import { mediaThumb } from "@/lib/mediaUrl";
import { apiErrorMessage } from "@/lib/apiError";
import { mutations, queries } from "@/lib/queries";
import { slugify } from "@/lib/slugify";

export default function TertiarySectionsPage() {
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

  const { data: subcategoriesData } = useQuery({
    queryKey: ["subcategories"],
    queryFn: () => queries.subcategories(),
  });

  const { data, isLoading } = useQuery({
    queryKey: ["tertiary-sections", parentFilter, search],
    queryFn: () =>
      queries.tertiarySections({
        parentId: parentFilter,
        search: search || undefined,
      }),
  });

  const parentOptions = useMemo(
    () =>
      (subcategoriesData ?? []).map((s: any) => ({
        value: s.id,
        label: `${s.parent?.name ? `${s.parent.name} › ` : ""}${s.name}`,
      })),
    [subcategoriesData],
  );

  const upsert = useMutation({
    mutationFn: async (values: any) => {
      const payload = {
        ...values,
        slug: values.slug?.trim() || slugify(values.name, "section"),
      };
      return editing?.id
        ? mutations.updateTertiarySection(editing.id, payload)
        : mutations.createTertiarySection(payload);
    },
    onSuccess: () => {
      message.success(editing ? "تم التحديث" : "تم إنشاء القسم الثانوي");
      setOpen(false);
      setEditing(null);
      qc.invalidateQueries({ queryKey: ["tertiary-sections"] });
      qc.invalidateQueries({ queryKey: ["subcategories"] });
      qc.invalidateQueries({ queryKey: ["categories"] });
    },
    onError: (e) => {
      message.error(apiErrorMessage(e, "فشل الحفظ"));
    },
  });

  const remove = useMutation({
    mutationFn: mutations.deleteTertiarySection,
    onSuccess: () => {
      message.success("تم الحذف");
      qc.invalidateQueries({ queryKey: ["tertiary-sections"] });
      qc.invalidateQueries({ queryKey: ["subcategories"] });
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
      imageId: row.imageId ?? row.image?.id,
      position: row.position,
      isActive: row.isActive,
    });
    setOpen(true);
  }

  const rows = data ?? [];

  return (
    <div className="alhayaa-page">
      <PageHeader
        title="الأقسام الثانوية"
        subtitle="المستوى الثالث — داخل كل قسم فرعي"
        extra={
          <Space>
            <Link href="/subcategories">
              <Button>أقسام فرعية</Button>
            </Link>
            <Link href="/categories">
              <Button>الأقسام</Button>
            </Link>
            <Button type="primary" onClick={openCreate} disabled={!parentOptions.length}>
              + قسم ثانوي
            </Button>
          </Space>
        }
      />

      <Card className="alhayaa-table-card" bordered={false}>
        <Space wrap style={{ marginBottom: 12 }}>
          <Select
            allowClear
            placeholder="فلترة حسب القسم الفرعي"
            style={{ width: 280 }}
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
                      background: url ? `center/cover url(${url})` : "#f0f0f5",
                    }}
                  />
                );
              },
            },
            { title: "الاسم", dataIndex: "name" },
            {
              title: "القسم الفرعي",
              render: (_: any, r: any) => (
                <Tag color="blue">{r.parent?.name ?? r.parentName ?? "—"}</Tag>
              ),
            },
            {
              title: "القسم الرئيسي",
              render: (_: any, r: any) => (
                <Tag color="purple">
                  {r.parent?.parent?.name ?? r.grandparentName ?? "—"}
                </Tag>
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
                    title="حذف القسم الثانوي؟"
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

      <Modal
        title={editing ? "تعديل القسم الثانوي" : "قسم ثانوي جديد"}
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
            label="القسم الفرعي"
            rules={[{ required: true, message: "اختر القسم الفرعي" }]}
          >
            <Select options={parentOptions} placeholder="اختر القسم الفرعي" />
          </Form.Item>
          <Form.Item name="name" label="اسم القسم الثانوي" rules={[{ required: true }]}>
            <Input placeholder="مثال: أحمر شفاه مات" />
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
    </div>
  );
}
