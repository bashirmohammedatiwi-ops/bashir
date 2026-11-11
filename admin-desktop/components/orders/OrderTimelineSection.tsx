"use client";

import { Alert, Button, Empty, Skeleton, Timeline, Tooltip, Typography } from "antd";
import { HistoryOutlined, ReloadOutlined } from "@ant-design/icons";
import type { ReactNode } from "react";
import { apiErrorMessage } from "@/lib/apiError";
import type { TimelineEvent } from "@/lib/ordersApi";
import { STATUS_LABELS, formatIqd, formatOrderDate } from "./order-utils";
import { useOrderTimeline } from "./order-hooks";

const { Text } = Typography;

const TYPE_LABELS: Record<string, string> = {
  PICK_STARTED: "بدأ التجهيز",
  PICK_TAKEOVER: "نُقل التجهيز لموظف آخر",
  PICK_EXTRA_ADDED: "أُضيف صنف إضافي",
  PICK_LINE_EDITED: "عُدّل سطر يدوياً",
  PICK_FINISHED: "انتهى التجهيز",
  PICK_REOPENED: "أُعيد فتح التجهيز",
  INVOICED: "فُوتر في كاشير الطلبات",
  SHIPMENT_CREATED: "أُنشئت الشحنة لدى هاي إكسبريس",
  SHIPMENT_RETRYING: "تعذّر إنشاء الشحنة — إعادة محاولة تلقائية",
  SHIPMENT_FAILED: "فشل إنشاء الشحنة",
  SHIPMENT_RETRY: "إعادة إنشاء الشحنة يدوياً",
  SHIPMENT_CANCELLED: "أُلغيت الشحنة",
  SHIPMENT_DECISION: "قرار على التأجيل/الفشل",
  COURIER_STATUS: "تحديث من شركة التوصيل",
  COURIER_STATUS_UNKNOWN: "حالة غير معروفة من شركة التوصيل",
  CUSTOMER_NOTIFIED: "أُرسل إشعار للزبونة",
  REFUND_FAILED: "تعذّر استرجاع المبلغ",
  POS_RETURN: "سُجّل إيصال إرجاع في الكاشير",
  PICKUP_HANDED: "سُلّم للزبونة في المحل",
  STATUS_CHANGED: "تغيّرت حالة الطلب",
};

const ACTOR_LABELS: Record<string, string> = {
  STAFF: "موظف",
  CASHIER: "الكاشير",
  SYSTEM: "النظام",
  COURIER: "شركة التوصيل",
  CUSTOMER: "الزبونة",
};

const DECISION_LABELS: Record<string, string> = {
  resend: "إعادة الإرسال",
  approve: "الموافقة على التأجيل",
  return: "إرجاع للمحل",
};

const BY_LABELS: Record<string, string> = { staff: "الإدارة", customer: "الزبونة", system: "النظام" };

function color(type: string): string {
  if (type === "SHIPMENT_FAILED" || type === "REFUND_FAILED" || type === "SHIPMENT_CANCELLED") return "red";
  if (type === "SHIPMENT_RETRYING" || type === "COURIER_STATUS_UNKNOWN" || type === "PICK_REOPENED") return "orange";
  if (type === "PICK_FINISHED" || type === "INVOICED" || type === "SHIPMENT_CREATED" || type === "PICKUP_HANDED") return "green";
  if (type.startsWith("COURIER")) return "#0891b2";
  if (type === "STATUS_CHANGED") return "#4a2466";
  return "blue";
}

const s = (v: unknown) => (v == null || v === "" ? null : String(v));
const n = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : null);

