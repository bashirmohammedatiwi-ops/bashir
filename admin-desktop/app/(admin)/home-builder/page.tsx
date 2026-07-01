"use client";

import { Button, Drawer, Form, Modal, Space, Tabs, Typography, message } from "antd";
import {
  AppstoreAddOutlined,
  EyeOutlined,
  LayoutOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { PhoneCanvas } from "@/components/home-builder/PhoneCanvas";
import { SectionInspector } from "@/components/home-builder/SectionInspector";
import { SectionTypeModal } from "@/components/home-builder/SectionTypeModal";
import {
  SECTION_TYPES,
  SectionType,
  normalizePayload,
} from "@/components/home-builder/section-types";
import { mutations, queries } from "@/lib/queries";
import "@/components/home-builder/home-builder.css";

const { Text } = Typography;

const NICE_ONE_TEMPLATE: { type: SectionType; title?: string; payload?: Record<string, unknown> }[] = [
  { type: "HERO_BANNER", title: "مرحباً بكم" },
  { type: "PROMO_STRIP", title: "شحن مجاني", payload: { text: "🚚 شحن مجاني للطلبات فوق 50,000 د.ع", backgroundColor: "#FCE4EC", linkType: "offers" } },
  { type: "FLASH_SALE", title: "أقوى العروض", payload: { filter: "promo", showViewAll: true, limit: 12 } },
  { type: "PRODUCT_LIST", title: "الأكثر مبيعاً", payload: { filter: "bestSeller", showViewAll: true, limit: 12 } },
  { type: "FEATURED_BRANDS", title: "براندات مميزة" },
  { type: "BANNER_CAROUSEL", title: "عروض حصرية" },
  { type: "PRODUCT_LIST", title: "وصل حديثاً", payload: { filter: "new", showViewAll: true, limit: 12 } },
];

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
  const [insertAt, setInsertAt] = useState<number | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editorTab, setEditorTab] = useState("content");
  const [form] = Form.useForm();

  const { data: blocks, isLoading } = useQuery({ queryKey: ["home-blocks"], queryFn: queries.homeBlocks });
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
  const { data: products } = useQuery({ queryKey: ["products-lite"], queryFn: () => queries.products({ limit: 300 }) });
  const { data: skinConcerns } = useQuery({ queryKey: ["skin-concerns"], queryFn: () => queries.skinConcerns(true) });

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
    onSuccess: async (result) => {
      message.success(editing ? "تم الحفظ ✓" : "تمت الإضافة ✓");
      const newId = result?.id ?? result?.data?.id;
      if (isNew && insertAt != null && newId) {
        const ids = sorted.map((b) => b.id);
        ids.splice(insertAt, 0, newId);
        await mutations.reorderHomeBlocks(ids);
      }
      setInsertAt(null);
      setIsNew(false);
      await qc.invalidateQueries({ queryKey: ["home-blocks"] });
      await qc.invalidateQueries({ queryKey: ["home-preview"] });
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
      message.success("تم النسخ");
      qc.invalidateQueries({ queryKey: ["home-blocks"] });
    },
  });

  const applyTemplate = useMutation({
    mutationFn: async () => {
      for (let i = 0; i < NICE_ONE_TEMPLATE.length; i++) {
        const t = NICE_ONE_TEMPLATE[i];
        const def = SECTION_TYPES.find((s) => s.value === t.type)!;
        await mutations.createHomeBlock({
          type: t.type,
          title: t.title,
          position: sorted.length + i,
          isActive: true,
          payload: { ...def.defaultPayload, ...t.payload },
        });
      }
    },
    onSuccess: () => {
      message.success("تم تطبيق قالب Nice One");
      qc.invalidateQueries({ queryKey: ["home-blocks"] });
      qc.invalidateQueries({ queryKey: ["home-preview"] });
    },
  });

  function openAddAt(index: number) {
    setInsertAt(index);
    setTypeModalOpen(true);
  }

  function startCreate(type: SectionType) {
    const def = SECTION_TYPES.find((t) => t.value === type)!;
    const pos = insertAt ?? sorted.length;
    setEditing(null);
    setIsNew(true);
    setEditorTab("content");
    form.resetFields();
    form.setFieldsValue({
      type,
      isActive: true,
      position: pos,
      payload: { ...def.defaultPayload },
    });
    // insertAt kept until save for reorder
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

  function moveBlock(id: string, dir: -1 | 1) {
    const idx = sorted.findIndex((b) => b.id === id);
    const next = idx + dir;
    if (next < 0 || next >= sorted.length) return;
    const ids = sorted.map((b) => b.id);
    [ids[idx], ids[next]] = [ids[next], ids[idx]];
    reorder.mutate(ids);
  }

  const inspectorOpen = isNew || !!editing;

  return (
    <div className="hb-wysiwyg">
      <header className="hb-wysiwyg-toolbar">
        <div>
          <Text strong style={{ fontSize: 18 }}>محرّر الصفحة الرئيسية</Text>
          <Text type="secondary" style={{ display: "block", fontSize: 12 }}>
            عدّل الشاشة مباشرة — ما تراه هنا = ما يراه العميل
          </Text>
        </div>
        <Space wrap>
          <Button icon={<ReloadOutlined />} loading={previewLoading} onClick={() => refetchPreview()}>
            تحديث
          </Button>
          <Button icon={<EyeOutlined />} onClick={() => setPreviewOpen(true)}>JSON</Button>
          {sorted.length === 0 && (
            <Button icon={<LayoutOutlined />} loading={applyTemplate.isPending} onClick={() => applyTemplate.mutate()}>
              قالب Nice One
            </Button>
          )}
          <Button type="primary" icon={<AppstoreAddOutlined />} onClick={() => openAddAt(sorted.length)}>
            + قسم
          </Button>
        </Space>
      </header>

      <div className={`hb-wysiwyg-body${inspectorOpen ? " editing" : ""}`}>
        <div className="hb-wysiwyg-phone-col">
          {isLoading ? (
            <div className="hb-wysiwyg-loading">جاري التحميل...</div>
          ) : (
            <PhoneCanvas
              blocks={sorted}
              previewSections={preview?.sections}
              selectedId={selectedId}
              onSelect={(id) => {
                setSelectedId(id);
                const b = sorted.find((x) => x.id === id);
                if (b) openEdit(b);
              }}
              onEdit={openEdit}
              onAddAt={openAddAt}
              onMove={moveBlock}
              onDuplicate={(b) => duplicate.mutate(b)}
              onDelete={(id) => remove.mutate(id)}
              onToggle={(id, active) => toggle.mutate({ id, isActive: active })}
              onReorder={(ids) => reorder.mutate(ids)}
            />
          )}
        </div>

        {inspectorOpen && (
          <aside className="hb-wysiwyg-inspector">
            <SectionInspector
              editing={editing}
              isNew={isNew}
              form={form}
              editorTab={editorTab}
              onTabChange={setEditorTab}
              onSave={() => upsert.mutate()}
              onClose={() => {
                setEditing(null);
                setIsNew(false);
              }}
              saving={upsert.isPending}
              editorEntities={editorEntities}
            />
          </aside>
        )}
      </div>

      <SectionTypeModal
        open={typeModalOpen}
        onClose={() => {
          setTypeModalOpen(false);
          setInsertAt(null);
        }}
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
              label: "محلّاة",
              children: (
                <pre style={{ maxHeight: 520, overflow: "auto", fontSize: 11, direction: "ltr" }}>
                  {JSON.stringify(preview?.sections ?? [], null, 2)}
                </pre>
              ),
            },
            {
              key: "blocks",
              label: "خام",
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
