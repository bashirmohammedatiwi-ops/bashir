"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Alert,
  Button,
  Card,
  DatePicker,
  Drawer,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Space,
  Switch,
  Table,
  Tag,
  Typography,
  message,
} from "antd";
import dayjs, { type Dayjs } from "dayjs";
import { useMemo, useState } from "react";
import { mutations, queries } from "@/lib/queries";

const { RangePicker } = DatePicker;
const { Text } = Typography;

type OfferRow = {
  id: string;
  name: string;
  discountPercent: number;
  startsAt: string;
  endsAt: string;
  isActive: boolean;
  barcodes: string[];
  status: "live" | "scheduled" | "ended" | "paused";
  matchedProducts: number;
  activeProducts: number;
  appliedProducts: number;
};

type OfferProduct = {
  id: string;
  name: string;
  barcode: string | null;
  isActive: boolean;
  stock: number;
  price: number;
  originalPrice: number;
  discountPercent: number;
  applied: boolean;
};

const STATUS: Record<OfferRow["status"], { color: string; label: string }> = {
  live: { color: "green", label: "ساري الآن" },
  scheduled: { color: "blue", label: "مجدول" },
  ended: { color: "red", label: "منتهٍ" },
  paused: { color: "default", label: "موقوف" },
};

const fmt = (n?: number | null) => (n ?? 0).toLocaleString("en-US");

/** باركود في كل سطر، أو مفصولة بفواصل/مسافات (لصق عمود من Excel يعمل). */
const parseBarcodes = (text: string) => [...new Set(text.split(/[\s,;،]+/).map((s) => s.trim()).filter(Boolean))];

type FormValues = { name: string; discountPercent: number; range: [Dayjs, Dayjs]; isActive: boolean; barcodesText: string };

