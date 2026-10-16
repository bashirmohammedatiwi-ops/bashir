import { CatalogIndex } from "../engine/catalog";
import { searchCatalog } from "../engine/search";
import { normalize } from "../engine/text";

/** بحث المتجر (شريط البحث): استعلامات كما تكتبها الزبونات، ودقة أول 5 نتائج حسب الاسم/القسم. */
export const SEARCH_CASES: { q: string; rel: string }[] = [
  { q: "شامبو للشعر الهايش", rel: "شامبو|shampoo" },
  { q: "كريم يفتح البشره", rel: "تفتيح|مفتح|brighten|white|اشراق|تصبغ|بقع|glow" },
  { q: "شي يطول الرموش", rel: "ماسكارا|مسكارا|mascara|رموش|lash" },
  { q: "سيروم للنضاره", rel: "سيروم|serum" },
  { q: "عطر ريحه بحريه", rel: "عطر|parfum|perfume|toilette|cologne" },
  { q: "واقي شمش", rel: "واقي|sun|spf|شمس" },
  { q: "ماسكره", rel: "ماسكارا|مسكارا|mascara" },
  { q: "كونسيلار", rel: "كونسيلر|concealer|خافي|correct" },
  { q: "هايلايتير", rel: "هايلايت|highlight|illumin" },
  { q: "مزيل عرق للابط", rel: "مزيل|deodorant|roll|رول|ديودرنت|antiperspirant" },
  { q: "روج نود", rel: "روج|lip|شفاه|احمر" },
  { q: "بلسم للشعر المنفوش", rel: "بلسم|condition" },
  { q: "كريم للكعب المتشقق", rel: "قدم|كعب|foot|feet|heel|تشقق|crack|يوريا|urea" },
  { q: "زيت يطول الشعر", rel: "زيت|oil" },
  { q: "عطر رجالي خشبي", rel: "عطر|parfum|perfume|toilette|cologne" },
  { q: "غسول للحبوب", rel: "غسول|cleans|wash|منظف|جل|foam|فوم" },
  { q: "سيرووم فيتامين سي", rel: "سيروم|serum|فيتامين|vitamin" },
  { q: "كريم للهالات", rel: "عين|عيون|eye|هالات" },
  { q: "مرطب للبشره الجافه", rel: "مرطب|moistur|كريم|cream|hydra" },
  { q: "شامبوا للقشره", rel: "شامبو|shampoo" },
  { q: "بودره مضغوطه", rel: "بودر|powder" },
  { q: "مناكير احمر", rel: "مناكير|nail|اظافر|طلاء" },
  { q: "ماسك للشعر التالف", rel: "ماسك|mask|masque|حمام" },
  { q: "سكراب للجسم", rel: "مقشر|scrub|سكراب|تقشير" },
  { q: "كريم ليلي للتجاعيد", rel: "كريم|cream|ليل|night|تجاعيد|wrinkle|age" },
  { q: "بخاخ مثبت للمكياج", rel: "مثبت|setting|fix|spray|بخاخ" },
  { q: "تونر للمسامات", rel: "تونر|toner|tonique|لوشن" },
  { q: "عطر نسائي فانيلا", rel: "عطر|parfum|perfume|toilette|cologne" },
  { q: "كحل اسود", rel: "كحل|kohl|liner|لاينر" },
  { q: "مرطب شفايف", rel: "شفاه|شفايف|lip|بلسم|balm" },
];

export function evaluateSearch(catalog: CatalogIndex) {
  let sum = 0;
  const rows: { q: string; p5: number; top: string[] }[] = [];
  for (const c of SEARCH_CASES) {
    const top = searchCatalog(catalog, c.q).hits.slice(0, 5).map((h) => h.p);
    const re = new RegExp(c.rel, "i");
    const p5 = top.filter((p) => re.test(normalize(`${p.name} ${p.nameEn} ${p.categoryPath.join(" ")}`))).length / 5;
    sum += p5;
    rows.push({ q: c.q, p5, top: top.map((p) => p.name.slice(0, 30)) });
  }
  return { p5: sum / SEARCH_CASES.length, rows };
}
