"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Button,
  Card,
  Col,
  DatePicker,
  Divider,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Row,
  Select,
  Space,
  Statistic,
  Switch,
  Table,
  Tag,
  Tooltip,
  Typography,
  message,
} from "antd";
import dayjs, { type Dayjs } from "dayjs";
import { useMemo, useState } from "react";
import { mutations, queries } from "@/lib/queries";

const { RangePicker } = DatePicker;
const { Text } = Typography;

const COUPON_TYPES = [
  { value: "PERCENT", label: "نسبة مئوية %" },
  { value: "AMOUNT", label: "مبلغ ثابت (د.ع)" },
  { value: "FREE_SHIPPING", label: "توصيل مجاني" },
  { value: "FIRST_ORDER", label: "أول طلب (نسبة %)" },
];

/** نفس ألوان بطاقة التطبيق. */
const THEMES: { value: string; label: string; colors: [string, string] }[] = [
  { value: "rose", label: "وردي", colors: ["#F06A9B", "#B43C7C"] },
  { value: "violet", label: "بنفسجي", colors: ["#A77BEA", "#6A3EC4"] },
  { value: "gold", label: "ذهبي", colors: ["#E9B949", "#B27A12"] },
  { value: "coral", label: "مرجاني", colors: ["#FF9472", "#E2504A"] },
  { value: "mint", label: "نعناعي", colors: ["#4CC9A6", "#1F8F74"] },
  { value: "midnight", label: "ليلي", colors: ["#4B3D6E", "#221B35"] },
];

const fmt = (n?: number | null) => (n ?? 0).toLocaleString("en-US");

type CouponRow = {
  id: string;
  code: string;
  type: string;
  value: number;
  description?: string;
  title?: string | null;
  subtitle?: string | null;
  minOrder: number;
  maxDiscount?: number | null;
  maxRedemptions?: number | null;
  perUserLimit?: number | null;
  redeemedCount: number;
  startsAt?: string | null;
  endsAt?: string | null;
  isActive: boolean;
  showOnHome: boolean;
  homePosition: number;
  theme: string;
  worldSlugs: string[];
  live?: boolean;
  stats?: { orders: number; discountGiven: number; sales: number };
};

/** حالة الكوبون الآن — بلون واضح. */
function statusOf(r: CouponRow): { color: string; label: string } {
  const now = dayjs();
  if (!r.isActive) return { color: "default", label: "موقوف" };
  if (r.startsAt && dayjs(r.startsAt).isAfter(now)) return { color: "blue", label: "مجدول" };
  if (r.endsAt && !dayjs(r.endsAt).isAfter(now)) return { color: "red", label: "منتهٍ" };
  if (r.maxRedemptions != null && r.redeemedCount >= r.maxRedemptions) return { color: "orange", label: "مستنفد" };
  return { color: "green", label: "فعّال" };
}

function valueLabel(type: string, value: number) {
  if (type === "PERCENT" || type === "FIRST_ORDER") return `${value}%`;
  if (type === "FREE_SHIPPING") return "توصيل مجاني";
  return `${fmt(value)} د.ع`;
}

function toFormValues(r: CouponRow) {
  return {
    ...r,
    period: [r.startsAt ? dayjs(r.startsAt) : null, r.endsAt ? dayjs(r.endsAt) : null],
  };
}

function toPayload(v: any) {
  const [start, end] = (v.period ?? []) as [Dayjs | null, Dayjs | null];
  return {
    code: v.code,
    type: v.type,
    value: v.type === "FREE_SHIPPING" ? 0 : v.value ?? 0,
    description: v.description ?? "",
    title: v.title ?? null,
    subtitle: v.subtitle ?? null,
    minOrder: v.minOrder ?? 0,
    maxDiscount: v.maxDiscount ?? null,
    maxRedemptions: v.maxRedemptions ?? null,
    perUserLimit: v.perUserLimit ?? null,
    startsAt: start ? start.toISOString() : null,
    endsAt: end ? end.toISOString() : null,
    isActive: v.isActive !== false,
    showOnHome: Boolean(v.showOnHome),
    homePosition: v.homePosition ?? 0,
    theme: v.theme ?? "rose",
    worldSlugs: v.worldSlugs ?? [],
  };
}

