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
import { PageHeader } from "@/components/PageHeader";
import { MediaPicker } from "@/components/MediaPicker";
import { mutations, queries } from "@/lib/queries";
import { slugify } from "@/lib/slugify";

export default function SkinConcernsPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [form] = Form.useForm();

  const { data, isLoading } = useQuery({
    queryKey: ["skin-concerns-admin"],
    queryFn: () => queries.skinConcerns(true),
  });

  const upsert = useMutation({
    mutationFn: async (values: any) => {
      const payload = {
        ...values,
        slug: values.slug?.trim() || slugify(values.name, "concern"),
      };
      return editing?.id
        ? mutations.updateSkinConcern(editing.id, payload)
        : mutations.createSkinConcern(payload);
    },
    onSuccess: () => {
      message.success(editing ? "تم التحديث" : "تم الإنشاء");
      setOpen(false);
      qc.invalidateQueries({ queryKey: ["skin-concerns-admin"] });
      qc.invalidateQueries({ queryKey: ["skin-concerns"] });
    },
    onError: () => message.error("تعذر حفظ القسم"),
  });

  const remove = useMutation({
    mutationFn: mutations.deleteSkinConcern,
    onSuccess: () => {
      message.success("تم الحذف");
      qc.invalidateQueries({ queryKey: ["skin-concerns-admin"] });
      qc.invalidateQueries({ queryKey: ["skin-concerns"] });
    },
  });

  return (
    <>
      <Space direction="vertical" size={12} style={{ width: "100%" }}>
        <PageHeader
          title="دليل البشرة"
          subtitle="أقسام: حب شباب، تصبغات، جفاف، حساسية — تُربط بالمنتجات وتظهر في المتجر"
          extra={
            <Button
              type="primary"
              onClick={() => {
                setEditing(null);
                form.resetFields();
                form.setFieldsValue({ isActive: true, position: 0 });
                setOpen(true);
              }}
            >
              + قسم جديد
            </Button>
          }
        />
        <Card styles={{ body: { padding: 0 } }}>
          <Table
            rowKey="id"
            loading={isLoading}
            dataSource={data ?? []}
            columns={[
              { title: "الأيقونة", dataIndex: "icon", width: 70 },
              { title: "الاسم", dataIndex: "name" },
              { title: "Slug", dataIndex: "slug" },
              {
                title: "المنتجات",
                dataIndex: "productCount",
                render: (v) => v ?? "—",
              },
              { title: "الترتيب", dataIndex: "position", width: 80 },
              {
                title: "نشط",
                dataIndex: "isActive",
                render: (v) => <Tag color={v ? "green" : "red"}>{v ? "نشط" : "موقوف"}</Tag>,
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
                        form.setFieldsValue(r);
                        setOpen(true);
                      }}
                    >
                      تعديل
                    </Button>
                    <Popconfirm title="حذف القسم؟" onConfirm={() => remove.mutate(r.id)}>
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
        title={editing ? "تعديل قسم" : "قسم جديد"}
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
            <Input placeholder="حب شباب" />
          </Form.Item>
          <Form.Item name="slug" label="Slug (اختياري)">
            <Input placeholder="acne" />
          </Form.Item>
          <Form.Item name="description" label="الوصف">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="icon" label="أيقونة">
            <Input placeholder="🔴" />
          </Form.Item>
          <Form.Item name="imageId" label="صورة (للدوائر والبطاقات)">
            <MediaPicker label="اختر صورة المشكلة" />
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
