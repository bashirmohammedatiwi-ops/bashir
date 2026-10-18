import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans_Arabic } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { MobileTabBar } from "@/components/layout/MobileTabBar";
import { CartDrawer } from "@/components/cart/CartDrawer";
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
  openGraph: { type: "website", locale: "ar_IQ", siteName: STORE_NAME, images: ["/logo.png"] },
  icons: { icon: "/logo.png", apple: "/logo.png" },
  alternates: { canonical: "/" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#9B6BD8",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [worlds, world, categories] = await Promise.all([getWorlds(), currentWorld(), getCategories()]);
  const feed = world ? await getHome(world.slug).catch(() => null) : null;
  return (
    <html lang="ar" dir="rtl" className={plex.variable}>
      <body style={worldVars(world)} className="min-h-screen font-sans">
        <Providers settings={feed?.settings ?? {}}>
          <SiteHeader worlds={worlds} current={world} categories={categories} freeShipping={feed?.settings?.freeShippingThreshold ?? 0} />
          <main className="min-h-[60vh] pb-24 md:pb-0">{children}</main>
          <SiteFooter settings={feed?.settings ?? {}} categories={categories} />
          <MobileTabBar />
          <CartDrawer />
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
