"use client";

import {
  Button,
  Drawer,
  Space,
  Tabs,
  Tag,
  Typography,
  message,
} from "antd";
import {
  AppstoreAddOutlined,
  CloudUploadOutlined,
  EyeOutlined,
  PlusOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { HomePhonePreview } from "@/components/home-builder/HomePhonePreview";
import { HomeSectionList } from "@/components/home-builder/HomeSectionList";
import { SectionInspector } from "@/components/home-builder/SectionInspector";
import { SectionTypeModal } from "@/components/home-builder/SectionTypeModal";
import {
  SECTION_TYPES,
  SectionType,
  normalizePayload,
} from "@/components/home-builder/section-types";
import { mutations, queries } from "@/lib/queries";
import { Form } from "antd";
import "@/components/home-builder/home-builder.css";

const { Title, Text } = Typography;

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
  const [typeModalOpen, setTypeModalOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [isNew, setIsNew] = useState(false);
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
  const { data: subcategories } = useQuery({ queryKey: ["subcategories-all"], queryFn: () => queries.subcategories() });
  const { data: tertiary } = useQuery({ queryKey: ["tertiary-all"], queryFn: () => queries.tertiarySections() });
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
    mutationFn: async () => {
      const values = await form.validateFields();
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
      message.success(editing ? "تم حفظ القسم ✓" : "تم إضافة القسم ✓");
      setIsNew(false);
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
      setEditing(null);
      setIsNew(false);
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

  function startCreate(type: SectionType) {
    const def = SECTION_TYPES.find((t) => t.value === type)!;
    setEditing(null);
    setIsNew(true);
    setEditorTab("content");
    form.resetFields();
    form.setFieldsValue({
      type,
      isActive: true,
      position: sorted.length,
      payload: { ...def.defaultPayload },
    });
  }

  function openEdit(block: any) {
    setEditing(block);
    setIsNew(false);
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
  }

  function closeInspector() {
    setEditing(null);
    setIsNew(false);
  }

  const activeCount = sorted.filter((b) => b.isActive !== false).length;
  const inspectorOpen = isNew || !!editing;

  return (
    <div className="hb-studio">
      <header className="hb-hero">
        <div className="hb-hero-text">
          <Title level={2} className="hb-hero-title">
            استوديو الصفحة الرئيسية
          </Title>
          <Text className="hb-hero-sub">
            صور · روابط ذكية · معاينة حية — {sorted.length} قسم · {activeCount} نشط
          </Text>
        </div>
        <Space wrap>
          <Button icon={<ReloadOutlined />} loading={previewLoading} onClick={() => refetchPreview()}>
            تحديث المعاينة
          </Button>
          <Button icon={<EyeOutlined />} onClick={() => setPreviewOpen(true)}>
            JSON
          </Button>
          <Button
            type="primary"
            size="large"
            icon={<AppstoreAddOutlined />}
            onClick={() => setTypeModalOpen(true)}
            className="hb-hero-cta"
          >
            + إضافة قسم
          </Button>
        </Space>
      </header>

      <div className={`hb-studio-grid${inspectorOpen ? " hb-studio-grid--editing" : ""}`}>
        <aside className="hb-studio-phone">
          <div className="hb-panel-head">📱 معاينة التطبيق</div>
          <HomePhonePreview
            blocks={sorted}
            previewSections={preview?.sections}
            selectedId={selectedId}
            onSelectSection={(id) => {
              setSelectedId(id);
              const block = sorted.find((b) => b.id === id);
              if (block) openEdit(block);
            }}
          />
        </aside>

        <main className="hb-studio-main">
          <div className="hb-panel-head">
            <span>📋 أقسام الصفحة</span>
            <Tag>اسحب للترتيب</Tag>
          </div>
          <HomeSectionList
            blocks={sorted}
            previewSections={preview?.sections}
            selectedId={selectedId}
            onSelect={(id) => {
              setSelectedId(id);
              const block = sorted.find((b) => b.id === id);
              if (block) openEdit(block);
            }}
            onEdit={openEdit}
            onDuplicate={(b) => duplicate.mutate(b)}
            onDelete={(id) => remove.mutate(id)}
            onToggle={(id, active) => toggle.mutate({ id, isActive: active })}
            onReorder={(ids) => reorder.mutate(ids)}
            loading={isLoading}
          />
        </main>

        <aside className={`hb-studio-inspector${inspectorOpen ? " open" : ""}`}>
          <SectionInspector
            editing={editing}
            isNew={isNew}
            form={form}
            editorTab={editorTab}
            onTabChange={setEditorTab}
            onSave={() => upsert.mutate()}
            onClose={closeInspector}
            saving={upsert.isPending}
            editorEntities={editorEntities}
          />
          {!inspectorOpen && (
            <div className="hb-inspector-hint">
              <Button
                block
                type="dashed"
                size="large"
                icon={<PlusOutlined />}
                onClick={() => setTypeModalOpen(true)}
              >
                إضافة قسم جديد
              </Button>
            </div>
          )}
        </aside>
      </div>

      <SectionTypeModal
        open={typeModalOpen}
        onClose={() => setTypeModalOpen(false)}
        onPick={(type) => {
          startCreate(type);
          setTypeModalOpen(false);
        }}
      />

      <Drawer title="معاينة API" open={previewOpen} onClose={() => setPreviewOpen(false)} width={900}>
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
