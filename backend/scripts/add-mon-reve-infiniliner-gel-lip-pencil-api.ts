/**
 * Mon Reve Infiniliner Gel Lip Pencil — Waterproof long-lasting lip pencil 0.3g
 * 10 shades with official names + official hex (NO shade barcodes).
 * Product barcode: 5201641754252 (shade 01 Nude)
 *
 * Sources: monrevecosmetics.com (official names, hex chips, pack + swatch photos)
 * Hex: official color-select__option__hex from product page.
 *
 * Usage: npx tsx scripts/add-mon-reve-infiniliner-gel-lip-pencil-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const MAKEUP = "d3c24d19-dde5-41e5-b0a9-bede45393795";
const LIPS = "56da5b82-c847-4e9b-9cea-cc901236189f";
const LIP_LINER = "54e393a9-90bf-41bb-beeb-c5364afce287";

const IMG23 = "https://monrevecosmetics.com/media/images/products/2023/09";
const IMG25 = "https://monrevecosmetics.com/media/images/products/2025/06";
const P24 = "https://cdn.pharm24.gr/images/515x515-90";

const PRODUCT = {
  barcode: "5201641754252",
  slug: "mon-reve-infiniliner-gel-waterproof-lip-pencil-0-3g",
  sku: "MON-INFI-LIP-754252",
  price: 7500,
  originalPrice: 8500,
  nameAr: "مون ريف - قلم شفاه Infiniliner جل مقاوم للماء طويل الثبات بطرف دقيق ومبراة 0.3 غرام",
  nameEn: "Mon Reve Infiniliner Gel Waterproof Long-Lasting Lip Pencil 0.3g",
  descriptionAr:
    "قلم شفاه Infiniliner جل من مون ريف — قلم كريمي ناعم ينساب على الشفاه دون تهيّج، بتركيبة هلامية مقاومة للماء تمنح لوناً كثيفاً وثباتاً طويلاً دون تلطخ.\n\n" +
    "• طرف رفيع دقيق لرسم محيط الشفاه بسهولة واحترافية.\n" +
    "• آلية سحب دوّارة للتحكم الكامل بطول الرأس أثناء التطبيق.\n" +
    "• يأتي مع مبراة للحفاظ على طرف حاد في كل استخدام.\n" +
    "• يمكن تعبئة الشفاه بالكامل لون أوضح وثبات أطول.\n" +
    "• خالٍ من البارابين والغلوتين، غير مجرّب على الحيوانات، مختبر جلدياً، مقاوم للماء.\n" +
    "• 0.3 غرام — 10 درجات رسمية من النود إلى الأحمر والبني.\n\n" +
    "طريقة الاستخدام: أبقي الطرف حاداً بالمبراة المرفقة. ابدئي من منتصف الشفاه العليا واسحبي نحو الزوايا باتباع الخط الطبيعي. للشفاه الكبيرة ركّزي على الحواف الخارجية، وللصغيرة على الحواف الداخلية. يمكن ملء الشفاه بالكامل لثبات أقوى.\n\n" +
    "الدرجات المتوفرة (الأسماء الرسمية):\n" +
    "• 01 Nude — نود طبيعي دافئ\n" +
    "• 02 Dark Nude — نود غامق\n" +
    "• 03 Red Nude — نود محمر\n" +
    "• 04 Plum Nude — نود برقوقي\n" +
    "• 05 Baked Apple — تفاحي وردي دافئ\n" +
    "• 06 Vivid Red — أحمر حيوي ساطع\n" +
    "• 07 Deep Red — أحمر عميق\n" +
    "• 08 Velvet — بني مخملي وردي\n" +
    "• 09 Sweet Brown — بني حلو دافئ\n" +
    "• 10 Dark Brown — بني غامق كلاسيكي",
  descriptionEn:
    "Mon Reve Infiniliner Gel Lip Pencil — a soft creamy waterproof gel lip pencil that glides on without irritating the skin. Delivers long-lasting, intense colour with a smudge-free finish.\n\n" +
    "• Fine tip for smooth, precise lip outlining.\n" +
    "• Retractable mechanism for full control of tip length.\n" +
    "• Includes a sharpener to keep the tip sharp every time.\n" +
    "• Fill in the lips for more colour intensity and longer wear.\n" +
    "• Paraben-free, gluten-free, cruelty-free, dermatologically tested, water-resistant.\n" +
    "• 0.3g — 10 official shades from nude to red and brown.\n\n" +
    "How to use: Keep the tip sharp with the included sharpener. Begin at the centre of the upper lip and drag to the corners along the natural lip line. For fuller lips focus on the outer edges; for smaller lips focus on the inner edges. Fill in for stronger colour and hold.\n\n" +
    "Available shades (official names):\n" +
    "• 01 Nude — warm natural nude\n" +
    "• 02 Dark Nude — deeper nude\n" +
    "• 03 Red Nude — reddish nude\n" +
    "• 04 Plum Nude — plum nude\n" +
    "• 05 Baked Apple — warm rosy apple\n" +
    "• 06 Vivid Red — bright vivid red\n" +
    "• 07 Deep Red — deep intense red\n" +
    "• 08 Velvet — velvety rose brown\n" +
    "• 09 Sweet Brown — warm sweet brown\n" +
    "• 10 Dark Brown — classic dark brown",
};

type ShadeInput = {
  name: string;
  colorHex: string;
  imageUrl: string;
  position: number;
};

/** Official shade names + hex from monrevecosmetics.com. Images: official swatch photos. */
const SHADES: ShadeInput[] = [
  { name: "01 Nude", colorHex: "#A0635B", imageUrl: `${IMG23}/mon_reve_infiniliner_lips_01_4.jpg`, position: 0 },
  { name: "02 Dark Nude", colorHex: "#9E585C", imageUrl: `${IMG23}/mon_reve_infiniliner_lips_02_4.jpg`, position: 1 },
  { name: "03 Red Nude", colorHex: "#983E56", imageUrl: `${IMG23}/mon_reve_infiniliner_lips_03_4.jpg`, position: 2 },
  { name: "04 Plum Nude", colorHex: "#81384C", imageUrl: `${IMG23}/mon_reve_infiniliner_lips_04_4.jpg`, position: 3 },
  { name: "05 Baked Apple", colorHex: "#B2666A", imageUrl: `${IMG25}/mon_reve_infiniliner_lips_05_04.jpg`, position: 4 },
  { name: "06 Vivid Red", colorHex: "#C9072D", imageUrl: `${IMG25}/mon_reve_infiniliner_lips_06_04.jpg`, position: 5 },
  { name: "07 Deep Red", colorHex: "#9D0418", imageUrl: `${IMG25}/mon_reve_infiniliner_lips_07_04.png`, position: 6 },
  { name: "08 Velvet", colorHex: "#924942", imageUrl: `${IMG25}/mon_reve_infiniliner_lips_08_04.jpg`, position: 7 },
  { name: "09 Sweet Brown", colorHex: "#6B352A", imageUrl: `${IMG25}/mon_reve_infiniliner_lips_09_04.jpg`, position: 8 },
  { name: "10 Dark Brown", colorHex: "#5C2B1B", imageUrl: `${IMG25}/mon_reve_infiniliner_lips_10_04.jpg`, position: 9 },
];