/** أهم بيانات الحدث بسطر أو سطرين. */
function details(e: TimelineEvent): ReactNode[] {
  const d = (e.data ?? {}) as Record<string, unknown>;
  const out: ReactNode[] = [];
  const push = (node: ReactNode) => out.push(node);
  switch (e.type) {
    case "PICK_TAKEOVER":
      if (s(d.from)) push(`من: ${s(d.from)}`);
      break;
    case "PICK_EXTRA_ADDED":
      push(
        `${s(d.name) ?? "صنف"}${s(d.shadeName) ? ` (${s(d.shadeName)})` : ""} × ${n(d.qty) ?? 1} — ${
          d.charge === "FREE" ? "هدية مجانية" : "مدفوع"
        }`,
      );
      if (s(d.reason)) push(`السبب: ${s(d.reason)}`);
      break;
    case "PICK_LINE_EDITED": {
      if (s(d.line)) push(`السطر: ${s(d.line)}`);
      const extra: string[] = [];
      if (n(d.pickedQty) != null) extra.push(`المُجهَّز: ${n(d.pickedQty)}`);
      if (s(d.charge)) extra.push(d.charge === "FREE" ? "هدية مجانية" : "مدفوع");
      if (s(d.reason)) extra.push(`السبب: ${s(d.reason)}`);
      if (extra.length) push(extra.join(" · "));
      break;
    }
    case "PICK_FINISHED": {
      push(`مطابق ${n(d.matched) ?? 0} · ناقص ${n(d.short) ?? 0} · إضافي ${n(d.extra) ?? 0} · الطرود ${n(d.parcelCount) ?? 1}`);
      const orig = n(d.originalTotal);
      const fin = n(d.finalTotal);
      if (orig != null && fin != null) {
        push(orig === fin ? `المبلغ: ${formatIqd(fin)}` : `المبلغ: ${formatIqd(orig)} ← ${formatIqd(fin)}`);
      }
      if (n(d.codAmount) != null) push(`التحصيل: ${formatIqd(n(d.codAmount))}`);
      if ((n(d.refundAmount) ?? 0) > 0) push(`يُرجع للزبونة: ${formatIqd(n(d.refundAmount))}`);
      if (d.approvedByManager) push("بموافقة المدير");
      break;
    }
    case "PICK_REOPENED":
      if (s(d.reason)) push(`السبب: ${s(d.reason)}`);
      break;
    case "INVOICED":
    case "PICKUP_HANDED":
      if (s(d.receiptNumber)) push(`رقم الإيصال: ${s(d.receiptNumber)}`);
      if (n(d.total) != null) push(`المجموع: ${formatIqd(n(d.total))}`);
      if (s(d.terminal)) push(`الجهاز: ${s(d.terminal)}`);
      break;
    case "SHIPMENT_CREATED":
      if (s(d.tracking)) push(<span key="t">رقم التتبع: <span dir="ltr">{s(d.tracking)}</span></span>);
      if (n(d.cod) != null) push(`مبلغ التحصيل: ${formatIqd(n(d.cod))}`);
      break;
    case "SHIPMENT_RETRYING":
    case "SHIPMENT_FAILED":
      if (s(d.error)) push(<Text key="e" type="danger">{s(d.error)}</Text>);
      break;
    case "SHIPMENT_DECISION":
      push(`القرار: ${DECISION_LABELS[String(d.decision)] ?? s(d.decision) ?? "—"}`);
      if (s(d.note)) push(`ملاحظة: ${s(d.note)}`);
      break;
    case "COURIER_STATUS":
      if (s(d.label)) push(<b key="l">{s(d.label)}</b>);
      if (s(d.note)) push(`ملاحظة المندوب: ${s(d.note)}`);
      if (s(d.driver)) push(`المندوب: ${s(d.driver)}`);
      if (n(d.collected) != null) push(`المُحصَّل: ${formatIqd(n(d.collected))}`);
      if (s(d.proof))
        push(
          <a key="p" href={s(d.proof)!} target="_blank" rel="noreferrer">
            صورة الإثبات
          </a>,
        );
      break;
    case "COURIER_STATUS_UNKNOWN":
      push(`رقم الحالة: ${s(d.statusId) ?? "—"}`);
      if (s(d.note)) push(`ملاحظة: ${s(d.note)}`);
      break;
    case "CUSTOMER_NOTIFIED":
      if (s(d.title)) push(`«${s(d.title)}»`);
      break;
    case "REFUND_FAILED":
      if (n(d.amount) != null) push(`المبلغ: ${formatIqd(n(d.amount))}`);
      if (s(d.error)) push(<Text key="e" type="danger">{s(d.error)}</Text>);
      break;
    case "POS_RETURN":
      if (s(d.receiptNumber)) push(`رقم إيصال الإرجاع: ${s(d.receiptNumber)}`);
      if (Array.isArray(d.lines)) push(`عدد الأسطر: ${d.lines.length}`);
      break;
    case "STATUS_CHANGED": {
      const to = s(d.status);
      const from = s(d.previousStatus);
      if (to) push(from ? `${STATUS_LABELS[from] ?? from} ← ${STATUS_LABELS[to] ?? to}` : `إلى: ${STATUS_LABELS[to] ?? to}`);
      if (s(d.by) && BY_LABELS[String(d.by)]) push(`بواسطة: ${BY_LABELS[String(d.by)]}`);
      if (s(d.reason)) push(`السبب: ${s(d.reason)}`);
      break;
    }
    default:
      break;
  }
  return out;
}

export function OrderTimelineSection({ orderId }: { orderId: string }) {
  const q = useOrderTimeline(orderId);
  const events = q.data ?? [];

  return (
    <div className="ord-actions-card">
      <div className="ord-card-head">
        <Text className="ord-section-title" style={{ margin: 0 }}>
          <HistoryOutlined /> السجل الزمني
        </Text>
        <Tooltip title="تحديث">
          <Button size="small" type="text" icon={<ReloadOutlined />} loading={q.isFetching} onClick={() => q.refetch()} />
        </Tooltip>
      </div>
      {q.isLoading ? (
        <Skeleton active paragraph={{ rows: 3 }} />
      ) : q.isError ? (
        <Alert type="error" showIcon message={apiErrorMessage(q.error, "تعذّر تحميل السجل الزمني")} />
      ) : !events.length ? (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="لا أحداث بعد" />
      ) : (
        <Timeline
          style={{ marginTop: 12 }}
          items={events.map((e) => {
            const lines = details(e);
            const actor = [e.actorName, ACTOR_LABELS[e.actorType] ?? e.actorType].filter(Boolean);
            const label = TYPE_LABELS[e.type] ?? e.label ?? e.type;
            return {
              key: e.id,
              color: color(e.type),
              content: (
                <div className="ord-tl-item">
                  <div className="ord-tl-top">
                    <b>{label}</b>
                    <span className="ord-tl-time">{formatOrderDate(e.at)}</span>
                  </div>
                  <div className="ord-tl-actor">
                    {actor.length === 2 && actor[0] !== actor[1] ? `${actor[0]} · ${actor[1]}` : actor[actor.length - 1]}
                  </div>
                  {lines.map((l, i) => (
                    <div key={i} className="ord-tl-line">
                      {l}
                    </div>
                  ))}
                </div>
              ),
            };
          })}
        />
      )}
    </div>
  );
}
