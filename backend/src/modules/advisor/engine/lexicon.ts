/**
 * معجم المستشارة: صفات المنتجات بمرادفاتها (فصحى، عراقي، إنجليزي).
 *
 * `terms` تُطابَق في نص المنتج (الاسم، الوصف، القسم، الملخص) وفي كلام الزبونة.
 * `ask` عبارات تقولها الزبونة فقط ولا تُكتب عادةً في وصف المنتج
 * (مثل «بشرتي تلمع» = دهنية، «شعري يطيح» = تساقط).
 */

export type FacetKey =
  | "area"
  | "kind"
  | "concern"
  | "skinType"
  | "ingredient"
  | "freeFrom"
  | "gender"
  | "family"
  | "time"
  | "strength"
  | "season"
  | "finish"
  | "coverage"
  | "attr"
  | "audience"
  | "occasion"
  | "recipient";

export interface FacetValue {
  id: string;
  facet: FacetKey;
  label: string;
  labelEn: string;
  terms: string[];
  ask?: string[];
  /** للنوع: المجال الذي ينتمي إليه (يُستنتج تلقائياً). */
  area?: string;
  emoji?: string;
}

const v = (
  facet: FacetKey,
  id: string,
  label: string,
  labelEn: string,
  terms: string[],
  extra: Partial<FacetValue> = {},
): FacetValue => ({ facet, id, label, labelEn, terms, ...extra });

