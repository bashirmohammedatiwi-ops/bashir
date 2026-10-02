import { Injectable, Logger } from "@nestjs/common";

export type GoogleImageHit = {
  url: string;
  thumbUrl: string;
  title: string;
  source: string;
  width?: number | null;
  height?: number | null;
};

/**
 * Product image search — Google CSE when configured, else DuckDuckGo.
 * Barcode mode filters out barcode-sticker / UPC-chart junk; name mode stays broader.
 */
@Injectable()
export class GoogleImagesService {
  private readonly logger = new Logger(GoogleImagesService.name);

  /** Free-text product search (name / brand). */
  async searchQuery(query: string, limit = 72): Promise<GoogleImageHit[]> {
    const q = query.replace(/\s+/g, " ").trim();
    if (q.length < 3) return [];
    return this.collectResults(q, limit, {
      expandVariants: !/^\d{8,14}$/.test(q),
      filterMode: "product",
    });
  }

  /**
   * Barcode mode: packshots + cosmetics retail queries in parallel, strict beauty filter.
   */
  async searchByBarcode(
    barcode: string,
    limit = 72,
    nameHints: string[] = [],
  ): Promise<GoogleImageHit[]> {
    const digits = barcode.replace(/\D/g, "") || barcode.trim();
    if (digits.length < 6) return [];

    const merged: GoogleImageHit[] = [];
    const seen = new Set<string>();
    const pushHits = (batch: GoogleImageHit[]) => {
      for (const hit of batch) {
        const key = this.dedupeKey(hit.url);
        if (!key || seen.has(key)) continue;
        seen.add(key);
        merged.push(hit);
        if (merged.length >= limit) return;
      }
    };

    const brand = nameHints.find((h) => h.length >= 3 && !/^\d{8,14}$/.test(h)) ?? "";
    const shortBrand = brand.split(/\s+/).slice(0, 2).join(" ");
    const shadeCode = nameHints
      .flatMap((h) => [...String(h).matchAll(/\b(\d{2,3})\b/g)].map((m) => m[1]))
      .find((n) => {
        const v = parseInt(n, 10);
        return v >= 1 && v <= 999;
      });

    const parallelQueries: Array<Promise<GoogleImageHit[]>> = [
      this.fetchBarcodePackshots(digits),
      this.searchCosmeticsRetailByBarcode(digits, nameHints),
      this.collectResults(`"${digits}"`, Math.min(28, limit), {
        expandVariants: false,
        filterMode: "barcode",
        nameHints,
      }),
    ];

    if (shortBrand) {
      parallelQueries.push(
        this.collectResults(`"${digits}" ${shortBrand} cosmetics`, Math.min(24, limit), {
          expandVariants: false,
          filterMode: "product",
          nameHints,
        }),
      );
      parallelQueries.push(
        this.collectResults(`${shortBrand} ${digits} lipstick makeup`, Math.min(20, limit), {
          expandVariants: false,
          filterMode: "product",
          nameHints,
        }),
      );
    }
    if (shadeCode && shortBrand) {
      parallelQueries.push(
        this.collectResults(`${shortBrand} ${shadeCode} lip fluid`, Math.min(16, limit), {
          expandVariants: false,
          filterMode: "product",
          nameHints,
        }),
      );
    }

    const batches = await Promise.allSettled(
      parallelQueries.map((task) =>
        Promise.race([
          task,
          new Promise<GoogleImageHit[]>((resolve) => setTimeout(() => resolve([]), 12_000)),
        ]),
      ),
    );
    for (const batch of batches) {
      if (batch.status === "fulfilled") pushHits(batch.value);
      if (merged.length >= limit) break;
    }

    // Sequential fallbacks must stay bounded — unbounded DDG/CSE loops hang autofill past client timeout.
    const started = Date.now();
    const softBudgetMs = 14_000;
    if (merged.length < Math.min(10, limit) && Date.now() - started < softBudgetMs) {
      for (const q of this.barcodeQueryVariants(digits, nameHints).slice(0, 2)) {
        if (merged.length >= limit || Date.now() - started > softBudgetMs) break;
        pushHits(
          await Promise.race([
            this.collectResults(q, Math.min(16, limit), {
              expandVariants: false,
              filterMode: merged.length < 6 ? "product" : "barcode",
              nameHints,
            }),
            new Promise<GoogleImageHit[]>((resolve) => setTimeout(() => resolve([]), 5_000)),
          ]),
        );
      }
    }

    const nameOnly = [
      ...new Set(
        nameHints
          .map((h) => h.replace(/\s+/g, " ").trim())
          .filter((h) => h.length >= 4 && !/^\d{8,14}$/.test(h)),
      ),
    ].slice(0, 2);
    for (const q of nameOnly) {
      if (merged.length >= Math.min(16, limit) || Date.now() - started > softBudgetMs) break;
      pushHits(
        await Promise.race([
          this.collectResults(q, Math.min(16, limit), {
            expandVariants: true,
            filterMode: "product",
            nameHints,
          }),
          new Promise<GoogleImageHit[]>((resolve) => setTimeout(() => resolve([]), 5_000)),
        ]),
      );
    }

    return this.rankProductPhotos(merged, nameHints).slice(0, limit);
  }

