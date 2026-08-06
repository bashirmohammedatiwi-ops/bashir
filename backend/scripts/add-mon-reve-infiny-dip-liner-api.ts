/**
 * Mon Reve Infiny Dip Liner — 14 shades with images (no shade barcodes).
 * Source: monrevecosmetics.com/en/catalogue/infiny-dip-liner_310/ (official names, images, hex from swatches)
 * Product barcode: 5201641011669 (shade 04 Forest Green)
 * Usage: npx tsx scripts/add-mon-reve-infiny-dip-liner-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const MAKEUP = "d3c24d19-dde5-41e5-b0a9-bede45393795";
const EYES = "be0ba95f-62a6-4245-8012-5f6943ea5cab";
const EYELINER = "c8866117-67e0-4509-a887-60100775524b";

const IMG = "https://monrevecosmetics.com/media/images/products";

const PRODUCT = {
  barcode: "5201641011669",
  slug: "mon-reve-infiny-dip-liner-waterproof-ultra-long-wear-liquid-eyeliner-2ml",
  sku: "MON-IDL-011669",
  price: 7500,
  originalPrice: 8500,
  nameAr: "مون ريف - آيلاينر سائل Infiny Dip Liner مقاوم للماء فائق الثبات 2 مل",
  nameEn: "Mon Reve Infiny Dip Liner Waterproof Ultra Long-Wear Liquid Eyeliner 2ml",
  descriptionAr:
    "آيلاينر سائل Infiny Dip Liner من مون ريف — تركيبة دقيقة مقاومة للماء بثبات فائق، مع فرشاة رفيعة مرنة لرسم خطوط واضحة وتحكم كامل بالتطبيق.\n\n" +
    "• لون غني يجف بسرعة ويبقى ثابتاً دون تلطخ أو بهتان أو نقل.\n" +
    "• فرشاة طرف رفيع ناعمة لرسم خط الرموش العلوي بدقة.\n" +
    "• يناسب الإطلالات اليومية والجرافيكية والآيلاينر الفني.\n" +
    "• فيغن، بدون عطر، خالٍ من البارابين والغلوتين، غير مجرّب على الحيوانات.\n" +
    "• مختبر جلدياً وعينياً — 2 مل — 14 درجة مطفية ومعدنية.\n\n" +
    "الدرجات المتوفرة:\n" +
    "• 01 Black — أسود\n" +
    "• 02 Midnight Blue — أزرق منتصف الليل\n" +
    "• 03 Funky Eggplant — باذنجاني فانكي\n" +
    "• 04 Forest Green — أخضر غابات\n" +
    "• 05 Crushed Bronze — برونزي معدني\n" +
    "• 06 Lunar White — أبيض قمري\n" +
    "• 07 Blanco — أبيض بلانكو\n" +
    "• 08 Sophie's Blue — أزرق صوفي\n" +
    "• 09 Turquoise — تركوازي\n" +
    "• 10 Orchid — أوركيد بنفسجي\n" +
    "• 11 French Pink — وردي فرنسي\n" +
    "• 12 Rasberry — توتي راسبيري\n" +
    "• 13 Brown Black — أسود بني\n" +
    "• 14 Real Brown — بني طبيعي",
  descriptionEn:
    "Mon Reve Infiny Dip Liner — high-performance precision liquid eyeliner with a waterproof, ultra-long-wear formula and a fine flexible brush-tip for ultimate control.\n\n" +
    "• Rich colour that dries quickly and stays smudge-, fade-, and transfer-proof.\n" +
    "• Fine soft brush-tip for precise lining along the upper lash line.\n" +
    "• Perfect for everyday looks, graphic liner, and creative eye art.\n" +
    "• Vegan, fragrance-free, paraben-free, gluten-free, cruelty-free.\n" +
    "• Dermatologically and ophthalmologically tested — 2ml — 14 matte and metallic shades.\n\n" +
    "Available shades:\n" +
    "• 01 Black — black\n" +
    "• 02 Midnight Blue — midnight blue\n" +
    "• 03 Funky Eggplant — funky eggplant\n" +
    "• 04 Forest Green — forest green\n" +
    "• 05 Crushed Bronze — crushed bronze\n" +
    "• 06 Lunar White — lunar white\n" +
    "• 07 Blanco — blanco white\n" +
    "• 08 Sophie's Blue — sophie's blue\n" +
    "• 09 Turquoise — turquoise\n" +
    "• 10 Orchid — orchid purple\n" +
    "• 11 French Pink — french pink\n" +
    "• 12 Rasberry — raspberry berry\n" +
    "• 13 Brown Black — brown black\n" +
    "• 14 Real Brown — real brown",
};

type ShadeInput = {
  name: string;
  colorHex: string;
  imageUrl: string;
  position: number;
};

/** Names from monrevecosmetics.com JSON-LD; hex from official TEXTURES swatches. */
const SHADES: ShadeInput[] = [
  { name: "01 Black", colorHex: "#1A1A1A", imageUrl: `${IMG}/2022/01/infinity_dip_liner_mvOcLjQ.jpg`, position: 0 },
  { name: "02 Midnight Blue", colorHex: "#243B6B", imageUrl: `${IMG}/2022/01/infinity_dip_liner_6RHvdk2.jpg`, position: 1 },
  { name: "03 Funky Eggplant", colorHex: "#8F7989", imageUrl: `${IMG}/2022/01/infinity_dip_liner_IYMSjaa.jpg`, position: 2 },
  { name: "04 Forest Green", colorHex: "#75837B", imageUrl: `${IMG}/2022/01/infinity_dip_liner_x2esES2.jpg`, position: 3 },
  { name: "05 Crushed Bronze", colorHex: "#D9B192", imageUrl: `${IMG}/2022/01/infinity_dip_liner_olAQD7P.jpg`, position: 4 },
  { name: "06 Lunar White", colorHex: "#E7E5E8", imageUrl: `${IMG}/2022/01/infinity_dip_liner.jpg`, position: 5 },
  { name: "07 Blanco", colorHex: "#F3F3F3", imageUrl: `${IMG}/2022/06/infinity_dip_liner.jpg`, position: 6 },
  { name: "08 Sophie's Blue", colorHex: "#6682D3", imageUrl: `${IMG}/2022/06/infinity_dip_liner_aTVlm5c.jpg`, position: 7 },
  { name: "09 Turquoise", colorHex: "#7FB4C1", imageUrl: `${IMG}/2022/06/infinity_dip_liner_dPBgY8z.jpg`, position: 8 },
  { name: "10 Orchid", colorHex: "#D6A3DD", imageUrl: `${IMG}/2022/06/infinity_dip_liner_ybVBRSt.jpg`, position: 9 },
  { name: "11 French Pink", colorHex: "#F9CBCB", imageUrl: `${IMG}/2022/06/infinity_dip_liner_AVBaFOC.jpg`, position: 10 },
  { name: "12 Rasberry", colorHex: "#C7759B", imageUrl: `${IMG}/2022/06/infinity_dip_liner_all_0012_infiny_dip_liner_2_.jpg`, position: 11 },
  { name: "13 Brown Black", colorHex: "#7D6B67", imageUrl: `${IMG}/2023/09/infinity_dip_liner.jpg`, position: 12 },
  { name: "14 Real Brown", colorHex: "#A08277", imageUrl: `${IMG}/2023/09/infinity_dip_liner_zE2W3qI.jpg`, position: 13 },
];

