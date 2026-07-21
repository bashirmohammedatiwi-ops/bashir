"use client";

import {
  CloudDownloadOutlined,
  CloudUploadOutlined,
  LayoutOutlined,
  PlusOutlined,
  ReloadOutlined,
  UndoOutlined,
} from "@ant-design/icons";
import {
  Button,
  Col,
  Drawer,
  Dropdown,
  Form,
  Input,
  Modal,
  Radio,
  Row,
  Space,
  Tabs,
  Tag,
  Typography,
  Alert,
  message,
} from "antd";
import type { MenuProps } from "antd";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { SectionEditorPanel } from "@/components/home-builder/SectionEditorPanel";
import { SectionListPanel } from "@/components/home-builder/SectionListPanel";
import { SectionTypeModal } from "@/components/home-builder/SectionTypeModal";
import { PAGE_TEMPLATES } from "@/components/home-builder/section-templates";
import { SECTION_PRESETS } from "@/components/home-builder/section-presets";
import {
  SECTION_TYPES,
  SectionType,
  isFixedTopSection,
} from "@/components/home-builder/section-types";
import { countWarnings } from "@/components/home-builder/section-validation";
import { filterBuilderBlocks } from "@/components/home-builder/fixed-hero";
import { serializeHomeBlockPayload } from "@/components/home-builder/home-block-payload";
import { mutations, queries } from "@/lib/queries";
import "@/components/home-builder/home-builder.css";

const { Title, Text } = Typography;

const DRAFT_SECTION_ID = "__draft__";

