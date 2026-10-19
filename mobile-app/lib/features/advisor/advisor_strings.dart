import '../../core/l10n/app_strings.dart';

/// نصوص واجهة «ديما» — المستشارة تخاطب الزبونة بالمؤنث وبلهجة قريبة.
/// ردود ديما نفسها تصل من السيرفر بالعربي؛ هنا فقط إطار الواجهة.
extension AdvisorStringsX on AppStrings {
  // ── الرأس والمحادثة ──
  String get advisorName => isAr ? 'ديما' : 'Deema';
  String get advisorBack => isAr ? 'رجوع' : 'Back';
  String get advisorOnline => isAr ? 'متاحة الآن' : 'Online now';
  String get advisorTyping => isAr ? 'تكتب…' : 'Typing…';
  String get advisorNewChat => isAr ? 'محادثة جديدة' : 'New chat';
  String get advisorNewChatStarted => isAr ? 'بدأتِ محادثة جديدة ✨' : 'New chat started ✨';
  String get advisorPreparing => isAr ? 'ديما تستعد لكِ…' : 'Deema is getting ready…';
  String get advisorRetry => isAr ? 'إعادة' : 'Retry';
  String get advisorTryAgain => isAr ? 'حاولي مجدداً' : 'Try again';
  /// شريط تحت الرأس للواجهة الإنجليزية — الردود ما زالت عربية.
  String get advisorRepliesInArabic => isAr ? 'ديما تردّ حالياً بالعربية' : 'Deema currently replies in Arabic';
  String get advisorHint => isAr ? 'اسألي ديما… مثل «عطر خشبي للسهرة»' : 'Ask Deema… e.g. “a woody scent for the evening”';
  String get advisorScanHint => isAr ? 'امسحي باركود منتج — هل يناسبني؟' : 'Scan a product barcode — does it suit me?';
  String get advisorSend => isAr ? 'إرسال' : 'Send';
  String get advisorListening => isAr ? 'تكلمي… أسمعكِ' : 'Go ahead… I’m listening';
  String get advisorMessageTooLong =>
      isAr ? 'الرسالة طويلة — اختصريها قليلاً' : 'That message is too long — please shorten it';
  String get advisorUnderstood => isAr ? 'فهمت منكِ:' : 'Here’s what I understood:';
  String get advisorClarify => isAr ? 'وضّحي أكثر' : 'Tell me more';
  String get advisorChangeThem => isAr ? 'غيرهم' : 'Show others';
  String get advisorWillApplyNext => isAr ? 'سأعتمدها في ترشيحاتي القادمة' : 'I’ll use this in my next picks';
  /// إزالة شريحة من ملخص الفهم (لقارئ الشاشة): «إزالة بشرة دهنية».
  String advisorRemove(String label) => isAr ? 'إزالة $label' : 'Remove $label';

  // ── الترحيب ──
  String get advisorWelcomeHello => isAr ? 'أهلاً بكِ 🌸' : 'Welcome 🌸';
  String get advisorWhatToday => isAr ? 'شنو تحتاجين اليوم؟' : 'What do you need today?';
  String get advisorAskYourWay => isAr ? 'أو اسأليني بأسلوبكِ' : 'Or ask me in your own words';

  // ── الزر العائم ──
  String get advisorLauncherTitle => isAr ? 'اسألي ديما' : 'Ask Deema';
  String get advisorLauncherSubtitle => isAr ? 'مستشارتكِ للجمال' : 'Your beauty advisor';
  String get advisorLauncherSemantics => isAr ? 'افتحي ديما، مستشارتكِ للجمال' : 'Open Deema, your beauty advisor';

  // ── الترشيحات والمقارنة ──
  String get advisorPicksForYou => isAr ? 'ترشيحاتي لكِ' : 'My picks for you';
  String get advisorBestForYou => isAr ? 'الأنسب لكِ' : 'Best for you';
  String get advisorProductOptions => isAr ? 'خيارات المنتج' : 'Product options';
  String get advisorAskAboutIt => isAr ? 'اسألي ديما عنه' : 'Ask Deema about it';
  String get advisorProductPage => isAr ? 'صفحة المنتج' : 'Product page';
  String get advisorAddToCompare => isAr ? 'أضيفي للمقارنة' : 'Add to compare';
  String get advisorInCompare => isAr ? 'ضمن المقارنة' : 'In comparison';
  String get advisorCompareLimit => isAr ? 'تكدرين تقارنين 3 منتجات بالمرة' : 'You can compare up to 3 products';
  String get advisorPickAnother => isAr ? 'اختاري منتجاً آخر' : 'Pick another product';
  /// «قارني (2)».
  String advisorCompare(int n) => isAr ? 'قارني ($n)' : 'Compare ($n)';
  String get advisorNext => isAr ? 'التالي' : 'Next';
  /// «التالي (2)» — بعد اختيار إجابات في بطاقة الأسئلة.
  String advisorNextCount(int n) => n <= 0 ? advisorNext : (isAr ? 'التالي ($n)' : 'Next ($n)');
  /// «12 درجة» / «2 shades».
  String advisorShadeCount(int n) =>
      isAr ? arCount(n, one: 'درجة واحدة', two: 'درجتان', few: 'درجات', many: 'درجة') : enCount(n, 'shade', 'shades');
  String get advisorSoldOutShort => isAr ? 'نفد حالياً' : 'Sold out';
  String get advisorAvailableAlt => isAr ? 'بديل متوفر' : 'Available alternative';
  String get advisorCheaperAlt => isAr ? 'بديل أرخص' : 'Cheaper alternative';
  String get advisorNotifyRestock => isAr ? 'نبّهيني عند توفره' : 'Notify me when it’s back';
  /// شارة التوفير بالآلاف (مقرّبة للأسفل): «أوفر ألفين» / «Save 2K IQD».
  String advisorSaving(int k) {
    if (k <= 0) return isAr ? 'أوفر' : 'Cheaper';
    return isAr ? 'أوفر ${arThousands(k)}' : 'Save ${k}K IQD';
  }

