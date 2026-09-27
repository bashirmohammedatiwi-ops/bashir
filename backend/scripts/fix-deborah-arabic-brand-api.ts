/**
 * Fix Deborah Milano Arabic branding to «ديبورa ميلانo» everywhere.
 * Usage: npx tsx scripts/fix-deborah-arabic-brand-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";
const DEBORAH_BRAND_ID = "03bf1748-150d-47b0-9ffc-8aa13f1142d0";

const CORRECT_FULL = "ديبور\u0627 \u0645\u064A\u0644\u0627\u0646\u0648";
const CORRECT_BRAND = "ديبور\u0627";
const WRONG_FULL = "ديبور\u0061 \u0645\u064A\u0644\u0627\u0646\u006F";
const WRONG_FULL2 = "\u062F\u064A\u0628\u0648\u0631\u0627 \u0645\u064A\u0644\u0627\u0646\u0648";
const WRONG_BRAND_LATIN = "ديبور\u0061";
const WRONG_BRAND_RA = "\u062F\u064A\u0628\u0648\u0631\u0627";

function fixArabic(text?: string | null): string | undefined {
  if (!text) return text ?? undefined;
  return text
    .replaceAll(WRONG_FULL, CORRECT_FULL)
    .replaceAll(WRONG_FULL2, CORRECT_FULL)
    .replaceAll(WRONG_BRAND_RA, CORRECT_BRAND)
    .replaceAll(WRONG_BRAND_LATIN, CORRECT_BRAND);
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

type ProductRow = {
  id: string;
  nameAr?: string;
  descriptionAr?: string;
  barcode?: string;
};

async function fetchAllDeborahProducts(): Promise<ProductRow[]> {
  const rows: ProductRow[] = [];
  for (let page = 1; page <= 20; page++) {
    const result = await api<{ data?: ProductRow[]; meta?: { totalPages?: number } } | ProductRow[]>(
      `/products?brandId=${DEBORAH_BRAND_ID}&status=all&limit=100&page=${page}`,
    );
    const batch = Array.isArray(result) ? result : (result.data ?? []);
    rows.push(...batch);
    const totalPages = Array.isArray(result) ? 1 : (result.meta?.totalPages ?? 1);
    if (page >= totalPages || !batch.length) break;
  }
  return rows;
}

async function main() {
  await login();
  console.log("Logged in.\n");

  const products = await fetchAllDeborahProducts();
  console.log(`Deborah products: ${products.length}\n`);

  let fixed = 0;
  for (const p of products) {
    const nameAr = fixArabic(p.nameAr);
    const descriptionAr = fixArabic(p.descriptionAr);
    const changed = nameAr !== p.nameAr || descriptionAr !== p.descriptionAr;
    if (!changed) continue;

    await api(`/products/${p.id}`, "PATCH", {
      ...(nameAr !== p.nameAr ? { nameAr } : {}),
      ...(descriptionAr !== p.descriptionAr ? { descriptionAr } : {}),
    });
    console.log(`✓ ${p.barcode ?? p.id}`);
    if (nameAr !== p.nameAr) console.log(`  name: ${nameAr}`);
    fixed += 1;
  }

  console.log(`\nDone — fixed: ${fixed}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
