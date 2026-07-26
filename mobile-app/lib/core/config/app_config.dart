/// إعدادات الاتصال بالخادم — نفس الدومين ومسارات الويب/الـ API.
class AppConfig {
  AppConfig._();

  /// الدومين الرسمي للمتجر (ويب + تطبيق).
  static const String appDomain = 'deemaalhayat.com';

  static const String appScheme = 'https';

  /// أصل الموقع: `https://deemaalhayat.com`
  static const String appOrigin = '$appScheme://$appDomain';

  /// مسارات الخادم — تُحافظ على نفس بنية الويب.
  static const String apiPath = '/api/v1';
  static const String mediaPath = '/media';
  static const String catalogHubPath = '/catalog-hub';

  static const String _defaultApiBaseUrl = '$appOrigin$apiPath';
  static const String _defaultMediaBaseUrl = '$appOrigin$mediaPath';

  /// عناوين قديمة تُعاد كتابتها إلى الدومين (من قاعدة البيانات أو الكاش).
  static const Set<String> legacyHosts = {
    '187.127.88.146',
    'localhost',
    '127.0.0.1',
    '10.0.2.2',
    appDomain,
    'www.$appDomain',
  };

  /// عنوان الـ API. للتطوير المحلي:
  /// `--dart-define=API_BASE_URL=http://127.0.0.1:3000/api/v1`
  static String get apiBaseUrl {
    const fromEnv = String.fromEnvironment('API_BASE_URL');
    return _trimTrailingSlash(fromEnv.isNotEmpty ? fromEnv : _defaultApiBaseUrl);
  }

  /// وسائط المنتجات والأقسام.
  /// `--dart-define=MEDIA_BASE_URL=https://deemaalhayat.com/media`
  static String get mediaBaseUrl {
    const fromEnv = String.fromEnvironment('MEDIA_BASE_URL');
    if (fromEnv.isNotEmpty) return _trimTrailingSlash(fromEnv);

    const originEnv = String.fromEnvironment('APP_ORIGIN');
    if (originEnv.isNotEmpty) {
      return _trimTrailingSlash('$originEnv$mediaPath');
    }

    if (_isLocalDevHost(apiBaseUrl)) {
      return _trimTrailingSlash(apiBaseUrl.replaceAll(RegExp(r'/api/v1/?$'), mediaPath));
    }

    return _defaultMediaBaseUrl;
  }

  /// أصل الويب (للروابط العامة ومشاركة المنتجات لاحقاً).
  static String get webOrigin {
    const fromEnv = String.fromEnvironment('APP_ORIGIN');
    if (fromEnv.isNotEmpty) return _trimTrailingSlash(fromEnv);
    if (_isLocalDevHost(apiBaseUrl)) {
      return _trimTrailingSlash(apiBaseUrl.replaceAll(RegExp(r'/api/v1/?$'), ''));
    }
    return appOrigin;
  }

  static String get catalogHubBaseUrl => '$webOrigin$catalogHubPath';

  /// رابط ويب لمسار داخل الموقع (نفس مسارات الويب المستقبلية).
  static String webUrl(String path) {
    final normalized = path.startsWith('/') ? path : '/$path';
    return '$webOrigin$normalized';
  }

  /// يحوّل روابط IP/localhost القديمة إلى الدومين مع الحفاظ على المسار.
  static String normalizeAppUrl(String url) {
    final trimmed = url.trim();
    if (trimmed.isEmpty) return trimmed;

    final uri = Uri.tryParse(trimmed);
    if (uri == null || !uri.hasScheme) return trimmed;

    if (!_shouldRewriteHost(uri.host)) return trimmed;

    final path = uri.path.isEmpty ? '/' : uri.path;
    final buffer = StringBuffer('$webOrigin$path');
    if (uri.hasQuery) buffer.write('?${uri.query}');
    if (uri.hasFragment) buffer.write('#${uri.fragment}');
    return buffer.toString();
  }

  static bool _shouldRewriteHost(String host) {
    final lower = host.toLowerCase();
    if (legacyHosts.contains(lower)) return true;
    return lower == appDomain || lower == 'www.$appDomain';
  }

  static bool _isLocalDevHost(String baseUrl) {
    return baseUrl.contains('127.0.0.1') ||
        baseUrl.contains('10.0.2.2') ||
        baseUrl.contains('localhost');
  }

  static String _trimTrailingSlash(String value) =>
      value.replaceAll(RegExp(r'/+$'), '');

  static const String storeNameAr = 'ديما الحياة';
  static const String storeNameEn = 'deema alhayat';
  static const String storeName = storeNameAr;

  static String displayStoreName(String lang) =>
      lang == 'ar' ? storeNameAr : storeNameEn;

  static const String currency = 'د.ع';

  /// صورة بديلة للمنتجات بدون صور (من السيرفر).
  static String get productPlaceholderUrl =>
      '$mediaBaseUrl/placeholder/product.webp';

  /// روابط قانونية — للمتاجر وداخل التطبيق.
  static String get privacyPolicyUrl => webUrl('/privacy');
  static String get termsOfServiceUrl => webUrl('/terms');
  static String get supportEmail => 'support@$appDomain';

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
  static const Duration productCacheTtl = Duration(minutes: 2);
  static const Duration listingCacheTtl = Duration(minutes: 1);
}
