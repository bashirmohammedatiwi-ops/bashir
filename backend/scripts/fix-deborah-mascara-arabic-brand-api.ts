/**
 * Fix Deborah mascara batch — correct Arabic «ديبورa ميلانo» + Deborah brandId.
 * Usage: npx tsx scripts/fix-deborah-mascara-arabic-brand-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";
const DEBORAH_BRAND_ID = "03bf1748-150d-47b0-9ffc-8aa13f1142d0";

const CORRECT_FULL = "ديبور\u0627 \u0645\u064A\u0644\u0627\u0646\u0648";
const WRONG_FULL = "ديبور\u0061 \u0645\u064A\u0644\u0627\u0646\u006F";
const WRONG_FULL2 = "\u062F\u064A\u0628\u0648\u0631\u0627 \u0645\u064A\u0644\u0627\u0646\u0648";
const WRONG_BRAND_LATIN = "ديبور\u0061";
const WRONG_BRAND_RA = "\u062F\u064A\u0628\u0648\u0631\u0627";

const BARCODES = [
  "8009518415421",
  "8009518475098",
  "8009518475074",
  "8009518468625",
  "8009518207989",
  "8009518374148",
];

function fixArabic(text?: string | null): string {
  if (!text) return text ?? "";
  return text
    .replaceAll(WRONG_FULL, CORRECT_FULL)
    .replaceAll(WRONG_FULL2, CORRECT_FULL)
    .replaceAll(WRONG_BRAND_RA, "ديبور\u0627")
    .replaceAll(WRONG_BRAND_LATIN, "ديبور\u0627");
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

  for (const barcode of BARCODES) {
    const check = await api<{ exists: boolean; product?: { id: string; nameAr?: string; brandId?: string } }>(
      `/products/barcode-check?barcode=${barcode}`,
    );
    if (!check.exists || !check.product?.id) {
      console.log(`skip ${barcode} — not found`);
      continue;
    }

    const full = await api<{ id: string; nameAr?: string; descriptionAr?: string; brandId?: string }>(
      `/products/${check.product.id}`,
    );
    const nameAr = fixArabic(full.nameAr);
    const descriptionAr = fixArabic(full.descriptionAr);
    const needsBrand = full.brandId !== DEBORAH_BRAND_ID;

    await api(`/products/${full.id}`, "PATCH", {
      nameAr,
      descriptionAr,
      ...(needsBrand ? { brandId: DEBORAH_BRAND_ID } : {}),
    });

    console.log(`✓ ${barcode}`);
    console.log(`  ${full.nameAr} → ${nameAr}`);
    if (needsBrand) console.log(`  brandId → ${DEBORAH_BRAND_ID}`);
  }

  console.log("\nDone.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
