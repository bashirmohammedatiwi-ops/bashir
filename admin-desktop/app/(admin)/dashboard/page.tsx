"use client";
import { useQuery } from "@tanstack/react-query";
import { Card, Col, Empty, Row, Statistic, Table, Tag } from "antd";
import { PageHeader } from "@/components/PageHeader";
import { queries } from "@/lib/queries";

const STATUS_COLORS: Record<string, string> = {
  PENDING: "#f59e0b",
  CONFIRMED: "#3b82f6",
  PROCESSING: "#8b5cf6",
  SHIPPED: "#06b6d4",
  DELIVERED: "#10b981",
  CANCELLED: "#ef4444",
  REFUNDED: "#6b7280",
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: "قيد المراجعة",
  CONFIRMED: "مؤكد",
  PROCESSING: "قيد التحضير",
  SHIPPED: "تم الشحن",
  DELIVERED: "مكتمل",
  CANCELLED: "ملغي",
  REFUNDED: "مسترد",
};

export default function DashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: queries.dashboard,
  });
  const kpi = data?.kpi ?? {};
  const top = data?.topProducts ?? [];
  const ordersByStatus = data?.ordersByStatus ?? [];
  const revenueByDay = data?.revenueByDay ?? [];

  const maxRev = Math.max(1, ...revenueByDay.map((r: any) => r.amount));

  return (
     <>
      <PageHeader title="لوحة المعلومات" subtitle="ملخص المتجر من السيرفر" />

      <Row gutter={12}>
        <Col xs={24} sm={12} md={6}>
          <Card loading={isLoading}>
            <Statistic title="المنتجات النشطة" value={kpi.productsCount ?? 0} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card loading={isLoading}>
            <Statistic title="إجمالي الطلبات" value={kpi.ordersCount ?? 0} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card loading={isLoading}>
            <Statistic title="عدد العملاء" value={kpi.usersCount ?? 0} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card loading={isLoading}>
            <Statistic
              title="مبيعات آخر 30 يوم"
              value={(kpi.salesLast30Days ?? 0).toLocaleString()}
              suffix="د.ع"
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={12} style={{ marginTop: 16 }}>
        <Col xs={24} md={16}>
          <Card title="الإيرادات (آخر 14 يوم)" loading={isLoading}>
            {revenueByDay.length === 0 ? (
              <Empty />
            ) : (
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-end",
                  gap: 6,
                  height: 200,
                  padding: "8px 4px",
                }}
              >
                {revenueByDay.map((r: any, i: number) => {
                  const h = (r.amount / maxRev) * 100;
                  return (
                    <div
                      key={i}
                      style={{
                        flex: 1,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 4,
                      }}
                      title={`${r.day}: ${r.amount.toLocaleString()} د.ع`}
                    >
                      <div
                        style={{
                          width: "100%",
                          height: `${h}%`,
                          background:
                            "linear-gradient(180deg, #4a2466, #6b3a8a)",
                          borderRadius: 6,
                          minHeight: 6,
                          transition: "height 350ms ease",
                        }}
                      />
                      <span style={{ fontSize: 9, color: "#6e6a75" }}>
                        {i + 1}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card title="الطلبات حسب الحالة" loading={isLoading}>
            {ordersByStatus.length === 0 ? (
              <Empty />
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {ordersByStatus.map((s: any) => {
                  const total =
                    ordersByStatus.reduce(
                      (sum: number, x: any) => sum + (x.count || 0),
                      0,
                    ) || 1;
                  const pct = Math.round(((s.count || 0) / total) * 100);
                  const color = STATUS_COLORS[s.status] ?? "#888";
                  return (
                    <div key={s.status}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          fontSize: 12,
                          marginBottom: 4,
                        }}
                      >
                        <span style={{ color: "#444" }}>
                          {STATUS_LABELS[s.status] ?? s.status}
                        </span>
                        <span style={{ color: "#888" }}>
                          {s.count} ({pct}%)
                        </span>
                      </div>
                      <div
                        style={{
                          height: 6,
                          background: "#eee",
                          borderRadius: 4,
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            height: "100%",
                            width: `${pct}%`,
                            background: color,
                            transition: "width 350ms ease",
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </Col>
      </Row>

      <Card title="الأكثر مبيعاً" style={{ marginTop: 16 }} loading={isLoading}>
        <Table
          rowKey="id"
          dataSource={top}
          pagination={false}
          columns={[
            { title: "الاسم", dataIndex: "name" },
            {
              title: "البراند",
              render: (_: any, r: any) => (
                <Tag>{r.brand?.name ?? "-"}</Tag>
              ),
            },
            {
              title: "السعر",
              dataIndex: "price",
              render: (v) => `${v?.toLocaleString()} د.ع`,
            },
            { title: "تم بيعه", dataIndex: "soldCount" },
          ]}
        />
      </Card>
    
    </>
  );
}