export const LEXICON: FacetValue[] = [
  // ───────────────────────── المجال
  v("area", "skin", "العناية بالبشرة", "Skincare", ["بشره", "البشره", "الوجه", "وجه", "skin", "face", "skincare", "facial"], { emoji: "🌸", ask: ["وجهي", "بشرتي"] }),
  v("area", "hair", "العناية بالشعر", "Haircare", ["شعر", "الشعر", "فروه الراس", "hair", "scalp"], { emoji: "💇‍♀️", ask: ["شعري", "راسي"] }),
  v("area", "body", "العناية بالجسم", "Bodycare", ["جسم", "الجسم", "body", "يدين", "hands", "قدم", "feet"], { emoji: "🛁", ask: ["جسمي", "ايدي", "رجلي"] }),
  v("area", "fragrance", "العطور", "Fragrance", ["عطر", "عطور", "perfume", "parfum", "fragrance", "eau de", "cologne", "كولونيا"], { emoji: "✨" }),
  v("area", "makeup", "المكياج", "Makeup", ["مكياج", "ميكب", "makeup", "make up", "cosmetic"], { emoji: "💄", ask: ["ميك اب"] }),
  v("area", "nails", "الأظافر", "Nails", ["اظافر", "اضافر", "مناكير", "nail", "nails"], { emoji: "💅" }),

  // ───────────────────────── النوع — عطور
  v("kind", "perfume", "عطر", "Perfume", ["عطر", "perfume", "parfum", "eau de parfum", "eau de toilette", "edp", "edt", "extrait"], { area: "fragrance" }),
  v("kind", "mist", "معطر جسم", "Body mist", ["بودي مست", "body mist", "بودي سبلاش", "body splash", "سبلاش", "splash", "معطر جسم", "معطر للجسم", "fragrance mist", "hair mist", "بخاخ عطر"], { area: "fragrance" }),
  v("kind", "deodorant", "مزيل عرق", "Deodorant", ["مزيل عرق", "مزيل للعرق", "ديودرنت", "deodorant", "antiperspirant", "رول اون", "roll on"], { area: "body" }),
  v("kind", "oil_perfume", "عطر زيتي", "Perfume oil", ["دهن عود", "دهن عطر", "عطر زيتي", "perfume oil", "attar"], { area: "fragrance" }),
  v("kind", "bakhoor", "بخور", "Bakhoor", ["بخور", "bakhoor", "مبخره", "عود بخور"], { area: "fragrance" }),
  v("kind", "home_scent", "معطر منزل", "Home scent", ["معطر منزل", "شمعه", "شموع", "candle", "diffuser", "فواحه", "معطر جو"], { area: "fragrance" }),

  // ───────────────────────── النوع — شعر
  v("kind", "shampoo", "شامبو", "Shampoo", ["شامبو", "shampoo"], { area: "hair" }),
  v("kind", "conditioner", "بلسم", "Conditioner", ["بلسم", "كوندشنر", "conditioner", "بلسم شعر"], { area: "hair" }),
  v("kind", "hair_mask", "ماسك شعر", "Hair mask", ["ماسك شعر", "ماسك للشعر", "حمام كريم", "hair mask", "masque cheveux"], { area: "hair" }),
  v("kind", "hair_oil", "زيت شعر", "Hair oil", ["زيت ما قبل الشامبو", "ما قبل الشامبو", "pre shampoo", "pre-shampoo", "زيت شعر", "زيت للشعر", "hair oil", "زيت الشعر"], { area: "hair" }),
  v("kind", "hair_serum", "سيروم شعر", "Hair serum", ["سيروم شعر", "سيروم للشعر", "hair serum", "hair tonic", "لوشن شعر"], { area: "hair" }),
  v("kind", "leave_in", "كريم شعر", "Leave-in", ["ليف ان", "ليف إن", "leave in", "كريم شعر", "كريم للشعر", "hair cream", "styling cream"], { area: "hair" }),
  v("kind", "hair_color", "صبغة شعر", "Hair color", ["صبغه", "صبغة", "hair color", "hair dye", "coloration"], { area: "hair" }),
  v("kind", "hair_styling", "تصفيف الشعر", "Styling", ["جل شعر", "سبراي شعر", "hair spray", "hair gel", "wax", "واكس", "mousse"], { area: "hair" }),

  // ───────────────────────── النوع — بشرة
  v("kind", "cleanser", "غسول", "Cleanser", ["غسول", "منظف", "cleanser", "face wash", "cleansing", "فوم", "foam", "جل منظف", "micellar", "ميسيلار"], { area: "skin" }),
  v("kind", "toner", "تونر", "Toner", ["تونر", "toner", "lotion tonique"], { area: "skin" }),
  v("kind", "serum", "سيروم", "Serum", ["سيروم", "serum", "ampoule", "امبول"], { area: "skin" }),
  v("kind", "moisturizer", "مرطب", "Moisturizer", ["مرطب", "كريم مرطب", "moisturizer", "moisturiser", "hydrating cream", "كريم ترطيب", "جل مرطب"], { area: "skin" }),
  v("kind", "face_cream", "كريم وجه", "Face cream", ["كريم وجه", "كريم للوجه", "face cream", "day cream", "night cream", "كريم نهاري", "كريم ليلي"], { area: "skin" }),
  v("kind", "eye_cream", "كريم عيون", "Eye cream", ["كريم عيون", "كريم العين", "كريم للعين", "eye cream", "contour des yeux", "محيط العين"], { area: "skin" }),
  v("kind", "sunscreen", "واقي شمس", "Sunscreen", ["واقي شمس", "واقي الشمس", "واقي", "sunscreen", "sunblock", "spf", "uv"], { area: "skin" }),
  v("kind", "face_mask", "ماسك وجه", "Face mask", ["ماسك وجه", "ماسك للوجه", "قناع", "face mask", "sheet mask", "clay mask", "ماسك طين"], { area: "skin" }),
  v("kind", "exfoliator", "مقشر", "Exfoliator", ["مقشر", "تقشير", "scrub", "exfoliat", "peeling", "بيلنج"], { area: "skin" }),
  v("kind", "makeup_remover", "مزيل مكياج", "Makeup remover", ["مزيل مكياج", "مزيل المكياج", "makeup remover", "demaquillant", "cleansing oil", "cleansing balm"], { area: "skin" }),
  v("kind", "lip_care", "مرطب شفاه", "Lip care", ["مرطب شفاه", "مرطب للشفاه", "lip balm", "lip care", "زبده شفاه", "lip mask"], { area: "skin" }),

  // ───────────────────────── النوع — جسم
  v("kind", "body_lotion", "لوشن جسم", "Body lotion", ["لوشن", "لوشن جسم", "body lotion", "body cream", "كريم جسم", "body butter", "زبده جسم"], { area: "body" }),
  v("kind", "body_wash", "شاور جل", "Body wash", ["لوشن غسول", "washlotion", "wash lotion", "body wash", "شاور جل", "غسول جسم", "body wash", "shower gel", "صابون", "soap"], { area: "body" }),
  v("kind", "body_scrub", "مقشر جسم", "Body scrub", ["مقشر جسم", "body scrub", "سكراب"], { area: "body" }),
  v("kind", "body_oil", "زيت جسم", "Body oil", ["زيت جسم", "body oil", "dry oil"], { area: "body" }),
  v("kind", "hand_cream", "كريم يدين", "Hand cream", ["كريم يد", "كريم يدين", "كريم اليدين", "hand cream"], { area: "body" }),

  // ───────────────────────── النوع — مكياج
  v("kind", "foundation", "كريم أساس", "Foundation", ["أساس سائل", "اساس سائل", "أساس منيرال", "اساس منيرال", "أساس مطفي", "كريم اساس", "فاونديشن", "foundation", "bb cream", "cc cream", "skin tint"], { area: "makeup" }),
  v("kind", "concealer", "كونسيلر", "Concealer", ["كونسيلر", "خافي عيوب", "concealer", "corrector"], { area: "makeup" }),
  v("kind", "powder", "بودرة", "Powder", ["بودره", "بودرة", "powder", "بودره مضغوطه", "loose powder"], { area: "makeup" }),
  v("kind", "primer", "برايمر", "Primer", ["برايمر", "primer", "قاعده مكياج"], { area: "makeup" }),
  v("kind", "blush", "أحمر خدود", "Blush", ["احمر خدود", "بلاشر", "بلش", "blush", "blusher", "خدود"], { area: "makeup" }),
  v("kind", "highlighter", "هايلايتر", "Highlighter", ["هايلايتر", "هايلايت", "highlighter", "illuminator"], { area: "makeup" }),
  v("kind", "bronzer", "برونزر", "Bronzer", ["برونزر", "bronzer", "كونتور", "contour"], { area: "makeup" }),
  v("kind", "mascara", "ماسكارا", "Mascara", ["ماسكرا", "مسكارا", "مسكرا", "ماسكارا", "مسكره", "مسكرة", "mascara"], { area: "makeup" }),
  v("kind", "eyeliner", "آيلاينر", "Eyeliner", ["ايلاينر", "آيلاينر", "قلم كحل", "ايلاينر", "ايلاينر", "eyeliner", "كحل", "kohl", "خط العين"], { area: "makeup" }),
  v("kind", "eyeshadow", "ظلال عيون", "Eyeshadow", ["ظلال", "ظل عيون", "ايشادو", "eyeshadow", "باليت عيون", "eye palette"], { area: "makeup" }),
  v("kind", "brow", "حواجب", "Brows", ["حواجب", "حاجب", "brow", "eyebrow", "ماسكارا حواجب", "مسكارا حواجب", "ماسكرا حواجب", "brow mascara", "mascara brow", "eyebrow mascara"], { area: "makeup" }),
  v("kind", "lipstick", "أحمر شفاه", "Lipstick", ["احمر شفاه", "روج", "lipstick", "rouge", "ليبستك", "liquid lipstick"], { area: "makeup" }),
  v("kind", "lip_gloss", "ملمع شفاه", "Lip gloss", ["ملمع شفاه", "قلوس", "جلوس", "gloss", "lip gloss", "lip oil"], { area: "makeup" }),
  v("kind", "lip_liner", "محدد شفاه", "Lip liner", ["محدد شفاه", "قلم شفاه", "lip liner", "lip pencil"], { area: "makeup" }),
  v("kind", "tint", "تنت", "Tint", ["تنت", "tint", "lip tint", "cheek tint"], { area: "makeup" }),
  v("kind", "setting_spray", "مثبت مكياج", "Setting spray", ["مثبت مكياج", "مثبت", "setting spray", "fixing spray", "fix plus"], { area: "makeup" }),
  v("kind", "palette", "باليت", "Palette", ["باليت", "palette"], { area: "makeup" }),
  v("kind", "makeup_tool", "أدوات مكياج", "Tools", ["فرشاه", "فرشات", "اسفنجه", "بيوتي بلندر", "brush", "sponge", "blender"], { area: "makeup" }),

  // ───────────────────────── النوع — أظافر
  v("kind", "nail_polish", "طلاء أظافر", "Nail polish", ["مناكير", "مانيكير", "طلاء اظافر", "صبغ اظافر", "صبغه اظافر", "لون اظافر", "nail polish", "nail lacquer", "nail color", "nail colour", "gel polish", "جل اظافر", "vernis"], { area: "nails" }),
  v("kind", "nail_care", "عناية بالأظافر", "Nail care", ["مقوي اظافر", "زيت اظافر", "nail care", "cuticle", "مزيل مناكير", "مزيل طلاء", "مزيل طلاء اظافر", "nail remover", "nail polish remover", "base coat", "top coat", "طبقه اساس", "طبقه سريعه الجفاف", "مقشر جل", "مبيض اظافر", "اسيتون", "acetone"], { area: "nails" }),

  // ───────────────────────── المشاكل
  v("concern", "acne", "حب الشباب", "Acne", ["حب الشباب", "حبوب", "حبوب الوجه", "acne", "blemish", "breakout", "imperfection", "spots", "بثور"], { emoji: "🔴", ask: ["حبوب بوجهي", "طلعات", "بثرات"] }),
  v("concern", "pigment", "التصبغات والتفتيح", "Pigmentation", ["تصبغات", "تصبغ", "كلف", "نمش", "بقع", "تفتيح", "توحيد اللون", "pigment", "dark spot", "brightening", "whitening", "even tone", "melasma", "glow"], { emoji: "✨", ask: ["اسمرار", "بقع داكنه", "ابيض", "يفتح", "نضاره"] }),
  v("concern", "aging", "التجاعيد وعلامات العمر", "Anti-aging", ["تجاعيد", "مكافحه الشيخوخه", "شد", "مضاد للتجاعيد", "anti aging", "anti-aging", "wrinkle", "firming", "lifting", "fine lines", "collagen"], { emoji: "⏳", ask: ["خطوط", "ترهل", "عمري"] }),
  v("concern", "dryness", "الجفاف", "Dryness", ["جفاف", "جافه", "ترطيب عميق", "dry", "dehydrat", "hydrat", "moistur"], { emoji: "💧", ask: ["بشرتي تشقق", "تقشر", "تشد"] }),
  v("concern", "oily", "اللمعان والدهون", "Oiliness", ["دهنيه", "دهون", "لمعان", "oily", "oil control", "mattifying", "sebum", "شحوم"], { emoji: "🫧", ask: ["تلمع", "دهن بوجهي"] }),
  v("concern", "sensitive", "الحساسية والاحمرار", "Sensitivity", ["حساسه", "حساسيه", "تهيج", "احمرار", "مهدئ", "sensitive", "soothing", "redness", "calming", "cica", "سيكا"], { emoji: "🌿", ask: ["تحمر", "تتحسس", "تهيج"] }),
  v("concern", "pores", "المسام", "Pores", ["مسام", "رؤوس سوداء", "blackhead", "pore", "pores"], { emoji: "🔍", ask: ["مسامات", "نقاط سوداء"] }),
  v("concern", "dark_circles", "الهالات", "Dark circles", ["هالات", "هالات سوداء", "انتفاخ", "dark circle", "puffiness", "under eye"], { emoji: "👁️", ask: ["تحت عيوني اسود", "عيوني منتفخه"] }),
  v("concern", "dull", "البهتان", "Dullness", ["بهتان", "باهته", "اشراقه", "dull", "radiance", "glow", "luminous"], { emoji: "🌟", ask: ["مطفيه", "تعبانه"] }),
  v("concern", "hairloss", "تساقط الشعر", "Hair loss", ["تساقط", "تساقط الشعر", "hair loss", "hair fall", "anti hair loss", "انبات", "كثافه", "growth", "thinning"], { emoji: "🍃", ask: ["يطيح", "يطوح", "شعري خفيف", "يتساقط"] }),
  v("concern", "dandruff", "القشرة", "Dandruff", ["قشره", "قشرة", "dandruff", "flake", "anti dandruff", "حكه الراس"], { emoji: "❄️", ask: ["راسي يحك"] }),
  v("concern", "frizz", "الهيشان والتجعد", "Frizz", ["هيشان", "تجعد", "مجعد", "frizz", "curl", "curly", "smooth", "تنعيم", "keratin"], { emoji: "🌀", ask: ["منفوش", "شعري يكش", "خشن"] }),
  v("concern", "damaged", "الشعر التالف", "Damaged hair", ["تالف", "متقصف", "اطراف متقصفه", "damaged", "repair", "split end", "بروتين", "ترميم"], { emoji: "🩹", ask: ["محروق", "تقصف"] }),
  v("concern", "colored", "الشعر المصبوغ", "Color-treated", ["مصبوغ", "الشعر المصبوغ", "color treated", "colour", "colored hair", "protect color"], { emoji: "🎨", ask: ["صابغه", "صبغت"] }),
  v("concern", "dry_hair", "جفاف الشعر", "Dry hair", ["شعر جاف", "للشعر الجاف", "dry hair", "nourish"], { emoji: "🌾", ask: ["شعري ناشف", "شعري جاف"] }),
  v("concern", "oily_scalp", "فروة دهنية", "Oily scalp", ["فروه دهنيه", "الشعر الدهني", "oily hair", "oily scalp", "purifying"], { emoji: "🫗", ask: ["شعري يدهن", "يصير دهني"] }),
  v("concern", "stretch", "علامات التمدد", "Stretch marks", ["تشققات", "علامات التمدد", "stretch mark", "سترتش"], { emoji: "〰️" }),

  // ───────────────────────── نوع البشرة
  v("skinType", "dry", "جافة", "Dry", ["بشره جافه", "للبشره الجافه", "dry skin"], { emoji: "🏜️", ask: ["جافه", "ناشفه"] }),
  v("skinType", "oily", "دهنية", "Oily", ["بشره دهنيه", "للبشره الدهنيه", "oily skin"], { emoji: "💦", ask: ["دهنيه", "تلمع"] }),
  v("skinType", "combination", "مختلطة", "Combination", ["بشره مختلطه", "مختلطه", "combination skin", "mixed skin"], { emoji: "☯️", ask: ["مختلطه", "دهنيه بالوسط"] }),
  v("skinType", "sensitive", "حساسة", "Sensitive", ["بشره حساسه", "للبشره الحساسه", "sensitive skin"], { emoji: "🌷", ask: ["حساسه"] }),
  v("skinType", "normal", "عادية", "Normal", ["بشره عاديه", "normal skin", "جميع انواع البشره", "all skin types"], { emoji: "😊", ask: ["عاديه", "طبيعيه"] }),

  // ───────────────────────── المكوّنات
  v("ingredient", "niacinamide", "نياسيناميد", "Niacinamide", ["نياسيناميد", "niacinamide", "vitamin b3"]),
  v("ingredient", "hyaluronic", "هيالورونيك", "Hyaluronic acid", ["هيالورونيك", "هيالورونك", "hyaluronic", "hyaluron"]),
  v("ingredient", "retinol", "ريتينول", "Retinol", ["ريتينول", "رتينول", "retinol", "retinal", "retinoid", "bakuchiol", "باكوشيول"]),
  v("ingredient", "vitamin_c", "فيتامين سي", "Vitamin C", ["فيتامين سي", "فيتامين c", "vitamin c", "ascorbic", "vit c"]),
  v("ingredient", "salicylic", "ساليسيليك", "Salicylic acid", ["ساليسيليك", "ساليسليك", "salicylic", "bha"]),
  v("ingredient", "aha", "أحماض مقشرة", "AHA", ["جليكوليك", "glycolic", "lactic", "aha", "احماض"]),
  v("ingredient", "ceramide", "سيراميد", "Ceramides", ["سيراميد", "سيراميدات", "ceramide"]),
  v("ingredient", "collagen", "كولاجين", "Collagen", ["كولاجين", "collagen", "peptide", "ببتيد"]),
  v("ingredient", "snail", "حلزون", "Snail mucin", ["حلزون", "snail", "mucin"]),
  v("ingredient", "centella", "سنتيلا", "Centella", ["سنتيلا", "centella", "cica", "سيكا"]),
  v("ingredient", "tea_tree", "شجرة الشاي", "Tea tree", ["شجره الشاي", "tea tree"]),
  v("ingredient", "aloe", "صبار", "Aloe", ["صبار", "الوفيرا", "aloe"]),
  v("ingredient", "argan", "أرغان", "Argan", ["ارغان", "argan"]),
  v("ingredient", "keratin", "كيراتين", "Keratin", ["كيراتين", "keratin"]),
  v("ingredient", "biotin", "بيوتين", "Biotin", ["بيوتين", "biotin"]),
  v("ingredient", "caffeine", "كافيين", "Caffeine", ["كافيين", "كافين", "caffeine"]),
  v("ingredient", "rosemary", "إكليل الجبل", "Rosemary", ["اكليل الجبل", "روزماري", "rosemary"]),
  v("ingredient", "shea", "زبدة الشيا", "Shea", ["شيا", "shea"]),
  v("ingredient", "coconut", "جوز الهند", "Coconut", ["جوز الهند", "coconut"]),
  v("ingredient", "charcoal", "فحم", "Charcoal", ["فحم", "charcoal"]),
  v("ingredient", "clay", "طين", "Clay", ["طين", "clay", "kaolin"]),
  v("ingredient", "panthenol", "بانثينول", "Panthenol", ["بانثينول", "panthenol", "b5"]),
  v("ingredient", "arbutin", "أربوتين", "Arbutin", ["اربوتين", "arbutin", "kojic", "كوجيك", "tranexamic", "ترانيكساميك"]),
  v("ingredient", "zinc", "زنك", "Zinc", ["زنك", "zinc"]),
  v("ingredient", "rose", "الورد", "Rose", ["ماء الورد", "rose water", "rosa"]),

  // ───────────────────────── خالٍ من
  v("freeFrom", "fragrance", "بدون عطر", "Fragrance-free", ["بدون عطر", "خالي من العطر", "fragrance free", "unscented", "sans parfum"], { ask: ["ما يكون بيه عطر", "بلا ريحه"] }),
  v("freeFrom", "sulfate", "بدون سلفات", "Sulfate-free", ["بدون سلفات", "خالي من السلفات", "sulfate free", "sulphate free"]),
  v("freeFrom", "paraben", "بدون بارابين", "Paraben-free", ["بدون بارابين", "paraben free"]),
  v("freeFrom", "alcohol", "بدون كحول", "Alcohol-free", ["بدون كحول", "خالي من الكحول", "alcohol free"]),
  v("freeFrom", "oil", "بدون زيوت", "Oil-free", ["خالي من الزيوت", "بدون زيوت", "oil free", "non comedogenic", "لا يسد المسام"]),

  // ───────────────────────── العطور — الجنس
  v("gender", "women", "نسائي", "For her", ["نسائي", "للنساء", "نسائيه", "women", "woman", "femme", "for her", "pour femme", "lady"], { emoji: "👩", ask: ["لنفسي", "لبنتي", "لاختي", "لامي", "لزوجتي", "لمرتي", "لصديقتي", "حريمي", "نسوان"] }),
  v("gender", "men", "رجالي", "For him", ["رجالي", "للرجال", "men", "homme", "for him", "pour homme", "man", "هوم", "اوم", "بور اوم"], { emoji: "👨", ask: ["لزوجي", "لابوي", "لابي", "لاخوي", "لاخي", "لابني", "لرجل", "شبابي"] }),
  v("gender", "unisex", "للجنسين", "Unisex", ["للجنسين", "لكلا الجنسين", "كلا الجنسين", "الجنسين", "يونيسكس", "يونيسيكس", "unisex", "mixte"], { emoji: "🤝" }),

  // ───────────────────────── العطور — العائلة
  v("family", "woody", "خشبي", "Woody", ["خشبي", "خشبيه", "خشب", "صندل", "سيدار", "woody", "wood", "sandalwood", "cedar", "vetiver", "فيتيفر"], { emoji: "🪵" }),
  v("family", "oud", "عود", "Oud", ["عود", "oud", "agarwood", "دهن العود"], { emoji: "🏺" }),
  v("family", "floral", "زهري", "Floral", ["زهري", "زهور", "ورد", "ياسمين", "floral", "flower", "rose", "jasmine", "tuberose", "peony", "orchid", "اوركيد", "fleur"], { emoji: "🌹" }),
  v("family", "oriental", "شرقي", "Oriental / Amber", ["شرقي", "عنبر", "امبر", "oriental", "amber", "ambre", "incense", "بخور"], { emoji: "🕌" }),
  v("family", "musk", "مسك", "Musk", ["مسك", "musk", "musc", "white musk"], { emoji: "🤍" }),
  v("family", "vanilla", "فانيلا", "Vanilla", ["فانيلا", "فانيليا", "vanilla", "vanille", "tonka", "تونكا"], { emoji: "🍦" }),
  v("family", "sweet", "حلو", "Sweet / Gourmand", ["حلو", "سكري", "كراميل", "شوكولا", "gourmand", "sweet", "caramel", "praline", "candy", "honey", "عسل"], { emoji: "🍬", ask: ["سكريه"] }),
  v("family", "fresh", "منعش", "Fresh / Citrus", ["منعش", "حمضي", "ليمون", "برغموت", "fresh", "citrus", "bergamot", "lemon", "orange", "grapefruit", "neroli", "نيرولي"], { emoji: "🍋", ask: ["خفيف", "بارد"] }),
  v("family", "aquatic", "مائي", "Aquatic", ["مائي", "بحري", "aquatic", "marine", "ocean", "aqua", "sea"], { emoji: "🌊" }),
  v("family", "spicy", "حار", "Spicy", ["حار", "توابل", "فلفل", "قرفه", "هيل", "spicy", "pepper", "cinnamon", "cardamom", "saffron", "زعفران"], { emoji: "🌶️" }),
  v("family", "fruity", "فواكه", "Fruity", ["فواكه", "فاكهه", "fruity", "fruit", "berry", "apple", "peach", "pear", "lychee", "خوخ", "توت"], { emoji: "🍓" }),
  v("family", "leather", "جلدي", "Leather / Tobacco", ["جلد", "جلدي", "تبغ", "leather", "tobacco", "smoky", "دخاني"], { emoji: "🧥" }),
  v("family", "powdery", "بودري", "Powdery", ["بودري", "powdery", "iris", "ايريس", "violet"], { emoji: "☁️" }),
  v("family", "coffee", "قهوة", "Coffee", ["قهوه", "coffee", "espresso", "café"], { emoji: "☕" }),

  // ───────────────────────── العطور — الوقت والتركيز والموسم
  v("time", "day", "صباحي", "Daytime", ["صباحي", "نهاري", "يومي", "للدوام", "day", "daily", "office"], { emoji: "☀️", ask: ["للدوام", "للجامعه", "للمدرسه", "يومي"] }),
  v("time", "night", "مسائي", "Evening", ["مسائي", "ليلي", "سهرات", "evening", "night", "intense", "noir"], { emoji: "🌙", ask: ["للسهره", "للحفلات", "للعرس"] }),
  v("strength", "edp", "أو دو بارفان", "Eau de Parfum", ["او دو بارفان", "eau de parfum", "edp"]),
  v("strength", "parfum", "بارفان مركز", "Parfum / Extrait", ["parfum", "extrait", "اكستريت", "مركز", "elixir", "اليكسير"], { ask: ["ثابت", "ثبات", "يدوم", "فواح", "قوي"] }),
  v("strength", "edt", "أو دو تواليت", "Eau de Toilette", ["او دو تواليت", "eau de toilette", "edt"], { ask: ["خفيف"] }),
  v("season", "summer", "صيفي", "Summer", ["صيفي", "للصيف", "summer"], { emoji: "🏖️", ask: ["للحر"] }),
  v("season", "winter", "شتوي", "Winter", ["شتوي", "للشتاء", "winter"], { emoji: "❄️", ask: ["للبرد"] }),

  // ───────────────────────── المكياج
  v("finish", "matte", "مطفي", "Matte", ["مطفي", "مات", "matte", "mat"], { emoji: "🎯" }),
  v("finish", "glossy", "لامع", "Glossy", ["لامع", "لمعه", "glossy", "shine", "gloss", "shimmer", "glitter", "جليتر"], { emoji: "✨" }),
  v("finish", "satin", "ساتان", "Satin", ["ساتان", "satin", "creamy", "قوام كريمي", "ملمس كريمي"], { emoji: "🎀" }),
  v("finish", "dewy", "ندي", "Dewy", ["ندي", "dewy", "glow", "radiant", "مضيء"], { emoji: "💎" }),
  v("coverage", "full", "تغطية عالية", "Full coverage", ["تغطيه عاليه", "تغطيه كامله", "full coverage", "high coverage"], { ask: ["يغطي"] }),
  v("coverage", "light", "تغطية خفيفة", "Light coverage", ["تغطيه خفيفه", "light coverage", "sheer", "طبيعي"], { ask: ["خفيف", "ناتشورال"] }),
  v("attr", "waterproof", "مقاوم للماء", "Waterproof", ["مقاوم للماء", "ضد الماء", "waterproof", "water resistant"], { emoji: "💧" }),
  v("attr", "longwear", "ثبات طويل", "Long-wear", ["ثابت", "ثبات", "يدوم", "long lasting", "longwear", "24h", "24 ساعه", "stay"], { emoji: "⏱️" }),
  v("attr", "natural", "طبيعي / عضوي", "Natural", ["طبيعي", "عضوي", "natural", "organic", "bio", "vegan", "نباتي"], { emoji: "🌱" }),
  v("attr", "korean", "كوري", "Korean", ["كوري", "كوريه", "korean", "k-beauty", "kbeauty"], { emoji: "🇰🇷" }),

  // ───────────────────────── الجمهور
  v("audience", "baby", "أطفال", "Kids & baby", ["اطفال", "طفل", "رضع", "baby", "kids", "infant", "bebe"], { emoji: "👶", ask: ["لابني الصغير", "لبنتي الصغيره", "للجاهل", "للجهال"] }),
  v("audience", "men", "رجال", "Men", ["للرجال", "رجالي", "men", "homme", "barber"], { emoji: "🧔" }),

  // ───────────────────────── المناسبة والمُهدى إليه
  v("occasion", "gift", "هدية", "Gift", ["هديه", "هدايا", "gift", "set", "طقم", "مجموعه هدايا"], { emoji: "🎁", ask: ["اهدي", "هديه"] }),
  v("occasion", "wedding", "عرس", "Wedding", ["عرس", "عروس", "زفاف", "wedding", "bridal"], { emoji: "💍", ask: ["عرسي", "خطوبه", "ملكه"] }),
  v("occasion", "daily", "استخدام يومي", "Everyday", ["يومي", "daily", "everyday"], { emoji: "🗓️" }),
  v("occasion", "travel", "سفر", "Travel", ["سفر", "travel", "mini", "حجم صغير"], { emoji: "✈️" }),
  v("recipient", "mother", "الأم", "Mom", [], { emoji: "👩‍🦳", ask: ["لامي", "لماما", "للوالده", "لوالدتي"] }),
  v("recipient", "wife", "الزوجة", "Wife", [], { emoji: "💑", ask: ["لزوجتي", "لمرتي", "للمدام"] }),
  v("recipient", "husband", "الزوج", "Husband", [], { emoji: "🤵", ask: ["لزوجي", "لرجلي", "للزوج"] }),
  v("recipient", "friend", "صديقة", "Friend", [], { emoji: "👯‍♀️", ask: ["لصديقتي", "لصاحبتي", "لرفيجتي", "لرفيقتي"] }),
  v("recipient", "sister", "الأخت", "Sister", [], { emoji: "👭", ask: ["لاختي", "لخيتي"] }),
  v("recipient", "father", "الأب", "Dad", [], { emoji: "👴", ask: ["لابوي", "لبابا", "للوالد", "لابي"] }),
  v("recipient", "brother", "الأخ", "Brother", [], { emoji: "🧑", ask: ["لاخوي", "لاخي"] }),
  v("recipient", "self", "لنفسي", "Myself", [], { emoji: "🪞", ask: ["لنفسي", "الي انا", "لي انا"] }),
];

