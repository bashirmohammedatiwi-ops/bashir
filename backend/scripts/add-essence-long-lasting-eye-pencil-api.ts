/**
 * Essence Long-Lasting Eye Pencil — all shades.
 * Source: https://www.haar-shop.ch/en/67463688-1-long-lasting-eye-pencil.html
 * Usage: npx tsx scripts/add-essence-long-lasting-eye-pencil-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const BRAND_ID = "9c5204f9-10be-484a-8e65-23b3ad53bb3c";
const CATEGORY_ID = "d3c24d19-dde5-41e5-b0a9-bede45393795";
const SUBCATEGORY_ID = "be0ba95f-62a6-4245-8012-5f6943ea5cab";
const TERTIARY_ID = "c8866117-67e0-4509-a887-60100775524b";

const PRODUCT = {
  slug: "essence-long-lasting-eye-pencil",
  sku: "ESS-LLEP-67463688",
  price: 4000,
  nameAr: "إيسنس - قلم كحل عيون طويل الثبات",
  nameEn: "Essence - Long-Lasting Eye Pencil",
  descriptionAr:
    "قلم كحل عيون طويل الثبات من إيسنس — لون مكثف وثبات يصل إلى ١٨ ساعة بآلية لف سهلة للتطبيق الدقيق.\n\n" +
    "• قوام ناعم بلون مكثف وثبات طويل.\n• آلية لف مبتكرة لتطبيق دقيق وسهل.\n• تركيبة مقاومة للماء تدوم حتى ١٨ ساعة.\n• مناسب لتحديد خط الرموش أو رسم خط كحل كلاسيكي.\n• خالٍ من البارابين والعطور والكحول والزيت.\n• نباتي ولم يُختبر على الحيوانات.\n• يُطبّق على خط الرموش العلوي أو السفلي حسب الإطلالة المطلوبة.",
  descriptionEn:
    "Essence Long-Lasting Eye Pencil — intensive, long-lasting colour with an innovative twist mechanism for precise, easy application.\n\n" +
    "• Soft texture with intense, long-lasting colour.\n• Innovative twist mechanism for precise, effortless application.\n• Waterproof formula with up to 18 hours of wear.\n• Ideal for defining the lash line or creating classic eyeliner looks.\n• Vegan, paraben-free, fragrance-free, alcohol-free and oil-free.\n• Cruelty-free.\n• Apply along the upper or lower lash line as desired.",
};

type ShadeInput = {
  name: string;
  colorHex: string;
  imageUrl: string;
  position: number;
};

const SHADES: ShadeInput[] = [
  {
    name: "01 Black Fever",
    colorHex: "#000001",
    imageUrl:
      "https://www.haar-shop.ch/media/catalog/product/1/5/15d51b47a8bfeaa696422d97a84b101b53f7f8a2_4250035246942_bi_essence_long_lasting_eye_pencil_01_black_fever.jpg",
    position: 0,
  },
  {
    name: "02 Hot Chocolate",
    colorHex: "#805B51",
    imageUrl:
      "https://www.haar-shop.ch/media/catalog/product/5/b/5b8e1c9a14516305368e905be25ea5ea18fba59f_4250035246959_bi_essence_long_lasting_eye_pencil_02_hot_chocolate.jpg",
    position: 1,
  },
  {
    name: "09 Cool Down",
    colorHex: "#35546D",
    imageUrl:
      "https://www.haar-shop.ch/media/catalog/product/5/a/5adc2a38ff54e1b6f756ab0d843e94eed10ef181_4250338414734_bi_essence_long_lasting_eye_pencil_09_cool_down.jpg",
    position: 2,
  },
  {
    name: "12 I Have A Green",
    colorHex: "#486A62",
    imageUrl:
      "https://www.haar-shop.ch/media/catalog/product/7/a/7a3cde37bad82c5e36fe695ff74f8aeabf7f6e8b_4250338465781_bi_essence_long_lasting_eye_pencil_12_i_have_a_green.jpg",
    position: 3,
  },
  {
    name: "17 Tu-Tu-Tourquoise",
    colorHex: "#40A9BC",
    imageUrl:
      "https://www.haar-shop.ch/media/catalog/product/6/3/63bf37824396fbadc6bb243b986c304b574c0e8e_4250587719024_bi_essence_long_lasting_eye_pencil_17_tututourquoise.jpg",
    position: 4,
  },
  {
    name: "20 Lucky Lead",
    colorHex: "#4C4843",
    imageUrl:
      "https://www.haar-shop.ch/media/catalog/product/a/8/a88463f3cdc78a2c84f23b76c4f74ac57775e492_4250587776195_bi_essence_long_lasting_eye_pencil_20_lucky_lead.jpg",
    position: 5,
  },
  {
    name: "26 Deep Sea Baby",
    colorHex: "#283851",
    imageUrl:
      "https://www.haar-shop.ch/media/catalog/product/7/c/7cb87155ee94ed81b6703b71522adc4c59a64eb0_4251232222265_bi_essence_long_lasting_eye_pencil_26_deep_sea_baby.jpg",
    position: 6,
  },
  {
    name: "34 Sparkling Black",
    colorHex: "#000000",
    imageUrl:
      "https://www.haar-shop.ch/media/catalog/product/2/c/2ca257f0c43a6b9e085d11e96d29eef5a6701c02_4059729337191_bi_essence_long_lasting_eye_pencil_34_sparkling_black.jpg",
    position: 7,
  },
  {
    name: "35 Sparkling Brown",
    colorHex: "#624736",
    imageUrl:
      "https://www.haar-shop.ch/media/catalog/product/9/0/90de3f4aabc1e7aff28eb1c04462c1b7569c8e80_4059729337238_bi_essence_long_lasting_eye_pencil_35_sparkling_brown.jpg",
    position: 8,
  },
  {
    name: "40 Roasted Chestnut",
    colorHex: "#593321",
    imageUrl:
      "https://www.haar-shop.ch/media/catalog/product/1/4/14c32c13373b86d61e86a56169d5306b9eeb2e54_4059729583376_bi_essence_long_lasting_eye_pencil_40_roasted_chestnut.jpg",
    position: 9,
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
  });

  console.log(`\n✓ Created: ${created.name ?? PRODUCT.nameEn}`);
  console.log(`  ID: ${created.id}`);
  console.log(`  Shades: ${shades.length}`);
  console.log(`  Images: ${imageIds.length}`);
  console.log(`  Category: المكياج → العيون → كحل`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
