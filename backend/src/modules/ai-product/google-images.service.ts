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
 * Supports barcode mode and free-text name mode (Google-like).
 */
@Injectable()
export class GoogleImagesService {
  private readonly logger = new Logger(GoogleImagesService.name);

  /** Google-like single query search (barcode digits or product name). */
  async searchQuery(query: string, limit = 40): Promise<GoogleImageHit[]> {
    const q = query.replace(/\s+/g, " ").trim();
    if (q.length < 3) return [];

    const googleKey = process.env.GOOGLE_CSE_API_KEY?.trim();
    const googleCx = process.env.GOOGLE_CSE_CX?.trim();
    if (googleKey && googleCx) {
      const hits = await this.searchGoogleCse(q, googleKey, googleCx, limit);
      if (hits.length) return hits;
    }

    // Multiple DDG pages / slight query variants for richer Google-like results
    const variants = [q, `${q} product`, `${q} official`, `${q} packaging`];
    const merged: GoogleImageHit[] = [];
    const seen = new Set<string>();
    for (const v of variants) {
      if (merged.length >= limit) break;
      for (const hit of await this.searchDuckDuckGo(v, Math.min(20, limit))) {
        const key = this.dedupeKey(hit.url);
        if (!key || seen.has(key)) continue;
        seen.add(key);
        merged.push(hit);
        if (merged.length >= limit) break;
      }
    }
    return merged.slice(0, limit);
  }

  /** Search by barcode first, then enrich with product/brand name queries. */
  async searchByBarcode(
    barcode: string,
    limit = 30,
    nameHints: string[] = [],
  ): Promise<GoogleImageHit[]> {
    const digits = barcode.replace(/\D/g, "") || barcode.trim();
    if (digits.length < 6) return [];

    const nameQueries = nameHints
      .map((s) => s.replace(/\s+/g, " ").trim())
      .filter((s) => s.length >= 4)
      .slice(0, 4);

    const queries = [
      digits,
      `${digits} product`,
      `${digits} cosmetics`,
      ...nameQueries.map((n) => `${digits} ${n}`),
      ...nameQueries,
    ];

    const merged: GoogleImageHit[] = [];
    const seen = new Set<string>();
    const pushBatch = (batch: GoogleImageHit[]) => {
      for (const hit of batch) {
        const key = this.dedupeKey(hit.url);
        if (!key || seen.has(key)) continue;
        seen.add(key);
        merged.push(hit);
      }
    };

    for (const q of queries) {
      if (merged.length >= limit) break;
      pushBatch(await this.searchQuery(q, Math.min(18, limit)));
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

  private async searchGoogleCse(
    query: string,
    apiKey: string,
    cx: string,
    limit: number,
  ): Promise<GoogleImageHit[]> {
    try {
      const hits: GoogleImageHit[] = [];
      const pages = Math.min(4, Math.ceil(limit / 10));
      for (let i = 0; i < pages; i++) {
        const url = new URL("https://www.googleapis.com/customsearch/v1");
        url.searchParams.set("key", apiKey);
        url.searchParams.set("cx", cx);
        url.searchParams.set("q", query);
        url.searchParams.set("searchType", "image");
        url.searchParams.set("num", "10");
        url.searchParams.set("start", String(i * 10 + 1));
        url.searchParams.set("safe", "active");

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
          if (!this.isUsableImage(image, item.title ?? "")) continue;
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

  private async searchDuckDuckGo(query: string, limit = 24): Promise<GoogleImageHit[]> {
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
      url.searchParams.set("p", "1");

      const res = await fetch(url.toString(), {
        headers: {
          Accept: "application/json",
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
          Referer: "https://duckduckgo.com/",
        },
        signal: AbortSignal.timeout(12_000),
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
        if (!this.isUsableImage(image, row.title ?? "")) continue;
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

  private isUsableImage(url: string, title = ""): boolean {
    if (!url.startsWith("http")) return false;
    if (/\.svg(\?|$)/i.test(url)) return false;
    if (/\.(gif)(\?|$)/i.test(url)) return false;
    const blob = `${url} ${title}`.toLowerCase();
    const junk =
      /logo|favicon|sprite|icon[_-]?only|placeholder|no[_-]?image|1x1|pixel|tracking|badge|watermark|banner[_-]?ad/;
    if (junk.test(blob)) return false;
    return true;
  }
}
