import '../../core/l10n/app_strings.dart';

/// نصوص الدفع الإلكتروني (كي كارد).
extension PaymentStringsX on AppStrings {
  String get cardPaymentTitle => isAr ? 'الدفع بالبطاقة' : 'Pay by card';
  String get cardPaymentSubtitle => isAr
      ? 'كي كارد، ماستركارد وفيزا — دفع آمن بتحقق 3D Secure'
      : 'Qi Card, Mastercard & Visa — secured with 3D Secure';
  String get sandboxBadge => isAr ? 'تجريبي' : 'Test';
  String get securePayment => isAr ? 'دفع آمن' : 'Secure payment';

  String get preparingPayment => isAr ? 'نجهّز صفحة الدفع الآمنة…' : 'Preparing secure payment…';
  String get preparingPaymentHint => isAr
      ? 'بيانات بطاقتك تُدخل مباشرة في بوابة كي كارد ولا تمر علينا'
      : 'Your card details go straight to the Qi Card gateway — never through us';
  String get verifyingPayment => isAr ? 'نتأكد من دفعتك…' : 'Confirming your payment…';
  String get verifyingPaymentHint =>
      isAr ? 'لحظات ونؤكد لكِ النتيجة من البوابة' : 'Just a moment while we confirm with the gateway';

  String get paymentSucceeded => isAr ? 'تم الدفع بنجاح' : 'Payment successful';
  String get paymentNotCompleted => isAr ? 'لم يكتمل الدفع' : 'Payment not completed';
  String get paymentCancelled => isAr ? 'أُلغي الدفع — لم يُخصم أي مبلغ' : 'Payment cancelled — nothing was charged';
  String get paymentFailedHint => isAr
      ? 'لم يُخصم أي مبلغ. يمكنك المحاولة مرة أخرى أو استخدام بطاقة أخرى.'
      : 'Nothing was charged. You can try again or use another card.';
  String get paymentPendingHint => isAr
      ? 'ما زلنا ننتظر تأكيد البوابة — سنبلغك فور اعتماد الدفعة.'
      : "We're still waiting for the gateway — we'll notify you once it's confirmed.";
  String get paymentUnavailable =>
      isAr ? 'الدفع الإلكتروني غير متاح على هذا الجهاز حالياً' : 'Card payment is not available on this device yet';

  String get completePaymentTitle => isAr ? 'أكملي الدفع لتأكيد طلبك' : 'Complete payment to confirm your order';
  String get completePaymentHint => isAr
      ? 'طلبك محجوز لكِ — يُلغى تلقائياً إن لم يكتمل الدفع خلال 45 دقيقة.'
      : 'Your order is reserved — it is cancelled automatically if unpaid within 45 minutes.';
  String get payNow => isAr ? 'ادفعي الآن' : 'Pay now';
  String get tryAgain => isAr ? 'إعادة المحاولة' : 'Try again';
  String get payLater => isAr ? 'لاحقاً' : 'Later';
  String get gotIt => isAr ? 'حسناً' : 'Got it';
  String get paidByCard => isAr ? 'مدفوع بالبطاقة' : 'Paid by card';
  String get awaitingPayment => isAr ? 'بانتظار الدفع' : 'Awaiting payment';
  String get paymentRefunded => isAr ? 'تم استرجاع المبلغ' : 'Refunded';
  String get paymentFailedShort => isAr ? 'لم يكتمل الدفع' : 'Payment failed';
  String get nextPaidByCard =>
      isAr ? 'دفعتكِ الإلكترونية مؤكدة — لا حاجة للدفع عند الاستلام' : 'Your card payment is confirmed — nothing to pay on delivery';
  String get orderPaidSuccess => isAr ? 'تم الدفع وتأكيد طلبكِ!' : 'Paid & confirmed!';
}
