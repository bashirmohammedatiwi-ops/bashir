import '../../core/l10n/app_strings.dart';

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
  String get placingOrder => isAr ? 'جارٍ تأكيد الطلب…' : 'Placing order…';
}
