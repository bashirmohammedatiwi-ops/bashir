/**
 * يربط منتجات دليل البشرة عبر API الإدارة (بدون SSH).
 * Usage:
 *   API_BASE=https://deemaalhayat.com/api/v1 ADMIN_PASSWORD=000000 npx tsx scripts/apply-skin-concerns-api.ts
 */
import { readFileSync } from "fs";
import { join } from "path";

const API_BASE = (process.env.API_BASE ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@alhayaa.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "000000";

const ASSIGNMENTS_FILE = join(__dirname, "skin-concern-assignments.json");

type AssignmentFile = Record<
  string,
  {
    concernId: string;
    concernSlug: string;
    concernName: string;
    products: { id: string; name: string }[];
  }
>;

let token = "";

async function login() {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  });
  const json = (await res.json()) as { data?: { accessToken?: string }; accessToken?: string; message?: string };
  if (!res.ok) {
    throw new Error(json?.message ?? `Login failed HTTP ${res.status}`);
  }
  token = json.data?.accessToken ?? json.accessToken ?? "";
  if (!token) throw new Error("No access token in login response");
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
    const msg = (json as { message?: string; error?: { message?: string } })?.error?.message
      ?? (json as { message?: string })?.message
      ?? res.statusText;
    throw new Error(`${method} ${path}: ${msg}`);
  }
  return ((json as { data?: T }).data ?? json) as T;
}

async function main() {
  console.log(`API: ${API_BASE}`);
  console.log(`Admin: ${ADMIN_EMAIL}`);
  await login();
  console.log("Logged in.\n");

  const assignments = JSON.parse(readFileSync(ASSIGNMENTS_FILE, "utf8")) as AssignmentFile;
  const productToConcerns = new Map<string, Set<string>>();

  for (const entry of Object.values(assignments)) {
    console.log(`${entry.concernName} (${entry.concernSlug}):`);
    for (const p of entry.products) {
      console.log(`  · ${p.name}`);
      if (!productToConcerns.has(p.id)) productToConcerns.set(p.id, new Set());
      productToConcerns.get(p.id)!.add(entry.concernId);
    }
  }

  let ok = 0;
  let fail = 0;

  for (const [productId, concernSet] of productToConcerns) {
    try {
      const product = await api<{
        id: string;
        name?: string;
        skinConcerns?: { concernId?: string; concern?: { id: string } }[];
        concernIds?: string[];
      }>(`/products/${productId}`);

      const existing = new Set<string>();
      if (Array.isArray(product.concernIds)) {
        product.concernIds.forEach((id) => existing.add(id));
      }
      if (Array.isArray(product.skinConcerns)) {
        for (const row of product.skinConcerns) {
          const id = row.concernId ?? row.concern?.id;
          if (id) existing.add(id);
        }
      }
      for (const id of concernSet) existing.add(id);

      await api(`/products/${productId}`, "PATCH", { concernIds: [...existing] });
      ok++;
    } catch (err) {
      fail++;
      console.error(`  FAIL ${productId}: ${err instanceof Error ? err.message : err}`);
    }
  }

  console.log(`\nDone. Updated ${ok} products, ${fail} failed.`);

  for (const entry of Object.values(assignments)) {
    const check = await api<{ products?: { meta?: { total?: number } } }>(
      `/skin-concerns/${entry.concernSlug}/products?limit=1`,
    );
    const total = check.products?.meta?.total ?? 0;
    console.log(`  ${entry.concernName}: ${total} products linked`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
