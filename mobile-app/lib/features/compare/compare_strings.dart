import '../../core/l10n/app_strings.dart';

/// نصوص «قارني» — زر صفحة المنتج، الشريط العائم، وشاشة المقارنة.
extension CompareStringsX on AppStrings {
  String get compareAction => isAr ? 'قارني' : 'Compare';
  String get compareAdd => isAr ? 'أضيفي للمقارنة' : 'Add to compare';
  String get compareRemove => isAr ? 'أزيليه من المقارنة' : 'Remove from compare';
  String get compareNow => isAr ? 'قارني الآن' : 'Compare now';
  String get compareTitle => isAr ? 'مقارنة المنتجات' : 'Compare products';
  String get compareClearAll => isAr ? 'مسح الكل' : 'Clear all';
  String get compareCleared => isAr ? 'أفرغنا قائمة المقارنة' : 'Compare list cleared';
  String get compareUndo => isAr ? 'تراجع' : 'Undo';
  String get compareHideTray => isAr ? 'إخفاء شريط المقارنة' : 'Hide compare bar';
  String compareMax(int n) => isAr ? 'قارني حتى $n منتجات' : 'Compare up to $n products';
  String get compareAddedFirst =>
      isAr ? 'أُضيف للمقارنة — أضيفي منتجاً آخر' : 'Added to compare — add one more';
  String get compareAdded => isAr ? 'أُضيف للمقارنة' : 'Added to compare';
  String get compareRemoved => isAr ? 'أُزيل من المقارنة' : 'Removed from compare';

  /// «منتجان للمقارنة» / «3 منتجات للمقارنة».
  String compareCount(int n) => isAr ? '${arProducts(n)} للمقارنة' : '${enCount(n, 'product', 'products')} to compare';

  /// العدد وحده للشريط العائم الضيق: «منتجان» / «4 منتجات».
  String compareCountShort(int n) => isAr ? arProducts(n) : enCount(n, 'product', 'products');

  String get compareEmptyTitle => isAr ? 'قارني بين المنتجات' : 'Compare products side by side';
  String get compareEmptyBody => isAr
      ? 'اضغطي «قارني» في صفحة أي منتج، وأضيفي منتجين أو أكثر (حتى 4) لتشوفينها جنب بعض.'
      : 'Tap "Compare" on any product page and add two or more (up to 4) to see them side by side.';
  String get compareNeedOneMore =>
      isAr ? 'عندكِ منتج واحد — أضيفي منتجاً آخر' : 'You have one product — add another';
  String get compareBrowse => isAr ? 'تصفّحي المنتجات' : 'Browse products';
  String get compareLoadFailed => isAr ? 'تعذّر تحديث المقارنة' : "Couldn't refresh the comparison";
  String compareDropped(int n) => isAr
      ? (n == 1 ? 'منتج لم يعد متوفراً في المتجر فأزلناه' : '${arProducts(n)} لم تعد في المتجر فأزلناها')
      : (n == 1 ? 'A product is no longer sold, so we removed it' : '$n products are no longer sold, so we removed them');

  // ─── صفوف الجدول ───
  String get compareRowPrice => isAr ? 'السعر' : 'Price';
  String get compareRowRating => isAr ? 'التقييم' : 'Rating';
  String get compareRowBrand => isAr ? 'البراند' : 'Brand';
  String get compareRowSize => isAr ? 'الحجم' : 'Size';
  String compareRowPerUnit(String unit) => isAr ? 'السعر لكل $unit' : 'Price per $unit';
  String get compareRowShades => isAr ? 'الألوان' : 'Shades';
  String get compareRowSkin => isAr ? 'نوع البشرة' : 'Skin type';
  String get compareRowIngredients => isAr ? 'المكوّنات الأساسية' : 'Key ingredients';
  String get compareRowStock => isAr ? 'التوفّر' : 'Availability';

  String comparePriceFrom(String price) => isAr ? 'من $price' : 'From $price';
  String get compareBest => isAr ? 'الأفضل' : 'Best';
  String get compareShared => isAr ? 'مشترك بينها' : 'In common';
  String get compareFitsYou => isAr ? 'يناسب بشرتكِ' : 'Fits your skin';
  String compareShadeCount(int n) => isAr
      ? arCount(n, one: 'لون واحد', two: 'لونان', few: 'ألوان', many: 'لوناً')
      : enCount(n, 'shade', 'shades');
  String get compareInStock => isAr ? 'متوفر' : 'In stock';
  String get compareSoldOut => isAr ? 'نفد' : 'Sold out';
  String get compareChooseShade => isAr ? 'اختاري اللون' : 'Choose shade';
  String get compareAddToBag => isAr ? 'أضيفي للسلة' : 'Add to bag';
  String compareRemoveItem(String name) => isAr ? 'إزالة $name من المقارنة' : 'Remove $name from compare';
  String get compareScrollHint => isAr ? 'مرّري للجانب لرؤية البقية' : 'Swipe sideways to see the rest';
}
