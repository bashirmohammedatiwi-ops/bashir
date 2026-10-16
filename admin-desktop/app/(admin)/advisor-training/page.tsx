"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Alert,
  Button,
  Card,
  Col,
  Input,
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
import { useState } from "react";
import { mutations, queries } from "@/lib/queries";

const { Text, Paragraph } = Typography;

const STATE: Record<string, { color: string; label: string }> = {
  training: { color: "processing", label: "تتدرّب الآن (في الخلفية)" },
  ready: { color: "success", label: "مدرَّبة — التدريب التلقائي يعمل" },
  stopped: { color: "default", label: "التدريب التلقائي متوقف" },
  untrained: { color: "warning", label: "لم تتدرّب بعد" },
};

const SOURCES: Record<string, { color: string; label: string }> = {
  training: { color: "purple", label: "من التدريب" },
  chat: { color: "blue", label: "من محادثة" },
  language: { color: "cyan", label: "لهجة" },
  admin: { color: "gold", label: "يدوي" },
};

const FACET_AR: Record<string, string> = { area: "المجال", kind: "النوع", gender: "الجنس", family: "العائلة", concern: "المشكلة", skinType: "نوع البشرة" };

const pct = (a: number, b: number) => (b > 0 ? Math.min(100, Math.round((100 * a) / b)) : 100);
const fmt = (n: number) => (n ?? 0).toLocaleString("en-US");
const p100 = (x?: number) => (x == null ? "—" : `${(100 * x).toFixed(1)}%`);

