#!/usr/bin/env python3
"""Generate batch6-meta-defs.json with 50 product definitions."""
import json
import re
from collections import OrderedDict

OUT = "/Users/cloud/.cursor/worktrees/full-app/puf/catalog-hub/scripts/batch6-meta-defs.json"
LATIN = re.compile(r"[a-zA-Z]")

ORDER = [
    "3337871324599", "773602710683", "3606000537699", "850045076085", "689304348423",
    "072140020491", "3337875722827", "3337875597395", "381371020652", "3760294351178",
    "3606000534919", "8011003872077", "614514410103", "689304188890", "7640111502791",
    "8057971188727", "3614228899376", "3616303048181", "3337875583626", "8018365500037",
    "3614228954051", "8011003858552", "3700550216094", "3337875597357", "3274872448780",
    "3355992004596", "3760294350881", "3614274017069", "8809913830641", "681619815997",
    "3346130018926", "8809576261868", "3614274217155", "3614274217148", "855732733210",
    "5060150185168", "8809875906477", "3349668614523", "3700134403957", "602004146151",
    "072140634827", "888066024082", "088300162543", "783320411168", "3386460126014",
    "8681008055258", "607845070085", "8681008055074", "8683608070617", "8683608070594",
]

PRODUCTS = {}

def add(bc, obj):
    PRODUCTS[bc] = obj

# 1 Vichy deodorant
add("3337871324599", {
    "brandEn": "Vichy", "nameEn": "Vichy 48H Anti-Perspirant Roll-On 50ml", "kind": "care",
    "careLeaf": "care/skin-and-body-care/deodorant", "typeKey": "deodorant",
    "c": {
        "introEn": "Vichy 48H Anti-Perspirant Roll-On delivers long-lasting sweat and odour protection with a dermatologist-tested formula.",
        "introAr": "مزيل عرق فيشي رول يوفر حماية طويلة من التعرق والرائحة بتركيبة مختبرة طبياً.",
        "catEn": "Body care", "catAr": "العناية بالجسم",
        "typeEn": "Anti-perspirant roll-on", "typeAr": "مزيل عرق رول",
        "benefitsEn": ["48-hour protection", "Anti-perspirant action", "Dermatologist tested"],
        "benefitsAr": ["حماية 48 ساعة", "مضاد للتعرق", "مختبر طبياً"],
        "suitEn": "Daily underarm care", "suitAr": "العناية اليومية تحت الإبط",
        "sizeEn": "50 ml", "sizeAr": "50 مل",
    },
})

# 2 MAC Fix+
add("773602710683", {
    "brandEn": "MAC", "nameEn": "MAC Fix+ Setting Spray 100ml", "kind": "makeup", "makeupSub": "face",
    "m": {
        "introEn": "MAC Fix+ Setting Spray is the iconic alcohol-free mist that sets makeup, refreshes skin, and boosts foundation wear.",
        "introAr": "مثبت ماك رذاذ خالٍ من الكحول يثبت المكياج وينعش البشرة ويطيل ثبات الأساس.",
        "typeEn": "Setting spray", "typeAr": "مثبت مكياج",
        "benefitsEn": ["Sets makeup", "Alcohol-free formula", "Multitasking mist"],
        "benefitsAr": ["يثبت المكياج", "خالٍ من الكحول", "رذاذ متعدد الاستخدام"],
        "suitEn": "All skin types and makeup looks", "suitAr": "جميع أنواع البشرة ومظاهر المكياج",
    },
})

