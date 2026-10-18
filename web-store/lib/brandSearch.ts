import { brandLabel } from "./format";
import type { Brand } from "./types";

/**
 * بحث البراندات — نفس منطق التطبيق (brand_search.dart):
 * 1) النص المطوي، 2) «هيكل النطق» المشترك بين العربي واللاتيني («لوريال» = L'Oréal)، 3) خطأ إملائي بحرف.
 */

const LATIN_FOLD: Record<string, string> = {
  à: "a", á: "a", â: "a", ã: "a", ä: "a", å: "a", ā: "a", ç: "c", è: "e", é: "e", ê: "e", ë: "e", ē: "e",
  ì: "i", í: "i", î: "i", ï: "i", ñ: "n", ò: "o", ó: "o", ô: "o", õ: "o", ö: "o", ø: "o",
  ù: "u", ú: "u", û: "u", ü: "u", ý: "y", ÿ: "y", ß: "ss", œ: "oe", æ: "ae", ı: "i", ş: "s", ğ: "g",
};

export function normalizeQuery(raw: string) {
  return raw
    .toLowerCase()
    .replace(/[ً-ْٰـ]/g, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/[^\p{L}\p{N}\s]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function foldText(raw: string) {
  return normalizeQuery([...raw.toLowerCase()].map((c) => LATIN_FOLD[c] ?? c).join(""));
}

const compact = (raw: string) => foldText(raw).replace(/ /g, "");
const ARABIC = /[؀-ۿ]/;

export function phoneticKey(raw: string) {
  const s = compact(raw);
  let out = "";
  let last: string | null = null;
  const put = (c: string) => {
    if (c !== last) out += c;
    last = c;
  };
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    const next = s[i + 1] ?? "";
    if (c === "p" && next === "h") {
      put("f");
      i++;
    } else if (c === "b" || c === "p") put("b");
    else if (c === "c") {
      if (next === "h") (put("s"), i++);
      else if (next === "k") (put("k"), i++);
      else put(next && "eiy".includes(next) ? "s" : "k");
    } else if (c === "s") {
      if (next === "h") i++;
      put("s");
    } else if (c === "t") {
      if (next === "h") i++;
      put("t");
    } else if (c === "g" || c === "k") {
      if (next === "h") i++;
      put("k");
    } else if (c === "q" || c === "j") put("k");
    else if (c === "x") (put("k"), put("s"));
    else if (c === "z") put("s");
    else if (c === "v" || c === "f") put("f");
    else if ("dlmnr".includes(c)) put(c);
    else if ("aeiouywh".includes(c)) last = null;
    else if (c === "ب" || c === "پ") put("b");
    else if (c === "ت" || c === "ط") put("t");
    else if (c === "د" || c === "ض") put("d");
    else if ("ثذزسشصظچ".includes(c)) put("s");
    else if ("جغقكخگ".includes(c)) put("k");
    else if (c === "ف" || c === "ڤ") put("f");
    else if (c === "ل") put("l");
    else if (c === "م") put("m");
    else if (c === "ن") put("n");
    else if (c === "ر") put("r");
    else if ("اويهحعء".includes(c)) last = null;
    else if (/[0-9]/.test(c)) put(c);
  }
  return out;
}

function fineKey(raw: string) {
  const s = compact(raw);
  let out = "";
  let last: string | null = null;
  const put = (c: string) => {
    if (c !== last) out += c;
    last = c;
  };
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    const next = s[i + 1] ?? "";
    if (c === "p" && next === "h") {
      put("f");
      i++;
      continue;
    }
    if ((c === "c" || c === "s") && next === "h") {
      put("s");
      i++;
      continue;
    }
    const m =
      c === "a" || c === "ا" ? "a"
      : "eiyي".includes(c) ? "i"
      : "ouwو".includes(c) ? "u"
      : "bpب".includes(c) ? "b"
      : c === "c" ? (next && "eiy".includes(next) ? "s" : "k")
      : "kqكقخ".includes(c) ? "k"
      : "gغگ".includes(c) ? "g"
      : "jج".includes(c) ? "j"
      : "szسزشصثذظ".includes(c) ? "s"
      : c === "x" ? "ks"
      : "tتط".includes(c) ? "t"
      : "dدض".includes(c) ? "d"
      : "fvفڤ".includes(c) ? "f"
      : "lل".includes(c) ? "l"
      : "mم".includes(c) ? "m"
      : "nن".includes(c) ? "n"
      : "rر".includes(c) ? "r"
      : "";
    for (const ch of m) put(ch);
  }
  return out;
}

function lev(a: string, b: string, max = 2) {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    let best = i;
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      if (cur[j] < best) best = cur[j];
    }
    if (best > max) return max + 1;
    prev = cur;
  }
  return prev[b.length];
}

type Entry = { brand: Brand; compact: string; words: string[]; key: string; wordKeys: string[]; fines: string[] };
const count = (b: Brand) => b.productCount ?? 0;

export class BrandSearchIndex {
  private entries: Entry[];
  constructor(brands: Brand[]) {
    this.entries = brands.map((b) => {
      const names = [...new Set([b.name, b.nameAr, b.nameEn, b.slug.replace(/-/g, " ")].filter(Boolean) as string[])].join(" ");
      const words = [...new Set(foldText(names).split(" ").filter(Boolean))];
      const label = brandLabel(b.name);
      return {
        brand: b,
        compact: compact(b.name),
        words,
        key: phoneticKey(label),
        wordKeys: [...new Set(words.map(phoneticKey).filter(Boolean))],
        fines: [...new Set([fineKey(label), ...words.map(fineKey)])].filter(Boolean),
      };
    });
  }

