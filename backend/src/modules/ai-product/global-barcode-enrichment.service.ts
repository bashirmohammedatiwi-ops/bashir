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

type ShopifyBrandCfg = {
  brands: RegExp[];
  domains: string[];
  hintHandles: Array<{ pattern: RegExp; handles: string[] }>;
};

const SHOPIFY_BRANDS: ShopifyBrandCfg[] = [
  {
    brands: [/artdeco/i],
    domains: ["artdeco.com"],
    hintHandles: [
      { pattern: /mat\s*passion|lip\s*fluid/i, handles: ["mat-passion-lip-fluid-15-ad1882-xx"] },
    ],
  },
  {
    brands: [/essence/i],
    domains: ["essence.eu", "essencemakeup.com"],
    hintHandles: [],
  },
  {
    brands: [/catrice/i],
    domains: ["catrice.eu"],
    hintHandles: [],
  },
];

@Injectable()
export class GlobalBarcodeEnrichmentService {
  private readonly logger = new Logger(GlobalBarcodeEnrichmentService.name);
  private readonly cache = new Map<string, { at: number; hit: GlobalBarcodeHit }>();
  private lastUpcAt = 0;

  constructor(private readonly images: GoogleImagesService) {}

  /**
   * One Shopify product page often lists every shade barcode — fastest path for makeup families.
   */
  async enrichFamilyFromShopify(barcodes: string[], hint?: string): Promise<Map<string, GlobalBarcodeHit>> {
    const want = new Set(
      barcodes.map((bc) => String(bc ?? "").replace(/\D/g, "") || String(bc ?? "").trim()).filter(Boolean),
    );
    if (!want.size) return new Map();

    const hintText = String(hint ?? "").trim();
    const configs = this.shopifyConfigsForHint(hintText);
    if (!configs.length) return new Map();

    const handles = new Set<string>();
    for (const cfg of configs) {
      for (const row of cfg.hintHandles) {
        if (!hintText || row.pattern.test(hintText)) {
          for (const h of row.handles) handles.add(h);
        }
      }
    }

    for (const cfg of configs) {
      for (const domain of cfg.domains) {
        for (const bc of barcodes.slice(0, 3)) {
          const found = await this.discoverShopifyHandle(domain, bc, hintText);
          if (found) handles.add(found);
        }
        if (!handles.size && hintText.length >= 6) {
          const found = await this.discoverShopifyHandle(domain, hintText, hintText);
          if (found) handles.add(found);
        }
      }
    }

    const out = new Map<string, GlobalBarcodeHit>();
    for (const cfg of configs) {
      for (const domain of cfg.domains) {
        for (const handle of handles) {
          const part = await this.fetchShopifyProduct(domain, handle, want);
          for (const [digits, hit] of part) {
            const prev = out.get(digits);
            if (!prev || hit.confidence > prev.confidence) out.set(digits, hit);
          }
        }
      }
    }
    return out;
  }

  async enrichShadeFamily(
    barcodes: string[],
    hint?: string,
    opts?: { budgetMs?: number },
  ): Promise<Map<string, GlobalBarcodeHit>> {
    const budgetMs = opts?.budgetMs ?? 40_000;
    const started = Date.now();
    const out = new Map<string, GlobalBarcodeHit>();
    const digitsList = barcodes.map(
      (bc) => String(bc ?? "").replace(/\D/g, "") || String(bc ?? "").trim(),
    );

    const shopifyMap = await this.enrichFamilyFromShopify(barcodes, hint);
    for (const [digits, hit] of shopifyMap) {
      if (hit.shadeName && hit.confidence >= 50) out.set(digits, hit);
    }

    const missingBarcodes = barcodes.filter((bc) => {
      const digits = String(bc ?? "").replace(/\D/g, "") || String(bc ?? "").trim();
      const hit = out.get(digits);
      return !hit?.shadeName;
    });

    const chunkSize = barcodes.length >= 10 ? 6 : 4;
    for (let i = 0; i < missingBarcodes.length; i += chunkSize) {
      if (Date.now() - started > budgetMs) break;
      const chunk = missingBarcodes.slice(i, i + chunkSize);
      const part = await Promise.all(
        chunk.map(async (barcode) => {
          const remaining = Math.max(3_500, budgetMs - (Date.now() - started));
          return this.enrichBarcode(barcode, hint, { budgetMs: Math.min(8_000, remaining) });
        }),
      );
      for (const hit of part) {
        const prev = out.get(hit.barcode);
        if (!prev || hit.confidence > prev.confidence || (hit.shadeName && !prev.shadeName)) {
          out.set(hit.barcode, hit);
        }
      }
    }

    const weak = digitsList.filter((digits) => {
      const hit = out.get(digits);
      return !hit || hit.confidence < 50 || !hit.shadeName;
    });
    if (weak.length && Date.now() - started < budgetMs) {
      const best = [...out.values()].sort((a, b) => b.confidence - a.confidence)[0];
      const familyHint = [hint, best?.brand, best?.title].filter(Boolean).join(" ").trim();
      const retry = await this.retryWeakBarcodes(weak, familyHint, {
        budgetMs: Math.min(22_000, Math.max(5_000, budgetMs - (Date.now() - started))),
      });
      for (const [digits, hit] of retry) {
        const prev = out.get(digits);
        if (hit.confidence > (prev?.confidence ?? 0) || (hit.shadeName && !prev?.shadeName)) {
          out.set(digits, hit);
        }
      }
    }

    return out;
  }

