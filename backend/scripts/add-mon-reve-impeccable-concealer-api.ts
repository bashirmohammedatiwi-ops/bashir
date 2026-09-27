/**
 * Mon Reve Impeccable Concealer — 8 shades (101–108), no shade barcodes.
 * Sources: monrevecosmetics.com/en/catalogue/impeccable-concealer_57/
 * Product barcode: 5201641750759 (shade 104)
 * Hex: trimmed-mean pigment from official MR-impeccable-concealer*_text.jpg swatches
 * Price: aligned with Impeccable line (≈6.80€; foundation 10.50€ = 20,000 IQD)
 * Usage: npx tsx scripts/add-mon-reve-impeccable-concealer-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const MAKEUP = "d3c24d19-dde5-41e5-b0a9-bede45393795";
const FACE = "2bbecee1-084d-446c-b4fd-65f769130de9";
const CONCEALER = "c1b72eae-d6d1-4341-9c83-42c75a8b7fcf";

const IMG = "https://monrevecosmetics.com/media/images/products";
const IMG_TEX = `${IMG}/2019/11`;
const IMG_BOTTLE = `${IMG}/2023/05`;
const IMG_2025 = `${IMG}/2025/04`;

const SHADE_PRICE = 13000;

const PRODUCT = {
  barcode: "5201641750759",
  slug: "mon-reve-impeccable-concealer-high-coverage-8ml",
  sku: "MON-IMP-CONC-750759",
  price: SHADE_PRICE,
  nameAr: "مون ريف - كونسيلر Impeccable تغطية كاملة مطفي للهالات والعيوب 8 مل",
  nameEn: "Mon Reve - Impeccable Concealer Full Coverage Matte Finish 8ml",
  descriptionAr:
    "كونسيلر Impeccable من مون ريف — كونسيلر سائل بتغطية كاملة وثبات طويل، بلمسة مطفية خفيفة لا تثقل البشرة، لإخفاء الهالات والعيوب بنتيجة ناعمة خالية من العيوب.\n\n" +
    "• يغطي بفعالية الهالات السوداء والاحمرار والأوعية الظاهرة والبقع واختلاف لون البشرة.\n" +
    "• غني بتترا ببتيد مضاد للوذمة يساعد على تقليل انتفاخ تحت العين ويمنح بشرة أنعم.\n" +
    "• لا يتجمّع في الخطوط — قوام خفيف — لمسة نهائية مطفية — خالٍ من الزيوت — مقاوم للماء.\n" +
    "• تغطية قابلة للبناء حسب الحاجة؛ يُستخدم وحده أو فوق الفاونديشن.\n" +
    "• خالٍ من البارابين والغلوتين — غير مجرّب على الحيوانات — مُختبر جلدياً.\n" +
    "• حجم 8 مل — صُنع في اليونان.\n" +
    "• درجات متوافقة مع فاونديشن Impeccable لتوليفة مثالية.\n\n" +
    "طريقة الاستخدام: ضعي كمية صغيرة بأطراف الأصابع أو بفرشاة أو إسفنجة، وادمِجي بضربات لطيفة حتى يمتزج. كرّري حتى الوصول للتغطية المطلوبة. لنتيجة تحت العين: شكّلي مثلثاً تحت العين وادمِجي للخارج.\n\n" +
    "الدرجات المتوفرة:\n" +
    "• 101 Light Porcelain — بورسلين فاتح جداً بلمسة دافئة خفيفة\n" +
    "• 102 Soft Ivory — عاجي ناعم مشمشي للبشرة الفاتحة\n" +
    "• 103 Natural Beige — بيج طبيعي فاتح\n" +
    "• 104 Warm Sand — رملي دافئ (درجة هذا الباركود)\n" +
    "• 105 Honey Beige — بيج عسلي دافئ\n" +
    "• 106 Golden Tan — حنطي ذهبي متوسط\n" +
    "• 107 Caramel Tan — كراميل حنطي دافئ\n" +
    "• 108 Deep Bronze — برونزي داكن دافئ",
  descriptionEn:
    "Mon Reve Impeccable Concealer — a full-coverage, long-lasting liquid concealer with a lightweight matte finish that effectively conceals imperfections without weighing skin down.\n\n" +
    "• Effectively conceals dark circles, redness, broken capillaries, age spots and discoloration.\n" +
    "• Enriched with a tetrapeptide with anti-edema properties that helps reduce puffy eye bags while leaving skin smooth and impeccable.\n" +
    "• Won’t crease — feels lightweight — matte finish — oil-free — water resistant.\n" +
    "• Buildable coverage; wear alone or over foundation.\n" +
    "• Paraben free — gluten free — cruelty free — dermatologically tested.\n" +
    "• 8ml — Made in Greece.\n" +
    "• Shade range aligned with Impeccable Foundation for a seamless match.\n\n" +
    "How to use: Apply a small amount with fingertips, brush or sponge, gently patting until blended. Repeat until desired coverage. For under-eyes, create a triangle and blend outwards.\n\n" +
    "Available shades:\n" +
    "• 101 Light Porcelain — very fair porcelain with a soft warm cast\n" +
    "• 102 Soft Ivory — soft peachy ivory for fair skin\n" +
    "• 103 Natural Beige — light natural beige\n" +
    "• 104 Warm Sand — warm sandy beige (this barcode’s shade)\n" +
    "• 105 Honey Beige — warm honey beige\n" +
    "• 106 Golden Tan — medium golden tan\n" +
    "• 107 Caramel Tan — warm caramel tan\n" +
    "• 108 Deep Bronze — deep warm bronze",
};

type ShadeInput = {
  name: string;
  colorHex: string;
  imageUrl: string;
  bottleUrl: string;
  position: number;
  price: number;
};

/** Shade names aligned with Impeccable Foundation; hex from official texture swatches. */
const SHADES: ShadeInput[] = [
  {
    name: "101 Light Porcelain",
    colorHex: "#E5BCA5",
    imageUrl: `${IMG_TEX}/MR-impeccable-concealer101_text.jpg`,
    bottleUrl: `${IMG_BOTTLE}/mon_reve_impeccable_concealer_101.jpg`,
    position: 0,
    price: SHADE_PRICE,
  },
  {
    name: "102 Soft Ivory",
    colorHex: "#EDC1A7",
    imageUrl: `${IMG_TEX}/MR-impeccable-concealer102_text.jpg`,
    bottleUrl: `${IMG_BOTTLE}/mon_reve_impeccable_concealer_102.jpg`,
    position: 1,
    price: SHADE_PRICE,
  },
  {
    name: "103 Natural Beige",
    colorHex: "#E7BEA3",
    imageUrl: `${IMG_TEX}/MR-impeccable-concealer103_text.jpg`,
    bottleUrl: `${IMG_BOTTLE}/mon_reve_impeccable_concealer_103.jpg`,
    position: 2,
    price: SHADE_PRICE,
  },
  {
    name: "104 Warm Sand",
    colorHex: "#DDAE90",
    imageUrl: `${IMG_TEX}/MR-impeccable-concealer104_text.jpg`,
    bottleUrl: `${IMG_BOTTLE}/mon_reve_impeccable_concealer_104.jpg`,
    position: 3,
    price: SHADE_PRICE,
  },
  {
    name: "105 Honey Beige",
    colorHex: "#D9AB96",
    imageUrl: `${IMG_TEX}/MR-impeccable-concealer105_text.jpg`,
    bottleUrl: `${IMG_BOTTLE}/mon_reve_impeccable_concealer_105.jpg`,
    position: 4,
    price: SHADE_PRICE,
  },
  {
    name: "106 Golden Tan",
    colorHex: "#D6A88F",
    imageUrl: `${IMG_TEX}/MR-impeccable-concealer106_text.jpg`,
    bottleUrl: `${IMG_BOTTLE}/mon_reve_impeccable_concealer_106.jpg`,
    position: 5,
    price: SHADE_PRICE,
  },
  {
    name: "107 Caramel Tan",
    colorHex: "#D4A183",
    imageUrl: `${IMG_TEX}/MR-impeccable-concealer107_text.jpg`,
    bottleUrl: `${IMG_BOTTLE}/mon_reve_impeccable_concealer_107.jpg`,
    position: 6,
    price: SHADE_PRICE,
  },
  {
    name: "108 Deep Bronze",
    colorHex: "#BD9182",
    imageUrl: `${IMG_TEX}/MR-impeccable-concealer108_text.jpg`,
    bottleUrl: `${IMG_BOTTLE}/mon_reve_impeccable_concealer_108.jpg`,
    position: 7,
    price: SHADE_PRICE,
  },
];

