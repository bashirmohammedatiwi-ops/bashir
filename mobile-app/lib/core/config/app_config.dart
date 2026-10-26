/// إعدادات الاتصال بالخادم — نفس الدومين ومسارات الويب/الـ API.
class AppConfig {
  AppConfig._();

  /// الدومين الرسمي للمتجر (ويب + تطبيق).
  static const String appDomain = 'deemaalhayat.com';

  /// إشعارات Push على شاشة الهاتف عبر FCM + APNs.
  /// قائمة الإشعارات داخل التطبيق تعمل حتى لو فشل Firebase.
  static const bool pushNotificationsEnabled = true;

  /// الوضع الليلي: الألوان الليلية والثيم جاهزان، لكن الاختيار (نظام/فاتح/ليلي)
  /// في شاشة اللغة والمظهر يبقى مخفياً، والتطبيق فاتح دائماً، حتى تُنقل كل شاشات
  /// مسار الشراء (الرئيسية، القوائم، المنتج، السلة، الدفع، الحساب) إلى ألوان العالم.
  static const bool darkModeEnabled = false;

  /// «ديما» المستشارة الشخصية: مؤجّلة لتحديث قادم — كل نقاط دخولها مخفية (الزر العائم،
  /// بطاقة المنتج، اقتراح البحث، المساعدة، اختبار البشرة، المسار /advisor وروابطه).
  /// ملفاتها في features/advisor باقية كما هي؛ إعادتها = true هنا.
  static const bool advisorEnabled = false;

  /// «ديما» ظاهرة بهذه اللغة؟ (مفعّلة، وبالعربية فقط).
  static bool advisorFor(String lang) => advisorEnabled && lang == 'ar';

  /// الدفع بالبطاقة (كي كارد) داخل التطبيق: مؤجّل حتى تصل بيانات الدفع الفعلية من كي كارد.
  /// false = خيار البطاقة «قريباً» مهما أرسل السيرفر (البوابة تعمل على السيرفر والويب فقط).
  static const bool cardPaymentEnabled = false;

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

    if (!_shouldRewriteHost(uri.host)) {
      if (uri.scheme == 'http') {
        return uri.replace(scheme: 'https').toString();
      }
      return trimmed;
    }

    final path = uri.path.isEmpty ? '/' : uri.path;
    final normalizedPath = path.replaceAll('/media/media/', '/media/');
    final buffer = StringBuffer('$appOrigin$normalizedPath');
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
  static const String storeNameEn = 'Deema Alhayat';
  static const String storeName = storeNameAr;

  static String displayStoreName(String lang) =>
      lang == 'ar' ? storeNameAr : storeNameEn;

  static const String currency = 'د.ع';

  /// Bundle ID / Application ID — iOS و Android.
  static const String appBundleId = 'com.deemaalhayat.app';

  /// رابط مشاركة منتج على الموقع — نفس مسار المتجر الإلكتروني (productHref)،
  /// بلا صيغة `?slug=` القديمة التي تكلّف إعادة توجيه.
  static String productShareUrl(String slug) =>
      webUrl('/product/${Uri.encodeComponent(slug)}');

  /// رابط مشاركة باقة/روتين — نفس مسار المتجر الإلكتروني (packageHref).
  static String packageShareUrl(String slug) =>
      webUrl('/package/${Uri.encodeComponent(slug)}');

  /// صورة بديلة للمنتجات بدون صور: فارغة عمداً — الويدجت تعرض البديل المضمَّن في
  /// التطبيق (يعمل بلا إنترنت، بلا تنزيل ولا مكان في الكاش).
  static String get productPlaceholderUrl => '';

  /// روابط قانونية — للمتاجر وداخل التطبيق.
  static String privacyPolicyUrlFor(String lang) =>
      webUrl(lang == 'en' ? '/en/privacy/' : '/privacy/');

  static String termsOfServiceUrlFor(String lang) =>
      webUrl(lang == 'en' ? '/en/terms/' : '/terms/');

  static String get privacyPolicyUrl => privacyPolicyUrlFor('ar');

  static String get termsOfServiceUrl => termsOfServiceUrlFor('ar');
  static String get supportEmail => 'support@$appDomain';

  /// مهلة الاتصال الأولى — أقصر لعدم انتظار الشبكة البطيئة.
  static const Duration connectTimeout = Duration(seconds: 12);
  static const Duration receiveTimeout = Duration(seconds: 25);
  static const Duration sendTimeout = Duration(seconds: 20);
  static const Duration networkTimeout = receiveTimeout;

  static const int pageSize = 20;

  /// مدة كاش البيانات العامة — قصيرة ليتوافق التطبيق مع لوحة التحكم بسرعة.
  static const Duration homeCacheTtl = Duration(seconds: 90);
  static const Duration catalogCacheTtl = Duration(minutes: 5);
  static const Duration productCacheTtl = Duration(seconds: 45);
  static const Duration listingCacheTtl = Duration(seconds: 45);
}
