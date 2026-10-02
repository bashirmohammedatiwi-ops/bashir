"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Badge,
  Button,
  Card,
  Col,
  Drawer,
  Empty,
  Input,

  Row,
  Select,
  Space,
  Spin,
  Statistic,
  Switch,
  Table,
  Tabs,
  Tag,
  Tooltip,
  Typography,
  message as antMessage,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { queries } from "@/lib/queries";

const INTENT_LABELS: Record<string, string> = {
  CASUAL_CHAT: "دردشة",
  PRODUCT_SEARCH: "بحث منتج",
  PRODUCT_RECOMMENDATION: "توصيات",
  PRODUCT_DETAILS: "تفاصيل منتج",
  PRODUCT_COMPARISON: "مقارنة",
  PRODUCT_AVAILABILITY: "توفر",
  PRICE_QUERY: "سعر",
  CART_ACTION: "إضافة للسلة",
  FAVORITES_ACTION: "مفضلة",
  ORDER_STATUS: "حالة طلب",
  REORDER: "إعادة طلب",
  LOYALTY_QUERY: "نقاط ولاء",
  FOLLOW_UP: "متابعة",
  GENERAL_BEAUTY_GUIDANCE: "إرشاد عناية",
  OUT_OF_SCOPE: "خارج النطاق",
};

const RESPONSE_TYPE_COLORS: Record<string, string> = {
  TEXT: "default",
  PRODUCT_RECOMMENDATIONS: "green",
  PRODUCT_COMPARISON: "blue",
  ORDER_INFO: "geekblue",
  CLARIFICATION: "orange",
  CART_ACTION: "cyan",
  EMPTY_RESULT: "red",
  ERROR_RECOVERY: "red",
};

interface ConversationRow {
  id: string;
  title: string | null;
  lastIntent: string | null;
  messageCount: number;
  lastMessageAt: string;
  createdAt: string;
  userId: string | null;
  userName: string | null;
  userPhone: string | null;
  feedbackUp: number;
  feedbackDown: number;
}

interface TranscriptMessage {
  id: string;
  role: string;
  content: string;
  payload?: {
    type?: string;
    products?: Array<{ name?: string; brandName?: string; price?: number }>;
    orders?: Array<{ orderNumber?: string; status?: string }>;
  } | null;
  intent: string | null;
  latencyMs: number | null;
  tokensIn: number | null;
  tokensOut: number | null;
  feedback: number | null;
  feedbackNote: string | null;
  createdAt: string;
}

interface LessonRow {
  id: string;
  content: string;
  source: string;
  evidence: number;
  isActive: boolean;
  updatedAt: string;
}

