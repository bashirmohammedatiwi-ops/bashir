"use client";

import {
  CloudDownloadOutlined,
  CloudUploadOutlined,
  EyeOutlined,
  LayoutOutlined,
  MinusOutlined,
  MobileOutlined,
  PlusOutlined,
  ReloadOutlined,
  UndoOutlined,
} from "@ant-design/icons";
import {
  Button,
  Card,
  Col,
  Drawer,
  Dropdown,
  Form,
  Input,
  Modal,
  Radio,
  Row,
  Segmented,
  Space,
  Statistic,
  Switch,
  Tabs,
  Typography,
  message,
} from "antd";
import type { MenuProps } from "antd";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PhoneCanvas } from "@/components/home-builder/PhoneCanvas";
import { SectionEditorPanel } from "@/components/home-builder/SectionEditorPanel";
import { SectionListPanel } from "@/components/home-builder/SectionListPanel";
import { SectionTypeModal } from "@/components/home-builder/SectionTypeModal";
import type { DeviceSize } from "@/components/home-builder/StudioToolbar";
import { filterPreviewBlocks, resolveBlockPreview } from "@/components/home-builder/preview-resolver";
import { PAGE_TEMPLATES } from "@/components/home-builder/section-templates";
import { SECTION_PRESETS } from "@/components/home-builder/section-presets";
import {
  SECTION_TYPES,
  SectionType,
  normalizePayload,
} from "@/components/home-builder/section-types";
import { countWarnings, sectionHasErrors } from "@/components/home-builder/section-validation";
import { mutations, queries } from "@/lib/queries";
import "@/components/home-builder/home-builder.css";

const { Title, Text } = Typography;

