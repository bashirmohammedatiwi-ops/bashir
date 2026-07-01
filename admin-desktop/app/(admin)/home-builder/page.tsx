"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Alert,
  Button,
  Card,
  Col,
  Drawer,
  Form,
  Input,
  Modal,
  Row,
  Select,
  Space,
  Switch,
  Tabs,
  Typography,
  message,
} from "antd";
import { EyeOutlined, PlusOutlined, ReloadOutlined } from "@ant-design/icons";
import { useMemo, useState } from "react";
import { HomePhonePreview } from "@/components/home-builder/HomePhonePreview";
import { HomeSectionList } from "@/components/home-builder/HomeSectionList";
import { SectionPayloadEditor } from "@/components/home-builder/SectionPayloadEditor";
import {
  SECTION_TYPES,
  SectionType,
  labelForType,
  metaForType,
  normalizePayload,
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
  const { data: preview, refetch: refetchPreview } = useQuery({
    queryKey: ["home-preview"],
    queryFn: queries.homePreview,
  });
  const { data: banners } = useQuery({ queryKey: ["banners"], queryFn: queries.banners });
  const { data: categories } = useQuery({ queryKey: ["categories"], queryFn: queries.categoriesFull });
  const { data: brands } = useQuery({ queryKey: ["brands"], queryFn: queries.brands });
  const { data: packages } = useQuery({ queryKey: ["packages"], queryFn: queries.packages });
  const { data: products } = useQuery({
    queryKey: ["products-lite"],
    queryFn: () => queries.products({ limit: 200 }),
  });
  const { data: skinConcerns } = useQuery({
    queryKey: ["skin-concerns"],
    queryFn: () => queries.skinConcerns(true),
  });

  const sorted = useMemo(
    () => [...(blocks ?? [])].sort((a, b) => (a.position ?? 0) - (b.position ?? 0)),
    [blocks],
  );

  const upsert = useMutation({
    mutationFn: async (values: any) => {
      const type = values.type as SectionType;
      const payload = normalizePayload(type, values.payload ?? {});
      const body = {
        type,
        title: values.title,
        subtitle: values.subtitle,
        position: values.position ?? sorted.length,
        isActive: values.isActive ?? true,
        payload,
      };
      if (editing?.id) return mutations.updateHomeBlock(editing.id, body);
      return mutations.createHomeBlock(body);
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
      qc.invalidateQueries({ queryKey: ["home-preview"] });
    },
  });

  const reorder = useMutation({
    mutationFn: mutations.reorderHomeBlocks,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["home-blocks"] });
      qc.invalidateQueries({ queryKey: ["home-preview"] });
    },
  });

  const toggle = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      mutations.updateHomeBlock(id, { isActive }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["home-blocks"] });
      qc.invalidateQueries({ queryKey: ["home-preview"] });
    },
  });

  const duplicate = useMutation({
    mutationFn: async (block: any) => {
      const payload = normalizePayload(block.type, block.payload ?? {});
      return mutations.createHomeBlock({
        type: block.type,
        title: block.title ? `${block.title} (نسخة)` : undefined,
        subtitle: block.subtitle,
        position: sorted.length,
        isActive: false,
        payload,
      });
    },
    onSuccess: () => {
      message.success("تم نسخ القسم");
      qc.invalidateQueries({ queryKey: ["home-blocks"] });
    },
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
      payload: {
        ...block.payload,
        source: block.payload?.productIds?.length ? "manual" : "filter",
      },
    });
    setDrawerOpen(true);
  }

  const groupedTypes = useMemo(() => {
    const map = new Map<string, typeof SECTION_TYPES>();
    for (const t of SECTION_TYPES) {
      if (!map.has(t.group)) map.set(t.group, []);
      map.get(t.group)!.push(t);
    }
    return [...map.entries()];
  }, []);

  const activeCount = sorted.filter((b) => b.isActive !== false).length;

  return (
    <>
      <Space direction="vertical" size={16} style={{ width: "100%" }}>
        <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div>
            <Title level={3} style={{ margin: 0 }}>
              بناء الصفحة الرئيسية
            </Title>
            <Paragraph type="secondary" style={{ margin: "4px 0 0" }}>
              رتّب أقسام التطبيق كما في Nice One — السحب والإفلات، معاينة مباشرة، {activeCount} قسم نشط
            </Paragraph>
          </div>
          <Space wrap>
            <Button icon={<ReloadOutlined />} onClick={() => refetchPreview()}>
              تحديث المعاينة
            </Button>
            <Button icon={<EyeOutlined />} onClick={() => setPreviewOpen(true)}>
              JSON
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => openCreate("HERO_BANNER")}>
              + بنر رئيسي
            </Button>
          </Space>
        </div>

        <Alert
          type="info"
          showIcon
          message="الترتيب في التطبيق يتبع ترتيبك هنا بالضبط — اسحب الأقسام أو استخدم الأسهم"
        />

        <Row gutter={[16, 16]}>
          <Col xs={24} xl={7}>
            <Card title="معاينة الهاتف" size="small" loading={isLoading}>
              <HomePhonePreview blocks={sorted} previewSections={preview?.sections} />
            </Card>
            <Card title="إضافة قسم" size="small" style={{ marginTop: 16 }}>
              <Space direction="vertical" style={{ width: "100%" }} size={12}>
                {groupedTypes.map(([group, types]) => (
                  <div key={group}>
                    <Text strong style={{ display: "block", marginBottom: 6 }}>
                      {group}
                    </Text>
                    <Space wrap>
                      {types.map((t) => (
                        <Button
                          key={t.value}
                          size="small"
                          onClick={() => openCreate(t.value)}
                          style={{ borderColor: t.color }}
                        >
                          {t.icon} {t.label}
                        </Button>
                      ))}
                    </Space>
                  </div>
                ))}
              </Space>
            </Card>
          </Col>

          <Col xs={24} xl={17}>
            <Card
              title={`الأقسام (${sorted.length}) — اسحب للترتيب`}
              loading={isLoading}
              size="small"
            >
              <HomeSectionList
                blocks={sorted}
                onEdit={openEdit}
                onDuplicate={(b) => duplicate.mutate(b)}
                onDelete={(id) => remove.mutate(id)}
                onToggle={(id, active) => toggle.mutate({ id, isActive: active })}
                onReorder={(ids) => reorder.mutate(ids)}
              />
            </Card>
          </Col>
        </Row>
      </Space>

      <Drawer
        title={editing ? "تعديل القسم" : "قسم جديد"}
        width={560}
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
                label: `${t.icon} ${t.label} — ${t.group}`,
              }))}
            />
          </Form.Item>
          <Form.Item noStyle shouldUpdate={(p, c) => p.type !== c.type}>
            {({ getFieldValue }) => {
              const meta = metaForType(getFieldValue("type"));
              return meta ? (
                <Alert type="info" message={meta.description} style={{ marginBottom: 16 }} />
              ) : null;
            }}
          </Form.Item>
          <Form.Item name="title" label="العنوان (يظهر في التطبيق)">
            <Input placeholder="أقوى العروض" />
          </Form.Item>
          <Form.Item name="subtitle" label="عنوان فرعي">
            <Input placeholder="نص صغير تحت العنوان" />
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
                products={products?.items ?? products ?? []}
                skinConcerns={skinConcerns ?? []}
              />
            )}
          </Form.Item>
        </Form>
      </Drawer>

      <Modal
        title="معاينة API — sections"
        open={previewOpen}
        onCancel={() => setPreviewOpen(false)}
        width={900}
        footer={null}
      >
        <Tabs
          items={[
            {
              key: "sections",
              label: "الأقسام المحلّاة",
              children: (
                <pre style={{ maxHeight: 480, overflow: "auto", fontSize: 11, direction: "ltr" }}>
                  {JSON.stringify(preview?.sections ?? [], null, 2)}
                </pre>
              ),
            },
            {
              key: "blocks",
              label: "الكتل الخام",
              children: (
                <pre style={{ maxHeight: 480, overflow: "auto", fontSize: 11, direction: "ltr" }}>
                  {JSON.stringify(sorted, null, 2)}
                </pre>
              ),
            },
          ]}
        />
      </Modal>
    </>
  );
}