export default function HomeBuilderPage() {
  const qc = useQueryClient();
  const [typeModalOpen, setTypeModalOpen] = useState(false);
  const [insertAt, setInsertAt] = useState<number | null>(null);
  const [jsonOpen, setJsonOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [importJson, setImportJson] = useState("");
  const [editing, setEditing] = useState<any | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editorTab, setEditorTab] = useState("basics");
  const [dupModal, setDupModal] = useState<any | null>(null);
  const [dupMode, setDupMode] = useState<"after" | "end">("after");
  const [bulkSelected, setBulkSelected] = useState<string[]>([]);
  const undoStack = useRef<any[][]>([]);
  const [form] = Form.useForm();

  const { data: blocks, isLoading, refetch } = useQuery({
    queryKey: ["home-blocks"],
    queryFn: queries.homeBlocks,
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

  const builderBlocks = useMemo(() => filterBuilderBlocks(sorted), [sorted]);
  const activeCount = builderBlocks.filter((b) => b.isActive !== false).length;
  const { errors: errorCount, warns: warnCount } = useMemo(() => countWarnings(builderBlocks), [builderBlocks]);

  function pushUndo() {
    if (builderBlocks.length) undoStack.current = [...undoStack.current.slice(-9), builderBlocks.map((b) => ({ ...b }))];
  }

  function handleUndo() {
    const prev = undoStack.current.pop();
    if (!prev?.length) {
      message.info("لا يوجد تراجع");
      return;
    }
    Modal.confirm({
      title: "تراجع عن آخر عملية؟",
      content: "يستعيد ترتيب الأقسام السابق — لا يمكن التراجع عن الحذف.",
      okText: "تراجع",
      cancelText: "إلغاء",
      onOk: async () => {
        message.info("التراجع يعيد الترتيب فقط — استخدم التصدير للنسخ الاحتياطي");
      },
    });
  }

  function handleSave() {
    upsert.mutate();
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        if (editing || isNew) handleSave();
      }
      if (e.key === "Escape") {
        if (typeModalOpen) setTypeModalOpen(false);
        else if (dupModal) setDupModal(null);
      }
      if (!selectedId || isNew) return;
      const idx = builderBlocks.findIndex((b) => b.id === selectedId);
      if (idx < 0) return;
      if (e.key === "ArrowUp" && idx > 0) {
        e.preventDefault();
        guardUnsaved(() => openEdit(builderBlocks[idx - 1]));
      }
      if (e.key === "ArrowDown" && idx < builderBlocks.length - 1) {
        e.preventDefault();
        guardUnsaved(() => openEdit(builderBlocks[idx + 1]));
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedId, isNew, builderBlocks, typeModalOpen, dupModal, editing]);

  const upsert = useMutation({
    mutationFn: async () => {
      const values = form.getFieldsValue(true);
      const type = values.type as SectionType;
      const payload = serializeHomeBlockPayload(type, values.payload ?? {});
      const body = {
        type,
        title: values.title,
        subtitle: values.subtitle,
        position: values.position ?? builderBlocks.length,
        isActive: values.isActive ?? true,
        payload,
      };
      if (editing?.id) return mutations.updateHomeBlock(editing.id, body);
      return mutations.createHomeBlock(body);
    },
    onSuccess: async (result) => {
      message.success(editing?.id ? "تم الحفظ" : "تمت الإضافة");
      const newId = result?.id ?? result?.data?.id;
      if (isNew && insertAt != null && newId) {
        const ids = builderBlocks.map((b) => b.id);
        ids.splice(insertAt, 0, newId);
        await mutations.reorderHomeBlocks(ids);
      }
      setInsertAt(null);
      if (isNew && newId) {
        setSelectedId(newId);
        setEditing({
          id: newId,
          type: form.getFieldValue("type"),
          title: form.getFieldValue("title"),
          subtitle: form.getFieldValue("subtitle"),
          isActive: form.getFieldValue("isActive"),
          payload: form.getFieldValue("payload"),
        });
      }
      setIsNew(false);
      await qc.invalidateQueries({ queryKey: ["home-blocks"] });
    },
  });

  const remove = useMutation({
    mutationFn: mutations.deleteHomeBlock,
    onSuccess: () => {
      message.success("تم الحذف");
      setSelectedId(null);
      setEditing(null);
      setIsNew(false);
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

  const duplicate = useMutation({
    mutationFn: async ({ block, mode }: { block: any; mode: "after" | "end" }) => {
      pushUndo();
      const payload = serializeHomeBlockPayload(block.type, block.payload ?? {});
      const result = await mutations.createHomeBlock({
        type: block.type,
        title: block.title ? `${block.title} (نسخة)` : undefined,
        subtitle: block.subtitle,
        position: builderBlocks.length,
        isActive: false,
        payload,
      });
      const newId = result?.id ?? result?.data?.id;
      if (newId && mode === "after") {
        const idx = builderBlocks.findIndex((b) => b.id === block.id);
        if (idx >= 0) {
          const ids = builderBlocks.map((b) => b.id);
          ids.splice(idx + 1, 0, newId);
          await mutations.reorderHomeBlocks(ids);
        }
      }
      return result;
    },
    onSuccess: () => {
      message.success("تم النسخ — القسم الجديد مخفي حتى تفعّله");
      setDupModal(null);
      qc.invalidateQueries({ queryKey: ["home-blocks"] });
    },
  });

  const applyTemplate = useMutation({
    mutationFn: async ({ templateId, replace }: { templateId: string; replace?: boolean }) => {
      const tpl = PAGE_TEMPLATES.find((t) => t.id === templateId);
      if (!tpl) throw new Error("template not found");
      if (replace) {
        for (const block of sorted) {
          await mutations.deleteHomeBlock(block.id);
        }
      }
      const basePos = replace ? 0 : builderBlocks.length;
      const cmsSections = tpl.sections.filter((s) => s.type !== "HERO_BANNER");
      for (let i = 0; i < cmsSections.length; i++) {
        const s = cmsSections[i];
        const def = SECTION_TYPES.find((t) => t.value === s.type)!;
        await mutations.createHomeBlock({
          type: s.type,
          title: s.title,
          subtitle: s.subtitle,
          position: basePos + i,
          isActive: true,
          payload: { ...def.defaultPayload, ...s.payload },
        });
      }
    },
    onSuccess: (_, { replace }) => {
      message.success(replace ? "تم استبدال الصفحة بالقالب" : "تم تطبيق القالب");
      setSelectedId(null);
      setEditing(null);
      setIsNew(false);
      qc.invalidateQueries({ queryKey: ["home-blocks"] });
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
        if (isFixedTopSection(type)) continue;
        const def = SECTION_TYPES.find((t) => t.value === type);
        if (!def) continue;
        await mutations.createHomeBlock({
          type,
          title: item.title,
          subtitle: item.subtitle,
          position: builderBlocks.length + i,
          isActive: item.isActive ?? true,
          payload: serializeHomeBlockPayload(type, { ...def.defaultPayload, ...(item.payload ?? {}) }),
        });
      }
    },
    onSuccess: () => {
      message.success("تم الاستيراد");
      setImportOpen(false);
      setImportJson("");
      qc.invalidateQueries({ queryKey: ["home-blocks"] });
    },
    onError: () => message.error("JSON غير صالح"),
  });

  const openAdd = useCallback(() => {
    setInsertAt(builderBlocks.length);
    setTypeModalOpen(true);
  }, [builderBlocks.length]);

  const openInsertAt = useCallback((index: number) => {
    setInsertAt(index);
    setTypeModalOpen(true);
  }, []);

  function hasUnsavedEdits() {
    return isNew || form.isFieldsTouched();
  }

  function guardUnsaved(action: () => void) {
    if (hasUnsavedEdits() && !upsert.isPending) {
      Modal.confirm({
        title: "تغييرات غير محفوظة",
        content: "لديك تعديلات لم تُحفظ. المتابعة دون حفظ؟",
        okText: "متابعة",
        cancelText: "إلغاء",
        onOk: () => {
          form.resetFields();
          setIsNew(false);
          action();
        },
      });
      return;
    }
    action();
  }

  function startCreate(type: SectionType, preset?: { title?: string; subtitle?: string; payload?: Record<string, unknown> }) {
    if (isFixedTopSection(type)) {
      message.info("الرأس والبنرات ثابتة — عدّلها من صفحات البنرات والفئات");
      return;
    }
    const def = SECTION_TYPES.find((t) => t.value === type)!;
    setEditing(null);
    setIsNew(true);
    setSelectedId(DRAFT_SECTION_ID);
    setEditorTab("setup");
    setTypeModalOpen(false);
    form.resetFields();
    form.setFieldsValue({
      type,
      title: preset?.title,
      subtitle: preset?.subtitle,
      isActive: true,
      position: insertAt ?? builderBlocks.length,
      payload: { ...def.defaultPayload, ...preset?.payload },
    });
  }

  function startCreatePreset(presetId: string) {
    const preset = SECTION_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    startCreate(preset.type, {
      title: preset.title,
      subtitle: preset.subtitle,
      payload: preset.payload,
    });
  }

  function openEdit(block: any) {
    const apply = () => {
      setEditing(block);
      setIsNew(false);
      setSelectedId(block.id);
      setEditorTab("setup");
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
    };
    if (hasUnsavedEdits() && block.id !== selectedId) {
      guardUnsaved(apply);
      return;
    }
    apply();
  }

  function moveBlock(id: string, dir: -1 | 1) {
    pushUndo();
    const idx = builderBlocks.findIndex((b) => b.id === id);
    const next = idx + dir;
    if (next < 0 || next >= builderBlocks.length) return;
    const ids = builderBlocks.map((b) => b.id);
    [ids[idx], ids[next]] = [ids[next], ids[idx]];
    reorder.mutate(ids);
  }

  function exportSelectedJson() {
    const data = builderBlocks.filter((b) => bulkSelected.includes(b.id));
    if (!data.length) return;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `home-sections-selected.json`;
    a.click();
    URL.revokeObjectURL(url);
    message.success(`تم تصدير ${data.length} قسم`);
  }

  async function bulkSetActive(active: boolean) {
    pushUndo();
    for (const id of bulkSelected) {
      await mutations.updateHomeBlock(id, { isActive: active });
    }
    message.success(active ? "تم تفعيل المحدد" : "تم إخفاء المحدد");
    setBulkSelected([]);
    qc.invalidateQueries({ queryKey: ["home-blocks"] });
  }

  function exportJson() {
    const data = builderBlocks.map(({ id, type, title, subtitle, position, isActive, payload }) => ({
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

  const toolsMenu: MenuProps = {
    items: [
      { key: "export", icon: <CloudDownloadOutlined />, label: "تصدير JSON", onClick: exportJson },
      { key: "import", icon: <CloudUploadOutlined />, label: "استيراد JSON", onClick: () => setImportOpen(true) },
      { key: "json", label: "عرض البيانات", onClick: () => setJsonOpen(true) },
    ],
  };

  return (
    <div className="hb-page hb-page--studio">
      <header className="hb-studio-header">
        <div className="hb-studio-header-main">
          <Title level={3} style={{ margin: 0 }}>
            استوديو الصفحة الرئيسية
          </Title>
          <Text type="secondary">
            رتّب الأقسام، خصّص الإطارات والمعارض — النتيجة مباشرة في تطبيق الهاتف
          </Text>
        </div>
        <Space wrap className="hb-studio-header-actions">
          <Tag color="green">{activeCount} نشط</Tag>
          <Tag>{builderBlocks.length} قسم</Tag>
          {(errorCount > 0 || warnCount > 0) && (
            <Tag color={errorCount ? "red" : "orange"}>{errorCount + warnCount} تنبيه</Tag>
          )}
          <Button icon={<UndoOutlined />} onClick={handleUndo}>
            تراجع
          </Button>
          <Button icon={<ReloadOutlined />} onClick={() => refetch()}>
            تحديث
          </Button>
          <Dropdown menu={toolsMenu}>
            <Button>أدوات</Button>
          </Dropdown>
          <Button icon={<LayoutOutlined />} onClick={() => setTypeModalOpen(true)}>
            قوالب
          </Button>
          <Button type="primary" size="large" icon={<PlusOutlined />} onClick={openAdd}>
            إضافة قسم
          </Button>
        </Space>
      </header>

      <Alert
        type="info"
        showIcon
        banner
        className="hb-studio-banner"
        message="الرأس ثابت في التطبيق"
        description="البحث، البنر، الاختصارات، وأيقونات الفئات — من صفحات البنرات والفئات. هنا تُبنى الأقسام أسفلها فقط."
      />

      <Row gutter={20} className="hb-studio-workspace">
        <Col xs={24} lg={9} xl={8}>
          <div className="hb-studio-sidebar">
            <SectionListPanel
              blocks={builderBlocks}
              selectedId={selectedId}
              loading={isLoading}
              onSelect={(id) => {
                guardUnsaved(() => {
                  setSelectedId(id);
                  const b = builderBlocks.find((x) => x.id === id);
                  if (b) openEdit(b);
                });
              }}
              onAdd={openAdd}
              onInsertAt={openInsertAt}
              onEdit={openEdit}
              onMove={moveBlock}
              onDuplicate={(b) => {
                setDupModal(b);
                setDupMode("after");
              }}
              onDelete={(id) => remove.mutate(id)}
              onToggle={(id, active) => toggle.mutate({ id, isActive: active })}
              onReorder={(ids) => {
                pushUndo();
                reorder.mutate(ids);
              }}
              bulkSelected={bulkSelected}
              onBulkSelect={setBulkSelected}
              onBulkActivate={() => bulkSetActive(true)}
              onBulkHide={() => bulkSetActive(false)}
              onBulkExport={exportSelectedJson}
            />
          </div>
        </Col>

        <Col xs={24} lg={15} xl={16}>
          <SectionEditorPanel
            editing={editing}
            isNew={isNew}
            form={form}
            editorTab={editorTab}
            onTabChange={setEditorTab}
            onSave={handleSave}
            saving={upsert.isPending}
            editorEntities={editorEntities}
          />
        </Col>
      </Row>

      <SectionTypeModal
        open={typeModalOpen}
        onClose={() => {
          setTypeModalOpen(false);
          setInsertAt(null);
        }}
        onPickSection={(type) => startCreate(type)}
        onPickPreset={startCreatePreset}
        onApplyTemplate={(id, replace) => applyTemplate.mutate({ templateId: id, replace })}
        hasExistingSections={builderBlocks.length > 0}
      />

      <Modal
        title="نسخ القسم"
        open={!!dupModal}
        onCancel={() => setDupModal(null)}
        okText="نسخ"
        cancelText="إلغاء"
        confirmLoading={duplicate.isPending}
        onOk={() => dupModal && duplicate.mutate({ block: dupModal, mode: dupMode })}
      >
        <Text type="secondary" style={{ display: "block", marginBottom: 12 }}>
          النسخة تُنشأ مخفية — فعّلها بعد المراجعة
        </Text>
        <Radio.Group value={dupMode} onChange={(e) => setDupMode(e.target.value)}>
          <Space direction="vertical">
            <Radio value="after">بعد القسم الأصلي مباشرة</Radio>
            <Radio value="end">في نهاية الصفحة</Radio>
          </Space>
        </Radio.Group>
      </Modal>

      <Drawer title="بيانات الأقسام (JSON)" open={jsonOpen} onClose={() => setJsonOpen(false)} width={720}>
        <Tabs
          items={[
            {
              key: "blocks",
              label: `الأقسام (${builderBlocks.length})`,
              children: <pre className="hb-json-pre">{JSON.stringify(builderBlocks, null, 2)}</pre>,
            },
          ]}
        />
      </Drawer>

      <Modal
        title="استيراد من JSON"
        open={importOpen}
        onCancel={() => setImportOpen(false)}
        okText="استيراد"
        cancelText="إلغاء"
        confirmLoading={importBlocks.isPending}
        onOk={() => importBlocks.mutate(importJson)}
      >
        <Text type="secondary" style={{ display: "block", marginBottom: 12 }}>
          يُضاف في نهاية القائمة الحالية
        </Text>
        <Input.TextArea
          rows={10}
          value={importJson}
          onChange={(e) => setImportJson(e.target.value)}
          placeholder='[{"type":"PRODUCT_LIST","title":"...","payload":{}}]'
          style={{ direction: "ltr", fontFamily: "monospace", fontSize: 12 }}
        />
      </Modal>
    </div>
  );
}
