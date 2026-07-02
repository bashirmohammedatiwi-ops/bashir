"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Drawer, Input, Pagination, Select, Spin, message } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import { useMemo, useState } from "react";
import { mutations, queries } from "@/lib/queries";
import { OrderDetailPanel } from "@/components/orders/OrderDetailPanel";
import { OrderImageStack } from "@/components/orders/OrderItemsList";
import { OrderStatusBadge } from "@/components/orders/OrderStatusBadge";
import {
  ORDER_STATUSES,
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

export default function OrdersPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<string | undefined>();
  const [paymentStatus, setPaymentStatus] = useState<string | undefined>();
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["orders", page, status, paymentStatus, search],
    queryFn: () =>
      queries.orders({ page, limit: 12, status, paymentStatus, search: search || undefined }),
  });

  const { data: detail, isLoading: detailLoading } = useQuery({
    queryKey: ["order", selectedId],
    queryFn: () => queries.order(selectedId!),
    enabled: !!selectedId,
  });

  const update = useMutation({
    mutationFn: ({ id, status: st, paymentStatus: ps }: any) =>
      mutations.updateOrderStatus(id, { status: st, ...(ps ? { paymentStatus: ps } : {}) }),
    onSuccess: () => {
      message.success("تم التحديث");
      qc.invalidateQueries({ queryKey: ["orders"] });
      qc.invalidateQueries({ queryKey: ["order", selectedId] });
    },
  });

  const items = data?.data ?? [];
  const total = data?.meta?.total ?? 0;

  const statusCounts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const o of items) map[o.status] = (map[o.status] ?? 0) + 1;
    return map;
  }, [items]);

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
        <Select
          allowClear
          placeholder="حالة الدفع"
          style={{ width: 160 }}
          value={paymentStatus}
          options={PAYMENT_FILTERS}
          onChange={(v) => {
            setPaymentStatus(v);
            setPage(1);
          }}
        />
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

      <div className="ord-workspace">
        <div className="ord-list-panel">
          {isLoading ? (
            <div style={{ padding: 48, textAlign: "center" }}>
              <Spin />
            </div>
          ) : items.length === 0 ? (
            <div style={{ padding: 48, textAlign: "center", color: "#94a3b8" }}>لا توجد طلبات</div>
          ) : (
            <div className="ord-list-scroll">
              {items.map((order: any) => {
                const imgs = previewImages(order);
                const extra = (order._count?.items ?? order.items?.length ?? 0) - imgs.length;
                const selected = selectedId === order.id;
                return (
                  <div
                    key={order.id}
                    className={`ord-list-row${selected ? " selected" : ""}`}
                    onClick={() => selectOrder(order.id)}
                  >
                    <OrderImageStack urls={imgs} extra={extra > 0 ? extra : undefined} />
                    <div className="ord-list-main">
                      <div className="ord-list-top">
                        <span className="ord-list-number">{order.orderNumber}</span>
                        <OrderStatusBadge status={order.status} />
                      </div>
                      <div className="ord-list-customer">
                        {order.user?.name ?? order.user?.email ?? "—"}
                      </div>
                      <div className="ord-list-meta">
                        <span>{formatOrderDate(order.createdAt)}</span>
                        {order.address?.city && <span>{order.address.city}</span>}
                        <span>{order._count?.items ?? order.items?.length ?? 0} منتج</span>
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
              pageSize={12}
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
            updating={update.isPending}
            onStatusChange={(st) => update.mutate({ id: selectedId, status: st })}
            onPaymentStatusChange={(ps) =>
              update.mutate({ id: selectedId, status: detail?.status, paymentStatus: ps })
            }
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
        <OrderDetailPanel
          order={detail}
          loading={detailLoading}
          updating={update.isPending}
          onStatusChange={(st) => update.mutate({ id: selectedId, status: st })}
          onPaymentStatusChange={(ps) =>
            update.mutate({ id: selectedId, status: detail?.status, paymentStatus: ps })
          }
        />
      </Drawer>
    </div>
  );
}
