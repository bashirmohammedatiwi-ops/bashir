/**
 * Essence Foundation Stick — shades from haar-shop + EU (essence CDN).
 * Source: https://www.haar-shop.ch/en/67463639-1-foundation-stick.html
 * Usage: API_BASE=https://deemaalhayat.com/api/v1 ADMIN_PASSWORD=000000 npx tsx scripts/add-essence-foundation-stick-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const BRAND_ID = "9c5204f9-10be-484a-8e65-23b3ad53bb3c";
const CATEGORY_ID = "d3c24d19-dde5-41e5-b0a9-bede45393795";
const SUBCATEGORY_ID = "2bbecee1-084d-446c-b4fd-65f769130de9";
const TERTIARY_ID = "036b1b3c-aa73-4dd1-bdd2-1a12f193645a";

const PRODUCT = {
  slug: "essence-foundation-stick",
  sku: "ESS-FS-67463639",
  price: 6750,
  nameAr: "إيسنس - كريم أساس ستك مطفي",
  nameEn: "Essence - Foundation Stick",
  descriptionAr:
    "كريم أساس على شكل ستك من إيسنس — تغطية متوسطة وملمس كريمي سهل التوزيع لإطلالة طبيعية مطفية.\n\n" +
    "• تركيبة كريمية ناعمة تنزلق على البشرة وتندمج بسهولة.\n• لمسة مطفية طبيعية خفيفة ومريحة طوال اليوم.\n• تغطية قابلة للبناء مع ترطيب للبشرة.\n• يُستخدم ككريم أساس أو لتلميع مناطق الوجه.\n• خالٍ من البارابين والزيوت واللاكتوز.\n• نباتي.\n• للحصول على ثبات أطول: رطّبي البشرة أو ضعي برايمر قبل التطبيق، ثم وزّعي الستك من الأنف والخدين للخارج بإسفنجة أو أصابع.",
  descriptionEn:
    "Essence Foundation Stick — medium-coverage creamy formula for an effortlessly natural matte complexion.\n\n" +
    "• Super creamy formula that glides gently and blends perfectly.\n• Light, natural matte finish that feels weightless.\n• Buildable coverage with nourishing, moisturising ingredients.\n• Versatile: use as foundation or for highlighting.\n• Free from parabens, oil and lactose.\n• Vegan.\n• For best results, apply day cream or primer first, then blend from the nose and cheeks outward with a sponge, brush or fingers.",
};

type ShadeInput = {
  name: string;
  colorHex: string;
  imageUrl: string;
  position: number;
};

const CDN = (barcode: string) =>
  `https://essencemakeup.com/cdn/shop/files/${barcode}_1.png`;

const SHADES: ShadeInput[] = [
  {
    name: "50",
    colorHex: "#EFCAB7",
    imageUrl: CDN("4059729517258"),
    position: 0,
  },
  {
    name: "100",
    colorHex: "#EDD8C4",
    imageUrl: CDN("4059729517357"),
    position: 2,
  },
  {
    name: "111",
    colorHex: "#F0C4AD",
    imageUrl:
      "https://www.haar-shop.ch/media/catalog/product/1/b/1be74e1f7a00855faa7b920e413949c5ad8e5cde_4059729548665_bi_essence_foundation_stick_111.jpg",
    position: 3,
  },
  {
    name: "120",
    colorHex: "#E8C9A5",
    imageUrl:
      "https://www.haar-shop.ch/media/catalog/product/a/5/a51f8359a0daaa914088aeabbfeae9cc91555a21_4059729517395_bi_essence_foundation_stick_120.jpg",
    position: 4,
  },
  {
    name: "130",
    colorHex: "#E8BCAA",
    imageUrl:
      "https://www.haar-shop.ch/media/catalog/product/f/f/ffcd73f3bc9a23efd43bbd57c48bde7d116a24dd_4059729517418_bi_essence_foundation_stick_130.jpg",
    position: 5,
  },
  {
    name: "131",
    colorHex: "#EDBEA1",
    imageUrl:
      "https://www.haar-shop.ch/media/catalog/product/3/0/30b375f32229309345adbee70768510a12072b92_4059729548672_bi_essence_foundation_stick_131.jpg",
    position: 6,
  },
  {
    name: "140",
    colorHex: "#E6BBA8",
    imageUrl: CDN("4059729517432"),
    position: 7,
  },
  {
    name: "141",
    colorHex: "#E0BEAC",
    imageUrl:
      "https://www.haar-shop.ch/media/catalog/product/a/1/a1759cf615b8918736beef9b8b36bbabaf479f15_4059729548689_bi_essence_foundation_stick_141.jpg",
    position: 8,
  },
  {
    name: "160",
    colorHex: "#E0AF98",
    imageUrl:
      "https://www.haar-shop.ch/media/catalog/product/4/1/41756eead0fde00d7cd1112f484a4edde49d4fba_4059729517470_bi_essence_foundation_stick_160.jpg",
    position: 9,
  },
  {
    name: "170",
    colorHex: "#D9A88C",
    imageUrl: CDN("4059729517494"),
    position: 10,
  },
  {
    name: "180",
    colorHex: "#CF9E7E",
    imageUrl: CDN("4059729517517"),
    position: 11,
  },
  {
    name: "200",
    colorHex: "#C08E6E",
    imageUrl: CDN("4059729517555"),
    position: 12,
  },
  {
    name: "210",
    colorHex: "#B88660",
    imageUrl: CDN("4059729517531"),
    position: 13,
  },
  {
    name: "230",
    colorHex: "#A67555",
    imageUrl: CDN("4059729517593"),
    position: 14,
  },
  {
    name: "240",
    colorHex: "#9A6848",
    imageUrl: CDN("4059729517616"),
    position: 15,
  },
  {
    name: "280",
    colorHex: "#7A4F3A",
    imageUrl: CDN("4059729517654"),
    position: 16,
  },
  {
    name: "340",
    colorHex: "#5C3828",
    imageUrl: CDN("4059729517678"),
    position: 17,
  },
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

async function uploadImage(url: string, alt: string, attempt = 1): Promise<string> {
  try {
    const res = await fetch(url, {
      headers: {
        Accept: "image/*",
        "User-Agent": "Mozilla/5.0 (compatible; AlhayaaCatalog/1.0)",
      },
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
      await new Promise((r) => setTimeout(r, 900));
    } catch (err) {
      console.log(`  ✗ ${shade.name}: ${err instanceof Error ? err.message : err}`);
    }
  }

  if (!shades.length) throw new Error("No shade images uploaded");

  const imageIds = [...new Set(shades.map((s) => s.imageId))];

  const payload = {
    sku: PRODUCT.sku,
    slug: PRODUCT.slug,
    brandId: BRAND_ID,
    categoryId: CATEGORY_ID,
    subcategoryId: SUBCATEGORY_ID,
    tertiaryCategoryId: TERTIARY_ID,
    subcategoryIds: [SUBCATEGORY_ID],
    tertiaryCategoryIds: [TERTIARY_ID],
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
  };

  const created = await api<{ id: string; name?: string }>("/products", "POST", payload);
  console.log(`\n✓ Created: ${created.name ?? PRODUCT.nameEn}`);
  console.log(`  ID: ${created.id}`);
  console.log(`  Shades: ${shades.length}`);
  console.log(`  Images: ${imageIds.length}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
