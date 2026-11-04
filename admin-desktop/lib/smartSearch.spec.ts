/** تشغيل: npx tsx lib/smartSearch.spec.ts */
import assert from "node:assert/strict";
import { normalizeSearchText, phoneticKey, smartFilter, smartScore } from "./smartSearch";

const BRANDS = [
  "L'Oréal Paris", "Maybelline", "Christian Dior", "Dr. Nora", "Dar Al Musk", "VICHY", "Yves Saint Laurent",
  "Huda Beauty", "Head&Shoulders", "CeraVe", "The Ordinary", "Kérastase", "La Roche-Posay", "Chanel",
  "Clinique", "Clean & Clear", "Nivea", "Envie", "Bourjois", "Garnier", "Catrice", "Essence", "Golden Rose",
  "Bath & Body Works", "MAC", "Lancôme",
];
const top = (q: string) => smartFilter(BRANDS, q, (b) => [b])[0];
let passed = 0;
const check = (name: string, fn: () => void) => {
  fn();
  passed++;
  console.log(`ok - ${name}`);
};

check("normalizes Arabic letters, diacritics and Latin accents", () => {
  assert.equal(normalizeSearchText("إيسَنس"), "ايسنس");
  assert.equal(normalizeSearchText("مُرطّب البشرة"), "مرطب البشره");
  assert.equal(normalizeSearchText("L'Oréal  Paris"), "loreal paris");
  assert.equal(normalizeSearchText("٢٤ ساعة"), "24 ساعه");
});

check("Arabic and Latin share a sound key", () => {
  assert.equal(phoneticKey(normalizeSearchText("ميبيلين")), phoneticKey(normalizeSearchText("Maybelline")));
  assert.equal(phoneticKey(normalizeSearchText("لوريال")), phoneticKey(normalizeSearchText("L'Oréal")));
  assert.equal(phoneticKey(normalizeSearchText("فيشي")), phoneticKey(normalizeSearchText("Vichy")));
});

check("Arabic spelling finds the Latin brand first", () => {
  const cases: Record<string, string> = {
    لوريال: "L'Oréal Paris",
    ميبيلين: "Maybelline",
    ديور: "Christian Dior",
    فيشي: "VICHY",
    سيرافي: "CeraVe",
    "ذا اوردينري": "The Ordinary",
    كيراستاس: "Kérastase",
    لاروش: "La Roche-Posay",
    شانيل: "Chanel",
    كلينيك: "Clinique",
    نيفيا: "Nivea",
    بورجوا: "Bourjois",
    غارنييه: "Garnier",
    كاتريس: "Catrice",
    "جولدن روز": "Golden Rose",
    لانكوم: "Lancôme",
  };
  for (const [q, want] of Object.entries(cases)) assert.equal(top(q), want, q);
});

check("partial words, any word order and typos", () => {
  assert.equal(top("ordin"), "The Ordinary");
  assert.equal(top("rose golden"), "Golden Rose");
  assert.equal(top("maybeline"), "Maybelline");
  assert.equal(top("kerastas"), "Kérastase");
  assert.equal(top("garnir"), "Garnier");
  assert.equal(top("loreal"), "L'Oréal Paris");
});

check("word boundaries stop false hits", () => {
  // "ديور" يجب ألا تطابق "Body Works" عبر حدود الكلمات
  assert.ok(smartScore("ديور", ["Christian Dior"]) > smartScore("ديور", ["Bath & Body Works"]));
});

check("empty query keeps every item in order; nonsense matches nothing", () => {
  assert.deepEqual(smartFilter(BRANDS, "  ", (b) => [b]), BRANDS);
  assert.deepEqual(smartFilter(BRANDS, "zzqqxx", (b) => [b]), []);
});

console.log(`\n${passed} passed`);