# 3 CeraVe Hydrating Cleanser
add("3606000537699", {
    "brandEn": "CeraVe", "nameEn": "CeraVe Hydrating Facial Cleanser 355ml", "kind": "care",
    "careLeaf": "care/face-care/cleansers--toners", "typeKey": "cleanser",
    "c": {
        "introEn": "CeraVe Hydrating Facial Cleanser gently removes dirt and makeup while restoring the skin barrier with ceramides and hyaluronic acid.",
        "introAr": "غسول سيرافي المرطب ينظف بلطف ويزيل المكياج مع دعم حاجز البشرة بالسيراميد وحمض الهيالورونيك.",
        "catEn": "Derma face care", "catAr": "العناية بالوجه الطبية",
        "typeEn": "Hydrating cleanser", "typeAr": "غسول مرطب",
        "benefitsEn": ["Ceramides", "Hyaluronic acid", "Non-foaming gentle cleanse"],
        "benefitsAr": ["سيراميد", "حمض الهيالورونيك", "تنظيف لطيف"],
        "suitEn": "Normal to dry skin", "suitAr": "البشرة العادية إلى الجافة",
        "sizeEn": "355 ml", "sizeAr": "355 مل",
    },
})

# 4 Olaplex No.7
add("850045076085", {
    "brandEn": "Olaplex", "nameEn": "Olaplex No.7 Bonding Oil 30ml", "kind": "care",
    "careLeaf": "care/hair-care/hair-styling", "typeKey": "hair-oil",
    "c": {
        "introEn": "Olaplex No.7 Bonding Oil nourishes, adds brilliant shine, and protects hair from heat while strengthening bonds.",
        "introAr": "زيت تقوية الشعر رقم 7 يغذي الشعر ويمنحه لمعاناً ويحميه من الحرارة مع تقوية الروابط.",
        "catEn": "Hair care", "catAr": "العناية بالشعر",
        "typeEn": "Bonding hair oil", "typeAr": "زيت تقوية الشعر",
        "benefitsEn": ["Heat protection", "High shine", "Bond-building care"],
        "benefitsAr": ["حماية من الحرارة", "لمعان عالٍ", "تقوية روابط الشعر"],
        "suitEn": "All hair types needing shine and protection", "suitAr": "جميع أنواع الشعر",
        "sizeEn": "30 ml", "sizeAr": "30 مل",
    },
})

# 5 Anastasia Brow Freeze
add("689304348423", {
    "brandEn": "Anastasia Beverly Hills", "nameEn": "Anastasia Brow Freeze Wax 8g", "kind": "makeup", "makeupSub": "face",
    "m": {
        "introEn": "Anastasia Brow Freeze Wax locks brows in place with a clear, long-wearing formula for sculpted, laminated-style definition.",
        "introAr": "شمع انستازيا للحواجب يثبتها بتركيبة شفافة طويلة الثبات لتصفيف محدد ومرتب.",
        "typeEn": "Brow wax", "typeAr": "شمع حواجب",
        "benefitsEn": ["Strong hold", "Clear finish", "Sculpted brow look"],
        "benefitsAr": ["ثبات قوي", "لمسة شفافة", "حواجب مصففة"],
        "suitEn": "All brow shapes and makeup routines", "suitAr": "جميع أشكال الحواجب",
    },
})

# 6 Eucerin Advanced Repair Cream
add("072140020491", {
    "brandEn": "Eucerin", "nameEn": "Eucerin Advanced Repair Cream 454g", "kind": "care",
    "careLeaf": "care/skin-and-body-care/body-moisturizer", "typeKey": "body-cream",
    "c": {
        "introEn": "Eucerin Advanced Repair Cream is a rich, fragrance-free moisturizer clinically proven to relieve very dry, rough skin.",
        "introAr": "كريم يوسيرين للإصلاح المتقدم مرطب غني خالٍ من العطر مثبت سريرياً لتهدئة البشرة شديدة الجفاف.",
        "catEn": "Body care", "catAr": "العناية بالجسم",
        "typeEn": "Repair body cream", "typeAr": "كريم إصلاح للجسم",
        "benefitsEn": ["Advanced repair", "Fragrance-free", "Long-lasting moisture"],
        "benefitsAr": ["إصلاح متقدم", "خالٍ من العطر", "ترطيب طويل"],
        "suitEn": "Very dry, rough body skin", "suitAr": "البشرة شديدة الجفاف والخشونة",
        "sizeEn": "454 g", "sizeAr": "454 جم",
    },
})

