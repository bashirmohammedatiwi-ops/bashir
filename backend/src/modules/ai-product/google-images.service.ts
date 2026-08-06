import { Injectable, Logger } from "@nestjs/common";

export type GoogleImageHit = {
  url: string;
  thumbUrl: string;
  title: string;
  source: string;
};

/**
 * Free image search via DuckDuckGo (no Google bill).
 * Falls back to empty list if blocked — GPT autofill still works without images.
 */
@Injectable()
export class GoogleImagesService {
  private readonly logger = new Logger(GoogleImagesService.name);

  async searchProductImages(query: string, limit = 24): Promise<GoogleImageHit[]> {
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
        results?: Array<{ image?: string; thumbnail?: string; title?: string; url?: string }>;
      };
      const hits: GoogleImageHit[] = [];
      for (const row of body.results ?? []) {
        const image = (row.image ?? "").trim();
        if (!image.startsWith("http")) continue;
        if (/\.svg(\?|$)/i.test(image)) continue;
        hits.push({
          url: image,
          thumbUrl: (row.thumbnail ?? image).trim(),
          title: (row.title ?? "").trim(),
          source: (row.url ?? "").trim(),
        });
        if (hits.length >= limit) break;
      }
      return hits;
    } catch (err) {
      this.logger.warn(`DDG images failed: ${(err as Error).message}`);
      return [];
    }
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
}
