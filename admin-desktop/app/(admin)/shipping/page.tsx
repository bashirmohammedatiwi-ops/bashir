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
import { mutations, queries } from "@/lib/queries";

export default function ShippingPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [form] = Form.useForm();

  const { data, isLoading } = useQuery({
    queryKey: ["shipping-zones"],
    queryFn: queries.shippingZones,
  });

  const upsert = useMutation({
    mutationFn: async (values: any) =>
      editing?.id
        ? mutations.updateShippingZone(editing.id, values)
        : mutations.createShippingZone(values),
    onSuccess: () => {
      message.success(editing ? "تم التحديث" : "تم الإنشاء");
      setOpen(false);
      qc.invalidateQueries({ queryKey: ["shipping-zones"] });
    },
    onError: () => message.error("تعذر حفظ المنطقة"),
  });

  const remove = useMutation({
    mutationFn: mutations.deleteShippingZone,
    onSuccess: () => {
      message.success("تم الحذف");
      qc.invalidateQueries({ queryKey: ["shipping-zones"] });
    },
  });

  return (
    <>
      <Space direction="vertical" size={12} style={{ width: "100%" }}>
        <PageHeader
          title="الشحن والتوصيل"
          subtitle="محافظات العراق — STANDARD / EXPRESS / PICKUP (استلام من الفرع في الإعدادات)"
          extra={
            <Button
              type="primary"
              onClick={() => {
                setEditing(null);
                form.resetFields();
                form.setFieldsValue({ isActive: true, position: 0, standardFee: 5000, expressFee: 8000 });
                setOpen(true);
              }}
            >
              + محافظة
            </Button>
          }
        />
        <Card styles={{ body: { padding: 0 } }}>
          <Table
            rowKey="id"
            loading={isLoading}
            dataSource={data ?? []}
            columns={[
              { title: "المحافظة", dataIndex: "governorate" },
              {
                title: "شحن عادي",
                dataIndex: "standardFee",
                render: (v) => `${v?.toLocaleString()} د.ع`,
              },
              {
                title: "شحن سريع",
                dataIndex: "expressFee",
                render: (v) => `${v?.toLocaleString()} د.ع`,
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
                    <Popconfirm title="حذف المحافظة؟" onConfirm={() => remove.mutate(r.id)}>
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
        title={editing ? "تعديل محافظة" : "محافظة جديدة"}
        open={open}
        onCancel={() => setOpen(false)}
        onOk={() => form.submit()}
        confirmLoading={upsert.isPending}
        okText="حفظ"
        cancelText="إلغاء"
        destroyOnHidden
      >
        <Form layout="vertical" form={form} onFinish={(v) => upsert.mutate(v)}>
          <Form.Item name="governorate" label="المحافظة" rules={[{ required: true }]}>
            <Input placeholder="بغداد" />
          </Form.Item>
          <Space.Compact block>
            <Form.Item name="standardFee" label="رسوم عادي" style={{ flex: 1 }} rules={[{ required: true }]}>
              <InputNumber style={{ width: "100%" }} min={0} />
            </Form.Item>
            <Form.Item
              name="expressFee"
              label="رسوم سريع"
              style={{ flex: 1, marginInlineStart: 8 }}
              rules={[{ required: true }]}
            >
              <InputNumber style={{ width: "100%" }} min={0} />
            </Form.Item>
          </Space.Compact>
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
