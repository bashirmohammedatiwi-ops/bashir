import '../../core/l10n/app_strings.dart';
import '../../core/utils/formatters.dart';

/// نصوص شاشة العالم وبطاقاته في الرئيسية. كل الأسماء تبدأ بـ «world» حتى لا
/// تتعارض مع مفاتيح الشاشات الأخرى.
extension WorldStringsX on AppStrings {
  // ── الشريط السفلي للعالم ──
  String get worldTabExplore => isAr ? 'استكشاف' : 'Explore';
  String get worldTabSections => isAr ? 'الأقسام' : 'Sections';
  String get worldTabSearch => isAr ? 'بحث' : 'Search';
  String get worldTabStore => isAr ? 'المتجر' : 'Store';

  // ── الترويسة ──
  String get worldEyebrow => isAr ? 'عالم' : 'WORLD';

  // ── الأقسام ──
  String get worldIndexEyebrow => isAr ? 'فهرس الأقسام' : 'INDEX';
  String get worldChooseSection => isAr ? 'اختاري قسماً' : 'Choose a section';
  String get worldNoSections => isAr ? 'هذا العالم بلا أقسام بعد' : 'This world has no sections yet';
  String get worldAllProducts => isAr ? 'كل المنتجات' : 'All products';

  /// «4 داخل القسم» تحت اسم القسم ذي الفروع.
  String worldInsideCount(int n) => isAr ? '${formatNumber(n)} داخل القسم' : '${formatNumber(n)} inside';

  // ── الاستكشاف ──
  String get worldIndexTitle => isAr ? 'الفهرس' : 'INDEX';
  String get worldBestSellers => isAr ? 'الأكثر مبيعاً' : 'BEST SELLERS';
  String get worldJustIn => isAr ? 'وصل حديثاً' : 'JUST IN';
  String get worldFromThisWorld => isAr ? 'من هذا العالم' : 'FROM THIS WORLD';
  String get worldBrands => isAr ? 'البراندات' : 'BRANDS';
  String get worldComingSoon => isAr
      ? 'نجهّز هذا العالم لكِ — عودي قريباً'
      : "We're preparing this world for you — check back soon";

  /// عنوان صفحة «عرض الكل» لرفّ في عالم: «الأكثر مبيعاً — سحر الجمال».
  String worldShelfTitle(String shelf, String world) => '$shelf — $world';
  String get worldBestSellersTitle => isAr ? 'الأكثر مبيعاً' : 'Best sellers';
  String get worldJustInTitle => isAr ? 'وصل حديثاً' : 'Just in';

  // ── البحث داخل العالم ──
  String get worldSearchHint => isAr ? 'ابحثي داخل هذا العالم' : 'Search this world';
  String get worldSearchIntro =>
      isAr ? 'ابحثي عن قسم أو منتج داخل هذا العالم' : 'Search sections and products in this world';
  String get worldSearchSections => isAr ? 'أقسام' : 'Sections';
  String get worldSearchProducts => isAr ? 'منتجات' : 'Products';
  String get worldSearchMinLetters =>
      isAr ? 'اكتبي حرفين على الأقل للبحث عن المنتجات' : 'Type at least two letters to search products';
  String get worldNoProducts => isAr ? 'لا منتجات مطابقة داخل هذا العالم' : 'No matching products in this world';
  String get worldSearchEverywhere => isAr ? 'ابحثي في كل المتجر' : 'Search the whole store';
  String get worldClearSearch => isAr ? 'مسح البحث' : 'Clear search';

  // ── بطاقات الرئيسية ──
  String get worldOurBrands => isAr ? 'برانداتنا' : 'Our brands';
  String get worldGiftPromise => isAr ? 'تغليف هدية • بطاقة برسالتكِ' : 'Gift wrap • A card with your message';

  /// شريحة ميزانية الهدية: «أقل من 10 ألف»، «10–25 ألف»، «+50 ألف».
  String worldBudgetChip(int? min, int? max) {
    final thousands = (min ?? 0) % 1000 == 0 && (max ?? 0) % 1000 == 0;
    String n(int v) => thousands ? formatNumber(v ~/ 1000) : formatNumber(v);
    final unit = thousands ? (isAr ? ' ألف' : 'K') : (isAr ? ' د.ع' : ' IQD');
    if (min == null) return isAr ? 'أقل من ${n(max!)}$unit' : 'Under ${n(max!)}$unit';
    if (max == null) return isAr ? '+${n(min)}$unit' : '${n(min)}$unit+';
    return '${n(min)}–${n(max)}$unit';
  }

  /// عنوان صفحة المنتجات للشريحة: «هدايا أقل من 10,000 د.ع».
  String worldGiftBudgetTitle(int? min, int? max) {
    if (min == null) {
      return isAr ? 'هدايا أقل من ${formatNumber(max)} د.ع' : 'Gifts under ${formatNumber(max)} IQD';
    }
    if (max == null) {
      return isAr ? 'هدايا أكثر من ${formatNumber(min)} د.ع' : 'Gifts over ${formatNumber(min)} IQD';
    }
    return isAr
        ? 'هدايا من ${formatNumber(min)} إلى ${formatNumber(max)} د.ع'
        : 'Gifts ${formatNumber(min)} – ${formatNumber(max)} IQD';
  }
}
