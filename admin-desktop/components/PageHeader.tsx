"use client";

import { ReactNode } from "react";

export function PageHeader({
  title,
  subtitle,
  extra,
}: {
  title: string;
  subtitle?: string;
  extra?: ReactNode;
}) {
  return (
    <header className="alhayaa-page-header">
      <div>
        <h1 className="alhayaa-page-title">{title}</h1>
        {subtitle ? <p className="alhayaa-page-subtitle">{subtitle}</p> : null}
      </div>
      {extra ? <div className="alhayaa-page-extra">{extra}</div> : null}
    </header>
  );
}