const DRAFT_SECTION_ID = "__draft__";

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
  const [jsonOpen, setJsonOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [importJson, setImportJson] = useState("");
  const [editing, setEditing] = useState<any | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editorTab, setEditorTab] = useState("basics");
  const [previewOpen, setPreviewOpen] = useState(true);
  const [previewZoom, setPreviewZoom] = useState(0.85);
  const [previewDevice, setPreviewDevice] = useState<DeviceSize>("390");
  const [showInactivePreview, setShowInactivePreview] = useState(false);
  const [dupModal, setDupModal] = useState<any | null>(null);
  const [dupMode, setDupMode] = useState<"after" | "end">("after");
  const [bulkSelected, setBulkSelected] = useState<string[]>([]);
  const undoStack = useRef<any[][]>([]);
  const [form] = Form.useForm();
  const draftValues = Form.useWatch([], form);

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
  const {
    data: liveFeed,
    isFetching: previewLoading,
    refetch: refetchPreview,
  } = useQuery({
    queryKey: ["home-preview"],
    queryFn: queries.homePreview,
    staleTime: 15_000,
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

  const activeCount = sorted.filter((b) => b.isActive !== false).length;
  const { errors: errorCount, warns: warnCount } = useMemo(() => countWarnings(sorted), [sorted]);

  const previewBlocks = useMemo(() => {
    if (!isNew || !draftValues?.type) return sorted;
    const draft = {
      id: DRAFT_SECTION_ID,
      type: draftValues.type as string,
      title: draftValues.title,
      subtitle: draftValues.subtitle,
      isActive: true,
      position: insertAt ?? sorted.length,
      payload: (draftValues.payload ?? {}) as Record<string, unknown>,
    };
    const copy = [...sorted];
    const at = Math.min(insertAt ?? sorted.length, copy.length);
    copy.splice(at, 0, draft);
    return copy;
  }, [sorted, isNew, draftValues, insertAt]);

  const previewSections = useMemo(() => {
    const apiSections: any[] = liveFeed?.sections ?? [];
    const apiMap = new Map(apiSections.map((s) => [s.id, s]));

    return previewBlocks.map((block) => {
      const apiSec = block.id === DRAFT_SECTION_ID ? null : apiMap.get(block.id);
      const isDraftTarget =
        block.id === DRAFT_SECTION_ID ||
        (editing?.id && editing.id === block.id) ||
        (isNew && selectedId === block.id);
      const draftBlock = isDraftTarget && draftValues
        ? {
            ...block,
            type: draftValues.type ?? block.type,
            title: draftValues.title ?? block.title,
            subtitle: draftValues.subtitle ?? block.subtitle,
            payload: { ...block.payload, ...(draftValues.payload ?? {}) },
          }
        : block;
      const local = resolveBlockPreview(draftBlock, editorEntities, apiSec);
      if (apiSec && !isDraftTarget) return apiSec;
      return {
        id: block.id,
        type: draftBlock.type,
        title: draftBlock.title,
        subtitle: draftBlock.subtitle,
        ...local,
        promoStrip:
          draftBlock.type === "PROMO_STRIP"
            ? {
                text: (draftBlock.payload?.text as string) ?? "",
                backgroundColor: draftBlock.payload?.backgroundColor,
                linkType: draftBlock.payload?.linkType,
                linkValue: draftBlock.payload?.linkValue,
              }
            : apiSec?.promoStrip,
      };
    });
  }, [previewBlocks, liveFeed, editorEntities, editing, isNew, selectedId, draftValues]);

  const canvasBlocks = useMemo(
    () => filterPreviewBlocks(previewBlocks, { showInactive: showInactivePreview }),
    [previewBlocks, showInactivePreview],
  );

  function pushUndo() {
    if (sorted.length) undoStack.current = [...undoStack.current.slice(-9), sorted.map((b) => ({ ...b }))];
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
    const type = form.getFieldValue("type") as SectionType;
    const block = {
      type,
      title: form.getFieldValue("title"),
      isActive: form.getFieldValue("isActive"),
      payload: form.getFieldValue("payload"),
    };
    if (sectionHasErrors(block)) {
      message.error("أصلح الأخطاء الحمراء قبل الحفظ");
      setEditorTab("content");
      return;
    }
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
      const idx = sorted.findIndex((b) => b.id === selectedId);
      if (idx < 0) return;
      if (e.key === "ArrowUp" && idx > 0) {
        e.preventDefault();
        const b = sorted[idx - 1];
        guardUnsaved(() => openEdit(b));
      }
      if (e.key === "ArrowDown" && idx < sorted.length - 1) {
        e.preventDefault();
        const b = sorted[idx + 1];
        guardUnsaved(() => openEdit(b));
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedId, isNew, sorted, typeModalOpen, dupModal, editing]);

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
      message.success(editing?.id ? "تم الحفظ" : "تمت الإضافة");
      const newId = result?.id ?? result?.data?.id;
      if (isNew && insertAt != null && newId) {
        const ids = sorted.map((b) => b.id);
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
    mutationFn: async ({ block, mode }: { block: any; mode: "after" | "end" }) => {
      pushUndo();
      const payload = cleanPayload(block.type, block.payload ?? {});
      const result = await mutations.createHomeBlock({
        type: block.type,
        title: block.title ? `${block.title} (نسخة)` : undefined,
        subtitle: block.subtitle,
        position: sorted.length,
        isActive: false,
        payload,
      });
      const newId = result?.id ?? result?.data?.id;
      if (newId && mode === "after") {
        const idx = sorted.findIndex((b) => b.id === block.id);
        if (idx >= 0) {
          const ids = sorted.map((b) => b.id);
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
      qc.invalidateQueries({ queryKey: ["home-preview"] });
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
      const basePos = replace ? 0 : sorted.length;
      for (let i = 0; i < tpl.sections.length; i++) {
        const s = tpl.sections[i];
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
    onError: () => message.error("JSON غير صالح"),
  });

  const openAdd = useCallback(() => {
    setInsertAt(sorted.length);
    setTypeModalOpen(true);
  }, [sorted.length]);

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
    const def = SECTION_TYPES.find((t) => t.value === type)!;
    setEditing(null);
    setIsNew(true);
    setSelectedId(DRAFT_SECTION_ID);
    setEditorTab("basics");
    setTypeModalOpen(false);
    form.resetFields();
    form.setFieldsValue({
      type,
      title: preset?.title,
      subtitle: preset?.subtitle,
      isActive: true,
      position: insertAt ?? sorted.length,
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
      setEditorTab("basics");
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
    const idx = sorted.findIndex((b) => b.id === id);
    const next = idx + dir;
    if (next < 0 || next >= sorted.length) return;
    const ids = sorted.map((b) => b.id);
    [ids[idx], ids[next]] = [ids[next], ids[idx]];
    reorder.mutate(ids);
  }

  function exportSelectedJson() {
    const data = sorted.filter((b) => bulkSelected.includes(b.id));
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
    qc.invalidateQueries({ queryKey: ["home-preview"] });
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

  const toolsMenu: MenuProps = {
    items: [
      { key: "export", icon: <CloudDownloadOutlined />, label: "تصدير JSON", onClick: exportJson },
      { key: "import", icon: <CloudUploadOutlined />, label: "استيراد JSON", onClick: () => setImportOpen(true) },
      { key: "json", label: "عرض البيانات", onClick: () => setJsonOpen(true) },
    ],
  };

  return (
    <div className="hb-page">
      <div className="hb-page-header">
        <div>
          <Title level={4} style={{ margin: 0 }}>
            بناء الصفحة الرئيسية
          </Title>
          <Text type="secondary">
            رتّب الأقسام وحرّر محتواها — المعاينة تعكس واجهة التطبيق (cream + sage)
            {process.env.NEXT_PUBLIC_BUILD_SHA ? (
              <span style={{ marginInlineStart: 8, fontSize: 11, opacity: 0.65 }}>
                · build {process.env.NEXT_PUBLIC_BUILD_SHA}
              </span>
            ) : null}
          </Text>
        </div>
        <Space wrap>
          <Button icon={<UndoOutlined />} onClick={handleUndo}>
            تراجع
          </Button>
          <Button icon={<ReloadOutlined />} onClick={() => { refetch(); refetchPreview(); }}>
            تحديث
          </Button>
          <Button
            icon={<EyeOutlined />}
            type={previewOpen ? "primary" : "default"}
            ghost={previewOpen}
            onClick={() => setPreviewOpen((v) => !v)}
            className="hb-preview-toggle"
          >
            المعاينة
          </Button>
          <Dropdown menu={toolsMenu}>
            <Button>أدوات</Button>
          </Dropdown>
          <Button icon={<LayoutOutlined />} onClick={() => setTypeModalOpen(true)}>
            قوالب
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={openAdd}>
            إضافة قسم
          </Button>
        </Space>
      </div>

      <Row gutter={[12, 12]} className="hb-stats-row">
        <Col xs={12} sm={6}>
          <Card size="small"><Statistic title="إجمالي الأقسام" value={sorted.length} /></Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small"><Statistic title="نشط" value={activeCount} valueStyle={{ color: "#52c41a" }} /></Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small"><Statistic title="مخفي" value={sorted.length - activeCount} /></Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic
              title="تنبيهات"
              value={errorCount + warnCount}
              valueStyle={{ color: errorCount ? "#ff4d4f" : warnCount ? "#faad14" : undefined }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={16} className="hb-workspace">
        <Col xs={24} xl={previewOpen ? 7 : 9}>
          <Card title="ترتيب الأقسام" className="hb-list-card" styles={{ body: { padding: 0 } }}>
            <SectionListPanel
              blocks={sorted}
              selectedId={selectedId}
              loading={isLoading}
              onSelect={(id) => {
                guardUnsaved(() => {
                  setSelectedId(id);
                  const b = sorted.find((x) => x.id === id);
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
          </Card>
        </Col>

        <Col xs={24} xl={previewOpen ? 10 : 15}>
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

        {previewOpen && (
          <Col xs={24} xl={7}>
            <Card
              className="hb-preview-card"
              title={
                <Space>
                  <MobileOutlined />
                  <span>معاينة التطبيق</span>
                </Space>
              }
              extra={
                <Space wrap size={4}>
                  <Switch
                    size="small"
                    checked={showInactivePreview}
                    onChange={setShowInactivePreview}
                    checkedChildren="كل"
                    unCheckedChildren="نشط"
                  />
                  <Segmented
                    size="small"
                    value={previewDevice}
                    onChange={(v) => setPreviewDevice(v as DeviceSize)}
                    options={["375", "390", "414"]}
                  />
                  <Button size="small" type="text" icon={<MinusOutlined />} onClick={() => setPreviewZoom((z) => Math.max(0.7, z - 0.05))} />
                  <Text type="secondary" style={{ fontSize: 11 }}>{Math.round(previewZoom * 100)}%</Text>
                  <Button size="small" type="text" icon={<PlusOutlined />} onClick={() => setPreviewZoom((z) => Math.min(1.2, z + 0.05))} />
                  <Button size="small" type="text" loading={previewLoading} onClick={() => refetchPreview()}>
                    تحديث
                  </Button>
                </Space>
              }
            >
              <PhoneCanvas
                blocks={canvasBlocks}
                previewSections={previewSections}
                selectedId={selectedId}
                zoom={previewZoom}
                deviceSize={previewDevice}
                onSelect={(id) => {
                  guardUnsaved(() => {
                    setSelectedId(id);
                    if (id === DRAFT_SECTION_ID) return;
                    const b = sorted.find((x) => x.id === id);
                    if (b) openEdit(b);
                  });
                }}
                onEdit={openEdit}
                onAddAt={openInsertAt}
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
              />
              <Text type="secondary" className="hb-preview-hint">
                WYSIWYG — ⌘S حفظ · ↑↓ التنقل · انقر القسم للتحرير · + بين الأقسام
              </Text>
            </Card>
          </Col>
        )}
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
        hasExistingSections={sorted.length > 0}
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
              label: `الأقسام (${sorted.length})`,
              children: <pre className="hb-json-pre">{JSON.stringify(sorted, null, 2)}</pre>,
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
