import '../../core/l10n/app_strings.dart';

/// نصوص الطلبات — تسميات الحالات بالعربية والإنجليزية ورسائل الشاشات.
extension OrderStringsX on AppStrings {
  /// عناوين خطوات الخط الزمني.
  String orderStepTitle(String status) => switch (status) {
    'PENDING' => isAr ? 'تم استلام الطلب' : 'Order placed',
    'CONFIRMED' => isAr ? 'تم تأكيد الطلب' : 'Order confirmed',
    'PROCESSING' => isAr ? 'قيد التجهيز والتغليف' : 'Preparing & packing',
    'SHIPPED' => isAr ? 'في الطريق إليكِ' : 'On its way to you',
    'DELIVERED' => isAr ? 'تم التسليم' : 'Delivered',
    _ => status,
  };

  /// خطوة «الشحن» لطلب الاستلام من الفرع: لا مندوب، الطلب ينتظرها في الفرع.
  String get orderPickupReadyTitle => isAr ? 'جاهز للاستلام من الفرع' : 'Ready for pickup at the branch';
  String get orderPickupReadyHint =>
      isAr ? 'طلبكِ ينتظركِ في الفرع — تفضّلي باستلامه' : 'Your order is waiting for you at the branch';
  String get orderPickedUpTitle => isAr ? 'تم الاستلام' : 'Picked up';
  String get pickupContact => isAr ? 'بيانات الاستلام' : 'Pickup details';

  String orderStepHint(String status) => switch (status) {
    'PENDING' => isAr ? 'نراجع طلبكِ الآن' : 'We are reviewing your order',
    'CONFIRMED' => isAr ? 'تواصلنا معكِ وتم التأكيد' : 'Confirmed with you',
    'PROCESSING' => isAr ? 'نجهّز منتجاتكِ بعناية' : 'Carefully preparing your items',
    'SHIPPED' => isAr ? 'المندوب في الطريق' : 'The courier is on the way',
    'DELIVERED' => isAr ? 'نتمنى أن تستمتعي بمنتجاتكِ' : 'Enjoy your products',
    _ => '',
  };

  String get orderNumberCaption => isAr ? 'رقم الطلب' : 'Order number';
  String get orderTracking => isAr ? 'تتبّع الطلب' : 'Order tracking';
  String get currentStep => isAr ? 'الآن' : 'Now';
  String get noOrdersTitle => isAr ? 'لا توجد طلبات بعد' : 'No orders yet';
  String get noOrdersSubtitle =>
      isAr ? 'ستظهر طلباتكِ هنا بعد أول عملية شراء' : 'Your orders will appear here after your first purchase';
  String get startShopping => isAr ? 'ابدئي التسوّق' : 'Start shopping';
  String qtyTimesPrice(int qty, String price) => isAr ? '$qty × $price' : '$qty × $price';
  String get orderCancelledNote => isAr
      ? 'تم إلغاء هذا الطلب. يمكنكِ إعادة طلب المنتجات بضغطة واحدة.'
      : 'This order was cancelled. You can reorder the items in one tap.';
  String get orderRefundedNote => isAr
      ? 'تم استرجاع مبلغ هذا الطلب. يمكنكِ إعادة طلب المنتجات بضغطة واحدة.'
      : 'This order has been refunded. You can reorder the items in one tap.';
  String get addingToCart => isAr ? 'جارٍ إضافة المنتجات إلى السلة…' : 'Adding items to your cart…';
  String get reorderFailed =>
      isAr ? 'تعذّرت إضافة المنتجات. حاولي لاحقاً' : "Couldn't add the items. Please try again later";
  String reorderAdded(int n) =>
      isAr ? 'تمت إضافة ${arProducts(n)} إلى السلة' : 'Added ${enCount(n, 'item', 'items')} to your cart';

  /// نتيجة إعادة الطلب حين لم يتوفر كل شيء: «أُضيف 3 من 5 — 2 غير متوفرة حالياً».
  String reorderPartial(int added, int total, int skipped) => isAr
      ? 'أُضيف $added من $total — $skipped غير متوفرة حالياً'
      : 'Added $added of $total — $skipped currently unavailable';
  String get reorderNoneAvailable => isAr
      ? 'منتجات هذا الطلب غير متوفرة حالياً'
      : 'The items in this order are currently unavailable';
  String get orderCancelledToast =>
      isAr ? 'تم إلغاء الطلب وتحديث نقاط الولاء' : 'Order cancelled and loyalty points updated';
  String get orderCancelledRefundToast => isAr
      ? 'تم إلغاء الطلب — سيُعاد المبلغ إلى بطاقتكِ تلقائياً'
      : 'Order cancelled — the amount will be refunded to your card automatically';

