/**
 * Fix Deborah 24Ore Color Power Eyeshadow — remove shade barcodes, update colors, set product barcode.
 * Product barcode: 8009518386554 (02 Light Gold)
 * Usage: npx tsx scripts/fix-deborah-24ore-color-power-eyeshadow-shades-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const PRODUCT_ID = "cac595d3-1e3e-4c8b-b293-c449cb41e462";
const PRODUCT_BARCODE = "8009518386554";

/** Official WooCommerce swatch hex + pigment sampling for shades without swatch data. */
const COLOR_BY_NAME: Record<string, string> = {
  "01 Champagne": "#e6c4b9",
  "02 Light Gold": "#dbbbb0",
  "03 Rose Bronze": "#c37f71",
  "04 Warm Brown": "#c18c73",
  "05 Brown": "#362c2a",
  "06 Golden Green": "#94a69e",
  "07 Light Blue": "#b4c8e5",
  "08 Deep Purple": "#5a3f66",
  "09 Night Blue": "#6875a2",
  "10 Mat Black": "#191919",
  "11 Intense Taupe": "#705950",
  "12 Brown": "#472920",
  "13 Military Green": "#545446",
  "14 Burnt Sienna": "#77323c",
  "15 Soft Rose": "#cfa199",
  "16 Ocean Blue": "#3a515c",
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

async function main() {
  await login();
  console.log("Logged in.\n");

  const product = await api<{
    nameAr?: string;
    nameEn?: string;
    barcode?: string;
    shades?: Array<{
      name: string;
      colorHex?: string;
      barcode?: string;
      imageId?: string;
      position?: number;
      stock?: number;
    }>;
  }>(`/products/${PRODUCT_ID}`);

  console.log(`Product: ${product.nameEn}`);
  console.log(`Barcode before: ${product.barcode}`);
  console.log("Before:");
  product.shades?.forEach((s) => console.log(`  ${s.name} → ${s.colorHex} | barcode: ${s.barcode ?? "none"}`));

  const shades = (product.shades ?? []).map((s) => {
    const colorHex = COLOR_BY_NAME[s.name];
    if (!colorHex) throw new Error(`Missing color map for shade: ${s.name}`);
    return {
      name: s.name,
      colorHex,
      imageId: s.imageId,
      position: s.position ?? 0,
      stock: s.stock ?? 0,
    };
  });

  await api(`/products/${PRODUCT_ID}`, "PATCH", {
    barcode: PRODUCT_BARCODE,
    shades,
  });

  console.log(`\nBarcode after: ${PRODUCT_BARCODE}`);
  console.log("After:");
  shades.forEach((s) => console.log(`  ${s.name} → ${s.colorHex} | no shade barcode`));
  console.log("\n✓ Updated colors, removed shade barcodes, set product barcode");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
