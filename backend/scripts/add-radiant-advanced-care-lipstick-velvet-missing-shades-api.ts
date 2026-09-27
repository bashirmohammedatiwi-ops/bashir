/**
 * Add missing VL 11, 14, 15 shades to Radiant Advanced Care Lipstick Velvet.
 * Usage: npx tsx scripts/add-radiant-advanced-care-lipstick-velvet-missing-shades-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const PRODUCT_SLUG = "radiant-professional-advanced-care-lipstick-velvet";

type ShadeInput = {
  name: string;
  barcode: string;
  colorHex: string;
  imageUrl: string;
};

const NEW_SHADES: ShadeInput[] = [
  {
    name: "11 Bubblegum",
    barcode: "5201641748350",
    colorHex: "#f5769a",
    imageUrl: "https://www.brocard.ua/media/catalog/product/5/2/5201641748350_1.jpg",
  },
  {
    name: "14 Strawberry",
    barcode: "5201641748381",
    colorHex: "#ee6878",
    imageUrl: "https://www.brocard.ua/media/catalog/product/5/2/5201641748381_1.jpg",
  },
  {
    name: "15 Watermelon",
    barcode: "5201641748800",
    colorHex: "#db3f7c",
    imageUrl: "https://www.brocard.ua/media/catalog/product/5/2/5201641748800_1.jpg",
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

type ExistingShade = {
  name: string;
  barcode?: string | null;
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

function shadeNumber(name: string) {
  return parseInt(name.match(/^(\d+)/)?.[1] ?? "999", 10);
}

function normalizeName(name: string) {
  return name.trim().toLowerCase();
}

async function main() {
  console.log(`API: ${API_BASE}`);
  await login();
  console.log("Logged in.\n");

  const list = await api<{ data?: Product[] } | Product[]>(
    `/products?search=${encodeURIComponent(PRODUCT_SLUG)}&status=all&limit=5`,
  );
  const rows = Array.isArray(list) ? list : (list.data ?? []);
  const product = rows.find((p) => (p as Product & { slug?: string }).slug === PRODUCT_SLUG) ?? rows[0];
  if (!product?.id) throw new Error(`Product not found: ${PRODUCT_SLUG}`);

  const full = await api<Product>(`/products/${product.id}`);
  const existingShades = full.shades ?? [];
  const existingNames = new Set(existingShades.map((s) => normalizeName(s.name)));
  const existingBarcodes = new Set(existingShades.map((s) => s.barcode).filter(Boolean));

  const toAdd = NEW_SHADES.filter(
    (s) => !existingNames.has(normalizeName(s.name)) && !existingBarcodes.has(s.barcode),
  );

  if (!toAdd.length) {
    console.log("Shades 11, 14, 15 already exist — nothing to add.");
    return;
  }

  console.log(`Product: ${full.nameEn ?? full.id}`);
  console.log(`Adding: ${toAdd.map((s) => s.name).join(", ")}\n`);
  console.log("Uploading shade images...");

  const uploaded: Array<{
    name: string;
    barcode: string;
    colorHex: string;
    imageId: string;
    stock: number;
  }> = [];

  for (const shade of toAdd) {
    try {
      const imageId = await uploadImage(shade.imageUrl, shade.name);
      uploaded.push({
        name: shade.name,
        barcode: shade.barcode,
        colorHex: shade.colorHex,
        imageId,
        stock: 0,
      });
      console.log(`  ✓ ${shade.name} (${shade.colorHex}) — ${shade.barcode}`);
      await new Promise((r) => setTimeout(r, 700));
    } catch (err) {
      console.log(`  ✗ ${shade.name}: ${err instanceof Error ? err.message : err}`);
    }
  }

  if (!uploaded.length) throw new Error("No shade images uploaded");

  const merged = [
    ...existingShades.map((s) => ({
      name: s.name,
      barcode: s.barcode ?? undefined,
      colorHex: s.colorHex,
      imageId: s.imageId,
      stock: s.stock ?? 0,
    })),
    ...uploaded,
  ];

  merged.sort((a, b) => shadeNumber(a.name) - shadeNumber(b.name));

  const shades = merged.map((s, i) => ({
    name: s.name,
    barcode: s.barcode,
    colorHex: s.colorHex,
    imageId: s.imageId,
    position: i,
    stock: s.stock ?? 0,
  }));

  const imageIds = [...new Set([...(full.imageIds ?? []), ...uploaded.map((s) => s.imageId)])];

  await api(`/products/${full.id}`, "PATCH", { shades, imageIds });

  console.log(`\n✓ Updated: ${full.nameEn ?? full.id}`);
  console.log(`  Total shades: ${shades.length}`);
  console.log(`  Added: ${uploaded.length}`);
  shades.forEach((s) => console.log(`    ${s.position + 1}. ${s.name}`));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