export default function ProductOffersPage() {
  const qc = useQueryClient();
  const [form] = Form.useForm<FormValues>();
  const [editing, setEditing] = useState<OfferRow | null>(null);
  const [open, setOpen] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const barcodesText = Form.useWatch("barcodesText", form) ?? "";
  const parsedCount = useMemo(() => parseBarcodes(barcodesText).length, [barcodesText]);

  const list = useQuery<OfferRow[]>({ queryKey: ["product-offers"], queryFn: queries.productOffers });
  const detail = useQuery({
    queryKey: ["product-offer", detailId],
    queryFn: () => queries.productOffer(detailId!),
    enabled: !!detailId,
  });

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["product-offers"] });
    qc.invalidateQueries({ queryKey: ["product-offer"] });
  };
  const errorText = (e: any) => e?.response?.data?.message ?? e?.message ?? "تعذّر الحفظ";

  const save = useMutation({
    mutationFn: (v: FormValues) => {
      const body = {
        name: v.name.trim(),
        discountPercent: v.discountPercent,
        startsAt: v.range[0].toISOString(),
        endsAt: v.range[1].toISOString(),
        isActive: v.isActive,
        barcodes: parseBarcodes(v.barcodesText ?? ""),
      };
      return editing ? mutations.updateProductOffer(editing.id, body) : mutations.createProductOffer(body);
    },
    onSuccess: () => {
      message.success(editing ? "حُدّث العرض وطُبّقت الأسعار" : "أُضيف العرض وطُبّقت الأسعار");
      setOpen(false);
      refresh();
    },
    onError: (e) => message.error(String(errorText(e))),
  });

  const toggle = useMutation({
    mutationFn: (r: OfferRow) => mutations.updateProductOffer(r.id, { isActive: !r.isActive }),
    onSuccess: refresh,
    onError: (e) => message.error(String(errorText(e))),
  });

  const remove = useMutation({
    mutationFn: (id: string) => mutations.deleteProductOffer(id),
    onSuccess: () => {
      message.success("حُذف العرض ورجعت الأسعار");
      refresh();
    },
    onError: (e) => message.error(String(errorText(e))),
  });

  const openForm = (r: OfferRow | null) => {
    setEditing(r);
    form.setFieldsValue(
      r
        ? {
            name: r.name,
            discountPercent: r.discountPercent,
            range: [dayjs(r.startsAt), dayjs(r.endsAt)],
            isActive: r.isActive,
            barcodesText: r.barcodes.join("\n"),
          }
        : { name: "", discountPercent: 30, range: [dayjs().startOf("day"), dayjs().add(7, "day").endOf("day")], isActive: true, barcodesText: "" },
    );
    setOpen(true);
  };

  return (
    <Space direction="vertical" size={16} style={{ width: "100%" }}>
      <Card>
        <Space style={{ width: "100%", justifyContent: "space-between" }} wrap>
          <div>
            <Typography.Title level={4} style={{ margin: 0 }}>
              عروض الخصم
            </Typography.Title>
            <Text type="secondary">
              خصم مؤقت على منتجات محددة بالباركود. يبقى ثابتاً حتى لو أرسل الـ POS أسعاره، ويرجع السعر وحده عند انتهاء العرض.
            </Text>
          </div>
          <Button type="primary" onClick={() => openForm(null)}>
            إضافة عرض
          </Button>
        </Space>
      </Card>

      <Card>
        <Table<OfferRow>
          rowKey="id"
          loading={list.isLoading}
          dataSource={list.data ?? []}
          pagination={false}
          scroll={{ x: 900 }}
          columns={[
            { title: "العرض", dataIndex: "name", render: (v, r) => <a onClick={() => setDetailId(r.id)}>{v}</a> },
            { title: "الخصم", dataIndex: "discountPercent", width: 90, render: (v) => <Tag color="magenta">{v}%</Tag> },
            {
              title: "المدة",
              width: 230,
              render: (_, r) => `${dayjs(r.startsAt).format("YYYY/MM/DD HH:mm")} ← ${dayjs(r.endsAt).format("YYYY/MM/DD HH:mm")}`,
            },
            { title: "الحالة", width: 110, render: (_, r) => <Tag color={STATUS[r.status].color}>{STATUS[r.status].label}</Tag> },
            {
              title: "المنتجات",
              width: 230,
              render: (_, r) => (
                <Text>
                  {r.barcodes.length} باركود · {r.matchedProducts} في المتجر · {r.activeProducts} مفعّل
                  {r.status === "live" ? ` · مطبّق على ${r.appliedProducts}` : ""}
                </Text>
              ),
            },
            {
              title: "",
              width: 220,
              render: (_, r) => (
                <Space>
                  <Switch checked={r.isActive} loading={toggle.isPending && toggle.variables?.id === r.id} onChange={() => toggle.mutate(r)} />
                  <Button size="small" onClick={() => openForm(r)}>
                    تعديل
                  </Button>
                  <Popconfirm title="حذف العرض وإرجاع أسعار منتجاته؟" okText="حذف" cancelText="إلغاء" onConfirm={() => remove.mutate(r.id)}>
                    <Button size="small" danger>
                      حذف
                    </Button>
                  </Popconfirm>
                </Space>
              ),
            },
          ]}
        />
      </Card>

      <Modal
        open={open}
        title={editing ? "تعديل العرض" : "عرض جديد"}
        onCancel={() => setOpen(false)}
        onOk={() => form.submit()}
        okText="حفظ وتطبيق"
        cancelText="إلغاء"
        confirmLoading={save.isPending}
        width={640}
        destroyOnHidden
      >
        <Form form={form} layout="vertical" onFinish={(v) => save.mutate(v)}>
          <Form.Item name="name" label="اسم العرض" rules={[{ required: true, message: "اكتبي اسم العرض" }]}>
            <Input placeholder="بيزلين — الجمعة السوداء 30%" />
          </Form.Item>
          <Space size={16} wrap>
            <Form.Item name="discountPercent" label="نسبة الخصم %" rules={[{ required: true }]}>
              <InputNumber min={1} max={90} addonAfter="%" />
            </Form.Item>
            <Form.Item name="range" label="من — إلى" rules={[{ required: true, message: "حدّدي المدة" }]}>
              <RangePicker showTime={{ format: "HH:mm" }} format="YYYY/MM/DD HH:mm" />
            </Form.Item>
            <Form.Item name="isActive" label="مفعّل" valuePropName="checked">
              <Switch />
            </Form.Item>
          </Space>
          <Form.Item
            name="barcodesText"
            label={`الباركودات (${parsedCount})`}
            extra="باركود في كل سطر — يمكن لصق عمود الباركود من ملف Excel مباشرة."
            rules={[{ validator: (_, v) => (parseBarcodes(v ?? "").length ? Promise.resolve() : Promise.reject(new Error("أضيفي باركوداً واحداً على الأقل"))) }]}
          >
            <Input.TextArea rows={8} dir="ltr" style={{ fontFamily: "monospace" }} />
          </Form.Item>
        </Form>
      </Modal>

      <Drawer open={!!detailId} onClose={() => setDetailId(null)} width={860} title={detail.data?.name ?? "العرض"}>
        {detail.data && (
          <Space direction="vertical" size={12} style={{ width: "100%" }}>
            <Space wrap>
              <Tag color="magenta">{detail.data.discountPercent}%</Tag>
              <Tag color={STATUS[detail.data.status as OfferRow["status"]].color}>{STATUS[detail.data.status as OfferRow["status"]].label}</Tag>
              <Text type="secondary">
                {dayjs(detail.data.startsAt).format("YYYY/MM/DD HH:mm")} ← {dayjs(detail.data.endsAt).format("YYYY/MM/DD HH:mm")}
              </Text>
            </Space>
            {detail.data.missingBarcodes?.length > 0 && (
              <Alert
                type="warning"
                showIcon
                message={`${detail.data.missingBarcodes.length} باركود غير موجود في المتجر — سيُطبّق عليه العرض تلقائياً إن أُضيف المنتج خلال المدة`}
                description={<Text copyable style={{ direction: "ltr", display: "block" }}>{detail.data.missingBarcodes.join("  ")}</Text>}
              />
            )}
            <Table<OfferProduct>
              rowKey="id"
              size="small"
              dataSource={detail.data.products}
              pagination={{ pageSize: 50, hideOnSinglePage: true }}
              columns={[
                { title: "المنتج", dataIndex: "name" },
                { title: "الباركود", dataIndex: "barcode", width: 140, render: (v) => <Text style={{ direction: "ltr" }}>{v}</Text> },
                {
                  title: "الحالة",
                  width: 120,
                  render: (_, p) => (p.isActive ? <Tag color="green">مفعّل · {p.stock}</Tag> : <Tag>موقوف · {p.stock}</Tag>),
                },
                {
                  title: "السعر الآن",
                  width: 170,
                  render: (_, p) =>
                    p.originalPrice > p.price ? (
                      <Space size={4}>
                        <Text strong>{fmt(p.price)}</Text>
                        <Text delete type="secondary">
                          {fmt(p.originalPrice)}
                        </Text>
                      </Space>
                    ) : (
                      fmt(p.price)
                    ),
                },
                { title: "مطبّق", width: 80, render: (_, p) => (p.applied ? <Tag color="magenta">{p.discountPercent}%</Tag> : "—") },
              ]}
            />
          </Space>
        )}
      </Drawer>
    </Space>
  );
}
