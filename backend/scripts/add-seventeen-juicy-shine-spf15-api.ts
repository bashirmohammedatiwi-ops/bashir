/**
 * Seventeen Juicy Shine SPF15 — Juicy Lip Gloss 10ml
 * 14 official shades with images + hex (NO shade barcodes).
 * Product barcode: 5201641034712 (shade 03 Natural Pink)
 *
 * Sources: seventeencosmetics.com (official shade names + pack photos)
 * Hex sampled from official product images (gloss pigment regions).
 *
 * Usage: npx tsx scripts/add-seventeen-juicy-shine-spf15-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const MAKEUP = "d3c24d19-dde5-41e5-b0a9-bede45393795";
const LIPS = "56da5b82-c847-4e9b-9cea-cc901236189f";
const LIP_GLOSS = "6405a88e-402f-4508-8799-c8f3ad049c66";

const OFF = "https://seventeencosmetics.com/media/images/products";

const PRODUCT = {
  barcode: "5201641034712",
  slug: "seventeen-juicy-shine-spf15-juicy-lip-gloss-10ml",
  sku: "SEV-JS-034712",
  price: 14000,
  originalPrice: 16000,
  nameAr: "سفنتيين - جلوس شفاه Juicy Shine SPF15 لامع مرطب بنكهة الرمان 10 مل",
  nameEn: "Seventeen Juicy Shine SPF15 Juicy Lip Gloss Explosive Shine 10ml",
  descriptionAr:
    "جلوس شفاه Juicy Shine SPF15 من سفنتيين — لون شفاف ناعم مع لمعان انفجاري يجعل الشفاه لا تُقاوَم، غني بمستخلص الرمان للترطيب ومعامل حماية SPF15 لبشرة الشفاه الحساسة.\n\n" +
    "• لون شبه شفاف مع لمعة عالية طويلة الأمد دون لصوق.\n" +
    "• رمان مرطّب + SPF15 لحماية الشفاه من الشمس.\n" +
    "• أداة تطبيق مصمّمة خصيصاً لتوزيع متساوٍ وسلس.\n" +
    "• مثالي وحده أو فوق أحمر الشفاه المفضّل لديكِ لمظهر juicy أقوى.\n" +
    "• مختبر جلدياً — خالٍ من الغلوتين.\n" +
    "• 10 مل — 14 درجة رسمية من الشفاف إلى الوردي والأحمر والدرجات اللامعة.\n\n" +
    "طريقة الاستخدام: ضعيه على الشفاه بأداة التطبيق المرفقة. نصيحة: أضيفيه فوق أحمر شفاه سفنتيين للمزيد من اللمعان.\n\n" +
    "الدرجات المتوفرة:\n" +
    "• 01 Clear — شفاف نقي\n" +
    "• 02 Glossy — لامع وردي ترابي\n" +
    "• 03 Natural Pink — وردي طبيعي\n" +
    "• 04 Nude — نود دافئ\n" +
    "• 05 Magic Sparkle — وردي مع لمعة سحرية\n" +
    "• 06 Dreamy Pink — وردي حالم غني\n" +
    "• 10 Peachy — مشمشي مرجاني\n" +
    "• 11 Tan — تان بني دافئ\n" +
    "• 12 Red Wine — نبيذي أحمر\n" +
    "• 16 Pink Gold — وردي ذهبي\n" +
    "• 17 Candy Sparkle — أحمر كاندي لامع\n" +
    "• 18 Pink Cloud — وردي سحابي ناعم\n" +
    "• 20 Bayberry — توت غامق\n" +
    "• 21 Vermilion — قرمزي عميق",
  descriptionEn:
    "Seventeen Juicy Shine SPF15 — a juicy lip gloss for subtle colour with explosive shine that makes lips irresistible. Enriched with pomegranate for hydration and SPF15 for sun protection; semi-transparent formula with extra-shiny shades and a specially designed applicator for seamless application.\n\n" +
    "• Sheer colour with long-lasting high-gloss finish — not sticky.\n" +
    "• Pomegranate hydration + SPF15 sun protection for delicate lip skin.\n" +
    "• Specially designed applicator for even, effortless application.\n" +
    "• Wear alone or layer over your favourite Seventeen lipstick for explosive gloss.\n" +
    "• Dermatologically tested — gluten free.\n" +
    "• 10ml — 14 official shades from clear to pinks, nudes, reds and sparkles.\n\n" +
    "How to use: Apply on lips with the provided applicator. Extra tip: add on top of your favourite Seventeen lipstick for explosive gloss.\n\n" +
    "Available shades:\n" +
    "• 01 Clear — pure clear shine\n" +
    "• 02 Glossy — glossy dusty rose\n" +
    "• 03 Natural Pink — natural pink\n" +
    "• 04 Nude — warm nude\n" +
    "• 05 Magic Sparkle — pink with magic sparkle\n" +
    "• 06 Dreamy Pink — rich dreamy pink\n" +
    "• 10 Peachy — peachy coral\n" +
    "• 11 Tan — warm tan\n" +
    "• 12 Red Wine — deep red wine\n" +
    "• 16 Pink Gold — pink gold\n" +
    "• 17 Candy Sparkle — candy red sparkle\n" +
    "• 18 Pink Cloud — soft pink cloud\n" +
    "• 20 Bayberry — deep bayberry\n" +
    "• 21 Vermilion — deep vermilion",
};

type ShadeInput = {
  name: string;
  colorHex: string;
  imageUrl: string;
  position: number;
};

/** Official shade names from seventeencosmetics.com; hex from official pack photos. */
const SHADES: ShadeInput[] = [
  { name: "01 Clear", colorHex: "#E4E4E4", imageUrl: `${OFF}/2026/02/juicy_shine_01.jpeg`, position: 0 },
  { name: "02 Glossy", colorHex: "#A9626B", imageUrl: `${OFF}/2026/02/juicy_shine_02.jpeg`, position: 1 },
  { name: "03 Natural Pink", colorHex: "#B84F6C", imageUrl: `${OFF}/2026/02/juicy_shine_03.jpeg`, position: 2 },
  { name: "04 Nude", colorHex: "#994E4B", imageUrl: `${OFF}/2026/02/juicy_shine_04.jpeg`, position: 3 },
  { name: "05 Magic Sparkle", colorHex: "#A54F6A", imageUrl: `${OFF}/2026/02/juicy_shine_05.jpeg`, position: 4 },
  { name: "06 Dreamy Pink", colorHex: "#A20535", imageUrl: `${OFF}/2026/02/juicy_shine_06_oYSOcCG.jpeg`, position: 5 },
  { name: "10 Peachy", colorHex: "#EF6F72", imageUrl: `${OFF}/2025/10/juicy_shine_10_86u49K3.png`, position: 6 },
  { name: "11 Tan", colorHex: "#793A40", imageUrl: `${OFF}/2025/10/juicy_shine_11_1.png`, position: 7 },
  { name: "12 Red Wine", colorHex: "#832640", imageUrl: `${OFF}/2026/02/juicy_shine_12.jpeg`, position: 8 },
  { name: "16 Pink Gold", colorHex: "#A76148", imageUrl: `${OFF}/2026/02/juicy_shine_16.jpeg`, position: 9 },
  { name: "17 Candy Sparkle", colorHex: "#992C33", imageUrl: `${OFF}/2026/02/juicy_shine_17.jpeg`, position: 10 },
  { name: "18 Pink Cloud", colorHex: "#CE9FA9", imageUrl: `${OFF}/2026/02/juicy_shine_18.jpeg`, position: 11 },
  { name: "20 Bayberry", colorHex: "#8F2D32", imageUrl: `${OFF}/2026/02/juicy_shine_20.jpeg`, position: 12 },
  { name: "21 Vermilion", colorHex: "#672128", imageUrl: `${OFF}/2026/02/juicy_shine_21.jpeg`, position: 13 },
];

const PRODUCT_IMAGES = [
  `${OFF}/2026/02/juicy_shine_03.jpeg`,
  `${OFF}/2026/02/juicy_shine_01.jpeg`,
  `${OFF}/2026/02/juicy_shine_05.jpeg`,
  `${OFF}/2026/02/juicy_shine_12.jpeg`,
  `${OFF}/2026/02/juicy_shine_18.jpeg`,
  `${OFF}/2025/10/juicy_shine_10_86u49K3.png`,
  "https://beautyfree.gr/66966-large_default/seventeen-juicy-shine-lip-gloss.jpg",
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