# 7 La Roche-Posay Effaclar Serum
add("3337875722827", {
    "brandEn": "La Roche-Posay", "nameEn": "La Roche-Posay Effaclar Serum 30ml", "kind": "care",
    "careLeaf": "care/face-care/face-moisturizer", "typeKey": "serum",
    "c": {
        "introEn": "La Roche-Posay Effaclar Serum targets blemishes and refines pores with a gentle exfoliating formula for clearer skin.",
        "introAr": "سيروم لاروش بوزيه إيفاكلار يستهدف الشوائب ويصغّر المسام بتركيبة تقشير لطيفة لبشرة أوضح.",
        "catEn": "Derma face care", "catAr": "العناية بالوجه الطبية",
        "typeEn": "Blemish serum", "typeAr": "سيروم للشوائب",
        "benefitsEn": ["Refines pores", "Reduces blemishes", "Dermatologist tested"],
        "benefitsAr": ["تصغير المسام", "تقليل الشوائب", "مختبر طبياً"],
        "suitEn": "Oily and blemish-prone skin", "suitAr": "البشرة الدهنية والمعرضة للشوائب",
        "sizeEn": "30 ml", "sizeAr": "30 مل",
    },
})

# 8 CeraVe Moisturising Lotion
add("3337875597395", {
    "brandEn": "CeraVe", "nameEn": "CeraVe Moisturising Lotion 473ml", "kind": "care",
    "careLeaf": "care/skin-and-body-care/body-moisturizer", "typeKey": "body-cream",
    "c": {
        "introEn": "CeraVe Moisturising Lotion delivers lightweight, all-day hydration with essential ceramides for face and body.",
        "introAr": "لوشن سيرافي المرطب يوفر ترطيباً خفيفاً طوال اليوم بالسيراميد الأساسي للوجه والجسم.",
        "catEn": "Body care", "catAr": "العناية بالجسم",
        "typeEn": "Moisturising lotion", "typeAr": "لوشن مرطب",
        "benefitsEn": ["Ceramides", "Lightweight hydration", "Face and body use"],
        "benefitsAr": ["سيراميد", "ترطيب خفيف", "للوجه والجسم"],
        "suitEn": "Normal to dry skin", "suitAr": "البشرة العادية إلى الجافة",
        "sizeEn": "473 ml", "sizeAr": "473 مل",
    },
})

# 9 Johnson's Oil Gel
add("381371020652", {
    "brandEn": "Johnson's", "nameEn": "Johnson's Shea & Cocoa Butter Oil Gel 192ml", "kind": "care",
    "careLeaf": "care/skin-and-body-care/body-moisturizer", "typeKey": "body-oil",
    "c": {
        "introEn": "Johnson's Shea & Cocoa Butter Oil Gel nourishes dry skin with a rich blend of shea and cocoa butter in a lightweight gel-oil texture.",
        "introAr": "زيت جل جونسون بالشيا وزبدة الكاكاو يغذي البشرة الجافة بمزيج غني بلمسة زيتية خفيفة.",
        "catEn": "Body care", "catAr": "العناية بالجسم",
        "typeEn": "Body oil gel", "typeAr": "زيت جل للجسم",
        "benefitsEn": ["Shea and cocoa butter", "Deep nourishment", "Non-greasy feel"],
        "benefitsAr": ["شيا وزبدة كاكاو", "تغذية عميقة", "لمسة غير دهنية"],
        "suitEn": "Dry body skin", "suitAr": "البشرة الجافة",
        "sizeEn": "192 ml", "sizeAr": "192 مل",
    },
})

# 10 The Woods Collection Natural Flame
add("3760294351178", {
    "brandEn": "The Woods Collection", "nameEn": "The Woods Collection Natural Flame Eau de Parfum 100ml", "kind": "perfume",
    "subs": {"gender": "women", "isNiche": True},
    "p": {
        "introEn": "The Woods Collection Natural Flame is a niche floral woody fragrance with warm, luminous notes inspired by natural elegance.",
        "introAr": "ناتشورال فليم من ذا وودز كوليكشن عطر نيش زهري خشبي دافئ بلمسة طبيعية أنيقة.",
        "familyEn": "Floral woody", "familyAr": "زهري خشبي",
        "notesEn": "Bergamot, jasmine, cedar, amber, musk", "notesAr": "برغموت، ياسمين، أرز، عنبر، مسك",
        "charEn": "Warm, radiant, and refined", "charAr": "دافئ ومشرق وأنيق",
        "bestEn": "Daily wear and special occasions", "bestAr": "الاستخدام اليومي والمناسبات",
        "longEn": "6–10 hours with good longevity", "longAr": "6–10 ساعات بثبات جيد",
    },
})

