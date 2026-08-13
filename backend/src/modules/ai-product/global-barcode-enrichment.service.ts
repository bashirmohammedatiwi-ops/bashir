import { Injectable, Logger } from "@nestjs/common";
import { barcodeLookupCandidates } from "../../common/barcode.util";
import { GoogleImagesService } from "./google-images.service";

export type GlobalBarcodeHit = {
  barcode: string;
  brand?: string;
  title?: string;
  shadeName?: string;
  colorHex?: string;
  imageUrl?: string;
  source?: string;
  confidence: number;
};

type MetaRow = {
  brand?: string;
  title?: string;
  shade?: string;
  source?: string;
  imageUrl?: string;
};

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36 AlhayaaAi/3.0";

const JUNK_META =
  /^(barcode\s*lookup|upc\s*database|go-?upc|ean-?search|barcodelookup|upcitemdb|open\s*beauty\s*facts|gs1)$/i;

const GLOBAL_RETAIL_SITES = [
  "site:sephora.com",
  "site:boots.com",
  "site:lookfantastic.com",
  "site:douglas.de",
  "site:flaconi.de",
  "site:notino.com",
  "site:nykaa.com",
  "site:niceonesa.com",
  "site:faces.com",
  "site:miswag.net",
  "site:amazon.com",
  "site:openbeautyfacts.org",
];

@Injectable()
export class GlobalBarcodeEnrichmentService {
  private readonly logger = new Logger(GlobalBarcodeEnrichmentService.name);
  private readonly cache = new Map<string, { at: number; hit: GlobalBarcodeHit }>();
  private lastUpcAt = 0;

  constructor(private readonly images: GoogleImagesService) {}

  async enrichShadeFamily(
    barcodes: string[],
    hint?: string,
    opts?: { budgetMs?: number },
  ): Promise<Map<string, GlobalBarcodeHit>> {
    const budgetMs = opts?.budgetMs ?? 22_000;
    const started = Date.now();
    const out = new Map<string, GlobalBarcodeHit>();

    for (let i = 0; i < barcodes.length; i += 4) {
      if (Date.now() - started > budgetMs) break;
      const chunk = barcodes.slice(i, i + 4);
      const part = await Promise.all(
        chunk.map(async (barcode) => {
          const remaining = Math.max(3_500, budgetMs - (Date.now() - started));
          return this.enrichBarcode(barcode, hint, { budgetMs: Math.min(7_000, remaining) });
        }),
      );
      for (const hit of part) out.set(hit.barcode, hit);
    }
    return out;
  }

  async enrichBarcode(
    barcode: string,
    hint?: string,
    opts?: { budgetMs?: number },
  ): Promise<GlobalBarcodeHit> {
    const digits = String(barcode ?? "").replace(/\D/g, "") || String(barcode ?? "").trim();
    const cacheKey = `${digits}|${(hint ?? "").trim().toLowerCase()}`;
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.at < 30 * 60_000) return cached.hit;

    const budgetMs = opts?.budgetMs ?? 7_000;
    const variants = barcodeLookupCandidates(digits).filter((v) => /^\d{8,14}$/.test(v)).slice(0, 2);

    const run = async (): Promise<GlobalBarcodeHit> => {
      const metas = await Promise.allSettled([
        ...variants.flatMap((v) => [
          this.lookupObf(v),
          this.lookupOff(v),
          this.lookupGoUpc(v),
          this.lookupUpcItemDb(v),
          this.lookupBarcodeLookup(v),
          this.lookupEanSearch(v),
        ]),
        this.lookupWebMeta(digits, hint),
        this.lookupImageMeta(digits, hint),
      ]);

      const rows: MetaRow[] = [];
      for (const row of metas) {
        if (row.status === "fulfilled" && row.value) rows.push(row.value);
      }
      const best = this.pickBestMeta(rows, hint);
      const parsed = this.parseShadeFromTitle(best.title ?? "", best.shade);
      const hit: GlobalBarcodeHit = {
        barcode: digits,
        brand: best.brand,
        title: parsed.productLine || best.title,
        shadeName: parsed.shadeName || best.shade,
        imageUrl: best.imageUrl,
        source: best.source ?? "global",
        confidence: this.scoreMeta(best, hint),
      };
      return hit;
    };

