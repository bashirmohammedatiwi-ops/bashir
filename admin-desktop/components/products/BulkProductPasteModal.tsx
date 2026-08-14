"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Alert,
  Button,
  Input,
  Modal,
  Progress,
  Space,
  Table,
  Tag,
  message,
} from "antd";
import { useMemo, useState } from "react";
import {
  importBulkProducts,
  resolveBulkProductRows,
  type BulkProductResolved,
} from "@/lib/bulkProductImport";

type Props = {
  open: boolean;
  onClose: () => void;
};

type Phase = "paste" | "preview" | "importing" | "done";

export default function BulkProductPasteModal({ open, onClose }: Props) {
  const qc = useQueryClient();
  const [phase, setPhase] = useState<Phase>("paste");
  const [raw, setRaw] = useState("");
  const [rows, setRows] = useState<BulkProductResolved[]>([]);
  const [progress, setProgress] = useState({ done: 0, total: 0, last: "" });
  const [result, setResult] = useState<{ ok: number; skipped: number; failed: number } | null>(
    null,
  );

  const reset = () => {
    setPhase("paste");
    setRaw("");
    setRows([]);
    setProgress({ done: 0, total: 0, last: "" });
    setResult(null);
  };

  const handleClose = () => {
    if (phase === "importing") return;
    reset();
    onClose();
  };

  const parseMut = useMutation({
    mutationFn: async () => resolveBulkProductRows(raw),
    onSuccess: (resolved) => {
      setRows(resolved);
      setPhase("preview");
      message.success(`تم تحليل ${resolved.length} منتج`);
    },
    onError: (e: Error) => message.error(e.message || "فشل التحليل"),
  });

  const importMut = useMutation({
    mutationFn: async () => {
      const importable = rows.filter((r) => r.canImport);
      if (!importable.length) throw new Error("لا توجد صفوف صالحة للاستيراد");
      setPhase("importing");
      setProgress({ done: 0, total: importable.length, last: "" });
      return importBulkProducts(rows, (p) => {
        setProgress({
          done: p.index,
          total: p.total || importable.length,
          last: p.barcode || p.message || "",
        });
      });
    },
    onSuccess: (stats) => {
      setResult(stats);
      setPhase("done");
      void qc.invalidateQueries({ queryKey: ["products"] });
      message.success(`تم إنشاء ${stats.ok} منتج`);
    },
    onError: (e: Error) => {
      setPhase("preview");
      message.error(e.message || "فشل الاستيراد");
    },
  });

  const stats = useMemo(() => {
    const importable = rows.filter((r) => r.canImport).length;
    const exists = rows.filter((r) => r.existsInApp).length;
    const blocked = rows.length - importable;
    return { importable, exists, blocked };
  }, [rows]);

  return (
    <Modal
      open={open}
      onCancel={handleClose}
      width={1100}
      destroyOnHidden
      title="إضافة جماعية من جدول"
      footer={
        phase === "paste" ? (
          <Space>
            <Button onClick={handleClose}>إلغاء</Button>
            <Button
              type="primary"
              loading={parseMut.isPending}
              disabled={!raw.trim()}
              onClick={() => parseMut.mutate()}
            >
              تحليل الجدول
            </Button>
          </Space>
        ) : phase === "preview" ? (
          <Space>
            <Button onClick={() => setPhase("paste")}>تعديل اللصق</Button>
            <Button onClick={handleClose}>إلغاء</Button>
            <Button
              type="primary"
              loading={importMut.isPending}
              disabled={!stats.importable}
              onClick={() => importMut.mutate()}
            >
              استيراد {stats.importable} منتج
            </Button>
          </Space>
        ) : phase === "importing" ? (
          <Button disabled>جاري الاستيراد…</Button>
        ) : (
          <Button type="primary" onClick={handleClose}>
            إغلاق
          </Button>
        )
      }
    >
      {phase === "paste" ? (
        <div>
          <Alert
            type="info"
            showIcon
            style={{ marginBottom: 12 }}
            message="الصق جدولاً من GPT أو Excel"
            description="الأعمدة: الباركود · الاسم عربي · الاسم إنكليزي · البراند · الوصف عربي · الوصف إنكليزي · القسم · القسم الفرعي · القسم الثانوي. يمكن فصل عدة أقسام فرعية/ثانوية بفاصلة عربية أو إنجليزية."
          />
          <Input.TextArea
            rows={14}
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            dir="auto"
            style={{ fontFamily: "ui-monospace, Consolas, monospace", fontSize: 12 }}
            placeholder={`| الباركود | اسم المنتج بالعربي | اسم المنتج بالإنكليزي | البراند | الوصف بالعربي | الوصف بالإنكليزي | القسم | القسم الفرعي | القسم الثانوي |\n| --- | --- | --- | --- | --- | --- | --- | --- | --- |\n| 4052136371406 | ARTDECO - ... | ARTDECO - ... | ARTDECO | ... | ... | العناية | العناية بالوجه، الوقاية من الشمس | ترطيب الوجه، واقي الشمس |`}
          />
        </div>
      ) : null}

      {phase === "preview" || phase === "importing" || phase === "done" ? (
        <div>
          <Space wrap style={{ marginBottom: 12 }}>
            <Tag color="blue">الإجمالي: {rows.length}</Tag>
            <Tag color="green">قابل للاستيراد: {stats.importable}</Tag>
            <Tag color="orange">موجود مسبقاً: {stats.exists}</Tag>
            <Tag color="red">سيُتخطى: {stats.blocked}</Tag>
          </Space>

          {phase === "importing" ? (
            <div style={{ marginBottom: 16 }}>
              <Progress
                percent={
                  progress.total ? Math.round((progress.done / progress.total) * 100) : 0
                }
                status="active"
              />
              <div style={{ color: "#888", fontSize: 12, marginTop: 4 }}>
                {progress.done}/{progress.total}
                {progress.last ? ` — ${progress.last}` : ""}
              </div>
            </div>
          ) : null}

          {phase === "done" && result ? (
            <Alert
              type={result.failed ? "warning" : "success"}
              showIcon
              style={{ marginBottom: 12 }}
              message={`تم: ${result.ok} · تخطي: ${result.skipped} · فشل: ${result.failed}`}
            />
          ) : null}

          <Table
            size="small"
            rowKey="barcode"
            pagination={{ pageSize: 8, hideOnSinglePage: true }}
            scroll={{ x: 1100 }}
            dataSource={rows}
            columns={[
              {
                title: "الباركود",
                dataIndex: "barcode",
                width: 140,
                render: (v: string) => <span dir="ltr">{v}</span>,
              },
              {
                title: "الاسم",
                width: 260,
                render: (_: unknown, r: BulkProductResolved) => (
                  <div>
                    <div style={{ fontWeight: 600 }}>{r.nameAr || r.nameEn}</div>
                    {r.nameEn && r.nameAr ? (
                      <div style={{ fontSize: 12, color: "#888" }}>{r.nameEn}</div>
                    ) : null}
                  </div>
                ),
              },
              {
                title: "البراند",
                dataIndex: "brandLabel",
                width: 110,
              },
              {
                title: "التصنيف",
                width: 220,
                render: (_: unknown, r: BulkProductResolved) => (
                  <div style={{ fontSize: 12 }}>
                    <div>{r.categoryLabel || "—"}</div>
                    {r.subcategoryLabels.length ? (
                      <div style={{ color: "#666" }}>{r.subcategoryLabels.join(" · ")}</div>
                    ) : null}
                    {r.tertiaryLabels.length ? (
                      <div style={{ color: "#999" }}>{r.tertiaryLabels.join(" · ")}</div>
                    ) : null}
                  </div>
                ),
              },
              {
                title: "POS",
                width: 120,
                render: (_: unknown, r: BulkProductResolved) => (
                  <div style={{ fontSize: 12 }}>
                    <div>{Number(r.price || 0).toLocaleString("ar-IQ")} د.ع</div>
                    <div style={{ color: "#888" }}>مخزون {r.stock}</div>
                  </div>
                ),
              },
              {
                title: "الحالة",
                width: 180,
                render: (_: unknown, r: BulkProductResolved) =>
                  r.canImport ? (
                    <Tag color="success">جاهز</Tag>
                  ) : (
                    <Space direction="vertical" size={2}>
                      {r.warnings.map((w) => (
                        <Tag key={w} color={r.existsInApp ? "orange" : "error"}>
                          {w}
                        </Tag>
                      ))}
                    </Space>
                  ),
              },
            ]}
          />
        </div>
      ) : null}
    </Modal>
  );
}
