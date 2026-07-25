#!/usr/bin/env node
import { writeFileSync } from 'fs';

const pf = (introEn, introAr, familyEn, familyAr, notesEn, notesAr, charEn, charAr, bestEn, bestAr, longEn, longAr) =>
  ({ introEn, introAr, familyEn, familyAr, notesEn, notesAr, charEn, charAr, bestEn, bestAr, longEn, longAr });
const cf = (introEn, introAr, catEn, catAr, typeEn, typeAr, benefitsEn, benefitsAr, suitEn, suitAr, sizeEn, sizeAr) =>
  ({ introEn, introAr, catEn, catAr, typeEn, typeAr, benefitsEn, benefitsAr, suitEn, suitAr, sizeEn, sizeAr });
const mf = (introEn, introAr, typeEn, typeAr, benefitsEn, benefitsAr, suitEn, suitAr) =>
  ({ introEn, introAr, typeEn, typeAr, benefitsEn, benefitsAr, suitEn, suitAr });
const P = (brandEn, nameEn, subs, p) => ({ brandEn, nameEn, kind: 'perfume', subs, p });
const C = (brandEn, nameEn, careLeaf, typeKey, c) => ({ brandEn, nameEn, kind: 'care', careLeaf, typeKey, c });
const M = (brandEn, nameEn, makeupSub, m) => ({ brandEn, nameEn, kind: 'makeup', makeupSub, m });
const g = (brandEn, nameEn, subs, ...rest) => P(brandEn, nameEn, subs, pf(...rest));

const AR = {
  '737052352060': { brandAr: "هوغو بوس", nameSuffix: "بوتلد نايت أو دو تواليت 100 مل" },
  '8011530810023': { brandAr: "تروساردي", nameSuffix: "أومو أو دو تواليت 100 مل" },
  '7640163970029': { brandAr: "بنتلي", nameSuffix: "إنفينايت إنتنس أو دو بارفيوم 100 مل" },
  '3614274143751': { brandAr: "أرماني", nameSuffix: "أكوا دي جيو إليكسير أو دو بارفيوم 50 مل" },
  '737052041353': { brandAr: "هوغو بوس", nameSuffix: "فيم أو دو بارفيوم 75 مل" },
  '8690604111053': { brandAr: "فلورمار", nameSuffix: "محدد شفاه رقم 205" },
  '3348901786393': { brandAr: "ديور", nameSuffix: "أديكت بيربل جلو أو دو بارفيوم 50 مل" },
  '3348901786331': { brandAr: "ديور", nameSuffix: "أديكت روزي جلو أو دو بارفيوم 50 مل" },
  '3614221031735': { brandAr: "روبرتو كفالي", nameSuffix: "سبلنديد فانيلا أو دو بارفيوم 100 مل" },
  '3274872456341': { brandAr: "جيفنشي", nameSuffix: "لانتردي روج ألتيم أو دو بارفيوم 80 مل" },
  '3386460088190': { brandAr: "فان كليف", nameSuffix: "بوا دوري أو دو بارفيوم 75 مل" },
  '3614273673846': { brandAr: "أرماني", nameSuffix: "ماي واي فلورال أو دو بارفيوم 90 مل" },
  '3423222012700': { brandAr: "نارسيسو رودريغز", nameSuffix: "مسك نوار أو دو بارفيوم 100 مل" },
  '3581000018679': { brandAr: "نيكولاي", nameSuffix: "باتشولي إنتنس أو دو بارفيوم 100 مل" },
  '3386460066075': { brandAr: "بوشرون", nameSuffix: "كواتر بور فيم أو دو بارفيوم 100 مل" },
  '8005610328799': { brandAr: "قوتشي", nameSuffix: "راش أو دو تواليت 75 مل" },
  '3423478812154': { brandAr: "نارسيسو رودريغز", nameSuffix: "روز مسك إنتنس أو دو بارفيوم 100 مل" },
  '724120095653': { brandAr: "ثمين", nameSuffix: "عنبر روم أو دو بارفيوم 50 مل" },
  '3614274350753': { brandAr: "فالنتينو", nameSuffix: "دونا بورن إن روما إكسترا دوز بارفيوم 100 مل" },
  '3574661177137': { brandAr: "ليسترين", nameSuffix: "غسول فم بالنعناع المنعش 500 مل" },
  '3606000537460': { brandAr: "سيرافي", nameSuffix: "لوشن مرطب بعامل حماية 30 من الشمس" },
  '8051277318536': { brandAr: "ذا هاوس أوف عود", nameSuffix: "جريب بيرل أو دو بارفيوم 75 مل" },
  '8051277318642': { brandAr: "ذا هاوس أوف عود", nameSuffix: "جست بيفور أو دو بارفيوم 75 مل" },
  '8056669925897': { brandAr: "دولتشي غابانا", nameSuffix: "ذا ون فور من بارفيوم 100 مل" },
  '3616303445584': { brandAr: "كلوي", nameSuffix: "أو دي بارفيوم إنتنس 100 مل" },
  '3614272898301': { brandAr: "لانكوم", nameSuffix: "روز بيونيا أو دو بارفيوم 100 مل" },
  '5057566220828': { brandAr: "ريفولوشن", nameSuffix: "باليت ظلال عيون ريلودد" },
  '3614271717092': { brandAr: "إيف سان لوران", nameSuffix: "مزيل عرق واي ستيك 75 جم" },
  '7640111494027': { brandAr: "جريس", nameSuffix: "كابوتين أو دو تواليت 100 مل" },
  '3600524070113': { brandAr: "لوريال", nameSuffix: "برايمر لاب لتقليل المسام 30 مل" },
  '3605521651587': { brandAr: "ميزون مارجييلا", nameSuffix: "ريبليكا بيتش ووك أو دو تواليت 100 مل" },
  '30144224': { brandAr: "مايبيلين", nameSuffix: "ماسكارا لاش سينشنال فايروورك" },
  '3614272544444': { brandAr: "أرماني", nameSuffix: "كود أبسولو بور فيم أو دو بارفيوم 75 مل" },
  '3614225358463': { brandAr: "كالفن كلاين", nameSuffix: "ويمن أو دو بارفيوم 100 مل" },
  '3700134410542': { brandAr: "جي بارفوم", nameSuffix: "نعم أنا الملك أو دو بارفوم 100 مل" },
  '3770010614616': { brandAr: "إسينشيال بارفيومز", nameSuffix: "ذا مسك أو دو بارفيوم 100 مل" },
  '3348901426961': { brandAr: "ديور", nameSuffix: "جادور رولر بيرل أو دو بارفيوم 20 مل" },
  '769915194951': { brandAr: "ذا أوردينري", nameSuffix: "سيروم نياسيناميد 10% + زنك 1% 60 مل" },
  '8809634610027': { brandAr: "أكسيس واي", nameSuffix: "جل منظف بالكينوا 180 مل" },
  '783320403897': { brandAr: "بولغاري", nameSuffix: "من وود نيرولي أو دو بارفيوم 100 مل" },
  '3423222092245': { brandAr: "نارسيسو رودريغز", nameSuffix: "فور هير فور إفر أو دو بارفيوم 50 مل" },
  '3423222092252': { brandAr: "نارسيسو رودريغز", nameSuffix: "فور هير فور إفر أو دو بارفيوم 100 مل" },
  '8005610298894': { brandAr: "هوغو بوس", nameSuffix: "ذا سينت فور هير أو دو بارفيوم 50 مل" },
  '3386460057059': { brandAr: "بوشرون", nameSuffix: "بلاس فاندوم أو دو بارفيوم 100 مل" },
  '3614273604833': { brandAr: "جيورجيو أرماني", nameSuffix: "كود بارفيوم بور هوم 75 مل" },
  '764302316091': { brandAr: "شيا موشر", nameSuffix: "كريم شعر باور جرينز 237 مل" },
  '8033488153281': { brandAr: "زيرجوف", nameSuffix: "كاساموراتي جران بالو أو دو بارفيوم 100 مل" },
  '8681008055227': { brandAr: "نيشان", nameSuffix: "وولونج تشا أو دو بارفيوم 100 مل" },
  '3614222793458': { brandAr: "روبرتو كفالي", nameSuffix: "باراديسو أسولوتو أو دو بارفيوم 50 مل" },
  '3614272865235': { brandAr: "جيورجيو أرماني", nameSuffix: "أكوا دي جيو بروفوندو أو دو بارفيوم 125 مل" },
};