export function AssistantAdminPage() {
  const [days, setDays] = useState(30);
  const [feedbackFilter, setFeedbackFilter] = useState<number | undefined>();
  const [openConversationId, setOpenConversationId] = useState<string | null>(null);
  const [newLesson, setNewLesson] = useState("");
  const [mining, setMining] = useState(false);
  const queryClient = useQueryClient();

  const { data: overview, isLoading: loadingOverview } = useQuery({
    queryKey: ["assistant-overview", days],
    queryFn: () => queries.assistantOverview(days),
    staleTime: 60_000,
  });

  const { data: conversationsData, isLoading: loadingConversations } = useQuery({
    queryKey: ["assistant-conversations", days, feedbackFilter],
    queryFn: () =>
      queries.assistantConversations({
        take: 30,
        days,
        ...(feedbackFilter !== undefined ? { feedback: feedbackFilter } : {}),
      }),
    staleTime: 60_000,
  });

  const { data: transcript, isLoading: loadingTranscript } = useQuery({
    queryKey: ["assistant-conversation", openConversationId],
    queryFn: () => queries.assistantConversation(openConversationId!),
    enabled: Boolean(openConversationId),
    staleTime: 30_000,
  });

  const { data: lessonsData, isLoading: loadingLessons, refetch: refetchLessons } = useQuery({
    queryKey: ["assistant-lessons"],
    queryFn: () => queries.assistantLessons(),
    staleTime: 60_000,
  });

  const lessons: LessonRow[] = useMemo(() => lessonsData?.items ?? [], [lessonsData]);

  const lessonColumns: ColumnsType<LessonRow> = [
    {
      title: "الدرس",
      dataIndex: "content",
      render: (content: string, row) => (
        <Space direction="vertical" size={2} style={{ width: "100%" }}>
          <Typography.Text strong={!row.isActive} delete={!row.isActive}>
            {content}
          </Typography.Text>
          <Space size={6}>
            <Tag color={row.source === "manual" ? "blue" : "purple"}>
              {row.source === "manual" ? "يدوي" : "من التقييمات"}
            </Tag>
            <Typography.Text type="secondary" style={{ fontSize: 11 }}>
              تكرار {row.evidence}× • {dayjs(row.updatedAt).format("MM/DD HH:mm")}
            </Typography.Text>
          </Space>
        </Space>
      ),
    },
    {
      title: "مفعّل",
      dataIndex: "isActive",
      width: 90,
      align: "center",
      render: (active: boolean, row) => (
        <Switch
          checked={active}
          size="small"
          onChange={async (checked) => {
            const ok = await queries.assistantToggleLesson(row.id, checked).catch(() => null);
            if (ok) {
              antMessage.success(checked ? "تم تفعيل الدرس" : "تم إيقاف الدرس");
              refetchLessons();
            } else {
              antMessage.error("تعذر التحديث");
            }
          }}
        />
      ),
    },
  ];

  const conversations: ConversationRow[] = useMemo(
    () => conversationsData?.items ?? [],
    [conversationsData],
  );
  const messages: TranscriptMessage[] = useMemo(() => transcript?.messages ?? [], [transcript]);

  const columns: ColumnsType<ConversationRow> = [
    {
      title: "المحادثة",
      dataIndex: "title",
      render: (_: unknown, row) => (
        <Space direction="vertical" size={2}>
          <Typography.Text strong>
            {row.title || "بدون عنوان"}
          </Typography.Text>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            {row.userName || row.userPhone || (row.userId ? `مستخدم ${row.userId.slice(0, 8)}` : "زائر")}
          </Typography.Text>
        </Space>
      ),
    },
    {
      title: "آخر نية",
      dataIndex: "lastIntent",
      width: 130,
      render: (intent: string | null) =>
        intent ? <Tag>{INTENT_LABELS[intent] ?? intent}</Tag> : "—",
    },
    { title: "الرسائل", dataIndex: "messageCount", width: 90, align: "center" },
    {
      title: "التقييم",
      width: 120,
      align: "center",
      render: (_: unknown, row) => (
        <Space size={4}>
          <Tooltip title="إعجابات">
            <Tag color="green" style={{ marginInlineEnd: 0 }}>👍 {row.feedbackUp}</Tag>
          </Tooltip>
          <Tooltip title="عدم إعجاب">
            <Tag color="red" style={{ marginInlineEnd: 0 }}>👎 {row.feedbackDown}</Tag>
          </Tooltip>
        </Space>
      ),
    },
    {
      title: "آخر نشاط",
      dataIndex: "lastMessageAt",
      width: 140,
      render: (v: string) => (v ? dayjs(v).format("YYYY/MM/DD HH:mm") : "—"),
    },
  ];

  const feedbackUp = overview?.feedback?.find((f: { value: number }) => f.value === 1)?.count ?? 0;
  const feedbackDown = overview?.feedback?.find((f: { value: number }) => f.value === -1)?.count ?? 0;

  return (
    <Space direction="vertical" size={12} style={{ width: "100%" }}>
      <PageHeader
        title="المساعد الذكي"
        subtitle="تحليلات الاستخدام والتكلفة والتقييمات + تدقيق المحادثات"
        extra={
          <Select
            value={days}
            onChange={setDays}
            style={{ width: 140 }}
            options={[
              { value: 7, label: "آخر 7 أيام" },
              { value: 30, label: "آخر 30 يوم" },
              { value: 90, label: "آخر 90 يوم" },
            ]}
          />
        }
      />

      <Tabs
        defaultActiveKey="overview"
        items={[
          {
            key: "overview",
            label: "نظرة عامة",
            children: (
              <Space direction="vertical" size={12} style={{ width: "100%" }}>
                <Row gutter={12}>
                  <Col xs={12} sm={6}>
                    <Card loading={loadingOverview}>
                      <Statistic title="رسائل المستخدمين" value={overview?.userMessages ?? 0} />
                    </Card>
                  </Col>
                  <Col xs={12} sm={6}>
                    <Card loading={loadingOverview}>
                      <Statistic title="محادثات نشطة" value={overview?.activeConversations ?? 0} />
                    </Card>
                  </Col>
                  <Col xs={12} sm={6}>
                    <Card loading={loadingOverview}>
                      <Statistic
                        title="متوسط زمن الرد"
                        value={overview?.avgLatencyMs ?? 0}
                        suffix="ms"
                      />
                    </Card>
                  </Col>
                  <Col xs={12} sm={6}>
                    <Card loading={loadingOverview}>
                      <Statistic
                        title="تكلفة تقديرية"
                        value={overview?.estCostUsd ?? 0}
                        precision={2}
                        suffix="$"
                      />
                    </Card>
                  </Col>
                  <Col xs={12} sm={6}>
                    <Card loading={loadingOverview}>
                      <Statistic
                        title="الـ Tokens"
                        value={(overview?.tokens?.in ?? 0) + (overview?.tokens?.out ?? 0)}
                      />
                    </Card>
                  </Col>
                  <Col xs={12} sm={6}>
                    <Card loading={loadingOverview}>
                      <Statistic title="👍 إعجابات" value={feedbackUp} valueStyle={{ color: "#389e0d" }} />
                    </Card>
                  </Col>
                  <Col xs={12} sm={6}>
                    <Card loading={loadingOverview}>
                      <Statistic title="👎 عدم إعجاب" value={feedbackDown} valueStyle={{ color: "#cf1322" }} />
                    </Card>
                  </Col>
                  <Col xs={12} sm={6}>
                    <Card loading={loadingOverview}>
                      <Statistic
                        title="أخطاء"
                        value={overview?.errors ?? 0}
                        valueStyle={{ color: overview?.errors ? "#cf1322" : undefined }}
                      />
                    </Card>
                  </Col>
                </Row>

                <Row gutter={12}>
                  <Col xs={24} lg={14}>
                    <Card title="أكثر النوايا" size="small">
                      <Table
                        size="small"
                        rowKey="intent"
                        pagination={false}
                        loading={loadingOverview}
                        dataSource={overview?.byIntent ?? []}
                        columns={[
                          {
                            title: "النية",
                            dataIndex: "intent",
                            render: (v: string | null) =>
                              v ? INTENT_LABELS[v] ?? v : "—",
                          },
                          { title: "العدد", dataIndex: "count", width: 90, align: "center" },
                        ]}
                      />
                    </Card>
                  </Col>
                  <Col xs={24} lg={10}>
                    <Card title="جودة الاسترجاع" size="small">
                      <Space direction="vertical" size={8} style={{ width: "100%" }}>
                        <Statistic
                          title="عمليات بحث بلا نتيجة"
                          value={overview?.noResultSearches ?? 0}
                          valueStyle={{ color: overview?.noResultSearches ? "#d46b08" : undefined }}
                        />
                        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                          هذه الفرص تستحق توسيع الكتالوج أو تحسين صياغة البحث.
                        </Typography.Text>
                      </Space>
                    </Card>
                  </Col>
                </Row>
              </Space>
            ),
          },
          {
            key: "lessons",
            label: "الدروس المتعلّمة",
            children: (
              <Card size="small">
                <Space direction="vertical" size={12} style={{ width: "100%" }}>
                  <Typography.Text type="secondary" style={{ fontSize: 12.5 }}>
                    المساعد يستخرج دروس جودة من الردود المقيمة 👎 ويطبقها تلقائياً على كل
                    الردود القادمة — كل درس مفعّل يُحقن في الـ prompt. شغّل التعدين دورياً
                    (أسبوعياً مثلاً) ليتطور باستمرار.
                  </Typography.Text>
                  <Space wrap>
                    <Button
                      type="primary"
                      loading={mining}
                      onClick={async () => {
                        setMining(true);
                        try {
                          const result = await queries.assistantMineLessons(days);
                          antMessage.success(
                            `فحص ${result?.scanned ?? 0} تقييم سلبي — تعلّم ${result?.learned ?? 0} درس جديد`,
                          );
                          refetchLessons();
                          queryClient.invalidateQueries({ queryKey: ["assistant-overview"] });
                        } catch {
                          antMessage.error("تعذر تعدين الدروس");
                        } finally {
                          setMining(false);
                        }
                      }}
                    >
                      ✦ تعدين دروس جديدة من التقييمات
                    </Button>
                    <Input.Search
                      style={{ width: 320 }}
                      placeholder="أضف درساً يدوياً (سطر واحد)"
                      enterButton="إضافة"
                      value={newLesson}
                      onChange={(e) => setNewLesson(e.target.value)}
                      onSearch={async (value) => {
                        const content = value.trim();
                        if (content.length < 8) {
                          antMessage.warning("الدرس قصير جداً");
                          return;
                        }
                        const ok = await queries.assistantAddLesson(content).catch(() => null);
                        if (ok) {
                          antMessage.success("تمت إضافة الدرس");
                          setNewLesson("");
                          refetchLessons();
                        } else {
                          antMessage.error("تعذرت الإضافة");
                        }
                      }}
                    />
                  </Space>
                  <Table
                    size="small"
                    rowKey="id"
                    loading={loadingLessons}
                    dataSource={lessons}
                    columns={lessonColumns}
                    pagination={false}
                    locale={{ emptyText: <Empty description="لا دروس بعد — شغّل التعدين أو أضف درساً يدوياً" /> }}
                  />
                </Space>
              </Card>
            ),
          },
          {
            key: "conversations",
            label: "المحادثات",
            children: (
              <Card size="small">
                <Space style={{ marginBottom: 12 }}>
                  <Select
                    allowClear
                    placeholder="فلترة بالتقييم"
                    style={{ width: 180 }}
                    value={feedbackFilter}
                    onChange={(v) => setFeedbackFilter(v)}
                    options={[
                      { value: -1, label: "👎 ردود سيئة فقط" },
                      { value: 1, label: "👍 ردود جيدة فقط" },
                    ]}
                  />
                  <Typography.Text type="secondary">
                    اضغط أي محادثة لعرض النص الكامل
                  </Typography.Text>
                </Space>
                <Table
                  size="small"
                  rowKey="id"
                  loading={loadingConversations}
                  dataSource={conversations}
                  columns={columns}
                  onRow={(row) => ({
                    onClick: () => setOpenConversationId(row.id),
                    style: { cursor: "pointer" },
                  })}
                  pagination={{ pageSize: 15, hideOnSinglePage: true }}
                  locale={{ emptyText: <Empty description="لا محادثات في هذه الفترة" /> }}
                />
              </Card>
            ),
          },
        ]}
      />

      <Drawer
        title={transcript?.conversation?.title || "محادثة"}
        placement="right"
        width={520}
        open={Boolean(openConversationId)}
        onClose={() => setOpenConversationId(null)}
      >
        {loadingTranscript ? (
          <div style={{ textAlign: "center", padding: 40 }}>
            <Spin />
          </div>
        ) : (
          <Space direction="vertical" size={10} style={{ width: "100%" }}>
            {(transcript?.conversation?.userName || transcript?.conversation?.userPhone) && (
              <Typography.Text type="secondary">
                {transcript.conversation.userName || transcript.conversation.userPhone}
              </Typography.Text>
            )}
            {messages.map((m) => (
              <div
                key={m.id}
                style={{
                  alignSelf: m.role === "USER" ? "flex-end" : "flex-start",
                  maxWidth: "92%",
                  padding: "8px 12px",
                  borderRadius: 12,
                  background: m.role === "USER" ? "#e6f4ff" : "#fafafa",
                  border: "1px solid #f0f0f0",
                }}
              >
                <Typography.Paragraph style={{ marginBottom: 4, whiteSpace: "pre-wrap" }}>
                  {m.content || "(بدون نص)"}
                </Typography.Paragraph>
                <Space size={6} wrap style={{ fontSize: 11 }}>
                  {m.payload?.type && (
                    <Tag color={RESPONSE_TYPE_COLORS[m.payload.type] ?? "default"}>
                      {m.payload.type}
                    </Tag>
                  )}
                  {m.feedback === 1 && <Tag color="green">👍</Tag>}
                  {m.feedback === -1 && (
                    <Tooltip title={m.feedbackNote || "بدون ملاحظة"}>
                      <Tag color="red">👎</Tag>
                    </Tooltip>
                  )}
                  {m.latencyMs != null && <Typography.Text type="secondary">{m.latencyMs}ms</Typography.Text>}
                  {m.tokensIn != null && m.tokensOut != null && (
                    <Typography.Text type="secondary">
                      {m.tokensIn}/{m.tokensOut} tok
                    </Typography.Text>
                  )}
                  <Typography.Text type="secondary">
                    {dayjs(m.createdAt).format("MM/DD HH:mm")}
                  </Typography.Text>
                </Space>
                {m.payload?.products?.length ? (
                  <div style={{ marginTop: 6 }}>
                    {m.payload.products.slice(0, 6).map((p, i) => (
                      <Tag key={i} style={{ marginTop: 4 }}>
                        {p.brandName ? `${p.brandName} · ` : ""}
                        {p.name ?? "—"}
                      </Tag>
                    ))}
                  </div>
                ) : null}
                {m.payload?.orders?.length ? (
                  <div style={{ marginTop: 6 }}>
                    {m.payload.orders.map((o, i) => (
                      <Badge key={i} status="processing" text={o.orderNumber ?? "—"} />
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
          </Space>
        )}
      </Drawer>
    </Space>
  );
}
