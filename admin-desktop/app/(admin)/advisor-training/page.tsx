"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Alert,
  Button,
  Card,
  Checkbox,
  Col,
  Input,
  InputNumber,
  Popconfirm,
  Progress,
  Row,
  Select,
  Space,
  Statistic,
  Switch,
  Table,
  Tabs,
  Tag,
  Tooltip,
  Typography,
  message,
} from "antd";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import { mutations, queries } from "@/lib/queries";

const { Text, Paragraph } = Typography;

const TASKS = [
  { value: "products", label: "فهم المنتجات من أوصافها" },
  { value: "brands", label: "تقييم البراندات الجديدة" },
  { value: "language", label: "تعلّم لهجة الزبونات" },
  { value: "queries", label: "أسئلة لم تفهمها ديما" },
];

const STATE: Record<string, { color: string; label: string }> = {
  training: { color: "processing", label: "تتدرّب الآن" },
  stopped: { color: "default", label: "التدريب متوقف" },
  idle: { color: "success", label: "تعلّمت كل المتوفر — تنتظر جديداً" },
  capped: { color: "warning", label: "وصلت سقف اليوم — تكمل غداً" },
  no_ai: { color: "error", label: "مفتاح الذكاء الاصطناعي غير موجود" },
};

const SOURCES: Record<string, { color: string; label: string }> = {
  training: { color: "purple", label: "من التدريب" },
  chat: { color: "blue", label: "من محادثة" },
  language: { color: "cyan", label: "لهجة" },
  admin: { color: "gold", label: "يدوي" },
};

const pct = (a: number, b: number) => (b > 0 ? Math.min(100, Math.round((100 * a) / b)) : 100);
const fmt = (n: number) => (n ?? 0).toLocaleString("en-US");

