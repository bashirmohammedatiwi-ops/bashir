/**
 * عطور مشهورة تُسأل عنها الزبونات كمرجع («ريحة تشبه باكارات») — بصمتها العطرية
 * (العائلات والجنس) تكفي لإيجاد بدائل من الكتالوج حتى لو لم يكن العطر نفسه متوفراً.
 */
export interface FamousScent {
  id: string;
  name: string;
  /** صيغ الكتابة الشائعة (مطبّعة بلا همزات وبالهاء بدل التاء المربوطة). */
  aliases: string[];
  gender: "women" | "men" | "unisex";
  families: string[];
  /** مكوّناته العطرية الأبرز (كما تُكتب في أوصاف المنتجات) — لقياس الشبه بالنوتات. */
  notes: string;
  /** سعره التقريبي بالدينار (لـ«بديل أرخص»). */
  price: number;
}

export const FAMOUS: FamousScent[] = [
  { id: "br540", name: "باكارات روج 540", aliases: ["باكارات", "بكارات", "بكرات", "baccarat", "baccarat rouge"], gender: "unisex", families: ["sweet", "woody", "oriental"], notes: "زعفران ياسمين عنبر خشب الارز امبروود صمغ saffron amber jasmine cedar", price: 450000 },
  { id: "sauvage", name: "سوفاج", aliases: ["سوفاج", "سافاج", "سوفاش", "sauvage"], gender: "men", families: ["fresh", "spicy", "woody"], notes: "برغموت فلفل امبروكسان لافندر خشب الارز bergamot pepper ambroxan lavender", price: 190000 },
  { id: "black_opium", name: "بلاك أوبيوم", aliases: ["بلاك اوبيوم", "اوبيوم", "black opium"], gender: "women", families: ["sweet", "coffee", "vanilla"], notes: "قهوه فانيلا ياسمين زهر البرتقال باتشولي coffee vanilla jasmine", price: 160000 },
  { id: "lveb", name: "لا في إي بيل", aliases: ["لافي ايست بيل", "لا في ايست بيل", "لا في است بيل", "لافي است بيل", "لافي اي بيل", "لافي", "la vie est belle"], gender: "women", families: ["sweet", "fruity", "vanilla"], notes: "ايريس سوسن برالين فانيلا كشمش باتشولي iris praline vanilla", price: 170000 },
  { id: "good_girl", name: "جود جيرل", aliases: ["قود قيرل", "جود جيرل", "كود كيرل", "good girl"], gender: "women", families: ["sweet", "floral", "coffee"], notes: "تونكا كاكاو ياسمين مسك لوز tuberose tonka cocoa jasmine", price: 170000 },
  { id: "coco_mad", name: "كوكو مادموزيل", aliases: ["كوكو مادموزيل", "كوكو مدموزيل", "مادموزيل", "coco mademoiselle"], gender: "women", families: ["fresh", "floral", "musk"], notes: "برتقال ورد باتشولي فيتيفر مسك orange rose patchouli", price: 220000 },
  { id: "bleu", name: "بلو دو شانيل", aliases: ["بلو دي شانيل", "بلو دو شانيل", "بلو شانيل", "bleu de chanel"], gender: "men", families: ["fresh", "woody", "aquatic"], notes: "جريب فروت بخور زنجبيل صندل خشب الارز grapefruit incense ginger sandalwood", price: 200000 },
  { id: "aventus", name: "أفينتوس", aliases: ["افنتوس", "افينتوس", "اڤنتوس", "aventus"], gender: "men", families: ["fruity", "woody", "fresh"], notes: "اناناس بتولا كشمش مسك عنبر خشب البلوط pineapple birch blackcurrant", price: 600000 },
  { id: "oud_wood", name: "عود وود", aliases: ["عود وود", "oud wood"], gender: "unisex", families: ["oud", "woody", "spicy"], notes: "عود صندل هيل فلفل تونكا فيتيفر oud sandalwood cardamom", price: 420000 },
  { id: "tobacco_vanille", name: "توباكو فانيلا", aliases: ["توباكو فانيلا", "توباكو فانيل", "tobacco vanille", "tobacco vanilla"], gender: "unisex", families: ["vanilla", "spicy", "sweet"], notes: "تبغ فانيلا كاكاو تونكا قرفه فواكه مجففه tobacco vanilla cocoa", price: 420000 },
  { id: "acqua_gio", name: "أكوا دي جيو", aliases: ["اكوا دي جيو", "اكوا دجيو", "aqua di gio", "acqua di gio"], gender: "men", families: ["fresh", "aquatic"], notes: "بحريه برغموت ليمون ياسمين خشب marine bergamot lemon", price: 150000 },
  { id: "one_million", name: "ون مليون", aliases: ["ون مليون", "وان مليون", "1 مليون", "1 million", "one million"], gender: "men", families: ["sweet", "spicy", "leather"], notes: "قرفه جلد عنبر نعناع جريب فروت ورد cinnamon leather amber", price: 150000 },
  { id: "invictus", name: "إنفكتوس", aliases: ["انفكتوس", "انفيكتوس", "invictus"], gender: "men", families: ["fresh", "aquatic", "woody"], notes: "بحري جريب فروت غار عنبر جاياك marine grapefruit laurel", price: 140000 },
  { id: "jadore", name: "جادور", aliases: ["جادور", "جادوور", "jadore", "j adore"], gender: "women", families: ["floral", "fruity"], notes: "ياسمين ورد يلانغ كمثرى ماغنوليا jasmine rose ylang pear", price: 220000 },
  { id: "miss_dior", name: "مس ديور", aliases: ["مس ديور", "ميس ديور", "miss dior"], gender: "women", families: ["floral", "fresh"], notes: "ورد فاوانيا مسك اللافندر rose peony musk", price: 200000 },
  { id: "libre", name: "ليبر", aliases: ["ليبر", "ليبري", "libre"], gender: "women", families: ["floral", "vanilla", "fresh"], notes: "لافندر زهر البرتقال فانيلا مسك ambergris lavender orange blossom vanilla", price: 180000 },
  { id: "bir_donna", name: "بورن إن روما", aliases: ["بورن ان روما", "بورن ان روم", "born in roma"], gender: "women", families: ["sweet", "vanilla", "floral"], notes: "فانيلا ياسمين كشمش خشب الكشمير vanilla jasmine cashmeran", price: 160000 },
  { id: "gucci_bloom", name: "قوتشي بلوم", aliases: ["قوتشي بلوم", "غوتشي بلوم", "gucci bloom"], gender: "women", families: ["floral"], notes: "ياسمين مسك الروم توبيروز jasmine tuberose", price: 160000 },
  { id: "ldbs", name: "لوف دونت بي شاي", aliases: ["لوف دونت بي شاي", "love dont be shy", "kilian love"], gender: "women", families: ["sweet", "floral", "vanilla"], notes: "زهر البرتقال مارشملو فانيلا مسك orange blossom marshmallow vanilla", price: 400000 },
  { id: "delina", name: "دلينا", aliases: ["دلينا", "ديلينا", "delina"], gender: "women", families: ["floral", "fruity"], notes: "ورد ليتشي راوند فانيلا مسك rose lychee rhubarb", price: 380000 },
  { id: "layton", name: "لايتون", aliases: ["لايتون", "ليتون", "layton"], gender: "men", families: ["spicy", "woody", "fresh", "vanilla"], notes: "تفاح لافندر فانيلا هيل باتشولي apple lavender vanilla cardamom", price: 370000 },
  { id: "erba_pura", name: "إربا بورا", aliases: ["اربا بورا", "اربا بيورا", "erba pura"], gender: "unisex", families: ["fruity", "sweet", "musk"], notes: "فواكه برتقال ليمون مسك فانيلا عنبر citrus fruits musk", price: 380000 },
  { id: "interlude", name: "إنترلود", aliases: ["انترلود", "انترلود مان", "interlude"], gender: "men", families: ["spicy", "oriental", "woody"], notes: "بخور لبان عنبر اوريغانو جلد frankincense amber oregano", price: 400000 },
  { id: "lost_cherry", name: "لوست شيري", aliases: ["لوست شيري", "لوست تشيري", "lost cherry"], gender: "unisex", families: ["fruity", "sweet"], notes: "كرز لوز مسكرات تونكا cherry almond liqueur", price: 450000 },
  { id: "wood_sage", name: "وود سيج آند سي سولت", aliases: ["وود سيج", "wood sage"], gender: "unisex", families: ["fresh", "woody", "aquatic"], notes: "مريميه ملح البحر عنبر sage sea salt ambrette", price: 200000 },
  { id: "eros", name: "إيروس", aliases: ["ايروس", "ايروز", "eros"], gender: "men", families: ["fresh", "sweet", "vanilla"], notes: "نعناع تفاح اخضر فانيلا تونكا mint green apple vanilla", price: 120000 },
  { id: "le_male", name: "لو مال", aliases: ["لو مال", "لي مال", "le male"], gender: "men", families: ["sweet", "fresh", "vanilla"], notes: "لافندر نعناع فانيلا تونكا lavender mint vanilla", price: 130000 },
  { id: "scandal", name: "سكاندال", aliases: ["سكاندال", "سكندال", "scandal"], gender: "women", families: ["sweet", "floral"], notes: "عسل غاردينيا ياسمين باتشولي honey gardenia", price: 150000 },
  { id: "angel", name: "أنجل", aliases: ["انجل موغلر", "انجل موجلر", "angel mugler"], gender: "women", families: ["sweet", "vanilla"], notes: "باتشولي كراميل فانيلا شوكولا patchouli caramel", price: 150000 },
  { id: "flowerbomb", name: "فلاور بومب", aliases: ["فلاور بومب", "فلاوربومب", "flowerbomb", "flower bomb"], gender: "women", families: ["floral", "sweet"], notes: "ياسمين ورد سحلبيه باتشولي فانيلا jasmine orchid patchouli", price: 170000 },
  { id: "kayali_vanilla", name: "كيالي فانيلا 28", aliases: ["كيالي", "kayali", "فانيلا 28"], gender: "women", families: ["vanilla", "sweet"], notes: "فانيلا سكر بني تونكا مسك vanilla brown sugar", price: 130000 },
  { id: "khamrah", name: "خمرة", aliases: ["خمره", "khamrah"], gender: "unisex", families: ["sweet", "spicy", "oriental"], notes: "قرفه تمر برالين فانيلا تونكا بخور cinnamon dates praline", price: 45000 },
  { id: "ofg", name: "عود فور جريتنس", aliases: ["عود فور قريتنس", "عود فور جريتنس", "oud for greatness"], gender: "unisex", families: ["oud", "spicy", "woody"], notes: "عود زعفران لافندر جوزة الطيب تبغ oud saffron nutmeg", price: 380000 },
  { id: "intense_cafe", name: "إنتنس كافيه", aliases: ["انتنس كافيه", "انتنس كافي", "intense cafe"], gender: "unisex", families: ["coffee", "floral", "sweet"], notes: "قهوه ورد فانيلا مسك عنبر coffee rose vanilla", price: 180000 },
  { id: "dior_homme", name: "ديور هوم", aliases: ["ديور هوم", "ديور اوم", "dior homme"], gender: "men", families: ["powdery", "woody", "floral"], notes: "ايريس كاكاو خشب جلد عنبر iris cocoa", price: 170000 },
  { id: "paradoxe", name: "برادا باراداكس", aliases: ["باراداكس", "برادوكس", "paradoxe"], gender: "women", families: ["floral", "musk", "sweet"], notes: "زهر البرتقال عنبر مسك نيرولي neroli amber musk", price: 170000 },
  { id: "interdit", name: "لانتردي", aliases: ["لانتردي", "لانتيردي", "انترديت", "linterdit", "l interdit"], gender: "women", families: ["floral", "woody"], notes: "مسك توبيروز فيتيفر باتشولي زهر البرتقال tuberose vetiver", price: 170000 },
  { id: "no5", name: "شانيل رقم 5", aliases: ["شانيل 5", "شانيل نمبر 5", "شانيل رقم 5", "chanel no 5", "chanel 5"], gender: "women", families: ["floral", "powdery"], notes: "الدهيدات ياسمين ورد صندل فانيلا aldehydes jasmine rose", price: 250000 },
  { id: "hacivat", name: "حاجيوات", aliases: ["حاجيوات", "هاسيفات", "hacivat"], gender: "unisex", families: ["fruity", "woody", "fresh"], notes: "اناناس برغموت باتشولي طحلب البلوط خشب pineapple bergamot oakmoss", price: 330000 },
  { id: "santal33", name: "سانتال 33", aliases: ["سانتال 33", "santal 33", "سنتال 33"], gender: "unisex", families: ["woody", "leather", "spicy"], notes: "صندل هيل بنفسج جلد papyrus sandalwood cardamom leather", price: 350000 },
];
