import '../../core/l10n/app_strings.dart';
import '../../core/utils/formatters.dart';
import '../../data/models/search_instant.dart';

/// نصوص شاشة البحث — مخاطبة دافئة بصيغة المؤنث، بنبرة واحدة في كل الحالات.
extension SearchStringsX on AppStrings {
  // ─── الحقل ────────────────────────────────────────────────────────────────
  String get searchFieldHint => isAr ? 'ابحثي عن منتج، براند أو قسم…' : 'Search products, brands, categories…';

  /// تلميح متبدّل في الحقل الفارغ: «ابحثي عن سيروم…».
  String searchHintFor(String name) => isAr ? 'ابحثي عن $name…' : 'Search for $name…';
  String get searchTypeMore => isAr ? 'اكتبي حرفين على الأقل…' : 'Type at least 2 characters…';
  String get searchClearField => isAr ? 'مسح النص' : 'Clear text';
  String get searchScanBarcode => isAr ? 'مسح الباركود' : 'Scan barcode';

  /// «سيروم» بين علامتي تنصيص تناسبان اللغة.
  String searchQuoted(String q) => isAr ? '«$q»' : '“$q”';

  // ─── الاقتراحات الفورية ───────────────────────────────────────────────────
  String get searchSuggestProducts => isAr ? 'منتجات مقترحة' : 'Top matches';
  String get searchBrandBadge => isAr ? 'براند' : 'Brand';
  String get searchFillTooltip => isAr ? 'أكملي من هنا' : 'Continue typing from here';
  String get searchSoldOut => isAr ? 'نفد' : 'Sold out';
  String searchSeeAll(int total) =>
      isAr ? 'عرض كل النتائج (${formatNumber(total)})' : 'See all results (${formatNumber(total)})';
  String get searchSuggestOffline => isAr ? 'تعذّر جلب الاقتراحات — تأكدي من الاتصال' : 'Couldn’t load suggestions — check your connection';

  /// التصحيح الإملائي: النتائج المعروضة هي للكلمة المصحّحة أصلاً.
  String get searchCorrectedPrefix => isAr ? 'نتائج لـ ' : 'Showing results for ';
  String get searchInsteadPrefix => isAr ? 'ابحثي عن ' : 'Search for ';
  String get searchInsteadSuffix => isAr ? ' بدلاً من ذلك' : ' instead';

  // ─── النتائج ──────────────────────────────────────────────────────────────
  String get searchNoResultsShort => isAr ? 'لا نتائج' : 'No results';
  String get searchFailed => isAr ? 'تعذّر البحث — تأكدي من الاتصال وحاولي مجدداً' : 'Search failed — check your connection and try again';
  String get searchUnderstoodPrefix => isAr ? 'فهمنا: ' : 'We understood: ';
  String get searchLoadMoreFailed => isAr ? 'تعذّر تحميل المزيد' : 'Couldn’t load more';
  String get searchEndOfResults => isAr ? 'هذه كل النتائج' : 'That’s everything';
  String searchEndOfResultsCount(int n) => '$searchEndOfResults · ${productsN(n)}';

  // ─── الفلاتر ──────────────────────────────────────────────────────────────
  String get searchFilterDeals => isAr ? 'عروض' : 'Deals';
  String get searchFilterInStock => isAr ? 'متوفر' : 'In stock';
  String get searchFilterBrand => isAr ? 'البراند' : 'Brand';
  String searchFilterBrandCount(int n) => isAr ? 'البراند ($n)' : 'Brands ($n)';
  String get searchFilterKind => isAr ? 'النوع' : 'Type';
  String get searchFilterCategory => isAr ? 'القسم' : 'Category';
  String get searchFilterPrice => isAr ? 'السعر' : 'Price';
  String get searchFilterClear => isAr ? 'مسح' : 'Clear';
  String get searchClearFilters => isAr ? 'مسح الفلاتر' : 'Clear filters';
  String get searchFilterAll => isAr ? 'الكل' : 'All';
  String get searchShowResults => isAr ? 'عرض النتائج' : 'Show results';
  String get searchSortTitle => isAr ? 'الترتيب' : 'Sort by';
  String searchBrandsSelected(int n) => isAr ? 'اخترتِ $n' : '$n selected';

  String sortLabel(SearchSort sort) => switch (sort) {
        SearchSort.relevance => isAr ? 'الأنسب' : 'Best match',
        SearchSort.priceAsc => isAr ? 'الأرخص' : 'Price: low to high',
        SearchSort.priceDesc => isAr ? 'الأغلى' : 'Price: high to low',
        SearchSort.best => isAr ? 'الأكثر مبيعاً' : 'Best sellers',
        SearchSort.rating => isAr ? 'الأعلى تقييماً' : 'Top rated',
        SearchSort.newest => isAr ? 'الأحدث' : 'Newest',
        SearchSort.discount => isAr ? 'أعلى خصم' : 'Biggest discount',
      };

  // ─── السعر ────────────────────────────────────────────────────────────────
  /// مبلغ مختصر: «25 ألف د.ع» حين يكون بالآلاف، وإلا السعر كاملاً.
  String searchMoney(int v) => v >= 1000 && v % 1000 == 0 ? priceThousands(v ~/ 1000) : formatPrice(v, lang: lang);
  String get searchAnyPrice => isAr ? 'أي سعر' : 'Any price';
  String searchPriceUnder(int max) => isAr ? 'حتى ${searchMoney(max)}' : 'Up to ${searchMoney(max)}';
  String searchPriceOver(int min) => isAr ? 'من ${searchMoney(min)} فأكثر' : '${searchMoney(min)} and up';
  String searchPriceBetween(int min, int max) => '${searchMoney(min)} – ${searchMoney(max)}';

