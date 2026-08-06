/**
 * Update Grigi Waterproof Lip Silky Pencil:
 * - Set product barcode to 5207042205089 (08 Coral)
 * - Add missing shades 08, 15, 17, 20, 36
 * - Remove all shade barcodes
 * Usage: npx tsx scripts/update-grigi-waterproof-lip-silky-pencil-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const PRODUCT_ID = "572e09f9-11f8-4a04-883f-73c03d10190c";
const IMG = "https://grigi.gr/media/catalog/product/cache/1/image/1800x/040ec09b1e35df139433887a97daa66f";

const PRODUCT_BARCODE = "5207042205089";

const COPY = {
  nameAr: "كريجي - قلم تحديد شفاه Waterproof Lip Silky Pencil مقاوم للماء",
  nameEn: "Grigi - Waterproof Lip Silky Pencil",
  descriptionAr:
    "قلم تحديد شفاه سيلكي مقاوم للماء من كريجي — يحدّد محيط الشفاه بدقة ويمنح لوناً ثابتاً ومشرقاً طوال اليوم.\n\n" +
    "• تركيبة أداء طويل الثبات ومقاومة للماء.\n" +
    "• قلم ثابت وناعم بقوام سيلكي سهل التطبيق والتمديد.\n" +
    "• تغطية متساوية بلون غني يُبرز محيط الشفاه بشكل أنيق.\n" +
    "• مُعزّز بفيتامين E لترطيب الشفاه أثناء الاستخدام.\n" +
    "• 38 درجة: من الأحمر والنبيذي والكرزي إلى النود والبني والمرجاني والفوشيا.\n" +
    "• ارسمي خطاً على محيط الشفاه من المنتصف نحو الزوايا ثم املئي أو ضعي أحمر الشفاه.\n" +
    "• للثبات الأطول، حدّدي الشفاه ثم ضعي طبقة رقيقة من اللون.\n" +
    "• صُنع في اليونان.",
  descriptionEn:
    "Grigi Waterproof Lip Silky Pencil — precise lip lining with long-lasting, waterproof colour.\n\n" +
    "• Long-wear waterproof formula.\n" +
    "• Firm yet soft silky texture for smooth, even application.\n" +
    "• Rich colour that defines and enhances the lip contour.\n" +
    "• Enriched with vitamin E to keep lips moisturised.\n" +
    "• 38 shades from red, wine and cherry to nude, brown, coral and fuchsia.\n" +
    "• Line lips from the centre outward, then fill or apply lipstick.\n" +
    "• For extra longevity, line lips then apply a thin colour layer.\n" +
    "• Made in Greece.",
};

type ShadeInput = {
  name: string;
  colorHex: string;
  imageUrl: string;
};

/** Names from grigi.gr / melekosbeauty.cy; hex sampled from GWLP/glsp images. */
const NEW_SHADES: ShadeInput[] = [
  { name: "08 Coral", colorHex: "#a46464", imageUrl: `${IMG}/G/W/GWLP-08_3.jpeg` },
  { name: "15 Coral Pink", colorHex: "#dc5c6c", imageUrl: `${IMG}/G/W/GWLP-15_3.jpeg` },
  { name: "17 Cherry", colorHex: "#843444", imageUrl: `${IMG}/G/W/GWLP-17_3.jpeg` },
  { name: "20 Honey", colorHex: "#b47c6c", imageUrl: `${IMG}/G/W/GWLP-20_3.jpeg` },
  { name: "36 Cinnamon Pink", colorHex: "#926b5a", imageUrl: `${IMG}/g/l/glsp-36.jpg` },
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

type ExistingShade = {
  name: string;
  colorHex?: string;
  imageId?: string;
  position: number;
  stock?: number;
  barcode?: string;
};

type Product = {
  id: string;
  barcode?: string;
  imageIds?: string[];
  shades?: ExistingShade[];
};

function normalizeName(name: string) {
  return name.trim().toLowerCase();
}

function shadeNumber(name: string): number {
  const n = parseInt(name.match(/^(\d+)/)?.[1] ?? "", 10);
  return Number.isFinite(n) ? n : 9999;
}

async function main() {
  console.log(`API: ${API_BASE}`);
  console.log(`Product: ${PRODUCT_ID}`);
  console.log(`New barcode: ${PRODUCT_BARCODE}`);
  console.log(`New shades: ${NEW_SHADES.length}\n`);

  await login();
  console.log("Logged in.\n");

  const product = await api<Product>(`/products/${PRODUCT_ID}`);
  const existingShades = [...(product.shades ?? [])];
  const existingNames = new Set(existingShades.map((s) => normalizeName(s.name)));

  const toAdd = NEW_SHADES.filter((s) => !existingNames.has(normalizeName(s.name)));
  console.log(`Adding: ${toAdd.map((s) => s.name).join(", ") || "(none)"}`);
  console.log(`Removing barcodes from ${existingShades.filter((s) => s.barcode).length} existing shades.\n`);

  const uploaded: ExistingShade[] = [];
  for (const shade of toAdd) {
    const imageId = await uploadImage(shade.imageUrl, shade.name);
    uploaded.push({
      name: shade.name,
      colorHex: shade.colorHex,
      imageId,
      position: 0,
      stock: 0,
    });
    console.log(`  ✓ ${shade.name} — ${shade.colorHex}`);
    await new Promise((r) => setTimeout(r, 500));
  }

  const merged = [...existingShades, ...uploaded].sort((a, b) => shadeNumber(a.name) - shadeNumber(b.name));

  const shades = merged.map((s, i) => ({
    name: s.name,
    colorHex: s.colorHex,
    imageId: s.imageId,
    position: i,
    stock: s.stock ?? 0,
  }));

  const imageIds = [...new Set([...(product.imageIds ?? []), ...uploaded.map((s) => s.imageId!).filter(Boolean)])];

  await api(`/products/${PRODUCT_ID}`, "PATCH", {
    barcode: PRODUCT_BARCODE,
    nameAr: COPY.nameAr,
    nameEn: COPY.nameEn,
    descriptionAr: COPY.descriptionAr,
    descriptionEn: COPY.descriptionEn,
    shades,
    imageIds,
  });

  const verify = await api<Product & { nameAr?: string; barcode?: string; shades?: ExistingShade[] }>(
    `/products/${PRODUCT_ID}`,
  );

  const withBarcode = (verify.shades ?? []).filter((s) => s.barcode);
  if (withBarcode.length) throw new Error(`Shades should have no barcodes, found ${withBarcode.length}`);
  if (verify.barcode !== PRODUCT_BARCODE) throw new Error(`Barcode not updated: ${verify.barcode}`);

  console.log(`\n✓ ${COPY.nameAr}`);
  console.log(`  Barcode: ${verify.barcode}`);
  console.log(`  Total shades: ${verify.shades?.length ?? shades.length}`);
  console.log(`  Added: ${uploaded.length}`);
  console.log(`  Shade barcodes: 0`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