  private shopifyConfigsForHint(hint: string): ShopifyBrandCfg[] {
    const h = String(hint ?? "").trim();
    if (!h) return [];
    return SHOPIFY_BRANDS.filter((cfg) => cfg.brands.some((re) => re.test(h)));
  }

  private async discoverShopifyHandle(domain: string, query: string, hint: string): Promise<string | null> {
    const q = String(query ?? "").trim();
    if (!q) return null;
    try {
      const url = `https://${domain}/search/suggest.json?q=${encodeURIComponent(q)}&resources[type]=product&resources[limit]=6`;
      const res = await fetch(url, {
        headers: { Accept: "application/json", "User-Agent": UA },
        signal: AbortSignal.timeout(6_500),
      });
      if (!res.ok) return null;
      const body = (await res.json()) as {
        resources?: { results?: { products?: Array<{ handle?: string; title?: string }> } };
      };
      const products = body.resources?.results?.products ?? [];
      const hintNorm = String(hint ?? "").toLowerCase();
      const hintTokens = hintNorm.split(/\s+/).filter((t) => t.length >= 4).slice(0, 4);
      for (const p of products) {
        const handle = String(p.handle ?? "").trim();
        const title = String(p.title ?? "").toLowerCase();
        if (!handle) continue;
        if (hintTokens.length && hintTokens.some((t) => title.includes(t))) return handle;
        if (/mat\s*passion|lip\s*fluid|lipstick|mascara|foundation/i.test(hintNorm) && /lip|mascara|foundation|blush/i.test(title)) {
          return handle;
        }
        if (products.length === 1) return handle;
      }
    } catch {
      /* ignore */
    }
    return null;
  }

  private parseShopifyVariantShade(variantTitle: string): { code: string; shadeName: string } {
    const raw = String(variantTitle ?? "").trim();
    if (!raw || /^default$/i.test(raw)) return { code: "", shadeName: "" };

    const codeDash = raw.match(/^(\d{1,3})\s*[-–:]\s*(.+)$/i);
    if (codeDash) {
      return {
        code: codeDash[1],
        shadeName: `${codeDash[2].trim()} ${codeDash[1]}`.replace(/\s+/g, " ").trim(),
      };
    }

    const nameNum = raw.match(/^([A-Za-z][A-Za-z\s\-]{2,36})\s+(\d{1,3})$/);
    if (nameNum) {
      return { code: nameNum[2], shadeName: `${nameNum[1].trim()} ${nameNum[2]}` };
    }

    return { code: "", shadeName: raw };
  }

  private async fetchShopifyProduct(
    domain: string,
    handle: string,
    want: Set<string>,
  ): Promise<Map<string, GlobalBarcodeHit>> {
    const out = new Map<string, GlobalBarcodeHit>();
    try {
      const res = await fetch(`https://${domain}/products/${handle}.json`, {
        headers: { Accept: "application/json", "User-Agent": UA },
        signal: AbortSignal.timeout(10_000),
      });
      if (!res.ok) return out;
      const body = (await res.json()) as {
        product?: {
          title?: string;
          vendor?: string;
          images?: Array<{ src?: string }>;
          variants?: Array<{
            barcode?: string;
            title?: string;
            name?: string;
            featured_image?: { src?: string };
          }>;
        };
      };
      const product = body.product;
      if (!product) return out;

      const family = String(product.title ?? "").trim();
      const brand = String(product.vendor ?? "").trim();
      const fallbackImage = product.images?.[0]?.src;

      for (const v of product.variants ?? []) {
        const digits = String(v.barcode ?? "").replace(/\D/g, "");
        if (!digits || !want.has(digits)) continue;

        const variantTitle = String(v.title ?? v.name ?? "").trim();
        const parsed = this.parseShopifyVariantShade(variantTitle);
        const imageRaw = v.featured_image?.src || fallbackImage;
        const imageUrl = imageRaw
          ? imageRaw.startsWith("http")
            ? imageRaw
            : `https:${imageRaw}`
          : undefined;

        out.set(digits, {
          barcode: digits,
          brand: brand || undefined,
          title: family,
          shadeName: parsed.shadeName,
          imageUrl,
          source: `shopify:${domain}`,
          confidence: parsed.shadeName ? 92 : 55,
        });
      }
    } catch (err) {
      this.logger.debug(`Shopify fetch failed ${domain}/${handle}: ${(err as Error).message}`);
    }
    return out;
  }

