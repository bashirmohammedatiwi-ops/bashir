/**
 * Elixir Super Gloss Shiny Lips — 15 shades (080–094, Greek mythology names).
 * Sources: elixirmakeup.gr (names, images, SKU 403T-XXX), e-color.gr (barcodes)
 * Usage: npx tsx scripts/add-elixir-super-gloss-shiny-lips-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const CATEGORY_ID = "d3c24d19-dde5-41e5-b0a9-bede45393795";
const LIPS = "56da5b82-c847-4e9b-9cea-cc901236189f";
const LIP_GLOSS = "6405a88e-402f-4508-8799-c8f3ad049c66";

const IMG = "https://elixirmakeup.gr/wp-content/uploads/2024/04";

const PRODUCT = {
  slug: "elixir-super-gloss-shiny-lips",
  sku: "ELX-SGSL-403T",
  price: 5500,
  nameAr: "إليكسير - سوبر غلوس شايني ليبس ملمع شفاه",
  nameEn: "Elixir - Super Gloss Shiny Lips",
  descriptionAr:
    "سوبر غلوس شايني ليبس من إليكسير — ملمع شفاه فائق اللمعة لشفاه برّاقة ومرطّبة.\n\n" +
    "• يمنح الشفاه لمعة لامعة ناعمة ومظهراً ممتلئاً.\n• تركيبة خفيفة غير لزجة مريحة طوال اليوم.\n• ألوان فريدة مستوحاة من الأساطير اليونانية.\n• ثبات عالٍ ولمعة استثنائية.\n• يُستخدم وحده أو فوق أحمر الشفاه Kissproof و Kissproof Lip Mat.\n• صُنع في اليونان.",
  descriptionEn:
    "Elixir Super Gloss Shiny Lips — high-shine lip gloss for glossy, hydrated lips that stand out.\n\n" +
    "• Adds a soft, glossy shine with a plump, radiant look.\n• Light, non-greasy formula for comfortable all-day wear.\n• Unique shades inspired by Greek mythology.\n• Super durable, super shiny finish.\n• Wear alone or over Elixir Kissproof and Kissproof Lip Mat lipsticks.\n• Made in Greece.",
};

type ShadeInput = {
  name: string;
  colorHex: string;
  barcode: string;
  imageUrl: string;
  position: number;
};

const SHADES: ShadeInput[] = [
  { name: "080 Clear", colorHex: "#F0E8E4", barcode: "5206929018446", imageUrl: `${IMG}/403T-080.jpg`, position: 0 },
  { name: "081 Aphrodite", colorHex: "#E8A0B0", barcode: "5206929018447", imageUrl: `${IMG}/403T-081.jpg`, position: 1 },
  { name: "082 Athena", colorHex: "#C8A0A8", barcode: "5206929018448", imageUrl: `${IMG}/403T-082.jpg`, position: 2 },
  { name: "083 Hestia", colorHex: "#D4A890", barcode: "5206929018449", imageUrl: `${IMG}/403T-083.jpg`, position: 3 },
  { name: "084 Demeter", colorHex: "#C49070", barcode: "5206929018450", imageUrl: `${IMG}/084.jpg`, position: 4 },
  { name: "085 Hera", colorHex: "#B03040", barcode: "5206929018451", imageUrl: `${IMG}/403T-085.jpg`, position: 5 },
  { name: "086 Poseidon", colorHex: "#6090A8", barcode: "5206929018452", imageUrl: `${IMG}/403T-086.jpg`, position: 6 },
  { name: "087 Artemis", colorHex: "#D8A8B0", barcode: "5206929018453", imageUrl: `${IMG}/403T-087.jpg`, position: 7 },
  { name: "088 Zeus", colorHex: "#D0C0A0", barcode: "5206929018454", imageUrl: `${IMG}/403T-088.jpg`, position: 8 },
  { name: "089 Ares", colorHex: "#C02030", barcode: "5206929018455", imageUrl: `${IMG}/403T-089.jpg`, position: 9 },
  { name: "090 Hermes", colorHex: "#E87858", barcode: "5206929018456", imageUrl: `${IMG}/403T-090.jpg`, position: 10 },
  { name: "091 Hephaestus", colorHex: "#A87050", barcode: "5206929018457", imageUrl: `${IMG}/403T-091.jpg`, position: 11 },
  { name: "092 Dionysus", colorHex: "#902848", barcode: "5206929018458", imageUrl: `${IMG}/403T-092.jpg`, position: 12 },
  { name: "093 Hades", colorHex: "#502030", barcode: "5206929018459", imageUrl: `${IMG}/403T-093.jpg`, position: 13 },
  { name: "094 Pan", colorHex: "#8A7050", barcode: "5206929018460", imageUrl: `${IMG}/403T-094.jpg`, position: 14 },
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
    barcode: string;
    imageId: string;
    position: number;
    stock: number;
  }> = [];

  for (const shade of SHADES) {
    const imageId = await uploadImage(shade.imageUrl, shade.name);
    shades.push({
      name: shade.name,
      colorHex: shade.colorHex,
      barcode: shade.barcode,
      imageId,
      position: shade.position,
      stock: 0,
    });
    console.log(`  ✓ ${shade.name} — ${shade.barcode}`);
    await new Promise((r) => setTimeout(r, 600));
  }

  const imageIds = [...new Set(shades.map((s) => s.imageId))];

  const created = await api<{ id: string; name?: string }>("/products", "POST", {
    sku: PRODUCT.sku,
    slug: PRODUCT.slug,
    brandId,
    categoryId: CATEGORY_ID,
    subcategoryId: LIPS,
    tertiaryCategoryId: LIP_GLOSS,
    subcategoryIds: [LIPS],
    tertiaryCategoryIds: [LIP_GLOSS],
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
  console.log(`  Category: Makeup → Lips → Lip Gloss`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
