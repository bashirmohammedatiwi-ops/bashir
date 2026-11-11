"use client";

import { useQuery } from "@tanstack/react-query";
import { Alert, Button, Modal, Segmented, Space, Spin, Typography } from "antd";
import { PrinterOutlined } from "@ant-design/icons";
import { useEffect, useRef, useState } from "react";
import { apiErrorMessage } from "@/lib/apiError";
import { ordersApi, type PickSlip } from "@/lib/ordersApi";
import { buildPickSlipsHtml, type SlipLayout } from "@/lib/pickSlip";

const { Text } = Typography;
const LAYOUT_KEY = "alhayaa-slip-layout";

function readLayout(): SlipLayout {
  try {
    return localStorage.getItem(LAYOUT_KEY) === "a4" ? "a4" : "thermal";
  } catch {
    return "thermal";
  }
}

type SlipBatch = { slips: PickSlip[]; failed: { id: string; error: string }[] };

/** معاينة وطباعة قائمة التجهيز لطلب واحد أو عدة طلبات (حراري 80 مم أو A4). */
export function PickSlipPrintModal({
  open,
  orderIds,
  onClose,
}: {
  open: boolean;
  orderIds: string[];
  onClose: () => void;
}) {
  const [layout, setLayout] = useState<SlipLayout>("thermal");
  const [html, setHtml] = useState<string | null>(null);
  const [buildError, setBuildError] = useState<string | null>(null);
  const frame = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (open) setLayout(readLayout());
  }, [open]);

  const q = useQuery({
    queryKey: ["pick-slips", orderIds],
    enabled: open && orderIds.length > 0,
    placeholderData: undefined,
    staleTime: 0,
    queryFn: async (): Promise<SlipBatch> => {
      const res = await Promise.allSettled(orderIds.map((id) => ordersApi.slip(id)));
      const batch: SlipBatch = { slips: [], failed: [] };
      res.forEach((r, i) => {
        if (r.status === "fulfilled" && r.value) batch.slips.push(r.value);
        else batch.failed.push({ id: orderIds[i], error: apiErrorMessage(r.status === "rejected" ? r.reason : null, "تعذّر التحميل") });
      });
      return batch;
    },
  });

  useEffect(() => {
    let alive = true;
    setHtml(null);
    setBuildError(null);
    const slips = q.data?.slips ?? [];
    if (!open || !slips.length) return;
    buildPickSlipsHtml(slips, layout)
      .then((doc) => alive && setHtml(doc))
      .catch((e: unknown) => alive && setBuildError((e as Error)?.message ?? "تعذّر تجهيز الطباعة"));
    return () => {
      alive = false;
    };
  }, [open, q.data, layout]);

  const print = () => {
    const win = frame.current?.contentWindow;
    if (!win) return;
    win.focus();
    win.print();
  };

  const changeLayout = (v: SlipLayout) => {
    setLayout(v);
    try {
      localStorage.setItem(LAYOUT_KEY, v);
    } catch {
      /* ignore */
    }
  };

  const failed = q.data?.failed ?? [];
  const count = q.data?.slips.length ?? 0;

  return (
    <Modal
      title={orderIds.length > 1 ? `طباعة قوائم التجهيز (${orderIds.length})` : "طباعة قائمة التجهيز"}
      open={open}
      onCancel={onClose}
      width={layout === "a4" ? 920 : 520}
      destroyOnHidden
      footer={
        <Space>
          <Button onClick={onClose}>إغلاق</Button>
          <Button type="primary" icon={<PrinterOutlined />} disabled={!html} onClick={print}>
            طباعة{count > 1 ? ` (${count})` : ""}
          </Button>
        </Space>
      }
    >
      <Space direction="vertical" size={10} style={{ width: "100%" }}>
        <Space wrap>
          <Text type="secondary">حجم الورق:</Text>
          <Segmented<SlipLayout>
            value={layout}
            onChange={changeLayout}
            options={[
              { value: "thermal", label: "حراري 80 مم" },
              { value: "a4", label: "A4" },
            ]}
          />
        </Space>
        {q.isError && <Alert type="error" showIcon message={apiErrorMessage(q.error, "تعذّر تحميل قائمة التجهيز")} />}
        {failed.length > 0 && (
          <Alert
            type="warning"
            showIcon
            message={`تعذّر تحميل ${failed.length} من ${orderIds.length} — ستُطبع البقية`}
            description={failed.map((f) => f.error).filter((v, i, a) => a.indexOf(v) === i).join("، ")}
          />
        )}
        {buildError && <Alert type="error" showIcon message={buildError} />}
        <div className="ord-print-preview">
          {q.isLoading || (!html && !buildError && count > 0) ? (
            <div style={{ padding: 60, textAlign: "center" }}>
              <Spin />
            </div>
          ) : html ? (
            <iframe ref={frame} title="معاينة قائمة التجهيز" srcDoc={html} className="ord-print-frame" />
          ) : !q.isError && !count ? (
            <div style={{ padding: 40, textAlign: "center", color: "#94a3b8" }}>لا توجد قوائم للطباعة</div>
          ) : null}
        </div>
      </Space>
    </Modal>
  );
}
