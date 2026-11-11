"use client";

import { Alert, App, Button, Input, Modal, Select, Space, Typography } from "antd";
import { ArrowLeftOutlined, StopOutlined, ThunderboltOutlined } from "@ant-design/icons";
import { useState } from "react";
import {
  ORDER_STATUSES,
  STATUS_ACTION_LABELS,
  STATUS_COLORS,
  STATUS_LABELS,
  nextStatuses,
} from "./order-utils";
import { useStaffRole } from "./order-hooks";

const { Text } = Typography;

/** مراحل يتولاها كاشير الطلبات وشركة التوصيل — التغيير اليدوي هنا نادر. */
const COURIER_STAGES = ["INVOICED", "HANDED_OVER", "OUT_FOR_DELIVERY", "DELIVERY_ISSUE", "RETURNING"];

/**
 * إجراءات حالة الطلب: الخطوة المنطقية التالية فقط، والإلغاء بتأكيد.
 * المدير العام وحده يملك «تغيير استثنائي» لأي حالة مع سبب إلزامي.
 */
export function OrderStatusActions({
  order,
  updating,
  onStatusChange,
}: {
  order: { status: string; deliveryOption?: string | null; fulfillmentStage?: string | null; orderNumber?: string };
  updating?: boolean;
  onStatusChange: (status: string, reason?: string) => void;
}) {
  const { modal } = App.useApp();
  const { isSuperAdmin } = useStaffRole();
  const [overrideOpen, setOverrideOpen] = useState(false);
  const [overrideStatus, setOverrideStatus] = useState<string | undefined>();
  const [reason, setReason] = useState("");

  const next = nextStatuses(order.status, order.deliveryOption);
  const canCancel = order.status !== "CANCELLED";
  const courierManaged = !!order.fulfillmentStage && COURIER_STAGES.includes(order.fulfillmentStage);

  const confirmMove = (status: string) =>
    modal.confirm({
      title: `نقل الطلب إلى «${STATUS_LABELS[status] ?? status}»؟`,
      content: courierManaged
        ? "هذا الطلب لدى شركة التوصيل وتتحدّث حالته تلقائياً — غيّريها يدوياً فقط إن كنتِ متأكدة."
        : undefined,
      okText: STATUS_ACTION_LABELS[status] ?? "تأكيد",
      cancelText: "رجوع",
      onOk: () => onStatusChange(status),
    });

  const confirmCancel = () =>
    modal.confirm({
      title: `إلغاء الطلب ${order.orderNumber ?? ""}؟`,
      content: "يُعاد المخزون والكوبون والنقاط، وتُعكس الدفعة الإلكترونية إن وُجدت. لا يمكن إعادة تفعيل طلب ملغى.",
      okText: "إلغاء الطلب",
      okButtonProps: { danger: true },
      cancelText: "رجوع",
      onOk: () => onStatusChange("CANCELLED"),
    });

  const submitOverride = () => {
    if (!overrideStatus || !reason.trim()) return;
    const st = overrideStatus;
    modal.confirm({
      title: `تغيير استثنائي إلى «${STATUS_LABELS[st] ?? st}»؟`,
      content: (
        <div>
          <div>السبب: {reason.trim()}</div>
          {st === "CANCELLED" && <div style={{ color: "#cf1322", marginTop: 6 }}>الإلغاء نهائي ولا يمكن التراجع عنه.</div>}
        </div>
      ),
      okText: "تنفيذ التغيير",
      okButtonProps: { danger: true },
      cancelText: "رجوع",
      onOk: () => {
        setOverrideOpen(false);
        onStatusChange(st, reason.trim());
      },
    });
  };

  return (
    <div>
      <Text type="secondary" className="ord-action-label">
        حالة الطلب — {STATUS_LABELS[order.status] ?? order.status}
      </Text>
      {courierManaged && (
        <Text type="secondary" style={{ display: "block", fontSize: 12, marginBottom: 6 }}>
          الطلب لدى شركة التوصيل — الحالة تتحدّث تلقائياً من هاي إكسبريس.
        </Text>
      )}
      <Space wrap size={8}>
        {next.map((s) => (
          <Button
            key={s}
            type="primary"
            loading={updating}
            icon={<ArrowLeftOutlined />}
            style={{ background: STATUS_COLORS[s], borderColor: STATUS_COLORS[s] }}
            onClick={() => confirmMove(s)}
          >
            {STATUS_ACTION_LABELS[s] ?? STATUS_LABELS[s] ?? s}
          </Button>
        ))}
        {canCancel && (
          <Button danger icon={<StopOutlined />} loading={updating} onClick={confirmCancel}>
            إلغاء الطلب
          </Button>
        )}
        {isSuperAdmin && order.status !== "CANCELLED" && (
          <Button
            icon={<ThunderboltOutlined />}
            onClick={() => {
              setOverrideStatus(undefined);
              setReason("");
              setOverrideOpen(true);
            }}
          >
            تغيير استثنائي
          </Button>
        )}
        {!next.length && !canCancel && <Text type="secondary">لا إجراءات متاحة — الطلب ملغى</Text>}
      </Space>

      <Modal
        title="تغيير استثنائي لحالة الطلب"
        open={overrideOpen}
        onCancel={() => setOverrideOpen(false)}
        onOk={submitOverride}
        okText="متابعة"
        cancelText="رجوع"
        okButtonProps={{ disabled: !overrideStatus || !reason.trim() }}
        destroyOnHidden
      >
        <Space direction="vertical" size={12} style={{ width: "100%" }}>
          <Alert
            type="warning"
            showIcon
            message="للمدير العام فقط"
            description="يتجاوز التسلسل الطبيعي للطلب. استخدميه لتصحيح خطأ فقط — لا يغيّر الشحنة لدى شركة التوصيل."
          />
          <Select
            style={{ width: "100%" }}
            placeholder="الحالة الجديدة"
            value={overrideStatus}
            onChange={setOverrideStatus}
            options={ORDER_STATUSES.filter((s) => s !== order.status).map((s) => ({
              value: s,
              label: STATUS_LABELS[s] ?? s,
            }))}
          />
          <Input.TextArea
            rows={3}
            maxLength={300}
            showCount
            placeholder="سبب التغيير (إلزامي)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
          <Text type="secondary" style={{ fontSize: 12 }}>
            يُسجَّل التغيير وسببه في سجل الطلب باسمك.
          </Text>
        </Space>
      </Modal>
    </div>
  );
}
