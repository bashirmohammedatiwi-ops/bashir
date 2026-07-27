import { Injectable, Logger } from "@nestjs/common";
import { createHash } from "crypto";
import { RedisCacheService } from "./redis-cache.service";
import { CMS_PHRASE_EN, CMS_WORD_EN, PROTECTED_TOKENS } from "./translation-glossary";

const CACHE_PREFIX = "tr:ar-en:";

@Injectable()
export class TranslationService {
  private readonly logger = new Logger(TranslationService.name);
  private readonly memory = new Map<string, string>();

  constructor(private readonly redis: RedisCacheService) {}

  /** يملأ الإنجليزية تلقائياً إن كانت فارغة. */
  async ensureEn(ar?: string | null, en?: string | null): Promise<string> {
    const enVal = (en ?? "").trim();
    if (enVal) return enVal;
    const arVal = (ar ?? "").trim();
    if (!arVal) return "";
    if (this.isMostlyLatin(arVal)) return arVal;
    return this.translateArToEn(arVal);
  }

  /** ترجمة دفعة واحدة — أسرع لصفحة الرئيسية. */
  async ensureEnBatch(pairs: { ar?: string | null; en?: string | null }[]): Promise<string[]> {
    const out: string[] = new Array(pairs.length);
    const pending: { index: number; text: string }[] = [];

    for (let i = 0; i < pairs.length; i++) {
      const enVal = (pairs[i].en ?? "").trim();
      if (enVal) {
        out[i] = enVal;
        continue;
      }
      const arVal = (pairs[i].ar ?? "").trim();
      if (!arVal) {
        out[i] = "";
        continue;
      }
      if (this.isMostlyLatin(arVal)) {
        out[i] = arVal;
        continue;
      }
      const cached = await this.getCached(arVal);
      if (cached) {
        out[i] = cached;
      } else {
        pending.push({ index: i, text: arVal });
      }
    }

    if (!pending.length) return out;

    const unique = [...new Map(pending.map((p) => [p.text, p.text])).keys()];
    const translated = await this.translateMany(unique);
    const map = new Map(unique.map((t, i) => [t, translated[i] ?? t]));

    for (const p of pending) {
      const val = map.get(p.text) ?? p.text;
      out[p.index] = val;
      await this.setCached(p.text, val);
    }
    return out;
  }

  async translateArToEn(text: string): Promise<string> {
    const trimmed = text.trim();
    if (!trimmed) return "";
    if (this.isMostlyLatin(trimmed)) return trimmed;

    const exact = CMS_PHRASE_EN[trimmed];
    if (exact) return exact;

    const cached = await this.getCached(trimmed);
    if (cached) return cached;

    const result = await this.translateMany([trimmed]);
    const out = result[0] ?? this.glossaryTranslate(trimmed);
    await this.setCached(trimmed, out);
    return out;
  }

  private async translateMany(texts: string[]): Promise<string[]> {
    if (!texts.length) return [];

    const deepl = await this.translateViaDeepL(texts);
    if (deepl) return deepl;

    const google = await this.translateViaGoogle(texts);
    if (google) return google;

    const myMemory = await this.translateViaMyMemory(texts);
    if (myMemory) return myMemory;

    return texts.map((t) => this.glossaryTranslate(t));
  }

  private async translateViaDeepL(texts: string[]): Promise<string[] | null> {
    const key = process.env.DEEPL_API_KEY?.trim();
    if (!key) return null;
    try {
      const body = new URLSearchParams();
      body.set("source_lang", "AR");
      body.set("target_lang", "EN");
      for (const t of texts) body.append("text", t);

      const base = key.endsWith(":fx")
        ? "https://api-free.deepl.com/v2/translate"
        : "https://api.deepl.com/v2/translate";

      const res = await fetch(base, {
        method: "POST",
        headers: { Authorization: `DeepL-Auth-Key ${key}` },
        body,
        signal: AbortSignal.timeout(12_000),
      });
      if (!res.ok) {
        this.logger.warn(`DeepL HTTP ${res.status}`);
        return null;
      }
      const data = (await res.json()) as { translations?: { text: string }[] };
      const out = data.translations?.map((t) => t.text?.trim() ?? "") ?? [];
      return out.length === texts.length ? out : null;
    } catch (err) {
      this.logger.warn(`DeepL failed: ${err instanceof Error ? err.message : err}`);
      return null;
    }
  }

