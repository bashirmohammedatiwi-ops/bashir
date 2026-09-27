/**
 * Seventeen SOS Lip Repair SPF15 — soothing moisturizing lip balm 2.6g
 * 7 official shades with images + hex (NO shade barcodes).
 * Product barcode: 5201641038048 (shade 07 Iris)
 *
 * Sources: seventeencosmetics.com/en/catalogue/sos-lip-repair-spf15_1431/
 * Official names: 01 Pink … 07 Iris
 * Hex sampled from stick tip pigment (gold foil excluded).
 *
 * Usage: npx tsx scripts/add-seventeen-sos-lip-repair-spf15-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const MAKEUP = "d3c24d19-dde5-41e5-b0a9-bede45393795";
const LIPS = "56da5b82-c847-4e9b-9cea-cc901236189f";
/** Tinted balms use Lip Gloss tertiary under Lips (same as Mon Reve Lip Balm Pod). */
const LIP_GLOSS = "6405a88e-402f-4508-8799-c8f3ad049c66";

const OFF = "https://seventeencosmetics.com/media/images/products/2025/11";

const PRODUCT = {
  barcode: "5201641038048",
  slug: "seventeen-sos-lip-repair-spf15-lip-balm-2-6g",
  sku: "SEV-SOS-038048",
  price: 9500,
  originalPrice: 11000,
  nameAr: "سفنتيين - بلسم شفاه SOS Lip Repair SPF15 مرطب ومعالج بدرجات ملونة 2.6 غرام",
  nameEn: "Seventeen SOS Lip Repair SPF15 Soothing Moisturizing Lip Balm 2.6g",
  descriptionAr:
    "بلسم شفاه SOS Lip Repair SPF15 من سفنتيين — ليس مرطباً عادياً؛ علاج شامل للشفاه الجافة والمتشققة بتركيبة غنية كريمية، لون شبه شفاف، ورائحة خفيفة، مع حماية شمسية SPF15 تناسب الأجواء العراقية.\n\n" +
    "• يغذّي ويرمّم الشفاه ويستعيد مرونتها ويقلّل مظهر الخطوط الدقيقة.\n" +
    "• زيت الأفوكادو + زبدة الشيا + زبدة المانجو + فيتامين E لترطيب عميق ومضاد أكسدة.\n" +
    "• لون شبه شفاف ملون — يُستخدم وحده لإطلالة طبيعية أو كقاعدة قبل أحمر الشفاه.\n" +
    "• حماية SPF15 طوال السنة من الشمس والجفاف.\n" +
    "• نباتي، خالٍ من الغلوتين، مختبر جلدياً.\n" +
    "• 2.6 غرام — 7 درجات رسمية شفافة ملونة.\n\n" +
    "طريقة الاستخدام: ضعيه على الشفاه وأعيدي التطبيق كلما رغبتِ.\n\n" +
    "الدرجات المتوفرة (الأسماء الرسمية):\n" +
    "• 01 Pink — وردي شفاف ناعم\n" +
    "• 02 Brown — بني دافئ شفاف\n" +
    "• 03 Rosy — وردي ترابي رقيق\n" +
    "• 04 Toffee — توفي كراميل دافئ\n" +
    "• 05 Red — أحمر كرزي شفاف\n" +
    "• 06 Plum — برقوقي عميق\n" +
    "• 07 Iris — بنفسجي إيريس (سوسن) شفاف",
  descriptionEn:
    "Seventeen SOS Lip Repair SPF15 — not a common lip balm that only moisturizes. A rich creamy treatment that rejuvenates lip cells, minimizes the look of fine lines, restores elasticity, and leaves lips healthy and soft with a semi-sheer tint and discreet scent. Wear alone or as a lipstick base. SPF15 sun protection year-round.\n\n" +
    "• Deep repair and moisture for dry, chapped, irritated lips.\n" +
    "• Avocado oil, shea butter, mango butter and Vitamin E for antioxidant nourishment.\n" +
    "• Semi-sheer tinted shades — everyday natural colour or a smooth base under lipstick.\n" +
    "• SPF15 protection against sun exposure.\n" +
    "• Vegan, gluten free, dermatologically tested.\n" +
    "• 2.6g — 7 official clear & tinted shades.\n\n" +
    "How to use: Apply on lips and reapply as often as you wish.\n\n" +
    "Available shades (official names):\n" +
    "• 01 Pink — soft sheer pink\n" +
    "• 02 Brown — warm sheer brown\n" +
    "• 03 Rosy — delicate rosy tint\n" +
    "• 04 Toffee — warm toffee nude\n" +
    "• 05 Red — sheer cherry red\n" +
    "• 06 Plum — deep plum\n" +
    "• 07 Iris — sheer iris lilac",
};