const D = {
  '737052352060': g("Hugo Boss", "Hugo Boss Bottled Night EDT 100ml", {"gender": "men"}, "Hugo Boss Bottled Night is a dark woody aromatic with birch, cardamom, and musk for confident evening masculinity.", "بوتلد نايت من هوغو بوس عطر خشبي عطري داكن بالخشب والهيل والمسك لأناقة رجالية مسائية واثقة.", "Floral amber", "زهري عنبري", "Pink pepper, jasmine, amber, vanilla, musk", "فلفل وردي، ياسمين، عنبر، فانيلا، مسك", "Warm, radiant, sophisticated", "دافئ ومتوهج وراقٍ", "Evening wear and cooler seasons", "السهرات والفصول الباردة", "7–9 hours with moderate sillage", "7–9 ساعات بثبات جيد"),
  '8011530810023': g("Trussardi", "Trussardi Uomo EDT 100ml", {"gender": "men"}, "Trussardi Uomo is a classic Italian aromatic scent with citrus, geranium, and woods for timeless masculine elegance.", "أومو من تروساردي عطر عطري إيطالي كلاسيكي بالليمون والجيرانيوم والأخشاب لأناقة رجالية خالدة.", "Amber aromatic", "عنبري عطري", "Mint, green apple, lemon, tonka bean, vanilla, amber, leather", "نعناع، تفاح أخضر، ليمون، فول التونكا، فانيلا، عنبر، جلد", "Bold, sensual, powerful", "جريء وحسي وقوي", "Night outs and special occasions", "الخروج الليلي والمناسبات", "8–10 hours with strong projection", "8–10 ساعات بثبات قوي"),
  '7640163970029': g("Bentley", "Bentley Infinite Intense EDP 100ml", {"gender": "men"}, "Bentley Infinite Intense is a rich woody amber with spicy warmth and luxurious depth for the modern gentleman.", "إنفينايت إنتنس من بنتلي عطر عنبري خشبي غني ودافئ وعميق يمنح الرجل حضوراً قوياً.", "Floral fruity", "زهري فواكه", "Bergamot, peach, rose, jasmine, musk, sandalwood", "برغموت، خوخ، ورد، ياسمين، مسك، صندل", "Soft, feminine, elegant", "ناعم وأنثوي وأنيق", "Daily wear and office", "الاستخدام اليومي والعمل", "6–8 hours", "6–8 ساعات"),
  '3614274143751': g("Armani", "Armani Acqua di Gio Elixir EDP 50ml", {"gender": "men", "isNew": true}, "Armani Acqua di Gio Elixir intensifies the iconic marine scent with deeper amber and patchouli in a concentrated elixir.", "أكوا دي جيو إليكسير من أرماني يعمق العطر البحري الأيقوني بعنبر وباتشولي أغنى بتركيز إليكسير.", "Woody aromatic", "خشبي عطري", "Cypress, vetiver, cashmere wood, musk, benzoin", "سرو، فيتيفر، خشب كاشمير، مسك، بنزوين", "Dark, smoky, refined", "داكن ودخاني ومصقول", "Evening wear and formal occasions", "السهرات والمناسبات الرسمية", "8–10 hours", "8–10 ساعات"),
  '737052041353': g("Hugo Boss", "Hugo Boss Femme EDP 75ml", {"gender": "women"}, "Hugo Boss Femme is an elegant floral fruity fragrance with mandarin, black currant, and jasmine for modern femininity.", "فيم من هوغو بوس عطر زهري فاكهة أنيق بالمندرين والكشمش والياسمين لأنوثة عصرية.", "Oriental amber", "شرقي عنبري", "Grapefruit, ginger, amber, tobacco, cedar", "جريفروت، زنجبيل، عنبر، تبغ، أرز", "Warm, luxurious, charismatic", "دافئ وفاخر وجذاب", "Evenings and cooler weather", "السهرات والطقس البارد", "7–9 hours", "7–9 ساعات"),
  '8690604111053': M("Flormar", "Flormar Lip Liner 205", "lips", mf("Flormar Lip Liner 205 defines and shapes lips with a smooth, long-wearing formula in a versatile rose shade.", "محدد شفاه رقم 205 من فلورمار يحدّد ويشكّل الشفاه بتركيبة ناعمة طويلة الثبات بلون وردي متعدد الاستخدام.", "Lip liner", "محدد شفاه", ["Precise definition", "Long-wearing", "Smooth glide"], ["تحديد دقيق", "ثبات طويل", "انزلاق ناعم"], "Defining and shaping lip contours", "تحديد وتشكيل ملامح الشفاه")),
  '3348901786393': g("Dior", "Dior Addict Purple Glow EDP 50ml", {"gender": "women"}, "Dior Addict Purple Glow is a luminous floral fruity scent with blackcurrant, rose, and musk for vibrant feminine charm.", "أديكت بيربل جلو من ديور عطر زهري فاكه مشع بالكشمش والورد والمسك لجذب أنثوي نابض.", "Floral fruity", "زهري فواكه", "Bergamot, tiare flower, coconut, jasmine, musk", "برغموت، زهر التيار، جوز الهند، ياسمين، مسك", "Tropical, sunny, joyful", "استوائي ومشمس ومبهج", "Summer days and vacations", "أيام الصيف والعطلات", "5–7 hours", "5–7 ساعات"),
  '3348901786331': g("Dior", "Dior Addict Rosy Glow EDP 50ml", {"gender": "women"}, "Dior Addict Rosy Glow is a soft floral musk with rose, raspberry, and vanilla for a radiant feminine aura.", "أديكت روزي جلو من ديور عطر زهري مسكي ناعم بالورد والتوت والفانيلا لهائة أنثوية مشعة.", "Floral", "زهري", "Pear, jasmine sambac, sandalwood, benzoin", "كمثرى، ياسمين، صندل، بنزوين", "Radiant, joyful, modern floral", "مشع ومبهج وزهري عصري", "Spring and daytime wear", "الربيع والنهار", "6–8 hours", "6–8 ساعات"),
  '3614221031735': g("Roberto Cavalli", "Roberto Cavalli Splendid Vanilla EDP 100ml", {"gender": "women"}, "Roberto Cavalli Splendid Vanilla wraps rich vanilla in white flowers and amber for opulent feminine warmth.", "سبلنديد فانيلا من روبرتو كفالي يلف الفانيلا بالزهور البيضاء والعنبر لدفء أنثوي فاخر.", "Aquatic woody", "مائي خشبي", "Lemon, rose, tarragon, cedar, musk", "ليمون، ورد، طرخون، أرز، مسك", "Fresh, clean, versatile", "منعش ونظيف ومتعدد", "Daily wear and warm weather", "الاستخدام اليومي والطقس الدافئ", "4–6 hours", "4–6 ساعات"),
  '3274872456341': g("Givenchy", "Givenchy L'Interdit Rouge Ultime EDP 80ml", {"gender": "women"}, "Givenchy L'Interdit Rouge Ultime is a bold tuberose-amber fragrance with blood orange and sandalwood for dramatic allure.", "لانتردي روج ألتيم من جيفنشي عطر جريء بالتيوبيوز والعنبر والبرتقال لجذبية درامية.", "Floral fruity", "زهري فواكه", "Bergamot, tiare, coconut, jasmine, musk", "برغموت، زهر التيار، جوز الهند، ياسمين، مسك", "Tropical, light, joyful", "استوائي وخفيف ومبهج", "Summer and casual wear", "الصيف والاستخدام اليومي", "4–6 hours", "4–6 ساعات"),
  '3386460088190': g("Van Cleef", "Van Cleef Bois Doré EDP 75ml", {"isUnisex": true, "isNiche": true}, "Van Cleef Bois Doré is a niche woody floral with mandarin, orange blossom, and cedar for refined unisex elegance.", "بوا دوري من فان كليف عطر نيش خشبي زهري بالمندرين وزهر البرتقال والأرز لأناقة راقية.", "Fruity floral", "فواكه زهرية", "Lemon, mandarin, apple, jasmine, musk", "ليمون، مندرين، تفاح، ياسمين، مسك", "Fresh, playful, sunny", "منعش ومرح ومشمس", "Daytime and summer", "النهار والصيف", "5–7 hours", "5–7 ساعات"),
  '3614273673846': g("Armani", "Armani My Way Floral EDP 90ml", {"gender": "women"}, "Armani My Way Floral celebrates blooming florals with bergamot, orange blossom, and vanilla for joyful femininity.", "ماي واي فلورال من أرماني يحتفي بالزهور المتفتحة والبرتقال والفانيلا لأنوثة مبتهجة.", "Gourmand woody", "غورماند خشبي", "Cognac, oak, cinnamon, praline, vanilla", "كونياك، بلوط، قرفة، حلوى البندق، فانيلا", "Warm, boozy, luxurious", "دافئ وفاخر وساحر", "Evenings and cold weather", "السهرات والطقس البارد", "8–10 hours", "8–10 ساعات"),
  '3423222012700': g("Narciso Rodriguez", "Narciso Rodriguez Musc Noir EDP 100ml", {"gender": "women"}, "Narciso Rodriguez Musc Noir is a sensual musk-floral with plum, heliotrope, and suede for mysterious femininity.", "مسك نوار من نارسيسو رودريغز عطر مسكي زهري حسي بالخوخ والهليوتروب والسيود لغموض أنثوي.", "Aromatic woody", "عطري خشبي", "Sage, narcissus, vetiver, cedar, patchouli", "مريمية، نرجس، فيتيفر، أرز، باتشولي", "Refined, modern, elegant", "راقٍ وعصري وأنيق", "Office and evening wear", "العمل والسهرات", "7–9 hours", "7–9 ساعات"),
  '3581000018679': g("Nicolai", "Nicolai Patchouli Intense EDP 100ml", {"isUnisex": true, "isNiche": true}, "Nicolai Patchouli Intense is a niche patchouli-centric scent with lavender, geranium, and amber for deep sophistication.", "باتشولي إنتنس من نيكولاي عطر نيش مركز على الباتشولي مع اللافندر والجيرانيوم والعنبر.", "Floral oriental", "زهري شرقي", "Peach, apricot, tuberose, jasmine, vanilla, musk", "خوخ، مشمش، تيوبروز، ياسمين، فانيلا، مسك", "Vibrant, sensual, classic", "نابض وحسي وكلاسيكي", "Evening wear and special occasions", "السهرات والمناسبات", "6–8 hours", "6–8 ساعات"),
  '3386460066075': g("Boucheron", "Boucheron Quatre EDP 100ml", {"gender": "women"}, "Boucheron Quatre is a modern floral fruity fragrance with apple, jasmine, and cedar for elegant everyday femininity.", "كواتر من بوشرون عطر زهري فاكه عصري بالتفاح والياسمين والأرز لأناقة يومية.", "Green woody", "أخضر خشبي", "Bergamot, green notes, cedar, vetiver, musk", "برغموت، نوتات خضراء، أرز، فيتيفر، مسك", "Fresh, natural, serene", "منعش وطبيعي وهادئ", "Daily wear for nature lovers", "الاستخدام اليومي", "6–8 hours", "6–8 ساعات"),
  '8005610328799': g("Gucci", "Gucci Rush EDT 75ml", {"gender": "women"}, "Gucci Rush is an iconic bold chypre floral with peach, gardenia, and patchouli for unforgettable feminine impact.", "راش من قوتشي عطر شيبري زهري جريء بالخوخ والجاردينيا والباتشولي لتأثير أنثوي لا يُنسى.", "Aromatic fougere", "عطري خشبي", "Pine, pink pepper, mineral notes, patchouli", "صنوبر، فلفل وردي، نوتات معدنية، باتشولي", "Crisp, atmospheric, unisex", "منعش وجوي ومتعدد", "Cool evenings and layering", "الأمسيات الباردة", "5–7 hours", "5–7 ساعات"),
  '3423478812154': g("Narciso Rodriguez", "Narciso Rodriguez Rose Musc EDP Intense 100ml", {"gender": "women"}, "Narciso Rodriguez Rose Musc Intense amplifies rose and musk with amber and patchouli for rich feminine depth.", "روز مسك إنتنس من نارسيسو رودريغز يعزز الورد والمسك مع العنبر والباتشولي لعمق أنثوي.", "Leather floral", "جلد زهري", "Iris, patchouli, leather, benzoin, vanilla", "سوسن، باتشولي، جلد، بنزوين، فانيلا", "Elegant, leathery, refined", "أنيق وجلدي ومصقول", "Fall/winter and formal wear", "الخريف والمناسبات", "8–10 hours", "8–10 ساعات"),
  '724120095653': g("Thameen", "Thameen Amber Room EDP 50ml", {"isUnisex": true, "isNiche": true}, "Thameen Amber Room is a niche amber-spice fragrance with cinnamon, benzoin, and oud for regal unisex warmth.", "عنبر روم من ثمين عطر نيش عنبري توابلي بالقرفة والبنزوين والعود لدفء ملكي.", "Amber spicy", "عنبري توابل", "Ginger, vanilla, lavender, woody amber", "زنجبيل، فانيلا، خزامى، عنبر خشبي", "Warm, modern, luxurious", "دافئ وعصري وفاخر", "Evenings and special occasions", "السهرات", "7–9 hours", "7–9 ساعات"),
  '3614274350753': g("Valentino", "Valentino Donna Born In Roma Extradose Parfum 100ml", {"gender": "women", "isNew": true}, "Valentino Donna Born In Roma Extradose is an intense vanilla-amber scent with jasmine and benzoin for bold femininity.", "دونا بورن إن روما إكسترا دوز من فالنتينو عطر فانيلا عنبري مكثف بالياسمين والبنزوين لأنوثة جريئة.", "Vanilla floral", "فانيلا زهري", "Jasmine, vanilla, benzoin, musk", "ياسمين، فانيلا، بنزوين، مسك", "Radiant, sweet, elegant", "مشع وحلو وأنيق", "Evening wear and dates", "السهرات والمناسبات", "7–9 hours", "7–9 ساعات"),
  '3574661177137': C("Listerine", "Listerine Cool Mint Mouthwash 500ml", "care/mouth--teeth-care/mouthwash", "mouthwash", cf("Listerine Cool Mint Mouthwash kills germs and freshens breath with a cooling mint formula for daily oral care.", "غسول فم ليسترين بالنعناع المنعش يقضي على الجراثيم وينعش الفم بتركيبة منعشة للعناية اليومية.", "Mouth care", "العناية بالفم", "Mouthwash", "غسول فم", ["Kills germs", "Fresh breath", "Cooling mint"], ["يقضي على الجراثيم", "نعاة الفم", "نعناع منعش"], "Daily oral hygiene", "النظافة الفموية اليومية", "500 ml", "500 مل")),
  '3606000537460': C("CeraVe", "CeraVe Moisturising Lotion SPF 30", "care/sun-care/sunscreen", "sunscreen", cf("CeraVe Moisturising Lotion SPF 30 hydrates skin while providing broad-spectrum sun protection with ceramides.", "لوشن سيرافي المرطب بعامل حماية 30 يرطب البشرة ويوفر حماية واسعة من أشعة الشمس بالسيراميد.", "Sun care", "العناية بالشمس", "Sunscreen lotion", "لوشن وقاية شمس", ["SPF 30 protection", "Ceramides", "Daily hydration"], ["حماية 30", "سيراميد", "ترطيب يومي"], "Face and body daily sun care", "الوجه والجسم للحماية اليومية من الشمس", "SPF 30", "عامل حماية 30")),
  '8051277318536': g("The House of Oud", "The House of Oud Grape Pearls EDP 75ml", {"isUnisex": true, "isNiche": true}, "The House of Oud Grape Pearls is a niche fruity floral with grape, pear, and musk for playful luxury.", "جريب بيرل من ذا هاوس أوف عود عطر نيش زهري فاكه بالعنب والكمثرى والمسك لفخامة مرحة.", "Aquatic woody", "مائي خشبي", "Sea salt, driftwood, bergamot, cedar, musk", "ملح البحر، خشب طافٍ، برغموت، أرز، مسك", "Artistic, fresh, unconventional", "فني ومنعش وغير تقليدي", "Creative wear and layering", "إطلالات إبداعية", "6–8 hours", "6–8 ساعات"),
  '8051277318642': g("The House of Oud", "The House of Oud Just Before EDP 75ml", {"isUnisex": true, "isNiche": true}, "The House of Oud Just Before is a niche amber-woody scent with bergamot, incense, and vanilla for contemplative depth.", "جست بيفور من ذا هاوس أوف عود عطر نيش عنبري خشبي بالبرتقال والبخور والفانيلا لعمق تأملي.", "Amber fougere", "عنبري عطري", "Grapefruit, amber, vanilla, tonka, patchouli", "جريفروت، عنبر، فانيلا، تونكا، باتشولي", "Powerful, sweet, bold", "قوي وجريء", "Night outs and parties", "الحفلات والخروج", "8–10 hours", "8–10 ساعات"),
  '8056669925897': g("Dolce & Gabbana", "Dolce & Gabbana The One For Men Parfum 100ml", {"gender": "men"}, "Dolce & Gabbana The One For Men Parfum is a warm amber-tobacco scent with ginger and cedar for powerful masculinity.", "ذا ون فور من من دولتشي غابانا عطر عنبري دافئ بالتبغ والزنجبيل والأرز لقوة رجالية.", "Powdery floral", "زهري بودري", "Rose, peony, musk, sandalwood, vanilla", "ورد، زهر الفايونيا، مسك، صندل، فانيلا", "Soft, sensual, graceful", "ناعم وحسي ورشيق", "Daily and office wear", "اليومي والعمل", "6–8 hours", "6–8 ساعات"),
  '3616303445584': g("Chloé", "Chloé Eau de Parfum Intense 100ml", {"gender": "women"}, "Chloé Eau de Parfum Intense is a rich rose-honey fragrance with amber and patchouli for sophisticated femininity.", "أو دي بارفيوم إنتنس من كلوي عطر وردي غني بالعسل والعنبر والباتشولي لأناقة راقية.", "Woody oud", "خشبي عود", "Oud, rosewood, cardamom, sandalwood, amber", "عود، خشب الورد، هيل، صندل، عنبر", "Luxurious, smoky, refined", "فاخر ودخاني ومصقول", "Evening wear and special occasions", "السهرات", "8–10 hours", "8–10 ساعات"),
  '3614272898301': g("Lancôme", "Lancôme Rose Peonia EDP 100ml", {"gender": "women"}, "Lancôme Rose Peonia blends peony, rose, and musk in a luminous floral for romantic everyday elegance.", "روز بيونيا من لانكوم يمزج البيونيا والورد والمسك في زهري مشع لأناقة رومانسية.", "Exotic floral", "زهري غريب", "Pomegranate, persimmon, orchid, amber, mahogany", "رمان، فاكهة الكاكي، أوركيد، عنبر، خشب أحمر", "Bold, exotic, sensual", "جريء وغريب وحسي", "Evenings and dates", "السهرات", "6–8 hours", "6–8 ساعات"),
  '5057566220828': M("Makeup Revolution", "Makeup Revolution Reloaded Palette", "eyes", mf("Makeup Revolution Reloaded Palette features versatile eyeshadow shades for everyday and evening eye looks.", "باليت ظلال عيون ريلودد من ريفولوشن يضم ألواناً متعددة لإطلالات العيون اليومية والمسائية.", "Eyeshadow palette", "باليت ظلال عيون", ["Versatile shades", "Blendable formula", "Day-to-night looks"], ["ألوان متعددة", "قابل للدمج", "إطلالات يوم ومساء"], "Creating versatile eye makeup looks", "إطلالات متنوعة للعيون")),
  '3614271717092': C("YSL", "YSL Y Deodorant Stick 75g", "care/skin-and-body-care/deodorant", "deodorant", cf("YSL Y Deodorant Stick provides long-lasting freshness and protection with the signature Y fragrance.", "مزيل عرق واي ستيك من إيف سان لوران يوفر انتعاشاً وحماية طويلة الأمد بعبير واي الأصلي.", "Body care", "عناية الجسم", "Deodorant stick", "مزيل عرق ستيك", ["Long-lasting freshness", "48-hour protection", "Signature Y scent"], ["انتعاش طويل", "حماية متواصلة", "عبير واي الأصلي"], "Daily underarm protection", "الحماية اليومية تحت الإبط", "75 g", "75 جم")),
  '7640111494027': g("Grès", "Grès Cabotine EDT 100ml", {"gender": "women"}, "Grès Cabotine is a classic green floral with hyacinth, rose, and sandalwood for timeless feminine grace.", "كابوتين من جريس عطر زهري أخضر كلاسيكي بالزهرة والورد والصندل لأناقة خالدة.", "Woody floral", "خشبي زهري", "Peach, patchouli, jasmine, vanilla, musk", "خوخ، باتشولي، ياسمين، فانيلا، مسك", "Opulent, warm, sophisticated", "فاخر ودافئ وراقٍ", "Evening and fall/winter", "السهرات والخريف", "7–9 hours", "7–9 ساعات"),
  '3600524070113': M("L'Oreal", "L'Oreal Prime Lab Pore Minimizer 30ml", "face", mf("L'Oreal Prime Lab Pore Minimizer blurs pores and mattifies skin for a smooth makeup base.", "برايمر لاب لتقليل المسام من لوريال يُطَفِي المسام ويُمَطِّف البشرة قاعدة ماكياج ناعمة.", "Face primer", "برايمر وجه", ["Minimizes pores", "Mattifying finish", "Smooth base"], ["تقليل المسام", "لمسة مطفية", "قاعدة ناعمة"], "Oily skin and large pores", "البشرة الزيتية والمسام الواسعة")),
  '3605521651587': g("Maison Margiela", "Maison Margiela Replica Beach Walk EDT 100ml", {"isUnisex": true, "isNiche": true}, "Maison Margiela Replica Beach Walk evokes sun and sea with coconut, bergamot, and musk for breezy unisex joy.", "ريبليكا بيتش ووك من ميزون مارجييلا يجسد الشمس والبحر بجوز الهند والبرتقال والمسك لفرح علوي.", "Leather floral", "جلد زهري", "Raspberry, orchid, leather, suede, musk", "توت، أوركيد، جلد، مخمل، مسك", "Luxurious, leathery, elegant", "فاخر وجلدي وأنيق", "Cool weather and formal events", "الطقس البارد والمناسبات", "8–10 hours", "8–10 ساعات"),
  '30144224': M("Maybelline", "Maybelline Lash Sensational Firework Mascara", "eyes", mf("Maybelline Lash Sensational Firework Mascara delivers explosive volume and length with a fanning brush.", "ماسكارا لاش سينشنال فايروورك من مايبيلين تمنح كثافة وطولاً مرتفعين بفرشاة مروحية.", "Volumizing mascara", "ماسكارا للكثافة", ["Fanning brush", "Explosive volume", "Length boost"], ["فرشاة مروحية", "كثافة عالية", "إطالة الطول"], "Dramatic lash volume and length", "كثافة وطول درامي للرموش")),
  '3614272544444': g("Armani", "Armani Code Absolu EDP 75ml", {"gender": "women"}, "Armani Code Absolu is a warm oriental vanilla scent with tonka, suede, and woods for sensual femininity.", "كود أبسولو من أرماني عطر شرقي دافئ بالفانيلا وحبوب التونكا والأخشاب لأنوثة حسية.", "Aromatic marine", "عطري بحري", "Bergamot, herbs, sea notes, musk, amber", "برغموت، أعشاب، نوتات بحرية، مسك، عنبر", "Fresh, coastal, artistic", "منعش وساحلي وفني", "Warm weather and daytime", "الطقس الدافئ", "10–12 hours", "10–12 ساعة"),
  '3614225358463': g("Calvin Klein", "Calvin Klein Women EDP 100ml", {"gender": "women"}, "Calvin Klein Women is a modern floral with bergamot, peony, and white musk for clean feminine confidence.", "ويمن من كالفن كلاين عطر زهري عصري بالبرتقال والبيونيا والمسك الأبيض لثقة أنثوية.", "Oriental vanilla", "شرقي فانيلا", "Ginger, bergamot, vanilla, sandalwood, musk", "زنجبيل، برغموت، فانيلا، صندل، مسك", "Warm, gourmand, enveloping", "دافئ وغني ومحيط", "Cold weather and evenings", "الطقس البارد", "10–12 hours", "10–12 ساعة"),
  '3700134410542': g("G Parfums", "G Parfums Yes I Am The King EDP 100ml", {"gender": "men"}, "G Parfums Yes I Am The King is a bold spicy amber fragrance with cinnamon, leather, and vanilla for royal masculinity.", "نعم أنا الملك من جي بارفوم عطر عنبري جريء بالقرفة والجلد والفانيلا لملكية رجالية.", "Woody gourmand", "خشبي غورماند", "Pineapple, bergamot, cedar, whiskey, caramel, vanilla", "أناناس، برغموت، أرز، وسكي، كراميل، فانيلا", "Bold, boozy, vibrant", "جريء وفني ونابض", "Statement wear and evenings", "السهرات", "10–12 hours", "10–12 ساعة"),
  '3770010614616': g("Essential Parfums", "Essential Parfums The Musc EDP 100ml", {"isUnisex": true, "isNiche": true}, "Essential Parfums The Musc is a clean niche musk scent with bergamot, jasmine, and sandalwood for effortless unisex elegance.", "ذا مسك من إسينشيال بارفيومز عطر نيش مسكي نقي بالبرتقال والياسمين والصندل لأناقة علوية.", "Woody leather", "خشبي جلدي", "Pineapple, bergamot, patchouli, saffron, leather, oud", "أناناس، برغموت، باتشولي، زعفران، جلد، عود", "Rich, leathery, sophisticated", "غني وجلدي وراقي", "Evening wear and cooler seasons", "السهرات", "10–12 hours", "10–12 ساعة"),
  '3348901426961': g("Dior", "Dior J'adore Roller Pearl EDP 20ml", {"gender": "women"}, "Dior J'adore Roller Pearl is a portable luminous floral with ylang-ylang, rose, and jasmine for radiant femininity.", "جادور رولر بيرل من ديور عطر زهري مشع قابل للحمل باليلانغ يلانج والورد والياسمين لإشراق أنثوي.", "Floral amber", "زهري عنبري", "Pink pepper, jasmine, amber, vanilla, musk", "فلفل وردي، ياسمين، عنبر، فانيلا، مسك", "Warm, radiant, sophisticated", "دافئ ومتوهج وراقٍ", "Evening wear and cooler seasons", "السهرات والفصول الباردة", "7–9 hours with moderate sillage", "7–9 ساعات بثبات جيد"),
  '769915194951': C("The Ordinary", "The Ordinary Niacinamide 10% + Zinc 1% 60ml", "care/face-care/face-moisturizer", "serum", cf("The Ordinary Niacinamide 10% + Zinc 1% serum helps reduce blemishes, refine pores, and balance oily skin.", "سيروم نياسيناميد 10% + زنك 1% من ذا أوردنري يساعد على تقليل الشوائب وتنقية المسام وتوازن البشرة الزيتية.", "Face care", "عناية الوجه", "Serum", "سيروم", ["Niacinamide 10%", "Zinc 1%", "Refines pores"], ["نياسيناميد 10%", "زنك 1%", "تنقية المسام"], "Oily and blemish-prone skin", "البشرة الزيتية والمعرضة للشوائب", "60 ml", "60 مل")),
  '8809634610027': C("Axis-Y", "Axis-Y Quinoa One Step Gel Cleanser 180ml", "care/korean-skincare/skin-care", "cleanser", cf("Axis-Y Quinoa One Step Gel Cleanser gently cleanses with quinoa extract and centella for balanced Korean skincare.", "جل منظف بالكينوا من أكسيس واي ينظف بلطف بمستخلص الكينوا والسنتيلا لعناية كورية متوازنة.", "Korean skincare", "العناية الكورية", "Gel cleanser", "جل منظف", ["Quinoa extract", "Centella asiatica", "One-step cleanse"], ["مستخلص الكينوا", "السنتيلا", "تنظيف بخطوة واحدة"], "All skin types", "جميع أنواع البشرة", "180 ml", "180 مل")),
  '783320403897': g("Bvlgari", "Bvlgari Man Wood Neroli EDP 100ml", {"gender": "men"}, "Bvlgari Man Wood Neroli is a woody citrus scent with neroli, bergamot, and vetiver for refined masculine freshness.", "من وود نيرولي من بولغاري عطر خشبي حملي بالنيرولي والبرتقال والفيتيفر لانعواش رجالي مصقول.", "Amber aromatic", "عنبري عطري", "Mint, green apple, lemon, tonka bean, vanilla, amber, leather", "نعناع، تفاح أخضر، ليمون، فول التونكا، فانيلا، عنبر، جلد", "Bold, sensual, powerful", "جريء وحسي وقوي", "Night outs and special occasions", "الخروج الليلي والمناسبات", "8–10 hours with strong projection", "8–10 ساعات بثبات قوي"),
  '3423222092245': g("Narciso Rodriguez", "Narciso Rodriguez For Her Forever EDP 50ml", {"gender": "women"}, "Narciso Rodriguez For Her Forever is a luminous musk-floral with orange blossom, musk, and amber for modern femininity.", "فور هير فور إفر من نارسيسو رودريغز عطر مسكي زهري مشع بالبرتقال والمسك والعنبر لأنوثة عصرية.", "Floral fruity", "زهري فواكه", "Bergamot, peach, rose, jasmine, musk, sandalwood", "برغموت، خوخ، ورد، ياسمين، مسك، صندل", "Soft, feminine, elegant", "ناعم وأنثوي وأنيق", "Daily wear and office", "الاستخدام اليومي والعمل", "6–8 hours", "6–8 ساعات"),
  '3423222092252': g("Narciso Rodriguez", "Narciso Rodriguez For Her Forever EDP 100ml", {"gender": "women"}, "Narciso Rodriguez For Her Forever in 100ml offers the same iconic musk-floral signature with lasting elegant presence.", "فور هير فور إفر بحجم 100 مل يقدم نفحة مسكية زهرية أيقونية بثبات أنيق وحضور مدموع.", "Woody aromatic", "خشبي عطري", "Cypress, vetiver, cashmere wood, musk, benzoin", "سرو، فيتيفر، خشب كاشمير، مسك، بنزوين", "Dark, smoky, refined", "داكن ودخاني ومصقول", "Evening wear and formal occasions", "السهرات والمناسبات الرسمية", "8–10 hours", "8–10 ساعات"),
  '8005610298894': g("Hugo Boss", "Hugo Boss The Scent For Her EDP 50ml", {"gender": "women"}, "Hugo Boss The Scent For Her is a seductive floral-fruity scent with peach, freesia, and cocoa for feminine allure.", "ذا سينت فور هير من هوغو بوس عطر زهري فاكه مغري بالخوخ والفريزيا والكاكاو لجذبية أنثوية.", "Oriental amber", "شرقي عنبري", "Grapefruit, ginger, amber, tobacco, cedar", "جريفروت، زنجبيل، عنبر، تبغ، أرز", "Warm, luxurious, charismatic", "دافئ وفاخر وجذاب", "Evenings and cooler weather", "السهرات والطقس البارد", "7–9 hours", "7–9 ساعات"),
  '3386460057059': g("Boucheron", "Boucheron Place Vendôme EDP 100ml", {"gender": "women"}, "Boucheron Place Vendôme is a refined floral with pear, jasmine, and benzoin for Parisian feminine elegance.", "بلاس فاندوم من بوشرون عطر زهري راقي بالكمثرى والياسمين والبنزوين لأناقة باريسية.", "Floral fruity", "زهري فواكه", "Bergamot, tiare flower, coconut, jasmine, musk", "برغموت، زهر التيار، جوز الهند، ياسمين، مسك", "Tropical, sunny, joyful", "استوائي ومشمس ومبهج", "Summer days and vacations", "أيام الصيف والعطلات", "5–7 hours", "5–7 ساعات"),
  '3614273604833': g("Giorgio Armani", "Giorgio Armani Code Parfum EDP 75ml", {"gender": "men"}, "Giorgio Armani Code Parfum is an intense aromatic fougère with lavender, tonka, and woods for magnetic masculinity.", "كود بارفيوم بور هوم من جيورجيو أرماني عطر فوجير عطري مكثف باللافندر وحبوب التونكا والأخشاب لرجولة جذابة.", "Floral", "زهري", "Pear, jasmine sambac, sandalwood, benzoin", "كمثرى، ياسمين، صندل، بنزوين", "Radiant, joyful, modern floral", "مشع ومبهج وزهري عصري", "Spring and daytime wear", "الربيع والنهار", "6–8 hours", "6–8 ساعات"),
  '764302316091': C("Shea Moisture", "Shea Moisture Power Greens Hair Cream 237ml", "care/hair-care/hair-treatment", "hair-treatment", cf("Shea Moisture Power Greens Hair Cream nourishes and defines hair with kale, spinach, and shea butter.", "كريم شعر باور جرينز من شيا موشر يغذي ويعرّف الشعر بالكينوا والسبانخ وزبدة الشيا.", "Hair treatment", "علاج الشعر", "Leave-in hair cream", "كريم شعر بدون شطف", ["Power greens blend", "Shea butter", "Defines curls"], ["مزيج خضراوات قوية", "زبدة الشيا", "يعرّف التجاعيد"], "Dry, curly, or textured hair", "الشعر الجاف والمجعّد والمنوع", "237 ml", "237 مل")),
  '8033488153281': g("Xerjoff", "Xerjoff Casamorati Gran Ballo EDP 100ml", {"isNiche": true}, "Xerjoff Casamorati Gran Ballo is a niche gourmand floral with caramel, jasmine, and vanilla for opulent femininity.", "كاساموراتي جران بالو من زيرجوف عطر نيش غورماند زهري بالكراميل والياسمين والفانيلا لفخامة.", "Aquatic woody", "مائي خشبي", "Lemon, rose, tarragon, cedar, musk", "ليمون، ورد، طرخون، أرز، مسك", "Fresh, clean, versatile", "منعش ونظيف ومتعدد", "Daily wear and warm weather", "الاستخدام اليومي والطقس الدافئ", "4–6 hours", "4–6 ساعات"),
  '8681008055227': g("Nishane", "Nishane Wulong Cha EDP 100ml", {"isUnisex": true, "isNiche": true}, "Nishane Wulong Cha is a niche tea-inspired scent with bergamot, tea, and musk for artistic unisex freshness.", "وولونج تشا من نيشان عطر نيش مستوح من الشاي بالبرتقال والشاي والمسك لإبداع فني.", "Floral fruity", "زهري فواكه", "Bergamot, tiare, coconut, jasmine, musk", "برغموت، زهر التيار، جوز الهند، ياسمين، مسك", "Tropical, light, joyful", "استوائي وخفيف ومبهج", "Summer and casual wear", "الصيف والاستخدام اليومي", "4–6 hours", "4–6 ساعات"),
  '3614222793458': g("Roberto Cavalli", "Roberto Cavalli Paradiso Assoluto EDP 50ml", {"gender": "women"}, "Roberto Cavalli Paradiso Assoluto is a tropical floral with jasmine, citrus, and amber for sun-kissed femininity.", "باراديسو أسولوتو من روبرتو كفالي عطر استوائي بالياسمين والحملية والعنبر لأنوثة مشمسة.", "Fruity floral", "فواكه زهرية", "Lemon, mandarin, apple, jasmine, musk", "ليمون، مندرين، تفاح، ياسمين، مسك", "Fresh, playful, sunny", "منعش ومرح ومشمس", "Daytime and summer", "النهار والصيف", "5–7 hours", "5–7 ساعات"),
  '3614272865235': g("Giorgio Armani", "Giorgio Armani Acqua di Gio Profondo EDP 125ml", {"gender": "men"}, "Giorgio Armani Acqua di Gio Profondo dives deeper into marine freshness with patchouli, incense, and musk for bold masculinity.", "أكوا دي جيو بروفوندو من جيورجيو أرماني يغوص بعمق في الانتعاش البحري مع الباتشولي والبخور والمسك لرجولة جريئة.", "Gourmand woody", "غورماند خشبي", "Cognac, oak, cinnamon, praline, vanilla", "كونياك، بلوط، قرفة، حلوى البندق، فانيلا", "Warm, boozy, luxurious", "دافئ وفاخر وساحر", "Evenings and cold weather", "السهرات والطقس البارد", "8–10 hours", "8–10 ساعات"),
};