  private async translateViaGoogle(texts: string[]): Promise<string[] | null> {
    const key = process.env.GOOGLE_TRANSLATE_API_KEY?.trim();
    if (!key) return null;
    try {
      const url = `https://translation.googleapis.com/language/translate/v2?key=${encodeURIComponent(key)}`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ q: texts, source: "ar", target: "en", format: "text" }),
        signal: AbortSignal.timeout(12_000),
      });
      if (!res.ok) {
        this.logger.warn(`Google Translate HTTP ${res.status}`);
        return null;
      }
      const data = (await res.json()) as {
        data?: { translations?: { translatedText?: string }[] };
      };
      const out = data.data?.translations?.map((t) => t.translatedText?.trim() ?? "") ?? [];
      return out.length === texts.length ? out : null;
    } catch (err) {
      this.logger.warn(`Google Translate failed: ${err instanceof Error ? err.message : err}`);
      return null;
    }
  }

  private async translateViaMyMemory(texts: string[]): Promise<string[] | null> {
    try {
      const out: string[] = [];
      for (const text of texts) {
        const url =
          `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}` +
          `&langpair=ar|en&de=admin@deemaalhayat.com`;
        const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
        if (!res.ok) return null;
        const data = (await res.json()) as {
          responseData?: { translatedText?: string };
          responseStatus?: number;
        };
        if (data.responseStatus && data.responseStatus !== 200) return null;
        const tr = data.responseData?.translatedText?.trim();
        if (!tr || tr.toUpperCase() === text.toUpperCase()) {
          out.push(this.glossaryTranslate(text));
        } else {
          out.push(tr);
        }
      }
      return out;
    } catch {
      return null;
    }
  }

  /** قاموس + كلمات — احتياطي عند غياب API. */
  glossaryTranslate(text: string): string {
    const trimmed = text.trim();
    if (!trimmed) return "";
    if (CMS_PHRASE_EN[trimmed]) return CMS_PHRASE_EN[trimmed];

    let work = trimmed;
    const placeholders: string[] = [];
    for (const token of PROTECTED_TOKENS) {
      if (!work.includes(token)) continue;
      const ph = `⟦${placeholders.length}⟧`;
      placeholders.push(token);
      work = work.split(token).join(ph);
    }

    // أرقام وعملات
    work = work.replace(/(\d[\d,.\s]*)\s*د\.ع/g, "$1 IQD");

    if (CMS_PHRASE_EN[work]) return this.restorePlaceholders(CMS_PHRASE_EN[work], placeholders);

    const words = work.split(/(\s+|[^\u0600-\u06FF\w⟦⟧]+)/);
    const translated = words.map((w) => {
      const bare = w.trim();
      if (!bare || /^⟦\d+⟧$/.test(bare)) return w;
      if (CMS_WORD_EN[bare]) return w.replace(bare, CMS_WORD_EN[bare]);
      return w;
    });
    const joined = translated.join("").replace(/\s+/g, " ").trim();
    if (joined && this.isMostlyLatin(joined)) {
      return this.restorePlaceholders(joined, placeholders);
    }
    return this.restorePlaceholders(trimmed, placeholders);
  }

  private restorePlaceholders(text: string, placeholders: string[]): string {
    let out = text;
    placeholders.forEach((token, i) => {
      out = out.split(`⟦${i}⟧`).join(token);
    });
    return out;
  }

  isMostlyLatin(text: string): boolean {
    const letters = text.replace(/[\s\d\p{P}\p{S}]/gu, "");
    if (!letters.length) return true;
    const latin = (letters.match(/[A-Za-z]/g) ?? []).length;
    const arabic = (letters.match(/[\u0600-\u06FF]/g) ?? []).length;
    return latin > arabic;
  }

  private cacheKey(text: string): string {
    return CACHE_PREFIX + createHash("sha256").update(text).digest("hex").slice(0, 40);
  }

  private async getCached(text: string): Promise<string | null> {
    if (this.memory.has(text)) return this.memory.get(text)!;
    const fromRedis = await this.redis.get<string>(this.cacheKey(text));
    if (fromRedis) {
      this.memory.set(text, fromRedis);
      return fromRedis;
    }
    return null;
  }

  private async setCached(text: string, translation: string): Promise<void> {
    this.memory.set(text, translation);
    await this.redis.set(this.cacheKey(text), translation, 60 * 60 * 24 * 30);
  }
}
