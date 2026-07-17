/// إعدادات الاتصال بالخادم (NestJS على VPS) — نفس خادم لوحة التحكم.
class AppConfig {
  AppConfig._();

  static const String vpsHost = '187.127.88.146';

  static const String _defaultApiBaseUrl = 'http://$vpsHost/api/v1';
  static const String _defaultMediaBaseUrl = 'http://$vpsHost/media';

  /// عنوان الـ API. للتطوير المحلي مرّر:
  /// `--dart-define=API_BASE_URL=http://127.0.0.1:3000/api/v1`
  static String get apiBaseUrl {
    const fromEnv = String.fromEnvironment('API_BASE_URL');
    return fromEnv.isNotEmpty ? fromEnv : _defaultApiBaseUrl;
  }

  static String get mediaBaseUrl {
    const fromEnv = String.fromEnvironment('MEDIA_BASE_URL');
    if (fromEnv.isNotEmpty) return fromEnv.replaceAll(RegExp(r'/$'), '');
    if (apiBaseUrl.contains('127.0.0.1') || apiBaseUrl.contains('10.0.2.2')) {
      return apiBaseUrl.replaceAll(RegExp(r'/api/v1/?$'), '/media');
    }
    return _defaultMediaBaseUrl;
  }

  static const String storeName = 'الحياة';
  static const String currency = 'د.ع';

  /// صورة بديلة للمنتجات بدون صور (من السيرفر).
  static String get productPlaceholderUrl =>
      '$mediaBaseUrl/placeholder/product.webp';

  /// مهلة الاتصال الأولى — أقصر لعدم انتظار الشبكة البطيئة.
  static const Duration connectTimeout = Duration(seconds: 12);
  static const Duration receiveTimeout = Duration(seconds: 25);
  static const Duration sendTimeout = Duration(seconds: 20);
  static const Duration networkTimeout = receiveTimeout;

  static const int pageSize = 20;

  /// مدة كاش البيانات العامة.
  static const Duration homeCacheTtl = Duration(minutes: 5);
  /// أقسام الكتالوج تتغيّر أحياناً — كاش قصير + مفتاح إصدار في الـ API.
  static const Duration catalogCacheTtl = Duration(minutes: 10);
  static const Duration productCacheTtl = Duration(minutes: 5);
  static const Duration listingCacheTtl = Duration(minutes: 2);
}
