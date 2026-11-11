"use client";

import { Alert, Button, Empty, Skeleton, Space, Table, Tag, Tooltip, Typography } from "antd";
import {
  CheckCircleFilled,
  ClockCircleOutlined,
  CloseCircleFilled,
  GiftOutlined,
  PlusCircleFilled,
  ReloadOutlined,
  SwapOutlined,
} from "@ant-design/icons";
import type { ReactNode } from "react";
import { apiErrorMessage } from "@/lib/apiError";
import { mediaUrl } from "@/lib/mediaUrl";
import type { PickLine, PickMoney, PickView } from "@/lib/ordersApi";
import { PICK_COLORS, PRE_PICK_STAGES, formatIqd, formatOrderDate } from "./order-utils";
import { useOrderPick, useOrderShipment } from "./order-hooks";

const { Text } = Typography;

const STATE_ICON: Record<string, ReactNode> = {
  MATCHED: <CheckCircleFilled />,
  SHORT: <CloseCircleFilled />,
  EXTRA: <PlusCircleFilled />,
  PENDING: <ClockCircleOutlined />,
};

/** «المطلوب مقابل المُجهَّز» + المبالغ بعد التجهيز. */
export function OrderPickSection({ orderId, stage }: { orderId: string; stage?: string | null }) {
  const notStarted = !stage || PRE_PICK_STAGES.includes(stage);
  const cancelled = stage === "CANCELLED";
  const pick = useOrderPick(orderId, !notStarted);
  const shipment = useOrderShipment(orderId, !notStarted);

  if (notStarted) {
    return (
      <div className="ord-actions-card">
        <Text className="ord-section-title">المطلوب مقابل المُجهَّز</Text>
        <Text type="secondary">لم يبدأ التجهيز بعد — تظهر المقارنة هنا عند بدء الموظف بمسح الأصناف.</Text>
      </div>
    );
  }

  if (pick.isLoading) {
    return (
      <div className="ord-actions-card">
        <Text className="ord-section-title">المطلوب مقابل المُجهَّز</Text>
        <Skeleton active paragraph={{ rows: 3 }} />
      </div>
    );
  }

  if (pick.isError || !pick.data) {
    return (
      <div className="ord-actions-card">
        <Text className="ord-section-title">المطلوب مقابل المُجهَّز</Text>
        <Alert
          type="error"
          showIcon
          message={apiErrorMessage(pick.error, "تعذّر تحميل بيانات التجهيز")}
          action={
            <Button size="small" icon={<ReloadOutlined />} onClick={() => pick.refetch()}>
              إعادة المحاولة
            </Button>
          }
        />
      </div>
    );
  }

  const view = pick.data;
  const delivered = stage === "DELIVERED" || stage === "PARTIALLY_DELIVERED";
  return (
    <>
      <PickTable view={view} onRefresh={() => pick.refetch()} refreshing={pick.isFetching} />
      {!cancelled && (
        <OrderMoneyCard
          money={view.money}
          live={stage === "PICKING"}
          collectedAmount={delivered ? (shipment.data?.collectedAmount ?? null) : null}
        />
      )}
    </>
  );
}

