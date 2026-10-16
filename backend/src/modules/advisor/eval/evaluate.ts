import { CatalogIndex } from "../engine/catalog";
import { respond } from "../engine/dialog";
import { normalize } from "../engine/text";
import { AdvisorReply } from "../engine/types";
import { CaseType, EVAL_CASES, EvalCase } from "./questions";

export interface CaseResult {
  q: string;
  split: string;
  tag: string;
  ok: boolean;
  typeOk: boolean;
  fields: Record<string, boolean>;
  p5: number | null;
  ms: number;
  got: string;
}

export interface EvalReport {
  n: number;
  /** نسبة الأسئلة التي فُهمت كلها صح (النوع + كل الحقول). */
  accuracy: number;
  byField: Record<string, { ok: number; n: number }>;
  bySplit: Record<string, { ok: number; n: number; p5: number; p5n: number }>;
  byTag: Record<string, { ok: number; n: number }>;
  /** دقة أول 5 ترشيحات (حسب اسم المنتج وقسمه). */
  p5: number;
  latency: { mean: number; p50: number; p95: number; max: number };
  cases: CaseResult[];
}

type GotType = CaseType | "ask" | "none";

function replyType(r: AdvisorReply): GotType {
  if (r.knowledge) return "knowledge";
  if (r.routine) return "routine";
  if ((r.anchor || r.state.simRef) && r.products.length) return "similar";
  if (r.products.length || r.groups.some((g) => g.products.length)) return "products";
  // سؤال توضيحي قبل الترشيح («نسائي لو رجالي؟») — رد صحيح لطلب منتج.
  if (r.chips.length >= 2 && r.state.asked.length) return "ask";
  if (/(ما عندي تطابق|ما لكيت|ما حصلت)/.test(r.messages.join(" "))) return "none";
  return "chat";
}

const anyOf = (want: string[], got: string[] | undefined) => want.some((w) => (got ?? []).includes(w));

