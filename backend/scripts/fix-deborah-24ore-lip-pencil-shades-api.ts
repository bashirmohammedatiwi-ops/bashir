/**
 * Fix Deborah 24Ore Lip Pencil — accurate colorHex sampled from deborahmilano.com shade images.
 * Usage: npx tsx scripts/fix-deborah-24ore-lip-pencil-shades-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const PRODUCT_ID = "170f5a75-9a71-43c2-92a5-1cc556c293f3";

/** Pigment at pencil tip — sampled from full-res deborahmilano.com images (gold barrel + white bg excluded). */
const COLOR_BY_NAME: Record<string, string> = {
  "01 Beige": "#965442",
  "02 Nude": "#965448",
  "03 Rosewood": "#843c36",
  "04 Brown": "#723630",
  "05 Chocolate": "#5a2a30",
  "07 Pink": "#ae5460",
  "08 Fuchsia": "#9c3c48",
  "10 Red": "#901e1e",
  "11 Burgundy": "#66303c",
  "12 Plum": "#723036",
  "13 Nude Brick": "#ae544e",
  "14 Nude Taupe": "#964e54",
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
    shades?: Array<{ id?: string; name: string; colorHex?: string; imageId?: string; position?: number; stock?: number }>;
  }>(`/products/${PRODUCT_ID}`);

  console.log(`Product: ${product.nameEn}`);
  console.log("Before:");
  product.shades?.forEach((s) => console.log(`  ${s.name} → ${s.colorHex}`));

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

  await api(`/products/${PRODUCT_ID}`, "PATCH", { shades });

  console.log("\nAfter:");
  shades.forEach((s) => console.log(`  ${s.name} → ${s.colorHex}`));
  console.log("\n✓ colorHex updated");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
