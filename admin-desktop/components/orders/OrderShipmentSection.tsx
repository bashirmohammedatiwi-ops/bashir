"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Alert, App, Button, Input, Modal, Radio, Skeleton, Space, Tag, Typography } from "antd";
import {
  CarOutlined,
  CopyOutlined,
  DownloadOutlined,
  ExclamationCircleOutlined,
  ReloadOutlined,
  RedoOutlined,
  StopOutlined,
  SyncOutlined,
} from "@ant-design/icons";
import { useState } from "react";
import { apiErrorMessage } from "@/lib/apiError";
import { ordersApi, type Shipment, type ShipmentDecision } from "@/lib/ordersApi";
import { formatIqd, formatOrderDate } from "./order-utils";
import { orderKeys, useOrderShipment, useStaffRole } from "./order-hooks";

const { Text } = Typography;

export const SHIPMENT_STATE_LABELS: Record<string, { label: string; color: string }> = {
  PENDING: { label: "بانتظار الإنشاء", color: "default" },
  CREATING: { label: "جارٍ الإنشاء", color: "processing" },
  CREATED: { label: "منشأة لدى الشركة", color: "green" },
  RETRYING: { label: "إعادة محاولة تلقائية", color: "orange" },
  FAILED: { label: "فشل الإنشاء", color: "red" },
  CANCELLED: { label: "ملغاة", color: "default" },
};

const SOURCE_LABELS: Record<string, string> = {
  WEBHOOK: "إشعار فوري",
  POLL: "استعلام دوري",
  CREATE: "عند الإنشاء",
  API: "تحديث يدوي",
};

/** حالات تنتظر قرارنا: فشل محاولة (4، 10) أو تأجيل (11). */
const DECISION_STATUSES = [4, 10, 11];

/** يفتح ملف PDF من base64: تبويب جديد في المتصفح، وتنزيل مباشر داخل تطبيق سطح المكتب. */
function openPdfBase64(base64: string, filename: string, preOpened: Window | null) {
  const clean = base64.replace(/^data:application\/pdf;base64,/, "");
  const bytes = Uint8Array.from(atob(clean), (ch) => ch.charCodeAt(0));
  const url = URL.createObjectURL(new Blob([bytes], { type: "application/pdf" }));
  if (preOpened && !preOpened.closed) {
    preOpened.location.href = url;
  } else {
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }
  setTimeout(() => URL.revokeObjectURL(url), 120_000);
}

/** تطبيق Electron يحوّل window.open إلى المتصفح الخارجي — فلا نفتح نوافذ فيه. */
function isDesktopApp() {
  return typeof window !== "undefined" && !!(window as unknown as { alhayaa?: unknown }).alhayaa;
}

