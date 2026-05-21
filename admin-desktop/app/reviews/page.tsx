"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Card, Popconfirm, Space, Switch, Table, Tag, message } from "antd";
import { useState } from "react";
import { Shell } from "@/components/Shell";
import { mutations, queries } from "@/lib/queries";

export default function ReviewsPage() {
  const [page, setPage] = useState(1);
  const [approvedOnly, setApprovedOnly] = useState<boolean | undefined>();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["reviews", page, approvedOnly],
    queryFn: () =>
      queries.reviews({
        page,
        limit: 15,
        approved: approvedOnly,
      }),
  });

  const toggle = useMutation({
    mutationFn: ({ id, approved }: { id: string; approved: boolean }) =>
      mutations.updateReview(id, { approved }),
    onSuccess: () => {
      message.success("تم التحديث");
      qc.invalidateQueries({ queryKey: ["reviews"] });
    },
  });

  const remove = useMutation({
    mutationFn: mutations.deleteReview,
    onSuccess: () => {
      message.success("تم الحذف");
      qc.invalidateQueries({ queryKey: ["reviews"] });
    },
  });

  const items = data?.data ?? [];
  const total = data?.meta?.total ?? 0;

  return (
    <Shell>
      <Space direction="vertical" size={12} style={{ width: "100%" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ margin: 0 }}>التقييمات</h2>
          <Space>
            <span style={{ fontSize: 13 }}>معتمد فقط:</span>
            <Switch
              checked={approvedOnly === true}
              onChange={(v) => {
                setApprovedOnly(v ? true : undefined);
                setPage(1);
              }}
            />
          </Space>
        </div>
        <Card styles={{ body: { padding: 0 } }}>
          <Table
            rowKey="id"
            loading={isLoading}
            dataSource={items}
            pagination={{ current: page, total, pageSize: 15, onChange: setPage }}
            columns={[
              {
                title: "المنتج",
                render: (_: any, r: any) => r.product?.name ?? "-",
              },
              { title: "المستخدم", dataIndex: "userName" },
              {
                title: "التقييم",
                dataIndex: "rating",
                render: (v) => `${v} ⭐`,
              },
              { title: "التعليق", dataIndex: "comment", ellipsis: true },
              {
                title: "معتمد",
                dataIndex: "approved",
                render: (v, r: any) => (
                  <Switch
                    checked={v}
                    onChange={(checked) => toggle.mutate({ id: r.id, approved: checked })}
                  />
                ),
              },
              {
                title: "إجراءات",
                render: (_: any, r: any) => (
                  <Popconfirm title="حذف التقييم؟" onConfirm={() => remove.mutate(r.id)}>
                    <Button danger size="small">
                      حذف
                    </Button>
                  </Popconfirm>
                ),
              },
            ]}
          />
        </Card>
      </Space>
    </Shell>
  );
}
