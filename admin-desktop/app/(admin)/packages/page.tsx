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
import { useState } from "react";
import { MediaPicker } from "@/components/MediaPicker";
import { mediaThumb } from "@/lib/mediaUrl";
import { mutations, queries } from "@/lib/queries";
import { slugify } from "@/lib/slugify";

const PACKAGE_KINDS = [
  { value: "GENERAL", label: "عامة" },
  { value: "ROUTINE_MORNING", label: "روتين صباحي" },
  { value: "ROUTINE_EVENING", label: "روتين مسائي" },
  { value: "BRIDAL_KIT", label: "Kit عروس" },
];

function toFormValues(row: any) {
  if (!row) return { isActive: true, position: 0, productIds: [], kind: "GENERAL" };
  return {
    name: row.name,
    slug: row.slug ?? "",
    kind: row.kind ?? "GENERAL",
    subtitle: row.subtitle ?? row.description ?? "",
    price: row.price,
    originalPrice: row.originalPrice,
    badge: row.badge,
    coverImageId: row.coverImageId ?? row.coverImage?.id,
    position: row.position,
    isActive: row.isActive,
    isFeatured: row.isFeatured,
    productIds:
      row.items?.map((i: any) => i.productId ?? i.product?.id).filter(Boolean) ?? [],
  };
}

function toPayload(values: any) {
  return {
    name: values.name,
    slug: values.slug?.trim() || slugify(values.name, "package"),
    kind: values.kind ?? "GENERAL",
    subtitle: values.subtitle,
    price: values.price,
    originalPrice: values.originalPrice,
    badge: values.badge,
    coverImageId: values.coverImageId ?? undefined,
    position: values.position,
    isActive: values.isActive,
    isFeatured: values.isFeatured,
    productIds: values.productIds ?? [],
  };
}

