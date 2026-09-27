/**
 * Elixir Silky Eye Pencil — 34 waterproof eye liner shades (001–084).
 * Sources: beautyfree.gr (shade list + swatch colors), elixirmakeup.gr/fi, e-color.gr, gold-line.gr, bizou4u.gr (images)
 * Shade barcodes intentionally omitted.
 * Usage: npx tsx scripts/add-elixir-silky-eye-pencil-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const CATEGORY_ID = "d3c24d19-dde5-41e5-b0a9-bede45393795";
const EYES = "be0ba95f-62a6-4245-8012-5f6943ea5cab";
const EYELINER = "c8866117-67e0-4509-a887-60100775524b";

const PRODUCT = {
  slug: "elixir-silky-eye-pencil",
  sku: "ELX-SEP-812",
  price: 2950,
  nameAr: "إليكسير - سيلكي آي بنسل قلم كحل عيون",
  nameEn: "Elixir - Silky Eye Pencil",
  descriptionAr:
    "قلم كحل عيون سيلكي من إليكسير — تركيبة ناعمة كالحرير لتحديد العيون بدقة ولمسة مرنة.\n\n" +
    "• تركيبة حريرية ناعمة تُطبّق بسهولة وتحدد العيون بدقة.\n• مقاوم للماء وثبات طويل.\n• يُستخدم لتحديد خط الرموش أو داخل العين أو تأثير smokey.\n• 34 درجة من 001 إلى 084.\n• صُنع في أوروبا.",
  descriptionEn:
    "Elixir Silky Eye Pencil — soft silky formula for precise, versatile eye definition.\n\n" +
    "• Soft silky texture applies smoothly for accurate lining.\n• Waterproof, long-lasting wear.\n• Use on upper and lower lash lines or waterline; layer over liner for a smokey effect.\n• 34 shades from 001 to 084.\n• Made in Europe.",
};

type ShadeInput = {
  name: string;
  colorHex: string;
  imageUrl: string;
  position: number;
};

const SHADES: ShadeInput[] = [
  { name: "001 Black Diamond", colorHex: "#2b2b2b", imageUrl: "https://elixirmakeup.gr/wp-content/uploads/2022/09/001.jpg", position: 0 },
  { name: "002 Graphite", colorHex: "#515152", imageUrl: "https://elixirmakeup.gr/wp-content/uploads/2022/09/002.jpg", position: 1 },
  { name: "003 Iron", colorHex: "#5a636c", imageUrl: "https://elixirmakeup.gr/wp-content/uploads/2022/09/003.jpg", position: 2 },
  { name: "004 Silver Eclipse", colorHex: "#898989", imageUrl: "https://elixirmakeup.gr/wp-content/uploads/2022/09/004.jpg", position: 3 },
  { name: "005 White Night", colorHex: "#d8d7da", imageUrl: "https://elixirmakeup.gr/wp-content/uploads/2022/09/005.jpg", position: 4 },
  { name: "006 Spring Green", colorHex: "#35938b", imageUrl: "https://elixirmakeup.gr/wp-content/uploads/2022/09/006.jpg", position: 5 },
  { name: "007 Green Forest", colorHex: "#32745e", imageUrl: "https://elixirmakeup.gr/wp-content/uploads/2022/09/007.jpg", position: 6 },
  { name: "008 Metallic Ocean", colorHex: "#3182a9", imageUrl: "https://elixirmakeup.gr/wp-content/uploads/2022/09/008.jpg", position: 7 },
  { name: "009 Royal Blue", colorHex: "#496fae", imageUrl: "https://elixirmakeup.gr/wp-content/uploads/2022/09/009.jpg", position: 8 },
  { name: "010 Oxford Blue", colorHex: "#52607b", imageUrl: "https://elixirmakeup.fi/wp-content/uploads/2016/10/010.jpg", position: 9 },
  { name: "011 Midnight Mauve", colorHex: "#4c5169", imageUrl: "https://elixirmakeup.gr/wp-content/uploads/2022/09/011.jpg", position: 10 },
  { name: "012 Dark Laventer", colorHex: "#66698f", imageUrl: "https://elixirmakeup.fi/wp-content/uploads/2016/10/012.jpg", position: 11 },
  { name: "013 Royal Purple", colorHex: "#49334a", imageUrl: "https://elixirmakeup.fi/wp-content/uploads/2016/10/013.jpg", position: 12 },
  { name: "014 Sexy Brown", colorHex: "#2b2b2b", imageUrl: "https://elixirmakeup.fi/wp-content/uploads/2016/10/014.jpg", position: 13 },
  { name: "016 Metallic Green", colorHex: "#61aa76", imageUrl: "https://elixirmakeup.gr/wp-content/uploads/2022/09/016.jpg", position: 14 },
  { name: "017 Bondi Blue", colorHex: "#3295a4", imageUrl: "https://elixirmakeup.fi/wp-content/uploads/2016/10/017.jpg", position: 15 },
  { name: "018 Electric Blue", colorHex: "#3c6b97", imageUrl: "https://elixirmakeup.fi/wp-content/uploads/2016/10/018.jpg", position: 16 },
  { name: "044 Ivory White", colorHex: "#c5bdb6", imageUrl: "https://elixirmakeup.fi/wp-content/uploads/2016/10/044.jpg", position: 17 },
  { name: "045 Delicious Mocha", colorHex: "#946451", imageUrl: "https://elixirmakeup.fi/wp-content/uploads/2016/10/045.jpg", position: 18 },
  { name: "046 Tiffany Blue", colorHex: "#34b1c0", imageUrl: "https://elixirmakeup.fi/wp-content/uploads/2016/10/046.jpg", position: 19 },
  { name: "047 Olive Green", colorHex: "#73897c", imageUrl: "https://elixirmakeup.fi/wp-content/uploads/2021/03/047.jpg", position: 20 },
  { name: "048 Aegean Blue", colorHex: "#5b65a6", imageUrl: "https://elixirmakeup.fi/wp-content/uploads/2016/10/048.jpg", position: 21 },
  { name: "049 Sky Blue", colorHex: "#3394b5", imageUrl: "https://elixirmakeup.gr/wp-content/uploads/2022/09/049.jpg", position: 22 },
  { name: "050 Cornflower Blue", colorHex: "#7095cc", imageUrl: "https://e-color.gr/image/catalog/product/6067/812-050-1.jpg", position: 23 },
  { name: "051 Shiny Turquoise", colorHex: "#348aad", imageUrl: "https://elixirmakeup.fi/wp-content/uploads/2021/03/051-1.jpg", position: 24 },
  { name: "052 Violet Night", colorHex: "#90639e", imageUrl: "https://elixirmakeup.fi/wp-content/uploads/2021/03/052.jpg", position: 25 },
  { name: "019 Regal Bearing", colorHex: "#665b66", imageUrl: "https://elixirmakeup.gr/wp-content/uploads/2022/09/019.jpg", position: 26 },
  { name: "020 Grape", colorHex: "#5a5758", imageUrl: "https://elixirmakeup.gr/wp-content/uploads/2022/09/020.jpg", position: 27 },
  { name: "021 Navajo", colorHex: "#bd9a89", imageUrl: "https://elixirmakeup.gr/wp-content/uploads/2022/09/021.jpg", position: 28 },
  { name: "082 Sunset Glow", colorHex: "#c12913", imageUrl: "https://e-color.gr/image/catalog/product/15647/88812-082-1.jpg", position: 29 },
  { name: "083 Candy Blossom", colorHex: "#d34e52", imageUrl: "https://elixirmakeup.gr/wp-content/uploads/2022/09/083.jpg", position: 30 },
  { name: "084 Electric Kiwi", colorHex: "#6ca903", imageUrl: "https://www.bizou4u.gr/wp-content/uploads/2025/12/xlarge_20221004123959_dd3cecbc-11.jpeg", position: 31 },
  { name: "080 Sunshine Gold", colorHex: "#d8bc03", imageUrl: "https://www.gold-line.gr/wp-content/uploads/2025/03/080-ELXR.jpg", position: 32 },
  { name: "081 Hot Diva", colorHex: "#b60c56", imageUrl: "https://e-color.gr/image/catalog/product/15646/88812-081-1.jpg", position: 33 },
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
    brandAr: "إليكسير",
    brandEn: "Elixir",
    createIfMissing: true,
  });
  const brandId = resolved.brand?.id;
  if (!brandId) throw new Error("Could not resolve Elixir brand");
  console.log(`Brand: Elixir (${brandId})${resolved.created ? " [created]" : ""}\n`);
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
    const imageId = await uploadImage(shade.imageUrl, shade.name);
    shades.push({
      name: shade.name,
      colorHex: shade.colorHex,
      imageId,
      position: shade.position,
      stock: 0,
    });
    console.log(`  ✓ ${shade.name}`);
    await new Promise((r) => setTimeout(r, 600));
  }

  const imageIds = [...new Set(shades.map((s) => s.imageId))];

  const created = await api<{ id: string; name?: string }>("/products", "POST", {
    sku: PRODUCT.sku,
    slug: PRODUCT.slug,
    brandId,
    categoryId: CATEGORY_ID,
    subcategoryId: EYES,
    tertiaryCategoryId: EYELINER,
    subcategoryIds: [EYES],
    tertiaryCategoryIds: [EYELINER],
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
  console.log(`  Category: Makeup → Eyes → Eyeliner`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