type ShadeInput = {
  name: string;
  colorHex: string;
  imageUrl: string;
  position: number;
};

/** Official shade names from seventeencosmetics.com; hex from stick-tip pigment. */
const SHADES: ShadeInput[] = [
  { name: "01 Pink", colorHex: "#FBBEC4", imageUrl: `${OFF}/LipRepair_01.png`, position: 0 },
  { name: "02 Brown", colorHex: "#C07A6A", imageUrl: `${OFF}/LipRepair_02.png`, position: 1 },
  { name: "03 Rosy", colorHex: "#E5B8BA", imageUrl: `${OFF}/LipRepair_03.png`, position: 2 },
  { name: "04 Toffee", colorHex: "#C37969", imageUrl: `${OFF}/LipRepair_04.png`, position: 3 },
  { name: "05 Red", colorHex: "#B31E37", imageUrl: `${OFF}/LipRepair_05.png`, position: 4 },
  { name: "06 Plum", colorHex: "#623434", imageUrl: `${OFF}/LipRepair_06_UQUmtjS.png`, position: 5 },
  { name: "07 Iris", colorHex: "#D0AADF", imageUrl: `${OFF}/LipRepair_07.png`, position: 6 },
];

const PRODUCT_IMAGES = [
  `${OFF}/LipRepair_07.png`,
  `${OFF}/LipRepair_01.png`,
  `${OFF}/LipRepair_05.png`,
  `${OFF}/LipRepair_02.png`,
  `${OFF}/LipRepair_03.png`,
  `${OFF}/LipRepair_04.png`,
  `${OFF}/LipRepair_06_UQUmtjS.png`,
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
    | { data?: Array<{ id: string; name?: string; nameEn?: string; nameAr?: string }> }
    | Array<{ id: string; name?: string; nameEn?: string; nameAr?: string }>
  >(`/brands?search=${encodeURIComponent("Seventeen")}&limit=50`);
  const rows = Array.isArray(search) ? search : (search.data ?? []);
  const exact = rows.find((b) => {
    const n = `${b.name ?? ""} ${b.nameEn ?? ""} ${b.nameAr ?? ""}`.toLowerCase().trim();
    return n === "seventeen" || /(^|\s)seventeen(\s|$)/.test(n) || n.includes("seven7een") || n.includes("سفنتيين");
  });
  if (exact?.id) {
    console.log(`Brand: Seventeen (${exact.id}) [exact search]\n`);
    return exact.id;
  }
  const resolved = await api<{ brand?: { id: string }; created?: boolean }>("/brands/resolve", "POST", {
    brandAr: "سفنتيين",
    brandEn: "Seventeen",
    createIfMissing: true,
  });
  if (!resolved.brand?.id) throw new Error("Could not resolve Seventeen brand");
  console.log(`Brand: Seventeen (${resolved.brand.id})${resolved.created ? " [created]" : " [resolve]"}\n`);
  return resolved.brand.id;
}

async function uploadImage(url: string, alt: string, attempt = 1): Promise<string> {
  try {
    const res = await fetch(url, {
      headers: { Accept: "image/*", "User-Agent": "Mozilla/5.0 (compatible; AlhayaaCatalog/1.0)" },
    });
    if (!res.ok) throw new Error(`download HTTP ${res.status}`);
    const buffer = Buffer.from(await res.arrayBuffer());
    if (buffer.byteLength < 64) throw new Error("empty image");

    const contentType = (res.headers.get("content-type") || "image/png").split(";")[0].trim();
    const ext = contentType.includes("jpeg") || contentType.includes("jpg") ? "jpg" : contentType.includes("webp") ? "webp" : "png";
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
    try {
      const id = await uploadImage(url, "product-gallery");
      galleryIds.push(id);
      console.log(`  ✓ gallery`);
    } catch (err) {
      console.log(`  ✗ gallery skip: ${(err as Error).message} (${url.split("/").pop()})`);
    }
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
    nameAr?: string;
    nameEn?: string;
    descriptionAr?: string;
    descriptionEn?: string;
    shades?: Array<{ name: string; colorHex?: string; barcode?: string; imageId?: string }>;
  }>(`/products/${created.id}`);

  if (!verify.nameAr || !verify.nameEn || !verify.descriptionAr || !verify.descriptionEn) {
    throw new Error("Missing bilingual name/description after create");
  }

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
  console.log(`  Category: Makeup → Lips → Lip Gloss`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
