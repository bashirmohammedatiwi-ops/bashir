import { CatalogIndex, IndexedProduct } from "./catalog";
import { sizeOf } from "./insight";
import { facetValue } from "./lexicon";
import { rank, routineTemplate, toCard } from "./ranker";
import { emptyNeed, Need, PersonalOut, ProductCardOut, Purchase } from "./types";

/**
 * «ديما» تعرف زبونتها من طلباتها (للمسجلات فقط): متى يقارب منتجها يخلص،
 * أي خطوة ناقصة بروتينها، وما اشترته مؤخراً فلا تعيد ترشيحه.
 */

const DAY = 86_400_000;

/** مدة الاستهلاك التقريبية بالأيام لحجم معتاد، والحجم المعتاد نفسه. */
const LIFE: Record<string, { days: number; size?: number }> = {
  shampoo: { days: 45, size: 400 },
  conditioner: { days: 50, size: 400 },
  hair_mask: { days: 60, size: 300 },
  hair_oil: { days: 75, size: 100 },
  hair_serum: { days: 60, size: 100 },
  leave_in: { days: 60, size: 200 },
  cleanser: { days: 60, size: 200 },
  toner: { days: 75, size: 200 },
  serum: { days: 60, size: 30 },
  moisturizer: { days: 60, size: 50 },
  face_cream: { days: 60, size: 50 },
  sunscreen: { days: 45, size: 50 },
  eye_cream: { days: 90, size: 15 },
  makeup_remover: { days: 60, size: 400 },
  micellar: { days: 60, size: 400 },
  body_wash: { days: 40, size: 500 },
  body_lotion: { days: 45, size: 400 },
  body_oil: { days: 60, size: 100 },
  deodorant: { days: 40 },
  perfume: { days: 150, size: 100 },
  mist: { days: 60, size: 250 },
  mascara: { days: 100 },
  foundation: { days: 120, size: 30 },
  concealer: { days: 150 },
  powder: { days: 150 },
  setting_spray: { days: 90, size: 100 },
  lip_care: { days: 60 },
};

/** النوع الأساسي للمنتج: المذكور باسمه أولاً. */
export function mainKind(p: IndexedProduct): string | null {
  for (const k of p.nameKeys) if (k.startsWith("kind:")) return k.slice(5);
  const s = p.strong.get("kind");
  return s?.size ? [...s][0] : null;
}

/** كم يوماً يكفي هذا المنتج تقريباً (حسب نوعه وحجمه). */
export function lifetimeDays(p: IndexedProduct): number | null {
  const k = mainKind(p);
  const life = k ? LIFE[k] : undefined;
  if (!life) return null;
  const sz = sizeOf(p.name)?.value;
  const scale = life.size && sz ? Math.max(0.5, Math.min(2, sz / life.size)) : 1;
  return Math.round(life.days * scale);
}

const ago = (days: number) =>
  days < 14 ? "قبل أيام" : days < 45 ? `قبل ${Math.round(days / 7)} أسابيع` : days < 75 ? "قبل شهر ونص تقريباً" : `قبل ${Math.round(days / 30)} أشهر`;

/** ما اشترته خلال آخر `days` يوماً — لا نعيد ترشيحه بلا طلب. */
export function recentlyOwned(history: Purchase[] | null | undefined, days = 45, now = Date.now()): Set<string> {
  return new Set((history ?? []).filter((h) => now - h.at < days * DAY).map((h) => h.productId));
}

/** منتجات يقارب وقت تجديدها (0.75–2.5 من مدة استهلاكها)، الأقرب لنهايته أولاً. */
export function refillsDue(catalog: CatalogIndex, history: Purchase[] | null | undefined, now = Date.now()) {
  const out: { p: IndexedProduct; days: number; ratio: number }[] = [];
  for (const h of history ?? []) {
    const p = catalog.byId(h.productId);
    if (!p || p.stock <= 0) continue;
    const life = lifetimeDays(p);
    if (!life) continue;
    const days = (now - h.at) / DAY;
    const ratio = days / life;
    if (ratio >= 0.75 && ratio <= 2.5) out.push({ p, days, ratio });
  }
  return out.sort((a, b) => Math.abs(a.ratio - 1) - Math.abs(b.ratio - 1)).slice(0, 3);
}

/** ما عندها من كل نوع (من مشترياتها خلال مدة استهلاكه ونصف). */
export function ownedByKind(catalog: CatalogIndex, history: Purchase[] | null | undefined, now = Date.now()) {
  const map = new Map<string, IndexedProduct>();
  for (const h of [...(history ?? [])].sort((a, b) => b.at - a.at)) {
    const p = catalog.byId(h.productId);
    if (!p) continue;
    const k = mainKind(p);
    if (!k || map.has(k)) continue;
    const life = lifetimeDays(p) ?? 120;
    if (now - h.at > life * 1.5 * DAY) continue;
    map.set(k, p);
  }
  return map;
}

