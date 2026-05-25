"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Alert,
  Button,
  Card,
  Col,
  Form,
  Input,
  Modal,
  Popconfirm,
  Row,
  Select,
  Space,
  Statistic,
  Switch,
  Table,
  Tag,
  message,
} from "antd";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { mutations, queries } from "@/lib/queries";

const TYPES = [
  { value: "OFFER", label: "عرض" },
  { value: "ORDER", label: "طلب" },
  { value: "NEW_ARRIVAL", label: "وصول جديد" },
  { value: "REMINDER", label: "تذكير" },
  { value: "RESTOCK", label: "عاد بالمخزون" },
  { value: "LOW_STOCK", label: "ينفد / منخفض" },
];

const LINK_TYPES = [
  { value: "NONE", label: "بدون رابط" },
  { value: "PRODUCT", label: "منتج" },
  { value: "CATEGORY", label: "فئة" },
  { value: "BRAND", label: "براند" },
  { value: "PACKAGE", label: "باقة" },
  { value: "EXTERNAL_URL", label: "رابط خارجي" },
];

const TARGET_TYPES = [
  { value: "ALL", label: "جميع العملاء" },
  { value: "USER", label: "عميل محدد" },
];

const PUSH_STATUS: Record<string, { color: string; label: string }> = {
  PENDING: { color: "default", label: "قيد الانتظار" },
  SENT: { color: "success", label: "تم الإرسال" },
  PARTIAL: { color: "warning", label: "جزئي" },
  FAILED: { color: "error", label: "فشل" },
  SKIPPED: { color: "default", label: "داخل التطبيق فقط" },
};

const LINK_LABELS: Record<string, string> = {
  PRODUCT: "منتج",
  CATEGORY: "فئة",
  BRAND: "براند",
  PACKAGE: "باقة",
  EXTERNAL_URL: "رابط",
  NONE: "—",
};