  /// شريحة سعر مقروءة (null = بلا حد).
  String searchPriceRange(int? min, int? max) {
    if (min == null && max == null) return searchAnyPrice;
    if (min == null) return searchPriceUnder(max!);
    if (max == null) return searchPriceOver(min);
    return searchPriceBetween(min, max);
  }

  String get searchBudgetFromQuery =>
      isAr ? 'حدّدنا السعر من كلمات بحثكِ — اختاري غيره إن شئتِ' : 'We set this price from your search words — pick another if you like';

  // ─── الحالة الفارغة ───────────────────────────────────────────────────────
  String searchNoResultsTitle(String q) => isAr ? 'لم نجد نتائج لـ ${searchQuoted(q)}' : 'No results for ${searchQuoted(q)}';
  String get searchNoResultsBody => isAr
      ? 'جرّبي كلمة أبسط، أو اسم البراند، أو اكتبيها بالعربي أو الإنجليزي.'
      : 'Try a simpler word, the brand name, or spell it in Arabic or English.';
  String get searchNoFilteredResults => isAr ? 'لا نتائج بهذه الفلاتر' : 'No results with these filters';
  String get searchPopularSearches => isAr ? 'الأكثر بحثاً' : 'Popular searches';
  List<String> get searchPopularTerms => isAr
      ? const ['سيروم', 'واقي شمس', 'أحمر شفاه', 'عطر نسائي', 'شامبو', 'كريم مرطب', 'ماسكارا', 'غسول']
      : const ['Serum', 'Sunscreen', 'Lipstick', 'Perfume', 'Shampoo', 'Moisturizer', 'Mascara', 'Cleanser'];

  // ─── الحالة الافتراضية ────────────────────────────────────────────────────
  String get searchRecentTitle => isAr ? 'عمليات بحثك الأخيرة' : 'Recent searches';
  String get searchClearAll => isAr ? 'مسح الكل' : 'Clear all';
  String searchRemoveRecent(String q) => isAr ? 'حذف ${searchQuoted(q)}' : 'Remove ${searchQuoted(q)}';
  String get searchRecentCleared => isAr ? 'مُسح سجل البحث' : 'Search history cleared';
  String get searchRecentlyViewedCleared => isAr ? 'مُسحت المنتجات التي شاهدتِها' : 'Recently viewed cleared';
  String get searchRecentlyViewedSubtitle => isAr ? 'عودي لما أعجبكِ' : 'Pick up where you left off';
  String get searchIdleTitle => isAr ? 'عمّ تبحثين اليوم؟' : 'What are you looking for?';
  String get searchIdleBody => isAr
      ? 'ابحثي بالعربي أو الإنجليزي، باسم المنتج أو البراند أو حتى بالباركود.'
      : 'Search in Arabic or English — by product, brand, or barcode.';
  String get searchWorldsTitle => isAr ? 'ابحثي في عالم' : 'Explore a world';
  String get searchWorldsSubtitle => isAr ? 'كل عالم بأقسامه ومختاراته' : 'Each world with its own picks';
  /// عبارات يبحث عنها الزبائن فعلاً (من سجل البحث المجهول على الخادم).
  String get searchTrendingTitle => isAr ? 'الأكثر بحثاً الآن' : 'Trending searches';
  String get searchTrendingSubtitle => isAr ? 'ما تبحث عنه صديقاتكِ هذه الأيام' : 'What shoppers are searching for lately';

  /// قبل أن يتجمّع سجل كافٍ (أو بلا اتصال): اقتراحات ثابتة — لا ندّعي أنها «الأكثر بحثاً».
  String get searchIdeasTitle => isAr ? 'أفكار للبحث' : 'Search ideas';
  String get searchIdeasSubtitle => isAr ? 'ابدئي بواحدة منها' : 'Start with one of these';

  /// الأقسام الأغنى بالمنتجات — ترتيبها بعدد المنتجات لا بعدد مرات البحث.
  String get searchPopularCategories => isAr ? 'أقسام غنية بالمنتجات' : 'Popular categories';
  String get searchPopularCategoriesSubtitle => isAr ? 'أكبر تشكيلة في المتجر' : 'Our widest selections';
  String get searchShopByCategory => isAr ? 'تسوّقي حسب القسم' : 'Shop by category';
  String get searchTopBrands => isAr ? 'أبرز البراندات' : 'Top brands';
  String get searchViewAll => isAr ? 'عرض الكل' : 'View all';

  // ─── الماسح ───────────────────────────────────────────────────────────────
  String get searchScannerUnavailable => isAr ? 'تعذّر تشغيل الكاميرا' : 'Couldn’t start the camera';
  String get searchScannerUnavailableBody =>
      isAr ? 'يمكنكِ كتابة الأرقام المطبوعة تحت الباركود بدلاً من ذلك.' : 'You can type the digits printed under the barcode instead.';
  String get searchCodeAction => isAr ? 'بحث' : 'Search';
}