/** Product gallery — shade range + application shots. */
const PRODUCT_IMAGES = [
  `${IMG}/2023/08/mon_reve_infinity_dip_liner_square.jpg`,
  `${IMG}/2023/08/eyeliner_4_2.jpg`,
  `${IMG}/2022/01/infinity_dip_liner_all_with_texture_0004_infinity_dip_liner_1.jpg`,
  `${IMG}/2022/01/infinity_dip_liner_x2esES2.jpg`,
  `${IMG}/2022/01/infinity_dip_liner_6RHvdk2.jpg`,
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
  const resolved = await api<{ brand?: { id: string }; created?: boolean }>("/brands/resolve", "POST", {
    brandAr: "مون ريف",
    brandEn: "Mon Reve",
    createIfMissing: true,
  });
  const brandId = resolved.brand?.id;
  if (!brandId) throw new Error("Could not resolve Mon Reve brand");
  console.log(`Brand: Mon Reve (${brandId})${resolved.created ? " [created]" : ""}\n`);
  return brandId;
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

  if (await deleteByBarcode(PRODUCT.barcode)) {
    console.log("");
  }
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
    const id = await uploadImage(url, "product-gallery");
    galleryIds.push(id);
    console.log(`  ✓ gallery`);
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
    subcategoryId: EYES,
    tertiaryCategoryId: EYELINER,
    subcategoryIds: [EYES],
    tertiaryCategoryIds: [EYELINER],
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

  console.log(`\n✓ ${PRODUCT.nameAr}`);
  console.log(`  EN: ${PRODUCT.nameEn}`);
  console.log(`  ID: ${created.id}`);
  console.log(`  Barcode: ${PRODUCT.barcode}`);
  console.log(`  Price: ${PRODUCT.price} IQD`);
  console.log(`  Shades: ${verify.shades?.length ?? 0}`);
  for (const s of verify.shades ?? []) {
    console.log(`    - ${s.name} → ${s.colorHex ?? "?"}${s.barcode ? ` [barcode: ${s.barcode}]` : ""}`);
  }
  console.log(`  Images: ${imageIds.length}`);
  console.log(`  Category: Makeup → Eyes → Eyeliner`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
