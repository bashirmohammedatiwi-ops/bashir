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
   * Barcode mode: search digits, filter barcode-junk hard, then enrich with name hints.
   */
  async searchByBarcode(
    barcode: string,
    limit = 72,
    nameHints: string[] = [],
  ): Promise<GoogleImageHit[]> {
    const digits = barcode.replace(/\D/g, "") || barcode.trim();
    if (digits.length < 6) return [];

    const variants = this.barcodeQueryVariants(digits);
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

    for (const q of variants) {
      if (merged.length >= limit) break;
      pushHits(
        await this.collectResults(q, limit, {
          expandVariants: false,
          filterMode: "barcode",
        }),
      );
    }

    const barcodePlus: string[] = [];
    const nameOnly: string[] = [];
    for (const hint of nameHints) {
      const h = hint.replace(/\s+/g, " ").trim();
      if (h.length < 2 || h.length > 120) continue;
      if (/^\d{8,14}$/.test(h)) continue;
      barcodePlus.push(`${h} ${digits}`);
      nameOnly.push(h);
      const short = h.split(/\s+/).slice(0, 5).join(" ");
      if (short.length >= 3 && short !== h) nameOnly.push(short);
      const brandLine = h.split(/\s+/).slice(0, 3).join(" ");
      if (brandLine.length >= 3 && brandLine !== short) nameOnly.push(brandLine);
    }
    if (merged.length < Math.min(24, limit)) {
      barcodePlus.push(`${digits} product photo`);
      barcodePlus.push(`${digits} packshot`);
    }

    for (const q of [...new Set(barcodePlus)].slice(0, 6)) {
      if (merged.length >= limit) break;
      pushHits(
        await this.collectResults(q, Math.min(36, limit), {
          expandVariants: false,
          filterMode: "barcode",
        }),
      );
    }
    for (const q of [...new Set(nameOnly)].slice(0, 12)) {
      if (merged.length >= limit) break;
      pushHits(
        await this.collectResults(q, Math.min(48, limit), {
          expandVariants: true,
          filterMode: "product",
        }),
      );
    }

    const storeSites = [
      "site:faces.com",
      "site:miswag.net",
      "site:beautyway.com",
      "site:niceone.com",
      "site:amazon.com",
      "site:sephora.com",
    ];
    const brandHint = nameHints.find((h) => h.length >= 3 && !/^\d+$/.test(h)) ?? "";
    if (brandHint && merged.length < limit) {
      for (const site of storeSites.slice(0, 5)) {
        if (merged.length >= limit) break;
        pushHits(
          await this.collectResults(`${brandHint} ${site}`, Math.min(24, limit), {
            expandVariants: false,
            filterMode: "product",
          }),
        );
      }
      const shadeCode = nameHints
        .flatMap((h) => [...String(h).matchAll(/\b(\d{2,3})\b/g)].map((m) => m[1]))
        .find((n) => {
          const v = parseInt(n, 10);
          return v >= 10 && v <= 999;
        });
      if (shadeCode) {
        pushHits(
          await this.collectResults(`${brandHint} ${shadeCode}`, Math.min(24, limit), {
            expandVariants: false,
            filterMode: "product",
          }),
        );
      }
    }

    return this.rankProductPhotos(merged).slice(0, limit);
  }

  async searchProductImages(query: string, limit = 24): Promise<GoogleImageHit[]> {
    const q = query.trim();
    if (!q) return [];
    if (/^\d{8,14}$/.test(q.replace(/\s/g, ""))) {
      return this.searchByBarcode(q, limit);
    }
    return this.searchQuery(q, limit);
  }

  private barcodeQueryVariants(digits: string): string[] {
    const out: string[] = [];
    const add = (q: string) => {
      if (q && !out.includes(q)) out.push(q);
    };
    // Plain digits first (best retail packshot match). Avoid bare "EAN/UPC <digits>"
    // — those queries mostly return barcode symbology charts and stickers.
    add(digits);
    add(`"${digits}"`);
    if (digits.length === 13 && digits.startsWith("0")) add(digits.slice(1));
    if (digits.length === 12) add(`0${digits}`);
    if (digits.length === 13) add(digits.slice(0, 12));
    add(`${digits} product`);
    return out;
  }

  private async collectResults(
    query: string,
    limit: number,
    opts: { expandVariants?: boolean; filterMode?: "soft" | "product" | "barcode" } = {},
  ): Promise<GoogleImageHit[]> {
    const filterMode = opts.filterMode ?? "product";
    const googleKey = process.env.GOOGLE_CSE_API_KEY?.trim();
    const googleCx = process.env.GOOGLE_CSE_CX?.trim();

    const merged: GoogleImageHit[] = [];
    const seen = new Set<string>();
    const push = (batch: GoogleImageHit[]) => {
      for (const hit of batch) {
        const key = this.dedupeKey(hit.url);
        if (!key || seen.has(key)) continue;
        if (!this.isUsableImage(hit, filterMode)) continue;
        seen.add(key);
        merged.push(hit);
      }
    };

    if (googleKey && googleCx) {
      push(await this.searchGoogleCse(query, googleKey, googleCx, limit));
      if (merged.length >= Math.min(20, limit)) return merged.slice(0, limit);
    }

    const queries = opts.expandVariants
      ? [query, `${query} product`, `${query} packaging`]
      : [query];

    for (const q of queries) {
      if (merged.length >= limit) break;
      for (const offset of [0, 100, 200, 300]) {
        if (merged.length >= limit) break;
        push(await this.searchDuckDuckGo(q, 50, offset));
      }
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

    return true;
  }

  /** Prefer square-ish retail packshots over long barcode strips that slipped through. */
  private rankProductPhotos(hits: GoogleImageHit[]): GoogleImageHit[] {
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
      if (/\b(product|packshot|packaging|bottle|tube|box|cosmetics|beauty|makeup)\b/i.test(blob)) {
        s += 12;
      }
      if (/\b(barcode|upc|ean|qr)\b/i.test(blob)) s -= 20;
      return s;
    };
    return [...hits].sort((a, b) => score(b) - score(a));
  }
}
