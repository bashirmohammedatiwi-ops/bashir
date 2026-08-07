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
 * Barcode mode searches the digits like Google Images (minimal filtering).
 */
@Injectable()
export class GoogleImagesService {
  private readonly logger = new Logger(GoogleImagesService.name);

  /** Exact Google-like search for a free-text or barcode query. */
  async searchQuery(query: string, limit = 48): Promise<GoogleImageHit[]> {
    const q = query.replace(/\s+/g, " ").trim();
    if (q.length < 3) return [];
    return this.collectResults(q, limit, { expandVariants: !/^\d{8,14}$/.test(q) });
  }

  /**
   * Barcode mode: search the barcode digits the way Google Images would —
   * primary query is the barcode itself, plus UPC/EAN length variants only.
   * No "product/cosmetics/packaging" dilution. Soft filters only.
   */
  async searchByBarcode(
    barcode: string,
    limit = 48,
    _nameHints: string[] = [],
  ): Promise<GoogleImageHit[]> {
    const digits = barcode.replace(/\D/g, "") || barcode.trim();
    if (digits.length < 6) return [];

    const variants = this.barcodeQueryVariants(digits);
    const merged: GoogleImageHit[] = [];
    const seen = new Set<string>();

    for (const q of variants) {
      if (merged.length >= limit) break;
      for (const hit of await this.collectResults(q, limit, { expandVariants: false, softFilter: true })) {
        const key = this.dedupeKey(hit.url);
        if (!key || seen.has(key)) continue;
        seen.add(key);
        merged.push(hit);
        if (merged.length >= limit) break;
      }
    }
    return merged.slice(0, limit);
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
    const out = new Set<string>([digits]);
    // EAN-13 with leading 0 ↔ UPC-A (12)
    if (digits.length === 13 && digits.startsWith("0")) out.add(digits.slice(1));
    if (digits.length === 12) out.add(`0${digits}`);
    // Common Google Image style: just the number (already), and quoted for exact match engines
    out.add(`"${digits}"`);
    return [...out];
  }

  private async collectResults(
    query: string,
    limit: number,
    opts: { expandVariants?: boolean; softFilter?: boolean } = {},
  ): Promise<GoogleImageHit[]> {
    const soft = opts.softFilter !== false;
    const googleKey = process.env.GOOGLE_CSE_API_KEY?.trim();
    const googleCx = process.env.GOOGLE_CSE_CX?.trim();

    const merged: GoogleImageHit[] = [];
    const seen = new Set<string>();
    const push = (batch: GoogleImageHit[]) => {
      for (const hit of batch) {
        const key = this.dedupeKey(hit.url);
        if (!key || seen.has(key)) continue;
        if (!this.isUsableImage(hit.url, hit.title, soft)) continue;
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
      // Paginate DDG for richer Google-like volume
      for (const offset of [0, 100, 200]) {
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
      const pages = Math.min(5, Math.ceil(limit / 10));
      for (let i = 0; i < pages; i++) {
        const url = new URL("https://www.googleapis.com/customsearch/v1");
        url.searchParams.set("key", apiKey);
        url.searchParams.set("cx", cx);
        url.searchParams.set("q", query);
        url.searchParams.set("searchType", "image");
        url.searchParams.set("num", "10");
        url.searchParams.set("start", String(i * 10 + 1));
        // Do not force safe=active — it hides many retail product shots
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
        if (!(body.items?.length)) break;
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
      // p=-1 disables safe search — closer to open Google Images results
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
   * Soft filter only — previous rules (logo|badge|icon…) blocked many real product photos
   * because retail CDNs put those words in paths/titles.
   */
  private isUsableImage(url: string, title = "", soft = true): boolean {
    if (!url.startsWith("http")) return false;
    if (/^data:/i.test(url)) return false;
    if (/\.svg(\?|$)/i.test(url)) return false;
    // Keep gifs — some shade swatches are animated or stored as gif
    if (!soft) return true;

    const path = url.toLowerCase();
    // Only drop obvious tracking / 1×1 pixels
    if (/[?&](utm_|pixel|track|beacon)=/i.test(path)) return false;
    if (/\/(1x1|pixel\.|spacer\.|blank\.)/i.test(path)) return false;
    if (/\b(favicon)\b/i.test(`${path} ${title}`)) return false;
    return true;
  }
}
