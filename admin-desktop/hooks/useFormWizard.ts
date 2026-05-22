import { useCallback, useEffect } from "react";

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  if (target.isContentEditable) return true;
  if (target.closest(".ant-select-dropdown, .ant-picker-dropdown, .ant-modal")) return true;
  return false;
}

type WizardOptions = {
  enabled?: boolean;
  onSave?: () => void;
  onClose?: () => void;
};

export function useFormWizard(
  tabKeys: string[],
  activeTab: string,
  setActiveTab: (key: string) => void,
  options?: WizardOptions,
) {
  const goNext = useCallback(() => {
    const idx = tabKeys.indexOf(activeTab);
    if (idx >= 0 && idx < tabKeys.length - 1) setActiveTab(tabKeys[idx + 1]!);
  }, [activeTab, setActiveTab, tabKeys]);

  const goPrev = useCallback(() => {
    const idx = tabKeys.indexOf(activeTab);
    if (idx > 0) setActiveTab(tabKeys[idx - 1]!);
  }, [activeTab, setActiveTab, tabKeys]);

  useEffect(() => {
    if (!options?.enabled) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey && (e.key === "s" || e.key === "S")) {
        e.preventDefault();
        options.onSave?.();
        return;
      }

      if (e.key === "Escape" && !isTypingTarget(e.target)) {
        e.preventDefault();
        options.onClose?.();
        return;
      }

      if (isTypingTarget(e.target)) return;

      if (e.key === "ArrowLeft") {
        e.preventDefault();
        goNext();
        return;
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        goPrev();
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goNext, goPrev, options?.enabled, options?.onClose, options?.onSave]);

  return { goNext, goPrev };
}
