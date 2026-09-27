/**
 * Mon Reve Blush Bar — Sheer Moisturizing Blush Stick 5.5g
 * 8 shades with images + hex (NO shade barcodes).
 * Product barcode: 5201641028070 (shade 01)
 *
 * Sources: monrevecosmetics.com + thomasparfums.gr + pharm24.gr
 * Hex sampled from product/swatch photos (pigment regions).
 *
 * Usage: npx tsx scripts/add-mon-reve-blush-bar-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const MAKEUP = "d3c24d19-dde5-41e5-b0a9-bede45393795";
const CHEEK = "7b95190f-d5b7-4dff-8456-3c6d10fdafe6";
const BLUSH = "388af575-b9d3-484f-b382-3376cbb4efe8";

const OFF = "https://monrevecosmetics.com/media/images/products";
const TP = "https://thomasparfums.gr";

const PRODUCT = {
  barcode: "5201641028070",
  slug: "mon-reve-blush-bar-sheer-moisturizing-blush-stick-5-5g",
  sku: "MON-BB-028070",
  price: 7500,
  originalPrice: 8500,
  nameAr: "مون ريف - بلش بار Blush Bar ستيك أحمر خدود كريمي مرطب متعدد الاستخدام 5.5 غرام",
  nameEn: "Mon Reve Blush Bar Sheer Moisturizing Multi-Use Blush Stick 5.5g",
  descriptionAr:
    "بلش بار من مون ريف — ستيك أحمر خدود كريمي مرطب يمنحكِ تورّداً صحياً ولمعاناً طبيعياً بنقرة واحدة، بتركيبة خفيفة غير دهنية سهلة الدمج على الخدود والشفاه وحتى العيون.\n\n" +
    "• تغطية شفافة قابلة للبناء حسب الرغبة — من لمسة خجولة إلى لون أوضح.\n" +
    "• ثبات طويل دون بهتان، مقاوم للماء ولا ينتقل بسهولة.\n" +
    "• مثالي للمكياج اليومي ولمسات التعديل السريعة في الحقيبة.\n" +
    "• فيغن، بدون عطر، خالٍ من البارابين والغلوتين، غير مجرّب على الحيوانات، مختبر جلدياً.\n" +
    "• 5.5 غرام — 8 درجات تناسب مختلف ألوان البشرة.\n\n" +
    "نصيحة احترافية: ضعيه على أعلى الخدود وادمِجيه للأعلى نحو الصدغين لإطلالة مرفوعة ومنتعشة.\n\n" +
    "الدرجات المتوفرة:\n" +
    "• 01 Soft Peachy Rose — وردي مشمشي ناعم دافئ\n" +
    "• 02 Warm Dusty Rose — وردي ترابي دافئ\n" +
    "• 03 Rosy Bloom — وردي مزهر طبيعي\n" +
    "• 04 Light Coral — مرجاني فاتح (الاسم الرسمي)\n" +
    "• 05 Cool Mauve Rose — وردي موف بارد\n" +
    "• 06 Berry Crush — توتي غامق جريء\n" +
    "• 07 Deep Wine — نبيذي عنابي عميق\n" +
    "• 08 Soft Pink — وردي ناعم فاتح",
  descriptionEn:
    "Mon Reve Blush Bar — a sheer, moisturizing multi-use cream blush stick that delivers a healthy flush and natural glow in one swipe. Ultra-creamy, weightless and oil-free — blends seamlessly on cheeks, lips and eyes.\n\n" +
    "• Sheer, buildable colour from a soft everyday flush to a bolder payoff.\n" +
    "• Long-wearing, water-resistant and transfer-resistant finish that stays true.\n" +
    "• Twist-up stick perfect for daily wear and on-the-go touch-ups.\n" +
    "• Vegan, fragrance-free, paraben-free, gluten-free, cruelty-free, dermatologically tested.\n" +
    "• 5.5g — 8 flattering shades for every skin tone.\n\n" +
    "Pro tip: Apply on the high points of the cheeks and blend upwards toward the temples for a lifted, fresh look.\n\n" +
    "Available shades:\n" +
    "• 01 Soft Peachy Rose — warm soft peachy rose\n" +
    "• 02 Warm Dusty Rose — warm dusty rose\n" +
    "• 03 Rosy Bloom — natural rosy bloom\n" +
    "• 04 Light Coral — official shade name\n" +
    "• 05 Cool Mauve Rose — cool mauve rose\n" +
    "• 06 Berry Crush — deep berry\n" +
    "• 07 Deep Wine — deep wine burgundy\n" +
    "• 08 Soft Pink — soft light pink",
};

type ShadeInput = {
  name: string;
  colorHex: string;
  imageUrl: string;
  position: number;
};

/** Descriptive shade names (official codes 01–08; only 04 has an official colour name: Light Coral). */
const SHADES: ShadeInput[] = [
  {
    name: "01 Soft Peachy Rose",
    colorHex: "#D08E88",
    imageUrl: `${TP}/9805-large_default/mon-reve-blush-bar-01.jpg`,
    position: 0,
  },
  {
    name: "02 Warm Dusty Rose",
    colorHex: "#994042",
    imageUrl: `${OFF}/2023/09/Mon_Reve_blush_bar_2_2.jpg`,
    position: 1,
  },
  {
    name: "03 Rosy Bloom",
    colorHex: "#B87781",
    imageUrl: `${OFF}/2023/09/Mon_Reve_blush_bar_3_2.jpg`,
    position: 2,
  },
  {
    name: "04 Light Coral",
    colorHex: "#C05658",
    imageUrl: `${TP}/9811-large_default/mon-reve-blush-bar-04.jpg`,
    position: 3,
  },
  {
    name: "05 Cool Mauve Rose",
    colorHex: "#9F6E72",
    imageUrl: `${OFF}/2023/09/Mon_Reve_blush_bar_5_2.jpg`,
    position: 4,
  },
  {
    name: "06 Berry Crush",
    colorHex: "#A7283F",
    imageUrl: `${OFF}/2023/09/Mon_Reve_blush_bar_6_2.jpg`,
    position: 5,
  },
  {
    name: "07 Deep Wine",
    colorHex: "#5F2729",
    imageUrl: `${OFF}/2026/06/5201641049686_1.jpg`,
    position: 6,
  },
  {
    name: "08 Soft Pink",
    colorHex: "#E792A6",
    imageUrl: `${OFF}/2026/01/Mon_Reve_blush_bar_8_2.jpg`,
    position: 7,
  },
];

