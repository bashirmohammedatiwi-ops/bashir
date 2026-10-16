import { CatalogIndex, IndexedProduct } from "./catalog";
import { FacetKey, facetValue } from "./lexicon";
import { li } from "./text";
import { CompareOut, Need, ProductCardOut, Profile } from "./types";

/**
 * رؤى عن منتج بعينه: مقارنة منتجين، «هل يناسبني؟»، وما يكمّله.
 * كلها من بيانات الكتالوج المفهرسة — بلا تخمين خارجي.
 */

// ───────────────────────────────────────────── الحجم وسعر الوحدة

export function sizeOf(name: string): { value: number; unit: "مل" | "غ" } | null {
  const m = name.match(/(\d+(?:[.,]\d+)?)\s*(مل|ملل|ml|غرام|غم|جم|غ|g|gm|gr|لتر|ltr|l)(?![\p{L}])/iu);
  if (!m) return null;
  let v = parseFloat(m[1].replace(",", "."));
  const u = m[2].toLowerCase();
  if (!v || v > 5000) return null;
  if (u === "لتر" || u === "l" || u === "ltr") v *= 1000;
  return { value: v, unit: /^(مل|ملل|ml|لتر|l|ltr)$/i.test(u) ? "مل" : "غ" };
}

const fmt = (n: number) => Math.round(n).toLocaleString("en-US");

const labels = (p: IndexedProduct, f: FacetKey, max = 3) =>
  [...(p.strong.get(f) ?? [])]
    .map((id) => facetValue(f, id)?.label)
    .filter(Boolean)
    .slice(0, max) as string[];

// ───────────────────────────────────────────── المقارنة

export function compareProducts(
  ps: IndexedProduct[],
  cards: ProductCardOut[],
  need: Need,
  matchOf: (p: IndexedProduct) => number,
): CompareOut {
  const rows: CompareOut["rows"] = [];
  const minIdx = (xs: (number | null)[]) => {
    let best = -1;
    xs.forEach((x, i) => {
      if (x != null && (best < 0 || x < (xs[best] as number))) best = i;
    });
    return best >= 0 && xs.filter((x) => x != null).length > 1 ? best : undefined;
  };
  const maxIdx = (xs: number[]) => {
    const m = Math.max(...xs);
    return xs.filter((x) => x === m).length === 1 ? xs.indexOf(m) : undefined;
  };

  rows.push({ label: "السعر", values: ps.map((p) => `${fmt(p.price)} د.ع`), best: minIdx(ps.map((p) => p.price)) });

  const sizes = ps.map((p) => sizeOf(p.name));
  if (sizes.some(Boolean)) {
    rows.push({ label: "الحجم", values: sizes.map((s) => (s ? `${fmt(s.value)} ${s.unit}` : "—")) });
    const sameUnit = sizes.every((s) => s && s.unit === sizes[0]!.unit);
    if (sameUnit) {
      const per = sizes.map((s, i) => (s ? (ps[i].price / s.value) * 10 : null));
      rows.push({
        label: `سعر 10 ${sizes[0]!.unit}`,
        values: per.map((x) => (x == null ? "—" : `${fmt(x)} د.ع`)),
        best: minIdx(per),
      });
    }
  }

  if (ps.some((p) => p.reviewCount > 0)) {
    rows.push({
      label: "التقييم",
      values: ps.map((p) => (p.reviewCount ? `★ ${p.rating.toFixed(1)} (${p.reviewCount})` : "جديد")),
      best: maxIdx(ps.map((p) => (p.reviewCount ? p.rating : 0))),
    });
  }

  const isFrag = ps.every((p) => p.area === "fragrance");
  if (isFrag) {
    rows.push({ label: "الطابع", values: ps.map((p) => labels(p, "family").join("، ") || "—") });
    rows.push({ label: "التركيز", values: ps.map((p) => labels(p, "strength", 1)[0] ?? "—") });
    rows.push({ label: "لمن", values: ps.map((p) => labels(p, "gender", 1)[0] ?? "—") });
  } else {
    const suits = ps.map((p) => [...labels(p, "skinType", 2), ...labels(p, "concern", 2)].join("، "));
    if (suits.some(Boolean)) rows.push({ label: "يناسب", values: suits.map((x) => x || "عام") });
    const ings = ps.map((p) => labels(p, "ingredient", 3).join("، "));
    if (ings.some(Boolean)) rows.push({ label: "مكونات بارزة", values: ings.map((x) => x || "—") });
    const fin = ps.map((p) => [...labels(p, "finish", 1), ...labels(p, "coverage", 1)].join(" • "));
    if (fin.some(Boolean)) rows.push({ label: "اللمسة", values: fin.map((x) => x || "—") });
  }

  const specific =
    need.kinds.length + need.concerns.length + need.families.length + need.ingredients.length + (need.skinType ? 1 : 0) > 0;
  let matches: number[] = [];
  if (specific) {
    matches = ps.map(matchOf);
    rows.push({ label: "يطابق طلبكِ", values: matches.map((m) => `${m}%`), best: maxIdx(matches) });
  }

  // الأنسب: الملاءمة أولاً، ثم سعر الوحدة، ثم السعر.
  const perUnit = rows.find((r) => r.label.startsWith("سعر 10"));
  let winner = 0;
  let why = "";
  if (specific && maxIdx(matches) != null && Math.max(...matches) - Math.min(...matches) >= 5) {
    winner = maxIdx(matches)!;
    why = "أقرب لطلبكِ";
  } else if (perUnit?.best != null) {
    winner = perUnit.best;
    why = "أوفر لكل مل";
  } else {
    winner = minIdx(ps.map((p) => p.price)) ?? 0;
    why = "سعره أقل";
  }
  const extra = ps[winner].isBestSeller ? " ومن الأكثر مبيعاً" : ps[winner].reviewCount >= 3 && ps[winner].rating >= 4.3 ? " وتقييمه عالٍ" : "";
  const base = cards[winner].name.split(/\s[-–—]\s/).sort((a, b) => b.length - a.length)[0] ?? cards[winner].name;
  const short = base.length > 42 ? `${base.slice(0, base.lastIndexOf(" ", 40) > 20 ? base.lastIndexOf(" ", 40) : 40)}…` : base;
  const verdict = `أنصحكِ بـ«${short}» — ${why}${extra}.`;
  return { products: cards, rows, winner, verdict };
}

