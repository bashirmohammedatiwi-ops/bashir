import type { Metadata } from "next";

import { Providers } from "@/components/Providers";
import { StoreShell } from "@/components/layout/StoreShell";
import { displayStoreName } from "@/lib/config";

import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: `${displayStoreName("ar")} — مستحضرات التجميل والعناية`,
    template: `%s — ${displayStoreName("ar")}`,
  },
  description:
    "متجر ديما الحياة لمستحضرات التجميل والعناية. تسوّقي أونلاين مع الدفع عند الاستلام.",
  metadataBase: new URL("https://deemaalhayat.com"),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body>
        <Providers>
          <StoreShell>{children}</StoreShell>
        </Providers>
      </body>
    </html>
  );
}
