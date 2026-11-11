"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Checkbox, Drawer, Input, Pagination, Select, Spin, Tooltip, message } from "antd";
import { PrinterOutlined, SearchOutlined } from "@ant-design/icons";
import { useMemo, useState } from "react";
import { mutations, queries } from "@/lib/queries";
import { mediaUrl } from "@/lib/mediaUrl";
import { ordersApi, type ControlOrderRow } from "@/lib/ordersApi";
import { OrderDetailPanel } from "@/components/orders/OrderDetailPanel";
import { OrderImageStack } from "@/components/orders/OrderItemsList";
import { OrderAdjustedBadge, OrderStageBadge, OrderStatusBadge } from "@/components/orders/OrderStatusBadge";
import { PickSlipPrintModal } from "@/components/orders/PickSlipPrintModal";
import { orderKeys } from "@/components/orders/order-hooks";
import {
  ORDER_STATUSES,
  STAGE_QUICK_FILTERS,
  STATUS_COLORS,
  STATUS_LABELS,
  formatIqd,
  formatOrderDate,
  previewImages,
} from "@/components/orders/order-utils";
import "@/components/orders/orders.css";

const PAYMENT_FILTERS = [
  { value: "PENDING", label: "بانتظار الدفع" },
  { value: "PAID", label: "مدفوع" },
  { value: "FAILED", label: "فشل" },
  { value: "REFUNDED", label: "مسترد" },
];

const PAGE_SIZE = 12;

/** صف القائمة بشكل واحد سواء جاء من /orders أو من /control/orders (فلاتر المراحل). */
type ListRow = {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  createdAt: string;
  customer: string;
  place: string | null;
  itemsCount: number;
  images: string[];
  stage: string | null;
  adjusted: boolean;
};

function fromOrders(o: any): ListRow {
  const images = previewImages(o);
  return {
    id: o.id,
    orderNumber: o.orderNumber,
    status: o.status,
    total: o.total,
    createdAt: o.createdAt,
    customer: o.user?.name ?? o.user?.email ?? o.address?.fullName ?? "—",
    place: o.address?.city ?? o.address?.governorate ?? null,
    itemsCount: o._count?.items ?? o.items?.length ?? 0,
    images,
    stage: o.fulfillmentStage ?? null,
    adjusted: (o.adjustmentTotal ?? 0) !== 0,
  };
}

function fromControl(o: ControlOrderRow): ListRow {
  return {
    id: o.id,
    orderNumber: o.orderNumber,
    status: o.status,
    total: o.total,
    createdAt: o.createdAt,
    customer: o.customer,
    place: o.place,
    itemsCount: o.itemsCount,
    images: (o.thumbs ?? []).map((t) => mediaUrl(t)).filter((x): x is string => !!x),
    stage: o.fulfillmentStage,
    adjusted: o.adjusted,
  };
}

