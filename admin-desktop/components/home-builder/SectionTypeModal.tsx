"use client";

import { Checkbox, Input, Modal, Typography } from "antd";
import { useMemo, useRef, useState } from "react";
import { SECTION_PRESETS } from "./section-presets";
import { PAGE_TEMPLATES } from "./section-templates";
import { BUILDER_SECTION_TYPES, SECTION_TYPES, SectionType } from "./section-types";

const { Text, Paragraph } = Typography;

type Props = {
  open: boolean;
  onClose: () => void;
  onPickSection: (type: SectionType) => void;
  onPickPreset: (presetId: string) => void;
  onApplyTemplate: (templateId: string, replace?: boolean) => void;
  hasExistingSections: boolean;
};

export function SectionTypeModal({
  open,
  onClose,
  onPickSection,
  onPickPreset,
  onApplyTemplate,
  hasExistingSections,
}: Props) {
  const [tab, setTab] = useState<"presets" | "sections" | "templates">("presets");
  const [search, setSearch] = useState("");
  const replaceRef = useRef(false);

  const groups = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = BUILDER_SECTION_TYPES.filter(
      (t) =>
        !q ||
        t.label.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.group.toLowerCase().includes(q),
    );
    return filtered.reduce(
      (acc, t) => {
        if (!acc[t.group]) acc[t.group] = [];
        acc[t.group].push(t);
        return acc;
      },
      {} as Record<string, typeof SECTION_TYPES>,
    );
  }, [search]);

  const filteredTemplates = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return PAGE_TEMPLATES;
    return PAGE_TEMPLATES.filter(
      (t) => t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q),
    );
  }, [search]);

  const filteredPresets = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return SECTION_PRESETS;
    return SECTION_PRESETS.filter(
      (p) =>
        p.label.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.type.toLowerCase().includes(q),
    );
  }, [search]);

  function applyTemplate(id: string) {
    if (hasExistingSections) {
      replaceRef.current = false;
      Modal.confirm({
        title: "تطبيق القالب؟",
        content: (
          <div>
            <Paragraph style={{ marginBottom: 12 }}>
              يمكنك إضافة أقسام القالب في نهاية الصفحة، أو استبدال كل الأقسام الحالية.
            </Paragraph>
            <Checkbox onChange={(e) => { replaceRef.current = e.target.checked; }}>
              استبدال الأقسام الحالية (حذف الكل ثم تطبيق القالب)
            </Checkbox>
          </div>
        ),
        okText: "تطبيق",
        cancelText: "إلغاء",
        onOk: () => {
          onApplyTemplate(id, replaceRef.current);
          onClose();
        },
      });
    } else {
      onApplyTemplate(id, false);
      onClose();
    }
  }

  return (
    <Modal
      title={null}
      open={open}
      onCancel={onClose}
      footer={null}
      width={860}
      destroyOnClose
      className="hb-type-modal"
      afterClose={() => {
        setSearch("");
        setTab("presets");
      }}
    >
      <div className="hb-type-modal-head">
        <div>
          <Text strong style={{ fontSize: 18 }}>مكتبة الأقسام والقوالب</Text>
          <Paragraph type="secondary" style={{ margin: 0 }}>
            ابدأ بقالب جاهز، أو أضف قسماً واحداً، أو طبّق صفحة كاملة
          </Paragraph>
        </div>
        <div className="hb-type-tabs">
          <button
            type="button"
            className={`hb-type-tab${tab === "presets" ? " active" : ""}`}
            onClick={() => setTab("presets")}
          >
            سريع ({SECTION_PRESETS.length})
          </button>
          <button
            type="button"
            className={`hb-type-tab${tab === "sections" ? " active" : ""}`}
            onClick={() => setTab("sections")}
          >
            أقسام ({BUILDER_SECTION_TYPES.length})
          </button>
          <button
            type="button"
            className={`hb-type-tab${tab === "templates" ? " active" : ""}`}
            onClick={() => setTab("templates")}
          >
            صفحات ({PAGE_TEMPLATES.length})
          </button>
        </div>
      </div>

      <Input.Search
        placeholder={
          tab === "presets"
            ? "ابحث عن قالب سريع..."
            : tab === "sections"
              ? "ابحث عن نوع قسم..."
              : "ابحث عن قالب صفحة..."
        }
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        allowClear
        size="large"
        style={{ marginBottom: 20 }}
      />

      {tab === "presets" ? (
        <div className="hb-preset-grid">
          {filteredPresets.map((preset) => (
            <button
              key={preset.id}
              type="button"
              className="hb-preset-card"
              style={{ "--hb-accent": preset.accent } as React.CSSProperties}
              onClick={() => {
                onPickPreset(preset.id);
                onClose();
              }}
            >
              <span className="hb-preset-icon">{preset.icon}</span>
              <Text strong className="hb-preset-name">{preset.label}</Text>
              <Paragraph type="secondary" className="hb-preset-desc">{preset.description}</Paragraph>
            </button>
          ))}
        </div>
      ) : tab === "sections" ? (
        Object.entries(groups).map(([group, types]) => (
          <div key={group} className="hb-type-group">
            <Text className="hb-type-group-label">{group}</Text>
            <div className="hb-type-grid">
              {types.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  className="hb-type-card"
                  style={{ "--hb-accent": t.color } as React.CSSProperties}
                  onClick={() => {
                    onPickSection(t.value);
                    onClose();
                  }}
                >
                  <span className="hb-type-icon">{t.icon}</span>
                  <Text strong className="hb-type-name">{t.label}</Text>
                  <Paragraph type="secondary" className="hb-type-desc">{t.description}</Paragraph>
                </button>
              ))}
            </div>
          </div>
        ))
      ) : (
        <div className="hb-template-grid">
          {filteredTemplates.map((tpl) => (
            <button
              key={tpl.id}
              type="button"
              className="hb-template-card"
              style={{ "--hb-accent": tpl.accent } as React.CSSProperties}
              onClick={() => applyTemplate(tpl.id)}
            >
              <span className="hb-template-icon">{tpl.icon}</span>
              <Text strong className="hb-template-name">{tpl.name}</Text>
              <Paragraph type="secondary" className="hb-template-desc">{tpl.description}</Paragraph>
              <div className="hb-template-meta">
                {tpl.sections.length} أقسام
                <span className="hb-template-preview">
                  {tpl.sections.slice(0, 4).map((s, i) => (
                    <span key={i} title={s.type}>
                      {SECTION_TYPES.find((t) => t.value === s.type)?.icon ?? "📦"}
                    </span>
                  ))}
                  {tpl.sections.length > 4 && <span>+{tpl.sections.length - 4}</span>}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </Modal>
  );
}
