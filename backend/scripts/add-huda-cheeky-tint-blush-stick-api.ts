/**
 * Huda Beauty Cheeky Tint Blush Stick — all 5 shades, no shade barcodes.
 * Product barcode: 6291106038231 (Coral Cutie)
 * Usage: npx tsx scripts/add-huda-cheeky-tint-blush-stick-api.ts
 */
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const API = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";
const __dirname = dirname(fileURLToPath(import.meta.url));
const MAKEUP = "d3c24d19-dde5-41e5-b0a9-bede45393795";
const CHEEK = "7b95190f-d5b7-4dff-8456-3c6d10fdafe6";
const BLUSH = "388af575-b9d3-484f-b382-3376cbb4efe8";
const PRICE = 40000;
let token = "";

const shades = [
  ["Perky Peach", "بيكي بيتش — خوخي دافئ", "#D98A73", "warm dusty peach", "خوخي دافئ مطفي", "perky-peach"],
  ["Proud Pink", "براود بينك — وردي فخور", "#E47A98", "cool bubblegum pink", "وردي بابل غم بارد ومشرق", "proud-pink"],
  ["Coral Cutie", "كورال كيوتي — مرجاني لطيف", "#F47762", "bright orange-pink", "برتقالي وردي زاهٍ ودافئ", "coral-cutie"],
  ["Rebel Red", "ريبل رِد — أحمر متمرّد", "#B84742", "bold rusty red", "أحمر صدئي جريء وعميق", "rebel-red"],
  ["Baddie Berry", "بادي بيري — توتي جذاب", "#813F5A", "deep plum berry", "توتي برقوقي عميق", "baddie-berry"],
] as const;
const image = (slug: string) => `https://www.temptalia.com/wp-content/uploads/2022/03/huda-beauty_${slug}_001_product-350x350.jpg`;
const gallery = shades.map((s) => image(s[5]));

async function api<T>(path: string, method = "GET", body?: unknown): Promise<T> {
  const res = await fetch(`${API}${path}`, { method, headers: { Accept: "application/json", Authorization: `Bearer ${token}`, ...(body ? { "Content-Type": "application/json" } : {}) }, body: body ? JSON.stringify(body) : undefined });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`${method} ${path}: ${json?.message ?? res.statusText}`);
  return (json.data ?? json) as T;
}
async function upload(url: string, name: string): Promise<string> {
  const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0", Accept: "image/*" } });
  if (!res.ok) throw new Error(`Image ${res.status} ${url}`);
  const type = (res.headers.get("content-type") ?? "image/jpeg").split(";")[0];
  const ext = type.includes("png") ? "png" : "jpg";
  const form = new FormData();
  form.append("file", new Blob([await res.arrayBuffer()], { type }), `${name}.${ext}`);
  form.append("purpose", "PRODUCT");
  const out = await fetch(`${API}/media/upload`, { method: "POST", headers: { Authorization: `Bearer ${token}`, Accept: "application/json" }, body: form });
  const json = await out.json();
  if (!out.ok) throw new Error(`Upload failed: ${json?.message ?? out.statusText}`);
  return (json.data ?? json).id;
}
async function main() {
  const login = await fetch(`${API}/auth/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: EMAIL, password: PASSWORD }) });
  const loginJson = await login.json();
  token = loginJson.data?.accessToken ?? loginJson.accessToken;
  if (!token) throw new Error("Login failed");
  const check = await api<{ exists: boolean; product?: { id: string } }>(`/products/barcode-check?barcode=6291106038231`);
  if (check.exists && check.product) await api(`/products/${check.product.id}`, "DELETE");
  const found = await api<{ data?: { id: string; slug?: string }[] }>(`/products?search=huda-beauty-cheeky-tint-blush-stick&status=all&limit=20`);
  for (const p of found.data ?? []) if (p.slug === "huda-beauty-cheeky-tint-blush-stick") await api(`/products/${p.id}`, "DELETE");
  const brand = await api<{ brand?: { id: string } }>("/brands/resolve", "POST", { brandAr: "هودا بيوتي", brandEn: "Huda Beauty", createIfMissing: true });
  const ids: string[] = [];
  for (let i = 0; i < gallery.length; i++) ids.push(await upload(gallery[i], `huda-cheeky-gallery-${i}`));
  const uploadedShades = [];
  for (let i = 0; i < shades.length; i++) {
    const s = shades[i];
    const imageId = await upload(image(s[5]), `huda-cheeky-${s[5]}`);
    uploadedShades.push({ name: s[1], colorHex: s[2], imageId, position: i, stock: 0, price: PRICE, originalPrice: 45000 });
    ids.push(imageId);
  }
  const ar = "هودا بيوتي Cheeky Tint — بلاشر كريمي مرطب على شكل ستيك يمنح الخدود لوناً قابلاً للبناء وإشراقة ندية طبيعية بلمسة ثانية للبشرة.\n\n• يذوب على البشرة ويندمج بسهولة دون تكتل.\n• غني بمستخلص الليتشي المرطب وفيتامين E المنعم.\n• مقاوم للماء والانتقال والعرق، مع ترطيب يصل إلى 9 ساعات.\n• مناسب لجميع ألوان وأنواع البشرة، ويمكن مزج الدرجات وتنسيقها.\n• يُستخدم مباشرة على الخدود أو بواسطة الفرشاة، ثم يُدمج بالأصابع.\n• الحجم: 5 غرام.\n\nالدرجات:\n" + shades.map((s) => `• ${s[1]} — ${s[4]}`).join("\n");
  const en = "Huda Beauty Cheeky Tint Blush Stick — a buildable, moisturizing cream blush stick that melts into skin and blends seamlessly for a dewy, juicy second-skin glow.\n\n• Infused with moisturizing lychee extract and smoothing vitamin E.\n• Water-, transfer- and sweat-proof with up to 9 hours of moisturization.\n• Suitable for all skin tones and types; mix, match and layer shades.\n• Swipe directly onto cheeks or apply with a brush, then blend with fingers.\n• Size: 5g / 0.17 oz.\n\nShades:\n" + shades.map((s) => `• ${s[0]} — ${s[3]}`).join("\n");
  const created = await api<{ id: string }>("/products", "POST", {
    sku: "HUDA-CHEEKY-TINT-38231", barcode: "6291106038231", slug: "huda-beauty-cheeky-tint-blush-stick",
    brandId: brand.brand?.id, categoryId: MAKEUP, subcategoryId: CHEEK, tertiaryCategoryId: BLUSH,
    subcategoryIds: [CHEEK], tertiaryCategoryIds: [BLUSH], nameAr: "هودا بيوتي – شيكي تنت بلاشر كريمي ستيك 5 غرام",
    nameEn: "Huda Beauty Cheeky Tint Blush Stick 5g", descriptionAr: ar, descriptionEn: en,
    price: PRICE, originalPrice: 45000, stock: 0, isActive: true, imageIds: [...new Set(ids)], shades: uploadedShades,
  });
  const verify = await api<{ shades?: unknown[]; images?: unknown[] }>(`/products/${created.id}`);
  console.log(`Created ${created.id}: ${verify.shades?.length} shades, ${verify.images?.length} images; shade barcodes: 0`);
}
main().catch((e) => { console.error(e); process.exit(1); });
