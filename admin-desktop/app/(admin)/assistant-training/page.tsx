"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Card, Form, Input, InputNumber, Modal, Popconfirm, Select, Space, Switch, Table, Tag, message } from "antd";
import { useState } from "react";
import { mutations, queries } from "@/lib/queries";

const TYPES = [
  { value: "promote", label: "روّج لهالمنتج" },
  { value: "hide", label: "لا تعرضه" },
  { value: "note", label: "ملاحظة للمساعد" },
];

const CONCERNS = [
  { value: "", label: "كل المشاكل" },
  { value: "hairloss", label: "تساقط" },
  { value: "dandruff", label: "قشرة" },
  { value: "dry", label: "جفاف" },
  { value: "oily", label: "دهون" },
  { value: "colored", label: "شعر مصبوغ" },
  { value: "pigment", label: "تفتيح" },
  { value: "acne", label: "حبوب" },
  { value: "sensitive", label: "بشرة حساسة" },
];

export default function AssistantTrainingPage() {
  const { data, isLoading } = useQuery({ queryKey: ["assistant-guides"], queryFn: queries.assistantGuides });
  const rows = Array.isArray(data) ? data : [];
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [form] = Form.useForm();
  const [productOptions, setProductOptions] = useState<Array<{ value: string; label: string }>>([]);

  const searchProducts = async (search: string) => {
    if (search.trim().length < 2) return;
    const page = await queries.products({ search, limit: 8, page: 1 });
    setProductOptions(
      (page.data ?? []).map((item: any) => ({
        value: item.id,
        label: `${item.nameAr || item.name || item.nameEn} · ${item.brand?.name ?? ""}`,
      })),
    );
  };

  const save = useMutation({
    mutationFn: async (values: any) => {
      const payload = {
        type: values.type,
        concern: values.concern || null,
        productId: values.productId || null,
        note: values.note || "",
        priority: values.priority ?? 5,
        isActive: values.isActive !== false,
      };
      return editing?.id ? mutations.updateAssistantGuide(editing.id, payload) : mutations.createAssistantGuide(payload);
    },
    onSuccess: () => {
      message.success("تم حفظ التدريب");
      setOpen(false);
      qc.invalidateQueries({ queryKey: ["assistant-guides"] });
    },
  });

  const remove = useMutation({
    mutationFn: mutations.deleteAssistantGuide,
    onSuccess: () => {
      message.success("تم الحذف");
      qc.invalidateQueries({ queryKey: ["assistant-guides"] });
    },
  });

  return (
    <Card
      title="تدريب المساعد فضه"
      extra={
        <Button
          type="primary"
          onClick={() => {
            setEditing(null);
            form.resetFields();
            form.setFieldsValue({ type: "promote", priority: 5, isActive: true, concern: "" });
            setOpen(true);
          }}
        >
          قاعدة جديدة
        </Button>
      }
    >
      <p style={{ marginTop: 0 }}>
        روّجي لمنتج داخل مشكلة معينة، أو امنعي منتجاً، أو اتركي ملاحظة تقرأها فضه. المنتج المروَّج يتقدم فقط إذا هو مناسب للطلب.
      </p>
      <Table
        rowKey="id"
        loading={isLoading}
        dataSource={rows}
        pagination={false}
        columns={[
          {
            title: "النوع",
            dataIndex: "type",
            render: (type: string) => <Tag>{TYPES.find((item) => item.value === type)?.label ?? type}</Tag>,
          },
          {
            title: "المشكلة",
            dataIndex: "concern",
            render: (concern: string) => CONCERNS.find((item) => item.value === concern)?.label ?? "كل المشاكل",
          },
          { title: "ملاحظة", dataIndex: "note" },
          { title: "أولوية", dataIndex: "priority" },
          {
            title: "مفعل",
            dataIndex: "isActive",
            render: (active: boolean) => (active ? "نعم" : "لا"),
          },
          {
            title: "",
            render: (_: unknown, row: any) => (
              <Space>
                <Button
                  size="small"
                  onClick={() => {
                    setEditing(row);
                    form.setFieldsValue({ ...row, concern: row.concern ?? "" });
                    setOpen(true);
                  }}
                >
                  تعديل
                </Button>
                <Popconfirm title="حذف القاعدة؟" onConfirm={() => remove.mutate(row.id)}>
                  <Button size="small" danger>
                    حذف
                  </Button>
                </Popconfirm>
              </Space>
            ),
          },
        ]}
      />
      <Modal
        title={editing ? "تعديل القاعدة" : "قاعدة جديدة"}
        open={open}
        onCancel={() => setOpen(false)}
        onOk={() => form.submit()}
        confirmLoading={save.isPending}
      >
        <Form form={form} layout="vertical" onFinish={(values) => save.mutate(values)}>
          <Form.Item name="type" label="النوع" rules={[{ required: true }]}>
            <Select options={TYPES} />
          </Form.Item>
          <Form.Item name="concern" label="المشكلة">
            <Select options={CONCERNS} />
          </Form.Item>
          <Form.Item name="productId" label="المنتج">
            <Select
              showSearch
              allowClear
              filterOption={false}
              options={productOptions}
              onSearch={searchProducts}
              placeholder="اكتبي اسم المنتج"
            />
          </Form.Item>
          <Form.Item name="note" label="الملاحظة">
            <Input.TextArea rows={3} placeholder="مثال: قدّمي خط لوريال للتساقط إذا السعر مناسب" />
          </Form.Item>
          <Form.Item name="priority" label="الأولوية">
            <InputNumber min={0} max={100} />
          </Form.Item>
          <Form.Item name="isActive" label="مفعل" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}
