import '../../core/l10n/app_strings.dart';

/// نصوص إضافية خاصة بالسلة — بصيغة المؤنث (المتجر يخاطب السيدات).
extension CartStringsX on AppStrings {
  String get undo => isAr ? 'تراجع' : 'Undo';
  String get removeItem => isAr ? 'حذف' : 'Remove';
  String get swipeToRemoveHint => isAr ? 'اسحبي المنتج جانباً لحذفه' : 'Swipe an item to remove it';
  String onlyLeftInStock(int n) => isAr ? 'باقي $n فقط' : 'Only $n left';
  String pricePerPiece(String price) => isAr ? '$price للقطعة' : '$price each';
  String get addMoreItems => isAr ? 'أضيفي المزيد' : 'Add more';
  String get almostFreeShipping => isAr ? 'اقتربتِ من التوصيل المجاني!' : 'You are almost there!';
  String youSaved(String amount) => isAr ? 'وفّرتِ $amount' : 'You saved $amount';
  String get emptyCartPicksTitle => isAr ? 'مختارات قد تعجبكِ' : 'Picks you might love';
  String get emptyCartPicksSubtitle => isAr ? 'الأكثر طلباً من عميلاتنا' : 'Most loved by our customers';
  String get emptyCartHint => isAr
      ? 'كل منتج تضيفينه يظهر هنا، جاهزاً لإتمام الطلب بخطوة واحدة.'
      : 'Everything you add lands here, ready to check out in one step.';
  String get secureCodNote => isAr ? 'الدفع نقداً عند الاستلام' : 'Pay in cash on delivery';
  String get couponPlaceholder => isAr ? 'مثال: GLOW10' : 'e.g. GLOW10';
}
