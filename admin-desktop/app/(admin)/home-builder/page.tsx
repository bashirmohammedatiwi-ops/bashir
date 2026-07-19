"use client";

import {
  CloudDownloadOutlined,
  CloudUploadOutlined,
  EyeOutlined,
  LayoutOutlined,
  MobileOutlined,
  PlusOutlined,
  ReloadOutlined,
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
  Row,
  Space,
  Statistic,
  Tabs,
  Typography,
  message,
} from "antd";
import type { MenuProps } from "antd";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo, useState } from "react";
import { HomePhonePreview } from "@/components/home-builder/HomePhonePreview";
import { SectionEditorPanel } from "@/components/home-builder/SectionEditorPanel";
import { SectionListPanel } from "@/components/home-builder/SectionListPanel";
import { SectionTypeModal } from "@/components/home-builder/SectionTypeModal";
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
  const [editorTab, setEditorTab] = useState("content");
  const [previewOpen, setPreviewOpen] = useState(true);
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
      message.success("تم النسخ — القسم الجديد مخفي حتى تفعّله");
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

  function startCreate(type: SectionType) {
    const def = SECTION_TYPES.find((t) => t.value === type)!;
    setEditing(null);
    setIsNew(true);
    setSelectedId(DRAFT_SECTION_ID);
    setEditorTab("content");
    setTypeModalOpen(false);
    form.resetFields();
    form.setFieldsValue({
      type,
      isActive: true,
      position: insertAt ?? sorted.length,
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
            رتّب الأقسام وحرّر محتواها — المعاينة على اليمين تعكس ما يراه العميل في التطبيق
          </Text>
        </div>
        <Space wrap>
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
                setSelectedId(id);
                const b = sorted.find((x) => x.id === id);
                if (b) openEdit(b);
              }}
              onAdd={openAdd}
              onEdit={openEdit}
              onMove={moveBlock}
              onDuplicate={(b) => duplicate.mutate(b)}
              onDelete={(id) => remove.mutate(id)}
              onToggle={(id, active) => toggle.mutate({ id, isActive: active })}
              onReorder={(ids) => reorder.mutate(ids)}
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
            onSave={() => upsert.mutate()}
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
                <Button
                  size="small"
                  type="text"
                  loading={previewLoading}
                  onClick={() => refetchPreview()}
                >
                  تحديث
                </Button>
              }
            >
              <HomePhonePreview
                blocks={previewBlocks}
                previewSections={previewSections}
                selectedId={selectedId}
                draftId={DRAFT_SECTION_ID}
                onSelectSection={(id) => {
                  setSelectedId(id);
                  if (id === DRAFT_SECTION_ID) return;
                  const b = sorted.find((x) => x.id === id);
                  if (b) openEdit(b);
                }}
              />
              <Text type="secondary" className="hb-preview-hint">
                انقر على قسم في المعاينة للتحرير — التغييرات غير المحفوظة تظهر فوراً للقسم المحدد
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
        onApplyTemplate={(id, replace) => applyTemplate.mutate({ templateId: id, replace })}
        hasExistingSections={sorted.length > 0}
      />

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
