import '../../core/l10n/app_strings.dart';
import '../../core/network/api_exception.dart';
import '../../core/utils/friendly_error.dart';

/// نصوص إضافية لإتمام الطلب وشاشة النجاح.
extension CheckoutStringsX on AppStrings {
  String get secureCheckout => isAr ? 'طلب آمن ومضمون' : 'Safe & secure order';
  String get itemsInOrder => isAr ? 'منتجات الطلب' : 'Items in your order';
  String showAllItems(int n) => isAr ? 'عرض الكل ($n)' : 'Show all ($n)';
  String get showLess => isAr ? 'عرض أقل' : 'Show less';
  String get savedAddresses => isAr ? 'عناويني المحفوظة' : 'Saved addresses';
  String get calculating => isAr ? 'جارٍ الحساب…' : 'Calculating…';
  String get orderNumberCopied => isAr ? 'تم نسخ رقم الطلب' : 'Order number copied';
  String get copy => isAr ? 'نسخ' : 'Copy';
  String get orderNumberTitle => isAr ? 'رقم طلبكِ' : 'Your order number';
  String get thankYouTitle => isAr ? 'شكراً لكِ!' : 'Thank you!';
  String get whatsNextTitle => isAr ? 'ماذا بعد؟' : "What's next?";
  String get nextConfirmCall => isAr ? 'سنتواصل معكِ قريباً لتأكيد الطلب' : "We'll contact you shortly to confirm";
  String get nextPrepare => isAr ? 'نجهّز منتجاتكِ بعناية ونغلّفها' : 'We carefully prepare and pack your items';
  String get nextPayOnDelivery => isAr ? 'ادفعي نقداً عند استلام الطلب' : 'Pay in cash when your order arrives';
  String get nextPayAtBranch => isAr ? 'ادفعي عند استلام طلبكِ من الفرع' : 'Pay when you collect your order at the branch';
  String get nextNothingToPay =>
      isAr ? 'طلبكِ مغطّى بالكامل — لا شيء للدفع' : 'Your order is fully covered — nothing to pay';
  String get placingOrder => isAr ? 'جارٍ تأكيد الطلب…' : 'Placing order…';
  String get checkoutOffline =>
      isAr ? 'لا يوجد اتصال — اتصلي بالإنترنت لإتمام الطلب' : "You're offline — connect to place your order";
  String get checkoutUnavailableItems =>
      isAr ? 'في سلتكِ منتج لم يعد متوفراً — أزيليه من السلة أولاً' : 'An item in your bag is no longer available — remove it first';
  String get pickupReadyNotice =>
      isAr ? 'استلام من الفرع — نبلغكِ حين يجهز طلبكِ' : "Branch pickup — we'll let you know when it's ready";
  /// النقاط المكتسبة تُضاف للرصيد عند تسليم الطلب (لا عند إنشائه).
  String pointsAddedToBalance(int n) => isAr
      ? 'تُضاف ${arPoints(n)} لرصيدكِ عند استلام طلبكِ ✨'
      : "${enCount(n, 'point', 'points')} will be added to your balance on delivery ✨";
  String giftWrapNotice({required bool withMessage}) => isAr
      ? 'نغلّفه كهدية${withMessage ? ' مع رسالتكِ' : ''} 🎁'
      : 'Gift-wrapped${withMessage ? ' with your message' : ''} 🎁';

  // ─── التوصيل والاستلام ─────────────────────────────────────────────────────
  String get receiveMethodTitle => isAr ? 'طريقة الاستلام' : 'How would you like it?';
  String get homeDelivery => isAr ? 'توصيل للبيت' : 'Home delivery';
  String get homeDeliveryHint => isAr ? 'نوصله لباب بيتكِ' : 'Delivered to your door';
  String get pickupFreeHint => isAr ? 'مجاناً — نبلغكِ حين يجهز' : "Free — we'll tell you when it's ready";
  String pickupHoursLabel(String hours) => isAr ? 'أوقات الاستلام: $hours' : 'Pickup hours: $hours';
  String get makeDefaultAddress => isAr ? 'اجعليه عنواني الافتراضي' : 'Make this my default address';
  String get addressesLoadFailed => isAr ? 'تعذّر تحميل عناوينكِ' : "Couldn't load your addresses";
  String get zonesLoadFailed => isAr ? 'تعذّر تحميل المحافظات' : "Couldn't load governorates";

  // ─── الملخص والمبالغ ───────────────────────────────────────────────────────
  String get bundleSavings => isAr ? 'توفير الباقات 🎁' : 'Bundle savings 🎁';
  String get shippingQuoteFailed => isAr ? 'تعذّر الحساب — إعادة' : "Couldn't calculate — retry";
  String get shippingPendingNote =>
      isAr ? 'يُحسب التوصيل بعد اختيار المحافظة' : 'Delivery is calculated once you pick a governorate';
  String get loyaltyOrderTooSmall =>
      isAr ? 'قيمة الطلب أقل من أن تُستخدم النقاط' : 'This order is too small to use points';
  String get cardCoveredHint => isAr ? 'طلبكِ مغطّى بالكامل — لا حاجة للدفع' : 'Your order is fully covered — nothing to pay';

