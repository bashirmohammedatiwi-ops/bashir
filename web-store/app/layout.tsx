import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans_Arabic } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { MobileTabBar } from "@/components/layout/MobileTabBar";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { AdvisorLauncher } from "@/components/advisor/AdvisorLauncher";
import { QuickView } from "@/components/product/QuickView";
import { AppBanner } from "@/components/layout/AppBanner";
import { Toaster } from "@/components/ui/Toaster";
import { currentWorld, getCategories, getHome, getWorlds } from "@/lib/data";
import { worldVars } from "@/lib/theme";
import { SITE_URL, STORE_NAME, STORE_TAGLINE } from "@/lib/config";

const plex = IBM_Plex_Sans_Arabic({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-plex",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: `${STORE_NAME} — ${STORE_TAGLINE}`, template: `%s | ${STORE_NAME}` },
  description: "تسوّقي مستحضرات التجميل والعناية والعطور الأصلية من أشهر الماركات العالمية، مع توصيل لكل محافظات العراق والدفع عند الاستلام أو بالبطاقة.",
  applicationName: STORE_NAME,
  openGraph: { type: "website", locale: "ar_IQ", siteName: STORE_NAME, images: [{ url: "/og.png", width: 1200, height: 630 }] },
  twitter: { card: "summary_large_image", images: ["/og.png"] },
  icons: { icon: [{ url: "/favicon.ico", sizes: "any" }, { url: "/favicon-48.png", sizes: "48x48", type: "image/png" }, { url: "/icon-192.png", sizes: "192x192", type: "image/png" }], apple: "/apple-touch-icon.png" },
  appleWebApp: { capable: true, title: STORE_NAME, statusBarStyle: "default" },
  alternates: { canonical: "/" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#8A55C9",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [worlds, world, categories] = await Promise.all([getWorlds(), currentWorld(), getCategories()]);
  const feed = world ? await getHome(world.slug).catch(() => null) : null;
  return (
    <html lang="ar" dir="rtl" className={plex.variable}>
      <body style={worldVars(world)} className="min-h-screen font-sans">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify([
              { "@context": "https://schema.org", "@type": "OnlineStore", name: STORE_NAME, url: SITE_URL, logo: `${SITE_URL}/logo.png`, areaServed: "IQ", currenciesAccepted: "IQD" },
              { "@context": "https://schema.org", "@type": "WebSite", name: STORE_NAME, url: SITE_URL, inLanguage: "ar", potentialAction: { "@type": "SearchAction", target: `${SITE_URL}/search?q={search_term_string}`, "query-input": "required name=search_term_string" } },
            ]),
          }}
        />
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:right-3 focus:top-3 focus:z-[100] focus:rounded-full focus:bg-ink focus:px-4 focus:py-2 focus:text-white">
          تخطي إلى المحتوى
        </a>
        <Providers settings={feed?.settings ?? {}}>
          <SiteHeader worlds={worlds} current={world} categories={categories} freeShipping={feed?.settings?.freeShippingThreshold ?? 0} />
          <main id="main" className="min-h-[60vh] pb-24 md:pb-0">{children}</main>
          <SiteFooter settings={feed?.settings ?? {}} categories={categories} />
          <MobileTabBar />
          <CartDrawer />
          <AdvisorLauncher />
          <QuickView />
          <AppBanner />
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