function PickTable({ view, onRefresh, refreshing }: { view: PickView; onRefresh: () => void; refreshing: boolean }) {
  const byId = new Map(view.lines.map((l) => [l.id, l]));
  const o = view.order;
  const c = view.counts;

  return (
    <div className="ord-actions-card">
      <div className="ord-card-head">
        <Text className="ord-section-title" style={{ margin: 0 }}>
          المطلوب مقابل المُجهَّز
        </Text>
        <Tooltip title="تحديث">
          <Button size="small" type="text" icon={<ReloadOutlined />} loading={refreshing} onClick={onRefresh} />
        </Tooltip>
      </div>

      <div className="ord-pick-meta">
        <span>
          المجهِّز: <b>{o.pickerName ?? "—"}</b>
        </span>
        {o.pickStartedAt && <span>البدء: {formatOrderDate(o.pickStartedAt)}</span>}
        {o.pickedAt && <span>الانتهاء: {formatOrderDate(o.pickedAt)}</span>}
        {o.parcelCount ? <span>الطرود: {o.parcelCount}</span> : null}
      </div>

      <Space size={6} wrap style={{ marginBottom: 10 }}>
        <CountChip color={PICK_COLORS.green} icon={STATE_ICON.MATCHED} label="مطابق" n={c.matched} />
        <CountChip color={PICK_COLORS.red} icon={STATE_ICON.SHORT} label="ناقص" n={c.short} />
        <CountChip color={PICK_COLORS.yellow} icon={STATE_ICON.EXTRA} label="إضافي" n={c.extra} />
        <CountChip color={PICK_COLORS.grey} icon={STATE_ICON.PENDING} label="لم يُمسح" n={c.pending} />
        <Text type="secondary" style={{ fontSize: 12 }}>
          الوحدات: {c.pickedOrderedUnits.toLocaleString("ar-IQ")} / {c.orderedUnits.toLocaleString("ar-IQ")}
          {c.extraUnits ? ` + ${c.extraUnits.toLocaleString("ar-IQ")} إضافي` : ""}
        </Text>
      </Space>

      {!view.lines.length ? (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="لا أسطر تجهيز" />
      ) : (
        <Table<PickLine>
          rowKey="id"
          size="small"
          pagination={false}
          dataSource={view.lines}
          scroll={{ x: 560 }}
          onRow={(l) => {
            const color = PICK_COLORS[l.color] ?? PICK_COLORS.grey;
            return { style: { background: `${color}0f`, boxShadow: `inset -4px 0 0 ${color}` } };
          }}
          columns={[
            {
              title: "الحالة",
              width: 100,
              render: (_: unknown, l) => {
                const color = PICK_COLORS[l.color] ?? PICK_COLORS.grey;
                return (
                  <span className="ord-pick-state" style={{ color }}>
                    {STATE_ICON[l.state] ?? STATE_ICON.PENDING} {l.label}
                  </span>
                );
              },
            },
            {
              title: "الصنف",
              render: (_: unknown, l) => {
                const thumb = mediaUrl(l.thumb);
                return (
                  <div className="ord-pick-item">
                    <div
                      className="ord-pick-thumb"
                      style={{ background: thumb ? `center/cover url(${thumb})` : "#f1f5f9" }}
                    >
                      {!thumb && "📦"}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div className="ord-pick-name">{l.name}</div>
                      <div className="ord-pick-sub">
                        {l.shadeName && <span>{l.shadeName}</span>}
                        {l.barcode && <span dir="ltr">{l.barcode}</span>}
                      </div>
                    </div>
                  </div>
                );
              },
            },
            {
              title: "المطلوب",
              width: 70,
              align: "center",
              render: (_: unknown, l) => (l.kind === "EXTRA" ? "—" : l.orderedQty.toLocaleString("ar-IQ")),
            },
            {
              title: "المُجهَّز",
              width: 70,
              align: "center",
              render: (_: unknown, l) => <b>{l.pickedQty.toLocaleString("ar-IQ")}</b>,
            },
            {
              title: "ملاحظات",
              render: (_: unknown, l) => {
                const sub = l.substituteForLineId ? byId.get(l.substituteForLineId) : undefined;
                return (
                  <Space size={4} wrap>
                    {l.kind === "EXTRA" &&
                      (l.charge === "FREE" ? (
                        <Tag color="magenta" icon={<GiftOutlined />} style={{ margin: 0 }}>
                          هدية مجانية
                        </Tag>
                      ) : (
                        <Tag color="gold" style={{ margin: 0 }}>
                          مدفوع {formatIqd(l.unitPrice)}
                        </Tag>
                      ))}
                    {sub && (
                      <Tag icon={<SwapOutlined />} style={{ margin: 0 }}>
                        بديل عن: {sub.name}
                        {sub.shadeName ? ` (${sub.shadeName})` : ""}
                      </Tag>
                    )}
                    {l.missingQty > 0 && (
                      <Text style={{ color: PICK_COLORS.red, fontSize: 12 }}>ناقص {l.missingQty.toLocaleString("ar-IQ")}</Text>
                    )}
                    {l.manualConfirm && (
                      <Tag color="default" style={{ margin: 0 }}>
                        تأكيد يدوي
                      </Tag>
                    )}
                    {l.reason && <Text type="secondary" style={{ fontSize: 12 }}>السبب: {l.reason}</Text>}
                  </Space>
                );
              },
            },
          ]}
        />
      )}
    </div>
  );
}