/** Gallery — shade 104 bottle first (product barcode), lifestyle, then range packshots. */
const PRODUCT_IMAGES = [
  `${IMG_BOTTLE}/mon_reve_impeccable_concealer_104.jpg`,
  `${IMG_2025}/impeccable-concealer-1.jpg`,
  `${IMG_BOTTLE}/mon_reve_impeccable_concealer_101.jpg`,
  `${IMG_BOTTLE}/mon_reve_impeccable_concealer_103.jpg`,
  `${IMG_BOTTLE}/mon_reve_impeccable_concealer_106.jpg`,
  `${IMG_BOTTLE}/mon_reve_impeccable_concealer_108.jpg`,
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
    if (attempt >= 4) throw err;
    await new Promise((r) => setTimeout(r, attempt * 1500));
    return uploadImage(url, alt, attempt + 1);
  }
}

async function main() {
  console.log(`API: ${API_BASE}`);
  console.log(`Shades: ${SHADES.length} (no shade barcodes)\n`);
  await login();
  console.log("Logged in.\n");

  const brandId = await resolveBrandId();

  const check = await api<{ exists: boolean; product?: { id: string; nameAr?: string } }>(
    `/products/barcode-check?barcode=${PRODUCT.barcode}`,
  );
  if (check.exists && check.product?.id) {
    await api(`/products/${check.product.id}`, "DELETE");
    console.log(`deleted existing: ${check.product.nameAr ?? PRODUCT.barcode}\n`);
  }

  const existing = await api<{ data?: Array<{ id: string; slug?: string }> } | Array<{ id: string; slug?: string }>>(
    `/products?search=${encodeURIComponent(PRODUCT.slug)}&status=all&limit=5`,
  );
  const rows = Array.isArray(existing) ? existing : (existing.data ?? []);
  for (const row of rows.filter((p) => p.slug === PRODUCT.slug)) {
    await api(`/products/${row.id}`, "DELETE");
    console.log(`deleted orphan slug: ${PRODUCT.slug}`);
  }

  console.log("Uploading shade images (official texture swatches)...");
  const shades: Array<{
    name: string;
    colorHex: string;
    imageId: string;
    position: number;
    stock: number;
    price: number;
    originalPrice: number;
  }> = [];

  for (const shade of SHADES) {
    const imageId = await uploadImage(shade.imageUrl, shade.name);
    shades.push({
      name: shade.name,
      colorHex: shade.colorHex,
      imageId,
      position: shade.position,
      stock: 0,
      price: shade.price,
      originalPrice: shade.price,
    });
    console.log(`  ✓ ${shade.name} — ${shade.colorHex} — ${shade.price} IQD`);
    await new Promise((r) => setTimeout(r, 500));
  }

  console.log("\nUploading product gallery images...");
  const galleryIds: string[] = [];
  for (const url of PRODUCT_IMAGES) {
    const id = await uploadImage(url, "product-gallery");
    galleryIds.push(id);
    console.log(`  ✓ gallery ${url.split("/").pop()}`);
    await new Promise((r) => setTimeout(r, 500));
  }

  // Remaining bottles not already in gallery
  const gallerySet = new Set(PRODUCT_IMAGES);
  for (const shade of SHADES) {
    if (gallerySet.has(shade.bottleUrl)) continue;
    const id = await uploadImage(shade.bottleUrl, `bottle-${shade.name}`);
    galleryIds.push(id);
    console.log(`  ✓ bottle ${shade.name}`);
    await new Promise((r) => setTimeout(r, 500));
  }

  const imageIds = [...new Set([...shades.map((s) => s.imageId), ...galleryIds])];

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
    descriptionAr: PRODUCT.descriptionAr,
    descriptionEn: PRODUCT.descriptionEn,
    price: PRODUCT.price,
    originalPrice: PRODUCT.price,
    stock: 0,
    isActive: true,
    imageIds,
    shades,
  });

  const verify = await api<{
    shades?: Array<{ name: string; barcode?: string; colorHex?: string; imageId?: string; price?: number }>;
    nameAr?: string;
    nameEn?: string;
    descriptionAr?: string;
    descriptionEn?: string;
    barcode?: string;
  }>(`/products/${created.id}`);

  const withBarcode = (verify.shades ?? []).filter((s) => s.barcode);
  if (withBarcode.length) throw new Error(`Shades should have no barcodes, found ${withBarcode.length}`);

  if (!verify.nameAr || !verify.nameEn || !verify.descriptionAr || !verify.descriptionEn) {
    throw new Error("Missing bilingual copy after create");
  }

  if ((verify.shades?.length ?? 0) !== SHADES.length) {
    throw new Error(`Expected ${SHADES.length} shades, got ${verify.shades?.length ?? 0}`);
  }

  const noImg = (verify.shades ?? []).filter((s) => !s.imageId);
  if (noImg.length) throw new Error(`Shades missing images: ${noImg.map((s) => s.name).join(", ")}`);

  console.log(`\n✓ ${PRODUCT.nameAr}`);
  console.log(`  EN: ${PRODUCT.nameEn}`);
  console.log(`  ID: ${created.id}`);
  console.log(`  Barcode: ${verify.barcode}`);
  console.log(`  Price: ${PRODUCT.price} IQD`);
  console.log(`  Shades: ${verify.shades?.length ?? shades.length} (no shade barcodes)`);
  for (const s of verify.shades ?? []) {
    console.log(`    - ${s.name} → ${s.colorHex ?? "?"} | ${s.price ?? "?"} IQD`);
  }
  console.log(`  Images: ${imageIds.length}`);
  console.log(`  Category: Makeup → Face → Concealer`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
