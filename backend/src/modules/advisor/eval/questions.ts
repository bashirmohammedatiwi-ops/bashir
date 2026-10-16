/**
 * مجموعة تقييم «ديما»: أسئلة متسوّقات بصيغ حقيقية (عراقي، فصحى، إنجليزي، فرانكو، أخطاء كتابة).
 *
 * • `dev`: يُضبط عليها أثناء التطوير. • `test`: محجوزة — لا يُضبط عليها شيء، تُقاس فقط.
 * • الحقول المتوقعة تُقارن بما فهمته «ديما» في حالة المحادثة بعد الرد (need).
 *   kinds/families/concerns = «واحد منها على الأقل»، والباقي مطابقة تامة.
 * • `rel`: تعبير يُطابَق على اسم المنتج وقسمه (مطبّعين) لقياس دقة أول 5 ترشيحات.
 */
export type CaseType = "products" | "routine" | "knowledge" | "similar" | "chat";

export interface EvalCase {
  q: string;
  /** dev: للضبط. test: محجوز. holdout: كُتب لاحقاً ولم يُقَس إلا مرة واحدة في النهاية (قبل/بعد). */
  split: "dev" | "test" | "holdout";
  tag: string;
  type?: CaseType;
  area?: string;
  kinds?: string[];
  concerns?: string[];
  skinType?: string;
  gender?: string;
  families?: string[];
  maxPrice?: number;
  minPrice?: number;
  rel?: string;
}

type Raw = Omit<EvalCase, "split" | "tag">;

/** كل ثالث سؤال في كل قسم يذهب للاختبار المحجوز. */
function section(tag: string, list: Raw[]): EvalCase[] {
  return list.map((c, i) => ({ ...c, tag, split: i % 3 === 2 ? "test" : "dev" }));
}

const PERFUME = "عطر|عطور|parfum|perfume|toilette|cologne|كولونيا|برفان";

