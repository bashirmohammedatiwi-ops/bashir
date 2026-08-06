/**
 * Mon Reve Stellar Highlighter — liquid highlighter for instant glow 18ml
 * 5 shades with images + hex (NO shade barcodes).
 * Product barcode: 5201641750926 (shade 05 Gold)
 *
 * Sources: monrevecosmetics.com (product + texture photos);
 * shade colour names from Mon Reve Amazon US listings (01–05).
 *
 * Usage: npx tsx scripts/add-mon-reve-stellar-highlighter-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const MAKEUP = "d3c24d19-dde5-41e5-b0a9-bede45393795";
const HIGHLIGHTER = "774d62c3-8119-4c0c-983b-2513fc46df24";
const LIQUID_HIGHLIGHTER = "6fed608e-80d7-4449-9427-fc2848b091be";

const IMG = "https://monrevecosmetics.com/media/images/products";

const PRODUCT = {
  barcode: "5201641750926",
  slug: "mon-reve-stellar-liquid-highlighter-18ml",
  sku: "MON-STELLAR-750926",
  price: 7500,
  originalPrice: 8500,
  nameAr: "مون ريف - هايلايتر سائل Stellar Highlighter لإشراقة فورية بلؤلؤ دقيق 18 مل",
  nameEn: "Mon Reve Stellar Liquid Highlighter Instant Glow with Micro-Pearls 18ml",
  descriptionAr:
    "هايلايتر سائل Stellar من مون ريف — إشراقة صحية فورية ولمسة ندى لؤلؤية بفضل ميكرو-لؤلؤ إريديسنس يعكس الضوء بنعومة.\n\n" +
    "• تركيبة مرطّبة فائقة الدمج — تُدهن بسهولة دون تكتّل.\n" +
    "• ثبات طويل، مقاوم للماء ولا ينتقل بسهولة.\n" +
    "• يُستخدم على عظام الخدين، عظمة الحاجب، جسر الأنف وقوس كيوبيد.\n" +
    "• امزجيه مع الفاونديشن أو المرطّب لإشراقة شاملة، أو ضعيه فوق المكياج للفت الانتباه.\n" +
    "• مناسب لكل أنواع البشرة — خالٍ من البارابين والغلوتين، مقاوم للماء، مختبر جلدياً وغير مجرّب على الحيوانات.\n" +
    "• 18 مل — 5 درجات لامعة تناسب البشرة الفاتحة والسمراء.\n\n" +
    "الدرجات المتوفرة:\n" +
    "• 01 Champagne — شامبين لؤلؤي فاتح\n" +
    "• 02 Sunlit — ضوء شمس دافئ\n" +
    "• 03 Rose — وردي لؤلؤي\n" +
    "• 04 Bronze — برونزي دافئ\n" +
    "• 05 Gold — ذهبي شمبانيا (درجة هذا الباركود)",
  descriptionEn:
    "Mon Reve Stellar Liquid Highlighter — all-day glow with iridescent micro-pearls for a dewy, luminous finish in a super-blendable moisturizing formula.\n\n" +
    "• Lightweight, mess-free application that layers beautifully.\n" +
    "• Long-wearing, water-resistant and transfer-resistant.\n" +
    "• Apply on cheekbones, brow bone, bridge of the nose and cupid’s bow.\n" +
    "• Mix with foundation or moisturizer for an all-over glow, or wear on top of makeup for a captivating highlight.\n" +
    "• For all skin types — paraben-free, gluten-free, water-resistant, dermatologically tested, cruelty-free.\n" +
    "• 18ml — 5 luminous shades for fair to deeper complexions.\n\n" +
    "Available shades:\n" +
    "• 01 Champagne — light pearly champagne\n" +
    "• 02 Sunlit — warm sunlit glow\n" +
    "• 03 Rose — pearly rose\n" +
    "• 04 Bronze — warm bronze\n" +
    "• 05 Gold — champagne gold (this barcode’s shade)",
};

type ShadeInput = {
  name: string;
  colorHex: string;
  imageUrl: string;
  position: number;
};

/** Colour names from Mon Reve Amazon US listings; hex sampled from official texture swatches. */
const SHADES: ShadeInput[] = [
  {
    name: "01 Champagne",
    colorHex: "#E7C8BF",
    imageUrl: `${IMG}/2019/11/mon-reve-stellar-liquid-highlighter-01.jpg`,
    position: 0,
  },
  {
    name: "02 Sunlit",
    colorHex: "#DFBFB7",
    imageUrl: `${IMG}/2019/11/mon-reve-stellar-liquid-highlighter02.jpg`,
    position: 1,
  },
  {
    name: "03 Rose",
    colorHex: "#EFB8B7",
    imageUrl: `${IMG}/2019/11/mon-reve-stellar-liquid-highlighter03.jpg`,
    position: 2,
  },
  {
    name: "04 Bronze",
    colorHex: "#E0B7A0",
    imageUrl: `${IMG}/2019/11/mon-reve-stellar-liquid-highlighter04.jpg`,
    position: 3,
  },
  {
    name: "05 Gold",
    colorHex: "#CFA788",
    imageUrl: `${IMG}/2019/11/mon-reve-stellar-liquid-highlighter05.jpg`,
    position: 4,
  },
];