  // ── التقييم ──
  String get advisorFeedbackAsk => isAr ? 'أفادتكِ الترشيحات؟' : 'Were these picks helpful?';
  String get advisorHelpful => isAr ? 'مفيد' : 'Helpful';
  String get advisorNotHelpful => isAr ? 'غير مفيد' : 'Not helpful';
  String get advisorFeedbackThanks => isAr ? 'شكراً! راح أتذكر ذوقكِ 💜' : 'Thank you! I’ll remember your taste 💜';
  String get advisorFeedbackSorry => isAr
      ? 'شكراً لصراحتكِ — جربي «غيرهم» أو وضحيلي أكثر'
      : 'Thanks for being honest — try “Show others” or tell me more';

  // ── السلة ──
  String get advisorCart => isAr ? 'السلة' : 'Bag';
  String get advisorAddToCart => isAr ? 'أضيفي للسلة' : 'Add to bag';
  /// لقارئ الشاشة على زر الإضافة السريعة: «أضيفي «سيروم…» للسلة».
  String advisorAddProduct(String name) => isAr ? 'أضيفي «$name» للسلة' : 'Add “$name” to bag';
  String get advisorAdded => isAr ? 'أُضيف إلى السلة' : 'Added to bag';
  String get advisorViewCart => isAr ? 'عرض السلة' : 'View bag';
  /// «أضيفي الكل • 45,000 د.ع».
  String advisorAddAll(String price) => isAr ? 'أضيفي الكل  •  $price' : 'Add all  •  $price';
  /// «أُضيف 2 من 3 منتجات».
  String advisorAddedOf(int added, int total) =>
      isAr ? 'أُضيف $added من ${arProducts(total)}' : 'Added $added of ${enCount(total, 'item', 'items')}';
  /// «أُضيف الروتين كاملاً (3 منتجات)».
  String advisorRoutineAdded(int n) =>
      isAr ? 'أُضيف الروتين كاملاً (${arProducts(n)})' : 'Full routine added (${enCount(n, 'item', 'items')})';
  String get advisorPickShade => isAr ? 'اختاري الدرجة المناسبة لكِ 🎨' : 'Pick the shade that suits you 🎨';
  /// «اختاري درجة: Dior، MAC».
  String advisorChooseShadeFor(String names) => isAr ? 'اختاري درجة: $names' : 'Choose a shade: $names';
  String get advisorRoutineNeedsShade => isAr
      ? 'منتجات الروتين تحتاج اختيار درجة — افتحيها من البطاقات'
      : 'Routine items need a shade — open them from the cards';
  String get advisorSoldOut => isAr ? 'هذا المنتج نفد حالياً' : 'This product is sold out right now';
  String get advisorAddFailed => isAr ? 'تعذّرت الإضافة، حاولي مرة ثانية' : 'Couldn’t add it — please try again';

  // ── الروتين ──
  String get advisorSaveRoutine => isAr ? 'احفظي الروتين' : 'Save routine';
  String get advisorMyRoutines => isAr ? 'روتيناتي' : 'My routines';
  /// «3 قطع متناسقة» / «3 matching pieces».
  String advisorMatchingPieces(int n) => isAr
      ? arCount(n, one: 'قطعة واحدة', two: 'قطعتان متناسقتان', few: 'قطع متناسقة', many: 'قطعة متناسقة')
      : enCount(n, 'matching piece', 'matching pieces');

  // ── الملف الجمالي ──
  String get advisorProfileTitle => isAr ? 'ملفكِ الجمالي' : 'Your beauty profile';
  String get advisorProfileSubtitle => isAr
      ? 'ديما تتذكره لترشّح لكِ بدقة — محفوظ على جهازكِ فقط'
      : 'Deema remembers it to recommend precisely — saved on your device only';
  String get advisorSkinType => isAr ? 'نوع بشرتكِ' : 'Your skin type';
  String get advisorConcerns => isAr ? 'تهتمين بـ (البشرة)' : 'Skin concerns';
  String get advisorHair => isAr ? 'شعركِ' : 'Your hair';
  String get advisorScents => isAr ? 'روائح تحبينها' : 'Scents you love';
  String get advisorPerfumes => isAr ? 'عطوركِ' : 'Your fragrances';
  /// حد الاختيارات في المجموعة: «اختاري حتى 3».
  String advisorUpTo(int n) => isAr ? 'اختاري حتى $n' : 'Pick up to $n';
  String get advisorSave => isAr ? 'حفظ' : 'Save';
  String get advisorClearAll => isAr ? 'مسح الكل' : 'Clear all';
}
