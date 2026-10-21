import { BadRequestException, Injectable, Logger } from "@nestjs/common";

export type WebImageHit = {
  url: string;
  thumbUrl: string;
  title: string;
  /** صفحة المصدر (المتجر أو الموقع) */
  source: string;
  host: string;
  width: number | null;
  height: number | null;
  engine: "bing" | "ddg";
};

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
const CACHE_MS = 10 * 60_000;

/**
 * بحث صور الويب لتطبيق المدير — مثل Google Images: محركان (Bing و DuckDuckGo) بصفحات بلا حد،
 * وتصفية خفيفة فقط (المكرر والصور الصغيرة جداً)، فالمدير يرى كل النتائج ويختار.
 * البحث بالصورة يتم من التطبيق نفسه (اتصال عادي مثل المتصفح) — خوادم البيانات تُطلب منها كابتشا.
 */
@Injectable()
export class ControlWebService {
  private readonly logger = new Logger(ControlWebService.name);
  private readonly cache = new Map<string, { at: number; value: unknown }>();

  // ================================================================ web images

  async images(rawQuery: string, page = 0) {
    const q = rawQuery.replace(/\s+/g, " ").trim();
    if (q.length < 2) throw new BadRequestException("اكتب كلمة البحث");
    const p = Math.max(0, Math.min(Math.floor(page) || 0, 20));
    return this.cached(`img:${q.toLowerCase()}:${p}`, async () => {
      const [bing, ddg] = await Promise.all([
        // صفحتان من Bing (35 لكل صفحة) وصفحة من DuckDuckGo (حتى 100)
        Promise.all([this.bing(q, p * 2), this.bing(q, p * 2 + 1)]).then((x) => x.flat()),
        this.ddg(q, p),
      ]);
      // تناوب بين المحركين: الأفضل من كل واحد أولاً، كما يرتّب Google
      const items: WebImageHit[] = [];
      const seen = new Set<string>();
      const max = Math.max(bing.length, ddg.length);
      for (let i = 0; i < max; i++) {
        for (const hit of [bing[i], ddg[i]]) {
          if (!hit) continue;
          const key = this.key(hit.url);
          if (!key || seen.has(key)) continue;
          seen.add(key);
          items.push(hit);
        }
      }
      return { query: q, page: p, items, hasMore: (bing.length > 0 || ddg.length > 0) && p < 20 };
    });
  }