// ───────────────────────────────────────────── هل يناسبني؟

export function fitCheck(
  p: IndexedProduct,
  need: Need,
  profile: Profile | undefined,
  cautionsFor: (ingredientId: string) => string | undefined,
): { tone: "good" | "ok" | "care"; headline: string; points: { ok: boolean | null; text: string }[] } {
  const points: { ok: boolean | null; text: string }[] = [];
  const skin = need.skinType ?? profile?.skinType;
  const concerns = [...new Set([...(need.concerns ?? []), ...(profile?.concerns ?? []), ...(profile?.hairConcerns ?? [])])];
  let warn = 0;
  let good = 0;

  if (p.area === "skin" || p.area === "makeup") {
    const pSkins = [...(p.strong.get("skinType") ?? [])];
    if (skin) {
      const lbl = facetValue("skinType", skin)?.label ?? "";
      if (pSkins.includes(skin)) {
        points.push({ ok: true, text: `مخصص للبشرة ال${lbl.replace(/^ال/, "")}` });
        good++;
      } else if (pSkins.length) {
        const other = pSkins.map((s) => facetValue("skinType", s)?.label).filter(Boolean).join(" و");
        points.push({ ok: false, text: `مصمم أكثر للبشرة ال${other.replace(/^ال/, "")} — قد لا يكون الأمثل لبشرتكِ ال${lbl.replace(/^ال/, "")}` });
        warn++;
      } else {
        points.push({ ok: null, text: "تركيبة عامة تناسب أغلب أنواع البشرة" });
      }
    } else if (pSkins.length) {
      points.push({ ok: null, text: `مناسب للبشرة ${pSkins.map((s) => facetValue("skinType", s)?.label).join(" و")}` });
    }
  }

  const pConcerns = [...(p.strong.get("concern") ?? [])];
  const hit = concerns.filter((c) => pConcerns.includes(c));
  if (hit.length) {
    points.push({ ok: true, text: `يستهدف ${hit.map((c) => facetValue("concern", c)?.label).join(" و")}` });
    good++;
  } else if (pConcerns.length) {
    points.push({ ok: null, text: `يستهدف ${pConcerns.slice(0, 2).map((c) => facetValue("concern", c)?.label).join(" و")}` });
  }

  for (const f of need.freeFrom) {
    const lbl = facetValue("freeFrom", f)?.label ?? "";
    if (p.strong.get("freeFrom")?.has(f)) {
      points.push({ ok: true, text: lbl });
      good++;
    } else {
      points.push({ ok: null, text: `غير مذكور أنه ${lbl}` });
    }
  }

  if (p.area === "fragrance") {
    const g = p.strong.get("gender");
    const want = need.gender ?? profile?.gender;
    const pg = g?.has("unisex") ? "unisex" : g?.has("women") ? "women" : g?.has("men") ? "men" : p.genderHint;
    if (want && pg) {
      if (pg === want || pg === "unisex") {
        points.push({ ok: true, text: pg === "unisex" ? "عطر للجنسين" : `عطر ${facetValue("gender", pg)?.label}` });
        good++;
      } else {
        points.push({ ok: false, text: `مصنّف ${facetValue("gender", pg)?.label}` });
        warn++;
      }
    }
    const fams = [...(p.strong.get("family") ?? []), ...(p.weak.get("family") ?? [])];
    const liked = (profile?.families ?? need.families).filter((f) => fams.includes(f));
    if (liked.length) {
      points.push({ ok: true, text: `فيه ${liked.map((f) => facetValue("family", f)?.label).join(" و")} اللي تحبينه` });
      good++;
    } else if (fams.length) {
      points.push({ ok: null, text: `طابعه ${[...new Set(fams)].slice(0, 3).map((f) => facetValue("family", f)?.label).join("، ")}` });
    }
  }

  // تنبيهات المكونات الفعالة (حساسية الشمس، التدرج…).
  const ings = [...(p.strong.get("ingredient") ?? [])];
  for (const i of ings) {
    const c = cautionsFor(i);
    if (c) {
      points.push({ ok: false, text: c });
      warn += skin === "sensitive" ? 1 : 0;
      break;
    }
  }
  if (skin === "sensitive" && ings.some((i) => ["retinol", "aha", "salicylic", "glycolic", "benzoyl_peroxide"].includes(i))) {
    points.push({ ok: false, text: "بشرتكِ حساسة: جربيه على مساحة صغيرة أولاً وابدئي تدريجياً" });
    warn++;
  }

  const tone: "good" | "ok" | "care" = warn > 0 ? "care" : good > 0 ? "good" : "ok";
  const headline =
    tone === "good" ? "يناسبكِ ✨" : tone === "care" ? "يناسبكِ مع انتباه لبعض النقاط" : "مناسب بشكل عام";
  if (!points.length) points.push({ ok: null, text: "ما عندي معلومات كافية عن بشرتكِ — احكيلي نوعها وأقيّمه بدقة" });
  return { tone, headline, points: points.slice(0, 5) };
}

