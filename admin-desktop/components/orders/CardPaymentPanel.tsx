"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Empty, Input, InputNumber, Modal, Popconfirm, Space, Spin, Tag, Typography, message } from "antd";
import { CreditCardOutlined, ReloadOutlined, RollbackOutlined, StopOutlined } from "@ant-design/icons";
import { useState } from "react";
import { api } from "@/lib/api";
import { formatIqd, formatOrderDate } from "./order-utils";

const { Text } = Typography;

const TX_STATUS: Record<string, { label: string; color: string }> = {
  CREATED: { label: "بانتظار الدفع", color: "gold" },
  SUCCESS: { label: "ناجحة", color: "green" },
  FAILED: { label: "فشلت", color: "red" },
  AUTHENTICATION_FAILED: { label: "فشل التحقق", color: "red" },
  EXPIRED: { label: "منتهية", color: "default" },
};

const OP_LABELS: Record<string, string> = {
  WEBHOOK: "إشعار البوابة",
  SYNC: "مزامنة",
  REFUND: "استرجاع",
  CANCEL: "إلغاء",
};

const unwrap = (r: any) => r.data?.data ?? r.data;

/** لوحة الدفع الإلكتروني (كي كارد) داخل تفاصيل الطلب: الحالة، الاسترجاع، الإلغاء. */
export function CardPaymentPanel({ orderId }: { orderId: string }) {
  const qc = useQueryClient();
  const [refundOpen, setRefundOpen] = useState(false);
  const [refundAmount, setRefundAmount] = useState<number | null>(null);
  const [reason, setReason] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["order-payment", orderId],
    queryFn: () => api.get(`/payments/admin/orders/${orderId}`).then(unwrap),
  });

  const after = (msg: string) => (res: any) => {
    message.success(msg);
    qc.setQueryData(["order-payment", orderId], res);
    qc.invalidateQueries({ queryKey: ["orders"] });
    qc.invalidateQueries({ queryKey: ["order", orderId] });
  };
  const onError = (e: any) =>
    message.error(e?.response?.data?.message ?? e?.message ?? "تعذّر تنفيذ العملية");

  const sync = useMutation({
    mutationFn: () => api.post(`/payments/admin/orders/${orderId}/sync`).then(unwrap),
    onSuccess: after("تمت المزامنة مع البوابة"),
    onError,
  });
  const cancel = useMutation({
    mutationFn: () => api.post(`/payments/admin/orders/${orderId}/cancel`).then(unwrap),
    onSuccess: after("أُلغيت العملية لدى البوابة"),
    onError,
  });
  const refund = useMutation({
    mutationFn: () =>
      api
        .post(`/payments/admin/orders/${orderId}/refund`, {
          ...(refundAmount ? { amount: refundAmount } : {}),
          ...(reason.trim() ? { reason: reason.trim() } : {}),
        })
        .then(unwrap),
    onSuccess: (res) => {
      setRefundOpen(false);
      after("تم استرجاع المبلغ")(res);
    },
    onError,
  });

  if (isLoading) {
    return (
      <div className="ord-actions-card" style={{ textAlign: "center" }}>
        <Spin />
      </div>
    );
  }

  const txs: any[] = data?.transactions ?? [];
  const paid = txs.find((t) => t.status === "SUCCESS" && !t.canceled && t.refundable > 0);
  const open = txs.find((t) => t.status === "CREATED" && !t.canceled);

  return (
    <div className="ord-actions-card">
      <Space style={{ width: "100%", justifyContent: "space-between", marginBottom: 10 }}>
        <Text className="ord-section-title" style={{ margin: 0 }}>
          <CreditCardOutlined /> الدفع الإلكتروني — كي كارد
        </Text>
        <Space size={6}>
          {data?.sandbox && <Tag color="purple">بيئة اختبار</Tag>}
          <Button size="small" icon={<ReloadOutlined />} loading={sync.isPending} onClick={() => sync.mutate()}>
            مزامنة
          </Button>
        </Space>
      </Space>

      {!txs.length ? (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="لم تبدأ الزبونة الدفع بعد" />
      ) : (
        <Space direction="vertical" size={10} style={{ width: "100%" }}>
          {txs.map((t) => {
            const st = TX_STATUS[t.status] ?? { label: t.status, color: "default" };
            return (
              <div key={t.id} className="ord-info-card" style={{ gap: 4 }}>
                <Space wrap size={6}>
                  <Tag color={st.color}>{st.label}</Tag>
                  {t.canceled && <Tag color="volcano">ملغاة</Tag>}
                  {t.refundedAmount > 0 && <Tag color="blue">مسترد {formatIqd(t.refundedAmount)}</Tag>}
                  <Text strong>{formatIqd(t.amount)}</Text>
                </Space>
                {t.maskedPan && (
                  <Text className="ord-info-sub">
                    {t.paymentSystem ?? "بطاقة"} • {t.maskedPan}
                    {t.rrn ? ` • RRN ${t.rrn}` : ""}
                  </Text>
                )}
                <Text type="secondary" className="ord-info-sub" copyable={{ text: t.paymentId }}>
                  رقم العملية: {t.paymentId}
                </Text>
                <Text type="secondary" className="ord-info-sub">
                  {formatOrderDate(t.createdAt)}
                </Text>
                {t.operations?.length > 0 && (
                  <div style={{ marginTop: 6, borderTop: "1px dashed #e2e8f0", paddingTop: 6 }}>
                    {t.operations.slice(0, 6).map((op: any) => (
                      <div key={op.id} style={{ fontSize: 12, color: op.success ? "#475569" : "#dc2626" }}>
                        {OP_LABELS[op.type] ?? op.type}
                        {op.amount && op.type === "REFUND" ? ` ${formatIqd(op.amount)}` : ""}
                        {op.message ? ` — ${op.message}` : ""} · {formatOrderDate(op.createdAt)}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </Space>
      )}

      {paid && (
        <Space style={{ marginTop: 12 }} wrap>
          <Button
            icon={<RollbackOutlined />}
            onClick={() => {
              setRefundAmount(paid.refundable);
              setReason("");
              setRefundOpen(true);
            }}
          >
            استرجاع المبلغ
          </Button>
          <Popconfirm
            title="إلغاء العملية لدى البوابة؟"
            description="يُلغى الخصم كاملاً (متاح غالباً في نفس يوم الدفع قبل التسوية)."
            okText="إلغاء العملية"
            cancelText="رجوع"
            onConfirm={() => cancel.mutate()}
          >
            <Button danger icon={<StopOutlined />} loading={cancel.isPending}>
              إلغاء العملية
            </Button>
          </Popconfirm>
        </Space>
      )}

      {!paid && open && (
        <Space style={{ marginTop: 12 }} wrap>
          <Popconfirm
            title="إلغاء محاولة الدفع المفتوحة؟"
            description="لم يُخصم أي مبلغ بعد — تُغلق العملية لدى البوابة."
            okText="إلغاء العملية"
            cancelText="رجوع"
            onConfirm={() => cancel.mutate()}
          >
            <Button danger icon={<StopOutlined />} loading={cancel.isPending}>
              إلغاء العملية المفتوحة
            </Button>
          </Popconfirm>
        </Space>
      )}

      <Modal
        title="استرجاع المبلغ إلى بطاقة الزبونة"
        open={refundOpen}
        onCancel={() => setRefundOpen(false)}
        onOk={() => refund.mutate()}
        okText="تأكيد الاسترجاع"
        cancelText="رجوع"
        confirmLoading={refund.isPending}
      >
        <Space direction="vertical" style={{ width: "100%" }}>
          <Text type="secondary">الحد الأقصى: {paid ? formatIqd(paid.refundable) : "—"}</Text>
          <InputNumber
            style={{ width: "100%" }}
            min={1}
            max={paid?.refundable}
            value={refundAmount}
            onChange={(v) => setRefundAmount(v)}
            addonAfter="د.ع"
          />
          <Input
            placeholder="سبب الاسترجاع (اختياري)"
            value={reason}
            maxLength={200}
            onChange={(e) => setReason(e.target.value)}
          />
        </Space>
      </Modal>
    </div>
  );
}
