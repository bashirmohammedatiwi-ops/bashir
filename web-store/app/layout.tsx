import type { Metadata } from "next";

import { Providers } from "@/components/Providers";
import { StoreProvider } from "@/components/StoreProvider";
import { StoreShell } from "@/components/layout/StoreShell";
import { displayStoreName } from "@/lib/config";
import { JsonLd, SITE_URL, organizationJsonLd } from "@/lib/seo";

import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: `${displayStoreName("ar")} — مستحضرات التجميل والعناية`,
    template: `%s — ${displayStoreName("ar")}`,
  },
  description:
    "متجر ديما الحياة لمستحضرات التجميل والعناية في العراق — مكياج، عناية بالبشرة والشعر، عطور وعروض يومية، مع الدفع عند الاستلام وتوصيل سريع.",
  metadataBase: new URL(SITE_URL),
  keywords: [
    "ديما الحياة",
    "مستحضرات تجميل",
    "مكياج العراق",
    "عناية بالبشرة",
    "عناية بالشعر",
    "عطور",
    "تسوق اونلاين العراق",
    "cosmetics Iraq",
  ],
  openGraph: {
    type: "website",
    siteName: displayStoreName("ar"),
    locale: "ar_IQ",
    url: SITE_URL,
    title: `${displayStoreName("ar")} — مستحضرات التجميل والعناية`,
    description: "تسوّقي مستحضرات التجميل والعناية أونلاين مع الدفع عند الاستلام.",
    images: [{ url: "/logo.png", width: 512, height: 512, alt: displayStoreName("ar") }],
  },
  twitter: {
    card: "summary",
    title: displayStoreName("ar"),
    description: "مستحضرات التجميل والعناية مع الدفع عند الاستلام.",
    images: ["/logo.png"],
  },
  robots: { index: true, follow: true },
  alternates: { canonical: "/" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body>
        <JsonLd data={organizationJsonLd()} />
        <Providers>
          <StoreProvider>
            <StoreShell>{children}</StoreShell>
          </StoreProvider>
        </Providers>
      </body>
    </html>
  );
}
