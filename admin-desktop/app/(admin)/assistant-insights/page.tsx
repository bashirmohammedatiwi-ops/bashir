"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, Col, Empty, Row, Segmented, Space, Statistic, Table, Tag, Typography } from "antd";
import Link from "next/link";
import { useState } from "react";
import { queries } from "@/lib/queries";

const CONCERN_LABELS: Record<string, string> = {
  hairloss: "تساقط",
  dandruff: "قشرة",
  dry: "جفاف",
  oily: "دهون",
  colored: "شعر مصبوغ",
  pigment: "تفتيح",
  acne: "حبوب",
  sensitive: "بشرة حساسة",
};

function percent(value: number | null | undefined) {
  return value == null ? "—" : `${Math.round(value * 100)}%`;
}

export default function AssistantInsightsPage() {
  const [days, setDays] = useState(30);
  const { data, isLoading } = useQuery({
    queryKey: ["assistant-insights", days],
    queryFn: () => queries.assistantInsights(days),
  });

  const outcomes = data?.outcomes ?? {};

  return (
    <Space direction="vertical" size={16} style={{ width: "100%" }}>
      <Card
        title="أداء المساعد فضه"
        extra={
          <Segmented
            value={days}
            onChange={(value) => setDays(Number(value))}
            options={[
              { label: "7 أيام", value: 7 },
              { label: "30 يوم", value: 30 },
              { label: "90 يوم", value: 90 },
            ]}
          />
        }
        loading={isLoading}
      >
        <Row gutter={[16, 16]}>
          <Col xs={12} md={6}>
            <Statistic title="رسائل" value={data?.turns ?? 0} />
          </Col>
          <Col xs={12} md={6}>
            <Statistic title="زبائن" value={data?.customers ?? 0} />
          </Col>
          <Col xs={12} md={6}>
            <Statistic title="رضا الزبائن 👍" value={percent(data?.likeRate)} suffix={`(${data?.liked ?? 0}/${(data?.liked ?? 0) + (data?.disliked ?? 0)})`} />
          </Col>
          <Col xs={12} md={6}>
            <Statistic title="متوسط وقت الرد" value={data ? (data.avgLatencyMs / 1000).toFixed(1) : "—"} suffix="ثانية" />
          </Col>
          <Col xs={12} md={6}>
            <Statistic title="فتحوا منتجاً من الاقتراح" value={percent(data?.tapRate)} />
          </Col>
          <Col xs={12} md={6}>
            <Statistic title="أضافوا للسلة من المحادثة" value={percent(data?.cartRate)} />
          </Col>
          <Col xs={12} md={6}>
            <Statistic title="اشتروا خلال 7 أيام" value={percent(data?.purchaseRate)} suffix={`(${data?.purchaseTurns ?? 0})`} />
          </Col>
          <Col xs={12} md={6}>
            <Statistic title="مبيعات من اقتراحات فضه" value={(data?.attributedRevenue ?? 0).toLocaleString("en-US")} suffix="د.ع" />
          </Col>
          <Col xs={12} md={6}>
            <Statistic title="طلبات بلا نتيجة" value={percent(data?.emptyRate)} valueStyle={{ color: (data?.emptyRate ?? 0) > 0.15 ? "#b42318" : undefined }} />
          </Col>
          <Col xs={12} md={6}>
            <Statistic
              title="منتجات تفهمها فضه"
              value={data ? `${data.catalogTagged ?? 0} / ${data.catalogTotal ?? 0}` : "—"}
            />
          </Col>
        </Row>
        <div style={{ marginTop: 16 }}>
          <Space wrap>
            <Tag color="green">عرضت منتجات: {outcomes.products ?? 0}</Tag>
            <Tag color="blue">سألت توضيح: {outcomes.clarify ?? 0}</Tag>
            <Tag>حجي بدون منتجات: {outcomes.reply ?? 0}</Tag>
            <Tag color="red">ما لقت منتج: {outcomes.empty ?? 0}</Tag>
          </Space>
        </div>
      </Card>

      <Card
        title="ردود ما عجبت الزبائن 👎"
        extra={<Link href="/assistant-training">صلّحيها من تدريب المساعد</Link>}
      >
        <Table
          rowKey="id"
          size="small"
          loading={isLoading}
          dataSource={data?.disappointing ?? []}
          locale={{ emptyText: <Empty description="ماكو تقييمات سلبية بهالفترة" /> }}
          pagination={{ pageSize: 10 }}
          columns={[
            { title: "الزبونة كتبت", dataIndex: "message", width: "28%" },
            {
              title: "فضه ردت",
              dataIndex: "reply",
              render: (reply: string) => <Typography.Paragraph ellipsis={{ rows: 3, expandable: true }} style={{ margin: 0 }}>{reply}</Typography.Paragraph>,
            },
            { title: "السبب", dataIndex: "feedbackNote", width: 140, render: (note: string) => (note ? <Tag color="red">{note}</Tag> : "—") },
            { title: "التاريخ", dataIndex: "createdAt", width: 110, render: (at: string) => new Date(at).toLocaleDateString("ar-IQ") },
          ]}
        />
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="طلبات ما لقت لها فضه منتج" extra={<Tag color="red">فرصة لإضافة منتجات أو قواعد</Tag>}>
            <Table
              rowKey="message"
              size="small"
              loading={isLoading}
              dataSource={data?.emptyAsks ?? []}
              pagination={false}
              locale={{ emptyText: <Empty description="كل الطلبات لقت نتيجة" /> }}
              columns={[
                { title: "الطلب", dataIndex: "message" },
                { title: "مرات", dataIndex: "count", width: 70 },
              ]}
            />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="أكثر الطلبات">
            <Table
              rowKey="message"
              size="small"
              loading={isLoading}
              dataSource={data?.topAsks ?? []}
              pagination={false}
              columns={[
                { title: "الطلب", dataIndex: "message" },
                { title: "مرات", dataIndex: "count", width: 70 },
              ]}
            />
          </Card>
        </Col>
      </Row>

      <Card title="أكثر المشاكل اللي تسأل عنها الزبائن">
        <Space wrap>
          {(data?.topConcerns ?? []).map((row: { concern: string; count: number }) => (
            <Tag key={row.concern} color="magenta" style={{ fontSize: 14, padding: "4px 10px" }}>
              {CONCERN_LABELS[row.concern] ?? row.concern}: {row.count}
            </Tag>
          ))}
          {!data?.topConcerns?.length && <Typography.Text type="secondary">ماكو بيانات بعد</Typography.Text>}
        </Space>
      </Card>
    </Space>
  );
}
