import '../../core/l10n/app_strings.dart';
import '../../data/models/beauty.dart';

/// سؤال من اختبار البشرة — نصوصه فقط؛ الدرجات والرموز في شاشة الاختبار بنفس الترتيب.
typedef BeautyQuizQuestion = ({String title, String hint, List<String> options});

/// نصوص دليل البشرة والباقات والروتين واختبار البشرة — بصيغة المؤنث، بلغتي التطبيق.
/// محتوى الباقات والمشاكل نفسه (الأسماء والنصائح) يأتي من لوحة التحكم كما هو.
extension BeautyStringsX on AppStrings {
  // ─── أنواع البشرة ───
  String beautySkinTypeLabel(SkinType t) => isAr ? t.labelAr : t.labelEn;

  /// «بشرة دهنية» / «Oily skin».
  String beautySkinOf(SkinType t) => isAr ? 'بشرة ${t.labelAr}' : '${t.labelEn} skin';

  String beautySkinBlurb(SkinType t) => isAr
      ? t.blurbAr
      : switch (t) {
          SkinType.dry => 'Your skin needs deep hydration and a barrier that locks moisture in — skip harsh cleansers.',
          SkinType.oily => 'Your skin makes more oil — cleanse gently and regularly and use a light, oil-free moisturiser.',
          SkinType.combination =>
            'An oily T-zone with normal or dry cheeks — balance gentle cleansing with light hydration.',
          SkinType.normal => 'Your skin is balanced — keep it that way with a simple routine and daily sunscreen.',
          SkinType.sensitive =>
            'Your skin reacts easily — choose gentle, fragrance-free formulas and patch-test anything new.',
        };

  // ─── أنواع الباقات ───
  String get beautyMorningRoutine => isAr ? 'روتين الصباح' : 'Morning routine';
  String get beautyEveningRoutine => isAr ? 'روتين المساء' : 'Evening routine';
  String get beautyRoutine => isAr ? 'روتين' : 'Routine';
  String get beautyBridalKit => isAr ? 'باقة العروس' : 'Bridal kit';
  String get beautyBundle => isAr ? 'باقة' : 'Bundle';

  String beautyKindLabel(BeautyPackage p) => p.isMorning
      ? beautyMorningRoutine
      : p.isEvening
          ? beautyEveningRoutine
          : p.isBridal
              ? beautyBridalKit
              : p.isRoutine
                  ? beautyRoutine
                  : beautyBundle;

  /// عدد ما في الباقة: «4 خطوات» للروتين و«3 منتجات» للباقة.
  String beautyPackCount(BeautyPackage p) => p.isRoutine ? stepsCount(p.stepCount) : productsN(p.stepCount);

  /// «3 منتجات مختارة» / «3 curated products».
  String beautyCuratedProducts(int n) => isAr
      ? arCount(n, one: 'منتج واحد مختار', two: 'منتجان مختاران', few: 'منتجات مختارة', many: 'منتجاً مختاراً')
      : enCount(n, 'curated product', 'curated products');

  // ─── التوفير والسعر ───
  String beautySavePercent(int pct) => isAr ? 'وفّري $pct%' : 'Save $pct%';
  String beautySaveAmount(String amount) => isAr ? 'وفّري $amount' : 'Save $amount';
  String beautySavedAmount(String amount) => isAr ? 'وفّرتِ $amount' : 'You save $amount';
  String beautySavingVsSingles(String amount) => isAr
      ? 'توفّرين $amount مقارنة بشراء كل منتج منفرداً'
      : 'You save $amount compared with buying each item on its own';

  // ─── الرؤوس والأقسام ───
  String get beautySkinGuide => isAr ? 'دليل البشرة' : 'Skin guide';
  String get beautySkinGuideSubtitle => isAr
      ? 'اعرفي بشرتكِ، وافهمي مشكلتها، واختاري روتيناً يناسبها'
      : 'Know your skin, understand what bothers it, and pick a routine that suits it';
  String get beautyConcernsTitle => isAr ? 'شنو يزعج بشرتكِ؟' : 'What bothers your skin?';
  String get beautyConcernsSubtitle =>
      isAr ? 'اختاري المشكلة ونشرحلكِ أسبابها وعلاجها' : 'Pick a concern to see its causes and care';
  String get beautyGuideComingTitle => isAr ? 'الدليل قيد التحضير' : 'The guide is on its way';
  String get beautyGuideComingSubtitle =>
      isAr ? 'قريباً نضيف مشاكل البشرة وحلولها' : 'Skin concerns and their care are coming soon';
  String get beautyRoutinesForYou => isAr ? 'روتين جاهز لكِ' : 'Ready-made routines';
  String get beautyRoutinesForYouSubtitle =>
      isAr ? 'خطوات مرتّبة بسعر أوفر من شرائها منفردة' : 'Ordered steps, priced lower than buying them separately';
  String get beautySeeAll => isAr ? 'الكل' : 'All';
  String get beautyCareBundles => isAr ? 'باقات العناية' : 'Care bundles';

