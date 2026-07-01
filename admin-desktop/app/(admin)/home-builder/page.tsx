"use client";

import {
  Alert,
  Button,
  Drawer,
  Form,
  Input,
  Space,
  Switch,
  Tabs,
  Tag,
  Typography,
  message,
} from "antd";
import {
  EyeOutlined,
  PlusOutlined,
  ReloadOutlined,
  SaveOutlined,
} from "@ant-design/icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
import "@/components/home-builder/home-builder.css";

const { Title, Paragraph, Text } = Typography;

function cleanPayload(type: SectionType, payload: Record<string, unknown>) {
  const p = normalizePayload(type, { ...payload });
  delete (p as any).source;
  for (const key of ["categoryId", "subcategoryId", "tertiaryCategoryId", "brandId", "linkType", "linkValue"]) {
    if (p[key] === "") delete p[key];
  }
  return p;
}

export default function HomeBuilderPage() {
  const qc = useQueryClient();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editorTab, setEditorTab] = useState("content");
  const [form] = Form.useForm();

  const { data: blocks, isLoading } = useQuery({
    queryKey: ["home-blocks"],
    queryFn: queries.homeBlocks,
  });
  const { data: preview, refetch: refetchPreview, isFetching: previewLoading } = useQuery({
    queryKey: ["home-preview"],
    queryFn: queries.homePreview,
  });
  const { data: banners } = useQuery({ queryKey: ["banners"], queryFn: queries.banners });
  const { data: categories } = useQuery({ queryKey: ["categories"], queryFn: queries.categoriesFull });
  const { data: subcategories } = useQuery({
    queryKey: ["subcategories-all"],
    queryFn: () => queries.subcategories(),
  });
  const { data: tertiary } = useQuery({
    queryKey: ["tertiary-all"],
    queryFn: () => queries.tertiarySections(),
  });
  const { data: brands } = useQuery({ queryKey: ["brands"], queryFn: queries.brands });
  const { data: packages } = useQuery({ queryKey: ["packages"], queryFn: queries.packages });
  const { data: products } = useQuery({
    queryKey: ["products-lite"],
    queryFn: () => queries.products({ limit: 300 }),
  });
  const { data: skinConcerns } = useQuery({
    queryKey: ["skin-concerns"],
    queryFn: () => queries.skinConcerns(true),
  });

  const editorEntities = useMemo(
    () => ({
      banners: banners ?? [],
      categories: categories ?? [],
      subcategories: subcategories ?? [],
      tertiary: tertiary ?? [],
      brands: brands ?? [],
      packages: packages ?? [],
      products: products?.items ?? products ?? [],
      skinConcerns: skinConcerns ?? [],
    }),
    [banners, categories, subcategories, tertiary, brands, packages, products, skinConcerns],
  );

  const sorted = useMemo(
    () => [...(blocks ?? [])].sort((a, b) => (a.position ?? 0) - (b.position ?? 0)),
    [blocks],
  );

  const upsert = useMutation({
    mutationFn: async (values: any) => {
      const type = values.type as SectionType;
      const payload = cleanPayload(type, values.payload ?? {});
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
      setSelectedId(null);
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
      const payload = cleanPayload(block.type, block.payload ?? {});
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
    setEditorTab("content");
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
    setSelectedId(block.id);
    setEditorTab("content");
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
  const selectedBlock = sorted.find((b) => b.id === selectedId);

  return (
    <div className="hb-page">
      <div className="hb-toolbar">
        <div>
          <Title level={3}>استوديو الصفحة الرئيسية</Title>
          <Paragraph type="secondary" style={{ margin: "4px 0 0" }}>
            بناء مرئي كامل — صور، روابط ذكية، معاينة حية
          </Paragraph>
        </div>
        <Space wrap>
          <div className="hb-stats">
            <span className="hb-stat-pill">{sorted.length} قسم</span>
            <span className="hb-stat-pill">{activeCount} نشط</span>
          </div>
          <Button icon={<ReloadOutlined />} loading={previewLoading} onClick={() => refetchPreview()}>
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
        style={{ marginBottom: 16 }}
        message="اسحب الأقسام للترتيب · انقر «تعديل» لإضافة صور وربط منتج/قسم/براند · المعاينة تعرض صور حقيقية من API"
      />

      <div className="hb-layout">
        <div className="hb-panel">
          <div className="hb-panel-head">
            <span>📱 معاينة حية</span>
            {selectedBlock && (
              <Tag color="magenta">{labelForType(selectedBlock.type)}</Tag>
            )}
          </div>
          <div className="hb-panel-body">
            <HomePhonePreview
              blocks={sorted}
              previewSections={preview?.sections}
              selectedId={selectedId}
              onSelectSection={setSelectedId}
            />
          </div>
        </div>

        <div className="hb-panel">
          <div className="hb-panel-head">
            <span>📋 الأقسام ({sorted.length})</span>
            <Text type="secondary" style={{ fontSize: 11 }}>
              اسحب للترتيب
            </Text>
          </div>
          <div className="hb-panel-body">
            <HomeSectionList
              blocks={sorted}
              previewSections={preview?.sections}
              selectedId={selectedId}
              onSelect={setSelectedId}
              onEdit={openEdit}
              onDuplicate={(b) => duplicate.mutate(b)}
              onDelete={(id) => remove.mutate(id)}
              onToggle={(id, active) => toggle.mutate({ id, isActive: active })}
              onReorder={(ids) => reorder.mutate(ids)}
              loading={isLoading}
            />
          </div>
        </div>

        <div className="hb-panel">
          <div className="hb-panel-head">➕ إضافة قسم</div>
          <div className="hb-panel-body">
            <div className="hb-add-grid">
              {groupedTypes.map(([group, types]) => (
                <div key={group} style={{ display: "contents" }}>
                  <div className="hb-add-group-title">{group}</div>
                  {types.map((t) => (
                    <button
                      key={t.value}
                      type="button"
                      className="hb-add-btn"
                      style={{ borderColor: t.color }}
                      onClick={() => openCreate(t.value)}
                    >
                      <span>{t.icon}</span>
                      <span>{t.label}</span>
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <Drawer
        title={
          editing ? (
            <Space>
              <span>{metaForType(editing.type)?.icon}</span>
              <span>تعديل: {editing.title || labelForType(editing.type)}</span>
            </Space>
          ) : (
            "قسم جديد"
          )
        }
        width={680}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        destroyOnClose
        extra={
          <Button type="primary" icon={<SaveOutlined />} loading={upsert.isPending} onClick={() => form.submit()}>
            حفظ
          </Button>
        }
        className="hb-drawer-tabs"
      >
        <Form form={form} layout="vertical" onFinish={(v) => upsert.mutate(v)}>
          <Form.Item name="type" label="نوع القسم" rules={[{ required: true }]}>
            <Input readOnly variant="filled" />
          </Form.Item>
          <Form.Item noStyle shouldUpdate={(p, c) => p.type !== c.type}>
            {({ getFieldValue }) => {
              const meta = metaForType(getFieldValue("type"));
              return meta ? (
                <Alert type="info" message={meta.description} style={{ marginBottom: 16 }} />
              ) : null;
            }}
          </Form.Item>

          <Tabs
            activeKey={editorTab}
            onChange={setEditorTab}
            items={[
              {
                key: "content",
                label: "📝 المحتوى",
                children: (
                  <>
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
                          tab="content"
                          {...editorEntities}
                        />
                      )}
                    </Form.Item>
                  </>
                ),
              },
              {
                key: "link",
                label: "🔗 الربط",
                children: (
                  <Form.Item noStyle shouldUpdate={(p, c) => p.type !== c.type}>
                    {({ getFieldValue }) => (
                      <SectionPayloadEditor
                        type={getFieldValue("type") as SectionType}
                        form={form}
                        tab="link"
                        {...editorEntities}
                      />
                    )}
                  </Form.Item>
                ),
              },
              {
                key: "style",
                label: "🎨 التصميم",
                children: (
                  <Form.Item noStyle shouldUpdate={(p, c) => p.type !== c.type}>
                    {({ getFieldValue }) => (
                      <SectionPayloadEditor
                        type={getFieldValue("type") as SectionType}
                        form={form}
                        tab="style"
                        {...editorEntities}
                      />
                    )}
                  </Form.Item>
                ),
              },
            ]}
          />
        </Form>
      </Drawer>

      <Drawer
        title="معاينة API"
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        width={900}
      >
        <Tabs
          items={[
            {
              key: "sections",
              label: "الأقسام المحلّاة",
              children: (
                <pre style={{ maxHeight: 520, overflow: "auto", fontSize: 11, direction: "ltr" }}>
                  {JSON.stringify(preview?.sections ?? [], null, 2)}
                </pre>
              ),
            },
            {
              key: "blocks",
              label: "الكتل الخام",
              children: (
                <pre style={{ maxHeight: 520, overflow: "auto", fontSize: 11, direction: "ltr" }}>
                  {JSON.stringify(sorted, null, 2)}
                </pre>
              ),
            },
          ]}
        />
      </Drawer>
    </div>
  );
}
