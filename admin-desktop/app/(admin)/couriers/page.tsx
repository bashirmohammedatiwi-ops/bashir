"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Alert, App, Button, Card, Col, Empty, Row, Select, Skeleton, Space, Statistic, Table, Tag, Typography } from "antd";
import {
  CheckCircleFilled,
  CloseCircleFilled,
  CloudSyncOutlined,
  ReloadOutlined,
  SaveOutlined,
  ThunderboltOutlined,
} from "@ant-design/icons";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { SHIPMENT_STATE_LABELS } from "@/components/orders/OrderShipmentSection";
import { formatOrderDate } from "@/components/orders/order-utils";
import { useStaffRole } from "@/components/orders/order-hooks";
import { apiErrorMessage } from "@/lib/apiError";
import { ordersApi, type CourierAreas, type CourierHealth } from "@/lib/ordersApi";

const { Text } = Typography;

type AreaRow = CourierAreas["rows"][number];

function Flag({ ok, yes, no }: { ok: boolean; yes: string; no: string }) {
  return ok ? (
    <Tag color="green" icon={<CheckCircleFilled />}>
      {yes}
    </Tag>
  ) : (
    <Tag color="red" icon={<CloseCircleFilled />}>
      {no}
    </Tag>
  );
}

function HealthCard() {
  const { message } = App.useApp();
  const qc = useQueryClient();
  const health = useQuery({
    queryKey: ["courier-health"],
    queryFn: ordersApi.courierHealth,
    placeholderData: undefined,
    staleTime: 30_000,
  });
  const poll = useMutation({
    mutationFn: ordersApi.courierPoll,
    onSuccess: (res: CourierHealth) => {
      message.success("تم الاستعلام من هاي إكسبريس");
      qc.setQueryData(["courier-health"], res);
      qc.invalidateQueries({ queryKey: ["orders"] });
    },
  });

  const h = health.data;
  return (
    <Card
      title="حالة الربط — هاي إكسبريس"
      extra={
        <Space>
          <Button icon={<ReloadOutlined />} loading={health.isFetching && !poll.isPending} onClick={() => health.refetch()}>
            تحديث
          </Button>
          <Button type="primary" icon={<CloudSyncOutlined />} loading={poll.isPending} onClick={() => poll.mutate()}>
            استعلام الآن
          </Button>
        </Space>
      }
    >
      {health.isLoading ? (
        <Skeleton active paragraph={{ rows: 3 }} />
      ) : health.isError || !h ? (
        <Alert type="error" showIcon message={apiErrorMessage(health.error, "تعذّر جلب حالة الربط")} />
      ) : (
        <Space direction="vertical" size={14} style={{ width: "100%" }}>
          <Space wrap>
            <Flag ok={h.configured} yes="بيانات الحساب مضبوطة" no="بيانات الحساب غير مضبوطة على السيرفر" />
            <Flag ok={h.tokenOk} yes="الدخول لهاي إكسبريس يعمل" no="تعذّر الدخول لهاي إكسبريس" />
            <Flag ok={h.webhookSecretSet} yes="الإشعارات الفورية (webhook) مفعّلة" no="الإشعارات الفورية غير مضبوطة" />
          </Space>
          {h.tokenError && <Alert type="error" showIcon message="خطأ الدخول" description={h.tokenError} />}
          <Row gutter={[16, 16]}>
            <Col xs={12} md={6}>
              <Statistic
                title="تنتظر قراراً (تأجيل / فشل / إرجاع)"
                value={h.needsDecision}
                styles={{ content: { color: h.needsDecision ? "#D64545" : undefined } }}
              />
            </Col>
            <Col xs={12} md={6}>
              <Statistic title="شحنات منشأة" value={h.states?.CREATED ?? 0} />
            </Col>
            <Col xs={12} md={6}>
              <Statistic
                title="فشل / إعادة محاولة"
                value={(h.states?.FAILED ?? 0) + (h.states?.RETRYING ?? 0)}
                styles={{ content: { color: (h.states?.FAILED ?? 0) > 0 ? "#D64545" : undefined } }}
              />
            </Col>
            <Col xs={12} md={6}>
              <div>
                <Text type="secondary" style={{ fontSize: 14 }}>
                  آخر استعلام دوري
                </Text>
                <div style={{ fontSize: 16, fontWeight: 700, marginTop: 4 }}>
                  {h.lastPollAt ? formatOrderDate(h.lastPollAt) : "لم يُستعلم بعد منذ تشغيل السيرفر"}
                </div>
              </div>
            </Col>
          </Row>
          {h.lastPollError && <Alert type="warning" showIcon message="خطأ آخر استعلام" description={h.lastPollError} />}
          <div>
            <Text type="secondary" style={{ display: "block", marginBottom: 6 }}>
              الشحنات حسب الحالة
            </Text>
            {Object.keys(h.states ?? {}).length ? (
              <Space wrap>
                {Object.entries(h.states).map(([state, n]) => {
                  const st = SHIPMENT_STATE_LABELS[state] ?? { label: state, color: "default" };
                  return (
                    <Tag key={state} color={st.color}>
                      {st.label}: {n.toLocaleString("ar-IQ")}
                    </Tag>
                  );
                })}
              </Space>
            ) : (
              <Text type="secondary">لا شحنات بعد</Text>
            )}
          </div>
        </Space>
      )}
    </Card>
  );
}