# 11 CeraVe Foaming Cleanser
add("3606000534919", {
    "brandEn": "CeraVe", "nameEn": "CeraVe Foaming Cleanser 237ml", "kind": "care",
    "careLeaf": "care/face-care/cleansers--toners", "typeKey": "cleanser",
    "c": {
        "introEn": "CeraVe Foaming Cleanser removes excess oil and impurities without disrupting the skin barrier, ideal for normal to oily skin.",
        "introAr": "غسول سيرافي الرغوي يزيل الزيوت الزائدة والشوائب دون الإخلال بحاجز البشرة للبشرة العادية والدهنية.",
        "catEn": "Derma face care", "catAr": "العناية بالوجه الطبية",
        "typeEn": "Foaming cleanser", "typeAr": "غسول رغوي",
        "benefitsEn": ["Oil control", "Ceramides", "Non-stripping cleanse"],
        "benefitsAr": ["تحكم بالزيوت", "سيراميد", "تنظيف دون جفاف"],
        "suitEn": "Normal to oily skin", "suitAr": "البشرة العادية إلى الدهنية",
        "sizeEn": "237 ml", "sizeAr": "237 مل",
    },
})

# 12 Versace Eros Parfum
add("8011003872077", {
    "brandEn": "Versace", "nameEn": "Versace Eros Parfum 100ml", "kind": "perfume", "subs": {"gender": "men"},
    "p": {
        "introEn": "Versace Eros Parfum is an intense masculine scent blending mint, vanilla, and woods for bold seductive appeal.",
        "introAr": "إيروس عطر مركز من فرزاتشي يمزج النعناع والفانيلا والأخشاب بجاذبية رجالية جريئة.",
        "familyEn": "Oriental woody", "familyAr": "شرقي خشبي",
        "notesEn": "Mint, green apple, vanilla, cedar, vetiver", "notesAr": "نعناع، تفاح أخضر، فانيلا، أرز، فيتيفر",
        "charEn": "Bold, sensual, and powerful", "charAr": "جريء وحسي وقوي",
        "bestEn": "Evening wear and special occasions", "bestAr": "السهرات والمناسبات",
        "longEn": "8–10 hours with strong projection", "longAr": "8–10 ساعات بثبات قوي",
    },
})

# 13 Rasasi Chastity
add("614514410103", {
    "brandEn": "Rasasi", "nameEn": "Rasasi Chastity Eau de Parfum 100ml", "kind": "perfume", "subs": {"gender": "women"},
    "p": {
        "introEn": "Rasasi Chastity is a feminine floral oriental fragrance with soft powdery notes and elegant lasting warmth.",
        "introAr": "شاستيتي من الرصاصي عطر نسائي زهري شرقي بنوتات ناعمة ودفء أنيق.",
        "familyEn": "Floral oriental", "familyAr": "زهري شرقي",
        "notesEn": "Rose, jasmine, musk, amber, vanilla", "notesAr": "ورد، ياسمين، مسك، عنبر، فانيلا",
        "charEn": "Soft, elegant, and feminine", "charAr": "ناعم وأنيق وأنثوي",
        "bestEn": "Daily wear and special occasions", "bestAr": "الاستخدام اليومي والمناسبات",
        "longEn": "6–10 hours with good longevity", "longAr": "6–10 ساعات بثبات جيد",
    },
})

