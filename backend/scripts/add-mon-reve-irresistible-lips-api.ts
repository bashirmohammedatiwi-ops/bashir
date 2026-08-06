/**
 * Mon Reve Irresistible Lips — Ultra-moisturizing high-shine lipstick
 * 16 shades with images + hex (NO shade barcodes).
 * Product barcode: 5201641751909 (shade 01 ADORE)
 *
 * Sources: monrevecosmetics.com (official names, product + texture photos)
 * Hex sampled from official texture/swatch images.
 *
 * Usage: npx tsx scripts/add-mon-reve-irresistible-lips-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const MAKEUP = "d3c24d19-dde5-41e5-b0a9-bede45393795";
const LIPS = "56da5b82-c847-4e9b-9cea-cc901236189f";
const LIPSTICK = "eaa06284-281e-475f-937b-b01ee24192df";

const IMG = "https://monrevecosmetics.com/media/images/products";
const P24 = "https://cdn.pharm24.gr/images/515x515-90";

const PRODUCT = {
  barcode: "5201641751909",
  slug: "mon-reve-irresistible-lips-moisturizing-high-shine-lipstick-4-5g",
  sku: "MON-ILIPS-751909",
  price: 7500,
  originalPrice: 8500,
  nameAr: "مون ريف - أحمر شفاه Irresistible Lips مرطّب بلمعان غني وثبات طويل 4.5 غرام",
  nameEn: "Mon Reve Irresistible Lips Ultra-Moisturizing High-Shine Lipstick 4.5g",
  descriptionAr:
    "أحمر شفاه Irresistible Lips من مون ريف — شفاه ممتلئة بلمعان غني ولون كثيف يدوم، بتركيبة فائقة الترطيب تحتوي على زبدة زيوت نباتية (ماكاداميا ومانجو برّي) وزيت الجوجوبا بهيئة جل.\n\n" +
    "• لمعان عالٍ وتغطية غنية بلون ثابت يدوم طوال اليوم.\n" +
    "• مسحوق بتقنية حديثة يملأ خطوط الشفاه ويمنح مظهراً أكثر امتلاءً.\n" +
    "• عبوة أنيقة تفتح بزرّ واحد — عملية وسريعة للاستخدام اليومي.\n" +
    "• خالٍ من البارابين والغلوتين، غير مجرّب على الحيوانات، مختبر جلدياً.\n" +
    "• 4.5 غرام — 16 درجة رومانسية تناسب مختلف الإطلالات.\n\n" +
    "طريقة الاستخدام: ضعيه مباشرة على الشفاه أو بفرشاة للدقّة.\n\n" +
    "الدرجات المتوفرة:\n" +
    "• 01 ADORE — وردي ناعم دافئ\n" +
    "• 02 VELVET — خوخي مخملي\n" +
    "• 03 DELIGHT — وردي ترابي ناعم\n" +
    "• 04 CRUSH — فوشيا كورالي جريء\n" +
    "• 05 KISSED — أحمر وردي مشرق\n" +
    "• 06 Deep Berry — توتي أحمر عميق (بدون اسم رسمي)\n" +
    "• 07 DEVOTION — أحمر نبيذي عميق\n" +
    "• 08 HEAT — أحمر ناري ساطع\n" +
    "• 09 CHARM — بني وردي ساحر\n" +
    "• 10 BELOVED — وردي بني كلاسيكي\n" +
    "• 11 ROMANCE — وردي رومانسي فاقع\n" +
    "• 12 AMOUR — فوشيا وردي جذّاب\n" +
    "• 13 PASSION — برقوقي بنفسجي بشغف\n" +
    "• 14 BLISS — موف وردي ترابي\n" +
    "• 15 DESIRE — وردي مرغوب متوسط\n" +
    "• 16 SEDUCE — نود محمر جذّاب",
  descriptionEn:
    "Mon Reve Irresistible Lips — ultra-moisturizing high-shine lipstick for juicy, richly coloured lips that last. Infused with plant-based oil butters (including macadamia and wild mango) and jojoba oil in gel form to hydrate and care for lips.\n\n" +
    "• High shine, rich coverage and long-lasting colour.\n" +
    "• Latest-technology powder fills lip lines for a fuller-looking pout.\n" +
    "• Click-open packaging for effortless everyday use.\n" +
    "• Paraben-free, gluten-free, cruelty-free, dermatologically tested.\n" +
    "• 4.5g — 16 romantic shades for every look.\n\n" +
    "How to use: Apply directly on lips or with a lip brush for precision.\n\n" +
    "Available shades:\n" +
    "• 01 ADORE — soft warm pink\n" +
    "• 02 VELVET — velvety peachy rose\n" +
    "• 03 DELIGHT — soft dusty rose\n" +
    "• 04 CRUSH — bold coral fuchsia\n" +
    "• 05 KISSED — bright rosy red\n" +
    "• 06 Deep Berry — deep berry red (no official name)\n" +
    "• 07 DEVOTION — deep wine red\n" +
    "• 08 HEAT — vivid fiery red\n" +
    "• 09 CHARM — charming rose brown\n" +
    "• 10 BELOVED — classic rose brown\n" +
    "• 11 ROMANCE — bright romantic pink\n" +
    "• 12 AMOUR — attractive pink fuchsia\n" +
    "• 13 PASSION — passionate plum violet\n" +
    "• 14 BLISS — dusty mauve rose\n" +
    "• 15 DESIRE — medium desirable rose\n" +
    "• 16 SEDUCE — seductive rosy nude",
};

type ShadeInput = {
  name: string;
  colorHex: string;
  imageUrl: string;
  position: number;
};

/** Official shade names (01–05, 07–16). Shade 06 has no official name on monrevecosmetics.com. */
const SHADES: ShadeInput[] = [
  { name: "01 ADORE", colorHex: "#D76F77", imageUrl: `${IMG}/2019/11/mon-reve-lipstick-01.jpg`, position: 0 },
  { name: "02 VELVET", colorHex: "#D1726E", imageUrl: `${IMG}/2019/11/mon-reve-lipstick-02.jpg`, position: 1 },
  { name: "03 DELIGHT", colorHex: "#B76767", imageUrl: `${IMG}/2019/11/mon-reve-lipstick-03.jpg`, position: 2 },
  { name: "04 CRUSH", colorHex: "#BF2F50", imageUrl: `${IMG}/2019/11/mon-reve-lipstick-04.jpg`, position: 3 },
  { name: "05 KISSED", colorHex: "#C72848", imageUrl: `${IMG}/2019/11/mon-reve-lipstick-05.jpg`, position: 4 },
  { name: "06 Deep Berry", colorHex: "#A8012F", imageUrl: `${IMG}/2019/11/mon-reve-lipstick-06.jpg`, position: 5 },
  { name: "07 DEVOTION", colorHex: "#700127", imageUrl: `${IMG}/2019/11/mon-reve-lipstick-07.jpg`, position: 6 },
  { name: "08 HEAT", colorHex: "#D82738", imageUrl: `${IMG}/2019/11/mon-reve-lipstick-08.jpg`, position: 7 },
  { name: "09 CHARM", colorHex: "#AE3F3F", imageUrl: `${IMG}/2019/11/mon-reve-lipstick-09.jpg`, position: 8 },
  { name: "10 BELOVED", colorHex: "#A1393D", imageUrl: `${IMG}/2019/11/mon-reve-lipstick-10.jpg`, position: 9 },
  { name: "11 ROMANCE", colorHex: "#E85076", imageUrl: `${IMG}/2019/11/mon-reve-lipstick-11.jpg`, position: 10 },
  { name: "12 AMOUR", colorHex: "#C84779", imageUrl: `${IMG}/2019/11/mon-reve-lipstick-12.jpg`, position: 11 },
  { name: "13 PASSION", colorHex: "#8F2867", imageUrl: `${IMG}/2019/11/mon-reve-lipstick-13.jpg`, position: 12 },
  { name: "14 BLISS", colorHex: "#8A5255", imageUrl: `${IMG}/2022/10/irresistible_lips_14.jpg`, position: 13 },
  { name: "15 DESIRE", colorHex: "#BA5366", imageUrl: `${IMG}/2026/07/5201641054161_1.jpg`, position: 14 },
  { name: "16 SEDUCE", colorHex: "#A65950", imageUrl: `${IMG}/2026/07/5201641054178_1.jpg`, position: 15 },
];

const PRODUCT_IMAGES = [
  `${IMG}/2019/11/mon-reve-lipstick-01_w-closed.jpg`,
  `${IMG}/2019/11/mon-reve-lipstick-01.jpg`,
  `${P24}/5201641751909_aa.jpg`,
  `${P24}/5201641751909_b.jpg`,
  `${P24}/5201641751909_c.jpg`,
  `${IMG}/2022/10/irresistible_lips_14_1.jpg`,
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
    tertiaryCategoryId: LIPSTICK,
    subcategoryIds: [LIPS],
    tertiaryCategoryIds: [LIPSTICK],
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
  console.log(`  Category: Makeup → Lips → Lipstick`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
