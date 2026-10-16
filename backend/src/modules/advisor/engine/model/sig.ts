import type { Need } from "../types";
import { stem } from "../text";
import { words } from "./features";

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

/**
 * كلمات طلب الزبونة (مطبّعة، بلا أرقام ولا كلمات وصل، 6 كلمات كحد أقصى) — تُلحق بالبصمة «|q:…»
 * حتى يتعلم النموذج من التفاعل: كلمات كتبتها ← المنتج الذي فتحته/أضافته.
 */
export function queryWords(message: string | undefined): string[] {
  if (!message) return [];
  return words(message)
    .filter((w) => w.length >= 2 && !/\d/.test(w))
    .slice(0, 6);
}

/** كلمات الطلب المحفوظة في بصمة. */
export function sigWords(sig: string | null | undefined): string[] {
  const m = sig?.match(/\|q:([^|]*)/);
  return m ? m[1].split(",").filter(Boolean) : [];
}

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
  // كلمات الطلب: «w:جذر» (نفس جذور الكلمات الحرة في الطلب).
  for (const w of sigWords(sig)) out.push(`w:${stem(w)}`);
  return out;
}

/** ميزات طلب حالي (لقراءة الترتيب المتعلّم أثناء الترشيح) — مع كلماته الحرة. */
export function needFeatures(n: Need): string[] {
  return [...affinityFeatures(needSig(n)), ...n.free.slice(0, 6).map((w) => `w:${w}`)];
}
