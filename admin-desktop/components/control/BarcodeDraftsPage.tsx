"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Button,
  Dropdown,
  Empty,
  Form,
  Image,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Progress,
  Segmented,
  Select,
  Space,
  Table,
  Tag,
  Tooltip,
  message,
} from "antd";
import {
  CheckCircleFilled,
  ClockCircleOutlined,
  CopyOutlined,
  DownloadOutlined,
  FolderAddOutlined,
  FolderOutlined,
  MoreOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import { PageHeader } from "@/components/PageHeader";
import { controlApi, GROUP_COLORS, groupColor, type Draft, type DraftGroup } from "@/lib/controlApi";
import { mediaUrl } from "@/lib/mediaUrl";
import { apiErrorMessage } from "@/lib/apiError";
import "./control.css";

const ALL = "__all__";

/**
 * الباركودات المحفوظة من تطبيق المدير لمنتجات غير موجودة — مقسّمة على مجموعات.
 * أي باركود يُضاف منتجه لاحقاً (بنفس الباركود أو كتدرج) يتحول للأخضر تلقائياً.
 */
export function BarcodeDraftsPage() {
  const qc = useQueryClient();
  const [groupId, setGroupId] = useState<string>(ALL);
  const [status, setStatus] = useState<"all" | "pending" | "added">("all");
  const [q, setQ] = useState("");
  const [qDebounced, setQDebounced] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<string[]>([]);
  const [groupModal, setGroupModal] = useState<{ edit?: DraftGroup } | null>(null);
  const [editDraft, setEditDraft] = useState<Draft | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [groupForm] = Form.useForm();
  const [draftForm] = Form.useForm();

  useEffect(() => {
    const t = setTimeout(() => setQDebounced(q.trim()), 300);
    return () => clearTimeout(t);
  }, [q]);
  useEffect(() => {
    setPage(1);
    setSelected([]);
  }, [groupId, status, qDebounced]);

  const { data: groups = [], isLoading: groupsLoading } = useQuery({
    queryKey: ["draft-groups", showArchived],
    queryFn: () => controlApi.groups(showArchived),
    refetchInterval: 60_000,
  });
  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["drafts", groupId, status, qDebounced, page],
    queryFn: () =>
      controlApi.drafts({ groupId: groupId === ALL ? undefined : groupId, status, q: qDebounced || undefined, page, limit: 50 }),
    refetchInterval: 60_000,
  });

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["drafts"] });
    qc.invalidateQueries({ queryKey: ["draft-groups"] });
    qc.invalidateQueries({ queryKey: ["control-stats"] });
  };

  const totals = useMemo(
    () => groups.reduce((acc, g) => ({ pending: acc.pending + g.pending, added: acc.added + g.added }), { pending: 0, added: 0 }),
    [groups],
  );
  const current = groups.find((g) => g.id === groupId);

  const saveGroup = async () => {
    const v = await groupForm.validateFields();
    try {
      if (groupModal?.edit) {
        await controlApi.updateGroup(groupModal.edit.id, v);
        message.success("تم حفظ المجموعة");
      } else {
        const g = await controlApi.createGroup(v);
        setGroupId(g.id);
        message.success("أُنشئت المجموعة");
      }
      setGroupModal(null);
      refresh();
    } catch (e) {
      message.error(apiErrorMessage(e));
    }
  };

  const saveDraft = async () => {
    if (!editDraft) return;
    const v = await draftForm.validateFields();
    try {
      await controlApi.updateDraft(editDraft.id, { ...v, quantity: v.quantity ?? null });
      message.success("تم الحفظ");
      setEditDraft(null);
      refresh();
    } catch (e) {
      message.error(apiErrorMessage(e));
    }
  };

  const exportCsv = (rows: Draft[]) => {
    const head = ["الباركود", "الاسم", "المجموعة", "الحالة", "الكمية", "الملاحظة", "سعر الكاشير", "التاريخ", "الصور"];
    const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const lines = rows.map((d) =>
      [
        d.barcode,
        d.name,
        d.group?.name,
        d.status === "added" ? "أُضيف" : "بانتظار",
        d.quantity,
        d.note,
        d.pos?.price,
        new Date(d.createdAt).toLocaleDateString("en-GB"),
        d.images.map((i) => mediaUrl(i.url)).join(" "),
      ]
        .map(esc)
        .join(","),
    );
    const blob = new Blob(["﻿" + [head.map(esc).join(","), ...lines].join("\n")], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `barcodes-${current?.name ?? "all"}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const exportAll = async () => {
    try {
      const all: Draft[] = [];
      for (let p = 1; p < 50; p++) {
        const r = await controlApi.drafts({ groupId: groupId === ALL ? undefined : groupId, status, q: qDebounced || undefined, page: p, limit: 200 });
        all.push(...r.data);
        if (!r.meta.hasNext) break;
      }
      exportCsv(all);
    } catch (e) {
      message.error(apiErrorMessage(e));
    }
  };

  const copyBarcodes = (rows: Draft[]) => {
    void navigator.clipboard.writeText(rows.map((d) => [d.barcode, d.name].filter(Boolean).join("  ")).join("\n"));
    message.success(`نُسخ ${rows.length} باركود`);
  };

  const rows = data?.data ?? [];

  return (
    <div className="control-page">
      <PageHeader
        title="الباركودات المحفوظة"
        subtitle="منتجات صُوّرت ومُسح باركودها من تطبيق المدير ولم تُضف بعد — تصبح خضراء تلقائياً عند إضافتها"
        extra={
          <Space>
            <Button icon={<DownloadOutlined />} onClick={exportAll}>
              تصدير Excel
            </Button>
            <Button
              type="primary"
              icon={<FolderAddOutlined />}
              onClick={() => {
                groupForm.setFieldsValue({ name: "", color: "violet", note: "" });
                setGroupModal({});
              }}
            >
              مجموعة جديدة
            </Button>
          </Space>
        }
      />

      <div className="drafts-layout">
        <aside className="drafts-groups">
          <button type="button" className={`drafts-group${groupId === ALL ? " active" : ""}`} onClick={() => setGroupId(ALL)}>
            <FolderOutlined style={{ color: "#6e45b0" }} />
            <div className="drafts-group-text">
              <strong>كل المجموعات</strong>
              <span>
                <Tag color="orange">{totals.pending} بانتظار</Tag>
                <Tag color="green">{totals.added} أُضيف</Tag>
              </span>
            </div>
          </button>
          {groupsLoading ? <div style={{ padding: 16, color: "#999" }}>جارٍ التحميل…</div> : null}
          {groups.map((g) => (
            <div key={g.id} className={`drafts-group${groupId === g.id ? " active" : ""}${g.isArchived ? " archived" : ""}`} style={{ borderInlineStartColor: groupColor(g.color) }}>
              <button type="button" className="drafts-group-btn" onClick={() => setGroupId(g.id)}>
                <FolderOutlined style={{ color: groupColor(g.color), fontSize: 18 }} />
                <div className="drafts-group-text">
                  <strong>
                    {g.name} {g.isArchived ? <Tag>مؤرشفة</Tag> : null}
                  </strong>
                  <span>
                    <Tag color="orange">{g.pending}</Tag>
                    <Tag color="green">{g.added}</Tag>
                    {g.note ? <em>{g.note}</em> : null}
                  </span>
                  <Progress percent={g.total ? Math.round((g.added / g.total) * 100) : 0} size="small" strokeColor="#1f9d63" showInfo={false} />
                </div>
              </button>
              <Dropdown
                trigger={["click"]}
                menu={{
                  items: [
                    { key: "edit", label: "تعديل" },
                    { key: "archive", label: g.isArchived ? "إلغاء الأرشفة" : "أرشفة" },
                    { type: "divider" },
                    { key: "delete", label: `حذف (${g.total} باركود)`, danger: true },
                  ],
                  onClick: async ({ key }) => {
                    if (key === "edit") {
                      groupForm.setFieldsValue({ name: g.name, color: g.color, note: g.note ?? "" });
                      setGroupModal({ edit: g });
                    }
                    if (key === "archive") {
                      await controlApi.updateGroup(g.id, { isArchived: !g.isArchived }).catch((e) => message.error(apiErrorMessage(e)));
                      refresh();
                    }
                    if (key === "delete") {
                      Modal.confirm({
                        title: `حذف «${g.name}»؟`,
                        content: g.total ? `ستُحذف ${g.total} باركود محفوظ فيها نهائياً.` : undefined,
                        okText: "حذف",
                        okButtonProps: { danger: true },
                        cancelText: "إلغاء",
                        onOk: async () => {
                          await controlApi.deleteGroup(g.id);
                          if (groupId === g.id) setGroupId(ALL);
                          refresh();
                        },
                      });
                    }
                  },
                }}
              >
                <Button type="text" size="small" icon={<MoreOutlined />} />
              </Dropdown>
            </div>
          ))}
          <label className="drafts-archived-toggle">
            <input type="checkbox" checked={showArchived} onChange={(e) => setShowArchived(e.target.checked)} /> إظهار المؤرشفة
          </label>
        </aside>

        <section className="drafts-main">
          <div className="drafts-toolbar">
            <Input.Search allowClear placeholder="بحث بالباركود أو الاسم أو الملاحظة" value={q} onChange={(e) => setQ(e.target.value)} style={{ maxWidth: 340 }} />
            <Segmented
              value={status}
              onChange={(v) => setStatus(v as typeof status)}
              options={[
                { value: "all", label: "الكل" },
                { value: "pending", label: "بانتظار الإضافة" },
                { value: "added", label: "أُضيف" },
              ]}
            />
            {selected.length ? (
              <Space wrap>
                <Tag color="purple">{selected.length} محدد</Tag>
                <Select
                  placeholder="نقل إلى…"
                  style={{ width: 170 }}
                  options={groups.filter((g) => g.id !== groupId).map((g) => ({ value: g.id, label: g.name }))}
                  onChange={async (target: string) => {
                    try {
                      const r = await controlApi.moveDrafts(selected, target);
                      message.success(`نُقل ${r.moved}${r.merged ? ` · دُمج ${r.merged}` : ""}`);
                      setSelected([]);
                      refresh();
                    } catch (e) {
                      message.error(apiErrorMessage(e));
                    }
                  }}
                />
                <Button icon={<CopyOutlined />} onClick={() => copyBarcodes(rows.filter((r) => selected.includes(r.id)))}>
                  نسخ
                </Button>
                <Popconfirm
                  title={`حذف ${selected.length} باركود؟`}
                  okButtonProps={{ danger: true }}
                  onConfirm={async () => {
                    await controlApi.deleteDrafts(selected).catch((e) => message.error(apiErrorMessage(e)));
                    setSelected([]);
                    refresh();
                  }}
                >
                  <Button danger>حذف</Button>
                </Popconfirm>
              </Space>
            ) : (
              <Button icon={<CopyOutlined />} disabled={!rows.length} onClick={() => copyBarcodes(rows.filter((r) => r.status === "pending"))}>
                نسخ المنتظرة
              </Button>
            )}
          </div>

          <Table<Draft>
            rowKey="id"
            loading={isLoading || isFetching}
            dataSource={rows}
            rowSelection={{ selectedRowKeys: selected, onChange: (keys) => setSelected(keys as string[]) }}
            rowClassName={(r) => (r.status === "added" ? "draft-row-added" : "draft-row-pending")}
            locale={{ emptyText: <Empty description="لا توجد باركودات — امسح منتجاً غير موجود من تطبيق المدير واحفظه هنا" /> }}
            pagination={{
              current: page,
              pageSize: 50,
              total: data?.meta.total ?? 0,
              onChange: setPage,
              showSizeChanger: false,
              showTotal: (t) => `${t} باركود`,
            }}
            columns={[
              {
                title: "الصور",
                width: 120,
                render: (_, d) =>
                  d.images.length ? (
                    <Image.PreviewGroup items={d.images.map((i) => mediaUrl(i.url ?? i.large) ?? "")}>
                      <div className="draft-thumbs">
                        <Image width={56} height={56} style={{ objectFit: "cover", borderRadius: 8 }} src={mediaUrl(d.images[0].thumb) ?? undefined} alt="" />
                        {d.images.length > 1 ? <span className="draft-thumbs-more">+{d.images.length - 1}</span> : null}
                      </div>
                    </Image.PreviewGroup>
                  ) : (
                    <span className="draft-noimg">بلا صورة</span>
                  ),
              },
              {
                title: "المنتج",
                render: (_, d) => (
                  <div>
                    <div style={{ fontWeight: 700 }}>{d.name || <span style={{ color: "#999" }}>بدون اسم</span>}</div>
                    <div dir="ltr" style={{ textAlign: "right", fontFamily: "ui-monospace, monospace", color: "#555" }}>
                      {d.barcode}
                    </div>
                    {d.note ? <div style={{ fontSize: 12, color: "#777", marginTop: 2 }}>{d.note}</div> : null}
                  </div>
                ),
              },
              {
                title: "المجموعة",
                width: 140,
                render: (_, d) => <Tag color={groupColor(d.group?.color)}>{d.group?.name}</Tag>,
              },
              {
                title: "الكمية",
                width: 80,
                render: (_, d) => d.quantity ?? "—",
              },
              {
                title: "الكاشير",
                width: 130,
                render: (_, d) =>
                  d.pos ? (
                    <Tooltip title={d.pos.name}>
                      <div>{Number(d.pos.price).toLocaleString("en")} د.ع</div>
                      <div style={{ fontSize: 12, color: "#888" }}>كمية {d.pos.stock}</div>
                    </Tooltip>
                  ) : (
                    <span style={{ color: "#bbb" }}>—</span>
                  ),
              },
              {
                title: "الحالة",
                width: 200,
                render: (_, d) =>
                  d.status === "added" ? (
                    <div>
                      <Tag icon={<CheckCircleFilled />} color="success">
                        أُضيف للتطبيق
                      </Tag>
                      {d.product ? (
                        <Link prefetch={false} href={`/products/?edit=${d.product.id}`} style={{ display: "block", fontSize: 12, marginTop: 4 }}>
                          {d.product.name}
                        </Link>
                      ) : null}
                    </div>
                  ) : (
                    <Tag icon={<ClockCircleOutlined />} color="warning">
                      بانتظار الإضافة
                    </Tag>
                  ),
              },
              {
                title: "أضيف",
                width: 120,
                render: (_, d) => (
                  <div style={{ fontSize: 12, color: "#777" }}>
                    {new Date(d.createdAt).toLocaleDateString("en-GB")}
                    {d.createdBy ? <div>{d.createdBy}</div> : null}
                  </div>
                ),
              },
              {
                title: "",
                width: 150,
                render: (_, d) => (
                  <Space>
                    {d.status === "pending" ? (
                      <Tooltip title="إضافة المنتج بالذكاء الاصطناعي بهذا الباركود">
                        <Link prefetch={false} href={`/ai-add/?barcode=${encodeURIComponent(d.barcode)}${d.name ? `&hint=${encodeURIComponent(d.name)}` : ""}`}>
                          <Button size="small" type="primary" icon={<PlusOutlined />}>
                            أضفه
                          </Button>
                        </Link>
                      </Tooltip>
                    ) : null}
                    <Button
                      size="small"
                      onClick={() => {
                        draftForm.setFieldsValue({ name: d.name ?? "", barcode: d.barcode, note: d.note ?? "", quantity: d.quantity ?? undefined, groupId: d.groupId });
                        setEditDraft(d);
                      }}
                    >
                      تعديل
                    </Button>
                  </Space>
                ),
              },
            ]}
          />
        </section>
      </div>

      <Modal open={!!groupModal} title={groupModal?.edit ? "تعديل المجموعة" : "مجموعة جديدة"} onCancel={() => setGroupModal(null)} onOk={saveGroup} okText="حفظ" cancelText="إلغاء">
        <Form form={groupForm} layout="vertical">
          <Form.Item name="name" label="الاسم" rules={[{ required: true, message: "اكتب الاسم" }]}>
            <Input placeholder="مثلاً: رف العطور، طلبية تركيا" />
          </Form.Item>
          <Form.Item name="note" label="ملاحظة">
            <Input />
          </Form.Item>
          <Form.Item name="color" label="اللون">
            <Select
              options={Object.entries(GROUP_COLORS).map(([k, v]) => ({
                value: k,
                label: (
                  <span>
                    <span style={{ display: "inline-block", width: 12, height: 12, borderRadius: 6, background: v.color, marginInlineEnd: 8 }} />
                    {v.label}
                  </span>
                ),
              }))}
            />
          </Form.Item>
        </Form>
      </Modal>

      <Modal open={!!editDraft} title="تعديل الباركود المحفوظ" onCancel={() => setEditDraft(null)} onOk={saveDraft} okText="حفظ" cancelText="إلغاء">
        <Form form={draftForm} layout="vertical">
          <Form.Item name="barcode" label="الباركود" rules={[{ required: true }]}>
            <Input dir="ltr" />
          </Form.Item>
          <Form.Item name="name" label="الاسم">
            <Input />
          </Form.Item>
          <Form.Item name="groupId" label="المجموعة">
            <Select options={groups.map((g) => ({ value: g.id, label: g.name }))} />
          </Form.Item>
          <Form.Item name="quantity" label="الكمية">
            <InputNumber min={0} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="note" label="ملاحظة">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
        {editDraft?.images.length ? (
          <Image.PreviewGroup>
            <Space wrap>
              {editDraft.images.map((i) => (
                <Image key={i.mediaId} width={72} height={72} style={{ objectFit: "cover", borderRadius: 8 }} src={mediaUrl(i.thumb) ?? undefined} preview={{ src: mediaUrl(i.url) ?? undefined }} />
              ))}
            </Space>
          </Image.PreviewGroup>
        ) : null}
      </Modal>
    </div>
  );
}
