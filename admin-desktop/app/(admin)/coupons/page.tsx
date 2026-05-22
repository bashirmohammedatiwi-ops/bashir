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
import { mutations, queries } from "@/lib/queries";

const COUPON_TYPES = [
  { value: "PERCENT", label: "نسبة مئوية %" },
  { value: "AMOUNT", label: "مبلغ ثابت" },
  { value: "FREE_SHIPPING", label: "شحن مجاني" },
  { value: "FIRST_ORDER", label: "أول طلب" },
];

function toFormValues(row: any) {
  return {
    code: row.code,
    type: row.type,
    value: row.value,
    description: row.description,
    minOrder: row.minOrder,
    maxRedemptions: row.maxRedemptions,
    isActive: row.isActive,
  };
}

function toPayload(values: any) {
  return {
    code: values.code,
    type: values.type,
    value: values.value,
    description: values.description,
    minOrder: values.minOrder,
    maxRedemptions: values.maxRedemptions,
    isActive: values.isActive,
  };
}

export default function CouponsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["coupons"],
    queryFn: queries.coupons,
  });
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [form] = Form.useForm();

  const upsert = useMutation({
    mutationFn: async (values: any) => {
      const payload = toPayload(values);
      return editing?.id
        ? mutations.updateCoupon(editing.id, payload)
        : mutations.createCoupon(payload);
    },
    onSuccess: () => {
      message.success(editing ? "تم التحديث" : "تم الإنشاء");
      setOpen(false);
      qc.invalidateQueries({ queryKey: ["coupons"] });
    },
  });

  const remove = useMutation({
    mutationFn: mutations.deleteCoupon,
    onSuccess: () => {
      message.success("تم الحذف");
      qc.invalidateQueries({ queryKey: ["coupons"] });
    },
  });

  return (
     <>
      <Space direction="vertical" size={12} style={{ width: "100%" }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <h2 style={{ margin: 0 }}>الكوبونات</h2>
          <Button
            type="primary"
            onClick={() => {
              setEditing(null);
              form.resetFields();
              form.setFieldsValue({ isActive: true, type: "PERCENT", value: 10 });
              setOpen(true);
            }}
          >
            + كوبون جديد
          </Button>
        </div>
        <Card styles={{ body: { padding: 0 } }}>
          <Table
            rowKey="id"
            loading={isLoading}
            dataSource={data ?? []}
            columns={[
              { title: "الكود", dataIndex: "code" },
              {
                title: "النوع",
                dataIndex: "type",
                render: (v) => (
                  <Tag>{COUPON_TYPES.find((t) => t.value === v)?.label ?? v}</Tag>
                ),
              },
              {
                title: "القيمة",
                dataIndex: "value",
                render: (v: any, r: any) =>
                  r.type === "PERCENT" || r.type === "FIRST_ORDER"
                    ? `${v}%`
                    : r.type === "FREE_SHIPPING"
                      ? "—"
                      : `${v?.toLocaleString()} د.ع`,
              },
              { title: "الحد الأدنى", dataIndex: "minOrder", render: (v) => v?.toLocaleString?.() ?? v },
              { title: "حد الاستخدام", dataIndex: "maxRedemptions" },
              { title: "المستخدم", dataIndex: "redeemedCount" },
              {
                title: "نشط",
                dataIndex: "isActive",
                render: (v) => (
                  <Tag color={v ? "green" : "red"}>{v ? "نشط" : "موقوف"}</Tag>
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
                      title="حذف الكوبون؟"
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
        title={editing ? "تعديل كوبون" : "كوبون جديد"}
        open={open}
        onCancel={() => setOpen(false)}
        onOk={() => form.submit()}
        confirmLoading={upsert.isPending}
        okText="حفظ"
        cancelText="إلغاء"
        destroyOnHidden
      >
        <Form layout="vertical" form={form} onFinish={(v) => upsert.mutate(v)}>
          <Form.Item name="code" label="الكود" rules={[{ required: true }]}>
            <Input style={{ textTransform: "uppercase" }} />
          </Form.Item>
          <Form.Item name="type" label="النوع" rules={[{ required: true }]}>
            <Select options={COUPON_TYPES} />
          </Form.Item>
          <Form.Item name="value" label="القيمة (% أو مبلغ)" rules={[{ required: true }]}>
            <InputNumber style={{ width: "100%" }} min={0} />
          </Form.Item>
          <Form.Item name="description" label="الوصف">
            <Input />
          </Form.Item>
          <Form.Item name="minOrder" label="الحد الأدنى للطلب">
            <InputNumber style={{ width: "100%" }} min={0} />
          </Form.Item>
          <Form.Item name="maxRedemptions" label="حد الاستخدام">
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