/** بصمتها العطرية: العائلات الأكثر تكراراً في عطور اشترتها. */
export function scentFamilies(catalog: CatalogIndex, history: Purchase[] | null | undefined): string[] {
  const count = new Map<string, number>();
  for (const h of history ?? []) {
    const p = catalog.byId(h.productId);
    if (!p || p.area !== "fragrance") continue;
    for (const f of p.strong.get("family") ?? []) count.set(f, (count.get(f) ?? 0) + h.times);
  }
  return [...count.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([f]) => f);
}

/** أكملي روتينكِ: خطوة أساسية ناقصة بمجال اشترت منه، يُفضَّل من براند منتجها. */
export function nextStep(catalog: CatalogIndex, history: Purchase[] | null | undefined, now = Date.now()): PersonalOut | null {
  const owned = ownedByKind(catalog, history, now);
  if (!owned.size) return null;
  for (const area of ["skin", "hair"]) {
    const mine = [...owned.values()].filter((p) => p.area === area);
    if (!mine.length) continue;
    const tpl = routineTemplate(area, emptyNeed());
    const missing = tpl.filter((s) => !s.optional && !s.kinds.some((k) => owned.has(k)));
    // ينقص خطوة أو خطوتان فقط: اقتراح مفيد لا روتين كامل من جديد.
    if (!missing.length || missing.length > 2) continue;
    const step = missing[0];
    const skinType = mine.map((p) => [...(p.strong.get("skinType") ?? [])][0]).find(Boolean);
    const need: Need = { ...emptyNeed(), area, kinds: step.kinds, skinType: area === "skin" ? skinType : undefined };
    const brand = mine[0].brandId;
    const res = rank(catalog, need, { limit: 6, preferBrand: brand });
    if (!res.items.length) continue;
    const have = mine
      .slice(0, 2)
      .map((p) => facetValue("kind", mainKind(p) ?? "")?.label)
      .filter(Boolean)
      .join(" و");
    return {
      kind: "next",
      title: `أكملي روتينكِ: ${step.label}`,
      note: have ? `عندكِ ${have} — ينقصكِ ${step.label} حتى يكمل مفعولها.` : `ينقصكِ ${step.label} حتى يكمل روتينكِ.`,
      products: res.items.slice(0, 4).map(toCard),
    };
  }
  return null;
}

/** اقتراحات الترحيب الشخصية. */
export function personalFor(catalog: CatalogIndex, history: Purchase[] | null | undefined, now = Date.now()): PersonalOut[] {
  if (!history?.length) return [];
  const out: PersonalOut[] = [];
  const due = refillsDue(catalog, history, now);
  if (due.length) {
    const first = due[0];
    const kind = facetValue("kind", mainKind(first.p) ?? "")?.label ?? "منتجكِ";
    out.push({
      kind: "refill",
      title: due.length > 1 ? "منتجاتكِ قاربت تخلص؟" : `قارب يخلص ${kind}؟`,
      note:
        due.length > 1
          ? `اشتريتيها ${ago(first.days)} — غالباً قاربت تخلص، جدديها قبل لا ينقطع روتينكِ.`
          : `اشتريتيه ${ago(first.days)} — غالباً قارب يخلص، جدديه قبل لا ينقطع روتينكِ.`,
      products: due.map((d) => toCard({ p: d.p, score: 0, match: 0, reasons: [ago(d.days)] })),
    });
  }
  const next = nextStep(catalog, history, now);
  if (next) out.push(next);
  return out;
}

/** مشترياتها (الأحدث أولاً) كبطاقات — لـ«شنو اشتريت؟/رجعيلي طلبي». */
export function purchasedCards(catalog: CatalogIndex, history: Purchase[] | null | undefined, now = Date.now()): ProductCardOut[] {
  return [...(history ?? [])]
    .sort((a, b) => b.at - a.at)
    .map((h) => ({ h, p: catalog.byId(h.productId) }))
    .filter((x): x is { h: Purchase; p: IndexedProduct } => Boolean(x.p && x.p.stock > 0))
    .slice(0, 8)
    .map(({ h, p }) => toCard({ p, score: 0, match: 0, reasons: [`اشتريتيه ${ago((now - h.at) / DAY)}`, ...(h.times > 1 ? [`${h.times} مرات`] : [])] }));
}
