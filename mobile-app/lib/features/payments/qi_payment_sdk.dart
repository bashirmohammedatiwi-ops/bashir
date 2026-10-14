import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';

import '../../data/models/payment.dart';

enum QiSdkStatus { success, cancelled, error }

class QiSdkOutcome {
  final QiSdkStatus status;
  final String? message;
  const QiSdkOutcome(this.status, [this.message]);
}

/// غلاف قناة واجهة الدفع الأصلية من كي كارد (Android و iOS).
///
/// النتيجة هنا للعرض فقط — التأكيد الحقيقي يأتي دائماً من السيرفر.
class QiPaymentSdk {
  QiPaymentSdk._();

  static const _channel = MethodChannel('deema/qi_payment');

  static bool get isSupported =>
      !kIsWeb &&
      (defaultTargetPlatform == TargetPlatform.android || defaultTargetPlatform == TargetPlatform.iOS);

  static Future<void> initialize(QiSdkConfig config, {required bool arabic}) async {
    await _channel.invokeMethod<bool>('initialize', {
      'baseUrl': config.baseUrl,
      'terminalId': config.terminalId,
      'publicKey': config.publicKey,
      'language': arabic ? 'ar' : 'en',
      'merchantName': arabic ? 'ديما الحياة' : 'Deema Alhayat',
    });
  }

  static Future<QiSdkOutcome> pay(CardPaymentSession session, {String? holderName}) async {
    try {
      final res = await _channel.invokeMapMethod<String, dynamic>('pay', {
        'paymentId': session.paymentId,
        'requestId': session.requestId,
        'accountId': session.accountId,
        'amount': session.amount,
        'currency': session.currency,
        'holderName': holderName ?? '',
      });
      switch (res?['status']) {
        case 'success':
          return const QiSdkOutcome(QiSdkStatus.success);
        case 'cancelled':
          return const QiSdkOutcome(QiSdkStatus.cancelled);
        default:
          return QiSdkOutcome(QiSdkStatus.error, res?['message']?.toString());
      }
    } on PlatformException catch (e) {
      return QiSdkOutcome(QiSdkStatus.error, e.message);
    } on MissingPluginException {
      return const QiSdkOutcome(QiSdkStatus.error, 'unsupported');
    }
  }
}