// ───────────────────────────────────────────── ما يكمّله

export const COMPLEMENTS: Record<string, string[]> = {
  shampoo: ["conditioner", "hair_mask", "hair_serum"],
  conditioner: ["shampoo", "hair_mask", "leave_in"],
  hair_mask: ["shampoo", "conditioner", "hair_oil"],
  hair_oil: ["shampoo", "hair_mask"],
  hair_serum: ["shampoo", "conditioner"],
  leave_in: ["shampoo", "conditioner"],
  hair_color: ["shampoo", "conditioner", "hair_mask"],
  cleanser: ["toner", "serum", "moisturizer", "sunscreen"],
  toner: ["serum", "moisturizer", "cleanser"],
  serum: ["moisturizer", "sunscreen", "cleanser"],
  moisturizer: ["cleanser", "serum", "sunscreen"],
  face_cream: ["cleanser", "serum", "sunscreen"],
  sunscreen: ["cleanser", "moisturizer", "makeup_remover"],
  eye_cream: ["serum", "moisturizer"],
  face_mask: ["cleanser", "serum", "moisturizer"],
  exfoliator: ["moisturizer", "sunscreen"],
  foundation: ["primer", "concealer", "powder", "setting_spray"],
  concealer: ["foundation", "powder"],
  powder: ["foundation", "setting_spray"],
  primer: ["foundation", "setting_spray"],
  mascara: ["eyeliner", "eyeshadow", "makeup_remover"],
  eyeliner: ["mascara", "eyeshadow"],
  eyeshadow: ["eyeliner", "mascara", "primer"],
  lipstick: ["lip_liner", "lip_care", "lip_gloss"],
  lip_gloss: ["lip_liner", "lipstick"],
  lip_liner: ["lipstick", "lip_gloss"],
  blush: ["highlighter", "bronzer"],
  perfume: ["mist", "body_lotion", "deodorant"],
  oil_perfume: ["perfume", "mist"],
  mist: ["body_lotion", "perfume"],
  body_wash: ["body_lotion", "body_scrub"],
  body_lotion: ["body_wash", "body_scrub", "mist"],
  body_scrub: ["body_lotion", "body_wash"],
  nail_polish: ["nail_care"],
  nail_care: ["nail_polish", "hand_cream"],
};

