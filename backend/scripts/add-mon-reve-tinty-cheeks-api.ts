/**
 * Mon Reve Tinty Cheeks — Liquid blusher for a healthy, flushed look 14ml
 * 6 shades with images + official hex (NO shade barcodes).
 * Product barcode: 5201641006467 (shade 04)
 *
 * Sources: monrevecosmetics.com (official codes, hex chips, pack + texture photos)
 * Hex: official color-select__option__hex from product page.
 *
 * Usage: npx tsx scripts/add-mon-reve-tinty-cheeks-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const MAKEUP = "d3c24d19-dde5-41e5-b0a9-bede45393795";
const CHEEK = "7b95190f-d5b7-4dff-8456-3c6d10fdafe6";
const BLUSH = "388af575-b9d3-484f-b382-3376cbb4efe8";

const IMG = "https://monrevecosmetics.com/media/images/products";

const PRODUCT = {
  barcode: "5201641006467",
  slug: "mon-reve-tinty-cheeks-liquid-blusher-14ml",
  sku: "MON-TC-006467",
  price: 7500,
  originalPrice: 8500,
  nameAr: "مون ريف - أحمر خدود سائل Tinty Cheeks لتورّد صحي ولمعان طبيعي 14 مل",
  nameEn: "Mon Reve Tinty Cheeks Liquid Blusher for a Healthy, Flushed Look 14ml",
  descriptionAr:
    "تينتي شيكس Tinty Cheeks من مون ريف — أحمر خدود سائل خفيف يمنحكِ تورّداً صحياً ولوناً شفافاً طبيعياً على تفاحة الخد، بلمسة منعشة ولمعان ناعم يمكن بناؤه حسب الرغبة.\n\n" +
    "• يندمج بسهولة مع البشرة دون خطوط، ويجف بسرعة ويثبت طوال اليوم دون انتقال.\n" +
    "• تأثير «pinched» ناعم — من مكياج بدون مكياج إلى لون أوضح بطبقات إضافية.\n" +
    "• يتناسق مع البرايمر والفاونديشن والبودرة؛ ويصلح أيضاً للجفون والشفاه لإطلالة متناسقة.\n" +
    "• مقاوم للماء، فيغن، خالٍ من البارابين والغلوتين، غير مجرّب على الحيوانات، مختبر جلدياً وطبّياً للعيون.\n" +
    "• 14 مل — 6 درجات طبيعية تناسب مختلف ألوان البشرة.\n\n" +
    "طريقة الاستخدام: رجّي العبوة جيداً قبل الاستخدام. كمية قليلة تكفي — ضعي نقطة صغيرة على تفاحة الخد وادمِجيها بأصابعكِ أو بإسفنجة أو بفرشاة بلش. لأول استخدام جربي الكمية على ظاهر اليد أولاً.\n\n" +
    "الدرجات المتوفرة (الأسماء الرسمية أرقام فقط):\n" +
    "• 01 — مرجاني مشمشي دافئ\n" +
    "• 02 — وردي ترابي ناعم\n" +
    "• 03 — وردي بني باهت طبيعي\n" +
    "• 04 — وردي فوشي حيوي\n" +
    "• 05 — وردي ناعم فاتح\n" +
    "• 06 — خوخي مرجاني مشرق",
  descriptionEn:
    "Mon Reve Tinty Cheeks — lightweight liquid blusher for a healthy, flushed look. Blends effortlessly into a seamless sheer colour on the apples of the cheeks, with a soft “pinched” effect you can build as desired.\n\n" +
    "• Dries quickly and lasts all day without transferring.\n" +
    "• Ideal for no-makeup makeup on the go; pairs perfectly with primer, foundation or face powder.\n" +
    "• Can also be tapped onto eyelids and lips for a full flushed look.\n" +
    "• Water-resistant, vegan, paraben-free, gluten-free, cruelty-free; dermatologically and ophthalmologically tested.\n" +
    "• 14ml — 6 natural shades for every skin tone.\n\n" +
    "How to use: Shake well before application. A little goes a long way — gently squeeze a small amount along the apples of the cheeks and blend with fingertips, sponge or blush brush. For first use, try a small amount on the back of your hand first.\n\n" +
    "Available shades (official codes are numbers only):\n" +
    "• 01 — warm peachy coral\n" +
    "• 02 — soft dusty rose\n" +
    "• 03 — muted dusty rose-brown\n" +
    "• 04 — vibrant fuchsia pink\n" +
    "• 05 — soft light pink\n" +
    "• 06 — bright peachy coral",
};

type ShadeInput = {
  name: string;
  colorHex: string;
  imageUrl: string;
  position: number;
};

/** Official shade codes + hex from monrevecosmetics.com color chips. Images: official texture/swatch. */
const SHADES: ShadeInput[] = [
  {
    name: "01",
    colorHex: "#F28D7A",
    imageUrl: `${IMG}/2021/06/5201641006436_4.jpg`,
    position: 0,
  },
  {
    name: "02",
    colorHex: "#CA7C73",
    imageUrl: `${IMG}/2021/06/Mon_Reve_Tinty_Cheeks_02_txtr_02.jpg`,
    position: 1,
  },
  {
    name: "03",
    colorHex: "#BB8073",
    imageUrl: `${IMG}/2021/06/5201641006450_4.jpg`,
    position: 2,
  },
  {
    name: "04",
    colorHex: "#FF6982",
    imageUrl: `${IMG}/2021/06/5201641006467_4.jpg`,
    position: 3,
  },
  {
    name: "05",
    colorHex: "#FA8EA7",
    imageUrl: `${IMG}/2021/06/5201641006474_4.jpg`,
    position: 4,
  },
  {
    name: "06",
    colorHex: "#F4917F",
    imageUrl: `${IMG}/2021/06/5201641006481_4.jpg`,
    position: 5,
  },
];

const PRODUCT_IMAGES = [
  `${IMG}/2021/06/5201641006467_1.jpg`,
  `${IMG}/2021/06/5201641006467_2.jpg`,
  `${IMG}/2021/06/5201641006467_4.jpg`,
  `${IMG}/2021/06/Mon_Reve_Tinty_Cheeks_closed_02.jpg`,
  `${IMG}/2021/06/Mon_Reve_Tinty_Cheeks_open_02.jpg`,
  `${IMG}/2021/06/5201641006436_1.jpg`,
  `${IMG}/2021/06/5201641006450_1.jpg`,
  `${IMG}/2021/06/5201641006474_1.jpg`,
  `${IMG}/2021/06/5201641006481_1.jpg`,
  `${IMG}/2023/08/mon_reve_tinty_cheeks_post.jpg`,
  `${IMG}/2023/08/tinty_cheeks_4_.jpg`,
  `${IMG}/2025/02/mon-reve-tinty-cheeks_1.jpg`,
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
    console.log(`    - ${s.name} → ${s.colorHex ?? "?"}`);
  }
  console.log(`  Images: ${imageIds.length}`);
  console.log(`  Category: Makeup → Cheek → Blush`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