export default function AdvisorTrainingPage() {
  const qc = useQueryClient();
  const { data: s, isLoading } = useQuery({
    queryKey: ["advisor-training"],
    queryFn: queries.advisorTraining,
    refetchInterval: (q) => ((q.state.data as any)?.running ? 15_000 : 60_000),
  });

  const update = useMutation({
    mutationFn: mutations.updateAdvisorTraining,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["advisor-training"] }),
    onError: () => message.error("تعذّر الحفظ"),
  });
  const rebuild = useMutation({
    mutationFn: mutations.rebuildAdvisor,
    onSuccess: (r: any) => message.success(`تم تطبيق المعرفة على ${fmt(r?.products)} منتج`),
  });

  const [batches, setBatches] = useState<number | null>(null);
  useEffect(() => {
    if (s?.dailyBatches != null && batches == null) setBatches(s.dailyBatches);
  }, [s?.dailyBatches, batches]);

  const p = s?.progress;
  const running = Boolean(s?.running);
  const state = STATE[s?.state] ?? STATE.stopped;
  const usage: any[] = Array.isArray(s?.usage) ? s.usage : [];
  const today = usage.find((u) => u.day === dayjs().add(3, "hour").format("YYYY-MM-DD"));

  return (
    <Space direction="vertical" size={16} style={{ width: "100%" }}>
      <Card loading={isLoading}>
        <Row gutter={[24, 16]} align="middle">
          <Col xs={24} md={6} style={{ textAlign: "center" }}>
            <Progress
              type="dashboard"
              percent={s?.level ?? 0}
              size={150}
              strokeColor={{ "0%": "#d4a5c9", "100%": "#8e3b78" }}
              format={(v) => (
                <div>
                  <div style={{ fontSize: 30, fontWeight: 700 }}>{v}%</div>
                  <div style={{ fontSize: 12, color: "#888" }}>مستوى الفهم</div>
                </div>
              )}
            />
          </Col>
          <Col xs={24} md={11}>
            <Space direction="vertical" size={6}>
              <Typography.Title level={3} style={{ margin: 0 }}>
                تدريب ديما ✦
              </Typography.Title>
              <Space wrap>
                <Tag color={state.color}>{state.label}</Tag>
                {s?.model && <Tag>{s.model}</Tag>}
                {s?.lastRunAt && <Text type="secondary">آخر دفعة: {dayjs(s.lastRunAt).format("YYYY/MM/DD HH:mm")}</Text>}
              </Space>
              <Paragraph type="secondary" style={{ margin: 0 }}>
                الذكاء الاصطناعي يدرّس ديما على دفعات صغيرة: يفهم كل منتج من وصفه، يقيّم البراندات، يعلّمها كيف تكتب
                الزبونات، ويحوّل كل سؤال لم تفهمه إلى معرفة محفوظة. ما تتعلّمه يبقى عندها — فتجيب بعدها بنفسها، بسرعة
                وبدون أي استهلاك.
              </Paragraph>
              {s?.lastError && <Alert type="warning" showIcon message={`آخر خطأ: ${s.lastError}`} />}
            </Space>
          </Col>
          <Col xs={24} md={7} style={{ textAlign: "center" }}>
            <Button
              type={running ? "default" : "primary"}
              danger={running}
              size="large"
              block
              disabled={!s?.aiEnabled}
              loading={update.isPending}
              onClick={() => update.mutate({ running: !running })}
              style={{ height: 56, fontSize: 18 }}
            >
              {running ? "⏸ إيقاف التدريب" : "▶ تشغيل التدريب"}
            </Button>
            <Tooltip title="يعيد بناء فهرس ديما فوراً ليدخل كل ما تعلّمته في الترشيحات (يحدث تلقائياً كل بضع دقائق).">
              <Button style={{ marginTop: 10 }} block loading={rebuild.isPending} onClick={() => rebuild.mutate()}>
                طبّق المعرفة الآن
              </Button>
            </Tooltip>
          </Col>
        </Row>
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={14}>
          <Card title="ماذا تعلّمت ديما" loading={isLoading} style={{ height: "100%" }}>
            {p && (
              <Space direction="vertical" size={14} style={{ width: "100%" }}>
                <ProgressRow
                  label="فهم المنتجات"
                  hint={`${fmt(p.products.done)} من ${fmt(p.products.total)} منتج — ${fmt(p.products.weak)} تحتاج فهماً أولاً`}
                  percent={pct(p.products.done, p.products.total)}
                />
                <ProgressRow
                  label="سمعة البراندات"
                  hint={`${fmt(p.brands.total - p.brands.unknown)} من ${fmt(p.brands.total)} براند معروف المستوى`}
                  percent={pct(p.brands.total - p.brands.unknown, p.brands.total)}
                />
                <ProgressRow
                  label="لهجة الزبونات"
                  hint={`${fmt(p.language.done)} من ${fmt(p.language.total)} مفهوم — ${fmt(p.phrases.bySource?.language ?? 0)} صيغة محفوظة`}
                  percent={pct(p.language.done, p.language.total)}
                />
                <ProgressRow
                  label="أسئلة الزبونات"
                  hint={`${fmt(p.questions.resolved)} سؤال صار مفهوماً — ${fmt(p.questions.open)} بانتظار التدريب`}
                  percent={pct(p.questions.resolved, p.questions.open + p.questions.resolved)}
                />
                <Text type="secondary">إجمالي العبارات التي تفهمها ديما الآن بنفسها: {fmt(p.phrases.total)}</Text>
              </Space>
            )}
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card title="الإعدادات والاستهلاك" loading={isLoading} style={{ height: "100%" }}>
            {s && (
              <Space direction="vertical" size={14} style={{ width: "100%" }}>
                <Row gutter={12}>
                  <Col span={12}>
                    <Statistic title="دفعات تدريب متبقية اليوم" value={s.remainingToday?.train ?? 0} />
                  </Col>
                  <Col span={12}>
                    <Statistic title="ردود ذكية متبقية اليوم" value={s.remainingToday?.chat ?? 0} />
                  </Col>
                </Row>
                <div>
                  <Text strong>سقف دفعات التدريب يومياً</Text>
                  <Space style={{ display: "flex", marginTop: 6 }}>
                    <InputNumber min={0} max={2000} value={batches} onChange={(v) => setBatches(v ?? 0)} />
                    <Button
                      disabled={batches === s.dailyBatches}
                      onClick={() => update.mutate({ dailyBatches: batches ?? 0 }, { onSuccess: () => message.success("تم الحفظ") })}
                    >
                      حفظ
                    </Button>
                  </Space>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    كل دفعة = طلب واحد صغير (حتى 12 منتجاً). الأقل = استهلاك أقل وتعلّم أبطأ.
                  </Text>
                </div>
                <SettingSwitch
                  label="الذكاء أثناء المحادثة"
                  hint="فقط للرسائل التي لم تفهمها ديما، وكل جواب يُحفظ فلا يُدفع ثمنه مرتين."
                  checked={s.liveAi}
                  onChange={(v) => update.mutate({ liveAi: v })}
                />
                <SettingSwitch
                  label="فهم المنتجات الجديدة تلقائياً"
                  hint="حتى والتدريب متوقف: أي منتج تضيفينه تفهمه ديما خلال دقائق."
                  checked={s.autoNew}
                  onChange={(v) => update.mutate({ autoNew: v })}
                />
                <div>
                  <Text strong>مهام التدريب</Text>
                  <Checkbox.Group
                    style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 6 }}
                    options={TASKS}
                    value={Array.isArray(s.tasks) ? s.tasks : []}
                    onChange={(v) => v.length && update.mutate({ tasks: v as string[] })}
                  />
                </div>
                {today && (
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    اليوم: {fmt(today.enrichCalls)} دفعة تدريب، {fmt(today.chatCalls)} رد ذكي،{" "}
                    {fmt(today.promptTokens + today.completionTokens)} رمز.
                  </Text>
                )}
              </Space>
            )}
          </Card>
        </Col>
      </Row>

      <TryBox />

      <Card>
        <Tabs
          items={[
            { key: "phrases", label: "ما تفهمه الآن", children: <PhrasesTab /> },
            { key: "questions", label: "أسئلة الزبونات", children: <QuestionsTab /> },
            {
              key: "usage",
              label: "الاستهلاك اليومي",
              children: (
                <Table
                  rowKey="day"
                  size="small"
                  dataSource={usage}
                  pagination={false}
                  columns={[
                    { title: "اليوم", dataIndex: "day" },
                    { title: "دفعات تدريب", dataIndex: "enrichCalls", render: fmt },
                    { title: "ردود ذكية", dataIndex: "chatCalls", render: fmt },
                    { title: "رموز الإدخال", dataIndex: "promptTokens", render: fmt },
                    { title: "رموز الإخراج", dataIndex: "completionTokens", render: fmt },
                  ]}
                />
              ),
            },
          ]}
        />
      </Card>
    </Space>
  );
}