  /** Focused second pass for barcodes that missed on the first global sweep. */
  async retryWeakBarcodes(
    barcodes: string[],
    familyHint: string,
    opts?: { budgetMs?: number },
  ): Promise<Map<string, GlobalBarcodeHit>> {
    const budgetMs = opts?.budgetMs ?? 18_000;
    const started = Date.now();
    const out = new Map<string, GlobalBarcodeHit>();
    const unique = [...new Set(barcodes.map((bc) => String(bc ?? "").replace(/\D/g, "") || String(bc ?? "").trim()))];

    await Promise.all(
      unique.map(async (digits) => {
        if (Date.now() - started > budgetMs) return;
        const remaining = Math.max(4_000, budgetMs - (Date.now() - started));
        const hit = await this.enrichBarcodeFocused(digits, familyHint, {
          budgetMs: Math.min(10_000, remaining),
        });
        out.set(digits, hit);
      }),
    );
    return out;
  }

  private async enrichBarcodeFocused(
    digits: string,
    familyHint: string,
    opts?: { budgetMs?: number },
  ): Promise<GlobalBarcodeHit> {
    const cacheKey = `focus|${digits}|${familyHint.trim().toLowerCase()}`;
    const cached = this.cache.get(cacheKey);
    if (cached && cached.hit.confidence > 0 && Date.now() - cached.at < 30 * 60_000) {
      return cached.hit;
    }

    const budgetMs = opts?.budgetMs ?? 9_000;
    const run = async (): Promise<GlobalBarcodeHit> => {
      const metas = await Promise.allSettled([
        this.lookupGoUpc(digits),
        this.lookupObf(digits),
        this.lookupUpcItemDb(digits),
        this.lookupWebMeta(digits, `"${digits}" ${familyHint} lipstick shade`),
        this.lookupWebMeta(digits, `${digits} ${familyHint} site:artdeco.com`),
        this.lookupWebMeta(digits, `${digits} ${familyHint} site:sephora.com`),
        this.lookupImageMeta(digits, familyHint),
        this.lookupBrandSite(digits, familyHint),
      ]);
      const rows: MetaRow[] = [];
      for (const row of metas) {
        if (row.status === "fulfilled" && row.value) rows.push(row.value);
      }
      const best = this.pickBestMeta(rows, familyHint);
      const parsed = this.parseShadeFromTitle(best.title ?? "", best.shade);
      return {
        barcode: digits,
        brand: best.brand,
        title: parsed.productLine || best.title,
        shadeName: parsed.shadeName || best.shade,
        imageUrl: best.imageUrl,
        source: best.source ? `retry:${best.source}` : "retry",
        confidence: this.scoreMeta(best, familyHint),
      };
    };

    try {
      const hit = await Promise.race([
        run(),
        new Promise<GlobalBarcodeHit>((resolve) =>
          setTimeout(() => resolve({ barcode: digits, confidence: 0, source: "timeout" }), budgetMs),
        ),
      ]);
      if (hit.confidence > 0) this.cache.set(cacheKey, { at: Date.now(), hit });
      return hit;
    } catch {
      return { barcode: digits, confidence: 0, source: "error" };
    }
  }

  private async lookupBrandSite(barcode: string, hint: string): Promise<MetaRow | null> {
    const h = hint.toLowerCase();
    const sites: string[] = [];
    if (/\bartdeco\b/i.test(hint)) sites.push("artdeco.com");
    if (/\bessence\b/i.test(hint)) sites.push("essence.eu", "essencemakeup.com");
    if (/\bmaybelline\b/i.test(hint)) sites.push("maybelline.com");
    if (/\bloreal\b/i.test(hint) || /\bl'oreal\b/i.test(hint)) sites.push("loreal.com");
    if (!sites.length) return null;

    for (const site of sites.slice(0, 2)) {
      const row = await this.lookupWebMeta(barcode, `"${barcode}" site:${site} ${hint}`);
      if (row?.title) return { ...row, source: `brand:${site}` };
    }
    return null;
  }

  async enrichBarcode(
    barcode: string,
    hint?: string,
    opts?: { budgetMs?: number },
  ): Promise<GlobalBarcodeHit> {
    const digits = String(barcode ?? "").replace(/\D/g, "") || String(barcode ?? "").trim();
    const cacheKey = `${digits}|${(hint ?? "").trim().toLowerCase()}`;
    const cached = this.cache.get(cacheKey);
    if (cached) {
      const age = Date.now() - cached.at;
      if (cached.hit.confidence > 0 && age < 30 * 60_000) return cached.hit;
      if (cached.hit.confidence <= 0 && age < 90_000) return cached.hit;
    }

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
    if (row.source?.startsWith("brand:")) score += 9;
    if (row.source?.startsWith("retry:")) score += 2;
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

    const codeDash = productLine.match(/\b(\d{1,3})\s*[-–]\s*([A-Za-z][A-Za-z\s\-]{2,36})\b/);
    if (codeDash?.[2] && !shadeName) shadeName = `${codeDash[2].trim()} ${codeDash[1]}`;

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
