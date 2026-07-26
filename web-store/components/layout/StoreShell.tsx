import type { ReactNode } from "react";

import { SiteFooter } from "./SiteFooter";
import { SiteHeader } from "./SiteHeader";

export function StoreShell({ children }: { children: ReactNode }) {
  return (
    <div className="store-shell">
      <SiteHeader />
      <main className="store-main">{children}</main>
      <SiteFooter />
    </div>
  );
}
