/**
 * Radiant Professional Softline Waterproof Lip Pencil — all 16 shades.
 * Sources: hondoscenter.com / radiant-professional.com
 * Usage: npx tsx scripts/add-radiant-softline-waterproof-lip-pencil-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const CATEGORY_ID = "d3c24d19-dde5-41e5-b0a9-bede45393795";
const LIPS = "56da5b82-c847-4e9b-9cea-cc901236189f";
const LIP_LINER = "54e393a9-90bf-41bb-beeb-c5364afce287";

const IMG_2022 = "https://radiant-professional.com/media/images/products/2022/08";
const IMG_2025 = "https://radiant-professional.com/media/images/products/2025/12";
const IMG_BROCARD = "https://www.brocard.ua/media/catalog/product/5/2";

const PRODUCT = {
  slug: "radiant-professional-softline-waterproof-lip-pencil",
  sku: "RAD-SWLP",
  price: 9500,
  nameAr: "راديانت بروفيشنال - قلم شفاه سوفت لاين مقاوم للماء",
  nameEn: "Radiant Professional - Softline Waterproof Lip Pencil",
  descriptionAr:
    "قلم شفاه سوفت لاين مقاوم للماء من راديانت بروفيشنال — لتحديد وإبراز محيط الشفاه بلون ثابت طوال اليوم.\n\n" +
    "• تركيبة ناعمة غنية بفيتامين إي وزيت الجوجوبا ومضادات أكسدة طبيعية.\n• مقاوم للماء ولا ينتقل بسهولة.\n• يحدد ويصحح شكل الشفاه قبل وضع أحمر الشفاه.\n• مجموعة واسعة من الدرجات لتناسب مختلف ألوان أحمر الشفاه والملمع.\n• مختبر جلدياً.\n• يُطبّق لتحديد محيط الشفاه قبل أحمر الشفاه أو لملء الشفاه بالكامل.",
  descriptionEn:
    "Radiant Professional Softline Waterproof Lip Pencil — soft waterproof lip liner for defining and correcting lip shape.\n\n" +
    "• Soft formula with natural antioxidants, Vitamin E and Jojoba oil.\n• Non-transfer, long-lasting waterproof wear.\n• Outlines and corrects lip shape before lipstick.\n• Wide shade range to match lipsticks and glosses.\n• Dermatologically tested.\n• Apply to outline lips before lipstick or fill in for all-over colour.",
};

type ShadeInput = {
  name: string;
  colorHex: string;
  imageUrl: string;
  position: number;
};

const SHADES: ShadeInput[] = [
  { name: "01 Caramel", colorHex: "#984a38", imageUrl: `${IMG_BROCARD}/5201641050156_1.jpg`, position: 0 },
  { name: "02 Hazelnut", colorHex: "#a25c4b", imageUrl: `${IMG_2022}/5201641690109_FypQPnE.jpg`, position: 1 },
  { name: "03 Natural", colorHex: "#8a473f", imageUrl: `${IMG_2022}/5201641690116_loMsX5H.jpg`, position: 2 },
  { name: "04 Buff", colorHex: "#79413e", imageUrl: `${IMG_2022}/5201641690123_bNnmn3X.jpg`, position: 3 },
  { name: "05 Raspberry", colorHex: "#85343f", imageUrl: `${IMG_2022}/5201641690130_x3EqfWg.jpg`, position: 4 },
  { name: "09 Red Apple", colorHex: "#b44b4d", imageUrl: `${IMG_2022}/5201641690147_NYmLSuk.jpg`, position: 5 },
  { name: "10 Cherry", colorHex: "#b21a36", imageUrl: `${IMG_2022}/5201641690185_wek8xEU.jpg`, position: 6 },
  { name: "11 Wine", colorHex: "#872c38", imageUrl: `${IMG_2022}/5201641690192_pgJcyYc.jpg`, position: 7 },
  { name: "12 Dark Red", colorHex: "#7c221d", imageUrl: `${IMG_2022}/5201641690208_GJImFJR.jpg`, position: 8 },
  { name: "16 Plum", colorHex: "#672b33", imageUrl: `${IMG_2022}/5201641690215_a0DL92C.jpg`, position: 9 },
  { name: "17 Toffee", colorHex: "#884227", imageUrl: `${IMG_2022}/5201641725597_0AzKw0a.jpg`, position: 10 },
  { name: "22 Heather", colorHex: "#51252b", imageUrl: `${IMG_2022}/5201641730188_UFWdfao.jpg`, position: 11 },
  { name: "24 Honeysuckle", colorHex: "#710023", imageUrl: `${IMG_2022}/5201641732014_TTG1qqK.jpg`, position: 12 },
  { name: "25 Rose", colorHex: "#c9706f", imageUrl: `${IMG_2025}/radiant_lip_pencil_25_1.jpg`, position: 13 },
  { name: "26 Bellini", colorHex: "#995f59", imageUrl: `${IMG_2025}/radiant_lip_pencil_26_1.jpg`, position: 14 },
  { name: "27 Ruby", colorHex: "#553331", imageUrl: `${IMG_2025}/radiant_lip_pencil_27_1.jpg`, position: 15 },
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
        imageId,
        position: shade.position,
        stock: 0,
      });
      console.log(`  ✓ ${shade.name} (${shade.colorHex})`);
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
    tertiaryCategoryId: LIP_LINER,
    subcategoryIds: [LIPS],
    tertiaryCategoryIds: [LIP_LINER],
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
  console.log(`  Category: المكياج → الشفاه → قلم تحديد الشفاه`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
