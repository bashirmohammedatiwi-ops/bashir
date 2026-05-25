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
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { mutations, queries } from "@/lib/queries";

type ShippingArea = {
  id: string;
  zoneId: string;
  name: string;
  fee: number | null;
  position: number;
  isActive: boolean;
};

type ShippingZone = {
  id: string;
  governorate: string;
  standardFee: number;
  position: number;
  isActive: boolean;
  areas?: ShippingArea[];
};

export default function ShippingPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [areasOpen, setAreasOpen] = useState(false);
  const [editing, setEditing] = useState<ShippingZone | null>(null);
  const [selectedZone, setSelectedZone] = useState<ShippingZone | null>(null);
  const [editingArea, setEditingArea] = useState<ShippingArea | null>(null);
  const [form] = Form.useForm();
  const [areaForm] = Form.useForm();

  const { data, isLoading } = useQuery({
    queryKey: ["shipping-zones"],
    queryFn: queries.shippingZones,
  });

  const upsert = useMutation({
    mutationFn: async (values: Partial<ShippingZone>) =>
      editing?.id
        ? mutations.updateShippingZone(editing.id, values)
        : mutations.createShippingZone(values),
    onSuccess: () => {
      message.success(editing ? "تم التحديث" : "تم الإنشاء");
      setOpen(false);
      qc.invalidateQueries({ queryKey: ["shipping-zones"] });
    },
    onError: () => message.error("تعذر حفظ المحافظة"),
  });

  const remove = useMutation({
    mutationFn: mutations.deleteShippingZone,
    onSuccess: () => {
      message.success("تم الحذف");
      qc.invalidateQueries({ queryKey: ["shipping-zones"] });
    },
  });

  const upsertArea = useMutation({
    mutationFn: async (values: Partial<ShippingArea> & { zoneId?: string }) => {
      if (editingArea?.id) {
        return mutations.updateShippingArea(editingArea.id, values);
      }
      return mutations.createShippingArea({
        zoneId: selectedZone!.id,
        ...values,
      });
    },
    onSuccess: () => {
      message.success(editingArea ? "تم تحديث المنطقة" : "تمت إضافة المنطقة");
      setEditingArea(null);
      areaForm.resetFields();
      qc.invalidateQueries({ queryKey: ["shipping-zones"] });
    },
    onError: () => message.error("تعذر حفظ المنطقة"),
  });

  const removeArea = useMutation({
    mutationFn: mutations.deleteShippingArea,
    onSuccess: () => {
      message.success("تم حذف المنطقة");
      qc.invalidateQueries({ queryKey: ["shipping-zones"] });
    },
  });

  const zones = (data ?? []) as ShippingZone[];

  useEffect(() => {
    if (!areasOpen || !selectedZone?.id) return;
    const updated = zones.find((z) => z.id === selectedZone.id);
    if (updated) setSelectedZone(updated);
  }, [areasOpen, selectedZone?.id, zones]);

  return (
    <>
      <Space direction="vertical" size={12} style={{ width: "100%" }}>
        <PageHeader
          title="الشحن والتوصيل"
          subtitle="محافظات العراق مع مناطق اختيارية — توصيل عادي أو استلام من الفرع"
          extra={
            <Button
              type="primary"
              onClick={() => {
                setEditing(null);
                form.resetFields();
                form.setFieldsValue({ isActive: true, position: 0, standardFee: 5000 });
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
            dataSource={zones}
            expandable={{
              expandedRowRender: (zone) => {
                const areas = zone.areas ?? [];
                if (!areas.length) {
                  return (
                    <div style={{ padding: "8px 0", color: "#888" }}>
                      لا توجد مناطق — سعر المحافظة ({zone.standardFee.toLocaleString()} د.ع) يُطبّق على كل المناطق.
                    </div>
                  );
                }
                return (
                  <Table
                    rowKey="id"
                    size="small"
                    pagination={false}
                    dataSource={areas}
                    columns={[
                      { title: "المنطقة", dataIndex: "name" },
                      {
                        title: "رسوم التوصيل",
                        dataIndex: "fee",
                        render: (v) =>
                          v == null ? (
                            <Tag>سعر المحافظة</Tag>
                          ) : (
                            `${v.toLocaleString()} د.ع`
                          ),
                      },
                      { title: "الترتيب", dataIndex: "position", width: 80 },
                      {
                        title: "نشط",
                        dataIndex: "isActive",
                        render: (v) => <Tag color={v ? "green" : "red"}>{v ? "نشط" : "موقوف"}</Tag>,
                      },
                    ]}
                  />
                );
              },
              rowExpandable: () => true,
            }}
            columns={[
              { title: "المحافظة", dataIndex: "governorate" },
              {
                title: "رسوم التوصيل",
                dataIndex: "standardFee",
                render: (v) => `${v?.toLocaleString()} د.ع`,
              },
              {
                title: "المناطق",
                render: (_: unknown, r: ShippingZone) =>
                  r.areas?.length ? `${r.areas.length} منطقة` : "—",
              },
              { title: "الترتيب", dataIndex: "position", width: 80 },
              {
                title: "نشط",
                dataIndex: "isActive",
                render: (v) => <Tag color={v ? "green" : "red"}>{v ? "نشط" : "موقوف"}</Tag>,
              },
              {
                title: "إجراءات",
                width: 260,
                render: (_: unknown, r: ShippingZone) => (
                  <Space wrap>
                    <Button
                      size="small"
                      onClick={() => {
                        setSelectedZone(r);
                        setEditingArea(null);
                        areaForm.resetFields();
                        areaForm.setFieldsValue({ isActive: true, position: 0 });
                        setAreasOpen(true);
                      }}
                    >
                      المناطق
                    </Button>
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
          <Form.Item name="standardFee" label="رسوم التوصيل الافتراضية" rules={[{ required: true }]}>
            <InputNumber style={{ width: "100%" }} min={0} />
          </Form.Item>
          <Form.Item name="position" label="الترتيب">
            <InputNumber style={{ width: "100%" }} min={0} />
          </Form.Item>
          <Form.Item name="isActive" label="نشط" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={`مناطق ${selectedZone?.governorate ?? ""}`}
        open={areasOpen}
        onCancel={() => {
          setAreasOpen(false);
          setEditingArea(null);
        }}
        footer={null}
        width={720}
        destroyOnHidden
      >
        <Space direction="vertical" size={12} style={{ width: "100%" }}>
          <Form layout="vertical" form={areaForm} onFinish={(v) => upsertArea.mutate(v)}>
            <Space.Compact block style={{ alignItems: "flex-start" }}>
              <Form.Item
                name="name"
                label={editingArea ? "تعديل المنطقة" : "منطقة جديدة"}
                style={{ flex: 2 }}
                rules={[{ required: true, message: "أدخل اسم المنطقة" }]}
              >
                <Input placeholder="الكرادة" />
              </Form.Item>
              <Form.Item
                name="fee"
                label="رسوم خاصة (اختياري)"
                style={{ flex: 1, marginInlineStart: 8 }}
                tooltip="اتركه فارغاً لاستخدام سعر المحافظة"
              >
                <InputNumber style={{ width: "100%" }} min={0} placeholder="افتراضي" />
              </Form.Item>
              <Form.Item name="position" label="الترتيب" style={{ flex: 0.7, marginInlineStart: 8 }}>
                <InputNumber style={{ width: "100%" }} min={0} />
              </Form.Item>
            </Space.Compact>
            <Space>
              <Form.Item name="isActive" label="نشط" valuePropName="checked" style={{ marginBottom: 0 }}>
                <Switch />
              </Form.Item>
              <Button type="primary" htmlType="submit" loading={upsertArea.isPending}>
                {editingArea ? "تحديث" : "إضافة"}
              </Button>
              {editingArea && (
                <Button
                  onClick={() => {
                    setEditingArea(null);
                    areaForm.resetFields();
                    areaForm.setFieldsValue({ isActive: true, position: 0 });
                  }}
                >
                  إلغاء التعديل
                </Button>
              )}
            </Space>
          </Form>

          <Table
            rowKey="id"
            size="small"
            pagination={false}
            dataSource={selectedZone?.areas ?? []}
            columns={[
              { title: "المنطقة", dataIndex: "name" },
              {
                title: "رسوم التوصيل",
                dataIndex: "fee",
                render: (v) =>
                  v == null ? (
                    <Tag>سعر المحافظة</Tag>
                  ) : (
                    `${v.toLocaleString()} د.ع`
                  ),
              },
              { title: "الترتيب", dataIndex: "position", width: 80 },
              {
                title: "نشط",
                dataIndex: "isActive",
                render: (v) => <Tag color={v ? "green" : "red"}>{v ? "نشط" : "موقوف"}</Tag>,
              },
              {
                title: "إجراءات",
                width: 140,
                render: (_: unknown, area: ShippingArea) => (
                  <Space>
                    <Button
                      size="small"
                      onClick={() => {
                        setEditingArea(area);
                        areaForm.setFieldsValue(area);
                      }}
                    >
                      تعديل
                    </Button>
                    <Popconfirm title="حذف المنطقة؟" onConfirm={() => removeArea.mutate(area.id)}>
                      <Button danger size="small">
                        حذف
                      </Button>
                    </Popconfirm>
                  </Space>
                ),
              },
            ]}
          />
        </Space>
      </Modal>
    </>
  );
}
