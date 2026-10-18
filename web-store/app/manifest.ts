import type { MetadataRoute } from "next";

/** تطبيق ويب قابل للتثبيت (أضيفي للشاشة الرئيسية). */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ديما الحياة — مستحضرات تجميل أصلية",
    short_name: "ديما الحياة",
    description: "تسوّقي مستحضرات التجميل والعناية والعطور الأصلية مع توصيل لكل العراق.",
    start_url: "/?source=pwa",
    scope: "/",
    display: "standalone",
    dir: "rtl",
    lang: "ar",
    background_color: "#F8F6FB",
    theme_color: "#9B6BD8",
    categories: ["shopping", "beauty", "lifestyle"],
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "العروض", url: "/offers", icons: [{ src: "/icon-192.png", sizes: "192x192" }] },
      { name: "اسألي ديما", url: "/advisor", icons: [{ src: "/icon-192.png", sizes: "192x192" }] },
      { name: "طلباتي", url: "/account/orders", icons: [{ src: "/icon-192.png", sizes: "192x192" }] },
    ],
    related_applications: [{ platform: "play", id: "com.deemaalhayat.app", url: "https://play.google.com/store/apps/details?id=com.deemaalhayat.app" }],
  };
}
