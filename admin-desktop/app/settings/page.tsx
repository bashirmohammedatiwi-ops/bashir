"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Card, Form, Input, InputNumber, Space, Switch, Tabs, message } from "antd";
import { useEffect } from "react";
import { Shell } from "@/components/Shell";
import { mutations, queries } from "@/lib/queries";

interface Settings {
  storeName: string;
  currency: string;
  whatsapp: string;
  supportPhone: string;
  taxPercent: number;
  shippingFee: number;
  freeShippingThreshold: number;
  expressShippingFee: number;
  cashOnDelivery: boolean;
  emailOrders: string;
  flashSaleEndsAt: string | null;
  firstOrderBonusPoints: number;
  loyaltyTiers?: Record<string, number>;
  redeem100PointsValue?: number;
  pointsPer1000Iqd?: number;
}

const defaults: Settings = {
  storeName: "الحياة",
  currency: "د.ع",
  whatsapp: "+9647700000000",
  supportPhone: "+9647700000000",
  taxPercent: 0,
  shippingFee: 5000,
  freeShippingThreshold: 50000,
  expressShippingFee: 5000,
  cashOnDelivery: true,
  emailOrders: "orders@alhayaa.com",
  flashSaleEndsAt: null,
  firstOrderBonusPoints: 50,
};

export default function SettingsPage() {
  const [form] = Form.useForm<Settings>();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["settings"],
    queryFn: queries.settings,
  });

  useEffect(() => {
    if (data) {
      form.setFieldsValue({
        ...defaults,
        ...data,
        flashSaleEndsAt: data.flashSaleEndsAt,
      });
    }
  }, [data, form]);

  const save = useMutation({
    mutationFn: (v: Settings) => mutations.updateSettings(v),
    onSuccess: () => {
      message.success("تم حفظ الإعدادات");
      qc.invalidateQueries({ queryKey: ["settings"] });
    },
  });

  return (
    <Shell>
      <Space direction="vertical" size={12} style={{ width: "100%" }}>
        <h2 style={{ margin: 0 }}>الإعدادات</h2>
        <Card loading={isLoading}>
          <Form
            form={form}
            layout="vertical"
            onFinish={(v) =>
              save.mutate({
                ...v,
                loyaltyTiers: { silver: 500, gold: 1500, platinum: 3000 },
                redeem100PointsValue: 1000,
                pointsPer1000Iqd: 1,
              })
            }
          >
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
                        <Form.Item name="shippingFee" label="رسوم الشحن" style={{ flex: 1 }}>
                          <InputNumber style={{ width: "100%" }} min={0} />
                        </Form.Item>
                        <Form.Item name="expressShippingFee" label="الشحن السريع" style={{ flex: 1, marginInlineStart: 8 }}>
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
                      <Form.Item name="flashSaleEndsAt" label="انتهاء العرض السريع (ISO)">
                        <Input placeholder="2026-12-31T23:59:59.000Z" />
                      </Form.Item>
                      <p style={{ color: "#666", fontSize: 13 }}>
                        مستويات الولاء: فضي 500 • ذهبي 1500 • بلاتيني 3000 نقطة
                      </p>
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
    </Shell>
  );
}
