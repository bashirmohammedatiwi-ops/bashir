/**
 * Add Deborah Skin Booster Mat Foundation shades 00 Fair, 06 Porcelain, 07 Almond.
 * Source: riano.cz (00), byleijtens.com (06, 07) — hex sampled from each image.
 * Usage: npx tsx scripts/add-deborah-skin-booster-mat-missing-shades-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const PRODUCT_ID = "f3b86247-ad18-47cb-8639-61ea5ff2651a";

type ShadeInput = {
  name: string;
  colorHex: string;
  imageUrl: string;
  position: number;
};

const NEW_SHADES: ShadeInput[] = [
  {
    name: "00 Fair",
    colorHex: "#e9d4cf",
    imageUrl: "https://www.riano.cz/gallery/products/14788/detail_skin_booster_matujici_00_fair.jpg",
    position: 0,
  },
  {
    name: "06 Porcelain",
    colorHex: "#ddc7c3",
    imageUrl:
      "https://byleijtens.com/cdn/shop/files/Deborah_Milano_Skin_Booster_Mat_Foundation_06_Porcelain_b0e3f68c-f978-4d8a-a4bd-7978d6930702.jpg",
    position: 6,
  },
  {
    name: "07 Almond",
    colorHex: "#dfc7c2",
    imageUrl: "https://byleijtens.com/cdn/shop/files/Deborah_Milano_Skin_Booster_Mat_Foundation_07_Almond.jpg",
    position: 7,
  },
];

const DESCRIPTION = {
  descriptionAr:
    "Skin Booster Mat Foundation من ديبورا ميلانو — فونديشن سائل مطفي بتركيبة مرطبة يجمع بين تغطية مثالية طويلة الأمد والعناية بالبشرة.\n\n" +
    "• قوام خفيف من الجيل الجديد يندمج مع البشرة لمظهر طبيعي مريح طوال اليوم.\n" +
    "• غني بـ Niacinamide وVitamin C ومرطبات لإشراق البشرة وتلبية احتياجات البشرة الحساسة.\n" +
    "• حماية SPF 15 — تغطية عالية بلمسة مطفية تقلّل اللمعان.\n" +
    "• 8 درجات: Fair وLight Rose وNude وMedium وWarm وTan وPorcelain وAlmond.\n" +
    "• 30 مل — خاضع للاختبار الجلدي.",
  descriptionEn:
    "Deborah Milano Skin Booster Mat Foundation — hydrating matte liquid foundation with flawless, long-lasting coverage that also nurtures skin.\n\n" +
    "• Weightless next-generation texture melts effortlessly into skin for a barely-there, comfortable look all day.\n" +
    "• Enriched with Niacinamide, Vitamin C and moisturisers to brighten and meet demanding skin needs.\n" +
    "• SPF 15 — high-coverage matte finish that reduces shine.\n" +
    "• 8 shades: Fair, Light Rose, Nude, Medium, Warm, Tan, Porcelain and Almond.\n" +
    "• 30 ml — Dermatologist tested.",
};

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

type ExistingShade = {
  id?: string;
  name: string;
  colorHex?: string;
  imageId?: string;
  position: number;
  stock?: number;
};

type Product = {
  id: string;
  nameEn?: string;
  imageIds?: string[];
  shades?: ExistingShade[];
};

function normalizeName(name: string) {
  return name.trim().toLowerCase();
}

async function main() {
  console.log(`API: ${API_BASE}`);
  console.log(`Product: ${PRODUCT_ID}`);
  console.log(`New shades: ${NEW_SHADES.length}\n`);

  await login();
  console.log("Logged in.\n");

  const product = await api<Product>(`/products/${PRODUCT_ID}`);
  const existingShades = product.shades ?? [];
  const existingNames = new Set(existingShades.map((s) => normalizeName(s.name)));

  const toAdd = NEW_SHADES.filter((s) => !existingNames.has(normalizeName(s.name)));
  if (!toAdd.length) {
    console.log("Shades 00, 06, 07 already exist — nothing to add.");
    return;
  }

  console.log(`Adding: ${toAdd.map((s) => s.name).join(", ")}\n`);
  console.log("Uploading shade images...");

  const uploaded: Array<{
    name: string;
    colorHex: string;
    imageId: string;
    position: number;
    stock: number;
  }> = [];

  for (const shade of toAdd) {
    const imageId = await uploadImage(shade.imageUrl, shade.name);
    uploaded.push({
      name: shade.name,
      colorHex: shade.colorHex,
      imageId,
      position: shade.position,
      stock: 0,
    });
    console.log(`  ✓ ${shade.name} (${shade.colorHex})`);
    await new Promise((r) => setTimeout(r, 700));
  }

  const merged = [...existingShades, ...uploaded];
  merged.sort((a, b) => {
    const numA = parseInt(a.name.match(/^(\d+)/)?.[1] ?? String(a.position), 10);
    const numB = parseInt(b.name.match(/^(\d+)/)?.[1] ?? String(b.position), 10);
    return numA - numB;
  });

  const shades = merged.map((s, i) => ({
    name: s.name,
    colorHex: s.colorHex,
    imageId: s.imageId,
    position: i,
    stock: s.stock ?? 0,
  }));

  const imageIds = [...new Set([...(product.imageIds ?? []), ...uploaded.map((s) => s.imageId)])];

  await api(`/products/${PRODUCT_ID}`, "PATCH", {
    shades,
    imageIds,
    ...DESCRIPTION,
  });

  console.log(`\n✓ Updated: ${product.nameEn ?? PRODUCT_ID}`);
  console.log(`  Total shades: ${shades.length}`);
  console.log(`  Added: ${uploaded.length}`);
  shades.forEach((s) => console.log(`    ${String(s.position + 1).padStart(2, "0")}. ${s.name}`));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
