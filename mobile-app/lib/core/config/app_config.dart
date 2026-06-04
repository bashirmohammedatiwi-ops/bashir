/// إعدادات الاتصال بـ NestJS على VPS — متوافقة مع [admin-desktop] و [backend].
class AppConfig {
  /// VPS الافتراضي (نفس لوحة التحكم).
  static const String vpsHost = '187.127.88.146';

  static const String defaultApiBaseUrl = 'http://$vpsHost/api/v1';
  static const String defaultMediaBaseUrl = 'http://$vpsHost/media';

  static const bool useRemoteApi = true;

  /// عنوان API: VPS افتراضياً. للتطوير المحلي:
  /// `--dart-define=API_BASE_URL=http://127.0.0.1:3000/api/v1`
  static String get apiBaseUrl {
    const fromEnv = String.fromEnvironment('API_BASE_URL');
    if (fromEnv.isNotEmpty) return fromEnv;
    return defaultApiBaseUrl;
  }

  static String get mediaBaseUrl {
    const fromEnv = String.fromEnvironment('MEDIA_BASE_URL');
    if (fromEnv.isNotEmpty) return fromEnv.replaceAll(RegExp(r'/$'), '');
    if (apiBaseUrl.contains('127.0.0.1') || apiBaseUrl.contains('10.0.2.2')) {
      return apiBaseUrl.replaceAll(RegExp(r'/api/v1/?$'), '');
    }
    return defaultMediaBaseUrl;
  }

  static bool get isVpsBackend =>
      apiBaseUrl.contains(vpsHost) && !apiBaseUrl.contains('127.0.0.1');

  static const Duration networkTimeout = Duration(seconds: 30);
}