export default function AdvisorTrainingPage() {
  const qc = useQueryClient();
  const { data: s, isLoading } = useQuery({
    queryKey: ["advisor-training"],
    queryFn: queries.advisorTraining,
    refetchInterval: (q) => ((q.state.data as any)?.state === "training" ? 10_000 : 60_000),
  });

  const update = useMutation({
    mutationFn: mutations.updateAdvisorTraining,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["advisor-training"] }),
    onError: () => message.error("تعذّر الحفظ"),
  });
  const trainNow = useMutation({
    mutationFn: mutations.trainAdvisorNow,
    onSuccess: () => {
      message.success("بدأ التدريب في الخلفية — النتيجة تظهر هنا خلال دقائق");
      qc.invalidateQueries({ queryKey: ["advisor-training"] });
    },
  });
  const rebuild = useMutation({
    mutationFn: mutations.rebuildAdvisor,
    onSuccess: (r: any) => message.success(`تم تطبيق المعرفة على ${fmt(r?.products)} منتج`),
  });

  const p = s?.progress;
  const st = s?.stats;
  const running = Boolean(s?.running);
  const state = STATE[s?.state] ?? STATE.untrained;
  const before = s?.evalBefore;
  const after = s?.evalAfter;

  return (
    <Space direction="vertical" size={16} style={{ width: "100%" }}>
      <Card loading={isLoading}>
        <Row gutter={[24, 16]} align="middle">
          <Col xs={24} md={6} style={{ textAlign: "center" }}>
            <Progress
              type="dashboard"
              percent={after ? Math.round(after.accuracy * 100) : 0}
              size={150}
              strokeColor={{ "0%": "#d4a5c9", "100%": "#8e3b78" }}
              format={(v) => (
                <div>
                  <div style={{ fontSize: 30, fontWeight: 700 }}>{v}%</div>
                  <div style={{ fontSize: 12, color: "#888" }}>دقة الفهم</div>
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
                <Tag>تدريب داخلي على السيرفر</Tag>
                {s?.trainedAt && <Text type="secondary">آخر تدريب: {dayjs(s.trainedAt).format("YYYY/MM/DD HH:mm")}</Text>}
              </Space>
              <Paragraph type="secondary" style={{ margin: 0 }}>
                ديما تتدرّب بنفسها على السيرفر — من أسماء وأوصاف منتجاتكِ، ومما تختاره الزبونات (فتح، سلة، إعجاب) — بدون
                أي ذكاء خارجي وبدون أي استهلاك. التدريب يعمل تلقائياً كل ليلة أو حين تتغير البيانات، في الخلفية وبأقل
                أولوية، فلا يبطّئ المتجر.
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
              loading={update.isPending}
              onClick={() => update.mutate({ running: !running })}
              style={{ height: 52, fontSize: 17 }}
            >
              {running ? "⏸ إيقاف التدريب التلقائي" : "▶ تشغيل التدريب التلقائي"}
            </Button>
            <Button
              style={{ marginTop: 10 }}
              block
              disabled={s?.state === "training"}
              loading={trainNow.isPending || s?.state === "training"}
              onClick={() => trainNow.mutate()}
            >
              درّبيها الآن
            </Button>
            <Tooltip title="يعيد بناء فهرس ديما فوراً (يحدث تلقائياً بعد كل تدريب وكل بضع دقائق).">
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
            {st ? (
              <Space direction="vertical" size={14} style={{ width: "100%" }}>
                <Row gutter={[12, 12]}>
                  <Col span={8}>
                    <Statistic title="منتجات تعلّمت منها" value={st.products} />
                  </Col>
                  <Col span={8}>
                    <Statistic title="كلمات تفهم معناها" value={st.features} />
                  </Col>
                  <Col span={8}>
                    <Statistic title="منتجات أكملت صفاتها" value={st.enriched} />
                  </Col>
                  <Col span={8}>
                    <Statistic title="تفاعلات تعلّمت منها" value={st.events} />
                  </Col>
                  <Col span={8}>
                    <Statistic title="أنواع طلبات بترتيب متعلّم" value={st.affinityKeys} />
                  </Col>
                  <Col span={8}>
                    <Statistic title="كلمات بمتجهات معنى" value={st.vocab ?? 0} />
                  </Col>
                </Row>
                <div>
                  <Text strong>دقة إكمال صفات المنتجات (تحقق متقاطع)</Text>
                  <div style={{ marginTop: 6 }}>
                    <Space size={[6, 6]} wrap>
                      {Object.entries(st.cv ?? {}).map(([k, v]: [string, any]) => (
                        <Tag key={k} color="purple">
                          {FACET_AR[k] ?? k}: {p100(v.precision)} دقة · تغطية {p100(v.coverage)}
                        </Tag>
                      ))}
                    </Space>
                  </div>
                </div>
                {p && (
                  <ProgressRow
                    label="أسئلة الزبونات"
                    hint={`${fmt(p.questions.resolved)} سؤال صار مفهوماً — ${fmt(p.questions.open)} لم يُفهم بعد`}
                    percent={pct(p.questions.resolved, p.questions.open + p.questions.resolved)}
                  />
                )}
                {p && <Text type="secondary">عبارات محفوظة تفهمها ديما: {fmt(p.phrases.total)}</Text>}
              </Space>
            ) : (
              <Text type="secondary">ستظهر النتائج بعد أول تدريب (يبدأ تلقائياً بعد تشغيل الخادم بدقائق).</Text>
            )}
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card title="القياس والإعدادات" loading={isLoading} style={{ height: "100%" }}>
            {s && (
              <Space direction="vertical" size={14} style={{ width: "100%" }}>
                {before && after && (
                  <div>
                    <Text strong>مجموعة اختبار ({after.n} سؤال حقيقي الصيغة)</Text>
                    <Row gutter={12} style={{ marginTop: 6 }}>
                      <Col span={12}>
                        <Statistic title="بدون النموذج" value={p100(before.accuracy)} />
                      </Col>
                      <Col span={12}>
                        <Statistic title="بعد التدريب" value={p100(after.accuracy)} valueStyle={{ color: "#8e3b78" }} />
                      </Col>
                    </Row>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      دقة أول 5 ترشيحات: {p100(before.p5)} ← {p100(after.p5)} · زمن الرد: {after.meanMs} ملي ثانية
                    </Text>
                    {after.convos && (
                      <div>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          محادثات متعددة الأدوار: {after.convos.ok}/{after.convos.n}
                          {after.searchP5 != null && <> · بحث المتجر (أول 5): {p100(before.searchP5)} ← {p100(after.searchP5)}</>}
                        </Text>
                      </div>
                    )}
                  </div>
                )}
                <SettingSwitch
                  label="فهم النموذج أثناء المحادثة"
                  hint="يفهم الكلمات التي لا يعرفها المعجم، ويرتّب حسب ما تختاره الزبونات."
                  checked={s.liveAi}
                  onChange={(v) => update.mutate({ liveAi: v })}
                />
                <SettingSwitch
                  label="إكمال صفات المنتجات الناقصة"
                  hint="نوع/جنس/عائلة المنتج حين لا يذكرها اسمه أو قسمه — فقط بدقة عالية."
                  checked={s.autoNew}
                  onChange={(v) => update.mutate({ autoNew: v })}
                />
              </Space>
            )}
          </Card>
        </Col>
      </Row>

      <TryBox />

      <Card>
        <Tabs
          items={[
            { key: "phrases", label: "عبارات محفوظة", children: <PhrasesTab /> },
            { key: "questions", label: "أسئلة الزبونات", children: <QuestionsTab /> },
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
          {r.byModel?.length > 0 && (
            <Space wrap style={{ marginTop: 6 }}>
              <Text type="secondary">منها بفضل التدريب:</Text>
              {r.byModel.map((m: string) => (
                <Tag key={m} color="purple">
                  {m}
                </Tag>
              ))}
            </Space>
          )}
          <div style={{ marginTop: 6 }}>
            {r.weak ? (
              <Text type="warning">ما زالت غامضة — ستُسجَّل في «أسئلة الزبونات» ويُعاد فحصها بعد كل تدريب.</Text>
            ) : (
              <Text type="success">تفهمها ديما بنفسها.</Text>
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
          render: (v: boolean) => (v ? <Tag color="success">صارت مفهومة</Tag> : <Tag color="warning">لم تُفهم بعد</Tag>),
        },
        { title: "آخر مرة", dataIndex: "lastAt", width: 120, render: (d: string) => dayjs(d).format("MM/DD HH:mm") },
      ]}
    />
  );
}
