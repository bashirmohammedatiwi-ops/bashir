import { normalize } from "./text";

/**
 * سمعة البراندات حسب المجال — مؤشر جودة مسبق حين تقلّ المبيعات والتقييمات.
 * A: مرجع في مجاله (تُوصي به خبيرات البشرة/الشعر أو أيقونة بالسوق)، B: جيد ومنتشر.
 * المطابقة بمفاتيح مضغوطة (لاتيني بلا رموز، أو عربي مطبّع) من اسم البراند.
 */
type Tier = { a: string[]; b: string[] };

const TIERS: Record<string, Tier> = {
  skin: {
    a: [
      "larocheposay", "لاروش", "cerave", "سيرافي", "bioderma", "بيوديرما", "vichy", "فيشي", "avene", "افين", "eucerin", "يوسيرين",
      "uriage", "يورياج", "svr", "isispharma", "ايزيس", "ducray", "aderma", "filorga", "فيلورجا", "caudalie", "كودالي", "nuxe", "نوكس",
      "theordinary", "اوردينري", "اوردناري", "cosrx", "كوسركس", "beautyofjoseon", "جوسون", "skin1004", "centella", "سكين1004", "anua", "انوا",
      "medicube", "ميديكيوب", "somebymi", "سومباي", "paulaschoice", "sesderma", "heliocare", "pharmaceris", "فارماسيرز", "فارماسيريس",
      "dralthea", "التيا", "isntree", "torriden", "roundlab", "clinique", "كلينك", "kiehls", "dermalogica", "lierac", "لييراك", "noreva", "نوريفا",
    ],
    b: [
      "neutrogena", "نيتروجينا", "garnier", "غارنييه", "nivea", "نيفيا", "lorealparis", "cetaphil", "سيتافيل", "simple", "beesline", "بيزلين",
      "estelin", "استيلين", "revuele", "ريفويل", "eveline", "biolique", "بيوليك", "heliad", "هيليا", "feelfree", "فيلفري", "acm", "ميكسا", "mixa",
      "dermolab", "ديرمولاب", "retinolcomplex", "cathydoll", "كاثي", "bioliq", "بايوليك", "avon", "ايفون",
    ],
  },
  hair: {
    a: [
      "kerastase", "كيراستاس", "lorealprofessionnel", "olaplex", "اولابلكس", "moroccanoil", "موروكان", "nashi", "ناشي", "redken", "alpecin", "البسين",
      "dercos", "ducray", "phyto", "فيتو", "k18", "davines", "schwarzkopfprofessional", "wellaprofessionals", "matrix", "christopherobin", "renefurterer",
    ],
    b: [
      "pantene", "بانتين", "headshoulders", "هيداند", "garnier", "fructis", "elvive", "الفيف", "dove", "دوف", "tresemme", "herbalessences", "clear",
      "كلير", "sunsilk", "kativa", "كاتيفا", "kerasys", "puring", "بيورنغ", "evoluderm", "ايفولوديرم", "carecell", "كارسيل",
      "cantu", "كانتو", "mielle", "مييل", "kativa", "fino", "tsubaki",
    ],
  },
  makeup: {
    a: [
      "hudabeauty", "هدى", "charlottetilbury", "mac", "nars", "fenty", "dior", "ديور", "ysl", "yvessaintlaurent", "lancome", "لانكوم", "esteelauder",
      "toofaced", "benefit", "anastasia", "rarebeauty", "urbandecay", "makeupforever", "patmcgrath", "bobbibrown", "givenchy", "armani", "kikomilano", "كيكو",
    ],
    b: [
      "maybelline", "ميبيلين", "lorealparis", "nyx", "essence", "ايسنس", "catrice", "كاتريس", "goldenrose", "كولدنروز", "غولدنروز", "flormar", "فلورمار",
      "deborah", "ديبورا", "sheglam", "شيغلام", "rimmel", "revolution", "maxfactor", "pastel", "seventeen", "سفنتين", "radiant", "راديانت", "artdeco",
      "gosh", "كوش", "monreve", "مونريف", "kryolan", "grigi", "avon", "elixir", "cathydoll",
    ],
  },
  fragrance: {
    a: [
      "dior", "ديور", "chanel", "شانيل", "yvessaintlaurent", "ysl", "سانلوران", "tomford", "تومفورد", "creed", "كريد", "parfumsdemarly", "مارلي",
      "maisonfranciskurkdjian", "xerjoff", "زيرجوف", "amouage", "امواج", "initio", "kilian", "guerlain", "جيرلان", "giorgioarmani", "ارماني",
      "valentino", "فالنتينو", "prada", "برادا", "versace", "فرزاتشي", "givenchy", "جيفنشي", "lancome", "carolinaherrera", "كارولينا", "gucci", "قوتشي",
      "burberry", "بربري", "jomalone", "montale", "مونتال", "mancera", "narcisorodriguez", "نارسيسو", "hermes", "jeanpaulgaultier", "غوتييه",
      "pacorabanne", "رابان", "hugoboss", "dolcegabbana", "دولتشي", "bvlgari", "بولغاري", "cartier", "كارتير", "montblanc", "مونبلان", "chloe", "كلوي",
      "byredo", "lelabo", "mugler", "viktorrolf", "kayali", "كيالي", "nishane", "نيشان", "louisvuitton", "moresque", "موريسك",
      "emporioarmani", "uniqueeluxury", "يونيك",
    ],
    b: [
      "lattafa", "لطافة", "armaf", "ارماف", "rasasi", "الرصاصي", "ajmal", "اجمل", "alharamain", "الحرمين", "afnan", "zara", "britneyspears",
      "guess", "جيس", "jaguar", "جاكوار", "bentley", "بينتلي", "dunhill", "calvinklein", "davidoff", "lacoste", "tommyhilfiger", "michaelkors",
      "robertocavalli", "كافالي", "issey", "ايسي", "katyperry", "arianagrande", "nautica",
    ],
  },
  body: {
    a: ["bathbodyworks", "باثاند", "victoriassecret", "فيكتوريا", "thebodyshop", "palmers", "بالمرز", "lorealparis", "eucerin", "cerave", "bioderma"],
    b: ["nivea", "vaseline", "فازلين", "dove", "ilove", "ايلوف", "rexona", "axe", "bizline", "بيزلاين", "dermaflora", "ديرمافلورا"],
  },
};
TIERS.nails = TIERS.makeup;

