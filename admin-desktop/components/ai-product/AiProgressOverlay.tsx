"use client";

import { Progress, Spin } from "antd";
import { useEffect, useState } from "react";

export type AiProgressState = {
  open: boolean;
  title: string;
  stageLabel: string;
  detail?: string;
  percent: number;
  stageIndex: number;
  totalStages: number;
};

type Props = {
  state: AiProgressState;
};

export function AiProgressOverlay({ state }: Props) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!state.open) {
      setElapsed(0);
      return;
    }
    const t0 = Date.now();
    const id = window.setInterval(() => {
      setElapsed(Math.floor((Date.now() - t0) / 1000));
    }, 1000);
    return () => window.clearInterval(id);
  }, [state.open]);

  if (!state.open) return null;

  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;
  const timeLabel = mins > 0 ? `${mins}:${String(secs).padStart(2, "0")}` : `${secs} ث`;

  return (
    <div className="ai-progress-overlay" role="status" aria-live="polite">
      <div className="ai-progress-card">
        <Spin size="large" />
        <strong className="ai-progress-title">{state.title}</strong>
        <div className="ai-progress-stage">
          المرحلة {state.stageIndex + 1} من {state.totalStages}: {state.stageLabel}
        </div>
        {state.detail ? <div className="ai-progress-detail">{state.detail}</div> : null}
        <Progress
          percent={state.percent}
          status="active"
          strokeColor={{ from: "#d4b56a", to: "#6b3fa0" }}
          trailColor="rgba(107, 63, 160, 0.12)"
        />
        <div className="ai-progress-meta">
          <span>الوقت: {timeLabel}</span>
          <span>لا تغلق الصفحة</span>
        </div>
      </div>
    </div>
  );
}
