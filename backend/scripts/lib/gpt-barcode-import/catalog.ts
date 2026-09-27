import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { CategoryCatalog } from "./types";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, "../../data");
const CATALOG_FILE = join(DATA_DIR, "gpt-category-catalog.json");

export function buildCategoryCatalog(tree: unknown[]): CategoryCatalog {
  const main: CategoryCatalog["main"] = [];
  const sub: CategoryCatalog["sub"] = [];
  const tertiary: CategoryCatalog["tertiary"] = [];

  for (const m of tree as Array<Record<string, unknown>>) {
    const mainId = String(m.id);
    main.push({
      id: mainId,
      name_ar: String(m.nameAr ?? m.name ?? ""),
      name_en: String(m.nameEn ?? m.name ?? ""),
      slug: String(m.slug ?? ""),
    });
    for (const s of (m.children as Array<Record<string, unknown>>) ?? []) {
      const subId = String(s.id);
      sub.push({
        id: subId,
        name_ar: String(s.nameAr ?? s.name ?? ""),
        name_en: String(s.nameEn ?? s.name ?? ""),
        parent_id: mainId,
      });
      for (const t of (s.children as Array<Record<string, unknown>>) ?? []) {
        tertiary.push({
          id: String(t.id),
          name_ar: String(t.nameAr ?? t.name ?? ""),
          name_en: String(t.nameEn ?? t.name ?? ""),
          parent_id: subId,
          main_id: mainId,
        });
      }
    }
  }

  return { main, sub, tertiary };
}

export function loadCachedCatalog(): CategoryCatalog | null {
  if (!existsSync(CATALOG_FILE)) return null;
  try {
    return JSON.parse(readFileSync(CATALOG_FILE, "utf8")) as CategoryCatalog;
  } catch {
    return null;
  }
}

export function saveCatalog(catalog: CategoryCatalog): void {
  mkdirSync(DATA_DIR, { recursive: true });
  writeFileSync(CATALOG_FILE, JSON.stringify(catalog, null, 2), "utf8");
}

export function validateCategories(
  catalog: CategoryCatalog,
  mainId: string,
  subIds: string[],
  tertiaryIds: string[],
): { ok: boolean; reason?: string } {
  const main = catalog.main.find((c) => c.id === mainId);
  if (!main) return { ok: false, reason: `main category id not found: ${mainId}` };

  for (const id of subIds) {
    const row = catalog.sub.find((c) => c.id === id);
    if (!row) return { ok: false, reason: `subcategory id not found: ${id}` };
    if (row.parent_id !== mainId) {
      return { ok: false, reason: `subcategory ${id} does not belong to main ${mainId}` };
    }
  }

  if (tertiaryIds.length && !subIds.length) {
    return { ok: false, reason: "tertiary categories require at least one subcategory" };
  }

  const allowedSubs = new Set(subIds);
  for (const id of tertiaryIds) {
    const row = catalog.tertiary.find((c) => c.id === id);
    if (!row) return { ok: false, reason: `tertiary category id not found: ${id}` };
    if (row.main_id !== mainId) {
      return { ok: false, reason: `tertiary ${id} does not belong to main ${mainId}` };
    }
    if (!allowedSubs.has(row.parent_id)) {
      return { ok: false, reason: `tertiary ${id} parent sub ${row.parent_id} not in selected subs` };
    }
  }

  return { ok: true };
}

export function categoryLabel(
  catalog: CategoryCatalog,
  mainId: string,
  subIds: string[],
  tertiaryIds: string[],
): string {
  const main = catalog.main.find((c) => c.id === mainId);
  const sub = catalog.sub.find((c) => c.id === subIds[0]);
  const tert = catalog.tertiary.find((c) => c.id === tertiaryIds[0]);
  return [main?.name_ar, sub?.name_ar, tert?.name_ar].filter(Boolean).join(" › ");
}
