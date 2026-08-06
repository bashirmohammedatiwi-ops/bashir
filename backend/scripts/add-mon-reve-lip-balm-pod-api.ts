/**
 * Mon Reve Lip Balm Pod — Moisturizing lip balm with coconut oil 5g
 * 5 flavoured shades with official names + official hex (NO shade barcodes).
 * Product barcode: 5201641016848 (shade 03 Watermelon)
 *
 * Sources: monrevecosmetics.com (official names, hex chips, pack + texture photos)
 * Hex: official color-select__option__hex from product page.
 *
 * Usage: npx tsx scripts/add-mon-reve-lip-balm-pod-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const MAKEUP = "d3c24d19-dde5-41e5-b0a9-bede45393795";
const LIPS = "56da5b82-c847-4e9b-9cea-cc901236189f";
/** Tinted balms use Lip Gloss tertiary under Lips (same as GOSH Soft'n Tinted Lip Balm). */
const LIP_GLOSS = "6405a88e-402f-4508-8799-c8f3ad049c66";

const IMG22 = "https://monrevecosmetics.com/media/images/products/2022/03";
const IMG24 = "https://monrevecosmetics.com/media/images/products/2024/03";
const IMG23 = "https://monrevecosmetics.com/media/images/products/2023/08";
const P24 = "https://cdn.pharm24.gr/images/515x515-90";

const PRODUCT = {
  barcode: "5201641016848",
  slug: "mon-reve-lip-balm-pod-moisturizing-coconut-oil-5g",
  sku: "MON-LBP-016848",
  price: 6500,
  originalPrice: 7500,
  nameAr: "مون ريف - بلسم شفاه Lip Balm Pod مرطب بزيت جوز الهند بعلبة جيب ومرآة 5 غرام",
  nameEn: "Mon Reve Lip Balm Pod Moisturizing Lip Balm with Coconut Oil 5g",
  descriptionAr:
    "بلسم شفاه Lip Balm Pod من مون ريف — بلسم مرطب بملمس زبَدي ناعم ورائحة فواكه جذّابة، غني بزيت جوز الهند المعروف بتهدئة الشفاه وتغذيتها، فيتركها ناعمة ومرطّبة لساعات مع لمسة لون خفيفة ولمسة نهائية حريرية.\n\n" +
    "• يغذّي ويهدّئ الشفاه ويمنحها ترطيباً يدوم.\n" +
    "• لمسة لون خفيفة مع لمعان حريري ناعم — مثالي وحده أو كقاعدة قبل أحمر الشفاه.\n" +
    "• علبة جيب عملية بمرآة صغيرة في الغطاء لإعادة التطبيق في أي مكان.\n" +
    "• فيغن، خالٍ من الغلوتين، غير مجرّب على الحيوانات، مختبر جلدياً.\n" +
    "• 5 غرام — 5 نكهات/درجات فواكه منعشة.\n\n" +
    "طريقة الاستخدام: ضعيه على الشفاه كلما رغبتِ. يُستخدم وحده أو قبل أحمر الشفاه كقاعدة ناعمة.\n\n" +
    "الدرجات المتوفرة (الأسماء الرسمية):\n" +
    "• 01 Strawberry — فراولة وردية زاهية\n" +
    "• 02 Coconut — جوز هند بيج دافئ\n" +
    "• 03 Watermelon — بطيخ وردي فاتح\n" +
    "• 04 Blueberry — توت أزرق بنفسجي\n" +
    "• 05 Tutti Frutti — توتي فروتي فوشي فاكهي",
  descriptionEn:
    "Mon Reve Lip Balm Pod — a moisturizing lip balm with pampering care and an irresistible fruity scent. Enriched with coconut oil for its soothing and conditioning qualities, it nourishes and softens lips for hours. Buttery, luscious texture with a silky finish and a hint of colour.\n\n" +
    "• Nourishes and soothes dry lips with lasting moisture.\n" +
    "• Soft tint and silky shine — wear alone or under lipstick as a smooth base.\n" +
    "• Pocket-friendly case with a small mirror on the lid for on-the-go touch-ups.\n" +
    "• Vegan, gluten-free, cruelty-free, dermatologically tested.\n" +
    "• 5g — 5 fresh fruity flavours/shades.\n\n" +
    "How to use: Apply to lips as often as you please. Use alone or before lipstick for a smooth base.\n\n" +
    "Available shades (official names):\n" +
    "• 01 Strawberry — bright strawberry pink\n" +
    "• 02 Coconut — warm beige coconut\n" +
    "• 03 Watermelon — soft watermelon pink\n" +
    "• 04 Blueberry — violet blueberry\n" +
    "• 05 Tutti Frutti — fruity fuchsia",
};

type ShadeInput = {
  name: string;
  colorHex: string;
  imageUrl: string;
  position: number;
};

/** Official shade names + hex from monrevecosmetics.com. Images: official texture swatches. */
const SHADES: ShadeInput[] = [
  {
    name: "01 Strawberry",
    colorHex: "#F8485E",
    imageUrl: `${IMG22}/Mon_reve_Pod_lip_balm__01_1_txtr.jpg`,
    position: 0,
  },
  {
    name: "02 Coconut",
    colorHex: "#C0A392",
    imageUrl: `${IMG22}/Mon_reve_Pod_lip_balm__02_txtr.jpg`,
    position: 1,
  },
  {
    name: "03 Watermelon",
    colorHex: "#FF8DA1",
    imageUrl: `${IMG22}/Mon_reve_Pod_lip_balm__03_txtr.jpg`,
    position: 2,
  },
  {
    name: "04 Blueberry",
    colorHex: "#B580D1",
    imageUrl: `${IMG22}/Mon_reve_Pod_lip_balm__04_txtr.jpg`,
    position: 3,
  },
  {
    name: "05 Tutti Frutti",
    colorHex: "#DB5391",
    imageUrl: `${IMG24}/Mon_reve_Pod_lip_balm__05_txtr.jpg`,
    position: 4,
  },
];

const PRODUCT_IMAGES = [
  `${IMG22}/Mon_reve_Pod_lip_balm__03_3_copy.jpg`,
  `${IMG22}/Mon_reve_Pod_lip_balm__03_4_copy.jpg`,
  `${IMG22}/Mon_reve_Pod_lip_balm__03_txtr.jpg`,
  `${IMG22}/Mon_reve_Pod_lip_balm__03_2.jpg`,
  `${IMG22}/Mon_reve_Pod_lip_balm__01_3_copy.jpg`,
  `${IMG22}/Mon_reve_Pod_lip_balm__02_3_copy.jpg`,
  `${IMG22}/Mon_reve_Pod_lip_balm__04_3.jpg`,
  `${IMG24}/Mon-reve-Pod-lip-balm-_05_7.jpg`,
  `${IMG24}/Mon-reve-Pod-lip-balm-_05_447.jpg`,
  `${IMG22}/Mon_reve_Pod_lip_balm__00_1_copy.jpg`,
  `${IMG23}/pods_banner_2880x1300.jpg`,
  `${P24}/5201641016848.jpg`,
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
    tertiaryCategoryId: LIP_GLOSS,
    subcategoryIds: [LIPS],
    tertiaryCategoryIds: [LIP_GLOSS],
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
  console.log(`  Category: Makeup → Lips → Lip Gloss`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
