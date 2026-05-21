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
  Switch,
  Table,
  Tag,
  message,
} from "antd";
import { useState } from "react";
import { mutations, queries } from "@/lib/queries";

const TYPE_LABELS: Record<string, string> = {
  HERO_BANNER: "بنر رئيسي",
  CATEGORY_GRID: "شبكة الفئات",
  PRODUCT_LIST: "قائمة منتجات",
  FEATURED_BRANDS: "براندات مميزة",
  PACKAGES: "الباقات",
  FLASH_SALE: "تخفيضات سريعة",
  PROMO_STRIP: "شريط ترويجي",
  CUSTOM_BANNER: "بنر مخصص",
};

const BLOCK_TYPES = Object.entries(TYPE_LABELS).map(([value, label]) => ({ value, label }));

export default function HomeBlocksPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["home-blocks"],
    queryFn: queries.homeBlocks,
  });
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [form] = Form.useForm();

  const update = useMutation({
    mutationFn: ({ id, data }: any) => mutations.updateHomeBlock(id, data),
    onSuccess: () => {
      message.success("تم التحديث");
      qc.invalidateQueries({ queryKey: ["home-blocks"] });
    },
  });

  const upsert = useMutation({
    mutationFn: async (values: any) => {
      const payload = {
        ...values,
        payload: values.payloadJson ? JSON.parse(values.payloadJson) : {},
      };
      delete payload.payloadJson;
      if (editing?.id) return mutations.updateHomeBlock(editing.id, payload);
      return mutations.createHomeBlock(payload);
    },
    onSuccess: () => {
      message.success(editing ? "تم التحديث" : "تم الإنشاء");
      setOpen(false);
      qc.invalidateQueries({ queryKey: ["home-blocks"] });
    },
    onError: () => message.error("تحقق من صيغة JSON"),
  });

  const remove = useMutation({
    mutationFn: mutations.deleteHomeBlock,
    onSuccess: () => {
      message.success("تم الحذف");
      qc.invalidateQueries({ queryKey: ["home-blocks"] });
    },
  });

  const reorder = useMutation({
    mutationFn: mutations.reorderHomeBlocks,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["home-blocks"] }),
  });

  const sorted = [...(data ?? [])].sort(
    (a: any, b: any) => (a.position ?? 0) - (b.position ?? 0),
  );

  function moveBlock(id: string, dir: -1 | 1) {
    const idx = sorted.findIndex((b: any) => b.id === id);
    if (idx < 0) return;
    const next = idx + dir;
    if (next < 0 || next >= sorted.length) return;
    const ids = sorted.map((b: any) => b.id);
    [ids[idx], ids[next]] = [ids[next], ids[idx]];
    reorder.mutate(ids);
  }

  return (
     <>
      <Space direction="vertical" size={12} style={{ width: "100%" }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <h2 style={{ margin: 0 }}>أقسام الصفحة الرئيسية</h2>
          <Button
            type="primary"
            onClick={() => {
              setEditing(null);
              form.resetFields();
              form.setFieldsValue({ isActive: true, type: "PRODUCT_LIST", position: 0, payloadJson: "{}" });
              setOpen(true);
            }}
          >
            + قسم جديد
          </Button>
        </div>
        <Card styles={{ body: { padding: 0 } }}>
          <Table
            rowKey="id"
            loading={isLoading}
            dataSource={sorted}
            pagination={false}
            columns={[
              {
                title: "النوع",
                dataIndex: "type",
                render: (v) => <Tag color="purple">{TYPE_LABELS[v] ?? v}</Tag>,
              },
              { title: "العنوان", dataIndex: "title" },
              { title: "العنوان الفرعي", dataIndex: "subtitle" },
              { title: "الترتيب", dataIndex: "position", width: 90 },
              {
                title: "نشط",
                dataIndex: "isActive",
                width: 90,
                render: (v, r: any) => (
                  <Switch
                    checked={v}
                    loading={update.isPending}
                    onChange={(checked) =>
                      update.mutate({ id: r.id, data: { isActive: checked } })
                    }
                  />
                ),
              },
              {
                title: "إجراءات",
                width: 220,
                render: (_: any, r: any) => (
                  <Space>
                    <Button size="small" onClick={() => moveBlock(r.id, -1)}>
                      ↑
                    </Button>
                    <Button size="small" onClick={() => moveBlock(r.id, 1)}>
                      ↓
                    </Button>
                    <Button
                      size="small"
                      onClick={() => {
                        setEditing(r);
                        form.setFieldsValue({
                          ...r,
                          payloadJson: JSON.stringify(r.payload ?? {}, null, 2),
                        });
                        setOpen(true);
                      }}
                    >
                      تعديل
                    </Button>
                    <Popconfirm title="حذف؟" onConfirm={() => remove.mutate(r.id)}>
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
        title={editing ? "تعديل القسم" : "قسم جديد"}
        open={open}
        onCancel={() => setOpen(false)}
        onOk={() => form.submit()}
        confirmLoading={upsert.isPending}
        okText="حفظ"
        cancelText="إلغاء"
        width={560}
      >
        <Form layout="vertical" form={form} onFinish={(v) => upsert.mutate(v)}>
          <Form.Item name="type" label="النوع" rules={[{ required: true }]}>
            <Select options={BLOCK_TYPES} />
          </Form.Item>
          <Form.Item name="title" label="العنوان">
            <Input />
          </Form.Item>
          <Form.Item name="subtitle" label="العنوان الفرعي">
            <Input />
          </Form.Item>
          <Form.Item name="position" label="الترتيب">
            <Input type="number" />
          </Form.Item>
          <Form.Item name="payloadJson" label="إعدادات JSON">
            <Input.TextArea rows={4} placeholder='{"filter":"bestSeller"}' />
          </Form.Item>
          <Form.Item name="isActive" label="نشط" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    
    </>
  );
}
