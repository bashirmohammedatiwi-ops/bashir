/**
 * Huda Beauty #FauxFilter Skin Finish Buildable Coverage Foundation Stick.
 * 39 shades; shade barcodes intentionally omitted.
 * Product barcode: 6291106035254 (120B Vanilla).
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
const root = dirname(fileURLToPath(import.meta.url));
const API = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const email = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com", password = process.env.ADMIN_PASSWORD ?? "000000";
const MAKEUP = "d3c24d19-dde5-41e5-b0a9-bede45393795", FACE = "2bbecee1-084d-446c-b4fd-65f769130de9", FOUNDATION = "036b1b3c-aa73-4dd1-bdd2-1a12f193645a";
const PRICE = 65000, ORIGINAL = 75000;
const built = JSON.parse(readFileSync(join(root, "data/huda-fauxfilter-shades-built.json"), "utf8")) as { shades: { name: string; colorHex: string; imageUrl: string; position: number }[]; productImages: string[] };
let token = "";
async function api<T>(path: string, method = "GET", body?: unknown): Promise<T> {
  const r = await fetch(`${API}${path}`, { method, headers: { Accept: "application/json", Authorization: `Bearer ${token}`, ...(body ? { "Content-Type": "application/json" } : {}) }, body: body ? JSON.stringify(body) : undefined });
  const j = await r.json().catch(() => ({})); if (!r.ok) throw new Error(`${method} ${path}: ${j?.message ?? r.statusText}`); return (j.data ?? j) as T;
}
async function upload(url: string, name: string) {
  const r = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0", Accept: "image/*" } }); if (!r.ok) throw new Error(`Image ${r.status}`);
  const type = (r.headers.get("content-type") ?? "image/jpeg").split(";")[0], form = new FormData();
  form.append("file", new Blob([await r.arrayBuffer()], { type }), `${name}.${type.includes("png") ? "png" : "jpg" }`); form.append("purpose", "PRODUCT");
  const out = await fetch(`${API}/media/upload`, { method: "POST", headers: { Authorization: `Bearer ${token}`, Accept: "application/json" }, body: form });
  const j = await out.json(); if (!out.ok) throw new Error(j?.message ?? "Upload failed"); return (j.data ?? j).id as string;
}
async function main() {
  const l = await fetch(`${API}/auth/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
  const lj = await l.json(); token = lj.data?.accessToken ?? lj.accessToken; if (!token) throw new Error("Login failed");
  const barcode = "6291106035254", slug = "huda-beauty-fauxfilter-skin-finish-buildable-coverage-foundation-stick";
  const check = await api<{ exists: boolean; product?: { id: string } }>(`/products/barcode-check?barcode=${barcode}`);
  if (check.exists && check.product) await api(`/products/${check.product.id}`, "DELETE");
  const old = await api<{ data?: { id: string; slug?: string }[] }>(`/products?search=${encodeURIComponent(slug)}&status=all&limit=20`);
  for (const p of old.data ?? []) if (p.slug === slug) await api(`/products/${p.id}`, "DELETE");
  const brand = await api<{ brand?: { id: string } }>("/brands/resolve", "POST", { brandAr: "هودا بيوتي", brandEn: "Huda Beauty", createIfMissing: true });
  const galleryIds: string[] = [];
  for (let i = 0; i < built.productImages.length; i++) galleryIds.push(await upload(built.productImages[i], `huda-foundation-stick-gallery-${i}`));
  const shades = [], shadeImageIds: string[] = [];
  for (const s of built.shades) {
    const imageId = await upload(s.imageUrl, `huda-foundation-stick-${s.name.replace(/\s+/g, "-")}`);
    shadeImageIds.push(imageId);
    shades.push({ name: s.name, colorHex: s.colorHex, imageId, position: s.position, stock: 0, price: PRICE, originalPrice: ORIGINAL });
  }
  const namesAr = built.shades.map((s) => `• ${s.name}`).join("\n");
  const ar = "فاونديشن ستيك #FauxFilter Skin Finish من هودا بيوتي — كريم أساس فاخر بقوام كريمي خفيف يذوب على البشرة ويمنح تغطية قابلة للبناء ومظهراً طبيعياً مفلترًا.\n\n• تغطية قابلة للتخصيص من خفيفة إلى كاملة.\n• ثبات يصل إلى 10 ساعات مع مقاومة الماء والعرق والرطوبة.\n• لمسة طبيعية تشبه البشرة وتساعد على توحيد اللون وتنعيم مظهر المسام.\n• خالٍ من العطر، فيغن، غير كوميدوجينيك ومناسب لجميع أنواع البشرة.\n• تصميم ستيك عملي للمكياج السريع والتعديلات أثناء اليوم.\n• الحجم: 12.5 غرام.\n\nالدرجات المتوفرة:\n" + namesAr;
  const en = "Huda Beauty #FauxFilter Skin Finish Buildable Coverage Foundation Stick — a luxurious creamy stick foundation that melts into skin for a natural, filtered-looking finish.\n\n• Customizable coverage from light to full.\n• Up to 10-hour wear; waterproof, humidity- and sweat-resistant.\n• Natural skin-like finish that evens tone and softens the look of pores.\n• Fragrance-free, vegan, non-comedogenic and suitable for all skin types.\n• Portable stick format for quick application and touch-ups.\n• Size: 12.5g.\n\nAvailable shades:\n" + built.shades.map((s) => `• ${s.name}`).join("\n");
  const created = await api<{ id: string }>("/products", "POST", {
    sku: "HUDA-FFSTICK-35254", barcode, slug, brandId: brand.brand?.id, categoryId: MAKEUP, subcategoryId: FACE, tertiaryCategoryId: FOUNDATION,
    subcategoryIds: [FACE], tertiaryCategoryIds: [FOUNDATION], nameAr: "هودا بيوتي – فاونديشن ستيك #FauxFilter Skin Finish تغطية قابلة للبناء 12.5 غرام",
    nameEn: "Huda Beauty #FauxFilter Skin Finish Buildable Coverage Foundation Stick 12.5g", descriptionAr: ar, descriptionEn: en,
    price: PRICE, originalPrice: ORIGINAL, stock: 0, isActive: true, imageIds: [...new Set([...galleryIds, ...shadeImageIds])], shades,
  });
  const verify = await api<{ shades?: unknown[]; images?: unknown[] }>(`/products/${created.id}`);
  console.log(`Created ${created.id}: ${verify.shades?.length} shades, ${verify.images?.length} images; shade barcodes: 0`);
}
main().catch((e) => { console.error(e); process.exit(1); });
