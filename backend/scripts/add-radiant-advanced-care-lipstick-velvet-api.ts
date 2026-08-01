/**
 * Radiant Professional Advanced Care Lipstick Velvet — all 18 shades.
 * Sources: hondoscenter.com / radiant-professional.com
 * Usage: npx tsx scripts/add-radiant-advanced-care-lipstick-velvet-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const CATEGORY_ID = "d3c24d19-dde5-41e5-b0a9-bede45393795";
const LIPS = "56da5b82-c847-4e9b-9cea-cc901236189f";
const LIPSTICK = "eaa06284-281e-475f-937b-b01ee24192df";

const IMG_BASE = "https://radiant-professional.com/media/images/products/2025/12";

const PRODUCT = {
  slug: "radiant-professional-advanced-care-lipstick-velvet",
  sku: "RAD-ACL-VL",
  price: 17000,
  nameAr: "راديانت بروفيشنال - أحمر شفاه أدفانسد كير فيلفت",
  nameEn: "Radiant Professional - Advanced Care Lipstick Velvet",
  descriptionAr:
    "أحمر شفاه أدفانسد كير فيلفت من راديانت بروفيشنال — لون غني وثابت بلمسة مخملية ناعمة مع ترطيب الشفاه.\n\n" +
    "• تركيبة مرطبة بلون غني وثبات طويل ولمسة مخملية مريحة.\n• نانوسفيرات غنية بحمض الهيالورونيك وبوليساكاريد نبات الكونجاك لترطيب الشفاه.\n• زبدة المانغو البرية لحماية وترطيب الشفاه.\n• درجات مصممة لتناسب مختلف ألوان البشرة.\n• يمنح الشفاه مظهراً أكمل وأنعم وأكثر مرونة.\n• يُطبّق مباشرة على الشفاه أو بفرشاة الشفاه.",
  descriptionEn:
    "Radiant Professional Advanced Care Lipstick Velvet — long-wearing rich colour with a velvety finish while preserving lip moisture.\n\n" +
    "• Moisturising formula with rich colour, long wear and a comfortable velvety feel.\n• Nanospheres with hyaluronic acid and Konjac plant polysaccharide for lip hydration.\n• Wild mango butter for nourishment and protection.\n• Shades designed to flatter all skin tones.\n• Leaves lips looking fuller, softer and more supple.\n• Apply directly to lips or with a lip brush.",
};

type ShadeInput = {
  name: string;
  colorHex: string;
  imageUrl: string;
  position: number;
};

const SHADES: ShadeInput[] = [
  { name: "01 Cantaloupe", colorHex: "#faa69c", imageUrl: `${IMG_BASE}/VL_01_CANTALOUPE_-_LIGHT_PINK_NUDE_2.png`, position: 0 },
  { name: "02 Candy", colorHex: "#fe907f", imageUrl: `${IMG_BASE}/VL_02_CANDY__WARM_NUDE_2.png`, position: 1 },
  { name: "03 Flamingo", colorHex: "#f8a2a5", imageUrl: `${IMG_BASE}/VL_03_FLAMINGO__ROSY_NUDE_2.png`, position: 2 },
  { name: "04 Sandstone", colorHex: "#e88e76", imageUrl: `${IMG_BASE}/VL_04_SANDSTONE_-_HONEY_NUDE_2.png`, position: 3 },
  { name: "05 Rust", colorHex: "#d97865", imageUrl: `${IMG_BASE}/VL_05_RUST__BROWN_NUDE_2.png`, position: 4 },
  { name: "06 Brick", colorHex: "#c54739", imageUrl: `${IMG_BASE}/VL_06_BRICK__WARM_REDDISH_BROWN_2.png`, position: 5 },
  { name: "07 Rosewood", colorHex: "#e16c5b", imageUrl: `${IMG_BASE}/VL_07_ROSEWOOD__PINKISH_BROWN_2.png`, position: 6 },
  { name: "08 Coral", colorHex: "#fc8076", imageUrl: `${IMG_BASE}/VL_08_CORAL_-_PEACHY_NUDE_2.png`, position: 7 },
  { name: "09 Dusty Pink", colorHex: "#fe8c8b", imageUrl: `${IMG_BASE}/VL_09_DUSTY_PINK__PINKISH_NUDE_2.png`, position: 8 },
  { name: "10 Tuffy", colorHex: "#ef84a2", imageUrl: `${IMG_BASE}/VL_10_TUFFY__PINKISH_MAUVE_2.png`, position: 9 },
  { name: "12 Punch", colorHex: "#e3585d", imageUrl: `${IMG_BASE}/VL_12_PUNCH_-_PINKISH_RED_2.png`, position: 10 },
  { name: "13 Apple", colorHex: "#c5484e", imageUrl: `${IMG_BASE}/VL_13_APPLE__REDDISH_BROWN_2.png`, position: 11 },
  { name: "19 Sangria", colorHex: "#780d21", imageUrl: `${IMG_BASE}/VL_19_SANGRIA__BURGUNDY_RED_2.png`, position: 12 },
  { name: "26 Lt Cherry", colorHex: "#bd203c", imageUrl: `${IMG_BASE}/VL_26_LT_CHERRY_3.png`, position: 13 },
  { name: "27 Nude", colorHex: "#a96f71", imageUrl: `${IMG_BASE}/VL_27_NUDE_2.png`, position: 14 },
  { name: "28 Tomato Red", colorHex: "#872431", imageUrl: `${IMG_BASE}/VL_28_TOMATO_RED_2.png`, position: 15 },
  { name: "29 Cranberry", colorHex: "#52101c", imageUrl: `${IMG_BASE}/VL_29_CRANBERRY_2.png`, position: 16 },
  { name: "30 Ripe Plum", colorHex: "#452f44", imageUrl: `${IMG_BASE}/VL_30_RIPE_PLUM_3.png`, position: 17 },
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

    const contentType = (res.headers.get("content-type") || "image/png").split(";")[0].trim();
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