  String get beautyRoutineOrderTitle => isAr ? 'ترتيب خطوات الروتين 📋' : 'Routine step order 📋';
  String get beautyRoutineOrderRule =>
      isAr ? 'القاعدة: من الأخف قواماً إلى الأثقل' : 'The rule: from the lightest texture to the richest';

  /// خطوات الروتين المرجعية: (الاسم، الوصف) بنفس ترتيب الرموز في الشاشة.
  List<(String, String)> get beautyRoutineOrderSteps => isAr
      ? const [
          ('غسول', 'ينظّف الدهون والأوساخ'),
          ('تونر', 'يوازن البشرة ويهيئها'),
          ('سيروم', 'علاج مركّز لمشكلتكِ'),
          ('كريم العين', 'منطقة رقيقة تحتاج لطفاً'),
          ('مرطب', 'يحبس الرطوبة'),
          ('واقي الشمس', 'صباحاً دائماً — آخر خطوة'),
        ]
      : const [
          ('Cleanser', 'Lifts oil and dirt'),
          ('Toner', 'Balances and preps the skin'),
          ('Serum', 'Targeted care for your concern'),
          ('Eye cream', 'A delicate area that needs a gentle touch'),
          ('Moisturiser', 'Locks in hydration'),
          ('Sunscreen', 'Every morning — always the last step'),
        ];

  // ─── صفحة المشكلة ───
  String get beautyTipsTitle => isAr ? '💡 نصائح ديما لكِ' : '💡 Tips for you';
  String get beautyCausesTitle => isAr ? '🔍 ليش تصير؟' : '🔍 Why does it happen?';
  String get beautyIngredientsTitle => isAr ? '✅ مكونات تبحثين عنها' : '✅ Ingredients to look for';
  String get beautyIngredientsHint =>
      isAr ? 'اضغطي على المكوّن لتشوفي منتجاته' : 'Tap an ingredient to see its products';
  String get beautyAvoidTitle => isAr ? '⛔ تجنّبي' : '⛔ Avoid';
  String beautyRoutinesFor(String name) => isAr ? 'روتين لـ$name' : 'Routines for $name';
  String get beautyRoutinesForSubtitle => isAr ? 'خطوات جاهزة بسعر أوفر' : 'Ready-made steps at a better price';
  String beautyProductsFor(String name) => isAr ? 'منتجات تعالج $name' : 'Products for $name';
  String beautySeeAllCount(int n) => isAr ? 'الكل ($n)' : 'All ($n)';
  String beautyShowAllProducts(int n) => isAr ? 'عرض كل المنتجات ($n)' : 'Show all products ($n)';
  String get beautyConcernComingTitle => isAr ? 'نجهّز محتوى هذه المشكلة' : 'We are preparing this guide';
  String get beautyConcernComingSubtitle =>
      isAr ? 'قريباً نصائح ومنتجات مختارة' : 'Tips and hand-picked products are coming soon';
  String get beautyOtherConcerns => isAr ? 'مشاكل أخرى' : 'Other concerns';
  String beautyProductsToTreat(int n) =>
      isAr ? '${arProducts(n)} لعلاجها' : '${enCount(n, 'product', 'products')} to treat it';
  String beautySuggestedRoutines(int n) => isAr
      ? arCount(n, one: 'روتين مقترح', two: 'روتينان مقترحان', few: 'روتينات مقترحة', many: 'روتيناً مقترحاً')
      : enCount(n, 'suggested routine', 'suggested routines');