const ORDER = [
  '737052352060',
  '8011530810023',
  '7640163970029',
  '3614274143751',
  '737052041353',
  '8690604111053',
  '3348901786393',
  '3348901786331',
  '3614221031735',
  '3274872456341',
  '3386460088190',
  '3614273673846',
  '3423222012700',
  '3581000018679',
  '3386460066075',
  '8005610328799',
  '3423478812154',
  '724120095653',
  '3614274350753',
  '3574661177137',
  '3606000537460',
  '8051277318536',
  '8051277318642',
  '8056669925897',
  '3616303445584',
  '3614272898301',
  '5057566220828',
  '3614271717092',
  '7640111494027',
  '3600524070113',
  '3605521651587',
  '30144224',
  '3614272544444',
  '3614225358463',
  '3700134410542',
  '3770010614616',
  '3348901426961',
  '769915194951',
  '8809634610027',
  '783320403897',
  '3423222092245',
  '3423222092252',
  '8005610298894',
  '3386460057059',
  '3614273604833',
  '764302316091',
  '8033488153281',
  '8681008055227',
  '3614222793458',
  '3614272865235',
];

const out = {};
for (const bc of ORDER) {
  if (!D[bc]) throw new Error(`Missing ${bc}`);
  const { brandAr, nameSuffix } = AR[bc];
  out[bc] = { ...D[bc], brandAr, nameAr: `${brandAr} - ${nameSuffix}` };
}

const json = '{\n' + ORDER.map((bc, i) => {
  const body = JSON.stringify(out[bc], null, 2).split('\n').map((line) => '  ' + line).join('\n');
  return `  ${JSON.stringify(bc)}: ${body.trimStart()}${i < ORDER.length - 1 ? ',' : ''}`;
}).join('\n') + '\n}\n';

writeFileSync(new URL('./batch7-meta-defs.json', import.meta.url), json);
console.log('Wrote', ORDER.length, 'defs');