  /** Shade-family fast path — packshots + 2 queries max, hard 7s cap. */
  async searchByBarcodeFast(
    barcode: string,
    limit = 16,
    nameHints: string[] = [],
  ): Promise<GoogleImageHit[]> {
    const run = async (): Promise<GoogleImageHit[]> => {
      const digits = barcode.replace(/\D/g, "") || barcode.trim();
      if (digits.length < 6) return [];

      const merged: GoogleImageHit[] = [];
      const seen = new Set<string>();
      const pushHits = (batch: GoogleImageHit[]) => {
        for (const hit of batch) {
          const key = this.dedupeKey(hit.url);
          if (!key || seen.has(key)) continue;
          seen.add(key);
          merged.push(hit);
          if (merged.length >= limit) return;
        }
      };

      pushHits(await this.fetchBarcodePackshots(digits));
      pushHits(await this.searchCosmeticsRetailByBarcode(digits, nameHints));
      const variants = this.barcodeQueryVariants(digits, nameHints).slice(0, 2);
      for (const q of variants) {
        if (merged.length >= limit) break;
        pushHits(
          await this.collectResults(q, Math.min(12, limit), {
            expandVariants: false,
            filterMode: "barcode",
            nameHints,
          }),
        );
      }

      const brand = nameHints.find((h) => h.length >= 3 && !/^\d+$/.test(h));
      if (brand && merged.length < 6) {
        pushHits(
          await this.collectResults(`${brand} ${digits}`, Math.min(12, limit), {
            expandVariants: false,
            filterMode: "product",
            nameHints,
          }),
        );
      }

      return this.rankProductPhotos(merged, nameHints).slice(0, limit);
    };

    try {
      return await Promise.race([
        run(),
        new Promise<GoogleImageHit[]>((resolve) => setTimeout(() => resolve([]), 7_000)),
      ]);
    } catch (err) {
      this.logger.warn(`searchByBarcodeFast failed: ${(err as Error).message}`);
      return [];
    }
  }

  /** Cosmetics retailer image search — mirrors Google Images barcode results. */
  private async searchCosmeticsRetailByBarcode(
    digits: string,
    nameHints: string[] = [],
  ): Promise<GoogleImageHit[]> {
    const brand = nameHints.find((h) => h.length >= 3 && !/^\d{8,14}$/.test(h)) ?? "";
    const shortBrand = brand.split(/\s+/).slice(0, 2).join(" ");
    const sites = [
      "site:artdeco.com",
      "site:sephora.com",
      "site:notino.com",
      "site:douglas.de",
      "site:farmaline.be",
      "site:perfumesclub.com",
      "site:flaconi.de",
      "site:lookfantastic.com",
      "site:boots.com",
      "site:openbeautyfacts.org",
      "site:faces.com",
      "site:miswag.net",
    ];
    const queries = [
      `"${digits}"`,
      shortBrand ? `"${digits}" ${shortBrand}` : "",
      ...sites.slice(0, 6).map((site) => `${site} ${digits}`),
      shortBrand ? `${shortBrand} ${digits} lip fluid` : "",
    ].filter((q) => q.length >= 8);

    const batches = await Promise.allSettled(
      [...new Set(queries)].slice(0, 6).map((q) =>
        this.collectResults(q, 14, {
          expandVariants: false,
          filterMode: "product",
          nameHints,
        }),
      ),
    );
    const out: GoogleImageHit[] = [];
    const seen = new Set<string>();
    for (const batch of batches) {
      if (batch.status !== "fulfilled") continue;
      for (const hit of batch.value) {
        const key = this.dedupeKey(hit.url);
        if (!key || seen.has(key)) continue;
        seen.add(key);
        out.push(hit);
      }
    }
    return out;
  }