function ProgressRow({ label, hint, percent }: { label: string; hint: string; percent: number }) {
  return (
    <div>
      <Space style={{ display: "flex", justifyContent: "space-between" }}>
        <Text strong>{label}</Text>
        <Text type="secondary" style={{ fontSize: 12 }}>
          {hint}
        </Text>
      </Space>
      <Progress percent={percent} strokeColor="#a8508f" />
    </div>
  );
}

function SettingSwitch(props: { label: string; hint: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
      <div>
        <Text strong>{props.label}</Text>
        <div>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {props.hint}
          </Text>
        </div>
      </div>
      <Switch checked={props.checked} onChange={props.onChange} />
    </div>
  );
}

function TryBox() {
  const [text, setText] = useState("");
  const run = useMutation({ mutationFn: mutations.tryAdvisor });
  const r: any = run.data;
  return (
    <Card title="جرّبي ديما" size="small">
      <Space.Compact style={{ width: "100%" }}>
        <Input
          placeholder="اكتبي رسالة كما تكتبها الزبونة… مثلاً: اريد شي يخلي وجهي يلمع بالعرس"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onPressEnter={() => text.trim() && run.mutate(text.trim())}
        />
        <Button type="primary" loading={run.isPending} onClick={() => text.trim() && run.mutate(text.trim())}>
          ماذا تفهم؟
        </Button>
      </Space.Compact>
      {r && (
        <div style={{ marginTop: 12 }}>
          <Space wrap>
            <Text>فهمت:</Text>
            {r.meaning?.length ? r.meaning.map((m: string) => <Tag key={m}>{m}</Tag>) : <Text type="secondary">لا شيء واضح</Text>}
          </Space>
          <div style={{ marginTop: 6 }}>
            {r.needsAi ? (
              <Text type="warning">
                هذه الرسالة ما زالت غامضة لديما — ستستعين بالذكاء الاصطناعي مرة، ثم تحفظ معناها للمرات القادمة.
              </Text>
            ) : (
              <Text type="success">تفهمها ديما بنفسها — بدون أي استهلاك.</Text>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}

function PhrasesTab() {
  const qc = useQueryClient();
  const [source, setSource] = useState<string>("");
  const [q, setQ] = useState("");
  const { data, isLoading } = useQuery({
    queryKey: ["advisor-phrases", source, q],
    queryFn: () => queries.advisorPhrases({ source: source || undefined, q: q || undefined }),
  });
  const del = useMutation({
    mutationFn: mutations.deleteAdvisorPhrase,
    onSuccess: () => {
      message.success("حُذفت — لن تستخدمها ديما بعد الآن");
      qc.invalidateQueries({ queryKey: ["advisor-phrases"] });
    },
  });
  return (
    <Space direction="vertical" style={{ width: "100%" }}>
      <Space wrap>
        <Input.Search placeholder="ابحثي في العبارات" allowClear onSearch={setQ} style={{ width: 260 }} />
        <Select
          value={source}
          onChange={setSource}
          style={{ width: 160 }}
          options={[{ value: "", label: "كل المصادر" }, ...Object.entries(SOURCES).map(([value, v]) => ({ value, label: v.label }))]}
        />
      </Space>
      <Table
        rowKey="id"
        size="small"
        loading={isLoading}
        dataSource={Array.isArray(data) ? data : []}
        pagination={{ pageSize: 20 }}
        columns={[
          { title: "العبارة", dataIndex: "phrase", render: (t: string) => <Text strong>{t}</Text> },
          {
            title: "المعنى",
            dataIndex: "meaning",
            render: (m: string[]) => (
              <Space size={[4, 4]} wrap>
                {(m ?? []).map((x) => (
                  <Tag key={x}>{x}</Tag>
                ))}
              </Space>
            ),
          },
          {
            title: "المصدر",
            dataIndex: "source",
            render: (v: string) => <Tag color={SOURCES[v]?.color}>{SOURCES[v]?.label ?? v}</Tag>,
          },
          { title: "التاريخ", dataIndex: "updatedAt", render: (d: string) => dayjs(d).format("MM/DD HH:mm") },
          {
            title: "",
            render: (_: unknown, row: any) => (
              <Popconfirm title="حذف هذه المعرفة؟" description="استخدميه إذا فهمت ديما العبارة خطأ." onConfirm={() => del.mutate(row.id)}>
                <Button size="small" danger>
                  حذف
                </Button>
              </Popconfirm>
            ),
          },
        ]}
      />
    </Space>
  );
}

function QuestionsTab() {
  const { data, isLoading } = useQuery({ queryKey: ["advisor-questions"], queryFn: queries.advisorQuestions });
  return (
    <Table
      rowKey="id"
      size="small"
      loading={isLoading}
      dataSource={Array.isArray(data) ? data : []}
      pagination={{ pageSize: 20 }}
      columns={[
        { title: "رسالة الزبونة", dataIndex: "sample" },
        { title: "تكررت", dataIndex: "count", width: 80 },
        {
          title: "الحالة",
          dataIndex: "resolved",
          width: 130,
          render: (v: boolean) => (v ? <Tag color="success">صارت مفهومة</Tag> : <Tag color="warning">بانتظار التدريب</Tag>),
        },
        { title: "آخر مرة", dataIndex: "lastAt", width: 120, render: (d: string) => dayjs(d).format("MM/DD HH:mm") },
      ]}
    />
  );
}
