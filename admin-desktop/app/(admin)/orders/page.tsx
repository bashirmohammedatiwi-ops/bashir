"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Button,
  Card,
  Descriptions,
  Drawer,
  Select,
  Space,
  Table,
  Tag,
  message,
} from "antd";
import { useState } from "react";
import { mutations, queries } from "@/lib/queries";

const STATUSES = [
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "REFUNDED",
];

const STATUS_LABELS: Record<string, string> = {
  PENDING: "قيد المراجعة",
  CONFIRMED: "مؤكد",
  PROCESSING: "قيد التحضير",
  SHIPPED: "تم الشحن",
  DELIVERED: "مكتمل",
  CANCELLED: "ملغي",
  REFUNDED: "مسترد",
};

export default function OrdersPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<string | undefined>();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["orders", page, status],
    queryFn: () => queries.orders({ page, limit: 15, status }),
  });

  const { data: detail, isLoading: detailLoading } = useQuery({
    queryKey: ["order", selectedId],
    queryFn: () => queries.order(selectedId!),
    enabled: !!selectedId,
  });

  const update = useMutation({
    mutationFn: ({ id, status }: any) => mutations.updateOrderStatus(id, { status }),
    onSuccess: () => {
      message.success("تم التحديث");
      qc.invalidateQueries({ queryKey: ["orders"] });
      qc.invalidateQueries({ queryKey: ["order", selectedId] });
    },
  });

  const items = data?.data ?? [];
  const total = data?.meta?.total ?? 0;

  return (
     <>
      <Space direction="vertical" size={12} style={{ width: "100%" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ margin: 0 }}>الطلبات</h2>
          <Select
            allowClear
            placeholder="حالة الطلب"
            style={{ width: 200 }}
            options={STATUSES.map((s) => ({ value: s, label: STATUS_LABELS[s] ?? s }))}
            onChange={(v) => {
              setStatus(v);
              setPage(1);
            }}
          />
        </div>
        <Card styles={{ body: { padding: 0 } }}>
          <Table
            rowKey="id"
            loading={isLoading}
            dataSource={items}
            pagination={{
              current: page,
              total,
              pageSize: 15,
              onChange: setPage,
            }}
            columns={[
              { title: "رقم الطلب", dataIndex: "orderNumber" },
              {
                title: "العميل",
                render: (_, r: any) => r.user?.name ?? r.user?.email ?? "-",
              },
              {
                title: "الإجمالي",
                dataIndex: "total",
                render: (v) => `${v?.toLocaleString()} د.ع`,
              },
              {
                title: "الحالة",
                dataIndex: "status",
                render: (v) => <Tag>{STATUS_LABELS[v] ?? v}</Tag>,
              },
              {
                title: "تحديث الحالة",
                render: (_, r: any) => (
                  <Select
                    style={{ width: 160 }}
                    value={r.status}
                    options={STATUSES.map((s) => ({ value: s, label: STATUS_LABELS[s] ?? s }))}
                    onChange={(v) => update.mutate({ id: r.id, status: v })}
                  />
                ),
              },
              {
                title: "تفاصيل",
                render: (_: any, r: any) => (
                  <Button size="small" onClick={() => setSelectedId(r.id)}>
                    عرض
                  </Button>
                ),
              },
            ]}
          />
        </Card>
      </Space>

      <Drawer
        title={`طلب ${detail?.orderNumber ?? ""}`}
        open={!!selectedId}
        onClose={() => setSelectedId(null)}
        width={560}
        loading={detailLoading}
      >
        {detail && (
          <Space direction="vertical" size={16} style={{ width: "100%" }}>
            <Descriptions column={1} size="small" bordered>
              <Descriptions.Item label="العميل">
                {detail.user?.name ?? detail.user?.email ?? "-"}
              </Descriptions.Item>
              <Descriptions.Item label="الهاتف">{detail.user?.phone ?? "-"}</Descriptions.Item>
              <Descriptions.Item label="الحالة">
                <Tag>{STATUS_LABELS[detail.status] ?? detail.status}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="الدفع">{detail.paymentStatus}</Descriptions.Item>
              <Descriptions.Item label="طريقة الدفع">{detail.paymentMethod}</Descriptions.Item>
              <Descriptions.Item label="نوع التوصيل">{detail.deliveryOption ?? "STANDARD"}</Descriptions.Item>
              <Descriptions.Item label="المجموع الفرعي">
                {detail.subtotal?.toLocaleString()} د.ع
              </Descriptions.Item>
              <Descriptions.Item label="الخصم">
                {detail.discountTotal?.toLocaleString()} د.ع
              </Descriptions.Item>
              <Descriptions.Item label="الشحن">
                {detail.shippingTotal?.toLocaleString()} د.ع
              </Descriptions.Item>
              <Descriptions.Item label="الإجمالي">
                <strong>{detail.total?.toLocaleString()} د.ع</strong>
              </Descriptions.Item>
            </Descriptions>

            {detail.address && (
              <Card size="small" title="عنوان التوصيل">
                <p style={{ margin: 0 }}>
                  {detail.address.fullName} — {detail.address.phone}
                </p>
                <p style={{ margin: "4px 0 0", color: "#666" }}>
                  {detail.address.city}
                  {detail.address.area ? `، ${detail.address.area}` : ""}
                  {detail.address.street ? `، ${detail.address.street}` : ""}
                </p>
              </Card>
            )}

            <Card size="small" title="المنتجات">
              <Table
                rowKey="id"
                dataSource={detail.items ?? []}
                pagination={false}
                size="small"
                columns={[
                  { title: "المنتج", dataIndex: "productName" },
                  { title: "SKU", dataIndex: "productSku", width: 100 },
                  { title: "الكمية", dataIndex: "quantity", width: 70 },
                  {
                    title: "السعر",
                    dataIndex: "totalPrice",
                    render: (v) => `${v?.toLocaleString()} د.ع`,
                  },
                ]}
              />
            </Card>

            <Select
              style={{ width: "100%" }}
              value={detail.status}
              options={STATUSES.map((s) => ({ value: s, label: STATUS_LABELS[s] ?? s }))}
              onChange={(v) => update.mutate({ id: detail.id, status: v })}
            />
          </Space>
        )}
      </Drawer>
    
    </>
  );
}