  private fineGap(e: Entry, qf: string) {
    if (!qf) return 9;
    let best = 9;
    for (const f of e.fines) best = Math.min(best, lev(qf, f.slice(0, qf.length), 4));
    return best;
  }

  private score(e: Entry, q: string, qc: string, tokens: string[], qk: string, qf: string) {
    if (!qc) return 0;
    if (e.compact === qc || e.words.includes(qc)) return 1000;
    if (e.compact.startsWith(qc)) return 900;
    if (e.words.some((w) => w.startsWith(qc))) return 820;
    if (tokens.length > 1 && tokens.every((t) => e.words.some((w) => w.startsWith(t)))) return 800;
    if (qk.length >= 2) {
      const tk = tokens.map(phoneticKey).filter(Boolean);
      const hit = e.key.startsWith(qk) || e.wordKeys.some((w) => w.startsWith(qk)) || (tk.length > 0 && tk.every((t) => e.wordKeys.some((w) => w.startsWith(t))));
      if (hit) return 620 - 15 * Math.min(6, Math.max(0, this.fineGap(e, qf)));
    }
    if (qc.length >= 3 && e.compact.includes(qc)) return 450;
    if (qk.length >= 3 && e.key.includes(qk)) return 300;
    if (qc.length >= 5) {
      for (const w of [e.compact, ...e.words]) {
        if (w.length >= qc.length - 1 && lev(qc, w.length > qc.length ? w.slice(0, qc.length) : w, 1) <= 1) return 260;
      }
    }
    if (qk.length >= 4 && ARABIC.test(q)) {
      for (const w of [e.key, ...e.wordKeys]) {
        if (w.length >= qk.length && lev(qk, w.slice(0, qk.length), 1) <= 1) return 160;
      }
    }
    return 0;
  }

  search(raw: string): Brand[] {
    const q = foldText(raw);
    const qc = q.replace(/ /g, "");
    if (!qc) return [];
    const tokens = q.split(" ").filter(Boolean);
    const qk = phoneticKey(raw);
    const qf = fineKey(raw);
    if (qc.length === 1) {
      const arabic = ARABIC.test(qc);
      const rank = (e: Entry) =>
        e.compact.startsWith(qc) ? 3 : e.words.some((w) => w.startsWith(qc)) ? 2 : arabic && qk && e.key.startsWith(qk) && e.fines.some((f) => f.startsWith(qf)) ? 1 : 0;
      return this.entries
        .filter((e) => rank(e) > 0)
        .sort((a, b) => rank(b) - rank(a) || count(b.brand) - count(a.brand))
        .map((e) => e.brand);
    }
    let scored = this.entries.map((e) => [e, this.score(e, q, qc, tokens, qk, qf)] as const).filter(([, s]) => s > 0);
    if (scored.length) {
      const best = Math.max(...scored.map(([, s]) => s));
      if (best >= 560) {
        const floor = Math.min(560, Math.max(450, best - 45));
        scored = scored.filter(([, s]) => s >= floor);
      }
    }
    return scored
      .sort(([a, sa], [b, sb]) => sb - sa || this.fineGap(a, qf) - this.fineGap(b, qf) || count(b.brand) - count(a.brand))
      .map(([e]) => e.brand);
  }

  suggest(raw: string): Brand[] {
    const qk = phoneticKey(raw);
    if (qk.length < 2) return [];
    const ranked: [Brand, number][] = [];
    for (const e of this.entries) {
      let best = 9;
      for (const w of [e.key, ...e.wordKeys]) best = Math.min(best, lev(qk, w.slice(0, qk.length), 2));
      if (best <= 2) ranked.push([e.brand, best]);
    }
    return ranked
      .sort((a, b) => a[1] - b[1] || count(b[0]) - count(a[0]))
      .slice(0, 3)
      .map(([b]) => b);
  }
}

/** حرف الفهرس: أول حرف لاتيني من الاسم، وإلا «#». */
export function indexLetter(b: Brand) {
  const latin = foldText(b.nameEn || b.name).match(/[a-z]/);
  if (latin) return latin[0].toUpperCase();
  return /[0-9]/.test(b.name) ? "#" : "ع";
}

/** «جولدن روز - قلم كحل» تحت شعار GOLDEN ROSE ← «قلم كحل»: البراند مكتوب فوق الاسم (نفس التطبيق). */
export function stripBrandPrefix(name: string, brandName?: string | null) {
  const b = brandName?.trim() ?? "";
  if (!b) return name;
  const words = b.split(/\s+/);
  const ar = words.filter((w) => ARABIC.test(w)).join(" ");
  const en = words.filter((w) => !ARABIC.test(w)).join(" ");
  const keys = new Set([phoneticKey(b), ar && phoneticKey(ar), en && phoneticKey(en)].filter((k): k is string => !!k && k.length >= 2));
  const m = name.trim().match(/^(.{2,32}?)\s+[-–—]\s+(.{4,})$/);
  if (!m) {
    const parts = name.trim().split(/\s+/);
    for (let n = 1; n <= 3 && n <= parts.length - 2; n++) {
      const k = phoneticKey(parts.slice(0, n).join(" "));
      if (k.length >= 3 && keys.has(k)) return parts.slice(n).join(" ");
    }
    return name;
  }
  const pk = phoneticKey(m[1]);
  if (pk.length < 2) return name;
  const same = [...keys].some((k) => k === pk || (pk.length >= 3 && k.startsWith(pk)));
  return same ? m[2].trim() : name;
}

export const cardTitle = (p: { name: string; nameAr?: string | null; brand?: { name: string } | null }) => stripBrandPrefix(p.nameAr || p.name, p.brand?.name);