export const COMPLEMENT_WHY: Record<string, string> = {
  conditioner: "بعد الشامبو يغلق القشرة ويمنع التشابك",
  hair_mask: "مرة أسبوعياً لتغذية أعمق",
  hair_serum: "يحمي الأطراف ويعطي لمعة",
  leave_in: "ترطيب يدوم طول اليوم",
  hair_oil: "تغذية للأطراف الجافة",
  shampoo: "تنظيف لطيف يمهد للخطوة التالية",
  toner: "يوازن البشرة ويجهزها للسيروم",
  serum: "علاج مركّز لمشكلتكِ",
  moisturizer: "يقفل الترطيب ويحمي الحاجز",
  sunscreen: "ضروري صباحاً — يحمي نتائج روتينكِ",
  cleanser: "بداية أي روتين ناجح",
  makeup_remover: "إزالة الواقي والمكياج كاملاً بالليل",
  primer: "يثبت الأساس ويخفي المسام",
  concealer: "للهالات والعيوب الصغيرة",
  powder: "يثبت ويقلل اللمعان",
  setting_spray: "يثبت المكياج بحر العراق",
  eyeliner: "يكمل نظرة العين",
  eyeshadow: "لون وعمق للعين",
  lip_liner: "حدود ثابتة تمنع انتشار اللون",
  lip_care: "ترطيب قبل الروج",
  lip_gloss: "لمعة فوق اللون",
  lipstick: "لون كامل",
  highlighter: "إشراقة لعظام الوجه",
  bronzer: "دفء ونحت خفيف",
  mist: "طبقة خفيفة تجدد الريحة",
  body_lotion: "لوشن قبل العطر يطيل ثباته",
  deodorant: "انتعاش يدوم",
  body_scrub: "تقشير أسبوعي لنعومة أكثر",
  body_wash: "تنظيف منعش",
  nail_care: "تقوية وحماية للأظافر",
  nail_polish: "لون يكمل الإطلالة",
  hand_cream: "ترطيب لليدين والجلد حول الأظافر",
  perfume: "عطر من نفس الطابع",
};

// ───────────────────────────────────────────── «ليش رشحته؟»

export function whyList(catalog: CatalogIndex, p: IndexedProduct, need: Need): { ok: boolean; text: string }[] {
  const out: { ok: boolean; text: string }[] = [];
  const add = (f: FacetKey, id: string | undefined, text?: (l: string) => string) => {
    if (!id) return;
    const fv = facetValue(f, id);
    if (!fv) return;
    const t = text ? text(fv.label) : fv.label;
    out.push({ ok: Boolean(catalog.has(p, f, id)), text: t });
  };
  for (const k of need.kinds) add("kind", k);
  add("skinType", need.skinType, (l) => `للبشرة ال${l.replace(/^ال/, "")}`);
  for (const c of need.concerns) add("concern", c, li);
  for (const i of need.ingredients) add("ingredient", i, (l) => `فيه ${l}`);
  for (const f of need.families) add("family", f);
  for (const f of need.freeFrom) add("freeFrom", f);
  for (const a of need.attrs) add("attr", a);
  add("finish", need.finish);
  add("coverage", need.coverage);
  add("time", need.time);
  if (need.gender) {
    const g = p.strong.get("gender");
    const ok = Boolean(g?.has(need.gender) || g?.has("unisex") || (!g && p.genderHint === need.gender));
    out.push({ ok, text: g?.has("unisex") ? "للجنسين" : facetValue("gender", need.gender)?.label ?? "" });
  }
  if (need.maxPrice) out.push({ ok: p.price <= need.maxPrice, text: `ضمن ${fmt(need.maxPrice)} د.ع` });
  if (p.isBestSeller) out.push({ ok: true, text: "من الأكثر مبيعاً" });
  if (p.reviewCount >= 2 && p.rating >= 4.3) out.push({ ok: true, text: `تقييم ${p.rating.toFixed(1)} من ${p.reviewCount} زبونة` });
  if (p.discountPercent >= 10) out.push({ ok: true, text: `عليه خصم ${p.discountPercent}%` });
  return out.slice(0, 8);
}
