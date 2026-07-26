"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Col, Form, Input, Modal, Row, Select, Space, Switch, Typography, message } from "antd";
import { useEffect, useMemo } from "react";
import { MediaPicker } from "@/components/MediaPicker";
import { mediaPreviewUrl, mediaThumb } from "@/lib/mediaUrl";
import { mutations, queries } from "@/lib/queries";

const TYPES = [
  { value: "OFFER", label: "عرض" },
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
  { value: "OFFERS", label: "صفحة العروض" },
  { value: "EXTERNAL_URL", label: "رابط خارجي" },
];

const TARGET_TYPES = [
  { value: "ALL", label: "جميع العملاء" },
  { value: "USER", label: "عميل محدد" },
];

const LINK_LABELS: Record<string, string> = {
  PRODUCT: "منتج",
  CATEGORY: "فئة",
  BRAND: "براند",
  PACKAGE: "باقة",
  OFFERS: "العروض",
  EXTERNAL_URL: "رابط",
  NONE: "—",
};

function entityThumb(linkType: string, row: any): string | null {
  if (!row) return null;
  if (linkType === "PRODUCT") return mediaPreviewUrl(row.images?.[0]?.media) ?? mediaThumb(row.images?.[0]?.media, "medium");
  if (linkType === "CATEGORY") return mediaPreviewUrl(row.image) ?? mediaThumb(row.image, "medium");
  if (linkType === "BRAND") return mediaPreviewUrl(row.logo) ?? mediaThumb(row.logo, "medium");
  if (linkType === "PACKAGE") return mediaPreviewUrl(row.coverImage) ?? mediaThumb(row.coverImage, "medium");
  return null;
}

function PhonePreview({
  title,
  body,
  imageUrl,
  linkType,
  linkLabel,
}: {
  title?: string;
  body?: string;
  imageUrl?: string | null;
  linkType?: string;
  linkLabel?: string | null;
}) {
  return (
    <div
      style={{
        borderRadius: 20,
        border: "1px solid #e8e8e8",
        overflow: "hidden",
        background: "#f7f7f8",
        boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
      }}
    >
      <div style={{ padding: "10px 14px", background: "#111", color: "#fff", fontSize: 12 }}>
        ديما الحياة · الآن
      </div>
      <div style={{ padding: 14, background: "#fff" }}>
        {imageUrl ? (
          <div
            style={{
              height: 120,
              borderRadius: 12,
              marginBottom: 10,
              background: `center/cover no-repeat url(${imageUrl})`,
              backgroundColor: "#f0f0f0",
            }}
          />
        ) : null}
        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{title || "عنوان الإشعار"}</div>
        <div style={{ color: "#555", fontSize: 13, lineHeight: 1.5 }}>{body || "نص الإشعار يظهر هنا..."}</div>
        {linkType && linkType !== "NONE" ? (
          <div style={{ marginTop: 10 }}>
            <span
              style={{
                display: "inline-block",
                padding: "4px 10px",
                borderRadius: 999,
                background: "#f3e8ff",
                color: "#7c3aed",
                fontSize: 11,
                fontWeight: 600,
              }}
            >
              {LINK_LABELS[linkType] ?? linkType}
              {linkLabel ? ` · ${linkLabel}` : ""}
            </span>
          </div>
        ) : null}
      </div>
    </div>
  );
}

type Props = {
  open: boolean;
  onClose: () => void;
};

type LinkOption = {
  value: string;
  label: string;
  thumb: string | null;
  row: Record<string, unknown>;
};