export function OrderShipmentSection({
  orderId,
  stage,
  deliveryOption,
}: {
  orderId: string;
  stage?: string | null;
  deliveryOption?: string | null;
}) {
  const { modal, message } = App.useApp();
  const qc = useQueryClient();
  const { isAdmin } = useStaffRole();
  const relevant = !!stage && !["NEW", "CONFIRMED", "PICKING"].includes(stage);
  const q = useOrderShipment(orderId, relevant);
  const [decisionOpen, setDecisionOpen] = useState(false);
  const [decision, setDecision] = useState<ShipmentDecision>("resend");
  const [note, setNote] = useState("");

  const onShipment = (msg: string) => (res: Shipment | null) => {
    message.success(msg);
    qc.setQueryData(orderKeys.shipment(orderId), res);
    qc.invalidateQueries({ queryKey: orderKeys.timeline(orderId) });
    qc.invalidateQueries({ queryKey: ["orders"] });
    qc.invalidateQueries({ queryKey: ["order", orderId] });
  };

  const refresh = useMutation({ mutationFn: () => ordersApi.shipmentRefresh(orderId), onSuccess: onShipment("تم تحديث حالة الشحنة") });
  const retry = useMutation({ mutationFn: () => ordersApi.shipmentRetry(orderId), onSuccess: onShipment("أُعيدت محاولة إنشاء الشحنة") });
  const cancel = useMutation({ mutationFn: () => ordersApi.shipmentCancel(orderId), onSuccess: onShipment("أُلغيت الشحنة") });
  const decide = useMutation({
    mutationFn: () => ordersApi.shipmentDecision(orderId, decision, note.trim() || undefined),
    onSuccess: (res) => {
      setDecisionOpen(false);
      onShipment("أُرسل القرار لهاي إكسبريس")(res);
    },
  });
  const label = useMutation({
    mutationFn: async (preOpened: Window | null) => {
      try {
        const res = await ordersApi.shipmentLabel(orderId);
        return { res, preOpened };
      } catch (e) {
        preOpened?.close();
        throw e;
      }
    },
    onSuccess: ({ res, preOpened }) => {
      if (!res?.pdfBase64) {
        preOpened?.close();
        message.error("لم يصل ملف الملصق من هاي إكسبريس");
        return;
      }
      openPdfBase64(res.pdfBase64, `hi-express-${q.data?.trackingNumber ?? orderId}.pdf`, preOpened);
    },
  });

  if (!relevant || deliveryOption === "PICKUP") {
    if (deliveryOption === "PICKUP" && relevant) {
      return (
        <div className="ord-actions-card">
          <Text className="ord-section-title">
            <CarOutlined /> الشحنة
          </Text>
          <Text type="secondary">استلام من المحل — لا شحنة لدى شركة التوصيل.</Text>
        </div>
      );
    }
    return null;
  }

  const title = (
    <Text className="ord-section-title" style={{ margin: 0 }}>
      <CarOutlined /> الشحنة — هاي إكسبريس
    </Text>
  );

  if (q.isLoading) {
    return (
      <div className="ord-actions-card">
        {title}
        <Skeleton active paragraph={{ rows: 2 }} />
      </div>
    );
  }

  if (q.isError) {
    return (
      <div className="ord-actions-card">
        {title}
        <Alert
          style={{ marginTop: 8 }}
          type="error"
          showIcon
          message={apiErrorMessage(q.error, "تعذّر تحميل بيانات الشحنة")}
          action={
            <Button size="small" icon={<ReloadOutlined />} onClick={() => q.refetch()}>
              إعادة المحاولة
            </Button>
          }
        />
      </div>
    );
  }

  const sh = q.data;
  if (!sh) {
    return (
      <div className="ord-actions-card">
        {title}
        <div style={{ marginTop: 8 }}>
          <Text type="secondary">
            {stage === "PICKED" || stage === "READY_FOR_PICKUP"
              ? "تُنشأ الشحنة تلقائياً بعد الفوترة من كاشير الطلبات."
              : "لا توجد شحنة لهذا الطلب."}
          </Text>
        </div>
      </div>
    );
  }

  const events = Array.isArray(sh.events) ? sh.events : [];
  const st = SHIPMENT_STATE_LABELS[sh.state] ?? { label: sh.state, color: "default" };
  const statusId = sh.statusId ?? 0;
  const canCancel = isAdmin && sh.state === "CREATED" && !sh.isCanceled && !sh.isFinal && statusId === 0;
  const canRetry = isAdmin && (sh.state === "FAILED" || sh.state === "RETRYING");
  const canDecide = isAdmin && sh.state === "CREATED" && !sh.isFinal && DECISION_STATUSES.includes(statusId);
  const canRefresh = sh.state === "CREATED";

  const copy = (text: string) =>
    navigator.clipboard.writeText(text).then(() => message.success("تم نسخ رقم التتبع"));

  const confirmCancel = () =>
    modal.confirm({
      title: "إلغاء الشحنة لدى هاي إكسبريس؟",
      icon: <ExclamationCircleOutlined />,
      content: "تُحذف الشحنة من نظامهم قبل أن يستلمها المندوب. لا يمكن التراجع — يلزم إنشاء شحنة جديدة بعدها.",
      okText: "إلغاء الشحنة",
      okButtonProps: { danger: true },
      cancelText: "رجوع",
      onOk: () => cancel.mutateAsync().catch(() => undefined),
    });

  const confirmRetry = () =>
    modal.confirm({
      title: "إعادة إنشاء الشحنة الآن؟",
      content: sh.lastError ? `آخر خطأ: ${sh.lastError}` : "تُرسل الشحنة لهاي إكسبريس من جديد.",
      okText: "إعادة الإنشاء",
      cancelText: "رجوع",
      onOk: () => retry.mutateAsync().catch(() => undefined),
    });

  return (
    <div className="ord-actions-card">
      <div className="ord-card-head">
        {title}
        <Space size={4}>
          <Tag color={st.color} style={{ margin: 0 }}>
            {st.label}
          </Tag>
          {sh.alert && (
            <Tag color="red" style={{ margin: 0 }}>
              يحتاج متابعة
            </Tag>
          )}
        </Space>
      </div>

      <div className="ord-ship-grid">
        <div>
          <span className="ord-ship-k">رقم التتبع</span>
          {sh.trackingNumber ? (
            <span className="ord-ship-v" dir="ltr">
              {sh.trackingNumber}
              <Button type="text" size="small" icon={<CopyOutlined />} onClick={() => copy(sh.trackingNumber!)} />
            </span>
          ) : (
            <span className="ord-ship-v">—</span>
          )}
        </div>
        <div>
          <span className="ord-ship-k">حالة الشركة</span>
          <span className="ord-ship-v">
            {sh.statusName ?? "—"}
            {sh.statusId != null && <Text type="secondary"> ({sh.statusId})</Text>}
          </span>
          {sh.statusAt && <span className="ord-ship-s">{formatOrderDate(sh.statusAt)}</span>}
        </div>
        <div>
          <span className="ord-ship-k">المندوب</span>
          <span className="ord-ship-v">{sh.driverName ?? "—"}</span>
        </div>
        <div>
          <span className="ord-ship-k">محاولات التوصيل</span>
          <span className="ord-ship-v">{sh.deliveryAttempts ?? 0}</span>
        </div>
        <div>
          <span className="ord-ship-k">مبلغ التحصيل</span>
          <span className="ord-ship-v">{formatIqd(sh.codAmount)}</span>
        </div>
        {sh.collectedAmount != null && (
          <div>
            <span className="ord-ship-k">المُحصَّل</span>
            <span className="ord-ship-v">{formatIqd(sh.collectedAmount)}</span>
          </div>
        )}
        {sh.shippingCost != null && (
          <div>
            <span className="ord-ship-k">كلفة الشحن</span>
            <span className="ord-ship-v">{formatIqd(sh.shippingCost)}</span>
          </div>
        )}
        <div>
          <span className="ord-ship-k">محاولات الإنشاء</span>
          <span className="ord-ship-v">{sh.attempts}</span>
          {sh.nextAttemptAt && sh.state === "RETRYING" && (
            <span className="ord-ship-s">التالية: {formatOrderDate(sh.nextAttemptAt)}</span>
          )}
        </div>
      </div>

      {sh.lastError && sh.state !== "CREATED" && (
        <Alert type="error" showIcon style={{ marginTop: 10 }} message="آخر خطأ" description={sh.lastError} />
      )}

      <Space wrap size={8} style={{ marginTop: 12 }}>
        {canRefresh && (
          <Button size="small" icon={<SyncOutlined />} loading={refresh.isPending} onClick={() => refresh.mutate()}>
            تحديث الحالة
          </Button>
        )}
        {sh.trackingNumber && (
          <Button
            size="small"
            icon={<DownloadOutlined />}
            loading={label.isPending}
            onClick={() => label.mutate(isDesktopApp() ? null : window.open("", "_blank"))}
          >
            تنزيل ملصق هاي إكسبريس
          </Button>
        )}
        {canRetry && (
          <Button size="small" type="primary" icon={<RedoOutlined />} loading={retry.isPending} onClick={confirmRetry}>
            إعادة الإنشاء
          </Button>
        )}
        {canDecide && (
          <Button
            size="small"
            type="primary"
            danger
            onClick={() => {
              setDecision("resend");
              setNote("");
              setDecisionOpen(true);
            }}
          >
            قرار التأجيل/الفشل
          </Button>
        )}
        {canCancel && (
          <Button size="small" danger icon={<StopOutlined />} loading={cancel.isPending} onClick={confirmCancel}>
            إلغاء الشحنة
          </Button>
        )}
      </Space>

      {events.length > 0 && (
        <div className="ord-ship-events">
          <Text type="secondary" style={{ fontSize: 12, fontWeight: 700 }}>
            رسائل شركة التوصيل ({events.length})
          </Text>
          {events.map((e, i) => (
            <div key={e.id ?? `${e.statusId}-${e.receivedAt}-${i}`} className="ord-ship-event">
              <div className="ord-ship-event-top">
                <b>{e.label}</b>
                <span>{formatOrderDate(e.statusAt ?? e.receivedAt)}</span>
              </div>
              <div className="ord-ship-event-sub">
                <span>{SOURCE_LABELS[e.source] ?? e.source}</span>
                {e.note && <span>«{e.note}»</span>}
                {e.proofUrl && (
                  <a href={e.proofUrl} target="_blank" rel="noreferrer">
                    صورة الإثبات
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        title="قرار على تأجيل أو فشل التوصيل"
        open={decisionOpen}
        onCancel={() => setDecisionOpen(false)}
        onOk={() => decide.mutate()}
        okText="إرسال القرار"
        cancelText="رجوع"
        okButtonProps={{ danger: decision === "return" }}
        confirmLoading={decide.isPending}
        destroyOnHidden
      >
        <Space direction="vertical" size={12} style={{ width: "100%" }}>
          <Text type="secondary">
            الحالة الحالية: <b>{sh.statusName ?? statusId}</b>
          </Text>
          <Radio.Group value={decision} onChange={(e) => setDecision(e.target.value)}>
            <Space direction="vertical">
              <Radio value="resend">إعادة الإرسال للزبونة</Radio>
              {statusId === 11 && <Radio value="approve">الموافقة على التأجيل</Radio>}
              <Radio value="return">إرجاع الطلب للمحل</Radio>
            </Space>
          </Radio.Group>
          {decision === "return" && (
            <Alert type="warning" showIcon message="يعود الطرد للمحل ولا يُسلَّم للزبونة. تأكدي قبل الإرسال." />
          )}
          <Input.TextArea
            rows={3}
            maxLength={1000}
            showCount
            placeholder="ملاحظة للمندوب (اختياري) — مثل: الزبونة متاحة بعد الساعة 5"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </Space>
      </Modal>
    </div>
  );
}