# 14 Anastasia Nouveau Palette
add("689304188890", {
    "brandEn": "Anastasia Beverly Hills", "nameEn": "Anastasia Nouveau Palette 12 shades", "kind": "makeup", "makeupSub": "eyes",
    "m": {
        "introEn": "Anastasia Nouveau Palette features 12 versatile eyeshadow shades in matte and shimmer finishes for modern eye looks.",
        "introAr": "باليت انستازيا نوفو يضم 12 ظل عيون متعددة الاستخدام بلمسات مطفية ولامعة.",
        "typeEn": "Eyeshadow palette", "typeAr": "باليت ظلال عيون",
        "benefitsEn": ["12 versatile shades", "Matte and shimmer", "Blendable formula"],
        "benefitsAr": ["12 لوناً متعدد", "مطفي ولامع", "قابل للدمج"],
        "suitEn": "Everyday and evening eye makeup", "suitAr": "مكياج العيون اليومي والمسائي",
    },
})

# 15 Lalique Encre Noire Extreme
add("7640111502791", {
    "brandEn": "Lalique", "nameEn": "Lalique Encre Noire Extreme Eau de Parfum 100ml", "kind": "perfume", "subs": {"gender": "men"},
    "p": {
        "introEn": "Lalique Encre Noire Extreme deepens the iconic vetiver scent with smoky cypress and dark woods for a bold masculine statement.",
        "introAr": "إنكر نوار إكستريم من lalique يعمّق نفحات الفitiver الأسطورية بأخشاب داكنة ولمسة مدخنة لحضور رجali قوي.",
        "familyEn": "Woody aromatic", "familyAr": "خشبي عطري",
        "notesEn": "Vetiver, cypress, cashmere wood, musk", "notesAr": "فيتيفr، سرو، خشb ناعm، مسk",
        "charEn": "Dark, smoky, and sophisticated", "charAr": "داكن ومدخن ومتقن",
        "bestEn": "Evening and formal wear", "bestAr": "السهرات والمناسبات الرسمية",
        "longEn": "8–10 hours with moderate to strong projection", "longAr": "8–10 ساعات بثبات متوسط إلى قوي",
    },
})

# __PART2__

# 16 D&G The One Gold
add("8057971188727", {"brandEn":"Dolce & Gabbana","nameEn":"Dolce & Gabbana The One Gold Eau de Parfum Intense 100ml","kind":"perfume","subs":{"gender":"men","isNew":True},"p":{"introEn":"Dolce & Gabbana The One Gold EDP Intense is a rich amber-spiced masculine fragrance with opulent golden warmth.","introAr":"ذا ون قold عطر رجali جديد غni بالعنبر والتوابل بدfء ذهbi فاخr.","familyEn":"Amber spicy","familyAr":"عنبر حار","notesEn":"Ginger, amber, tobacco, cedar, vanilla","notesAr":"زنجبيل، عنبر، تبغ، أrز، فانيلa","charEn":"Opulent, warm, and seductive","charAr":"فاخr وdافئ وآsr","bestEn":"Evening and special occasions","bestAr":"السهرات والمناسبات","longEn":"8–10 hours with strong projection","longAr":"8–10 ساعات بثبات قوي"}})

# 17 Roberto Cavalli Paradise Found 75ml
add("3614228899376", {"brandEn":"Roberto Cavalli","nameEn":"Roberto Cavalli Paradise Found Eau de Toilette 75ml","kind":"perfume","subs":{"gender":"women"},"p":{"introEn":"Roberto Cavalli Paradise Found is a tropical floral fragrance evoking sun-kissed paradise with fruity luminous notes.","introAr":"باراداises فaund عطر نسaiي زhري استوaiي يevok جنة مشmsة.","familyEn":"Floral fruity","familyAr":"زhري فاكhي","notesEn":"Passion fruit, jasmine, vanilla, sandalwood","notesAr":"فاكhة العاطفة، ياسmin، فانيلa، خشb الصندl","charEn":"Sunny, joyful, and feminine","charAr":"مشms ومbhج وأnثwi","bestEn":"Daily wear and special occasions","bestAr":"الاستخدام اليومي والمناسبات","longEn":"6–10 hours with good longevity","longAr":"6–10 ساعات بثبات جيد"}})