export function NotificationComposeModal({ open, onClose }: Props) {
  const [form] = Form.useForm();
  const qc = useQueryClient();
  const linkType = Form.useWatch("linkType", form);
  const targetType = Form.useWatch("targetType", form);
  const title = Form.useWatch("title", form);
  const body = Form.useWatch("body", form);
  const imageUrl = Form.useWatch("imageUrl", form);
  const linkId = Form.useWatch("linkId", form);
  const autoImage = Form.useWatch("autoImage", form);

  const { data: productsData } = useQuery({
    queryKey: ["products", "notify-link"],
    queryFn: () => queries.products({ page: 1, limit: 200, lite: 1 }),
    enabled: open && linkType === "PRODUCT",
  });

  const { data: categoriesData } = useQuery({
    queryKey: ["categories", "notify-link"],
    queryFn: queries.categoriesFull,
    enabled: open && linkType === "CATEGORY",
  });

  const { data: brandsData } = useQuery({
    queryKey: ["brands", "notify-link"],
    queryFn: () => queries.brands(),
    enabled: open && linkType === "BRAND",
  });

  const { data: packagesData } = useQuery({
    queryKey: ["packages", "notify-link"],
    queryFn: queries.packages,
    enabled: open && linkType === "PACKAGE",
  });

  const { data: usersData } = useQuery({
    queryKey: ["users", "notify-target"],
    queryFn: () => queries.users({ page: 1, limit: 100, role: "CUSTOMER" }),
    enabled: open && targetType === "USER",
  });

  const linkRows = useMemo(() => {
    if (linkType === "PRODUCT") return productsData?.data ?? productsData ?? [];
    if (linkType === "CATEGORY") return Array.isArray(categoriesData) ? categoriesData : categoriesData?.data ?? [];
    if (linkType === "BRAND") return Array.isArray(brandsData) ? brandsData : brandsData?.data ?? [];
    if (linkType === "PACKAGE") return Array.isArray(packagesData) ? packagesData : packagesData?.data ?? [];
    return [];
  }, [linkType, productsData, categoriesData, brandsData, packagesData]);

  const linkOptions = useMemo<LinkOption[]>(
    () =>
      linkRows.map((row: Record<string, unknown>) => ({
        value: String(row.id),
        label: String(row.name ?? ""),
        thumb: entityThumb(linkType, row),
        row,
      })),
    [linkRows, linkType],
  );

  const selectedLink = linkOptions.find((o: LinkOption) => o.value === linkId);
  const previewImage = imageUrl || (autoImage !== false ? selectedLink?.thumb : null);
  const previewLinkLabel =
    linkType === "OFFERS"
      ? "العروض"
      : selectedLink?.label ?? (linkType === "EXTERNAL_URL" ? form.getFieldValue("externalUrl") : null);

  useEffect(() => {
    if (!open || autoImage === false || !linkId || !linkType) return;
    const thumb = selectedLink?.thumb;
    if (thumb && !imageUrl) {
      form.setFieldValue("imageUrl", thumb);
    }
  }, [open, autoImage, linkId, linkType, selectedLink?.thumb, imageUrl, form]);

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
      onClose();
      form.resetFields();
      qc.invalidateQueries({ queryKey: ["notifications"] });
      qc.invalidateQueries({ queryKey: ["notification-stats"] });
    },
  });

  const onFinish = (values: any) => {
    create.mutate({
      type: values.type,
      title: values.title,
      body: values.body,
      targetType: values.targetType,
      userId: values.targetType === "USER" ? values.userId : undefined,
      linkType: values.linkType,
      linkId:
        values.linkType !== "NONE" &&
        values.linkType !== "EXTERNAL_URL" &&
        values.linkType !== "OFFERS"
          ? values.linkId
          : undefined,
      externalUrl: values.linkType === "EXTERNAL_URL" ? values.externalUrl : undefined,
      imageUrl: values.imageUrl || undefined,
      sendPush: values.sendPush !== false,
    });
  };

  return (
    <Modal
      title="إرسال إشعار متقدم"
      open={open}
      onCancel={onClose}
      onOk={() => form.submit()}
      confirmLoading={create.isPending}
      okText="إرسال"
      cancelText="إلغاء"
      width={920}
      destroyOnClose
    >
      <Row gutter={20}>
        <Col xs={24} md={14}>
          <Form
            layout="vertical"
            form={form}
            onFinish={onFinish}
            initialValues={{
              type: "OFFER",
              targetType: "ALL",
              linkType: "NONE",
              sendPush: true,
              autoImage: true,
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
                <Select showSearch optionFilterProp="label" options={userOptions} placeholder="اختر عميلاً" />
              </Form.Item>
            )}

            <Form.Item name="title" label="العنوان" rules={[{ required: true, max: 80 }]}>
              <Input showCount maxLength={80} placeholder="مثال: خصم 30% على L'Oreal" />
            </Form.Item>

            <Form.Item name="body" label="المحتوى" rules={[{ required: true, max: 240 }]}>
              <Input.TextArea
                rows={3}
                showCount
                maxLength={240}
                placeholder="نص الإشعار الذي يظهر على الهاتف"
              />
            </Form.Item>

            <Row gutter={12}>
              <Col span={12}>
                <Form.Item name="linkType" label="ربط الإشعار بـ">
                  <Select
                    options={LINK_TYPES}
                    onChange={() => {
                      form.setFieldValue("linkId", undefined);
                      form.setFieldValue("imageUrl", undefined);
                    }}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                {linkType && linkType !== "NONE" && linkType !== "EXTERNAL_URL" && linkType !== "OFFERS" && (
                  <Form.Item name="linkId" label="اختر" rules={[{ required: true }]}>
                    <Select
                      showSearch
                      optionFilterProp="label"
                      placeholder="ابحث واختر..."
                      options={linkOptions}
                      optionRender={(opt) => (
                        <Space>
                          {opt.data.thumb ? (
                            <img
                              src={opt.data.thumb}
                              alt=""
                              width={28}
                              height={28}
                              style={{ borderRadius: 6, objectFit: "cover" }}
                            />
                          ) : null}
                          <span>{opt.label}</span>
                        </Space>
                      )}
                    />
                  </Form.Item>
                )}
                {linkType === "EXTERNAL_URL" && (
                  <Form.Item name="externalUrl" label="الرابط" rules={[{ required: true, type: "url" }]}>
                    <Input placeholder="https://..." />
                  </Form.Item>
                )}
              </Col>
            </Row>

            <Form.Item name="autoImage" label="صورة تلقائية من الربط" valuePropName="checked">
              <Switch checkedChildren="نعم" unCheckedChildren="يدوي" />
            </Form.Item>

            <Form.Item name="imageUrl" label="صورة الإشعار">
              <Input placeholder="رابط الصورة أو اختر من المكتبة" allowClear />
            </Form.Item>

            <Form.Item label="أو اختر من مكتبة الوسائط">
              <MediaPicker
                purpose="GENERAL"
                onPickUrl={(url) => {
                  if (url) {
                    form.setFieldValue("imageUrl", url);
                    form.setFieldValue("autoImage", false);
                  }
                }}
              />
            </Form.Item>

            <Form.Item name="sendPush" label="إرسال Push للهاتف" valuePropName="checked">
              <Switch checkedChildren="نعم" unCheckedChildren="داخل التطبيق فقط" />
            </Form.Item>
          </Form>
        </Col>

        <Col xs={24} md={10}>
          <Typography.Text type="secondary" style={{ display: "block", marginBottom: 8 }}>
            معاينة على الهاتف
          </Typography.Text>
          <PhonePreview
            title={title}
            body={body}
            imageUrl={previewImage}
            linkType={linkType}
            linkLabel={previewLinkLabel}
          />
        </Col>
      </Row>
    </Modal>
  );
}
