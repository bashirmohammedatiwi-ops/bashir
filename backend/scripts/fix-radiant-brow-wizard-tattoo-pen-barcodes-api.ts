/**
 * Fix Brow Wizard Tattoo Pen shade barcodes (radiant site had rotated barcodes).
 * Verified: epharmadora.com per-shade product pages.
 * Usage: npx tsx scripts/fix-radiant-brow-wizard-tattoo-pen-barcodes-api.ts
 */
const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const PRODUCT_SLUG = "radiant-professional-brow-wizard-tattoo-pen";

/** Correct barcode per shade name (epharmadora + beautyfree.gr). */
const CORRECT: Record<string, { barcode: string; colorHex: string }> = {
  "01 Light Brown": { barcode: "5201641018828", colorHex: "#c2b197" },
  "02 Natural Brown": { barcode: "5201641018835", colorHex: "#cba47b" },
  "03 Dark Brown": { barcode: "5201641019078", colorHex: "#a18766" },
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

function normalizeName(name: string) {
  return name.trim().replace(/^(\d)\s/, "0$1 ");
}

async function main() {
  await login();
  console.log("Logged in.\n");

  const list = await api<{ data?: Array<{ id: string; slug?: string }> } | Array<{ id: string; slug?: string }>>(
    `/products?search=${encodeURIComponent(PRODUCT_SLUG)}&status=all&limit=5`,
  );
  const rows = Array.isArray(list) ? list : (list.data ?? []);
  const product = rows.find((p) => p.slug === PRODUCT_SLUG);
  if (!product?.id) throw new Error(`Product not found: ${PRODUCT_SLUG}`);

  const full = await api<{
    id: string;
    nameEn?: string;
    imageIds?: string[];
    shades?: Array<{
      name: string;
      barcode?: string | null;
      colorHex: string;
      imageId?: string;
      position: number;
      stock?: number;
    }>;
  }>(`/products/${product.id}`);

  console.log(`Product: ${full.nameEn}\n`);

  let needsPatch = false;
  const shades = [...(full.shades ?? [])]
    .sort((a, b) => a.position - b.position)
    .map((s, i) => {
      const key = normalizeName(s.name);
      const correct = CORRECT[key] ?? CORRECT[s.name];
      if (!correct) {
        console.log(`? Unknown shade: ${s.name}`);
        return { ...s, position: i };
      }

      const barcodeChanged = s.barcode !== correct.barcode;
      const hexChanged = s.colorHex?.toLowerCase() !== correct.colorHex.toLowerCase();
      if (barcodeChanged || hexChanged) {
        needsPatch = true;
        console.log(`↻ ${s.name}`);
        console.log(`    barcode: ${s.barcode} → ${correct.barcode}`);
        if (hexChanged) console.log(`    hex: ${s.colorHex} → ${correct.colorHex}`);
      } else {
        console.log(`= ${s.name} — ${correct.barcode} ✓`);
      }

      return {
        name: s.name,
        barcode: correct.barcode,
        colorHex: correct.colorHex,
        imageId: s.imageId,
        position: i,
        stock: s.stock ?? 0,
      };
    });

  if (!needsPatch) {
    console.log("\nAll barcodes already correct.");
    return;
  }

  await api(`/products/${full.id}`, "PATCH", {
    shades,
    imageIds: full.imageIds,
  });

  console.log(`\n✓ Patched ${full.id}`);
  for (const s of shades) console.log(`  ${s.name} → ${s.barcode}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
