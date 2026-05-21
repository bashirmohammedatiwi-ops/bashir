"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Button,
  Card,
  Drawer,
  Form,
  Input,
  InputNumber,
  Select,
  Space,
  Switch,
  Table,
  Tabs,
  Tag,
  message,
} from "antd";
import { useState } from "react";
import { Shell } from "@/components/Shell";
import { mutations, queries } from "@/lib/queries";

const ROLES = [
  { value: "CUSTOMER", label: "عميل" },
  { value: "STAFF", label: "موظف" },
  { value: "ADMIN", label: "مدير" },
  { value: "SUPER_ADMIN", label: "مدير عام" },
];

const TIER_LABELS: Record<string, string> = {
  normal: "عادي",
  silver: "فضي",
  gold: "ذهبي",
  platinum: "بلاتيني",
};

export default function UsersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [form] = Form.useForm();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["users", page, search],
    queryFn: () => queries.users({ page, limit: 15, search: search || undefined }),
  });

  const { data: detail, isLoading: detailLoading } = useQuery({
    queryKey: ["user", selectedId],
    queryFn: () => queries.user(selectedId!),
    enabled: !!selectedId,
  });

  const { data: addresses } = useQuery({
    queryKey: ["addresses", selectedId],
    queryFn: () => queries.addresses(selectedId!),
    enabled: !!selectedId,
  });

  const { data: loyalty } = useQuery({
    queryKey: ["loyalty", selectedId],
    queryFn: () => queries.loyalty(selectedId!),
    enabled: !!selectedId,
  });

  const update = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => mutations.updateUser(id, data),
    onSuccess: () => {
      message.success("تم التحديث");
      qc.invalidateQueries({ queryKey: ["users"] });
      qc.invalidateQueries({ queryKey: ["user", selectedId] });
      qc.invalidateQueries({ queryKey: ["loyalty", selectedId] });
    },
  });

  const items = data?.data ?? [];
  const total = data?.meta?.total ?? 0;

  function openDetail(row: any) {
    setSelectedId(row.id);
    form.setFieldsValue({
      name: row.name,
      role: row.role,
      isActive: row.isActive,
      loyaltyPoints: row.loyaltyPoints,
    });
  }

  return (
    <Shell>
      <Space direction="vertical" size={12} style={{ width: "100%" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ margin: 0 }}>العملاء والمستخدمين</h2>
          <Input.Search
            placeholder="بحث بالاسم أو البريد..."
            allowClear
            onSearch={(v) => {
              setPage(1);
              setSearch(v);
            }}
            style={{ width: 280 }}
          />
        </div>
        <Card styles={{ body: { padding: 0 } }}>
          <Table
            rowKey="id"
            loading={isLoading}
            dataSource={items}
            pagination={{ current: page, total, pageSize: 15, onChange: setPage }}
            columns={[
              { title: "الاسم", dataIndex: "name", render: (v) => v ?? "-" },
              { title: "البريد", dataIndex: "email", render: (v) => v ?? "-" },
              { title: "الهاتف", dataIndex: "phone", render: (v) => v ?? "-" },
              {
                title: "الدور",
                dataIndex: "role",
                render: (v) => <Tag>{ROLES.find((r) => r.value === v)?.label ?? v}</Tag>,
              },
              { title: "النقاط", dataIndex: "loyaltyPoints" },
              {
                title: "الطلبات",
                render: (_: any, r: any) => r._count?.orders ?? 0,
              },
              {
                title: "نشط",
                dataIndex: "isActive",
                render: (v) => (v ? <Tag color="green">نعم</Tag> : <Tag color="red">لا</Tag>),
              },
              {
                title: "إجراءات",
                render: (_: any, r: any) => (
                  <Button size="small" onClick={() => openDetail(r)}>
                    تفاصيل
                  </Button>
                ),
              },
            ]}
          />
        </Card>
      </Space>

      <Drawer
        title={detail?.name ?? "تفاصيل المستخدم"}
        open={!!selectedId}
        onClose={() => setSelectedId(null)}
        width={520}
        loading={detailLoading}
      >
        <Tabs
          items={[
            {
              key: "profile",
              label: "الملف",
              children: (
                <Form
                  layout="vertical"
                  form={form}
                  onFinish={(v) => selectedId && update.mutate({ id: selectedId, data: v })}
                >
                  <Form.Item name="name" label="الاسم">
                    <Input />
                  </Form.Item>
                  <Form.Item name="role" label="الدور">
                    <Select options={ROLES} />
                  </Form.Item>
                  <Form.Item name="loyaltyPoints" label="نقاط الولاء">
                    <InputNumber style={{ width: "100%" }} min={0} />
                  </Form.Item>
                  <Form.Item name="isActive" label="نشط" valuePropName="checked">
                    <Switch />
                  </Form.Item>
                  <Button type="primary" htmlType="submit" loading={update.isPending}>
                    حفظ
                  </Button>
                </Form>
              ),
            },
            {
              key: "loyalty",
              label: "الولاء",
              children: loyalty ? (
                <Space direction="vertical" style={{ width: "100%" }}>
                  <div>
                    <Tag color="gold">{TIER_LABELS[loyalty.tier] ?? loyalty.tier}</Tag>
                    <strong style={{ marginInlineStart: 8 }}>{loyalty.points} نقطة</strong>
                  </div>
                  {(loyalty.history ?? []).map((h: any) => (
                    <div
                      key={h.id}
                      style={{
                        padding: 8,
                        borderBottom: "1px solid #eee",
                        display: "flex",
                        justifyContent: "space-between",
                      }}
                    >
                      <span>{h.title}</span>
                      <Tag color={h.isEarned ? "green" : "red"}>
                        {h.isEarned ? "+" : ""}
                        {h.points}
                      </Tag>
                    </div>
                  ))}
                </Space>
              ) : (
                <span>لا يوجد سجل</span>
              ),
            },
            {
              key: "addresses",
              label: "العناوين",
              children: (
                <Space direction="vertical" style={{ width: "100%" }}>
                  {(addresses ?? detail?.addresses ?? []).map((a: any) => (
                    <Card key={a.id} size="small">
                      <div>
                        <strong>{a.fullName ?? a.name}</strong> {a.isDefault && <Tag>افتراضي</Tag>}
                      </div>
                      <div style={{ color: "#666", fontSize: 13 }}>{a.phone}</div>
                      <div style={{ fontSize: 13 }}>
                        {a.governorate ?? a.city}، {a.area}، {a.street}
                        {a.house ? `، ${a.house}` : ""}
                      </div>
                    </Card>
                  ))}
                  {!(addresses ?? detail?.addresses)?.length && <span>لا توجد عناوين</span>}
                </Space>
              ),
            },
            {
              key: "orders",
              label: "الطلبات",
              children: (
                <Space direction="vertical" style={{ width: "100%" }}>
                  {(detail?.orders ?? []).map((o: any) => (
                    <div
                      key={o.id}
                      style={{
                        padding: 8,
                        borderBottom: "1px solid #eee",
                        display: "flex",
                        justifyContent: "space-between",
                      }}
                    >
                      <span>{o.orderNumber}</span>
                      <Tag>{o.status}</Tag>
                      <span>{o.total?.toLocaleString()} د.ع</span>
                    </div>
                  ))}
                </Space>
              ),
            },
          ]}
        />
      </Drawer>
    </Shell>
  );
}
