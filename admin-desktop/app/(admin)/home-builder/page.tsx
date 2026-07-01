"use client";

import { Drawer, Form, Input, Modal, Tabs, Typography, message } from "antd";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo, useState } from "react";
import { PhoneCanvas } from "@/components/home-builder/PhoneCanvas";
import { SectionInspector } from "@/components/home-builder/SectionInspector";
import { SectionOutline } from "@/components/home-builder/SectionOutline";
import { SectionTypeModal } from "@/components/home-builder/SectionTypeModal";
import { StudioToolbar, DeviceSize } from "@/components/home-builder/StudioToolbar";
import { resolveBlockPreview } from "@/components/home-builder/preview-resolver";
import { PAGE_TEMPLATES } from "@/components/home-builder/section-templates";
import {
  SECTION_TYPES,
  SectionType,
  normalizePayload,
} from "@/components/home-builder/section-types";
import { countWarnings } from "@/components/home-builder/section-validation";
import { mutations, queries } from "@/lib/queries";
import "@/components/home-builder/home-builder.css";

const { Text } = Typography;

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
  const [importOpen, setImportOpen] = useState(false);
  const [importJson, setImportJson] = useState("");
  const [editing, setEditing] = useState<any | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editorTab, setEditorTab] = useState("content");
  const [zoom, setZoom] = useState(1);
  const [deviceSize, setDeviceSize] = useState<DeviceSize>("375");
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

  const mergedPreview = useMemo(() => {
    return sorted.map((block) => {
      const apiResolved = preview?.sections?.find((s: any) => s.id === block.id);
      const local = resolveBlockPreview(block, editorEntities, apiResolved);
      return local ? { id: block.id, ...local } : apiResolved ? { id: block.id, ...apiResolved } : null;
    }).filter(Boolean);
  }, [sorted, preview?.sections, editorEntities]);

  const { errors: errorCount, warns: warnCount } = useMemo(() => countWarnings(sorted), [sorted]);
  const activeCount = sorted.filter((b) => b.isActive !== false).length;

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
      if (isNew && newId) setSelectedId(newId);
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
    mutationFn: async (templateId: string) => {
      const tpl = PAGE_TEMPLATES.find((t) => t.id === templateId);
      if (!tpl) throw new Error("template not found");
      for (let i = 0; i < tpl.sections.length; i++) {
        const s = tpl.sections[i];
        const def = SECTION_TYPES.find((t) => t.value === s.type)!;
        await mutations.createHomeBlock({
          type: s.type,
          title: s.title,
          subtitle: s.subtitle,
          position: sorted.length + i,
          isActive: true,
          payload: { ...def.defaultPayload, ...s.payload },
        });
      }
    },
    onSuccess: () => {
      message.success("تم تطبيق القالب");
      qc.invalidateQueries({ queryKey: ["home-blocks"] });
      qc.invalidateQueries({ queryKey: ["home-preview"] });
    },
    onError: () => message.error("تعذر تطبيق القالب"),
  });

  const importBlocks = useMutation({
    mutationFn: async (json: string) => {
      const parsed = JSON.parse(json);
      const list = Array.isArray(parsed) ? parsed : parsed.sections ?? parsed.blocks ?? [];
      if (!Array.isArray(list) || !list.length) throw new Error("empty");
      for (let i = 0; i < list.length; i++) {
        const item = list[i];
        const type = item.type as SectionType;
        const def = SECTION_TYPES.find((t) => t.value === type);
        if (!def) continue;
        await mutations.createHomeBlock({
          type,
          title: item.title,
          subtitle: item.subtitle,
          position: sorted.length + i,
          isActive: item.isActive ?? true,
          payload: cleanPayload(type, { ...def.defaultPayload, ...(item.payload ?? {}) }),
        });
      }
    },
    onSuccess: () => {
      message.success("تم الاستيراد");
      setImportOpen(false);
      setImportJson("");
      qc.invalidateQueries({ queryKey: ["home-blocks"] });
      qc.invalidateQueries({ queryKey: ["home-preview"] });
    },
    onError: () => message.error("JSON غير صالح أو فارغ"),
  });

  const openAddAt = useCallback((index: number) => {
    setInsertAt(index);
    setTypeModalOpen(true);
  }, []);

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

  function confirmDelete(id: string) {
    Modal.confirm({
      title: "حذف القسم؟",
      content: "لا يمكن التراجع عن هذا الإجراء.",
      okText: "حذف",
      okType: "danger",
      cancelText: "إلغاء",
      onOk: () => remove.mutate(id),
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

  function exportJson() {
    const data = sorted.map(({ id, type, title, subtitle, position, isActive, payload }) => ({
      id, type, title, subtitle, position, isActive, payload,
    }));
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `home-blocks-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    message.success("تم التصدير");
  }

  return (
    <div className="hb-studio">
      <StudioToolbar
        sectionCount={sorted.length}
        activeCount={activeCount}
        errorCount={errorCount}
        warnCount={warnCount}
        previewLoading={previewLoading}
        zoom={zoom}
        deviceSize={deviceSize}
        onRefresh={() => refetchPreview()}
        onExport={exportJson}
        onImport={() => setImportOpen(true)}
        onOpenTemplates={() => setTypeModalOpen(true)}
        onOpenJson={() => setPreviewOpen(true)}
        onZoomIn={() => setZoom((z) => Math.min(1.2, z + 0.1))}
        onZoomOut={() => setZoom((z) => Math.max(0.7, z - 0.1))}
        onDeviceChange={setDeviceSize}
      />

      <div className="hb-studio-main">
        <SectionOutline
          blocks={sorted}
          selectedId={selectedId}
          onSelect={(id) => {
            setSelectedId(id);
            const b = sorted.find((x) => x.id === id);
            if (b) openEdit(b);
          }}
          onAdd={() => openAddAt(sorted.length)}
          onDuplicate={(b) => duplicate.mutate(b)}
          onDelete={confirmDelete}
          onToggle={(id, active) => toggle.mutate({ id, isActive: active })}
          onReorder={(ids) => reorder.mutate(ids)}
        />

        <main className="hb-studio-canvas">
          {isLoading ? (
            <div className="hb-studio-loading">
              <div className="hb-loading-spinner" />
              <Text>جاري تحميل الصفحة...</Text>
            </div>
          ) : (
            <PhoneCanvas
              blocks={sorted}
              previewSections={mergedPreview}
              selectedId={selectedId}
              zoom={zoom}
              deviceSize={deviceSize}
              onSelect={(id) => {
                setSelectedId(id);
                const b = sorted.find((x) => x.id === id);
                if (b) openEdit(b);
              }}
              onEdit={openEdit}
              onAddAt={openAddAt}
              onMove={moveBlock}
              onDuplicate={(b) => duplicate.mutate(b)}
              onDelete={confirmDelete}
              onToggle={(id, active) => toggle.mutate({ id, isActive: active })}
              onReorder={(ids) => reorder.mutate(ids)}
            />
          )}
        </main>

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
      </div>

      <SectionTypeModal
        open={typeModalOpen}
        onClose={() => {
          setTypeModalOpen(false);
          setInsertAt(null);
        }}
        onPickSection={(type) => startCreate(type)}
        onApplyTemplate={(id) => applyTemplate.mutate(id)}
        hasExistingSections={sorted.length > 0}
      />

      <Drawer title="معاينة API" open={previewOpen} onClose={() => setPreviewOpen(false)} width={920}>
        <Tabs
          items={[
            {
              key: "resolved",
              label: `محلّاة (${preview?.sections?.length ?? 0})`,
              children: (
                <pre className="hb-json-pre">{JSON.stringify(preview?.sections ?? [], null, 2)}</pre>
              ),
            },
            {
              key: "merged",
              label: `معاينة (${mergedPreview.length})`,
              children: (
                <pre className="hb-json-pre">{JSON.stringify(mergedPreview, null, 2)}</pre>
              ),
            },
            {
              key: "blocks",
              label: `خام (${sorted.length})`,
              children: (
                <pre className="hb-json-pre">{JSON.stringify(sorted, null, 2)}</pre>
              ),
            },
          ]}
        />
      </Drawer>

      <Modal
        title="استيراد أقسام من JSON"
        open={importOpen}
        onCancel={() => setImportOpen(false)}
        okText="استيراد"
        cancelText="إلغاء"
        confirmLoading={importBlocks.isPending}
        onOk={() => importBlocks.mutate(importJson)}
      >
        <Text type="secondary" style={{ display: "block", marginBottom: 12 }}>
          الصق مصفوفة أقسام JSON — سيتم إضافتها في نهاية الصفحة
        </Text>
        <Input.TextArea
          rows={12}
          value={importJson}
          onChange={(e) => setImportJson(e.target.value)}
          placeholder='[{"type":"PRODUCT_LIST","title":"...","payload":{...}}]'
          style={{ direction: "ltr", fontFamily: "monospace", fontSize: 12 }}
        />
      </Modal>
    </div>
  );
}
