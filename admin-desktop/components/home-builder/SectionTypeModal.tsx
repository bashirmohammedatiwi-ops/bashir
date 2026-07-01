"use client";

import { Modal, Typography } from "antd";
import { SECTION_TYPES, SectionType } from "./section-types";

const { Text, Paragraph } = Typography;

type Props = {
  open: boolean;
  onClose: () => void;
  onPick: (type: SectionType) => void;
};

export function SectionTypeModal({ open, onClose, onPick }: Props) {
  const groups = SECTION_TYPES.reduce(
    (acc, t) => {
      if (!acc[t.group]) acc[t.group] = [];
      acc[t.group].push(t);
      return acc;
    },
    {} as Record<string, typeof SECTION_TYPES>,
  );

  return (
    <Modal
      title="اختر نوع القسم"
      open={open}
      onCancel={onClose}
      footer={null}
      width={720}
      destroyOnClose
      className="hb-type-modal"
    >
      {Object.entries(groups).map(([group, types]) => (
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
                  onPick(t.value);
                  onClose();
                }}
              >
                <span className="hb-type-icon">{t.icon}</span>
                <Text strong className="hb-type-name">
                  {t.label}
                </Text>
                <Paragraph type="secondary" className="hb-type-desc">
                  {t.description}
                </Paragraph>
              </button>
            ))}
          </div>
        </div>
      ))}
    </Modal>
  );
}
