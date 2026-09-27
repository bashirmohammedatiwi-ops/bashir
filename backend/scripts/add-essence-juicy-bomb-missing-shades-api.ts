/**
 * Add missing Essence Juicy Bomb Shiny Lipgloss shades (not on configurable page).
 * Source: https://www.haar-shop.ch/en/76224614-juicy-bomb-shiny-lipgloss-109-bee-mine.html
 * Usage: npx tsx scripts/add-essence-juicy-bomb-missing-shades-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const PRODUCT_ID = "3f29ccf7-22eb-4e19-b1b1-769fa31b2d80";

type ShadeInput = {
  name: string;
  colorHex: string;
  imageUrl: string;
  position: number;
};

/** Shades sold separately on haar-shop but missing from the configurable listing */
const NEW_SHADES: ShadeInput[] = [
  {
    name: "109 Bee Mine",
    colorHex: "#FFBC67",
    imageUrl:
      "https://www.haar-shop.ch/media/catalog/product/d/8/d81d3a0607d8e554b216931bf4179d8e152e1ed4_4059729608581_ai_essence_juicy_bomb_shiny_lipgloss_109_bee_mine_1_.jpg",
    position: 7,
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
  images?: Array<{ mediaId?: string }>;
  shades?: ExistingShade[];
};

function normalizeName(name: string) {
  return name.trim().toLowerCase();
}

function productImageIds(product: Product): string[] {
  return (product.images ?? []).map((img) => img.mediaId).filter((id): id is string => Boolean(id));
}

async function main() {
  console.log(`API: ${API_BASE}`);
  console.log(`Product: ${PRODUCT_ID}`);
  console.log(`New shades to add: ${NEW_SHADES.length}\n`);

  await login();
  console.log("Logged in.\n");

  const product = await api<Product>(`/products/${PRODUCT_ID}`);
  const existingShades = product.shades ?? [];
  const existingNames = new Set(existingShades.map((s) => normalizeName(s.name)));

  const toAdd = NEW_SHADES.filter((s) => !existingNames.has(normalizeName(s.name)));
  if (!toAdd.length) {
    console.log("All missing shades already exist — nothing to add.");
    return;
  }

  console.log(`Missing: ${toAdd.map((s) => s.name).join(", ")}\n`);
  console.log("Uploading shade images...");

  const uploaded: Array<{
    name: string;
    colorHex: string;
    imageId: string;
    position: number;
    stock: number;
  }> = [];

  for (const shade of toAdd) {
    try {
      const imageId = await uploadImage(shade.imageUrl, shade.name);
      uploaded.push({
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

  if (!uploaded.length) throw new Error("No shade images uploaded");

  const merged = [...existingShades];
  for (const shade of uploaded) {
    merged.push({
      name: shade.name,
      colorHex: shade.colorHex,
      imageId: shade.imageId,
      position: shade.position,
      stock: 0,
    });
  }

  merged.sort((a, b) => {
    const numA = parseInt(a.name.match(/^(\d+)/)?.[1] ?? String(a.position), 10);
    const numB = parseInt(b.name.match(/^(\d+)/)?.[1] ?? String(b.position), 10);
    return numA - numB;
  });

  const shades = merged.map((s, i) => ({
    name: s.name,
    colorHex: s.colorHex ?? "#CCCCCC",
    imageId: s.imageId!,
    position: i,
    stock: s.stock ?? 0,
  }));

  const imageIds = [...new Set([...productImageIds(product), ...uploaded.map((s) => s.imageId)])];

  await api(`/products/${PRODUCT_ID}`, "PATCH", { shades, imageIds });

  console.log(`\n✓ Updated: ${product.nameEn ?? PRODUCT_ID}`);
  console.log(`  Total shades: ${shades.length}`);
  console.log(`  Added: ${uploaded.length}`);
  shades.forEach((s) => console.log(`    ${s.position + 1}. ${s.name}`));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