export const BY_FACET = new Map<FacetKey, FacetValue[]>();
for (const fv of LEXICON) {
  const list = BY_FACET.get(fv.facet) ?? [];
  list.push(fv);
  BY_FACET.set(fv.facet, list);
}

export function facetValue(facet: FacetKey, id: string): FacetValue | undefined {
  return BY_FACET.get(facet)?.find((x) => x.id === id);
}

/** المُهدى إليه → جنس العطر المناسب. */
export const RECIPIENT_GENDER: Record<string, "women" | "men"> = {
  mother: "women",
  wife: "women",
  friend: "women",
  sister: "women",
  self: "women",
  husband: "men",
  father: "men",
  brother: "men",
};

/** مشاكل الشعر/البشرة → المجال. */
export const CONCERN_AREA: Record<string, "skin" | "hair" | "body"> = {
  acne: "skin",
  pigment: "skin",
  aging: "skin",
  dryness: "skin",
  oily: "skin",
  sensitive: "skin",
  pores: "skin",
  dark_circles: "skin",
  dull: "skin",
  hairloss: "hair",
  dandruff: "hair",
  frizz: "hair",
  damaged: "hair",
  colored: "hair",
  dry_hair: "hair",
  oily_scalp: "hair",
  stretch: "body",
};

/** مكونات يُنصح بها لكل مشكلة — تُستخدم لتعزيز الترتيب وشرح الاختيار. */
export const CONCERN_INGREDIENTS: Record<string, string[]> = {
  acne: ["salicylic", "niacinamide", "tea_tree", "zinc", "centella", "clay"],
  pigment: ["vitamin_c", "niacinamide", "arbutin", "aha"],
  aging: ["retinol", "collagen", "hyaluronic", "vitamin_c"],
  dryness: ["hyaluronic", "ceramide", "shea", "panthenol"],
  oily: ["niacinamide", "salicylic", "clay", "zinc"],
  sensitive: ["centella", "aloe", "panthenol", "ceramide"],
  pores: ["salicylic", "niacinamide", "clay", "charcoal", "aha"],
  dark_circles: ["caffeine", "vitamin_c", "retinol"],
  dull: ["vitamin_c", "aha", "niacinamide"],
  hairloss: ["biotin", "rosemary", "caffeine", "keratin"],
  dandruff: ["tea_tree", "zinc"],
  frizz: ["keratin", "argan", "coconut"],
  damaged: ["keratin", "argan", "collagen"],
  dry_hair: ["argan", "coconut", "shea"],
};

/** النوع العام يتخصص حسب المجال: «مرطب» للجسم = لوشن جسم، «سيروم» للشعر = سيروم شعر. */
export const KIND_BY_AREA: Record<string, Record<string, string>> = {
  body: { moisturizer: "body_lotion", face_cream: "body_lotion", cleanser: "body_wash", exfoliator: "body_scrub", serum: "body_lotion" },
  hair: { moisturizer: "leave_in", face_cream: "leave_in", serum: "hair_serum", face_mask: "hair_mask", cleanser: "shampoo", toner: "hair_serum" },
};