  async searchProductImages(query: string, limit = 24): Promise<GoogleImageHit[]> {
    const q = query.trim();
    if (!q) return [];
    if (/^\d{8,14}$/.test(q.replace(/\s/g, ""))) {
      return this.searchByBarcode(q, limit);
    }
    return this.searchQuery(q, limit);
  }

  private barcodeQueryVariants(digits: string, nameHints: string[] = []): string[] {
    const out: string[] = [];
    const add = (q: string) => {
      if (q && !out.includes(q)) out.push(q);
    };
    const brand = nameHints.find((h) => h.length >= 3 && !/^\d+$/.test(h)) ?? "";
    const shortBrand = brand.split(/\s+/).slice(0, 2).join(" ");

    add(digits);
    add(`"${digits}"`);
    add(`EAN ${digits}`);
    add(`UPC ${digits}`);
    add(`barcode ${digits}`);
    if (shortBrand) {
      add(`${shortBrand} ${digits}`);
      add(`"${digits}" ${shortBrand}`);
    }
    if (digits.length === 13 && digits.startsWith("0")) add(digits.slice(1));
    if (digits.length === 12) add(`0${digits}`);
    if (digits.length === 13) add(digits.slice(0, 12));
    add(`${digits} product`);
    add(`${digits} cosmetics`);
    add(`${digits} makeup`);
    add(`site:openbeautyfacts.org ${digits}`);
    add(`site:upcitemdb.com ${digits}`);
    add(`site:barcode.lookup ${digits}`);
    return out;
  }