const PRODUCT_IMAGES = [
  `${IMG23}/mon_reve_infiniliner_lips_01_2.jpg`,
  `${IMG23}/mon_reve_infiniliner_lips_01_1.jpg`,
  `${IMG23}/mon_reve_infiniliner_lips_01_4.jpg`,
  `${IMG23}/mon_reve_infiniliner_lips_01_7.jpg`,
  `${IMG23}/mon_reve_infiniliner_lips_02_2.jpg`,
  `${IMG23}/mon_reve_infiniliner_lips_03_2.jpg`,
  `${IMG23}/mon_reve_infiniliner_lips_04_2.jpg`,
  `${IMG25}/mon_reve_infiniliner_lips_05_01.jpg`,
  `${IMG25}/mon_reve_infiniliner_lips_06_01.jpg`,
  `${IMG25}/mon_reve_infiniliner_lips_07_01.jpg`,
  `${IMG25}/mon_reve_infiniliner_lips_08_01.jpg`,
  `${IMG25}/mon_reve_infiniliner_lips_09_01.jpg`,
  `${IMG25}/mon_reve_infiniliner_lips_10_01.jpg`,
  `${IMG25}/Website_Lips_2.jpg`,
  `${P24}/5201641754252.jpg`,
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
    subcategoryId: LIPS,
    tertiaryCategoryId: LIP_LINER,
    subcategoryIds: [LIPS],
    tertiaryCategoryIds: [LIP_LINER],
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
  console.log(`  Category: Makeup → Lips → Lip Liner`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
