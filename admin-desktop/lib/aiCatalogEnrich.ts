import { fetchCatalogProduct, searchCatalogByBarcode, type CatalogImportOption, type CatalogImportShade } from "./catalogImport";
import type { AiAutofillImage } from "./aiProductTypes";
import { resolveShadeColorHex } from "./shadeColorFromImage";

export function normalizeShadeHex(raw?: string): string {
  let h = String(raw ?? "").trim().toUpperCase().replace(/^#/, "");
  if (/^[0-9A-F]{3}$/.test(h)) {
    h = `${h[0]}${h[0]}${h[1]}${h[1]}${h[2]}${h[2]}`;
  }
  if (!/^[0-9A-F]{6}$/.test(h)) return "#CCCCCC";
  return `#${h}`;
}

export function guessShadeHexFromName(name: string): string {
  const n = String(name ?? "").toLowerCase();
  const map: Array<[RegExp, string]> = [
    [/burnt\s*rose|brick\s*red/, "#9B3D3D"],
    [/smooth\s*plum|deep\s*plum|plum/, "#7B3F61"],
    [/nudist|nude\s*pink|soft\s*nude/, "#C9A08A"],
    [/pinky\s*swear|baby\s*pink|light\s*pink/, "#F0A8B8"],
    [/mauve|dusty\s*rose/, "#B07A8A"],
    [/terracotta|rust/, "#C45C3A"],
    [/wine|bordeaux|burgundy/, "#722F37"],
    [/ivory|porcelain/, "#F4E6D4"],
    [/nude|beige|sand/, "#D4B08C"],
    [/honey|caramel|gold/, "#C4924A"],
    [/rose|pink|blush/, "#E8A0B0"],
    [/coral|peach/, "#E07A5F"],
    [/red|cherry|ruby|passion|scarlet/, "#C41E3A"],
    [/berry|cranberry/, "#9E3A59"],
    [/brown|mocha|cocoa|espresso|chocolate/, "#6B3E2E"],
    [/clear|transparent/, "#F6EDE8"],
    [/black|noir/, "#1A1A1A"],
    [/orange|tangerine/, "#E86A2A"],
    [/purple|violet|lilac/, "#8E5A9B"],
  ];
  for (const [re, hex] of map) {
    if (re.test(n)) return hex;
  }
  return "#CCCCCC";
}

export function catalogShadeColor(hit?: CatalogImportOption | null): string {
  const hex = normalizeShadeHex(hit?.colorHex);
  return hex !== "#CCCCCC" ? hex : "";
}

export async function resolveShadeRowColor(input: {
  name: string;
  colorHex?: string;
  imageUrl?: string | null;
  catalogHit?: CatalogImportOption | null;
}): Promise<string> {
  const fromCatalog = catalogShadeColor(input.catalogHit);
  const fromApi = normalizeShadeHex(input.colorHex);
  const swatch = String(input.catalogHit?.swatchUrl || "").trim();
  const thumb = String(input.catalogHit?.thumb || "").trim();
  const image = String(input.imageUrl || "").trim();
  const sampled = await resolveShadeColorHex({
    colorHex: fromCatalog || (fromApi !== "#CCCCCC" ? fromApi : undefined),
    swatchUrl: swatch || thumb || undefined,
    imageUrl: image || thumb || undefined,
  });
  if (sampled) return normalizeShadeHex(sampled);
  if (fromCatalog) return fromCatalog;
  if (fromApi !== "#CCCCCC") return fromApi;
  return guessShadeHexFromName(input.name);
}

export async function enrichShadeColors(
  rows: Array<{ barcode: string; name: string; colorHex: string; imageUrl?: string | null }>,
  catalogMap: Map<string, CatalogImportOption>,
): Promise<void> {
  for (let i = 0; i < rows.length; i += 4) {
    const chunk = rows.slice(i, i + 4);
    await Promise.all(
      chunk.map(async (row) => {
        row.colorHex = await resolveShadeRowColor({
          name: row.name,
          colorHex: row.colorHex,
          imageUrl: row.imageUrl,
          catalogHit: catalogMap.get(row.barcode),
        });
      }),
    );
  }
}

export function isGenericShadeName(name: string): boolean {
  const t = String(name ?? "").trim();
  if (!t) return true;
  if (/^تدرج\s*\d+$/i.test(t)) return true;
  if (/^shade\s*0*\d+$/i.test(t)) return true;
  if (/^color\s*0*\d+$/i.test(t)) return true;
  if (/^\d{1,3}$/.test(t)) return true;
  if (/^no\.?\s*\d{1,3}$/i.test(t)) return true;
  return false;
}

function barcodeDigits(bc: string): string {
  return String(bc ?? "").replace(/\D/g, "");
}

function shadeDisplayName(shade: {
  name?: string;
  nameEn?: string;
  nameAr?: string;
  shadeTitleEn?: string;
  shadeTitleAr?: string;
  shadeCode?: string;
  shadeNumber?: string;
}): string {
  const en = String(shade.shadeTitleEn || shade.nameEn || shade.name || "").trim();
  const ar = String(shade.shadeTitleAr || shade.nameAr || "").trim();
  const code = String(shade.shadeCode || shade.shadeNumber || "").trim();
  let label = en || ar;
  if (label && code && !new RegExp(`\\b${code}\\b`, "i").test(label)) {
    label = `${label} ${code}`;
  }
  return label || code;
}

export function applyCatalogHitToRow(
  row: { barcode: string; name: string; code: string; colorHex: string; imageUrl?: string | null },
  hit: CatalogImportOption,
): void {
  const shadeName = String(hit.matchedShadeName || hit.shadeName || "").trim();
  if (shadeName && !isGenericShadeName(shadeName)) {
    if (isGenericShadeName(row.name) || shadeName.length > row.name.length) {
      row.name = shadeName;
    }
  }
  const codeFromName = shadeName.match(/\b(\d{1,3})\s*$/);
  if (codeFromName && !row.code) {
    row.code = codeFromName[1];
  }
  const hex = catalogShadeColor(hit);
  if (hex) row.colorHex = hex;
  const img = catalogThumbToImage(hit);
  if (img?.url) row.imageUrl = row.imageUrl || img.url;
}

export function isBarcodeLikeProductName(name: string, barcodes: string[] = []): boolean {
  const t = String(name ?? "").trim();
  if (!t) return true;
  const digits = t.replace(/\D/g, "");
  if (/^\d{8,14}$/.test(digits) && t.replace(/\s/g, "") === digits) return true;
  return barcodes.some((bc) => bc === t || bc === digits);
}

const KNOWN_BRANDS = [
  "ARTDECO",
  "Seventeen",
  "GOSH",
  "Mon Reve",
  "Maybelline",
  "L'Oréal",
  "essence",
  "Catrice",
  "Bourjois",
  "Huda Beauty",
  "Beesline",
];

function guessBrandFromTitle(text: string): string {
  const n = text.toLowerCase();
  for (const b of KNOWN_BRANDS) {
    if (n.includes(b.toLowerCase())) return b;
  }
  const first = text.trim().split(/\s+/)[0];
  return first && /^[A-Za-z]/.test(first) ? first : "";
}

function stripShadeSuffixFromTitle(title: string): string {
  let s = String(title ?? "").trim();
  if (!s) return "";

  let size = "";
  const sizeMatch = s.match(/\s+(\d+(?:[.,]\d+)?)\s*(ml|g|oz)\s*$/i);
  if (sizeMatch) {
    const n = parseFloat(sizeMatch[1]);
    const before = s.slice(0, -sizeMatch[0].length).trim();
    const isProductSize =
      n >= 10 ||
      /[.,]/.test(sizeMatch[1]) ||
      /\b(fluid|lipstick|mascara|cream|gel|lotion|foundation|concealer)\s*$/i.test(before);
    if (isProductSize) {
      size = ` ${sizeMatch[1]} ${sizeMatch[2]}`;
      s = before;
    }
  }

  const productLine =
    /\b(lip\s*fluid|mat\s*passion|mascara|foundation|concealer|lipstick|lip\s*gloss|eyeshadow|eyeliner|blush|bronzer|highlighter|primer|powder|brow|lip\s*liner)\b/i;

  const isShadeSegment = (seg: string) => {
    const t = seg.trim();
    if (!t) return false;
    if (productLine.test(t)) return false;
    if (/^\d{1,3}\s*[-–:]\s*[A-Za-z]/i.test(t)) return true;
    if (/^\d{1,3}$/.test(t)) return true;
    if (/^[A-Za-z][A-Za-z\s\-]{2,30}\s+\d{1,3}$/i.test(t)) return true;
    if (/^[A-Za-z][A-Za-z\s\-]{2,30}\s+\d{1,3}(?:\s+\d+(?:[.,]\d+)?\s*(?:ml|g|oz))?$/i.test(t) && !productLine.test(t)) {
      return true;
    }
    return false;
  };

  const parts = s.split(/\s*[-–—]\s*/).map((p) => p.trim()).filter(Boolean);
  while (parts.length > 1 && isShadeSegment(parts[parts.length - 1])) {
    parts.pop();
  }

  let core = parts
    .join(" - ")
    .replace(/\b(?:no\.?|nr\.?|n[°o]\.?|#)\s*\d+\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (size && !new RegExp(size.trim(), "i").test(core)) core = `${core}${size}`.trim();
  return core;
}

export function resolveFamilyProductNames(input: {
  hint?: string;
  nameEn?: string;
  nameAr?: string;
  brandEn?: string;
  brandAr?: string;
}): { nameEn: string; nameAr: string; brandEn: string; brandAr: string } {
  const hint = String(input.hint ?? "").trim();
  const brandEn = String(input.brandEn ?? "").trim() || guessBrandFromTitle(hint || input.nameEn || "");
  const brandAr = String(input.brandAr ?? "").trim() || brandEn;

  const source = hint || String(input.nameEn ?? "").trim();
  const familyCore = stripShadeSuffixFromTitle(
    brandEn ? source.replace(new RegExp(`^${brandEn}\\s*[-–—]?\\s*`, "i"), "").trim() : source,
  );
  const nameEn = brandEn && familyCore ? `${brandEn} - ${familyCore}` : familyCore || source;
  const nameArRaw = String(input.nameAr ?? "").trim();
  const nameAr =
    nameArRaw && !isBarcodeLikeProductName(nameArRaw)
      ? stripShadeSuffixFromTitle(nameArRaw)
      : nameEn;

  return {
    brandEn,
    brandAr,
    nameEn: nameEn.replace(/\s+/g, " ").trim(),
    nameAr: nameAr.replace(/\s+/g, " ").trim(),
  };
}

export function inferProductIdentityFromCatalog(
  hits: Map<string, CatalogImportOption>,
  hint = "",
): { brandEn: string; brandAr: string; nameEn: string; nameAr: string } | null {
  const options = [...hits.values()];
  const hintText = hint.trim();
  if (!options.length && !hintText) return null;

  const best =
    options
      .slice()
      .sort(
        (a, b) =>
          String(b.nameEn ?? b.nameAr ?? "").length - String(a.nameEn ?? a.nameAr ?? "").length,
      )[0] ?? null;

  const rawTitle = hintText || String(best?.nameEn ?? best?.nameAr ?? "").trim();
  if (!rawTitle || isBarcodeLikeProductName(rawTitle)) return null;

  const familyCore = stripShadeSuffixFromTitle(rawTitle);
  const brandEn = guessBrandFromTitle(familyCore);
  const nameEn = brandEn ? `${brandEn} - ${stripShadeSuffixFromTitle(familyCore.replace(new RegExp(`^${brandEn}\\s*`, "i"), "").trim() || familyCore)}` : familyCore;
  const nameAr = String(best?.nameAr ?? "").trim();
  const brandAr = brandEn;

  return {
    brandEn,
    brandAr,
    nameEn: nameEn.replace(/\s+/g, " ").trim(),
    nameAr: nameAr && !isBarcodeLikeProductName(nameAr) ? nameAr : "",
  };
}

export async function enrichBarcodeFromCatalog(
  barcode: string,
  stores: string[] = ["miswag", "faces"],
): Promise<CatalogImportOption | null> {
  let best: CatalogImportOption | null = null;
  await searchCatalogByBarcode(barcode, stores, (partial) => {
    if (partial.options.length) best = partial.options[0];
  });
  return best;
}

export async function enrichShadesFromCatalog(
  barcodes: string[],
  onPartial?: (barcode: string, hit: CatalogImportOption) => void,
  hint?: string,
): Promise<Map<string, CatalogImportOption>> {
  return enrichShadesGlobally(barcodes, hint, onPartial);
}

/**
 * Worldwide smart enrich: OpenBeautyFacts, GoUPC, UPCItemDB, web + image search,
 * with optional catalog-hub boost (not limited to local stores).
 */
/** Catalog-only enrich (shade-family AI endpoint removed). */
export async function enrichShadesGlobally(
  barcodes: string[],
  _hint?: string,
  onPartial?: (barcode: string, hit: CatalogImportOption) => void,
): Promise<Map<string, CatalogImportOption>> {
  if (!barcodes.length) return new Map();
  if (barcodes.length >= 2) {
    return enrichShadeFamilyFromCatalog(barcodes, onPartial);
  }
  const map = new Map<string, CatalogImportOption>();
  const hit = await enrichBarcodeFromCatalog(barcodes[0], ["miswag", "faces"]);
  if (hit) {
    map.set(barcodes[0], hit);
    onPartial?.(barcodes[0], hit);
  }
  return map;
}

/** @deprecated Use enrichShadesGlobally — kept for catalog-only fallback. */
export async function enrichShadeFamilyFromCatalog(
  barcodes: string[],
  onPartial?: (barcode: string, hit: CatalogImportOption) => void,
): Promise<Map<string, CatalogImportOption>> {
  const want = new Set(barcodes.map(barcodeDigits).filter((d) => d.length >= 8));
  const byDigits = new Map<string, CatalogImportOption>();
  const stores = ["miswag", "faces"];

  // Phase 1: probe first 3 barcodes (fast) to find parent product id
  const probe = barcodes.slice(0, Math.min(3, barcodes.length));
  const probes = await Promise.all(
    probe.map(async (barcode) => {
      const hit = await enrichBarcodeFromCatalog(barcode, stores);
      return hit ? { barcode, hit } as const : null;
    }),
  );

  for (const row of probes) {
    if (!row) continue;
    const key = barcodeDigits(row.barcode);
    byDigits.set(key, { ...row.hit, barcode: row.barcode });
    onPartial?.(row.barcode, row.hit);
  }

  const ranked = probes
    .filter((r): r is NonNullable<typeof r> => Boolean(r))
    .map((r) => r.hit)
    .sort(
      (a, b) =>
        (b.shadeCount || 0) - (a.shadeCount || 0) ||
        String(b.nameEn ?? b.nameAr ?? "").length - String(a.nameEn ?? a.nameAr ?? "").length,
    );
  const parent = ranked[0];

  // Phase 2: one product fetch → all shades with barcodes + hex
  if (parent?.sourceId && parent.store) {
    try {
      const product = await fetchCatalogProduct(parent.store, parent.sourceId, parent.storeLabel);
      for (const shade of product.shades ?? []) {
        const digits = barcodeDigits(String(shade.barcode ?? ""));
        if (!digits || !want.has(digits)) continue;
        const original = barcodes.find((bc) => barcodeDigits(bc) === digits) || digits;
        const shadeName = shadeDisplayName(shade);
        const hit: CatalogImportOption = {
          store: product.store,
          storeLabel: product.storeLabel,
          sourceId: product.sourceId,
          nameAr: product.nameAr,
          nameEn: product.nameEn,
          brandAr: product.brandAr,
          thumb: String(shade.swatchUrl || shade.imageUrl || ""),
          barcode: original,
          shadeCount: product.shadeCount ?? product.shades.length,
          shadeName,
          matchedShadeName: shadeName,
          colorHex: String(shade.colorHex || (shade as CatalogImportShade & { hex?: string }).hex || ""),
          swatchUrl: String(shade.swatchUrl || shade.imageUrl || ""),
        };
        byDigits.set(digits, hit);
        onPartial?.(original, hit);
      }
    } catch {
      /* keep probe hits */
    }
  }

  // Phase 3: fill any missing barcodes individually (parallel, 2 stores)
  const missing = barcodes.filter((bc) => !byDigits.has(barcodeDigits(bc)));
  if (missing.length) {
    await Promise.all(
      missing.map(async (barcode) => {
        const hit = await enrichBarcodeFromCatalog(barcode, stores);
        if (!hit) return;
        const key = barcodeDigits(barcode);
        byDigits.set(key, { ...hit, barcode });
        onPartial?.(barcode, hit);
      }),
    );
  }

  const out = new Map<string, CatalogImportOption>();
  for (const bc of barcodes) {
    const hit = byDigits.get(barcodeDigits(bc));
    if (hit) out.set(bc, hit);
  }
  return out;
}

export function catalogThumbToImage(hit: CatalogImportOption): AiAutofillImage | null {
  const url = String(hit.thumb ?? "").trim();
  if (!url.startsWith("http")) return null;
  return {
    url,
    thumbUrl: url,
    title: hit.matchedShadeName || hit.shadeName || hit.nameAr || hit.nameEn || hit.barcode || "",
    source: hit.storeLabel || hit.store,
  };
}

export function mergeUniqueImages(
  base: AiAutofillImage[],
  extra: AiAutofillImage[],
  limit = 96,
): AiAutofillImage[] {
  const seen = new Set(base.map((i) => i.url.toLowerCase()));
  const out = [...base];
  for (const img of extra) {
    const key = img.url.toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(img);
    if (out.length >= limit) break;
  }
  return out;
}
