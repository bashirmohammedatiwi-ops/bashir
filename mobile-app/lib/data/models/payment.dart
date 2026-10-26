import '../../core/config/app_config.dart';
import '../../core/utils/json.dart';

/// إعدادات واجهة الدفع الأصلية (كي كارد) كما يرسلها السيرفر — بلا أي سر.
class QiSdkConfig {
  final String baseUrl;
  final String terminalId;
  final String publicKey;

  const QiSdkConfig({required this.baseUrl, required this.terminalId, required this.publicKey});

  bool get isValid => baseUrl.isNotEmpty && terminalId.isNotEmpty && publicKey.isNotEmpty;

  factory QiSdkConfig.fromJson(Map<String, dynamic> json) => QiSdkConfig(
        baseUrl: asString(json['baseUrl']),
        terminalId: asString(json['terminalId']),
        publicKey: asString(json['publicKey']),
      );
}

/// طرق الدفع المتاحة للزبونة الحالية.
class PaymentMethodsConfig {
  final bool cod;
  final bool cardEnabled;
  final bool sandbox;
  final QiSdkConfig? sdk;

  const PaymentMethodsConfig({
    this.cod = true,
    this.cardEnabled = false,
    this.sandbox = false,
    this.sdk,
  });

  static const fallback = PaymentMethodsConfig();

  factory PaymentMethodsConfig.fromJson(Map<String, dynamic> json) {
    final card = asMap(json['card']);
    final sdk = card['sdk'] is Map ? QiSdkConfig.fromJson(asMap(card['sdk'])) : null;
    return PaymentMethodsConfig(
      cod: json['cod'] != false,
      cardEnabled: AppConfig.cardPaymentEnabled && card['enabled'] == true && (sdk?.isValid ?? false),
      sandbox: card['sandbox'] == true,
      sdk: sdk,
    );
  }
}

/// محاولة دفع أنشأها السيرفر لدى البوابة.
class CardPaymentSession {
  final bool alreadyPaid;
  final String orderId;
  final String transactionId;
  final String paymentId;
  final String requestId;
  final int amount;
  final String currency;
  final String accountId;

  const CardPaymentSession({
    required this.alreadyPaid,
    required this.orderId,
    this.transactionId = '',
    this.paymentId = '',
    this.requestId = '',
    this.amount = 0,
    this.currency = 'IQD',
    this.accountId = '',
  });

  factory CardPaymentSession.fromJson(Map<String, dynamic> json) => CardPaymentSession(
        alreadyPaid: json['alreadyPaid'] == true,
        orderId: asString(json['orderId']),
        transactionId: asString(json['transactionId']),
        paymentId: asString(json['paymentId']),
        requestId: asString(json['requestId']),
        amount: asInt(json['amount']),
        currency: asString(json['currency'], 'IQD'),
        accountId: asString(json['accountId']),
      );
}

/// حالة الدفع كما يؤكدها السيرفر من البوابة.
class OrderPaymentState {
  final String orderId;
  final String paymentStatus;
  final String? attemptStatus;
  final bool attemptCanceled;
  final String? maskedPan;

  const OrderPaymentState({
    required this.orderId,
    required this.paymentStatus,
    this.attemptStatus,
    this.attemptCanceled = false,
    this.maskedPan,
  });

  bool get isPaid => paymentStatus == 'PAID';

  /// المحاولة الأخيرة انتهت بلا نجاح (رفض/فشل تحقق/انتهاء/إلغاء).
  bool get attemptFailed =>
      attemptCanceled ||
      const {'FAILED', 'AUTHENTICATION_FAILED', 'EXPIRED', 'DECLINED'}.contains(attemptStatus);

  factory OrderPaymentState.fromJson(Map<String, dynamic> json) {
    final last = asMap(json['lastAttempt']);
    return OrderPaymentState(
      orderId: asString(json['id']),
      paymentStatus: asString(json['paymentStatus'], 'PENDING'),
      attemptStatus: last['status']?.toString(),
      attemptCanceled: last['canceled'] == true,
      maskedPan: last['maskedPan']?.toString(),
    );
  }
}