export const EVAL_CASES: EvalCase[] = [
  ...section("perfume", [
    { q: "عطر نسائي ثابت", type: "products", area: "fragrance", gender: "women", rel: PERFUME },
    { q: "عطر رجالي خشبي لزوجي", type: "products", area: "fragrance", gender: "men", families: ["woody"], rel: PERFUME },
    { q: "اريد عطر ريحته مثل الصابون نظيفة", type: "products", area: "fragrance", families: ["fresh", "musk", "aquatic", "powdery"], rel: PERFUME },
    { q: "عطر ريحته شوكولاته وكراميل", type: "products", area: "fragrance", families: ["sweet", "vanilla", "coffee"], rel: PERFUME },
    { q: "عطر عود فخم", type: "products", area: "fragrance", families: ["oud"], rel: PERFUME },
    { q: "ريحة بحرية للصيف", type: "products", area: "fragrance", families: ["aquatic", "fresh"], rel: PERFUME },
    { q: "عطر بنات ناعم", type: "products", area: "fragrance", gender: "women", rel: PERFUME },
    { q: "body mist بريحة الفواكه", type: "products", kinds: ["mist"], families: ["fruity"], rel: "mist|splash|مست|سبلاش|معطر" },
    { q: "بخور", type: "products", kinds: ["bakhoor"], rel: "بخور|bakhoor|عود" },
    { q: "مسك الطهارة", type: "products", families: ["musk"], rel: "مسك|musk|musc" },
    { q: "عطر زيتي", type: "products", kinds: ["oil_perfume"], rel: "زيت|oil|دهن" },
    { q: "عطر شتوي دافي", type: "products", area: "fragrance", families: ["oriental", "spicy", "vanilla", "woody", "sweet"], rel: PERFUME },
    { q: "عطر قهوة", type: "products", area: "fragrance", families: ["coffee"], rel: PERFUME },
    { q: "عطر ريحة ورد", type: "products", area: "fragrance", families: ["floral"], rel: PERFUME },
    { q: "عطر بودري", type: "products", area: "fragrance", families: ["powdery"], rel: PERFUME },
    { q: "عطر للجنسين", type: "products", area: "fragrance", gender: "unisex", rel: PERFUME },
    { q: "عطر حار بيه توابل", type: "products", area: "fragrance", families: ["spicy"], rel: PERFUME },
    { q: "اقوى عطر رجالي ثابت وفواح", type: "products", area: "fragrance", gender: "men", rel: PERFUME },
    { q: "عطر للعرس", type: "products", area: "fragrance", rel: PERFUME },
    { q: "مزيل عرق رجالي", type: "products", kinds: ["deodorant"], gender: "men", rel: "deodorant|مزيل|roll|رول|ديودرنت|antiperspirant" },
    { q: "عطر ثابت للصيف منعش", type: "products", area: "fragrance", families: ["fresh", "aquatic"], rel: PERFUME },
    { q: "عطر مركز بارفان", type: "products", area: "fragrance", rel: PERFUME },
    { q: "معطر للشعر", type: "products", kinds: ["mist"], rel: "شعر|hair" },
    { q: "عطر جلد وتبغ", type: "products", area: "fragrance", families: ["leather"], rel: PERFUME },
    { q: "عطر فانيلا ناعم", type: "products", area: "fragrance", families: ["vanilla"], rel: PERFUME },
    { q: "عطر للدوام خفيف ما يزعج", type: "products", area: "fragrance", rel: PERFUME },
    { q: "عطر رجالي للشباب حيوي", type: "products", area: "fragrance", gender: "men", rel: PERFUME },
  ]),

  ...section("english", [
    { q: "perfume for men under 50k", type: "products", area: "fragrance", gender: "men", maxPrice: 50000, rel: PERFUME },
    { q: "something that smells like vanilla and caramel", type: "products", families: ["vanilla", "sweet"], rel: PERFUME },
    { q: "fresh citrus perfume for summer", type: "products", area: "fragrance", families: ["fresh"], rel: PERFUME },
    { q: "sunscreen for oily skin", type: "products", kinds: ["sunscreen"], skinType: "oily", rel: "واقي|sun|spf|شمس" },
    { q: "moisturizer for dry skin", type: "products", kinds: ["moisturizer", "face_cream"], skinType: "dry", rel: "مرطب|moistur|كريم|cream|hydra" },
    { q: "cleanser for acne", type: "products", kinds: ["cleanser"], concerns: ["acne"], rel: "غسول|cleans|wash|منظف|جل|foam" },
    { q: "shampoo for hair loss", type: "products", kinds: ["shampoo"], concerns: ["hairloss"], rel: "شامبو|shampoo" },
    { q: "hair mask for dry hair", type: "products", kinds: ["hair_mask"], concerns: ["dry_hair"], rel: "ماسك|mask|masque|حمام" },
    { q: "waterproof mascara", type: "products", kinds: ["mascara"], rel: "ماسكارا|مسكارا|mascara" },
    { q: "foundation for dry skin", type: "products", kinds: ["foundation"], skinType: "dry", rel: "اساس|foundation|فاونديشن|bb|cc" },
    { q: "nude lipstick", type: "products", kinds: ["lipstick"], rel: "روج|lip|شفاه|احمر" },
    { q: "eye cream for dark circles", type: "products", kinds: ["eye_cream"], concerns: ["dark_circles"], rel: "عين|عيون|eye" },
    { q: "skincare routine for acne", type: "routine", area: "skin", concerns: ["acne"] },
    { q: "gift for my mom", type: "products" },
    { q: "best serum for dark spots", type: "products", kinds: ["serum"], concerns: ["pigment"], rel: "سيروم|serum|امبول|ampoule" },
    { q: "anti dandruff shampoo", type: "products", kinds: ["shampoo"], concerns: ["dandruff"], rel: "شامبو|shampoo" },
    { q: "matte lipstick long lasting", type: "products", kinds: ["lipstick"], rel: "روج|lip|شفاه|احمر" },
    { q: "body lotion for dry skin", type: "products", kinds: ["body_lotion"], rel: "لوشن|lotion|كريم|cream|body|جسم|butter|زبده" },
    { q: "3atr rjali", type: "products", area: "fragrance", gender: "men", rel: PERFUME },
    { q: "parfum femme vanille", type: "products", area: "fragrance", gender: "women", families: ["vanilla"], rel: PERFUME },
    { q: "hair oil for frizzy hair", type: "products", kinds: ["hair_oil", "hair_serum"], concerns: ["frizz"], rel: "زيت|oil|سيروم|serum" },
  ]),

  ...section("skin", [
    { q: "بشرتي دهنية وبيها حبوب", type: "products", area: "skin", skinType: "oily", concerns: ["acne"] },
    { q: "غسول للبشرة الدهنية", type: "products", kinds: ["cleanser"], skinType: "oily", rel: "غسول|cleans|wash|منظف|جل|foam|فوم" },
    { q: "واقي شمس للبشرة الحساسة", type: "products", kinds: ["sunscreen"], skinType: "sensitive", rel: "واقي|sun|spf|شمس" },
    { q: "سيروم للتصبغات تحت 25 ألف", type: "products", kinds: ["serum"], concerns: ["pigment"], maxPrice: 25000, rel: "سيروم|serum|امبول|ampoule" },
    { q: "كريم للهالات السوداء", type: "products", concerns: ["dark_circles"], rel: "عين|عيون|eye|هالات" },
    { q: "وجهي باهت ومتعب", type: "products", area: "skin", concerns: ["dull"] },
    { q: "بشرتي تلمع طول اليوم", type: "products", area: "skin", concerns: ["oily"], skinType: "oily" },
    { q: "عندي مسامات واسعة بالخشم", type: "products", area: "skin", concerns: ["pores"] },
    { q: "عندي اثار حبوب غامقة", type: "products", area: "skin", concerns: ["pigment", "acne"] },
    { q: "كلف بالوجه", type: "products", area: "skin", concerns: ["pigment"] },
    { q: "تجاعيد حول العين", type: "products", area: "skin", concerns: ["aging", "dark_circles"], rel: "عين|عيون|eye|تجاعيد|wrinkle|age|aging" },
    { q: "مرطب خفيف للبشرة المختلطة", type: "products", kinds: ["moisturizer", "face_cream"], skinType: "combination", rel: "مرطب|moistur|كريم|cream|جل|gel|hydra" },
    { q: "تونر للمسام", type: "products", kinds: ["toner"], concerns: ["pores"], rel: "تونر|toner|tonique|لوشن" },
    { q: "ماسك طين للوجه", type: "products", kinds: ["face_mask"], rel: "ماسك|mask|قناع|طين|clay" },
    { q: "مقشر للوجه لطيف", type: "products", kinds: ["exfoliator"], rel: "مقشر|scrub|peel|exfol|تقشير|بيلنج" },
    { q: "مزيل مكياج للعيون", type: "products", kinds: ["makeup_remover"], rel: "مزيل|remov|ميسيلار|micellar|demaq|cleansing" },
    { q: "شفايفي متشققة", type: "products", kinds: ["lip_care"], rel: "شفاه|شفايف|lip|بلسم|balm" },
    { q: "سيروم فيتامين سي", type: "products", kinds: ["serum"], rel: "سيروم|serum|فيتامين|vitamin" },
    { q: "كريم ليلي للتجاعيد", type: "products", area: "skin", concerns: ["aging"], rel: "كريم|cream|ليل|night|تجاعيد|wrinkle|age" },
    { q: "منتجات كورية للبشرة", type: "products", area: "skin" },
    { q: "كريم تفتيح للوجه", type: "products", area: "skin", concerns: ["pigment"] },
    { q: "احمرار بالخدود وحساسية", type: "products", area: "skin", concerns: ["sensitive"] },
    { q: "بشرتي جافة كلش وتقشر", type: "products", area: "skin", skinType: "dry" },
    { q: "صابونة للوجه للحبوب", type: "products", area: "skin", concerns: ["acne"], rel: "غسول|cleans|wash|صابون|soap|منظف|جل|foam" },
    { q: "كريم للرؤوس السوداء", type: "products", area: "skin", concerns: ["pores", "acne"] },
    { q: "اريد شي يصغر المسام", type: "products", area: "skin", concerns: ["pores"] },
    { q: "واقي شمس بدون لون للبشرة الدهنية", type: "products", kinds: ["sunscreen"], skinType: "oily", rel: "واقي|sun|spf|شمس" },
    { q: "كريم عين للانتفاخ", type: "products", kinds: ["eye_cream"], rel: "عين|عيون|eye" },
    { q: "مرطب بدون عطر للبشرة الحساسة", type: "products", kinds: ["moisturizer", "face_cream"], skinType: "sensitive", rel: "مرطب|moistur|كريم|cream|hydra|بلسم|balm" },
    { q: "سيروم هيالورونيك", type: "products", kinds: ["serum"], rel: "سيروم|serum|هيالورون|hyalur" },
    { q: "ريتينول للمبتدئين", type: "products", rel: "ريتينول|retin|رتينول" },
    { q: "بشرة نضرة ومشرقة", type: "products", area: "skin", concerns: ["dull", "pigment"] },
    { q: "وجهي يطلع بي حبوب وقت الدورة", type: "products", area: "skin", concerns: ["acne"] },
    { q: "بشرتي تحمر من اي كريم", type: "products", area: "skin", concerns: ["sensitive"] },
    { q: "بقع سودة بوجهي من الشمس", type: "products", area: "skin", concerns: ["pigment"] },
    { q: "خطوط رفيعة بالجبهة", type: "products", area: "skin", concerns: ["aging"] },
  ]),

  ...section("hair", [
    { q: "شامبو للقشرة", type: "products", kinds: ["shampoo"], concerns: ["dandruff"], rel: "شامبو|shampoo" },
    { q: "شعري يطيح هواي", type: "products", area: "hair", concerns: ["hairloss"] },
    { q: "شامبو وبلسم للشعر الجاف", type: "products", area: "hair", concerns: ["dry_hair"], rel: "شامبو|shampoo|بلسم|condition" },
    { q: "ماسك للشعر المصبوغ", type: "products", kinds: ["hair_mask"], concerns: ["colored"], rel: "ماسك|mask|masque|حمام" },
    { q: "زيت ارغان للشعر", type: "products", kinds: ["hair_oil"], rel: "زيت|oil|ارغان|argan" },
    { q: "سيروم للشعر الهايش", type: "products", kinds: ["hair_serum"], concerns: ["frizz"], rel: "سيروم|serum|زيت|oil" },
    { q: "بخاخ حماية من الحرارة للشعر", type: "products", area: "hair", rel: "حراره|heat|حمايه|protect|بخاخ|spray|thermo" },
    { q: "شعري تالف من الاستشوار", type: "products", area: "hair", concerns: ["damaged"] },
    { q: "شامبو بدون سلفات", type: "products", kinds: ["shampoo"], rel: "شامبو|shampoo" },
    { q: "فروة راسي دهنية", type: "products", area: "hair", concerns: ["oily_scalp"] },
    { q: "كريم للشعر الكيرلي", type: "products", area: "hair", concerns: ["frizz"], rel: "كريم|cream|curl|كيرل|تجعيد|مجعد|leave" },
    { q: "صبغة شعر بني", type: "products", kinds: ["hair_color"], rel: "صبغ|color|colour|لون|coloration" },
    { q: "شعري خشن ومنفوش", type: "products", area: "hair", concerns: ["frizz"] },
    { q: "اطراف شعري متقصفة", type: "products", area: "hair", concerns: ["damaged"] },
    { q: "حمام زيت للشعر", type: "products", area: "hair", kinds: ["hair_mask", "hair_oil"] },
    { q: "اريد شي يطول الشعر بسرعة", type: "products", area: "hair", concerns: ["hairloss"] },
    { q: "زيت اكليل الجبل للشعر", type: "products", area: "hair", rel: "اكليل|rosemary|روزماري|زيت|oil" },
    { q: "شعري ناشف ويتكسر", type: "products", area: "hair", concerns: ["dry_hair", "damaged"] },
    { q: "شعري يدهن بسرعة", type: "products", area: "hair", concerns: ["oily_scalp"] },
    { q: "راسي يحكني وبيه قشور", type: "products", area: "hair", concerns: ["dandruff"] },
    { q: "بلسم للشعر الناعم", type: "products", kinds: ["conditioner"], rel: "بلسم|condition|بلسم" },
  ]),

  ...section("makeup", [
    { q: "ماسكارا مقاومة للماء", type: "products", kinds: ["mascara"], rel: "ماسكارا|مسكارا|mascara" },
    { q: "كريم أساس للبشرة الدهنية", type: "products", kinds: ["foundation"], skinType: "oily", rel: "اساس|foundation|فاونديشن|bb|cc" },
    { q: "فاونديشن تغطية عالية", type: "products", kinds: ["foundation"], rel: "اساس|foundation|فاونديشن" },
    { q: "روج مطفي ثابت", type: "products", kinds: ["lipstick"], rel: "روج|lip|شفاه|احمر" },
    { q: "كونسيلر للهالات", type: "products", kinds: ["concealer"], rel: "كونسيلر|concealer|خافي|correct" },
    { q: "بودرة تثبيت", type: "products", kinds: ["powder"], rel: "بودر|powder" },
    { q: "برايمر للمسام", type: "products", kinds: ["primer"], rel: "برايمر|primer|قاعده" },
    { q: "هايلايتر", type: "products", kinds: ["highlighter"], rel: "هايلايت|highlight|illumin|هايلايتر" },
    { q: "بلاشر وردي", type: "products", kinds: ["blush"], rel: "بلاشر|blush|خدود|بلش" },
    { q: "آيلاينر سائل", type: "products", kinds: ["eyeliner"], rel: "لاينر|liner|كحل|kohl" },
    { q: "باليت ظلال عيون", type: "products", kinds: ["eyeshadow", "palette"], rel: "ظلال|shadow|باليت|palette|ظل" },
    { q: "قلم حواجب", type: "products", kinds: ["brow"], rel: "حواجب|brow|حاجب" },
    { q: "ملمع شفايف", type: "products", kinds: ["lip_gloss"], rel: "ملمع|gloss|قلوس|جلوس|lip oil" },
    { q: "مثبت مكياج", type: "products", kinds: ["setting_spray"], rel: "مثبت|setting|fix|spray|بخاخ" },
    { q: "فرشاة مكياج", type: "products", kinds: ["makeup_tool"], rel: "فرش|brush|اسفنج|sponge" },
    { q: "شي يخلي وجهي يلمع بالعرس", type: "products", area: "makeup", kinds: ["highlighter", "primer", "foundation", "setting_spray"] },
    { q: "حمرة خدود", type: "products", kinds: ["blush"], rel: "بلاشر|blush|خدود|بلش" },
    { q: "كحل اسود ثابت", type: "products", kinds: ["eyeliner"], rel: "كحل|kohl|liner|لاينر" },
    { q: "مناكير احمر", type: "products", kinds: ["nail_polish"], rel: "مناكير|nail|اظافر|طلاء" },
    { q: "مزيل طلاء الاظافر", type: "products", kinds: ["nail_care"], rel: "مزيل|remov|اظافر|nail" },
    { q: "اريد شي يغطي الحبوب بالمكياج", type: "products", area: "makeup", kinds: ["concealer", "foundation"] },
    { q: "تنت للشفايف والخدود", type: "products", kinds: ["tint"], rel: "تنت|tint" },
    { q: "رموشي قصيرة اريد اطولها بالمكياج", type: "products", kinds: ["mascara"], rel: "ماسكارا|مسكارا|mascara" },
    { q: "شي يخلي المكياج ما يسيح بالحر", type: "products", area: "makeup", kinds: ["setting_spray", "primer", "powder"] },
  ]),

  ...section("body", [
    { q: "لوشن للجسم للجلد الجاف", type: "products", kinds: ["body_lotion"], rel: "لوشن|lotion|كريم|cream|body|جسم|butter|زبده" },
    { q: "مقشر للجسم", type: "products", kinds: ["body_scrub"], rel: "مقشر|scrub|سكراب|تقشير" },
    { q: "شاور جل بريحة حلوة", type: "products", kinds: ["body_wash"], rel: "شاور|shower|wash|غسول|جل|gel" },
    { q: "كريم لعلامات التمدد", type: "products", concerns: ["stretch"], rel: "تمدد|stretch|تشقق|سترتش" },
    { q: "كريم يدين", type: "products", kinds: ["hand_cream"], rel: "يد|hand|ايدي" },
    { q: "زيت للجسم", type: "products", kinds: ["body_oil"], rel: "زيت|oil" },
    { q: "كعب رجلي متشقق", type: "products", area: "body", rel: "قدم|كعب|تشقق|foot|feet|heel|رجل|crack|يوريا|urea" },
    { q: "ريحة ابطي مو حلوة", type: "products", kinds: ["deodorant"], rel: "deodorant|مزيل|roll|رول|ديودرنت|antiperspirant" },
    { q: "ايدي جافة من الشتاء", type: "products", area: "body", rel: "يد|hand|ايدي" },
  ]),

  ...section("routine", [
    { q: "روتين كامل للبشرة الجافة", type: "routine", area: "skin", skinType: "dry" },
    { q: "روتين للبشرة الدهنية والحبوب", type: "routine", area: "skin", skinType: "oily", concerns: ["acne"] },
    { q: "روتين مسائي للبشرة", type: "routine", area: "skin" },
    { q: "لوك سهرة كامل بـ 60 ألف", type: "routine", area: "makeup" },
    { q: "مكياج عروس كامل", type: "routine", area: "makeup" },
    { q: "روتين للشعر الجاف", type: "routine", area: "hair", concerns: ["dry_hair"] },
    { q: "شنو الخطوات الي احتاجها لبشرتي المختلطة", type: "routine", area: "skin", skinType: "combination" },
    { q: "روتين للتصبغات", type: "routine", area: "skin", concerns: ["pigment"] },
    { q: "روتين لتساقط الشعر", type: "routine", area: "hair", concerns: ["hairloss"] },
    { q: "اريد ابدي اعتني ببشرتي من الصفر", type: "routine", area: "skin" },
  ]),

  ...section("dupe", [
    { q: "عطر يشبه باكارات بس أرخص", type: "similar" },
    { q: "بديل أرخص لسوفاج", type: "similar" },
    { q: "عطر مثل ديور سوفاج", type: "similar" },
    { q: "شي يشبه بلاك اوبيوم", type: "similar" },
    { q: "عطر قريب من لا في است بيل", type: "similar" },
    { q: "smells like baccarat rouge", type: "similar" },
    { q: "بديل لعطر شانيل كوكو مدموزيل", type: "similar" },
    { q: "عطر ريحته مثل غود غيرل", type: "similar" },
    { q: "dupe for ysl libre", type: "similar" },
  ]),

  ...section("budget", [
    { q: "هدية لأمي بحدود 50 ألف", type: "products", maxPrice: 50000 },
    { q: "ارخص واقي شمس", type: "products", kinds: ["sunscreen"], rel: "واقي|sun|spf|شمس" },
    { q: "عطر تحت 30 الف", type: "products", area: "fragrance", maxPrice: 30000, rel: PERFUME },
    { q: "سيروم بين 10 و 20 الف", type: "products", kinds: ["serum"], minPrice: 10000, maxPrice: 20000, rel: "سيروم|serum|امبول|ampoule" },
    { q: "هدية لصديقتي", type: "products" },
    { q: "عطر هدية لزوجي بحدود 100 الف", type: "products", area: "fragrance", gender: "men", maxPrice: 100000, rel: PERFUME },
    { q: "شنو عندكم عروض على العطور", type: "products", area: "fragrance" },
    { q: "ماسكارا رخيصة وحلوة", type: "products", kinds: ["mascara"], rel: "ماسكارا|مسكارا|mascara" },
    { q: "عطر لابوي هدية", type: "products", area: "fragrance", gender: "men", rel: PERFUME },
  ]),

  ...section("typo", [
    { q: "شامبوا للقشره", type: "products", kinds: ["shampoo"], concerns: ["dandruff"], rel: "شامبو|shampoo" },
    { q: "ماسكرا", type: "products", kinds: ["mascara"], rel: "ماسكارا|مسكارا|mascara" },
    { q: "فاونديشين", type: "products", kinds: ["foundation"], rel: "اساس|foundation|فاونديشن" },
    { q: "سيرم للحبوب", type: "products", kinds: ["serum"], concerns: ["acne"], rel: "سيروم|serum|امبول|ampoule" },
    { q: "واقي شمش", type: "products", kinds: ["sunscreen"], rel: "واقي|sun|spf|شمس" },
    { q: "مرتب للوجه", type: "products", kinds: ["moisturizer", "face_cream"], rel: "مرطب|moistur|كريم|cream|hydra" },
    { q: "بلسن للشعر", type: "products", kinds: ["conditioner"], rel: "بلسم|condition" },
    { q: "هايلايتير", type: "products", kinds: ["highlighter"], rel: "هايلايت|highlight|illumin" },
    { q: "كونسيلار", type: "products", kinds: ["concealer"], rel: "كونسيلر|concealer|خافي|correct" },
  ]),

  ...section("knowledge", [
    { q: "شنو فائدة النياسيناميد؟", type: "knowledge" },
    { q: "اقدر استخدم الريتينول ويه فيتامين سي؟", type: "knowledge" },
    { q: "شلون أعرف نوع بشرتي؟", type: "knowledge" },
    { q: "شلون أثبّت العطر أطول؟", type: "knowledge" },
    { q: "الفرق بين بارفان وتواليت شنو", type: "knowledge" },
    { q: "شلون ارتب الروتين مالتي", type: "knowledge" },
    { q: "ليش شعري يطيح هواي", type: "knowledge" },
    { q: "شنو الكلف", type: "knowledge" },
    { q: "what does hyaluronic acid do", type: "knowledge" },
  ]),

  ...section("chat", [
    { q: "مرحبا", type: "chat" },
    { q: "شكرا حبيبتي", type: "chat" },
    { q: "منو انتي", type: "chat" },
  ]),

];

