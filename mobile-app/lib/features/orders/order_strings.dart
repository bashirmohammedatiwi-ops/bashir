import '../../core/l10n/app_strings.dart';

/// نصوص الطلبات — تسميات الحالات بالعربية والإنجليزية ورسائل الشاشات.
extension OrderStringsX on AppStrings {
  String orderStatus(String status) => switch (status) {
    'PENDING' => isAr ? 'قيد المراجعة' : 'Under review',
    'CONFIRMED' => isAr ? 'مؤكد' : 'Confirmed',
    'PROCESSING' => isAr ? 'قيد التجهيز' : 'Preparing',
    'SHIPPED' => isAr ? 'تم الشحن' : 'Shipped',
    'DELIVERED' => isAr ? 'تم التسليم' : 'Delivered',
    'CANCELLED' => isAr ? 'ملغي' : 'Cancelled',
    'RETURNED' => isAr ? 'مُرجع' : 'Returned',
    _ => status,
  };

  /// عناوين خطوات الخط الزمني.
  String orderStepTitle(String status) => switch (status) {
    'PENDING' => isAr ? 'تم استلام الطلب' : 'Order placed',
    'CONFIRMED' => isAr ? 'تم تأكيد الطلب' : 'Order confirmed',
    'PROCESSING' => isAr ? 'قيد التجهيز والتغليف' : 'Preparing & packing',
    'SHIPPED' => isAr ? 'في الطريق إليكِ' : 'On its way to you',
    'DELIVERED' => isAr ? 'تم التسليم' : 'Delivered',
    _ => status,
  };

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
  String get orderReturnedNote => isAr ? 'تم إرجاع هذا الطلب.' : 'This order was returned.';
  String get addingToCart => isAr ? 'جارٍ إضافة المنتجات إلى السلة…' : 'Adding items to your cart…';
  String get reorderFailed =>
      isAr ? 'تعذّرت إضافة المنتجات. حاولي لاحقاً' : "Couldn't add the items. Please try again later";
  String reorderAdded(int n) => isAr ? 'تمت إضافة $n منتج إلى السلة' : 'Added $n items to your cart';
  String get orderCancelledToast =>
      isAr ? 'تم إلغاء الطلب وتحديث نقاط الولاء' : 'Order cancelled and loyalty points updated';
  String get paymentMethodLabel => isAr ? 'طريقة الدفع' : 'Payment method';
  String get totalPaid => isAr ? 'الإجمالي' : 'Total';
}