    try {
      const hit = await Promise.race([
        run(),
        new Promise<GlobalBarcodeHit>((resolve) =>
          setTimeout(
            () =>
              resolve({
                barcode: digits,
                confidence: 0,
                source: "timeout",
              }),
            budgetMs,
          ),
        ),
      ]);
      this.cache.set(cacheKey, { at: Date.now(), hit });
      return hit;
    } catch (err) {
      this.logger.warn(`Global enrich failed for ${digits}: ${(err as Error).message}`);
      return { barcode: digits, confidence: 0, source: "error" };
    }
  }

  private pickBestMeta(rows: MetaRow[], hint?: string): MetaRow {
    const hintNorm = (hint ?? "").toLowerCase();
    let best: MetaRow = {};
    let bestScore = -1;
    for (const row of rows) {
      const score = this.scoreMeta(row, hintNorm);
      if (score > bestScore) {
        bestScore = score;
        best = row;
      }
    }
    return best;
  }

  private scoreMeta(row: MetaRow, hint?: string): number {
    const brand = String(row.brand ?? "").trim();
    const title = String(row.title ?? "").trim();
    const shade = String(row.shade ?? "").trim();
    if (!title && !brand) return 0;
    if (JUNK_META.test(brand) || JUNK_META.test(title)) return 0;
    let score = 10;
    if (brand.length >= 2) score += 8;
    if (title.length >= 12) score += 12;
    if (shade.length >= 2) score += 18;
    if (row.source === "openbeautyfacts") score += 6;
    if (row.source === "go-upc") score += 5;
    if (row.source === "upcitemdb") score += 4;
    if (row.source === "web") score += 3;
    if (row.source === "image-search") score += 7;
    const hintNorm = String(hint ?? "").toLowerCase();
    if (hintNorm && `${brand} ${title}`.toLowerCase().includes(hintNorm.slice(0, 12))) score += 10;
    return score;
  }

  private parseShadeFromTitle(title: string, shadeHint?: string): { productLine: string; shadeName: string } {
    const shade = String(shadeHint ?? "").trim();
    let productLine = String(title ?? "").trim();
    let shadeName = shade;

    if (!shadeName && /[-–—]/.test(productLine)) {
      const parts = productLine.split(/[-–—]/).map((p) => p.trim()).filter(Boolean);
      if (parts.length >= 2) {
        const tail = parts[parts.length - 1];
        const isSize = /^\d[\d.]*\s*(oz|ml|g|kg|lb)?$/i.test(tail);
        if (!isSize && tail.length >= 2 && tail.length <= 40) {
          shadeName = tail;
          productLine = parts.slice(0, -1).join(" - ").trim();
        }
      }
    }

    const nr = productLine.match(/\b(?:no\.?|nr\.?|n[°o]\.?|#)\s*(\d{1,3})\s*[-–:]\s*([A-Za-z][A-Za-z\s\-]{2,36})/i);
    if (nr?.[2] && !shadeName) shadeName = `${nr[2].trim()} ${nr[1]}`;

    return { productLine, shadeName: shadeName.replace(/\s+/g, " ").trim() };
  }

  private async lookupObf(barcode: string): Promise<MetaRow | null> {
    try {
      const res = await fetch(`https://world.openbeautyfacts.org/api/v2/product/${barcode}.json`, {
        headers: { Accept: "application/json", "User-Agent": UA },
        signal: AbortSignal.timeout(5_500),
      });
      if (!res.ok) return null;
      const body = (await res.json()) as {
        product?: {
          brands?: string;
          product_name?: string;
          product_name_en?: string;
          product_name_ar?: string;
          image_front_url?: string;
        };
      };
      const p = body.product;
      if (!p) return null;
      const title = (p.product_name_en || p.product_name || p.product_name_ar || "").trim();
      const brand = (p.brands ?? "").split(",")[0]?.trim();
      if (!title && !brand) return null;
      return {
        brand,
        title,
        source: "openbeautyfacts",
        imageUrl: p.image_front_url,
      };
    } catch {
      return null;
    }
  }

  private async lookupOff(barcode: string): Promise<MetaRow | null> {
    try {
      const res = await fetch(`https://world.openfoodfacts.org/api/v2/product/${barcode}.json`, {
        headers: { Accept: "application/json", "User-Agent": UA },
        signal: AbortSignal.timeout(5_000),
      });
      if (!res.ok) return null;
      const body = (await res.json()) as { product?: { brands?: string; product_name?: string } };
      const p = body.product;
      if (!p?.product_name) return null;
      return {
        brand: (p.brands ?? "").split(",")[0]?.trim(),
        title: p.product_name.trim(),
        source: "openfoodfacts",
      };
    } catch {
      return null;
    }
  }

  private async lookupGoUpc(barcode: string): Promise<MetaRow | null> {
    try {
      const res = await fetch(`https://go-upc.com/search?q=${encodeURIComponent(barcode)}`, {
        headers: { Accept: "text/html", "User-Agent": UA },
        signal: AbortSignal.timeout(6_500),
      });
      if (!res.ok) return null;
      const html = await res.text();
      const h1 = html
        .match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1]
        ?.replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim();
      if (!h1 || /not found|search results/i.test(h1) || /^\d+$/.test(h1)) return null;
      const brand =
        html.match(/<td[^>]*>\s*Brand\s*<\/td>\s*<td[^>]*>([^<]+)/i)?.[1]?.trim() ||
        html.match(/Brand<\/[^>]+>\s*<[^>]+>([^<]+)/i)?.[1]?.trim();
      return { brand, title: h1.slice(0, 180), source: "go-upc" };
    } catch {
      return null;
    }
  }

  private async throttleUpc(): Promise<void> {
    const wait = Math.max(0, 2_200 - (Date.now() - this.lastUpcAt));
    if (wait) await new Promise((r) => setTimeout(r, wait));
    this.lastUpcAt = Date.now();
  }

  private async lookupUpcItemDb(barcode: string): Promise<MetaRow | null> {
    try {
      await this.throttleUpc();
      const res = await fetch(`https://api.upcitemdb.com/prod/trial/lookup?upc=${encodeURIComponent(barcode)}`, {
        headers: { Accept: "application/json", "User-Agent": UA },
        signal: AbortSignal.timeout(6_500),
      });
      if (!res.ok) return null;
      const body = (await res.json()) as { items?: Array<{ title?: string; brand?: string }> };
      const item = body.items?.[0];
      if (!item?.title?.trim()) return null;
      return { brand: item.brand?.trim(), title: item.title.trim(), source: "upcitemdb" };
    } catch {
      return null;
    }
  }

  private async lookupBarcodeLookup(barcode: string): Promise<MetaRow | null> {
    try {
      const res = await fetch(`https://www.barcodelookup.com/${encodeURIComponent(barcode)}`, {
        headers: { Accept: "text/html", "User-Agent": UA },
        signal: AbortSignal.timeout(6_500),
      });
      if (!res.ok) return null;
      const html = await res.text();
      const title =
        html.match(/<h4[^>]*>([^<]+)<\/h4>/i)?.[1]?.trim() ||
        html.match(/product-name[^>]*>([^<]+)/i)?.[1]?.trim();
      if (!title || JUNK_META.test(title)) return null;
      const brand = html.match(/<span[^>]*class="[^"]*brand[^"]*"[^>]*>([^<]+)/i)?.[1]?.trim();
      return { brand, title: title.slice(0, 180), source: "barcodelookup" };
    } catch {
      return null;
    }
  }

  private async lookupEanSearch(barcode: string): Promise<MetaRow | null> {
    try {
      const res = await fetch(`https://www.ean-search.org/perl/ean-search.pl?q=${encodeURIComponent(barcode)}`, {
        headers: { Accept: "text/html", "User-Agent": UA },
        signal: AbortSignal.timeout(6_500),
      });
      if (!res.ok) return null;
      const html = await res.text();
      const m = html.match(new RegExp(`${barcode}[^<]{0,24}</a>[^<]*<[^>]+>([^<]{5,140})`, "i"));
      if (!m?.[1]) return null;
      const title = m[1].replace(/\s+/g, " ").trim();
      if (JUNK_META.test(title)) return null;
      return { title, source: "ean-search" };
    } catch {
      return null;
    }
  }

  private async lookupWebMeta(barcode: string, hint?: string): Promise<MetaRow | null> {
    const queries = [
      `"${barcode}"`,
      `${barcode} makeup`,
      hint ? `${hint} ${barcode}` : "",
      `${barcode} site:openbeautyfacts.org`,
    ].filter((q) => q.length >= 8);

    for (const query of queries.slice(0, 2)) {
      try {
        const res = await fetch("https://html.duckduckgo.com/html/", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded", "User-Agent": UA },
          body: `q=${encodeURIComponent(query)}&b=`,
          signal: AbortSignal.timeout(5_500),
        });
        if (!res.ok) continue;
        const html = await res.text();
        const m = html.match(
          /class="result__a"[^>]*>([\s\S]*?)<\/a>[\s\S]*?class="result__snippet"[^>]*>([\s\S]*?)<\/a>/,
        );
        if (!m) continue;
        const title = m[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
        const snippet = m[2].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
        const text = `${title} ${snippet}`.replace(barcode, "").trim();
        if (text.length < 8 || JUNK_META.test(text)) continue;
        const dash = text.split(/\s*[-–—|]\s*/);
        const brand = dash.length >= 2 ? dash[0].trim() : "";
        const productTitle = (dash.length >= 2 ? dash.slice(1).join(" - ") : text).trim();
        return { brand, title: productTitle, source: "web" };
      } catch {
        /* next query */
      }
    }
    return null;
  }

  private async lookupImageMeta(barcode: string, hint?: string): Promise<MetaRow | null> {
    const hints = [hint, ...GLOBAL_RETAIL_SITES.map((site) => `${barcode} ${site}`)].filter(
      (s): s is string => Boolean(s && String(s).trim().length >= 3),
    );
    try {
      const hits = await this.images.searchByBarcodeFast(barcode, 12, hints.slice(0, 4));
      const title = hits
        .map((h) => String(h.title ?? "").trim())
        .find((t) => t.length >= 10 && !/^\d+$/.test(t) && !JUNK_META.test(t));
      if (!title) return null;
      return {
        title: title.slice(0, 160),
        imageUrl: hits[0]?.url,
        source: "image-search",
      };
    } catch {
      return null;
    }
  }
}
