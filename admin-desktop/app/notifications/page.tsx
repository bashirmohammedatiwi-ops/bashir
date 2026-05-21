"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Button,
  Card,
  Form,
  Input,
  Modal,
  Popconfirm,
  Select,
  Space,
  Table,
  Tag,
  message,
} from "antd";
import { useState } from "react";
import { Shell } from "@/components/Shell";
import { mutations, queries } from "@/lib/queries";

const TYPES = [
  { value: "OFFER", label: "عرض" },
  { value: "ORDER", label: "طلب" },
  { value: "NEW_ARRIVAL", label: "وصول جديد" },
  { value: "REMINDER", label: "تذكير" },
];

export default function NotificationsPage() {
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => queries.notifications({ page: 1, limit: 50 }),
  });

  const create = useMutation({
    mutationFn: mutations.createNotification,
    onSuccess: () => {
      message.success("تم إرسال الإشعار");
      setOpen(false);
      form.resetFields();
      qc.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const remove = useMutation({
    mutationFn: mutations.deleteNotification,
    onSuccess: () => {
      message.success("تم الحذف");
      qc.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const items = data?.data ?? [];

  return (
    <Shell>
      <Space direction="vertical" size={12} style={{ width: "100%" }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <h2 style={{ margin: 0 }}>الإشعارات</h2>
          <Button type="primary" onClick={() => setOpen(true)}>
            + إشعار جديد
          </Button>
        </div>
        <Card styles={{ body: { padding: 0 } }}>
          <Table
            rowKey="id"
            loading={isLoading}
            dataSource={items}
            pagination={false}
            columns={[
              {
                title: "النوع",
                dataIndex: "type",
                render: (v) => <Tag>{TYPES.find((t) => t.value === v)?.label ?? v}</Tag>,
              },
              { title: "العنوان", dataIndex: "title" },
              { title: "المحتوى", dataIndex: "body", ellipsis: true },
              {
                title: "المستخدم",
                render: (_: any, r: any) => r.user?.name ?? r.user?.email ?? "الجميع",
              },
              {
                title: "التاريخ",
                dataIndex: "createdAt",
                render: (v) => (v ? new Date(v).toLocaleString("ar-IQ") : "-"),
              },
              {
                title: "إجراءات",
                render: (_: any, r: any) => (
                  <Popconfirm title="حذف؟" onConfirm={() => remove.mutate(r.id)}>
                    <Button danger size="small">
                      حذف
                    </Button>
                  </Popconfirm>
                ),
              },
            ]}
          />
        </Card>
      </Space>

      <Modal
        title="إرسال إشعار"
        open={open}
        onCancel={() => setOpen(false)}
        onOk={() => form.submit()}
        confirmLoading={create.isPending}
        okText="إرسال"
        cancelText="إلغاء"
      >
        <Form layout="vertical" form={form} onFinish={(v) => create.mutate(v)}>
          <Form.Item name="type" label="النوع" initialValue="OFFER">
            <Select options={TYPES} />
          </Form.Item>
          <Form.Item name="title" label="العنوان" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="body" label="المحتوى" rules={[{ required: true }]}>
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="userId" label="معرّف المستخدم (اختياري — فارغ = للجميع)">
            <Input placeholder="اتركه فارغاً للإشعار العام" />
          </Form.Item>
        </Form>
      </Modal>
    </Shell>
  );
}