  // ─── صفحة الباقات ───
  String get beautyPackagesTitle => isAr ? 'الباقات والروتين' : 'Bundles & routines';
  String get beautyPackagesSubtitle => isAr
      ? 'منتجات مختارة تكمّل بعضها — بسعر أوفر من شرائها منفردة'
      : 'Products picked to work together — for less than buying them separately';
  String get beautyTabAll => isAr ? 'الكل' : 'All';
  String get beautyTabMorning => isAr ? '☀️ روتين الصباح' : '☀️ Morning';
  String get beautyTabEvening => isAr ? '🌙 روتين المساء' : '🌙 Evening';
  String get beautyTabBundles => isAr ? '🎁 باقات' : '🎁 Bundles';
  String get beautyTabBridal => isAr ? '💍 العروس' : '💍 Bridal';
  String get beautyNoPackagesTitle => isAr ? 'لا توجد باقات حالياً' : 'No bundles right now';
  String get beautyNoPackagesSubtitle => isAr ? 'تابعينا — باقات جديدة قريباً' : 'Stay tuned — new bundles are coming soon';
  String beautySortedForSkin(SkinType t) =>
      isAr ? '${t.emoji} مرتبة حسب بشرتكِ ${t.labelAr}' : '${t.emoji} Sorted for your ${t.labelEn.toLowerCase()} skin';

  // ─── صفحة الباقة ───
  String beautyFitsYourSkin(SkinType t) =>
      isAr ? '✓ يناسب بشرتكِ ${t.labelAr}' : '✓ Suits your ${t.labelEn.toLowerCase()} skin';
  String get beautyRoutineSteps => isAr ? 'خطوات الروتين' : 'Routine steps';
  String get beautyBundleContents => isAr ? 'محتوى الباقة' : "What's inside";
  String get beautyLightToHeavy => isAr ? 'بالترتيب — من الأخف إلى الأثقل' : 'In order — lightest to richest';
  String get beautyMorningTip => isAr
      ? 'انتظري دقيقة بين الخطوات حتى تمتص البشرة كل طبقة، وواقي الشمس دائماً آخر خطوة حتى بالبيت.'
      : 'Wait a minute between steps so each layer sinks in, and sunscreen always goes last — even at home.';
  String get beautyEveningTip => isAr
      ? 'إذا وضعتِ مكياجاً، نظّفي مرتين: مزيل المكياج ثم الغسول. وخلي المنتجات العلاجية للمساء.'
      : 'If you wore makeup, cleanse twice: makeup remover, then cleanser. Keep treatment products for the evening.';
  String get beautyOtherRoutines => isAr ? 'روتينات أخرى' : 'Other routines';
  String get beautySimilarBundles => isAr ? 'باقات مشابهة' : 'Similar bundles';
  String get beautyChooseShade => isAr ? 'تختارين اللون' : 'Pick a shade';
  String get beautySoldOut => isAr ? 'نفد' : 'Sold out';
  String get beautyOfferEndedTitle => isAr ? 'انتهى هذا العرض' : 'This offer has ended';
  String get beautyOfferEndedSubtitle =>
      isAr ? 'الباقة لم تعد متاحة — عندنا باقات ثانية تنتظركِ' : 'This bundle is no longer available — others are waiting for you';
  String get beautyBrowsePackages => isAr ? 'تصفحي الباقات' : 'Browse bundles';

  // ─── شريط الشراء ───
  String get beautyUnavailableNow => isAr ? 'غير متوفرة حالياً' : 'Unavailable right now';
  String get beautyInCartViewCart => isAr ? 'في سلتكِ ✓ — عرض السلة' : 'In your bag ✓ — View bag';
  String get beautyAddRoutine => isAr ? 'أضيفي الروتين كاملاً' : 'Add the full routine';
  String get beautyAddBundle => isAr ? 'أضيفي الباقة للسلة' : 'Add bundle to bag';
  String beautyCompletePackage(int missing) =>
      isAr ? 'أكملي الباقة • ينقصها ${arProducts(missing)}' : 'Complete the bundle • ${enCount(missing, 'item', 'items')} missing';
  String get beautyAddAvailable => isAr ? 'أضيفي المتوفر' : 'Add available';
  String get beautyWatchingRestock => isAr ? 'سننبّهكِ عند التوفر ✓' : 'Alert set ✓';
  String get beautyRestockOn =>
      isAr ? 'سننبّهكِ حين تتوفر المنتجات الناقصة 🔔' : "We'll let you know when the missing items are back 🔔";
  String get beautyRestockOff => isAr ? 'ألغينا تنبيه التوفر' : 'Restock alert removed';
  String get beautyLoginForRestock =>
      isAr ? 'سجّلي الدخول حتى ننبّهكِ عند التوفر' : 'Sign in so we can tell you when it is back';

  // ─── الإضافة للسلة ───
  String get beautyChooseShades => isAr ? 'اختاري التدرجات' : 'Choose your shades';
  String get beautyShadesSoldOut => isAr ? 'التدرجات نفدت' : 'Shades sold out';

