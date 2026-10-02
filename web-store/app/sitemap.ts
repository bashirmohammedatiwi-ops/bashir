import type { MetadataRoute } from "next";

import { SITE_URL } from "@/lib/seo";

/// الصفحات الأساسية — يُصدَّر ثابتاً مع output:export.
/// المنتجات/البراندات/الفئات يضيفها scripts/build-sitemap.mjs بعد البناء.
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/products/`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/offers/`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/categories/`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE_URL}/brands/`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
  ];
}