/** يقيس «ديما» على مجموعة التقييم بنفس مسار المحادثة (النموذج المدرَّب يُقرأ من `catalog.model` إن وُجد). */
export function evaluate(catalog: CatalogIndex, opts: { cases?: EvalCase[]; warm?: boolean } = {}): EvalReport {
  const cases = opts.cases ?? EVAL_CASES;
  const run = (c: EvalCase) => respond({ message: c.q }, null, { catalog });
  /** بعد سؤال توضيحي نجيب «ما يهم» حتى نصل للترشيحات (لقياس دقتها). */
  const settle = (r: AdvisorReply) => {
    for (let k = 0; k < 3 && replyType(r) === "ask"; k++) {
      r = respond({ action: `skip:${r.state.asked[r.state.asked.length - 1]}` }, r.state, { catalog });
    }
    return r;
  };
  // تسخين (JIT) حتى لا تظلم أول الأسئلة في قياس الزمن.
  if (opts.warm !== false) for (const c of cases.slice(0, 20)) run(c);

  const results: CaseResult[] = [];
  for (const c of cases) {
    const t = process.hrtime.bigint();
    const r = run(c);
    const ms = Number(process.hrtime.bigint() - t) / 1e6;
    const n = r.state.need;
    const fields: Record<string, boolean> = {};
    const type = replyType(r);
    // طلب منتج: ترشيحات، أو سؤال توضيحي، أو بطاقة معرفة معها منتجات — كلها ردود صحيحة.
    const withProducts = r.products.length > 0;
    const typeOk = !c.type || c.type === type || (c.type === "products" && (type === "similar" || type === "ask" || (type === "knowledge" && withProducts)));
    const final = settle(r);
    if (c.area) fields.area = n.area === c.area;
    if (c.kinds) fields.kinds = anyOf(c.kinds, n.kinds);
    if (c.concerns) fields.concerns = anyOf(c.concerns, n.concerns);
    if (c.skinType) fields.skinType = n.skinType === c.skinType;
    if (c.gender) fields.gender = n.gender === c.gender;
    if (c.families) fields.families = anyOf(c.families, n.families);
    if (c.maxPrice) fields.maxPrice = n.maxPrice === c.maxPrice;
    if (c.minPrice) fields.minPrice = n.minPrice === c.minPrice;
    let p5: number | null = null;
    if (c.rel) {
      const re = new RegExp(c.rel, "i");
      const top = [...final.products, ...final.groups.flatMap((g) => g.products), ...(final.routine?.steps.map((s) => s.product) ?? [])].slice(0, 5);
      const hits = top.filter((card) => {
        const p = catalog.byId(card.id);
        return p && re.test(normalize(`${p.name} ${p.nameEn} ${p.categoryPath.join(" ")}`));
      }).length;
      p5 = top.length ? hits / 5 : 0;
    }
    const ok = typeOk && Object.values(fields).every(Boolean);
    const got = [
      type,
      n.area,
      n.kinds?.join("+"),
      n.concerns?.join("+"),
      n.skinType && `st:${n.skinType}`,
      n.gender && `g:${n.gender}`,
      n.families?.join("+"),
      n.maxPrice && `≤${n.maxPrice}`,
      n.free?.length ? `free:${n.free.join(",")}` : "",
    ]
      .filter(Boolean)
      .join(" | ");
    results.push({ q: c.q, split: c.split, tag: c.tag, ok, typeOk, fields, p5, ms, got });
  }

  const byField: EvalReport["byField"] = {};
  const bySplit: EvalReport["bySplit"] = {};
  const byTag: EvalReport["byTag"] = {};
  for (const r of results) {
    for (const [k, v] of Object.entries({ type: r.typeOk, ...r.fields })) {
      const e = (byField[k] ??= { ok: 0, n: 0 });
      e.n++;
      if (v) e.ok++;
    }
    const s = (bySplit[r.split] ??= { ok: 0, n: 0, p5: 0, p5n: 0 });
    s.n++;
    if (r.ok) s.ok++;
    if (r.p5 != null) {
      s.p5 += r.p5;
      s.p5n++;
    }
    const t = (byTag[r.tag] ??= { ok: 0, n: 0 });
    t.n++;
    if (r.ok) t.ok++;
  }
  const ms = results.map((r) => r.ms).sort((a, b) => a - b);
  const withP5 = results.filter((r) => r.p5 != null);
  return {
    n: results.length,
    accuracy: results.filter((r) => r.ok).length / Math.max(1, results.length),
    byField,
    bySplit,
    byTag,
    p5: withP5.reduce((a, r) => a + (r.p5 ?? 0), 0) / Math.max(1, withP5.length),
    latency: {
      mean: ms.reduce((a, b) => a + b, 0) / Math.max(1, ms.length),
      p50: ms[Math.floor(ms.length * 0.5)] ?? 0,
      p95: ms[Math.floor(ms.length * 0.95)] ?? 0,
      max: ms[ms.length - 1] ?? 0,
    },
    cases: results,
  };
}

const pct = (a: number, b: number) => (b ? `${((100 * a) / b).toFixed(1)}%` : "-");

/** ملخص نصي للتقرير (للطرفية وسجلات الخادم). */
export function formatReport(r: EvalReport, opts: { failures?: boolean } = {}): string {
  const lines: string[] = [];
  lines.push(`cases=${r.n}  accuracy=${(100 * r.accuracy).toFixed(1)}%  P@5=${(100 * r.p5).toFixed(1)}%`);
  for (const [k, s] of Object.entries(r.bySplit)) lines.push(`  ${k.padEnd(5)} acc=${pct(s.ok, s.n)} (${s.ok}/${s.n})  P@5=${pct(s.p5, s.p5n)}`);
  lines.push(`  latency ms: mean=${r.latency.mean.toFixed(2)} p50=${r.latency.p50.toFixed(2)} p95=${r.latency.p95.toFixed(2)} max=${r.latency.max.toFixed(2)}`);
  lines.push(`  fields: ${Object.entries(r.byField).map(([k, v]) => `${k}=${pct(v.ok, v.n)}`).join("  ")}`);
  lines.push(`  tags:   ${Object.entries(r.byTag).map(([k, v]) => `${k}=${pct(v.ok, v.n)}`).join("  ")}`);
  if (opts.failures) {
    for (const c of r.cases.filter((x) => !x.ok || (x.p5 != null && x.p5 < 0.6))) {
      const bad = [!c.typeOk ? "type" : "", ...Object.entries(c.fields).filter(([, v]) => !v).map(([k]) => k)].filter(Boolean).join(",");
      lines.push(`  ✗ [${c.split}/${c.tag}] ${c.q}  → ${c.got}${bad ? `  (wrong: ${bad})` : ""}${c.p5 != null ? `  P@5=${c.p5}` : ""}`);
    }
  }
  return lines.join("\n");
}
