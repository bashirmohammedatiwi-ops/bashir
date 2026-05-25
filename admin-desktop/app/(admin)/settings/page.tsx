"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Card, Form, Input, InputNumber, Space, Switch, Tabs, message } from "antd";
import { useEffect } from "react";
import { PageHeader } from "@/components/PageHeader";
import { mutations, queries } from "@/lib/queries";

interface Settings {
  storeName: string;
  currency: string;
  whatsapp: string;
  supportPhone: string;
  taxPercent: number;
  shippingFee: number;
  freeShippingThreshold: number;
  cashOnDelivery: boolean;
  emailOrders: string;
  flashSaleEndsAt: string | null;
  firstOrderBonusPoints: number;
  pickupEnabled?: boolean;
  pickupAddress?: string;
  pickupHours?: string;
  loyaltyTiers?: Record<string, number>;
  redeem100PointsValue?: number;
  pointsPer1000Iqd?: number;
  lowStockThreshold?: number;
  stockAlertPushEnabled?: boolean;
  stockAlertCooldownHours?: number;
}

export default function SettingsPage() {
  const [form] = Form.useForm<Settings>();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["settings"],
    queryFn: queries.settings,
  });

  useEffect(() => {
    if (data) form.setFieldsValue(data);
  }, [data, form]);

  const save = useMutation({
    mutationFn: (v: Settings) => mutations.updateSettings(v),
    onSuccess: () => {
      message.success("تم حفظ الإعدادات");
      qc.invalidateQueries({ queryKey: ["settings"] });
    },
  });

  return (
    <>
      <Space direction="vertical" size={12} style={{ width: "100%" }}>
        <PageHeader title="الإعدادات" subtitle="إعدادات المتجر من السيرفر" />
        <Card loading={isLoading}>
          <Form form={form} layout="vertical" onFinish={(v) => save.mutate(v)}>
            <Tabs
              items={[
                {
                  key: "store",
                  label: "المتجر",
                  children: (
                    <>
                      <Space.Compact block>
                        <Form.Item name="storeName" label="اسم المتجر" style={{ flex: 1 }}>
                          <Input />
                        </Form.Item>
                        <Form.Item name="currency" label="العملة" style={{ flex: 1, marginInlineStart: 8 }}>
                          <Input />
                        </Form.Item>
                      </Space.Compact>
                      <Form.Item name="whatsapp" label="واتساب">
                        <Input />
                      </Form.Item>
                      <Form.Item name="supportPhone" label="هاتف الدعم">
                        <Input />
                      </Form.Item>
                      <Form.Item name="emailOrders" label="بريد الطلبات">
                        <Input type="email" />
                      </Form.Item>
                    </>
                  ),
                },
                {
                  key: "shipping",
                  label: "الشحن والدفع",
                  children: (
                    <>
                      <Space.Compact block>
                        <Form.Item name="shippingFee" label="رسوم الشحن الافتراضية" style={{ flex: 1 }}>
                          <InputNumber style={{ width: "100%" }} min={0} />
                        </Form.Item>
                        <Form.Item name="freeShippingThreshold" label="شحن مجاني عند" style={{ flex: 1, marginInlineStart: 8 }}>
                          <InputNumber style={{ width: "100%" }} min={0} />
                        </Form.Item>
                      </Space.Compact>
                      <Form.Item name="taxPercent" label="نسبة الضريبة %">
                        <InputNumber style={{ width: "100%" }} min={0} max={100} />
                      </Form.Item>
                      <Form.Item name="cashOnDelivery" label="الدفع عند الاستلام" valuePropName="checked">
                        <Switch />
                      </Form.Item>
                      <Form.Item name="pickupEnabled" label="استلام من الفرع" valuePropName="checked">
                        <Switch />
                      </Form.Item>
                      <Form.Item name="pickupAddress" label="عنوان الفرع">
                        <Input />
                      </Form.Item>
                      <Form.Item name="pickupHours" label="ساعات الاستلام">
                        <Input placeholder="10:00 – 22:00" />
                      </Form.Item>
                    </>
                  ),
                },
                {
                  key: "inventory",
                  label: "المخزون",
                  children: (
                    <>
                      <Form.Item
                        name="lowStockThreshold"
                        label="حدّ الكمية المنخفضة (باركود / منتج)"
                        tooltip="يُستخدم لتنبيه «ينفد قريباً»"
                      >
                        <InputNumber style={{ width: "100%" }} min={1} max={100} />
                      </Form.Item>
                      <Form.Item
                        name="stockAlertCooldownHours"
                        label="فترة منع تكرار التنبيه (ساعات)"
                      >
                        <InputNumber style={{ width: "100%" }} min={1} max={168} />
                      </Form.Item>
                      <Form.Item
                        name="stockAlertPushEnabled"
                        label="إرسال Push تلقائي عند تغيّر المخزون"
                        valuePropName="checked"
                      >
                        <Switch />
                      </Form.Item>
                    </>
                  ),
                },
                {
                  key: "loyalty",
                  label: "الولاء والعروض",
                  children: (
                    <>
                      <Form.Item name="firstOrderBonusPoints" label="مكافأة أول طلب (نقاط)">
                        <InputNumber style={{ width: "100%" }} min={0} />
                      </Form.Item>
                      <Form.Item name="redeem100PointsValue" label="قيمة 100 نقطة (د.ع)">
                        <InputNumber style={{ width: "100%" }} min={0} />
                      </Form.Item>
                      <Form.Item name="pointsPer1000Iqd" label="نقاط لكل 1000 د.ع">
                        <InputNumber style={{ width: "100%" }} min={0} />
                      </Form.Item>
                      <Form.Item name="flashSaleEndsAt" label="انتهاء العرض السريع (ISO)">
                        <Input placeholder="2026-12-31T23:59:59.000Z" />
                      </Form.Item>
                    </>
                  ),
                },
              ]}
            />
            <Button type="primary" htmlType="submit" loading={save.isPending} style={{ marginTop: 16 }}>
              حفظ الإعدادات
            </Button>
          </Form>
        </Card>
      </Space>
    </>
  );
}