  // ─── ورقة تأكيد الإلغاء ──────────────────────────────────────────────────
  String cancelOrderPointsBack(int points) => isAr
      ? 'ستُعاد ${arPoints(points)} لرصيدكِ'
      : '${enCount(points, 'point', 'points')} will go back to your balance';
  String cancelOrderCardRefund(String amount) => isAr
      ? 'سيُعاد $amount إلى بطاقتكِ تلقائياً'
      : '$amount will be refunded to your card automatically';
  String get cancelOrderYes => isAr ? 'نعم، ألغي الطلب' : 'Yes, cancel the order';
  String get cancellingOrder => isAr ? 'جارٍ إلغاء الطلب…' : 'Cancelling the order…';

  /// الحالة تغيّرت قبل الإلغاء (بدأ تجهيزه) — لا إلغاء من التطبيق.
  String get orderNoLongerCancellable => isAr
      ? 'بدأنا تجهيز طلبكِ فلم يعد إلغاؤه ممكناً — تواصلي معنا'
      : "We've started preparing your order, so it can no longer be cancelled — contact us";
  String get paymentMethodLabel => isAr ? 'طريقة الدفع' : 'Payment method';
  String get totalPaid => isAr ? 'الإجمالي' : 'Total';
  String get orderContactAbout => isAr ? 'تواصلي بخصوص الطلب' : 'Contact us about this order';
  String orderWhatsAppMessage(String number) =>
      isAr ? 'مرحباً، استفسار عن طلبي #$number' : 'Hi, I have a question about my order #$number';
  String get copyOrderNumber => isAr ? 'نسخ رقم الطلب' : 'Copy order number';

  // ─── طلب هدية ─────────────────────────────────────────────────────────────
  String get orderGiftTitle => isAr ? 'طلب هدية 🎁' : 'Gift order 🎁';
  String get orderGiftNoMessage => isAr ? 'بدون رسالة' : 'No message';
  String get orderGiftPricesHidden =>
      isAr ? 'الأسعار مخفية — بلا فاتورة داخل الطرد' : 'Prices hidden — no invoice in the parcel';

  // ─── ملخص الدفع ───────────────────────────────────────────────────────────
  String discountWithCode(String code) => isAr ? 'الخصم ($code)' : 'Discount ($code)';
  String get packageSavingsLabel => isAr ? 'توفير الباقات' : 'Bundle savings';

  // ─── تقييم بعد التسليم ────────────────────────────────────────────────────
  String get reviewPromptTitle => isAr ? 'وصلكِ الطلب — شنو رأيكِ؟' : 'Your order arrived — what do you think?';
  String get reviewPromptSubtitle =>
      isAr ? 'تقييمكِ يساعد غيركِ تختار بثقة' : 'Your review helps others choose with confidence';
  String get rateIt => isAr ? 'قيّميه' : 'Rate it';

  // ─── تصفية القائمة ────────────────────────────────────────────────────────
  String get ordersFilterAll => isAr ? 'الكل' : 'All';
  String get ordersFilteredEmpty => isAr ? 'لا طلبات بهذه الحالة' : 'No orders with this status';
  String get ordersFilteredEmptyHint =>
      isAr ? 'جرّبي حالة أخرى أو اعرضي كل طلباتكِ' : 'Try another status or show all your orders';
  String get ordersShowAll => isAr ? 'عرض الكل' : 'Show all';

  /// «ومنتج آخر» / «+ 2 more» تحت اسم أول منتج في البطاقة.
  String moreOrderItems(int n) => isAr
      ? switch (n) {
          1 => 'ومنتج آخر',
          2 => 'ومنتجان آخران',
          _ when n % 100 >= 3 && n % 100 <= 10 => 'و$n منتجات أخرى',
          _ => 'و$n منتجاً آخر',
        }
      : '+ $n more';
}