  // ─── إنشاء الطلب والدفع ────────────────────────────────────────────────────
  String get orderCreatedTitle => isAr ? 'تم إنشاء طلبكِ' : 'Your order is placed';
  String get preparingSecurePayment => isAr ? 'نجهّز الدفع الآمن…' : 'Preparing secure payment…';
  String get openingOrderDetails => isAr ? 'لحظات ونعرض تفاصيله…' : 'Just a moment…';
  String orderTotalUpdated(String total) =>
      isAr ? 'الإجمالي النهائي لطلبكِ $total' : 'Your final order total is $total';
  String get orderTotalUpdatedHint => isAr
      ? 'تحدّثت الأسعار أو التوصيل لحظة التأكيد — هذا ما سيُحتسب.'
      : 'Prices or delivery changed at confirmation — this is what will be charged.';
  String payAmount(String total) => isAr ? 'ادفعي $total' : 'Pay $total';
  String outOfStockAdjust(String name) =>
      isAr ? 'نفدت كمية «$name» — عدّلي الكمية' : '“$name” is out of stock — adjust the quantity';

  // ─── طلب الهدية ────────────────────────────────────────────────────────────
  String get giftOrderTitle => isAr ? 'هذا الطلب هدية' : 'This order is a gift';
  String get giftOrderSubtitle =>
      isAr ? 'نغلّفه بعناية ونضيف بطاقة برسالتكِ' : 'We wrap it with care and add a card with your note';
  String get giftMessageLabel => isAr ? 'رسالة بطاقة الهدية (اختياري)' : 'Gift card message (optional)';
  String get giftMessageHint => isAr ? 'كل عام وأنتِ بخير يا أحلى صديقة 💕' : 'Happy birthday to my favourite person 💕';
  String get giftHidePricesTitle => isAr ? 'إخفاء الأسعار' : 'Hide prices';
  String get giftHidePricesHint => isAr
      ? 'لا نضع الفاتورة داخل الطرد — تصلكِ على التطبيق فقط'
      : "We won't put the invoice in the parcel — you'll see it in the app only";
}

/// ما تفعله الشاشة بعد فشل إنشاء الطلب.
enum CheckoutErrorKind {
  /// رسالة فقط.
  general,

  /// منتج نفد أو لم يعد متوفراً أو يحتاج لوناً: زر «السلة» وإعادة فحص السلة.
  cart,

  /// الكود رُفض: نزيله ليُعاد الحساب بدونه.
  coupon,

  /// العنوان المختار حُذف: نختار غيره.
  address,

  /// رصيد النقاط تغيّر: نطفئ النقاط ونحدّث الرصيد.
  loyalty,

  /// الاستلام من الفرع أُوقف: نعود للتوصيل.
  pickup,
}

/// رسالة فشل إنشاء الطلب بلغة الواجهة، مع نوعه لتقترح الشاشة طريق الإصلاح.
/// رسائل السيرفر بعضها إنجليزي تقني («Out of stock: X») وبعضها عربي جاهز.
({String message, CheckoutErrorKind kind}) orderErrorMessage(Object e, AppStrings s) {
  final raw = (e is ApiException ? e.message : e.toString()).trim();
  final lower = raw.toLowerCase();
  final friendly = friendlyError(e, lang: s.lang);

  final outOfStock = RegExp(r'^out of stock:\s*(.+)$', caseSensitive: false).firstMatch(raw) ??
      RegExp(r'^نفدت الكمية: (.+)$').firstMatch(raw);
  if (outOfStock != null) {
    return (message: s.outOfStockAdjust(outOfStock.group(1)!.trim()), kind: CheckoutErrorKind.cart);
  }
  if (lower.startsWith('shade required') ||
      lower == 'empty order' ||
      RegExp(r'^product\b.*\bnot found$').hasMatch(lower) ||
      raw.contains('احذفيه من السلة')) {
    return (message: friendly, kind: CheckoutErrorKind.cart);
  }
  if (lower.startsWith('invalid coupon') ||
      lower.contains('minimum order not met') ||
      lower.contains('first order only') ||
      raw.contains('الكوبون')) {
    var reason = friendly.endsWith('.') ? friendly.substring(0, friendly.length - 1) : friendly;
    // «Coupon removed — this coupon is…»: تكملة الجملة بحرف صغير.
    if (!s.isAr && reason.isNotEmpty) reason = reason[0].toLowerCase() + reason.substring(1);
    return (message: s.couponRemoved(reason), kind: CheckoutErrorKind.coupon);
  }
  if (raw.contains('عنوان التوصيل غير موجود')) return (message: friendly, kind: CheckoutErrorKind.address);
  if (raw.contains('رصيد نقاط الولاء')) return (message: friendly, kind: CheckoutErrorKind.loyalty);
  if (raw.contains('استلام من الفرع غير متاح')) return (message: friendly, kind: CheckoutErrorKind.pickup);
  return (message: friendly, kind: CheckoutErrorKind.general);
}