const PRODUCT_IMAGES = [
  `${IMG}/2019/11/mon-reve-stellar-liquid-highlighter05.jpg`,
  `${IMG}/2019/11/Mon-Reve_Stellar_liquid-highlighter-_5_txtr.jpg`,
  `${IMG}/2025/04/stellar-2.jpg`,
  `${IMG}/2023/08/stellar_post_2.jpg`,
  `${IMG}/2019/11/mon-reve-stellar-liquid-highlighter-01.jpg`,
  `${IMG}/2019/11/Mon-Reve_Stellar_liquid-highlighter-_1_txtr.jpg`,
];

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
  const search = await api<
    { data?: Array<{ id: string; name?: string; nameEn?: string }> } | Array<{ id: string; name?: string; nameEn?: string }>
  >(`/brands?search=${encodeURIComponent("Mon Reve")}&limit=20`);
  const rows = Array.isArray(search) ? search : (search.data ?? []);
  const exact = rows.find((b) => {
    const n = `${b.name ?? ""} ${b.nameEn ?? ""}`.toLowerCase();
    return n.includes("mon reve") || n.includes("mon rêve") || n.includes("مون ريف");
  });
  if (exact?.id) {
    console.log(`Brand: Mon Reve (${exact.id}) [exact search]\n`);
    return exact.id;
  }
  const created = await api<{ id: string }>("/brands", "POST", {
    name: "Mon Reve",
    nameAr: "مون ريف",
    nameEn: "Mon Reve",
  });
  console.log(`Brand: Mon Reve (${created.id}) [created]\n`);
  return created.id;
}

async function uploadImage(url: string, alt: string, attempt = 1): Promise<string> {
  try {
    const res = await fetch(url, {
      headers: { Accept: "image/*", "User-Agent": "Mozilla/5.0 (compatible; AlhayaaCatalog/1.0)" },
    });
    if (!res.ok) throw new Error(`download HTTP ${res.status}`);
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
    if (attempt >= 3) throw err;
    await new Promise((r) => setTimeout(r, attempt * 800));
    return uploadImage(url, alt, attempt + 1);
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
  console.log(`Shades: ${SHADES.length} (no shade barcodes)\n`);
  await login();
  console.log("Logged in.\n");

  const brandId = await resolveBrandId();

  if (await deleteByBarcode(PRODUCT.barcode)) console.log("");
  await deleteOrphanSlug(PRODUCT.slug);

  console.log("Uploading shade images...");
  const shades: Array<{
    name: string;
    colorHex: string;
    imageId: string;
    position: number;
    stock: number;
  }> = [];

  for (const shade of SHADES) {
    const imageId = await uploadImage(shade.imageUrl, shade.name);
    shades.push({
      name: shade.name,
      colorHex: shade.colorHex,
      imageId,
      position: shade.position,
      stock: 0,
    });
    console.log(`  ✓ ${shade.name} (${shade.colorHex})`);
    await new Promise((r) => setTimeout(r, 350));
  }

  console.log("\nUploading product gallery images...");
  const galleryIds: string[] = [];
  for (const url of PRODUCT_IMAGES) {
    try {
      const id = await uploadImage(url, "product-gallery");
      galleryIds.push(id);
      console.log(`  ✓ gallery`);
    } catch (e) {
      console.log(`  ✗ gallery skip: ${(e as Error).message}`);
    }
    await new Promise((r) => setTimeout(r, 350));
  }

  shades.sort((a, b) => a.position - b.position);
  const imageIds = [...new Set([...shades.map((s) => s.imageId), ...galleryIds])];

  const created = await api<{ id: string }>("/products", "POST", {
    sku: PRODUCT.sku,
    barcode: PRODUCT.barcode,
    slug: PRODUCT.slug,
    brandId,
    categoryId: MAKEUP,
    subcategoryId: HIGHLIGHTER,
    tertiaryCategoryId: LIQUID_HIGHLIGHTER,
    subcategoryIds: [HIGHLIGHTER],
    tertiaryCategoryIds: [LIQUID_HIGHLIGHTER],
    nameAr: PRODUCT.nameAr,
    nameEn: PRODUCT.nameEn,
    descriptionAr: PRODUCT.descriptionAr,
    descriptionEn: PRODUCT.descriptionEn,
    price: PRODUCT.price,
    originalPrice: PRODUCT.originalPrice,
    stock: 0,
    isActive: true,
    imageIds,
    shades,
  });

  const verify = await api<{
    shades?: Array<{ name: string; colorHex?: string; barcode?: string; imageId?: string }>;
  }>(`/products/${created.id}`);

  const withBarcode = (verify.shades ?? []).filter((s) => s.barcode);
  if (withBarcode.length) throw new Error(`Shades should have no barcodes, found ${withBarcode.length}`);

  const noImg = (verify.shades ?? []).filter((s) => !s.imageId);
  if (noImg.length) throw new Error(`Shades missing images: ${noImg.map((s) => s.name).join(", ")}`);

  const noHex = (verify.shades ?? []).filter((s) => !s.colorHex);
  if (noHex.length) throw new Error(`Shades missing hex: ${noHex.map((s) => s.name).join(", ")}`);

  console.log(`\n✓ ${PRODUCT.nameAr}`);
  console.log(`  EN: ${PRODUCT.nameEn}`);
  console.log(`  ID: ${created.id}`);
  console.log(`  Barcode: ${PRODUCT.barcode}`);
  console.log(`  Price: ${PRODUCT.price} IQD`);
  console.log(`  Shades: ${verify.shades?.length ?? 0}`);
  for (const s of verify.shades ?? []) {
    console.log(`    - ${s.name} → ${s.colorHex ?? "?"}`);
  }
  console.log(`  Images: ${imageIds.length}`);
  console.log(`  Category: Makeup → Highlighter → Liquid Highlighter`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