function AreasCard() {
  const { message, modal } = App.useApp();
  const qc = useQueryClient();
  const { isAdmin } = useStaffRole();
  const [drafts, setDrafts] = useState<Record<string, number | null>>({});
  const [savingRow, setSavingRow] = useState<string | null>(null);
  const [bulkProgress, setBulkProgress] = useState<{ done: number; total: number } | null>(null);

  const areas = useQuery({
    queryKey: ["courier-areas"],
    queryFn: ordersApi.courierAreas,
    placeholderData: undefined,
    staleTime: 60_000,
  });

  const provinces = areas.data?.provinces ?? [];
  const rows = areas.data?.rows ?? [];
  const provinceName = useMemo(() => new Map(provinces.map((p) => [p.id, p.name])), [provinces]);
  const options = provinces.map((p) => ({ value: p.id, label: p.name }));

  /** القيمة المعروضة: المسودة، ثم المربوط، ثم الاقتراح. */
  const shown = (r: AreaRow): number | null =>
    r.governorate in drafts ? drafts[r.governorate] : (r.governanceId ?? r.suggested ?? null);
  const dirty = (r: AreaRow) => shown(r) !== (r.governanceId ?? null);

  const save = useMutation({
    mutationFn: ({ governorate, governanceId }: { governorate: string; governanceId: number | null }) =>
      ordersApi.setCourierArea(governorate, governanceId),
    onMutate: ({ governorate }) => setSavingRow(governorate),
    onSettled: () => setSavingRow(null),
    onSuccess: (res, vars) => {
      message.success(vars.governanceId ? `رُبطت ${vars.governorate}` : `أُزيل ربط ${vars.governorate}`);
      qc.setQueryData(["courier-areas"], res);
      setDrafts((d) => {
        const next = { ...d };
        delete next[vars.governorate];
        return next;
      });
    },
  });

  const pendingSuggestions = rows.filter((r) => r.governanceId == null && r.suggested != null);
  const unmapped = rows.filter((r) => r.governanceId == null);

  const applyAll = () =>
    modal.confirm({
      title: `اعتماد ${pendingSuggestions.length} اقتراح؟`,
      content: "تُربط كل محافظة غير مربوطة بالمحافظة المقترحة لدى هاي إكسبريس. يمكن تعديل أي سطر لاحقاً.",
      okText: "اعتماد الكل",
      cancelText: "رجوع",
      onOk: async () => {
        let ok = 0;
        const failed: string[] = [];
        setBulkProgress({ done: 0, total: pendingSuggestions.length });
        let latest: CourierAreas | null = null;
        for (const r of pendingSuggestions) {
          try {
            latest = await ordersApi.setCourierArea(r.governorate, r.suggested);
            ok++;
          } catch (e) {
            failed.push(`${r.governorate}: ${apiErrorMessage(e)}`);
          }
          setBulkProgress({ done: ok + failed.length, total: pendingSuggestions.length });
        }
        setBulkProgress(null);
        if (latest) qc.setQueryData(["courier-areas"], latest);
        else qc.invalidateQueries({ queryKey: ["courier-areas"] });
        setDrafts({});
        if (failed.length) message.error(`تعذّر ربط ${failed.length}: ${failed.join("، ")}`);
        if (ok) message.success(`رُبطت ${ok} محافظة`);
      },
    });

  return (
    <Card
      title="ربط المحافظات"
      extra={
        <Space>
          <Button icon={<ReloadOutlined />} loading={areas.isFetching} onClick={() => areas.refetch()}>
            تحديث
          </Button>
          {isAdmin && (
            <Button
              type="primary"
              icon={<ThunderboltOutlined />}
              disabled={!pendingSuggestions.length}
              loading={!!bulkProgress}
              onClick={applyAll}
            >
              {bulkProgress
                ? `جارٍ الربط ${bulkProgress.done}/${bulkProgress.total}`
                : `اعتماد كل الاقتراحات${pendingSuggestions.length ? ` (${pendingSuggestions.length})` : ""}`}
            </Button>
          )}
        </Space>
      }
      styles={{ body: { padding: 0 } }}
    >
      <div style={{ padding: "12px 16px" }}>
        <Text type="secondary">
          كل محافظة من محافظات الشحن لدينا تُربط برقم محافظتها لدى هاي إكسبريس — الطلبات من محافظة غير مربوطة لا تُنشأ
          شحنتها. {unmapped.length ? <b style={{ color: "#D64545" }}>غير مربوطة: {unmapped.length}</b> : rows.length ? <b style={{ color: "#1F9D63" }}>كل المحافظات مربوطة ✓</b> : null}
        </Text>
        {!isAdmin && (
          <Alert style={{ marginTop: 8 }} type="info" showIcon message="عرض فقط — الحفظ متاح للمدير" />
        )}
        {areas.data && !provinces.length && (
          <Alert
            style={{ marginTop: 8 }}
            type="warning"
            showIcon
            message="تعذّر جلب قائمة محافظات هاي إكسبريس — تحقّقي من حالة الربط أعلاه"
          />
        )}
      </div>
      {areas.isError ? (
        <div style={{ padding: 16 }}>
          <Alert type="error" showIcon message={apiErrorMessage(areas.error, "تعذّر تحميل ربط المحافظات")} />
        </div>
      ) : (
        <Table<AreaRow>
          rowKey="governorate"
          loading={areas.isLoading}
          dataSource={rows}
          pagination={false}
          locale={{ emptyText: <Empty description="لا محافظات — أضيفيها من صفحة الشحن" /> }}
          onRow={(r) =>
            r.governanceId == null
              ? { style: { background: r.suggested != null ? "#fffbeb" : "#fef2f2" } }
              : {}
          }
          columns={[
            {
              title: "محافظتنا",
              dataIndex: "governorate",
              render: (v: string, r) => (
                <Space size={6}>
                  <b>{v}</b>
                  {!r.active && <Tag>موقوفة</Tag>}
                </Space>
              ),
            },
            {
              title: "محافظة هاي إكسبريس",
              width: 320,
              render: (_: unknown, r) => {
                const value = shown(r);
                const isSuggestion = r.governanceId == null && !(r.governorate in drafts) && r.suggested != null;
                return (
                  <Space size={6} style={{ width: "100%" }}>
                    <Select
                      style={{ width: 220 }}
                      showSearch
                      allowClear
                      optionFilterProp="label"
                      placeholder="اختاري المحافظة"
                      disabled={!isAdmin || !provinces.length}
                      value={value ?? undefined}
                      options={options}
                      status={isSuggestion ? "warning" : undefined}
                      onChange={(v) => setDrafts((d) => ({ ...d, [r.governorate]: v ?? null }))}
                    />
                    {isSuggestion && <Tag color="gold">مقترح</Tag>}
                  </Space>
                );
              },
            },
            {
              title: "الحالة",
              width: 170,
              render: (_: unknown, r) =>
                r.governanceId != null ? (
                  <Tag color="green" icon={<CheckCircleFilled />}>
                    مربوطة{provinceName.get(r.governanceId) ? ` — ${provinceName.get(r.governanceId)}` : ` (${r.governanceId})`}
                  </Tag>
                ) : (
                  <Tag color="red" icon={<CloseCircleFilled />}>
                    غير مربوطة
                  </Tag>
                ),
            },
            {
              title: "",
              width: 110,
              render: (_: unknown, r) =>
                isAdmin ? (
                  <Button
                    size="small"
                    type={dirty(r) ? "primary" : "default"}
                    icon={<SaveOutlined />}
                    disabled={!dirty(r) || !!bulkProgress}
                    loading={savingRow === r.governorate}
                    onClick={() => save.mutate({ governorate: r.governorate, governanceId: shown(r) })}
                  >
                    حفظ
                  </Button>
                ) : null,
            },
          ]}
        />
      )}
    </Card>
  );
}

export default function CouriersPage() {
  return (
    <Space direction="vertical" size={12} style={{ width: "100%" }}>
      <PageHeader title="شركة التوصيل" subtitle="هاي إكسبريس — حالة الربط، الاستعلام عن الشحنات، وربط المحافظات" />
      <HealthCard />
      <AreasCard />
    </Space>
  );
}