const compact = (s: string) =>
  normalize(s)
    .toLowerCase()
    .replace(/[^a-z0-9؀-ۿ]+/g, "");

const cache = new Map<string, number>();

/** تقديرات تلقائية لبراندات خارج القائمة (من الذكاء الاصطناعي أو البيانات): اسم البراند ← درجة. */
let dynamic = new Map<string, number>();
export function setDynamicTiers(tiers: Map<string, number>) {
  dynamic = tiers;
  cache.clear();
}

/** 1 = مرجع، 0.62 = جيد ومنتشر، 0.3 = غير معروف. */
export function brandTier(brandName: string, area: string | null): number {
  if (!brandName) return 0.3;
  const key = `${area ?? ""}|${brandName}`;
  const cached = cache.get(key);
  if (cached != null) return cached;
  const c = compact(brandName);
  const words = new Set(normalize(brandName).toLowerCase().split(/[^a-z0-9\u0600-\u06ff]+/).filter(Boolean));
  // المفاتيح القصيرة (mac، ysl…) تُطابق كلمة كاملة فقط حتى لا تلتقط «pharMACeris».
  const matches = (k: string) => {
    const ck = compact(k);
    return ck.length <= 4 ? words.has(ck) : c.includes(ck);
  };
  const tiers = TIERS[area ?? ""];
  let v = 0.3;
  if (tiers) {
    if (tiers.a.some(matches)) v = 1;
    else if (tiers.b.some(matches)) v = 0.62;
  }
  // القائمة المختارة يدوياً أولاً؛ وإلا التقدير التلقائي للبراند الجديد.
  if (v === 0.3) v = dynamic.get(brandName) ?? v;
  cache.set(key, v);
  return v;
}