export default function PackagesPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [pushOpen, setPushOpen] = useState(false);
  const [pushTarget, setPushTarget] = useState<any | null>(null);
  const [editing, setEditing] = useState<any | null>(null);
  const [form] = Form.useForm();
  const [pushForm] = Form.useForm();

  const { data, isLoading } = useQuery({
    queryKey: ["packages"],
    queryFn: queries.packages,
  });
  const { data: productsData } = useQuery({
    queryKey: ["products-options"],
    queryFn: () => queries.products({ limit: 200 }),
    enabled: open,
    staleTime: 5 * 60_000,
  });
  const productOptions =
    productsData?.data?.map((p: any) => ({ value: p.id, label: p.name })) ?? [];

  const upsert = useMutation({
    mutationFn: async (values: any) => {
      const payload = toPayload(values);
      return editing?.id
        ? mutations.updatePackage(editing.id, payload)
        : mutations.createPackage(payload);
    },
    onSuccess: () => {
      message.success(editing ? "تم التحديث" : "تم الإنشاء");
      setOpen(false);
      qc.invalidateQueries({ queryKey: ["packages"] });
    },
    onError: () => message.error("تعذر حفظ الباقة"),
  });

  const remove = useMutation({
    mutationFn: mutations.deletePackage,
    onSuccess: () => {
      message.success("تم الحذف");
      qc.invalidateQueries({ queryKey: ["packages"] });
    },
  });

  const sendPush = useMutation({
    mutationFn: (values: any) =>
      mutations.createNotification({
        type: "OFFER",
        title: values.title,
        body: values.body,
        linkType: "PACKAGE",
        linkId: pushTarget?.id,
        targetType: "ALL",
        sendPush: true,
      }),
    onSuccess: () => {
      message.success("تم إرسال الإشعار");
      setPushOpen(false);
      pushForm.resetFields();
    },
    onError: () => message.error("تعذر إرسال الإشعار"),
  });

  return (
     <>
      <Space direction="vertical" size={12} style={{ width: "100%" }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <h2 style={{ margin: 0 }}>الباقات</h2>
          <Button
            type="primary"
            onClick={() => {
              setEditing(null);
              form.resetFields();
              form.setFieldsValue({ isActive: true, position: 0, productIds: [], kind: "GENERAL" });
              setOpen(true);
            }}
          >
            + باقة جديدة
          </Button>
        </div>
        <Card styles={{ body: { padding: 0 } }}>
          <Table
            rowKey="id"
            loading={isLoading}
            dataSource={data ?? []}
            columns={[
              {
                title: "الغلاف",
                width: 80,
                render: (_: any, r: any) => {
                  const url = mediaThumb(r.coverImage);
                  return (
                    <div
                      style={{
                        width: 56,
                        height: 40,
                        borderRadius: 6,
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
                title: "النوع",
                dataIndex: "kind",
                render: (v) => PACKAGE_KINDS.find((k) => k.value === v)?.label ?? v,
              },
              { title: "الوصف", dataIndex: "subtitle", ellipsis: true },
              {
                title: "المنتجات",
                render: (_: any, r: any) => r.items?.length ?? 0,
              },
              {
                title: "السعر",
                dataIndex: "price",
                render: (v) => `${v?.toLocaleString()} د.ع`,
              },
              {
                title: "السعر الأصلي",
                dataIndex: "originalPrice",
                render: (v) => (v ? `${v.toLocaleString()} د.ع` : "—"),
              },
              {
                title: "نشط",
                dataIndex: "isActive",
                render: (v) => (
                  <Tag color={v ? "green" : "red"}>{v ? "نشط" : "موقوف"}</Tag>
                ),
              },
              {
                title: "إجراءات",
                width: 260,
                render: (_: any, r: any) => (
                  <Space wrap>
                    <Button
                      size="small"
                      onClick={() => {
                        setPushTarget(r);
                        pushForm.setFieldsValue({
                          title: r.name,
                          body: r.subtitle || `اكتشفي ${r.name}`,
                        });
                        setPushOpen(true);
                      }}
                    >
                      Push
                    </Button>
                    <Button
                      size="small"
                      onClick={() => {
                        setEditing(r);
                        form.setFieldsValue(toFormValues(r));
                        setOpen(true);
                      }}
                    >
                      تعديل
                    </Button>
                    <Popconfirm
                      title="حذف الباقة؟"
                      okText="حذف"
                      cancelText="إلغاء"
                      onConfirm={() => remove.mutate(r.id)}
                    >
                      <Button danger size="small">
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
        title={editing ? "تعديل الباقة" : "باقة جديدة"}
        open={open}
        onCancel={() => setOpen(false)}
        onOk={() => form.submit()}
        confirmLoading={upsert.isPending}
        okText="حفظ"
        cancelText="إلغاء"
        destroyOnHidden
        width={560}
      >
        <Form layout="vertical" form={form} onFinish={(v) => upsert.mutate(v)}>
          <Form.Item name="name" label="الاسم" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="slug" label="Slug">
            <Input placeholder="morning-routine" />
          </Form.Item>
          <Form.Item name="kind" label="نوع الباقة" rules={[{ required: true }]}>
            <Select options={PACKAGE_KINDS} />
          </Form.Item>
          <Form.Item name="subtitle" label="الوصف المختصر">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name="badge" label="شارة">
            <Input placeholder="الأكثر مبيعاً" />
          </Form.Item>
          <Space.Compact block>
            <Form.Item
              name="price"
              label="السعر"
              style={{ flex: 1 }}
              rules={[{ required: true }]}
            >
              <InputNumber style={{ width: "100%" }} min={0} />
            </Form.Item>
            <Form.Item
              name="originalPrice"
              label="السعر الأصلي"
              style={{ flex: 1, marginInlineStart: 8 }}
            >
              <InputNumber style={{ width: "100%" }} min={0} />
            </Form.Item>
          </Space.Compact>
          <Form.Item name="coverImageId" label="صورة الغلاف">
            <MediaPicker />
          </Form.Item>
          <Form.Item name="productIds" label="منتجات الباقة">
            <Select
              mode="multiple"
              options={productOptions}
              placeholder="اختر المنتجات"
              optionFilterProp="label"
              showSearch
            />
          </Form.Item>
          <Form.Item name="position" label="الترتيب">
            <InputNumber style={{ width: "100%" }} min={0} />
          </Form.Item>
          <Form.Item name="isFeatured" label="مميزة" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item name="isActive" label="نشط" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={`إشعار Push — ${pushTarget?.name ?? ""}`}
        open={pushOpen}
        onCancel={() => setPushOpen(false)}
        onOk={() => pushForm.submit()}
        confirmLoading={sendPush.isPending}
        okText="إرسال"
        cancelText="إلغاء"
        destroyOnHidden
      >
        <Form layout="vertical" form={pushForm} onFinish={(v) => sendPush.mutate(v)}>
          <Form.Item name="title" label="العنوان" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="body" label="النص" rules={[{ required: true }]}>
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    
    </>
  );
}
