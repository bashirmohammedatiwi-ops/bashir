/**
 * Essence Juicy Bomb Plumping Lipgloss — all shades (01, 02, 04, 05, 08).
 * Source: https://www.haar-shop.ch/en/76224583-1-plumping-lipgloss.html
 * Usage: API_BASE=https://deemaalhayat.com/api/v1 ADMIN_PASSWORD=000000 npx tsx scripts/add-essence-juicy-bomb-plumping-lipgloss-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const BRAND_ID = "9c5204f9-10be-484a-8e65-23b3ad53bb3c";
const CATEGORY_ID = "d3c24d19-dde5-41e5-b0a9-bede45393795";
const SUBCATEGORY_ID = "56da5b82-c847-4e9b-9cea-cc901236189f";
const TERTIARY_ID = "6405a88e-402f-4508-8799-c8f3ad049c66";

const PRODUCT = {
  slug: "essence-juicy-bomb-plumping-lipgloss",
  sku: "ESS-JBPL-76224583",
  price: 5250,
  nameAr: "إيسنس - ملمع شفاه جوزي بوم لتكبير الشفاه",
  nameEn: "Essence - Juicy Bomb Plumping Lipgloss",
  descriptionAr:
    "ملمع شفاه جوزي بوم لتكبير الشفاه من إيسنس — لمعة عالية وشفاه تبدو أوضح حجماً بلمسة فاكهية منعشة.\n\n" +
    "• لمعة عالية لشفاه لامعة ومتكبّرة المظهر.\n• تأثير تبريد خفيف مع رائحة فاكهية منعشة.\n• ملمس غير لزج وتغطية متوسطة مريحة طوال اليوم.\n• يُستخدم وحده أو فوق أحمر الشفاه لمزيد من اللمعة والحجم.\n• خالٍ من البارابين والغلوتين واللاكتوز.\n• نباتي.\n• للحصول على حجم أوضح: ضعي كمية أكثر قليلاً في منتصف الشفاه.",
  descriptionEn:
    "Essence Juicy Bomb Plumping Lipgloss — fruity high-shine finish for visibly fuller, juicily glossy lips.\n\n" +
    "• High-shine finish for visibly fuller, glossy lips.\n• Cooling effect and fruity fragrance for a refreshing care sensation.\n• Non-sticky texture with medium colour payoff for comfortable wear.\n• Wear alone or over lipstick for added shine and a plumping effect.\n• Free from parabens, gluten and lactose.\n• Vegan.\n• For extra volume, apply a little more product to the centre of the lips.",
};

type ShadeInput = {
  name: string;
  colorHex: string;
  imageUrl: string;
  position: number;
};

/** Full plumping line: 5 shades (no 03/06/07 in this formula). */
const SHADES: ShadeInput[] = [
  {
    name: "01 Sweet Strawberry",
    colorHex: "#970002",
    imageUrl:
      "https://www.haar-shop.ch/media/catalog/product/e/d/ed1d794def5ee516764c5a6f39ad172db8d9e40d_4059729593658_bi_essence_juicy_bomb_plumping_lipgloss_01_sweet_strawberry.jpg",
    position: 0,
  },
  {
    name: "02 Sour Cherry",
    colorHex: "#7A3127",
    imageUrl:
      "https://www.haar-shop.ch/media/catalog/product/c/c/ccd49594b48a9990389c6fd0db0ce8cd42d8d134_4059729593665_bi_essence_juicy_bomb_plumping_lipgloss_02_sour_cherry.jpg",
    position: 1,
  },
  {
    name: "04 Blossom Peach",
    colorHex: "#B55842",
    imageUrl:
      "https://www.haar-shop.ch/media/catalog/product/f/0/f08f43f1562770078d68a8520abb07fc90a3a8d2_4059729593672_bi_essence_juicy_bomb_plumping_lipgloss_04_blossom_peach.jpg",
    position: 2,
  },
  {
    name: "05 Soft Apricot",
    colorHex: "#A63C2F",
    imageUrl:
      "https://www.haar-shop.ch/media/catalog/product/6/2/62feea3c13aafc879a608ba1cdec6a0b0253ed9f_4059729593689_bi_essence_juicy_bomb_plumping_lipgloss_05_soft_apricot.jpg",
    position: 3,
  },
  {
    name: "08 Pure Raspberry",
    colorHex: "#A93A31",
    imageUrl:
      "https://www.haar-shop.ch/media/catalog/product/9/3/937b8bc25502108ae335742db981e60136cb70fe_4059729593702_bi_essence_juicy_bomb_plumping_lipgloss_08_pure_raspberry.jpg",
    position: 4,
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