function CountChip({ color, icon, label, n }: { color: string; icon: ReactNode; label: string; n: number }) {
  return (
    <span className="ord-pick-chip" style={{ color, borderColor: `${color}55`, background: `${color}10` }}>
      {icon} {label} {n.toLocaleString("ar-IQ")}
    </span>
  );
}

/** تسلسل المبلغ: الأصلي ← النواقص ← الإضافات ← التقريب ← النهائي، ثم ما تحصّله شركة التوصيل. */
export function OrderMoneyCard({
  money,
  live,
  collectedAmount,
}: {
  money: PickMoney;
  live?: boolean;
  collectedAmount?: number | null;
}) {
  const original = money.finalTotal - money.adjustmentTotal;
  const recalc = money.discountRecalc ?? 0;
  return (
    <div className="ord-summary-card">
      <div className="ord-card-head">
        <Text className="ord-section-title" style={{ margin: 0 }}>
          المبلغ بعد التجهيز
        </Text>
        <Space size={4}>
          {live && <Tag color="purple">تقديري — التجهيز جارٍ</Tag>}
          {money.needsApproval && <Tag color="red">يحتاج موافقة المدير</Tag>}
          {money.allMissing && <Tag color="red">كل الأصناف ناقصة</Tag>}
        </Space>
      </div>
      <div className="ord-summary-row">
        <span>المبلغ الأصلي للطلب</span>
        <span>{formatIqd(original)}</span>
      </div>
      {money.shortageValue > 0 && (
        <div className="ord-summary-row" style={{ color: PICK_COLORS.red }}>
          <span>النواقص</span>
          <span>− {formatIqd(money.shortageValue)}</span>
        </div>
      )}
      {money.extrasValue > 0 && (
        <div className="ord-summary-row" style={{ color: "#b45309" }}>
          <span>إضافات مدفوعة</span>
          <span>+ {formatIqd(money.extrasValue)}</span>
        </div>
      )}
      {money.freeExtrasValue > 0 && (
        <div className="ord-summary-row" style={{ color: "#94a3b8" }}>
          <span>هدايا وعينات مجانية (لا تُحسب)</span>
          <span>{formatIqd(money.freeExtrasValue)}</span>
        </div>
      )}
      {recalc !== 0 && (
        <div className="ord-summary-row">
          <span>إعادة احتساب الخصم</span>
          <span>
            {recalc > 0 ? "+ " : "− "}
            {formatIqd(Math.abs(recalc))}
          </span>
        </div>
      )}
      {money.roundingDiscount > 0 && (
        <div className="ord-summary-row ord-summary-discount">
          <span>خصم التقريب</span>
          <span>− {formatIqd(money.roundingDiscount)}</span>
        </div>
      )}
      <div className="ord-summary-row ord-summary-total" style={{ borderTop: "1px solid #e2e8f0", marginTop: 6, paddingTop: 8 }}>
        <span>المبلغ النهائي</span>
        <span>{formatIqd(money.finalTotal)}</span>
      </div>
      <div className="ord-money-cod">
        <span>تحصّله شركة التوصيل</span>
        <b>{formatIqd(money.codAmount)}</b>
      </div>
      {money.prepaid && money.refundAmount > 0 && (
        <div className="ord-summary-row" style={{ color: PICK_COLORS.red, fontWeight: 700 }}>
          <span>يُرجع للزبونة (مدفوع مسبقاً)</span>
          <span>{formatIqd(money.refundAmount)}</span>
        </div>
      )}
      {collectedAmount != null && (
        <div className="ord-summary-row" style={{ color: PICK_COLORS.green, fontWeight: 700 }}>
          <span>المُحصَّل فعلاً من المندوب</span>
          <span>{formatIqd(collectedAmount)}</span>
        </div>
      )}
    </div>
  );
}
