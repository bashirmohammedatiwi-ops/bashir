/**
 * Builds the per-product search representation from fields that actually
 * exist in the catalog — never invents attributes (task rule #8).
 *
 * Two flavors:
 *  - buildSearchText: normalized compact string → Product.searchText column
 *    (lexical ILIKE + pg_trgm matching).
 *  - buildEmbeddingDocument: labeled raw text → embedding model input.
 *  - searchDocHash: content hash → ProductEmbedding.docHash refresh tracking.
 */

import { createHash } from "crypto";
import { normalizeArabicText } from "../text/arabic.util";

export interface SearchDocProduct {
  name: string;
  nameAr?: string | null;
  nameEn?: string | null;
  description?: string | null;
  descriptionAr?: string | null;
  ingredients?: string | null;
  howToUse?: string | null;
  tags?: string | null; // JSON-in-TEXT "[]"
  skinType?: string | null; // JSON-in-TEXT "[]"
  brand?: { name: string } | null;
  category?: { name: string; nameAr?: string | null } | null;
  subcategory?: { name: string; nameAr?: string | null } | null;
  tertiaryCategory?: { name: string; nameAr?: string | null } | null;
  subcategories?: Array<{ name: string; nameAr?: string | null }>;
  tertiaryCategories?: Array<{ name: string; nameAr?: string | null }>;
  shades?: Array<{ name: string }>;
  variants?: Array<{ label?: string | null; sizeLabel?: string | null }>;
}

function parseJsonArray(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map((v) => String(v)).filter(Boolean) : [];
  } catch {
    return [];
  }
}

function uniqueJoin(parts: Array<string | null | undefined>, limit = 0): string {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const part of parts) {
    const value = part?.trim();
    if (!value) continue;
    const key = value.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(value);
    if (limit && out.length >= limit) break;
  }
  return out.join(" ");
}

/** Compact normalized lexical document (column value for Product.searchText). */
export function buildSearchText(p: SearchDocProduct): string {
  return normalizeArabicText(
    uniqueJoin([
      p.nameEn,
      p.name,
      p.nameAr,
      p.brand?.name,
      p.category?.name,
      p.category?.nameAr,
      p.subcategory?.name,
      p.subcategory?.nameAr,
      p.tertiaryCategory?.name,
      p.tertiaryCategory?.nameAr,
      ...(p.subcategories ?? []).flatMap((c) => [c.name, c.nameAr]),
      ...(p.tertiaryCategories ?? []).flatMap((c) => [c.name, c.nameAr]),
      ...parseJsonArray(p.tags),
      ...parseJsonArray(p.skinType),
      ...(p.shades ?? []).map((s) => s.name),
      ...(p.variants ?? []).map((v) => v.label ?? v.sizeLabel ?? ""),
    ]),
  );
}

/** Rich labeled document for the embedding model (raw text, both languages). */
export function buildEmbeddingDocument(p: SearchDocProduct): string {
  const tags = parseJsonArray(p.tags).join(", ");
  const skinTypes = parseJsonArray(p.skinType).join(", ");
  const categories = uniqueJoin(
    [
      p.category?.nameAr ?? p.category?.name,
      p.subcategory?.nameAr ?? p.subcategory?.name,
      p.tertiaryCategory?.nameAr ?? p.tertiaryCategory?.name,
      ...(p.subcategories ?? []).map((c) => c.nameAr ?? c.name),
      ...(p.tertiaryCategories ?? []).map((c) => c.nameAr ?? c.name),
    ],
    6,
  );
  const shades = (p.shades ?? [])
    .slice(0, 12)
    .map((s) => s.name)
    .join(", ");
  const sizes = uniqueJoin((p.variants ?? []).map((v) => v.sizeLabel ?? v.label ?? ""), 4);

  return [
    `Product: ${p.nameEn?.trim() || p.name}`,
    `Arabic: ${p.nameAr?.trim() || p.name}`,
    `Brand: ${p.brand?.name ?? ""}`,
    `Categories: ${categories}`,
    tags ? `Tags: ${tags}` : "",
    skinTypes ? `Skin types: ${skinTypes}` : "",
    shades ? `Shades: ${shades}` : "",
    sizes ? `Sizes: ${sizes}` : "",
    `Description: ${(p.descriptionAr || p.description || "").slice(0, 400)}`,
  ]
    .filter(Boolean)
    .join("\n");
}

export function searchDocHash(doc: string): string {
  return createHash("sha256").update(doc).digest("hex").slice(0, 32);
}
