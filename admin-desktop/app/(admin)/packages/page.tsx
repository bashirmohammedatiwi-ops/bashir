"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Card, Form, Input, Modal, Popconfirm, Space, Table, Tag, message } from "antd";
import { useState } from "react";
import { PackageFormModal } from "@/components/packages/PackageFormModal";
import { HomeShowcasePanel } from "@/components/showcase/HomeShowcasePanel";
import { packageStats } from "@/lib/packageForm";
import { mediaThumb } from "@/lib/mediaUrl";
import { kindLabel } from "@/lib/packageForm";
import { mutations, queries } from "@/lib/queries";

export default function PackagesPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [pushOpen, setPushOpen] = useState(false);
  const [pushTarget, setPushTarget] = useState<any | null>(null);
  const [editing, setEditing] = useState<any | null>(null);
  const [pushForm] = Form.useForm();

  const { data: all, isLoading } = useQuery({
    queryKey: ["packages"],
    queryFn: queries.packages,
  });
  // الروتينات لها صفحتها («روتين البشرة») — هنا الباقات فقط.
  const data = ((all as any[]) ?? []).filter((p) => !String(p.kind).startsWith("ROUTINE_"));
  const { data: worlds } = useQuery({ queryKey: ["worlds-manage"], queryFn: queries.worldsManage });
  const worldName = (slug: string) => ((worlds as any[]) ?? []).find((w) => w.slug === slug)?.nameAr ?? slug;

  const remove = useMutation({
    mutationFn: mutations.deletePackage,
    onSuccess: () => {
      message.success("تم الحذف");
      qc.invalidateQueries({ queryKey: ["packages"] });
    },
  });

  const sendPush = useMutation({
    mutationFn: (values: any) =>
      mutations.createNotification({
        type: "OFFER",
        title: values.title,
        body: values.body,
        linkType: "PACKAGE",
        linkId: pushTarget?.id,
        targetType: "ALL",
        sendPush: true,
      }),
    onSuccess: () => {
      message.success("تم إرسال الإشعار");
      setPushOpen(false);
      pushForm.resetFields();
    },
    onError: () => message.error("تعذر إرسال الإشعار"),
  });

  return (
    <>
      <Space direction="vertical" size={12} style={{ width: "100%" }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <div>
            <h2 style={{ margin: 0 }}>الباقات</h2>
            <div style={{ color: "#888", fontSize: 13 }}>
              منتجات مجمّعة بسعر خاص — السعر يُطبَّق تلقائياً في الطلب حين تكون كل منتجات الباقة في السلة
            </div>
          </div>
          <Button
            type="primary"
            onClick={() => {
              setEditing(null);
              setOpen(true);
            }}
          >
            + باقة جديدة
          </Button>
        </div>
        <Card styles={{ body: { padding: 0 } }}>
          <Table
            rowKey="id"
            loading={isLoading}
            dataSource={data}
            columns={[
              {
                title: "الغلاف",
                width: 80,
                render: (_: any, r: any) => {
                  const url = mediaThumb(r.coverImage);
                  return (
                    <div
                      style={{
                        width: 56,
                        height: 40,
                        borderRadius: 6,
                        background: url ? `center/cover url(${url})` : "#f0f0f5",
                      }}
                    />
                  );
                },
              },
              { title: "الاسم", dataIndex: "name" },
              {
                title: "النوع",
                dataIndex: "kind",
                render: (v) => kindLabel(v),
              },
              { title: "الوصف", dataIndex: "subtitle", ellipsis: true },
              {
                title: "المنتجات",
                render: (_: any, r: any) => r._count?.items ?? r.items?.length ?? 0,
              },
              {
                title: "السعر / التوفير",
                render: (_: any, r: any) => {
                  const st = packageStats(r);
                  return (
                    <div>
                      <b>{r.price?.toLocaleString()} د.ع</b>
                      <div style={{ fontSize: 12, color: st.saving > 0 ? "#389e0d" : "#cf1322" }}>
                        {st.saving > 0
                          ? `توفير ${st.saving.toLocaleString()} (${st.percent}%) من ${st.itemsTotal.toLocaleString()}`
                          : "بلا توفير"}
                      </div>
                    </div>
                  );
                },
              },
              {
                title: "العوالم",
                render: (_: any, r: any) =>
                  r.worldSlugs?.length ? (
                    r.worldSlugs.map((w: string) => <Tag key={w}>{worldName(w)}</Tag>)
                  ) : (
                    <Tag color="blue">كل العوالم</Tag>
                  ),
              },
              {
                title: "الحالة",
                render: (_: any, r: any) => {
                  const ended = r.endsAt && new Date(r.endsAt) <= new Date();
                  return (
                    <Space direction="vertical" size={2}>
                      <Tag color={!r.isActive ? "red" : ended ? "default" : "green"}>
                        {!r.isActive ? "موقوف" : ended ? "منتهٍ" : "نشط"}
                      </Tag>
                      {r.endsAt && !ended ? (
                        <span style={{ fontSize: 11, color: "#888" }}>
                          حتى {new Date(r.endsAt).toLocaleDateString("ar-IQ")}
                        </span>
                      ) : null}
                    </Space>
                  );
                },
              },
              {
                title: "إجراءات",
                width: 260,
                render: (_: any, r: any) => (
                  <Space wrap>
                    <Button
                      size="small"
                      onClick={() => {
                        setPushTarget(r);
                        pushForm.setFieldsValue({
                          title: r.name,
                          body: r.subtitle || `اكتشفي ${r.name}`,
                        });
                        setPushOpen(true);
                      }}
                    >
                      Push
                    </Button>
                    <Button
                      size="small"
                      onClick={() => {
                        setEditing(r);
                        setOpen(true);
                      }}
                    >
                      تعديل
                    </Button>
                    <Popconfirm
                      title="حذف الباقة؟"
                      okText="حذف"
                      cancelText="إلغاء"
                      onConfirm={() => remove.mutate(r.id)}
                    >
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

        <HomeShowcasePanel kind="packages" label="الباقات" />
      </Space>

      <PackageFormModal
        open={open}
        editing={editing}
        kindOptions={["GENERAL", "BRIDAL_KIT"]}
        onClose={() => {
          setOpen(false);
          setEditing(null);
        }}
      />

      <Modal
        title={`إشعار Push — ${pushTarget?.name ?? ""}`}
        open={pushOpen}
        onCancel={() => setPushOpen(false)}
        onOk={() => pushForm.submit()}
        confirmLoading={sendPush.isPending}
        okText="إرسال"
        cancelText="إلغاء"
        destroyOnHidden
      >
        <Form layout="vertical" form={pushForm} onFinish={(v) => sendPush.mutate(v)}>
          <Form.Item name="title" label="العنوان" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="body" label="النص" rules={[{ required: true }]}>
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
