"use client";

import { Button, Divider, Select, Space, Typography, message } from "antd";
import { CopyOutlined, PhoneOutlined, UserOutlined } from "@ant-design/icons";
import {
  DELIVERY_LABELS,
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUS_LABELS,
  STATUS_LABELS,
  ORDER_STATUSES,
  addressSummary,
  formatIqd,
  formatOrderDate,
} from "./order-utils";
import { OrderStatusBadge } from "./OrderStatusBadge";
import { OrderStatusStepper } from "./OrderStatusStepper";
import { OrderItemsList } from "./OrderItemsList";

const { Text, Title } = Typography;

type Props = {
  order: any;
  loading?: boolean;
  onStatusChange: (status: string) => void;
  onPaymentStatusChange?: (status: string) => void;
  updating?: boolean;
};

const PAYMENT_STATUSES = ["PENDING", "PAID", "FAILED", "REFUNDED"];

export function OrderDetailPanel({ order, loading, onStatusChange, onPaymentStatusChange, updating }: Props) {
  if (loading) {
    return (
      <div className="ord-detail ord-detail--loading">
        <div className="ord-detail-skeleton" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="ord-detail ord-detail--empty">
        <div className="ord-detail-empty-icon">🛍️</div>
        <Title level={5} style={{ marginTop: 0 }}>
          اختر طلباً
        </Title>
        <Text type="secondary">اختر طلباً من القائمة لعرض تفاصيله وصور المنتجات</Text>
      </div>
    );
  }

  const copy = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => message.success(`تم نسخ ${label}`));
  };

  return (
    <div className="ord-detail">
      <div className="ord-detail-header">
        <div>
          <div className="ord-detail-title-row">
            <Title level={4} style={{ margin: 0 }}>
              {order.orderNumber}
            </Title>
            <Button
              type="text"
              size="small"
              icon={<CopyOutlined />}
              onClick={() => copy(order.orderNumber, "رقم الطلب")}
            />
          </div>
          <Text type="secondary">{formatOrderDate(order.createdAt)}</Text>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      <OrderStatusStepper status={order.status} />

      <div className="ord-detail-grid">
        <div className="ord-info-card">
          <Text className="ord-info-card-title">
            <UserOutlined /> العميل
          </Text>
          <Text strong>{order.user?.name ?? order.user?.email ?? "—"}</Text>
          {order.user?.phone && (
            <div className="ord-info-line">
              <PhoneOutlined />
              <a href={`tel:${order.user.phone}`}>{order.user.phone}</a>
              <Button
                type="link"
                size="small"
                icon={<CopyOutlined />}
                onClick={() => copy(order.user.phone, "الهاتف")}
              />
            </div>
          )}
          {order.user?.email && (
            <Text type="secondary" className="ord-info-sub">
              {order.user.email}
            </Text>
          )}
        </div>

        {order.address && (
          <div className="ord-info-card">
            <Text className="ord-info-card-title">📍 عنوان التوصيل</Text>
            <Text strong>{order.address.fullName}</Text>
            <Text className="ord-info-sub">{order.address.phone}</Text>
            <Text className="ord-info-sub">{addressSummary(order.address)}</Text>
            {order.address.notes && (
              <Text type="secondary" className="ord-info-note">
                ملاحظة: {order.address.notes}
              </Text>
            )}
          </div>
        )}
      </div>

      <div className="ord-section">
        <Text className="ord-section-title">المنتجات ({order.items?.length ?? 0})</Text>
        <OrderItemsList items={order.items ?? []} />
      </div>

      <div className="ord-summary-card">
        <div className="ord-summary-row">
          <span>المجموع الفرعي</span>
          <span>{formatIqd(order.subtotal)}</span>
        </div>
        {order.discountTotal > 0 && (
          <div className="ord-summary-row ord-summary-discount">
            <span>الخصم{order.coupon?.code ? ` (${order.coupon.code})` : ""}</span>
            <span>− {formatIqd(order.discountTotal)}</span>
          </div>
        )}
        <div className="ord-summary-row">
          <span>الشحن</span>
          <span>{order.shippingTotal === 0 ? "مجاني" : formatIqd(order.shippingTotal)}</span>
        </div>
        {(order.loyaltySpent > 0 || order.loyaltyEarned > 0) && (
          <>
            {order.loyaltySpent > 0 && (
              <div className="ord-summary-row">
                <span>نقاط مستخدمة</span>
                <span>{order.loyaltySpent}</span>
              </div>
            )}
            {order.loyaltyEarned > 0 && (
              <div className="ord-summary-row">
                <span>نقاط مكتسبة</span>
                <span>{order.loyaltyEarned}</span>
              </div>
            )}
          </>
        )}
        <Divider style={{ margin: "12px 0" }} />
        <div className="ord-summary-row ord-summary-total">
          <span>الإجمالي</span>
          <span>{formatIqd(order.total)}</span>
        </div>
        <div className="ord-summary-meta">
          <span>{PAYMENT_METHOD_LABELS[order.paymentMethod] ?? order.paymentMethod}</span>
          <span>{DELIVERY_LABELS[order.deliveryOption] ?? order.deliveryOption ?? "توصيل عادي"}</span>
        </div>
      </div>

      {order.notes && (
        <div className="ord-notes-card">
          <Text className="ord-section-title">ملاحظات العميل</Text>
          <Text>{order.notes}</Text>
        </div>
      )}

      <div className="ord-actions-card">
        <Text className="ord-section-title">إدارة الطلب</Text>
        <Space direction="vertical" size={12} style={{ width: "100%" }}>
          <div>
            <Text type="secondary" className="ord-action-label">
              حالة الطلب
            </Text>
            <Select
              style={{ width: "100%" }}
              value={order.status}
              loading={updating}
              options={ORDER_STATUSES.map((s) => ({ value: s, label: STATUS_LABELS[s] ?? s }))}
              onChange={onStatusChange}
            />
          </div>
          {onPaymentStatusChange && (
            <div>
              <Text type="secondary" className="ord-action-label">
                حالة الدفع — {PAYMENT_STATUS_LABELS[order.paymentStatus] ?? order.paymentStatus}
              </Text>
              <Select
                style={{ width: "100%" }}
                value={order.paymentStatus}
                loading={updating}
                options={PAYMENT_STATUSES.map((s) => ({
                  value: s,
                  label: PAYMENT_STATUS_LABELS[s] ?? s,
                }))}
                onChange={onPaymentStatusChange}
              />
            </div>
          )}
        </Space>
      </div>
    </div>
  );
}