  /// «اختاري 2 تدرّج متبقٍ» حتى تكتمل الاختيارات.
  String beautyPickRemainingShades(int n) {
    if (!isAr) return n == 1 ? 'Choose 1 more shade' : 'Choose $n more shades';
    if (n == 1) return 'اختاري التدرّج المتبقي';
    if (n == 2) return 'اختاري التدرّجين المتبقيين';
    return 'اختاري ${arCount(n, one: '', two: '', few: 'تدرّجات متبقية', many: 'تدرّجاً متبقياً')}';
  }

  String beautyAddToBagFor(String price) => isAr ? 'أضيفي للسلة • $price' : 'Add to bag • $price';
  String beautyItemSoldOut(String name) => isAr
      ? 'نفد «$name» حالياً — لا يمكن إضافة الباقة كاملة'
      : '"$name" is sold out — the full bundle cannot be added';
  String beautyNotEnoughStock(String name) =>
      isAr ? 'الكمية المتوفرة من «$name» لا تكفي للباقة' : 'There is not enough "$name" in stock for this bundle';
  String beautyAddedWithSaving(bool routine, String amount) => isAr
      ? 'أُضيفت ${routine ? 'خطوات الروتين' : 'الباقة'} — وفّرتِ $amount ✨'
      : '${routine ? 'Routine' : 'Bundle'} added — you save $amount ✨';
  String get beautyAddedToBag => isAr ? 'أُضيفت للسلة ✨' : 'Added to your bag ✨';
  String get beautyPackageCompleted => isAr ? 'اكتملت الباقة بسعرها الخاص ✨' : 'Bundle complete at its special price ✨';
  String get beautyAvailableAdded => isAr ? 'أضفنا المتوفر من الباقة للسلة' : 'We added the available items to your bag';
  String get beautyRoutinesAdded => isAr ? 'أُضيف الروتينان للسلة ✨' : 'Both routines added to your bag ✨';

  // ─── اختبار البشرة ───
  String get beautyQuizTitle => isAr ? 'اختبار البشرة' : 'Skin quiz';
  String get beautyQuizResultTitle => isAr ? 'نتيجة اختبار البشرة' : 'Your skin quiz result';
  String beautyQuizStep(int step, int total) => isAr ? 'سؤال $step من $total' : 'Question $step of $total';
  String get beautyQuizConcernsTitle => isAr ? 'شنو المشاكل اللي تزعجكِ؟' : 'Which concerns bother you?';
  String get beautyQuizConcernsHint =>
      isAr ? 'اختاري لحد 3 — أو تخطّي إذا ما عندكِ' : 'Pick up to 3 — or skip if you have none';
  String get beautyQuizMaxConcerns =>
      isAr ? 'اختاري لحد 3 — ألغي واحدة أولاً' : 'Up to 3 — deselect one first';
  String get beautyQuizSeeResult => isAr ? 'شوفي النتيجة ✨' : 'See my result ✨';
  String beautyQuizSeeResultCount(int n) => isAr ? 'شوفي النتيجة ($n) ✨' : 'See my result ($n) ✨';
  String get beautyQuizSkipToResult => isAr ? 'تخطّي وشوفي النتيجة' : 'Skip and see my result';

  List<BeautyQuizQuestion> get beautyQuizQuestions => isAr
      ? const [
          (
            title: 'بعد غسل وجهكِ بساعة، شلون تحسين بشرتكِ؟',
            hint: 'بدون أي كريم',
            options: ['مشدودة وجافة', 'لامعة بكل الوجه', 'لامعة بالجبهة والأنف فقط', 'مرتاحة وطبيعية'],
          ),
          (
            title: 'بنص النهار، شلون يبين وجهكِ؟',
            hint: 'خصوصاً بدون مكياج',
            options: ['باهت أو فيه قشور', 'لمعان واضح ودهون', 'لمعان بمنطقة T بس', 'ما يتغيّر كثير'],
          ),
          (
            title: 'شلون المسام عندكِ؟',
            hint: 'شوفيها بالمراية بضوء طبيعي',
            options: ['صغيرة وما تنشاف', 'واسعة بكل الوجه', 'واسعة بالأنف والجبهة', 'متوسطة'],
          ),
          (
            title: 'تتحسس بشرتكِ من المنتجات الجديدة؟',
            hint: 'احمرار، حكة، أو حرقان',
            options: ['كثيراً — أغلب المنتجات', 'أحياناً', 'نادراً أو أبداً'],
          ),
        ]
      : const [
          (
            title: 'An hour after washing your face, how does your skin feel?',
            hint: 'Without any cream',
            options: ['Tight and dry', 'Shiny all over', 'Shiny on the forehead and nose only', 'Comfortable and normal'],
          ),
          (
            title: 'By midday, how does your face look?',
            hint: 'Especially without makeup',
            options: ['Dull or flaky', 'Visibly shiny and oily', 'Shiny in the T-zone only', "It doesn't change much"],
          ),
          (
            title: 'What are your pores like?',
            hint: 'Check in the mirror in natural light',
            options: ['Small and barely visible', 'Large all over', 'Large on the nose and forehead', 'Medium'],
          ),
          (
            title: 'Does your skin react to new products?',
            hint: 'Redness, itching or burning',
            options: ['Often — most products', 'Sometimes', 'Rarely or never'],
          ),
        ];

