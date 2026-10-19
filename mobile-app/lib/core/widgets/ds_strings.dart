import '../l10n/app_strings.dart';

/// نصوص مكوّنات التصميم المشتركة: بطاقة المنتج، السعر، ورقة الدرجات السريعة،
/// وشريط التوصيل المجاني. كل الأسماء تبدأ بـ «ds» حتى لا تتعارض مع مفاتيح الشاشات.
extension DsStringsX on AppStrings {
  // ── أزرار البطاقة (لقارئ الشاشة) ──
  String get dsChooseShade => isAr ? 'اختاري الدرجة' : 'Choose a shade';
  String get dsIncreaseQty => isAr ? 'زيادة الكمية' : 'Increase quantity';
  String get dsDecreaseQty => isAr ? 'إنقاص الكمية' : 'Decrease quantity';
  String get dsRemoveFromCart => isAr ? 'إزالة من السلة' : 'Remove from bag';
  String get dsAddToCart => isAr ? 'أضيفي للسلة' : 'Add to bag';
  String get dsAdd => isAr ? 'أضيفي' : 'Add';
  String get dsWishlist => isAr ? 'المفضلة' : 'Wishlist';
  String get dsSavedToWishlist => isAr ? 'حفظناه في مفضلتكِ' : 'Saved to your wishlist';

  /// سبب طلب إذن الإشعارات بعد أول حفظ في المفضلة.
  String get dsWishlistPushReason => isAr
      ? 'نخبركِ فور انخفاض سعر ما حفظتِه أو عودته للمخزون.'
      : "We'll tell you the moment something you saved drops in price or is back in stock.";

  /// «درجة واحدة» / «درجتان» / «5 درجات» / «21 درجة» — «1 shade» / «12 shades».
  String dsShadesCount(int n) {
    if (!isAr) return n == 1 ? '1 shade' : '$n shades';
    if (n == 1) return 'درجة واحدة';
    if (n == 2) return 'درجتان';
    final m = n % 100;
    if (m >= 3 && m <= 10) return '$n درجات';
    return '$n درجة';
  }

  /// «12 متوفرة من 15» — فوق شبكة الدرجات.
  String dsShadesInStock(int inStock, int total) =>
      isAr ? '$inStock متوفرة من $total' : '$inStock of $total in stock';

  /// اسم الدرجة لقارئ الشاشة مع حالتها.
  String dsShadeOption(String name, {required bool soldOut}) {
    if (!soldOut) return name;
    return isAr ? '$name، نفدت' : '$name, sold out';
  }

  // ── تنبيه التوفّر ──
  String get dsNotifyMe => isAr ? 'نبّهيني عند التوفّر' : 'Notify me when available';
  String get dsRestockWillNotify =>
      isAr ? 'تم! سننبّهكِ فور توفّره' : "Done! We'll let you know as soon as it's back";
  String get dsRestockCancelled => isAr ? 'ألغينا تنبيه التوفّر' : 'Restock alert cancelled';

  // ── ورقة الدرجات ──
  String get dsProductDetails => isAr ? 'تفاصيل المنتج' : 'Product details';

  // ── السعر ──
  /// «وفّري 5,000 د.ع».
  String dsYouSave(String price) => isAr ? 'وفّري $price' : 'You save $price';

  // ── التوصيل المجاني ──
  String dsFreeShippingLeft(String price) =>
      isAr ? 'باقي $price وتصير التوصيلة مجانية' : '$price more for free delivery';
  String get dsFreeShippingUnlocked =>
      isAr ? 'مبروك! طلبكِ صار توصيله مجاني 🎉' : 'Your order now ships free 🎉';
  String get dsFreeShippingViaCoupon =>
      isAr ? 'كوبونكِ فعّل التوصيل المجاني 🎉' : 'Your coupon unlocked free delivery 🎉';
  String get dsFreeShippingAlmost => isAr ? 'اقتربتِ من التوصيل المجاني!' : "You're almost there!";
  String get dsAddMore => isAr ? 'أضيفي المزيد' : 'Add more';

  /// وصف البطاقة كاملة لقارئ الشاشة: «الاسم، السعر، خصم 25٪، نفدت الكمية».
  String dsProductSemantics(String name, String price, bool soldOut, int pct) {
    final parts = [
      name,
      price,
      if (pct > 0) isAr ? 'خصم $pct٪' : '$pct% off',
      if (soldOut) isAr ? 'نفدت الكمية' : 'sold out',
    ];
    return parts.join(isAr ? '، ' : ', ');
  }
}