/** أسئلة محجوزة كُتبت قبل الجولة الأخيرة من التحسين ولم يُضبط عليها شيء. */
const HOLDOUT_RAW: (Raw & { tag: string })[] = [
  { tag: "perfume", q: "عطر نسائي حلو وثابت للشتا", type: "products", area: "fragrance", gender: "women", rel: PERFUME },
  { tag: "perfume", q: "ريحة فخمة لزوجي بالمناسبات", type: "products", area: "fragrance", gender: "men", rel: PERFUME },
  { tag: "perfume", q: "عطر خفيف للجامعة", type: "products", area: "fragrance", rel: PERFUME },
  { tag: "perfume", q: "عطر بيه ريحة عود ومسك", type: "products", area: "fragrance", families: ["oud", "musk"], rel: PERFUME },
  { tag: "perfume", q: "عطر ريحته فواكه وزهور", type: "products", area: "fragrance", families: ["fruity", "floral"], rel: PERFUME },
  { tag: "perfume", q: "اريد عطر ريحته منعشة مثل البحر", type: "products", area: "fragrance", families: ["aquatic", "fresh"], rel: PERFUME },
  { tag: "perfume", q: "معطر جسم بريحة الفانيلا", type: "products", kinds: ["mist"], families: ["vanilla"] },
  { tag: "perfume", q: "عطر رجالي حار", type: "products", area: "fragrance", gender: "men", families: ["spicy"], rel: PERFUME },
  { tag: "perfume", q: "عطر لاختي عيد ميلادها", type: "products", area: "fragrance", gender: "women", rel: PERFUME },
  { tag: "perfume", q: "men perfume woody", type: "products", area: "fragrance", gender: "men", families: ["woody"], rel: PERFUME },
  { tag: "skin", q: "كريم مرطب للوجه الجاف", type: "products", kinds: ["moisturizer", "face_cream"], skinType: "dry", rel: "مرطب|moistur|كريم|cream|hydra" },
  { tag: "skin", q: "غسول للحبوب والرؤوس السوداء", type: "products", kinds: ["cleanser"], concerns: ["acne", "pores"], rel: "غسول|cleans|wash|منظف|جل|foam|فوم" },
  { tag: "skin", q: "سيروم للتجاعيد", type: "products", kinds: ["serum"], concerns: ["aging"], rel: "سيروم|serum|امبول|ampoule" },
  { tag: "skin", q: "واقي شمس للبشرة الجافة", type: "products", kinds: ["sunscreen"], skinType: "dry", rel: "واقي|sun|spf|شمس" },
  { tag: "skin", q: "بشرتي حساسة وتتهيج بسرعة", type: "products", area: "skin", skinType: "sensitive" },
  { tag: "skin", q: "عندي بقع داكنة وتصبغات", type: "products", area: "skin", concerns: ["pigment"] },
  { tag: "skin", q: "كريم للهالات وانتفاخ العيون", type: "products", concerns: ["dark_circles"], rel: "عين|عيون|eye|هالات" },
  { tag: "skin", q: "تونر للبشرة الجافة", type: "products", kinds: ["toner"], skinType: "dry", rel: "تونر|toner|tonique|لوشن" },
  { tag: "skin", q: "ماسك للوجه للتنظيف العميق", type: "products", kinds: ["face_mask"], rel: "ماسك|mask|قناع|طين|clay" },
  { tag: "skin", q: "مسامات وجهي مفتوحة", type: "products", area: "skin", concerns: ["pores"] },
  { tag: "skin", q: "moisturizer for oily skin", type: "products", kinds: ["moisturizer", "face_cream"], skinType: "oily", rel: "مرطب|moistur|كريم|cream|جل|gel|hydra" },
  { tag: "skin", q: "بشرتي مختلطة شنو يناسبها", type: "products", area: "skin", skinType: "combination" },
  { tag: "hair", q: "شامبو للشعر الدهني", type: "products", kinds: ["shampoo"], concerns: ["oily_scalp"], rel: "شامبو|shampoo" },
  { tag: "hair", q: "ماسك للشعر التالف", type: "products", kinds: ["hair_mask"], concerns: ["damaged"], rel: "ماسك|mask|masque|حمام" },
  { tag: "hair", q: "زيت للشعر الجاف", type: "products", kinds: ["hair_oil"], concerns: ["dry_hair"], rel: "زيت|oil" },
  { tag: "hair", q: "شعري يتساقط بعد الولادة", type: "products", area: "hair", concerns: ["hairloss"] },
  { tag: "hair", q: "بلسم للشعر المجعد", type: "products", kinds: ["conditioner"], concerns: ["frizz"], rel: "بلسم|condition" },
  { tag: "hair", q: "شامبو للشعر المصبوغ", type: "products", kinds: ["shampoo"], concerns: ["colored"], rel: "شامبو|shampoo" },
  { tag: "hair", q: "سيروم يقوي الشعر ويمنع التساقط", type: "products", area: "hair", concerns: ["hairloss"] },
  { tag: "hair", q: "conditioner for damaged hair", type: "products", kinds: ["conditioner"], concerns: ["damaged"], rel: "بلسم|condition" },
  { tag: "makeup", q: "كريم أساس للبشرة الجافة", type: "products", kinds: ["foundation"], skinType: "dry", rel: "اساس|foundation|فاونديشن|bb|cc" },
  { tag: "makeup", q: "روج احمر ثابت", type: "products", kinds: ["lipstick"], rel: "روج|lip|شفاه|احمر" },
  { tag: "makeup", q: "ماسكارا تكثف الرموش", type: "products", kinds: ["mascara"], rel: "ماسكارا|مسكارا|mascara" },
  { tag: "makeup", q: "ايلاينر مقاوم للماء", type: "products", kinds: ["eyeliner"], rel: "لاينر|liner|كحل|kohl" },
  { tag: "makeup", q: "بودرة للبشرة الدهنية", type: "products", kinds: ["powder"], skinType: "oily", rel: "بودر|powder" },
  { tag: "makeup", q: "ظلال عيون الوان ترابية", type: "products", kinds: ["eyeshadow", "palette"], rel: "ظلال|shadow|باليت|palette|ظل" },
  { tag: "makeup", q: "برونزر وكونتور", type: "products", kinds: ["bronzer"], rel: "برونزر|bronz|كونتور|contour" },
  { tag: "makeup", q: "مرطب شفايف ملون", type: "products", area: "skin", kinds: ["lip_care", "tint", "lip_gloss", "lipstick"] },
  { tag: "makeup", q: "lip gloss", type: "products", kinds: ["lip_gloss"], rel: "ملمع|gloss|قلوس|جلوس|lip oil" },
  { tag: "body", q: "مزيل عرق نسائي", type: "products", kinds: ["deodorant"], gender: "women", rel: "deodorant|مزيل|roll|رول|ديودرنت|antiperspirant" },
  { tag: "body", q: "لوشن جسم معطر", type: "products", kinds: ["body_lotion"], rel: "لوشن|lotion|كريم|cream|body|جسم|butter|زبده" },
  { tag: "body", q: "سكراب للجسم بالقهوة", type: "products", kinds: ["body_scrub"], rel: "مقشر|scrub|سكراب|تقشير" },
  { tag: "body", q: "كريم ايدين للجفاف", type: "products", kinds: ["hand_cream"], rel: "يد|hand|ايدي" },
  { tag: "routine", q: "روتين بشرة للحبوب", type: "routine", area: "skin", concerns: ["acne"] },
  { tag: "routine", q: "روتين يومي للبشرة العادية", type: "routine", area: "skin", skinType: "normal" },
  { tag: "routine", q: "روتين للشعر التالف", type: "routine", area: "hair", concerns: ["damaged"] },
  { tag: "routine", q: "مكياج يومي كامل", type: "routine", area: "makeup" },
  { tag: "dupe", q: "شي يشبه سوفاج بسعر اقل", type: "similar" },
  { tag: "dupe", q: "بديل لعطر بلاك اوبيوم", type: "similar" },
  { tag: "dupe", q: "عطر مشابه لليبر", type: "similar" },
  { tag: "budget", q: "عطر نسائي تحت 40 الف", type: "products", area: "fragrance", gender: "women", maxPrice: 40000, rel: PERFUME },
  { tag: "budget", q: "شامبو رخيص للقشرة", type: "products", kinds: ["shampoo"], concerns: ["dandruff"], rel: "شامبو|shampoo" },
  { tag: "budget", q: "هدية لزوجتي بحدود 75 الف", type: "products", maxPrice: 75000 },
  { tag: "typo", q: "ماسكره ضد الماي", type: "products", kinds: ["mascara"], rel: "ماسكارا|مسكارا|mascara" },
  { tag: "typo", q: "شامبوو للتساقط", type: "products", kinds: ["shampoo"], concerns: ["hairloss"], rel: "شامبو|shampoo" },
  { tag: "typo", q: "سيروووم فيتامين سي", type: "products", kinds: ["serum"], rel: "سيروم|serum|فيتامين|vitamin" },
  { tag: "knowledge", q: "شنو فائدة الريتينول", type: "knowledge" },
  { tag: "knowledge", q: "شلون استخدم واقي الشمس صح", type: "knowledge" },
  { tag: "knowledge", q: "شنو الفرق بين السيروم والمرطب", type: "knowledge" },
  { tag: "chat", q: "هلا ديما", type: "chat" },
];

export const HOLDOUT_CASES: EvalCase[] = HOLDOUT_RAW.map(({ tag, ...c }) => ({ ...c, tag, split: "holdout" }));
