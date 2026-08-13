import { searchCatalogByBarcode, type CatalogImportOption } from "./catalogImport";
import type { AiAutofillImage } from "./aiProductTypes";

export function isGenericShadeName(name: string): boolean {
  const t = String(name ?? "").trim();
  if (!t) return true;
  if (/^تدرج\s*\d+$/i.test(t)) return true;
  if (/^shade\s*\d+$/i.test(t)) return true;
  if (/^\d{1,3}$/.test(t)) return true;
  if (/^no\.?\s*\d{1,3}$/i.test(t)) return true;
  return false;
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
  return title
    .replace(/\b(?:no\.?|nr\.?|n[°o]\.?|#)\s*\d+\b/gi, " ")
    .replace(/\b\d{2,3}\b(?!\s*(?:ml|g|gr|oz)\b)/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
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
): Promise<Map<string, CatalogImportOption>> {
  const map = new Map<string, CatalogImportOption>();
  const stores = ["faces", "miswag", "miraaya", "beautyway", "niceone"];
  await Promise.all(
    barcodes.map(async (barcode) => {
      const hit = await enrichBarcodeFromCatalog(barcode, stores);
      if (!hit) return;
      map.set(barcode, hit);
      onPartial?.(barcode, hit);
    }),
  );
  return map;
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
