import '../../core/l10n/app_strings.dart';

/// نصوص شاشة البحث — مخاطبة دافئة بصيغة المؤنث.
extension SearchStringsX on AppStrings {
  String get searchFieldHint => isAr ? 'ابحثي عن منتج، براند أو قسم…' : 'Search products, brands, categories…';
  String get searchTypeMore => isAr ? 'اكتبي حرفين على الأقل…' : 'Type at least 2 characters…';
  String get searchClearField => isAr ? 'مسح النص' : 'Clear text';
  String get searchScanBarcode => isAr ? 'مسح الباركود' : 'Scan barcode';

  // اقتراحات حية
  String get searchSuggestCategories => isAr ? 'أقسام' : 'Categories';
  String get searchSuggestBrands => isAr ? 'براندات' : 'Brands';
  String get searchSuggestProducts => isAr ? 'منتجات مقترحة' : 'Top matches';
  String searchSeeAllFor(String q) => isAr ? 'عرض كل النتائج لـ «$q»' : 'See all results for “$q”';
  String get searchDidYouMean => isAr ? 'هل تقصدين' : 'Did you mean';
  String get searchQuestionMark => isAr ? '؟' : '?';
  String get searchSuggestOffline =>
      isAr ? 'تعذّر جلب الاقتراحات — اضغطي بحث للمتابعة' : 'Couldn’t load suggestions — tap search to continue';

  // النتائج
  String searchResultsCount(int n) {
    if (!isAr) return n == 1 ? '1 product' : '$n products';
    if (n == 1) return 'منتج واحد';
    if (n == 2) return 'منتجان';
    if (n >= 3 && n <= 10) return '$n منتجات';
    return '$n منتج';
  }

  String searchResultsFor(String q) => isAr ? 'نتائج «$q»' : 'Results for “$q”';
  String get searchFilterSort => isAr ? 'فلترة وترتيب' : 'Filter & sort';
  String get searchLoadMore => isAr ? 'عرض المزيد' : 'Load more';
  String get searchEndOfResults => isAr ? 'هذه كل النتائج' : 'That’s everything';

  // الحالة الفارغة
  String searchNoResultsTitle(String q) => isAr ? 'لم نجد نتائج لـ «$q»' : 'No results for “$q”';
  String get searchNoResultsBody => isAr
      ? 'جرّبي كلمة أبسط، أو اسم البراند، أو اكتبيها بالعربي أو الإنجليزي.'
      : 'Try a simpler word, the brand name, or spell it in Arabic or English.';
  String get searchTryAlso => isAr ? 'جرّبي أيضاً' : 'Try instead';
  String get searchBrowseCategories => isAr ? 'تصفّحي الأقسام' : 'Browse categories';

  // الحالة الافتراضية
  String get searchRecentTitle => isAr ? 'عمليات بحثك الأخيرة' : 'Recent searches';
  String get searchClearAll => isAr ? 'مسح الكل' : 'Clear all';
  String searchRemoveRecent(String q) => isAr ? 'حذف «$q»' : 'Remove “$q”';
  String get searchPopularCategories => isAr ? 'أقسام رائجة' : 'Popular categories';
  String get searchPopularSubtitle =>
      isAr ? 'ابدئي من هنا إن لم تعرفي ما تبحثين عنه' : 'Start here if you’re just browsing';
  String get searchRecentlyViewedSubtitle => isAr ? 'عودي لما أعجبكِ' : 'Pick up where you left off';
  String get searchIdleTitle => isAr ? 'عمّ تبحثين اليوم؟' : 'What are you looking for?';
  String get searchIdleBody => isAr
      ? 'ابحثي بالعربي أو الإنجليزي، باسم المنتج أو البراند أو حتى بالباركود.'
      : 'Search in Arabic or English — by product, brand, or barcode.';
}
