/**
 * Huda Beauty #FauxFilter Luminous Matte Concealer — 29 shades with barcodes, images & per-shade pricing.
 * Sources: Huda demandware CDN (packshots), Kohls/UPC (images + barcodes), Sephora UK (shade reference)
 * Product barcode: 6291107572581 (Honey 1.7B) — shade barcode excluded per request
 * Usage: npx tsx scripts/add-huda-fauxfilter-luminous-matte-concealer-api.ts
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const MAKEUP = "d3c24d19-dde5-41e5-b0a9-bede45393795";
const FACE = "2bbecee1-084d-446c-b4fd-65f769130de9";
const CONCEALER = "c1b72eae-d6d1-4341-9c83-42c75a8b7fcf";

const SHADE_PRICE = 30000;
const ORIGINAL_PRICE = 35000;

type ShadeBuilt = {
  name: string;
  nameAr: string;
  displayName: string;
  colorHex: string;
  imageUrl: string;
  position: number;
  sku: string;
  barcode?: string;
  price: number;
  descEn?: string;
  descAr?: string;
};

const built = JSON.parse(
  readFileSync(join(__dirname, "data/huda-fauxfilter-luminous-matte-concealer-shades-built.json"), "utf8"),
) as { shades: ShadeBuilt[]; productImages: string[] };

const SHADES = built.shades;
const PRODUCT_GALLERY = built.productImages;

const PRODUCT = {
  barcode: "6291107572581",
  slug: "huda-beauty-fauxfilter-luminous-matte-concealer-9ml",
  sku: "HUDA-FFLM-C-572581",
  price: SHADE_PRICE,
  originalPrice: ORIGINAL_PRICE,
  nameAr: "هودا بيوتي – كونسيلر سائل #FauxFilter Luminous Matte لتغطية تحت العين 9 مل",
  nameEn: "Huda Beauty #FauxFilter Luminous Matte Buildable Crease-Proof Concealer – 9 ml",
};

function buildDescriptions(shades: ShadeBuilt[]): { descriptionAr: string; descriptionEn: string } {
  const linesAr = shades.map((s) => `• ${s.displayName} — ${s.descAr ?? ""}`);
  const linesEn = shades.map((s) => `• ${s.displayName} — ${s.descEn ?? ""}`);

  const descriptionAr =
    "كونسيلر سائل #FauxFilter Luminous Matte من هودا بيوتي — تغطية قابلة للبناء من متوسطة إلى كاملة بمظهر مطفي لامع يشبه البشرة، مصمم ليتحرك معك دون تجمع أو خطوط.\n\n" +
    "• يفتيح ويخفي الهالات والعيوب والاحمرار بصيغة كريمية ناعمة قابلة للدمج.\n" +
    "• ثبات ضد التجاعيد لمدة 14 ساعة — لا يتكتل تحت العين ولا يُنقل.\n" +
    "• مقاوم للماء والعرق والرطوبة — فيغن، خالي من العطر والكحول، غير كوميدوجينيك.\n" +
    "• مُعزّز بزيت اللوز الحلو وفيتامين E لترطيب منطقة تحت العين الحساسة.\n" +
    "• فرشاة doe-foot كبيرة ناعمة لتطبيق سهل تحت العين.\n" +
    "• 29 درجة لجميع ألوان و undertones البشرة — أكواد: G (ذهبي)، N (محايد)، B (متوازن)، R (زيتوني/أحمر).\n" +
    "• نصيحة هدى: استخدمي درجة أفتح من بشرتك لتفتيح الهالات، ودرجة مطابقة للعيوب والاحمرار.\n" +
    "• الحجم: 9 مل (0.3 أونصة).\n\n" +
    "الدرجات المتوفرة:\n" +
    linesAr.join("\n");

  const descriptionEn =
    "Huda Beauty #FauxFilter Luminous Matte Concealer — buildable medium-to-full coverage creamy concealer with a crease-proof, luminous-matte, skin-like finish that moves with you.\n\n" +
    "• Brightens and conceals dark circles, blemishes and redness with a lightweight, blendable formula.\n" +
    "• 14-hour crease-proof wear — doesn't cake or transfer.\n" +
    "• Waterproof, sweat-proof, humidity-resistant — vegan, fragrance-free, alcohol-free, non-comedogenic.\n" +
    "• Infused with sweet almond oil and vitamin E to care for delicate under-eye skin.\n" +
    "• XL pillowy soft doe-foot applicator hugs the under-eye area.\n" +
    "• 29 shades for all skin tones & undertones — codes: G (golden), N (neutral), B (balanced), R (red/olive).\n" +
    "• Huda's hack: use a lighter shade to brighten under-eyes; match your skin tone for blemishes and redness.\n" +
    "• Size: 9 ml (0.3 fl oz).\n\n" +
    "Available shades:\n" +
    linesEn.join("\n");

  return { descriptionAr, descriptionEn };
}

let token = "";

async function login() {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  });
  const json = (await res.json()) as { data?: { accessToken?: string }; accessToken?: string; message?: string };
  if (!res.ok) throw new Error(json?.message ?? `Login failed HTTP ${res.status}`);
  token = json.data?.accessToken ?? json.accessToken ?? "";
  if (!token) throw new Error("No access token");
}

async function api<T>(path: string, method = "GET", body?: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg =
      (json as { message?: string; error?: { message?: string } })?.error?.message ??
      (json as { message?: string })?.message ??
      res.statusText;
    throw new Error(`${method} ${path}: ${msg}`);
  }
  return ((json as { data?: T }).data ?? json) as T;
}

async function resolveBrandId(): Promise<string> {
  const resolved = await api<{ brand?: { id: string }; created?: boolean }>("/brands/resolve", "POST", {
    brandAr: "هودا بيوتي",
    brandEn: "Huda Beauty",
    createIfMissing: true,
  });
  const brandId = resolved.brand?.id;
  if (!brandId) throw new Error("Could not resolve Huda Beauty brand");
  console.log(`Brand: Huda Beauty (${brandId})${resolved.created ? " [created]" : ""}\n`);
  return brandId;
}

const FALLBACK_IMAGE =
  "https://media.kohlsimg.com/is/image/kohls/436e0701bcc74a94259f6d1e8f62288b034a4513?wid=800&hei=800&op_sharpen=1";

async function uploadImage(url: string, alt: string, attempt = 1, urls?: string[]): Promise<string> {
  const candidates = urls ?? [url];
  try {
    let res: Response | null = null;
    let used = url;
    for (const candidate of candidates) {
      res = await fetch(candidate, {
        headers: { Accept: "image/*", "User-Agent": "Mozilla/5.0 (compatible; AlhayaaCatalog/1.0)" },
      });
      if (res.ok) {
        used = candidate;
        break;
      }
    }
    if (!res?.ok) throw new Error(`download HTTP ${res?.status ?? "failed"}`);
    const buffer = Buffer.from(await res.arrayBuffer());
    if (buffer.byteLength < 64) throw new Error("empty image");

    const contentType = (res.headers.get("content-type") || "image/jpeg").split(";")[0].trim();
    const ext = contentType.includes("png") ? "png" : contentType.includes("webp") ? "webp" : "jpg";
    const blob = new Blob([buffer], { type: contentType });
    const form = new FormData();
    form.append("file", blob, `${alt.replace(/[^\w.-]+/g, "_")}.${ext}`);
    form.append("purpose", "PRODUCT");

    const uploadRes = await fetch(`${API_BASE}/media/upload`, {
      method: "POST",
      headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
      body: form,
    });
    const json = await uploadRes.json().catch(() => ({}));
    if (!uploadRes.ok) {
      const msg =
        (json as { message?: string; error?: { message?: string } })?.error?.message ??
        (json as { message?: string })?.message ??
        uploadRes.statusText;
      throw new Error(msg);
    }
    const media = ((json as { data?: { id: string } }).data ?? json) as { id: string };
    if (!media?.id) throw new Error(`No media id for ${alt}`);
    return media.id;
  } catch (err) {
    if (attempt >= 4) throw err;
    await new Promise((r) => setTimeout(r, attempt * 1200));
    const retryUrls = [...new Set([...candidates, FALLBACK_IMAGE])];
    return uploadImage(used, alt, attempt + 1, retryUrls);
  }
}

async function deleteByBarcode(barcode: string): Promise<boolean> {
  const check = await api<{ exists: boolean; product?: { id: string; nameAr?: string } }>(
    `/products/barcode-check?barcode=${barcode}`,
  );
  if (!check.exists || !check.product?.id) return false;
  await api(`/products/${check.product.id}`, "DELETE");
  console.log(`  deleted existing: ${check.product.nameAr ?? check.product.id}`);
  return true;
}

async function deleteOrphanSlug(slug: string) {
  const existing = await api<{ data?: Array<{ id: string; slug?: string }> } | Array<{ id: string; slug?: string }>>(
    `/products?search=${encodeURIComponent(slug)}&status=all&limit=10`,
  );
  const rows = Array.isArray(existing) ? existing : (existing.data ?? []);
  for (const row of rows.filter((p) => p.slug === slug)) {
    await api(`/products/${row.id}`, "DELETE");
    console.log(`  deleted orphan slug: ${slug}`);
  }
}

async function main() {
  console.log(`API: ${API_BASE}`);
  console.log(`Shades: ${SHADES.length}\n`);
  await login();
  console.log("Logged in.\n");

  if (await deleteByBarcode(PRODUCT.barcode)) console.log("");
  await deleteOrphanSlug(PRODUCT.slug);

  const brandId = await resolveBrandId();
  const { descriptionAr, descriptionEn } = buildDescriptions(SHADES);

  console.log("Uploading product gallery images...");
  const galleryIds: string[] = [];
  for (let i = 0; i < PRODUCT_GALLERY.length; i++) {
    try {
      const id = await uploadImage(PRODUCT_GALLERY[i], `huda-ffc-gallery-${i}`);
      galleryIds.push(id);
      console.log(`  ✓ gallery ${i + 1}/${PRODUCT_GALLERY.length}`);
    } catch (e) {
      console.log(`  ✗ gallery ${i + 1} skipped: ${(e as Error).message}`);
    }
    await new Promise((r) => setTimeout(r, 350));
  }

  console.log("Uploading shade images...");
  const shades: Array<{
    name: string;
    colorHex: string;
    imageId: string;
    position: number;
    stock: number;
    price: number;
    originalPrice: number;
    barcode?: string;
  }> = [];

  for (const shade of SHADES) {
    const imageId = await uploadImage(shade.imageUrl, shade.displayName);
    const entry: {
      name: string;
      colorHex: string;
      imageId: string;
      position: number;
      stock: number;
      price: number;
      originalPrice: number;
      barcode?: string;
    } = {
      name: shade.displayName,
      colorHex: shade.colorHex,
      imageId,
      position: shade.position,
      stock: 0,
      price: shade.price ?? SHADE_PRICE,
      originalPrice: ORIGINAL_PRICE,
    };
    if (shade.barcode) entry.barcode = shade.barcode;
    shades.push(entry);
    console.log(
      `  ✓ ${shade.displayName} — ${shade.colorHex} — ${shade.price ?? SHADE_PRICE} IQD${shade.barcode ? ` — ${shade.barcode}` : ""}`,
    );
    await new Promise((r) => setTimeout(r, 400));
  }

  shades.sort((a, b) => a.position - b.position);
  const imageIds = [...new Set([...galleryIds, ...shades.map((s) => s.imageId)])];

  const created = await api<{ id: string }>("/products", "POST", {
    sku: PRODUCT.sku,
    barcode: PRODUCT.barcode,
    slug: PRODUCT.slug,
    brandId,
    categoryId: MAKEUP,
    subcategoryId: FACE,
    tertiaryCategoryId: CONCEALER,
    subcategoryIds: [FACE],
    tertiaryCategoryIds: [CONCEALER],
    nameAr: PRODUCT.nameAr,
    nameEn: PRODUCT.nameEn,
    descriptionAr,
    descriptionEn,
    price: PRODUCT.price,
    originalPrice: PRODUCT.originalPrice,
    stock: 0,
    isActive: true,
    imageIds,
    shades,
  });

  const verify = await api<{
    shades?: Array<{ name: string; colorHex?: string; barcode?: string; price?: number }>;
    images?: unknown[];
  }>(`/products/${created.id}`);

  console.log(`\n✓ ${PRODUCT.nameAr}`);
  console.log(`  EN: ${PRODUCT.nameEn}`);
  console.log(`  ID: ${created.id}`);
  console.log(`  Barcode: ${PRODUCT.barcode}`);
  console.log(`  Price: ${PRODUCT.price} IQD (original ${PRODUCT.originalPrice})`);
  console.log(`  Shades: ${verify.shades?.length ?? shades.length}`);
  console.log(`  Images: ${verify.images?.length ?? imageIds.length}`);
  console.log(`  Category: Makeup → Face → Concealer`);
  const withBarcode = verify.shades?.filter((s) => s.barcode).length ?? 0;
  console.log(`  Shade barcodes: ${withBarcode} (Honey 6291107572581 excluded)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
