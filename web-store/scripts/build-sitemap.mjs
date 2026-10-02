#!/usr/bin/env node
/**
 * يبني sitemap.xml الكامل بعد التصدير (next build) — يسحب المنتجات/البراندات/الفئات
 * من الـ API ويكتبها فوق الخريطة الثابتة. فشل السحب يُبقي الخريطة الأساسية.
 * الاستخدام: node scripts/build-sitemap.mjs [outDir]
 */
import { writeFile } from "node:fs/promises";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const outDir = process.argv[2] ?? "out";
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://deemaalhayat.com").replace(/\/$/, "");
const API_ORIGIN = (process.env.SEO_API_ORIGIN ?? SITE_URL).replace(/\/$/, "");
const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "/api/v1";

async function get(path) {
  const res = await fetch(`${API_ORIGIN}${API_BASE}${path}`, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(12_000),
  });
  if (!res.ok) return null;
  const body = await res.json();
  return body?.data ?? body;
}

const now = new Date().toISOString();
const urls = [
  { loc: `${SITE_URL}/`, changefreq: "daily", priority: "1.0" },
  { loc: `${SITE_URL}/products/`, changefreq: "daily", priority: "0.9" },
  { loc: `${SITE_URL}/offers/`, changefreq: "daily", priority: "0.9" },
  { loc: `${SITE_URL}/categories/`, changefreq: "weekly", priority: "0.8" },
  { loc: `${SITE_URL}/brands/`, changefreq: "weekly", priority: "0.8" },
];

try {
  const [cats, brands] = await Promise.all([
    get("/categories?all=1&minimal=1").catch(() => []),
    get("/brands?all=1").catch(() => []),
  ]);
  for (const c of cats ?? []) if (c?.slug) urls.push({ loc: `${SITE_URL}/category/?slug=${encodeURIComponent(c.slug)}`, changefreq: "weekly", priority: "0.6" });
  for (const b of brands ?? []) if (b?.slug) urls.push({ loc: `${SITE_URL}/brand/?slug=${encodeURIComponent(b.slug)}`, changefreq: "weekly", priority: "0.6" });

  for (let page = 1; page <= 30; page += 1) {
    const batch = (await get(`/products?page=${page}&limit=100&lite=1`).catch(() => null))?.items ?? [];
    for (const p of batch) if (p?.slug) urls.push({ loc: `${SITE_URL}/product/?slug=${encodeURIComponent(p.slug)}`, changefreq: "daily", priority: "0.7" });
    if (batch.length < 100) break;
  }
} catch {
  // الخريطة الأساسية تكفي.
}

const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
  .map((u) => `  <url><loc>${u.loc}</loc><lastmod>${now}</lastmod><changefreq>${u.changefreq}</changefreq><priority>${u.priority}</priority></url>`)
  .join("\n")}\n</urlset>\n`;

const pkg = existsSync("package.json") ? JSON.parse(readFileSync("package.json", "utf8")) : {};
const name = pkg.name ?? "store";
await writeFile(resolve(outDir, "sitemap.xml"), xml, "utf8");
console.log(`[${name}] sitemap.xml: ${urls.length} URLs → ${outDir}/sitemap.xml`);