export default function NotificationsPage() {
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm();
  const qc = useQueryClient();
  const linkType = Form.useWatch("linkType", form);
  const targetType = Form.useWatch("targetType", form);

  const { data, isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => queries.notifications({ page: 1, limit: 50 }),
  });

  const { data: stats } = useQuery({
    queryKey: ["notification-stats"],
    queryFn: queries.notificationStats,
  });

  const { data: productsData } = useQuery({
    queryKey: ["products", "notify-link"],
    queryFn: () => queries.products({ page: 1, limit: 200 }),
    enabled: linkType === "PRODUCT",
  });

  const { data: categoriesData } = useQuery({
    queryKey: ["categories", "notify-link"],
    queryFn: queries.categoriesFull,
    enabled: linkType === "CATEGORY",
  });

  const { data: brandsData } = useQuery({
    queryKey: ["brands", "notify-link"],
    queryFn: queries.brands,
    enabled: linkType === "BRAND",
  });

  const { data: packagesData } = useQuery({
    queryKey: ["packages", "notify-link"],
    queryFn: queries.packages,
    enabled: linkType === "PACKAGE",
  });

  const { data: usersData } = useQuery({
    queryKey: ["users", "notify-target"],
    queryFn: () => queries.users({ page: 1, limit: 100, role: "CUSTOMER" }),
    enabled: targetType === "USER",
  });

  const linkOptions = useMemo(() => {
    if (linkType === "PRODUCT") {
      const rows = productsData?.data ?? productsData ?? [];
      return rows.map((p: any) => ({ value: p.id, label: p.name }));
    }
    if (linkType === "CATEGORY") {
      const rows = Array.isArray(categoriesData) ? categoriesData : categoriesData?.data ?? [];
      return rows.map((c: any) => ({ value: c.id, label: c.name }));
    }
    if (linkType === "BRAND") {
      const rows = Array.isArray(brandsData) ? brandsData : brandsData?.data ?? [];
      return rows.map((b: any) => ({ value: b.id, label: b.name }));
    }
    if (linkType === "PACKAGE") {
      const rows = Array.isArray(packagesData) ? packagesData : packagesData?.data ?? [];
      return rows.map((p: any) => ({ value: p.id, label: p.name }));
    }
    return [];
  }, [linkType, productsData, categoriesData, brandsData, packagesData]);

  const userOptions = useMemo(() => {
    const rows = usersData?.data ?? [];
    return rows.map((u: any) => ({
      value: u.id,
      label: u.name || u.email || u.phone || u.id,
    }));
  }, [usersData]);

  const create = useMutation({
    mutationFn: mutations.createNotification,
    onSuccess: (result: any) => {
      const status = result?.pushStatus;
      if (status === "SENT") message.success("تم إرسال الإشعار للهاتف");
      else if (status === "SKIPPED") message.success("تم حفظ الإشعار — Push غير مفعّل أو لا توجد أجهزة");
      else if (status === "PARTIAL") message.warning("تم الإرسال جزئياً — راجع السجل");
      else message.success("تم إنشاء الإشعار");
      setOpen(false);
      form.resetFields();
      qc.invalidateQueries({ queryKey: ["notifications"] });
      qc.invalidateQueries({ queryKey: ["notification-stats"] });
    },
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

  const onFinish = (values: any) => {
    create.mutate({
      type: values.type,
      title: values.title,
      body: values.body,
      targetType: values.targetType,
      userId: values.targetType === "USER" ? values.userId : undefined,
      linkType: values.linkType,
      linkId:
        values.linkType !== "NONE" && values.linkType !== "EXTERNAL_URL"
          ? values.linkId
          : undefined,
      externalUrl: values.linkType === "EXTERNAL_URL" ? values.externalUrl : undefined,
      imageUrl: values.imageUrl || undefined,
      sendPush: values.sendPush !== false,
    });
  };

  return (
    <>
      <PageHeader
        title="الإشعارات"
        subtitle="إرسال إشعارات Push للهاتف مع ربط منتج أو فئة أو براند"
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
          scroll={{ x: 900 }}
          columns={[
            {
              title: "النوع",
              dataIndex: "type",
              width: 100,
              render: (v) => <Tag>{TYPES.find((t) => t.value === v)?.label ?? v}</Tag>,
            },
            { title: "العنوان", dataIndex: "title", ellipsis: true },
            {
              title: "الربط",
              width: 160,
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
                r.targetType === "USER"
                  ? r.user?.name ?? r.user?.email ?? "عميل"
                  : "الجميع",
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

      <Modal
        title="إرسال إشعار"
        open={open}
        onCancel={() => setOpen(false)}
        onOk={() => form.submit()}
        confirmLoading={create.isPending}
        okText="إرسال"
        cancelText="إلغاء"
        width={640}
        destroyOnClose
      >
        <Form
          layout="vertical"
          form={form}
          onFinish={onFinish}
          initialValues={{
            type: "OFFER",
            targetType: "ALL",
            linkType: "NONE",
            sendPush: true,
          }}
        >
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="type" label="النوع" rules={[{ required: true }]}>
                <Select options={TYPES} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="targetType" label="الجمهور" rules={[{ required: true }]}>
                <Select options={TARGET_TYPES} />
              </Form.Item>
            </Col>
          </Row>

          {targetType === "USER" && (
            <Form.Item name="userId" label="العميل" rules={[{ required: true }]}>
              <Select
                showSearch
                optionFilterProp="label"
                options={userOptions}
                placeholder="اختر عميلاً"
              />
            </Form.Item>
          )}

          <Form.Item name="title" label="العنوان" rules={[{ required: true }]}>
            <Input placeholder="مثال: خصم 30% على L'Oreal" />
          </Form.Item>

          <Form.Item name="body" label="المحتوى" rules={[{ required: true }]}>
            <Input.TextArea rows={3} placeholder="نص الإشعار الذي يظهر على الهاتف" />
          </Form.Item>

          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="linkType" label="ربط الإشعار بـ">
                <Select options={LINK_TYPES} />
              </Form.Item>
            </Col>
            <Col span={12}>
              {linkType && linkType !== "NONE" && linkType !== "EXTERNAL_URL" && (
                <Form.Item name="linkId" label="اختر" rules={[{ required: true }]}>
                  <Select
                    showSearch
                    optionFilterProp="label"
                    options={linkOptions}
                    placeholder="ابحث واختر..."
                  />
                </Form.Item>
              )}
              {linkType === "EXTERNAL_URL" && (
                <Form.Item
                  name="externalUrl"
                  label="الرابط"
                  rules={[{ required: true, type: "url" }]}
                >
                  <Input placeholder="https://..." />
                </Form.Item>
              )}
            </Col>
          </Row>

          <Form.Item name="imageUrl" label="صورة الإشعار (اختياري)">
            <Input placeholder="https://..." />
          </Form.Item>

          <Form.Item name="sendPush" label="إرسال Push للهاتف" valuePropName="checked">
            <Switch checkedChildren="نعم" unCheckedChildren="داخل التطبيق فقط" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
