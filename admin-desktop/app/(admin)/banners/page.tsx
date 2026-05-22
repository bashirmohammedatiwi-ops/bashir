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
import { useState } from "react";
import { MediaPicker } from "@/components/MediaPicker";
import { mediaThumb } from "@/lib/mediaUrl";
import { mutations, queries } from "@/lib/queries";

function toFormValues(row: any) {
  if (!row) return { isActive: true, position: 0 };
  return {
    title: row.title,
    subtitle: row.subtitle,
    tag: row.tag,
    ctaLabel: row.ctaLabel,
    link: row.link ?? row.ctaUrl ?? "",
    imageId: row.imageId ?? row.image?.id,
    position: row.position,
    isActive: row.isActive,
    startsAt: row.startsAt,
    endsAt: row.endsAt,
  };
}

function toPayload(values: any) {
  return {
    title: values.title,
    subtitle: values.subtitle,
    tag: values.tag,
    ctaLabel: values.ctaLabel,
    link: values.link ?? values.ctaUrl ?? undefined,
    imageId: values.imageId ?? undefined,
    position: values.position,
    isActive: values.isActive,
    startsAt: values.startsAt,
    endsAt: values.endsAt,
  };
}

export default function BannersPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["banners"],
    queryFn: queries.banners,
  });
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [form] = Form.useForm();

  const upsert = useMutation({
    mutationFn: async (values: any) => {
      const payload = toPayload(values);
      return editing?.id
        ? mutations.updateBanner(editing.id, payload)
        : mutations.createBanner(payload);
    },
    onSuccess: () => {
      message.success(editing ? "تم التحديث" : "تم الإنشاء");
      setOpen(false);
      qc.invalidateQueries({ queryKey: ["banners"] });
    },
    onError: () => message.error("تعذر حفظ البنر"),
  });

  const remove = useMutation({
    mutationFn: mutations.deleteBanner,
    onSuccess: () => {
      message.success("تم الحذف");
      qc.invalidateQueries({ queryKey: ["banners"] });
    },
  });

  return (
     <>
      <Space direction="vertical" size={12} style={{ width: "100%" }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <h2 style={{ margin: 0 }}>البنرات الترويجية</h2>
          <Button
            type="primary"
            onClick={() => {
              setEditing(null);
              form.resetFields();
              form.setFieldsValue({ isActive: true, position: 0 });
              setOpen(true);
            }}
          >
            + بنر جديد
          </Button>
        </div>
        <Card styles={{ body: { padding: 0 } }}>
          <Table
            rowKey="id"
            loading={isLoading}
            dataSource={data ?? []}
            columns={[
              {
                title: "الصورة",
                width: 80,
                render: (_: any, r: any) => {
                  const url = mediaThumb(r.image);
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
              { title: "العنوان", dataIndex: "title" },
              { title: "العنوان الفرعي", dataIndex: "subtitle" },
              {
                title: "الرابط",
                render: (_: any, r: any) => r.link ?? r.ctaUrl ?? "—",
              },
              { title: "الترتيب", dataIndex: "position", width: 90 },
              {
                title: "الحالة",
                dataIndex: "isActive",
                render: (v) => (
                  <Tag color={v ? "green" : "red"}>{v ? "نشط" : "مخفي"}</Tag>
                ),
              },
              {
                title: "إجراءات",
                width: 180,
                render: (_: any, r: any) => (
                  <Space>
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
                      title="حذف البنر؟"
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
        title={editing ? "تعديل البنر" : "بنر جديد"}
        open={open}
        onCancel={() => setOpen(false)}
        onOk={() => form.submit()}
        confirmLoading={upsert.isPending}
        okText="حفظ"
        cancelText="إلغاء"
        destroyOnHidden
        width={520}
      >
        <Form layout="vertical" form={form} onFinish={(v) => upsert.mutate(v)}>
          <Form.Item name="title" label="العنوان" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="subtitle" label="العنوان الفرعي">
            <Input />
          </Form.Item>
          <Form.Item name="tag" label="وسم">
            <Input placeholder="جديد / خصم 30%" />
          </Form.Item>
          <Form.Item name="ctaLabel" label="نص الزر">
            <Input placeholder="تسوق الآن" />
          </Form.Item>
          <Form.Item name="link" label="رابط الزر">
            <Input placeholder="/products?sale=1" />
          </Form.Item>
          <Form.Item name="imageId" label="صورة البنر">
            <MediaPicker />
          </Form.Item>
          <Form.Item name="position" label="الترتيب">
            <InputNumber style={{ width: "100%" }} min={0} />
          </Form.Item>
          <Form.Item name="isActive" label="نشط" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    
    </>
  );
}
