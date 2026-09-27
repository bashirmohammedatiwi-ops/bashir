/**
 * Radiant Professional Matt Lasting Lip Color — all 41 shades.
 * Sources: hondoscenter.com / radiant-professional.com
 * Usage: npx tsx scripts/add-radiant-matt-lasting-lip-color-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const CATEGORY_ID = "d3c24d19-dde5-41e5-b0a9-bede45393795";
const LIPS = "56da5b82-c847-4e9b-9cea-cc901236189f";
const LIPSTICK = "eaa06284-281e-475f-937b-b01ee24192df";

const PRODUCT = {
  slug: "radiant-professional-matt-lasting-lip-color",
  sku: "RAD-MLLC",
  price: 16000,
  nameAr: "راديانت بروفيشنال - أحمر شفاه مات لاستينغ",
  nameEn: "Radiant Professional - Matt Lasting Lip Color",
  descriptionAr:
    "أحمر شفاه مات لاستينغ من راديانت بروفيشنال — لون غني بملمس مطفي وثبات طويل طوال اليوم.\n\n" +
    "• تركيبة كريمية ناعمة بلون غني ولمسة مطفية أنيقة.\n• ثبات طويل الأمد ومقاوم للانتقال.\n• مجموعة واسعة من الدرجات من النيود إلى الأحمر والوردي.\n• يمنح الشفاه مظهراً متناسقاً ومحدداً.\n• مختبر جلدياً.\n• يُطبّق مباشرة على الشفاه أو بفرشاة الشفاه.",
  descriptionEn:
    "Radiant Professional Matt Lasting Lip Color — rich matte colour with long-lasting, non-transfer wear.\n\n" +
    "• Creamy, smooth formula with rich colour and an elegant matte finish.\n• Long-lasting, transfer-resistant wear.\n• Wide shade range from nudes to reds and pinks.\n• Leaves lips looking even and defined.\n• Dermatologically tested.\n• Apply directly to lips or with a lip brush.",
};

type ShadeInput = {
  name: string;
  colorHex: string;
  barcode: string;
  imageUrl: string;
  position: number;
};

const IMG_RADIANT = "https://radiant-professional.com/media/images/products";
const IMG_BROCARD = "https://www.brocard.ua/media/catalog/product/5/2";

const SHADES: ShadeInput[] = [
  { name: "01", colorHex: "#b76665", barcode: "5201641723821", imageUrl: `${IMG_RADIANT}/2023/03/5201641723821_1_YYaCeq5.jpg`, position: 0 },
  { name: "02", colorHex: "#b16e5e", barcode: "5201641723838", imageUrl: `${IMG_RADIANT}/2023/03/5201641723838_1_3PWIzGQ.jpg`, position: 1 },
  { name: "04", colorHex: "#b25b6b", barcode: "5201641723852", imageUrl: `${IMG_RADIANT}/2023/03/5201641723852_1_s4wFH4q.jpg`, position: 2 },
  { name: "05", colorHex: "#d07663", barcode: "5201641723869", imageUrl: `${IMG_RADIANT}/2023/03/5201641723869_1_fuTHIG5.jpg`, position: 3 },
  { name: "06", colorHex: "#ad6a5a", barcode: "5201641723876", imageUrl: `${IMG_RADIANT}/2023/03/5201641723876_1_JmiEaWc.jpg`, position: 4 },
  { name: "07", colorHex: "#985657", barcode: "5201641723883", imageUrl: `${IMG_RADIANT}/2023/03/5201641723883_1_2OM5y13.jpg`, position: 5 },
  { name: "08", colorHex: "#ad3541", barcode: "5201641723890", imageUrl: `${IMG_RADIANT}/2023/03/5201641723890_1_Phd50zt.jpg`, position: 6 },
  { name: "11", colorHex: "#863949", barcode: "5201641723920", imageUrl: `${IMG_RADIANT}/2023/03/5201641723920_1_fyNLZNz.jpg`, position: 7 },
  { name: "13", colorHex: "#f08478", barcode: "5201641725047", imageUrl: `${IMG_RADIANT}/2024/09/5201641725047_1_N1Mfktr.jpg`, position: 8 },
  { name: "14", colorHex: "#71103e", barcode: "5201641725054", imageUrl: `${IMG_RADIANT}/2023/03/5201641725054_1_4VJX3Rd.jpg`, position: 9 },
  { name: "15", colorHex: "#ed7f98", barcode: "5201641725061", imageUrl: `${IMG_RADIANT}/2024/09/5201641725061_1_HZ2QJpt.jpg`, position: 10 },
  { name: "17", colorHex: "#ba1825", barcode: "5201641725085", imageUrl: `${IMG_RADIANT}/2023/03/5201641725085_1_kYDyie8.jpg`, position: 11 },
  { name: "18", colorHex: "#960026", barcode: "5201641727331", imageUrl: `${IMG_RADIANT}/2024/09/5201641727331_1_OSyDUEu.jpg`, position: 12 },
  { name: "19", colorHex: "#a85253", barcode: "5201641727379", imageUrl: `${IMG_RADIANT}/2023/03/5201641727379_1_ltsqQUc.jpg`, position: 13 },
  { name: "21", colorHex: "#8a483c", barcode: "5201641727393", imageUrl: `${IMG_RADIANT}/2023/03/5201641727393_1_Pn4ehi0.jpg`, position: 14 },
  { name: "22", colorHex: "#791c2e", barcode: "5201641727430", imageUrl: `${IMG_RADIANT}/2023/03/5201641727430_1_k1HaI3t.jpg`, position: 15 },
  { name: "33", colorHex: "#98324a", barcode: "5201641734094", imageUrl: `${IMG_RADIANT}/2023/03/5201641734094_1_wDUBruH.jpg`, position: 16 },
  { name: "35", colorHex: "#8c5751", barcode: "5201641734117", imageUrl: `${IMG_RADIANT}/2023/03/5201641734117_1_PleResF.jpg`, position: 17 },
  { name: "42", colorHex: "#d2667b", barcode: "5201641737132", imageUrl: `${IMG_RADIANT}/2023/03/5201641737132_1_8vRHMyK.jpg`, position: 18 },
  { name: "43", colorHex: "#cf8b85", barcode: "5201641737149", imageUrl: `${IMG_RADIANT}/2023/03/5201641737149_1_jQ0eIgi.jpg`, position: 19 },
  { name: "50", colorHex: "#c8303c", barcode: "5201641740149", imageUrl: `${IMG_RADIANT}/2023/03/5201641740149_1_0erdkpT.jpg`, position: 20 },
  { name: "51", colorHex: "#bd1d3f", barcode: "5201641740156", imageUrl: `${IMG_RADIANT}/2023/03/5201641740156_1_tEzlFak.jpg`, position: 21 },
  { name: "59", colorHex: "#cf967b", barcode: "5201641742051", imageUrl: `${IMG_RADIANT}/2023/03/5201641742051_1_GfB4QBX.jpg`, position: 22 },
  { name: "60", colorHex: "#c69382", barcode: "5201641742068", imageUrl: `${IMG_RADIANT}/2023/03/5201641742068_1_V3tZMPB.jpg`, position: 23 },
  { name: "71 Nude", colorHex: "#c5878a", barcode: "5201641747988", imageUrl: `${IMG_RADIANT}/2023/03/5201641747988_1_MXlbyv9.jpg`, position: 24 },
  { name: "86 Azalea", colorHex: "#c04387", barcode: "5201641023198", imageUrl: `${IMG_RADIANT}/2023/03/5201641023198_1_CyGUHyx.jpg`, position: 25 },
  { name: "92 Burnt Orange", colorHex: "#ac4e46", barcode: "5201641033913", imageUrl: `${IMG_RADIANT}/2024/03/radiant_matt_lasting_lip_color_92_1_PKWZY30.jpg`, position: 26 },
  { name: "93 Natural", colorHex: "#976868", barcode: "5201641038253", imageUrl: `${IMG_RADIANT}/2024/10/radiant_matt_lasting_93_01_5hYCSj7.jpg`, position: 27 },
  { name: "94 Dalia", colorHex: "#7a344b", barcode: "5201641038260", imageUrl: `${IMG_RADIANT}/2024/10/radiant_matt_lasting_94_01_mrSsMe5.jpg`, position: 28 },
  { name: "95 Strawberry", colorHex: "#860116", barcode: "5201641038277", imageUrl: `${IMG_RADIANT}/2024/10/radiant_matt_lasting_95_01_eh9ryDM.jpg`, position: 29 },
  { name: "97 Strawberry", colorHex: "#d70164", barcode: "5201641043998", imageUrl: `${IMG_RADIANT}/2025/04/radiant_matt_lasting_lip_color_97_1_V98MWfE.jpg`, position: 30 },
  { name: "98 Metal Pink", colorHex: "#f26793", barcode: "5201641044001", imageUrl: `${IMG_RADIANT}/2025/04/radiant_matt_lasting_98_1_l5hvWKy.jpg`, position: 31 },
  { name: "99 Rose Metal", colorHex: "#e6547c", barcode: "5201641044018", imageUrl: `${IMG_RADIANT}/2025/04/radiant_matt_lasting_99_1_k1EaJaV.jpg`, position: 32 },
  { name: "100 Coral", colorHex: "#c64d41", barcode: "5201641044025", imageUrl: `${IMG_RADIANT}/2025/04/radiant_matt_lasting_lip_color_100_1_vxR8EDN.jpg`, position: 33 },
  { name: "101 Bare", colorHex: "#a76162", barcode: "5201641044032", imageUrl: `${IMG_RADIANT}/2025/04/radiant_matt_lasting_lip_color_101_1_p9pA5pa.jpg`, position: 34 },
  { name: "102 Hyacinth", colorHex: "#b0666e", barcode: "5201641044049", imageUrl: `${IMG_RADIANT}/2025/04/radiant_matt_lasting_lip_color_101_1_p9pA5pa.jpg`, position: 35 },
  { name: "103 Hazel", colorHex: "#a57275", barcode: "5201641044056", imageUrl: `${IMG_RADIANT}/2025/09/radiant_matt_lasting_lip_color_102_1.jpg`, position: 36 },
  { name: "104 Toffee", colorHex: "#b26c6c", barcode: "5201641052310", imageUrl: `${IMG_RADIANT}/2026/04/104_TOFFEE.jpg`, position: 37 },
  { name: "105 Fiery", colorHex: "#d42036", barcode: "5201641052327", imageUrl: `${IMG_RADIANT}/2026/04/105_FIERY.jpg`, position: 38 },
  { name: "106 Flamingo", colorHex: "#c54873", barcode: "5201641052334", imageUrl: `${IMG_RADIANT}/2026/04/106_FLAMINGO.jpg`, position: 39 },
  { name: "107 Cerise", colorHex: "#b23258", barcode: "5201641052341", imageUrl: `${IMG_RADIANT}/2026/04/107_CERISE.jpg`, position: 40 },
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
    brandAr: "راديانت بروفيشنال",
    brandEn: "Radiant Professional",
    createIfMissing: true,
  });
  const brandId = resolved.brand?.id;
  if (!brandId) throw new Error("Could not resolve Radiant Professional brand");
  console.log(`Brand: Radiant Professional (${brandId})${resolved.created ? " [created]" : ""}\n`);
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
  console.log(`Shades: ${SHADES.length}\n`);
  await login();
  console.log("Logged in.\n");

  const brandId = await resolveBrandId();

  const existing = await api<{ data?: Array<{ slug?: string }> } | Array<{ slug?: string }>>(
    `/products?search=${encodeURIComponent(PRODUCT.slug)}&status=all&limit=5`,
  );
  const rows = Array.isArray(existing) ? existing : (existing.data ?? []);
  if (rows.some((p) => p.slug === PRODUCT.slug)) {
    console.log(`skip — product already exists (${PRODUCT.slug})`);
    return;
  }

  console.log("Uploading shade images...");
  const shades: Array<{
    name: string;
    colorHex: string;
    barcode: string;
    imageId: string;
    position: number;
    stock: number;
  }> = [];

  for (const shade of SHADES) {
    try {
      const imageId = await uploadImage(shade.imageUrl, shade.name);
      shades.push({
        name: shade.name,
        colorHex: shade.colorHex,
        barcode: shade.barcode,
        imageId,
        position: shade.position,
        stock: 0,
      });
      console.log(`  ✓ ${shade.name} (${shade.colorHex}) — ${shade.barcode}`);
      await new Promise((r) => setTimeout(r, 700));
    } catch (err) {
      console.log(`  ✗ ${shade.name}: ${err instanceof Error ? err.message : err}`);
    }
  }

  if (!shades.length) throw new Error("No shade images uploaded");

  const imageIds = [...new Set(shades.map((s) => s.imageId))];

  const created = await api<{ id: string; name?: string }>("/products", "POST", {
    sku: PRODUCT.sku,
    slug: PRODUCT.slug,
    brandId,
    categoryId: CATEGORY_ID,
    subcategoryId: LIPS,
    tertiaryCategoryId: LIPSTICK,
    subcategoryIds: [LIPS],
    tertiaryCategoryIds: [LIPSTICK],
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

  console.log(`\n✓ Created: ${created.name ?? PRODUCT.nameEn}`);
  console.log(`  ID: ${created.id}`);
  console.log(`  Shades: ${shades.length}`);
  console.log(`  Images: ${imageIds.length}`);
  console.log(`  Price: ${PRODUCT.price} IQD`);
  console.log(`  Category: المكياج → الشفاه → أحمر الشفاه`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
