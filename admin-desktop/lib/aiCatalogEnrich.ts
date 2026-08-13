import { searchCatalogByBarcode, type CatalogImportOption } from "./catalogImport";
import type { AiAutofillImage } from "./aiProductTypes";

export function isGenericShadeName(name: string): boolean {
  const t = String(name ?? "").trim();
  if (!t) return true;
  if (/^تدرج\s*\d+$/i.test(t)) return true;
  if (/^shade\s*\d+$/i.test(t)) return true;
  if (/^\d{1,3}$/.test(t)) return true;
  return false;
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
