"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Alert,
  Button,
  Card,
  Col,
  Input,
  Row,
  Select,
  Space,
  Statistic,
  Table,
  Tabs,
  Tag,
  message,
} from "antd";
import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { mutations, queries } from "@/lib/queries";

const STATUS_FILTERS = [
  { value: "all", label: "الكل (منخفض + نافد)" },
  { value: "low", label: "منخفض" },
  { value: "out", label: "نفد" },
];

function fmtTime(v?: string | null) {
  return v ? new Date(v).toLocaleString("ar-IQ") : "—";
}

function fmtMs(ms?: number) {
  if (!ms) return "—";
  return ms >= 1000 ? `${(ms / 1000).toFixed(1)} ث` : `${ms} ملث`;
}

export default function InventoryPage() {
  const [status, setStatus] = useState<"all" | "low" | "out">("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const qc = useQueryClient();

  const { data: overview, isLoading: overviewLoading } = useQuery({
    queryKey: ["inventory-overview"],
    queryFn: queries.inventoryOverview,
    staleTime: 2 * 60_000,
  });

  const { data: alertsData, isLoading: alertsLoading } = useQuery({
    queryKey: ["inventory-stock-alerts", page, status, search],
    queryFn: () =>
      queries.inventoryStockAlerts({ page, limit: 25, status, search: search || undefined }),
  });

  const { data: runsData, isLoading: runsLoading } = useQuery({
    queryKey: ["inventory-runs"],
    queryFn: () => queries.inventoryRuns({ page: 1, limit: 15 }),
    staleTime: 2 * 60_000,
  });

  const sendAlert = useMutation({
    mutationFn: mutations.sendStockAlert,
    onSuccess: (res: any) => {
      if (res?.ok === false) {
        message.warning(
          res.reason === "no_product"
            ? "الباركود غير مربوط بمنتج في المتجر"
            : "الباركود غير موجود في POS",
        );
        return;
      }
      message.success("تم إرسال تنبيه Push");
    },
  });

  const alertRows = alertsData?.data ?? [];
  const runRows = runsData?.data ?? [];
  const pos = overview?.posSync;

  return (
    <>
      <PageHeader
        title="المخزون و POS Sync"
        subtitle="متابعة الكميات حسب الباركود — من SQL Server عبر POS Sync"
        extra={
          <Button
            onClick={() => {
              qc.invalidateQueries({ queryKey: ["inventory-overview"] });
              qc.invalidateQueries({ queryKey: ["inventory-stock-alerts"] });
              qc.invalidateQueries({ queryKey: ["inventory-runs"] });
            }}
          >
            تحديث
          </Button>
        }
      />

      {!overview?.stockAlertPushEnabled && (
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
          message="تنبيهات Push للمخزون معطّلة"
          description="فعّلها من الإعدادات ← المخزون — الإشارات التلقائية تُحفظ داخل التطبيق فقط."
        />
      )}

      <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
        <Col xs={12} sm={8} md={6}>
          <Card loading={overviewLoading} size="small">
            <Statistic
              title="لقطات POS (باركود)"
              value={overview?.snapshots?.total ?? 0}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={6}>
          <Card loading={overviewLoading} size="small">
            <Statistic
              title="نفد (POS)"
              value={overview?.snapshots?.outOfStock ?? 0}
              valueStyle={{ color: "#ef4444" }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={6}>
          <Card loading={overviewLoading} size="small">
            <Statistic
              title={`منخفض ≤ ${overview?.threshold ?? 5}`}
              value={overview?.snapshots?.lowStock ?? 0}
              valueStyle={{ color: "#f59e0b" }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={6}>
          <Card loading={overviewLoading} size="small">
            <Statistic
              title="مربوط بالمتجر"
              value={overview?.snapshots?.matchedToCatalog ?? 0}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={6}>
          <Card loading={overviewLoading} size="small">
            <Statistic title="نفد (منتجات المتجر)" value={overview?.catalog?.outOfStock ?? 0} />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={6}>
          <Card loading={overviewLoading} size="small">
            <Statistic title="منخفض (منتجات المتجر)" value={overview?.catalog?.lowStock ?? 0} />
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card loading={overviewLoading} size="small" title="آخر مزامنة POS">
            {pos ? (
              <Space direction="vertical" size={4}>
                <div>
                  <Tag color={pos.ok ? "success" : "error"}>{pos.ok ? "ناجحة" : "فاشلة"}</Tag>
                  <Tag>{pos.manual ? "يدوية" : "تلقائية"}</Tag>
                  <span>{fmtTime(pos.finishedAt)}</span>
                </div>
                <small style={{ color: "#888" }}>
                  إجمالي {pos.totalItems?.toLocaleString("ar-IQ")} — متغيّر{" "}
                  {pos.changedItems?.toLocaleString("ar-IQ")} — رُفع{" "}
                  {pos.syncedItems?.toLocaleString("ar-IQ")} — فشل {pos.failedItems ?? 0} —{" "}
                  {fmtMs(pos.durationMs)}
                </small>
                {pos.errorMessage ? (
                  <Alert type="error" message={pos.errorMessage} showIcon />
                ) : null}
              </Space>
            ) : (
              <span style={{ color: "#888" }}>لم تُسجَّل مزامنة بعد — شغّل POS Sync</span>
            )}
            <div style={{ marginTop: 8, fontSize: 12, color: "#888" }}>
              آخر تحديث لقطة: {fmtTime(overview?.snapshots?.lastSyncedAt)}
            </div>
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card loading={runsLoading} size="small" title="سجل الرفع (POS)">
            <Table
              rowKey="id"
              size="small"
              pagination={false}
              dataSource={runRows.slice(0, 5)}
              columns={[
                {
                  title: "الوقت",
                  dataIndex: "createdAt",
                  render: (v) => fmtTime(v),
                },
                {
                  title: "الحالة",
                  render: (_: unknown, r: any) => (
                    <Tag color={r.ok ? "success" : "error"}>{r.ok ? "OK" : "Fail"}</Tag>
                  ),
                },
                {
                  title: "رُفع",
                  dataIndex: "syncedItems",
                },
                {
                  title: "فشل",
                  dataIndex: "failedItems",
                  render: (v) => (v > 0 ? <Tag color="error">{v}</Tag> : v),
                },
              ]}
            />
          </Card>
        </Col>
      </Row>

      <Card>
        <Tabs
          items={[
            {
              key: "alerts",
              label: "تنبيهات المخزون (باركود)",
              children: (
                <>
                  <Space wrap style={{ marginBottom: 12 }}>
                    <Select
                      value={status}
                      onChange={(v) => {
                        setStatus(v);
                        setPage(1);
                      }}
                      options={STATUS_FILTERS}
                      style={{ width: 200 }}
                    />
                    <Input.Search
                      placeholder="بحث بالباركود أو الاسم..."
                      allowClear
                      onSearch={(v) => {
                        setSearch(v);
                        setPage(1);
                      }}
                      style={{ width: 280 }}
                    />
                  </Space>
                  <Table
                    rowKey="barcode"
                    loading={alertsLoading}
                    dataSource={alertRows}
                    scroll={{ x: 980 }}
                    pagination={{
                      current: page,
                      pageSize: 25,
                      total: alertsData?.meta?.total ?? 0,
                      onChange: setPage,
                      showSizeChanger: false,
                    }}
                    columns={[
                      {
                        title: "الباركود",
                        dataIndex: "barcode",
                        width: 160,
                        render: (v) => <code dir="ltr">{v}</code>,
                      },
                      {
                        title: "الاسم (POS)",
                        dataIndex: "name",
                        ellipsis: true,
                      },
                      {
                        title: "الكمية",
                        dataIndex: "stock",
                        width: 90,
                        render: (v, r: any) => (
                          <Tag color={r.status === "out" ? "error" : "warning"}>{v}</Tag>
                        ),
                      },
                      {
                        title: "الحالة",
                        dataIndex: "status",
                        width: 90,
                        render: (v) =>
                          v === "out" ? (
                            <Tag color="error">نفد</Tag>
                          ) : (
                            <Tag color="warning">منخفض</Tag>
                          ),
                      },
                      {
                        title: "منتج المتجر",
                        render: (_: unknown, r: any) =>
                          r.inCatalog ? (
                            r.productName || "✓"
                          ) : (
                            <Tag>غير مربوط</Tag>
                          ),
                      },
                      {
                        title: "آخر POS",
                        dataIndex: "syncedAt",
                        width: 150,
                        render: (v) => fmtTime(v),
                      },
                      {
                        title: "Push",
                        width: 200,
                        render: (_: unknown, r: any) =>
                          r.inCatalog ? (
                            <Space>
                              <Button
                                size="small"
                                onClick={() =>
                                  sendAlert.mutate({ barcode: r.barcode, alertType: "RESTOCK" })
                                }
                                disabled={r.stock <= 0}
                              >
                                عاد
                              </Button>
                              <Button
                                size="small"
                                onClick={() =>
                                  sendAlert.mutate({ barcode: r.barcode, alertType: "LOW_STOCK" })
                                }
                              >
                                ينفد
                              </Button>
                            </Space>
                          ) : (
                            "—"
                          ),
                      },
                    ]}
                  />
                </>
              ),
            },
            {
              key: "runs",
              label: "سجل المزامنة",
              children: (
                <Table
                  rowKey="id"
                  loading={runsLoading}
                  dataSource={runRows}
                  pagination={false}
                  columns={[
                    { title: "الوقت", dataIndex: "createdAt", render: (v) => fmtTime(v) },
                    {
                      title: "نوع",
                      dataIndex: "manual",
                      render: (v) => (v ? "يدوي" : "تلقائي"),
                    },
                    {
                      title: "حالة",
                      dataIndex: "ok",
                      render: (v) => <Tag color={v ? "success" : "error"}>{v ? "OK" : "Fail"}</Tag>,
                    },
                    { title: "إجمالي", dataIndex: "totalItems" },
                    { title: "متغيّر", dataIndex: "changedItems" },
                    { title: "رُفع", dataIndex: "syncedItems" },
                    {
                      title: "فشل",
                      dataIndex: "failedItems",
                      render: (v) => (v > 0 ? <Tag color="error">{v}</Tag> : 0),
                    },
                    { title: "تخطّى", dataIndex: "skippedItems" },
                    { title: "المدة", dataIndex: "durationMs", render: (v) => fmtMs(v) },
                    {
                      title: "خطأ",
                      dataIndex: "errorMessage",
                      ellipsis: true,
                      render: (v) => v || "—",
                    },
                  ]}
                />
              ),
            },
          ]}
        />
      </Card>
    </>
  );
}