  private async bing(q: string, page: number): Promise<WebImageHit[]> {
    try {
      const url = `https://www.bing.com/images/async?q=${encodeURIComponent(q)}&first=${page * 35 + 1}&count=35&adlt=off&mmasync=1`;
      const res = await fetch(url, {
        headers: { "User-Agent": UA, "Accept-Language": "en-US,en;q=0.9,ar;q=0.8" },
        signal: AbortSignal.timeout(12_000),
      });
      if (!res.ok) return [];
      const html = await res.text();
      const out: WebImageHit[] = [];
      for (const m of html.matchAll(/ m="([^"]+)"/g)) {
        try {
          const j = JSON.parse(m[1].replace(/&quot;/g, '"').replace(/&amp;/g, "&")) as Record<string, string>;
          const img = (j.murl ?? "").trim();
          if (!this.usable(img)) continue;
          out.push({
            url: img,
            thumbUrl: (j.turl ?? img).trim(),
            title: this.clean(j.t ?? ""),
            source: (j.purl ?? "").trim(),
            host: this.host(j.purl || img),
            width: null,
            height: null,
            engine: "bing",
          });
        } catch {
          /* بطاقة غير مفهومة — نتجاوزها */
        }
      }
      return out;
    } catch (e) {
      this.logger.warn(`bing images: ${(e as Error).message}`);
      return [];
    }
  }

  private async ddg(q: string, page: number): Promise<WebImageHit[]> {
    // منطقة «us-en» تعطي أغلب النتائج؛ «wt-wt» (بلا منطقة) أحياناً ترجع فارغة للإنجليزية وتفيد العربية.
    const first = await this.ddgRegion(q, page, "us-en");
    return first.length ? first : this.ddgRegion(q, page, "wt-wt");
  }

  private async ddgRegion(q: string, page: number, region: string): Promise<WebImageHit[]> {
    try {
      const vqd = await this.cached(`vqd:${q.toLowerCase()}`, () => this.vqd(q));
      if (!vqd) return [];
      const url = new URL("https://duckduckgo.com/i.js");
      url.searchParams.set("l", region);
      url.searchParams.set("o", "json");
      url.searchParams.set("q", q);
      url.searchParams.set("vqd", vqd);
      url.searchParams.set("f", ",,,,,");
      url.searchParams.set("p", "-1");
      if (page > 0) url.searchParams.set("s", String(page * 100));
      const res = await fetch(url, {
        headers: { "User-Agent": UA, Referer: "https://duckduckgo.com/", Accept: "application/json" },
        signal: AbortSignal.timeout(12_000),
      });
      if (!res.ok) return [];
      const body = (await res.json()) as { results?: Array<Record<string, unknown>> };
      const out: WebImageHit[] = [];
      for (const r of body.results ?? []) {
        const img = String(r.image ?? "").trim();
        if (!this.usable(img)) continue;
        const width = Number(r.width) || null;
        const height = Number(r.height) || null;
        // الأيقونات والصور الصغيرة لا تصلح صورة منتج
        if ((width && width < 160) || (height && height < 160)) continue;
        out.push({
          url: img,
          thumbUrl: String(r.thumbnail ?? img).trim(),
          title: this.clean(String(r.title ?? "")),
          source: String(r.url ?? "").trim(),
          host: this.host(String(r.url ?? img)),
          width,
          height,
          engine: "ddg",
        });
      }
      return out;
    } catch (e) {
      this.logger.warn(`ddg images: ${(e as Error).message}`);
      return [];
    }
  }

  private async vqd(q: string): Promise<string | null> {
    const res = await fetch(`https://duckduckgo.com/?q=${encodeURIComponent(q)}&iax=images&ia=images`, {
      headers: { "User-Agent": UA, Accept: "text/html" },
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) return null;
    const html = await res.text();
    const m = html.match(/vqd=["']([^"']+)["']/) || html.match(/vqd=([\d-]+)/) || html.match(/"vqd":"([^"]+)"/);
    return m?.[1] ?? null;
  }

  // ================================================================ helpers

  private usable(url: string) {
    if (!/^https?:\/\//i.test(url)) return false;
    return !/\.(svg|gif)(\?|$)|favicon|logo-|\/sprite/i.test(url);
  }

  private key(url: string) {
    try {
      const u = new URL(url);
      return `${u.hostname}${u.pathname}`.toLowerCase();
    } catch {
      return null;
    }
  }

  private host(url: string) {
    try {
      return new URL(url).hostname.replace(/^www\./, "");
    } catch {
      return "";
    }
  }

  private clean(t: string) {
    return t.replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&#39;/g, "'").replace(/&quot;/g, '"').trim().slice(0, 200);
  }

  private async cached<T>(key: string, fn: () => Promise<T>): Promise<T> {
    const hit = this.cache.get(key);
    if (hit && Date.now() - hit.at < CACHE_MS) return hit.value as T;
    const value = await fn();
    // لا نحفظ نتيجة فارغة (محرك تعثّر لحظياً) — المحاولة التالية تعيد البحث.
    const items = (value as unknown as { items?: unknown[] } | null)?.items;
    const empty = !value || (Array.isArray(items) && items.length === 0);
    if (!empty) this.cache.set(key, { at: Date.now(), value });
    if (this.cache.size > 400) this.cache.delete(this.cache.keys().next().value!);
    return value;
  }
}