const PRODUCT_IMAGES = [
  `${OFF}/2024/04/blush-bar.jpg`,
  `${OFF}/2025/04/blush-bar.jpg`,
  `${OFF}/2023/09/Mon_Reve_blush_bar.jpg`,
  `${OFF}/2025/02/mon_reve_sep2.jpg`,
  `${OFF}/2023/09/Mon_Reve_blush_bar_1_1.jpg`,
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
  const search = await api<{ data?: Array<{ id: string; name?: string; nameEn?: string }> } | Array<{ id: string; name?: string; nameEn?: string }>>(
    `/brands?search=${encodeURIComponent("Mon Reve")}&limit=20`,
  );
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
    await new Promise((r) => setTimeout(r, 400));
  }

  console.log("\nUploading product gallery images...");
  const galleryIds: string[] = [];
  for (const url of PRODUCT_IMAGES) {
    const id = await uploadImage(url, "product-gallery");
    galleryIds.push(id);
    console.log(`  ✓ gallery`);
    await new Promise((r) => setTimeout(r, 400));
  }

  shades.sort((a, b) => a.position - b.position);
  const imageIds = [...new Set([...shades.map((s) => s.imageId), ...galleryIds])];

  const created = await api<{ id: string }>("/products", "POST", {
    sku: PRODUCT.sku,
    barcode: PRODUCT.barcode,
    slug: PRODUCT.slug,
    brandId,
    categoryId: MAKEUP,
    subcategoryId: CHEEK,
    tertiaryCategoryId: BLUSH,
    subcategoryIds: [CHEEK],
    tertiaryCategoryIds: [BLUSH],
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
    console.log(`    - ${s.name} → ${s.colorHex ?? "?"}${s.barcode ? ` [barcode: ${s.barcode}]` : ""}`);
  }
  console.log(`  Images: ${imageIds.length}`);
  console.log(`  Category: Makeup → Cheek → Blush`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
