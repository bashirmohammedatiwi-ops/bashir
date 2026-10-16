import type { Need } from "../types";

/**
 * بصمة الطلب (بلا أي بيانات شخصية): المجال|النوع ثم صفات مفتاحية.
 * «skin|serum|c:acne,pigment|s:oily|g:women|f:woody». الصيغة القديمة «skin|serum» تُقرأ كما هي.
 */
export function needSig(n: Partial<Need> | undefined): string {
  if (!n) return "";
  const parts = [n.area ?? "", n.kinds?.[0] ?? ""];
  if (n.concerns?.length) parts.push(`c:${n.concerns.slice(0, 2).join(",")}`);
  if (n.skinType) parts.push(`s:${n.skinType}`);
  if (n.gender) parts.push(`g:${n.gender}`);
  if (n.families?.length) parts.push(`f:${n.families.slice(0, 2).join(",")}`);
  const s = parts.join("|").replace(/\|+$/, "");
  return s.length > 60 ? s.slice(0, 60) : s;
}

const PREFIX: Record<string, string> = { c: "concern", s: "skinType", g: "gender", f: "family" };

/** ميزات الترتيب المتعلّم من بصمة. */
export function affinityFeatures(sig: string | null | undefined): string[] {
  if (!sig) return [];
  const [area, kind, ...rest] = sig.split("|");
  const out: string[] = [];
  if (area) out.push(`area:${area}`);
  if (kind) out.push(`kind:${kind}`);
  for (const r of rest) {
    const m = r.match(/^([csgf]):(.+)$/);
    if (!m) continue;
    for (const v of m[2].split(",")) if (v) out.push(`${PREFIX[m[1]]}:${v}`);
  }
  return out;
}

/** ميزات طلب حالي (لقراءة الترتيب المتعلّم أثناء الترشيح). */
export function needFeatures(n: Need): string[] {
  return affinityFeatures(needSig(n));
}
