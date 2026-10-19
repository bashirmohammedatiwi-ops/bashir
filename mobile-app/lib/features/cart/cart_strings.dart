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

  /// «أضيفي 5,000 د.ع ويتفعّل خصم 10%».
  String couponAddToUnlock(String amount, String benefit) =>
      isAr ? 'أضيفي $amount ويتفعّل $benefit' : 'Add $amount to unlock $benefit';

  /// تقرير التحقق من السلة عند فتحها أو قبل الدفع.
  String cartPricesUpdated(int n) => isAr
      ? (n == 1 ? 'تغيّر سعر منتج في سلتكِ' : 'تغيّرت أسعار بعض منتجات سلتكِ (\u2066$n\u2069)')
      : (n == 1 ? 'A price in your bag changed' : 'Prices of ${enCount(n, 'item', 'items')} in your bag changed');
  String get cartQuantitiesClamped => isAr ? 'خفّضنا الكمية إلى المتوفر' : 'We lowered quantities to what is in stock';
  String cartUnavailableCount(int n) => isAr
      ? (n == 1 ? 'منتج في سلتكِ لم يعد متوفراً' : 'بعض منتجات سلتكِ لم تعد متوفرة (\u2066$n\u2069)')
      : (n == 1
            ? 'An item in your bag is no longer available'
            : '${enCount(n, 'item', 'items')} in your bag are no longer available');
  String cartPackagesEnded(String names) => isAr ? 'انتهى عرض الباقة: $names' : 'Bundle offer ended: $names';
  String get cartUnavailableLabel => isAr ? 'غير متوفر الآن' : 'Not available now';
  String get cartRemoveUnavailable => isAr ? 'أزيلي غير المتوفر لإتمام الطلب' : 'Remove unavailable items to check out';
  String get cartCompleteFreeShipping => isAr ? 'أكملي للتوصيل المجاني' : 'Top up for free delivery';
  String cartCompleteFreeShippingHint(String amount) =>
      isAr ? 'ينقصكِ $amount — اختيارات بسعر قريب' : '$amount to go — picks at about that price';

  /// أُضيف أقل مما طُلب لأن المخزون لا يكفي.
  String onlyAddedInStock(int n) =>
      isAr ? 'أضفنا \u2066$n\u2069 فقط — هذا المتوفر' : 'Only $n added — that is what is in stock';

  // ─── تنبيه تحديث السلة (أعلى الصفحة) ───
  String get cartUpdatedTitle => isAr ? 'تحدّثت سلتكِ' : 'Your bag was updated';
  String get cartRemoveAllUnavailable => isAr ? 'أزيلي غير المتوفر' : 'Remove unavailable';
  String cartUnavailableRemoved(int n) => isAr
      ? (n == 1 ? 'أزلنا منتجاً غير متوفر' : 'أزلنا ${arProducts(n)} غير متوفرة')
      : 'Removed ${enCount(n, 'unavailable item', 'unavailable items')}';
  String get cartDismissNotice => isAr ? 'إخفاء التنبيه' : 'Dismiss';

  // ─── سطر المنتج ───
  String get saveForLater => isAr ? 'احفظيه لاحقاً' : 'Save for later';
  String get signInToSaveForLater =>
      isAr ? 'سجّلي الدخول حتى تحفظين المنتج بالمفضلة' : 'Sign in to save items for later';
  String get savedForLater => isAr ? 'حفظناه بمفضلتكِ ♡' : 'Saved to your wishlist ♡';
  String shadeLabel(String name) => isAr ? 'الدرجة: $name' : 'Shade: $name';

  // ─── الملخص وشريط الدفع ───
  String get cartOrderSummary => isAr ? 'ملخص الطلب' : 'Order summary';
  String get cartOfferSavings => isAr ? 'توفير العروض' : 'Offer savings';
  String get cartBundleSavings => isAr ? 'توفير الباقات 🎁' : 'Bundle savings 🎁';
  String get cartEstimatedTotal => isAr ? 'المجموع التقديري (قبل التوصيل)' : 'Estimated total (before delivery)';
  String cartBarTotal(int n) =>
      isAr ? 'الإجمالي التقديري • ${arProducts(n)}' : 'Estimated total • ${enCount(n, 'item', 'items')}';
  String cartWillEarnPoints(int n) => isAr ? 'ستكسبين ${arPoints(n)}' : "You'll earn ${enCount(n, 'point', 'points')}";
  String cartBeforeDiscounts(String amount) => isAr ? 'قبل الخصم $amount' : 'Before discounts $amount';

  // ─── اقتراحات ───
  String get cartPairsTitle => isAr ? 'يكمّل سلتكِ' : 'Complete your bag';
  String get cartPairsSubtitle => isAr ? 'اختيارات تناسب ما أضفتِه' : 'Picked to go with your items';

  // ─── الباقات ───
  String get cartYourBundles => isAr ? 'باقاتكِ' : 'Your bundles';
  String get cartBundleComplete => isAr ? '✓ مكتملة' : '✓ Complete';
  String cartBundleCompleteSaved(String amount) => isAr ? '✓ مكتملة — وفّرتِ $amount' : '✓ Complete — you save $amount';
  String cartBundleMissing(int n) => isAr
      ? 'ينقصها ${arProducts(n)} — أكمليها لسعر الباقة'
      : '${enCount(n, 'item', 'items')} missing — complete it for the bundle price';
  String get cartCompleteBundle => isAr ? 'أكمليها' : 'Complete';
  String get cartRemoveBundle => isAr ? 'إلغاء الباقة (تبقى المنتجات)' : 'Remove bundle (items stay)';
}