  // ─── نتيجة الاختبار ───
  String get beautyYourSkinType => isAr ? 'نوع بشرتكِ' : 'Your skin type';
  String get beautyRetakeQuiz => isAr ? 'أعيدي الاختبار' : 'Retake the quiz';
  String get beautySuggestedRoutine => isAr ? 'روتينكِ المقترح' : 'Your suggested routine';
  String get beautySuggestedRoutineSubtitle =>
      isAr ? 'مختار حسب نوع بشرتكِ ومشاكلها' : 'Chosen for your skin type and concerns';
  String beautyAddBothRoutines(String total, {String? saving}) => isAr
      ? 'أضيفي الروتينين • $total${saving != null ? ' (وفّري $saving)' : ''}'
      : 'Add both routines • $total${saving != null ? ' (save $saving)' : ''}';
  String get beautyPreparingRoutineTitle => isAr ? 'نجهّز روتيناً لنوع بشرتكِ' : 'A routine for your skin is on its way';
  String get beautyPreparingRoutineSubtitle =>
      isAr ? 'شوفي منتجات مشاكلكِ تحت 👇' : 'See products for your concerns below 👇';
  String beautyForConcern(String name) => isAr ? 'لـ$name' : 'For $name';
  String get beautyGuide => isAr ? 'الدليل' : 'Guide';
  String get beautyProductsForMySkin => isAr ? 'منتجات لبشرتكِ' : 'Products for your skin';
  String beautyProductsForSkinTitle(SkinType t) =>
      isAr ? 'منتجات لبشرة ${t.labelAr}' : 'Products for ${t.labelEn.toLowerCase()} skin';

  /// «ديما» بالعربي فقط — قرار المالكة؛ لا تُعرض هذه النصوص بالإنجليزي.
  String get beautyAskDeemaRoutine => 'اسألي ديما عن روتيني';
  String beautyAskDeemaRoutineQuery(SkinType t) => 'بشرتي ${t.labelAr}، شنو الروتين المناسب إلي؟';

  // ─── الرئيسية ───
  String get beautyFullGuide => isAr ? 'الدليل كامل' : 'Full guide';
  String get beautyQuizBannerTitle => isAr ? 'اكتشفي نوع بشرتكِ في دقيقة' : 'Find your skin type in a minute';
  String beautyQuizBannerResult(SkinType t) =>
      isAr ? 'بشرتكِ ${t.labelAr} ${t.emoji}' : 'Your skin: ${t.labelEn} ${t.emoji}';
  String get beautyQuizBannerSubtitle =>
      isAr ? '5 أسئلة سريعة ونرشّحلكِ روتين الصباح والمساء' : '5 quick questions for a morning and evening routine';
  String get beautyQuizBannerResultSubtitle =>
      isAr ? 'روتينكِ المقترح جاهز — اضغطي لعرضه' : 'Your suggested routine is ready — tap to see it';
  String get beautyQuizStart => isAr ? 'ابدئي' : 'Start';
  String get beautyMyRoutine => isAr ? 'روتيني' : 'My routine';
  String get beautyAllRoutines => isAr ? 'كل الروتينات' : 'All routines';
  String get beautyMorning => isAr ? 'الصباح' : 'Morning';
  String get beautyEvening => isAr ? 'المساء' : 'Evening';
  String get beautyViewAll => isAr ? 'عرض الكل' : 'View all';
  String get beautyRoutineTonight => isAr ? 'روتينكِ الليلة 🌙' : 'Your routine tonight 🌙';
  String get beautyRoutineToday => isAr ? 'روتينكِ اليوم ☀️' : 'Your routine today ☀️';
  String beautyPickedForSkin(SkinType t) =>
      isAr ? 'مختار لبشرتكِ ${t.labelAr} ${t.emoji}' : 'Picked for your ${t.labelEn.toLowerCase()} skin ${t.emoji}';
  String get beautyFullRoutine => isAr ? 'روتيني كامل' : 'My full routine';
}
