"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Button,
  Card,
  Col,
  Drawer,
  Form,
  Input,
  Modal,
  Popconfirm,
  Row,
  Select,
  Space,
  Switch,
  Tag,
  Typography,
  message,
} from "antd";
import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  CopyOutlined,
  EyeOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import { useMemo, useState } from "react";
import { SectionPayloadEditor } from "@/components/home-builder/SectionPayloadEditor";
import {
  SECTION_TYPES,
  SectionType,
  labelForType,
} from "@/components/home-builder/section-types";
import { mutations, queries } from "@/lib/queries";

const { Title, Text, Paragraph } = Typography;

export default function HomeBuilderPage() {
  const qc = useQueryClient();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [form] = Form.useForm();

  const { data: blocks, isLoading } = useQuery({
    queryKey: ["home-blocks"],
    queryFn: queries.homeBlocks,
  });
  const { data: preview } = useQuery({
    queryKey: ["home-preview"],
    queryFn: queries.homePreview,
    enabled: previewOpen,
  });
  const { data: banners } = useQuery({ queryKey: ["banners"], queryFn: queries.banners });
  const { data: categories } = useQuery({ queryKey: ["categories"], queryFn: queries.categoriesFull });
  const { data: brands } = useQuery({ queryKey: ["brands"], queryFn: queries.brands });
  const { data: packages } = useQuery({ queryKey: ["packages"], queryFn: queries.packages });

  const sorted = useMemo(
    () => [...(blocks ?? [])].sort((a, b) => (a.position ?? 0) - (b.position ?? 0)),
    [blocks],
  );

  const upsert = useMutation({
    mutationFn: async (values: any) => {
      const payload = {
        type: values.type,
        title: values.title,
        subtitle: values.subtitle,
        position: values.position ?? sorted.length,
        isActive: values.isActive ?? true,
        payload: values.payload ?? {},
      };
      if (editing?.id) return mutations.updateHomeBlock(editing.id, payload);
      return mutations.createHomeBlock(payload);
    },
    onSuccess: () => {
      message.success(editing ? "تم حفظ القسم" : "تم إضافة القسم");
      setDrawerOpen(false);
      qc.invalidateQueries({ queryKey: ["home-blocks"] });
      qc.invalidateQueries({ queryKey: ["home-preview"] });
    },
    onError: () => message.error("تعذر الحفظ"),
  });

  const remove = useMutation({
    mutationFn: mutations.deleteHomeBlock,
    onSuccess: () => {
      message.success("تم الحذف");
      qc.invalidateQueries({ queryKey: ["home-blocks"] });
    },
  });

  const reorder = useMutation({
    mutationFn: mutations.reorderHomeBlocks,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["home-blocks"] }),
  });

  const toggle = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      mutations.updateHomeBlock(id, { isActive }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["home-blocks"] }),
  });

  function openCreate(type: SectionType) {
    const def = SECTION_TYPES.find((t) => t.value === type)!;
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({
      type,
      isActive: true,
      position: sorted.length,
      payload: { ...def.defaultPayload },
    });
    setDrawerOpen(true);
  }

  function openEdit(block: any) {
    setEditing(block);
    form.setFieldsValue({
      type: block.type,
      title: block.title,
      subtitle: block.subtitle,
      position: block.position,
      isActive: block.isActive,
      payload: block.payload ?? {},
    });
    setDrawerOpen(true);
  }

  function move(id: string, dir: -1 | 1) {
    const idx = sorted.findIndex((b) => b.id === id);
    const next = idx + dir;
    if (next < 0 || next >= sorted.length) return;
    const ids = sorted.map((b) => b.id);
    [ids[idx], ids[next]] = [ids[next], ids[idx]];
    reorder.mutate(ids);
  }

  const groupedTypes = useMemo(() => {
    const map = new Map<string, typeof SECTION_TYPES>();
    for (const t of SECTION_TYPES) {
      if (!map.has(t.group)) map.set(t.group, []);
      map.get(t.group)!.push(t);
    }
    return [...map.entries()];
  }, []);

  return (
    <>
      <Space direction="vertical" size={16} style={{ width: "100%" }}>
        <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div>
            <Title level={3} style={{ margin: 0 }}>
              بناء الصفحة الرئيسية
            </Title>
            <Paragraph type="secondary" style={{ margin: "4px 0 0" }}>
              رتّب أقسام Nice One — بنرات، فئات، منتجات، براندات — كلها تظهر في التطبيق فوراً
            </Paragraph>
          </div>
          <Space wrap>
            <Button icon={<EyeOutlined />} onClick={() => setPreviewOpen(true)}>
              معاينة API
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => openCreate("PRODUCT_LIST")}>
              قسم سريع
            </Button>
          </Space>
        </div>

        <Row gutter={16}>
          <Col xs={24} lg={8}>
            <Card title="إضافة قسم" size="small">
              <Space direction="vertical" style={{ width: "100%" }} size={12}>
                {groupedTypes.map(([group, types]) => (
                  <div key={group}>
                    <Text strong style={{ display: "block", marginBottom: 6 }}>
                      {group}
                    </Text>
                    <Space wrap>
                      {types.map((t) => (
                        <Button key={t.value} size="small" onClick={() => openCreate(t.value)}>
                          + {t.label}
                        </Button>
                      ))}
                    </Space>
                  </div>
                ))}
              </Space>
            </Card>
          </Col>

          <Col xs={24} lg={16}>
            <Card title={`الأقسام (${sorted.length})`} loading={isLoading} size="small">
              {sorted.length === 0 ? (
                <Text type="secondary">لا توجد أقسام — ابدأ بإضافة «بنر رئيسي + فئات»</Text>
              ) : (
                <Space direction="vertical" style={{ width: "100%" }} size={8}>
                  {sorted.map((block, idx) => (
                    <Card
                      key={block.id}
                      size="small"
                      styles={{
                        body: { padding: "10px 14px" },
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                        <Tag color="blue">{idx + 1}</Tag>
                        <div style={{ flex: 1, minWidth: 160 }}>
                          <Text strong>{block.title || labelForType(block.type)}</Text>
                          <br />
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            {labelForType(block.type)}
                            {block.subtitle ? ` · ${block.subtitle}` : ""}
                          </Text>
                        </div>
                        <Switch
                          size="small"
                          checked={block.isActive}
                          onChange={(v) => toggle.mutate({ id: block.id, isActive: v })}
                        />
                        <Button size="small" icon={<ArrowUpOutlined />} disabled={idx === 0} onClick={() => move(block.id, -1)} />
                        <Button
                          size="small"
                          icon={<ArrowDownOutlined />}
                          disabled={idx === sorted.length - 1}
                          onClick={() => move(block.id, 1)}
                        />
                        <Button size="small" onClick={() => openEdit(block)}>
                          تعديل
                        </Button>
                        <Popconfirm title="حذف القسم؟" onConfirm={() => remove.mutate(block.id)}>
                          <Button size="small" danger>
                            حذف
                          </Button>
                        </Popconfirm>
                      </div>
                    </Card>
                  ))}
                </Space>
              )}
            </Card>
          </Col>
        </Row>
      </Space>

      <Drawer
        title={editing ? "تعديل القسم" : "قسم جديد"}
        width={520}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        destroyOnClose
        extra={
          <Button type="primary" loading={upsert.isPending} onClick={() => form.submit()}>
            حفظ
          </Button>
        }
      >
        <Form form={form} layout="vertical" onFinish={(v) => upsert.mutate(v)}>
          <Form.Item name="type" label="نوع القسم" rules={[{ required: true }]}>
            <Select
              options={SECTION_TYPES.map((t) => ({
                value: t.value,
                label: `${t.label} — ${t.group}`,
              }))}
            />
          </Form.Item>
          <Form.Item name="title" label="العنوان (يظهر في التطبيق)">
            <Input placeholder="أقوى العروض" />
          </Form.Item>
          <Form.Item name="subtitle" label="عنوان فرعي">
            <Input />
          </Form.Item>
          <Form.Item name="position" label="الترتيب">
            <Input type="number" />
          </Form.Item>
          <Form.Item name="isActive" label="نشط" valuePropName="checked">
            <Switch />
          </Form.Item>

          <Form.Item noStyle shouldUpdate={(p, c) => p.type !== c.type}>
            {({ getFieldValue }) => (
              <SectionPayloadEditor
                type={getFieldValue("type") as SectionType}
                form={form}
                banners={banners ?? []}
                categories={categories ?? []}
                brands={brands ?? []}
                packages={packages ?? []}
              />
            )}
          </Form.Item>
        </Form>
      </Drawer>

      <Modal
        title="معاينة API — sections"
        open={previewOpen}
        onCancel={() => setPreviewOpen(false)}
        width={800}
        footer={null}
      >
        <pre style={{ maxHeight: 480, overflow: "auto", fontSize: 11, direction: "ltr" }}>
          {JSON.stringify(preview?.sections ?? preview, null, 2)}
        </pre>
      </Modal>
    </>
  );
}
