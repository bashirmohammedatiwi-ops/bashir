"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Alert,
  Button,
  Card,
  Col,
  Image,
  Popconfirm,
  Row,
  Space,
  Statistic,
  Table,
  Tag,
  message,
} from "antd";
import { useState } from "react";
import { NotificationComposeModal } from "@/components/notifications/NotificationComposeModal";
import { PageHeader } from "@/components/PageHeader";
import { mediaUrl } from "@/lib/mediaUrl";
import { mutations, queries } from "@/lib/queries";

const TYPES = [
  { value: "OFFER", label: "عرض" },
  { value: "ORDER", label: "طلب" },
  { value: "NEW_ARRIVAL", label: "وصول جديد" },
  { value: "REMINDER", label: "تذكير" },
  { value: "RESTOCK", label: "عاد بالمخزون" },
  { value: "LOW_STOCK", label: "ينفد / منخفض" },
];

const LINK_LABELS: Record<string, string> = {
  PRODUCT: "منتج",
  CATEGORY: "فئة",
  BRAND: "براند",
  PACKAGE: "باقة",
  OFFERS: "العروض",
  ORDER: "طلب",
  EXTERNAL_URL: "رابط",
  NONE: "—",
};

const PUSH_STATUS: Record<string, { color: string; label: string }> = {
  PENDING: { color: "default", label: "قيد الانتظار" },
  SENT: { color: "success", label: "تم الإرسال" },
  PARTIAL: { color: "warning", label: "جزئي" },
  FAILED: { color: "error", label: "فشل" },
  SKIPPED: { color: "default", label: "داخل التطبيق فقط" },
};

export default function NotificationsPage() {
  const [open, setOpen] = useState(false);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => queries.notifications({ page: 1, limit: 50 }),
  });

  const { data: stats } = useQuery({
    queryKey: ["notification-stats"],
    queryFn: queries.notificationStats,
  });

  const resend = useMutation({
    mutationFn: mutations.resendNotification,
    onSuccess: () => {
      message.success("تمت إعادة الإرسال");
      qc.invalidateQueries({ queryKey: ["notifications"] });
      qc.invalidateQueries({ queryKey: ["notification-stats"] });
    },
  });

  const remove = useMutation({
    mutationFn: mutations.deleteNotification,
    onSuccess: () => {
      message.success("تم الحذف");
      qc.invalidateQueries({ queryKey: ["notifications"] });
      qc.invalidateQueries({ queryKey: ["notification-stats"] });
    },
  });

  const items = data?.data ?? [];

  return (
    <>
      <PageHeader
        title="الإشعارات"
        subtitle="إرسال إشعارات Push مع صورة وربط منتج أو فئة أو عروض"
        extra={
          <Button type="primary" onClick={() => setOpen(true)}>
            + إشعار جديد
          </Button>
        }
      />

      {!stats?.fcmEnabled && (
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
          message="Push غير مفعّل على السيرفر"
          description="أضف FIREBASE_SERVICE_ACCOUNT_PATH أو FIREBASE_SERVICE_ACCOUNT_JSON في .env — الإشعارات تُحفظ داخل التطبيق حتى بدون Firebase."
        />
      )}

      <Row gutter={12} style={{ marginBottom: 16 }}>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic title="إجمالي الإشعارات" value={stats?.total ?? 0} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic title="أجهزة مسجّلة" value={stats?.activeDevices ?? 0} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic title="Push ناجح" value={stats?.pushSent ?? 0} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic title="Push فاشل/جزئي" value={stats?.pushFailed ?? 0} />
          </Card>
        </Col>
      </Row>

      <Card styles={{ body: { padding: 0 } }}>
        <Table
          rowKey="id"
          loading={isLoading}
          dataSource={items}
          pagination={false}
          scroll={{ x: 980 }}
          columns={[
            {
              title: "صورة",
              dataIndex: "imageUrl",
              width: 72,
              render: (v) =>
                v ? (
                  <Image
                    src={mediaUrl(v) ?? v}
                    alt=""
                    width={48}
                    height={48}
                    style={{ objectFit: "cover", borderRadius: 8 }}
                  />
                ) : (
                  "—"
                ),
            },
            {
              title: "النوع",
              dataIndex: "type",
              width: 100,
              render: (v) => <Tag>{TYPES.find((t) => t.value === v)?.label ?? v}</Tag>,
            },
            { title: "العنوان", dataIndex: "title", ellipsis: true },
            {
              title: "الربط",
              width: 180,
              render: (_: unknown, r: any) =>
                r.linkType && r.linkType !== "NONE" ? (
                  <span>
                    {LINK_LABELS[r.linkType] ?? r.linkType}: {r.linkLabel ?? r.linkSlug ?? "—"}
                  </span>
                ) : (
                  "—"
                ),
            },
            {
              title: "الجمهور",
              width: 120,
              render: (_: unknown, r: any) =>
                r.targetType === "USER" ? r.user?.name ?? r.user?.email ?? "عميل" : "الجميع",
            },
            {
              title: "Push",
              dataIndex: "pushStatus",
              width: 130,
              render: (v, r: any) => {
                const meta = PUSH_STATUS[v] ?? { color: "default", label: v };
                return (
                  <Space direction="vertical" size={0}>
                    <Tag color={meta.color}>{meta.label}</Tag>
                    {(r.sentCount > 0 || r.failedCount > 0) && (
                      <small style={{ color: "#888" }}>
                        {r.sentCount}✓ {r.failedCount > 0 ? `${r.failedCount}✗` : ""}
                      </small>
                    )}
                  </Space>
                );
              },
            },
            {
              title: "التاريخ",
              dataIndex: "createdAt",
              width: 150,
              render: (v) => (v ? new Date(v).toLocaleString("ar-IQ") : "—"),
            },
            {
              title: "إجراءات",
              width: 160,
              render: (_: unknown, r: any) => (
                <Space>
                  <Button size="small" onClick={() => resend.mutate(r.id)} loading={resend.isPending}>
                    إعادة
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

      <NotificationComposeModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
