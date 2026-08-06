/**
 * Add Mon Reve Matte Lips shades 18, 19, 20, 21 — preserve existing shade barcodes.
 * Sources: monrevecosmetics.com (names), pharmachoice.gr (barcodes, images)
 * Usage: npx tsx scripts/add-mon-reve-matte-lips-shades-18-21-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const PRODUCT_ID = "2a6cb692-a628-42db-9f4c-4e20f2896f1d";
const SHADE_PRICE = 7500;

type ShadeInput = {
  name: string;
  colorHex: string;
  imageUrl: string;
  barcode?: string;
};

/** Barcodes from pharmachoice.gr; 21 omitted — 5201641007303 already on 12 Milky Berry. */
const NEW_SHADES: ShadeInput[] = [
  {
    name: "18 Cafe Au Lait",
    colorHex: "#9E7978",
    imageUrl:
      "https://s3.gy.digital/pharmachoice/uploads/asset/data/12309/%CE%9D%CE%AD%CE%BF_%CE%AD%CF%81%CE%B3%CE%BF_-_2023-05-25T112309.212.jpg",
    barcode: "5201641007273",
  },
  {
    name: "19 Banoffee",
    colorHex: "#8F646A",
    imageUrl:
      "https://s3.gy.digital/pharmachoice/uploads/asset/data/12318/%CE%9D%CE%AD%CE%BF_%CE%AD%CF%81%CE%B3%CE%BF_-_2023-05-25T124644.968.jpg",
    barcode: "5201641007280",
  },
  {
    name: "20 Glazed",
    colorHex: "#966966",
    imageUrl:
      "https://s3.gy.digital/pharmachoice/uploads/asset/data/12317/%CE%9D%CE%AD%CE%BF_%CE%AD%CF%81%CE%B3%CE%BF_-_2023-05-25T124456.923.jpg",
    barcode: "5201641007297",
  },
  {
    name: "21 Toffee",
    colorHex: "#A5736F",
    imageUrl:
      "https://s3.gy.digital/pharmachoice/uploads/asset/data/12512/%CE%9D%CE%AD%CE%BF_%CE%AD%CF%81%CE%B3%CE%BF_-_2023-06-19T151959.410.jpg",
  },
];

const DESC_AR_LINES =
  "• 18 Cafe Au Lait — كافيه أو ليه بيج وردي\n" +
  "• 19 Banoffee — بني بانوفي كراميلي\n" +
  "• 20 Glazed — نود لامع زجاجي\n" +
  "• 21 Toffee — توفي بني دافئ";

const DESC_EN_LINES =
  "• 18 Cafe Au Lait — cafe au lait beige pink\n" +
  "• 19 Banoffee — banoffee caramel brown\n" +
  "• 20 Glazed — glazed glassy nude\n" +
  "• 21 Toffee — warm toffee brown";

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
  barcode?: string;
  price?: number;
  originalPrice?: number;
};

type Product = {
  id: string;
  nameAr?: string;
  nameEn?: string;
  descriptionAr?: string;
  descriptionEn?: string;
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

function appendShadeLines(description: string | undefined, lines: string) {
  if (!description) return lines;
  if (description.includes("18 Cafe Au Lait") || description.includes("18 CAFE AU LAIT")) return description;
  return `${description}\n${lines}`;
}

async function main() {
  console.log(`API: ${API_BASE}`);
  console.log(`Product: ${PRODUCT_ID}`);
  console.log(`New shades: ${NEW_SHADES.length}\n`);

  await login();
  console.log("Logged in.\n");

  const product = await api<Product>(`/products/${PRODUCT_ID}`);
  const existingShades = [...(product.shades ?? [])];
  const beforeBarcodes = existingShades.filter((s) => s.barcode).map((s) => ({ name: s.name, barcode: s.barcode! }));
  const existingNames = new Set(existingShades.map((s) => normalizeName(s.name)));

  const toAdd = NEW_SHADES.filter((s) => !existingNames.has(normalizeName(s.name)));
  if (!toAdd.length) {
    console.log("All requested shades already exist — nothing to add.");
    return;
  }

  console.log(`Adding: ${toAdd.map((s) => s.name).join(", ")}\n`);
  console.log(`Preserving ${beforeBarcodes.length} existing shade barcodes.\n`);
  console.log("Uploading shade images...");

  const uploaded: ExistingShade[] = [];
  for (const shade of toAdd) {
    const imageId = await uploadImage(shade.imageUrl, shade.name);
    uploaded.push({
      name: shade.name,
      colorHex: shade.colorHex,
      imageId,
      position: 0,
      stock: 0,
      price: SHADE_PRICE,
      originalPrice: SHADE_PRICE,
      ...(shade.barcode ? { barcode: shade.barcode } : {}),
    });
    console.log(`  ✓ ${shade.name} — ${shade.colorHex}${shade.barcode ? ` — ${shade.barcode}` : ""}`);
    await new Promise((r) => setTimeout(r, 500));
  }

  const merged = [...existingShades, ...uploaded].sort((a, b) => shadeNumber(a.name) - shadeNumber(b.name));

  const shades = merged.map((s, i) => {
    const row: ExistingShade = {
      name: s.name,
      colorHex: s.colorHex,
      imageId: s.imageId,
      position: i,
      stock: s.stock ?? 0,
      price: s.price ?? SHADE_PRICE,
      originalPrice: s.originalPrice ?? SHADE_PRICE,
    };
    if (s.barcode) row.barcode = s.barcode;
    return row;
  });

  const imageIds = [...new Set([...(product.imageIds ?? []), ...uploaded.map((s) => s.imageId!).filter(Boolean)])];

  const descriptionAr = appendShadeLines(product.descriptionAr, DESC_AR_LINES);
  const descriptionEn = appendShadeLines(product.descriptionEn, DESC_EN_LINES);

  await api(`/products/${PRODUCT_ID}`, "PATCH", {
    nameAr: product.nameAr,
    nameEn: product.nameEn,
    descriptionAr,
    descriptionEn,
    shades,
    imageIds,
  });

  const verify = await api<Product>(`/products/${PRODUCT_ID}`);
  const afterBarcodes = (verify.shades ?? []).filter((s) => s.barcode);

  for (const prev of beforeBarcodes) {
    const now = (verify.shades ?? []).find((s) => s.name === prev.name);
    if (!now?.barcode) throw new Error(`Lost barcode for ${prev.name}`);
    if (now.barcode !== prev.barcode) throw new Error(`Barcode changed for ${prev.name}: ${prev.barcode} → ${now.barcode}`);
  }

  console.log(`\n✓ Updated: ${product.nameEn ?? PRODUCT_ID}`);
  console.log(`  Total shades: ${verify.shades?.length ?? shades.length}`);
  console.log(`  Added: ${uploaded.length}`);
  console.log(`  Shade barcodes preserved: ${afterBarcodes.length} (was ${beforeBarcodes.length})`);
  (verify.shades ?? shades).forEach((s, i) => {
    const bc = s.barcode ? ` [${s.barcode}]` : "";
    console.log(`    ${String(i + 1).padStart(2, "0")}. ${s.name}${bc}`);
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