export default function OrdersPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<string | undefined>();
  const [paymentStatus, setPaymentStatus] = useState<string | undefined>();
  const [stageKey, setStageKey] = useState<string | undefined>();
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [checked, setChecked] = useState<string[]>([]);
  const [printIds, setPrintIds] = useState<string[] | null>(null);
  const qc = useQueryClient();

  const stageFilter = STAGE_QUICK_FILTERS.find((f) => f.key === stageKey);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["orders", page, status, paymentStatus, search, stageKey ?? null],
    queryFn: async (): Promise<{ rows: ListRow[]; total: number }> => {
      if (stageFilter) {
        const res = await ordersApi.list({
          stage: stageFilter.stages.join(","),
          status,
          q: search || undefined,
          page,
          limit: PAGE_SIZE,
        });
        return { rows: res.data.map(fromControl), total: res.meta?.total ?? 0 };
      }
      const res = await queries.orders({ page, limit: PAGE_SIZE, status, paymentStatus, search: search || undefined });
      return { rows: (res?.data ?? []).map(fromOrders), total: res?.meta?.total ?? 0 };
    },
  });

  // عدّادات المراحل (مجاميع كل الطلبات) — من أي استعلام على /control/orders.
  const { data: stageCounts } = useQuery({
    queryKey: ["orders", "stage-counts"],
    queryFn: () => ordersApi.list({ limit: 1 }).then((r) => r.counts ?? {}),
    staleTime: 60_000,
  });

  const { data: detail, isLoading: detailLoading } = useQuery({
    queryKey: ["order", selectedId],
    queryFn: () => queries.order(selectedId!),
    enabled: !!selectedId,
  });

  const update = useMutation({
    mutationFn: ({ id, status: st, paymentStatus: ps, reason }: any) =>
      mutations.updateOrderStatus(id, { status: st, ...(ps ? { paymentStatus: ps } : {}), ...(reason ? { reason } : {}) }),
    onSuccess: () => {
      message.success("تم التحديث");
      qc.invalidateQueries({ queryKey: ["orders"] });
      qc.invalidateQueries({ queryKey: ["order", selectedId] });
      if (selectedId) {
        qc.invalidateQueries({ queryKey: orderKeys.timeline(selectedId) });
        qc.invalidateQueries({ queryKey: orderKeys.pick(selectedId) });
        qc.invalidateQueries({ queryKey: orderKeys.shipment(selectedId) });
      }
    },
  });

  const items = data?.rows ?? [];
  const total = data?.total ?? 0;

  const statusCounts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const o of items) map[o.status] = (map[o.status] ?? 0) + 1;
    return map;
  }, [items]);

  const stageCount = (stages: string[]) =>
    stages.reduce((n, s) => n + (stageCounts?.[`stage:${s}`] ?? 0), 0);

  const pageIds = items.map((o) => o.id);
  const allPageChecked = pageIds.length > 0 && pageIds.every((id) => checked.includes(id));

  function toggleChecked(id: string, on: boolean) {
    setChecked((prev) => (on ? (prev.includes(id) ? prev : [...prev, id]) : prev.filter((x) => x !== id)));
  }

  function togglePage(on: boolean) {
    setChecked((prev) => (on ? [...new Set([...prev, ...pageIds])] : prev.filter((x) => !pageIds.includes(x))));
  }

  function selectOrder(id: string) {
    setSelectedId(id);
    if (typeof window !== "undefined" && window.innerWidth < 992) {
      setMobileOpen(true);
    }
  }

  function handleSearch() {
    setSearch(searchInput.trim());
    setPage(1);
  }

  function chooseStage(key: string | undefined) {
    setStageKey(key);
    // واجهة المراحل لا تدعم فلتر الدفع.
    if (key) setPaymentStatus(undefined);
    setPage(1);
  }

  const detailPanelProps = {
    updating: update.isPending,
    onStatusChange: (st: string, reason?: string) => update.mutate({ id: selectedId, status: st, reason }),
    onPaymentStatusChange: (ps: string) => update.mutate({ id: selectedId, status: detail?.status, paymentStatus: ps }),
  };

  return (
    <div className="ord-page">
      <div className="ord-page-header">
        <div>
          <h2>الطلبات</h2>
          <span style={{ color: "#94a3b8", fontSize: 13 }}>
            {total.toLocaleString("ar-IQ")} طلب — اختر طلباً لعرض التفاصيل والصور
          </span>
        </div>
      </div>

      <div className="ord-filters">
        <Input
          prefix={<SearchOutlined />}
          placeholder="بحث برقم الطلب، الاسم، الهاتف..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onPressEnter={handleSearch}
          allowClear
          style={{ width: 280 }}
        />
        <Select
          allowClear
          placeholder="حالة الطلب"
          style={{ width: 170 }}
          value={status}
          options={ORDER_STATUSES.map((s) => ({ value: s, label: STATUS_LABELS[s] ?? s }))}
          onChange={(v) => {
            setStatus(v);
            setPage(1);
          }}
        />
        <Tooltip title={stageFilter ? "فلتر الدفع غير متاح مع فلاتر مراحل التجهيز" : undefined}>
          <Select
            allowClear
            placeholder="حالة الدفع"
            style={{ width: 160 }}
            value={paymentStatus}
            disabled={!!stageFilter}
            options={PAYMENT_FILTERS}
            onChange={(v) => {
              setPaymentStatus(v);
              setPage(1);
            }}
          />
        </Tooltip>
      </div>

      <div className="ord-status-chips">
        <button
          type="button"
          className={`ord-status-chip${!status ? " active" : ""}`}
          style={!status ? { background: "#334155" } : undefined}
          onClick={() => {
            setStatus(undefined);
            setPage(1);
          }}
        >
          الكل
        </button>
        {ORDER_STATUSES.map((s) => (
          <button
            key={s}
            type="button"
            className={`ord-status-chip${status === s ? " active" : ""}`}
            style={status === s ? { background: STATUS_COLORS[s] } : undefined}
            onClick={() => {
              setStatus(s);
              setPage(1);
            }}
          >
            {STATUS_LABELS[s]}
            {statusCounts[s] ? ` (${statusCounts[s]})` : ""}
          </button>
        ))}
      </div>

      <div className="ord-status-chips ord-stage-chips">
        <span className="ord-stage-chips-label">مراحل التجهيز والشحن:</span>
        <button
          type="button"
          className={`ord-status-chip${!stageKey ? " active" : ""}`}
          style={!stageKey ? { background: "#334155" } : undefined}
          onClick={() => chooseStage(undefined)}
        >
          كل المراحل
        </button>
        {STAGE_QUICK_FILTERS.map((f) => {
          const n = stageCount(f.stages);
          const active = stageKey === f.key;
          return (
            <button
              key={f.key}
              type="button"
              className={`ord-status-chip${active ? " active" : ""}`}
              style={active ? { background: f.color } : { borderColor: `${f.color}55`, color: f.color }}
              onClick={() => chooseStage(active ? undefined : f.key)}
            >
              {f.label}
              {n ? ` (${n.toLocaleString("ar-IQ")})` : ""}
            </button>
          );
        })}
      </div>

      <div className="ord-workspace">
        <div className="ord-list-panel">
          <div className="ord-list-toolbar">
            <Checkbox
              checked={allPageChecked}
              indeterminate={!allPageChecked && pageIds.some((id) => checked.includes(id))}
              disabled={!pageIds.length}
              onChange={(e) => togglePage(e.target.checked)}
            >
              تحديد الصفحة
            </Checkbox>
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              {checked.length > 0 && (
                <Button size="small" type="link" onClick={() => setChecked([])}>
                  إلغاء التحديد
                </Button>
              )}
              <Button
                size="small"
                icon={<PrinterOutlined />}
                disabled={!checked.length}
                onClick={() => setPrintIds(checked)}
              >
                طباعة قوائم التجهيز{checked.length ? ` (${checked.length})` : ""}
              </Button>
            </div>
          </div>
          {isLoading ? (
            <div style={{ padding: 48, textAlign: "center" }}>
              <Spin />
            </div>
          ) : isError ? (
            <div style={{ padding: 48, textAlign: "center", color: "#dc2626" }}>
              تعذّر تحميل الطلبات —{" "}
              <Button type="link" size="small" onClick={() => refetch()}>
                إعادة المحاولة
              </Button>
            </div>
          ) : items.length === 0 ? (
            <div style={{ padding: 48, textAlign: "center", color: "#94a3b8" }}>لا توجد طلبات</div>
          ) : (
            <div className="ord-list-scroll">
              {items.map((order) => {
                const imgs = order.images.slice(0, 4);
                const extra = order.itemsCount - imgs.length;
                const selected = selectedId === order.id;
                const isChecked = checked.includes(order.id);
                return (
                  <div
                    key={order.id}
                    className={`ord-list-row${selected ? " selected" : ""}`}
                    onClick={() => selectOrder(order.id)}
                  >
                    <div className="ord-list-check" onClick={(e) => e.stopPropagation()}>
                      <Checkbox checked={isChecked} onChange={(e) => toggleChecked(order.id, e.target.checked)} />
                    </div>
                    <OrderImageStack urls={imgs} extra={extra > 0 ? extra : undefined} />
                    <div className="ord-list-main">
                      <div className="ord-list-top">
                        <span className="ord-list-number">{order.orderNumber}</span>
                        <OrderStatusBadge status={order.status} />
                      </div>
                      <div className="ord-list-customer">{order.customer}</div>
                      {(order.stage || order.adjusted) && (
                        <div className="ord-list-stage">
                          <OrderStageBadge stage={order.stage} size="small" />
                          {order.adjusted && <OrderAdjustedBadge size="small" />}
                        </div>
                      )}
                      <div className="ord-list-meta">
                        <span>{formatOrderDate(order.createdAt)}</span>
                        {order.place && <span>{order.place}</span>}
                        <span>{order.itemsCount} منتج</span>
                      </div>
                    </div>
                    <div className="ord-list-side">
                      <span className="ord-list-total">{formatIqd(order.total)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <div className="ord-list-pagination">
            <Pagination
              current={page}
              total={total}
              pageSize={PAGE_SIZE}
              onChange={setPage}
              showSizeChanger={false}
              size="small"
            />
          </div>
        </div>

        <div className="ord-detail-panel">
          <OrderDetailPanel
            order={selectedId ? detail : null}
            loading={!!selectedId && detailLoading}
            {...detailPanelProps}
          />
        </div>
      </div>

      <Drawer
        title={detail?.orderNumber ? `طلب ${detail.orderNumber}` : "تفاصيل الطلب"}
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        width="100%"
        styles={{ body: { padding: 0 } }}
      >
        <OrderDetailPanel order={detail} loading={detailLoading} {...detailPanelProps} />
      </Drawer>

      <PickSlipPrintModal open={!!printIds} orderIds={printIds ?? []} onClose={() => setPrintIds(null)} />
    </div>
  );
}