export default function CouponsPage() {
  const { data, isLoading } = useQuery({ queryKey: ["coupons"], queryFn: queries.coupons });
  const { data: worldsData } = useQuery({ queryKey: ["worlds-manage"], queryFn: queries.worldsManage });
  const worlds: { slug: string; nameAr: string }[] = Array.isArray(worldsData) ? worldsData : [];
  const rows: CouponRow[] = Array.isArray(data) ? data : [];
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<CouponRow | null>(null);
  const [form] = Form.useForm();
  const watched = Form.useWatch([], form) ?? {};

  const totals = useMemo(() => {
    const live = rows.filter((r) => statusOf(r).label === "فعّال");
    return {
      live: live.length,
      onHome: live.filter((r) => r.showOnHome).length,
      orders: rows.reduce((a, r) => a + (r.stats?.orders ?? 0), 0),
      discount: rows.reduce((a, r) => a + (r.stats?.discountGiven ?? 0), 0),
      sales: rows.reduce((a, r) => a + (r.stats?.sales ?? 0), 0),
    };
  }, [rows]);

  const refresh = () => qc.invalidateQueries({ queryKey: ["coupons"] });

  const upsert = useMutation({
    mutationFn: async (values: any) => {
      const payload = toPayload(values);
      return editing?.id ? mutations.updateCoupon(editing.id, payload) : mutations.createCoupon(payload);
    },
    onSuccess: () => {
      message.success(editing ? "تم التحديث" : "تم إنشاء الكوبون");
      setOpen(false);
      refresh();
    },
    onError: (e: any) => message.error(e?.response?.data?.message ?? "تعذّر الحفظ"),
  });

  const quick = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) => mutations.updateCoupon(id, data),
    onSuccess: refresh,
  });

  const remove = useMutation({
    mutationFn: mutations.deleteCoupon,
    onSuccess: (r: any) => {
      message.success(r?.archived ? "استُخدم بطلبات سابقة — أُوقف بدل حذفه" : "تم الحذف");
      refresh();
    },
  });

  const openNew = () => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({ isActive: true, type: "PERCENT", value: 10, theme: "rose", showOnHome: false, homePosition: 0, minOrder: 0 });
    setOpen(true);
  };

  return (
    <>
      <Space direction="vertical" size={14} style={{ width: "100%" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h2 style={{ margin: 0 }}>الكوبونات</h2>
            <Text type="secondary">أنشئي الأكواد، وحددي ما يظهر منها كبطاقة في الصفحة الرئيسية للتطبيق.</Text>
          </div>
          <Button type="primary" size="large" onClick={openNew}>
            + كوبون جديد
          </Button>
        </div>

        <Row gutter={12}>
          {[
            { t: "كوبونات فعّالة", v: totals.live },
            { t: "ظاهرة في الرئيسية", v: totals.onHome },
            { t: "طلبات بكوبون", v: totals.orders },
            { t: "مجموع الخصومات", v: `${fmt(totals.discount)} د.ع` },
            { t: "مبيعات بكوبون", v: `${fmt(totals.sales)} د.ع` },
          ].map((x) => (
            <Col key={x.t} flex="1">
              <Card size="small">
                <Statistic title={x.t} value={x.v} />
              </Card>
            </Col>
          ))}
        </Row>

        <Card styles={{ body: { padding: 0 } }}>
          <Table
            rowKey="id"
            loading={isLoading}
            dataSource={rows}
            pagination={{ pageSize: 20 }}
            columns={[
              {
                title: "الكود",
                render: (_: unknown, r: CouponRow) => (
                  <Space direction="vertical" size={0}>
                    <Space>
                      <span
                        style={{
                          width: 12,
                          height: 12,
                          borderRadius: 4,
                          display: "inline-block",
                          background: `linear-gradient(135deg, ${(THEMES.find((x) => x.value === r.theme) ?? THEMES[0]).colors.join(",")})`,
                        }}
                      />
                      <Text strong copyable style={{ letterSpacing: 1 }}>
                        {r.code}
                      </Text>
                    </Space>
                    {r.title && <Text type="secondary">{r.title}</Text>}
                  </Space>
                ),
              },
              {
                title: "الخصم",
                render: (_: unknown, r: CouponRow) => (
                  <Space direction="vertical" size={0}>
                    <Text strong>{valueLabel(r.type, r.value)}</Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {COUPON_TYPES.find((t) => t.value === r.type)?.label}
                      {r.maxDiscount ? ` • حتى ${fmt(r.maxDiscount)}` : ""}
                    </Text>
                  </Space>
                ),
              },
              {
                title: "الشروط",
                render: (_: unknown, r: CouponRow) => (
                  <Space direction="vertical" size={0} style={{ fontSize: 12 }}>
                    <span>{r.minOrder ? `فوق ${fmt(r.minOrder)} د.ع` : "بلا حد أدنى"}</span>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {r.endsAt ? `حتى ${dayjs(r.endsAt).format("YYYY/MM/DD")}` : "بلا تاريخ انتهاء"}
                      {r.perUserLimit ? ` • ${r.perUserLimit} لكل زبونة` : ""}
                    </Text>
                  </Space>
                ),
              },
              {
                title: "الاستخدام",
                render: (_: unknown, r: CouponRow) => (
                  <Tooltip title={`${r.stats?.orders ?? 0} طلب • خصم ${fmt(r.stats?.discountGiven)} د.ع • مبيعات ${fmt(r.stats?.sales)} د.ع`}>
                    <span>
                      {r.redeemedCount}
                      {r.maxRedemptions ? ` / ${r.maxRedemptions}` : ""}
                    </span>
                  </Tooltip>
                ),
              },
              {
                title: "الحالة",
                render: (_: unknown, r: CouponRow) => {
                  const st = statusOf(r);
                  return <Tag color={st.color}>{st.label}</Tag>;
                },
              },
              {
                title: "الرئيسية",
                render: (_: unknown, r: CouponRow) => (
                  <Switch
                    size="small"
                    checked={r.showOnHome}
                    onChange={(v) => quick.mutate({ id: r.id, data: { showOnHome: v } })}
                  />
                ),
              },
              {
                title: "",
                width: 170,
                render: (_: unknown, r: CouponRow) => (
                  <Space>
                    <Button
                      size="small"
                      onClick={() => {
                        setEditing(r);
                        form.setFieldsValue(toFormValues(r));
                        setOpen(true);
                      }}
                    >
                      تعديل
                    </Button>
                    <Popconfirm title="حذف الكوبون؟" okText="حذف" cancelText="إلغاء" onConfirm={() => remove.mutate(r.id)}>
                      <Button danger size="small">
                        حذف
                      </Button>
                    </Popconfirm>
                  </Space>
                ),
              },
            ]}
          />
        </Card>
      </Space>

      <Modal
        title={editing ? `تعديل ${editing.code}` : "كوبون جديد"}
        open={open}
        onCancel={() => setOpen(false)}
        onOk={() => form.submit()}
        confirmLoading={upsert.isPending}
        okText="حفظ"
        cancelText="إلغاء"
        width={920}
        destroyOnHidden
      >
        <Row gutter={24}>
          <Col xs={24} md={14}>
            <Form layout="vertical" form={form} onFinish={(v) => upsert.mutate(v)}>
              <Divider titlePlacement="start" plain style={{ marginTop: 0 }}>
                الخصم
              </Divider>
              <Row gutter={12}>
                <Col span={12}>
                  <Form.Item name="code" label="الكود" rules={[{ required: true, message: "الكود مطلوب" }, { pattern: /^[A-Za-z0-9_-]{3,32}$/, message: "3–32 حرفاً إنجليزياً أو رقماً بلا فراغات" }]}>
                    <Input style={{ textTransform: "uppercase", letterSpacing: 1 }} placeholder="SALE20" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="type" label="النوع" rules={[{ required: true }]}>
                    <Select options={COUPON_TYPES} />
                  </Form.Item>
                </Col>
                {watched.type !== "FREE_SHIPPING" && (
                  <Col span={12}>
                    <Form.Item name="value" label={watched.type === "AMOUNT" ? "المبلغ (د.ع)" : "النسبة %"} rules={[{ required: true }]}>
                      <InputNumber style={{ width: "100%" }} min={0} max={watched.type === "AMOUNT" ? undefined : 100} />
                    </Form.Item>
                  </Col>
                )}
                {(watched.type === "PERCENT" || watched.type === "FIRST_ORDER") && (
                  <Col span={12}>
                    <Form.Item name="maxDiscount" label="سقف الخصم (د.ع) — اختياري">
                      <InputNumber style={{ width: "100%" }} min={0} step={1000} placeholder="بلا سقف" />
                    </Form.Item>
                  </Col>
                )}
              </Row>

              <Divider titlePlacement="start" plain>
                الشروط
              </Divider>
              <Row gutter={12}>
                <Col span={12}>
                  <Form.Item name="minOrder" label="الحد الأدنى للطلب (د.ع)">
                    <InputNumber style={{ width: "100%" }} min={0} step={1000} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="period" label="مدة الصلاحية">
                    <RangePicker style={{ width: "100%" }} showTime={{ format: "HH:mm" }} format="YYYY/MM/DD HH:mm" allowEmpty={[true, true]} placeholder={["من الآن", "بلا نهاية"]} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="maxRedemptions" label="عدد الاستخدامات الكلي">
                    <InputNumber style={{ width: "100%" }} min={0} placeholder="بلا حد" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="perUserLimit" label="لكل زبونة">
                    <InputNumber style={{ width: "100%" }} min={0} placeholder="بلا حد" />
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Form.Item name="isActive" label="مفعّل" valuePropName="checked">
                    <Switch />
                  </Form.Item>
                </Col>
              </Row>

              <Divider titlePlacement="start" plain>
                العرض في التطبيق
              </Divider>
              <Form.Item name="showOnHome" label="إظهاره كبطاقة في الصفحة الرئيسية والسلة" valuePropName="checked">
                <Switch />
              </Form.Item>
              <Row gutter={12}>
                <Col span={12}>
                  <Form.Item name="title" label="العنوان على البطاقة">
                    <Input placeholder="مثلاً: خصم نهاية الأسبوع" maxLength={40} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="subtitle" label="سطر ثانٍ">
                    <Input placeholder="مثلاً: على كل منتجات العناية" maxLength={60} />
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Form.Item name="theme" label="لون البطاقة">
                    <Space wrap>
                      {THEMES.map((t) => (
                        <Tooltip key={t.value} title={t.label}>
                          <button
                            type="button"
                            onClick={() => form.setFieldValue("theme", t.value)}
                            style={{
                              width: 40,
                              height: 28,
                              borderRadius: 8,
                              cursor: "pointer",
                              border: watched.theme === t.value ? "3px solid #1f1f1f" : "1px solid #ddd",
                              background: `linear-gradient(135deg, ${t.colors.join(",")})`,
                            }}
                          />
                        </Tooltip>
                      ))}
                    </Space>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="homePosition" label="الترتيب (الأصغر أولاً)">
                    <InputNumber style={{ width: "100%" }} min={0} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="worldSlugs" label="يظهر في العوالم">
                    <Select mode="multiple" allowClear placeholder="كل العوالم" options={worlds.map((w) => ({ value: w.slug, label: w.nameAr }))} />
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Form.Item name="description" label="وصف داخلي / تفاصيل (يظهر إن لم يُكتب سطر ثانٍ)">
                    <Input />
                  </Form.Item>
                </Col>
              </Row>
            </Form>
          </Col>
          <Col xs={24} md={10}>
            <div style={{ position: "sticky", top: 0 }}>
              <Text strong>كيف تظهر في التطبيق</Text>
              <div style={{ marginTop: 10, direction: "rtl" }}>
                <TicketPreview v={watched} />
              </div>
              <Text type="secondary" style={{ display: "block", marginTop: 10, fontSize: 12, lineHeight: 1.7 }}>
                زر «استخدمي الكود» يفعّله للسلة مباشرة. إن كانت السلة دون الحد الأدنى يبقى الكود مفعّلاً ويظهر «أضيفي X ويتفعّل الخصم».
              </Text>
            </div>
          </Col>
        </Row>
      </Modal>
    </>
  );
}

/** معاينة مطابقة لبطاقة التطبيق (تذكرة بثقبين وخط متقطع). */
function TicketPreview({ v }: { v: any }) {
  const theme = THEMES.find((t) => t.value === v.theme) ?? THEMES[0];
  const type = v.type ?? "PERCENT";
  const big = type === "FREE_SHIPPING" ? "🚚" : type === "AMOUNT" ? (v.value >= 1000 && v.value % 1000 === 0 ? `${v.value / 1000}K` : fmt(v.value)) : `${v.value ?? 0}%`;
  const small = type === "FREE_SHIPPING" ? "توصيل مجاني" : type === "AMOUNT" ? "د.ع خصم" : "خصم";
  const title =
    v.title ||
    (type === "FIRST_ORDER" ? `خصم ${v.value ?? 0}% لأول طلب` : type === "FREE_SHIPPING" ? "توصيل مجاني لطلبكِ" : type === "AMOUNT" ? `خصم ${fmt(v.value)} د.ع` : `خصم ${v.value ?? 0}%`);
  const end: Dayjs | null = v.period?.[1] ?? null;
  const days = end ? end.diff(dayjs(), "day") : null;
  const conds = [
    v.minOrder ? `فوق ${fmt(v.minOrder)} د.ع` : null,
    v.maxDiscount && (type === "PERCENT" || type === "FIRST_ORDER") ? `حتى ${fmt(v.maxDiscount)} د.ع` : null,
    days != null && days >= 0 ? (days === 0 ? "ينتهي اليوم" : days <= 7 ? `ينتهي بعد ${days} أيام` : `حتى ${end!.format("D/M")}`) : null,
    v.maxRedemptions && v.maxRedemptions <= 30 ? `باقي ${v.maxRedemptions} فقط` : null,
  ].filter(Boolean);
  const notch = { position: "absolute" as const, right: 96 - 11, width: 22, height: 22, borderRadius: 99, background: "#fff" };
  return (
    <div
      style={{
        position: "relative",
        height: 138,
        borderRadius: 22,
        overflow: "hidden",
        display: "flex",
        color: "#fff",
        background: `linear-gradient(135deg, ${theme.colors.join(",")})`,
        boxShadow: `0 8px 18px ${theme.colors[1]}55`,
      }}
    >
      <span style={{ ...notch, top: -11 }} />
      <span style={{ ...notch, bottom: -11 }} />
      <div style={{ width: 96, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontSize: 32, fontWeight: 900, lineHeight: 1, direction: "ltr" }}>{big}</div>
        <div style={{ fontSize: 11.5, fontWeight: 700, opacity: 0.9, marginTop: 4 }}>{small}</div>
      </div>
      <div style={{ borderRight: "1.5px dashed rgba(255,255,255,.55)", margin: "16px 0" }} />
      <div style={{ flex: 1, padding: "14px 14px 12px", display: "flex", flexDirection: "column", minWidth: 0 }}>
        <div style={{ fontWeight: 900, fontSize: 16, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{title}</div>
        {(v.subtitle || v.description) && (
          <div style={{ fontSize: 12, opacity: 0.85, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {v.subtitle || v.description}
          </div>
        )}
        {conds.length > 0 && <div style={{ fontSize: 11, opacity: 0.8, fontWeight: 600, marginTop: 4 }}>{conds.join("  •  ")}</div>}
        <div style={{ marginTop: "auto", display: "flex", gap: 8, alignItems: "center" }}>
          <span
            style={{
              border: "1px solid rgba(255,255,255,.55)",
              background: "rgba(255,255,255,.16)",
              borderRadius: 10,
              padding: "5px 9px",
              fontWeight: 900,
              fontSize: 12.5,
              letterSpacing: 1.4,
              direction: "ltr",
            }}
          >
            {(v.code || "CODE").toUpperCase()} ⧉
          </span>
          <span style={{ background: "#fff", color: theme.colors[1], borderRadius: 99, padding: "7px 14px", fontWeight: 900, fontSize: 12.5 }}>
            ⚡ استخدمي الكود
          </span>
        </div>
      </div>
    </div>
  );
}
