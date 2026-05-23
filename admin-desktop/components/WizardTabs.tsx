"use client";

import { memo } from "react";

export type WizardTabItem = {
  key: string;
  label: string;
  hint?: string;
};

export const WizardTabs = memo(function WizardTabs({
  tabs,
  activeKey,
  onChange,
}: {
  tabs: WizardTabItem[];
  activeKey: string;
  onChange: (key: string) => void;
}) {
  const activeIdx = tabs.findIndex((t) => t.key === activeKey);

  return (
    <div className="alhayaa-wizard">
      <div className="alhayaa-wizard-steps" role="tablist">
        {tabs.map((tab, idx) => {
          const isActive = tab.key === activeKey;
          const isDone = idx < activeIdx;
          return (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={isActive}
              className={`alhayaa-wizard-step${isActive ? " active" : ""}${isDone ? " done" : ""}`}
              onClick={() => onChange(tab.key)}
            >
              <span className="alhayaa-wizard-step-num">{idx + 1}</span>
              <span className="alhayaa-wizard-step-label">{tab.label}</span>
            </button>
          );
        })}
      </div>
      <div className="alhayaa-wizard-hint">
        <kbd>Alt</kbd>+<kbd>←</kbd> <kbd>Alt</kbd>+<kbd>→</kbd> التنقل (حتى داخل الحقول)
        <span className="alhayaa-wizard-hint-sep">•</span>
        <kbd>←</kbd> <kbd>→</kbd> التنقل خارج الحقول
        <span className="alhayaa-wizard-hint-sep">•</span>
        <kbd>Ctrl</kbd>+<kbd>S</kbd> حفظ
        <span className="alhayaa-wizard-hint-sep">•</span>
        <kbd>Esc</kbd> إغلاق
      </div>
    </div>
  );
});
