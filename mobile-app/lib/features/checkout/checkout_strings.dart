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
  String get checkoutOffline =>
      isAr ? 'لا يوجد اتصال — اتصلي بالإنترنت لإتمام الطلب' : "You're offline — connect to place your order";
  String get checkoutUnavailableItems =>
      isAr ? 'في سلتكِ منتج لم يعد متوفراً — أزيليه من السلة أولاً' : 'An item in your bag is no longer available — remove it first';
  String get pickupReadyNotice =>
      isAr ? 'استلام من الفرع — نبلغكِ حين يجهز طلبكِ' : "Branch pickup — we'll let you know when it's ready";
  String pointsAddedToBalance(int n) =>
      isAr ? 'أُضيفت ${arPoints(n)} لرصيدكِ ✨' : '${enCount(n, 'point', 'points')} added to your balance ✨';
  String giftWrapNotice({required bool withMessage}) => isAr
      ? 'نغلّفه كهدية${withMessage ? ' مع رسالتكِ' : ''} 🎁'
      : 'Gift-wrapped${withMessage ? ' with your message' : ''} 🎁';
}
