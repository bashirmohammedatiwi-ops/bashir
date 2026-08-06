/**
 * Fix GOSH Eye Brow Pencil — remove shade barcodes, correct names/order/colors.
 * Product barcode: 5701278542043 (Grey Brown)
 * Usage: npx tsx scripts/fix-gosh-eye-brow-pencil-shades-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const PRODUCT_ID = "ad7a732e-a5c4-4604-bff0-464adf35685b";
const PRODUCT_BARCODE = "5701278542043";
const PRODUCT_PRICE = 8500;

/** Official goshcopenhagen.com shade names + sampled hex from product images. */
const TARGET_SHADES = [
  { key: "soft black", name: "Soft Black", colorHex: "#2a2828", position: 0 },
  { key: "grey brown", name: "Grey Brown", colorHex: "#6a5e58", position: 1 },
  { key: "01 brown", name: "01 Brown", colorHex: "#5c4030", position: 2 },
  { key: "04 mahogany", name: "04 Mahogany", colorHex: "#6b3d35", position: 3 },
  { key: "05 dark brown", name: "05 Dark Brown", colorHex: "#3d2a22", position: 4 },
] as const;

function shadeKeyFromName(name: string): string {
  const n = name.trim().toLowerCase();
  if (n === "01 brown") return "01 brown";
  if (n.endsWith("soft black")) return "soft black";
  if (n.endsWith("grey brown")) return "grey brown";
  if (n.endsWith("mahogany")) return "04 mahogany";
  if (n.endsWith("dark brown")) return "05 dark brown";
  return n.replace(/^\d+\s+/, "").trim();
}

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

async function main() {
  await login();
  console.log("Logged in.\n");

  const product = await api<{
    nameAr?: string;
    nameEn?: string;
    barcode?: string;
    price?: number;
    shades?: Array<{
      name: string;
      colorHex?: string;
      barcode?: string;
      imageId?: string;
      position?: number;
      stock?: number;
      image?: { originalName?: string };
    }>;
  }>(`/products/${PRODUCT_ID}`);

  console.log(`Product: ${product.nameEn}`);
  console.log(`Barcode before: ${product.barcode}`);
  console.log(`Price before: ${product.price}`);
  console.log("Before:");
  product.shades?.forEach((s) => console.log(`  ${s.name} → ${s.colorHex} | barcode: ${s.barcode ?? "none"}`));

  const imageByKey = new Map<string, string>();
  for (const s of product.shades ?? []) {
    const key = shadeKeyFromName(s.name);
    imageByKey.set(key, s.imageId ?? "");
  }

  const shades = TARGET_SHADES.map((target) => {
    const imageId = imageByKey.get(target.key);
    if (!imageId) throw new Error(`Missing image for shade: ${target.name}`);
    return {
      name: target.name,
      colorHex: target.colorHex,
      imageId,
      position: target.position,
      stock: 0,
    };
  });

  await api(`/products/${PRODUCT_ID}`, "PATCH", {
    barcode: PRODUCT_BARCODE,
    price: PRODUCT_PRICE,
    originalPrice: PRODUCT_PRICE,
    shades,
  });

  const verify = await api<{
    barcode?: string;
    price?: number;
    shades?: Array<{ name: string; colorHex?: string; barcode?: string; position?: number }>;
  }>(`/products/${PRODUCT_ID}`);

  console.log(`\nBarcode after: ${verify.barcode}`);
  console.log(`Price after: ${verify.price}`);
  console.log("After:");
  for (const s of verify.shades ?? []) {
    const bc = s.barcode ? ` | barcode: ${s.barcode}` : " | no shade barcode";
    console.log(`  [${s.position}] ${s.name} → ${s.colorHex}${bc}`);
  }
  console.log("\n✓ Fixed shade names, order, colors; removed shade barcodes");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