  /** Open Beauty/Food Facts + retail DB images — high precision for barcode searches. */
  private async fetchBarcodePackshots(barcode: string): Promise<GoogleImageHit[]> {
    const hits: GoogleImageHit[] = [];
    const push = (url: string, title: string, source: string, thumb?: string) => {
      const u = url.trim();
      if (!u.startsWith("http")) return;
      hits.push({
        url: u,
        thumbUrl: (thumb || u).trim(),
        title: title.trim() || barcode,
        source,
      });
    };

    const fetchObf = async (base: string, source: string) => {
      try {
        const res = await fetch(`${base}/api/v2/product/${barcode}.json`, {
          headers: { Accept: "application/json", "User-Agent": "AlhayaaImageSearch/3.0" },
          signal: AbortSignal.timeout(8_000),
        });
        if (!res.ok) return;
        const body = (await res.json()) as {
          status?: number;
          product?: {
            product_name?: string;
            product_name_en?: string;
            brands?: string;
            image_url?: string;
            image_front_url?: string;
            image_front_small_url?: string;
            selected_images?: { front?: { display?: { en?: string } } };
          };
        };
        if (body.status !== 1 || !body.product) return;
        const p = body.product;
        const title = (p.product_name_en || p.product_name || p.brands || barcode).trim();
        const url =
          p.image_front_url ||
          p.selected_images?.front?.display?.en ||
          p.image_url ||
          "";
        push(url, title, source, p.image_front_small_url || url);
      } catch (err) {
        this.logger.debug(`Packshot ${source} skipped: ${(err as Error).message}`);
      }
    };

    await Promise.all([
      fetchObf("https://world.openbeautyfacts.org", "openbeautyfacts.org"),
      fetchObf("https://world.openfoodfacts.org", "openfoodfacts.org"),
    ]);

    try {
      const res = await fetch(
        `https://api.upcitemdb.com/prod/trial/lookup?upc=${encodeURIComponent(barcode)}`,
        {
          headers: { Accept: "application/json", "User-Agent": "AlhayaaImageSearch/3.0" },
          signal: AbortSignal.timeout(7_000),
        },
      );
      if (res.ok) {
        const body = (await res.json()) as {
          items?: Array<{ title?: string; brand?: string; images?: string[] }>;
        };
        const item = body.items?.[0];
        if (item?.images?.length) {
          for (const img of item.images.slice(0, 4)) {
            push(img, item.title || item.brand || barcode, "upcitemdb.com");
          }
        }
      }
    } catch {
      /* optional */
    }

    try {
      const res = await fetch(`https://go-upc.com/search?q=${encodeURIComponent(barcode)}`, {
        headers: { Accept: "text/html", "User-Agent": "AlhayaaImageSearch/3.0" },
        signal: AbortSignal.timeout(6_000),
      });
      if (res.ok) {
        const html = await res.text();
        const img =
          html.match(/<img[^>]+src=["'](https?:\/\/[^"']+\.(?:jpg|jpeg|png|webp)[^"']*)["']/i)?.[1] ||
          html.match(/(https?:\/\/[^\s"'<>]+\.(?:jpg|jpeg|png|webp))/i)?.[1];
        const title =
          html
            .match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1]
            ?.replace(/<[^>]+>/g, " ")
            .replace(/\s+/g, " ")
            .trim() || barcode;
        if (img && !/logo|icon|avatar/i.test(img)) push(img, title, "go-upc.com");
      }
    } catch {
      /* optional */
    }

    return hits;
  }

  private async collectResults(
    query: string,
    limit: number,
    opts: {
      expandVariants?: boolean;
      filterMode?: "soft" | "product" | "barcode";
      nameHints?: string[];
    } = {},
  ): Promise<GoogleImageHit[]> {
    const filterMode = opts.filterMode ?? "product";
    const nameHints = opts.nameHints ?? [];
    const googleKey = process.env.GOOGLE_CSE_API_KEY?.trim();
    const googleCx = process.env.GOOGLE_CSE_CX?.trim();

    const merged: GoogleImageHit[] = [];
    const seen = new Set<string>();
    const push = (batch: GoogleImageHit[]) => {
      for (const hit of batch) {
        const key = this.dedupeKey(hit.url);
        if (!key || seen.has(key)) continue;
        if (!this.isUsableImage(hit, filterMode, nameHints)) continue;
        seen.add(key);
        merged.push(hit);
      }
    };

    const queries = opts.expandVariants
      ? [query, `${query} product`, `${query} packaging`]
      : [query];

    for (const q of queries) {
      if (merged.length >= limit) break;
      const tasks: Promise<GoogleImageHit[]>[] = [];
      if (googleKey && googleCx) {
        tasks.push(this.searchGoogleCse(q, googleKey, googleCx, Math.min(limit, 20)));
      }
      tasks.push(this.searchDuckDuckGo(q, Math.min(30, limit), 0));
      const batches = await Promise.allSettled(tasks);
      for (const batch of batches) {
        if (batch.status === "fulfilled") push(batch.value);
      }
      if (merged.length >= Math.min(12, limit)) break;
    }

    return merged.slice(0, limit);
  }

  private async searchGoogleCse(
    query: string,
    apiKey: string,
    cx: string,
    limit: number,
  ): Promise<GoogleImageHit[]> {
    try {
      const hits: GoogleImageHit[] = [];
      const pages = Math.min(8, Math.ceil(limit / 10));
      for (let i = 0; i < pages; i++) {
        const url = new URL("https://www.googleapis.com/customsearch/v1");
        url.searchParams.set("key", apiKey);
        url.searchParams.set("cx", cx);
        url.searchParams.set("q", query);
        url.searchParams.set("searchType", "image");
        url.searchParams.set("num", "10");
        url.searchParams.set("start", String(i * 10 + 1));
        url.searchParams.set("safe", "off");

        const res = await fetch(url.toString(), { signal: AbortSignal.timeout(12_000) });
        if (!res.ok) {
          this.logger.warn(`Google CSE HTTP ${res.status}`);
          break;
        }
        const body = (await res.json()) as {
          items?: Array<{
            link?: string;
            title?: string;
            image?: {
              thumbnailLink?: string;
              contextLink?: string;
              width?: number | string;
              height?: number | string;
            };
          }>;
        };
        for (const item of body.items ?? []) {
          const image = (item.link ?? "").trim();
          if (!image.startsWith("http")) continue;
          hits.push({
            url: image,
            thumbUrl: (item.image?.thumbnailLink ?? image).trim(),
            title: (item.title ?? "").trim(),
            source: (item.image?.contextLink ?? "").trim(),
            width: this.toDim(item.image?.width),
            height: this.toDim(item.image?.height),
          });
          if (hits.length >= limit) return hits;
        }
        if (!body.items?.length) break;
      }
      return hits;
    } catch (err) {
      this.logger.warn(`Google CSE failed: ${(err as Error).message}`);
      return [];
    }
  }

  private async searchDuckDuckGo(query: string, limit = 50, offset = 0): Promise<GoogleImageHit[]> {
    const q = query.trim();
    if (!q) return [];

    try {
      const vqd = await this.fetchVqd(q);
      if (!vqd) return [];

      const url = new URL("https://duckduckgo.com/i.js");
      url.searchParams.set("l", "us-en");
      url.searchParams.set("o", "json");
      url.searchParams.set("q", q);
      url.searchParams.set("vqd", vqd);
      url.searchParams.set("f", ",,,,,");
      url.searchParams.set("p", "-1");
      if (offset > 0) url.searchParams.set("s", String(offset));

      const res = await fetch(url.toString(), {
        headers: {
          Accept: "application/json",
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
          Referer: "https://duckduckgo.com/",
        },
        signal: AbortSignal.timeout(14_000),
      });
      if (!res.ok) {
        this.logger.warn(`DDG images HTTP ${res.status}`);
        return [];
      }

      const body = (await res.json()) as {
        results?: Array<{
          image?: string;
          thumbnail?: string;
          title?: string;
          url?: string;
          width?: number | string;
          height?: number | string;
          image_width?: number | string;
          image_height?: number | string;
        }>;
      };
      const hits: GoogleImageHit[] = [];
      for (const row of body.results ?? []) {
        const image = (row.image ?? "").trim();
        if (!image.startsWith("http")) continue;
        hits.push({
          url: image,
          thumbUrl: (row.thumbnail ?? image).trim(),
          title: (row.title ?? "").trim(),
          source: (row.url ?? "").trim(),
          width: this.toDim(row.width ?? row.image_width),
          height: this.toDim(row.height ?? row.image_height),
        });
        if (hits.length >= limit) break;
      }
      return hits;
    } catch (err) {
      this.logger.warn(`DDG images failed: ${(err as Error).message}`);
      return [];
    }
  }

  private toDim(v: unknown): number | null {
    const n = typeof v === "number" ? v : parseInt(String(v ?? ""), 10);
    return Number.isFinite(n) && n > 0 ? n : null;
  }

  private async fetchVqd(query: string): Promise<string | null> {
    const pageUrl = `https://duckduckgo.com/?q=${encodeURIComponent(query)}&iax=images&ia=images`;
    const res = await fetch(pageUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        Accept: "text/html",
      },
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) return null;
    const html = await res.text();
    const m =
      html.match(/vqd=["']([^"']+)["']/) ||
      html.match(/vqd=([\d-]+)/) ||
      html.match(/"vqd":"([^"]+)"/);
    return m?.[1] ?? null;
  }

  private dedupeKey(url: string): string | null {
    try {
      const u = new URL(url);
      return `${u.hostname}${u.pathname}`.toLowerCase();
    } catch {
      return url.trim().toLowerCase() || null;
    }
  }

  /**
   * Drop tracking pixels always; in barcode/product mode also drop barcode stickers,
   * UPC charts, generators, and extreme aspect-ratio strips.
   */
  private isUsableImage(
    hit: GoogleImageHit,
    mode: "soft" | "product" | "barcode" = "product",
    nameHints: string[] = [],
  ): boolean {
    const url = hit.url;
    if (!url.startsWith("http")) return false;
    if (/^data:/i.test(url)) return false;
    if (/\.svg(\?|$)/i.test(url)) return false;

    const path = url.toLowerCase();
    const blob = `${path} ${hit.title} ${hit.source}`.toLowerCase();

    if (/[?&](utm_|pixel|track|beacon)=/i.test(path)) return false;
    if (/\/(1x1|pixel\.|spacer\.|blank\.)/i.test(path)) return false;
    if (/\bfavicon\b/i.test(blob)) return false;

    if (this.isNonProductJunk(blob)) return false;

    if (mode === "soft") return true;

    // Barcode generators / symbology chart hosts
    if (
      /(barcode[-.]?(generator|maker|creator)|tec-it\.com|barcodesinc|barcode\.tec|qr-code-generator|qrcode\.|zxing\.|bwip-js)/i.test(
        blob,
      )
    ) {
      return false;
    }

    // Titles/paths that are clearly barcode stickers or lookup pages — not product packshots
    const junk =
      /\b(barcode\s*(label|sticker|symbol|scanner|reader|lookup|check|generator|font|software|scanner)|upc[\s-]*(barcode|a|e)|ean[\s-]*(13|8|barcode)|gtin|datamatrix|data\s*matrix|qr[\s-]?code|stock\s*barcode|empty\s*barcode|barcode\s*only)\b/i;
    if (junk.test(blob)) return false;

    // Arabic junk for barcode-only images
    if (/(ملصق\s*باركود|باركود\s*فقط|مولد\s*باركود|قارئ\s*باركود)/i.test(blob)) return false;

    // Extreme strips = typical 1D barcode images
    const w = hit.width ?? 0;
    const h = hit.height ?? 0;
    if (w > 0 && h > 0) {
      const ratio = w / h;
      if (ratio > 4.2 || ratio < 0.24) return false;
      if (mode === "barcode" && (w < 140 || h < 140)) return false;
    }

    const hasBeautyHint = nameHints.some((hint) =>
      /\b(artdeco|lip|mascara|foundation|cosmetic|makeup|beauty|mat\s*passion|rouge|eyeshadow|concealer|blush)\b/i.test(
        hint,
      ),
    );
    if ((mode === "product" || mode === "barcode") && hasBeautyHint && !this.isBeautyRelevant(hit, nameHints)) {
      return false;
    }

    return true;
  }

  private isNonProductJunk(blob: string): boolean {
    return /\b(ups\b|uninterruptible|power\s*supply|earbuds|airpods|iphone\s*case|charger|cable|adapter|router|modem|laptop|keyboard|mouse|sock|beanie|beanie|winter\s*hat|cereal|baby\s*food|shower\s*gel|adidas\s*ice|stock\s*photo|getty|shutterstock|istock|business\s*meeting|office\s*worker|warehouse|shipping\s*label|delivery\s*note|invoice|receipt|diagram|screenshot|wireframe|placeholder|noimage|no-image|default-image)\b/i.test(
      blob,
    );
  }

  private isBeautyRelevant(hit: GoogleImageHit, nameHints: string[]): boolean {
    const blob = `${hit.title} ${hit.source} ${hit.url}`.toLowerCase();
    const trusted =
      /\b(artdeco|sephora|notino|douglas|farmaline|perfumesclub|flaconi|lookfantastic|boots|nykaa|faces\.com|miswag|openbeautyfacts|cosmetic|makeup|beauty|lip\s*fluid|lipstick|mascara|foundation|concealer|blush|eyeshadow|rouge|mat\s*passion)\b/i;
    if (trusted.test(blob)) return true;

    const w = hit.width ?? 0;
    const h = hit.height ?? 0;
    if (w >= 280 && h >= 280) {
      const ratio = w / h;
      if (ratio >= 0.55 && ratio <= 1.8) return true;
    }

    const brand = nameHints.find((h) => h.length >= 3 && !/^\d+$/.test(h)) ?? "";
    if (brand && blob.includes(brand.split(/\s+/)[0].toLowerCase())) return true;

    return false;
  }

  /** Prefer square-ish retail packshots over long barcode strips that slipped through. */
  private rankProductPhotos(hits: GoogleImageHit[], nameHints: string[] = []): GoogleImageHit[] {
    const brand = nameHints.find((h) => h.length >= 3 && !/^\d{8,14}$/.test(h)) ?? "";
    const score = (h: GoogleImageHit) => {
      let s = 0;
      const w = h.width ?? 0;
      const hgt = h.height ?? 0;
      if (w >= 400 && hgt >= 400) s += 30;
      else if (w >= 250 && hgt >= 250) s += 18;
      if (w > 0 && hgt > 0) {
        const r = w / hgt;
        if (r >= 0.55 && r <= 1.8) s += 25; // packshot-ish
        if (r > 3 || r < 0.33) s -= 40;
      }
      const blob = `${h.title} ${h.source} ${h.url}`.toLowerCase();
      if (/\b(product|packshot|packaging|bottle|tube|box|cosmetics|beauty|makeup|lip\s*fluid|lipstick)\b/i.test(blob)) {
        s += 12;
      }
      if (/\b(artdeco|sephora|notino|douglas|farmaline|perfumesclub|flaconi|openbeautyfacts|go-upc|upcitemdb)\b/i.test(blob)) {
        s += 22;
      }
      if (brand && blob.includes(brand.split(/\s+/)[0].toLowerCase())) s += 15;
      if (/\b(barcode|upc|ean|qr)\b/i.test(blob)) s -= 20;
      if (this.isNonProductJunk(blob)) s -= 80;
      return s;
    };
    return [...hits].sort((a, b) => score(b) - score(a));
  }
}
